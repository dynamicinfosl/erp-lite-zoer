import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const jsonHeaders = { 'Content-Type': 'application/json' }

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Listar todos os planos (com contagem de subscribers)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders })
    }

    const { searchParams } = new URL(request.url)
    const includeInactive = searchParams.get('include_inactive') === 'true'

    let query = supabase.from('plans').select('*').order('price_monthly', { ascending: true })
    
    if (!includeInactive) {
      query = query.eq('is_active', true)
    }

    const { data: plans, error } = await query

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: jsonHeaders })
    }

    // Buscar contagem de subscribers por plano
    const { data: subCounts } = await supabase
      .from('subscriptions')
      .select('plan_id, status')
    
    const subscriberCounts: Record<string, { active: number; total: number }> = {}
    if (subCounts) {
      for (const sub of subCounts) {
        if (!subscriberCounts[sub.plan_id]) {
          subscriberCounts[sub.plan_id] = { active: 0, total: 0 }
        }
        subscriberCounts[sub.plan_id].total++
        if (sub.status === 'active') {
          subscriberCounts[sub.plan_id].active++
        }
      }
    }

    // Enriquecer planos com contagem
    const enrichedPlans = (plans || []).map(plan => ({
      ...plan,
      subscriber_count: subscriberCounts[plan.id]?.active || 0,
      total_subscriber_count: subscriberCounts[plan.id]?.total || 0,
    }))

    return NextResponse.json({ success: true, data: enrichedPlans }, { headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}

// POST - Criar novo plano
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders })
    }

    const body = await request.json()
    const { name, slug, description, price_monthly, price_yearly, billing_cycle, features, limits, is_active } = body

    if (!name || !slug) {
      return NextResponse.json({ success: false, error: 'name e slug são obrigatórios' }, { status: 400, headers: jsonHeaders })
    }

    // Verificar se slug já existe
    const { data: existing } = await supabase.from('plans').select('id').eq('slug', slug).maybeSingle()
    if (existing) {
      return NextResponse.json({ success: false, error: `Já existe um plano com o slug "${slug}"` }, { status: 400, headers: jsonHeaders })
    }

    const { data: plan, error } = await supabase
      .from('plans')
      .insert({
        name,
        slug,
        description: description || '',
        price_monthly: price_monthly || 0,
        price_yearly: price_yearly || 0,
        billing_cycle: billing_cycle || 'monthly',
        features: features || {},
        limits: limits || {},
        is_active: is_active !== false,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: jsonHeaders })
    }

    return NextResponse.json({ success: true, data: plan, message: 'Plano criado com sucesso!' }, { status: 201, headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}

// PUT - Atualizar plano existente
export async function PUT(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders })
    }

    const body = await request.json()
    const { id, ...updateData } = body

    if (!id) {
      return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400, headers: jsonHeaders })
    }

    // Não permitir alterar slug de planos com subscribers ativos
    if (updateData.slug) {
      const { data: currentPlan } = await supabase.from('plans').select('slug').eq('id', id).single()
      if (currentPlan && currentPlan.slug !== updateData.slug) {
        const { data: activeSubs } = await supabase
          .from('subscriptions')
          .select('id')
          .eq('plan_id', id)
          .in('status', ['active', 'trialing'])
          .limit(1)
        
        if (activeSubs && activeSubs.length > 0) {
          return NextResponse.json({ 
            success: false, 
            error: 'Não é possível alterar o slug de um plano com assinantes ativos' 
          }, { status: 400, headers: jsonHeaders })
        }
      }
    }

    const { data: plan, error } = await supabase
      .from('plans')
      .update({ ...updateData, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: jsonHeaders })
    }

    return NextResponse.json({ success: true, data: plan, message: 'Plano atualizado com sucesso!' }, { headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}

// DELETE - Desativar plano (soft delete)
export async function DELETE(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')

    if (!id) {
      return NextResponse.json({ success: false, error: 'id é obrigatório' }, { status: 400, headers: jsonHeaders })
    }

    // Verificar se tem subscribers ativos
    const { data: activeSubs } = await supabase
      .from('subscriptions')
      .select('id')
      .eq('plan_id', id)
      .in('status', ['active', 'trialing'])

    if (activeSubs && activeSubs.length > 0) {
      return NextResponse.json({ 
        success: false, 
        error: `Não é possível excluir: ${activeSubs.length} assinante(s) ativo(s) neste plano` 
      }, { status: 400, headers: jsonHeaders })
    }

    // Soft delete: apenas desativar
    const { data: plan, error } = await supabase
      .from('plans')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: jsonHeaders })
    }

    return NextResponse.json({ success: true, data: plan, message: 'Plano desativado com sucesso!' }, { headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}
