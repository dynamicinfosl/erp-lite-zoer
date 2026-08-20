import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requestMiddleware } from '@/lib/api-utils'
import { effectiveUnitCost } from '@/lib/sale-calculations'
import { fetchAllPaged, fetchAllByIds } from '@/lib/report-queries'

interface SalesSummary {
  totalRevenue: number
  totalCost: number
  totalProfit: number
  profitMargin: number
  items: Array<{
    id: string
    date: string
    revenue: number
    cost: number
    profit: number
  }>
}

const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'

async function handler(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const tenantId = searchParams.get('tenant_id') || ''
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const user_id = searchParams.get('user_id') || ''
  const sale_source = searchParams.get('sale_source') || ''
  const exclude_api = searchParams.get('exclude_api') === 'true'

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    let query = supabase
      .from('sales')
      .select('id, total_amount, final_amount, created_at')
      .eq('tenant_id', tenantId)
      .or('status.is.null,and(status.neq.canceled,status.neq.cancelada)')

    if (user_id && user_id.trim() !== '') {
      query = query.eq('user_id', user_id.trim())
    }

    if (exclude_api) {
      query = query.or('sale_source.is.null,sale_source.neq.api')
    } else if (sale_source && sale_source.trim() !== '') {
      query = query.eq('sale_source', sale_source.trim())
    }

    if (start) {
      const startISO = start.includes('T') ? start : `${start}T00:00:00.000Z`
      query = query.gte('created_at', startISO)
    }
    if (end) {
      const endISO = end.includes('T') ? end : `${end}T23:59:59.999Z`
      query = query.lte('created_at', endISO)
    }

    let salesRows: any[]
    try {
      salesRows = await fetchAllPaged(
        query.order('created_at', { ascending: true }).order('id', { ascending: true })
      )
    } catch (error: any) {
      console.error('❌ Erro ao buscar vendas:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }
    const totalRevenue = salesRows.reduce(
      (s, row) => s + Number(row.final_amount ?? row.total_amount ?? 0),
      0
    )

    const costBySale: Record<string, number> = {}
    let totalCost = 0

    if (salesRows.length > 0) {
      const saleIds = salesRows.map((r: any) => r.id)
      const items = await fetchAllByIds(
        (ids) =>
          supabase
            .from('sale_items')
            .select('sale_id, product_id, quantity, cost_price')
            .in('sale_id', ids)
            .order('id', { ascending: true }),
        saleIds
      )
      const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))] as string[]
      const costByProduct: Record<string, number> = {}

      if (productIds.length > 0) {
        const productsData = await fetchAllByIds(
          (ids) =>
            supabase
              .from('products')
              .select('id, cost_price')
              .in('id', ids)
              .eq('tenant_id', tenantId)
              .order('id', { ascending: true }),
          productIds
        )
        productsData.forEach((p: any) => {
          costByProduct[String(p.id)] = Number(p.cost_price) || 0
        })
      }

      items.forEach((item: any) => {
        const unitCost = effectiveUnitCost(
          item.cost_price,
          costByProduct[String(item.product_id)]
        )
        const lineCost = unitCost * Number(item.quantity || 0)
        totalCost += lineCost
        const saleId = String(item.sale_id)
        costBySale[saleId] = (costBySale[saleId] || 0) + lineCost
      })
    }

    const totalProfit = totalRevenue - totalCost
    const profitMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(2)) : 0

    // Custo real por venda (não proporcional)
    const items = salesRows.map((row: any) => {
      const revenue = Number(row.final_amount ?? row.total_amount ?? 0)
      const cost = Number((costBySale[String(row.id)] || 0).toFixed(2))
      return {
        id: row.id,
        date: row.created_at,
        revenue,
        cost,
        profit: revenue - cost,
      }
    })

    const summary: SalesSummary = {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      items,
    }

    return NextResponse.json(summary)
  } catch (error) {
    console.error('❌ Erro no relatório:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const GET = requestMiddleware(handler, false)
