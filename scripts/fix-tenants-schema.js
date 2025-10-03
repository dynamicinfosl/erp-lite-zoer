const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas:');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixTenantsSchema() {
  try {
    console.log('🔧 Iniciando correção do schema da tabela tenants...\n');

    // 1. Verificar estrutura atual
    console.log('📋 Verificando estrutura atual da tabela tenants...');
    const { data: columns, error: columnsError } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns 
          WHERE table_name = 'tenants' 
          ORDER BY ordinal_position;
        `
      });

    if (columnsError) {
      console.error('❌ Erro ao verificar colunas:', columnsError);
      return false;
    }

    console.log('📊 Colunas atuais da tabela tenants:');
    columns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
    });

    // 2. Adicionar colunas que estão faltando
    console.log('\n🔨 Adicionando colunas que estão faltando...');
    
    const alterQueries = [
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS email VARCHAR(255);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS phone VARCHAR(20);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS document VARCHAR(20);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS document_type VARCHAR(10);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS corporate_email VARCHAR(255);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS corporate_phone VARCHAR(20);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS fantasy_name VARCHAR(255);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS address TEXT;",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS complement TEXT;",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS neighborhood VARCHAR(100);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS city VARCHAR(100);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS state VARCHAR(2);",
      "ALTER TABLE tenants ADD COLUMN IF NOT EXISTS zip_code VARCHAR(10);"
    ];

    for (const query of alterQueries) {
      const { error } = await supabase.rpc('exec_sql', { sql: query });
      if (error) {
        console.error(`❌ Erro ao executar: ${query}`, error);
        return false;
      }
    }

    console.log('✅ Colunas adicionadas com sucesso!');

    // 3. Verificar se tabela subscriptions existe
    console.log('\n🔍 Verificando tabela subscriptions...');
    const { data: subscriptionsExists } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'subscriptions'
          ) as exists;
        `
      });

    if (!subscriptionsExists[0]?.exists) {
      console.log('📝 Criando tabela subscriptions...');
      const { error: createSubsError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE subscriptions (
            id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
            tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
            plan_id VARCHAR(50) NOT NULL,
            status VARCHAR(20) DEFAULT 'trial',
            trial_started_at TIMESTAMPTZ,
            trial_ends_at TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });

      if (createSubsError) {
        console.error('❌ Erro ao criar tabela subscriptions:', createSubsError);
        return false;
      }

      console.log('✅ Tabela subscriptions criada!');
    } else {
      console.log('✅ Tabela subscriptions já existe!');
    }

    // 4. Verificar se tabela plans existe
    console.log('\n🔍 Verificando tabela plans...');
    const { data: plansExists } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT EXISTS (
            SELECT FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_name = 'plans'
          ) as exists;
        `
      });

    if (!plansExists[0]?.exists) {
      console.log('📝 Criando tabela plans...');
      const { error: createPlansError } = await supabase.rpc('exec_sql', {
        sql: `
          CREATE TABLE plans (
            id VARCHAR(50) PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            description TEXT,
            price DECIMAL(10,2) NOT NULL DEFAULT 0,
            billing_cycle VARCHAR(20) DEFAULT 'monthly',
            features TEXT[],
            max_users INTEGER DEFAULT 1,
            max_products INTEGER DEFAULT 100,
            max_customers INTEGER DEFAULT 1000,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
          );
        `
      });

      if (createPlansError) {
        console.error('❌ Erro ao criar tabela plans:', createPlansError);
        return false;
      }

      console.log('✅ Tabela plans criada!');

      // Inserir planos básicos
      console.log('📝 Inserindo planos básicos...');
      const { error: insertPlansError } = await supabase
        .from('plans')
        .upsert([
          {
            id: 'basic',
            name: 'Básico',
            description: 'Ideal para pequenas empresas',
            price: 29.90,
            features: ['Gestão de produtos', 'Gestão de clientes', 'Relatórios básicos', 'Suporte por email'],
            max_users: 1,
            max_products: 100,
            max_customers: 1000
          },
          {
            id: 'professional',
            name: 'Profissional',
            description: 'Para empresas em crescimento',
            price: 59.90,
            features: ['Tudo do Básico', 'Múltiplos usuários', 'Relatórios avançados', 'Integração com APIs', 'Suporte prioritário'],
            max_users: 5,
            max_products: 1000,
            max_customers: 10000
          },
          {
            id: 'enterprise',
            name: 'Enterprise',
            description: 'Solução completa para grandes empresas',
            price: 99.90,
            features: ['Tudo do Profissional', 'Usuários ilimitados', 'Produtos ilimitados', 'Clientes ilimitados', 'Suporte 24/7', 'Customizações'],
            max_users: -1,
            max_products: -1,
            max_customers: -1
          }
        ]);

      if (insertPlansError) {
        console.error('❌ Erro ao inserir planos:', insertPlansError);
        return false;
      }

      console.log('✅ Planos básicos inseridos!');
    } else {
      console.log('✅ Tabela plans já existe!');
    }

    // 5. Verificar estrutura final
    console.log('\n📊 Verificando estrutura final...');
    const { data: finalColumns } = await supabase
      .rpc('exec_sql', {
        sql: `
          SELECT column_name, data_type 
          FROM information_schema.columns 
          WHERE table_name = 'tenants' 
          ORDER BY ordinal_position;
        `
      });

    console.log('\n✅ Estrutura final da tabela tenants:');
    finalColumns.forEach(col => {
      console.log(`  - ${col.column_name}: ${col.data_type}`);
    });

    console.log('\n🎉 Schema corrigido com sucesso!');
    console.log('💡 Agora você pode tentar fazer o cadastro novamente.');
    
    return true;

  } catch (error) {
    console.error('❌ Erro geral:', error);
    return false;
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  fixTenantsSchema()
    .then(success => {
      if (success) {
        console.log('\n✅ Script executado com sucesso!');
        process.exit(0);
      } else {
        console.log('\n❌ Script falhou!');
        process.exit(1);
      }
    })
    .catch(error => {
      console.error('❌ Erro fatal:', error);
      process.exit(1);
    });
}

module.exports = { fixTenantsSchema };
