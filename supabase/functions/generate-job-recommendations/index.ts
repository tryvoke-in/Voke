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

        if (authError || !user || user.id !== userId) {
            return new Response(JSON.stringify({ error: "Unauthorized" }), { 
                status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } 
            });
        }

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
            .select('full_name, resume_url, github_url, target_role')
            .eq('id', userId)
            .single()

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
            .limit(60)

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
                        .limit(60)
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

        // 4. Perform AI Resume + Interview Matching via Groq
        console.log("Matching user resume & interview performance to live jobs...");
        const groqApiKey = Deno.env.get('GROQ_API_KEY')
        if (!groqApiKey) throw new Error('GROQ_API_KEY not set')

        const groq = new Groq({ apiKey: groqApiKey })

        // Ensure we prioritize Indian jobs as requested by the user
        liveJobs.sort((a: any, b: any) => {
            const aLoc = (a.location || '').toLowerCase();
            const bLoc = (b.location || '').toLowerCase();
            const aIsIndia = aLoc.includes('india') || aLoc.includes('bengaluru') || aLoc.includes('hyderabad') || aLoc.includes('pune') || aLoc.includes('delhi');
            const bIsIndia = bLoc.includes('india') || bLoc.includes('bengaluru') || bLoc.includes('hyderabad') || bLoc.includes('pune') || bLoc.includes('delhi');
            if (aIsIndia && !bIsIndia) return -1;
            if (!aIsIndia && bIsIndia) return 1;
            return 0;
        });

        // Pass 45 jobs to Groq so it can return 30-40
        const targetJobsSample = liveJobs.slice(0, 45).map((j: any) => ({
            id: j.id,
            title: j.title,
            company: j.company,
            skills: j.skills_required,
            location: j.location,
            remote_ok: j.remote_ok,
        }));

        const prompt = `You are Voke's AI Career Scout. Analyze the candidate's RESUME to match them with open job postings from live sources.

CANDIDATE RESUME PROFILE:
- Target Role: ${profile?.target_role || 'Software Engineer'}
- Extracted Skills: ${resumeSkills.length > 0 ? resumeSkills.join(', ') : 'JavaScript, React, Node.js, Web Development'}
- Interview Score: ${avgScore}/100

OPEN JOB POSTINGS:
${JSON.stringify(targetJobsSample)}

TASK:
1. Match the candidate to at least 30 to 40 jobs from the list. The user wants to see ALL possible matches, even partial ones!
2. Provide a realistic match_score (40-99).
3. Provide exactly ONE short match_reason (max 10 words).

Return JSON strictly matching this schema:
{
  "recommendations": [
    {
      "job_id": "uuid",
      "match_score": 88,
      "match_reason": "Matches your React skills well"
    }
  ]
}`

        const completion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: "You are a top technical talent scout. Return valid JSON only." },
                { role: "user", content: prompt }
            ],
            model: "llama-3.3-70b-versatile",
            temperature: 0.5,
            response_format: { type: "json_object" }
        })

        const aiResponse = JSON.parse(completion.choices[0].message.content || '{}')
        const recommendations = aiResponse.recommendations || []

        // Format for insertion
        const recsToInsert = recommendations
            .filter((r: any) => r.job_id)
            .map((rec: any) => ({
                user_id: userId,
                job_posting_id: rec.job_id,
                match_score: Math.min(100, Math.max(40, rec.match_score || 75)),
                match_reasons: rec.match_reason ? [rec.match_reason] : ["Matches your resume profile"],
                skill_gaps: [],
                status: 'new'
            }))
            
        // If Groq still returned too few jobs (under 20), forcefully append the remaining liveJobs up to 35
        if (recsToInsert.length < 35) {
            const existingIds = new Set(recsToInsert.map((r: any) => r.job_posting_id));
            for (const job of liveJobs) {
                if (!existingIds.has(job.id)) {
                    recsToInsert.push({
                        user_id: userId,
                        job_posting_id: job.id,
                        match_score: Math.floor(Math.random() * (75 - 45 + 1) + 45), // random score between 45 and 75
                        match_reasons: ["General tech role match"],
                        skill_gaps: [],
                        status: 'new'
                    });
                    existingIds.add(job.id);
                }
                if (recsToInsert.length >= 35) break;
            }
        }

        // Clean up old recommendations and insert fresh ones
        await supabase.from('job_recommendations').delete().eq('user_id', userId)

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
                error: error.message,
                details: 'Check edge function logs'
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
