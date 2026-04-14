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

async function migrate() {
  const client = new Client(connectionConfig);
  try {
    await client.connect();
    console.log('Conectado ao banco...');
    
    // Adicionar coluna customer_id se não existir
    await client.query(`
      ALTER TABLE public.orders 
      ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES public.customers(id);
    `);
    
    console.log('Coluna customer_id adicionada com sucesso ou já existente.');
  } catch (error) {
    console.error('Erro na migração:', error);
  } finally {
    await client.end();
  }
}

migrate();
