import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

export async function GET(request: NextRequest) {
  try {
    // Buscar todos os tenants primeiro
    const { data: allTenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status, email, created_at');

    if (tenantsError) {
      return NextResponse.json({
        success: false,
        error: 'Erro ao buscar tenants: ' + tenantsError.message
      }, { status: 500 });
    }

    // Para cada tenant, verificar se tem membership com usuário elias
    const tenantsElias = [];
    
    for (const tenant of allTenants || []) {
      // Buscar memberships deste tenant
      const { data: memberships } = await supabaseAdmin
        .from('user_memberships')
        .select('user_id')
        .eq('tenant_id', tenant.id);

      if (!memberships || memberships.length === 0) continue;

      // Verificar se algum dos usuários tem email com "elias"
      let hasElias = false;
      for (const membership of memberships) {
        const { data: user } = await supabaseAdmin.auth.admin.getUserById(membership.user_id);
        if (user?.user?.email && user.user.email.toLowerCase().includes('elias')) {
          hasElias = true;
          break;
        }
      }

      if (!hasElias) continue;

      // Buscar subscription deste tenant
      const { data: subscriptions } = await supabaseAdmin
        .from('subscriptions')
        .select(`
          id,
          status,
          plan_id,
          trial_end,
          trial_ends_at,
          current_period_start,
          current_period_end,
          created_at,
          updated_at,
          plans(
            id,
            name,
            slug,
            price_monthly
          )
        `)
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(1);

      const subscription = subscriptions && subscriptions.length > 0 ? subscriptions[0] : null;
      const plan = subscription?.plans || null;

      const now = new Date();
      let statusPlano = 'SEM_SUBSCRIPTION';
      let isVencido = false;

      if (subscription) {
        if (subscription.status === 'active' && subscription.current_period_end) {
          const periodEnd = new Date(subscription.current_period_end);
          if (periodEnd < now) {
            statusPlano = 'VENCIDO';
            isVencido = true;
          } else {
            statusPlano = 'VÁLIDO';
          }
        } else if (subscription.status === 'trial' && subscription.trial_ends_at) {
          const trialEnd = new Date(subscription.trial_ends_at);
          if (trialEnd < now) {
            statusPlano = 'TRIAL_EXPIRADO';
            isVencido = true;
          } else {
            statusPlano = 'TRIAL_ATIVO';
          }
        } else if (subscription.status === 'suspended') {
          statusPlano = 'SUSPENSO';
        } else if (subscription.status === 'cancelled') {
          statusPlano = 'CANCELADO';
        }
      }

      tenantsElias.push({
        tenant_id: tenant.id,
        tenant_name: tenant.name,
        tenant_status: tenant.status,
        tenant_email: tenant.email,
        tenant_created_at: tenant.created_at,
        subscription_id: subscription?.id || null,
        subscription_status: subscription?.status || null,
        plan_id: subscription?.plan_id || null,
        plan_name: plan?.name || null,
        plan_slug: plan?.slug || null,
        price_monthly: plan?.price_monthly || null,
        trial_end: subscription?.trial_end || null,
        trial_ends_at: subscription?.trial_ends_at || null,
        current_period_start: subscription?.current_period_start || null,
        current_period_end: subscription?.current_period_end || null,
        subscription_created_at: subscription?.created_at || null,
        subscription_updated_at: subscription?.updated_at || null,
        status_plano: statusPlano,
        pleno_mensal_vencido: isVencido
      });
    }

    if (tenantsElias.length === 0) {
      return NextResponse.json({
        success: true,
        data: [],
        resposta: 'Nenhum tenant encontrado para o usuário Elias'
      });
    }

    const tenant = tenantsElias[0];
    const isVencido = tenant.pleno_mensal_vencido;

    return NextResponse.json({
      success: true,
      data: tenantsElias,
      resposta: isVencido 
        ? 'SIM, ELIAS ESTÁ COM PLENO MENSAL VENCIDO ❌' 
        : 'NÃO, ELIAS ESTÁ COM PLENO MENSAL VÁLIDO ✅',
      pleno_mensal_vencido: isVencido,
      detalhes: {
        tenant_name: tenant.tenant_name,
        subscription_status: tenant.subscription_status,
        plan_name: tenant.plan_name,
        current_period_end: tenant.current_period_end,
        status_plano: tenant.status_plano
      }
    });

  } catch (error: any) {
    console.error('Erro ao verificar Elias:', error);
    return NextResponse.json({
      success: false,
      error: 'Erro interno: ' + error.message
    }, { status: 500 });
  }
}

