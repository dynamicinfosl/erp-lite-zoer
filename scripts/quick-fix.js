const { DirectDBClient } = require('./db-client');

async function quickFix() {
  console.log('🔧 QUICK FIX - Configuração Rápida');
  console.log('===================================\n');
  
  const db = new DirectDBClient();
  
  try {
    // Conectar
    console.log('🔗 Conectando ao banco...');
    const connected = await db.connect();
    
    if (!connected) {
      console.log('❌ Não foi possível conectar ao banco');
      return;
    }
    
    // 1. Confirmar email do usuário
    console.log('📧 Confirmando email do usuário...');
    const user = await db.confirmUserEmail('gabrieldesouza104@gmail.com');
    
    if (user) {
      console.log('✅ Email confirmado com sucesso!');
      console.log('📧 Usuário:', user.email);
    } else {
      console.log('❌ Usuário não encontrado');
    }
    
    // 2. Verificar perfil do usuário
    console.log('\n👤 Verificando perfil do usuário...');
    const userProfile = await db.query(
      'SELECT * FROM user_profiles WHERE user_id = (SELECT id FROM auth.users WHERE email = $1)',
      ['gabrieldesouza104@gmail.com']
    );
    
    if (userProfile.rows.length === 0) {
      console.log('📝 Criando perfil do usuário...');
      const adminUser = await db.getUserByEmail('gabrieldesouza104@gmail.com');
      if (adminUser) {
        await db.createUserProfile(adminUser.id, 'Gabriel de Souza', 'admin');
        console.log('✅ Perfil criado com sucesso!');
      }
    } else {
      console.log('✅ Perfil já existe!');
    }
    
    // 3. Inserir dados de teste
    console.log('\n🧪 Inserindo dados de teste...');
    await db.insertTestData();
    
    // 4. Verificar status final
    console.log('\n📊 STATUS FINAL:');
    const users = await db.getUsers();
    const tables = await db.getTables();
    const products = await db.getProducts();
    
    console.log(`👥 Usuários: ${users.length}`);
    console.log(`📋 Tabelas: ${tables.length}`);
    console.log(`📦 Produtos: ${products.length}`);
    
    console.log('\n🎉 CONFIGURAÇÃO CONCLUÍDA!');
    console.log('==========================');
    console.log('✅ Email confirmado');
    console.log('✅ Perfil criado');
    console.log('✅ Dados de teste inseridos');
    console.log('\n🚀 Agora você pode fazer login com:');
    console.log('   Email: gabrieldesouza104@gmail.com');
    console.log('   Senha: 123456');
    
  } catch (error) {
    console.error('❌ Erro:', error.message);
  } finally {
    await db.disconnect();
  }
}

quickFix();
