import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
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
    const { messages, interview_type, question_count, total_questions, coding_stats, profile_context } = await req.json();
    const limit = total_questions ? Number(total_questions) : 5;

    // ALWAYS return the introduction question as the first question
    if (!messages || messages.length === 0) {
      return new Response(
        JSON.stringify({
          question: "Welcome! Let's begin with a classic interview question: Tell me about yourself.",
          is_finished: false,
          provider_info: {
            provider: "Default System Welcome",
            model: "gemini-3.1-flash-lite",
            keyLabel: "System Opening",
            isFallbackKey: false
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if interview should end
    if (question_count >= limit) {
      return new Response(
        JSON.stringify({
          question: "Thank you for your time. We have completed the interview questions. Please click the 'Complete Interview' button to finish the session.",
          is_finished: true,
          provider_info: {
            provider: "Default System Complete",
            model: "gemini-3.1-flash-lite",
            keyLabel: "System Closing",
            isFallbackKey: false
          }
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    let statsContext = "";
    if (coding_stats) {
      const cfRating = coding_stats.codeforces?.rating;
      const lcSolved = coding_stats.leetcode?.submitStats?.find((s: any) => s.difficulty === "All")?.count;

      if (cfRating || lcSolved) {
        statsContext += `\n    CODING PROFILE:\n`;
        if (cfRating) statsContext += `    - Codeforces Rating: ${cfRating} (Adjust difficulty accordingly)\n`;
        if (lcSolved) statsContext += `    - LeetCode Problems Solved: ${lcSolved}\n`;
      }
    }

    if (profile_context) {
      statsContext += `\n    RESUME & GITHUB CONTEXT:\n${profile_context}\n`;
    }

    const isResumeOrRound1 = !interview_type || /resume|round 1|screening/i.test(interview_type);

    const systemPrompt = `You are an expert technical interviewer conducting a ${interview_type} interview.${statsContext}
    
    ${isResumeOrRound1 ? `
    === CRITICAL ROUND 1 / RESUME SCREENING MANDATE ===
    - THIS ENTIRE INTERVIEW ROUND IS STRICTLY AND ONLY FOR RESUME CHECKING AND VERIFICATION.
    - Ask questions directly checking and verifying candidate's RESUME (experiences, projects, skills, education, tools, and achievements listed on their resume).
    - Ask EXACTLY ONE (1) question across the whole interview about candidate's GitHub projects (referencing GitHub repos in context).
    - All other questions MUST be specifically drawn from checking and verifying candidate's RESUME content.
    ` : ''}

    CRITICAL VERIFICATION RULES:
    1. **IMMEDIATELY CALL OUT LIES**: If candidate claims unverified projects/skills or fails to explain details on their resume.
    
    RESPONSE FORMAT (Valid JSON only):
    {
      "feedback": {
        "what_went_well": ["Point 1"],
        "what_needs_improvement": ["Point 1"],
        "model_answer": "Concise perfect answer (2-3 sentences max).",
        "verification_note": "Optional verification note"
      },
      "question": "Your next question",
      "is_finished": false
    }`;

    const geminiContents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const responseSchema = {
      type: "OBJECT",
      properties: {
        feedback: {
          type: "OBJECT",
          properties: {
            what_went_well: { type: "ARRAY", items: { type: "STRING" } },
            what_needs_improvement: { type: "ARRAY", items: { type: "STRING" } },
            model_answer: { type: "STRING" },
            verification_note: { type: "STRING" }
          },
          required: ["what_went_well", "what_needs_improvement", "model_answer"]
        },
        question: { type: "STRING" },
        is_finished: { type: "BOOLEAN" }
      },
      required: ["question", "is_finished"]
    };

    let aiContent = "";
    let providerInfo: any = null;
    let success = false;

    // STEP 1: Gemini 3.1 Flash Lite via Gemini Pipeline
    console.log("Executing Step 1: Gemini 3.1 Flash Lite via Gemini Pipeline...");
    const geminiRes = await callGeminiPipeline({
      modelName: "gemini-3.1-flash-lite",
      geminiContents,
      systemPrompt,
      responseSchema,
      temperature: 0.7,
    });

    if (geminiRes.ok && geminiRes.aiContent) {
      aiContent = geminiRes.aiContent;
      providerInfo = geminiRes.providerInfo;
      success = true;
    } else {
      console.warn("Gemini 3.1 Flash Lite failed on all API keys. Attempting Groq fallback...");
      const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
      if (GROQ_API_KEY) {
        try {
          const formattedMessages = [
            { role: "system", content: systemPrompt },
            ...messages
          ];
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: formattedMessages,
              temperature: 0.7,
              response_format: { type: "json_object" },
            }),
          });
          if (groqRes.ok) {
            const groqData = await groqRes.json();
            aiContent = groqData.choices?.[0]?.message?.content || "";
            if (aiContent) {
              success = true;
              providerInfo = {
                provider: "Groq AI (Fallback)",
                model: "llama-3.3-70b-versatile",
                keyLabel: "Groq Fallback Key",
                isFallbackKey: true
              };
            }
          }
        } catch (groqErr) {
          console.error("Groq fallback failed:", groqErr);
        }
      }
    }

    if (!success || !aiContent) {
      throw new Error("All AI question generation providers failed");
    }

    aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();

    let result;
    try {
      result = JSON.parse(aiContent);
    } catch (parseErr) {
      console.warn("Direct JSON parsing failed, attempting brace extraction...", parseErr);
      const firstBrace = aiContent.indexOf("{");
      const lastBrace = aiContent.lastIndexOf("}");
      if (firstBrace === -1 || lastBrace === -1) {
        throw new Error("No JSON object structure found in response content");
      }
      const jsonSub = aiContent.substring(firstBrace, lastBrace + 1);
      result = JSON.parse(jsonSub);
    }

    if (question_count < limit - 1) {
      result.is_finished = false;
    } else {
      result.is_finished = true;
      result.question = "Thank you for your time. We have completed the interview questions. Please click the 'Complete Interview' button to finish the session.";
    }

    // Attach active provider_info to response
    result.provider_info = providerInfo;

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in generate-interview-question:", error);
    return new Response(
      JSON.stringify({
        error: error.message || "Unknown error occurred",
        stack: error.stack,
        is_error: true
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
