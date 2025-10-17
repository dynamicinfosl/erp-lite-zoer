import { Client } from 'pg';

const connectionConfig = {
  host: 'db.lfxietcasaooenffdodr.supabase.co',
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: '[97872715Ga!]',
  ssl: {
    rejectUnauthorized: false,
  },
};

export const connectionString = 'postgresql://postgres:[97872715Ga!]@db.lfxietcasaooenffdodr.supabase.co:5432/postgres';

export class DirectDBClient {
  private client: Client;

  constructor() {
    this.client = new Client(connectionConfig);
  }

  async connect() {
    try {
      await this.client.connect();
      console.log('✅ Conexão direta estabelecida com PostgreSQL');
      return true;
    } catch (error) {
      console.error('❌ Erro na conexão direta:', error);
      return false;
    }
  }

  async disconnect() {
    try {
      await this.client.end();
      console.log('✅ Conexão direta encerrada');
    } catch (error) {
      console.error('❌ Erro ao encerrar conexão:', error);
    }
  }

  async query<T extends Record<string, any> = Record<string, any>>(text: string, params?: any[]) {
    try {
      const result = await this.client.query<T>(text, params);
      return result;
    } catch (error) {
      console.error('❌ Erro na query:', error);
      throw error;
    }
  }

  // Métodos específicos para o ERP
  async confirmUserEmail(email: string) {
    const result = await this.query(
      'UPDATE auth.users SET email_confirmed_at = NOW() WHERE email = $1 RETURNING *',
      [email]
    );
    return result.rows[0];
  }

  async getUserByEmail(email: string) {
    const result = await this.query(
      'SELECT * FROM auth.users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  async createUserProfile(userId: string, name: string, role: string) {
    const result = await this.query(
      'INSERT INTO user_profiles (user_id, name, role_type) VALUES ($1, $2, $3) RETURNING *',
      [userId, name, role]
    );
    return result.rows[0];
  }

  async getTables() {
    const result = await this.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public'
      ORDER BY table_name
    `);
    return result.rows;
  }

  async getUsers() {
    const result = await this.query(`
      SELECT u.email, u.email_confirmed_at, u.created_at, p.name, p.role_type
      FROM auth.users u
      LEFT JOIN user_profiles p ON u.id = p.user_id
      ORDER BY u.created_at DESC
    `);
    return result.rows;
  }

  async getProducts(userId?: string) {
    let query = `
      SELECT p.*, c.name as category_name
      FROM products p
      LEFT JOIN categories c ON p.category_id = c.id
    `;
    
    if (userId) {
      query += ' WHERE p.user_id = $1';
      const result = await this.query(query, [userId]);
      return result.rows;
    } else {
      const result = await this.query(query);
      return result.rows;
    }
  }

  async getCategories() {
    const result = await this.query('SELECT * FROM categories ORDER BY name');
    return result.rows;
  }

  async insertTestData() {
    try {
      // Inserir categorias se não existirem
      await this.query(`
        INSERT INTO categories (name, description, color) VALUES
        ('Refrigerantes', 'Bebidas gaseificadas', '#e74c3c'),
        ('Cervejas', 'Cervejas nacionais e importadas', '#f39c12'),
        ('Águas', 'Águas minerais', '#3498db'),
        ('Energéticos', 'Bebidas energéticas', '#9b59b6')
        ON CONFLICT (name) DO NOTHING
      `);

      // Obter usuário admin
      const adminUser = await this.getUserByEmail('gabrieldesouza104@gmail.com');
      
      if (adminUser) {
        // Inserir produtos de teste
        await this.query(`
          INSERT INTO products (user_id, category_id, name, sku, barcode, description, cost_price, sale_price, stock_quantity, min_stock, unit) VALUES
          ($1, 1, 'Coca-Cola 350ml', 'COCA350', '7891234567890', 'Refrigerante Coca-Cola 350ml', 2.50, 4.50, 50, 10, 'UN'),
          ($1, 1, 'Pepsi 350ml', 'PEPSI350', '7891234567891', 'Refrigerante Pepsi 350ml', 2.30, 4.20, 30, 10, 'UN'),
          ($1, 2, 'Skol 350ml', 'SKOL350', '7891234567892', 'Cerveja Skol 350ml', 3.20, 5.50, 25, 5, 'UN'),
          ($1, 3, 'Água Mineral 500ml', 'AGUA500', '7891234567893', 'Água mineral natural 500ml', 1.20, 2.50, 100, 20, 'UN'),
          ($1, 4, 'Red Bull 250ml', 'REDBULL250', '7891234567894', 'Energético Red Bull 250ml', 4.50, 8.00, 15, 5, 'UN')
          ON CONFLICT (sku) DO NOTHING
        `, [adminUser.id]);

        console.log('✅ Dados de teste inseridos com sucesso!');
      }
    } catch (error) {
      console.error('❌ Erro ao inserir dados de teste:', error);
    }
  }
}

// Instância global do cliente
export const directDB = new DirectDBClient();
