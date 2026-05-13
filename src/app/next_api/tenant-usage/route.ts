import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const jsonHeaders = { 'Content-Type': 'application/json' }

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co'
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'
  if (!supabaseUrl || !supabaseServiceKey) return null
  return createClient(supabaseUrl, supabaseServiceKey)
}

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    if (!supabase) {
      return NextResponse.json({ success: false, error: 'Supabase não configurado' }, { status: 500, headers: jsonHeaders })
    }

    const { searchParams } = new URL(request.url)
    const tenant_id = searchParams.get('tenant_id')

    if (!tenant_id) {
      return NextResponse.json({ success: false, error: 'tenant_id é obrigatório' }, { status: 400, headers: jsonHeaders })
    }

    // Buscar contagens em paralelo
    const [usersResult, customersResult, productsResult] = await Promise.all([
      // Contar usuários do tenant
      supabase.from('user_memberships').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id).eq('is_active', true),
      // Contar clientes do tenant
      supabase.from('customers').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
      // Contar produtos do tenant
      supabase.from('products').select('id', { count: 'exact', head: true }).eq('tenant_id', tenant_id),
    ])

    return NextResponse.json({
      success: true,
      data: {
        users: usersResult.count || 0,
        customers: customersResult.count || 0,
        products: productsResult.count || 0,
        sales_this_month: 0, // TODO: implementar contagem de vendas do mês
      },
    }, { headers: jsonHeaders })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500, headers: jsonHeaders })
  }
}
