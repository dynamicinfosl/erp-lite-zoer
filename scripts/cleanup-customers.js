const { DirectDBClient } = require('./db-client');

(async () => {
  const db = new DirectDBClient();
  const DEFAULT_USER = '00000000-0000-0000-0000-000000000000';
  try {
    const ok = await db.connect();
    if (!ok) process.exit(1);

    console.log('🔎 Contando registros atuais...');
    const before = await db.query('SELECT COUNT(*)::int AS n FROM customers WHERE user_id = $1', [DEFAULT_USER]);
    console.log('Clientes encontrados (user padrão):', before.rows[0].n);

    console.log('🧹 Removendo registros...');
    const del = await db.query('DELETE FROM customers WHERE user_id = $1', [DEFAULT_USER]);
    console.log('Registros apagados:', del.rowCount);

    const after = await db.query('SELECT COUNT(*)::int AS n FROM customers WHERE user_id = $1', [DEFAULT_USER]);
    console.log('Clientes restantes (user padrão):', after.rows[0].n);
  } catch (err) {
    console.error('Erro na limpeza:', err.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
})();




