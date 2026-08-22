import { useState, useRef, useCallback, useEffect } from 'react';
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
- NEVER ask resume, college, education, degree, project, or introductory questions.
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
    // 1. ALL useState hooks grouped at top to strictly preserve hook ordering across renders
    const [status, setStatus] = useState<LiveStatus>(LiveStatus.DISCONNECTED);
    const [isSilentMode, _setIsSilentMode] = useState<boolean>(false);
    const [errorDetails, setErrorDetails] = useState<string | null>(null);
    const [isUserSpeaking, setIsUserSpeaking] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [volume, setVolume] = useState(0);
    const [logs, setLogs] = useState<MessageLog[]>([]);
    const [apiLabel, setApiLabel] = useState<string>('(primary 3.1)');

    // 2. All useRef hooks
    const isSilentModeRef = useRef<boolean>(false);
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
    const startListeningRef = useRef<() => Promise<void>>();

    // Sync refs with state
    useEffect(() => {
        statusRef.current = status;
        isAiSpeakingRef.current = isAiSpeaking;
        isSilentModeRef.current = isSilentMode;
    }, [status, isAiSpeaking, isSilentMode]);

    // Setter for silent mode that immediately shuts down physical audio capture/output
    const setIsSilentMode = useCallback((silent: boolean) => {
        console.log('[useGroqVoice] setIsSilentMode:', silent);
        isSilentModeRef.current = silent;
        _setIsSilentMode(silent);

        if (silent) {
            // Hard silence: Stop microphone recording, stream tracks, and speech synthesis
            isListeningRef.current = false;
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try {
                    mediaRecorderRef.current.stop();
                } catch (e) { }
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    audioContextRef.current.close();
                } catch (e) { }
                audioContextRef.current = null;
            }
            try {
                window.speechSynthesis.cancel();
            } catch (e) { }
            setIsAiSpeaking(false);
            setIsUserSpeaking(false);
            setVolume(0);
        }
    }, []);

    // Helper to send messages to AI engine
    const sendToGroq = async (fullMessages: any[]) => {
        // If candidate is actively coding, AI must remain 100% silent
        if (isSilentModeRef.current) {
            console.log('[useGroqVoice] isSilentMode is TRUE. Candidate is coding — AI will not generate or speak responses.');
            return;
        }

        let aiText = "";

        const sysPrompt = fullMessages.find((m: any) => m.role === 'system')?.content || contextRef.current || '';
        // STRICT regex: Must explicitly specify it is Round 3 or Live Coding Assessment to prevent matching resume keywords
        const isCodingRound = /ROUND\s*3:\s*LIVE\s*CODING\s*ASSESSMENT|CURRENT\s*ROUND:\s*Round\s*3/i.test(sysPrompt);
        const isHRRound = /CURRENT\s*ROUND:\s*Round\s*4|ROUND\s*4:\s*ENGINEERING\s*MANAGER/i.test(sysPrompt);        // 1. EXTRACT PREVIOUS QUESTIONS FOR STRICT ANTI-REPETITION
        const previousAssistantQuestions = conversationHistoryRef.current
            .filter((m: any) => m.role === 'assistant')
            .map((m: any) => (m.content || '').trim())
            .filter(Boolean);

        const turnCount = previousAssistantQuestions.length;

        // Prepare Gemini contents payload (alternating user/model, starting with user)
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

        const antiRepetitionRule = previousAssistantQuestions.length > 0
            ? `\n\nSTRICT NO-REPEAT RULE (DO NOT REPEAT PREVIOUS QUESTIONS):\nYou have already asked the candidate the following questions in this session:\n${previousAssistantQuestions.map((q, idx) => `${idx + 1}. "${q}"`).join('\n')}\nYOU MUST NEVER REPEAT, REPHRASE, OR ASK SIMILAR QUESTIONS TO ANY OF THE ABOVE. Ask a new, focused question that deepens the technical discussion based on their latest answer.`
            : '';

        // ================= ENGINE 1: SECURE SUPABASE EDGE FUNCTION (interview-chat) =================
        // Server-side with PRO_INTERVIEW_GEMINI_KEY / GOOGLE_API_KEY - 100% private & instant
        if (!aiText && !isCodingRound) {
            try {
                console.log(`[Pro Interview] Calling secure interview-chat Edge Function (Turn ${turnCount + 1})...`);
                const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('interview-chat', {
                    body: { 
                        messages: fullMessages,
                        interviewType: isHRRound ? 'behavioral' : 'pro_interview',
                        systemPrompt: sysPrompt
                    }
                });

                const responseText = edgeData?.question || edgeData?.content || edgeData?.response;
                const detectedLabel = edgeData?.apiLabel || edgeData?.providerInfo?.apiLabel;
                if (detectedLabel) {
                    setApiLabel(detectedLabel);
                }

                if (!edgeErr && responseText && typeof responseText === 'string' && responseText.trim().length > 0) {
                    aiText = responseText.trim();
                    console.log('✓ Edge Function generated question:', aiText, 'API:', detectedLabel || '(edge function)');
                } else if (edgeErr) {
                    console.warn('[useGroqVoice] Edge Function error, falling back:', edgeErr);
                }
            } catch (edgeEx) {
                console.warn('[useGroqVoice] Edge Function exception, falling back:', edgeEx);
            }
        }

        // ================= ENGINE 2: DIRECT GEMINI DEV FALLBACK (Only if local key is valid) =================
        const proInterviewGeminiKey = import.meta.env.VITE_PRO_INTERVIEW_GEMINI_KEY || import.meta.env.VITE_GEMINI_API_KEY;
        if (!aiText && proInterviewGeminiKey && proInterviewGeminiKey.startsWith('AQ.')) {
            const geminiModels = ['gemini-3.1-flash-lite', 'gemini-3.5-flash-lite', 'gemini-flash-lite-latest'];
            for (const model of geminiModels) {
                try {
                    console.log(`[Pro Interview] Local fallback with Dedicated Gemini (${model}, Turn ${turnCount + 1})...`);

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
                        if (text && text.trim().length > 0) {
                            aiText = text.trim();
                            setApiLabel(`(gemini ${model.replace('gemini-', '')})`);
                            console.log(`✓ Gemini (${model}) generated:`, aiText);
                            break;
                        }
                    }
                } catch (geminiErr) {
                    console.warn(`Gemini (${model}) exception:`, geminiErr);
                }
            }
        }

        // ================= ENGINE 3: DIRECT GROQ API (Llama 3.3 70B) =================
        if (!aiText) {
            try {
                console.log('[useGroqVoice] Fallback to Direct Groq API (Llama 3.3 70B)...');
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
                            model: "llama-3.3-70b-versatile",
                            messages: groqMessages.slice(-10),
                            temperature: 0.7,
                            max_tokens: 200,
                        })
                    });
                    if (res.ok) {
                        const groqData = await res.json();
                        if (groqData?.choices?.[0]?.message?.content) {
                            aiText = groqData.choices[0].message.content.trim();
                            setApiLabel('(groq 3.3 direct)');
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
            console.warn('[useGroqVoice] Using non-repeating progressive question fallback.');
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
                    "Tell me about a time you had to make a difficult technical trade-off between speed of delivery and code maintainability.",
                    "How do you approach automated testing, continuous integration, and error monitoring for your services?",
                    "What is a recent technical skill, framework, or architectural pattern you've been learning to grow your engineering toolkit?",
                    "Thank you for sharing those insights! Where do you see your engineering career heading in the next few years?"
                ];
                // Select first question that hasn't been asked yet
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
                console.warn('[useGroqVoice] Intercepted and blocked forbidden resume question in Round 3:', aiText);
                aiText = "Please explain your in-depth algorithmic approach step-by-step to solve the problem on screen before you start coding.";
            }
        }

        // If candidate is coding (isSilentMode is true), do NOT speak or log AI message
        if (isSilentModeRef.current) {
            console.log('[useGroqVoice] Candidate is coding (isSilentMode=true). Suppressing AI voice output.');
            return;
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

        // If in silent mode, do not speak
        if (isSilentModeRef.current) {
            console.log('[useGroqVoice] isSilentMode is true, skipping speakResponse');
            return;
        }

        // Strip out tokens and hidden content for speech
        let speechText = text
            .replace(/\[START_CODING\]/g, '')
            .replace(/\[END_CODING\]/g, '')
            .replace(/\[VERDICT:[^\]]*\]/g, '')
            .replace(/\[REASON:[^\]]*\]/g, '');

        if (speechText.includes('[DETAILED_FEEDBACK]')) {
            speechText = speechText.split('[DETAILED_FEEDBACK]')[0];
        }

        speechText = speechText.trim();
        if (!speechText || statusRef.current === LiveStatus.DISCONNECTED) {
            try {
                window.speechSynthesis.cancel();
            } catch (e) { }
            return;
        }

        try {
            console.log('DEBUG: Speaking AI response via Web Speech API:', speechText);

            if (resumeTimerRef.current) {
                clearInterval(resumeTimerRef.current);
                resumeTimerRef.current = null;
            }

            if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
                window.speechSynthesis.cancel();
                await new Promise(r => setTimeout(r, 60));
            }

            if (window.speechSynthesis.paused) {
                window.speechSynthesis.resume();
            }

            setIsAiSpeaking(true);
            setVolume(0.8);

            const utterance = new SpeechSynthesisUtterance(speechText);
            activeUtteranceRef.current = utterance;
            (window as any).__vokeUtterance = utterance;

            let voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v =>
                (v.lang.includes('en') || v.lang.includes('EN')) &&
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Online') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Guy'))
            ) || voices.find(v => v.lang.startsWith('en')) || voices[0];

            if (preferredVoice) {
                utterance.voice = preferredVoice;
                utterance.lang = preferredVoice.lang || 'en-US';
            } else {
                utterance.lang = 'en-US';
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            resumeTimerRef.current = setInterval(() => {
                if (window.speechSynthesis.speaking && window.speechSynthesis.paused) {
                    window.speechSynthesis.resume();
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

                // Resume candidate microphone listening ONLY if NOT in silent mode!
                if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED && startListeningRef.current) {
                    setTimeout(() => {
                        if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED && !isAiSpeakingRef.current) {
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

                if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED && startListeningRef.current) {
                    setTimeout(() => {
                        if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED && !isAiSpeakingRef.current) {
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

            if (!res.ok) {
                console.warn(`Groq Proxy Whisper failed (HTTP ${res.status}), trying direct API...`);
                const directApiKey = import.meta.env.VITE_GROQ_API_KEY;
                if (directApiKey) {
                    const directRes = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${directApiKey}` },
                        body: formData
                    });
                    if (directRes.ok) {
                        const directData = await directRes.json();
                        return directData.text || '';
                    }
                }
                return '';
            }

            const data = await res.json();
            const text = data.text || '';
            console.log('DEBUG: Raw Transcription:', text);
            return text;

        } catch (error) {
            console.error('DEBUG: Whisper transcription error:', error);
            return '';
        }
    };

    const handleUserMessage = async (text: string) => {
        if (!text.trim()) return;

        // If candidate is actively coding (isSilentMode is true), do NOT call AI or log
        if (isSilentModeRef.current) {
            console.log('[useGroqVoice] Candidate is coding (isSilentMode=true). AI stays completely silent.');
            return;
        }

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
            const errorMessage = "I'm having trouble connecting to my brain right now.";
            speakResponse(errorMessage);
        }
    };

    const sendHiddenContext = async (text: string) => {
        console.log('DEBUG: Sending hidden context to Groq:', text);
        const contextMsg = { role: 'system' as const, content: `[HIDDEN CONTEXT]: ${text}` };
        conversationHistoryRef.current.push(contextMsg);

        try {
            const messages = [
                { role: 'system', content: SYSTEM_INSTRUCTION + '\n\nCONTEXT:\n' + contextRef.current },
                ...conversationHistoryRef.current
            ];
            await sendToGroq(messages);
        } catch (e) {
            console.error('DEBUG: sendHiddenContext error:', e);
        }
    };

    const recognitionRef = useRef<any>(null);

    const submitCurrentSpeech = useCallback(() => {
        if (recognitionRef.current) {
            try {
                console.log('[useGroqVoice] Manual submit: stopping recognition.');
                recognitionRef.current.stop();
            } catch (e) { }
        } else if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                console.log('[useGroqVoice] Manual submit: stopping mediaRecorder.');
                mediaRecorderRef.current.stop();
            } catch (e) { }
        }
    }, []);

    const startMediaRecorderListening = async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
            if (audioContext.state === 'suspended') {
                await audioContext.resume();
            }
            audioContextRef.current = audioContext;

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

            let speechStarted = false;
            let lastSpeechTime = Date.now();
            let silenceTimer: any = null;
            const startTime = Date.now();
            let ambientFloor = 8;

            const detectSilence = () => {
                if (!isListeningRef.current || isSilentModeRef.current) return;

                analyser.getByteFrequencyData(dataArray);

                let voiceBandSum = 0;
                const minBin = 3;
                const maxBin = Math.min(28, bufferLength);
                for (let i = minBin; i < maxBin; i++) {
                    voiceBandSum += dataArray[i];
                }
                const voiceVolume = voiceBandSum / (maxBin - minBin);

                setVolume(voiceVolume / 100);

                const elapsed = Date.now() - startTime;
                if (elapsed < 250) {
                    ambientFloor = Math.max(ambientFloor, voiceVolume);
                }

                const speechThreshold = Math.max(18, ambientFloor + 10);

                if (voiceVolume > speechThreshold) {
                    if (!speechStarted) {
                        speechStarted = true;
                        setIsUserSpeaking(true);
                    }
                    lastSpeechTime = Date.now();
                } else if (speechStarted) {
                    const elapsedSilence = Date.now() - lastSpeechTime;
                    if (elapsedSilence > 500) {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                        return;
                    }
                } else {
                    if (elapsed > 4000) {
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                        return;
                    }
                }

                silenceTimer = requestAnimationFrame(detectSilence);
            };

            mediaRecorder.onstart = () => {
                audioChunksRef.current = [];
                detectSilence();
            };

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                setIsUserSpeaking(false);
                setVolume(0);
                isListeningRef.current = false;

                cancelAnimationFrame(silenceTimer);
                if (audioContext && audioContext.state !== 'closed') {
                    audioContext.close().catch(e => console.warn('AudioContext close error:', e));
                }
                stream.getTracks().forEach(track => track.stop());

                if (isSilentModeRef.current) return;

                const totalSize = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
                const hasSignificantAudio = totalSize > 2500;

                if ((speechStarted || hasSignificantAudio) && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const transcription = await transcribeAudio(audioBlob);

                    if (transcription && transcription.trim().length > 0) {
                        await handleUserMessage(transcription);
                    } else {
                        if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED) {
                            setTimeout(() => startListening(), 250);
                        }
                    }
                } else {
                    if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED) {
                        startListening();
                    }
                }
            };

            mediaRecorderRef.current = mediaRecorder;
            mediaRecorder.start();

            setTimeout(() => {
                if (mediaRecorder.state === 'recording') {
                    mediaRecorder.stop();
                }
            }, 25000);

        } catch (error) {
            console.error('[useGroqVoice] MediaRecorder error:', error);
            setErrorDetails('Microphone access denied. Please allow microphone access.');
            setStatus(LiveStatus.ERROR);
        }
    };

    const startListening = async () => {
        // Strict guard: If coding or already speaking/listening, abort immediately
        if (isSilentModeRef.current) {
            console.log('[useGroqVoice] isSilentMode is true. Skipping startListening — candidate is coding.');
            return;
        }
        if (isListeningRef.current || isAiSpeakingRef.current) return;
        if (statusRef.current !== LiveStatus.CONNECTED) return;

        const SpeechRecognition = typeof window !== 'undefined' ? ((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition) : null;

        if (SpeechRecognition) {
            try {
                const recognition = new SpeechRecognition();
                recognitionRef.current = recognition;
                recognition.lang = 'en-US';
                recognition.continuous = false;
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                let speechDetected = false;
                let capturedTranscript = '';

                recognition.onstart = () => {
                    console.log('[useGroqVoice] Native SpeechRecognition active (listening)...');
                    isListeningRef.current = true;
                    setIsUserSpeaking(false);
                };

                recognition.onspeechstart = () => {
                    console.log('[useGroqVoice] Candidate speech started!');
                    speechDetected = true;
                    setIsUserSpeaking(true);
                    setVolume(0.7);
                };

                recognition.onresult = (event: any) => {
                    let currentTranscript = '';
                    for (let i = event.resultIndex; i < event.results.length; ++i) {
                        currentTranscript += event.results[i][0].transcript;
                    }
                    if (currentTranscript && currentTranscript.trim().length > 0) {
                        capturedTranscript = currentTranscript.trim();
                        setIsUserSpeaking(true);
                        setVolume(0.8);
                    }
                };

                recognition.onspeechend = () => {
                    console.log('[useGroqVoice] Native onspeechend: Candidate stopped talking. Cutting off instantly!');
                    setIsUserSpeaking(false);
                    setVolume(0);
                };

                recognition.onend = async () => {
                    console.log('[useGroqVoice] Native SpeechRecognition cycle complete. Captured:', capturedTranscript);
                    isListeningRef.current = false;
                    setIsUserSpeaking(false);
                    setVolume(0);
                    recognitionRef.current = null;

                    if (capturedTranscript && capturedTranscript.trim().length > 0) {
                        await handleUserMessage(capturedTranscript.trim());
                    } else if (speechDetected) {
                        if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED && !isAiSpeakingRef.current) {
                            setTimeout(() => startListening(), 200);
                        }
                    } else {
                        if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED && !isAiSpeakingRef.current) {
                            startListening();
                        }
                    }
                };

                recognition.onerror = (event: any) => {
                    console.warn('[useGroqVoice] SpeechRecognition note:', event.error);
                    isListeningRef.current = false;
                    setIsUserSpeaking(false);
                    setVolume(0);
                    recognitionRef.current = null;

                    if (event.error === 'not-allowed' || event.error === 'service-not-allowed') {
                        startMediaRecorderListening();
                    } else {
                        if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED && !isAiSpeakingRef.current) {
                            setTimeout(() => startListening(), 300);
                        }
                    }
                };

                recognition.start();
                return;
            } catch (err) {
                console.warn('[useGroqVoice] SpeechRecognition initialization error, falling back to MediaRecorder:', err);
            }
        }

        // Fallback to MediaRecorder + Whisper
        await startMediaRecorderListening();
    };

    useEffect(() => {
        startListeningRef.current = startListening;
    });

    // Cleanup on unmount to prevent orphaned Vite HMR listeners
    useEffect(() => {
        return () => {
            console.log('[useGroqVoice] Unmount cleanup triggered.');
            statusRef.current = LiveStatus.DISCONNECTED;
            isListeningRef.current = false;
            if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
                try { mediaRecorderRef.current.stop(); } catch (e) { }
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try { audioContextRef.current.close(); } catch (e) { }
                audioContextRef.current = null;
            }
            try {
                window.speechSynthesis.cancel();
            } catch (e) { }
        };
    }, []);

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
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            setStatus(LiveStatus.CONNECTED);

            // Custom initial greeting
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

            // Fallback greeting
            const fallbackGreeting = "Welcome! Let's get started. Could you please introduce yourself, your technical background, and give me a brief overview of the main projects on your resume?";
            conversationHistoryRef.current.push({ role: 'assistant', content: fallbackGreeting });
            setLogs([{
                id: 'init',
                role: 'assistant',
                text: fallbackGreeting,
                timestamp: new Date()
            }]);
            speakResponse(fallbackGreeting);

        } catch (e) {
            console.error("DEBUG: Connection failed", e);
            setErrorDetails("Failed to access microphone. Please allow microphone access.");
            setStatus(LiveStatus.ERROR);
        }
    }, [status, setIsSilentMode]);

    const disconnect = useCallback(() => {
        console.log('DEBUG: Disconnect called');
        setStatus(LiveStatus.DISCONNECTED);
        statusRef.current = LiveStatus.DISCONNECTED;
        isListeningRef.current = false;

        try {
            window.speechSynthesis.cancel();
        } catch (e) { }

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) { }
        }
        mediaRecorderRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch (e) { }
            audioContextRef.current = null;
        }

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = '';
            audioRef.current = null;
        }

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
        setIsSilentMode,
        submitCurrentSpeech
    };
}
