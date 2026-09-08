import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { callGeminiPipeline } from "../_shared/gemini-pipeline.ts"

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response('ok', { headers: corsHeaders })
    }

    try {
        const body = await req.json()
        const { userId, targetRole, jobRecommendationId } = body
        const durationWeeks = body.durationWeeks && [2, 4, 8, 12].includes(body.durationWeeks) ? body.durationWeeks : 4
        const experienceLevel = body.experienceLevel || (targetRole?.toLowerCase().includes("senior") ? "senior" : "mid")

        if (!userId || !targetRole) {
            return new Response(
                JSON.stringify({ error: 'userId and targetRole are required' }),
                { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        // Initialize Supabase client
        const supabaseUrl = Deno.env.get('SUPABASE_URL')!
        const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

        const { createClient } = await import('https://esm.sh/@supabase/supabase-js@2')
        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // 1. Authenticate caller if header present
        const authHeader = req.headers.get("Authorization");
        const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
        if (authHeader && supabaseAnonKey) {
            const supabaseAuthClient = createClient(supabaseUrl, supabaseAnonKey, {
                global: { headers: { Authorization: authHeader } }
            });
            const { data: { user }, error: authError } = await supabaseAuthClient.auth.getUser();
            if (!authError && user && user.id !== userId) {
                return new Response(JSON.stringify({ error: "Forbidden: userId mismatch" }), { 
                    status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } 
                });
            }
        }

        // Fetch user's interview performance
        const { data: textInterviews } = await supabase
            .from('interview_sessions')
            .select('overall_score, role')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        const { data: videoInterviews } = await supabase
            .from('video_interview_sessions')
            .select('overall_score, delivery_score, body_language_score, confidence_score, role')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .limit(10)

        // Calculate strengths and weaknesses
        const allScores = [
            ...(textInterviews || []).map(i => i.overall_score).filter(Boolean),
            ...(videoInterviews || []).map(i => i.overall_score).filter(Boolean)
        ]
        const avgScore = allScores.length > 0
            ? Math.round(allScores.reduce((a, b) => a + b, 0) / allScores.length)
            : 50

        const videoScores = videoInterviews || []
        const avgDelivery = videoScores.length > 0
            ? Math.round(videoScores.reduce((sum, i) => sum + (i.delivery_score || 0), 0) / videoScores.length)
            : 0
        const avgBodyLanguage = videoScores.length > 0
            ? Math.round(videoScores.reduce((sum, i) => sum + (i.body_language_score || 0), 0) / videoScores.length)
            : 0
        const avgConfidence = videoScores.length > 0
            ? Math.round(videoScores.reduce((sum, i) => sum + (i.confidence_score || 0), 0) / videoScores.length)
            : 0

        // Identify strengths and weaknesses
        const strengths: string[] = []
        const weaknesses: string[] = []

        if (avgDelivery > 75) strengths.push('Strong communication and delivery')
        else if (avgDelivery < 60) weaknesses.push('Communication and delivery')

        if (avgBodyLanguage > 75) strengths.push('Excellent body language and presence')
        else if (avgBodyLanguage < 60) weaknesses.push('Body language and presence')

        if (avgConfidence > 75) strengths.push('High confidence in interviews')
        else if (avgConfidence < 60) weaknesses.push('Interview confidence')

        if (avgScore > 75) strengths.push('Consistently strong interview performance')
        else if (avgScore < 60) weaknesses.push('Overall interview performance')

        // Get skill gaps if job recommendation is provided
        let skillGaps: any[] = []
        if (jobRecommendationId) {
            const { data: recommendation } = await supabase
                .from('job_recommendations')
                .select('skill_gaps')
                .eq('id', jobRecommendationId)
                .eq('user_id', userId)
                .maybeSingle()

            if (recommendation && recommendation.skill_gaps) {
                skillGaps = recommendation.skill_gaps
            }
        }

        // Prepare prompt for AI
        const prompt = `You are an elite career coach specializing in creating tailored ${durationWeeks}-week technical career roadmaps.

Create a detailed ${durationWeeks}-week plan for:

TARGET ROLE: ${targetRole}
LEVEL: ${experienceLevel}
DURATION: ${durationWeeks} Weeks
CURRENT PROFILE:
- Average Interview Score: ${avgScore}/100
- Delivery Skills: ${avgDelivery}/100
- Strengths: ${strengths.join(', ') || 'To be developed'}
- Areas to Improve: ${weaknesses.join(', ') || 'None identified'}
${skillGaps.length > 0 ? `- Skill Gaps to Address: ${skillGaps.map((g: any) => g.skill).join(', ')}` : ''}

CRITICAL REQUIREMENT:
Generate exactly ${durationWeeks} weekly task items (Week 1 through Week ${durationWeeks}).
Also include at least 6 verified online courses and learning resources (Udemy, Coursera, freeCodeCamp, NeetCode, etc.).

Return ONLY valid JSON in this exact format:
{
  "target_role": "${targetRole}",
  "current_skill_level": "${experienceLevel}",
  "month_1_goals": {
    "title": "Foundation & Core Skills",
    "focus_areas": ["area1", "area2"],
    "milestone": "Specific measurable milestone"
  },
  "month_2_goals": {
    "title": "Advanced Scalability",
    "focus_areas": ["area1", "area2"],
    "milestone": "Specific measurable milestone"
  },
  "month_3_goals": {
    "title": "Interview & Offer Execution",
    "focus_areas": ["area1", "area2"],
    "milestone": "Specific measurable milestone"
  },
  "weekly_tasks": [
    // Generate Week 1 to Week ${durationWeeks}
    {
      "month": 1,
      "week": 1,
      "title": "Week title",
      "tasks": ["Task 1", "Task 2", "Task 3", "Task 4"],
      "completed": false
    }
  ],
  "resources": [
    {
      "title": "Course Name",
      "platform": "Udemy|Coursera|freeCodeCamp|NeetCode",
      "type": "course|book|tutorial|practice",
      "url": "https://...",
      "cost": "free|paid",
      "priority": "high|medium|low",
      "rating": "4.8 ★",
      "duration": "20 hours",
      "description": "Why this is recommended"
    }
  ],
  "milestones": [
    {
      "month": 1,
      "title": "Milestone title",
      "description": "Milestone description",
      "achieved": false
    }
  ]
}`

        let careerPlan: any = null

        // 1. Try Gemini Pipeline first
        try {
            const geminiRes = await callGeminiPipeline({
                systemPrompt: "You are an elite career coach. Always respond with valid JSON only. Generate all requested weeks.",
                geminiContents: [{ role: "user", parts: [{ text: prompt }] }],
                temperature: 0.5
            });

            if (geminiRes.ok && geminiRes.aiContent) {
                const cleaned = geminiRes.aiContent.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
                careerPlan = JSON.parse(cleaned);
            }
        } catch (geminiErr) {
            console.warn("Gemini pipeline failed for create-career-plan, trying Groq fallback:", geminiErr);
        }

        // 2. Try Groq fallback if Gemini was unavailable and GROQ_API_KEY exists
        if (!careerPlan && Deno.env.get('GROQ_API_KEY')) {
            try {
                const { default: Groq } = await import('https://esm.sh/groq-sdk@0.8.0');
                const groq = new Groq({ apiKey: Deno.env.get('GROQ_API_KEY') });
                const completion = await groq.chat.completions.create({
                    messages: [
                        { role: "system", content: "You are an elite career coach. Always respond with valid JSON only." },
                        { role: "user", content: prompt }
                    ],
                    model: "llama-3.3-70b-versatile",
                    temperature: 0.7,
                    max_tokens: 4000,
                    response_format: { type: "json_object" }
                });
                careerPlan = JSON.parse(completion.choices[0].message.content || '{}');
            } catch (groqErr) {
                console.warn("Groq fallback failed:", groqErr);
            }
        }

        // 3. Deterministic Fallback if AI models are unreachable, timed out, or returned fewer weeks
        if (!careerPlan || !careerPlan.weekly_tasks || careerPlan.weekly_tasks.length < durationWeeks) {
            const gap1 = skillGaps[0]?.skill || "Core Systems Architecture";
            const gap2 = skillGaps[1]?.skill || "Scalable Backend & Cloud Services";

            const allWeeks = [
                { month: 1, week: 1, title: `Week 1: Core Fundamentals & ${gap1} Baseline`, tasks: [`Diagnostic skill assessment in ${gap1}`, "Solve 6 two-pointer & hash map problems", "Set up testing sandbox", `Review official documentation for ${gap1}`], completed: false },
                { month: 1, week: 2, title: `Week 2: Deep Dive into ${gap1} & Patterns`, tasks: ["Implement trees and heap data structures", `Build functional micro-module exercising ${gap1}`, "Solve 6 medium graph & BFS/DFS problems", `Analyze open-source codebases for ${targetRole}`], completed: false },
                { month: 1, week: 3, title: `Week 3: System Design & Low-Level Architecture`, tasks: ["Study distributed systems primitives (caching, load balancing)", `Design clean API layer for ${gap2}`, "Whiteboard architecture on Excalidraw", "Complete Voke AI baseline mock interview"], completed: false },
                { month: 1, week: 4, title: `Week 4: Month 1 Benchmark & ATS Resume Polish`, tasks: ["Solve 5 timed interview questions", "Refine resume ATS score to 85%+ with metrics", "Run integration tests on prototype", "Review AI interview feedback for filler words"], completed: false },
                { month: 2, week: 5, title: "Week 5: Caching & Distributed Concurrency", tasks: ["Deep dive into Redis write-through & cache-aside", "Architect showcase portfolio project", "Solve dynamic programming problems", "Study database replication and sharding"], completed: false },
                { month: 2, week: 6, title: "Week 6: Database Optimization & Docker", tasks: ["Optimize PostgreSQL queries with EXPLAIN ANALYZE", "Containerize application with Docker & compose", "Set up GitHub Actions CI/CD pipelines", "Conduct 2 mock System Design whiteboard interviews"], completed: false },
                { month: 2, week: 7, title: "Week 7: Resilience & Cloud Benchmarks", tasks: ["Implement circuit breakers and graceful degradation", "Bench-test API under simulated concurrent traffic", "Solve hard graph & trie challenges", "Complete Voke AI Mock Interview round"], completed: false },
                { month: 2, week: 8, title: "Week 8: Production Deployment & Showcase", tasks: ["Deploy portfolio application to cloud infrastructure", "Write engineering README with benchmark diagrams", "Conduct mid-point career self-evaluation", "Publish repository with documentation badges"], completed: false },
                { month: 3, week: 9, title: "Week 9: Behavioral Leadership (STAR Method)", tasks: ["Draft 6 STAR-method leadership stories", "Practice audio-video responses with Voke AI Coach", "Audit LinkedIn and GitHub for recruiter reach", "Prepare reverse-interview questions for managers"], completed: false },
                { month: 3, week: 10, title: "Week 10: Targeted Outreach & Applications", tasks: ["Outreach to 10 alumni and tech recruiters", "Apply to top 5 matched job postings on Voke", "Complete 3 full-length timed mock rounds", "Practice live recruiter screening drills"], completed: false },
                { month: 3, week: 11, title: "Week 11: Live Technical Screens Execution", tasks: ["Participate in live recruiter screens and tech rounds", "Review feedback recordings and patch weak areas", "Practice pair programming on Coderpad", "Refine trade-off explanations in system design"], completed: false },
                { month: 3, week: 12, title: "Week 12: Onsite Rounds & Offer Negotiation", tasks: ["Perform compensation benchmark research on Levels.fyi", "Execute on-site rounds with structured communication", "Formulate negotiation strategy for base & equity", "Celebrate milestones and finalize onboarding plan"], completed: false }
            ];

            let selectedWeeks = allWeeks.slice(0, durationWeeks);
            if (durationWeeks === 2) {
                selectedWeeks = [
                    { month: 1, week: 1, title: `Week 1: High-Yield Skill Gap Triage & ${gap1}`, tasks: [`Audit competencies in ${gap1}`, "Solve 10 Blind 75 interview patterns", "Review System Design Primer cheat sheets", "Complete Voke AI technical mock interview"], completed: false },
                    { month: 1, week: 2, title: "Week 2: Mock Interview Drills & Screening Execution", tasks: ["Practice 5 STAR-method leadership stories", "Conduct 2 full-length Voke AI rounds", "Prepare reverse-interview questions", "Apply to top 5 matched opportunities"], completed: false }
                ];
            }

            careerPlan = {
                target_role: targetRole,
                current_skill_level: experienceLevel,
                meta: {
                    duration_weeks: durationWeeks,
                    duration_label: `${durationWeeks} Weeks`,
                    weekly_hours: 15
                },
                month_1_goals: {
                    title: durationWeeks <= 4 ? `${durationWeeks}-Week Prep Goals` : "Foundation & Core Patterns",
                    focus_areas: [gap1, "Data Structures & Patterns", "System Design Primitives"],
                    milestone: `Master fundamental competencies in ${gap1} and verify through mock interviews.`,
                    meta: { duration_weeks: durationWeeks, duration_label: `${durationWeeks} Weeks` }
                },
                month_2_goals: {
                    title: "Advanced Scalability & Portfolio",
                    focus_areas: [gap2, "Microservice Architecture", "High-Throughput Databases"],
                    milestone: `Architect and deploy a production-grade showcase project demonstrating ${gap2}.`
                },
                month_3_goals: {
                    title: "Interview Mastery & Offer Execution",
                    focus_areas: ["Voke AI Technical Mock Rounds", "Behavioral Leadership (STAR)", "Live Negotiations"],
                    milestone: "Achieve 85%+ in consecutive mock rounds and land technical interview rounds."
                },
                weekly_tasks: selectedWeeks,
                resources: [
                    { title: `${targetRole} Roadmap & Skill Tree`, platform: "Roadmap.sh", type: "documentation", url: "https://roadmap.sh", cost: "free", priority: "high", rating: "4.9 ★", duration: "Self-paced", description: "Community-driven visual roadmaps and guides for target roles." },
                    { title: "NeetCode Blind 75 / 150 Coding Interview Patterns", platform: "NeetCode", type: "practice", url: "https://neetcode.io/practice", cost: "free", priority: "high", rating: "4.9 ★", duration: "30 hours", description: "Step-by-step video explanations and optimal patterns for coding rounds." },
                    { title: "System Design Primer & Architectural Blueprints", platform: "GitHub", type: "tutorial", url: "https://github.com/donnemartin/system-design-primer", cost: "free", priority: "high", rating: "4.9 ★", duration: "Self-paced", description: "Industry-standard open source guide to scalable system design." },
                    { title: "Voke AI Interactive Mock Technical & Behavioral Rounds", platform: "Voke AI", type: "practice", url: "/interview", cost: "free", priority: "high", rating: "4.9 ★", duration: "45 mins/session", description: "Real-time AI voice-video feedback evaluating technical accuracy and delivery." },
                    { title: "Designing Data-Intensive Applications (DDIA)", platform: "O'Reilly", type: "book", url: "https://www.youtube.com/watch?v=F_fP49L8cbg", cost: "free", priority: "medium", rating: "4.9 ★", duration: "18 hours", description: "Storage engines, replication, partition strategies, and consensus protocols." },
                    { title: "Tech Interview Handbook: Curated Study Guide", platform: "Tech Interview Handbook", type: "book", url: "https://www.techinterviewhandbook.org", cost: "free", priority: "medium", rating: "4.8 ★", duration: "6 hours read", description: "Recruiter screens, behavioral rounds, reverse questions, and negotiation." }
                ],
                milestones: [
                    { month: 1, title: "Milestone 1: Technical Foundations Verified", description: `Passed core patterns and demonstrated proficiency in ${gap1}.`, achieved: false },
                    { month: 2, title: "Milestone 2: Interview Ready & Active Pipeline", description: "Consistently scoring 85%+ in mock rounds with live applications.", achieved: false }
                ]
            }
        }

        // Ensure tasks have task_items array for granular tracking
        if (careerPlan.weekly_tasks) {
            careerPlan.weekly_tasks = careerPlan.weekly_tasks.map((w: any) => ({
                ...w,
                task_items: (w.tasks || []).map((t: string, idx: number) => ({
                    id: `w${w.week}_t${idx}`,
                    text: t,
                    completed: false
                }))
            }))
        }

        // Store career plan in database
        const { data: insertedPlan, error: insertError } = await supabase
            .from('user_career_plans')
            .insert({
                user_id: userId,
                target_role: targetRole,
                current_skill_level: careerPlan.current_skill_level || experienceLevel,
                month_1_goals: careerPlan.month_1_goals || {},
                month_2_goals: careerPlan.month_2_goals || {},
                month_3_goals: careerPlan.month_3_goals || {},
                weekly_tasks: careerPlan.weekly_tasks || [],
                resources: careerPlan.resources || [],
                milestones: careerPlan.milestones || [],
                progress_percentage: 0,
                job_recommendation_id: jobRecommendationId || null
            })
            .select()
            .single()

        if (insertError) {
            console.error('Error inserting career plan:', insertError)
            return new Response(
                JSON.stringify({ error: 'Failed to store career plan', details: insertError }),
                { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
            )
        }

        return new Response(
            JSON.stringify({
                success: true,
                plan: insertedPlan
            }),
            { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )

    } catch (error: any) {
        console.error('Error in create-career-plan:', error)
        return new Response(
            JSON.stringify({ error: error?.message || "Internal server error" }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
    }
})
