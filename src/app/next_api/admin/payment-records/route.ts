import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const jsonHeaders = { 'Content-Type': 'application/json' }

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Buscar pagamentos de um tenant
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders })
    }

    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')
    const limit = parseInt(searchParams.get('limit') || '50')

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400, headers: jsonHeaders })
    }

    const { data, error } = await supabase
      .from('payment_records')
      .select('*')
      .eq('tenant_id', tenant_id)
      .order('payment_date', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: jsonHeaders })
    }

    return NextResponse.json({ success: true, data: data || [] }, { headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}

// POST - Registrar pagamento manual
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders })
    }

    const body = await request.json()
    const {
      tenant_id, subscription_id, amount, payment_method,
      payment_date, reference_period_start, reference_period_end,
      status, gateway, gateway_payment_id, gateway_transaction_id,
      gateway_response, pix_qr_code, pix_qr_code_url, pix_copy_paste,
      pix_expiration, boleto_url, boleto_barcode, boleto_due_date,
      recorded_by, recorded_by_name, notes
    } = body

    if (!tenant_id || !amount || !payment_method) {
      return NextResponse.json(
        { success: false, error: 'tenant_id, amount e payment_method são obrigatórios' },
        { status: 400, headers: jsonHeaders }
      )
    }

    // Se subscription_id não foi informado, buscar a subscription do tenant
    let finalSubId = subscription_id
    if (!finalSubId) {
      const { data: sub } = await supabase
        .from('subscriptions')
        .select('id')
        .eq('tenant_id', tenant_id)
        .single()
      finalSubId = sub?.id || null
    }

    const { data, error } = await supabase
      .from('payment_records')
      .insert({
        tenant_id,
        subscription_id: finalSubId,
        amount,
        payment_method,
        payment_date: payment_date || new Date().toISOString(),
        reference_period_start,
        reference_period_end,
        status: status || 'confirmed',
        gateway: gateway || (payment_method.startsWith('cora_') ? 'cora' : 'manual'),
        gateway_payment_id,
        gateway_transaction_id,
        gateway_response,
        pix_qr_code,
        pix_qr_code_url,
        pix_copy_paste,
        pix_expiration,
        boleto_url,
        boleto_barcode,
        boleto_due_date,
        recorded_by,
        recorded_by_name,
        notes,
      })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: jsonHeaders })
    }

    return NextResponse.json({ success: true, data, message: 'Pagamento registrado com sucesso!' }, { status: 201, headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}
