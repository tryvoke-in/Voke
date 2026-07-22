
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const supabase = createClient(
            Deno.env.get('SUPABASE_URL') ?? '',
            Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
        )

        const authHeader = req.headers.get('Authorization')!
        const token = authHeader.replace('Bearer ', '')
        const { data: { user }, error: userError } = await supabase.auth.getUser(token)

        if (userError || !user) {
            return new Response(
                JSON.stringify({ error: 'Unauthorized' }),
                { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 401 }
            )
        }

        console.log(`Starting account deletion for user: ${user.id}`)

        // List of tables to clean up manually to ensure no FK constraints block the deletion
        // or in case cascades are not fully set up.
        const tables = [
            'peer_interview_sessions', // specialized handling needed
            'job_recommendations',
            'user_career_recommendations',
            'user_career_plans',
            'user_progress',
            'chat_sessions',
            'resume_analyses',
            'interview_sessions',
            'video_interview_sessions',
            'notifications'
        ];

        // 1. Delete data from related tables
        for (const table of tables) {
            if (table === 'peer_interview_sessions') {
                await supabase.from(table).delete().eq('host_user_id', user.id);
                await supabase.from(table).delete().eq('guest_user_id', user.id);
            } else {
                const { error: delError } = await supabase.from(table).delete().eq('user_id', user.id);
                if (delError) {
                    console.error(`Error deleting from ${table}:`, delError);
                    // continue anyway
                }
            }
        }

        // 2. Delete profile
        const { error: profileError } = await supabase.from('profiles').delete().eq('id', user.id);
        if (profileError) {
            console.error("Error deleting profile:", profileError);
            throw new Error("Failed to delete user profile data");
        }

        // 3. Delete from auth.users (The big one)
        const { error: deleteError } = await supabase.auth.admin.deleteUser(
            user.id
        )

        if (deleteError) {
            throw deleteError
        }

        console.log(`Successfully deleted account for user: ${user.id}`)

        return new Response(
            JSON.stringify({ message: 'User account deleted successfully' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
        )

    } catch (error) {
        console.error("Delete account error:", error);
        return new Response(
            JSON.stringify({ error: error.message }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 400 }
        )
    }
})
