const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function clearAllSessions() {
  try {
    console.log('🧹 Limpando todas as sessões do Supabase...');
    
    // Listar todas as sessões ativas
    const { data: sessions, error: listError } = await supabase.auth.admin.listSessions();
    
    if (listError) {
      console.error('❌ Erro ao listar sessões:', listError);
      return;
    }
    
    console.log(`📊 Encontradas ${sessions?.length || 0} sessões ativas`);
    
    // Invalidar todas as sessões
    if (sessions && sessions.length > 0) {
      for (const session of sessions) {
        try {
          const { error: signOutError } = await supabase.auth.admin.signOut(session.id);
          if (signOutError) {
            console.log(`⚠️ Erro ao invalidar sessão ${session.id}:`, signOutError.message);
          } else {
            console.log(`✅ Sessão ${session.id} invalidada`);
          }
        } catch (error) {
          console.log(`⚠️ Erro ao processar sessão ${session.id}:`, error.message);
        }
      }
    }
    
    console.log('✅ Todas as sessões foram invalidadas!');
    console.log('💡 Agora todos os usuários precisarão fazer login novamente');
    
  } catch (error) {
    console.error('❌ Erro ao limpar sessões:', error);
  }
}

async function checkTenantIsolation() {
  try {
    console.log('\n🔍 Verificando isolamento de tenants...');
    
    // Buscar todos os tenants
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, email')
      .order('created_at', { ascending: false });
    
    if (tenantsError) {
      console.error('❌ Erro ao buscar tenants:', tenantsError);
      return;
    }
    
    console.log(`📊 Encontrados ${tenants?.length || 0} tenants:`);
    tenants?.forEach((tenant, index) => {
      console.log(`  ${index + 1}. ${tenant.name} (${tenant.email}) - ID: ${tenant.id}`);
    });
    
    // Buscar produtos de cada tenant
    for (const tenant of tenants || []) {
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('id, name, tenant_id')
        .eq('tenant_id', tenant.id);
      
      if (productsError) {
        console.log(`⚠️ Erro ao buscar produtos do tenant ${tenant.name}:`, productsError.message);
      } else {
        console.log(`📦 Tenant ${tenant.name}: ${products?.length || 0} produtos`);
      }
    }
    
  } catch (error) {
    console.error('❌ Erro ao verificar isolamento:', error);
  }
}

async function main() {
  console.log('🚀 LIMPEZA COMPLETA DO SISTEMA');
  console.log('================================\n');
  
  await clearAllSessions();
  await checkTenantIsolation();
  
  console.log('\n🎉 Limpeza concluída!');
  console.log('💡 Todos os usuários precisarão fazer login novamente');
  console.log('💡 Isso deve resolver o problema de dados cruzados');
}

main().catch(console.error);
