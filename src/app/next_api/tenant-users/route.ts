import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Helper: obter usuário atual e suas permissões via user_id do header/body
async function getCurrentUserPermissions(user_id?: string) {
  if (!user_id) {
    return null;
  }

  try {
    console.log('[getCurrentUserPermissions] Buscando membership para user_id:', user_id);
    // Buscar membership do usuário
    const { data: membership, error } = await supabaseAdmin
      .from('user_memberships')
      .select('tenant_id, role, branch_id')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('[getCurrentUserPermissions] Erro ao buscar membership:', error);
      return null;
    }

    if (!membership) {
      console.log('[getCurrentUserPermissions] Membership não encontrado para user_id:', user_id);
      return null;
    }

    console.log('[getCurrentUserPermissions] Membership encontrado:', membership);

    // Se tem branch_id, é admin de filial; senão, é admin matriz/owner
    const isBranchAdmin = !!membership.branch_id;
    const isOwnerOrAdmin = membership.role === 'owner' || membership.role === 'admin';

    const result = {
      user_id,
      tenant_id: membership.tenant_id,
      role: membership.role,
      branch_id: membership.branch_id || null,
      isBranchAdmin,
      isOwnerOrAdmin,
    };

    console.log('[getCurrentUserPermissions] Resultado:', result);
    return result;
  } catch (error) {
    console.error('[getCurrentUserPermissions] Erro ao obter permissões:', error);
    return null;
  }
}

// GET - listar usuários do tenant
export async function GET(request: NextRequest) {
  // Desabilitar cache
  const headers = new Headers();
  headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
  headers.set('Pragma', 'no-cache');
  headers.set('Expires', '0');
  try {
    const { searchParams } = new URL(request.url);
    const tenant_id = searchParams.get('tenant_id');
    const user_id = searchParams.get('user_id'); // ID do usuário que está fazendo a requisição

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400 });
    }

    // Validar permissões se user_id fornecido
    if (user_id) {
      const perms = await getCurrentUserPermissions(user_id);
      if (!perms || perms.tenant_id !== tenant_id || !perms.isOwnerOrAdmin) {
        return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
      }
    }

    // Buscar usuários do tenant (sem join para evitar erro de relacionamento)
    const { data: memberships, error: memError } = await supabaseAdmin
      .from('user_memberships')
      .select('*')
      .eq('tenant_id', tenant_id)
      .eq('is_active', true);

    if (memError) {
      return NextResponse.json({ success: false, error: memError.message }, { status: 400 });
    }

    // Buscar dados dos usuários
    const userIds = memberships?.map((m: any) => m.user_id) || [];
    const users: any[] = [];

    for (const userId of userIds) {
      try {
        const { data: authUser } = await supabaseAdmin.auth.admin.getUserById(userId);
        if (authUser?.user) {
          const membership = memberships?.find((m: any) => m.user_id === userId);
          
          // Buscar branch_memberships separadamente
          const { data: branchMemberships } = await supabaseAdmin
            .from('user_branch_memberships')
            .select('branch_id, branches(name)')
            .eq('user_id', userId)
            .eq('tenant_id', tenant_id)
            .eq('is_active', true);
          
          // Buscar role_type de user_profiles para diferenciar Admin de Operador
          let { data: profile } = await supabaseAdmin
            .from('user_profiles')
            .select('role_type, name')
            .eq('user_id', userId)
            .maybeSingle();
          
          // Se não tem profile, criar automaticamente
          // IMPORTANTE: Por padrão, criar como 'vendedor' (operador) se não for owner
          // O admin pode depois mudar para 'admin' se necessário
          if (!profile && membership) {
            const autoProfileRoleType = membership.role === 'owner' ? 'admin' : 'vendedor'; // Padrão: operador
            const autoProfileName = authUser.user.user_metadata?.name || 
                                   authUser.user.user_metadata?.full_name ||
                                   authUser.user.email?.split('@')[0] || 
                                   'Usuário';
            
            try {
              const { data: newProfile, error: createError } = await supabaseAdmin
                .from('user_profiles')
                .insert({
                  user_id: userId,
                  name: autoProfileName,
                  role_type: autoProfileRoleType,
                  is_active: true,
                })
                .select('role_type, name')
                .single();
              
              if (!createError && newProfile) {
                profile = newProfile;
                console.log(`[tenant-users GET] ✅ Profile criado automaticamente para ${authUser.user.email}:`, {
                  role_type: autoProfileRoleType,
                  membership_role: membership.role
                });
              } else {
                console.warn(`[tenant-users GET] ⚠️ Erro ao criar profile automaticamente:`, createError);
              }
            } catch (createError) {
              console.warn(`[tenant-users GET] ⚠️ Exceção ao criar profile:`, createError);
            }
          }
          
          // Se tem profile mas role_type é 'admin' e membership.role não é 'owner',
          // pode ser um usuário que foi criado incorretamente como admin
          // Por enquanto, vamos confiar no profile, mas logar para debug
          if (profile && profile.role_type === 'admin' && membership?.role !== 'owner') {
            console.log(`[tenant-users GET] ⚠️ Usuário ${authUser.user.email} tem role_type='admin' mas não é owner. Verifique se deveria ser operador.`);
          }
          
          // Mapear role_type para role do frontend:
          // 'admin' → 'admin'
          // 'vendedor' → 'member' (Operador)
          // 'owner' em user_memberships → 'owner'
          let displayRole = 'member'; // Padrão: Operador
          
          if (membership?.role === 'owner') {
            displayRole = 'owner';
          } else if (profile?.role_type === 'admin') {
            displayRole = 'admin';
          } else if (profile?.role_type === 'vendedor') {
            displayRole = 'member'; // Operador
          } else {
            // Se não tem profile ou tem outro role_type, assumir operador
            // (exceto owners que sempre são owners)
            displayRole = membership?.role === 'owner' ? 'owner' : 'member';
          }
          
          console.log(`[tenant-users GET] Usuário ${authUser.user.email}:`, {
            membership_role: membership?.role,
            profile_role_type: profile?.role_type,
            display_role: displayRole,
            name: profile?.name || authUser.user.user_metadata?.name,
            tem_profile: !!profile,
            mapeamento: profile?.role_type === 'vendedor' ? 'vendedor → member (Operador)' : 
                       profile?.role_type === 'admin' ? 'admin → admin' : 
                       'sem profile → member (Operador)'
          });
          
          users.push({
            id: authUser.user.id,
            email: authUser.user.email,
            name: profile?.name || authUser.user.user_metadata?.name || null,
            created_at: authUser.user.created_at,
            role: displayRole, // Usar role_type do profile, não do membership
            branch_id: membership?.branch_id || null,
            branches: (branchMemberships || []).map((bm: any) => ({
              branch_id: bm.branch_id,
              branch_name: bm.branches?.name || null,
            })),
          });
        }
      } catch (err) {
        console.warn('Erro ao buscar usuário:', userId, err);
      }
    }

    const response = NextResponse.json({ success: true, data: users });
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    return response;
  } catch (error: any) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// POST - criar usuário do tenant
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, password, name, role, branch_ids, user_id } = body; // user_id do criador

    if (!email || !password || !name || !role) {
      return NextResponse.json(
        { success: false, error: 'Email, senha, nome e perfil são obrigatórios' },
        { status: 400 },
      );
    }

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'user_id do criador é obrigatório' }, { status: 400 });
    }

    const perms = await getCurrentUserPermissions(user_id);
    if (!perms || !perms.isOwnerOrAdmin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    // Validação de permissões:
    // - Admin de filial não pode criar admin
    // - Admin de filial só pode vincular à filial dele
    if (perms.isBranchAdmin) {
      if (role === 'admin' || role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Admin de filial não pode criar outros admins' },
          { status: 403 },
        );
      }
      if (!branch_ids || branch_ids.length !== 1 || branch_ids[0] !== perms.branch_id) {
        return NextResponse.json(
          { success: false, error: 'Admin de filial só pode vincular usuários à própria filial' },
          { status: 403 },
        );
      }
    }

    // Criar usuário no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        name,
      },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: 'Erro ao criar usuário: ' + (authError?.message || 'Erro desconhecido') },
        { status: 400 },
      );
    }

    // Criar membership (tenant)
    // IMPORTANTE: A constraint user_memberships_role_check só aceita 'owner' ou 'admin'
    // Operadores ('member' do frontend) também devem ser inseridos como 'admin' em user_memberships
    // A distinção entre admin e operador é feita em outras tabelas (user_branch_memberships, user_profiles)
    let finalRole = 'admin'; // padrão: todos os usuários são 'admin' em user_memberships
    if (role === 'owner') {
      finalRole = 'owner'; // apenas owners têm role 'owner'
    } else {
      finalRole = 'admin'; // admins e operadores são 'admin' em user_memberships
    }
    
    const membershipData: any = {
      user_id: authData.user.id,
      tenant_id: perms.tenant_id,
      role: finalRole,
      is_active: true,
    };

    // Se admin de filial criou, vincular à filial dele
    if (perms.isBranchAdmin && perms.branch_id) {
      membershipData.branch_id = perms.branch_id;
    } 
    // Se admin matriz criou um admin para uma filial específica, vincular àquela filial
    else if (!perms.isBranchAdmin && role === 'admin' && branch_ids && Array.isArray(branch_ids) && branch_ids.length === 1) {
      // Admin matriz criando admin de filial - vincular branch_id no user_memberships
      membershipData.branch_id = branch_ids[0];
      console.log('[tenant-users] Admin matriz criando admin de filial, branch_id:', branch_ids[0]);
    }

    const { error: memError } = await supabaseAdmin
      .from('user_memberships')
      .insert(membershipData);

    if (memError) {
      // Rollback: deletar usuário criado
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      return NextResponse.json(
        { success: false, error: 'Erro ao vincular usuário ao tenant: ' + memError.message },
        { status: 400 },
      );
    }

    // Criar user_branch_memberships (se branch_ids fornecidos)
    if (branch_ids && Array.isArray(branch_ids) && branch_ids.length > 0) {
      // Admin matriz pode vincular a qualquer filial
      // Admin filial já validado acima (só pode vincular à própria)
      const branchMemberships = branch_ids.map((branch_id: number) => ({
        user_id: authData.user.id,
        branch_id,
        tenant_id: perms.tenant_id,
        role: 'operator', // padrão: operador
      }));

      const { error: branchMemError } = await supabaseAdmin
        .from('user_branch_memberships')
        .insert(branchMemberships);

      if (branchMemError) {
        console.warn('Erro ao vincular filiais (não crítico):', branchMemError);
        // Não fazer rollback aqui, pois o usuário já foi criado
      }
    }

    // Criar user_profile (se necessário)
    // IMPORTANTE: Mapear 'member' (Operador) para 'vendedor' em user_profiles.role_type
    // Os valores válidos são: 'admin', 'vendedor', 'financeiro', 'entregador'
    const profileRoleType = role === 'member' ? 'vendedor' : role === 'admin' ? 'admin' : 'vendedor';
    
    console.log(`[tenant-users POST] Criando perfil:`, {
      user_id: authData.user.id,
      email: authData.user.email,
      role_recebido: role,
      role_type_mapeado: profileRoleType,
      name
    });
    
    try {
      const { data: insertedProfile, error: profileError } = await supabaseAdmin
        .from('user_profiles')
        .insert({
          id: authData.user.id,
          user_id: authData.user.id,
          name,
          role_type: profileRoleType, // 'admin' ou 'vendedor' (Operador)
          is_active: true,
        })
        .select()
        .single();
      
      if (profileError) {
        console.error('[tenant-users POST] Erro ao criar perfil:', profileError);
        // Não fazer rollback aqui, pois o usuário já foi criado
      } else {
        console.log(`[tenant-users POST] ✅ Perfil criado com sucesso:`, {
          id: insertedProfile?.id,
          role_type: insertedProfile?.role_type,
          name: insertedProfile?.name
        });
      }
    } catch (profileError) {
      console.error('[tenant-users POST] Erro ao criar perfil (exceção):', profileError);
    }

    // Criar permissões padrão para o novo usuário
    try {
      const { createDefaultPermissions } = await import('@/lib/permissions');
      await createDefaultPermissions(authData.user.id, perms.tenant_id, profileRoleType);
      console.log(`[tenant-users POST] Permissões padrão criadas para ${profileRoleType}`);
    } catch (permError) {
      console.warn('[tenant-users POST] Erro ao criar permissões padrão (não crítico):', permError);
      // Não falhar a criação do usuário por isso
    }

    return NextResponse.json({
      success: true,
      data: {
        id: authData.user.id,
        email: authData.user.email,
        name,
        role,
      },
    });
  } catch (error: any) {
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// PUT - atualizar usuário (perfil/filiais)
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, role, branch_ids, is_active, current_user_id } = body; // current_user_id = quem está editando

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'user_id é obrigatório' }, { status: 400 });
    }

    if (!current_user_id) {
      return NextResponse.json({ success: false, error: 'current_user_id é obrigatório' }, { status: 400 });
    }

    const perms = await getCurrentUserPermissions(current_user_id);
    if (!perms || !perms.isOwnerOrAdmin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar membership do usuário a ser editado
    const { data: targetMembership } = await supabaseAdmin
      .from('user_memberships')
      .select('tenant_id, branch_id, role')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!targetMembership || targetMembership.tenant_id !== perms.tenant_id) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Validações de permissão
    if (perms.isBranchAdmin) {
      // Admin filial só pode editar usuários da própria filial
      if (targetMembership.branch_id !== perms.branch_id) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado a editar este usuário' },
          { status: 403 },
        );
      }
      // Não pode tornar admin
      if (role === 'admin' || role === 'owner') {
        return NextResponse.json(
          { success: false, error: 'Admin de filial não pode criar outros admins' },
          { status: 403 },
        );
      }
    }

    // Atualizar membership
    const updates: any = {};
    if (role !== undefined) {
      // A constraint só aceita 'owner' ou 'admin'
      // Operadores ('member') também são 'admin' em user_memberships
      updates.role = role === 'owner' ? 'owner' : 'admin';
      
      // Se está tornando admin e tem branch_ids (admin matriz criando admin de filial)
      if (role === 'admin' && branch_ids && Array.isArray(branch_ids) && branch_ids.length === 1 && !perms.isBranchAdmin) {
        updates.branch_id = branch_ids[0];
        console.log('[tenant-users PUT] Tornando usuário admin de filial, branch_id:', branch_ids[0]);
      }
      // Se está removendo admin ou não tem branch_ids, remover branch_id
      else if (role !== 'admin' || !branch_ids || branch_ids.length === 0) {
        updates.branch_id = null;
      }
    }
    if (is_active !== undefined) {
      updates.is_active = is_active;
    }
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabaseAdmin
        .from('user_memberships')
        .update(updates)
        .eq('user_id', user_id)
        .eq('tenant_id', perms.tenant_id);

      if (updateError) {
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar: ' + updateError.message },
          { status: 400 },
        );
      }
    }

    // Atualizar filiais (se fornecido)
    if (branch_ids !== undefined) {
      // Remover vínculos antigos
      await supabaseAdmin
        .from('user_branch_memberships')
        .delete()
        .eq('user_id', user_id)
        .eq('tenant_id', perms.tenant_id);

      // Criar novos vínculos
      if (Array.isArray(branch_ids) && branch_ids.length > 0) {
        const branchMemberships = branch_ids.map((branch_id: number) => ({
          user_id,
          branch_id,
          tenant_id: perms.tenant_id,
          role: 'operator', // padrão: operador
        }));

        await supabaseAdmin.from('user_branch_memberships').insert(branchMemberships);
      }
    }

    // Atualizar user_profiles.role_type se role foi alterado
    if (role !== undefined) {
      const profileRoleType = role === 'member' ? 'vendedor' : role === 'admin' ? 'admin' : 'vendedor';
      try {
        const { error: profileUpdateError } = await supabaseAdmin
          .from('user_profiles')
          .update({ role_type: profileRoleType })
          .eq('user_id', user_id);
        
        if (profileUpdateError) {
          console.warn('[tenant-users PUT] Erro ao atualizar role_type no perfil:', profileUpdateError);
          // Não falhar a requisição por isso, pois o membership já foi atualizado
        } else {
          console.log(`[tenant-users PUT] Perfil atualizado com role_type: ${profileRoleType} (role original: ${role})`);
        }
      } catch (profileError) {
        console.warn('[tenant-users PUT] Erro ao atualizar perfil:', profileError);
      }
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

// DELETE - excluir usuário completamente
export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, current_user_id } = body;

    if (!user_id) {
      return NextResponse.json({ success: false, error: 'user_id é obrigatório' }, { status: 400 });
    }

    if (!current_user_id) {
      return NextResponse.json({ success: false, error: 'current_user_id é obrigatório' }, { status: 400 });
    }

    const perms = await getCurrentUserPermissions(current_user_id);
    if (!perms || !perms.isOwnerOrAdmin) {
      return NextResponse.json({ success: false, error: 'Não autorizado' }, { status: 403 });
    }

    // Buscar membership do usuário a ser excluído
    const { data: targetMembership } = await supabaseAdmin
      .from('user_memberships')
      .select('tenant_id, branch_id, role')
      .eq('user_id', user_id)
      .eq('is_active', true)
      .maybeSingle();

    if (!targetMembership || targetMembership.tenant_id !== perms.tenant_id) {
      return NextResponse.json({ success: false, error: 'Usuário não encontrado' }, { status: 404 });
    }

    // Não permitir excluir owner
    if (targetMembership.role === 'owner') {
      return NextResponse.json(
        { success: false, error: 'Não é possível excluir o proprietário do tenant' },
        { status: 403 },
      );
    }

    // Validações de permissão
    if (perms.isBranchAdmin) {
      // Admin filial só pode excluir usuários da própria filial
      if (targetMembership.branch_id !== perms.branch_id) {
        return NextResponse.json(
          { success: false, error: 'Não autorizado a excluir este usuário' },
          { status: 403 },
        );
      }
    }

    console.log('[tenant-users DELETE] Excluindo usuário:', user_id);

    // 1. Remover user_branch_memberships
    await supabaseAdmin
      .from('user_branch_memberships')
      .delete()
      .eq('user_id', user_id)
      .eq('tenant_id', perms.tenant_id);

    // 2. Remover user_memberships
    await supabaseAdmin
      .from('user_memberships')
      .delete()
      .eq('user_id', user_id)
      .eq('tenant_id', perms.tenant_id);

    // 3. Remover user_profiles (soft delete)
    await supabaseAdmin
      .from('user_profiles')
      .update({ is_active: false })
      .eq('user_id', user_id);

    // 4. Deletar usuário do Supabase Auth
    const { error: authError } = await supabaseAdmin.auth.admin.deleteUser(user_id);
    if (authError) {
      console.error('[tenant-users DELETE] Erro ao deletar do Auth:', authError);
      // Não falhar se já foi removido das outras tabelas
    }

    console.log('[tenant-users DELETE] Usuário excluído com sucesso');
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
