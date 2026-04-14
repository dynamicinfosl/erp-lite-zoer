
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkBucket() {
  const { data, error } = await supabase.storage.getBucket('fiscal-certificates');
  
  if (error) {
    if (error.message.includes('not found')) {
      console.log('Bucket not found, creating it...');
      const { data: newBucket, error: createError } = await supabase.storage.createBucket('fiscal-certificates', {
        public: false,
        fileSizeLimit: 1024 * 1024 * 2, // 2MB
      });
      if (createError) {
        console.error('Error creating bucket:', createError);
      } else {
        console.log('Bucket created successfully');
      }
    } else {
      console.error('Error getting bucket:', error);
    }
  } else {
    console.log('Bucket "fiscal-certificates" already exists');
  }
}

checkBucket();
