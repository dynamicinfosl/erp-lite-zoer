
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTenant() {
  const tenant_id = '4b62d5ee-aabe-466f-9e32-6b0e25321e21';
  const { data: tenant, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('id', tenant_id)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Tenant Data:', JSON.stringify(tenant, null, 2));
    
    // Check required fields for FocusNFe
    const required = ['razao_social', 'document', 'address', 'numero', 'bairro', 'city', 'state', 'zip_code'];
    const missing = required.filter(f => !tenant[f]);
    if (missing.length > 0) {
      console.log('\n❌ MISSING FIELDS for FocusNFe:', missing.join(', '));
    } else {
      console.log('\n✅ All basic fields for FocusNFe are present');
    }
  }
}

checkTenant();
