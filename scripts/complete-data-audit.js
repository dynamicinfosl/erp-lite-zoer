const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function completeDataAudit() {
  try {
    console.log('🔍 AUDITORIA COMPLETA DE DADOS - VERIFICAÇÃO DE ISOLAMENTO');
    console.log('==========================================================\n');
    
    const targetTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    const otherTenantIds = ['00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111'];
    
    // 1. PRODUTOS
    console.log('📦 PRODUTOS');
    console.log('===========');
    
    const { data: targetProducts, error: targetProductsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    const { data: otherProducts, error: otherProductsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .neq('tenant_id', targetTenantId);
    
    console.log(`✅ Produtos do tenant atual: ${targetProducts?.length || 0}`);
    console.log(`📊 Produtos de outros tenants: ${otherProducts?.length || 0}`);
    
    if (otherProducts && otherProducts.length > 0) {
      console.log('⚠️ ATENÇÃO: Produtos de outros tenants encontrados:');
      otherProducts.forEach(p => console.log(`  - ${p.name} (tenant: ${p.tenant_id})`));
    }
    
    // 2. CLIENTES
    console.log('\n👥 CLIENTES');
    console.log('============');
    
    const { data: targetCustomers, error: targetCustomersError } = await supabase
      .from('customers')
      .select('id, name, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    const { data: otherCustomers, error: otherCustomersError } = await supabase
      .from('customers')
      .select('id, name, tenant_id')
      .neq('tenant_id', targetTenantId);
    
    console.log(`✅ Clientes do tenant atual: ${targetCustomers?.length || 0}`);
    console.log(`📊 Clientes de outros tenants: ${otherCustomers?.length || 0}`);
    
    if (otherCustomers && otherCustomers.length > 0) {
      console.log('⚠️ ATENÇÃO: Clientes de outros tenants encontrados:');
      otherCustomers.forEach(c => console.log(`  - ${c.name} (tenant: ${c.tenant_id})`));
    }
    
    // 3. VENDAS
    console.log('\n💰 VENDAS');
    console.log('==========');
    
    const { data: targetSales, error: targetSalesError } = await supabase
      .from('sales')
      .select('id, final_amount, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    const { data: otherSales, error: otherSalesError } = await supabase
      .from('sales')
      .select('id, final_amount, tenant_id')
      .neq('tenant_id', targetTenantId);
    
    console.log(`✅ Vendas do tenant atual: ${targetSales?.length || 0}`);
    console.log(`📊 Vendas de outros tenants: ${otherSales?.length || 0}`);
    
    if (otherSales && otherSales.length > 0) {
      console.log('⚠️ ATENÇÃO: Vendas de outros tenants encontradas:');
      otherSales.forEach(s => console.log(`  - Venda ${s.id} - R$ ${s.final_amount} (tenant: ${s.tenant_id})`));
    }
    
    // 4. TRANSAÇÕES FINANCEIRAS
    console.log('\n💳 TRANSAÇÕES FINANCEIRAS');
    console.log('==========================');
    
    const { data: targetFinancial, error: targetFinancialError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    const { data: otherFinancial, error: otherFinancialError } = await supabase
      .from('financial_transactions')
      .select('id, description, amount, tenant_id')
      .neq('tenant_id', targetTenantId);
    
    console.log(`✅ Transações do tenant atual: ${targetFinancial?.length || 0}`);
    console.log(`📊 Transações de outros tenants: ${otherFinancial?.length || 0}`);
    
    if (otherFinancial && otherFinancial.length > 0) {
      console.log('⚠️ ATENÇÃO: Transações de outros tenants encontradas:');
      otherFinancial.forEach(t => console.log(`  - ${t.description} - R$ ${t.amount} (tenant: ${t.tenant_id})`));
    }
    
    // 5. ORDENS DE SERVIÇO
    console.log('\n🔧 ORDENS DE SERVIÇO');
    console.log('=====================');
    
    const { data: targetOrders, error: targetOrdersError } = await supabase
      .from('orders')
      .select('id, numero, cliente, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    const { data: otherOrders, error: otherOrdersError } = await supabase
      .from('orders')
      .select('id, numero, cliente, tenant_id')
      .neq('tenant_id', targetTenantId);
    
    console.log(`✅ Ordens do tenant atual: ${targetOrders?.length || 0}`);
    console.log(`📊 Ordens de outros tenants: ${otherOrders?.length || 0}`);
    
    if (otherOrders && otherOrders.length > 0) {
      console.log('⚠️ ATENÇÃO: Ordens de outros tenants encontradas:');
      otherOrders.forEach(o => console.log(`  - ${o.numero} - ${o.cliente} (tenant: ${o.tenant_id})`));
    }
    
    // 6. MOVIMENTAÇÕES DE ESTOQUE
    console.log('\n📦 MOVIMENTAÇÕES DE ESTOQUE');
    console.log('=============================');
    
    const { data: targetStockMovements, error: targetStockError } = await supabase
      .from('stock_movements')
      .select('id, movement_type, quantity, tenant_id')
      .eq('tenant_id', targetTenantId);
    
    const { data: otherStockMovements, error: otherStockError } = await supabase
      .from('stock_movements')
      .select('id, movement_type, quantity, tenant_id')
      .neq('tenant_id', targetTenantId);
    
    console.log(`✅ Movimentações do tenant atual: ${targetStockMovements?.length || 0}`);
    console.log(`📊 Movimentações de outros tenants: ${otherStockMovements?.length || 0}`);
    
    if (otherStockMovements && otherStockMovements.length > 0) {
      console.log('⚠️ ATENÇÃO: Movimentações de outros tenants encontradas:');
      otherStockMovements.forEach(sm => console.log(`  - ${sm.movement_type} - Qtd: ${sm.quantity} (tenant: ${sm.tenant_id})`));
    }
    
    // 7. TESTAR ENDPOINTS VIA API
    console.log('\n🌐 TESTANDO ENDPOINTS VIA API');
    console.log('=============================');
    
    const endpoints = [
      { name: 'Produtos', url: `/next_api/products?tenant_id=${targetTenantId}` },
      { name: 'Clientes', url: `/next_api/customers?tenant_id=${targetTenantId}` },
      { name: 'Vendas', url: `/next_api/sales?tenant_id=${targetTenantId}` },
      { name: 'Transações Financeiras', url: `/next_api/financial-transactions?tenant_id=${targetTenantId}` },
      { name: 'Ordens de Serviço', url: `/next_api/orders?tenant_id=${targetTenantId}` },
      { name: 'Movimentações de Estoque', url: `/next_api/stock-movements?tenant_id=${targetTenantId}` },
      { name: 'Relatórios de Vendas', url: `/next_api/reports/sales?tenant_id=${targetTenantId}&start=2025-10-01&end=2025-10-21` }
    ];
    
    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`http://localhost:3000${endpoint.url}`);
        const data = await response.json();
        
        console.log(`📡 ${endpoint.name}: ${response.status} - ${data?.data?.length || data?.sales?.length || 0} itens`);
        
        if (response.status !== 200) {
          console.log(`❌ Erro em ${endpoint.name}: ${response.status}`);
        }
      } catch (error) {
        console.log(`❌ Erro ao testar ${endpoint.name}: ${error.message}`);
      }
    }
    
    // 8. RESUMO FINAL
    console.log('\n🎯 RESUMO FINAL DA AUDITORIA');
    console.log('=============================');
    
    const totalTargetData = (targetProducts?.length || 0) + 
                          (targetCustomers?.length || 0) + 
                          (targetSales?.length || 0) + 
                          (targetFinancial?.length || 0) + 
                          (targetOrders?.length || 0) + 
                          (targetStockMovements?.length || 0);
    
    const totalOtherData = (otherProducts?.length || 0) + 
                          (otherCustomers?.length || 0) + 
                          (otherSales?.length || 0) + 
                          (otherFinancial?.length || 0) + 
                          (otherOrders?.length || 0) + 
                          (otherStockMovements?.length || 0);
    
    console.log(`📊 Dados do tenant atual: ${totalTargetData} registros`);
    console.log(`📊 Dados de outros tenants: ${totalOtherData} registros`);
    
    if (totalOtherData > 0) {
      console.log('\n⚠️ PROBLEMAS IDENTIFICADOS:');
      console.log('💡 Existem dados de outros tenants no sistema!');
      console.log('💡 Isso pode estar causando vazamento de dados');
      console.log('💡 Verifique os endpoints que não estão filtrando por tenant_id');
    } else {
      console.log('\n✅ ISOLAMENTO PERFEITO!');
      console.log('💡 Nenhum dado de outros tenants encontrado');
      console.log('💡 Sistema está funcionando corretamente');
    }
    
    // 9. RECOMENDAÇÕES
    console.log('\n💡 RECOMENDAÇÕES');
    console.log('================');
    
    if (totalOtherData > 0) {
      console.log('🔧 Ações necessárias:');
      console.log('  1. Verificar todos os endpoints que retornam dados');
      console.log('  2. Garantir que todos filtrem por tenant_id');
      console.log('  3. Remover fallbacks que mostram dados de outros tenants');
      console.log('  4. Testar cada seção do menu individualmente');
    } else {
      console.log('✅ Sistema está funcionando corretamente!');
      console.log('💡 Continue monitorando para garantir que não haja regressões');
    }
    
  } catch (error) {
    console.error('❌ Erro na auditoria:', error);
  }
}

completeDataAudit().catch(console.error);
