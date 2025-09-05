const { Client } = require('pg');

// String de conexão direta do Supabase
const connectionString = 'postgresql://postgres:[97872715Ga!]@db.lfxietcasaooenffdodr.supabase.co:5432/postgres';

async function testDirectConnection() {
  console.log('🔗 Testando conexão direta com PostgreSQL...\n');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ Conexão direta estabelecida com sucesso!');
    
    // Testar consulta
    const result = await client.query('SELECT version()');
    console.log('📊 Versão do PostgreSQL:', result.rows[0].version);
    
    // Verificar tabelas existentes
    const tablesResult = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    
    console.log('\n📋 Tabelas existentes:');
    if (tablesResult.rows.length > 0) {
      tablesResult.rows.forEach(row => {
        console.log(`  - ${row.table_name}`);
      });
    } else {
      console.log('  ⚠️  Nenhuma tabela encontrada');
      console.log('  💡 Execute o SQL do app.sql para criar as tabelas');
    }
    
    // Verificar usuários
    const usersResult = await client.query(`
      SELECT email, email_confirmed_at, created_at
      FROM auth.users
      ORDER BY created_at DESC
      LIMIT 5
    `);
    
    console.log('\n👥 Usuários cadastrados:');
    if (usersResult.rows.length > 0) {
      usersResult.rows.forEach(user => {
        console.log(`  - ${user.email} (${user.email_confirmed_at ? 'Confirmado' : 'Não confirmado'})`);
      });
    } else {
      console.log('  ⚠️  Nenhum usuário encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro na conexão:', error.message);
  } finally {
    await client.end();
  }
}

async function createAdminUserDirect() {
  console.log('\n👤 Criando usuário admin via conexão direta...\n');
  
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    
    // Verificar se usuário já existe
    const existingUser = await client.query(
      'SELECT id FROM auth.users WHERE email = $1',
      ['gabrieldesouza104@gmail.com']
    );
    
    if (existingUser.rows.length > 0) {
      console.log('✅ Usuário já existe!');
      
      // Confirmar email diretamente
      await client.query(
        'UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1',
        ['gabrieldesouza104@gmail.com']
      );
      console.log('✅ Email confirmado diretamente no banco!');
      
    } else {
      console.log('📧 Criando novo usuário...');
      
      // Criar usuário diretamente
      const userId = require('crypto').randomUUID();
      const hashedPassword = require('bcrypt').hashSync('123456', 10);
      
      await client.query(`
        INSERT INTO auth.users (
          id, email, encrypted_password, email_confirmed_at, 
          created_at, updated_at, aud, role
        ) VALUES ($1, $2, $3, NOW(), NOW(), NOW(), 'authenticated', 'authenticated')
      `, [userId, 'gabrieldesouza104@gmail.com', hashedPassword]);
      
      console.log('✅ Usuário criado com sucesso!');
    }
    
    // Criar perfil do usuário
    const userResult = await client.query(
      'SELECT id FROM auth.users WHERE email = $1',
      ['gabrieldesouza104@gmail.com']
    );
    
    if (userResult.rows.length > 0) {
      const userId = userResult.rows[0].id;
      
      // Verificar se perfil já existe
      const existingProfile = await client.query(
        'SELECT id FROM user_profiles WHERE user_id = $1',
        [userId]
      );
      
      if (existingProfile.rows.length === 0) {
        await client.query(`
          INSERT INTO user_profiles (user_id, name, role_type)
          VALUES ($1, $2, $3)
        `, [userId, 'Gabriel de Souza', 'admin']);
        
        console.log('✅ Perfil de usuário criado!');
      } else {
        console.log('✅ Perfil de usuário já existe!');
      }
    }
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await client.end();
  }
}

// Executar testes
async function main() {
  await testDirectConnection();
  await createAdminUserDirect();
  
  console.log('\n🎯 Configuração concluída!');
  console.log('🚀 Agora você pode fazer login com:');
  console.log('   Email: gabrieldesouza104@gmail.com');
  console.log('   Senha: 123456');
}

main();
