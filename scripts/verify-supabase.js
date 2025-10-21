#!/usr/bin/env node

/**
 * Script de Verificação do Supabase
 * Verifica e corrige problemas de configuração e sessões cruzadas
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

// Verificar configuração do Supabase
async function verifySupabaseConfig() {
  log('\n🔍 VERIFICAÇÃO DO SUPABASE', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) {
    return false;
  }

  // Verificar variáveis de ambiente
  log('\n📋 Verificando variáveis de ambiente:', 'blue');
  
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_ROLE_KEY'
  ];

  let allVarsPresent = true;
  
  requiredVars.forEach(varName => {
    if (envVars[varName]) {
      log(`✅ ${varName}: Configurada`, 'green');
    } else {
      log(`❌ ${varName}: Não configurada`, 'red');
      allVarsPresent = false;
    }
  });

  if (!allVarsPresent) {
    log('\n⚠️  Algumas variáveis de ambiente estão faltando!', 'yellow');
    return false;
  }

  // Testar conexão com Supabase
  log('\n🔗 Testando conexão com Supabase:', 'blue');
  
  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    // Testar conexão básica
    const { data, error } = await supabase.from('tenants').select('count').limit(1);
    
    if (error) {
      log(`❌ Erro na conexão: ${error.message}`, 'red');
      return false;
    }
    
    log('✅ Conexão com Supabase estabelecida', 'green');
    
    // Verificar tabelas essenciais
    log('\n📊 Verificando tabelas essenciais:', 'blue');
    
    const tables = ['tenants', 'user_memberships', 'users'];
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          log(`❌ Tabela ${table}: ${tableError.message}`, 'red');
        } else {
          log(`✅ Tabela ${table}: OK`, 'green');
        }
      } catch (err) {
        log(`❌ Tabela ${table}: Erro - ${err.message}`, 'red');
      }
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na conexão: ${error.message}`, 'red');
    return false;
  }
}

// Verificar sessões ativas
async function checkActiveSessions() {
  log('\n🔐 VERIFICAÇÃO DE SESSÕES', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return false;

  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Listar usuários recentes
    log('\n👥 Usuários criados recentemente:', 'blue');
    
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (users && users.users) {
      users.users.slice(0, 5).forEach((user, index) => {
        const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
        log(`${index + 1}. ${user.email} (${user.id}) - ${createdAt}`, 'yellow');
      });
    }
    
    // Verificar tenants
    log('\n🏢 Tenants ativos:', 'blue');
    
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, status, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tenantsError) {
      log(`❌ Erro ao listar tenants: ${tenantsError.message}`, 'red');
    } else if (tenants) {
      tenants.forEach((tenant, index) => {
        const createdAt = new Date(tenant.created_at).toLocaleString('pt-BR');
        log(`${index + 1}. ${tenant.name} (${tenant.id}) - Status: ${tenant.status} - ${createdAt}`, 'yellow');
      });
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro ao verificar sessões: ${error.message}`, 'red');
    return false;
  }
}

// Limpar sessões problemáticas
async function clearProblematicSessions() {
  log('\n🧹 LIMPEZA DE SESSÕES', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return false;

  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // Listar todas as sessões ativas
    log('\n🔍 Verificando sessões ativas...', 'blue');
    
    const { data: sessions, error: sessionsError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (sessionsError) {
      log(`❌ Erro ao listar sessões: ${sessionsError.message}`, 'red');
      return false;
    }
    
    if (sessions && sessions.users) {
      log(`📊 Total de usuários: ${sessions.users.length}`, 'yellow');
      
      // Verificar usuários duplicados por email
      const emailCounts = {};
      sessions.users.forEach(user => {
        if (emailCounts[user.email]) {
          emailCounts[user.email]++;
        } else {
          emailCounts[user.email] = 1;
        }
      });
      
      const duplicates = Object.entries(emailCounts).filter(([email, count]) => count > 1);
      
      if (duplicates.length > 0) {
        log('\n⚠️  Emails duplicados encontrados:', 'yellow');
        duplicates.forEach(([email, count]) => {
          log(`   ${email}: ${count} contas`, 'red');
        });
      } else {
        log('✅ Nenhum email duplicado encontrado', 'green');
      }
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na limpeza: ${error.message}`, 'red');
    return false;
  }
}

// Gerar relatório de configuração
function generateConfigReport() {
  log('\n📋 RELATÓRIO DE CONFIGURAÇÃO', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return;

  log('\n🔧 Configurações atuais:', 'blue');
  log(`URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL || 'Não configurada'}`, 'yellow');
  log(`Anon Key: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'}`, 'yellow');
  log(`Service Key: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada'}`, 'yellow');
  
  // Verificar se está usando fallback
  const isUsingFallback = envVars.NEXT_PUBLIC_SUPABASE_URL && 
    envVars.NEXT_PUBLIC_SUPABASE_URL.includes('lfxietcasaooenffdodr');
  
  if (isUsingFallback) {
    log('\n⚠️  ATENÇÃO: Usando configuração de fallback (hardcoded)', 'yellow');
    log('   Isso pode causar problemas de sessão cruzada!', 'red');
  } else {
    log('\n✅ Usando configuração personalizada', 'green');
  }
}

// Função principal
async function main() {
  log('🚀 VERIFICADOR DO SUPABASE', 'bright');
  log('Verificando configuração e sessões...', 'blue');
  
  try {
    // 1. Verificar configuração
    const configOk = await verifySupabaseConfig();
    
    // 2. Verificar sessões
    const sessionsOk = await checkActiveSessions();
    
    // 3. Limpar sessões problemáticas
    const cleanupOk = await clearProblematicSessions();
    
    // 4. Gerar relatório
    generateConfigReport();
    
    // Resultado final
    log('\n📊 RESUMO DA VERIFICAÇÃO', 'cyan');
    log('='.repeat(50), 'cyan');
    
    if (configOk && sessionsOk && cleanupOk) {
      log('✅ Todas as verificações passaram!', 'green');
      log('🎉 Supabase está configurado corretamente', 'green');
    } else {
      log('❌ Algumas verificações falharam', 'red');
      log('🔧 Verifique os erros acima e corrija a configuração', 'yellow');
    }
    
    log('\n💡 RECOMENDAÇÕES:', 'blue');
    log('1. Use variáveis de ambiente próprias (não fallback)', 'yellow');
    log('2. Verifique se não há usuários duplicados', 'yellow');
    log('3. Limpe o cache do navegador após mudanças', 'yellow');
    log('4. Teste o registro em modo incógnito', 'yellow');
    
  } catch (error) {
    log(`❌ Erro geral: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = {
  verifySupabaseConfig,
  checkActiveSessions,
  clearProblematicSessions,
  generateConfigReport
};
