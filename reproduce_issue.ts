
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = "https://ubktoscausselrtpuxux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3Rvc2NhdXNzZWxydHB1eHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDg4MjMsImV4cCI6MjA3OTQ4NDgyM30._3IlGpdyig2Szn8jTI2dWoXonTt7Lg7-TeTveMJu3j8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function testFlow() {
  console.log("Starting reproduction test with ANON key...");
  
  // Fetch all sessions (scheduled and pending)
  const { data: sessions, error } = await supabase
    .from('peer_interview_sessions')
    .select('*')
    .in('status', ['scheduled', 'pending'])
    .order('created_at', { ascending: false })
    .limit(10);

  if (error) {
    console.error("Error fetching sessions:", error);
    return;
  }

  console.log(`Fetched ${sessions.length} sessions.`);
  sessions.forEach(s => {
    console.log(`ID: ${s.id}, Host: ${s.host_user_id}, Status: ${s.status}`);
  });

  const pending = sessions.filter(s => s.status === 'pending');
  console.log(`Pending sessions found: ${pending.length}`);
}

testFlow();
