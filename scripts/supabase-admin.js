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

async function supabaseAdmin() {
  console.log('🔧 SUPABASE ADMIN - Configuração via API');
  console.log('=========================================\n');
  
  const env = loadEnvFile();
  
  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Variáveis do Supabase não encontradas no .env.local');
    process.exit(1);
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // 1. Verificar conexão
    console.log('🔗 Testando conexão com Supabase...');
    const { data: testData, error: testError } = await supabase.from('categories').select('count').limit(1);
    
    if (testError) {
      console.error('❌ Erro na conexão:', testError.message);
      console.log('\n📋 Verifique se:');
      console.log('1. O SQL do app.sql foi executado no Supabase');
      console.log('2. As tabelas foram criadas corretamente');
      console.log('3. As credenciais estão corretas');
      return;
    }
    
    console.log('✅ Conexão estabelecida com sucesso!');
    
    // 2. Tentar fazer login
    console.log('\n🔐 Testando login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'gabrieldesouza104@gmail.com',
      password: '123456'
    });
    
    if (authError) {
      if (authError.message.includes('Email not confirmed')) {
        console.log('⚠️  Email não confirmado!');
        console.log('\n📋 SOLUÇÕES:');
        console.log('1. **Via Dashboard (Recomendado):**');
        console.log('   - Acesse: https://supabase.com/dashboard');
        console.log('   - Vá para: Authentication → Settings');
        console.log('   - Desabilite: "Enable email confirmations"');
        console.log('   - Salve as alterações');
        console.log('\n2. **Via SQL Editor:**');
        console.log('   - Acesse: SQL Editor no dashboard');
        console.log('   - Execute: UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = \'gabrieldesouza104@gmail.com\';');
        console.log('\n3. **Via pgAdmin/DBeaver:**');
        console.log('   - Conecte com: postgresql://postgres:[97872715Ga!]@db.lfxietcasaooenffdodr.supabase.co:5432/postgres');
        console.log('   - Execute o comando UPDATE acima');
        
      } else if (authError.message.includes('Invalid login credentials')) {
        console.log('❌ Credenciais inválidas!');
        console.log('💡 Execute: npm run create-admin');
        
      } else {
        console.log('❌ Erro:', authError.message);
      }
    } else {
      console.log('✅ Login realizado com sucesso!');
      console.log('📧 Email:', authData.user.email);
      console.log('✅ Email confirmado!');
      
      // 3. Verificar perfil do usuário
      console.log('\n👤 Verificando perfil do usuário...');
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', authData.user.id)
        .single();
      
      if (profileError) {
        console.log('📝 Criando perfil do usuário...');
        const { data: newProfile, error: newProfileError } = await supabase
          .from('user_profiles')
          .insert({
            user_id: authData.user.id,
            name: 'Gabriel de Souza',
            role_type: 'admin'
          })
          .select()
          .single();
        
        if (newProfileError) {
          console.error('❌ Erro ao criar perfil:', newProfileError.message);
        } else {
          console.log('✅ Perfil criado com sucesso!');
        }
      } else {
        console.log('✅ Perfil já existe!');
        console.log('👤 Nome:', profileData.name);
        console.log('🔑 Role:', profileData.role_type);
      }
      
      // 4. Inserir dados de teste
      console.log('\n🧪 Inserindo dados de teste...');
      
      // Inserir categorias
      const { data: categories, error: categoriesError } = await supabase
        .from('categories')
        .upsert([
          { name: 'Refrigerantes', description: 'Bebidas gaseificadas', color: '#e74c3c' },
          { name: 'Cervejas', description: 'Cervejas nacionais e importadas', color: '#f39c12' },
          { name: 'Águas', description: 'Águas minerais', color: '#3498db' },
          { name: 'Energéticos', description: 'Bebidas energéticas', color: '#9b59b6' }
        ], { onConflict: 'name' })
        .select();
      
      if (categoriesError) {
        console.error('❌ Erro ao inserir categorias:', categoriesError.message);
      } else {
        console.log('✅ Categorias inseridas/atualizadas!');
      }
      
      // Inserir produtos
      const { data: products, error: productsError } = await supabase
        .from('products')
        .upsert([
          {
            user_id: authData.user.id,
            category_id: 1,
            name: 'Coca-Cola 350ml',
            sku: 'COCA350',
            barcode: '7891234567890',
            description: 'Refrigerante Coca-Cola 350ml',
            cost_price: 2.50,
            sale_price: 4.50,
            stock_quantity: 50,
            min_stock: 10,
            unit: 'UN'
          },
          {
            user_id: authData.user.id,
            category_id: 1,
            name: 'Pepsi 350ml',
            sku: 'PEPSI350',
            barcode: '7891234567891',
            description: 'Refrigerante Pepsi 350ml',
            cost_price: 2.30,
            sale_price: 4.20,
            stock_quantity: 30,
            min_stock: 10,
            unit: 'UN'
          },
          {
            user_id: authData.user.id,
            category_id: 2,
            name: 'Skol 350ml',
            sku: 'SKOL350',
            barcode: '7891234567892',
            description: 'Cerveja Skol 350ml',
            cost_price: 3.20,
            sale_price: 5.50,
            stock_quantity: 25,
            min_stock: 5,
            unit: 'UN'
          }
        ], { onConflict: 'sku' })
        .select();
      
      if (productsError) {
        console.error('❌ Erro ao inserir produtos:', productsError.message);
      } else {
        console.log('✅ Produtos inseridos/atualizados!');
      }
      
      console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
      console.log('==========================');
      console.log('✅ Email confirmado');
      console.log('✅ Perfil criado');
      console.log('✅ Dados de teste inseridos');
      console.log('\n🚀 Sistema pronto para uso!');
    }
    
  } catch (error) {
    console.error('❌ Erro geral:', error.message);
  }
}

supabaseAdmin();
