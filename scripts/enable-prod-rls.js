const { DirectDBClient } = require('./db-client');

(async () => {
  const db = new DirectDBClient();
  try {
    const ok = await db.connect();
    if (!ok) process.exit(1);

    const tables = ['customers', 'products'];

    for (const table of tables) {
      console.log(`🔐 Configurando RLS de produção para ${table}...`);
      await db.query(`ALTER TABLE ${table} ENABLE ROW LEVEL SECURITY;`);

      // Remover policies de desenvolvimento
      await db.query(`DROP POLICY IF EXISTS dev_select_${table} ON ${table};`);
      await db.query(`DROP POLICY IF EXISTS dev_insert_${table} ON ${table};`);
      await db.query(`DROP POLICY IF EXISTS dev_update_${table} ON ${table};`);
      await db.query(`DROP POLICY IF EXISTS dev_delete_${table} ON ${table};`);

      // Remover policies de produção antigas (idempotente)
      await db.query(`DROP POLICY IF EXISTS prod_select_${table} ON ${table};`);
      await db.query(`DROP POLICY IF EXISTS prod_insert_${table} ON ${table};`);
      await db.query(`DROP POLICY IF EXISTS prod_update_${table} ON ${table};`);
      await db.query(`DROP POLICY IF EXISTS prod_delete_${table} ON ${table};`);

      // Criar policies de produção baseadas em auth.uid()
      await db.query(`
        CREATE POLICY prod_select_${table} ON ${table}
        FOR SELECT TO authenticated
        USING (user_id = auth.uid());
      `);

      await db.query(`
        CREATE POLICY prod_insert_${table} ON ${table}
        FOR INSERT TO authenticated
        WITH CHECK (user_id = auth.uid());
      `);

      await db.query(`
        CREATE POLICY prod_update_${table} ON ${table}
        FOR UPDATE TO authenticated
        USING (user_id = auth.uid())
        WITH CHECK (user_id = auth.uid());
      `);

      await db.query(`
        CREATE POLICY prod_delete_${table} ON ${table}
        FOR DELETE TO authenticated
        USING (user_id = auth.uid());
      `);

      console.log(`✅ Policies de produção aplicadas para ${table}.`);
    }
  } catch (err) {
    console.error('Erro ao aplicar RLS de produção:', err.message);
    process.exit(1);
  } finally {
    await db.disconnect();
  }
})();


