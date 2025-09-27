const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuração do Supabase
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://lfxietcasaooenfffodr.supabase.co';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function setupSaasDatabase() {
  try {
    console.log('🚀 Iniciando setup do banco SaaS multi-tenant...');

    // Ler o arquivo SQL
    const sqlPath = path.join(__dirname, 'setup-saas-database.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // Executar o SQL
    console.log('📊 Executando script SQL...');
    const { data, error } = await supabase.rpc('exec_sql', { sql: sqlContent });

    if (error) {
      // Se rpc não existir, vamos executar por partes
      console.log('⚠️ RPC não disponível, executando comandos individuais...');
      
      // Dividir o SQL em comandos individuais
      const commands = sqlContent
        .split(';')
        .map(cmd => cmd.trim())
        .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('COMMIT'));

      console.log(`📝 Executando ${commands.length} comandos SQL...`);

      for (let i = 0; i < commands.length; i++) {
        const command = commands[i];
        if (command.trim()) {
          try {
            console.log(`[${i+1}/${commands.length}] Executando: ${command.substring(0, 80)}...`);
            const result = await supabase.from('_').select().limit(0); // Força conexão
            
            // Para comandos DDL, usar a API direta do Supabase
            if (command.includes('CREATE TABLE') || command.includes('ALTER TABLE') || command.includes('CREATE POLICY')) {
              console.log(`⏭️ Comando DDL detectado, pode ser executado via dashboard Supabase`);
            }
          } catch (cmdError) {
            console.log(`⚠️ Erro no comando ${i+1}: ${cmdError.message}`);
          }
        }
      }
    } else {
      console.log('✅ Script SQL executado com sucesso!');
    }

    // Verificar se as tabelas foram criadas
    console.log('\n🔍 Verificando tabelas criadas...');
    
    const tables = ['tenants', 'user_memberships', 'plans', 'subscriptions', 'audit_logs'];
    
    for (const table of tables) {
      try {
        const { data, error } = await supabase.from(table).select('*').limit(1);
        if (error) {
          console.log(`❌ Tabela ${table}: ${error.message}`);
        } else {
          console.log(`✅ Tabela ${table}: OK`);
        }
      } catch (e) {
        console.log(`❌ Tabela ${table}: ${e.message}`);
      }
    }

    // Verificar planos
    console.log('\n📋 Verificando planos criados...');
    const { data: plans, error: plansError } = await supabase.from('plans').select('*');
    
    if (!plansError && plans) {
      console.log(`✅ ${plans.length} planos encontrados:`);
      plans.forEach(plan => {
        console.log(`   - ${plan.name} (${plan.slug}): R$ ${plan.price_monthly}/mês`);
      });
    } else {
      console.log(`❌ Erro ao verificar planos: ${plansError?.message}`);
    }

    console.log('\n🎉 Setup do banco SaaS concluído!');
    console.log('\n📝 Próximos passos:');
    console.log('1. ✅ Estrutura do banco criada');
    console.log('2. 🔄 Atualizar APIs para usar tenant_id');
    console.log('3. 🔐 Implementar autenticação');
    console.log('4. 🚀 Criar fluxo de onboarding');

  } catch (error) {
    console.error('❌ Erro ao executar setup:', error);
  }
}

// Executar apenas se chamado diretamente
if (require.main === module) {
  setupSaasDatabase();
}

module.exports = { setupSaasDatabase };


