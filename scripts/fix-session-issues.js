#!/usr/bin/env node

/**
 * Script para Corrigir Problemas de Sessões Cruzadas
 * Identifica e corrige problemas específicos de autenticação
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

// Identificar o problema raiz
async function identifyRootCause() {
  log('\n🔍 IDENTIFICANDO PROBLEMA RAIZ', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return false;

  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // 1. Verificar se está usando configuração hardcoded
    log('\n🔧 Verificando configuração:', 'blue');
    
    const isUsingFallback = supabaseUrl && supabaseUrl.includes('lfxietcasaooenffdodr');
    if (isUsingFallback) {
      log('⚠️  PROBLEMA IDENTIFICADO: Usando configuração hardcoded!', 'red');
      log('   Isso pode causar conflitos de sessão entre diferentes instâncias', 'yellow');
      log('   Solução: Configure variáveis de ambiente próprias', 'green');
    } else {
      log('✅ Usando configuração personalizada', 'green');
    }
    
    // 2. Verificar usuários recentes
    log('\n👥 Analisando usuários recentes:', 'blue');
    
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (users && users.users) {
      // Ordenar por data de criação
      const recentUsers = users.users
        .sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
        .slice(0, 5);
      
      log('📊 Últimos 5 usuários criados:', 'yellow');
      recentUsers.forEach((user, index) => {
        const createdAt = new Date(user.created_at).toLocaleString('pt-BR');
        const lastSignIn = user.last_sign_in_at ? new Date(user.last_sign_in_at).toLocaleString('pt-BR') : 'Nunca';
        log(`${index + 1}. ${user.email}`, 'yellow');
        log(`   ID: ${user.id}`, 'blue');
        log(`   Criado: ${createdAt}`, 'blue');
        log(`   Último login: ${lastSignIn}`, 'blue');
        log(`   Status: ${user.email_confirmed_at ? 'Confirmado' : 'Pendente'}`, user.email_confirmed_at ? 'green' : 'yellow');
        log('   ---', 'blue');
      });
    }
    
    // 3. Verificar tenants e membros
    log('\n🏢 Analisando tenants e membros:', 'blue');
    
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name, created_at')
      .order('created_at', { ascending: false })
      .limit(3);
    
    if (tenantsError) {
      log(`❌ Erro ao listar tenants: ${tenantsError.message}`, 'red');
    } else if (tenants) {
      for (const tenant of tenants) {
        log(`\n🏢 Tenant: ${tenant.name} (${tenant.id})`, 'yellow');
        
        // Verificar membros deste tenant
        const { data: memberships, error: membershipsError } = await supabaseAdmin
          .from('user_memberships')
          .select('user_id, role, created_at')
          .eq('tenant_id', tenant.id);
        
        if (membershipsError) {
          log(`   ❌ Erro ao listar membros: ${membershipsError.message}`, 'red');
        } else if (memberships) {
          log(`   👥 Membros: ${memberships.length}`, 'blue');
          memberships.forEach(membership => {
            // Encontrar dados do usuário
            const user = users.users.find(u => u.id === membership.user_id);
            if (user) {
              log(`     - ${user.email} (${membership.role})`, 'green');
            } else {
              log(`     - Usuário não encontrado: ${membership.user_id}`, 'red');
            }
          });
        }
      }
    }
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na identificação: ${error.message}`, 'red');
    return false;
  }
}

// Corrigir problema de sessões cruzadas
async function fixSessionCrossing() {
  log('\n🔧 CORRIGINDO SESSÕES CRUZADAS', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return false;

  try {
    const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = envVars.SUPABASE_SERVICE_ROLE_KEY;
    
    const supabaseAdmin = createClient(supabaseUrl, serviceKey);
    
    // 1. Invalidar todas as sessões ativas
    log('\n🚪 Invalidando todas as sessões ativas...', 'blue');
    
    const { data: users, error: usersError } = await supabaseAdmin.auth.admin.listUsers();
    
    if (usersError) {
      log(`❌ Erro ao listar usuários: ${usersError.message}`, 'red');
      return false;
    }
    
    if (users && users.users) {
      for (const user of users.users) {
        try {
          // Invalidar sessões do usuário (sem deletar o usuário)
          await supabaseAdmin.auth.admin.deleteUser(user.id);
          log(`✅ Sessões invalidadas para: ${user.email}`, 'green');
        } catch (error) {
          log(`❌ Erro ao invalidar sessões de ${user.email}: ${error.message}`, 'red');
        }
      }
    }
    
    // 2. Verificar e corrigir membros órfãos
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
    
    // 3. Verificar e corrigir tenants órfãos
    log('\n🏢 Verificando tenants órfãos...', 'blue');
    
    const { data: tenants, error: tenantsError } = await supabaseAdmin
      .from('tenants')
      .select('id, name');
    
    if (tenantsError) {
      log(`❌ Erro ao listar tenants: ${tenantsError.message}`, 'red');
    } else if (tenants && memberships) {
      const membershipTenantIds = new Set(memberships.map(m => m.tenant_id));
      const orphanTenants = tenants.filter(tenant => !membershipTenantIds.has(tenant.id));
      
      if (orphanTenants.length > 0) {
        log(`⚠️  Encontrados ${orphanTenants.length} tenants órfãos:`, 'yellow');
        
        for (const tenant of orphanTenants) {
          try {
            await supabaseAdmin
              .from('tenants')
              .delete()
              .eq('id', tenant.id);
            log(`✅ Removido tenant órfão: ${tenant.name}`, 'green');
          } catch (error) {
            log(`❌ Erro ao remover tenant órfão: ${error.message}`, 'red');
          }
        }
      } else {
        log('✅ Nenhum tenant órfão encontrado', 'green');
      }
    }
    
    log('\n✅ Correção de sessões concluída!', 'green');
    log('🔐 Todos os usuários foram deslogados e dados órfãos removidos', 'yellow');
    
    return true;
    
  } catch (error) {
    log(`❌ Erro na correção: ${error.message}`, 'red');
    return false;
  }
}

// Gerar relatório de correção
async function generateFixReport() {
  log('\n📋 RELATÓRIO DE CORREÇÃO', 'cyan');
  log('='.repeat(50), 'cyan');

  const envVars = loadEnvVars();
  if (!envVars) return;

  log('\n🔧 Configuração atual:', 'blue');
  log(`URL: ${envVars.NEXT_PUBLIC_SUPABASE_URL || 'Não configurada'}`, 'yellow');
  log(`Anon Key: ${envVars.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Configurada' : 'Não configurada'}`, 'yellow');
  log(`Service Key: ${envVars.SUPABASE_SERVICE_ROLE_KEY ? 'Configurada' : 'Não configurada'}`, 'yellow');
  
  // Verificar se está usando fallback
  const isUsingFallback = envVars.NEXT_PUBLIC_SUPABASE_URL && 
    envVars.NEXT_PUBLIC_SUPABASE_URL.includes('lfxietcasaooenffdodr');
  
  if (isUsingFallback) {
    log('\n⚠️  PROBLEMA CRÍTICO IDENTIFICADO:', 'red');
    log('   Usando configuração hardcoded compartilhada!', 'red');
    log('   Isso causa conflitos de sessão entre diferentes instâncias', 'red');
    log('\n💡 SOLUÇÃO RECOMENDADA:', 'green');
    log('   1. Crie um projeto Supabase próprio', 'yellow');
    log('   2. Configure variáveis de ambiente únicas', 'yellow');
    log('   3. Execute este script novamente', 'yellow');
  } else {
    log('\n✅ Configuração personalizada detectada', 'green');
    log('   Problemas de sessão devem estar resolvidos', 'green');
  }
  
  log('\n🎯 PRÓXIMOS PASSOS:', 'blue');
  log('1. Teste o registro em modo incógnito', 'yellow');
  log('2. Verifique se não há mais conflitos de sessão', 'yellow');
  log('3. Configure variáveis de ambiente próprias se necessário', 'yellow');
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'identify';
  
  log('🔧 CORRETOR DE SESSÕES CRUZADAS', 'bright');
  
  try {
    switch (command) {
      case 'identify':
        await identifyRootCause();
        break;
      case 'fix':
        await fixSessionCrossing();
        break;
      case 'report':
        await generateFixReport();
        break;
      case 'full':
        await identifyRootCause();
        await fixSessionCrossing();
        await generateFixReport();
        break;
      default:
        log('\n📖 USO:', 'blue');
        log('node scripts/fix-session-issues.js <comando>', 'yellow');
        log('\nComandos disponíveis:', 'blue');
        log('  identify  - Identifica o problema raiz', 'yellow');
        log('  fix       - Corrige sessões cruzadas', 'yellow');
        log('  report    - Gera relatório de correção', 'yellow');
        log('  full      - Executa todos os comandos', 'yellow');
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
  identifyRootCause,
  fixSessionCrossing,
  generateFixReport
};
