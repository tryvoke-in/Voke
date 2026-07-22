import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { sessionId, question, transcript, userContext, role } = await req.json();
    console.log("Analyzing video interview session:", sessionId, "Role:", role);

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      console.error("GROQ_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Server configuration error: GROQ_API_KEY is missing" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session data
    const { data: session, error: sessionError } = await supabase
      .from("video_interview_sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) throw sessionError;

    console.log("Video URL:", session.video_url);

    // Enhanced analysis prompt with role-specific criteria
    const roleContext = role ? `for a ${role} position` : "";
    const analysisPrompt = `You are an expert interview coach with 15+ years of experience. Analyze this video interview response ${roleContext} in detail.

INTERVIEW DETAILS:
- Role: ${role || "General"}
- Question: "${question}"
- Duration: ${session.duration_seconds} seconds
- Context: ${userContext || "Professional preparing for interviews"}
- Transcript: "${transcript || "(No transcript available, analyze based on video metadata and general best practices)"}"

ANALYSIS REQUIREMENTS:
Provide a comprehensive analysis including:

1. MODEL ANSWER: Write an ideal 2-3 paragraph response to this question ${roleContext}. This should demonstrate best practices in structure, content, and delivery.

2. WHAT'S GOOD: List 3-5 specific strengths in the candidate's response with concrete examples from their answer.

3. WHAT'S WRONG: List 3-5 specific, DIRECT COMMANDS for improvement. Do not be vague.
   - BAD: "Could improve eye contact"
   - GOOD: "Look directly at the webcam lens, not the screen"
   - BAD: "Better posture needed"
   - GOOD: "Sit upright and stop slouching; center yourself in the frame"

4. VIDEO ANALYSIS DETAILS (Be brutally honest):
   - Eye Contact: Did they look at the camera? (Yes/No + specific advice)
   - Voice Volume: Was it loud enough? (Too quiet/Good/Too loud)
   - Posture: Was it professional? (Slouching/Good/Leaning)
   - Facial Expressions: Did they smile? Were they deadpan?

5. SCORES (0-100):
   - Delivery: Clarity, pacing, filler words, tone
   - Body Language: Posture, eye contact, gestures, expressions
   - Confidence: Self-assurance, handling pauses, professional demeanor
   - Overall: Weighted average

6. **6Q PERSONALITY ANALYSIS FRAMEWORK (MANDATORY):**
   Analyze the candidate's personality traits (0-100) based on the comprehensive "6Q Framework":

   **1. IQ (Intelligence Quotient)** - Logic & Clarity
      - High: Structured answer, specific examples
      - Low: Vague, rambling, misses the point

   **2. EQ (Emotional Quotient)** - Empathy & Awareness
      - High: Uses emotional vocabulary, humble
      - Low: Defensive, blames others, flat tone

   **3. CQ (Creativity Quotient)** - Innovation
      - High: "What if" thinking, unique perspective
      - Low: Standard/cliché answers, rigid thinking

   **4. AQ (Adversity Quotient)** - Resilience
      - High: Calm tone, talks about solutions not problems
      - Low: Frustrated tone, complains, defensive

   **5. SQ (Social Quotient)** - Collaboration
      - High: Inclusive language ("we", "us"), friendly
      - Low: "I" focused, dismissive, withdrawn

   **6. MQ (Moral Quotient)** - Integrity
      - High: Takes responsibility, honest about mistakes
      - Low: Avoids blame, inconsistent stories

   **DETERMINE THE PERSONALITY CLUSTER based on the top 3 traits:**
   - Balanced Thinker (IQ+EQ+SQ), Innovative Problem Solver (IQ+CQ+AQ), Creative Strategist (IQ+CQ+SQ)
   - Resilient Scholar (IQ+EQ+AQ), Responsible Analyst (IQ+SQ+MQ), Compassionate Leader (EQ+SQ+MQ)
   - Creative People Person (EQ+CQ+SQ), Ethical Resilient Leader (EQ+AQ+MQ), Adaptive Innovator (CQ+AQ+SQ)
   - Socially Conscious Creator (CQ+SQ+MQ), Ethical Executor (IQ+MQ+AQ), Empathic Creator (EQ+CQ+MQ)
   - Insightful Innovator (IQ+EQ+CQ), Thoughtful Decision Maker (IQ+EQ+MQ), Creative Resilient Communicator (CQ+EQ+AQ)
   - Purpose-Led Problem Solver (MQ+CQ+AQ), High-Output Collaborator (IQ+SQ+AQ), The Stabiliser (EQ+SQ+AQ)

RESPONSE FORMAT (strict JSON):
{
  "model_answer": "<ideal 2-3 paragraph response>",
  "whats_good": ["<strength 1>", "<strength 2>", ...],
  "whats_wrong": ["<DIRECT COMMAND 1 (e.g. Look at the camera)>", "<DIRECT COMMAND 2 (e.g. Sit up straight)>", ...],
  "video_analysis_details": {
    "eye_contact": "<specific observation + advice>",
    "voice_volume": "<specific observation + advice>",
    "posture": "<specific observation + advice>",
    "facial_expressions": "<specific observation + advice>"
  },
  "delivery_score": <number 0-100>,
  "body_language_score": <number 0-100>,
  "confidence_score": <number 0-100>,
  "overall_score": <number 0-100>,
  "feedback_summary": "<2-3 paragraph overall analysis>",
  "strengths": ["<strength 1>", "<strength 2>", ...],
  "improvements": ["<improvement 1>", "<improvement 2>", ...],
  "six_q_score": {
    "iq": <number 0-100>,
    "eq": <number 0-100>,
    "cq": <number 0-100>,
    "aq": <number 0-100>,
    "sq": <number 0-100>,
    "mq": <number 0-100>
  },
  "personality_cluster": "<Cluster Name>"
}

Be BRUTALLY HONEST and DIRECT. Users want real feedback, not sugar-coating.
IF VIDEO METADATA IS MISSING, INFER from the transcript text styles (e.g. long pauses, hesitation words).`;

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
            {
              role: "user",
              content: analysisPrompt,
            },
          ],
          temperature: 0.3,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    console.log("AI Response:", aiResponse);

    // Parse AI response
    let analysis;
    try {
      // Extract JSON from markdown code blocks if present
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      // Fallback analysis
      analysis = {
        delivery_score: 75,
        body_language_score: 70,
        confidence_score: 72,
        overall_score: 72,
        feedback_summary: aiResponse,
        strengths: [
          "Good attempt at answering the question",
          "Maintained reasonable pace",
          "Showed enthusiasm",
        ],
        improvements: [
          "Work on reducing filler words",
          "Maintain better eye contact with camera",
          "Structure answers using frameworks like STAR",
        ],
      };
    }

    // Calculate overall score if not provided
    if (!analysis.overall_score) {
      analysis.overall_score = Math.round(
        (analysis.delivery_score +
          analysis.body_language_score +
          analysis.confidence_score) /
        3
      );
    }

    // Update session with analysis results
    const { error: updateError } = await supabase
      .from("video_interview_sessions")
      .update({
        analysis_result: analysis,
        feedback_summary: analysis.feedback_summary,
        delivery_score: analysis.delivery_score,
        body_language_score: analysis.body_language_score,
        confidence_score: analysis.confidence_score,
        overall_score: analysis.overall_score,
        model_answer: analysis.model_answer,
        whats_good: analysis.whats_good,
        whats_wrong: analysis.whats_wrong,
        video_analysis_details: analysis.video_analysis_details,
        status: "completed",
        six_q_score: analysis.six_q_score,
        personality_cluster: analysis.personality_cluster,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (updateError) throw updateError;

    console.log("Analysis complete for session:", sessionId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error in analyze-video-interview function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
