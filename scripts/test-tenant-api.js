// =============================================
// TESTE VIA API PARA VERIFICAR TENANTS
// =============================================
// Este script testa se as tabelas de tenants existem via API

const testTenantAPI = async () => {
  console.log('🧪 Testando estrutura de tenants via API...\n');

  try {
    // Testar se conseguimos acessar dados de produtos com diferentes tenant_ids
    console.log('1. Testando produtos com tenant_id zero:');
    const productsZero = await fetch('http://localhost:3000/next_api/products?tenant_id=00000000-0000-0000-0000-000000000000');
    const productsZeroData = await productsZero.json();
    console.log('   Resultado:', productsZeroData.data?.length || 0, 'produtos');

    console.log('2. Testando produtos com tenant_id real:');
    const productsReal = await fetch('http://localhost:3000/next_api/products?tenant_id=65d11970-ae36-4432-9aca-25c8db2b97a0');
    const productsRealData = await productsReal.json();
    console.log('   Resultado:', productsRealData.data?.length || 0, 'produtos');

    console.log('3. Testando clientes com tenant_id zero:');
    const customersZero = await fetch('http://localhost:3000/next_api/customers?tenant_id=00000000-0000-0000-0000-000000000000');
    const customersZeroData = await customersZero.json();
    console.log('   Resultado:', customersZeroData.data?.length || 0, 'clientes');

    console.log('4. Testando clientes com tenant_id real:');
    const customersReal = await fetch('http://localhost:3000/next_api/customers?tenant_id=65d11970-ae36-4432-9aca-25c8db2b97a0');
    const customersRealData = await customersReal.json();
    console.log('   Resultado:', customersRealData.data?.length || 0, 'clientes');

    console.log('5. Testando sem tenant_id:');
    const noTenant = await fetch('http://localhost:3000/next_api/products');
    const noTenantData = await noTenant.json();
    console.log('   Resultado:', noTenantData.data?.length || 0, 'produtos');

    console.log('\n📊 Resumo:');
    console.log(`   Produtos (tenant zero): ${productsZeroData.data?.length || 0}`);
    console.log(`   Produtos (tenant real): ${productsRealData.data?.length || 0}`);
    console.log(`   Clientes (tenant zero): ${customersZeroData.data?.length || 0}`);
    console.log(`   Clientes (tenant real): ${customersRealData.data?.length || 0}`);
    console.log(`   Produtos (sem tenant): ${noTenantData.data?.length || 0}`);

    if (productsRealData.data?.length > 0) {
      console.log('\n✅ Dados encontrados com tenant_id real!');
      console.log('   Primeiro produto:', productsRealData.data[0].name);
    }

    if (customersRealData.data?.length > 0) {
      console.log('\n✅ Clientes encontrados com tenant_id real!');
      console.log('   Primeiro cliente:', customersRealData.data[0].name);
    }

  } catch (error) {
    console.error('❌ Erro no teste:', error.message);
  }
};

// Executar teste
testTenantAPI().catch(console.error);



