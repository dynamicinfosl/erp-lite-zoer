// =============================================
// TESTE DE SEPARAÇÃO POR TENANTS
// =============================================
// Este script testa se as APIs estão separando dados por tenant corretamente

const testTenantSeparation = async () => {
  console.log('🧪 Testando separação por tenants...\n');

  // Testar diferentes tenant_ids
  const testTenants = [
    '00000000-0000-0000-0000-000000000000',
    '11111111-1111-1111-1111-111111111111',
    '22222222-2222-2222-2222-222222222222'
  ];

  for (const tenantId of testTenants) {
    console.log(`\n🔍 Testando tenant: ${tenantId}`);
    
    try {
      // Testar API de produtos
      const productsResponse = await fetch(`http://localhost:3000/next_api/products?tenant_id=${tenantId}`);
      const productsData = await productsResponse.json();
      console.log(`📦 Produtos para tenant ${tenantId}:`, productsData.data?.length || 0);

      // Testar API de clientes
      const customersResponse = await fetch(`http://localhost:3000/next_api/customers?tenant_id=${tenantId}`);
      const customersData = await customersResponse.json();
      console.log(`👥 Clientes para tenant ${tenantId}:`, customersData.data?.length || 0);

      // Testar API de vendas
      const salesResponse = await fetch(`http://localhost:3000/next_api/sales?tenant_id=${tenantId}`);
      const salesData = await salesResponse.json();
      console.log(`💰 Vendas para tenant ${tenantId}:`, salesData.data?.length || 0);

    } catch (error) {
      console.error(`❌ Erro ao testar tenant ${tenantId}:`, error.message);
    }
  }

  // Testar sem tenant_id
  console.log(`\n🔍 Testando sem tenant_id:`);
  try {
    const response = await fetch('http://localhost:3000/next_api/products');
    const data = await response.json();
    console.log(`📦 Produtos sem tenant_id:`, data.data?.length || 0);
  } catch (error) {
    console.error(`❌ Erro ao testar sem tenant_id:`, error.message);
  }

  console.log('\n✅ Teste de separação concluído!');
};

// Executar teste
testTenantSeparation().catch(console.error);



