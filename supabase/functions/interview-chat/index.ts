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
    const { messages, interviewType, resumeContent } = await req.json();

    let systemPrompt = `You are a world-class Elite Technical Interviewer conducting a live voice/video interview.

CRITICAL VOICE CONVERSATION MANDATES:
1. EXTREMELY SHORT & CONCISE: Ask EXACTLY ONE question per turn. Keep your response to 1-2 SHORT SENTENCES MAXIMUM (under 20 words total).
2. NO FLUFF OR COMPLIMENTS: NEVER say "Congratulations...", "That's awesome...", "Great job...", or repeat candidate answers/achievements. Move directly to the question.
3. SINGLE FOCUSED QUESTION: Ask one specific, clear technical question at a time. Never ask multi-part or compound questions.`;

    if (interviewType === "technical") {
      systemPrompt += "\n\nFocus on technical skills: data structures, algorithms, system design, and programming concepts.";
    } else if (interviewType === "behavioral") {
      systemPrompt += "\n\nFocus on behavioral questions using the STAR method (Situation, Task, Action, Result).";
    } else if ((interviewType === "resume" || interviewType === "round1" || interviewType === "screening") && resumeContent) {
      systemPrompt += `\n\nCRITICAL ROUND 1 / RESUME & GITHUB MANDATE:
The candidate's resume and GitHub profile context:
${resumeContent}

STRICT QUESTIONING INSTRUCTION:
- YOU MUST EXTRACT AND NAME SPECIFIC PROJECT NAMES, REPOSITORY NAMES, AND TECH STACK ITEMS DIRECTLY FROM THE CANDIDATE CONTEXT ABOVE.
- ABSOLUTELY FORBIDDEN PHRASES (NEVER USE):
  ❌ "your resume project"
  ❌ "that project"
  ❌ "your primary project"
  ❌ "a project on your resume"
- ALWAYS REPLACE THOSE WITH THE ACTUAL REAL PROJECT NAME: (e.g. HirePath, CodeCompass, Truthlens, Prodex).
- EXAMPLE CORRECT QUESTION: "In your project HirePath, what was the most challenging technical bottleneck you encountered and how did you resolve it?"`;
    }

    // Extract system prompt if passed in messages
    const systemMsg = (messages || []).find((msg: any) => msg.role === 'system');
    if (systemMsg && systemMsg.content) {
      systemPrompt = systemMsg.content;
    }

    // Sanitize conversation history for Gemini API: remove system, alternate user/model, merge adjacent same-role
    const rawFiltered = (messages || []).filter((msg: any) => msg.role !== 'system');

    const conversationMessages = rawFiltered.map((msg: any) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content || msg.text || ''
    }));

    const geminiContents: any[] = [];

    for (const msg of rawFiltered) {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const text = msg.content || msg.text || '';
      if (!text.trim()) continue;

      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
        geminiContents[geminiContents.length - 1].parts[0].text += `\n${text}`;
      } else {
        geminiContents.push({
          role,
          parts: [{ text }]
        });
      }
    }

    if (geminiContents.length === 0 || geminiContents[0].role !== 'user') {
      geminiContents.unshift({
        role: 'user',
        parts: [{ text: 'Hello! I am ready to start the interview session.' }]
      });
    }

    // SPEED OPTIMIZATION: Keep last 6 recent turns to minimize prompt processing latency
    const recentContents = geminiContents.slice(-6);
    if (recentContents[0].role !== 'user') {
      recentContents.unshift({
        role: 'user',
        parts: [{ text: 'Continuing interview session...' }]
      });
    }

    let content = "";

    // STEP 1: Primary - Gemini 3.1 Flash Lite via Gemini Pipeline for Ultra-Fast Dynamic Question Generation
    console.log("Executing Step 1: Gemini 3.1 Flash Lite for Question Generation...");
    const geminiRes = await callGeminiPipeline({
      modelName: "gemini-3.1-flash-lite",
      geminiContents: recentContents,
      systemPrompt,
      temperature: 0.2,
    });

    if (geminiRes.ok && geminiRes.aiContent) {
      content = geminiRes.aiContent;
      console.log("✓ Success with Gemini 2.0 Flash for Question Generation");
    } else {
      console.warn("Direct Gemini pipeline note. Trying Lovable Gateway fallback...");
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
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
                  ...conversationMessages,
                ],
                stream: false,
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            content = data.choices?.[0]?.message?.content ?? "";
          }
        } catch (lErr) {
          console.warn("Lovable gateway chat note:", lErr);
        }
      }
    }

    if (!content) {
      const turnCount = conversationMessages.filter((m: any) => m.role === "assistant").length;
      const lastUserMsg = conversationMessages.filter((m: any) => m.role === "user").pop()?.content || "";

      if (turnCount === 0) {
        content = "Welcome to the interview! Could you start by giving a brief introduction of yourself and your core technical background?";
      } else if (lastUserMsg.length > 25) {
        content = `Thanks for sharing that overview. Could you elaborate on which specific tools or frameworks in your stack you feel most confident using, and why?`;
      } else {
        content = `Thanks for sharing. Moving forward, what core technical skills or frameworks are you currently focusing on mastering next?`;
      }
    }

    return new Response(
      JSON.stringify({ question: content, content }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in interview-chat function:", error);
    return new Response(
      JSON.stringify({ 
        question: "Could you please tell me more about your recent project experience and technical contributions?", 
        content: "Could you please tell me more about your recent project experience and technical contributions?" 
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
