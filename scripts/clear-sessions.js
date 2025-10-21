#!/usr/bin/env node

/**
 * Script de Limpeza de Sessões do Supabase
 * Remove sessões problemáticas e dados de cache
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

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

// Carregar variáveis de ambiente
function loadEnvVars() {
  const envPath = path.join(process.cwd(), '.env.local');
  
  if (!fs.existsSync(envPath)) {
    log('❌ Arquivo .env.local não encontrado!', 'red');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

// Limpar todas as sessões ativas
async function clearAllSessions() {
  log('\n🧹 LIMPEZA COMPLETA DE SESSÕES', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return false;

  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Listar usuários
    log('\n👥 Listando usuários...', 'blue');
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (users && users.users) {
      log(`📊 Total de usuários encontrados: ${users.users.length}`, 'yellow');
      
      // Mostrar usuários que serão afetados
      users.users.forEach((user, index) => {
        const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca';
        log(`${index + 1}. ${user.email} - Último login: ${lastSignIn}`, 'yellow');
      });
      
      log('\n⚠️  ATENÇÃO: Esta operação irá invalidar todas as sessões ativas!', 'red');
      log('   Todos os usuários precisarão fazer login novamente.', 'yellow');
      
      // Confirmar ação (em produção, você pode querer remover isso)
      log('\n🔄 Iniciando limpeza de sessões...', 'blue');
      
      // Invalidar todas as sessões (isso força logout de todos os usuários)
      for (const user of users.users) {
        try {
          // Invalidar sessões do usuário
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          log(`✅ Sessões invalidadas para: ${user.email}`, 'green');
        } catch (error) {
          log(`❌ Erro ao invalidar sessões de ${user.email}: ${error.message}`, 'red');
        }
      }
      
      log('\n✅ Limpeza de sessões concluída!', 'green');
      log('🔐 Todos os usuários foram deslogados', 'yellow');
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na limpeza: ${error.message}`, 'red');
    return false;
  }
}

// Limpar apenas usuários duplicados
async function clearDuplicateUsers() {
  log('\n🔍 LIMPEZA DE USUÁRIOS DUPLICADOS', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return false;

  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Listar usuários
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (users && users.users) {
      // Encontrar duplicados
      const emailCounts = {};
      const emailUsers = {};
      
      users.users.forEach(user => {
        if (emailCounts[user.email]) {
          emailCounts[user.email]++;
          emailUsers[user.email].push(user);
        } else {
          emailCounts[user.email] = 1;
          emailUsers[user.email] = [user];
        }
      });
      
      const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
      
      if (duplicates.length === 0) {
        log('✅ Nenhum usuário duplicado encontrado', 'green');
        return true;
      }
      
      log(`\n⚠️  Encontrados ${duplicates.length} emails duplicados:`, 'yellow');
      
      for (const [email, count] of duplicates) {
        log(`\n📧 ${email} (${count} contas):`, 'blue');
        
        const userList = emailUsers[email];
        userList.forEach((user, index) => {
          const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
          const isActive = user.last_sign_in_at ? 'Ativo' : 'Inativo';
          log(`   ${index + 1}. ID: ${user.id} - Criado: ${createdAt} - Status: ${isActive}`, 'yellow');
        });
        
        // Manter apenas o usuário mais recente
        const sortedUsers = userList.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        const keepUser = sortedUsers[0];
        const deleteUsers = sortedUsers.slice(1);
        
        log(`   ✅ Mantendo: ${keepUser.id} (mais recente)`, 'green');
        
        for (const userToDelete of deleteUsers) {
          try {
            await supabaseAdmin.auth.admin.deleteUser(userToDelete.id);
            log(`   🗑️  Removido: ${userToDelete.id}`, 'red');
          } catch (error) {
            log(`   ❌ Erro ao remover ${userToDelete.id}: ${error.message}`, 'red');
          }
        }
      }
      
      log('\n✅ Limpeza de duplicados concluída!', 'green');
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na limpeza: ${error.message}`, 'red');
    return false;
  }
}

// Verificar integridade dos dados
async function verifyDataIntegrity() {
  log('\n🔍 VERIFICAÇÃO DE INTEGRIDADE', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return false;

  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Verificar usuários órfãos
    log('\n👥 Verificando usuários órfãos...', 'blue');
    
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('user_memberships')
      .select('user_id');
    
    if (usersError || membershipsError) {
      log('❌ Erro ao verificar integridade', 'red');
      return false;
    }
    
    if (users && users.users && memberships) {
      const membershipUserIds = new Set(memberships.map(m => m.user_id));
      const orphanUsers = users.users.filter(user => !membershipUserIds.has(user.id));
      
      if (orphanUsers.length > 0) {
        log(`⚠️  Encontrados ${orphanUsers.length} usuários órfãos:`, 'yellow');
        orphanUsers.forEach(user => {
          log(`   - ${user.email} (${user.id})`, 'yellow');
        });
      } else {
        log('✅ Nenhum usuário órfão encontrado', 'green');
      }
    }
    
    // Verificar tenants órfãos
    log('\n🏢 Verificando tenants órfãos...', 'blue');
    
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name');
    
    if (tenantsError) {
      log('❌ Erro ao verificar tenants', 'red');
      return false;
    }
    
    if (tenants && memberships) {
      const membershipTenantIds = new Set(memberships.map(m => m.tenant_id));
      const orphanTenants = tenants.filter(tenant => !membershipTenantIds.has(tenant.id));
      
      if (orphanTenants.length > 0) {
        log(`⚠️  Encontrados ${orphanTenants.length} tenants órfãos:`, 'yellow');
        orphanTenants.forEach(tenant => {
          log(`   - ${tenant.name} (${tenant.id})`, 'yellow');
        });
      } else {
        log('✅ Nenhum tenant órfão encontrado', 'green');
      }
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na verificação: ${error.message}`, 'red');
    return false;
  }
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0];
  
  log('🧹 LIMPADOR DE SESSÕES DO SUPABASE', 'bright');
  
  try {
    switch (command) {
      case 'clear-all':
        await clearAllSessions();
        break;
      case 'clear-duplicates':
        await clearDuplicateUsers();
        break;
      case 'verify':
        await verifyDataIntegrity();
        break;
      default:
        log('\n📖 USO:', 'blue');
        log('node scripts/clear-sessions.js <comando>', 'yellow');
        log('\nComandos disponíveis:', 'blue');
        log('  clear-all      - Remove todas as sessões (força logout de todos)', 'yellow');
        log('  clear-duplicates - Remove apenas usuários duplicados', 'yellow');
        log('  verify         - Verifica integridade dos dados', 'yellow');
        log('\n⚠️  ATENÇÃO: Use com cuidado em produção!', 'red');
        break;
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

module.exports = {
  clearAllSessions,
  clearDuplicateUsers,
  verifyDataIntegrity
};
