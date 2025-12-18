const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Caminhos dos arquivos
const rootDir = path.join(__dirname, '..');
const envExamplePath = path.join(rootDir, 'env.example');
const envLocalPath = path.join(rootDir, '.env.local');

// Função para gerar chave aleatória
function generateRandomKey(length = 32) {
  return crypto.randomBytes(length).toString('base64');
}

// Função para gerar JWT secret
function generateJWTSecret() {
  return crypto.randomBytes(32).toString('base64');
}

console.log('🔧 Criando arquivo .env.local...\n');

// Verificar se .env.local já existe
if (fs.existsSync(envLocalPath)) {
  console.log('⚠️  O arquivo .env.local já existe!');
  console.log('   Deseja sobrescrever? (s/N)');
  console.log('   Para manter o arquivo existente, cancele este script (Ctrl+C)');
  console.log('   Para sobrescrever, edite o arquivo manualmente ou delete-o primeiro.\n');
  process.exit(1);
}

// Verificar se env.example existe
if (!fs.existsSync(envExamplePath)) {
  console.error('❌ Arquivo env.example não encontrado!');
  process.exit(1);
}

// Ler o conteúdo do env.example
let envContent = fs.readFileSync(envExamplePath, 'utf8');

// Substituir valores específicos
envContent = envContent.replace(
  /JWT_SECRET=sua-chave-jwt-super-secreta-aqui/g,
  `JWT_SECRET=${generateJWTSecret()}`
);

// Adicionar FISCAL_CERT_ENCRYPTION_KEY se não existir
if (!envContent.includes('FISCAL_CERT_ENCRYPTION_KEY')) {
  envContent += '\n\n# ===========================================\n';
  envContent += '# CONFIGURAÇÃO FOCUSNFE (CERTIFICADO)\n';
  envContent += '# ===========================================\n';
  envContent += '# Chave para criptografar senhas de certificados\n';
  envContent += `FISCAL_CERT_ENCRYPTION_KEY=${generateRandomKey()}\n`;
}

// Escrever o arquivo .env.local
fs.writeFileSync(envLocalPath, envContent, 'utf8');

console.log('✅ Arquivo .env.local criado com sucesso!\n');
console.log('📝 Próximos passos:');
console.log('   1. Abra o arquivo .env.local na raiz do projeto');
console.log('   2. Configure as seguintes variáveis com seus valores reais:');
console.log('      - NEXT_PUBLIC_SUPABASE_URL');
console.log('      - NEXT_PUBLIC_SUPABASE_ANON_KEY');
console.log('      - SUPABASE_SERVICE_ROLE_KEY');
console.log('   3. As chaves JWT_SECRET e FISCAL_CERT_ENCRYPTION_KEY já foram geradas automaticamente');
console.log('   4. Reinicie o servidor de desenvolvimento após configurar\n');

