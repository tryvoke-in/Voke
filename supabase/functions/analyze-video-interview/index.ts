import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { encode as base64Encode } from "https://deno.land/std@0.168.0/encoding/base64.ts";
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
    const { sessionId, videoUrl, videoBase64, question, transcript, userContext, role } = await req.json();
    console.log("Analyzing video interview session:", sessionId, "Role:", role);

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get session data from DB if available
    let session: any = null;
    try {
      const { data } = await supabase
        .from("video_interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .maybeSingle();
      session = data;
    } catch (_) {
      // Optional session lookup fallback
    }

    const targetVideoUrl = videoUrl || session?.video_url;
    console.log("Target Video URL for Gemini 2.5 Flash analysis:", targetVideoUrl);

    let videoInlineData: any = null;

    // Use direct videoBase64 payload if provided by client
    if (videoBase64) {
      try {
        const cleanBase64 = videoBase64.replace(/^data:video\/\w+;base64,/, "");
        videoInlineData = {
          inline_data: {
            mime_type: "video/webm",
            data: cleanBase64
          }
        };
        console.log("✓ Successfully configured direct videoBase64 inline_data for Gemini 2.5 Flash analysis.");
      } catch (b64Err) {
        console.warn("Direct videoBase64 parse note:", b64Err);
      }
    }

    // Fallback: Fetch video file from Supabase Storage public URL
    if (!videoInlineData && targetVideoUrl) {
      try {
        console.log("Fetching video file from URL for Gemini 2.5 Flash multimodal vision & body language analysis...");
        const videoRes = await fetch(targetVideoUrl);
        if (videoRes.ok) {
          const videoArrayBuffer = await videoRes.arrayBuffer();
          if (videoArrayBuffer.byteLength > 0 && videoArrayBuffer.byteLength < 25 * 1024 * 1024) {
            const videoUint8 = new Uint8Array(videoArrayBuffer);
            const base64Video = base64Encode(videoUint8);
            videoInlineData = {
              inline_data: {
                mime_type: "video/webm",
                data: base64Video
              }
            };
            console.log("✓ Successfully loaded video inline_data from URL for Gemini 2.5 Flash, size:", videoUint8.length, "bytes");
          }
        }
      } catch (vidFetchErr) {
        console.warn("Could not fetch video file for multimodal inlineData:", vidFetchErr);
      }
    }

    const roleContext = role ? `for a ${role} position` : "";
    const analysisPrompt = `You are a world-class AI video & body language interview coach evaluating candidate physical posture, gaze direction, hand gestures, and vocal delivery frame-by-frame.

CRITICAL INSTRUCTIONS FOR ACCURACY:
- Inspect the attached video stream. Look closely at candidate eye gaze (were they looking away/distracted?), head movements, hand gesturing (excessive waving vs steady), and body posture.
- Do NOT generate generic positive feedback. If the candidate looked away, was distracted, or moved their hands excessively, state it explicitly in the feedback!

ANALYSIS REQUIREMENTS:
1. MODEL ANSWER: Write an ideal 2-3 paragraph response to this question ${roleContext}.
2. WHAT'S GOOD: List 2-4 specific positive aspects of their delivery or video posture.
3. WHAT'S WRONG: List 3-5 specific, BRUTALLY HONEST observations about body language, gaze distraction, hand movements, or speech delivery.
4. VIDEO ANALYSIS DETAILS:
   - Eye Contact: Directly state if candidate looked at the camera or was looking away/distracted (e.g., "Looked away frequently to the side/top, indicating distraction").
   - Voice Volume & Pacing: Evaluate clarity, loudness, and speed.
   - Posture & Presence: Describe actual physical posture (e.g., "Frequent head/shoulder movements, uncentered").
   - Facial Expressions: Describe expression (e.g., "Distracted, unengaged, or restless").
   - Attire & Professional Dressing: Observe and describe the candidate's visible clothing in the video frame (e.g. "Candidate was wearing an informal sleeveless vest/tank top; formal shirt or business casual attire is required for professional technical interviews").
   - Body Language Strengths: List 2-3 observed physical strengths.
   - Body Language Improvements: List 3-4 specific physical corrections (e.g., "Wear formal shirt for professional setting", "Maintain steady eye gaze on the lens").
5. SCORES (0-100): Delivery, Body Language (reflecting actual composure & gaze), Confidence, Overall.`;

    const userParts: any[] = [];
    if (videoInlineData) {
      userParts.push(videoInlineData);
    }
    userParts.push({ text: analysisPrompt });

    const geminiContents = [
      {
        role: "user",
        parts: userParts
      }
    ];

    const responseSchema = {
      type: "OBJECT",
      properties: {
        model_answer: { type: "STRING" },
        whats_good: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        whats_wrong: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        video_analysis_details: {
          type: "OBJECT",
          properties: {
            eye_contact: { type: "STRING" },
            voice_volume: { type: "STRING" },
            posture: { type: "STRING" },
            facial_expressions: { type: "STRING" },
            attire: { type: "STRING" },
            body_language_strengths: {
              type: "ARRAY",
              items: { type: "STRING" }
            },
            body_language_improvements: {
              type: "ARRAY",
              items: { type: "STRING" }
            }
          },
          required: ["eye_contact", "voice_volume", "posture", "facial_expressions", "attire", "body_language_strengths", "body_language_improvements"]
        },
        delivery_score: { type: "INTEGER" },
        body_language_score: { type: "INTEGER" },
        confidence_score: { type: "INTEGER" },
        overall_score: { type: "INTEGER" },
        feedback_summary: { type: "STRING" },
        strengths: {
          type: "ARRAY",
          items: { type: "STRING" }
        },
        improvements: {
          type: "ARRAY",
          items: { type: "STRING" }
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
      required: [
        "model_answer",
        "whats_good",
        "whats_wrong",
        "video_analysis_details",
        "delivery_score",
        "body_language_score",
        "confidence_score",
        "overall_score",
        "feedback_summary",
        "strengths",
        "improvements",
        "six_q_score",
        "personality_cluster"
      ]
    };

    let aiContent = "";
    let success = false;

    // STEP 1: Primary - Try google/gemini-2.5-flash via Lovable AI Gateway
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (LOVABLE_API_KEY) {
      try {
        console.log("Executing Step 1: Lovable Gateway model google/gemini-2.5-flash for Video & Body Language Analysis...");
        const userMsgContent: any[] = [];
        if (videoInlineData) {
          userMsgContent.push({
            type: "image_url",
            image_url: {
              url: `data:video/webm;base64,${videoInlineData.inline_data.data}`
            }
          });
        }
        userMsgContent.push({ type: "text", text: analysisPrompt });

        const lovableRes = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${LOVABLE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              { role: "system", content: "You are an expert video & body language interview coach. Output valid JSON matching requested keys." },
              { role: "user", content: userMsgContent }
            ],
            temperature: 0.3,
            response_format: { type: "json_object" }
          }),
        });

        if (lovableRes.ok) {
          const lData = await lovableRes.json();
          aiContent = lData.choices?.[0]?.message?.content || "";
          if (aiContent) {
            success = true;
            console.log("✓ Success with google/gemini-2.5-flash via Lovable Gateway");
          }
        } else {
          console.warn("Lovable Gateway google/gemini-2.5-flash returned status:", lovableRes.status);
        }
      } catch (lErr) {
        console.warn("Lovable Gateway google/gemini-2.5-flash execution note:", lErr);
      }
    }

    // STEP 2: Secondary - Direct Google Gemini REST API (gemini-2.0-flash)
    if (!success) {
      console.log("Executing Step 2: Direct Google Gemini REST API Video & Body Language Analysis...");
      const geminiRes = await callGeminiPipeline({
        modelName: "gemini-2.0-flash",
        geminiContents,
        systemPrompt: "You are an expert video & body language interview analyzer. Output JSON only.",
        responseSchema,
        temperature: 0.3,
      });

      if (geminiRes.ok && geminiRes.aiContent) {
        aiContent = geminiRes.aiContent;
        success = true;
      }
    } else {
      console.warn("Gemini 2.5 Flash failed on all keys. Falling back to Groq...");
      const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
      if (GROQ_API_KEY) {
        try {
          const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.3-70b-versatile",
              messages: [{ role: "user", content: analysisPrompt }],
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
          console.error("Groq fallback error:", groqErr);
        }
      }
    }

    if (!success || !aiContent) {
      throw new Error("All AI video analysis providers failed");
    }

    let analysis;
    try {
      const jsonMatch = aiContent.match(/```(?:json)?\s*(\{[\s\S]*\})\s*```/);
      const jsonStr = jsonMatch ? jsonMatch[1] : aiContent;
      analysis = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI response:", parseError);
      analysis = {
        delivery_score: 75,
        body_language_score: 70,
        confidence_score: 72,
        overall_score: 72,
        feedback_summary: aiContent,
        strengths: ["Good attempt at answering", "Reasonable pace"],
        improvements: ["Maintain eye contact", "Structure answer with STAR"],
      };
    }

    if (!analysis.overall_score) {
      analysis.overall_score = Math.round(
        (analysis.delivery_score + analysis.body_language_score + analysis.confidence_score) / 3
      );
    }

    // Update session with analysis results if session exists in video_interview_sessions
    try {
      await supabase
        .from("video_interview_sessions")
        .update({
          analysis_result: analysis,
          feedback_summary: analysis.feedback_summary,
          delivery_score: analysis.delivery_score,
          body_language_score: analysis.body_language_score,
          confidence_score: analysis.confidence_score,
          overall_score: analysis.overall_score,
          model_answer: analysis.model_answer,
          whats_good: analysis.whats_good,
          whats_wrong: analysis.whats_wrong,
          video_analysis_details: analysis.video_analysis_details,
          status: "completed",
          six_q_score: analysis.six_q_score,
          personality_cluster: analysis.personality_cluster,
          analyzed_at: new Date().toISOString(),
        })
        .eq("id", sessionId);
    } catch (dbErr) {
      console.log("Note: video_interview_sessions update optional skip:", dbErr);
    }

    console.log("Analysis complete for session:", sessionId);

    return new Response(JSON.stringify({ success: true, analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Error in analyze-video-interview function:", error);
    return new Response(JSON.stringify({ error: error.message || "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
