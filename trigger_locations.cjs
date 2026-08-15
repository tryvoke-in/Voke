const supabaseUrl = 'https://ubktoscausselrtpuxux.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3Rvc2NhdXNzZWxydHB1eHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDg4MjMsImV4cCI6MjA3OTQ4NDgyM30._3IlGpdyig2Szn8jTI2dWoXonTt7Lg7-TeTveMJu3j8'; 

async function triggerFetch() {
  console.log("Triggering edge function...");
  const res = await fetch(`${supabaseUrl}/functions/v1/insert-locations`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${anonKey}`,
      'Content-Type': 'application/json'
    }
  });

  const text = await res.text();
  console.log("Status:", res.status);
  console.log("Response:", text);
}

triggerFetch();
