const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenffdodr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRLS() {
  try {
    console.log('🔧 Corrigindo políticas RLS da tabela sale_items...');
    
    // 1. Verificar se RLS está habilitado
    console.log('📊 Verificando status RLS...');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('rowsecurity')
      .eq('tablename', 'sale_items');
    
    if (rlsError) {
      console.log('⚠️ Não foi possível verificar RLS via API, mas continuando...');
    } else {
      console.log('📊 Status RLS:', rlsStatus);
    }
    
    // 2. Tentar inserir um item de teste para verificar se RLS está bloqueando
    console.log('🧪 Testando inserção de item de venda...');
    
    const testItem = {
      sale_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
      tenant_id: '132b42a6-6355-4418-996e-de7eb33f6e34', // Tenant do usuário
      user_id: '132b42a6-6355-4418-996e-de7eb33f6e34', // User ID
      product_id: '00000000-0000-0000-0000-000000000000', // UUID de teste
      product_name: 'Teste RLS',
      unit_price: 10.00,
      quantity: 1,
      subtotal: 10.00,
      total_price: 10.00
    };
    
    const { data: testInsert, error: testError } = await supabase
      .from('sale_items')
      .insert(testItem)
      .select();
    
    if (testError) {
      console.log('❌ Erro ao inserir item de teste:', testError.message);
      console.log('🔍 Detalhes do erro:', {
        code: testError.code,
        details: testError.details,
        hint: testError.hint
      });
      
      if (testError.message.includes('row-level security policy')) {
        console.log('🚨 RLS está bloqueando inserções!');
        console.log('📋 Execute o script SQL manualmente no Supabase:');
        console.log('   1. Vá para SQL Editor no Supabase');
        console.log('   2. Execute o script: scripts/fix-sale-items-rls.sql');
        console.log('   3. Ou desabilite RLS temporariamente:');
        console.log('      ALTER TABLE sale_items DISABLE ROW LEVEL SECURITY;');
      }
    } else {
      console.log('✅ Inserção de teste funcionou!');
      
      // Deletar o item de teste
      await supabase
        .from('sale_items')
        .delete()
        .eq('sale_id', '00000000-0000-0000-0000-000000000000');
      
      console.log('🧹 Item de teste removido');
    }
    
  } catch (err) {
    console.error('❌ Erro:', err.message);
  }
}

fixRLS();
