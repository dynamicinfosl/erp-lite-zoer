const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testPlansTable() {
  console.log('🧪 Testando tabela plans...\n');

  try {
    // 1. Verificar se a tabela existe
    console.log('1️⃣ Verificando se a tabela plans existe...');
    
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_name', 'plans');

    if (tablesError) {
      console.error('❌ Erro ao verificar tabelas:', tablesError.message);
      return;
    }

    if (!tables || tables.length === 0) {
      console.error('❌ Tabela plans não encontrada!');
      console.log('Execute o script: scripts/fix-plans-table.sql');
      return;
    }

    console.log('✅ Tabela plans encontrada');

    // 2. Verificar estrutura da tabela
    console.log('\n2️⃣ Verificando estrutura da tabela...');
    
    const { data: columns, error: columnsError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable')
      .eq('table_schema', 'public')
      .eq('table_name', 'plans')
      .order('ordinal_position');

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError.message);
      return;
    }

    console.log('📋 Colunas da tabela plans:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // 3. Testar consulta básica
    console.log('\n3️⃣ Testando consulta básica...');
    
    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .order('price');

    if (plansError) {
      console.error('❌ Erro ao consultar planos:', plansError.message);
      return;
    }

    console.log(`✅ Consulta bem-sucedida! Encontrados ${plans.length} planos:`);
    plans.forEach(plan => {
      console.log(`  - ${plan.name}: R$ ${plan.price} (${plan.billing_cycle})`);
    });

    // 4. Testar inserção de um plano de teste
    console.log('\n4️⃣ Testando inserção de plano...');
    
    const testPlan = {
      name: 'Teste',
      description: 'Plano de teste',
      price: 9.90,
      billing_cycle: 'monthly',
      features: ['Teste 1', 'Teste 2'],
      max_users: 1,
      max_products: 10,
      max_customers: 100,
      is_active: true
    };

    const { data: newPlan, error: insertError } = await supabase
      .from('plans')
      .insert(testPlan)
      .select()
      .single();

    if (insertError) {
      console.error('❌ Erro ao inserir plano:', insertError.message);
      return;
    }

    console.log('✅ Plano de teste inserido:', newPlan.name);

    // 5. Limpar plano de teste
    console.log('\n5️⃣ Limpando plano de teste...');
    
    const { error: deleteError } = await supabase
      .from('plans')
      .delete()
      .eq('id', newPlan.id);

    if (deleteError) {
      console.error('❌ Erro ao deletar plano de teste:', deleteError.message);
    } else {
      console.log('✅ Plano de teste removido');
    }

    console.log('\n🎉 Teste da tabela plans realizado com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Acesse o painel admin: http://localhost:3000/admin');
    console.log('2. Vá para a aba "Planos"');
    console.log('3. Verifique se os planos estão sendo exibidos corretamente');

  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

testPlansTable();
