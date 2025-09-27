const { DirectDBClient } = require('./db-client');

(async () => {
  const db = new DirectDBClient();
  const DEFAULT_USER = '00000000-0000-0000-0000-000000000000';
  try {
    const ok = await db.connect();
    if (!ok) process.exit(1);

    console.log('🔐 Habilitando policies de desenvolvimento para customers...');

    // Garante RLS habilitado
    await db.query(`ALTER TABLE customers ENABLE ROW LEVEL SECURITY;`);

    // Remove policies antigas com o mesmo nome, se existirem
    await db.query(`DROP POLICY IF EXISTS dev_insert_customers ON customers;`);
    await db.query(`DROP POLICY IF EXISTS dev_select_customers ON customers;`);
    await db.query(`DROP POLICY IF EXISTS dev_update_customers ON customers;`);
    await db.query(`DROP POLICY IF EXISTS dev_delete_customers ON customers;`);

    // Policies de DEV: liberam acesso somente ao user_id padrão
    await db.query(`
      CREATE POLICY dev_select_customers ON customers
      FOR SELECT TO anon, authenticated
      USING (user_id::text = '${DEFAULT_USER}');
    `);

    await db.query(`
      CREATE POLICY dev_insert_customers ON customers
      FOR INSERT TO anon, authenticated
      WITH CHECK (user_id::text = '${DEFAULT_USER}');
    `);

    await db.query(`
      CREATE POLICY dev_update_customers ON customers
      FOR UPDATE TO anon, authenticated
      USING (user_id::text = '${DEFAULT_USER}')
      WITH CHECK (user_id::text = '${DEFAULT_USER}');
    `);

    await db.query(`
      CREATE POLICY dev_delete_customers ON customers
      FOR DELETE TO anon, authenticated
      USING (user_id::text = '${DEFAULT_USER}');
    `);

    console.log('✅ Policies de desenvolvimento criadas para customers.');
  } catch (err) {
    console.error('Erro ao configurar policies:', err.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
})();


