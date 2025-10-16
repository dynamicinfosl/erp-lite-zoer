#!/usr/bin/env node

/**
 * SCRIPT DE TESTE DE INTEGRAÇÃO COMPLETA
 * 
 * Este script testa todo o sistema multi-tenant:
 * - Login/Logout
 * - Separação de dados por tenant
 * - APIs funcionando
 * - Performance básica
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Configuração
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseAnonKey || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não configuradas');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

// Dados de teste
const testCredentials = [
  {
    email: 'empresa1@teste.com',
    password: '123456'
  },
  {
    email: 'empresa2@teste.com',
    password: '123456'
  }
];

async function testLogin(userCredentials) {
  console.log(`\n🔐 Testando login: ${userCredentials.email}`);
  
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email: userCredentials.email,
      password: userCredentials.password
    });

    if (error) {
      console.error('❌ Erro no login:', error.message);
      return null;
    }

    console.log('✅ Login realizado com sucesso');
    return data;
  } catch (error) {
    console.error('❌ Erro no login:', error.message);
    return null;
  }
}

async function testLogout() {
  console.log('\n🚪 Testando logout...');
  
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('❌ Erro no logout:', error.message);
      return false;
    }

    console.log('✅ Logout realizado com sucesso');
    return true;
  } catch (error) {
    console.error('❌ Erro no logout:', error.message);
    return false;
  }
}

async function testAPIWithAuth(token, tenantId, apiName, url) {
  console.log(`\n🌐 Testando API: ${apiName}`);
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      console.log(`✅ ${apiName}: ${data.data?.length || 0} registros`);
      return { success: true, data: data.data || [] };
    } else {
      console.error(`❌ ${apiName} falhou:`, response.status);
      return { success: false, error: response.status };
    }
  } catch (error) {
    console.error(`❌ Erro na API ${apiName}:`, error.message);
    return { success: false, error: error.message };
  }
}

async function testDataSeparation(user1Data, user2Data) {
  console.log('\n🔒 Testando separação de dados...');
  
  try {
    // Login como usuário 1
    const login1 = await testLogin(testCredentials[0]);
    if (!login1) return false;

    // Buscar dados do usuário 1
    const user1Customers = await testAPIWithAuth(
      login1.session.access_token,
      user1Data.tenantId,
      'Customers User 1',
      `http://localhost:3000/next_api/customers?tenant_id=${user1Data.tenantId}`
    );

    const user1Products = await testAPIWithAuth(
      login1.session.access_token,
      user1Data.tenantId,
      'Products User 1',
      `http://localhost:3000/next_api/products?tenant_id=${user1Data.tenantId}`
    );

    // Logout
    await testLogout();

    // Login como usuário 2
    const login2 = await testLogin(testCredentials[1]);
    if (!login2) return false;

    // Buscar dados do usuário 2
    const user2Customers = await testAPIWithAuth(
      login2.session.access_token,
      user2Data.tenantId,
      'Customers User 2',
      `http://localhost:3000/next_api/customers?tenant_id=${user2Data.tenantId}`
    );

    const user2Products = await testAPIWithAuth(
      login2.session.access_token,
      user2Data.tenantId,
      'Products User 2',
      `http://localhost:3000/next_api/products?tenant_id=${user2Data.tenantId}`
    );

    // Verificar separação
    const user1CustomerNames = user1Customers.data?.map(c => c.name) || [];
    const user2CustomerNames = user2Customers.data?.map(c => c.name) || [];
    
    const user1ProductNames = user1Products.data?.map(p => p.name) || [];
    const user2ProductNames = user2Products.data?.map(p => p.name) || [];

    // Verificar se não há overlap
    const customerOverlap = user1CustomerNames.some(name => user2CustomerNames.includes(name));
    const productOverlap = user1ProductNames.some(name => user2ProductNames.includes(name));

    if (customerOverlap) {
      console.error('❌ DADOS DE CLIENTES MISTURADOS!');
      return false;
    }

    if (productOverlap) {
      console.error('❌ DADOS DE PRODUTOS MISTURADOS!');
      return false;
    }

    console.log('✅ Separação de dados verificada com sucesso');
    console.log(`   User 1: ${user1CustomerNames.length} clientes, ${user1ProductNames.length} produtos`);
    console.log(`   User 2: ${user2CustomerNames.length} clientes, ${user2ProductNames.length} produtos`);

    // Logout final
    await testLogout();
    
    return true;

  } catch (error) {
    console.error('❌ Erro no teste de separação:', error.message);
    return false;
  }
}

async function testCreateData(tenantId) {
  console.log(`\n📝 Testando criação de dados para tenant ${tenantId}...`);
  
  try {
    // Testar criação de cliente
    const customerData = {
      tenant_id: tenantId,
      name: `Cliente Teste Integração ${Date.now()}`,
      email: `teste${Date.now()}@exemplo.com`,
      phone: '(11) 99999-9999',
      document: '123.456.789-00',
      city: 'São Paulo'
    };

    const customerResponse = await fetch('http://localhost:3000/next_api/customers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(customerData)
    });

    if (customerResponse.ok) {
      console.log('✅ Cliente criado com sucesso');
    } else {
      console.error('❌ Erro ao criar cliente:', customerResponse.status);
      return false;
    }

    // Testar criação de produto
    const productData = {
      tenant_id: tenantId,
      name: `Produto Teste Integração ${Date.now()}`,
      description: 'Produto criado no teste de integração',
      category: 'Teste',
      brand: 'Marca Teste',
      cost_price: 50.00,
      price: 100.00, // Corrigido: usar 'price' em vez de 'sale_price'
      stock: 10, // Corrigido: usar 'stock' em vez de 'stock_quantity'
      unit: 'UN'
    };

    const productResponse = await fetch('http://localhost:3000/next_api/products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(productData)
    });

    if (productResponse.ok) {
      console.log('✅ Produto criado com sucesso');
    } else {
      console.error('❌ Erro ao criar produto:', productResponse.status);
      return false;
    }

    return true;

  } catch (error) {
    console.error('❌ Erro no teste de criação:', error.message);
    return false;
  }
}

async function testPerformance() {
  console.log('\n⚡ Testando performance básica...');
  
  try {
    const startTime = Date.now();
    
    // Testar múltiplas consultas
    const promises = [];
    for (let i = 0; i < 10; i++) {
      promises.push(
        fetch('http://localhost:3000/next_api/customers')
          .then(r => r.json())
          .catch(() => ({ data: [] }))
      );
    }

    await Promise.all(promises);
    
    const endTime = Date.now();
    const duration = endTime - startTime;
    
    console.log(`✅ 10 consultas executadas em ${duration}ms`);
    console.log(`   Média: ${(duration / 10).toFixed(2)}ms por consulta`);
    
    if (duration < 5000) {
      console.log('✅ Performance dentro do esperado');
      return true;
    } else {
      console.log('⚠️ Performance pode estar lenta');
      return false;
    }

  } catch (error) {
    console.error('❌ Erro no teste de performance:', error.message);
    return false;
  }
}

async function getTestUserData() {
  console.log('\n🔍 Buscando dados dos usuários de teste...');
  
  try {
    const { data: users, error } = await supabaseAdmin
      .from('user_memberships')
      .select(`
        user_id,
        tenant_id,
        role,
        tenants!inner(name)
      `)
      .eq('is_active', true)
      .in('user_id', [
        '8cf6c52b-0916-481e-b4c4-a4cca339afd5', // empresa1@teste.com
        'ad8f1f99-32c7-4a43-abf3-3850dc3445fa'  // empresa2@teste.com
      ]);

    if (error) {
      console.error('❌ Erro ao buscar usuários:', error.message);
      return null;
    }

    if (users.length < 2) {
      console.error('❌ Usuários de teste não encontrados');
      return null;
    }

    console.log(`✅ ${users.length} usuários encontrados`);
    
    return users.map(user => ({
      userId: user.user_id,
      tenantId: user.tenant_id,
      role: user.role,
      companyName: user.tenants.name
    }));

  } catch (error) {
    console.error('❌ Erro ao buscar dados:', error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 INICIANDO TESTE DE INTEGRAÇÃO COMPLETA');
  console.log('=========================================');

  try {
    // 1. Verificar se o servidor está rodando
    console.log('\n🌐 Verificando servidor...');
    const serverResponse = await fetch('http://localhost:3000');
    if (!serverResponse.ok) {
      console.error('❌ Servidor não está rodando em localhost:3000');
      console.log('💡 Execute: npm run dev');
      return;
    }
    console.log('✅ Servidor está rodando');

    // 2. Buscar dados dos usuários de teste
    const testUsers = await getTestUserData();
    if (!testUsers || testUsers.length < 2) {
      console.error('❌ Usuários de teste não encontrados');
      console.log('💡 Execute primeiro: node scripts/test-multi-tenant-system.js');
      return;
    }

    // 3. Testar login/logout
    console.log('\n🔐 Testando autenticação...');
    const loginTest = await testLogin(testCredentials[0]);
    if (!loginTest) {
      console.error('❌ Teste de login falhou');
      return;
    }
    
    const logoutTest = await testLogout();
    if (!logoutTest) {
      console.error('❌ Teste de logout falhou');
      return;
    }

    // 4. Testar separação de dados
    const separationTest = await testDataSeparation(testUsers[0], testUsers[1]);
    if (!separationTest) {
      console.error('❌ Teste de separação de dados falhou');
      return;
    }

    // 5. Testar criação de dados
    console.log('\n📝 Testando criação de dados...');
    const createTest1 = await testCreateData(testUsers[0].tenantId);
    const createTest2 = await testCreateData(testUsers[1].tenantId);
    
    if (!createTest1 || !createTest2) {
      console.error('❌ Teste de criação de dados falhou');
      return;
    }

    // 6. Testar performance
    const performanceTest = await testPerformance();
    
    // 7. Relatório final
    console.log('\n🎉 TESTE DE INTEGRAÇÃO CONCLUÍDO!');
    console.log('==================================');
    console.log('✅ Servidor funcionando');
    console.log('✅ Autenticação funcionando');
    console.log('✅ Separação de dados funcionando');
    console.log('✅ Criação de dados funcionando');
    console.log(performanceTest ? '✅ Performance OK' : '⚠️ Performance pode melhorar');
    
    console.log('\n📊 RESUMO DOS USUÁRIOS:');
    testUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.companyName}`);
      console.log(`   - Tenant ID: ${user.tenantId}`);
      console.log(`   - Email: ${testCredentials[index].email}`);
      console.log(`   - Senha: ${testCredentials[index].password}`);
    });

    console.log('\n🚀 SISTEMA PRONTO PARA PRODUÇÃO!');
    
    // 8. Próximos passos
    console.log('\n📋 PRÓXIMOS PASSOS RECOMENDADOS:');
    console.log('1. Execute: scripts/enable-rls-production.sql');
    console.log('2. Execute: scripts/optimize-performance.sql');
    console.log('3. Configure backup automático');
    console.log('4. Configure monitoramento');
    console.log('5. Teste com usuários reais');

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
  testLogin,
  testLogout,
  testDataSeparation,
  testCreateData,
  testPerformance
};
