import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { requestMiddleware } from '@/lib/api-utils'

const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

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
  const situation = searchParams.get('situation') || '' // Concluída / Cancelada, etc.
  const exclude_api = searchParams.get('exclude_api') === 'true'

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // 1. Filtrar as vendas
    let salesQuery = supabase
      .from('sales')
      .select('id, total_amount, final_amount, created_at, user_id, branch_id, customer_id, status')
      .eq('tenant_id', tenantId);

    // Filtrar por situação
    if (situation) {
      if (situation === 'cancelada') {
        salesQuery = salesQuery.or('status.eq.canceled,status.eq.cancelada');
      } else if (situation === 'concluida') {
        salesQuery = salesQuery.or('status.is.null,and(status.neq.canceled,status.neq.cancelada)');
      } else {
        salesQuery = salesQuery.eq('status', situation);
      }
    } else {
      // Por padrão, exclui canceladas
      salesQuery = salesQuery.or('status.is.null,and(status.neq.canceled,status.neq.cancelada)');
    }

    if (user_id && user_id.trim() !== '') {
      salesQuery = salesQuery.eq('user_id', user_id.trim());
    }

    if (branch_id && branch_id.trim() !== '' && branch_id !== 'all') {
      salesQuery = salesQuery.eq('branch_id', branch_id.trim());
    }

    if (customer_id && customer_id.trim() !== '') {
      salesQuery = salesQuery.eq('customer_id', customer_id.trim());
    }

    if (exclude_api) {
      salesQuery = salesQuery.or('sale_source.is.null,sale_source.neq.api');
    }

    if (start) {
      const startISO = start.includes('T') ? start : `${start}T00:00:00.000Z`;
      salesQuery = salesQuery.gte('created_at', startISO);
    }
    if (end) {
      const endISO = end.includes('T') ? end : `${end}T23:59:59.999Z`;
      salesQuery = salesQuery.lte('created_at', endISO);
    }

    const { data: salesData, error: salesError } = await salesQuery;

    if (salesError) {
      console.error('❌ Erro ao buscar vendas para relatório:', salesError);
      return NextResponse.json({ error: salesError.message }, { status: 500 });
    }

    const salesRows = salesData || [];
    if (salesRows.length === 0) {
      return NextResponse.json({
        totals: { quantity: 0, cost: 0, value: 0, profit: 0 },
        products: []
      });
    }

    const saleIds = salesRows.map((r: any) => r.id);

    // 2. Buscar os itens das vendas
    let itemsQuery = supabase
      .from('sale_items')
      .select('sale_id, product_id, quantity, unit_price')
      .in('sale_id', saleIds);

    if (product_id && product_id.trim() !== '') {
      itemsQuery = itemsQuery.eq('product_id', product_id.trim());
    }

    const { data: itemsData, error: itemsError } = await itemsQuery;

    if (itemsError) {
      console.error('❌ Erro ao buscar itens de vendas:', itemsError);
      return NextResponse.json({ error: itemsError.message }, { status: 500 });
    }

    const items = itemsData || [];
    if (items.length === 0) {
      return NextResponse.json({
        totals: { quantity: 0, cost: 0, value: 0, profit: 0 },
        products: []
      });
    }

    // 3. Buscar informações dos produtos para obter nome, custo e categoria
    const productIds = [...new Set(items.map((i: any) => i.product_id).filter(Boolean))] as string[];
    
    let productsQuery = supabase
      .from('products')
      .select('id, name, cost_price, category')
      .in('id', productIds)
      .eq('tenant_id', tenantId);

    if (category && category.trim() !== '') {
      productsQuery = productsQuery.eq('category', category.trim());
    }

    const { data: productsData, error: productsError } = await productsQuery;

    if (productsError) {
      console.error('❌ Erro ao buscar produtos para detalhes:', productsError);
      return NextResponse.json({ error: productsError.message }, { status: 500 });
    }

    const productsList = productsData || [];
    const productsMap = new Map<string, { name: string; cost_price: number; category?: string }>();
    productsList.forEach((p: any) => {
      productsMap.set(String(p.id), {
        name: p.name || 'Produto sem nome',
        cost_price: Number(p.cost_price) || 0,
        category: p.category || ''
      });
    });

    // 4. Agregar dados por produto
    const aggregation: Record<string, {
      productId: string;
      name: string;
      quantity: number;
      costPrice: number; // preço de custo unitário do produto
      totalCost: number; // quantidade * costPrice
      totalValue: number; // quantidade * unit_price
      profit: number; // totalValue - totalCost
    }> = {};

    items.forEach((item: any) => {
      const prodId = String(item.product_id);
      
      // Se houver filtro de categoria e o produto não pertence a ela, ignorar
      if (!productsMap.has(prodId)) {
        return;
      }

      const prodInfo = productsMap.get(prodId)!;
      const quantity = Number(item.quantity) || 0;
      const unitPrice = Number(item.unit_price) || 0;
      const costPrice = prodInfo.cost_price;

      if (!aggregation[prodId]) {
        aggregation[prodId] = {
          productId: prodId,
          name: prodInfo.name,
          quantity: 0,
          costPrice: costPrice,
          totalCost: 0,
          totalValue: 0,
          profit: 0
        };
      }

      const agg = aggregation[prodId];
      agg.quantity += quantity;
      agg.totalCost += quantity * costPrice;
      agg.totalValue += quantity * unitPrice;
      agg.profit = agg.totalValue - agg.totalCost;
    });

    // Converter objeto de agregação em array e ordenar por valor total vendido (decrescente)
    const aggregatedList = Object.values(aggregation).sort((a, b) => b.totalValue - a.totalValue);

    // Calcular totais gerais
    let grandQuantity = 0;
    let grandCost = 0;
    let grandValue = 0;
    let grandProfit = 0;

    aggregatedList.forEach((item) => {
      grandQuantity += item.quantity;
      grandCost += item.totalCost;
      grandValue += item.totalValue;
      grandProfit += item.profit;
    });

    return NextResponse.json({
      totals: {
        quantity: grandQuantity,
        cost: grandCost,
        value: grandValue,
        profit: grandProfit
      },
      products: aggregatedList
    });

  } catch (error) {
    console.error('❌ Erro interno no relatório de produtos vendidos:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export const GET = requestMiddleware(handler, false)
