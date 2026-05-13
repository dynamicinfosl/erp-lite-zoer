import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const jsonHeaders = { 'Content-Type': 'application/json' }

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

// GET - Buscar histórico de subscription de um tenant
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
      .from('subscription_history')
      .select(`
        *,
        plan_from:plans!subscription_history_plan_id_from_fkey(id, name, slug),
        plan_to:plans!subscription_history_plan_id_to_fkey(id, name, slug)
      `)
      .eq('tenant_id', tenant_id)
      .order('created_at', { ascending: false })
      .limit(limit)

    if (error) {
      return NextResponse.json({ success: false, error: error.message }, { status: 400, headers: jsonHeaders })
    }

    return NextResponse.json({ success: true, data: data || [] }, { headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}
