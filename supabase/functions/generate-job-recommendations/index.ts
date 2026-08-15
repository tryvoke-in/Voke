import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        console.log("generate-job-recommendations function started");
        const { userId, forceRefresh = false } = await req.json()

        if (!userId) {
            return new Response(
                JSON.stringify({ error: 'userId is required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Auth check
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            return new Response(JSON.stringify({ error: "Missing authorization header" }), { 
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
        if (!supabaseAnonKey) {
            throw new Error("SUPABASE_ANON_KEY is not configured");
        }
        
        const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
            global: { headers: { Authorization: authHeader } }
        });

        const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();

        /*
        if (authError || !user || user.id !== userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }
        */

        // Groq SDK setup
        let Groq;
        try {
            const module = await import('https://esm.sh/groq-sdk@0.8.0');
            Groq = module.default;
        } catch (err) {
            throw new Error(`Groq import failed: ${err.message}`);
        }

        // Check if cached recommendations exist
        if (!forceRefresh) {
            const { data: existingRecs } = await supabase
                .from('job_recommendations')
                .select('id, created_at')
                .eq('user_id', userId)
                .gte('created_at', new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString())
                .limit(1)

            if (existingRecs && existingRecs.length > 0) {
                return new Response(
                    JSON.stringify({
                        message: 'Recent recommendations exist. Use forceRefresh=true to regenerate.',
                        cached: true
                    }),
                    { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
                )
            }
        }

        // 1. Fetch User Resume Context & Profile Data
        console.log("Fetching user profile & resume analysis...");
        const { data: profile } = await supabase
            .from('profiles')
            .select('full_name, resume_url, github_url, target_role, location')
            .eq('id', userId)
            .maybeSingle()

        const { data: resumeAnalyses } = await supabase
            .from('resume_analyses')
            .select('analysis_result, ats_score, created_at')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(1)

        const latestResumeAnalysis = resumeAnalyses?.[0]?.analysis_result || {};
        const resumeSkills: string[] = latestResumeAnalysis.skills || [];
        const resumeSummary: string = latestResumeAnalysis.summary || profile?.target_role || "Software Developer";
        const resumeExperience: string = latestResumeAnalysis.experience_level || "mid";

        // 2. Fetch User Interview Performance Stats
        console.log("Fetching interview stats...");
        const { data: textInterviews } = await supabase
            .from('interview_sessions')
            .select('id, role, overall_score')
            .eq('user_id', userId)
            .limit(10)

        const { data: videoInterviews } = await supabase
            .from('video_interview_sessions')
            .select('id, question, overall_score, delivery_score, confidence_score')
            .eq('user_id', userId)
            .limit(10)

        const { data: voiceInterviews } = await supabase
            .from('voice_interview_sessions')
            .select('id, role, overall_score')
            .eq('user_id', userId)
            .limit(10)

        const allScores = [
            ...(textInterviews || []).map((i: any) => i.overall_score).filter(Boolean),
            ...(videoInterviews || []).map((i: any) => i.overall_score).filter(Boolean),
            ...(voiceInterviews || []).map((i: any) => i.overall_score).filter(Boolean)
        ]
        const avgScore = allScores.length > 0
            ? Math.round(allScores.reduce((a: any, b: any) => a + b, 0) / allScores.length)
            : 65

        // 3. Ensure live jobs exist in job_postings from free APIs
        let { data: liveJobs } = await supabase
            .from('job_postings')
            .select('*')
            .neq('source', 'ai-generated')
            .order('posted_date', { ascending: false })
            .limit(1500)

        if (!liveJobs || liveJobs.length < 10 || forceRefresh) {
            console.log("Triggering fetch-real-jobs to pull fresh jobs from free APIs...");
            try {
                const fetchRes = await fetch(`${supabaseUrl}/functions/v1/fetch-real-jobs`, {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${supabaseServiceKey}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ query: profile?.target_role || "software engineer" })
                });
                if (fetchRes.ok) {
                    const { data: freshDbJobs } = await supabase
                        .from('job_postings')
                        .select('*')
                        .neq('source', 'ai-generated')
                        .order('posted_date', { ascending: false })
                        .limit(1500)
                    if (freshDbJobs && freshDbJobs.length > 0) {
                        liveJobs = freshDbJobs;
                    }
                }
            } catch (e) {
                console.error("Failed inline fetch of real jobs:", e);
            }
        }

        if (!liveJobs || liveJobs.length === 0) {
            const { data: fallbackJobs } = await supabase
                .from('job_postings')
                .select('*')
                .order('posted_date', { ascending: false })
                .limit(40)
            liveJobs = fallbackJobs || [];
        }

        
        const targetRoleWords = (profile?.target_role || '').toLowerCase().split(' ').filter(w => w.length > 2);
        
        let localRecsToInsert = liveJobs.map(job => {
            const jobTitle = (job.title || '').toLowerCase();
            let isMatch = targetRoleWords.length > 0 && targetRoleWords.some(w => jobTitle.includes(w));
            
            let score;
            let reason;
            if (isMatch) {
                score = Math.floor(Math.random() * (99 - 85 + 1) + 85);
                reason = 'Matches your target role';
            } else {
                score = Math.floor(Math.random() * (75 - 45 + 1) + 45);
                reason = 'General tech role match';
            }
            
            return {
                user_id: userId,
                job_posting_id: job.id,
                match_score: score,
                match_reasons: [reason],
                skill_gaps: [],
                status: 'new'
            };
        });
        
        // Ensure they don't insert more than what Supabase allows in one go, but 1500 is fine
        const recsToInsert = localRecsToInsert;

        // Clean up old recommendations and insert fresh ones
        await supabase.from('job_recommendations').delete().eq('user_id', userId)

        if (recsToInsert.length === 0) {
            return new Response(
                JSON.stringify({ 
                    success: true, 
                    count: 0, 
                    recommendations: [] 
                }),
                { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        const { data: insertedRecs, error: insertError } = await supabase
            .from('job_recommendations')
            .insert(recsToInsert)
            .select(`
                *,
                job_postings (*)
            `)

        if (insertError) {
            console.error("Insert recommendations error:", insertError);
            throw insertError;
        }

        return new Response(
            JSON.stringify({ 
                success: true, 
                count: insertedRecs?.length || 0, 
                recommendations: insertedRecs 
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in generate-job-recommendations:', error)
        return new Response(
            JSON.stringify({
                crashError: error.message,
                details: error.stack
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
