#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

console.log('🗄️  Configurando banco de dados no Supabase...\n');

// Carregar variáveis de ambiente
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

const SUPABASE_URL = process.env.POSTGREST_URL?.replace('/rest/v1', '');
const SUPABASE_ANON_KEY = process.env.POSTGREST_API_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Variáveis de ambiente não configuradas!');
  process.exit(1);
}

console.log('✅ Credenciais carregadas');
console.log(`📍 URL: ${SUPABASE_URL}`);
console.log(`🔑 API Key: ${SUPABASE_ANON_KEY.substring(0, 20)}...\n`);

// Ler o arquivo SQL
const sqlPath = path.join(process.cwd(), 'app.sql');
if (!fs.existsSync(sqlPath)) {
  console.error('❌ Arquivo app.sql não encontrado!');
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlPath, 'utf8');
console.log('✅ Script SQL carregado\n');

console.log('📋 Instruções para configurar o banco:');
console.log('1. Acesse o dashboard do Supabase: https://supabase.com/dashboard');
console.log('2. Vá para o seu projeto');
console.log('3. Clique em "SQL Editor" no menu lateral');
console.log('4. Clique em "New query"');
console.log('5. Cole o conteúdo do arquivo app.sql');
console.log('6. Clique em "Run" para executar\n');

console.log('📄 Conteúdo do SQL para copiar:');
console.log('=' .repeat(80));
console.log(sqlContent);
console.log('=' .repeat(80));

console.log('\n🎯 Após executar o SQL, execute: npm run test-connection');
console.log('🚀 Depois execute: npm run dev para iniciar o sistema');
