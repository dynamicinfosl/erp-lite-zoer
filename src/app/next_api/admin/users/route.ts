import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Usar valores hardcoded como fallback (igual aos outros endpoints)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function GET(_request: NextRequest) {
  try {
    // Garantir que sempre retornamos JSON, mesmo em caso de erro
    const headers = {
      'Content-Type': 'application/json',
    };

    const [profilesResult, tenantsResult, membershipsResult, subscriptionsResult] = await Promise.all([
      supabaseAdmin.from('user_profiles').select('*'),
      supabaseAdmin.from('tenants').select('*'),
      supabaseAdmin.from('user_memberships').select('*').then(result => {
        if (result.error) {
          console.warn('⚠️ Tabela user_memberships não existe ou sem permissão:', result.error.message)
          return { data: [], error: null }
        }
        return result
      }),
      supabaseAdmin.from('subscriptions').select(`
        *,
        plan:plans(id, name, slug)
      `).then(result => {
        if (result.error) {
          console.warn('⚠️ Tabela subscriptions não existe ou sem permissão:', result.error.message)
          return { data: [], error: null }
        }
        return result
      })
    ])

    if (profilesResult.error) {
      console.error('❌ Erro ao buscar profiles:', profilesResult.error)
      throw profilesResult.error
    }
    if (tenantsResult.error) {
      console.error('❌ Erro ao buscar tenants:', tenantsResult.error)
      throw tenantsResult.error
    }

    const profiles = profilesResult.data || []
    const tenants = tenantsResult.data || []
    const memberships = membershipsResult.data || []
    const subscriptions = subscriptionsResult.data || []

    let mappedUsers: any[] = []

    if (memberships.length > 0) {
      mappedUsers = memberships.map((membership: any, index: number) => {
        const profile = profiles.find((p: any) => p.id === membership.user_id)
        const tenant = tenants.find((t: any) => t.id === membership.tenant_id)
        const subscription = subscriptions.find((s: any) => s.tenant_id === membership.tenant_id)
        const plan = subscription?.plan && (Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan)
        
        return {
          user_id: membership.user_id || `membership-${index}`,
          user_email: profile?.email || 'Desconhecido',
          user_created_at: profile?.created_at || membership.created_at,
          user_last_login: '-',
          tenant_id: membership.tenant_id || '',
          tenant_name: tenant?.name || 'Sem empresa',
          tenant_status: tenant?.status || 'trial',
          role: membership.role || 'admin',
          is_active: membership.is_active !== false,
          tenant_email: tenant?.email,
          tenant_phone: tenant?.phone,
          tenant_document: tenant?.document,
          approval_status: profile?.status || 'pending',
          // Dados de subscription
          subscription_status: subscription?.status || null,
          subscription_trial_ends_at: subscription?.trial_end || null,
          subscription_current_period_end: subscription?.current_period_end || null,
          subscription_plan_name: plan?.name || null,
          subscription_plan_slug: plan?.slug || null,
        }
      })
    } else {
      mappedUsers = tenants.map((tenant: any, index: number) => {
        const subscription = subscriptions.find((s: any) => s.tenant_id === tenant.id)
        const plan = subscription?.plan && (Array.isArray(subscription.plan) ? subscription.plan[0] : subscription.plan)
        
        return {
          user_id: `tenant-${tenant.id}-${index}`,
          user_email: tenant.email || 'Desconhecido',
          user_created_at: tenant.created_at,
          user_last_login: '-',
          tenant_id: tenant.id,
          tenant_name: tenant.name || 'Sem empresa',
          tenant_status: tenant.status || 'trial',
          role: 'admin',
          is_active: true,
          tenant_email: tenant.email,
          tenant_phone: tenant.phone,
          tenant_document: tenant.document,
          approval_status: 'pending',
          // Dados de subscription
          subscription_status: subscription?.status || null,
          subscription_trial_ends_at: subscription?.trial_end || null,
          subscription_current_period_end: subscription?.current_period_end || null,
          subscription_plan_name: plan?.name || null,
          subscription_plan_slug: plan?.slug || null,
        }
      })
    }

    // dedup por user_id
    const unique = mappedUsers.reduce((acc: any[], cur: any) => {
      if (!acc.find(u => u.user_id === cur.user_id)) acc.push(cur)
      return acc
    }, [])

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
      // Verificar se é um UUID válido (user_profile.id)
      if (uuidRegex.test(userId)) {
        // Soft delete no user_profile
        const { error: profileError, data: profileData } = await supabaseAdmin
          .from('user_profiles')
          .update({ 
            is_active: false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', userId)
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

