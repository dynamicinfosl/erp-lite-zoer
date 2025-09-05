#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🔍 Testando conexão com o banco de dados...\n');

// Carregar variáveis de ambiente manualmente
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key.trim()] = valueParts.join('=').trim();
    }
  });
}

const requiredVars = [
  'POSTGREST_URL',
  'POSTGREST_API_KEY',
  'JWT_SECRET'
];

console.log('📋 Verificando variáveis de ambiente:');
let allVarsPresent = true;

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value && value !== `sua-${varName.toLowerCase().replace(/_/g, '-')}-aqui`) {
    console.log(`✅ ${varName}: Configurado`);
  } else {
    console.log(`❌ ${varName}: Não configurado ou usando valor padrão`);
    allVarsPresent = false;
  }
});

if (!allVarsPresent) {
  console.log('\n⚠️  Configure as variáveis de ambiente no arquivo .env.local');
  console.log('   Consulte o arquivo setup.md para mais detalhes.\n');
  process.exit(1);
}

// Testar conexão com o banco
async function testConnection() {
  try {
    const response = await fetch(`${process.env.POSTGREST_URL}/users?limit=1`, {
      headers: {
        'Postgrest-API-Key': process.env.POSTGREST_API_KEY,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      console.log('✅ Conexão com banco de dados: OK');
      console.log('✅ API Key: Válida');
    } else {
      console.log('❌ Erro na conexão com banco de dados');
      console.log(`   Status: ${response.status}`);
      console.log(`   Erro: ${response.statusText}`);
    }
  } catch (error) {
    console.log('❌ Erro ao conectar com banco de dados:');
    console.log(`   ${error.message}`);
  }
}

// Verificar se fetch está disponível (Node.js 18+)
if (typeof fetch === 'undefined') {
  console.log('⚠️  Node.js 18+ necessário para testar conexão');
  console.log('   Execute manualmente: pnpm dev\n');
} else {
  testConnection().then(() => {
    console.log('\n🎉 Teste concluído!');
    console.log('   Execute: pnpm dev para iniciar o servidor\n');
  });
}
