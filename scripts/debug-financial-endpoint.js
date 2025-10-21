const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function debugFinancialEndpoint() {
  try {
    console.log('🔍 DEBUG DO ENDPOINT FINANCEIRO');
    console.log('================================\n');
    
    const targetTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    
    // 1. Verificar estrutura da tabela
    console.log('📋 VERIFICANDO ESTRUTURA DA TABELA');
    console.log('==================================');
    
    const { data: tableInfo, error: tableError } = await supabase
      .from('financial_transactions')
      .select('*')
      .limit(1);
    
    if (tableError) {
      console.log('❌ Erro ao acessar tabela:', tableError.message);
    } else {
      console.log('✅ Tabela acessível');
      if (tableInfo && tableInfo.length > 0) {
        console.log('📊 Campos da tabela:', Object.keys(tableInfo[0]));
      }
    }
    
    // 2. Buscar transações com filtro de tenant
    console.log('\n🔍 BUSCANDO TRANSAÇÕES COM FILTRO DE TENANT');
    console.log('===========================================');
    
    const { data: tenantTransactions, error: tenantError } = await supabase
      .from('financial_transactions')
      .select('*')
      .eq('tenant_id', targetTenantId);
    
    if (tenantError) {
      console.log('❌ Erro ao buscar transações do tenant:', tenantError.message);
    } else {
      console.log(`✅ Transações encontradas: ${tenantTransactions?.length || 0}`);
      tenantTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. ${transaction.description} - R$ ${transaction.amount} (tenant: ${transaction.tenant_id})`);
      });
    }
    
    // 3. Buscar todas as transações para comparar
    console.log('\n📊 TODAS AS TRANSAÇÕES NO BANCO');
    console.log('=================================');
    
    const { data: allTransactions, error: allError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, tenant_id')
      .order('id', { ascending: false })
      .limit(10);
    
    if (allError) {
      console.log('❌ Erro ao buscar todas as transações:', allError.message);
    } else {
      console.log(`📊 Total de transações: ${allTransactions?.length || 0}`);
      allTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. ${transaction.description} - R$ ${transaction.amount} (tenant: ${transaction.tenant_id})`);
      });
    }
    
    // 4. Testar diferentes filtros
    console.log('\n🧪 TESTANDO DIFERENTES FILTROS');
    console.log('==============================');
    
    // Filtro por tenant_id exato
    const { data: exactFilter, error: exactError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    console.log(`🔍 Filtro exato (tenant_id = '${targetTenantId}'): ${exactFilter?.length || 0} resultados`);
    
    // Filtro por tenant_id diferente
    const { data: differentFilter, error: differentError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, tenant_id')
      .neq('tenant_id', targetTenantId);
    
    console.log(`🔍 Filtro diferente (tenant_id != '${targetTenantId}'): ${differentFilter?.length || 0} resultados`);
    
    // 5. Verificar se há problema de tipo de dados
    console.log('\n🔍 VERIFICANDO TIPOS DE DADOS');
    console.log('=============================');
    
    if (tenantTransactions && tenantTransactions.length > 0) {
      const firstTransaction = tenantTransactions[0];
      console.log('📊 Primeira transação encontrada:');
      console.log(`   ID: ${firstTransaction.id} (tipo: ${typeof firstTransaction.id})`);
      console.log(`   Tenant ID: ${firstTransaction.tenant_id} (tipo: ${typeof firstTransaction.tenant_id})`);
      console.log(`   Descrição: ${firstTransaction.description}`);
      console.log(`   Valor: ${firstTransaction.amount}`);
    } else {
      console.log('⚠️ Nenhuma transação encontrada para o tenant');
    }
    
    // 6. Testar endpoint diretamente
    console.log('\n🌐 TESTANDO ENDPOINT DIRETAMENTE');
    console.log('=================================');
    
    try {
      const response = await fetch(`http://localhost:3000/next_api/financial-transactions?tenant_id=${targetTenantId}`);
      console.log(`📡 Status da resposta: ${response.status}`);
      
      if (response.ok) {
        const data = await response.json();
        console.log(`📊 Dados retornados: ${data?.data?.length || 0} transações`);
        console.log(`📝 Estrutura da resposta:`, {
          success: data?.success,
          dataLength: data?.data?.length,
          hasData: !!data?.data
        });
      } else {
        const errorText = await response.text();
        console.log(`❌ Erro na resposta: ${errorText}`);
      }
    } catch (error) {
      console.log(`❌ Erro ao testar endpoint: ${error.message}`);
    }
    
    console.log('\n🎯 RESUMO DO DEBUG');
    console.log('==================');
    console.log(`✅ Transações no banco para tenant: ${tenantTransactions?.length || 0}`);
    console.log(`📊 Total de transações no banco: ${allTransactions?.length || 0}`);
    console.log(`🔍 Filtro exato funcionando: ${exactFilter?.length || 0} resultados`);
    
    if (tenantTransactions && tenantTransactions.length > 0) {
      console.log('\n✅ DADOS ENCONTRADOS NO BANCO!');
      console.log('💡 O problema pode estar no endpoint ou na consulta');
    } else {
      console.log('\n⚠️ NENHUM DADO ENCONTRADO NO BANCO');
      console.log('💡 Verifique se as transações foram criadas corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no debug:', error);
  }
}

debugFinancialEndpoint().catch(console.error);
