#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

console.log('🚀 Configurando ERP Lite...\n');

// Verificar se o arquivo .env.local já existe
const envPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), 'env.example');

if (fs.existsSync(envPath)) {
  console.log('⚠️  Arquivo .env.local já existe!');
  console.log('   Se quiser recriar, delete o arquivo atual primeiro.\n');
} else {
  // Ler o arquivo de exemplo
  if (!fs.existsSync(envExamplePath)) {
    console.error('❌ Arquivo env.example não encontrado!');
    process.exit(1);
  }

  let envContent = fs.readFileSync(envExamplePath, 'utf8');

  // Gerar JWT_SECRET aleatório
  const jwtSecret = crypto.randomBytes(32).toString('base64');
  envContent = envContent.replace('sua-chave-jwt-super-secreta-aqui', jwtSecret);

  // Criar o arquivo .env.local
  fs.writeFileSync(envPath, envContent);
  console.log('✅ Arquivo .env.local criado com sucesso!');
  console.log('   JWT_SECRET gerado automaticamente.\n');
}

// Verificar se o npm está disponível
const { execSync } = require('child_process');

try {
  execSync('npm --version', { stdio: 'ignore' });
  console.log('✅ npm está disponível');
} catch (error) {
  console.log('❌ npm não está disponível!');
  process.exit(1);
}

// Verificar se as dependências estão instaladas
const nodeModulesPath = path.join(process.cwd(), 'node_modules');
if (!fs.existsSync(nodeModulesPath)) {
  console.log('📦 Instalando dependências...');
  try {
    execSync('npm install --legacy-peer-deps', { stdio: 'inherit' });
    console.log('✅ Dependências instaladas com sucesso!\n');
  } catch (error) {
    console.error('❌ Erro ao instalar dependências:', error.message);
    process.exit(1);
  }
} else {
  console.log('✅ Dependências já instaladas\n');
}

console.log('🎉 Configuração concluída!\n');
console.log('📝 Próximos passos:');
console.log('   1. Edite o arquivo .env.local com suas credenciais da Zoer.ai');
console.log('   2. Execute: npm run dev');
console.log('   3. Acesse: http://localhost:3000');
console.log('   4. Faça login com: admin@erplite.com / admin123\n');
console.log('📖 Consulte o arquivo setup.md para mais detalhes.');
