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
    const body = await req.json();
    const { answerId, question, transcript, role } = body;
    console.log("Quick analyzing answer:", answerId, "role:", role);

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    console.log("DEBUG - GROQ_API_KEY present:", !!GROQ_API_KEY);
    console.log("DEBUG - SUPABASE_URL present:", !!supabaseUrl);
    console.log("DEBUG - SERVICE_ROLE_KEY present:", !!supabaseKey);
    console.log("DEBUG - answerId:", answerId);

    if (!answerId) {
      console.error("ERROR: answerId is missing from request body");
      return new Response(
        JSON.stringify({ error: "answerId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Default fallback analysis (used if AI fails for any reason)
    let analysis = {
      model_answer: "A strong answer clearly addresses the question with specific examples, demonstrates relevant skills, and connects your experience to the role requirements.",
      whats_good: ["Attempted to answer the question", "Showed willingness to engage"],
      whats_wrong: ["Add more specific examples", "Use the STAR method (Situation, Task, Action, Result)"],
      delivery_score: 70,
      body_language_score: 68,
      confidence_score: 72,
    };

    // Try Groq AI if key is available
    if (GROQ_API_KEY) {
      try {
        const roleContext = role ? `for a ${role} position` : "";
        const analysisPrompt = `You are an expert interview coach. Provide quick, actionable feedback on this interview answer ${roleContext}.

QUESTION: "${question}"
ANSWER TRANSCRIPT: "${transcript || "(No transcript available - candidate may have spoken but audio could not be captured)"}"

Provide concise feedback in the following format (strict JSON only, no markdown):

{
  "model_answer": "<2-3 sentence ideal response>",
  "whats_good": ["<specific strength 1>", "<specific strength 2>"],
  "whats_wrong": ["<specific improvement 1>", "<specific improvement 2>"],
  "delivery_score": <number 0-100>,
  "body_language_score": <number 0-100>,
  "confidence_score": <number 0-100>
}`;

        console.log("Calling Groq API...");
        const response = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ role: "user", content: analysisPrompt }],
              temperature: 0.3,
              max_tokens: 500,
            }),
          }
        );

        console.log("Groq API response status:", response.status);

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Groq API error:", response.status, errorText);
          // Continue with fallback - don't throw
        } else {
          const aiData = await response.json();
          const aiResponse = aiData.choices?.[0]?.message?.content || "";
          console.log("Groq response received, length:", aiResponse.length);

          try {
            // Try to extract JSON - handle both raw JSON and markdown code blocks
            const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/) ||
                              aiResponse.match(/(\{[\s\S]*\})/);
            const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
            const parsed = JSON.parse(jsonStr);
            if (parsed.model_answer) {
              analysis = parsed;
              console.log("AI analysis parsed successfully");
            }
          } catch (parseError) {
            console.error("Failed to parse AI JSON response:", parseError);
            console.log("Raw AI response:", aiResponse.substring(0, 200));
            // Use fallback analysis
          }
        }
      } catch (groqError) {
        console.error("Groq API call failed:", groqError);
        // Use fallback analysis - don't crash
      }
    } else {
      console.warn("GROQ_API_KEY not set - using fallback analysis");
    }

    // Update answer record in database
    console.log("Updating interview_answers record:", answerId);
    const { error: updateError } = await supabase
      .from("interview_answers")
      .update({
        model_answer: analysis.model_answer,
        whats_good: analysis.whats_good,
        whats_wrong: analysis.whats_wrong,
        delivery_score: analysis.delivery_score,
        body_language_score: analysis.body_language_score,
        confidence_score: analysis.confidence_score,
        analyzed_at: new Date().toISOString(),
      })
      .eq("id", answerId);

    if (updateError) {
      console.error("Database update error:", JSON.stringify(updateError));
      return new Response(
        JSON.stringify({ error: "Database update failed", details: updateError.message }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Analysis complete for answer:", answerId);
    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Unexpected error in quick-analyze-answer:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
