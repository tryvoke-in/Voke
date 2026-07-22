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
    // Environment variable validation
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseKey) {
      throw new Error("Supabase credentials not configured");
    }

    const supabase = createClient(supabaseUrl, supabaseKey);

    // Fetch recent posts (last 50)
    const { data: posts, error: postsError } = await supabase
      .from("posts")
      .select("content, tags, created_at")
      .order("created_at", { ascending: false })
      .limit(50);

    if (postsError) {
      throw postsError;
    }

    const postsText = posts.map(p => `- ${p.content} (Tags: ${p.tags?.join(', ')})`).join("\n");

    const systemPrompt = `You are a Community Manager AI for a tech interview preparation platform. 
    Analyze the following recent community posts and extract:
    1. Top 5 trending topics/hashtags based on frequency and relevance.
    2. 3 suggested community events that would be valuable to these users based on their discussions.

    Return the response in strictly valid JSON format with this structure:
    {
      "trending_topics": [
        { "tag": "TopicName", "posts": "Estimated count or relevance score" }
      ],
      "suggested_events": [
        { "title": "Event Title", "description": "Short description", "type": "Workshop/Mock Interview/etc" }
      ]
    }
    
    Do not include markdown formatting like \`\`\`json. Just return the raw JSON string.`;

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
            { role: "user", content: `Here are the recent posts:\n${postsText}` },
          ],
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content ?? "{}";
    
    // Clean up markdown if present
    content = content.replace(/```json/g, "").replace(/```/g, "").trim();

    return new Response(
      content,
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in analyze-community-trends function:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
