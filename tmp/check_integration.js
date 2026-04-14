
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function checkIntegration() {
  const tenant_id = '4b62d5ee-aabe-466f-9e32-6b0e25321e21';
  const { data: interaction, error } = await supabase
    .from('fiscal_integrations')
    .select('*')
    .eq('tenant_id', tenant_id)
    .single();

  if (error) {
    console.error('Error:', error);
  } else {
    console.log('Integration Data:', JSON.stringify(interaction, null, 2));
  }
}

checkIntegration();
