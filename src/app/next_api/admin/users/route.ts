import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar valores hardcoded como fallback (igual aos outros endpoints)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(request: NextRequest) {
  try {
    // Garantir que sempre retornamos JSON, mesmo em caso de erro
    const headers = {
      'Content-Type': 'application/json',
    };

    // Verificar se o usuário é admin (opcional - pode ser verificado no frontend também)
    const { searchParams } = new URL(request.url);
    const user_id = searchParams.get('user_id');
    const tenant_id = searchParams.get('tenant_id');

    if (user_id && tenant_id) {
      // Verificar se o usuário é admin
      const { data: membership } = await supabaseAdmin
        .from('user_memberships')
        .select('role')
        .eq('user_id', user_id)
        .eq('tenant_id', tenant_id)
        .eq('is_active', true)
        .maybeSingle();

      const isAdmin = membership?.role === 'owner' || membership?.role === 'admin';
      
      if (!isAdmin) {
        console.warn(`⚠️ [ADMIN/USERS] Acesso negado - usuário ${user_id} não é admin`);
        return NextResponse.json(
          { 
            success: false,
            error: 'Apenas administradores podem acessar esta lista',
            data: []
          },
          { 
            status: 403,
            headers 
          }
        );
      }
    }

    console.log('🔍 [ADMIN/USERS] Iniciando busca de todos os usuários do sistema...');

    const [profilesResult, tenantsResult, membershipsResult, subscriptionsResult] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*'),
      supabaseAdmin.from('tenants').select('*'),
      supabaseAdmin.from('user_memberships').select('*').then(result => {
        if (result.error) {
          console.warn('⚠️ [ADMIN/USERS] Tabela user_memberships não existe ou sem permissão:', result.error.message)
          return { data: [], error: null }
        }
        return result
      }),
      supabaseAdmin.from('subscriptions').select(`
        *,
        plan:plans(id, name, slug)
      `).then(result => {
        if (result.error) {
          console.warn('⚠️ [ADMIN/USERS] Tabela subscriptions não existe ou sem permissão:', result.error.message)
          return { data: [], error: null }
        }
        return result
      })
    ])

    if (profilesResult.error) {
      console.error('❌ [ADMIN/USERS] Erro ao buscar profiles:', profilesResult.error)
      throw profilesResult.error
    }
    if (tenantsResult.error) {
      console.error('❌ [ADMIN/USERS] Erro ao buscar tenants:', tenantsResult.error)
      throw tenantsResult.error
    }

    const profiles = profilesResult.data || []
    const tenants = tenantsResult.data || []
    const memberships = membershipsResult.data || []
    const subscriptions = subscriptionsResult.data || []

    console.log(`📊 [ADMIN/USERS] Dados encontrados:`, {
      profiles: profiles.length,
      tenants: tenants.length,
      memberships: memberships.length,
      subscriptions: subscriptions.length
    });

    // Se não há memberships, retornar lista vazia
    if (memberships.length === 0) {
      console.warn('⚠️ [ADMIN/USERS] Nenhum membership encontrado no banco de dados');
      return NextResponse.json({ data: [] }, { headers });
    }

    let mappedUsers: any[] = []

    // ✅ NOVO: Filtrar duplicados - manter apenas 1 tenant por user_id
    // Priorizar tenant com subscription válida
    const userTenantMap = new Map<string, any>();
    
    console.log(`🔍 [ADMIN/USERS] Processando ${memberships.length} memberships...`);
    
    // Filtrar apenas memberships ativos (excluídos têm is_active = false)
    const activeMemberships = memberships.filter((m: any) => m.is_active !== false);
    console.log(`📊 [ADMIN/USERS] Memberships ativos: ${activeMemberships.length} de ${memberships.length}`);
    
    activeMemberships.forEach((membership: any) => {
      const userId = membership.user_id;
      if (!userId) {
        console.warn('⚠️ [ADMIN/USERS] Membership sem user_id:', membership);
        return;
      }
      
      const subscription = subscriptions.find((s: any) => s.tenant_id === membership.tenant_id);
      
      // Verificar se subscription é válida
      const now = new Date();
      const isValidSubscription = subscription && (
        (subscription.status === 'active' && subscription.current_period_end && new Date(subscription.current_period_end) > now) ||
        (subscription.status === 'trial' && subscription.trial_end && new Date(subscription.trial_end) > now)
      );
      
      const existing = userTenantMap.get(userId);
      
      // Se não existe ou a nova é mais recente/válida, substituir
      if (!existing) {
        userTenantMap.set(userId, { membership, subscription, isValid: isValidSubscription });
      } else if (isValidSubscription && !existing.isValid) {
        // Priorizar subscription válida
        console.log(`✅ [ADMIN/USERS] Priorizando tenant com subscription válida para user ${userId}`);
        userTenantMap.set(userId, { membership, subscription, isValid: isValidSubscription });
      } else if (!existing.isValid && !isValidSubscription) {
        // Se nenhum é válido, usar o mais recente
        const existingDate = new Date(existing.membership.created_at);
        const newDate = new Date(membership.created_at);
        if (newDate > existingDate) {
          userTenantMap.set(userId, { membership, subscription, isValid: isValidSubscription });
        }
      }
    });
    
    console.log(`📊 [ADMIN/USERS] Total memberships: ${memberships.length}, Após filtrar duplicados: ${userTenantMap.size}`);
      
      // Mapear usuários únicos - buscar dados do auth.users para cada um
      console.log(`🔄 [ADMIN/USERS] Mapeando ${userTenantMap.size} usuários únicos...`);
      
      const mappedUsersPromises = Array.from(userTenantMap.values()).map(async (item: any, index: number) => {
        const membership = item.membership;
        const subscription = item.subscription;
        
        if (!membership || !membership.user_id) {
          console.warn(`⚠️ [ADMIN/USERS] Membership inválido no índice ${index}:`, membership);
          return null;
        }
        
        // Buscar profile - user_profiles.user_id é UUID, não id
        const profile = profiles.find((p: any) => p.user_id === membership.user_id);
        const tenant = tenants.find((t: any) => t.id === membership.tenant_id);
        const plan = subscription?.plan && (Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan);
        
        // Buscar email e nome do usuário no auth.users
        let userEmail = 'Desconhecido';
        let userName = profile?.name || 'Sem nome';
        let userCreatedAt = profile?.created_at || membership.created_at;
        
        try {
          const { data: authUser, error: authError } = await supabaseAdmin.auth.admin.getUserById(membership.user_id);
          if (authError) {
            console.warn(`⚠️ [ADMIN/USERS] Erro ao buscar auth.users para ${membership.user_id}:`, authError.message);
          } else if (authUser?.user) {
            if (authUser.user.email) {
              userEmail = authUser.user.email;
            }
            if (authUser.user.user_metadata?.name && !profile?.name) {
              userName = authUser.user.user_metadata.name;
            }
            if (authUser.user.created_at) {
              userCreatedAt = authUser.user.created_at;
            }
          } else {
            console.warn(`⚠️ [ADMIN/USERS] Usuário não encontrado no auth.users: ${membership.user_id}`);
          }
        } catch (err: any) {
          console.warn(`⚠️ [ADMIN/USERS] Exceção ao buscar dados do auth.users para ${membership.user_id}:`, err?.message || err);
        }
        
        return {
          user_id: membership.user_id,
          user_email: userEmail,
          user_name: userName,
          user_created_at: userCreatedAt,
          user_last_login: '-',
          tenant_id: membership.tenant_id || '',
          tenant_name: tenant?.name || 'Sem empresa',
          tenant_status: tenant?.status || 'trial',
          role: membership.role || 'admin',
          is_active: membership.is_active !== false,
          tenant_email: tenant?.email,
          tenant_phone: tenant?.phone,
          tenant_document: tenant?.document,
          approval_status: profile?.is_active === true ? 'approved' : profile?.is_active === false ? 'rejected' : 'pending',
          // Dados de subscription
          subscription_status: subscription?.status || null,
          subscription_trial_ends_at: subscription?.trial_end || null,
          subscription_current_period_end: subscription?.current_period_end || null,
          subscription_plan_name: plan?.name || null,
          subscription_plan_slug: plan?.slug || null,
        };
      });
      
      const mappedUsersResults = await Promise.all(mappedUsersPromises);
      // Filtrar nulls (caso algum membership seja inválido)
      mappedUsers = mappedUsersResults.filter((u: any) => u !== null);
      console.log(`✅ [ADMIN/USERS] Usuários mapeados: ${mappedUsers.length} (de ${mappedUsersResults.length} tentativas)`);

    // dedup por user_id
    const unique = mappedUsers.reduce((acc: any[], cur: any) => {
      if (!acc.find(u => u.user_id === cur.user_id)) acc.push(cur)
      return acc
    }, [])

    console.log(`✅ [ADMIN/USERS] Total de usuários únicos retornados: ${unique.length}`);
    if (unique.length > 0) {
      console.log(`📋 [ADMIN/USERS] Primeiros 3 usuários:`, unique.slice(0, 3).map(u => ({
        user_id: u.user_id,
        user_email: u.user_email,
        user_name: u.user_name,
        role: u.role
      })));
    }

    return NextResponse.json({ data: unique }, { headers })
  } catch (error: any) {
    console.error('Erro ao listar usuários admin:', error)
    // Sempre retornar JSON, mesmo em caso de erro
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro interno',
        data: []
      }, 
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    )
  }
}

// DELETE - excluir usuário (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('user_id');
    const tenantId = searchParams.get('tenant_id');

    if (!userId && !tenantId) {
      return NextResponse.json(
        { 
          success: false,
          error: 'user_id ou tenant_id é obrigatório' 
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    console.log('🗑️ Iniciando exclusão de usuário:', { userId, tenantId });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    let profileSuccess = false;
    let tenantSuccess = false;
    let membershipSuccess = false;

    // Se temos user_id, tentar excluir o perfil do usuário
    if (userId && !userId.startsWith('tenant-') && !userId.startsWith('membership-')) {
      // Verificar se é um UUID válido (user_profile.user_id corresponde ao auth.users.id)
      if (uuidRegex.test(userId)) {
        // Soft delete no user_profile usando user_id (não id)
        const { error: profileError, data: profileData } = await supabaseAdmin
          .from('user_profiles')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('user_id', userId)
          .select();

        if (profileError) {
          console.error('❌ Erro ao desativar perfil:', profileError);
        } else {
          console.log('✅ Perfil desativado:', userId, profileData);
          profileSuccess = true;
        }
      } else {
        console.warn('⚠️ user_id não é um UUID válido:', userId);
      }
    }

    // Se temos tenant_id, desativar o tenant e suas associações
    if (tenantId) {
      if (uuidRegex.test(tenantId)) {
        // Desativar tenant
        const { error: tenantError, data: tenantData } = await supabaseAdmin
          .from('tenants')
          .update({ 
            status: 'suspended',
            updated_at: new Date().toISOString(),
          })
          .eq('id', tenantId)
          .select();

        if (tenantError) {
          console.error('❌ Erro ao suspender tenant:', tenantError);
        } else {
          console.log('✅ Tenant suspenso:', tenantId, tenantData);
          tenantSuccess = true;
        }

        // Desativar memberships relacionadas
        const { error: membershipError, data: membershipData } = await supabaseAdmin
          .from('user_memberships')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('tenant_id', tenantId)
          .select();

        if (membershipError) {
          console.warn('⚠️ Erro ao desativar memberships:', membershipError);
          // Não é crítico, pode não existir a tabela
        } else {
          console.log('✅ Memberships desativadas para tenant:', tenantId, membershipData);
          membershipSuccess = true;
        }
      } else {
        console.warn('⚠️ tenant_id não é um UUID válido:', tenantId);
      }
    }

    // Verificar se pelo menos uma operação foi bem-sucedida
    if (!profileSuccess && !tenantSuccess) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Nenhuma operação de exclusão foi realizada. Verifique se os IDs são válidos.'
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    return NextResponse.json(
      { 
        success: true,
        message: 'Usuário excluído com sucesso',
        details: {
          profile_deactivated: profileSuccess,
          tenant_suspended: tenantSuccess,
          memberships_deactivated: membershipSuccess
        }
      },
      { 
        headers 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao excluir usuário:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro interno ao excluir usuário'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}

// PATCH - aprovar/rejeitar usuário
export async function PATCH(request: NextRequest) {
  try {
    const headers = {
      'Content-Type': 'application/json',
    };

    const body = await request.json();
    const { user_id, status, rejection_reason } = body;

    if (!user_id) {
      return NextResponse.json(
        { 
          success: false,
          error: 'user_id é obrigatório' 
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    if (!status || !['approved', 'rejected', 'pending'].includes(status)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'status deve ser: approved, rejected ou pending' 
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    console.log('✅ Iniciando atualização de aprovação:', { user_id, status, rejection_reason });

    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    
    // Verificar se user_id é um UUID válido
    if (!uuidRegex.test(user_id)) {
      return NextResponse.json(
        { 
          success: false,
          error: 'user_id deve ser um UUID válido' 
        },
        { 
          status: 400,
          headers 
        }
      );
    }

    // Buscar o perfil do usuário
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('*')
      .eq('user_id', user_id)
      .maybeSingle();

    if (profileError) {
      console.error('❌ Erro ao buscar perfil:', profileError);
      return NextResponse.json(
        { 
          success: false,
          error: `Erro ao buscar perfil: ${profileError.message}` 
        },
        { 
          status: 500,
          headers 
        }
      );
    }

    if (!profile) {
      // Se não existe perfil, criar um novo
      // Usar apenas colunas que existem na tabela: is_active
      const newProfile: any = {
        user_id: user_id,
        name: 'Usuário', // Nome padrão, será atualizado depois
        is_active: status === 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: createdProfile, error: createError } = await supabaseAdmin
        .from('user_profiles')
        .insert(newProfile)
        .select()
        .single();

      if (createError) {
        console.error('❌ Erro ao criar perfil:', createError);
        return NextResponse.json(
          { 
            success: false,
            error: `Erro ao criar perfil: ${createError.message}` 
          },
          { 
            status: 500,
            headers 
          }
        );
      }

      console.log('✅ Perfil criado e aprovado:', createdProfile);
      return NextResponse.json(
        { 
          success: true,
          message: `Usuário ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'pendente'} com sucesso`,
          data: createdProfile
        },
        { 
          headers 
        }
      );
    }

    // Atualizar perfil existente
    // Usar apenas colunas que existem na tabela: is_active
    const updateData: any = {
      updated_at: new Date().toISOString(),
    };

    if (status === 'approved') {
      updateData.is_active = true;
    } else if (status === 'rejected') {
      updateData.is_active = false;
    }
    // Para 'pending', não alteramos is_active (mantém o valor atual)

    const { data: updatedProfile, error: updateError } = await supabaseAdmin
      .from('user_profiles')
      .update(updateData)
      .eq('user_id', user_id)
      .select()
      .single();

    if (updateError) {
      console.error('❌ Erro ao atualizar perfil:', updateError);
      return NextResponse.json(
        { 
          success: false,
          error: `Erro ao atualizar perfil: ${updateError.message}` 
        },
        { 
          status: 500,
          headers 
        }
      );
    }

    console.log('✅ Status de aprovação atualizado:', updatedProfile);

    // Se foi aprovado, também atualizar o tenant para 'trial' se estiver 'pending_approval'
    if (status === 'approved') {
      // Buscar tenant relacionado ao usuário
      const { data: membership } = await supabaseAdmin
        .from('user_memberships')
        .select('tenant_id')
        .eq('user_id', user_id)
        .eq('is_active', true)
        .maybeSingle();

      if (membership?.tenant_id) {
        const { error: tenantUpdateError } = await supabaseAdmin
          .from('tenants')
          .update({ 
            status: 'trial',
            updated_at: new Date().toISOString(),
          })
          .eq('id', membership.tenant_id);

        if (tenantUpdateError) {
          console.warn('⚠️ Erro ao atualizar status do tenant:', tenantUpdateError);
        } else {
          console.log('✅ Status do tenant atualizado para trial');
        }
      }
    }

    return NextResponse.json(
      { 
        success: true,
        message: `Usuário ${status === 'approved' ? 'aprovado' : status === 'rejected' ? 'rejeitado' : 'pendente'} com sucesso`,
        data: updatedProfile
      },
      { 
        headers 
      }
    );
  } catch (error: any) {
    console.error('❌ Erro ao atualizar aprovação:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error.message || 'Erro interno ao atualizar aprovação'
      },
      { 
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );
  }
}
