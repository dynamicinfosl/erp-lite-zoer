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

async function confirmUserEmail() {
  console.log('📧 Confirmando email do usuário...\n');
  
  const env = loadEnvFile();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis do Supabase não encontradas no .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Tentar fazer login para verificar se o usuário existe
    console.log('🔍 Verificando usuário...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'gabrieldesouza104@gmail.com',
      password: '123456'
    });
    
    if (error) {
      if (error.message.includes('Email not confirmed')) {
        console.log('⚠️  Email não confirmado!');
        console.log('\n📋 Soluções:');
        console.log('1. **Via Dashboard do Supabase:**');
        console.log('   - Acesse: https://supabase.com/dashboard');
        console.log('   - Vá para: Authentication → Settings');
        console.log('   - Desabilite: "Enable email confirmations"');
        console.log('   - Salve as alterações');
        console.log('\n2. **Via Conexão Direta (Recomendado):**');
        console.log('   - Use pgAdmin, DBeaver ou TablePlus');
        console.log('   - Conecte com: postgresql://postgres:[97872715Ga!]@db.lfxietcasaooenffdodr.supabase.co:5432/postgres');
        console.log('   - Execute: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = \'gabrieldesouza104@gmail.com\';');
        console.log('\n3. **Via SQL Editor do Supabase:**');
        console.log('   - Acesse: SQL Editor no dashboard');
        console.log('   - Execute o comando UPDATE acima');
        
      } else if (error.message.includes('Invalid login credentials')) {
        console.log('❌ Credenciais inválidas!');
        console.log('💡 Execute: npm run create-admin');
        
      } else {
        console.log('❌ Erro:', error.message);
      }
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('📧 Email:', data.user.email);
      console.log('✅ Email já está confirmado!');
      console.log('\n🎉 Sistema pronto para uso!');
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

confirmUserEmail();
