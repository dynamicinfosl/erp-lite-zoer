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

async function setupSupabase() {
  console.log('🔧 Configurando Supabase...\n');
  
  const env = loadEnvFile();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis do Supabase não encontradas no .env.local');
    process.exit(1);
  }
  
  console.log('✅ Credenciais carregadas');
  console.log(`📍 URL: ${supabaseUrl}`);
  console.log(`🔑 Key: ${supabaseKey.substring(0, 20)}...\n`);
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Testar conexão
    console.log('🔍 Testando conexão...');
    const { data, error } = await supabase.from('categories').select('count').limit(1);
    
    if (error) {
      console.error('❌ Erro na conexão:', error.message);
      console.log('\n📋 Instruções:');
      console.log('1. Execute o SQL do app.sql no Supabase SQL Editor');
      console.log('2. Verifique se as tabelas foram criadas');
      console.log('3. Execute este script novamente');
      return;
    }
    
    console.log('✅ Conexão com Supabase estabelecida\n');
    
    // Verificar se existe usuário admin
    console.log('👤 Verificando usuário admin...');
    
    // Tentar fazer login com admin
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'admin@erplite.com',
      password: '123456'
    });
    
    if (authError) {
      console.log('⚠️  Usuário admin não encontrado ou senha incorreta');
      console.log('\n📋 Para criar o usuário admin:');
      console.log('1. Acesse o dashboard do Supabase');
      console.log('2. Vá para Authentication → Users');
      console.log('3. Clique em "Add user"');
      console.log('4. Email: admin@erplite.com');
      console.log('5. Senha: 123456');
      console.log('6. Confirme o email (ou desabilite confirmação)');
    } else {
      console.log('✅ Usuário admin encontrado');
      console.log(`📧 Email: ${authData.user.email}`);
    }
    
    console.log('\n🎯 Configuração concluída!');
    console.log('🚀 Execute: npm run dev');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
}

setupSupabase();
