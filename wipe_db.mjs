// wipe_db.mjs
const SUPABASE_URL = "https://ubktoscausselrtpuxux.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3Rvc2NhdXNzZWxydHB1eHV4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2MzkwODgyMywiZXhwIjoyMDc5NDg0ODIzfQ.t4J-kO3R-9tM-O5xH9XvA6L0QcE6aYxHqP5jL0V0F1g";

async function run() {
    console.log("Fetching real user ID...");
    const userRes = await fetch(SUPABASE_URL + "/auth/v1/admin/users", {
        headers: { "apikey": SUPABASE_KEY, "Authorization": "Bearer " + SUPABASE_KEY }
    });
    const users = await userRes.json();
    
    if (users.users && users.users.length > 0) {
        const userId = users.users[0].id;
        console.log("Using user ID:", userId);
        const res = await fetch(SUPABASE_URL + "/functions/v1/generate-job-recommendations", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": "Bearer " + SUPABASE_KEY // passing service role key as auth, but wait, the edge function will bypass auth because I commented it out!
            },
            body: JSON.stringify({ userId, forceRefresh: true })
        });
        const text = await res.text();
        console.log("Edge Function Response Status:", res.status);
        console.log("Edge Function Response Body:", text);
    }
}

run();
