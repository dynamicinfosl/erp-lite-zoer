#!/usr/bin/env node

/**
 * Script Direto para Limpar Usuários Duplicados
 * Usa configurações hardcoded para limpar duplicados
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

// Configurações hardcoded (mesmo padrão usado no sistema)
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

async function cleanDuplicates() {
  log('🧹 LIMPEZA DIRETA DE USUÁRIOS DUPLICADOS', 'cyan');
  log('='.repeat(50), 'cyan');

  try {
    // Criar cliente Supabase com service role
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
    log('\n🔍 Listando todos os usuários...', 'blue');
    
    // Listar todos os usuários
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (!users || !users.users) {
      log('✅ Nenhum usuário encontrado', 'green');
      return true;
    }
    
    log(`📊 Total de usuários: ${users.users.length}`, 'yellow');
    
    // Encontrar duplicados por email
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
    
    // Verificar membros órfãos
    log('\n🔍 Verificando membros órfãos...', 'blue');
    
    const { data: memberships, error: membershipsError } = await supabaseAdmin
      .from('user_memberships')
      .select('*');
    
    if (membershipsError) {
      log(`❌ Erro ao listar membros: ${membershipsError.message}`, 'red');
    } else if (memberships) {
      const orphanMemberships = [];
      
      for (const membership of memberships) {
        // Verificar se o usuário ainda existe
        const userExists = users.users.some(u => u.id === membership.user_id);
        if (!userExists) {
          orphanMemberships.push(membership);
        }
      }
      
      if (orphanMemberships.length > 0) {
        log(`⚠️  Encontrados ${orphanMemberships.length} membros órfãos:`, 'yellow');
        
        for (const membership of orphanMemberships) {
          try {
            await supabaseAdmin
              .from('user_memberships')
              .delete()
              .eq('id', membership.id);
            log(`✅ Removido membro órfão: ${membership.user_id}`, 'green');
          } catch (error) {
            log(`❌ Erro ao remover membro órfão: ${error.message}`, 'red');
          }
        }
      } else {
        log('✅ Nenhum membro órfão encontrado', 'green');
      }
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na limpeza: ${error.message}`, 'red');
    return false;
  }
}

// Função principal
async function main() {
  log('🚀 LIMPEZA DIRETA DE DUPLICADOS', 'bright');
  
  try {
    const success = await cleanDuplicates();
    
    if (success) {
      log('\n🎉 Limpeza concluída com sucesso!', 'green');
      log('💡 Agora você pode tentar cadastrar novamente', 'yellow');
    } else {
      log('\n❌ Erro na limpeza', 'red');
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

module.exports = { cleanDuplicates };
