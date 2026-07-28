import { callGeminiPipeline } from "../_shared/gemini-pipeline.ts";

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
    const { messages, interview_type } = await req.json();

    // Check if there are any user messages
    const userMessages = (messages || []).filter((m: any) => m.role === "user");
    const totalUserTextLength = userMessages.reduce((sum: number, m: any) => sum + (m.content || "").trim().length, 0);

    if (userMessages.length === 0 || totalUserTextLength === 0) {
      console.log("No user responses detected. Returning invalid attempt response.");
      return new Response(
        JSON.stringify({
          score: 0,
          feedback: "Interview attempt invalid as the candidate did not speak or participate in the conversation.",
          strengths: ["None (No candidate responses recorded)"],
          weaknesses: ["No response provided during the session"],
          metrics: {
            technical_accuracy: 0,
            communication: 0,
            problem_solving: 0
          },
          six_q_score: {
            iq: 0, eq: 0, cq: 0, aq: 0, sq: 0, mq: 0
          },
          personality_cluster: "None"
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const systemPrompt = `You are an expert technical interviewer and behavioral analyst. Your task is to evaluate a candidate's performance in a ${interview_type} interview based on the provided transcript, questions, body language details, and scores.
    
    CRITICAL OBJECTIVE: You must provide a **nuanced, accurate, and EVIDENCE-BASED** final interview report.
    
    **MANDATORY INSTRUCTION: USE QUOTES.**
    When providing feedback, strengths, or weaknesses, quote the candidate's exact words (or close paraphrase) to support your claim.
    
    - **AVOID GENERIC SCORES:** Do not just give everyone 70-80. Use the full range (0-100) based on merit.
    - **DETECT NUANCE:** A short answer can still demonstrate high IQ if precise.
    - **CONTEXT MATTERS:** This is a ${interview_type} interview.
    
    **STEP 1: SANITY CHECK (Pass/Fail)**
    - FAIL if user is trolling/spamming or refusing to participate.
    - IF FAIL: Return score: 0, feedback: "Interview attempt invalid due to irrelevant or non-serious responses."

    **STEP 2: 6Q PERSONALITY FRAMEWORK (Scoring 0-100)**
    IQ, EQ, CQ, AQ, SQ, MQ.

    **STEP 3: CLUSTER ASSIGNMENT**
    Assign top personality cluster.

    **OUTPUT SCHEMA (JSON Only):**
    {
      "score": number (0-100),
      "feedback": "Detailed summary (3-4 sentences) explicitly quoting user's best/worst moments.",
      "strengths": ["Strength 1 (with quote)", "Strength 2 (with quote)", "Strength 3 (with quote)"],
      "weaknesses": ["Weakness 1 (with quote)", "Weakness 2 (with quote)", "Weakness 3 (with quote)"],
      "metrics": {
        "technical_accuracy": number (0-100),
        "communication": number (0-100),
        "problem_solving": number (0-100)
      },
      "six_q_score": {
        "iq": number, "eq": number, "cq": number, "aq": number, "sq": number, "mq": number
      },
      "personality_cluster": "Cluster Name from list"
    }`;

    const geminiContents = messages.map((msg: any) => ({
      role: msg.role === "assistant" ? "model" : "user",
      parts: [{ text: msg.content }]
    }));

    const responseSchema = {
      type: "OBJECT",
      properties: {
        score: { type: "INTEGER" },
        feedback: { type: "STRING" },
        strengths: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        weaknesses: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        metrics: {
          type: "OBJECT",
          properties: {
            technical_accuracy: { type: "INTEGER" },
            communication: { type: "INTEGER" },
            problem_solving: { type: "INTEGER" }
          },
          required: ["technical_accuracy", "communication", "problem_solving"]
        },
        six_q_score: {
          type: "OBJECT",
          properties: {
            iq: { type: "INTEGER" },
            eq: { type: "INTEGER" },
            cq: { type: "INTEGER" },
            aq: { type: "INTEGER" },
            sq: { type: "INTEGER" },
            mq: { type: "INTEGER" }
          },
          required: ["iq", "eq", "cq", "aq", "sq", "mq"]
        },
        personality_cluster: { type: "STRING" }
      },
      required: ["score", "feedback", "strengths", "weaknesses", "metrics", "six_q_score", "personality_cluster"]
    };

    let aiContent = "";
    let success = false;

    // STEP 3: Gemini 3.1 Flash Lite via Gemini Pipeline
    console.log("Executing Step 3: Gemini 3.1 Flash Lite Final Report Evaluation...");
    const geminiRes = await callGeminiPipeline({
      modelName: "gemini-3.1-flash-lite",
      geminiContents,
      systemPrompt,
      responseSchema,
      temperature: 0.3,
    });

    if (geminiRes.ok && geminiRes.aiContent) {
      aiContent = geminiRes.aiContent;
      success = true;
    } else {
      console.warn("Gemini 3.1 Flash Lite failed on all keys. Falling back to Groq...");
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
              temperature: 0.3,
              response_format: { type: "json_object" },
            }),
          });
          if (groqRes.ok) {
            const groqData = await groqRes.json();
            aiContent = groqData.choices?.[0]?.message?.content || "";
            if (aiContent) success = true;
          }
        } catch (groqErr) {
          console.error("Groq fallback failed:", groqErr);
        }
      }
    }

    if (!success || !aiContent) {
      throw new Error("All AI evaluation providers failed");
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

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("Error in evaluate-interview:", error);
    return new Response(
      JSON.stringify({ error: `AI Evaluation failed: ${error.message || '500'}` }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
