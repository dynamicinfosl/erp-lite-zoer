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
          
          users.push({
            id: authUser.user.id,
            email: authUser.user.email,
            created_at: authUser.user.created_at,
            role: membership?.role || 'member',
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

    return NextResponse.json({ success: true, data: users });
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
    // Validar role: deve ser 'owner', 'admin' ou 'member' (conforme constraint do banco)
    let finalRole = 'member'; // padrão
    if (role === 'admin' || role === 'owner') {
      finalRole = 'admin'; // 'admin' cobre tanto admin quanto owner para user_memberships
    } else {
      finalRole = 'member';
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
    try {
      await supabaseAdmin.from('user_profiles').insert({
        id: authData.user.id,
        user_id: authData.user.id,
        name,
        email,
        role_type: role,
        is_active: true,
      });
    } catch (profileError) {
      console.warn('Erro ao criar perfil (não crítico):', profileError);
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
      updates.role = role === 'admin' ? 'admin' : 'member';
      
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
