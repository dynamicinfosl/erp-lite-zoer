const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function testTrialSystem() {
  try {
    console.log('🧪 TESTE DO SISTEMA DE TRIAL (14 DIAS)');
    console.log('=====================================\n');
    
    // 1. Verificar tenants com trial
    console.log('📊 VERIFICANDO TENANTS COM TRIAL');
    console.log('===============================');
    
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, status, trial_ends_at, created_at')
      .eq('status', 'trial')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (tenantsError) {
      console.log('❌ Erro ao buscar tenants:', tenantsError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${tenants?.length || 0} tenants em trial:`);
    tenants?.forEach((tenant, index) => {
      const trialEnd = new Date(tenant.trial_ends_at);
      const now = new Date();
      const daysLeft = Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24));
      const isExpired = trialEnd < now;
      
      console.log(`  ${index + 1}. ${tenant.name}`);
      console.log(`     ID: ${tenant.id}`);
      console.log(`     Trial termina: ${trialEnd.toLocaleDateString('pt-BR')}`);
      console.log(`     Status: ${isExpired ? '❌ EXPIRADO' : `✅ ${daysLeft} dias restantes`}`);
      console.log('');
    });
    
    // 2. Verificar subscriptions
    console.log('💳 VERIFICANDO SUBSCRIPTIONS');
    console.log('============================');
    
    const { data: subscriptions, error: subscriptionsError } = await supabase
      .from('subscriptions')
      .select('id, tenant_id, status, trial_end, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (subscriptionsError) {
      console.log('❌ Erro ao buscar subscriptions:', subscriptionsError.message);
    } else {
      console.log(`📊 Encontradas ${subscriptions?.length || 0} subscriptions:`);
      subscriptions?.forEach((sub, index) => {
        const trialEnd = sub.trial_end ? new Date(sub.trial_end) : null;
        const now = new Date();
        const daysLeft = trialEnd ? Math.ceil((trialEnd - now) / (1000 * 60 * 60 * 24)) : null;
        const isExpired = trialEnd ? trialEnd < now : false;
        
        console.log(`  ${index + 1}. Subscription ${sub.id}`);
        console.log(`     Tenant: ${sub.tenant_id}`);
        console.log(`     Status: ${sub.status}`);
        if (trialEnd) {
          console.log(`     Trial termina: ${trialEnd.toLocaleDateString('pt-BR')}`);
          console.log(`     Status: ${isExpired ? '❌ EXPIRADO' : `✅ ${daysLeft} dias restantes`}`);
        }
        console.log('');
      });
    }
    
    // 3. Testar criação de tenant com trial de 14 dias
    console.log('🧪 TESTANDO CRIAÇÃO DE TENANT COM TRIAL DE 14 DIAS');
    console.log('==================================================');
    
    const testTenantName = `Teste Trial ${Date.now()}`;
    const testTenantSlug = `teste-trial-${Date.now()}`;
    const trialEndDate = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
    
    console.log(`📝 Criando tenant de teste: ${testTenantName}`);
    console.log(`📅 Trial termina em: ${trialEndDate.toLocaleDateString('pt-BR')}`);
    
    const { data: newTenant, error: tenantError } = await supabase
      .from('tenants')
      .insert({
        name: testTenantName,
        slug: testTenantSlug,
        status: 'trial',
        trial_ends_at: trialEndDate.toISOString()
      })
      .select()
      .single();
    
    if (tenantError) {
      console.log('❌ Erro ao criar tenant de teste:', tenantError.message);
    } else {
      console.log('✅ Tenant de teste criado com sucesso!');
      console.log(`   ID: ${newTenant.id}`);
      console.log(`   Nome: ${newTenant.name}`);
      console.log(`   Trial termina: ${new Date(newTenant.trial_ends_at).toLocaleDateString('pt-BR')}`);
      
      // Criar subscription para o tenant
      const { data: newSubscription, error: subError } = await supabase
        .from('subscriptions')
        .insert({
          tenant_id: newTenant.id,
          plan_id: 'trial-plan',
          status: 'trial',
          trial_end: trialEndDate.toISOString()
        })
        .select()
        .single();
      
      if (subError) {
        console.log('⚠️ Erro ao criar subscription:', subError.message);
      } else {
        console.log('✅ Subscription criada com sucesso!');
        console.log(`   ID: ${newSubscription.id}`);
        console.log(`   Status: ${newSubscription.status}`);
      }
    }
    
    // 4. Verificar se há tenants expirados
    console.log('\n⏰ VERIFICANDO TENANTS EXPIRADOS');
    console.log('===============================');
    
    const { data: expiredTenants, error: expiredError } = await supabase
      .from('tenants')
      .select('id, name, trial_ends_at')
      .eq('status', 'trial')
      .lt('trial_ends_at', new Date().toISOString());
    
    if (expiredError) {
      console.log('❌ Erro ao buscar tenants expirados:', expiredError.message);
    } else {
      console.log(`📊 Encontrados ${expiredTenants?.length || 0} tenants expirados:`);
      expiredTenants?.forEach((tenant, index) => {
        const trialEnd = new Date(tenant.trial_ends_at);
        const daysExpired = Math.ceil((new Date() - trialEnd) / (1000 * 60 * 60 * 24));
        console.log(`  ${index + 1}. ${tenant.name} - Expirado há ${daysExpired} dias`);
      });
    }
    
    console.log('\n🎯 RESUMO DO SISTEMA DE TRIAL');
    console.log('=============================');
    console.log(`✅ Período de trial: 14 dias`);
    console.log(`📊 Tenants em trial: ${tenants?.length || 0}`);
    console.log(`📊 Subscriptions: ${subscriptions?.length || 0}`);
    console.log(`⏰ Tenants expirados: ${expiredTenants?.length || 0}`);
    
    if (expiredTenants && expiredTenants.length > 0) {
      console.log('\n⚠️ ATENÇÃO: Existem tenants com trial expirado!');
      console.log('💡 Estes tenants devem ser bloqueados ou redirecionados para upgrade');
    } else {
      console.log('\n✅ Nenhum tenant com trial expirado encontrado');
    }
    
  } catch (error) {
    console.error('❌ Erro no teste:', error);
  }
}

testTrialSystem().catch(console.error);
