const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTenantIdColumn() {
  try {
    console.log('📝 Adicionando coluna tenant_id à tabela sale_items...');
    
    // SQL para adicionar a coluna tenant_id
    const sql = `
      -- Adicionar coluna tenant_id se não existir
      DO $$ 
      BEGIN
          IF NOT EXISTS (
              SELECT 1 
              FROM information_schema.columns 
              WHERE table_name = 'sale_items' 
              AND column_name = 'tenant_id'
          ) THEN
              ALTER TABLE sale_items ADD COLUMN tenant_id UUID;
              RAISE NOTICE 'Coluna tenant_id adicionada à tabela sale_items';
          ELSE
              RAISE NOTICE 'Coluna tenant_id já existe na tabela sale_items';
          END IF;
      END $$;
    `;
    
    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });
    
    if (error) {
      console.error('❌ Erro ao executar SQL:', error);
    } else {
      console.log('✅ SQL executado com sucesso');
    }
    
    // Verificar se a coluna foi adicionada
    console.log('🔍 Verificando se a coluna foi adicionada...');
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type')
      .eq('table_name', 'sale_items')
      .eq('column_name', 'tenant_id');
    
    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
    } else {
      console.log('📊 Colunas encontradas:', columns);
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

addTenantIdColumn();
