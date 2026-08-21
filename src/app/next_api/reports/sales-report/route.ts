import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requestMiddleware } from '@/lib/api-utils'
import { effectiveUnitCost } from '@/lib/sale-calculations'
import { fetchAllPaged, fetchAllByIds } from '@/lib/report-queries'

const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co'
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10'

const PAYMENT_LABELS: Record<string, string> = {
  dinheiro: 'Dinheiro à Vista',
  pix: 'PIX',
  cartao_debito: 'Cartão Débito',
  cartao_credito: 'Cartão Crédito',
  fiado: 'A Prazo',
  a_prazo: 'A Prazo',
  boleto: 'Boleto Bancário',
  boleto_bancario: 'Boleto Bancário',
  transferencia: 'Transferência Bancária',
  outros: 'Outros',
}

function statusLabel(status: string | null | undefined): string {
  const s = (status || '').toLowerCase()
  if (!s || s === 'finalizada' || s === 'paga' || s === 'concluida' || s === 'concretizada') {
    return 'Concretizada'
  }
  if (s === 'canceled' || s === 'cancelada') return 'Cancelada'
  if (s === 'pendente') return 'Pendente'
  return status || 'Concretizada'
}

async function handler(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const tenantId = searchParams.get('tenant_id') || ''
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const deliveryStart = searchParams.get('delivery_start') || ''
  const deliveryEnd = searchParams.get('delivery_end') || ''
  const user_id = searchParams.get('user_id') || ''
  const branch_id = searchParams.get('branch_id') || ''
  const customer_id = searchParams.get('customer_id') || ''
  const customer_name = searchParams.get('customer_name') || ''
  const product_id = searchParams.get('product_id') || ''
  const payment_method = searchParams.get('payment_method') || ''
  const sale_type = searchParams.get('sale_type') || ''
  const sale_source = searchParams.get('sale_source') || ''
  const situation = searchParams.get('situation') || ''
  const carrier_name = searchParams.get('carrier_name') || ''
  const exclude_api = searchParams.get('exclude_api') === 'true'

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)
  const filterByProduct = Boolean(product_id && product_id !== 'all')

  try {
    let salesQuery = supabase
      .from('sales')
      .select(`
        id,
        sale_number,
        total_amount,
        final_amount,
        discount_amount,
        payment_method,
        sale_type,
        sale_source,
        status,
        created_at,
        delivery_date,
        carrier_name,
        customer_id,
        customer_name,
        user_id,
        branch_id,
        seller_name
      `)
      .eq('tenant_id', tenantId)

    if (situation && situation !== 'all') {
      if (situation === 'cancelada') {
        salesQuery = salesQuery.or('status.eq.canceled,status.eq.cancelada')
      } else if (situation === 'concluida') {
        salesQuery = salesQuery.or('status.is.null,and(status.neq.canceled,status.neq.cancelada)')
      } else if (situation === 'pendente') {
        salesQuery = salesQuery.eq('status', 'pendente')
      } else {
        salesQuery = salesQuery.eq('status', situation)
      }
    } else {
      salesQuery = salesQuery.or('status.is.null,and(status.neq.canceled,status.neq.cancelada)')
    }

    if (user_id && user_id.trim() !== '' && user_id !== 'all') {
      salesQuery = salesQuery.eq('user_id', user_id.trim())
    }

    if (branch_id && branch_id.trim() !== '' && branch_id !== 'all') {
      salesQuery = salesQuery.eq('branch_id', branch_id.trim())
    }

    if (customer_id && customer_id.trim() !== '' && customer_id !== 'all') {
      salesQuery = salesQuery.eq('customer_id', customer_id.trim())
    }

    if (customer_name && customer_name.trim() !== '') {
      salesQuery = salesQuery.ilike('customer_name', `%${customer_name.trim()}%`)
    }

    if (payment_method && payment_method !== 'all') {
      salesQuery = salesQuery.eq('payment_method', payment_method)
    }

    if (sale_type && sale_type !== 'all') {
      salesQuery = salesQuery.eq('sale_type', sale_type)
    }

    if (exclude_api) {
      salesQuery = salesQuery.or('sale_source.is.null,sale_source.neq.api')
    } else if (sale_source && sale_source !== 'all') {
      salesQuery = salesQuery.eq('sale_source', sale_source)
    }

    if (carrier_name && carrier_name.trim() !== '') {
      salesQuery = salesQuery.ilike('carrier_name', `%${carrier_name.trim()}%`)
    }

    if (start) {
      const startISO = start.includes('T') ? start : `${start}T00:00:00.000Z`
      salesQuery = salesQuery.gte('created_at', startISO)
    }
    if (end) {
      const endISO = end.includes('T') ? end : `${end}T23:59:59.999Z`
      salesQuery = salesQuery.lte('created_at', endISO)
    }

    if (deliveryStart) {
      salesQuery = salesQuery.gte('delivery_date', deliveryStart)
    }
    if (deliveryEnd) {
      salesQuery = salesQuery.lte('delivery_date', deliveryEnd)
    }

    // Pagina até trazer o período inteiro: sem isso o PostgREST corta em 1000
    // vendas e o relatório mostra um faturamento menor que o real.
    // `id` entra como critério de desempate para as páginas não repetirem linhas.
    let salesRows: any[]
    try {
      salesRows = await fetchAllPaged(
        salesQuery.order('created_at', { ascending: false }).order('id', { ascending: false })
      )
    } catch (salesError: any) {
      console.error('❌ Erro ao buscar vendas:', salesError)
      return NextResponse.json({ error: salesError.message }, { status: 500 })
    }

    type ItemAgg = { cost: number; value: number; discount: number }
    const bySale: Record<string, ItemAgg> = {}

    if (salesRows.length > 0) {
      const saleIds = salesRows.map((r: any) => r.id)

      // Os ids vão em lotes: um `.in(...)` com milhares de ids estoura a URL,
      // e antes o erro era descartado (custo, lucro e desconto zeravam).
      let items: any[]
      try {
        items = await fetchAllByIds((ids) => {
          let q = supabase
            .from('sale_items')
            .select('sale_id, product_id, quantity, unit_price, subtotal, total_price, cost_price')
            .in('sale_id', ids)
            .order('id', { ascending: true })
          if (filterByProduct) q = q.eq('product_id', product_id)
          return q
        }, saleIds)
      } catch (itemsError: any) {
        console.error('❌ Erro ao buscar itens das vendas:', itemsError)
        return NextResponse.json({ error: itemsError.message }, { status: 500 })
      }

      if (filterByProduct) {
        const matchingSaleIds = new Set(items.map((i: any) => String(i.sale_id)))
        salesRows = salesRows.filter((s: any) => matchingSaleIds.has(String(s.id)))
      }

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

      const relevantSaleIds = new Set(salesRows.map((s: any) => String(s.id)))
      items.forEach((item: any) => {
        const saleId = String(item.sale_id)
        if (!relevantSaleIds.has(saleId)) return

        const qty = Number(item.quantity) || 0
        const unitCost = effectiveUnitCost(item.cost_price, costByProduct[String(item.product_id)])
        const originalValue = qty * (Number(item.unit_price) || 0)
        const actualValue = Number(item.subtotal ?? item.total_price ?? originalValue)
        const discount = Math.max(0, originalValue - actualValue)

        if (!bySale[saleId]) {
          bySale[saleId] = { cost: 0, value: 0, discount: 0 }
        }
        bySale[saleId].cost += unitCost * qty
        bySale[saleId].value += actualValue
        bySale[saleId].discount += discount
      })
    }

    let totalValue = 0
    let totalDiscount = 0
    let totalCost = 0
    const paymentAgg: Record<string, number> = {}

    const sales = salesRows.map((row: any) => {
      const saleId = String(row.id)
      const itemAgg = bySale[saleId] || { cost: 0, value: 0, discount: 0 }

      // Com filtro de produto: receita = subtotal dos itens filtrados (não a venda inteira)
      // Sem filtro: receita = final_amount da venda
      const value = filterByProduct
        ? itemAgg.value
        : Number(row.final_amount ?? row.total_amount ?? 0)

      const headerDiscount = Number(row.discount_amount) || 0
      const discount = filterByProduct
        ? itemAgg.discount
        : headerDiscount > 0
          ? headerDiscount
          : itemAgg.discount

      const cost = itemAgg.cost
      const method = row.payment_method || 'dinheiro'

      totalValue += value
      totalDiscount += discount
      totalCost += cost
      paymentAgg[method] = (paymentAgg[method] || 0) + value

      const dateStr = row.created_at
        ? new Date(row.created_at).toLocaleDateString('pt-BR')
        : '—'
      const deliveryStr = row.delivery_date
        ? new Date(
            row.delivery_date.includes('T')
              ? row.delivery_date
              : row.delivery_date + 'T12:00:00'
          ).toLocaleDateString('pt-BR')
        : dateStr

      return {
        id: row.id,
        saleNumber: row.sale_number || '',
        customerName: row.customer_name || 'Consumidor',
        date: dateStr,
        dateRaw: row.created_at,
        deliveryDate: deliveryStr,
        status: statusLabel(row.status),
        statusRaw: row.status,
        value: Number(value.toFixed(2)),
        cost: Number(cost.toFixed(2)),
        discount: Number(discount.toFixed(2)),
        profit: Number((value - cost).toFixed(2)),
        paymentMethod: method,
        paymentMethodLabel: PAYMENT_LABELS[method] || method.replace(/_/g, ' '),
        saleType: row.sale_type || 'balcao',
        saleSource: row.sale_source || 'pdv',
        channel:
          row.sale_source === 'produtos'
            ? 'Vendas de produtos'
            : row.sale_source === 'api'
              ? 'API'
              : 'PDV',
        sellerName: row.seller_name || '',
        carrierName: row.carrier_name || '',
      }
    })

    const salesCount = sales.length
    const totalProfit = totalValue - totalCost
    const profitMargin =
      totalValue > 0 ? Number(((totalProfit / totalValue) * 100).toFixed(2)) : 0
    const averageTicket =
      salesCount > 0 ? Number((totalValue / salesCount).toFixed(2)) : 0
    const freight = 0

    const paymentMethods = Object.entries(paymentAgg)
      .map(([method, amount]) => ({
        method,
        label: PAYMENT_LABELS[method] || method.replace(/_/g, ' '),
        amount: Number(amount.toFixed(2)),
      }))
      .sort((a, b) => b.amount - a.amount)

    return NextResponse.json({
      totals: {
        value: Number(totalValue.toFixed(2)),
        cost: Number(totalCost.toFixed(2)),
        discount: Number(totalDiscount.toFixed(2)),
        freight,
        profit: Number(totalProfit.toFixed(2)),
        margin: profitMargin,
        salesCount,
        averageTicket,
      },
      paymentMethods,
      sales,
    })
  } catch (error) {
    console.error('❌ Erro interno no relatório de vendas:', error)
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 })
  }
}

export const GET = requestMiddleware(handler, false)
