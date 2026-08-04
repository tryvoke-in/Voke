import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import { LiveStatus, MessageLog } from '../types/voice';
import { toast } from 'sonner';
export type GroqVoiceConnectOptions = string | {
    systemPrompt?: string;
    initialGreeting?: string;
    mode?: 'conversational' | 'coding_silent';
};

const SYSTEM_INSTRUCTION = `YOU ARE:
A real-time voice-based technical interviewer conducting an elite software engineering interview.

CRITICAL LANGUAGE MANDATE:
- You MUST communicate, ask questions, and respond ONLY in clear, natural, professional English.
- NEVER output Japanese, Chinese, Hindi, or any non-English language under any circumstance.

1. Core Personality & Speaking Style:
- Speak in a friendly, concise, natural, and professional tone.
- Keep responses concise (1-3 sentences max) unless explicitly asked for in-depth explanation.
- Never sound robotic or overly formal.

2. Interview Etiquette & Candidate Focus:
- Respect the candidate's focus. When the candidate is working on code or thinking silently, do NOT interrupt them.
- When they explain their approach or ask questions, respond directly and constructively.

3. Coding Assessment (Round 3) Strict Protocol:
- ONLY discuss the coding challenge, algorithms, complexity, edge cases, and debugging.
- NEVER ask resume, college, education, degree, or introductory questions.
- While solving, let the student code in peace without unnecessary interruptions.
- When the code is solved / tests pass, actively ask about:
  (a) Time & Space Big-O Complexity ($O(N)$).
  (b) Extreme Edge Cases & Boundary Conditions (empty array, duplicates, single elements, max constraints).
  (c) Alternative data structures or space-time trade-offs.
`;

interface UseGroqVoiceReturn {
    status: LiveStatus;
    connect: (context?: GroqVoiceConnectOptions) => Promise<void>;
    disconnect: () => void;
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
    logs: MessageLog[];
    errorDetails: string | null;
    sendHiddenContext: (text: string) => Promise<void>;
    apiLabel: string;
    isSilentMode: boolean;
    setIsSilentMode: (silent: boolean) => void;
}

interface UseGroqVoiceProps {
    apiKey?: string;
}

export function useGroqVoice(props?: UseGroqVoiceProps): UseGroqVoiceReturn {
    const [status, setStatus] = useState<LiveStatus>(LiveStatus.DISCONNECTED);
    const [isSilentMode, setIsSilentMode] = useState<boolean>(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [apiLabel, setApiLabel] = useState<string>('(primary 3.1)');

    const mediaRecorderRef = useRef<MediaRecorder | null>(null);
    const audioChunksRef = useRef<Blob[]>([]);
    const contextRef = useRef<string>('');
    const conversationHistoryRef = useRef<{ role: 'user' | 'assistant' | 'system'; content: string }[]>([]);
    const statusRef = useRef(status);
    const isAiSpeakingRef = useRef(isAiSpeaking);
    const isListeningRef = useRef(false);
    const audioRef = useRef<HTMLAudioElement | null>(null);
    const streamRef = useRef<MediaStream | null>(null);
    const audioContextRef = useRef<AudioContext | null>(null);
    const activeUtteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
    const resumeTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        statusRef.current = status;
        isAiSpeakingRef.current = isAiSpeaking;
    }, [status, isAiSpeaking]);

    // Forward declaration for use in speakResponse
    const startListeningRef = useRef<() => Promise<void>>();

    // Helper to send messages to Gemini 3.1 Flash Lite Edge Function (Primary) with Groq fallback
    const sendToGroq = async (fullMessages: any[]) => {
        let aiText = "";

        // PRIMARY ENGINE: Call Gemini 3.1 Flash Lite via interview-chat Edge Function
        try {
            console.log('DEBUG: Primary - Generating question with Gemini 3.1 Flash Lite via interview-chat Edge Function...');
            const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('interview-chat', {
                body: { messages: fullMessages }
            });

            const responseText = edgeData?.question || edgeData?.content || edgeData?.response;
            const detectedLabel = edgeData?.apiLabel || edgeData?.providerInfo?.apiLabel;
            if (detectedLabel) {
                setApiLabel(detectedLabel);
            }

            if (!edgeErr && responseText && typeof responseText === 'string' && responseText.trim().length > 0) {
                aiText = responseText.trim();
                console.log('DEBUG: Gemini 3.1 Flash Lite response:', aiText, 'API:', detectedLabel || '(primary 3.1)');
            } else if (edgeErr) {
                console.warn('interview-chat Edge Function note:', edgeErr);
            }
        } catch (edgeEx) {
            console.warn('interview-chat Edge Function exception:', edgeEx);
        }

        // SECONDARY AI ENGINE: Direct Gemini 3.1 Flash Lite API via VITE_GEMINI_API_KEY
        if (!aiText) {
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (geminiApiKey) {
                try {
                    console.log('DEBUG: Secondary - Generating question with direct Gemini 3.1 Flash Lite API...');
                    const systemPromptMsg = fullMessages.find((m: any) => m.role === 'system')?.content || '';
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
                        contents.unshift({ role: 'user', parts: [{ text: 'Hello! I am ready for the interview.' }] });
                    }

                    const isCodingRound = /round\s*3|coding|live\s*coding|assessment|two\s*sum|longest\s*substring|algorithm|debugging|system\s*design|approach\s*phase/i.test(systemPromptMsg);
                    const isProjectRound = (/round\s*2|project\s*deep\s*dive/i.test(systemPromptMsg)) && !isCodingRound;
                    const isRound1 = (/round\s*1/i.test(systemPromptMsg)) && !isCodingRound && !isProjectRound;
                    const assistantTurnCount = conversationHistoryRef.current.filter(m => m.role === 'assistant').length;
                    let turnHint = "";

                    if (isCodingRound) {
                        turnHint = "\n\nCRITICAL ROUND 3 CODING MANDATE: You are conducting a FAANG-tier Technical Coding Assessment. When candidate explains logic or solves code, dynamically ask about: (1) Big-O Time & Auxiliary Space Complexity, (2) Extreme Edge Cases & Boundary Conditions (empty arrays, duplicates, large inputs), (3) Alternative Optimization Trade-offs, and (4) Root-cause Debugging. NEVER ask about resume, degree, or introductory questions!";
                    } else if (isProjectRound) {
                        turnHint = "\n\nCRITICAL ROUND 2 MANDATE: Focus strictly on project architecture, technical bottlenecks, and code structure!";
                    } else if (isRound1) {
                        if (assistantTurnCount === 1) {
                            turnHint = "\n\nTURN 2 DIRECTIVE: Ask about candidate's EDUCATION or DEGREE in CS / Web Development. Ask what specific web development coursework they focused on!";
                        } else if (assistantTurnCount === 2) {
                            turnHint = "\n\nTURN 3 DIRECTIVE: Ask about candidate's CORE CLAIMED SKILLS (React, JavaScript, HTML/CSS) listed on their resume!";
                        } else if (assistantTurnCount === 3) {
                            turnHint = "\n\nTURN 4 DIRECTIVE: Ask about PRACTICAL SKILL APPLICATION in coursework or projects!";
                        } else if (assistantTurnCount === 4) {
                            turnHint = "\n\nTURN 5 DIRECTIVE: Ask a targeted question about candidate's FIRST project BY NAME (e.g. HirePath)!";
                        } else if (assistantTurnCount === 5) {
                            turnHint = "\n\nTURN 6 DIRECTIVE: Ask a targeted question about candidate's SECOND project BY NAME (e.g. Prodex)!";
                        } else if (assistantTurnCount === 6) {
                            turnHint = "\n\nTURN 7 DIRECTIVE: Ask about DEVELOPMENT TOOLS, Git workflow, or build tools!";
                        } else if (assistantTurnCount === 7) {
                            turnHint = "\n\nTURN 8 DIRECTIVE: Ask about ROLE MOTIVATION for this position!";
                        } else if (assistantTurnCount === 8) {
                            turnHint = "\n\nTURN 9 DIRECTIVE: Ask about SKILL GROWTH & new concepts they are studying!";
                        } else if (assistantTurnCount >= 9) {
                            turnHint = "\n\nTURN 10 DIRECTIVE: Ask about career vision and speak a warm closing goodbye speech!";
                        }
                    }

                    const englishMandate = "\n\nCRITICAL MANDATE: You MUST communicate and ask questions ONLY in English. Never output Japanese, Chinese, or any other language.";

                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: contents.slice(-6),
                            systemInstruction: { parts: [{ text: systemPromptMsg + turnHint + englishMandate }] },
                            generationConfig: { temperature: 0.6, maxOutputTokens: 100 }
                        })
                    });

                    if (res.ok) {
                        const json = await res.json();
                        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text && text.trim()) {
                            aiText = text.trim();
                            console.log('✓ Success with Direct Gemini 3.1 Flash Lite API question generation:', aiText);
                        }
                    } else {
                        console.warn('Direct Gemini API status:', res.status);
                    }
                } catch (directGeminiErr) {
                    console.warn('Direct Gemini API exception:', directGeminiErr);
                }
            }
        }

        // TERTIARY FALLBACK: Groq Llama 3.3 70B via groq-proxy Edge Function
        if (!aiText) {
            try {
                console.log('DEBUG: Tertiary Fallback - Generating question with Groq Llama 3.3 70B...');
                const { data: groqData, error: groqErr } = await supabase.functions.invoke('groq-proxy', {
                    body: {
                        messages: fullMessages,
                        model: 'llama-3.3-70b-versatile',
                        temperature: 0.7,
                        max_tokens: 800,
                    }
                });
                if (!groqErr && groqData?.choices?.[0]?.message?.content) {
                    aiText = groqData.choices[0].message.content.trim();
                    console.log('✓ Success with Tertiary Fallback (Groq Llama 3.3 70B):', aiText);
                } else if (groqErr) {
                    console.warn('Groq proxy fallback note:', groqErr);
                }
            } catch (groqErr) {
                console.error("Groq fallback exception:", groqErr);
            }
        }

        // LAST RESORT: Only reached if Edge Function + Direct Gemini API + Groq ALL failed
        if (!aiText) {
            console.error('⚠️ ALL AI ENGINES FAILED! Using emergency last-resort question.');
            const assistantTurnCount = conversationHistoryRef.current.filter(m => m.role === 'assistant').length;
            
            // Extract candidate details from system prompt for contextual emergency questions
            const sysPrompt = fullMessages.find((m: any) => m.role === 'system')?.content || '';
            
            // Try to extract project names from the system prompt
            const projectNameRegex = /(?:project|repo|repository)\s*(?:name)?\s*[:=]?\s*["\']?([A-Z][a-zA-Z0-9_-]+)/gi;
            const projectMatches = [...sysPrompt.matchAll(projectNameRegex)].map(m => m[1]);
            const proj1 = projectMatches[0] || 'your main project';
            const proj2 = projectMatches[1] || 'your second project';
            
            const isCoding = sysPrompt.includes('Round 3') || sysPrompt.includes('Coding Assessment');
            const isProject = sysPrompt.includes('Round 2') || sysPrompt.includes('Project Deep Dive');

            // Emergency turn-based questions (only used if ALL 3 AI engines fail)
            let emergencyQuestions: Record<number, string>;
            if (isCoding) {
                emergencyQuestions = {
                    0: "Take a look at the problem on your screen. When you're ready, talk me through your initial algorithmic approach.",
                    1: "What time and space complexity are you aiming for with this implementation?",
                    2: "How will your code handle key edge cases such as empty inputs or duplicates?",
                    3: "Can we optimize the inner loops or memory allocation further?",
                    4: "Let's move on to the debugging challenge. Where do you suspect the root bug is located?"
                };
            } else if (isProject) {
                emergencyQuestions = {
                    0: `Welcome to the Project Deep Dive! Walk me through the core technical architecture of ${proj1}.`,
                    1: `In ${proj1}, what was the most difficult technical bottleneck you solved?`,
                    2: `How did you handle state management, API synchronization, and error handling in ${proj1}?`,
                    3: `Let's discuss ${proj2}. What key engineering trade-offs did you make during development?`,
                    4: `How did you test and guarantee performance for ${proj2}?`
                };
            } else {
                emergencyQuestions = {
                    0: "Welcome! Could you introduce yourself and tell me about your technical background?",
                    1: "What specific coursework or academic modules have shaped your skills as a developer?",
                    2: "Which programming languages or frameworks on your resume are you most confident with?",
                    3: "Can you walk me through how you've applied those skills in a real coding scenario?",
                    4: `Tell me about the technical architecture behind ${proj1}. What were the key engineering decisions?`,
                    5: `In ${proj2}, what was the most challenging technical problem you solved?`,
                    6: "What development tools and workflow practices do you use for version control and testing?",
                    7: "What excites you most about this role and how does it align with your career goals?",
                    8: "What new technologies or concepts are you currently learning to grow as an engineer?",
                    9: "Thank you for a great conversation! Where do you see your engineering career in the next few years?"
                };
            }
            
            const turnKey = Math.min(assistantTurnCount, Object.keys(emergencyQuestions).length - 1);
            aiText = emergencyQuestions[turnKey] || "Could you tell me more about your technical experience?";
        }

        // STRICT CLIENT-SIDE ANTI-REPETITION INTERCEPTOR
        const previousAssistantQuestions = conversationHistoryRef.current
            .filter(m => m.role === 'assistant')
            .map(m => m.content.trim().toLowerCase())
            .filter(Boolean);

        const isDuplicate = previousAssistantQuestions.some(prev => 
            prev === aiText.trim().toLowerCase() ||
            (prev.length > 15 && (prev.includes(aiText.trim().toLowerCase()) || aiText.trim().toLowerCase().includes(prev))) ||
            (prev.length > 25 && prev.slice(0, 30) === aiText.trim().toLowerCase().slice(0, 30))
        );

        if (isDuplicate) {
            console.warn(`[Client Anti-Repetition] Detected duplicate: "${aiText}". Requesting fresh AI question...`);
            
            // Try one more direct Gemini call with explicit anti-duplication
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (geminiApiKey) {
                try {
                    const sysPrompt = fullMessages.find((m: any) => m.role === 'system')?.content || '';
                    const assistantCount = conversationHistoryRef.current.filter(m => m.role === 'assistant').length;
                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ role: 'user', parts: [{ text: `Generate a single fresh interview question for turn ${assistantCount + 1} of 10. Previously asked: ${previousAssistantQuestions.join('; ')}. Context: ${sysPrompt.slice(0, 500)}` }] }],
                            systemInstruction: { parts: [{ text: 'You are a professional interviewer. Generate exactly ONE short interview question (under 40 words). Do NOT repeat any previously asked questions.' }] },
                            generationConfig: { temperature: 0.9, maxOutputTokens: 100 }
                        })
                    });
                    if (res.ok) {
                        const json = await res.json();
                        const freshQ = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (freshQ?.trim()) {
                            aiText = freshQ.trim();
                            console.log('✓ Anti-repetition recovery: Fresh AI question generated:', aiText);
                        }
                    }
                } catch (e) {
                    console.warn('Anti-repetition recovery failed:', e);
                }
            }
        }

        const aiMsg: MessageLog = {
            id: Date.now().toString() + '-ai',
            role: 'assistant',
            text: aiText,
            timestamp: new Date(),
        };
        setLogs(prev => [...prev, aiMsg]);
        conversationHistoryRef.current.push({ role: 'assistant', content: aiText });

        speakResponse(aiText);
    };

    const speakResponse = async (text: string) => {
        if (!text) return;

        // Strip out tokens and hidden content for speech
        let speechText = text
            .replace(/\[START_CODING\]/g, '')
            .replace(/\[END_CODING\]/g, '')
            .replace(/\[VERDICT:[^\]]*\]/g, '')
            .replace(/\[REASON:[^\]]*\]/g, '');

        // Remove detailed feedback content (everything after the token)
        if (speechText.includes('[DETAILED_FEEDBACK]')) {
            speechText = speechText.split('[DETAILED_FEEDBACK]')[0];
        }

        speechText = speechText.trim();
        if (!speechText || statusRef.current === LiveStatus.DISCONNECTED) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
            return;
        }

        try {
            console.log('DEBUG: Speaking AI response via Web Speech API:', speechText);

            // Clear any active resume interval
            if (resumeTimerRef.current) {
                clearInterval(resumeTimerRef.current);
                resumeTimerRef.current = null;
            }

            // Stop any currently playing speech cleanly
            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                window.speechSynthesis.cancel();
                await new Promise(r => setTimeout(r, 60));
            }

            // Ensure speech synthesis is un-paused
            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }

            setIsAiSpeaking(true);
            setVolume(0.8);

            const utterance = new SpeechSynthesisUtterance(speechText);
            // CRITICAL GC PROTECTION: Prevent V8 garbage collection while speech is playing
            activeUtteranceRef.current = utterance;
            (window as any).__vokeUtterance = utterance;

            // Load and select high quality English voice
            let voices = window.speechSynthesis.getVoices();
            if (!voices || voices.length === 0) {
                await new Promise<void>(resolve => {
                    const onVoices = () => {
                        window.speechSynthesis.removeEventListener('voiceschanged', onVoices);
                        resolve();
                    };
                    window.speechSynthesis.addEventListener('voiceschanged', onVoices);
                    setTimeout(resolve, 250);
                });
                voices = window.speechSynthesis.getVoices();
            }

            const preferredVoice = voices.find(v => 
                v.lang.startsWith('en') && 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Jenny') || v.name.includes('Guy') || v.name.includes('Aria') || v.name.includes('Zira') || v.name.includes('David'))
            ) || voices.find(v => v.lang.startsWith('en') || v.lang.includes('en'));

            if (preferredVoice) {
                utterance.voice = preferredVoice;
                utterance.lang = preferredVoice.lang;
            } else {
                utterance.lang = 'en-US';
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            utterance.volume = 1.0;

            // Chrome/Edge watchdog: unstick paused or stalled synthesis on Windows
            resumeTimerRef.current = setInterval(() => {
                if (window.speechSynthesis.speaking) {
                    window.speechSynthesis.pause();
                    window.speechSynthesis.resume();
                } else {
                    if (resumeTimerRef.current) {
                        clearInterval(resumeTimerRef.current);
                        resumeTimerRef.current = null;
                    }
                }
            }, 4000);

            utterance.onstart = () => {
                console.log('DEBUG: AI speech playback started successfully.');
                setIsAiSpeaking(true);
                setVolume(0.8);
            };

            utterance.onend = () => {
                console.log('DEBUG: AI speech finished.');
                if (resumeTimerRef.current) {
                    clearInterval(resumeTimerRef.current);
                    resumeTimerRef.current = null;
                }
                activeUtteranceRef.current = null;
                (window as any).__vokeUtterance = null;
                setIsAiSpeaking(false);
                setVolume(0);

                // Resume candidate microphone listening after AI finishes speaking
                if (statusRef.current === LiveStatus.CONNECTED && startListeningRef.current) {
                    setTimeout(() => {
                        if (statusRef.current === LiveStatus.CONNECTED && !isAiSpeakingRef.current) {
                            startListeningRef.current?.();
                        }
                    }, 400);
                }
            };

            utterance.onerror = (e) => {
                console.warn('DEBUG: Speech synthesis event note:', e);
                if (resumeTimerRef.current) {
                    clearInterval(resumeTimerRef.current);
                    resumeTimerRef.current = null;
                }
                activeUtteranceRef.current = null;
                (window as any).__vokeUtterance = null;
                setIsAiSpeaking(false);
                setVolume(0);

                if (statusRef.current === LiveStatus.CONNECTED && startListeningRef.current) {
                    setTimeout(() => {
                        if (statusRef.current === LiveStatus.CONNECTED && !isAiSpeakingRef.current) {
                            startListeningRef.current?.();
                        }
                    }, 400);
                }
            };

            window.speechSynthesis.speak(utterance);
            window.speechSynthesis.resume();

        } catch (error) {
            console.error('DEBUG: Speech synthesis error:', error);
            setIsAiSpeaking(false);
            setVolume(0);
        }
    };

    const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
        try {
            console.log('DEBUG: Transcribing audio with Groq Whisper (English strictly enforced)...');

            // Convert blob to File
            const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) return '';

            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-large-v3-turbo');
            formData.append('language', 'en');
            formData.append('prompt', 'Technical software engineering interview speech strictly in English.');
            formData.append('temperature', '0');
            formData.append('response_format', 'verbose_json');

            const res = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const transcription = await res.json();

            let rawText = (transcription.text || '').trim();
            console.log('DEBUG: Raw Transcription:', rawText);

            if (!rawText) {
                return '';
            }

            // CRITICAL: Reject Japanese / CJK Unicode characters (Hiragana, Katakana, Kanji, Hangul)
            const hasCjk = /[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uac00-\ud7af]/.test(rawText);
            if (hasCjk) {
                console.log('DEBUG: Filtered out non-English / CJK Whisper artifact:', rawText);
                return '';
            }

            // CRITICAL: Reject common Whisper hallucination subtitles during background silence
            const silenceArtifacts = [
                /thank you for watching/i,
                /thanks for watching/i,
                /subtitles by/i,
                /amara\.org/i,
                /translated by/i,
                /subscribe/i,
                /closed captioning/i
            ];
            if (silenceArtifacts.some(pattern => pattern.test(rawText))) {
                console.log('DEBUG: Filtered out Whisper silence hallucination:', rawText);
                return '';
            }

            return rawText;
        } catch (error: any) {
            console.error('DEBUG: Whisper transcription error:', error);
            return '';
        }
    };

    const handleUserMessage = async (text: string) => {
        if (!text.trim()) return;

        const userMsg: MessageLog = {
            id: Date.now().toString() + '-user',
            role: 'user',
            text: text,
            timestamp: new Date(),
        };
        setLogs(prev => [...prev, userMsg]);
        conversationHistoryRef.current.push({ role: 'user', content: text });

        try {
            console.log('DEBUG: Sending to Groq...');

            const systemPromptContent = contextRef.current ? contextRef.current : SYSTEM_INSTRUCTION;
            const messages = [
                { role: 'system', content: systemPromptContent },
                ...conversationHistoryRef.current
            ];

            console.log('DEBUG: Full messages being sent:', JSON.stringify(messages, null, 2));
            await sendToGroq(messages);

        } catch (error: any) {
            console.error('DEBUG: Groq API Error:', error);

            // Detailed Error Handling
            let errorMessage = "I'm having trouble connecting to my brain right now.";

            if (error?.status === 401) {
                errorMessage = "My API key is missing or invalid. Please check your configuration.";
                toast.error("Groq API Error: 401 Unauthorized. Please check VITE_GROQ_API_KEY in .env");
            } else if (error?.status === 404) {
                errorMessage = "I can't access the AI model. It might be unavailable.";
                toast.error("Groq API Error: 404 Model Not Found. The model may differ or be deprecated.");
            } else if (error?.status === 429) {
                errorMessage = "My brain is tired. Please give me a minute to rest.";
                toast.error("Groq Rate Limit Exceeded (429). Please wait a moment or upgrade plan.");
            } else {
                toast.error(`Voice Interview Error: ${error.message || "Unknown error"}`);
            }

            speakResponse(errorMessage);
        }
    };

    const sendHiddenContext = async (text: string) => {
        console.log('DEBUG: Sending hidden context to Groq:', text);

        // Add as system or user message but NOT to logs
        const contextMsg = { role: 'system' as const, content: `[HIDDEN CONTEXT]: ${text}` };

        // We push to history so AI remembers it, but we DO NOT add to 'logs' state
        conversationHistoryRef.current.push(contextMsg);

        try {
            const messages = [
                { role: 'system', content: SYSTEM_INSTRUCTION + '\n\nCONTEXT:\n' + contextRef.current },
                ...conversationHistoryRef.current
            ];

            await sendToGroq(messages);

        } catch (error: any) {
            console.error("Error sending hidden context:", error);
            // Non-blocking error for context
        }
    };

    const startListening = async () => {
        if (isListeningRef.current || isAiSpeakingRef.current) return;

        // Check if we're still connected before starting
        if (statusRef.current !== LiveStatus.CONNECTED) {
            console.log('DEBUG: Not connected, skipping startListening');
            return;
        }

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream; // Store for cleanup

            // Audio Context for VAD (Voice Activity Detection)
            const audioContext = new AudioContext();
            audioContextRef.current = audioContext; // Store for cleanup

            const source = audioContext.createMediaStreamSource(stream);
            const analyser = audioContext.createAnalyser();
            analyser.fftSize = 256;
            source.connect(analyser);

            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);

            const mediaRecorder = new MediaRecorder(stream, {
                mimeType: 'audio/webm'
            });

            audioChunksRef.current = [];
            isListeningRef.current = true;

            // VAD Variables
            let lastSpeechTime = Date.now();
            let speechStarted = false;
            let silenceTimer: any = null;
            const startTime = Date.now();

            // VAD Sensitivity Settings (volume range: 0-255)
            // Normal speech typically registers 40-100+, quiet speech 20-40
            const SPEECH_THRESHOLD = 20; // Higher threshold filters background noise while catching clear speech
            const SILENCE_AFTER_SPEECH = 1500; // 1.5s silence to detect sentence end (was 2.5s - too long)
            const INITIAL_WAIT_TIMEOUT = 8000; // 8s wait for user to start speaking

            const detectSilence = () => {
                if (!isListeningRef.current) return;

                analyser.getByteFrequencyData(dataArray);

                // Calculate average volume
                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;

                // Update volume for visualizer (normalized 0-1)
                // average is usually 0-100 for speech, max 255. 
                // We divide by 100 to make it responsive, capped at 1 by visualizer.
                setVolume(average / 100);

                if (average > SPEECH_THRESHOLD) {
                    lastSpeechTime = Date.now();
                    if (!speechStarted) {
                        console.log('DEBUG: Speech detected! Vol:', average);
                        speechStarted = true;
                        setIsUserSpeaking(true); // Visual feedback
                    }
                }

                // Logic:
                // 1. If speech started: Wait for 2.5s of silence to finish sentence
                // 2. If NO speech yet: Wait for 10s total before resetting/checking

                const now = Date.now();

                if (speechStarted) {
                    if (now - lastSpeechTime > SILENCE_AFTER_SPEECH) {
                        console.log('DEBUG: End of sentence detected, stopping...');
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                    } else {
                        silenceTimer = requestAnimationFrame(detectSilence);
                    }
                } else {
                    // Still waiting for first word
                    if (now - startTime > INITIAL_WAIT_TIMEOUT) {
                        console.log('DEBUG: No speech detected (timeout), restarting listener...');
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                        // Note: handleUserMessage logic in onstop handles empty audio by ignoring or restarting
                    } else {
                        silenceTimer = requestAnimationFrame(detectSilence);
                    }
                }
            };

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstart = () => {
                console.log('DEBUG: Recording started (Waiting for speech...)');
                // Don't set isUserSpeaking(true) yet - wait for actual voice
                setIsUserSpeaking(false);
                setVolume(0); // Optional: show mic activity only when speaking? or keep showing visualizer
                // Actually visualizer usually needs 'volume' state. 
                // Let's rely on visualizer updating volume in a real app, but here we just pass volume prop.
                // For now, let's allow volume updates for visualizer:

                // Start a volume update loop for visualizer independent of VAD if needed,
                // but current VAD loop calculates average anyway.
                // Let's hook volume setting into detectSilence for smoother UI
                detectSilence();
            };

            mediaRecorder.onstop = async () => {
                console.log('DEBUG: Recording stopped');
                setIsUserSpeaking(false);
                setVolume(0);
                isListeningRef.current = false;

                // Cleanup VAD
                cancelAnimationFrame(silenceTimer);
                if (audioContext && audioContext.state !== 'closed') {
                    audioContext.close().catch(e => console.warn('AudioContext close error:', e));
                }
                stream.getTracks().forEach(track => track.stop());

                // Calculate total size
                const totalSize = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
                console.log('DEBUG: Audio captured size:', totalSize, 'SpeechStarted:', speechStarted);

                // RELAXED CONDITION:
                // Transcribe if speech was detected OR if we captured a significant amount of audio (>10KB)
                // This acts as a failsafe if the VAD threshold was slightly missed but user spoke a lot.
                const hasSignificantAudio = totalSize > 10000;

                if ((speechStarted || hasSignificantAudio) && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const transcription = await transcribeAudio(audioBlob);

                    if (transcription && transcription.trim().length > 0) {
                        await handleUserMessage(transcription);
                    } else {
                        // Transcription empty? Resume listening
                        if (statusRef.current === LiveStatus.CONNECTED) {
                            setTimeout(() => startListening(), 500);
                        }
                    }
                } else {
                    // No speech detected (timed out waiting)
                    console.log('DEBUG: No sufficient speech captured, resuming listening...');
                    if (statusRef.current === LiveStatus.CONNECTED) {
                        startListening();
                    }
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();

            // Hard safety limit (e.g. 60s max recording)
            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 60000);

        } catch (error) {
            console.error('DEBUG: Microphone error:', error);
            setErrorDetails('Microphone access denied. Please allow microphone access.');
            setStatus(LiveStatus.ERROR);
        }
    };

    // Assign startListening to ref so it can be called from speakResponse
    useEffect(() => {
        startListeningRef.current = startListening;
    });

    const connect = useCallback(async (context?: GroqVoiceConnectOptions) => {
        if (status === LiveStatus.CONNECTED) return;

        console.log('DEBUG: Connect called with options:', typeof context === 'string' ? 'string context' : context);
        setStatus(LiveStatus.CONNECTING);

        let initialGreetingText = '';
        let systemPromptText = '';

        if (typeof context === 'string') {
            systemPromptText = context || '';
        } else if (context && typeof context === 'object') {
            systemPromptText = context.systemPrompt || '';
            initialGreetingText = context.initialGreeting || '';
            if (context.mode === 'coding_silent') {
                setIsSilentMode(true);
            }
        }

        contextRef.current = systemPromptText;
        conversationHistoryRef.current = [];

        try {
            // Test microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            setStatus(LiveStatus.CONNECTED);

            // If an explicit initialGreeting was provided (e.g. Round 3 Coding Assessment or Round 2), use it directly!
            if (initialGreetingText) {
                console.log('DEBUG: Using custom initial greeting:', initialGreetingText);
                conversationHistoryRef.current.push({ role: 'assistant', content: initialGreetingText });
                setLogs([{
                    id: 'init',
                    role: 'assistant',
                    text: initialGreetingText,
                    timestamp: new Date()
                }]);
                speakResponse(initialGreetingText);
                return;
            }

            // Otherwise, generate personalized greeting using Groq (English strictly enforced)
            try {
                console.log('DEBUG: Generating personalized greeting in English...');
                const session = await supabase.auth.getSession();
                const token = session.data.session?.access_token;
                if (!token) throw new Error("Not authenticated");

                const makeGreetingReq = async (model: string, msgs: any[], max: number) => {
                    const res = await fetch(`${SUPABASE_URL}/functions/v1/groq-proxy`, {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ messages: msgs, model, temperature: 0.8, max_tokens: max })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return await res.json();
                };

                let greetingCompletion;
                const isCoding = contextRef.current.includes('Round 3') || contextRef.current.includes('Coding Assessment');
                const isProj = contextRef.current.includes('Round 2') || contextRef.current.includes('Project Deep Dive');

                const greetingPrompt = isCoding
                    ? 'Generate a professional 1-2 sentence greeting in English welcoming the candidate to Round 3 Coding Assessment and asking them to explain their initial algorithmic approach to the coding challenge on screen.'
                    : isProj
                    ? 'Generate a professional 1-2 sentence greeting in English welcoming the candidate to Round 2 Project Deep Dive and asking them to introduce their featured project.'
                    : 'Generate a warm, professional, 1-2 sentence English greeting welcoming the candidate to the interview and inviting them to introduce themselves.';

                const defaultFallback = isCoding
                    ? "Hello and welcome to Round 3 — Coding Assessment! Look at the coding challenge on your screen, and let's discuss your initial approach."
                    : isProj
                    ? "Hello and welcome to Round 2 — Project Deep Dive! Walk me through the architecture of your primary project."
                    : "Hello! Welcome to the interview. Please introduce yourself.";

                try {
                    greetingCompletion = await makeGreetingReq('llama-3.3-70b-versatile', [
                        { role: 'system', content: SYSTEM_INSTRUCTION + '\n\nCRITICAL: Respond ONLY in English.\n\nCONTEXT:\n' + contextRef.current },
                        { role: 'user', content: greetingPrompt }
                    ], 100);
                } catch (error: any) {
                    if (error?.message?.includes('429')) {
                        console.log('DEBUG: Rate limit reached during greeting, switching to fallback...');
                        greetingCompletion = await makeGreetingReq('llama-3.1-8b-instant', [
                            { role: 'system', content: SYSTEM_INSTRUCTION + '\n\nCRITICAL: Respond ONLY in English.\n\nCONTEXT:\n' + contextRef.current },
                            { role: 'user', content: greetingPrompt }
                        ], 60);
                    } else {
                        throw error;
                    }
                }

                const greeting = greetingCompletion?.choices?.[0]?.message?.content || defaultFallback;
                console.log('DEBUG: Generated greeting:', greeting);

                conversationHistoryRef.current.push({ role: 'assistant', content: greeting });
                setLogs([{
                    id: 'init',
                    role: 'assistant',
                    text: greeting,
                    timestamp: new Date()
                }]);

                speakResponse(greeting);
            } catch (error) {
                console.error('DEBUG: Failed to generate greeting:', error);
                const isCoding = contextRef.current.includes('Round 3') || contextRef.current.includes('Coding Assessment');
                const isProj = contextRef.current.includes('Round 2') || contextRef.current.includes('Project Deep Dive');
                const fallbackGreeting = isCoding
                    ? "Hello and welcome to Round 3 — Coding Assessment! Look at the coding challenge on your screen, and let's discuss your initial approach."
                    : isProj
                    ? "Hello and welcome to Round 2 — Project Deep Dive! Walk me through the architecture of your primary project."
                    : "Hello! Welcome to the interview. Please introduce yourself.";
                conversationHistoryRef.current.push({ role: 'assistant', content: fallbackGreeting });
                setLogs([{
                    id: 'init',
                    role: 'assistant',
                    text: fallbackGreeting,
                    timestamp: new Date()
                }]);
                speakResponse(fallbackGreeting);
            }
        } catch (e) {
            console.error("DEBUG: Connection failed", e);
            setErrorDetails("Failed to access microphone. Please allow microphone access.");
            setStatus(LiveStatus.ERROR);
        }
    }, [status]);

    const disconnect = useCallback(() => {
        console.log('DEBUG: Disconnect called');
        setStatus(LiveStatus.DISCONNECTED);
        statusRef.current = LiveStatus.DISCONNECTED;
        isListeningRef.current = false;

        // Stop browser speech synthesis immediately
        try {
            window.speechSynthesis.cancel();
        } catch (e) {
            console.log('DEBUG: speechSynthesis cancel note:', e);
        }

        // Stop media recorder
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {
                console.log('DEBUG: MediaRecorder already stopped');
            }
        }
        mediaRecorderRef.current = null;

        // Stop microphone stream
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => {
                track.stop();
                console.log('DEBUG: Stopped track:', track.kind);
            });
            streamRef.current = null;
        }

        // Close audio context
        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch (e) {
                console.log('DEBUG: AudioContext already closed');
            }
            audioContextRef.current = null;
        }

        // Stop audio playback
        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }

        // Stop browser speech synthesis
        window.speechSynthesis.cancel();

        setIsUserSpeaking(false);
        setIsAiSpeaking(false);
        setVolume(0);
    }, []);

    return {
        status,
        connect,
        disconnect,
        isUserSpeaking,
        isAiSpeaking,
        volume,
        logs,
        errorDetails,
        sendHiddenContext,
        apiLabel,
        isSilentMode,
        setIsSilentMode
    };
}
