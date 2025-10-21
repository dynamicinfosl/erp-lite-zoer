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

  if (!tenantId) {
    return NextResponse.json({ error: 'tenant_id é obrigatório' }, { status: 400 })
  }

  console.log('📊 Gerando relatório de vendas para tenant:', tenantId);

  // Usar Supabase diretamente em vez de PostgREST
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    // Busca vendas com custo
    let query = supabase
      .from('sales')
      .select('id, total_amount, final_amount, created_at')
      .eq('tenant_id', tenantId);

    // Aplicar filtros de data se fornecidos
    if (start) {
      query = query.gte('created_at', start);
    }
    if (end) {
      query = query.lte('created_at', end);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) {
      console.error('❌ Erro ao buscar vendas:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const items = (data || []).map((row: any) => {
      const revenue = Number(row.final_amount || 0);
      const cost = Number(row.total_amount || 0);
      const profit = revenue - cost;
      return {
        id: row.id,
        date: row.created_at,
        revenue,
        cost,
        profit,
      };
    });

    const totalRevenue = items.reduce((s, i) => s + i.revenue, 0);
    const totalCost = items.reduce((s, i) => s + i.cost, 0);
    const totalProfit = totalRevenue - totalCost;
    const profitMargin = totalRevenue > 0 ? Number(((totalProfit / totalRevenue) * 100).toFixed(2)) : 0;

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


