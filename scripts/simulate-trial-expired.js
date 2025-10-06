/**
 * Script para simular trial expirado para testes
 * 
 * Este script atualiza a data de fim do trial para ontem,
 * simulando que o trial expirou.
 * 
 * Para usar:
 * 1. node scripts/simulate-trial-expired.js
 * 2. Acesse qualquer página protegida
 * 3. Deve redirecionar para /trial-expirado
 * 
 * Para reverter:
 * 1. node scripts/reset-trial.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Variáveis de ambiente não encontradas');
  console.error('Certifique-se de que NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY estão definidas no .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simulateTrialExpired() {
  try {
    console.log('🔄 Simulando trial expirado...');
    
    // Buscar todas as subscriptions com status 'trial'
    const { data: subscriptions, error: fetchError } = await supabase
      .from('subscriptions')
      .select('id, tenant_id, trial_ends_at')
      .eq('status', 'trial');

    if (fetchError) {
      console.error('❌ Erro ao buscar subscriptions:', fetchError.message);
      return;
    }

    if (!subscriptions || subscriptions.length === 0) {
      console.log('⚠️  Nenhuma subscription com status "trial" encontrada');
      return;
    }

    console.log(`📊 Encontradas ${subscriptions.length} subscriptions em trial`);

    // Atualizar trial_ends_at para ontem (simular expirado)
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    const yesterdayISO = yesterday.toISOString();

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ trial_ends_at: yesterdayISO })
      .eq('status', 'trial');

    if (updateError) {
      console.error('❌ Erro ao atualizar subscriptions:', updateError.message);
      return;
    }

    console.log('✅ Trial expirado simulado com sucesso!');
    console.log('📅 Data de fim do trial definida para:', yesterday.toLocaleDateString('pt-BR'));
    console.log('');
    console.log('🧪 Para testar:');
    console.log('1. Acesse http://localhost:3000/dashboard');
    console.log('2. Deve redirecionar para /trial-expirado');
    console.log('');
    console.log('🔄 Para reverter, execute: node scripts/reset-trial.js');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

simulateTrialExpired();


