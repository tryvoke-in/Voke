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

        const githubToken = Deno.env.get("GITHUB_TOKEN");
        if (!githubToken) throw new Error("GITHUB_TOKEN not configured on server");

        const body = await req.json();
        const { username, per_page } = body;
        
        if (!username) {
             return new Response(JSON.stringify({ error: "Username is required" }), { 
                status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });           
        }
        
        const limit = per_page || 3;

        const response = await fetch(
            `https://api.github.com/users/${username}/repos?sort=updated&per_page=${limit}`,
            {
                headers: {
                    'Accept': 'application/vnd.github.v3+json',
                    'User-Agent': 'Voke-Interview-App',
                    'Authorization': `token ${githubToken}`
                }
            }
        );

        const data = await response.text();
        return new Response(data, {
            status: response.status,
            headers: { ...corsHeaders, "Content-Type": "application/json" }
        });

    } catch (error: any) {
        console.error("Github Proxy Error:", error);
        return new Response(JSON.stringify({ error: error.message }), { 
            status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } 
        });
    }
})
