const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

function loadEnvVars() {
  const envPath = path.join(process.cwd(), '.env.local');
  if (!fs.existsSync(envPath)) {
    console.error('File .env.local not found!');
    return null;
  }

  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });

  return envVars;
}

async function main() {
  const envVars = loadEnvVars();
  if (!envVars) process.exit(1);

  const supabaseUrl = envVars.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = envVars.SUPABASE_SERVICE_ROLE_KEY; // Use service role to bypass RLS

  console.log(`Connecting to Supabase at ${supabaseUrl}...`);
  const supabase = createClient(supabaseUrl, supabaseKey);

  // First, let's check how many sales exist with sale_source = 'migracao' and no sale_type
  const { data: countData, error: countError } = await supabase
    .from('sales')
    .select('id, sale_type')
    .eq('sale_source', 'migracao')
    .is('sale_type', null);

  if (countError) {
    console.error('Error fetching sales:', countError);
    process.exit(1);
  }

  console.log(`Found ${countData.length} sales with sale_source = 'migracao'.`);

  const withoutType = countData.filter(s => !s.sale_type);
  console.log(`Of those, ${withoutType.length} sales have no sale_type.`);

  if (withoutType.length > 0) {
    console.log('Updating sales...');
    const { data: updateData, error: updateError } = await supabase
      .from('sales')
      .update({ sale_type: 'produtos' })
      .eq('sale_source', 'migracao')
      .is('sale_type', null);

    if (updateError) {
      console.error('Error updating sales:', updateError);
      process.exit(1);
    }

    console.log('Update completed successfully!');
  } else {
    console.log('No sales needed updating.');
  }
}

main().catch(console.error);
