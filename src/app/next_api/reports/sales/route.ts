import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requestMiddleware } from '@/lib/api-utils'

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

// Configurações hardcoded para garantir funcionamento
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

async function handler(request: NextRequest): Promise<Response> {
  const { searchParams } = request.nextUrl
  const tenantId = searchParams.get('tenant_id') || ''
  const start = searchParams.get('start') || ''
  const end = searchParams.get('end') || ''
  const user_id = searchParams.get('user_id') || ''

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 })
  }

  console.log('📊 Gerando relatório de vendas para tenant:', tenantId, user_id ? `operador: ${user_id}` : '');

  // Usar Supabase diretamente em vez de PostgREST
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Busca vendas com custo
    let query = supabase
      .from('sales')
      .select('id, total_amount, final_amount, created_at')
      .eq('tenant_id', tenantId);

    // Filtrar por operador (user_id) se fornecido
    if (user_id && user_id.trim() !== '') {
      query = query.eq('user_id', user_id.trim());
    }

    // Aplicar filtros de data se fornecidos (inclusive: start = início do dia, end = fim do dia)
    if (start) {
      const startISO = start.includes('T') ? start : `${start}T00:00:00.000Z`;
      query = query.gte('created_at', startISO);
    }
    if (end) {
      const endISO = end.includes('T') ? end : `${end}T23:59:59.999Z`;
      query = query.lte('created_at', endISO);
    }

    const { data: salesData, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar vendas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const salesRows = salesData || [];
    const totalRevenue = salesRows.reduce((s, row) => s + Number(row.final_amount || row.total_amount || 0), 0);

    // Custo real: soma (cost_price * quantity) dos itens das vendas (custo da mercadoria)
    let totalCost = 0;
    if (salesRows.length > 0) {
      const saleIds = salesRows.map((r: any) => r.id);
      const { data: itemsData } = await supabase
        .from('sale_items')
        .select('sale_id, product_id, quantity')
        .in('sale_id', saleIds);
      const items = itemsData || [];
      const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))] as string[];
      let costByProduct: Record<string, number> = {};
      if (productIds.length > 0) {
        const { data: productsData } = await supabase
          .from('products')
          .select('id, cost_price')
          .in('id', productIds)
          .eq('tenant_id', tenantId);
        (productsData || []).forEach((p: any) => {
          costByProduct[String(p.id)] = Number(p.cost_price) || 0;
        });
      }
      items.forEach((item: any) => {
        const costPrice = costByProduct[String(item.product_id)] ?? 0;
        totalCost += costPrice * Number(item.quantity || 0);
      });
    }

    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(2)) : 0;

    const items = salesRows.map((row: any) => {
      const revenue = Number(row.final_amount || row.total_amount || 0);
      return {
        id: row.id,
        date: row.created_at,
        revenue,
        cost: 0,
        profit: revenue,
      };
    });
    // Ajustar items com custo aproximado por venda (proporcional)
    const revSum = items.reduce((s, i) => s + i.revenue, 0);
    if (revSum > 0 && items.length > 0) {
      items.forEach((it) => {
        it.cost = Number((totalCost * (it.revenue / revSum)).toFixed(2));
        it.profit = it.revenue - it.cost;
      });
    }

    const summary: SalesSummary = {
      totalRevenue,
      totalCost,
      totalProfit,
      profitMargin,
      items,
    };

    console.log('✅ Relatório gerado:', summary);
    return NextResponse.json(summary);

  } catch (error) {
    console.error('❌ Erro no relatório:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = requestMiddleware(handler, false)


