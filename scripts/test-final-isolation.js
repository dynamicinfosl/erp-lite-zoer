const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testTenantIsolation() {
  try {
    console.log('🧪 TESTE FINAL DE ISOLAMENTO DE TENANTS');
    console.log('=====================================\n');
    
    // Buscar o tenant do usuário joel@teste.com
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email')
      .eq('email', 'joel@teste.com')
      .limit(1);
    
    if (usersError || !users || users.length === 0) {
      console.log('❌ Usuário joel@teste.com não encontrado');
      return;
    }
    
    const user = users[0];
    console.log(`👤 Usuário encontrado: ${user.email} (ID: ${user.id})`);
    
    // Buscar membership do usuário
    const { data: membership, error: membershipError } = await supabase
      .from('user_memberships')
      .select('tenant_id')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single();
    
    if (membershipError || !membership) {
      console.log('❌ Membership não encontrado para o usuário');
      return;
    }
    
    const tenantId = membership.tenant_id;
    console.log(`🏢 Tenant ID: ${tenantId}`);
    
    // Testar isolamento de produtos
    console.log('\n📦 Testando isolamento de produtos...');
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .eq('tenant_id', tenantId);
    
    if (productsError) {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
    } else {
      console.log(`✅ Produtos do tenant: ${products?.length || 0}`);
      products?.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (tenant: ${product.tenant_id})`);
      });
    }
    
    // Testar isolamento de vendas
    console.log('\n💰 Testando isolamento de vendas...');
    const { data: sales, error: salesError } = await supabase
      .from('sales')
      .select('id, total_amount, tenant_id')
      .eq('tenant_id', tenantId);
    
    if (salesError) {
      console.log('❌ Erro ao buscar vendas:', salesError.message);
    } else {
      console.log(`✅ Vendas do tenant: ${sales?.length || 0}`);
      sales?.forEach((sale, index) => {
        console.log(`  ${index + 1}. Venda ${sale.id} - R$ ${sale.total_amount} (tenant: ${sale.tenant_id})`);
      });
    }
    
    // Verificar se há dados de outros tenants
    console.log('\n🔍 Verificando vazamento de dados...');
    const { data: allProducts, error: allProductsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .neq('tenant_id', tenantId)
      .limit(5);
    
    if (allProductsError) {
      console.log('❌ Erro ao buscar produtos de outros tenants:', allProductsError.message);
    } else {
      console.log(`📊 Produtos de outros tenants: ${allProducts?.length || 0}`);
      if (allProducts && allProducts.length > 0) {
        console.log('⚠️ ATENÇÃO: Existem produtos de outros tenants no sistema:');
        allProducts.forEach((product, index) => {
          console.log(`  ${index + 1}. ${product.name} (tenant: ${product.tenant_id})`);
        });
      } else {
        console.log('✅ Nenhum produto de outros tenants encontrado');
      }
    }
    
    // Testar endpoint de relatórios
    console.log('\n📊 Testando endpoint de relatórios...');
    try {
      const response = await fetch(`http://localhost:3000/next_api/reports/sales?tenant_id=${tenantId}&start=2025-01-01&end=2025-12-31`);
      if (response.ok) {
        const data = await response.json();
        console.log('✅ Endpoint de relatórios funcionando');
        console.log(`📈 Total de receita: R$ ${data.totalRevenue || 0}`);
        console.log(`📉 Total de custo: R$ ${data.totalCost || 0}`);
        console.log(`💰 Lucro: R$ ${data.totalProfit || 0}`);
      } else {
        console.log('❌ Erro no endpoint de relatórios:', response.status, response.statusText);
      }
    } catch (error) {
      console.log('❌ Erro ao testar endpoint de relatórios:', error.message);
    }
    
    console.log('\n🎉 Teste de isolamento concluído!');
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testTenantIsolation().catch(console.error);
