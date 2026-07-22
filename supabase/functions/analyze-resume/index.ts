import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
    if (req.method === "OPTIONS") {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { resumeUrl, resumeText } = await req.json();

        const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
        if (!GROQ_API_KEY) {
            throw new Error("GROQ_API_KEY is not configured");
        }

        const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
        const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Get authorization header
        const authHeader = req.headers.get("Authorization");
        if (!authHeader) {
            throw new Error("No authorization header");
        }

        // Get user from token
        const token = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabase.auth.getUser(token);
        if (userError || !user) {
            throw new Error("Unauthorized");
        }

        if (!resumeText || resumeText.length < 50) {
            throw new Error("Resume content is missing or too short");
        }

        console.log(`Analyzing resume for ${user.email}, length: ${resumeText.length}`);

        const analysisPrompt = `You are a strict, expert technical recruiter and ATS specialist at a top tech company (FAANG). You are reviewing a candidate's resume for a software engineering role.

**YOUR OBJECTIVE:**
Provide a critical, "no-fluff" deep-dive analysis. Do not be generic. If the resume is vague, call it out. If the formatting is bad, be direct.

**ANALYSIS REQUIREMENTS:**

1.  **ATS Compatibility Score (0-100)**:
    -   Be harsh. Deduct points for: tables, graphics, multi-column layouts that break parsing, missing keywords, and vague bullet points.
    -   < 60: Poor (Needs total rewrite)
    -   60-75: Average (Needs significant work)
    -   75-85: Good (Minor tweaks needed)
    -   85+: Excellent

2.  **Keywords**:
    -   Identify specific technical keywords missing for a modern Software Engineer (e.g., specific cloud tools, testing frameworks, CI/CD tools, system design terms).

3.  **Structure & Content Quality**:
    -   Do bullet points have metrics? (e.g., "Improved latency by 20ms" vs "Optimized code").
    -   Is the experience strictly chronological?
    -   Are there "responsibility" lists instead of "achievement" lists? (Bad)

4.  **Actionable Improvements (CRITICAL SECTION)**:
    -   Give concrete examples.
    -   Instead of: "Add more metrics."
    -   Say: "Rewrite 'Worked on API' to 'Designed REST API endpoints resolving 50k+ daily requests with <100ms latency'."

**OUTPUT FORMAT (JSON):**
{
  "ats_score": number (0-100),
  "keywords": {
    "present": ["list", "of", "found", "keywords"],
    "missing": ["list", "of", "specific", "missing", "keywords"]
  },
  "strengths": ["Specific strength 1", "Specific strength 2"],
  "improvements": [
    "Specific actionable tip 1 (e.g., Rewrite summary to focus on X)",
    "Specific actionable tip 2 (e.g., Move Skills section to top)",
    "Specific actionable tip 3 (e.g., Quantify the 'Project X' bullet point)"
  ],
  "structure_feedback": "Detailed critique of layout and organization.",
  "content_feedback": "Detailed critique of the actual bullet point content.",
  "overall_summary": "Professional summary of the candidate's standing."
}

**RESUME TO ANALYZE:**
${resumeText}

Provide honest, constructive, and highly specific feedback. Imagine you are deciding whether to interview this person.`;

        const response = await fetch(
            "https://api.groq.com/openai/v1/chat/completions",
            {
                method: "POST",
                headers: {
                    Authorization: `Bearer ${GROQ_API_KEY}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    model: "llama-3.3-70b-versatile",
                    messages: [
                        { role: "system", content: "You are an expert resume reviewer." },
                        { role: "user", content: analysisPrompt }
                    ],
                    temperature: 0.3,
                    response_format: { type: "json_object" },
                }),
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Groq API error:", response.status, errorText);
            throw new Error(`Groq API error: ${response.status}`);
        }

        const data = await response.json();
        let aiContent = data.choices[0]?.message?.content;

        if (!aiContent) {
            throw new Error("No response from AI");
        }

        // Clean up and parse
        aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();
        const analysis = JSON.parse(aiContent);

        // Save analysis to database
        const { error: insertError } = await supabase
            .from("resume_analyses")
            .insert({
                user_id: user.id,
                resume_url: resumeUrl,
                analysis_result: analysis,
                ats_score: analysis.ats_score
            });

        if (insertError) {
            console.error("Error saving analysis:", insertError);
        }

        return new Response(JSON.stringify(analysis), {
            headers: { ...corsHeaders, "Content-Type": "application/json" },
        });

    } catch (error) {
        console.error("Error in analyze-resume:", error);
        return new Response(
            JSON.stringify({ error: (error as Error).message }),
            {
                status: 500,
                headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
        );
    }
});
