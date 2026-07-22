import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
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
          is_finished: false
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    console.log("DEBUG: GROQ_API_KEY present:", !!GROQ_API_KEY);
    console.log("DEBUG: GROQ_API_KEY length:", GROQ_API_KEY ? GROQ_API_KEY.length : 0);

    if (!GROQ_API_KEY) {
      console.error("CRITICAL: GROQ_API_KEY is missing from environment variables");
      throw new Error("GROQ_API_KEY is not configured");
    }

    // Check if interview should end
    if (question_count >= limit) {
      return new Response(
        JSON.stringify({
          question: "Thank you for your time. We have completed the interview questions. Please click the 'Complete Interview' button to finish the session.",
          is_finished: true
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

    const systemPrompt = `You are an expert technical interviewer conducting a ${interview_type} interview.${statsContext}
    
    CRITICAL VERIFICATION RULES:
    1. **IMMEDIATELY CALL OUT LIES**: If the candidate claims a project/skill NOT in their GitHub/Resume context above, you MUST:
       - State clearly in verification_note: "I did not find any project named '[project name]' in your GitHub profile or resume."
       - Challenge them directly: "Can you provide specific implementation details to verify this claim?"
       - Be skeptical of vague answers
    
    2. **VERIFIED vs UNVERIFIED**:
       - ✅ VERIFIED: Projects/skills explicitly listed in the GitHub/Resume context above
       - ❌ UNVERIFIED: Anything the candidate mentions that is NOT in the context
       - For UNVERIFIED claims, ALWAYS add a verification_note calling it out
    
    3. **Cross-reference EVERYTHING**:
       - GitHub projects listed above = VERIFIED
       - Resume content above = VERIFIED
       - LeetCode/Codeforces stats above = VERIFIED
       - Anything else = UNVERIFIED (call it out!)
    
    RESPONSE FORMAT:
    
    **CRITICAL: You MUST respond with valid JSON only. You MUST escape any double-quotes inside string values (use \\" instead of \"). Do not include unescaped quotes or HTML tags inside string fields.**
    
    **For the FIRST message (no history):**
    {
      "question": "Welcome! Let's begin with a classic interview question: Tell me about yourself.",
      "is_finished": false
    }
    
    **For SUBSEQUENT messages (after user answers):**
    You MUST provide detailed feedback on their previous answer, then ask the next question.
    {
      "feedback": {
        "what_went_well": ["Specific point 1", "Specific point 2"],
        "what_needs_improvement": ["Specific issue 1", "Specific issue 2"],
        "model_answer": "Provide a CONCISE, PERFECT ANSWER (2-3 sentences maximum) to the question you asked. Write it as if you are the perfect candidate answering the question in first person. Be direct and actionable, focusing on the key approach/strategy without lengthy explanations. Example: 'To manage a project with tight deadlines, I would prioritize tasks based on impact and urgency, allocate resources efficiently, and maintain clear communication with stakeholders to ensure successful delivery.'",
        "verification_note": "OPTIONAL - Only include if they mentioned a project/skill/experience NOT found in their GitHub/Resume context. Format: 'I did not find any project/skill named [X] in your GitHub profile or resume. Please provide specific implementation details to verify this claim.' If everything is verified, omit this field entirely."
      },
      "question": "Your next question based on their performance",
      "is_finished": false
    }
    
    FEEDBACK GUIDELINES:
    - Be specific and constructive
    - ALWAYS check claims against GitHub/Resume context
    - Call out discrepancies immediately and directly
    - Model answer should be the ACTUAL perfect answer (3-5 sentences minimum), written as if you're the candidate
    - Adjust next question difficulty based on their performance
    
    VERIFICATION EXAMPLES:
    - ✅ User says "I worked on the React dashboard" AND it's in their GitHub → No verification_note needed
    - ❌ User says "I built a blockchain app" but it's NOT in GitHub → verification_note: "I did not find any blockchain project in your GitHub profile or resume. Please provide specific implementation details."
    - ❌ User says "I know Kubernetes" but it's not in resume/GitHub → verification_note: "I did not find Kubernetes mentioned in your resume or GitHub projects. Can you explain where you used it?"
    
    Keep questions concise but feedback detailed. BE STRICT about verification.`;

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
            temperature: 0.7,
            response_format: { type: "json_object" },
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

    // Helper to query Gemini REST API with model fallback
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
                  feedback: {
                    type: "OBJECT",
                    properties: {
                      what_went_well: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      what_needs_improvement: {
                        type: "ARRAY",
                        items: { type: "STRING" }
                      },
                      model_answer: { type: "STRING" },
                      verification_note: { type: "STRING" }
                    },
                    required: ["what_went_well", "what_needs_improvement", "model_answer"]
                  },
                  question: { type: "STRING" },
                  is_finished: { type: "BOOLEAN" }
                },
                required: ["question", "is_finished"]
              }
            }
          }),
        }
      );
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
                temperature: 0.7,
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
      console.error("Request details:", {
        interview_type,
        question_count,
        has_coding_stats: !!coding_stats,
        has_profile_context: !!profile_context,
        message_count: messages?.length || 0
      });
      throw new Error(`AI Providers failed: ${response?.status || '500'} - ${errorText}`);
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

    // Force is_finished to be false unless we have reached the limit
    if (question_count < limit - 1) {
      result.is_finished = false;
    } else {
      result.is_finished = true;
      result.question = "Thank you for your time. We have completed the interview questions. Please click the 'Complete Interview' button to finish the session.";
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in generate-interview-question:", error);
    console.error("Error stack:", error.stack);
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
