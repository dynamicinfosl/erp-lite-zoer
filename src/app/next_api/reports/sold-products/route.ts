import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requestMiddleware } from '@/lib/api-utils'
import { effectiveUnitCost } from '@/lib/sale-calculations'
import { fetchAllPaged, fetchAllByIds } from '@/lib/report-queries'

const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'

async function handler(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const tenantId = searchParams.get('tenant_id') || ''
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const user_id = searchParams.get('user_id') || ''
  const branch_id = searchParams.get('branch_id') || ''
  const customer_id = searchParams.get('customer_id') || ''
  const product_id = searchParams.get('product_id') || ''
  const category = searchParams.get('category') || ''
  const situation = searchParams.get('situation') || ''
  const exclude_api = searchParams.get('exclude_api') === 'true'

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

  try {
    let salesQuery = supabase
      .from('sales')
      .select('id, total_amount, final_amount, created_at, user_id, branch_id, customer_id, status')
      .eq('tenant_id', tenantId)

    if (situation) {
      if (situation === 'cancelada') {
        salesQuery = salesQuery.or('status.eq.canceled,status.eq.cancelada')
      } else if (situation === 'concluida') {
        salesQuery = salesQuery.or('status.is.null,and(status.neq.canceled,status.neq.cancelada)')
      } else {
        salesQuery = salesQuery.eq('status', situation)
      }
    } else {
      salesQuery = salesQuery.or('status.is.null,and(status.neq.canceled,status.neq.cancelada)')
    }

    if (user_id && user_id.trim() !== '') {
      salesQuery = salesQuery.eq('user_id', user_id.trim())
    }

    if (branch_id && branch_id.trim() !== '' && branch_id !== 'all') {
      salesQuery = salesQuery.eq('branch_id', branch_id.trim())
    }

    if (customer_id && customer_id.trim() !== '') {
      salesQuery = salesQuery.eq('customer_id', customer_id.trim())
    }

    if (exclude_api) {
      salesQuery = salesQuery.or('sale_source.is.null,sale_source.neq.api')
    }

    if (start) {
      const startISO = start.includes('T') ? start : `${start}T00:00:00.000Z`
      salesQuery = salesQuery.gte('created_at', startISO)
    }
    if (end) {
      const endISO = end.includes('T') ? end : `${end}T23:59:59.999Z`
      salesQuery = salesQuery.lte('created_at', endISO)
    }

    let salesRows: any[]
    try {
      salesRows = await fetchAllPaged(salesQuery.order('id', { ascending: true }))
    } catch (salesError: any) {
      console.error('❌ Erro ao buscar vendas para relatório:', salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }
    if (salesRows.length === 0) {
      return NextResponse.json({
        totals: { quantity: 0, cost: 0, value: 0, discount: 0, profit: 0 },
        products: [],
      })
    }

    const saleIds = salesRows.map((r: any) => r.id)

    let items: any[]
    try {
      items = await fetchAllByIds((ids) => {
        let q = supabase
          .from('sale_items')
          .select('sale_id, product_id, quantity, unit_price, subtotal, total_price, cost_price')
          .in('sale_id', ids)
          .order('id', { ascending: true })
        if (product_id && product_id.trim() !== '') q = q.eq('product_id', product_id.trim())
        return q
      }, saleIds)
    } catch (itemsError: any) {
      console.error('❌ Erro ao buscar itens de vendas:', itemsError)
      return NextResponse.json({ error: itemsError.message }, { status: 500 })
    }
    if (items.length === 0) {
      return NextResponse.json({
        totals: { quantity: 0, cost: 0, value: 0, discount: 0, profit: 0 },
        products: [],
      })
    }

    const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))] as string[]

    let productsQuery = supabase
      .from('products')
      .select('id, name, cost_price, category')
      .in('id', productIds)
      .eq('tenant_id', tenantId)

    if (category && category.trim() !== '') {
      productsQuery = productsQuery.eq('category', category.trim())
    }

    const { data: productsData, error: productsError } = await productsQuery

    if (productsError) {
      console.error('❌ Erro ao buscar produtos para detalhes:', productsError)
      return NextResponse.json({ error: productsError.message }, { status: 500 })
    }

    const productsList = productsData || []
    const productsMap = new Map<string, { name: string; cost_price: number; category?: string }>()
    productsList.forEach((p: any) => {
      productsMap.set(String(p.id), {
        name: p.name || 'Produto sem nome',
        cost_price: Number(p.cost_price) || 0,
        category: p.category || '',
      })
    })

    const aggregation: Record<
      string,
      {
        productId: string
        name: string
        quantity: number
        costPrice: number // custo médio ponderado no período
        totalCost: number
        totalValue: number
        totalDiscount: number
        profit: number
      }
    > = {}

    items.forEach((item: any) => {
      const prodId = String(item.product_id)
      if (!productsMap.has(prodId)) return

      const prodInfo = productsMap.get(prodId)!
      const quantity = Number(item.quantity) || 0
      const unitPrice = Number(item.unit_price) || 0
      const unitCost = effectiveUnitCost(item.cost_price, prodInfo.cost_price)

      const originalValue = quantity * unitPrice
      const actualValue = Number(item.subtotal ?? item.total_price ?? originalValue)
      const discount = Math.max(0, originalValue - actualValue)

      if (!aggregation[prodId]) {
        aggregation[prodId] = {
          productId: prodId,
          name: prodInfo.name,
          quantity: 0,
          costPrice: 0,
          totalCost: 0,
          totalValue: 0,
          totalDiscount: 0,
          profit: 0,
        }
      }

      const agg = aggregation[prodId]
      agg.quantity += quantity
      agg.totalCost += quantity * unitCost
      agg.totalValue += actualValue
      agg.totalDiscount += discount
      // Custo médio ponderado das vendas do período (histórico)
      agg.costPrice = agg.quantity > 0 ? agg.totalCost / agg.quantity : unitCost
      agg.profit = agg.totalValue - agg.totalCost
    })

    const aggregatedList = Object.values(aggregation).sort((a, b) => b.totalValue - a.totalValue)

    let grandQuantity = 0
    let grandCost = 0
    let grandValue = 0
    let grandDiscount = 0
    let grandProfit = 0

    aggregatedList.forEach((item) => {
      grandQuantity += item.quantity
      grandCost += item.totalCost
      grandValue += item.totalValue
      grandDiscount += item.totalDiscount
      grandProfit += item.profit
      item.costPrice = Number(item.costPrice.toFixed(4))
      item.totalCost = Number(item.totalCost.toFixed(2))
      item.totalValue = Number(item.totalValue.toFixed(2))
      item.totalDiscount = Number(item.totalDiscount.toFixed(2))
      item.profit = Number(item.profit.toFixed(2))
    })

    return NextResponse.json({
      totals: {
        quantity: grandQuantity,
        cost: Number(grandCost.toFixed(2)),
        value: Number(grandValue.toFixed(2)),
        discount: Number(grandDiscount.toFixed(2)),
        profit: Number(grandProfit.toFixed(2)),
      },
      products: aggregatedList,
    })
  } catch (error) {
    console.error('❌ Erro interno no relatório de produtos vendidos:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const GET = requestMiddleware(handler, false)
