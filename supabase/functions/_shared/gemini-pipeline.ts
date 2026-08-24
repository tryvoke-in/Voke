export function getGeminiApiKeys(): string[] {
  const dynamicKeysStr = Deno.env.get('GEMINI_API_KEYS') || '';
  const dynamicKeys = dynamicKeysStr.split(',').map(k => k.trim()).filter(k => k.length > 0);
  const proKey = Deno.env.get('PRO_INTERVIEW_GEMINI_KEY') || Deno.env.get('GOOGLE_API_KEY_PRO') || '';
  const primaryKey = Deno.env.get('GOOGLE_API_KEY') || '';
  
  const keys: string[] = [...dynamicKeys];
  if (proKey && !keys.includes(proKey)) keys.push(proKey);
  if (primaryKey && !keys.includes(primaryKey)) keys.push(primaryKey);

  return keys;
}

export interface GeminiPipelineOptions {
  modelName?: string;
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
  stream?: any;
  errorText?: string;
  providerInfo?: any;
}

export async function callGeminiPipeline(options: GeminiPipelineOptions, isStream = false): Promise<GeminiPipelineResult> {
  const keys = getGeminiApiKeys();
  const modelsToTry = [
    ...(options.modelName ? [options.modelName] : []),
    'gemini-3.1-flash-lite',
    'gemini-2.5-flash',
    'gemini-1.5-flash'
  ];

  let allErrors: string[] = [];

  for (const currentModel of modelsToTry) {
    let currentKeyIndex = 0;
    while (currentKeyIndex < keys.length) {
      const apiKey = keys[currentKeyIndex];
      try {
        const payload: any = {
          contents: options.geminiContents,
          systemInstruction: { parts: [{ text: options.systemPrompt }] },
          generationConfig: { temperature: options.temperature ?? 0.6 },
        };

        if (options.responseSchema) {
          payload.generationConfig.responseMimeType = 'application/json';
          payload.generationConfig.responseSchema = options.responseSchema;
        }

        const endpoint = isStream ? 'streamGenerateContent?alt=sse' : 'generateContent';
        const url = 'https://generativelanguage.googleapis.com/v1beta/models/' + currentModel + ':' + endpoint + (isStream ? '&key=' : '?key=') + apiKey;
        
        const response = await fetch(url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });

        if (response.ok) {
          if (isStream) {
            return {
              ok: true,
              status: response.status,
              stream: response.body,
              providerInfo: { provider: 'Google Gemini', model: currentModel, apiLabel: '(' + currentModel + ')' }
            };
          }
          const data = await response.json();
          let aiContent = "";
          if (data.candidates && data.candidates[0]) {
            aiContent = data.candidates[0].content?.parts?.[0]?.text || "";
          }
          return {
            ok: true,
            status: response.status,
            data,
            aiContent,
            usageMetadata: data.usageMetadata || null,
            modelName: currentModel,
            providerInfo: { provider: 'Google Gemini', model: currentModel, apiLabel: '(' + currentModel + ')' }
          };
        }

        const errorText = await response.text();
        allErrors.push('[' + currentModel + ' Key ' + currentKeyIndex + '] ' + response.status + ': ' + errorText.substring(0, 200));
        
        if (response.status === 429 || response.status === 403 || response.status < 500) {
          currentKeyIndex++;
          continue;
        } else {
          break; // 5xx error, switch to next model
        }
      } catch (err: any) {
        allErrors.push('[' + currentModel + ' Key ' + currentKeyIndex + '] Exception: ' + err.message);
        break; // Network fail, try next model
      }
    }
  }

  return {
    ok: false,
    status: 500,
    errorText: 'Pipeline failed: ' + JSON.stringify(allErrors)
  };
}

export async function streamGeminiPipeline(options: GeminiPipelineOptions): Promise<GeminiPipelineResult> {
  return callGeminiPipeline(options, true);
}
