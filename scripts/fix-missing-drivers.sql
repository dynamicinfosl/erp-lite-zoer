-- ============================================
-- Script para corrigir entregadores ausentes
-- ============================================
-- Este script:
-- 1. Cria um entregador padrão se não houver nenhum
-- 2. Atualiza entregas e romaneios órfãos
-- ============================================

-- Primeiro, vamos verificar se há entregadores cadastrados
DO $$
DECLARE
  v_driver_count INTEGER;
  v_default_driver_id INTEGER;
  v_tenant_id UUID;
BEGIN
  -- Contar entregadores existentes
  SELECT COUNT(*) INTO v_driver_count FROM public.delivery_drivers;
  
  RAISE NOTICE '📊 Total de entregadores cadastrados: %', v_driver_count;
  
  -- Se não houver nenhum entregador, criar um padrão
  IF v_driver_count = 0 THEN
    RAISE NOTICE '⚠️  Nenhum entregador encontrado. Criando entregador padrão...';
    
    -- Pegar o primeiro tenant_id das entregas ou usar um UUID padrão
    SELECT DISTINCT tenant_id INTO v_tenant_id 
    FROM public.deliveries 
    WHERE tenant_id IS NOT NULL 
    LIMIT 1;
    
    IF v_tenant_id IS NULL THEN
      SELECT DISTINCT tenant_id INTO v_tenant_id 
      FROM public.delivery_manifests 
      WHERE tenant_id IS NOT NULL 
      LIMIT 1;
    END IF;
    
    -- Inserir entregador padrão
    INSERT INTO public.delivery_drivers (
      tenant_id,
      name,
      phone,
      vehicle_type,
      vehicle_plate,
      is_active,
      created_at,
      updated_at
    ) VALUES (
      v_tenant_id,
      'Entregador Padrão',
      '(00) 00000-0000',
      'moto',
      'AAA-0000',
      true,
      NOW(),
      NOW()
    )
    RETURNING id INTO v_default_driver_id;
    
    RAISE NOTICE '✅ Entregador padrão criado com ID: %', v_default_driver_id;
  ELSE
    -- Se já existem entregadores, pegar o ID do primeiro ativo
    SELECT id INTO v_default_driver_id 
    FROM public.delivery_drivers 
    WHERE is_active = true 
    ORDER BY id ASC 
    LIMIT 1;
    
    IF v_default_driver_id IS NULL THEN
      -- Se não houver entregadores ativos, pegar qualquer um
      SELECT id INTO v_default_driver_id 
      FROM public.delivery_drivers 
      ORDER BY id ASC 
      LIMIT 1;
    END IF;
    
    RAISE NOTICE '✅ Usando entregador existente com ID: %', v_default_driver_id;
  END IF;
  
  -- Atualizar entregas com driver_id inválido (órfãos)
  UPDATE public.deliveries d
  SET driver_id = v_default_driver_id,
      updated_at = NOW()
  WHERE d.driver_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.delivery_drivers dd 
      WHERE dd.id = d.driver_id
    );
  
  RAISE NOTICE '✅ % entregas atualizadas', (SELECT COUNT(*) FROM public.deliveries WHERE driver_id = v_default_driver_id);
  
  -- Atualizar romaneios com driver_id inválido (órfãos)
  UPDATE public.delivery_manifests dm
  SET driver_id = v_default_driver_id,
      updated_at = NOW()
  WHERE dm.driver_id IS NOT NULL
    AND NOT EXISTS (
      SELECT 1 FROM public.delivery_drivers dd 
      WHERE dd.id = dm.driver_id
    );
  
  RAISE NOTICE '✅ % romaneios atualizados', (SELECT COUNT(*) FROM public.delivery_manifests WHERE driver_id = v_default_driver_id);
  
END $$;

-- Mostrar resumo final
SELECT 
  'Entregadores cadastrados' as tipo,
  COUNT(*) as total
FROM public.delivery_drivers
UNION ALL
SELECT 
  'Entregas com entregador',
  COUNT(*)
FROM public.deliveries
WHERE driver_id IS NOT NULL
UNION ALL
SELECT 
  'Romaneios com entregador',
  COUNT(*)
FROM public.delivery_manifests
WHERE driver_id IS NOT NULL;

-- Listar entregadores
SELECT 
  id,
  name,
  phone,
  vehicle_type,
  vehicle_plate,
  is_active,
  tenant_id
FROM public.delivery_drivers
ORDER BY id;

RAISE NOTICE '✅ Script concluído com sucesso!';
