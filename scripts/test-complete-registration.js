const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.log('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCompleteRegistration() {
  console.log('🧪 Testando cadastro completo da empresa...\n');

  try {
    // 1. Verificar se as tabelas existem
    console.log('1️⃣ Verificando estrutura do banco...');
    
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('*')
      .limit(1);
    
    if (tenantsError) {
      console.error('❌ Erro ao verificar tabela tenants:', tenantsError.message);
      return;
    }

    const { data: plans, error: plansError } = await supabase
      .from('plans')
      .select('*')
      .limit(1);
    
    if (plansError) {
      console.error('❌ Erro ao verificar tabela plans:', plansError.message);
      return;
    }

    const { data: memberships, error: membershipsError } = await supabase
      .from('user_memberships')
      .select('*')
      .limit(1);
    
    if (membershipsError) {
      console.error('❌ Erro ao verificar tabela user_memberships:', membershipsError.message);
      return;
    }

    console.log('✅ Estrutura do banco verificada');

    // 2. Testar dados de exemplo
    console.log('\n2️⃣ Testando dados de exemplo...');
    
    const testData = {
      responsible: {
        name: 'João Silva',
        email: 'joao.teste@empresa.com',
        phone: '(21) 98765-4321',
        cpf: '123.456.789-00',
        password: 'senha123'
      },
      company: {
        name: 'Empresa Teste LTDA',
        fantasy_name: 'Teste Corp',
        document: '12.345.678/0001-90',
        document_type: 'CNPJ',
        corporate_email: 'contato@teste.com',
        corporate_phone: '(21) 3333-4444'
      },
      address: {
        zip_code: '20000-000',
        address: 'Rua das Flores',
        number: '123',
        complement: 'Sala 101',
        neighborhood: 'Centro',
        city: 'Rio de Janeiro',
        state: 'RJ'
      },
      plan_id: 'basic'
    };

    console.log('📋 Dados de teste:', JSON.stringify(testData, null, 2));

    // 3. Simular criação de tenant
    console.log('\n3️⃣ Simulando criação de tenant...');
    
    const tenantSlug = testData.company.name
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .substring(0, 50) + '-' + Date.now();

    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: testData.company.name,
        slug: tenantSlug,
        fantasy_name: testData.company.fantasy_name,
        document: testData.company.document,
        document_type: testData.company.document_type,
        corporate_email: testData.company.corporate_email,
        corporate_phone: testData.company.corporate_phone,
        email: testData.responsible.email,
        phone: testData.responsible.phone,
        address: `${testData.address.address}, ${testData.address.number}`,
        complement: testData.address.complement,
        neighborhood: testData.address.neighborhood,
        city: testData.address.city,
        state: testData.address.state,
        zip_code: testData.address.zip_code,
        status: 'trial',
        trial_ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
      })
      .select()
      .single();

    if (tenantError) {
      console.error('❌ Erro ao criar tenant:', tenantError.message);
      return;
    }

    console.log('✅ Tenant criado:', newTenant.name);

    // 4. Verificar planos disponíveis
    console.log('\n4️⃣ Verificando planos disponíveis...');
    
    const { data: availablePlans, error: plansListError } = await supabase
      .from('plans')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (plansListError) {
      console.error('❌ Erro ao buscar planos:', plansListError.message);
    } else {
      console.log('📦 Planos disponíveis:');
      availablePlans.forEach(plan => {
        console.log(`  - ${plan.name}: R$ ${plan.price.toFixed(2).replace('.', ',')}/mês`);
      });
    }

    // 5. Limpar dados de teste
    console.log('\n5️⃣ Limpando dados de teste...');
    
    const { error: deleteError } = await supabase
      .from('tenants')
      .delete()
      .eq('id', newTenant.id);

    if (deleteError) {
      console.error('❌ Erro ao limpar dados:', deleteError.message);
    } else {
      console.log('✅ Dados de teste removidos');
    }

    console.log('\n🎉 Teste de cadastro completo realizado com sucesso!');
    console.log('\n📝 Próximos passos:');
    console.log('1. Execute o script SQL: scripts/update-tenant-schema-complete.sql');
    console.log('2. Teste o formulário de cadastro na interface');
    console.log('3. Verifique se os dados são salvos corretamente');

  } catch (error) {
    console.error('💥 Erro durante o teste:', error);
  }
}

testCompleteRegistration();
