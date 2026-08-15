const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://ubktoscausselrtpuxux.supabase.co';
const anonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVia3Rvc2NhdXNzZWxydHB1eHV4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjM5MDg4MjMsImV4cCI6MjA3OTQ4NDgyM30._3IlGpdyig2Szn8jTI2dWoXonTt7Lg7-TeTveMJu3j8'; 

async function addLocations() {
  const supabase = createClient(supabaseUrl, anonKey);
  const locations = [
    { location_name: 'Pune', is_active: true },
    { location_name: 'Mumbai', is_active: true },
    { location_name: 'Bangalore', is_active: true },
    { location_name: 'Hyderabad', is_active: true },
    { location_name: 'Delhi', is_active: true },
    { location_name: 'Chennai', is_active: true },
    { location_name: 'Noida', is_active: true },
    { location_name: 'Gurgaon', is_active: true }
  ];

  console.log("Inserting locations...");
  const { data, error } = await supabase.from('monitored_locations').upsert(locations, { onConflict: 'location_name', ignoreDuplicates: true });
  
  if (error) {
    console.error("Error:", error);
  } else {
    console.log("Success! Locations added.");
  }
}

addLocations();
