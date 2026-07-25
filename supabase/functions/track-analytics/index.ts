import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const payload = await req.json()
        const {
            event_type,
            page_path,
            action_details,
            user_agent,
            session_id,
            user_id,
            user_email
        } = payload;

        // 1. Validation & Truncation to prevent bloat attacks
        if (!event_type || typeof event_type !== 'string') {
            return new Response(JSON.stringify({ error: "Invalid event_type" }), { status: 400, headers: corsHeaders })
        }

        const cleanEventType = event_type.substring(0, 50); // limit event name length
        const cleanPagePath = (page_path || "").substring(0, 255);
        const cleanSessionId = (session_id || "unknown").substring(0, 100);
        const cleanUserAgent = (user_agent || "").substring(0, 500); // truncate user agent
        
        let cleanActionDetails = {};
        if (action_details && typeof action_details === 'object') {
            // Prevent massive JSON objects
            const jsonString = JSON.stringify(action_details);
            if (jsonString.length <= 2048) {
                cleanActionDetails = action_details;
            } else {
                cleanActionDetails = { _truncated: true, _original_length: jsonString.length };
            }
        }

        // 2. Initialize Supabase Admin client (Service Role)
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 3. Insert secure record
        const { error } = await supabase.from("user_activities").insert({
            user_id: user_id || null, // Optional
            user_email: user_email || null, // Optional
            session_id: cleanSessionId,
            event_type: cleanEventType,
            page_path: cleanPagePath,
            action_details: cleanActionDetails,
            user_agent: cleanUserAgent,
        });

        if (error) {
            console.error("Database insert error:", error)
            return new Response(JSON.stringify({ error: "Failed to log event" }), { status: 500, headers: corsHeaders })
        }

        return new Response(
            JSON.stringify({ success: true }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (e) {
        console.error("Analytics function error:", e)
        return new Response(
            JSON.stringify({ error: e.message }),
            { status: 500, headers: corsHeaders }
        )
    }
})
