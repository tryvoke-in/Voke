import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import dotenv from 'dotenv';

// Parse .env manually since dotenv might not find it or has issues
const envConfig = dotenv.parse(fs.readFileSync('.env'));
for (const k in envConfig) {
  process.env[k] = envConfig[k];
}

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://ubktoscausselrtpuxux.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || ''; // wait, anon key might not have permission to insert. I need service role key or I can just use anon key if RLS is disabled for job_postings.

console.log("Supabase URL:", supabaseUrl);

async function checkJobs() {
  const supabase = createClient(supabaseUrl, supabaseKey);
  const { count, error } = await supabase
    .from('job_postings')
    .select('*', { count: 'exact', head: true });

  console.log('Total jobs in DB:', count);
  if (error) console.error(error);
}

checkJobs();
