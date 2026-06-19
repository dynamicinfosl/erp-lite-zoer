const { createClient } = require('@supabase/supabase-js');
const supabaseAdmin = createClient('https://lfxietcasaooenffdodr.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10');

async function test() {
  const { data, error } = await supabaseAdmin.from('products').select('id').eq('tenant_id', '7a56008e-0a31-4084-8c70-de7a5cdd083b');
  console.log('Without limit:', data ? data.length : error);
  
  const { data: data2, error: error2 } = await supabaseAdmin.from('products').select('id').eq('tenant_id', '7a56008e-0a31-4084-8c70-de7a5cdd083b').limit(10000);
  console.log('With limit(10000):', data2 ? data2.length : error2);
}
test();
