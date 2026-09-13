import { useState, useRef, useCallback, useEffect } from 'react';
import { supabase, SUPABASE_URL } from "@/integrations/supabase/client";
import { LiveStatus, MessageLog } from '../types/voice';
import { toast } from 'sonner';
import { useTokenCounter } from '../contexts/TokenContext';
import { IVoiceBrain } from '../services/voice/VoiceBrainInterface';

export type GroqVoiceConnectOptions = string | {
    systemPrompt?: string;
    initialGreeting?: string;
    mode?: 'conversational' | 'coding_silent';
    fixedQuestions?: string[];
    enableAutoCodingTransition?: boolean;
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
    submitCurrentSpeech: () => void;
    speakText: (text: string) => Promise<void>;
}

interface UseGroqVoiceProps {
    apiKey?: string;
    brain?: IVoiceBrain;
}

export function useGroqVoice(props?: UseGroqVoiceProps): UseGroqVoiceReturn {
    const { addTokens } = useTokenCounter();
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
    const fixedQuestionsRef = useRef<string[] | null>(null);
    const fixedQuestionIndexRef = useRef<number>(0);
    const autoCodingRef = useRef<boolean>(false);
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

        // ================= ENGINE 0: STRICT COLLEGE FIXED QUESTION MODE (0 TOKEN CONSUMPTION) =================
        if (fixedQuestionsRef.current && fixedQuestionsRef.current.length > 0) {
            const questions = fixedQuestionsRef.current;
            const nextIndex = fixedQuestionIndexRef.current + 1;
            fixedQuestionIndexRef.current = nextIndex;

            if (nextIndex < questions.length) {
                const nextQ = questions[nextIndex];
                const politeTransitions = [
                    "Thank you. Next question: ",
                    "Got it. Moving on to the next question: ",
                    "Understood. Here is your next question: ",
                    "Thank you for explaining that. Next question: "
                ];
                const transition = politeTransitions[(nextIndex - 1) % politeTransitions.length];
                aiText = `${transition}${nextQ}`;
            } else {
                aiText = "Thank you for answering all questions in this placement assessment round! Please click the red Finish button below to finalize your session and generate your official evaluation scorecard.";
            }
            setApiLabel('(college uploaded questions • 0 tokens)');
            console.log(`[useGroqVoice] College Fixed Question Progression (Turn ${nextIndex + 1}/${questions.length}):`, aiText);
        }

        const sysPrompt = fullMessages.find((m: any) => m.role === 'system')?.content || contextRef.current || '';

        if (!aiText && props?.brain) {
            try {
                const response = await props.brain.generateNextQuestion(fullMessages, sysPrompt, addTokens);
                aiText = response.text;
                if (response.apiLabel) {
                    setApiLabel(response.apiLabel);
                }
            } catch (err) {
                console.error('[useGroqVoice] Brain error:', err);
                aiText = "I'm having trouble thinking right now. Let's move on.";
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

            if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
                window.speechSynthesis.resume();
                window.speechSynthesis.cancel();
                await new Promise(r => setTimeout(r, 60));

                setIsAiSpeaking(true);
                setVolume(0.8);

                const utterance = new SpeechSynthesisUtterance(speechText);
                activeUtteranceRef.current = utterance;
                (window as any).__vokeUtterance = utterance;

                let voices = window.speechSynthesis.getVoices();
                if (voices.length === 0) {
                    await new Promise(resolve => {
                        const handler = () => {
                            window.speechSynthesis.removeEventListener('voiceschanged', handler);
                            resolve(null);
                        };
                        window.speechSynthesis.addEventListener('voiceschanged', handler);
                        setTimeout(resolve, 150);
                    });
                    voices = window.speechSynthesis.getVoices();
                }

                const preferredVoice = voices.find(v =>
                    (v.lang.includes('en') || v.lang.includes('EN')) &&
                    (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Neural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Alex'))
                ) || voices.find(v => v.lang.startsWith('en')) || (voices.length > 0 ? voices[0] : undefined);

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
                }, 2000);

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
            }
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

    const handleUserMessage = async (message: string) => {
        if (!message || message.trim() === '') return;

        if (statusRef.current !== LiveStatus.CONNECTED) {
            console.log('[useGroqVoice] Ignored user message because status is not CONNECTED.');
            return;
        }

        const text = message;
        console.log('DEBUG: User said:', text);

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
            
            // Calculate how many AI questions have been asked (excluding system/assistant greeting)
            const aiQuestionCount = conversationHistoryRef.current.filter(m => m.role === 'assistant').length;
            
            let turnDirective = "";
            if (autoCodingRef.current) {
                if (aiQuestionCount >= 8 && aiQuestionCount < 11) {
                    turnDirective = "\n\n[SYSTEM NOTE: You have asked enough theoretical questions. In your next response, you MUST say '[START_CODING]' and give a coding problem.]";
                } else if (aiQuestionCount >= 11) {
                    turnDirective = "\n\n[SYSTEM NOTE: The interview is over. You MUST end the interview NOW by saying '[VERDICT:PASS]' or '[VERDICT:FAIL]'. Do not ask any more questions.]";
                }
            }

            // Create a copy of the history to inject the directive into the last message
            const modifiedHistory = [...conversationHistoryRef.current];
            if (turnDirective && modifiedHistory.length > 0) {
                const lastMsg = modifiedHistory[modifiedHistory.length - 1];
                if (lastMsg.role === 'user') {
                    modifiedHistory[modifiedHistory.length - 1] = {
                        ...lastMsg,
                        content: lastMsg.content + turnDirective
                    };
                }
            }

            const messages = [
                { role: 'system', content: systemPromptContent },
                ...modifiedHistory
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
                recognition.continuous = true; // Use continuous mode to prevent cutoffs
                recognition.interimResults = true;
                recognition.maxAlternatives = 1;

                let speechDetected = false;
                let capturedTranscript = '';
                let silenceTimer: NodeJS.Timeout | null = null;

                const resetSilenceTimer = () => {
                    if (silenceTimer) clearTimeout(silenceTimer);
                    silenceTimer = setTimeout(() => {
                        if (recognitionRef.current && isListeningRef.current) {
                            console.log('[useGroqVoice] Silence detected. Stopping recognition manually.');
                            try { recognitionRef.current.stop(); } catch (e) { }
                        }
                    }, 2500); // Wait 2.5s after last word before auto-submitting
                };

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
                    resetSilenceTimer();
                };

                recognition.onresult = (event: any) => {
                    let fullTranscript = '';
                    // Loop from 0 to capture the ENTIRE sentence, not just the latest chunk
                    for (let i = 0; i < event.results.length; ++i) {
                        fullTranscript += event.results[i][0].transcript;
                    }
                    if (fullTranscript && fullTranscript.trim().length > 0) {
                        capturedTranscript = fullTranscript.trim();
                        setIsUserSpeaking(true);
                        setVolume(0.8);
                        resetSilenceTimer(); // Reset timer every time a new word is recognized
                    }
                };

                recognition.onspeechend = () => {
                    console.log('[useGroqVoice] Native onspeechend: Candidate stopped talking temporarily.');
                    setIsUserSpeaking(false);
                    setVolume(0);
                    // Do not stop instantly here; let the silenceTimer or continuous mode handle it
                };

                recognition.onend = async () => {
                    if (silenceTimer) clearTimeout(silenceTimer);
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
            fixedQuestionsRef.current = null;
            fixedQuestionIndexRef.current = 0;
            autoCodingRef.current = false;
        } else if (context && typeof context === 'object') {
            systemPromptText = context.systemPrompt || '';
            initialGreetingText = context.initialGreeting || '';
            autoCodingRef.current = !!context.enableAutoCodingTransition;
            
            if (context.mode === 'coding_silent') {
                setIsSilentMode(true);
            }
            if (context.fixedQuestions && context.fixedQuestions.length > 0) {
                fixedQuestionsRef.current = context.fixedQuestions;
                fixedQuestionIndexRef.current = 0;
                console.log('[useGroqVoice] Initialized College Fixed Question Mode with', context.fixedQuestions.length, 'questions.');
            } else {
                fixedQuestionsRef.current = null;
                fixedQuestionIndexRef.current = 0;
            }
        } else {
            fixedQuestionsRef.current = null;
            fixedQuestionIndexRef.current = 0;
            autoCodingRef.current = false;
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
        
        if (recognitionRef.current) {
            try {
                recognitionRef.current.stop();
            } catch (e) { }
            recognitionRef.current = null;
        }

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
        submitCurrentSpeech,
        speakText: speakResponse
    };
}
