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
                } catch (e) {}
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try {
                    audioContextRef.current.close();
                } catch (e) {}
                audioContextRef.current = null;
            }
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
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
        const isCodingRound = /round\s*3|coding|live\s*coding|assessment|two\s*sum|longest\s*substring|algorithm|debugging|system\s*design|approach\s*phase/i.test(sysPrompt);
        const isHRRound = /round\s*4|hr\s*manager|behavioral/i.test(sysPrompt);

        // FOR CODING ASSESSMENT (ROUND 3): Directly invoke Gemini API or Groq with strict Coding Prompt
        // DO NOT call the screening edge function for coding rounds to prevent any turn-based screening questions
        if (isCodingRound) {
            const geminiApiKey = import.meta.env.VITE_GEMINI_API_KEY;
            if (geminiApiKey) {
                try {
                    console.log('DEBUG: Coding Assessment - Generating response directly with Gemini 3.1 Flash Lite...');
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
                        contents.unshift({ role: 'user', parts: [{ text: 'I am explaining my algorithmic approach.' }] });
                    }

                    const codingDirective = `\n\nCRITICAL ROUND 3 TECHNICAL CODING MANDATE:
1. START QUESTION: Ask ONLY for the candidate's algorithmic approach to solve the problem on screen.
2. STRICT APPROACH VERIFICATION (MINIMUM 75% DEPTH & ACCURACY REQUIRED):
   - Candidate MUST explain the actual step-by-step logic (e.g. how data structures/pointers are initialized, loop conditions, how values are checked/stored, and how the answer is constructed).
   - If candidate only gives a superficial, brief, or 1-word answer (e.g. "I will use hash map" or "two pointers" without explaining the step-by-step mechanics): DO NOT unlock. Ask a probing follow-up: "That is a good starting concept, but please explain step-by-step how your algorithm will iterate and handle the problem."
   - When the candidate provides a clear, in-depth algorithmic explanation (at least 75% accurate and complete), say EXACTLY:
   "[APPROACH_VERIFIED] Excellent explanation! The code editor is now unlocked — go ahead and code your solution."
3. CODING PHASE: When candidate is actively coding, be 100% SILENT. Do NOT ask any questions.
4. POST-RUN PHASE: When candidate runs code and all tests pass, ask ONLY these 4 technical questions in sequence (1 at a time):
   (1) What is the exact Time Complexity Big-O?
   (2) What is the Auxiliary Space Complexity?
   (3) What edge cases could break this solution?
   (4) Can this solution be further optimized?
5. ABSOLUTE PROHIBITION: NEVER ask resume, college, education, degree, school, project, or background questions. EVER. Keep responses concise (1-2 sentences max).`;

                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-lite:generateContent?key=${geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: contents.slice(-6),
                            systemInstruction: { parts: [{ text: sysPrompt + codingDirective }] },
                            generationConfig: { temperature: 0.2, maxOutputTokens: 120 }
                        })
                    });

                    if (res.ok) {
                        const json = await res.json();
                        const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (text && text.trim()) {
                            aiText = text.trim();
                            setApiLabel('(gemini 3.1 coding)');
                            console.log('✓ Coding Assessment response generated directly:', aiText);
                        }
                    }
                } catch (geminiErr) {
                    console.warn('Direct Gemini Coding API exception:', geminiErr);
                }
            }
        }

        // PRIMARY ENGINE FOR OTHER ROUNDS (OR FALLBACK): interview-chat Edge Function
        if (!aiText && !isCodingRound && !isHRRound) {
            try {
                console.log('DEBUG: Primary - Generating question with interview-chat Edge Function...');
                const { data: edgeData, error: edgeErr } = await supabase.functions.invoke('interview-chat', {
                    body: { 
                        messages: fullMessages,
                        interviewType: 'screening'
                    }
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
        }

        // TERTIARY FALLBACK & HR ROUND ENGINE: Direct Groq API
        if (!aiText) {
            try {
                console.log('DEBUG: Generating question with Direct Groq API (Llama 3.3 70B)...');
                const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
                if (groqApiKey) {
                    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${groqApiKey}`,
                            "Content-Type": "application/json"
                        },
                        body: JSON.stringify({
                            model: "llama-3.3-70b-versatile",
                            messages: fullMessages,
                            temperature: 0.5,
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

        // LAST RESORT: Emergency deterministic response
        if (!aiText) {
            if (isCodingRound) {
                aiText = "Please explain your in-depth algorithmic approach step-by-step before we unlock the code editor.";
            } else {
                aiText = "Could you tell me more about your technical experience?";
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
            } catch (e) {}
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

    const startListening = async () => {
        // Strict guard: If coding or already speaking/listening, abort immediately
        if (isSilentModeRef.current) {
            console.log('[useGroqVoice] isSilentMode is true. Skipping startListening — candidate is coding.');
            return;
        }
        if (isListeningRef.current || isAiSpeakingRef.current) return;
        if (statusRef.current !== LiveStatus.CONNECTED) return;

        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            streamRef.current = stream;

            const audioContext = new AudioContext();
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

            let lastSpeechTime = Date.now();
            let speechStarted = false;
            let silenceTimer: any = null;
            const startTime = Date.now();

            const SPEECH_THRESHOLD = 20;
            const SILENCE_AFTER_SPEECH = 1500;
            const INITIAL_WAIT_TIMEOUT = 8000;

            const detectSilence = () => {
                if (!isListeningRef.current || isSilentModeRef.current) return;

                analyser.getByteFrequencyData(dataArray);

                let sum = 0;
                for (let i = 0; i < bufferLength; i++) {
                    sum += dataArray[i];
                }
                const average = sum / bufferLength;

                setVolume(average / 100);

                if (average > SPEECH_THRESHOLD) {
                    if (!speechStarted) {
                        console.log('DEBUG: Speech detected! Vol:', average);
                        speechStarted = true;
                        setIsUserSpeaking(true);
                    }
                    lastSpeechTime = Date.now();
                } else if (speechStarted) {
                    const elapsedSilence = Date.now() - lastSpeechTime;
                    if (elapsedSilence > SILENCE_AFTER_SPEECH) {
                        console.log('DEBUG: End of sentence detected, stopping...');
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                        return;
                    }
                } else {
                    const totalWait = Date.now() - startTime;
                    if (totalWait > INITIAL_WAIT_TIMEOUT) {
                        console.log('DEBUG: No speech detected (timeout), restarting listener...');
                        if (mediaRecorder.state === 'recording') {
                            mediaRecorder.stop();
                        }
                        return;
                    }
                }

                silenceTimer = requestAnimationFrame(detectSilence);
            };

            mediaRecorder.onstart = () => {
                console.log('DEBUG: Recording started (Waiting for speech...)');
                audioChunksRef.current = [];
                detectSilence();
            };

            mediaRecorder.ondataavailable = (event) => {
                if (event.data.size > 0) {
                    audioChunksRef.current.push(event.data);
                }
            };

            mediaRecorder.onstop = async () => {
                console.log('DEBUG: Recording stopped');
                setIsUserSpeaking(false);
                setVolume(0);
                isListeningRef.current = false;

                cancelAnimationFrame(silenceTimer);
                if (audioContext && audioContext.state !== 'closed') {
                    audioContext.close().catch(e => console.warn('AudioContext close error:', e));
                }
                stream.getTracks().forEach(track => track.stop());

                // If candidate unlocked the editor while recording was ending, DO NOT PROCESS!
                if (isSilentModeRef.current) {
                    console.log('[useGroqVoice] isSilentMode became TRUE during recording. Discarding audio.');
                    return;
                }

                const totalSize = audioChunksRef.current.reduce((acc, chunk) => acc + chunk.size, 0);
                console.log('DEBUG: Audio captured size:', totalSize, 'SpeechStarted:', speechStarted);

                const hasSignificantAudio = totalSize > 10000;

                if ((speechStarted || hasSignificantAudio) && audioChunksRef.current.length > 0) {
                    const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
                    const transcription = await transcribeAudio(audioBlob);

                    if (transcription && transcription.trim().length > 0) {
                        await handleUserMessage(transcription);
                    } else {
                        if (!isSilentModeRef.current && statusRef.current === LiveStatus.CONNECTED) {
                            setTimeout(() => startListening(), 500);
                        }
                    }
                } else {
                    console.log('DEBUG: No sufficient speech captured, restarting listening...');
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
            }, 60000);

        } catch (error) {
            console.error('DEBUG: Microphone error:', error);
            setErrorDetails('Microphone access denied. Please allow microphone access.');
            setStatus(LiveStatus.ERROR);
        }
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
                try { mediaRecorderRef.current.stop(); } catch (e) {}
            }
            if (streamRef.current) {
                streamRef.current.getTracks().forEach(t => t.stop());
                streamRef.current = null;
            }
            if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
                try { audioContextRef.current.close(); } catch (e) {}
                audioContextRef.current = null;
            }
            try {
                window.speechSynthesis.cancel();
            } catch (e) {}
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

            // Custom initial greeting (e.g. Round 3 Coding Assessment)
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
            const fallbackGreeting = "Welcome! I'm ready to begin your technical interview.";
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
        } catch (e) {}

        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
            try {
                mediaRecorderRef.current.stop();
            } catch (e) {}
        }
        mediaRecorderRef.current = null;

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }

        if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
            try {
                audioContextRef.current.close();
            } catch (e) {}
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
        setIsSilentMode
    };
}
