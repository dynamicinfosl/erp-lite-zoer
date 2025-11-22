import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { tenant_id, days, plan_id, expiration_date } = body

    if (!tenant_id) {
      return NextResponse.json(
        { error: 'tenant_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!plan_id) {
      return NextResponse.json(
        { error: 'plan_id é obrigatório' },
        { status: 400 }
      )
    }

    if (!expiration_date && !days) {
      return NextResponse.json(
        { error: 'expiration_date ou days é obrigatório' },
        { status: 400 }
      )
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

    if (existingSub) {
      // Atualizar subscription existente
      const updateData: any = {
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString(),
        trial_end: null,
        updated_at: now.toISOString(),
        plan_id: plan_id
      }

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
        console.error('Erro ao atualizar subscription:', updateError)
        return NextResponse.json(
          { error: 'Erro ao atualizar subscription: ' + updateError.message },
          { status: 400 }
        )
      }

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
      })
    } else {
      // Criar nova subscription
      // Buscar plan_id real se foi passado slug
      let finalPlanId = plan_id
      if (plan_id && !plan_id.match(/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i)) {
        const { data: planData } = await supabaseAdmin
          .from('plans')
          .select('id')
          .eq('slug', plan_id)
          .single()
        
        if (planData) {
          finalPlanId = planData.id
        }
      }

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
          { error: 'Erro ao criar subscription: ' + createError.message },
          { status: 400 }
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
      })
    }
  } catch (error: any) {
    console.error('Erro no handler de ativação de plano:', error)
    return NextResponse.json(
      { error: 'Erro interno do servidor: ' + error.message },
      { status: 500 }
    )
  }
}

