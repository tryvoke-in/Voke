import React, { useState, useEffect, useRef, useCallback } from "react";
import { 
  PhoneOff, Mic, MicOff, Volume2, VolumeX, ArrowRight, CheckCircle2, Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ElitePrepScreenPreviewProps {
  isInteractive?: boolean;
  onContinueInterview?: () => void;
  onExploreFeatures?: () => void;
  className?: string;
}

export const ElitePrepScreenPreview: React.FC<ElitePrepScreenPreviewProps> = ({
  isInteractive = false,
  onContinueInterview,
  onExploreFeatures,
  className = "",
}) => {
  const navigate = useNavigate();
  const stageRef = useRef<HTMLDivElement>(null);

  // State
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [voiceMuted, setVoiceMuted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  // User input text & speech recognition
  const [liveTranscript, setLiveTranscript] = useState<string>("");
  const recognitionRef = useRef<any>(null);
  const isInteractiveRef = useRef(isInteractive);

  // Synchronize isInteractiveRef
  useEffect(() => {
    isInteractiveRef.current = isInteractive;
    if (!isInteractive) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      stopListening();
      setIsAiSpeaking(false);
    }
  }, [isInteractive]);

  // Introductory Warmup Questions
  const QUESTIONS = [
    {
      role: "Role Alignment",
      speaker: "Voke AI Coach",
      question: "Hello and welcome to Voke! Could you tell us your name, and what tech role or dream company you're preparing for?",
      sampleAnswer: "Hi, I'm Rahul, and I'm preparing for Frontend and SDE roles at top product companies."
    },
    {
      role: "Preparation Stage",
      speaker: "Voke AI Coach",
      question: "Great to have you here! What stage of your preparation are you currently at — upcoming campus drives, tech rounds, or switching roles?",
      sampleAnswer: "I'm currently preparing for campus placement drives and off-campus tech rounds."
    },
    {
      role: "Readiness Check",
      speaker: "Voke AI Coach",
      question: "Awesome! Your voice cadence and profile are calibrated. Ready to head to your dashboard to start your full mock interview?",
      sampleAnswer: "Yes, let's head to the dashboard and start the mock interview."
    }
  ];

  // User input text & speech recognition
  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // ignore
      }
      recognitionRef.current = null;
    }
    setIsListening(false);
  }, []);

  // Web Speech Recognition (STT) - Mic listens to candidate
  const startListening = useCallback(() => {
    if (typeof window === "undefined" || !isInteractiveRef.current || isMicMuted) return;

    const SpeechRec = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRec) return;

    try {
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }

      const rec = new SpeechRec();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        if (isInteractiveRef.current) {
          setIsListening(true);
        }
      };

      rec.onresult = (e: any) => {
        if (!isInteractiveRef.current) return;
        let interim = "";
        let final = "";
        for (let i = e.resultIndex; i < e.results.length; i++) {
          const item = e.results[i];
          if (item.isFinal) {
            final += item[0].transcript + " ";
          } else {
            interim += item[0].transcript;
          }
        }

        const combined = (final + " " + interim).trim();
        if (combined) {
          setLiveTranscript(combined);
        }
      };

      rec.onerror = () => {
        setIsListening(false);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
      rec.start();
    } catch {
      setIsListening(false);
    }
  }, [isMicMuted]);

  // Web Speech Synthesis (TTS) - AI asks question aloud via voice
  const speakText = useCallback((text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || voiceMuted || !isInteractiveRef.current) {
      if (onEnd && isInteractiveRef.current) onEnd();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      
      if (!isInteractiveRef.current) return;

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      const voices = window.speechSynthesis.getVoices();
      const preferred = voices.find(
        (v) => (v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Daniel") || v.name.includes("Natural")))
      ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferred) utterance.voice = preferred;

      utterance.onstart = () => {
        if (isInteractiveRef.current) {
          setIsAiSpeaking(true);
        } else {
          window.speechSynthesis.cancel();
        }
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        if (onEnd && isInteractiveRef.current) onEnd();
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
        if (onEnd && isInteractiveRef.current) onEnd();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsAiSpeaking(false);
      if (onEnd && isInteractiveRef.current) onEnd();
    }
  }, [voiceMuted]);

  // Monitor viewport visibility: stop speech & questions immediately once scrolled past
  useEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry.isIntersecting) {
          if (typeof window !== "undefined" && "speechSynthesis" in window) {
            window.speechSynthesis.cancel();
          }
          stopListening();
          setIsAiSpeaking(false);
        }
      },
      { threshold: 0.05 }
    );

    observer.observe(stage);

    return () => {
      observer.disconnect();
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      stopListening();
    };
  }, [stopListening]);

  // When interactive mode starts, auto-trigger first question speech if active
  const hasTriggeredFirstRef = useRef(false);
  useEffect(() => {
    if (isInteractive && !hasTriggeredFirstRef.current) {
      hasTriggeredFirstRef.current = true;
      const q = QUESTIONS[0];

      // Speak aloud
      speakText(q.question, () => {
        startListening();
      });
    }
  }, [isInteractive, speakText, startListening]);

  // Orb Click: Replay speech or toggle mic
  const handleOrbClick = () => {
    if (isAiSpeaking) {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
        setIsAiSpeaking(false);
      }
    } else {
      const q = QUESTIONS[currentQuestionIndex];
      speakText(q.question, () => {
        startListening();
      });
    }
  };

  // Handle Candidate Submitting Answer / Next Question
  const handleNextStep = () => {
    stopListening();
    const nextIndex = currentQuestionIndex + 1;
    setLiveTranscript("");

    if (nextIndex < QUESTIONS.length) {
      const nextQ = QUESTIONS[nextIndex];
      setCurrentQuestionIndex(nextIndex);

      speakText(nextQ.question, () => {
        startListening();
      });
    } else {
      // Finished all introductory questions
      setShowCompletionModal(true);
      speakText("Calibration complete. Would you like to proceed with your dashboard mock interview?");
    }
  };

  // Skip Interview button action: stops all audio & speech and smoothly scrolls past to features
  const handleSkipInterview = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();
    setIsAiSpeaking(false);

    if (onExploreFeatures) {
      onExploreFeatures();
    } else {
      const el = document.getElementById("features");
      if (el) {
        el.scrollIntoView({ behavior: "smooth" });
      }
    }
  };

  // Launch dashboard on modal proceed
  const handleProceedToDashboard = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    stopListening();
    if (onContinueInterview) {
      onContinueInterview();
    } else {
      navigate("/dashboard");
    }
  };

  return (
    <div className={`w-full h-full bg-[#07080c] text-white flex flex-col overflow-hidden font-sans select-none relative ${className}`}>
      {/* 1. MAIN COMPACT INTERVIEW CARD */}
      <div 
        ref={stageRef}
        id="macbook-screen-stage"
        className="flex-1 p-4 sm:p-5 md:p-6 flex flex-col items-center justify-between min-h-0 bg-[#06070a] relative overflow-hidden"
      >
        {/* Subtle Ambient Radial Light (Neutral) */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.02)_0%,transparent_70%)] pointer-events-none" />

        {/* TOP BAR: Minimal Progress Dots & Highlighted Skip Button */}
        <div className="w-full flex items-center justify-between z-10 pb-2 border-b border-white/[0.06]">
          <div className="flex items-center gap-1.5 py-0.5">
            {QUESTIONS.map((_, i) => (
              <div 
                key={i} 
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i === currentQuestionIndex 
                    ? "w-4 bg-white shadow-[0_0_8px_rgba(255,255,255,0.8)]" 
                    : i < currentQuestionIndex 
                    ? "w-1.5 bg-zinc-400" 
                    : "w-1.5 bg-zinc-700"
                }`} 
              />
            ))}
          </div>

          {/* Highlighted Skip Button */}
          <button
            type="button"
            onClick={handleSkipInterview}
            className="px-3.5 py-1 rounded-full bg-white/10 hover:bg-white/20 border border-white/25 hover:border-white/40 text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm cursor-pointer hover:scale-105"
          >
            <span>Skip</span>
            <ArrowRight className="w-3.5 h-3.5 text-zinc-200" />
          </button>
        </div>

        {/* TOP: Question Typography (Instrument Serif) */}
        <div className="w-full max-w-lg flex flex-col items-center text-center z-10 pt-2 px-2">
          <h2 className="font-serif text-base sm:text-lg md:text-xl font-normal text-white leading-relaxed max-w-lg drop-shadow-sm">
            "{QUESTIONS[currentQuestionIndex].question}"
          </h2>
        </div>

        {/* CENTER: 3D Iridescent Pearlescent Opal / Silver Voice Sphere */}
        <div className="relative z-10 flex flex-col items-center justify-center my-auto py-2">
          <div 
            onClick={handleOrbClick}
            className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 flex items-center justify-center cursor-pointer group"
            title="Tap to hear question or speak"
          >
            {/* Outer Pulsing Halo */}
            <div 
              className={`absolute inset-0 rounded-full transition-transform duration-700 ${
                isAiSpeaking 
                  ? "scale-120 opacity-60 bg-white/20 blur-2xl animate-pulse" 
                  : isListening 
                  ? "scale-115 opacity-50 bg-slate-300/20 blur-xl animate-pulse" 
                  : "scale-95 opacity-20 bg-white/5 blur-xl"
              }`} 
            />

            {/* Glowing 3D Sphere */}
            <div 
              className={`relative w-20 h-20 sm:w-26 sm:h-26 md:w-32 md:h-32 rounded-full transition-transform duration-300 group-hover:scale-105 ${
                isAiSpeaking 
                  ? "scale-105 shadow-[0_0_50px_rgba(255,255,255,0.4)]" 
                  : isListening 
                  ? "scale-102 shadow-[0_0_40px_rgba(203,213,225,0.35)]" 
                  : "scale-100 shadow-[0_0_25px_rgba(255,255,255,0.15)]"
              }`}
              style={{
                background: "radial-gradient(circle at 32% 28%, #ffffff 0%, #f1f5f9 22%, #cbd5e1 52%, #64748b 80%, #334155 100%)",
                boxShadow: "inset -8px -10px 24px rgba(0,0,0,0.65), inset 6px 8px 16px rgba(255,255,255,0.7), 0 0 35px rgba(255,255,255,0.2)"
              }}
            >
              {/* Specular Highlight Gloss */}
              <div 
                className="absolute top-2 left-3 w-6 sm:w-7 h-4 sm:h-5 rounded-full opacity-70 pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse at center, rgba(255,255,255,0.9) 0%, rgba(255,255,255,0) 75%)"
                }}
              />
              
              {/* Soft Inner Glow Ripple if Speaking */}
              {isAiSpeaking && (
                <div className="absolute inset-0 rounded-full border border-white/40 animate-ping opacity-40" />
              )}
              {isListening && (
                <div className="absolute inset-0 rounded-full border border-slate-300/40 animate-ping opacity-40" />
              )}
            </div>
          </div>

          {/* Status Badge beneath Orb */}
          <button
            type="button"
            onClick={handleOrbClick}
            className="mt-3 px-3 py-1 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 text-[10px] sm:text-xs text-zinc-300 hover:text-white flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
          >
            {isAiSpeaking ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-white animate-bounce" />
                <span className="text-white font-medium">Voke AI is speaking... (tap to mute)</span>
              </>
            ) : isListening ? (
              <>
                <Mic className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
                <span className="text-zinc-200 font-semibold">Listening to you... Speak now</span>
              </>
            ) : (
              <>
                <Volume2 className="w-3.5 h-3.5 text-zinc-400" />
                <span className="text-zinc-400">Tap orb to replay question aloud</span>
              </>
            )}
          </button>
        </div>

        {/* BOTTOM: Live Speech Subtitle & Input Bar */}
        <div className="w-full max-w-[480px] mx-auto z-10 flex flex-col gap-2">
          {/* Live speech feedback if available */}
          {(liveTranscript || isListening) && (
            <div className="px-3.5 py-1.5 rounded-full bg-white/[0.04] border border-white/15 text-xs text-zinc-200 flex items-center justify-between gap-2 animate-in fade-in duration-200">
              <div className="flex items-center gap-2 min-w-0">
                <span className="w-2 h-2 rounded-full bg-white animate-ping shrink-0" />
                <span className="font-bold text-white shrink-0">You:</span>
                <span className="truncate text-zinc-200">{liveTranscript || "Listening for your response..."}</span>
              </div>
              {liveTranscript && (
                <button
                  type="button"
                  onClick={() => setLiveTranscript("")}
                  className="text-[10px] text-zinc-400 hover:text-zinc-200 underline shrink-0 cursor-pointer"
                >
                  Clear
                </button>
              )}
            </div>
          )}

          {/* Compact Rounded Typing Box */}
          <div className="flex items-center gap-1.5 p-1 rounded-full bg-[#0a0c14]/95 border border-white/20 shadow-xl backdrop-blur-xl">
            {/* Mic Toggle Button */}
            <button
              type="button"
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening();
                }
                setIsMicMuted(!isMicMuted);
              }}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                isListening
                  ? "bg-white/20 text-white border border-white/30 animate-pulse"
                  : isMicMuted
                  ? "bg-red-500/20 text-red-400 border border-red-500/40"
                  : "bg-white/5 hover:bg-white/10 text-zinc-300"
              }`}
              title={isListening ? "Listening (tap to stop)" : "Turn on microphone"}
            >
              {isMicMuted ? <MicOff className="w-3.5 h-3.5" /> : <Mic className="w-3.5 h-3.5" />}
            </button>

            {/* AI Speaker Audio Mute Toggle */}
            <button
              type="button"
              onClick={() => setVoiceMuted(!voiceMuted)}
              className={`p-2 rounded-full transition-all cursor-pointer ${
                voiceMuted
                  ? "bg-white/5 text-zinc-500"
                  : "bg-white/10 text-zinc-300 border border-white/20"
              }`}
              title={voiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
            >
              {voiceMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
            </button>

            {/* Text Input */}
            <input
              type="text"
              value={liveTranscript}
              onChange={(e) => setLiveTranscript(e.target.value)}
              placeholder={isListening ? "Listening... or type here" : "Type your answer or speak with mic..."}
              className="flex-1 bg-transparent px-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none"
              onKeyDown={(e) => {
                if (e.key === "Enter") handleNextStep();
              }}
            />

            {/* Next / Submit Button */}
            <button
              type="button"
              onClick={handleNextStep}
              className="h-8 px-4 rounded-full bg-white hover:bg-zinc-200 text-black font-semibold text-xs flex items-center gap-1.5 shrink-0 cursor-pointer shadow-md transition-all hover:scale-105"
            >
              <span>{currentQuestionIndex >= QUESTIONS.length - 1 ? "Complete" : "Next"}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Quick skip trigger */}
          <div className="flex items-center justify-center pt-0.5 text-[10px] sm:text-[11px] text-zinc-400">
            <button
              type="button"
              onClick={handleSkipInterview}
              className="hover:text-white transition-colors cursor-pointer underline underline-offset-2"
            >
              Skip interview & explore features ↓
            </button>
          </div>
        </div>

      </div>

      {/* 3. COMPLETION OVERLAY MODAL */}
      {showCompletionModal && (
        <div className="absolute inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0b0c14] border border-white/15 rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl text-center space-y-4 animate-in fade-in zoom-in duration-300">
            <div className="w-12 h-12 rounded-2xl bg-white/10 border border-white/20 mx-auto flex items-center justify-center text-white">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base sm:text-lg font-extrabold text-white">
                Introductory Calibration Complete!
              </h3>
              <p className="text-xs text-zinc-400">
                Your microphone, vocal cadence, and target profile are calibrated. Proceed to your dashboard to unlock full mock interviews, DSA sheets, and diagnostic scorecards.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleProceedToDashboard}
                className="w-full h-10 rounded-xl bg-white hover:bg-zinc-200 text-black font-bold text-xs shadow-lg flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                <Zap className="w-4 h-4 text-black" />
                <span>Open Interview Dashboard</span>
              </button>

              <button
                type="button"
                onClick={handleSkipInterview}
                className="w-full h-9 rounded-xl border border-white/10 hover:bg-white/5 text-zinc-300 hover:text-white font-semibold text-xs transition-colors cursor-pointer"
              >
                Explore Voke Features Below
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default ElitePrepScreenPreview;
