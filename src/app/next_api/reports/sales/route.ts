import { NextRequest, NextResponse } from 'next/server'
import { createPostgrestClient } from '@/lib/postgrest'
import { requestMiddleware, parseQueryParams } from '@/lib/api-utils'

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

async function handler(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const tenantId = searchParams.get('tenant_id') || ''
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 })
  }

  const db = createPostgrestClient()

  // Busca vendas com custo (assumindo tabela sales com fields: id, tenant_id, total, total_cost, created_at)
  const { data, error } = await db
    .from('sales')
    .select('id,total,total_cost,created_at')
    .eq('tenant_id', tenantId)
    .gte(start ? 'created_at' : 'id', start || undefined as any)
    .lte(end ? 'created_at' : 'id', end || undefined as any)
    .order('created_at', { ascending: true })

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  const items = (data || []).map((row: any) => {
    const revenue = Number(row.total || 0)
    const cost = Number(row.total_cost || 0)
    const profit = revenue - cost
    return {
      id: row.id,
      date: row.created_at,
      revenue,
      cost,
      profit,
    }
  })

  const totalRevenue = items.reduce((s, i) => s + i.revenue, 0)
  const totalCost = items.reduce((s, i) => s + i.cost, 0)
  const totalProfit = totalRevenue - totalCost
  const profitMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(2)) : 0

  const summary: SalesSummary = {
    totalRevenue,
    totalCost,
    totalProfit,
    profitMargin,
    items,
  }

  return NextResponse.json(summary)
}

export const GET = requestMiddleware(handler, false)


