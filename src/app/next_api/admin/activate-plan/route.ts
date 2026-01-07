import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

// Headers JSON padrão
const jsonHeaders = {
  'Content-Type': 'application/json',
};

// Função para obter o cliente Supabase (com fallback)
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
  
  if (!supabaseUrl || !supabaseServiceKey) {
    return null;
  }
  
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    // Verificar se o Supabase está configurado
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json(
        { 
          success: false,
          error: 'Supabase não configurado. Configure NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY' 
        },
        { status: 500, headers: jsonHeaders }
      );
    }
    
    const body = await request.json()
    const { tenant_id, days, plan_id, expiration_date } = body

    if (!tenant_id) {
      return NextResponse.json(
        { success: false, error: 'tenant_id é obrigatório' },
        { status: 400, headers: jsonHeaders }
      )
    }

    if (!plan_id) {
      return NextResponse.json(
        { success: false, error: 'plan_id é obrigatório' },
        { status: 400, headers: jsonHeaders }
      )
    }

    if (!expiration_date && !days) {
      return NextResponse.json(
        { success: false, error: 'expiration_date ou days é obrigatório' },
        { status: 400, headers: jsonHeaders }
      )
    }

    // Normalizar plan_id para UUID (aceitar slug como entrada)
    let finalPlanId = plan_id
    if (plan_id && !plan_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('slug', plan_id)
        .single()

      if (planError || !planData?.id) {
        return NextResponse.json(
          { success: false, error: `Plano inválido: ${plan_id}` },
          { status: 400, headers: jsonHeaders }
        )
      }

      finalPlanId = planData.id
    }

    // Buscar subscription existente
    const { data: existingSub, error: subError } = await supabaseAdmin
      .from('subscriptions')
      .select('*')
      .eq('tenant_id', tenant_id)
      .single()

    const now = new Date()
    // Se expiration_date foi fornecida, usar ela; senão calcular a partir de days
    const periodEnd = expiration_date 
      ? new Date(expiration_date + 'T23:59:59') // Adicionar hora final do dia
      : new Date(now.getTime() + (days || 30) * 24 * 60 * 60 * 1000)

    console.log('📅 [ACTIVATE-PLAN] Calculando data de expiração:', {
      expiration_date_input: expiration_date,
      periodEnd_calculated: periodEnd.toISOString(),
      now: now.toISOString(),
      tenant_id,
      plan_id: finalPlanId
    });

    if (existingSub) {
      // Atualizar subscription existente
      const updateData: any = {
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: null,
        updated_at: now.toISOString(),
        plan_id: finalPlanId
      }

      console.log('🔄 [ACTIVATE-PLAN] Atualizando subscription no banco:', {
        subscription_id: existingSub.id,
        updateData
      });

      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update(updateData)
        .eq('tenant_id', tenant_id)
        .select(`
          *,
          plan:plans(id, name, slug)
        `)
        .single()

      if (updateError) {
        console.error('❌ [ACTIVATE-PLAN] Erro ao atualizar subscription:', {
          error: updateError,
          message: updateError.message,
          code: updateError.code,
          details: updateError.details
        });
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar subscription: ' + updateError.message },
          { status: 400, headers: jsonHeaders }
        )
      }

      console.log('✅ [ACTIVATE-PLAN] Subscription atualizada no banco:', {
        id: updatedSub?.id,
        status: updatedSub?.status,
        current_period_end: updatedSub?.current_period_end,
        plan_id: updatedSub?.plan_id
      });

      // Atualizar status do tenant também
      const { error: tenantUpdateError } = await supabaseAdmin
        .from('tenants')
        .update({ 
          status: 'active',
          trial_ends_at: null // Limpar trial_ends_at quando ativar plano
        })
        .eq('id', tenant_id)
      
      if (tenantUpdateError) {
        console.error('⚠️ Erro ao atualizar tenant:', tenantUpdateError);
        // Não falhar a requisição, apenas logar o erro
      } else {
        console.log('✅ Tenant atualizado para status: active');
      }

      const daysDiff = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // Log detalhado para debug
      console.log('✅ Subscription atualizada:', {
        tenant_id,
        status: updateData.status,
        current_period_end: updateData.current_period_end,
        plan_id: updateData.plan_id,
        daysDiff
      });
      
      return NextResponse.json({
        success: true,
        message: `Plano ativado até ${periodEnd.toLocaleDateString('pt-BR')} (${daysDiff} dias)`,
        data: updatedSub,
        requiresRefresh: true // Indicar que o cliente precisa recarregar
      }, { headers: jsonHeaders })
    } else {
      // Criar nova subscription
      const { data: newSub, error: createError } = await supabaseAdmin
        .from('subscriptions')
        .insert({
          tenant_id,
          plan_id: finalPlanId,
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_end: null,
        })
        .select(`
          *,
          plan:plans(id, name, slug)
        `)
        .single()

      if (createError) {
        console.error('Erro ao criar subscription:', createError)
        return NextResponse.json(
          { success: false, error: 'Erro ao criar subscription: ' + createError.message },
          { status: 400, headers: jsonHeaders }
        )
      }

      // Atualizar status do tenant
      const { error: tenantUpdateError } = await supabaseAdmin
        .from('tenants')
        .update({ 
          status: 'active',
          trial_ends_at: null // Limpar trial_ends_at quando ativar plano
        })
        .eq('id', tenant_id)
      
      if (tenantUpdateError) {
        console.error('⚠️ Erro ao atualizar tenant:', tenantUpdateError);
        // Não falhar a requisição, apenas logar o erro
      } else {
        console.log('✅ Tenant atualizado para status: active');
      }

      const daysDiff = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
      
      // Log detalhado para debug
      console.log('✅ Subscription criada:', {
        tenant_id,
        status: 'active',
        current_period_end: periodEnd.toISOString(),
        plan_id: finalPlanId,
        daysDiff
      });
      
      return NextResponse.json({
        success: true,
        message: `Plano criado e ativado até ${periodEnd.toLocaleDateString('pt-BR')} (${daysDiff} dias)`,
        data: newSub,
        requiresRefresh: true // Indicar que o cliente precisa recarregar
      }, { headers: jsonHeaders })
    }
  } catch (error: any) {
    console.error('Erro no handler de ativação de plano:', error)
    
    // Garantir que sempre retornamos JSON, mesmo em caso de erro inesperado
    try {
      return NextResponse.json(
        { 
          success: false,
          error: 'Erro interno do servidor: ' + (error?.message || 'Erro desconhecido')
        },
        { 
          status: 500,
          headers: jsonHeaders
        }
      );
    } catch (jsonError) {
      // Se até mesmo o NextResponse.json falhar, criar resposta manual
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Erro crítico no servidor'
        }),
        {
          status: 500,
          headers: jsonHeaders
        }
      );
    }
  }
}

