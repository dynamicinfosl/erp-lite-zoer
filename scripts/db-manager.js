const { DirectDBClient } = require('../src/lib/direct-db');

class DatabaseManager {
  constructor() {
    this.db = new DirectDBClient();
  }

  async connect() {
    return await this.db.connect();
  }

  async disconnect() {
    await this.db.disconnect();
  }

  async showMenu() {
    console.log('\n🗄️  GERENCIADOR DE BANCO DE DADOS');
    console.log('=====================================');
    console.log('1. 📊 Ver status do banco');
    console.log('2. 👥 Gerenciar usuários');
    console.log('3. 📦 Gerenciar produtos');
    console.log('4. 🏷️  Gerenciar categorias');
    console.log('5. ✅ Confirmar email de usuário');
    console.log('6. 🧪 Inserir dados de teste');
    console.log('7. 🔍 Executar SQL customizado');
    console.log('8. 📋 Ver todas as tabelas');
    console.log('0. ❌ Sair');
    console.log('=====================================');
  }

  async showStatus() {
    console.log('\n📊 STATUS DO BANCO DE DADOS');
    console.log('============================');
    
    try {
      // Verificar versão do PostgreSQL
      const versionResult = await this.db.query('SELECT version()');
      console.log('🐘 PostgreSQL:', versionResult.rows[0].version.split(' ')[0] + ' ' + versionResult.rows[0].version.split(' ')[1]);
      
      // Verificar tabelas
      const tables = await this.db.getTables();
      console.log('📋 Tabelas:', tables.length);
      tables.forEach(table => {
        console.log(`   - ${table.table_name}`);
      });
      
      // Verificar usuários
      const users = await this.db.getUsers();
      console.log('👥 Usuários:', users.length);
      users.forEach(user => {
        console.log(`   - ${user.email} (${user.email_confirmed_at ? '✅' : '❌'}) - ${user.role_type || 'Sem perfil'}`);
      });
      
    } catch (error) {
      console.error('❌ Erro ao verificar status:', error.message);
    }
  }

  async manageUsers() {
    console.log('\n👥 GERENCIAR USUÁRIOS');
    console.log('======================');
    
    try {
      const users = await this.db.getUsers();
      
      if (users.length === 0) {
        console.log('⚠️  Nenhum usuário encontrado');
        return;
      }
      
      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.email}`);
        console.log(`   Nome: ${user.name || 'Não definido'}`);
        console.log(`   Role: ${user.role_type || 'Não definido'}`);
        console.log(`   Email confirmado: ${user.email_confirmed_at ? '✅ Sim' : '❌ Não'}`);
        console.log(`   Criado em: ${new Date(user.created_at).toLocaleString('pt-BR')}`);
        console.log('');
      });
      
    } catch (error) {
      console.error('❌ Erro ao listar usuários:', error.message);
    }
  }

  async confirmUserEmail() {
    console.log('\n✅ CONFIRMAR EMAIL DE USUÁRIO');
    console.log('==============================');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    return new Promise((resolve) => {
      rl.question('Digite o email do usuário: ', async (email) => {
        try {
          const result = await this.db.confirmUserEmail(email);
          if (result) {
            console.log('✅ Email confirmado com sucesso!');
            console.log('📧 Usuário:', result.email);
          } else {
            console.log('❌ Usuário não encontrado');
          }
        } catch (error) {
          console.error('❌ Erro ao confirmar email:', error.message);
        }
        rl.close();
        resolve();
      });
    });
  }

  async insertTestData() {
    console.log('\n🧪 INSERINDO DADOS DE TESTE');
    console.log('============================');
    
    try {
      await this.db.insertTestData();
      console.log('✅ Dados de teste inseridos com sucesso!');
    } catch (error) {
      console.error('❌ Erro ao inserir dados de teste:', error.message);
    }
  }

  async showTables() {
    console.log('\n📋 TABELAS DO BANCO');
    console.log('===================');
    
    try {
      const tables = await this.db.getTables();
      tables.forEach((table, index) => {
        console.log(`${index + 1}. ${table.table_name}`);
      });
    } catch (error) {
      console.error('❌ Erro ao listar tabelas:', error.message);
    }
  }

  async executeCustomSQL() {
    console.log('\n🔍 EXECUTAR SQL CUSTOMIZADO');
    console.log('============================');
    console.log('Digite "exit" para sair');
    console.log('Digite "help" para ver comandos úteis');
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const askSQL = () => {
      rl.question('\nSQL> ', async (sql) => {
        if (sql.toLowerCase() === 'exit') {
          rl.close();
          return;
        }
        
        if (sql.toLowerCase() === 'help') {
          console.log('\n📚 COMANDOS ÚTEIS:');
          console.log('SELECT * FROM auth.users;');
          console.log('SELECT * FROM user_profiles;');
          console.log('SELECT * FROM products;');
          console.log('SELECT * FROM categories;');
          console.log('UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = \'gabrieldesouza104@gmail.com\';');
          askSQL();
          return;
        }
        
        try {
          const result = await this.db.query(sql);
          if (result.rows.length > 0) {
            console.log('📊 Resultado:');
            console.table(result.rows);
          } else {
            console.log('✅ Comando executado com sucesso!');
          }
        } catch (error) {
          console.error('❌ Erro:', error.message);
        }
        
        askSQL();
      });
    };
    
    askSQL();
  }

  async run() {
    console.log('🚀 Iniciando Gerenciador de Banco de Dados...');
    
    const connected = await this.connect();
    if (!connected) {
      console.log('❌ Não foi possível conectar ao banco');
      return;
    }
    
    const readline = require('readline');
    const rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    
    const askOption = () => {
      this.showMenu();
      rl.question('\nEscolha uma opção: ', async (option) => {
        switch (option) {
          case '1':
            await this.showStatus();
            askOption();
            break;
          case '2':
            await this.manageUsers();
            askOption();
            break;
          case '3':
            console.log('📦 Gerenciar produtos - Em desenvolvimento');
            askOption();
            break;
          case '4':
            console.log('🏷️  Gerenciar categorias - Em desenvolvimento');
            askOption();
            break;
          case '5':
            await this.confirmUserEmail();
            askOption();
            break;
          case '6':
            await this.insertTestData();
            askOption();
            break;
          case '7':
            await this.executeCustomSQL();
            askOption();
            break;
          case '8':
            await this.showTables();
            askOption();
            break;
          case '0':
            console.log('👋 Encerrando...');
            await this.disconnect();
            rl.close();
            break;
          default:
            console.log('❌ Opção inválida');
            askOption();
        }
      });
    };
    
    askOption();
  }
}

// Executar se chamado diretamente
if (require.main === module) {
  const manager = new DatabaseManager();
  manager.run().catch(console.error);
}

module.exports = DatabaseManager;
