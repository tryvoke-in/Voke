import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, userContext } = await req.json();

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      console.error("Missing GROQ_API_KEY");
      throw new Error("Server configuration error: Missing API Key");
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

    const systemPrompt = `You are Voke Assistant, the official AI assistant built exclusively for the Voke platform (an AI-powered tech career & interview preparation platform).

### CRITICAL RULES & GUARDRAILS:
1. **STRICT VOKE GROUNDING**: You must ONLY answer questions using knowledge about Voke, its features, practice modules, sheets, pricing, and how to prepare for tech interviews on Voke.
2. **NO EXTERNAL / GENERAL KNOWLEDGE ANSWERS**: If a user asks a question unrelated to Voke or tech interview prep on Voke (e.g. general news, weather, cooking recipes, sports, history, movies, or non-Voke trivia), you MUST strictly decline to answer with this exact response:
   "I am Voke Assistant, specialized strictly in the Voke platform. I can only answer questions related to Voke, our features, and how to use Voke to prepare for tech interviews!"
3. **EXTREMELY CONCISE & SHORT RESPONSES**:
   - Keep EVERY response short, crisp, and directly to the point.
   - Maximum 2 to 4 brief bullet points OR maximum 2 short paragraphs (under 100 words total).
   - NEVER output long essays, giant walls of text, or verbose introductions.

### COMPLETE VOKE PLATFORM KNOWLEDGE BASE:
- **Overview**: Voke is an all-in-one AI platform helping software engineers, developers, and students crack tech interviews at top product companies (FAANG, MNCs, startups).
- **Profile & Account Settings** (/profile): Update personal profile details, full name, target tech role, experience level, avatar, email, and account settings.
- **AI Voice & Video Mock Interviews** (/voice-assistant, /interview/new): Real-time interactive voice dialogue with an AI interviewer, live code editor, speech analysis, and instant scorecards (Delivery, Body Language, Technical depth, Confidence, Overall score).
- **Striver's A2Z & Blind 75 DSA Sheets** (/dsa-sheet): Curated problem sets (Arrays, Strings, Linked Lists, Trees, Graphs, Dynamic Programming, Sliding Window), built-in multi-language code runner, and AI hint assistant.
- **AI Resume Builder & ATS Optimizer** (/resume-builder): ATS keyword match score against job descriptions, STAR method bullet point improver with quantitative metrics, clean tech templates, and PDF export.
- **Company-Specific Question Kits** (/companies): Actual recent interview questions and architectural breakdowns for Google, Amazon, Meta, Microsoft, Apple, TCS, Infosys, etc.
- **Peer-to-Peer Mock Interviews** (/peer-interviews): Practice live mock interviews with peers in video rooms with a shared IDE and structured rubric scorecards.
- **Code Playground & Compiler** (/playground): Multi-language browser code compiler (C++, Java, Python, JS, TS, Go, Rust), AI code debugger, test case execution.
- **System Design Architect** (/playground, /elite-prep): High-level system design blueprints (Microservices, Load Balancers, Redis Caching, DB Sharding, Rate Limiters).
- **Progress Analytics** (/progress-analytics): Detailed performance breakdown, speech fluency, coding speed, and overall interview readiness score.
- **Daily Challenges & Streaks** (/daily-challenge, /leaderboard): Daily problem solving, streak counters, badges, and global community leaderboard.
- **Elite Prep & Career Roadmap** (/elite-prep): 1-on-1 AI mentorship, custom career roadmaps tailored to target roles and experience.
- **Job Recommendations** (/job-recommendations): AI-matched tech job openings based on interview performance.
- **Pricing & Plans** (/pricing): Free Starter Tier for basic practice; Elite Pro Tier for unlimited voice mocks, premium company kits, and deep analytics.

${userContext ? `\n**USER CONTEXT:**\n${userContext}\n` : ""}

**TONE:** Concise, professional, direct, and helpful.`;

    const formattedMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    console.log("Calling Groq API for interview coach chat...");
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
          messages: formattedMessages,
          temperature: 0.4,
          max_tokens: 300,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Groq API error:", response.status, errorText);
      throw new Error(`Groq API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const aiResponse = data.choices[0]?.message?.content;

    if (!aiResponse) {
      throw new Error("No response from AI");
    }

    // Try to save chat session - but don't fail if table doesn't exist
    try {
      const { data: existingSession } = await supabase
        .from("chat_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("updated_at", { ascending: false })
        .limit(1)
        .single();

      const updatedMessages = [
        ...(existingSession?.messages || []),
        ...messages.slice(-1),
        { role: "assistant", content: aiResponse }
      ];

      if (existingSession) {
        await supabase
          .from("chat_sessions")
          .update({ messages: updatedMessages, updated_at: new Date().toISOString() })
          .eq("id", existingSession.id);
      } else {
        await supabase
          .from("chat_sessions")
          .insert({ user_id: user.id, messages: updatedMessages });
      }
    } catch (dbError) {
      // Don't fail the request if DB save fails
      console.warn("Could not save chat session (table may not exist):", dbError);
    }

    return new Response(JSON.stringify({ response: aiResponse }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error in interview-coach-chat:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
