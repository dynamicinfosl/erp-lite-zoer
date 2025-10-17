export interface MonthlySalesPoint {
  month: string
  value: number
}

export interface ActiveUserRow {
  id: string
  name?: string | null
  email?: string | null
  lastActive: string
  role?: string | null
}

export interface TopProductRow {
  sku: string
  name: string
  sold: number
}

const hasSupabaseEnv = Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY)

// Import condicional do Supabase apenas quando necessário
const getSupabase = async () => {
  if (!hasSupabaseEnv) return null
  const { supabase } = await import('@/lib/supabase')
  return supabase
}

export async function getMonthlySales(tenantId?: string): Promise<MonthlySalesPoint[]> {
  if (!hasSupabaseEnv) {
    return [
      { month: 'Jan', value: 62 },
      { month: 'Fev', value: 70 },
      { month: 'Mar', value: 75 },
      { month: 'Abr', value: 80 },
      { month: 'Mai', value: 83 },
      { month: 'Jun', value: 89.5 },
    ]
  }

  try {
    const supabase = await getSupabase()
    if (!supabase) {
      return [
        { month: 'Jan', value: 62 },
        { month: 'Fev', value: 70 },
        { month: 'Mar', value: 75 },
        { month: 'Abr', value: 80 },
        { month: 'Mai', value: 83 },
        { month: 'Jun', value: 89.5 },
      ]
    }

    // Agrega vendas (sales.total) por mês do ano corrente
    const start = new Date(new Date().getFullYear(), 0, 1).toISOString()
    const { data, error } = await supabase
      .from('sales')
      .select('total, created_at, tenant_id')
      .gte('created_at', start)
      .maybeSingle()
    if (error && error.code !== 'PGRST116') throw error

    // Caso não haja single, refaça sem maybeSingle
    const { data: rows, error: err2 } = await supabase
      .from('sales')
      .select('total, created_at, tenant_id')
      .gte('created_at', start)
      .order('created_at', { ascending: true })
    if (err2) throw err2

    const map = new Map<string, number>()
    for (const r of rows || []) {
      if (tenantId && r.tenant_id !== tenantId) continue
      const d = new Date(r.created_at as string)
      const key = d.toLocaleString('pt-BR', { month: 'short' })
      map.set(key, (map.get(key) || 0) + Number(r.total || 0) / 1000) // milhares
    }
    const orderedMonths = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez']
    return orderedMonths
      .map((m) => ({ month: m.charAt(0).toUpperCase() + m.slice(1), value: Number((map.get(m) || 0).toFixed(2)) }))
      .filter((p) => p.value > 0)
  } catch (e) {
    // Fallback
    return [
      { month: 'Jan', value: 62 },
      { month: 'Fev', value: 70 },
      { month: 'Mar', value: 75 },
      { month: 'Abr', value: 80 },
      { month: 'Mai', value: 83 },
      { month: 'Jun', value: 89.5 },
    ]
  }
}

export async function getActiveUsers(limit = 10): Promise<ActiveUserRow[]> {
  if (!hasSupabaseEnv) {
    return [
      { id: 'u1', name: 'João Silva', email: 'joao@empresa.com', lastActive: 'há 5 min', role: 'admin' },
      { id: 'u2', name: 'Maria Souza', email: 'maria@empresa.com', lastActive: 'há 12 min', role: 'vendedor' },
      { id: 'u3', name: 'Paulo Lima', email: 'paulo@empresa.com', lastActive: 'há 18 min', role: 'financeiro' },
      { id: 'u4', name: 'Ana Costa', email: 'ana@empresa.com', lastActive: 'há 25 min', role: 'vendedor' },
    ]
  }
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      return [
        { id: 'u1', name: 'João Silva', email: 'joao@empresa.com', lastActive: 'há 5 min', role: 'admin' },
        { id: 'u2', name: 'Maria Souza', email: 'maria@empresa.com', lastActive: 'há 12 min', role: 'vendedor' },
        { id: 'u3', name: 'Paulo Lima', email: 'paulo@empresa.com', lastActive: 'há 18 min', role: 'financeiro' },
        { id: 'u4', name: 'Ana Costa', email: 'ana@empresa.com', lastActive: 'há 25 min', role: 'vendedor' },
      ]
    }

    // Exemplo: tabela "user_activity" com last_seen; ajuste conforme seu schema
    const { data, error } = await supabase
      .from('user_activity')
      .select('id, name, email, role, last_seen')
      .order('last_seen', { ascending: false })
      .limit(limit)
    if (error) throw error
    return (data || []).map((r: any) => ({
      id: String(r.id),
      name: r.name,
      email: r.email,
      role: r.role,
      lastActive: new Date(r.last_seen).toLocaleString('pt-BR'),
    }))
  } catch (e) {
    return [
      { id: 'u1', name: 'João Silva', email: 'joao@empresa.com', lastActive: 'há 5 min', role: 'admin' },
      { id: 'u2', name: 'Maria Souza', email: 'maria@empresa.com', lastActive: 'há 12 min', role: 'vendedor' },
      { id: 'u3', name: 'Paulo Lima', email: 'paulo@empresa.com', lastActive: 'há 18 min', role: 'financeiro' },
      { id: 'u4', name: 'Ana Costa', email: 'ana@empresa.com', lastActive: 'há 25 min', role: 'vendedor' },
    ]
  }
}

export async function getTopProducts(limit = 10): Promise<TopProductRow[]> {
  if (!hasSupabaseEnv) {
    return [
      { sku: 'BEV-010', name: 'Água Mineral 500ml', sold: 1240 },
      { sku: 'BEV-001', name: 'Cerveja Pilsen 350ml', sold: 980 },
      { sku: 'BEV-042', name: 'Refrigerante Cola 2L', sold: 760 },
      { sku: 'BEV-077', name: 'Energético 269ml', sold: 540 },
    ]
  }
  try {
    const supabase = await getSupabase()
    if (!supabase) {
      return [
        { sku: 'BEV-010', name: 'Água Mineral 500ml', sold: 1240 },
        { sku: 'BEV-001', name: 'Cerveja Pilsen 350ml', sold: 980 },
        { sku: 'BEV-042', name: 'Refrigerante Cola 2L', sold: 760 },
        { sku: 'BEV-077', name: 'Energético 269ml', sold: 540 },
      ]
    }

    // Agrega sale_items por produto
    const { data, error } = await supabase
      .from('sale_items')
      .select('quantity, product:products(sku, name)')
    if (error) throw error
    const map = new Map<string, { sku: string; name: string; sold: number }>()
    for (const r of data || []) {
      const product = Array.isArray(r.product) ? r.product[0] : r.product
      const sku = product?.sku || 'N/A'
      const name = product?.name || 'Produto'
      map.set(sku, { sku, name, sold: (map.get(sku)?.sold || 0) + Number(r.quantity || 0) })
    }
    const arr = Array.from(map.values()).sort((a, b) => b.sold - a.sold).slice(0, limit)
    return arr
  } catch (e) {
    return [
      { sku: 'BEV-010', name: 'Água Mineral 500ml', sold: 1240 },
      { sku: 'BEV-001', name: 'Cerveja Pilsen 350ml', sold: 980 },
      { sku: 'BEV-042', name: 'Refrigerante Cola 2L', sold: 760 },
      { sku: 'BEV-077', name: 'Energético 269ml', sold: 540 },
    ]
  }
}


