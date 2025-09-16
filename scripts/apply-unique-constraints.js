const fs = require('fs');
const path = require('path');
const { DirectDBClient } = require('./db-client');

async function main() {
  const client = new DirectDBClient();
  const ok = await client.connect();
  if (!ok) process.exit(1);

  try {
    const sqlPath = path.resolve(__dirname, '..', 'auth', '202509161200unique_constraints.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');
    await client.query(sql);
    console.log('✅ Índices de unicidade aplicados com sucesso.');
  } catch (err) {
    console.error('❌ Falha ao aplicar índices de unicidade:', err.message);
    process.exitCode = 1;
  } finally {
    await client.disconnect();
  }
}

main();


