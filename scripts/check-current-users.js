const { createClient } = require('@supabase/supabase-js');

// Configurações hardcoded
const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function checkCurrentUsers() {
  try {
    console.log('👥 VERIFICANDO USUÁRIOS ATUAIS');
    console.log('=============================\n');
    
    // Buscar usuários mais recentes
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('id, email, created_at')
      .order('created_at', { ascending: false })
      .limit(10);
    
    if (usersError) {
      console.log('❌ Erro ao buscar usuários:', usersError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${users?.length || 0} usuários:`);
    users?.forEach((user, index) => {
      console.log(`  ${index + 1}. ${user.email} (ID: ${user.id}) - Criado: ${user.created_at}`);
    });
    
    // Buscar o tenant mais recente
    console.log('\n🏢 VERIFICANDO TENANT MAIS RECENTE');
    console.log('==================================');
    
    const { data: tenants, error: tenantsError } = await supabase
      .from('tenants')
      .select('id, name, email, created_at')
      .order('created_at', { ascending: false })
      .limit(5);
    
    if (tenantsError) {
      console.log('❌ Erro ao buscar tenants:', tenantsError.message);
      return;
    }
    
    console.log(`📊 Encontrados ${tenants?.length || 0} tenants:`);
    tenants?.forEach((tenant, index) => {
      console.log(`  ${index + 1}. ${tenant.name} (${tenant.email}) - ID: ${tenant.id} - Criado: ${tenant.created_at}`);
    });
    
    // Buscar o tenant específico que estava sendo usado
    const specificTenantId = '529d7b8f-c673-4e62-9c9e-f63ecc647970';
    console.log(`\n🔍 VERIFICANDO TENANT ESPECÍFICO: ${specificTenantId}`);
    console.log('================================================');
    
    const { data: specificTenant, error: specificTenantError } = await supabase
      .from('tenants')
      .select('*')
      .eq('id', specificTenantId)
      .single();
    
    if (specificTenantError) {
      console.log('❌ Erro ao buscar tenant específico:', specificTenantError.message);
    } else if (specificTenant) {
      console.log('✅ Tenant encontrado:');
      console.log(`  Nome: ${specificTenant.name}`);
      console.log(`  Email: ${specificTenant.email}`);
      console.log(`  Status: ${specificTenant.status}`);
      console.log(`  Criado: ${specificTenant.created_at}`);
    } else {
      console.log('❌ Tenant não encontrado');
    }
    
    // Buscar produtos deste tenant
    console.log(`\n📦 PRODUTOS DO TENANT ${specificTenantId}`);
    console.log('=====================================');
    
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, tenant_id')
      .eq('tenant_id', specificTenantId);
    
    if (productsError) {
      console.log('❌ Erro ao buscar produtos:', productsError.message);
    } else {
      console.log(`📊 Produtos encontrados: ${products?.length || 0}`);
      products?.forEach((product, index) => {
        console.log(`  ${index + 1}. ${product.name} (tenant: ${product.tenant_id})`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erro no script:', error);
  }
}

checkCurrentUsers().catch(console.error);
