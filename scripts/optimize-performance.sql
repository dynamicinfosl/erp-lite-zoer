-- =============================================
-- OPTIMIZE DATABASE PERFORMANCE
-- =============================================
-- Este script otimiza a performance do banco de dados
-- para o sistema multi-tenant

-- 1. ÍNDICES PARA PERFORMANCE
-- =============================================

-- Índices para user_memberships (crítico para RLS)
CREATE INDEX IF NOT EXISTS idx_user_memberships_user_id_active 
ON public.user_memberships(user_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_memberships_tenant_id_active 
ON public.user_memberships(tenant_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_user_memberships_user_tenant_role 
ON public.user_memberships(user_id, tenant_id, role, is_active);

-- Índices para customers
CREATE INDEX IF NOT EXISTS idx_customers_tenant_id_active 
ON public.customers(tenant_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_customers_tenant_created 
ON public.customers(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_customers_email_tenant 
ON public.customers(email, tenant_id) 
WHERE email IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_customers_name_tenant 
ON public.customers(name, tenant_id);

-- Índices para products
CREATE INDEX IF NOT EXISTS idx_products_tenant_id_active 
ON public.products(tenant_id, is_active) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_tenant_created 
ON public.products(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_products_sku_tenant 
ON public.products(sku, tenant_id) 
WHERE sku IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_products_name_tenant 
ON public.products(name, tenant_id);

CREATE INDEX IF NOT EXISTS idx_products_category_tenant 
ON public.products(category, tenant_id) 
WHERE category IS NOT NULL;

-- Índices para sales
CREATE INDEX IF NOT EXISTS idx_sales_tenant_id_created 
ON public.sales(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_sales_tenant_status 
ON public.sales(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_sales_tenant_date 
ON public.sales(tenant_id, DATE(created_at));

-- Índices para sale_items
CREATE INDEX IF NOT EXISTS idx_sale_items_sale_id 
ON public.sale_items(sale_id);

CREATE INDEX IF NOT EXISTS idx_sale_items_product_id 
ON public.sale_items(product_id);

-- Índices para orders
CREATE INDEX IF NOT EXISTS idx_orders_tenant_id_created 
ON public.orders(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_status 
ON public.orders(tenant_id, status);

CREATE INDEX IF NOT EXISTS idx_orders_tenant_numero 
ON public.orders(tenant_id, numero);

-- Índices para deliveries
CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_id_created 
ON public.deliveries(tenant_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deliveries_tenant_status 
ON public.deliveries(tenant_id, status);

-- Índices para stock_movements
CREATE INDEX IF NOT EXISTS idx_stock_movements_product_id_created 
ON public.stock_movements(product_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_stock_movements_type_created 
ON public.stock_movements(movement_type, created_at DESC);

-- Índices para subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_tenant_id 
ON public.subscriptions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_status 
ON public.subscriptions(status);

-- 2. ÍNDICES PARCIAIS PARA QUERIES COMUNS
-- =============================================

-- Índices para dados ativos apenas
CREATE INDEX IF NOT EXISTS idx_customers_active_only 
ON public.customers(tenant_id, created_at DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_products_active_only 
ON public.products(tenant_id, created_at DESC) 
WHERE is_active = true;

-- Índices para vendas de hoje
CREATE INDEX IF NOT EXISTS idx_sales_today 
ON public.sales(tenant_id, created_at DESC) 
WHERE DATE(created_at) = CURRENT_DATE;

-- Índices para ordens em aberto
CREATE INDEX IF NOT EXISTS idx_orders_open 
ON public.orders(tenant_id, created_at DESC) 
WHERE status IN ('aberta', 'em_andamento');

-- 3. ESTATÍSTICAS E ANÁLISE
-- =============================================

-- Atualizar estatísticas das tabelas
ANALYZE public.user_memberships;
ANALYZE public.customers;
ANALYZE public.products;
ANALYZE public.sales;
ANALYZE public.sale_items;
ANALYZE public.orders;
ANALYZE public.deliveries;
ANALYZE public.stock_movements;
ANALYZE public.subscriptions;

-- 4. CONFIGURAÇÕES DE PERFORMANCE
-- =============================================

-- Configurações recomendadas para PostgreSQL (execute como superuser)
-- ALTER SYSTEM SET shared_preload_libraries = 'pg_stat_statements';
-- ALTER SYSTEM SET track_activity_query_size = 2048;
-- ALTER SYSTEM SET pg_stat_statements.track = 'all';
-- ALTER SYSTEM SET effective_cache_size = '4GB';
-- ALTER SYSTEM SET shared_buffers = '1GB';
-- ALTER SYSTEM SET work_mem = '64MB';
-- ALTER SYSTEM SET maintenance_work_mem = '256MB';

-- 5. VIEWS PARA PERFORMANCE
-- =============================================

-- View para dados do dashboard (otimizada)
CREATE OR REPLACE VIEW public.dashboard_stats AS
SELECT 
  t.id as tenant_id,
  t.name as tenant_name,
  COUNT(DISTINCT c.id) as total_customers,
  COUNT(DISTINCT CASE WHEN c.is_active THEN c.id END) as active_customers,
  COUNT(DISTINCT p.id) as total_products,
  COUNT(DISTINCT CASE WHEN p.is_active THEN p.id END) as active_products,
  COUNT(DISTINCT s.id) as total_sales,
  COALESCE(SUM(s.total_amount), 0) as total_revenue,
  COUNT(DISTINCT CASE WHEN DATE(s.created_at) = CURRENT_DATE THEN s.id END) as today_sales,
  COUNT(DISTINCT CASE WHEN o.status IN ('aberta', 'em_andamento') THEN o.id END) as open_orders
FROM public.tenants t
LEFT JOIN public.customers c ON c.tenant_id = t.id
LEFT JOIN public.products p ON p.tenant_id = t.id
LEFT JOIN public.sales s ON s.tenant_id = t.id
LEFT JOIN public.orders o ON o.tenant_id = t.id
GROUP BY t.id, t.name;

-- View para produtos com estoque baixo
CREATE OR REPLACE VIEW public.low_stock_products AS
SELECT 
  p.id,
  p.tenant_id,
  p.name,
  p.sku,
  p.stock_quantity,
  p.sale_price,
  t.name as tenant_name
FROM public.products p
JOIN public.tenants t ON t.id = p.tenant_id
WHERE p.is_active = true 
AND p.stock_quantity <= 5;

-- 6. FUNÇÕES OTIMIZADAS
-- =============================================

-- Função para obter tenant_id do usuário (com cache)
CREATE OR REPLACE FUNCTION public.get_user_tenant_id(user_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  tenant_uuid UUID;
BEGIN
  SELECT tenant_id INTO tenant_uuid
  FROM public.user_memberships
  WHERE user_id = user_uuid 
  AND is_active = true
  LIMIT 1;
  
  RETURN tenant_uuid;
END;
$$;

-- Função para verificar se usuário é superadmin
CREATE OR REPLACE FUNCTION public.is_user_superadmin(user_uuid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
  is_admin BOOLEAN := FALSE;
BEGIN
  SELECT EXISTS(
    SELECT 1 
    FROM public.user_memberships 
    WHERE user_id = user_uuid 
    AND role = 'superadmin'
    AND is_active = true
  ) INTO is_admin;
  
  RETURN is_admin;
END;
$$;

-- 7. MONITORAMENTO DE PERFORMANCE
-- =============================================

-- Query para verificar índices não utilizados
CREATE OR REPLACE VIEW public.unused_indexes AS
SELECT 
  schemaname,
  tablename,
  indexname,
  idx_scan,
  idx_tup_read,
  idx_tup_fetch
FROM pg_stat_user_indexes 
WHERE idx_scan = 0
AND schemaname = 'public'
ORDER BY tablename, indexname;

-- Query para verificar queries lentas
CREATE OR REPLACE VIEW public.slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  rows
FROM pg_stat_statements 
WHERE mean_time > 1000 -- queries que demoram mais de 1 segundo em média
ORDER BY mean_time DESC
LIMIT 20;

-- 8. LIMPEZA E MANUTENÇÃO
-- =============================================

-- Função para limpar dados antigos (manter apenas últimos 2 anos)
CREATE OR REPLACE FUNCTION public.cleanup_old_data()
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  -- Limpar logs antigos (se existir tabela de logs)
  -- DELETE FROM audit_logs WHERE created_at < NOW() - INTERVAL '2 years';
  
  -- Vacuum e analyze
  VACUUM ANALYZE public.customers;
  VACUUM ANALYZE public.products;
  VACUUM ANALYZE public.sales;
  VACUUM ANALYZE public.orders;
  VACUUM ANALYZE public.deliveries;
  VACUUM ANALYZE public.stock_movements;
  
  RAISE NOTICE 'Limpeza de dados antigos concluída';
END;
$$;

-- 9. VERIFICAÇÃO FINAL
-- =============================================

-- Verificar índices criados
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
ORDER BY tablename, indexname;

-- Verificar tamanho das tabelas
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as size
FROM pg_tables 
WHERE schemaname = 'public'
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- =============================================
-- FIM DO SCRIPT DE OTIMIZAÇÃO
-- =============================================

-- RECOMENDAÇÕES:
-- 1. Execute este script em horário de baixo tráfego
-- 2. Monitore performance após aplicar as otimizações
-- 3. Execute ANALYZE regularmente (semanalmente)
-- 4. Monitore o uso de índices com unused_indexes
-- 5. Ajuste configurações do PostgreSQL conforme necessário

