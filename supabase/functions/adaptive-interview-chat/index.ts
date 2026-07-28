import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { callGeminiPipeline } from "../_shared/gemini-pipeline.ts";

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
    const { messages, userId, skillGaps, userContext } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid 'messages' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!userId) {
      return new Response(
        JSON.stringify({ error: "Missing 'userId' parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("Adaptive interview request for user:", userId, "with", messages.length, "messages");

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY is not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    const { data: pastSessions } = await supabase
      .from("interview_sessions")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(5);

    const { data: videoSessions } = await supabase
      .from("video_interview_sessions")
      .select("*")
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("created_at", { ascending: false })
      .limit(5);

    const safeSkillGaps = skillGaps || { note: "No specific skill gaps identified yet. Conduct a general assessment." };
    const systemPrompt = `You are an expert technical interviewer conducting an adaptive interview simulation. Your goal is to help the candidate improve their skills based on their identified gaps and verify their profile claims.

=== CRITICAL ROUND 1 / RESUME VERIFICATION MANDATE ===
- IF CONDUCTING ROUND 1 OR RESUME SCREENING: THIS ENTIRE ROUND IS STRICTLY FOR RESUME CHECKING AND VERIFICATION.
- Ask questions directly checking and verifying candidate's RESUME (experiences, projects, skills, tools, and achievements listed on their resume).
- Ask EXACTLY ONE (1) question across the whole interview about candidate's GitHub projects (referencing GitHub repos in context).
- ALL OTHER questions MUST be specifically drawn from checking and verifying candidate's RESUME content.

CANDIDATE PROFILE & CONTEXT:
${userContext || "No specific profile context provided."}

CANDIDATE'S SKILL GAPS:
${JSON.stringify(safeSkillGaps, null, 2)}

INTERVIEW HISTORY CONTEXT:
- Completed ${pastSessions?.length || 0} text interview sessions
- Completed ${videoSessions?.length || 0} video interview sessions

RESPONSE STRUCTURE (Strict Markdown):
### ✅ What You Did Well
[2-3 specific positive points]

### ⚠️ Areas to Improve
[2-3 specific improvements]

### 📝 Model Answer
[Write a CONCISE, PERFECT EXAMPLE ANSWER in the FIRST PERSON ("I"). Keep it to 2-3 sentences.]

### 🎯 Skill Gap Analysis
[Brief note on progress]

### ❓ Next Question
[Your next adaptive question]`;

    const geminiContents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    // STEP 1: Try Direct Gemini REST API (gemini-3.1-flash-lite) with Primary -> Secondary Failover
    const geminiRes = await callGeminiPipeline({
      modelName: "gemini-3.1-flash-lite",
      geminiContents,
      systemPrompt,
      temperature: 0.7,
    });

    let content = "";
    if (geminiRes.ok && geminiRes.aiContent) {
      content = geminiRes.aiContent;
    } else {
      console.warn("Direct Gemini pipeline failed. Falling back to Lovable gateway...");
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        const response = await fetch(
          "https://ai.gateway.lovable.dev/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "google/gemini-2.5-flash",
              messages: [
                { role: "system", content: systemPrompt },
                ...messages,
              ],
              stream: false,
            }),
          }
        );
        if (response.ok) {
          const data = await response.json();
          content = data.choices?.[0]?.message?.content ?? "";
        }
      }
    }

    if (!content) {
      throw new Error("All AI adaptive chat providers failed");
    }

    return new Response(
      JSON.stringify({ content }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in adaptive-interview-chat function:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Unknown error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
