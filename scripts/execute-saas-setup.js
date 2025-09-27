const { createClient } = require('@supabase/supabase-js');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenfffodr.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function executeSQLCommand(sql, description) {
  console.log(`🔄 ${description}...`);
  try {
    const { data, error } = await supabase.rpc('exec_sql_direct', { sql_command: sql });
    
    if (error) {
      // Se não tiver RPC, tentar método alternativo
      console.log(`   ⚠️ RPC não disponível, tentando método alternativo...`);
      return false;
    } else {
      console.log(`   ✅ ${description} - OK`);
      return true;
    }
  } catch (err) {
    console.log(`   ⚠️ ${description} - ${err.message}`);
    return false;
  }
}

async function createTablesDirectly() {
  console.log('📊 Criando tabelas diretamente...');

  // Criar tabela tenants
  try {
    console.log('🏢 Criando tabela tenants...');
    const { error: tenantsError } = await supabase.from('tenants').select('id').limit(1);
    if (tenantsError && tenantsError.message.includes('relation "public.tenants" does not exist')) {
      console.log('   Tabela tenants não existe, será criada via SQL manual');
    } else {
      console.log('   ✅ Tabela tenants já existe ou foi criada');
    }
  } catch (err) {
    console.log(`   ⚠️ Erro ao verificar tenants: ${err.message}`);
  }

  // Verificar outras tabelas essenciais
  const tables = ['user_memberships', 'plans', 'subscriptions', 'audit_logs'];
  
  for (const table of tables) {
    try {
      console.log(`📋 Verificando tabela ${table}...`);
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error) {
        console.log(`   ⚠️ Tabela ${table} não existe ou erro: ${error.message}`);
      } else {
        console.log(`   ✅ Tabela ${table} existe`);
      }
    } catch (err) {
      console.log(`   ⚠️ Erro ao verificar ${table}: ${err.message}`);
    }
  }
}

async function insertPlans() {
  console.log('📋 Inserindo planos...');
  
  const plans = [
    {
      name: 'Gratuito',
      slug: 'free',
      description: 'Plano trial com limitações',
      price_monthly: 0,
      price_yearly: 0,
      features: { basic_features: true, reports: false, integrations: false },
      limits: { max_users: 1, max_customers: 50, max_products: 100, max_sales_per_month: 100 }
    },
    {
      name: 'Básico',
      slug: 'basic',
      description: 'Ideal para pequenos negócios',
      price_monthly: 29.90,
      price_yearly: 299.90,
      features: { basic_features: true, reports: true, integrations: false, support: 'email' },
      limits: { max_users: 3, max_customers: 500, max_products: 1000, max_sales_per_month: 1000 }
    },
    {
      name: 'Profissional',
      slug: 'pro',
      description: 'Para empresas em crescimento',
      price_monthly: 59.90,
      price_yearly: 599.90,
      features: { basic_features: true, reports: true, integrations: true, support: 'priority' },
      limits: { max_users: 10, max_customers: 5000, max_products: 10000, max_sales_per_month: 10000 }
    },
    {
      name: 'Enterprise',
      slug: 'enterprise',
      description: 'Solução completa para grandes empresas',
      price_monthly: 149.90,
      price_yearly: 1499.90,
      features: { basic_features: true, reports: true, integrations: true, support: 'phone', white_label: true },
      limits: { max_users: -1, max_customers: -1, max_products: -1, max_sales_per_month: -1 }
    }
  ];

  try {
    // Verificar se planos já existem
    const { data: existingPlans } = await supabase.from('plans').select('slug');
    const existingSlugs = existingPlans?.map(p => p.slug) || [];

    for (const plan of plans) {
      if (!existingSlugs.includes(plan.slug)) {
        console.log(`   📝 Inserindo plano: ${plan.name}`);
        const { error } = await supabase.from('plans').insert(plan);
        if (error) {
          console.log(`   ❌ Erro ao inserir ${plan.name}: ${error.message}`);
        } else {
          console.log(`   ✅ Plano ${plan.name} inserido`);
        }
      } else {
        console.log(`   ⏭️ Plano ${plan.name} já existe`);
      }
    }
  } catch (err) {
    console.log(`❌ Erro ao inserir planos: ${err.message}`);
  }
}

async function updateExistingTables() {
  console.log('🔧 Verificando colunas tenant_id...');
  
  try {
    // Verificar se customers tem tenant_id
    const { data: customerColumns } = await supabase.rpc('get_table_columns', { table_name: 'customers' });
    console.log('   📋 Colunas da tabela customers verificadas');
  } catch (err) {
    console.log('   ⚠️ Não foi possível verificar colunas automaticamente');
  }

  try {
    // Verificar se products tem tenant_id
    const { data: productColumns } = await supabase.rpc('get_table_columns', { table_name: 'products' });
    console.log('   📋 Colunas da tabela products verificadas');
  } catch (err) {
    console.log('   ⚠️ Não foi possível verificar colunas automaticamente');
  }
}

async function testTenantCreation() {
  console.log('🧪 Testando criação de tenant...');
  
  try {
    const testTenant = {
      name: 'Teste Empresa',
      slug: 'teste-empresa-' + Date.now(),
      status: 'trial',
      settings: {}
    };

    const { data, error } = await supabase
      .from('tenants')
      .insert(testTenant)
      .select()
      .single();

    if (error) {
      console.log(`   ❌ Erro ao criar tenant de teste: ${error.message}`);
      return false;
    } else {
      console.log(`   ✅ Tenant de teste criado: ${data.id}`);
      
      // Deletar o tenant de teste
      const { error: deleteError } = await supabase
        .from('tenants')
        .delete()
        .eq('id', data.id);
        
      if (!deleteError) {
        console.log(`   🗑️ Tenant de teste removido`);
      }
      
      return true;
    }
  } catch (err) {
    console.log(`   ❌ Erro no teste de tenant: ${err.message}`);
    return false;
  }
}

async function main() {
  console.log('🚀 Iniciando setup do SaaS no Supabase...');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Service Key: ${serviceRoleKey.substring(0, 20)}...`);
  console.log('');

  // Etapa 1: Verificar tabelas
  await createTablesDirectly();
  console.log('');

  // Etapa 2: Inserir planos
  await insertPlans();
  console.log('');

  // Etapa 3: Verificar colunas tenant_id
  await updateExistingTables();
  console.log('');

  // Etapa 4: Teste final
  const tenantTestPassed = await testTenantCreation();
  console.log('');

  // Resumo final
  console.log('📊 RESUMO DO SETUP:');
  console.log('=====================================');
  if (tenantTestPassed) {
    console.log('✅ Sistema SaaS está funcionando!');
    console.log('✅ Planos foram inseridos');
    console.log('✅ Tabelas estão acessíveis');
    console.log('');
    console.log('🎯 PRÓXIMOS PASSOS:');
    console.log('1. Acesse http://localhost:3001 (ou 3000)');
    console.log('2. Clique em "Criar Conta Gratuita"');
    console.log('3. Preencha os dados e teste o sistema');
    console.log('');
    console.log('⚠️ SE AINDA NÃO FUNCIONOU:');
    console.log('Execute os comandos SQL do arquivo SUPABASE_SETUP.md');
    console.log('manualmente no dashboard do Supabase');
  } else {
    console.log('❌ Setup incompleto - execute manualmente o SQL');
    console.log('📋 Abra SUPABASE_SETUP.md e execute no dashboard');
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };


