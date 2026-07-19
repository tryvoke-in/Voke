import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

// SEC-04 FIX: Central authenticated proxy for all Groq API calls.
// The GROQ_API_KEY secret lives only here on the server — it is never exposed
// to the browser. All callers must supply a valid Supabase JWT.

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // --- 1. Authenticate caller via JWT ---
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized: missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await userClient.auth.getUser();
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized: invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // --- 2. Parse request body ---
    const body = await req.json();

    // action: "chat" | "transcribe"
    const action: string = body.action ?? "chat";

    const GROQ_API_KEY = Deno.env.get("GROQ_API_KEY");
    if (!GROQ_API_KEY) {
      throw new Error("GROQ_API_KEY is not configured in Supabase secrets.");
    }

    // --- 3. Route to appropriate Groq endpoint ---

    if (action === "chat") {
      // Chat completions: forward messages + model to Groq
      const {
        messages,
        model = "llama-3.3-70b-versatile",
        temperature = 0.7,
        max_tokens = 800,
        response_format,
      } = body;

      if (!messages || !Array.isArray(messages)) {
        return new Response(JSON.stringify({ error: "messages array is required for chat action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const groqBody: Record<string, any> = { model, messages, temperature, max_tokens };
      if (response_format) groqBody.response_format = response_format;

      const groqRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(groqBody),
      });

      const data = await groqRes.json();

      if (!groqRes.ok) {
        console.error(`[groq-ai-proxy] Groq chat error for user ${user.id}:`, data);
        return new Response(JSON.stringify({ error: data.error?.message ?? "Groq API error", status: groqRes.status }), {
          status: groqRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[groq-ai-proxy] chat ok for user ${user.id}, model=${model}`);
      return new Response(JSON.stringify(data), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "transcribe") {
      // Audio transcription: expects multipart FormData with an "audio" file field
      // The client must POST a FormData with audio blob + optional model/language fields
      const contentType = req.headers.get("content-type") ?? "";

      // The body was already consumed as JSON above — we need to re-read from the request.
      // Since we can't re-read, the client must send a special JSON payload with base64 audio.
      const { audio_base64, audio_mime = "audio/webm", language = "en", model = "whisper-large-v3" } = body;

      if (!audio_base64) {
        return new Response(JSON.stringify({ error: "audio_base64 is required for transcribe action" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Decode base64 → binary
      const binaryStr = atob(audio_base64);
      const bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        bytes[i] = binaryStr.charCodeAt(i);
      }
      const audioBlob = new Blob([bytes], { type: audio_mime });

      const formData = new FormData();
      formData.append("file", new File([audioBlob], "audio.webm", { type: audio_mime }));
      formData.append("model", model);
      formData.append("language", language);
      formData.append("response_format", "json");

      const groqRes = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${GROQ_API_KEY}` },
        body: formData,
      });

      const data = await groqRes.json();

      if (!groqRes.ok) {
        console.error(`[groq-ai-proxy] Groq transcribe error for user ${user.id}:`, data);
        return new Response(JSON.stringify({ error: data.error?.message ?? "Groq transcription error", status: groqRes.status }), {
          status: groqRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log(`[groq-ai-proxy] transcribe ok for user ${user.id}`);
      return new Response(JSON.stringify({ text: data.text }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: `Unknown action: ${action}. Use 'chat' or 'transcribe'.` }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("[groq-ai-proxy] Unhandled error:", error);
    return new Response(
      JSON.stringify({ error: (error as Error).message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
