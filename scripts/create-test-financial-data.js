const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createTestFinancialData() {
  try {
    console.log('💰 CRIANDO DADOS FINANCEIROS DE TESTE');
    console.log('====================================\n');
    
    const targetTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    
    // 1. Criar transações financeiras para o tenant atual
    console.log(`📝 Criando transações para tenant: ${targetTenantId}`);
    
    const testTransactions = [
      {
        user_id: '00000000-0000-0000-0000-000000000000', // UUID padrão
        tenant_id: targetTenantId,
        transaction_type: 'receita',
        category: 'Vendas',
        description: 'Venda de Notebook',
        amount: 2500.00,
        payment_method: 'PIX',
        due_date: new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0],
        status: 'pago',
        notes: 'Venda realizada com sucesso',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000', // UUID padrão
        tenant_id: targetTenantId,
        transaction_type: 'despesa',
        category: 'Fornecedores',
        description: 'Compra de materiais',
        amount: 800.00,
        payment_method: 'Cartão',
        due_date: new Date().toISOString().split('T')[0],
        paid_date: null,
        status: 'pendente',
        notes: 'Aguardando pagamento',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        user_id: '00000000-0000-0000-0000-000000000000', // UUID padrão
        tenant_id: targetTenantId,
        transaction_type: 'receita',
        category: 'Serviços',
        description: 'Consultoria técnica',
        amount: 1200.00,
        payment_method: 'Transferência',
        due_date: new Date().toISOString().split('T')[0],
        paid_date: new Date().toISOString().split('T')[0],
        status: 'pago',
        notes: 'Serviço concluído',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    console.log(`📊 Criando ${testTransactions.length} transações de teste...`);
    
    for (const transaction of testTransactions) {
      const { data, error } = await supabase
        .from('financial_transactions')
        .insert(transaction)
        .select()
        .single();
      
      if (error) {
        console.log(`❌ Erro ao criar transação "${transaction.description}":`, error.message);
      } else {
        console.log(`✅ Transação criada: ${transaction.description} - R$ ${transaction.amount}`);
      }
    }
    
    // 2. Verificar transações criadas
    console.log('\n🔍 VERIFICANDO TRANSAÇÕES CRIADAS');
    console.log('=================================');
    
    const { data: createdTransactions, error: checkError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    if (checkError) {
      console.log('❌ Erro ao verificar transações:', checkError.message);
    } else {
      console.log(`✅ Transações encontradas: ${createdTransactions?.length || 0}`);
      createdTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. ${transaction.description} - R$ ${transaction.amount} (ID: ${transaction.id})`);
      });
    }
    
    // 3. Testar endpoint com dados reais
    console.log('\n🧪 TESTANDO ENDPOINT COM DADOS REAIS');
    console.log('====================================');
    
    try {
      const response = await fetch(`http://localhost:3000/next_api/financial-transactions?tenant_id=${targetTenantId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint funcionando com dados reais');
        console.log(`📊 Transações retornadas: ${data?.data?.length || 0}`);
        if (data?.data && data.data.length > 0) {
          console.log('📝 Primeira transação:', {
            description: data.data[0].description,
            amount: data.data[0].amount,
            tenant_id: data.data[0].tenant_id
          });
        }
      } else {
        console.log('❌ Erro no endpoint:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Erro ao testar endpoint:', error.message);
    }
    
    // 4. Verificar isolamento
    console.log('\n🔒 VERIFICANDO ISOLAMENTO');
    console.log('=========================');
    
    const { data: otherTenantTransactions, error: otherError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, tenant_id')
      .neq('tenant_id', targetTenantId)
      .limit(5);
    
    if (otherError) {
      console.log('❌ Erro ao verificar outras transações:', otherError.message);
    } else {
      console.log(`📊 Transações de outros tenants: ${otherTenantTransactions?.length || 0}`);
      if (otherTenantTransactions && otherTenantTransactions.length > 0) {
        console.log('⚠️ ATENÇÃO: Existem transações de outros tenants:');
        otherTenantTransactions.forEach((transaction, index) => {
          console.log(`  ${index + 1}. ${transaction.description} - R$ ${transaction.amount} (tenant: ${transaction.tenant_id})`);
        });
      } else {
        console.log('✅ Nenhuma transação de outros tenants encontrada');
      }
    }
    
    console.log('\n🎯 RESUMO DO TESTE');
    console.log('==================');
    console.log(`✅ Transações criadas para tenant atual: ${createdTransactions?.length || 0}`);
    console.log(`📊 Transações de outros tenants: ${otherTenantTransactions?.length || 0}`);
    console.log(`🔒 Isolamento funcionando: ${(otherTenantTransactions?.length || 0) === 0 ? 'SIM' : 'NÃO'}`);
    
    if (createdTransactions && createdTransactions.length > 0) {
      console.log('\n🎉 DADOS FINANCEIROS DE TESTE CRIADOS COM SUCESSO!');
      console.log('💡 Agora você pode testar a seção financeiro no sistema');
      console.log('💡 Os dados devem aparecer isolados por tenant');
    }
    
  } catch (error) {
    console.error('❌ Erro no script:', error);
  }
}

createTestFinancialData().catch(console.error);
