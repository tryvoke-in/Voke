/**
 * SEC-04 FIX: Secure Groq API proxy helper.
 *
 * All Groq calls now go through the `groq-ai-proxy` Edge Function so that
 * GROQ_API_KEY never appears in client-side JavaScript bundles.
 *
 * Usage:
 *   import { groqChat, groqTranscribe } from "@/utils/groqProxy";
 *
 *   const data = await groqChat({ messages: [...], model: "llama-3.3-70b-versatile" });
 *   const text = await groqTranscribe(audioBlob, "en");
 */

import { supabase } from "@/integrations/supabase/client";

// ---- Types ----------------------------------------------------------------

export interface GroqMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface GroqChatOptions {
  messages: GroqMessage[];
  model?: string;
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: "json_object" };
}

// ---- Chat completions -------------------------------------------------------

/**
 * Send a chat completion request through the secure server-side proxy.
 * Returns the full Groq response object (choices[0].message.content etc.)
 */
export async function groqChat(options: GroqChatOptions): Promise<any> {
  const { data, error } = await supabase.functions.invoke("groq-ai-proxy", {
    body: { action: "chat", ...options },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data;
}

/**
 * Convenience wrapper: returns only the text of the first choice.
 */
export async function groqChatText(options: GroqChatOptions): Promise<string> {
  const data = await groqChat(options);
  return data?.choices?.[0]?.message?.content ?? "";
}

// ---- Whisper transcription --------------------------------------------------

/**
 * Transcribe an audio Blob through the secure server-side proxy.
 * Returns the transcript text string.
 */
export async function groqTranscribe(
  audioBlob: Blob,
  language = "en",
  model = "whisper-large-v3"
): Promise<string> {
  // Convert Blob → base64 so it can be sent as JSON
  const arrayBuffer = await audioBlob.arrayBuffer();
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  const audio_base64 = btoa(binary);

  const { data, error } = await supabase.functions.invoke("groq-ai-proxy", {
    body: {
      action: "transcribe",
      audio_base64,
      audio_mime: audioBlob.type || "audio/webm",
      language,
      model,
    },
  });

  if (error) throw error;
  if (data?.error) throw new Error(data.error);
  return data?.text ?? "";
}
