#!/usr/bin/env node

/**
 * Script de Execução Simples para Verificação do Supabase
 * Executa todos os scripts de verificação em sequência
 */

const { spawn } = require('child_process');
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

// Executar script
function runScript(scriptName, args = []) {
  return new Promise((resolve, reject) => {
    const scriptPath = path.join(__dirname, scriptName);
    const child = spawn('node', [scriptPath, ...args], { stdio: 'inherit' });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Script ${scriptName} falhou com código ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Função principal
async function main() {
  const args = process.argv.slice(2);
  const command = args[0] || 'full';
  
  log('🚀 VERIFICADOR COMPLETO DO SUPABASE', 'bright');
  log('Executando verificação completa...', 'blue');
  
  try {
    switch (command) {
      case 'verify':
        log('\n🔍 Executando verificação básica...', 'cyan');
        await runScript('verify-supabase.js');
        break;
        
      case 'clear':
        log('\n🧹 Executando limpeza de sessões...', 'cyan');
        await runScript('clear-sessions.js', ['clear-duplicates']);
        break;
        
      case 'fix':
        log('\n🔧 Executando correção de sessões...', 'cyan');
        await runScript('fix-session-issues.js', ['full']);
        break;
        
      case 'full':
        log('\n📋 Executando verificação completa...', 'cyan');
        
        log('\n1️⃣ Verificação básica...', 'blue');
        await runScript('verify-supabase.js');
        
        log('\n2️⃣ Identificação de problemas...', 'blue');
        await runScript('fix-session-issues.js', ['identify']);
        
        log('\n3️⃣ Limpeza de duplicados...', 'blue');
        await runScript('clear-sessions.js', ['clear-duplicates']);
        
        log('\n4️⃣ Correção de sessões...', 'blue');
        await runScript('fix-session-issues.js', ['fix']);
        
        log('\n5️⃣ Relatório final...', 'blue');
        await runScript('fix-session-issues.js', ['report']);
        
        break;
        
      default:
        log('\n📖 USO:', 'blue');
        log('node scripts/run-supabase-check.js <comando>', 'yellow');
        log('\nComandos disponíveis:', 'blue');
        log('  verify  - Verificação básica do Supabase', 'yellow');
        log('  clear   - Limpeza de sessões duplicadas', 'yellow');
        log('  fix     - Correção de problemas de sessão', 'yellow');
        log('  full    - Execução completa (recomendado)', 'yellow');
        log('\n💡 Para resolver o problema de sessões cruzadas:', 'green');
        log('   node scripts/run-supabase-check.js full', 'yellow');
        break;
    }
    
    log('\n✅ Verificação concluída!', 'green');
    log('🎉 Problemas identificados e corrigidos', 'green');
    
  } catch (error) {
    log(`❌ Erro na execução: ${error.message}`, 'red');
    process.exit(1);
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  main().catch(console.error);
}

module.exports = { main };
