#!/usr/bin/env node

/**
 * Script para Verificar Usuário Específico
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

async function checkSpecificUser() {
  log('🔍 VERIFICAÇÃO DE USUÁRIO ESPECÍFICO', 'cyan');
  log('='.repeat(50), 'cyan');

  try {
    const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
    
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
    
    // Procurar por caio@teste.com
    const targetEmail = 'caio@teste.com';
    const matchingUsers = users.users.filter(user => user.email === targetEmail);
    
    log(`\n🔍 Procurando por: ${targetEmail}`, 'blue');
    
    if (matchingUsers.length === 0) {
      log('✅ Nenhum usuário encontrado com este email', 'green');
    } else {
      log(`⚠️  Encontrados ${matchingUsers.length} usuários com este email:`, 'yellow');
      
      matchingUsers.forEach((user, index) => {
        const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca';
        log(`\n${index + 1}. ID: ${user.id}`, 'blue');
        log(`   Email: ${user.email}`, 'blue');
        log(`   Criado: ${createdAt}`, 'blue');
        log(`   Último login: ${lastSignIn}`, 'blue');
        log(`   Confirmado: ${user.email_confirmed_at ? 'Sim' : 'Não'}`, 'blue');
        log(`   Status: ${user.banned_until ? 'Banido' : 'Ativo'}`, 'blue');
      });
      
      // Remover todos os usuários com este email
      log(`\n🗑️  Removendo todos os usuários com email ${targetEmail}...`, 'yellow');
      
      for (const user of matchingUsers) {
        try {
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          log(`✅ Removido: ${user.id}`, 'green');
        } catch (error) {
          log(`❌ Erro ao remover ${user.id}: ${error.message}`, 'red');
        }
      }
    }
    
    // Verificar outros emails de teste
    log('\n🔍 Verificando outros emails de teste...', 'blue');
    
    const testEmails = ['pedro@teste.com', 'teste@teste.com', 'admin@teste.com'];
    
    for (const email of testEmails) {
      const matchingUsers = users.users.filter(user => user.email === email);
      if (matchingUsers.length > 0) {
        log(`⚠️  ${email}: ${matchingUsers.length} usuários`, 'yellow');
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
  log('🚀 VERIFICAÇÃO DE USUÁRIO ESPECÍFICO', 'bright');
  
  try {
    const success = await checkSpecificUser();
    
    if (success) {
      log('\n🎉 Verificação concluída!', 'green');
    } else {
      log('\n❌ Erro na verificação', 'red');
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

module.exports = { checkSpecificUser };
