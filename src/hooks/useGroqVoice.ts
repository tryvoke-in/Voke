import { useState, useRef, useCallback, useEffect, useMemo } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { LiveStatus, MessageLog } from '../types/voice';
import { toast } from 'sonner';
const SYSTEM_INSTRUCTION = `YOU ARE:
A real-time voice-based conversational assistant designed to conduct a professional yet friendly interview.

1. Core Personality & Speaking Style
- Speak in a friendly, warm, and natural tone.
- Keep responses concise (1-3 sentences max) unless asked for detail.
- Use spoken-language style (short sentences, natural fillers).
- Never sound robotic or overly formal.

2. Interaction Rules
- Respond quickly.
- If unclear, ask "Could you repeat that?".
- Do not mention you are an AI unless asked.

3. INTERVIEW FLOW & CODING CHALLENGE (IMPORTANT):
- Start with 2-3 behavioral or technical screening questions based on their background.
- Once you are satisfied with the verbal screening, say exactly: "[START_CODING]" followed by a brief intro to the coding problem.
- DO NOT ask "Are you ready for a coding challenge?". Just announce it naturally like "Great, let's move on to a practical problem. [START_CODING] I'd like you to solve..." giving a brief 1-sentence summary of the task.

4. DURING CODING:
- When the user submits code, DO NOT just give the answer or say "Correct".
- Use **Socratic Questioning**: Ask probing questions about their choices. Examples:
    - "Why did you choose this data structure?"
    - "How does this handle edge case X?"
    - "Can you explain the time complexity?"
- If the code is buggy, ask: "Walk me through your logic for [specific part]. What happens if input is X?"

5. ENDING CODING & FEEDBACK:
- Once you are satisfied with the coding discussion (or if user asks to stop), you MUST provide:
    - Spoken transition: "Excellent work on that. Let's move on."
    - Token: "[END_CODING]" (to switch back to voice mode).
    - Detailed Feedback (Hidden from speech): "[DETAILED_FEEDBACK]" followed by a structured Markdown summary of their code quality, correct logic, and areas for improvement.

Example Output when finishing coding:
"That was a great solution. [END_CODING] Let's discuss your experience with..."
[DETAILED_FEEDBACK]
### Code Review
- **Logic**: Correct approach using Hash Map.
- **Style**: Good variable naming, but missed type hints.
- **Optimization**: O(n) is optimal.
`;

interface UseGroqVoiceReturn {
    status: LiveStatus;
    connect: (context?: string) => Promise<void>;
    disconnect: () => void;
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    volume: number;
    logs: MessageLog[];
    errorDetails: string | null;
    sendHiddenContext: (text: string) => Promise<void>;
    apiLabel: string;
}

interface UseGroqVoiceProps {
    apiKey?: string;
}

export function useGroqVoice(props?: UseGroqVoiceProps): UseGroqVoiceReturn {
    const [status, setStatus] = useState<LiveStatus>(LiveStatus.DISCONNECTED);
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

                    const assistantTurnCount = conversationHistoryRef.current.filter(m => m.role === 'assistant').length;
                    let turnHint = "";
                    if (assistantTurnCount === 1) {
                        turnHint = "\n\nTURN 2 DIRECTIVE: Ask about candidate's EDUCATION or DEGREE at Newton School of Technology (B.Tech CS & AI). Ask what specific web development coursework they focused on!";
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

                    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-3.1-flash-lite:generateContent?key=${geminiApiKey}`, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: contents.slice(-6),
                            systemInstruction: { parts: [{ text: systemPromptMsg + turnHint }] },
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

        // TERTIARY FALLBACK: Groq Llama 3.3 70B
        if (!aiText && groqClient) {
            try {
                console.log('DEBUG: Tertiary Fallback - Generating question with Groq Llama 3.3 70B...');
                const completion = await groqClient.chat.completions.create({
                    messages: fullMessages,
                    model: 'llama-3.3-70b-versatile',
                    temperature: 0.7,
                    max_tokens: 800,
                });
                aiText = completion.choices[0]?.message?.content || "";
            } catch (groqErr) {
                console.error("Groq fallback error:", groqErr);
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
            
            // Emergency turn-based questions (only used if ALL 3 AI engines fail)
            const emergencyQuestions: Record<number, string> = {
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
            
            const turnKey = Math.min(assistantTurnCount, 9);
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
            .replace('[START_CODING]', '')
            .replace('[END_CODING]', '');

        // Remove detailed feedback content (everything after the token)
        if (speechText.includes('[DETAILED_FEEDBACK]')) {
            speechText = speechText.split('[DETAILED_FEEDBACK]')[0];
        }

        speechText = speechText.trim();
        if (!speechText || statusRef.current === LiveStatus.DISCONNECTED) {
            window.speechSynthesis.cancel();
            return;
        }

        try {
            console.log('DEBUG: Speaking AI response via Web Speech API:', speechText);
            setIsAiSpeaking(true);
            setVolume(0.8);

            window.speechSynthesis.cancel(); // Cancel any previous active speech
            const utterance = new SpeechSynthesisUtterance(speechText);

            // Select natural english voice if available
            const voices = window.speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => 
                v.lang.startsWith('en') && 
                (v.name.includes('Google') || v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Daniel') || v.name.includes('Karen'))
            ) || voices.find(v => v.lang.startsWith('en'));

            if (preferredVoice) {
                utterance.voice = preferredVoice;
            }

            utterance.rate = 1.0;
            utterance.pitch = 1.0;

            utterance.onend = () => {
                console.log('DEBUG: AI speech finished.');
                setIsAiSpeaking(false);
                setVolume(0);

                // Resume candidate microphone listening after AI finishes speaking
                if (statusRef.current === LiveStatus.CONNECTED && startListeningRef.current) {
                    setTimeout(() => startListeningRef.current!(), 500);
                }
            };

            utterance.onerror = (e) => {
                console.warn('DEBUG: Speech synthesis note:', e);
                setIsAiSpeaking(false);
                setVolume(0);
            };

            window.speechSynthesis.speak(utterance);

        } catch (error) {
            console.error('DEBUG: Speech synthesis error:', error);
            setIsAiSpeaking(false);
            setVolume(0);
        }
    };

    const transcribeAudio = async (audioBlob: Blob): Promise<string> => {
        try {
            console.log('DEBUG: Transcribing audio with Groq Whisper...');

            // Convert blob to File
            const audioFile = new File([audioBlob], 'audio.webm', { type: 'audio/webm' });

            const session = await supabase.auth.getSession();
            const token = session.data.session?.access_token;
            if (!token) return '';

            const formData = new FormData();
            formData.append('file', audioFile);
            formData.append('model', 'whisper-large-v3-turbo');
            formData.append('temperature', '0');
            formData.append('response_format', 'verbose_json');

            const res = await fetch(`${supabase.supabaseUrl}/functions/v1/groq-proxy`, {
                method: "POST",
                headers: { "Authorization": `Bearer ${token}` },
                body: formData
            });
            
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const transcription = await res.json();

            console.log('DEBUG: Transcription:', transcription.text);

            if (!transcription.text) {
                toast.warning("Hears silence (empty transcript)");
            }

            return transcription.text || '';
        } catch (error: any) {
            console.error('DEBUG: Whisper transcription error:', error);
            toast.error(`Transcription Failed: ${error.message}`);
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

    const connect = useCallback(async (context?: string) => {
        if (status === LiveStatus.CONNECTED) return;

        console.log('DEBUG: Connect called');
        setStatus(LiveStatus.CONNECTING);
        contextRef.current = context || '';
        conversationHistoryRef.current = [];

        try {
            // Test microphone access
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            stream.getTracks().forEach(track => track.stop());

            setStatus(LiveStatus.CONNECTED);

            // Generate personalized greeting using Groq
            try {
                console.log('DEBUG: Generating personalized greeting...');
                const session = await supabase.auth.getSession();
                const token = session.data.session?.access_token;
                if (!token) throw new Error("Not authenticated");

                const makeGreetingReq = async (model: string, msgs: any[], max: number) => {
                    const res = await fetch(`${supabase.supabaseUrl}/functions/v1/groq-proxy`, {
                        method: "POST",
                        headers: { "Authorization": `Bearer ${token}`, "Content-Type": "application/json" },
                        body: JSON.stringify({ messages: msgs, model, temperature: 0.8, max_tokens: max })
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    return await res.json();
                };

                let greetingCompletion;
                try {
                    greetingCompletion = await makeGreetingReq('llama-3.3-70b-versatile', [
                        { role: 'system', content: SYSTEM_INSTRUCTION + '\n\nCONTEXT:\n' + contextRef.current },
                        { role: 'user', content: 'Generate a warm, personalized greeting for the user. Address them by name if available in the context. Keep it to 1-2 sentences and invite them to introduce themselves or talk about their experience.' }
                    ], 100);
                } catch (error: any) {
                    if (error?.message?.includes('429')) {
                        console.log('DEBUG: Rate limit reached during greeting, switching to fallback...');
                        greetingCompletion = await makeGreetingReq('llama-3.1-8b-instant', [
                            { role: 'system', content: SYSTEM_INSTRUCTION + '\n\nCONTEXT:\n' + contextRef.current },
                            { role: 'user', content: 'Say hello and ask for introduction.' }
                        ], 60);
                    } else {
                        throw error;
                    }
                }

                const greeting = greetingCompletion.choices[0]?.message?.content || "Hello! I'm ready to interview you. Please introduce yourself.";
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
                const fallbackGreeting = "Hello! I'm ready to interview you. Please introduce yourself.";
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
        apiLabel
    };
}
