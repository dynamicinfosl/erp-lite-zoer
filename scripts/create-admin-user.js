#!/usr/bin/env node

/**
 * Script para criar um usuário administrador no sistema
 * 
 * Uso:
 * node scripts/create-admin-user.js
 * 
 * Ou com parâmetros:
 * node scripts/create-admin-user.js --email admin@empresa.com --password senha123 --name "Admin Principal"
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Erro: Variáveis de ambiente do Supabase não encontradas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e NEXT_PUBLIC_SUPABASE_ANON_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Configurações padrão
const defaultAdmin = {
  email: 'admin@juga.com',
  password: 'admin123456',
  full_name: 'Administrador Principal',
  role: 'admin'
};

// Obter parâmetros da linha de comando
function getCommandLineArgs() {
  const args = process.argv.slice(2);
  const params = {
    email: defaultAdmin.email,
    password: defaultAdmin.password,
    name: defaultAdmin.full_name
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace('--', '');
    const value = args[i + 1];
    
    if (key && value) {
      switch (key) {
        case 'email':
          params.email = value;
          break;
        case 'password':
          params.password = value;
          break;
        case 'name':
          params.name = value;
          break;
      }
    }
  }

  return params;
}

async function createAdminUser() {
  const { email, password, name } = getCommandLineArgs();

  console.log('🚀 Criando usuário administrador...');
  console.log(`📧 Email: ${email}`);
  console.log(`👤 Nome: ${name}`);
  console.log('');

  try {
    // Criar novo usuário usando signUp (método público)
    const { data: newUser, error: createError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: 'admin'
        }
      }
    });

    if (createError) {
      throw createError;
    }

    if (newUser.user) {
      console.log('✅ Usuário administrador criado com sucesso!');
      console.log(`🆔 ID: ${newUser.user.id}`);
      console.log(`📧 Email: ${newUser.user.email}`);
      console.log(`👤 Nome: ${name}`);
      console.log(`🔑 Role: admin`);
      console.log('');
      console.log('🔐 Credenciais de acesso:');
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${password}`);
      console.log('');
      console.log('⚠️  Nota: Se o email não foi confirmado automaticamente, verifique sua caixa de entrada.');
    } else {
      console.log('⚠️  Usuário criado, mas pode precisar confirmar o email.');
      console.log('🔐 Credenciais de acesso:');
      console.log(`   Email: ${email}`);
      console.log(`   Senha: ${password}`);
    }

    console.log('');
    console.log('🌐 URLs de acesso:');
    console.log(`   Login normal: http://localhost:3000/login`);
    console.log(`   Login admin: http://localhost:3000/admin/login`);
    console.log('');
    console.log('📝 Códigos de administrador válidos:');
    console.log('   • ADMIN2024');
    console.log('   • JUGA-ADMIN');
    console.log('   • SUPER-ADMIN');
    console.log('   • 123456');
    console.log('   • admin123');

  } catch (error) {
    console.error('❌ Erro ao criar usuário administrador:', error.message);
    console.error('💡 Dica: Verifique se o email não está já cadastrado ou se as credenciais do Supabase estão corretas.');
    process.exit(1);
  }
}

// Executar o script
if (require.main === module) {
  createAdminUser();
}

module.exports = { createAdminUser };