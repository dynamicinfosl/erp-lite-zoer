const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testFinancialIsolation() {
  try {
    console.log('💰 TESTE DE ISOLAMENTO FINANCEIRO');
    console.log('=================================\n');
    
    const targetTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    
    // 1. Verificar transações financeiras do tenant específico
    console.log(`💳 TRANSAÇÕES DO TENANT ${targetTenantId}`);
    console.log('==========================================');
    
    const { data: tenantTransactions, error: tenantError } = await supabase
      .from('financial_transactions')
      .select('id, amount, tenant_id, description')
      .eq('tenant_id', targetTenantId);
    
    if (tenantError) {
      console.log('❌ Erro ao buscar transações do tenant:', tenantError.message);
    } else {
      console.log(`✅ Transações do tenant: ${tenantTransactions?.length || 0}`);
      tenantTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. R$ ${transaction.amount} - ${transaction.description} (tenant: ${transaction.tenant_id})`);
      });
    }
    
    // 2. Verificar transações de outros tenants
    console.log('\n💳 TRANSAÇÕES DE OUTROS TENANTS');
    console.log('===============================');
    
    const { data: otherTransactions, error: otherError } = await supabase
      .from('financial_transactions')
      .select('id, amount, tenant_id, description')
      .neq('tenant_id', targetTenantId)
      .limit(10);
    
    if (otherError) {
      console.log('❌ Erro ao buscar transações de outros tenants:', otherError.message);
    } else {
      console.log(`📊 Transações de outros tenants: ${otherTransactions?.length || 0}`);
      otherTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. R$ ${transaction.amount} - ${transaction.description} (tenant: ${transaction.tenant_id})`);
      });
    }
    
    // 3. Testar endpoint de transações financeiras
    console.log('\n🧪 TESTANDO ENDPOINT DE TRANSAÇÕES');
    console.log('==================================');
    
    try {
      const response = await fetch(`http://localhost:3000/next_api/financial-transactions?tenant_id=${targetTenantId}`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint funcionando');
        console.log(`📊 Transações retornadas: ${data?.data?.length || 0}`);
        if (data?.data && data.data.length > 0) {
          console.log('📝 Primeira transação:', data.data[0]);
        }
      } else {
        console.log('❌ Erro no endpoint:', response.status, response.statusText);
        const errorData = await response.text();
        console.log('📝 Erro:', errorData);
      }
    } catch (error) {
      console.log('❌ Erro ao testar endpoint:', error.message);
    }
    
    // 4. Verificar se há dados mockados sendo retornados
    console.log('\n🔍 VERIFICANDO DADOS MOCKADOS');
    console.log('=============================');
    
    if (tenantTransactions && tenantTransactions.length === 0) {
      console.log('⚠️ ATENÇÃO: Nenhuma transação real encontrada para o tenant');
      console.log('💡 O endpoint pode estar retornando dados mockados');
      console.log('💡 Verifique se o endpoint foi atualizado para usar dados reais');
    } else {
      console.log('✅ Dados reais encontrados no banco de dados');
    }
    
    // 5. Resumo do isolamento
    console.log('\n🎯 RESUMO DO ISOLAMENTO FINANCEIRO');
    console.log('==================================');
    console.log(`✅ Transações do tenant: ${tenantTransactions?.length || 0}`);
    console.log(`📊 Transações de outros tenants: ${otherTransactions?.length || 0}`);
    
    if ((otherTransactions?.length || 0) > 0) {
      console.log('\n⚠️ ATENÇÃO: Existem transações de outros tenants no sistema!');
      console.log('💡 Isso pode estar causando o problema de dados cruzados');
    } else {
      console.log('\n✅ Isolamento financeiro está funcionando corretamente');
    }
    
    if (tenantTransactions && tenantTransactions.length === 0) {
      console.log('\n💡 SUGESTÃO: Crie algumas transações financeiras para o tenant atual');
      console.log('💡 Isso ajudará a verificar se o isolamento está funcionando');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testFinancialIsolation().catch(console.error);
