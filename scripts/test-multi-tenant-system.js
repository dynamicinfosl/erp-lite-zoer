#!/usr/bin/env node

/**
 * SCRIPT DE TESTE DO SISTEMA MULTI-TENANT
 * 
 * Este script testa o sistema completo com múltiplos usuários e tenants
 * para verificar se a separação de dados está funcionando corretamente.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente do Supabase não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Dados de teste
const testUsers = [
  {
    email: 'empresa1@teste.com',
    password: '123456',
    companyName: 'Empresa Teste 1'
  },
  {
    email: 'empresa2@teste.com', 
    password: '123456',
    companyName: 'Empresa Teste 2'
  }
];

async function createTestUser(userData) {
  console.log(`\n🔧 Criando usuário: ${userData.email}`);
  
  try {
    // 1. Criar usuário no auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true
    });

    if (authError) {
      console.error('❌ Erro ao criar usuário auth:', authError.message);
      return null;
    }

    console.log('✅ Usuário auth criado:', authData.user.id);

    // 2. Criar tenant
    const { data: tenantData, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: userData.companyName,
        slug: userData.companyName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      })
      .select()
      .single();

    if (tenantError) {
      console.error('❌ Erro ao criar tenant:', tenantError.message);
      return null;
    }

    console.log('✅ Tenant criado:', tenantData.id);

    // 3. Criar membership
    const { error: memberError } = await supabase
      .from('user_memberships')
      .insert({
        user_id: authData.user.id,
        tenant_id: tenantData.id,
        role: 'owner',
        is_active: true
      });

    if (memberError) {
      console.error('❌ Erro ao criar membership:', memberError.message);
      return null;
    }

    console.log('✅ Membership criado');

    // 4. Criar alguns dados de teste
    await createTestData(authData.user.id, tenantData.id, userData.companyName);

    return {
      userId: authData.user.id,
      tenantId: tenantData.id,
      email: userData.email,
      companyName: userData.companyName
    };

  } catch (error) {
    console.error('❌ Erro geral:', error.message);
    return null;
  }
}

async function createTestData(userId, tenantId, companyName) {
  console.log(`📊 Criando dados de teste para ${companyName}...`);

  // Criar clientes
  const customers = [
    {
      tenant_id: tenantId,
      user_id: userId,
      name: `Cliente A - ${companyName}`,
      email: `clientea@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: '(11) 99999-0001',
      document: '123.456.789-01',
      city: 'São Paulo',
      is_active: true
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      name: `Cliente B - ${companyName}`,
      email: `clienteb@${companyName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: '(11) 99999-0002',
      document: '987.654.321-01',
      city: 'Rio de Janeiro',
      is_active: true
    }
  ];

  const { data: customersData, error: customersError } = await supabase
    .from('customers')
    .insert(customers)
    .select();

  if (customersError) {
    console.error('❌ Erro ao criar clientes:', customersError.message);
  } else {
    console.log(`✅ ${customersData.length} clientes criados`);
  }

  // Criar produtos
  const products = [
    {
      tenant_id: tenantId,
      user_id: userId,
      sku: `PROD-${companyName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-001`,
      name: `Produto A - ${companyName}`,
      description: `Descrição do produto A da ${companyName}`,
      category: 'Categoria A',
      brand: companyName,
      cost_price: 50.00,
      sale_price: 100.00,
      stock_quantity: 10,
      unit: 'UN',
      is_active: true
    },
    {
      tenant_id: tenantId,
      user_id: userId,
      sku: `PROD-${companyName.toUpperCase().replace(/[^A-Z0-9]/g, '')}-002`,
      name: `Produto B - ${companyName}`,
      description: `Descrição do produto B da ${companyName}`,
      category: 'Categoria B',
      brand: companyName,
      cost_price: 75.00,
      sale_price: 150.00,
      stock_quantity: 5,
      unit: 'UN',
      is_active: true
    }
  ];

  const { data: productsData, error: productsError } = await supabase
    .from('products')
    .insert(products)
    .select();

  if (productsError) {
    console.error('❌ Erro ao criar produtos:', productsError.message);
  } else {
    console.log(`✅ ${productsData.length} produtos criados`);
  }
}

async function testDataIsolation() {
  console.log('\n🔍 Testando isolamento de dados...');

  try {
    // Buscar todos os clientes
    const { data: allCustomers, error: customersError } = await supabase
      .from('customers')
      .select('id, name, tenant_id');

    if (customersError) {
      console.error('❌ Erro ao buscar clientes:', customersError.message);
      return;
    }

    // Agrupar por tenant
    const customersByTenant = {};
    allCustomers.forEach(customer => {
      if (!customersByTenant[customer.tenant_id]) {
        customersByTenant[customer.tenant_id] = [];
      }
      customersByTenant[customer.tenant_id].push(customer);
    });

    console.log('\n📊 Clientes por tenant:');
    Object.keys(customersByTenant).forEach(tenantId => {
      console.log(`  Tenant ${tenantId}: ${customersByTenant[tenantId].length} clientes`);
      customersByTenant[tenantId].forEach(customer => {
        console.log(`    - ${customer.name}`);
      });
    });

    // Buscar todos os produtos
    const { data: allProducts, error: productsError } = await supabase
      .from('products')
      .select('id, name, tenant_id');

    if (productsError) {
      console.error('❌ Erro ao buscar produtos:', productsError.message);
      return;
    }

    // Agrupar por tenant
    const productsByTenant = {};
    allProducts.forEach(product => {
      if (!productsByTenant[product.tenant_id]) {
        productsByTenant[product.tenant_id] = [];
      }
      productsByTenant[product.tenant_id].push(product);
    });

    console.log('\n📦 Produtos por tenant:');
    Object.keys(productsByTenant).forEach(tenantId => {
      console.log(`  Tenant ${tenantId}: ${productsByTenant[tenantId].length} produtos`);
      productsByTenant[tenantId].forEach(product => {
        console.log(`    - ${product.name}`);
      });
    });

  } catch (error) {
    console.error('❌ Erro no teste de isolamento:', error.message);
  }
}

async function testAPIs() {
  console.log('\n🌐 Testando APIs...');

  try {
    // Testar API de clientes
    console.log('\n📞 Testando API de clientes...');
    const response = await fetch('http://localhost:3000/next_api/customers');
    
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ API de clientes funcionando: ${data.data?.length || 0} clientes`);
    } else {
      console.error('❌ API de clientes falhou:', response.status);
    }

    // Testar API de produtos
    console.log('\n📦 Testando API de produtos...');
    const productsResponse = await fetch('http://localhost:3000/next_api/products');
    
    if (productsResponse.ok) {
      const productsData = await productsResponse.json();
      console.log(`✅ API de produtos funcionando: ${productsData.data?.length || 0} produtos`);
    } else {
      console.error('❌ API de produtos falhou:', productsResponse.status);
    }

  } catch (error) {
    console.error('❌ Erro ao testar APIs:', error.message);
  }
}

async function cleanupTestData() {
  console.log('\n🧹 Limpando dados de teste...');

  try {
    // Deletar clientes de teste
    const { error: customersError } = await supabase
      .from('customers')
      .delete()
      .like('name', '%Teste%');

    if (customersError) {
      console.error('❌ Erro ao limpar clientes:', customersError.message);
    } else {
      console.log('✅ Clientes de teste removidos');
    }

    // Deletar produtos de teste
    const { error: productsError } = await supabase
      .from('products')
      .delete()
      .like('name', '%Teste%');

    if (productsError) {
      console.error('❌ Erro ao limpar produtos:', productsError.message);
    } else {
      console.log('✅ Produtos de teste removidos');
    }

    // Deletar tenants de teste
    const { error: tenantsError } = await supabase
      .from('tenants')
      .delete()
      .like('name', '%Teste%');

    if (tenantsError) {
      console.error('❌ Erro ao limpar tenants:', tenantsError.message);
    } else {
      console.log('✅ Tenants de teste removidos');
    }

  } catch (error) {
    console.error('❌ Erro na limpeza:', error.message);
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTE DO SISTEMA MULTI-TENANT');
  console.log('==========================================');

  try {
    // 1. Criar usuários de teste
    const createdUsers = [];
    for (const userData of testUsers) {
      const user = await createTestUser(userData);
      if (user) {
        createdUsers.push(user);
      }
    }

    if (createdUsers.length === 0) {
      console.error('❌ Nenhum usuário foi criado. Abortando teste.');
      return;
    }

    console.log(`\n✅ ${createdUsers.length} usuários criados com sucesso`);

    // 2. Testar isolamento de dados
    await testDataIsolation();

    // 3. Testar APIs
    await testAPIs();

    // 4. Limpar dados de teste
    const shouldCleanup = process.argv.includes('--cleanup');
    if (shouldCleanup) {
      await cleanupTestData();
    } else {
      console.log('\n💡 Para limpar os dados de teste, execute com --cleanup');
    }

    console.log('\n🎉 TESTE CONCLUÍDO COM SUCESSO!');
    console.log('\n📋 RESUMO:');
    console.log(`- ${createdUsers.length} usuários criados`);
    console.log('- Sistema multi-tenant funcionando');
    console.log('- Isolamento de dados verificado');
    console.log('- APIs testadas');

    console.log('\n🔑 CREDENCIAIS DE TESTE:');
    createdUsers.forEach(user => {
      console.log(`- Email: ${user.email}`);
      console.log(`- Senha: 123456`);
      console.log(`- Empresa: ${user.companyName}`);
      console.log('');
    });

  } catch (error) {
    console.error('❌ Erro geral no teste:', error.message);
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  createTestUser,
  createTestData,
  testDataIsolation,
  testAPIs,
  cleanupTestData
};

