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
    const { category } = await req.json();
    console.log("Researching job trends for category:", category);

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Research prompt for job market trends
    const researchPrompt = `You are a career market analyst. Research and provide current job market trends for "${category}" roles in the tech industry.

Provide a comprehensive analysis in JSON format with:
{
  "trends": [
    {
      "title": "Trend title",
      "description": "Detailed description of the trend",
      "trending_skills": ["skill1", "skill2", "skill3"],
      "salary_range": "e.g., $80k-$150k",
      "demand_level": "high/medium/low",
      "growth_rate": "e.g., +15% YoY",
      "key_companies": ["Company1", "Company2", "Company3"],
      "preparation_tips": [
        "Specific actionable tip 1",
        "Specific actionable tip 2",
        "Specific actionable tip 3"
      ]
    }
  ]
}

Focus on:
- Current market demand and hiring trends
- Most sought-after skills and technologies
- Salary ranges for different experience levels
- Growing companies hiring for these roles
- Practical preparation advice for interviews

Base your analysis on current 2024-2025 tech market conditions.`;

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
            {
              role: "user",
              content: researchPrompt,
            },
          ],
          temperature: 0.7,
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const aiData = await response.json();
    const aiResponse = aiData.choices[0].message.content;
    console.log("AI Response:", aiResponse);

    // Parse AI response
    let trendsData;
    try {
      const jsonMatch = aiResponse.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiResponse;
      trendsData = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      throw new Error("Failed to parse trends data");
    }

    // Store trends in database
    const trendsToInsert = trendsData.trends.map((trend: any) => ({
      category,
      title: trend.title,
      description: trend.description,
      trending_skills: trend.trending_skills,
      salary_range: trend.salary_range,
      demand_level: trend.demand_level,
      growth_rate: trend.growth_rate,
      key_companies: trend.key_companies,
      preparation_tips: trend.preparation_tips,
      last_updated: new Date().toISOString(),
    }));

    // Delete old trends for this category
    await supabase
      .from("job_market_trends")
      .delete()
      .eq("category", category);

    // Insert new trends
    const { error: insertError } = await supabase
      .from("job_market_trends")
      .insert(trendsToInsert);

    if (insertError) throw insertError;

    console.log("Successfully updated job market trends");

    return new Response(
      JSON.stringify({ success: true, trends: trendsToInsert }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error in research-job-trends function:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
