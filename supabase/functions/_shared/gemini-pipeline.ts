// Shared Gemini API Pipeline with Automatic Rate-Limit Failover

export function getGeminiApiKeys(): string[] {
  const proKey = Deno.env.get("PRO_INTERVIEW_GEMINI_KEY") || Deno.env.get("GOOGLE_API_KEY_PRO") || "";
  const primaryKey = Deno.env.get("GOOGLE_API_KEY") || Deno.env.get("GEMINI_API_KEY") || "";
  const secondaryKey = Deno.env.get("GOOGLE_API_KEY1") || Deno.env.get("GEMINI_API_KEY_FALLBACK") || "";

  const keys: string[] = [];
  if (proKey) keys.push(proKey);
  if (primaryKey && !keys.includes(primaryKey)) keys.push(primaryKey);
  if (secondaryKey && !keys.includes(secondaryKey)) keys.push(secondaryKey);

  return keys;
}

export interface GeminiPipelineOptions {
  modelName: string; // e.g. "gemini-3.1-flash-lite" or "gemini-2.5-flash"
  geminiContents: any[];
  systemPrompt: string;
  responseSchema?: any;
  temperature?: number;
}

export interface GeminiPipelineResult {
  ok: boolean;
  status: number;
  data?: any;
  aiContent?: string;
  usedKeyIndex?: number;
  providerInfo?: {
    provider: string;
    model: string;
    keyLabel: string;
    isFallbackKey: boolean;
  };
  errorText?: string;
}

export async function callGeminiPipeline({
  modelName,
  geminiContents,
  systemPrompt,
  responseSchema,
  temperature = 0.6,
}: GeminiPipelineOptions): Promise<GeminiPipelineResult> {
  const keys = getGeminiApiKeys();
  const modelsToTry = Array.from(new Set([
    modelName || "gemini-3.1-flash-lite",
    "gemini-3.1-flash-lite",
    "gemini-3.5-flash-lite",
    "gemini-flash-lite-latest",
    "gemini-3.6-flash",
  ]));

  for (let m = 0; m < modelsToTry.length; m++) {
    const currentModel = modelsToTry[m];

    for (let i = 0; i < keys.length; i++) {
      const apiKey = keys[i];
      const isFallbackKey = apiKey === (Deno.env.get("GEMINI_API_KEY_FALLBACK") || "") || i > 0;
      const keyLabel = isFallbackKey ? "Secondary Fallback Key" : "Primary GOOGLE_API_KEY";

      console.log(`[Gemini Pipeline] Trying model '${currentModel}' with API key index ${i} (${keyLabel})...`);

      try {
        const payload: any = {
          contents: geminiContents,
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            temperature,
            maxOutputTokens: responseSchema ? 800 : 800,
          },
        };

        if (responseSchema) {
          payload.generationConfig.responseMimeType = "application/json";
          payload.generationConfig.responseSchema = responseSchema;
        }

        const url = `https://generativelanguage.googleapis.com/v1beta/models/${currentModel}:generateContent?key=${apiKey}`;
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          const data = await response.json();
          let aiContent = "";

          if (data.candidates && data.candidates[0]) {
            aiContent = data.candidates[0].content?.parts?.[0]?.text || "";
          }

          // Only return success if we actually got content
          if (aiContent && aiContent.trim().length > 0) {
            const finishReason = data.candidates[0].finishReason || "unknown";
            console.log(`[Gemini Pipeline] ✓ Success with model '${currentModel}' using ${keyLabel} (finishReason: ${finishReason}): "${aiContent.trim().slice(0, 120)}"`);
            return {
              ok: true,
              status: response.status,
              data,
              aiContent: aiContent.trim(),
              usedKeyIndex: i,
              providerInfo: {
                provider: "Google Gemini REST API",
                model: currentModel,
                keyLabel,
                isFallbackKey,
                apiLabel: `(${isFallbackKey ? "secondary" : "primary"} ${currentModel.includes("3.1") ? "3.1" : (currentModel.includes("2.0") ? "2.0" : "flash")})`,
              },
            };
          } else {
            console.warn(`[Gemini Pipeline] Model '${currentModel}' returned empty content. Trying next...`);
          }
        }

        const errorText = await response.text();
        console.warn(
          `[Gemini Pipeline] Model '${currentModel}', Key index ${i} (${keyLabel}) failed with status ${response.status}: ${errorText}`
        );
      } catch (err: any) {
        console.error(`[Gemini Pipeline] Network / execution error on model '${currentModel}', key index ${i} (${keyLabel}):`, err);
      }
    }
  }

  return {
    ok: false,
    status: 500,
    errorText: "All configured Gemini API keys and models failed or were rate-limited.",
  };
}
