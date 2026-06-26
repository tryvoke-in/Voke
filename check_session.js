import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://ubktoscausselrtpuxux.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3Rvc2NhdXNzZWxydHB1eHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDg4MjMsImV4cCI6MjA3OTQ4NDgyM30._3IlGpdyig2Szn8jTI2dWoXonTt7Lg7-TeTveMJu3j8";

const supabase = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

async function run() {
  const sessionId = "b4777b1a-9375-4264-834a-e543f81f04bb";
  console.log("Fetching session:", sessionId);
  const { data, error } = await supabase
    .from("interview_sessions")
    .select("*")
    .eq("id", sessionId)
    .single();

  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Session Data:");
    console.log(JSON.stringify(data, null, 2));
  }
}

run();
