require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

async function checkJobs() {
  const { count, error } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact', head: true });

  console.log('Total jobs in DB:', count);
  if (error) console.error(error);
}

checkJobs();
