import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const jsonHeaders = { 'Content-Type': 'application/json' }

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function POST(request: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin()
    if (!supabaseAdmin) {
      return NextResponse.json(
        { success: false, error: 'Supabase não configurado' },
        { status: 500, headers: jsonHeaders }
      )
    }

    const body = await request.json()
    const { 
      tenant_id, 
      plan_id, 
      expiration_date, 
      days,
      payment_amount,
      payment_method,
      payment_reference,
      admin_notes,
      admin_name
    } = body

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

    // ============================================================
    // 1. Resolver plan_id (aceitar UUID ou slug)
    // ============================================================
    let finalPlanId = plan_id
    const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(plan_id)
    
    if (!isUUID) {
      const { data: planData, error: planError } = await supabaseAdmin
        .from('plans')
        .select('id')
        .eq('slug', plan_id)
        .eq('is_active', true)
        .single()

      if (planError || !planData?.id) {
        return NextResponse.json(
          { success: false, error: `Plano não encontrado: ${plan_id}` },
          { status: 400, headers: jsonHeaders }
        )
      }
      finalPlanId = planData.id
    }

    // ============================================================
    // 2. Buscar dados do plano selecionado
    // ============================================================
    const { data: selectedPlan, error: planFetchError } = await supabaseAdmin
      .from('plans')
      .select('*')
      .eq('id', finalPlanId)
      .single()

    if (planFetchError || !selectedPlan) {
      return NextResponse.json(
        { success: false, error: 'Plano não encontrado no banco de dados' },
        { status: 400, headers: jsonHeaders }
      )
    }

    // ============================================================
    // 3. VALIDAÇÃO: Não permitir "renovar" com plano Trial
    // ============================================================
    if (selectedPlan.slug === 'trial' || selectedPlan.slug === 'free') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Não é possível ativar o plano "${selectedPlan.name}". Selecione um plano pago (Básico, Profissional ou Enterprise).` 
        },
        { status: 400, headers: jsonHeaders }
      )
    }

    if (!selectedPlan.is_active) {
      return NextResponse.json(
        { success: false, error: `O plano "${selectedPlan.name}" está desativado` },
        { status: 400, headers: jsonHeaders }
      )
    }

    // ============================================================
    // 4. Calcular período
    // ============================================================
    const now = new Date()
    const periodEnd = expiration_date
      ? new Date(expiration_date + 'T23:59:59')
      : new Date(now.getTime() + (days || 30) * 24 * 60 * 60 * 1000)

    if (periodEnd <= now) {
      return NextResponse.json(
        { success: false, error: 'A data de expiração deve ser futura' },
        { status: 400, headers: jsonHeaders }
      )
    }

    const daysDiff = Math.ceil((periodEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))

    // ============================================================
    // 5. Buscar ou criar subscription
    // ============================================================
    const { data: existingSub } = await supabaseAdmin
      .from('subscriptions')
      .select('*, plan:plans(id, name, slug)')
      .eq('tenant_id', tenant_id)
      .single()

    const previousPlanId = existingSub?.plan_id || null
    let subscriptionResult: any
    let action: string

    if (existingSub) {
      // Determinar ação
      if (existingSub.status === 'trialing' || existingSub.plan?.slug === 'trial') {
        action = 'upgraded'
      } else if (previousPlanId === finalPlanId) {
        action = 'renewed'
      } else {
        const { data: prevPlan } = await supabaseAdmin
          .from('plans')
          .select('price_monthly')
          .eq('id', previousPlanId)
          .single()
        
        action = (prevPlan && selectedPlan.price_monthly > prevPlan.price_monthly) ? 'upgraded' : 'downgraded'
      }

      // Atualizar subscription existente
      const { data: updatedSub, error: updateError } = await supabaseAdmin
        .from('subscriptions')
        .update({
          status: 'active',
          plan_id: finalPlanId,
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString(),
          trial_end: null,
          updated_at: now.toISOString(),
        })
        .eq('tenant_id', tenant_id)
        .select('*, plan:plans(id, name, slug, price_monthly)')
        .single()

      if (updateError) {
        console.error('❌ [ACTIVATE-PLAN] Erro ao atualizar subscription:', updateError)
        return NextResponse.json(
          { success: false, error: 'Erro ao atualizar subscription: ' + updateError.message },
          { status: 400, headers: jsonHeaders }
        )
      }

      subscriptionResult = updatedSub
    } else {
      action = 'created'

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
        .select('*, plan:plans(id, name, slug, price_monthly)')
        .single()

      if (createError) {
        console.error('❌ [ACTIVATE-PLAN] Erro ao criar subscription:', createError)
        return NextResponse.json(
          { success: false, error: 'Erro ao criar subscription: ' + createError.message },
          { status: 400, headers: jsonHeaders }
        )
      }

      subscriptionResult = newSub
    }

    // ============================================================
    // 6. Atualizar status do tenant
    // ============================================================
    await supabaseAdmin
      .from('tenants')
      .update({ status: 'active', trial_ends_at: null })
      .eq('id', tenant_id)

    // ============================================================
    // 7. Registrar no subscription_history
    // ============================================================
    await supabaseAdmin
      .from('subscription_history')
      .insert({
        subscription_id: subscriptionResult.id,
        tenant_id,
        action,
        plan_id_from: previousPlanId,
        plan_id_to: finalPlanId,
        period_start: now.toISOString(),
        period_end: periodEnd.toISOString(),
        amount: payment_amount || selectedPlan.price_monthly || 0,
        payment_method: payment_method || 'manual',
        payment_reference: payment_reference || null,
        performed_by_name: admin_name || 'Admin',
        notes: admin_notes || `${action === 'renewed' ? 'Renovação' : action === 'upgraded' ? 'Upgrade' : 'Ativação'} do plano ${selectedPlan.name} por ${daysDiff} dias`,
      })

    // ============================================================
    // 8. Registrar pagamento (se informado valor ou se é plano pago)
    // ============================================================
    const amount = payment_amount || selectedPlan.price_monthly || 0
    if (amount > 0) {
      await supabaseAdmin
        .from('payment_records')
        .insert({
          tenant_id,
          subscription_id: subscriptionResult.id,
          amount,
          payment_method: payment_method || 'manual',
          payment_date: now.toISOString(),
          reference_period_start: now.toISOString(),
          reference_period_end: periodEnd.toISOString(),
          status: 'confirmed',
          gateway: 'manual',
          recorded_by_name: admin_name || 'Admin',
          notes: admin_notes || `Pagamento registrado na ativação do plano ${selectedPlan.name}`,
        })
    }

    // ============================================================
    // 9. Resposta
    // ============================================================
    console.log(`✅ [ACTIVATE-PLAN] ${action}: tenant=${tenant_id}, plan=${selectedPlan.name}, até=${periodEnd.toISOString()}, dias=${daysDiff}`)

    return NextResponse.json({
      success: true,
      message: `Plano ${selectedPlan.name} ${action === 'renewed' ? 'renovado' : 'ativado'} até ${periodEnd.toLocaleDateString('pt-BR')} (${daysDiff} dias)`,
      data: subscriptionResult,
      action,
      requiresRefresh: true,
    }, { headers: jsonHeaders })

  } catch (error: any) {
    console.error('❌ [ACTIVATE-PLAN] Erro:', error)
    return NextResponse.json(
      { success: false, error: 'Erro interno: ' + (error?.message || 'Desconhecido') },
      { status: 500, headers: jsonHeaders }
    )
  }
}
