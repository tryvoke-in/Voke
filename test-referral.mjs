import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ubktoscausselrtpuxux.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3Rvc2NhdXNzZWxydHB1eHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDg4MjMsImV4cCI6MjA3OTQ4NDgyM30._3IlGpdyig2Szn8jTI2dWoXonTt7Lg7-TeTveMJu3j8";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testReferral() {
  const referralCode = '58643F15';
  const testEmail = `test.ref.${Date.now()}@example.com`;
  
  console.log(`[1] Signing up new user with email: ${testEmail}`);
  
  const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
    email: testEmail,
    password: 'Password123!',
    options: {
      data: {
        full_name: 'Test Referral User'
      }
    }
  });

  if (signUpError) {
    console.error("Signup failed:", signUpError.message);
    return;
  }

  const userId = signUpData.user?.id;
  console.log(`[2] Signup successful. New user ID: ${userId}`);
  console.log(`[3] Processing referral with code: ${referralCode}`);

  const { data: rpcData, error: rpcError } = await supabase.rpc('process_referral', {
    ref_code: referralCode,
    new_user_id: userId
  });

  if (rpcError) {
    console.error("❌ process_referral RPC failed:", rpcError);
  } else {
    console.log("✅ process_referral RPC completed!");
    console.log("Result:", rpcData);
  }
}

testReferral();
