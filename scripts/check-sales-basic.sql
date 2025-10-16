-- Script básico para verificar vendas
SELECT 
    'ESTRUTURA TABELA SALES' as info,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'sales' 
ORDER BY ordinal_position;

