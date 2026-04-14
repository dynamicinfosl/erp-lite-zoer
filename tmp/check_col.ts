import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://lfxietcasaooenffdodr.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxmeGlldGNhc2Fvb2VuZmZkb2RyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzAxNzc0MywiZXhwIjoyMDcyNTkzNzQzfQ.gspNzN0khb9f1CP3GsTR5ghflVb2uU5f5Yy4mxlum10';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function check() {
  const { data, error } = await supabase
    .from('orders')
    .select('customer_id')
    .limit(1);
    
  if (error) {
    console.error('Erro:', error.message);
    if (error.message.includes('column "customer_id" does not exist')) {
      console.log('COL_NOT_FOUND');
    }
  } else {
    console.log('COL_EXISTS');
  }
}

check();
