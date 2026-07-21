
import "jsr:@supabase/functions-js/edge-runtime.d.ts";

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

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured");
    }

    const systemPrompt = `You are an expert technical interviewer and behavioral analyst. Your task is to evaluate a candidate's performance in a ${interview_type} interview based on the provided transcript.
    
    CRITICAL OBJECTIVE: You must provide a **nuanced, accurate, and EVIDENCE-BASED** assessment.
    
    **MANDATORY INSTRUCTION: USE QUOTES.**
    When providing feedback, strengths, or weaknesses, you MUST quote the candidate's exact words (or close paraphrase) to support your claim.
    - *Bad Feedback:* "You have good communication skills."
    - *Good Feedback:* "You demonstrated excellent communication when you said 'I would break this down into three parts', showing clear structural thinking."

    - **AVOID GENERIC SCORES:** Do not just give everyone 70-80. Use the full range (0-100) based on merit.
    - **DETECT NUANCE:** A short answer can still demonstrate high IQ if it's precise. A long rambling answer might indicate low CQ (lack of focus).
    - **CONTEXT MATTERS:** This is a ${interview_type} interview. Informal spoken grammar is acceptable, but technical accuracy and clarity are paramount.

    **STEP 1: SANITY CHECK (Pass/Fail)**
    - FAIL if the user is trolling, spamming keys ("asdf"), or refusing to participate.
    - FAIL if the user provides consistently irrelevant answers (e.g., answering "I like pizza" to a coding question).
    - **IF FAIL:** Return score: 0, and feedback: "Interview attempt invalid due to irrelevant or non-serious responses."

    **STEP 2: 6Q PERSONALITY FRAMEWORK (Scoring 0-100)**
    Analyze the candidate's specific word choices, tone indicators (if transcribed), and problem-solving approach.
    
    **1. IQ (Intelligence Quotient)** - Logic, Depth, Precision.
       - *High (80-100):* Answers are structured, logically sound, and directly address the core problem. Uses technical terminology correctly.
       - *Avg (50-79):* Generally correct but may lack depth or miss edge cases.
       - *Low (0-49):* Fundamentally incorrect, illogical, or unable to grasp the question.

    **2. EQ (Emotional Quotient)** - Self-Awareness, Tone, Empathy.
       - *High:* Uses phrases like "I believe," "In my experience," or "That's a good question." Admits gaps in knowledge gracefully ("I'm not sure about X, but...").
       - *Low:* Defensive, arrogant, or dismissive. abruptly changes topics.

    **3. CQ (Creativity Quotient)** - Innovation, "What If" Thinking.
       - *High:* Proposes alternative solutions. Asks insightful clarifying questions. connects unrelated concepts.
       - *Low:* Only gives the textbook answer. Stuck in one mode of thinking.

    **4. AQ (Adversity Quotient)** - Resilience, Handling Complexity.
       - *High:* Stays calm when faced with a hard question (e.g., "Let me think about that..."). breaks down complex problems systematically.
       - *Low:* Gives up immediately ("I don't know"). Becomes visibly frustrated or repetitive.

    **5. SQ (Social Quotient)** - Communication, Engagement.
       - *High:* Conversational, engaging tone. Uses clear signposting ("First I'll do X, then Y").
       - *Low:* Monosyllabic answers ("Yes", "No"). excessively formal or robotic.

    **6. MQ (Moral/Ethical Quotient)** - Integrity, Transparency.
       - *High:* Highlights trade-offs honestly. Doesn't bluff when they don't know. 
       - *Low:* Attempts to fake knowledge.

    **STEP 3: CLUSTER ASSIGNMENT**
    Based on the top 3 highest scores, assign a persona from the following list that BEST describes them:
    - Balanced Thinker (IQ+EQ+SQ)
    - Innovative Problem Solver (IQ+CQ+AQ)
    - Creative Strategist (IQ+CQ+SQ)
    - Resilient Scholar (IQ+EQ+AQ)
    - Responsible Analyst (IQ+SQ+MQ)
    - Compassionate Leader (EQ+SQ+MQ)
    - Creative People Person (EQ+CQ+SQ)
    - Ethical Resilient Leader (EQ+AQ+MQ)
    - Adaptive Innovator (CQ+AQ+SQ)
    - Socially Conscious Creator (CQ+SQ+MQ)
    - Ethical Executor (IQ+MQ+AQ)
    - Empathic Creator (EQ+CQ+MQ)
    - Insightful Innovator (IQ+EQ+CQ)
    - Thoughtful Decision Maker (IQ+EQ+MQ)
    - Creative Resilient Communicator (CQ+EQ+AQ)
    - Purpose-Led Problem Solver (MQ+CQ+AQ)
    - High-Output Collaborator (IQ+SQ+AQ)
    - The Stabiliser (EQ+SQ+AQ)

    **OUTPUT SCHEMA (JSON Only):**
    {
      "score": number (0-100),
      "feedback": "Detailed summary (3-4 sentences) explicitly quoting the user's best/worst moments.",
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

    // Format messages for Groq
    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    let response;
    let success = false;

    // Helper to query Groq
    async function tryGroq(apiKey: string) {
      return await fetch(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: formattedMessages,
            temperature: 0.3,
            response_format: { type: "json_object" },
          }),
        }
      );
    }

    // Helper to query Gemini REST API with model fallback and dynamic schema
    async function tryGemini(apiKey: string, modelName: string, geminiContents: any, systemPrompt: string) {
      return await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: geminiContents,
            systemInstruction: {
              parts: [{ text: systemPrompt }]
            },
            generationConfig: {
              responseMimeType: "application/json",
              responseSchema: {
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
              }
            }
          }),
        }
      );
    }

    // Step 1: Try Primary Groq Key
    try {
      console.log("Trying primary Groq API key...");
      response = await tryGroq(GROQ_API_KEY);
      if (response && response.ok) {
        success = true;
      } else {
        console.warn(`Primary Groq API failed with status ${response?.status}`);
      }
    } catch (err) {
      console.error("Primary Groq API fetch threw error:", err);
    }

    // Step 2: Try Secondary Groq Key (GROQ_API_KEY1) if primary failed
    if (!success) {
      const GROQ_API_KEY1 = Deno.env.get("GROQ_API_KEY1");
      if (GROQ_API_KEY1) {
        try {
          console.log("Trying secondary Groq API key (GROQ_API_KEY1)...");
          response = await tryGroq(GROQ_API_KEY1);
          if (response && response.ok) {
            success = true;
          } else {
            console.warn(`Secondary Groq API failed with status ${response?.status}`);
          }
        } catch (err) {
          console.error("Secondary Groq API fetch threw error:", err);
        }
      }
    }

    // Step 3: Try Direct Google Gemini via GOOGLE_API_KEY with native JSON schema enforcement
    if (!success) {
      const GOOGLE_API_KEY = Deno.env.get("GOOGLE_API_KEY");
      if (GOOGLE_API_KEY) {
        try {
          const geminiContents = messages.map((msg: any) => {
            const role = msg.role === "assistant" ? "model" : "user";
            return {
              role: role,
              parts: [{ text: msg.content }]
            };
          });

          console.log("Trying direct Google Gemini 3.5 Flash REST API...");
          response = await tryGemini(GOOGLE_API_KEY, "gemini-3.5-flash", geminiContents, systemPrompt);

          // Fall back to Gemini 3.1 Flash Lite if 3.5 is rate-limited (daily limit is only 20 requests)
          if (response && (response.status === 429 || !response.ok)) {
            console.warn("Gemini 3.5 Flash limit reached. Falling back to Gemini 3.1 Flash Lite (1,500 requests/day)...");
            response = await tryGemini(GOOGLE_API_KEY, "gemini-3.1-flash-lite", geminiContents, systemPrompt);
          }

          if (response && response.ok) {
            success = true;
          } else {
            console.warn(`Direct Google Gemini API failed with status ${response?.status}`);
          }
        } catch (err) {
          console.error("Direct Google Gemini API fetch threw error:", err);
        }
      }
    }

    // Step 4: Try Gemini via Lovable AI Gateway
    if (!success) {
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          console.log("Trying Lovable AI Gateway Gemini...");
          response = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: formattedMessages,
                temperature: 0.3,
                response_format: { type: "json_object" },
              }),
            }
          );
          if (response && response.ok) {
            success = true;
          } else {
            console.warn(`Lovable AI Gateway Gemini failed with status ${response?.status}`);
          }
        } catch (err) {
          console.error("Lovable AI Gateway Gemini fetch threw error:", err);
        }
      }
    }

    if (!success || !response || !response.ok) {
      const errorText = response ? await response.text() : "All LLM providers failed";
      console.error("All AI providers failed. Last status:", response?.status, errorText);
      throw new Error(`AI Evaluation failed: ${response?.status || '500'} - ${errorText}`);
    }

    const data = await response.json();
    let aiContent = "";
    
    if (data.choices && data.choices[0]) {
      aiContent = data.choices[0].message?.content;
    } else if (data.candidates && data.candidates[0]) {
      aiContent = data.candidates[0].content?.parts?.[0]?.text;
    }

    if (!aiContent) {
      console.error("No content received from AI. Full response data:", JSON.stringify(data));
      throw new Error("No content received from AI provider");
    }

    // Clean up potential markdown formatting
    aiContent = aiContent.replace(/```json/g, "").replace(/```/g, "").trim();

    let result;
    try {
      result = JSON.parse(aiContent);
    } catch (parseErr) {
      console.warn("Direct JSON parsing failed, attempting brace extraction...", parseErr);
      try {
        const firstBrace = aiContent.indexOf("{");
        const lastBrace = aiContent.lastIndexOf("}");
        if (firstBrace === -1 || lastBrace === -1) {
          throw new Error("No JSON object structure found in response content");
        }
        const jsonSub = aiContent.substring(firstBrace, lastBrace + 1);
        result = JSON.parse(jsonSub);
      } catch (extractErr) {
        console.error("JSON parsing/extraction completely failed. Raw AI content was:", aiContent);
        throw new Error(`Failed to parse AI response: ${extractErr.message}`);
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in evaluate-interview function:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
