const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Carregar variáveis de ambiente
function loadEnvFile() {
  const envPath = path.join(__dirname, '..', '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('❌ Arquivo .env.local não encontrado!');
    process.exit(1);
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

async function createAdminUser() {
  console.log('👤 Criando usuário admin...\n');
  
  const env = loadEnvFile();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis do Supabase não encontradas no .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Tentar criar usuário admin
    console.log('📧 Criando conta gabrieldesouza104@gmail.com...');
    
    const { data, error } = await supabase.auth.signUp({
      email: 'gabrieldesouza104@gmail.com',
      password: '123456',
      options: {
        data: {
          name: 'Gabriel de Souza',
          role: 'admin'
        }
      }
    });
    
    if (error) {
      console.error('❌ Erro ao criar usuário:', error.message);
      
      if (error.message.includes('already registered')) {
        console.log('✅ Usuário já existe!');
        console.log('\n📋 Para fazer login:');
        console.log('Email: admin@erplite.com');
        console.log('Senha: 123456');
        console.log('\n⚠️  Se aparecer "Email not confirmed":');
        console.log('1. Acesse o dashboard do Supabase');
        console.log('2. Vá para Authentication → Settings');
        console.log('3. Desabilite "Enable email confirmations"');
        console.log('4. Salve as alterações');
        console.log('5. Tente fazer login novamente');
      }
    } else {
      console.log('✅ Usuário criado com sucesso!');
              console.log('📧 Email: gabrieldesouza104@gmail.com');
      console.log('🔑 Senha: 123456');
      
      if (data.user && !data.user.email_confirmed_at) {
        console.log('\n⚠️  Email não confirmado!');
        console.log('📋 Para resolver:');
        console.log('1. Acesse o dashboard do Supabase');
        console.log('2. Vá para Authentication → Settings');
        console.log('3. Desabilite "Enable email confirmations"');
        console.log('4. Salve as alterações');
        console.log('5. Tente fazer login novamente');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

createAdminUser();
