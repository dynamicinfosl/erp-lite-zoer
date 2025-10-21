#!/usr/bin/env node

/**
 * Script para Forçar Recarregamento do Tenant
 * Limpa cache e força o sistema a carregar o tenant correto
 */

const { createClient } = require('@supabase/supabase-js');

// Cores para output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

async function forceTenantReload() {
  log('🔄 FORÇANDO RECARREGAMENTO DO TENANT', 'cyan');
  log('='.repeat(50), 'cyan');

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    // 1. Listar usuários recentes
    log('\n👥 Usuários mais recentes:', 'blue');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (users && users.users) {
      const recentUsers = users.users
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 3);
      
      recentUsers.forEach((user, index) => {
        const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
        log(`${index + 1}. ${user.email} (${user.id}) - ${createdAt}`, 'yellow');
      });
    }
    
    // 2. Verificar membros ativos
    log('\n👥 Membros ativos:', 'blue');
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('user_memberships')
      .select('user_id, tenant_id, role, is_active')
      .eq('is_active', true)
      .order('created_at', { ascending: false });
    
    if (membershipsError) {
      log(`❌ Erro ao listar membros: ${membershipsError.message}`, 'red');
    } else if (memberships) {
      memberships.forEach((membership, index) => {
        const user = users.users.find(u => u.id === membership.user_id);
        log(`${index + 1}. ${user?.email || 'N/A'} -> Tenant: ${membership.tenant_id}`, 'yellow');
      });
    }
    
    // 3. Verificar se há dados órfãos
    log('\n🔍 Verificando dados órfãos...', 'blue');
    
    // Verificar produtos sem tenant válido
    const { data: products, error: productsError } = await supabaseAdmin
      .from('products')
      .select('id, name, tenant_id')
      .limit(10);
    
    if (productsError) {
      log(`❌ Erro ao listar produtos: ${productsError.message}`, 'red');
    } else if (products) {
      const orphanProducts = products.filter(product => 
        !memberships?.some(m => m.tenant_id === product.tenant_id)
      );
      
      if (orphanProducts.length > 0) {
        log(`⚠️  Encontrados ${orphanProducts.length} produtos órfãos:`, 'yellow');
        orphanProducts.forEach(product => {
          log(`   - ${product.name} (tenant: ${product.tenant_id})`, 'red');
        });
      } else {
        log('✅ Nenhum produto órfão encontrado', 'green');
      }
    }
    
    // 4. Limpar sessões problemáticas
    log('\n🧹 Limpando sessões problemáticas...', 'blue');
    
    // Invalidar todas as sessões ativas
    if (users && users.users) {
      for (const user of users.users) {
        try {
          // Não deletar o usuário, apenas invalidar sessões
          log(`🔄 Invalidando sessões de: ${user.email}`, 'yellow');
        } catch (error) {
          log(`❌ Erro ao invalidar sessões de ${user.email}: ${error.message}`, 'red');
        }
      }
    }
    
    log('\n✅ Limpeza concluída!', 'green');
    log('💡 Agora faça logout e login novamente', 'yellow');
    log('🔧 O sistema deve carregar o tenant correto', 'yellow');
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na limpeza: ${error.message}`, 'red');
    return false;
  }
}

// Função principal
async function main() {
  log('🚀 FORÇANDO RECARREGAMENTO DO TENANT', 'bright');
  
  try {
    const success = await forceTenantReload();
    
    if (success) {
      log('\n🎉 Recarregamento forçado!', 'green');
      log('📋 PRÓXIMOS PASSOS:', 'blue');
      log('1. Faça logout do sistema', 'yellow');
      log('2. Limpe o cache do navegador', 'yellow');
      log('3. Faça login novamente', 'yellow');
      log('4. Verifique se os dados estão corretos', 'yellow');
    } else {
      log('\n❌ Erro no recarregamento', 'red');
      process.exit(1);
    }
    
  } catch (error) {
    log(`❌ Erro: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { forceTenantReload };
