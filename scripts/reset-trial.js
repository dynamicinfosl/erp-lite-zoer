/**
 * Script para reverter trial expirado
 * 
 * Este script restaura a data de fim do trial para 14 dias no futuro,
 * simulando um trial ativo.
 * 
 * Para usar:
 * 1. node scripts/reset-trial.js
 * 2. Acesse qualquer página protegida
 * 3. Deve funcionar normalmente
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

async function resetTrial() {
  try {
    console.log('🔄 Restaurando trial ativo...');
    
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

    // Atualizar trial_ends_at para 14 dias no futuro
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 14);
    const futureDateISO = futureDate.toISOString();

    const { error: updateError } = await supabase
      .from('subscriptions')
      .update({ trial_ends_at: futureDateISO })
      .eq('status', 'trial');

    if (updateError) {
      console.error('❌ Erro ao atualizar subscriptions:', updateError.message);
      return;
    }

    console.log('✅ Trial restaurado com sucesso!');
    console.log('📅 Data de fim do trial definida para:', futureDate.toLocaleDateString('pt-BR'));
    console.log('');
    console.log('🧪 Para testar:');
    console.log('1. Acesse http://localhost:3000/dashboard');
    console.log('2. Deve funcionar normalmente');
    console.log('');
    console.log('⚠️  Para simular expirado novamente: node scripts/simulate-trial-expired.js');

  } catch (error) {
    console.error('❌ Erro inesperado:', error.message);
  }
}

resetTrial();





