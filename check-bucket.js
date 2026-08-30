require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

async function checkBuckets() {
  console.log('Listing buckets...');
  const { data: buckets, error } = await supabase.storage.listBuckets();
  console.log('Buckets:', buckets, 'Error:', error);

  console.log('Creating bucket "inspections"...');
  const { data: createData, error: createError } = await supabase.storage.createBucket('inspections', { public: true });
  console.log('Create Bucket Data:', createData, 'Error:', createError);
}

checkBuckets();
