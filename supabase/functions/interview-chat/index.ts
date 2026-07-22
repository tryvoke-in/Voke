import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("API_KEY is not configured");
    }

    // Build system prompt based on interview type
    let systemPrompt = `You are an expert technical interviewer preparing B.Tech CSE students for internships and job placements. You have years of experience conducting technical interviews at top tech companies.

CRITICAL: You MUST respond using EXACTLY this structure:

### ✅ What's Good
[2-3 bullet points about what the student did well]

### ⚠️ Areas for Improvement
[2-3 bullet points about what could be improved]

### 📝 Model Answer
[A complete, detailed, professional answer that a candidate would give in an interview. This must be comprehensive with multiple paragraphs, examples, and detailed explanations. This section should be SIGNIFICANTLY longer than the evaluation sections - at least 3-5 paragraphs.]

### ❓ Follow-up Question
[Ask the next interview question]

IMPORTANT RULES:
1. ALWAYS start with '### ✅ What's Good' (exactly this text)
2. ALWAYS include '### ⚠️ Areas for Improvement' (exactly this text)
3. ALWAYS include '### 📝 Model Answer' (exactly this text)
4. ALWAYS end with '### ❓ Follow-up Question' (exactly this text)
5. Use these exact headers with the emojis and markdown formatting
6. The Model Answer must be a complete answer, not a summary
7. For the first question, skip evaluation sections and go straight to the question

Tailor questions for B.Tech CSE level. Be encouraging and educational while maintaining high standards.

ADDITIONAL CONTEXT:
- Provide real-world examples and scenarios
- Explain the 'why' behind best practices
- Relate concepts to industry applications
- Share common pitfalls and how to avoid them
- Be adaptive - if the candidate struggles, provide hints or break down the question`;

    if (interviewType === "technical") {
      systemPrompt += "\n\nFocus on technical skills: data structures, algorithms, system design, and programming concepts. Cover both theoretical understanding and practical implementation. Include questions about time/space complexity, trade-offs, and real-world applications.";
    } else if (interviewType === "behavioral") {
      systemPrompt += "\n\nFocus on behavioral questions using the STAR method (Situation, Task, Action, Result). Assess leadership, teamwork, problem-solving, and conflict resolution. Look for specific examples and measure the impact of their actions.";
    } else if (interviewType === "resume" && resumeContent) {
      systemPrompt += `\n\nThe candidate's resume content:\n${resumeContent}\n\nAsk detailed questions about their experience, projects, and skills mentioned in the resume. Dive deep into technical decisions, challenges faced, and lessons learned. Verify their understanding of technologies they've listed.`;
    }

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
          stream: true,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({
            error: "Rate limit exceeded. Please try again in a moment.",
          }),
          {
            status: 429,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({
            error: "AI credits depleted. Please contact support.",
          }),
          {
            status: 402,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      throw new Error(`AI gateway error: ${response.status}`);
    }

    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        "Content-Type": "text/event-stream",
      },
    });
  } catch (error) {
    console.error("Error in interview-chat function:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
