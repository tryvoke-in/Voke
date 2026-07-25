import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing authorization header" }), { 
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") || "";
        
        const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();

        if (authError || !user) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const groqApiKey = Deno.env.get("GROQ_API_KEY");
        if (!groqApiKey) throw new Error("GROQ_API_KEY not configured on server");

        const contentType = req.headers.get("content-type") || "";
        let response;

        if (contentType.includes("multipart/form-data")) {
            // Audio Transcription proxy
            const formData = await req.formData();
            
            response = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqApiKey}`,
                },
                body: formData
            });
        } else {
            // Chat Completions proxy
            const body = await req.json();
            response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${groqApiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(body)
            });
        }

        const data = await response.text();
        return new Response(data, {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Groq Proxy Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }
})
