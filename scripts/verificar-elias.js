const { Client } = require('pg');

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

async function verificarElias() {
  const client = new Client(connectionConfig);
  
  try {
    await client.connect();
    console.log('✅ Conectado ao banco de dados\n');

    // 1. Buscar usuário do Elias
    console.log('🔍 Buscando usuário do Elias...\n');
    const userResult = await client.query(`
      SELECT 
        id as user_id,
        email,
        created_at,
        last_sign_in_at
      FROM auth.users
      WHERE email ILIKE '%elias%'
      ORDER BY created_at DESC;
    `);

    if (userResult.rows.length === 0) {
      console.log('❌ Nenhum usuário encontrado com "elias" no email');
      return;
    }

    console.log('Usuários encontrados:');
    userResult.rows.forEach((user, index) => {
      console.log(`  ${index + 1}. ID: ${user.user_id}`);
      console.log(`     Email: ${user.email}`);
      console.log(`     Criado em: ${user.created_at}`);
      console.log(`     Último login: ${user.last_sign_in_at || 'Nunca'}\n`);
    });

    // 2. Buscar tenant(s) e subscription do Elias
    console.log('🔍 Buscando tenant(s) e subscription do Elias...\n');
    const subscriptionResult = await client.query(`
      WITH user_info AS (
        SELECT id as user_id, email 
        FROM auth.users 
        WHERE email ILIKE '%elias%'
        LIMIT 1
      )
      SELECT 
        t.id as tenant_id,
        t.name as tenant_name,
        t.status as tenant_status,
        t.email as tenant_email,
        t.created_at as tenant_created_at,
        s.id as subscription_id,
        s.status as subscription_status,
        s.plan_id,
        p.name as plan_name,
        p.slug as plan_slug,
        p.price_monthly,
        s.trial_end,
        s.trial_ends_at,
        s.current_period_start,
        s.current_period_end,
        s.created_at as subscription_created_at,
        s.updated_at as subscription_updated_at,
        CASE 
          WHEN s.status = 'active' AND s.current_period_end IS NOT NULL AND s.current_period_end < NOW() 
            THEN '🔴 PLENO MENSAL VENCIDO'
          WHEN s.status = 'active' AND s.current_period_end IS NOT NULL AND s.current_period_end >= NOW() 
            THEN '✅ PLENO MENSAL VÁLIDO'
          WHEN s.status = 'trial' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at < NOW() 
            THEN '🔴 TRIAL EXPIRADO'
          WHEN s.status = 'trial' AND s.trial_ends_at IS NOT NULL AND s.trial_ends_at >= NOW() 
            THEN '✅ TRIAL ATIVO'
          WHEN s.status = 'suspended' 
            THEN '⚠️ SUSPENSO'
          WHEN s.status = 'cancelled' 
            THEN '❌ CANCELADO'
          WHEN s.id IS NULL 
            THEN '⚠️ SEM SUBSCRIPTION'
          ELSE '⚠️ STATUS DESCONHECIDO'
        END as status_plano,
        CASE 
          WHEN s.status = 'active' AND s.current_period_end IS NOT NULL THEN
            CASE 
              WHEN s.current_period_end < NOW() 
                THEN CONCAT('Vencido há ', EXTRACT(DAY FROM NOW() - s.current_period_end)::INTEGER, ' dias')
              ELSE CONCAT(EXTRACT(DAY FROM s.current_period_end - NOW())::INTEGER, ' dias restantes')
            END
          WHEN s.status = 'trial' AND s.trial_ends_at IS NOT NULL THEN
            CASE 
              WHEN s.trial_ends_at < NOW() 
                THEN CONCAT('Trial expirado há ', EXTRACT(DAY FROM NOW() - s.trial_ends_at)::INTEGER, ' dias')
              ELSE CONCAT(EXTRACT(DAY FROM s.trial_ends_at - NOW())::INTEGER, ' dias de trial restantes')
            END
          ELSE 'N/A'
        END as dias_info
      FROM tenants t
      JOIN user_memberships um ON um.tenant_id = t.id
      JOIN user_info ui ON ui.user_id = um.user_id
      LEFT JOIN subscriptions s ON s.tenant_id = t.id
      LEFT JOIN plans p ON p.id = s.plan_id
      ORDER BY t.created_at DESC;
    `);

    if (subscriptionResult.rows.length === 0) {
      console.log('❌ Nenhum tenant encontrado para o usuário Elias');
      return;
    }

    console.log('═══════════════════════════════════════════════════════════');
    console.log('📊 RESULTADO DA VERIFICAÇÃO - ELIAS');
    console.log('═══════════════════════════════════════════════════════════\n');

    subscriptionResult.rows.forEach((row, index) => {
      console.log(`Tenant ${index + 1}:`);
      console.log(`  Nome: ${row.tenant_name}`);
      console.log(`  ID: ${row.tenant_id}`);
      console.log(`  Status do Tenant: ${row.tenant_status}`);
      console.log(`  Email: ${row.tenant_email || 'N/A'}`);
      console.log(`  Criado em: ${row.tenant_created_at}\n`);

      if (row.subscription_id) {
        console.log(`  📦 Subscription:`);
        console.log(`     ID: ${row.subscription_id}`);
        console.log(`     Status: ${row.subscription_status}`);
        console.log(`     Plano: ${row.plan_name || 'N/A'} (${row.plan_slug || 'N/A'})`);
        console.log(`     Preço Mensal: R$ ${row.price_monthly || '0.00'}`);
        console.log(`     Período Início: ${row.current_period_start || 'N/A'}`);
        console.log(`     Período Fim: ${row.current_period_end || 'N/A'}`);
        console.log(`     Trial Fim: ${row.trial_ends_at || row.trial_end || 'N/A'}`);
        console.log(`     Status do Plano: ${row.status_plano}`);
        console.log(`     ${row.dias_info}\n`);
      } else {
        console.log(`  ⚠️ SEM SUBSCRIPTION CADASTRADA\n`);
      }

      // Resposta direta
      const isVencido = row.status_plano && (
        row.status_plano.includes('VENCIDO') || 
        row.status_plano.includes('EXPIRADO')
      );

      if (isVencido) {
        console.log(`  ❌ RESPOSTA: SIM, ELIAS ESTÁ COM PLENO MENSAL VENCIDO\n`);
      } else if (row.status_plano && row.status_plano.includes('VÁLIDO')) {
        console.log(`  ✅ RESPOSTA: NÃO, ELIAS ESTÁ COM PLENO MENSAL VÁLIDO\n`);
      } else {
        console.log(`  ⚠️ RESPOSTA: STATUS INDETERMINADO - ${row.status_plano}\n`);
      }

      console.log('───────────────────────────────────────────────────────────\n');
    });

  } catch (error) {
    console.error('❌ Erro ao verificar:', error);
  } finally {
    await client.end();
  }
}

verificarElias();


