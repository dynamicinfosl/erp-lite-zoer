const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkDataLeakage() {
  try {
    console.log('🔍 VERIFICANDO VAZAMENTO DE DADOS');
    console.log('=================================\n');
    
    const targetTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    
    // 1. Verificar produtos do tenant específico
    console.log(`📦 PRODUTOS DO TENANT ${targetTenantId}`);
    console.log('=====================================');
    
    const { data: tenantProducts, error: tenantProductsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    if (tenantProductsError) {
      console.log('❌ Erro ao buscar produtos do tenant:', tenantProductsError.message);
    } else {
      console.log(`✅ Produtos do tenant: ${tenantProducts?.length || 0}`);
      tenantProducts?.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (tenant: ${product.tenant_id})`);
      });
    }
    
    // 2. Verificar produtos de outros tenants
    console.log('\n📦 PRODUTOS DE OUTROS TENANTS');
    console.log('=============================');
    
    const { data: otherProducts, error: otherProductsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .neq('tenant_id', targetTenantId)
      .limit(10);
    
    if (otherProductsError) {
      console.log('❌ Erro ao buscar produtos de outros tenants:', otherProductsError.message);
    } else {
      console.log(`📊 Produtos de outros tenants: ${otherProducts?.length || 0}`);
      otherProducts?.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (tenant: ${product.tenant_id})`);
      });
    }
    
    // 3. Verificar vendas do tenant específico
    console.log(`\n💰 VENDAS DO TENANT ${targetTenantId}`);
    console.log('=====================================');
    
    const { data: tenantSales, error: tenantSalesError } = await supabase
      .from('sales')
      .select('id, total_amount, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    if (tenantSalesError) {
      console.log('❌ Erro ao buscar vendas do tenant:', tenantSalesError.message);
    } else {
      console.log(`✅ Vendas do tenant: ${tenantSales?.length || 0}`);
      tenantSales?.forEach((sale, index) => {
        console.log(`  ${index + 1}. Venda ${sale.id} - R$ ${sale.total_amount} (tenant: ${sale.tenant_id})`);
      });
    }
    
    // 4. Verificar vendas de outros tenants
    console.log('\n💰 VENDAS DE OUTROS TENANTS');
    console.log('============================');
    
    const { data: otherSales, error: otherSalesError } = await supabase
      .from('sales')
      .select('id, total_amount, tenant_id')
      .neq('tenant_id', targetTenantId)
      .limit(10);
    
    if (otherSalesError) {
      console.log('❌ Erro ao buscar vendas de outros tenants:', otherSalesError.message);
    } else {
      console.log(`📊 Vendas de outros tenants: ${otherSales?.length || 0}`);
      otherSales?.forEach((sale, index) => {
        console.log(`  ${index + 1}. Venda ${sale.id} - R$ ${sale.total_amount} (tenant: ${sale.tenant_id})`);
      });
    }
    
    // 5. Verificar transações financeiras
    console.log(`\n💳 TRANSAÇÕES FINANCEIRAS DO TENANT ${targetTenantId}`);
    console.log('==================================================');
    
    const { data: tenantTransactions, error: tenantTransactionsError } = await supabase
      .from('financial_transactions')
      .select('id, amount, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    if (tenantTransactionsError) {
      console.log('❌ Erro ao buscar transações do tenant:', tenantTransactionsError.message);
    } else {
      console.log(`✅ Transações do tenant: ${tenantTransactions?.length || 0}`);
      tenantTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. Transação ${transaction.id} - R$ ${transaction.amount} (tenant: ${transaction.tenant_id})`);
      });
    }
    
    // 6. Verificar transações de outros tenants
    console.log('\n💳 TRANSAÇÕES DE OUTROS TENANTS');
    console.log('=================================');
    
    const { data: otherTransactions, error: otherTransactionsError } = await supabase
      .from('financial_transactions')
      .select('id, amount, tenant_id')
      .neq('tenant_id', targetTenantId)
      .limit(10);
    
    if (otherTransactionsError) {
      console.log('❌ Erro ao buscar transações de outros tenants:', otherTransactionsError.message);
    } else {
      console.log(`📊 Transações de outros tenants: ${otherTransactions?.length || 0}`);
      otherTransactions?.forEach((transaction, index) => {
        console.log(`  ${index + 1}. Transação ${transaction.id} - R$ ${transaction.amount} (tenant: ${transaction.tenant_id})`);
      });
    }
    
    console.log('\n🎯 RESUMO DO ISOLAMENTO');
    console.log('=======================');
    console.log(`✅ Produtos do tenant: ${tenantProducts?.length || 0}`);
    console.log(`📊 Produtos de outros tenants: ${otherProducts?.length || 0}`);
    console.log(`✅ Vendas do tenant: ${tenantSales?.length || 0}`);
    console.log(`📊 Vendas de outros tenants: ${otherSales?.length || 0}`);
    console.log(`✅ Transações do tenant: ${tenantTransactions?.length || 0}`);
    console.log(`📊 Transações de outros tenants: ${otherTransactions?.length || 0}`);
    
    if ((otherProducts?.length || 0) > 0 || (otherSales?.length || 0) > 0 || (otherTransactions?.length || 0) > 0) {
      console.log('\n⚠️ ATENÇÃO: Existem dados de outros tenants no sistema!');
      console.log('💡 Isso pode estar causando o problema de dados cruzados');
    } else {
      console.log('\n✅ Isolamento de dados está funcionando corretamente');
    }
    
  } catch (error) {
    console.error('❌ Erro no script:', error);
  }
}

checkDataLeakage().catch(console.error);
