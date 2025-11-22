-- ============================================
-- CRIAR PLANOS BÁSICOS SE NÃO EXISTIREM
-- ============================================

-- Verificar se já existem planos
DO $$
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM plans WHERE is_active = true;
  
  IF plan_count = 0 THEN
    -- Criar planos básicos
    INSERT INTO plans (id, name, slug, description, price_monthly, price_yearly, features, limits, is_active, created_at, updated_at)
    VALUES
      -- Plano Básico
      (
        gen_random_uuid(),
        'Plano Básico',
        'basic',
        'Plano básico para pequenas empresas',
        29.90,
        299.00,
        '{"dashboard": true, "reports": true, "support": "email"}'::jsonb,
        '{"max_users": 3, "max_customers": 100, "max_products": 500, "max_sales_per_month": 1000}'::jsonb,
        true,
        NOW(),
        NOW()
      ),
      -- Plano Profissional
      (
        gen_random_uuid(),
        'Plano Profissional',
        'pro',
        'Plano profissional para empresas em crescimento',
        79.90,
        799.00,
        '{"dashboard": true, "reports": true, "advanced_reports": true, "support": "priority", "api_access": true}'::jsonb,
        '{"max_users": 10, "max_customers": 500, "max_products": 2000, "max_sales_per_month": 5000}'::jsonb,
        true,
        NOW(),
        NOW()
      ),
      -- Plano Enterprise
      (
        gen_random_uuid(),
        'Plano Enterprise',
        'enterprise',
        'Plano enterprise para grandes empresas',
        199.90,
        1999.00,
        '{"dashboard": true, "reports": true, "advanced_reports": true, "custom_reports": true, "support": "dedicated", "api_access": true, "white_label": true}'::jsonb,
        '{"max_users": -1, "max_customers": -1, "max_products": -1, "max_sales_per_month": -1}'::jsonb,
        true,
        NOW(),
        NOW()
      );
    
    RAISE NOTICE 'Planos básicos criados com sucesso!';
  ELSE
    RAISE NOTICE 'Já existem % planos ativos. Nenhum plano foi criado.', plan_count;
  END IF;
END $$;

-- Verificar planos criados
SELECT id, name, slug, price_monthly, is_active FROM plans WHERE is_active = true ORDER BY price_monthly;

