-- =============================================
-- CRIAR TENANT DE TESTE
-- Execute este script no SQL Editor do Supabase
-- =============================================

-- 1. Inserir tenant de teste
INSERT INTO public.tenants (id, name, slug, status, trial_ends_at) VALUES
('00000000-0000-0000-0000-000000000000', 'Empresa Teste', 'empresa-teste', 'trial', NOW() + INTERVAL '30 days')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  slug = EXCLUDED.slug,
  status = EXCLUDED.status,
  trial_ends_at = EXCLUDED.trial_ends_at;

-- 2. Verificar se foi criado
SELECT * FROM public.tenants WHERE id = '00000000-0000-0000-0000-000000000000';
