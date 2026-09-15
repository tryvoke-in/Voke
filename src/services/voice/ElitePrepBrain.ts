import { supabase } from "@/integrations/supabase/client";
import { IVoiceBrain } from "./VoiceBrainInterface";

export class ElitePrepBrain implements IVoiceBrain {
    private roundNumber: number;

    constructor(roundNumber: number) {
        this.roundNumber = roundNumber;
    }

    async generateNextQuestion(
        fullMessages: { role: 'user' | 'assistant' | 'system'; content: string }[],
        sysPrompt: string,
        addTokens: (promptTokens: number, completionTokens: number) => void
    ): Promise<{ text: string; apiLabel?: string }> {

        let aiText = "";
        let apiLabel = "";

        const isCodingRound = this.roundNumber === 3;
        const isHRRound = this.roundNumber === 4;

        const previousAssistantQuestions = fullMessages
            .filter((m: any) => m.role === 'assistant')
            .map((m: any) => (m.content || '').trim())
            .filter(Boolean);

        const turnCount = previousAssistantQuestions.length;

        const antiRepetitionRule = previousAssistantQuestions.length > 0
            ? `\n\nSTRICT NO-REPEAT RULE (DO NOT REPEAT PREVIOUS QUESTIONS):\nYou have already asked the candidate the following questions in this session:\n${previousAssistantQuestions.map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}\nYOU MUST NEVER REPEAT, REPHRASE, OR ASK SIMILAR QUESTIONS TO ANY OF THE ABOVE. Ask a new, focused question that deepens the technical discussion based on their latest answer.`
            : '';

        // Gemini contents payload
        const userLogs = fullMessages.filter((m: any) => m.role !== 'system');
        const contents: any[] = [];
        for (const m of userLogs) {
            const role = m.role === 'assistant' || m.role === 'model' ? 'model' : 'user';
            const text = m.content || m.text || '';
            if (!text.trim()) continue;

            if (contents.length > 0 && contents[contents.length - 1].role === role) {
                contents[contents.length - 1].parts[0].text += `\n${text}`;
            } else {
                contents.push({ role, parts: [{ text }] });
            }
        }
        if (contents.length === 0 || contents[0].role !== 'user') {
            contents.unshift({ role: 'user', parts: [{ text: 'Hello! I am ready to continue the interview.' }] });
        }

        // ================= ENGINE 1: SECURE SUPABASE EDGE FUNCTION =================
        if (!isCodingRound) {
            try {
                console.log(`[ElitePrepBrain] Calling secure interview-chat Edge Function (Turn ${turnCount + 1})...`);
                const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('interview-chat', {
                    body: {
                        messages: fullMessages,
                        interviewType: isHRRound ? 'behavioral' : 'pro_interview',
                        systemPrompt: sysPrompt
                    }
                });

                const responseText = edgeData?.question || edgeData?.content || edgeData?.response;
                const detectedLabel = edgeData?.apiLabel || edgeData?.providerInfo?.apiLabel;
                const usage = edgeData?.usageMetadata || edgeData?.providerInfo?.usageMetadata;
                if (usage) {
                    addTokens(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
                }
                if (detectedLabel) {
                    apiLabel = detectedLabel;
                }

                if (!edgeErr && responseText && typeof responseText === 'string' && responseText.trim().length > 0) {
                    aiText = responseText.trim();
                    console.log('✓ Edge Function generated question:', aiText, 'API:', detectedLabel || '(edge function)');
                } else if (edgeErr) {
                    console.warn('[ElitePrepBrain] Edge Function error, falling back:', edgeErr);
                }
            } catch (edgeEx) {
                console.warn('[ElitePrepBrain] Edge Function exception, falling back:', edgeEx);
            }
        }

        // ================= ENGINE 2: DIRECT GEMINI DEV FALLBACK =================
        const proInterviewGeminiKey = import.meta.env.VITE_PRO_INTERVIEW_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY;
        if (!aiText && proInterviewGeminiKey && proInterviewGeminiKey.startsWith('AQ.')) {
            const geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
            for (const model of geminiModels) {
                try {
                    console.log(`[ElitePrepBrain] Local fallback with Dedicated Gemini (${model}, Turn ${turnCount + 1})...`);

                    let customDirective = antiRepetitionRule;
                    if (isCodingRound) {
                        customDirective += `\n\nCRITICAL ROUND 3 TECHNICAL CODING MANDATE:
1. START QUESTION: Ask ONLY for algorithmic approach.
2. VERIFY APPROACH: Say "[APPROACH_VERIFIED]" when clear.
3. SILENT CODING: Silent while coding.`;
                    } else {
                        customDirective += `\n\nSTRICT CRISP QUESTION MANDATE:
1. STRICT LENGTH: Maximum 1 to 2 short sentences (under 35 words total).
2. ONE DIRECT QUESTION: Ask exactly ONE sharp, focused technical question.`;
                    }

                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${proInterviewGeminiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: contents.slice(-8),
                            systemInstruction: { parts: [{ text: sysPrompt + customDirective }] },
                            generationConfig: { temperature: 0.65, maxOutputTokens: 800 }
                        })
                    });

                    if (res.ok) {
                        const json = await res.json();
                        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        const usage = json.usageMetadata;
                        if (usage) {
                            addTokens(usage.promptTokenCount || 0, usage.candidatesTokenCount || 0);
                        }
                        if (text && text.trim().length > 0) {
                            aiText = text.trim();
                            apiLabel = `(gemini ${model.replace('gemini-', '')})`;
                            console.log(`✓ Gemini (${model}) generated:`, aiText);
                            break;
                        }
                    }
                } catch (geminiErr) {
                    console.warn(`Gemini (${model}) exception:`, geminiErr);
                }
            }
        }

        // ================= ENGINE 3: DIRECT GROQ API =================
        if (!aiText) {
            try {
                console.log('[ElitePrepBrain] Fallback to Direct Groq API (Llama 3.3 70B)...');
                const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
                if (groqApiKey) {
                    const groqMessages = [
                        { role: 'system', content: sysPrompt + antiRepetitionRule },
                        ...fullMessages.filter((m: any) => m.role !== 'system')
                    ];

                    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${groqApiKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "llama-3.1-8b-instant",
                            messages: groqMessages.slice(-10),
                            temperature: 0.7,
                            max_tokens: 200,
                        })
                    });
                    if (res.ok) {
                        const groqData = await res.json();
                        const usage = groqData.usage;
                        if (usage) {
                            addTokens(usage.prompt_tokens || 0, usage.completion_tokens || 0);
                        }
                        if (groqData?.choices?.[0]?.message?.content) {
                            aiText = groqData.choices[0].message.content.trim();
                            apiLabel = '(groq 3.3 direct)';
                            console.log('✓ Success with Direct Groq API:', aiText);
                        }
                    }
                }
            } catch (groqErr) {
                console.error("Groq direct exception:", groqErr);
            }
        }

        // ================= ENGINE 4: DYNAMIC NON-REPEATING PROGRESSION FALLBACK =================
        if (!aiText) {
            console.warn('[ElitePrepBrain] Using non-repeating progressive question fallback.');
            if (isCodingRound) {
                const codingEmergency = [
                    "Please explain your in-depth algorithmic approach step-by-step before we unlock the code editor.",
                    "What time and space complexity are you aiming for with this data structure?",
                    "How will your solution handle key boundary conditions like empty inputs, negative values, or duplicate elements?",
                    "Can you walk me through how we could optimize this solution to use less auxiliary space?",
                    "Now let's walk through Section B for edge cases and debugging. Where could an off-by-one error occur?"
                ];
                aiText = codingEmergency[turnCount % codingEmergency.length];
            } else {
                const progressiveQuestions = [
                    "To begin, could you walk me through your technical background and your favorite recent project?",
                    "Can you explain the overall system architecture of that project and why you selected that specific tech stack?",
                    "What was the most challenging technical bottleneck or concurrency issue you encountered, and how did you resolve it?",
                    "How do you handle database indexing, caching strategies, or API rate limiting in production?",
                    "If your application suddenly experienced a 10x traffic spike, what part of the system would break first and how would you scale it?",
                    "Tell me about a time you had to make a difficult technical trade-off between speed of delivery and code maintainability?",
                    "How do you approach automated testing, continuous integration, and error monitoring for your services?",
                    "What is a recent technical skill, framework, or architectural pattern you've been learning to grow your engineering toolkit?",
                    "Thank you for sharing those insights! Where do you see your engineering career heading in the next few years?"
                ];
                const unused = progressiveQuestions.find(q => !previousAssistantQuestions.includes(q));
                aiText = unused || progressiveQuestions[turnCount % progressiveQuestions.length];
            }
        }

        // CRITICAL ROUND 3 PROHIBITION SANITIZER (Client-side fail-safe)
        if (isCodingRound && aiText) {
            const lower = aiText.toLowerCase();
            const forbiddenPatterns = [
                'resume', 'hirepath', 'prodex', 'truthlens', 'codecompass', 'project', 'projects',
                'college', 'degree', 'coursework', 'school', 'university', 'academic',
                'core technical skills', 'skills or frameworks', 'round 1', 'round 2', 'screening',
                'tell me about yourself', 'introduce yourself', 'practical coursework', 'initial study projects',
                'ui component architecture', 'state management strategy', 'error handling or performance optimization'
            ];
            const isForbidden = forbiddenPatterns.some(pat => lower.includes(pat));

            if (isForbidden) {
                console.warn('[ElitePrepBrain] Intercepted and blocked forbidden resume question in Round 3:', aiText);
                aiText = "Please explain your in-depth algorithmic approach step-by-step to solve the problem on screen before you start coding.";
            }
        }

        return { text: aiText, apiLabel };
    }
}
