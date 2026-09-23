import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { 
  Sparkles, CheckCircle2, ArrowRight, 
  Terminal, Bot, RotateCcw, 
  Flame, LayoutDashboard, ShieldCheck, 
  Mic, MicOff, Volume2, VolumeX, Send
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { WAITLIST_CONFIG } from "@/config/waitlist";

interface InteractiveScreenStageProps {
  onScrollToFeatures?: () => void;
  className?: string;
}

interface RoleConfig {
  id: string;
  title: string;
  badge: string;
  speechIntro: string;
  warmupQuestion: string;
  sampleAnswer: string;
  suggestedTags: string[];
}

const ROLES: RoleConfig[] = [
  {
    id: "fullstack",
    title: "Full-Stack Engineer",
    badge: "React · Node · System Design",
    speechIntro: "Great! Let's calibrate for Full-Stack Engineering.",
    warmupQuestion: "How do you handle state synchronization between client and server when a user is on an intermittent mobile connection?",
    sampleAnswer: "I use optimistic UI updates backed by an indexedDB write queue, idempotency keys on mutation endpoints, and background reconciliation with exponential backoff.",
    suggestedTags: ["Optimistic UI", "Idempotency", "Offline Sync"]
  },
  {
    id: "frontend",
    title: "Frontend Specialist",
    badge: "React · Next.js · Core Web Vitals",
    speechIntro: "Awesome. Focusing on Frontend Architecture and UI Performance.",
    warmupQuestion: "Explain how you identify and eliminate Interaction to Next Paint (INP) bottlenecks in a complex React dashboard.",
    sampleAnswer: "I profile long tasks using Chrome DevTools Performance panel, break CPU-intensive renders using startTransition or Web Workers, and defer non-critical layout measurements.",
    suggestedTags: ["INP / FID", "startTransition", "Long Tasks"]
  },
  {
    id: "backend",
    title: "Backend & Systems",
    badge: "Go · Microservices · PostgreSQL",
    speechIntro: "Perfect choice. Calibrating for High-Concurrency Backend Systems.",
    warmupQuestion: "How would you design database read and write partitioning for a service handling 40,000 requests per second?",
    sampleAnswer: "I would implement hash-based sharding by tenant or entity key, pair writes with write-ahead replication to read replicas, and front hot read paths with Redis cluster caching.",
    suggestedTags: ["Hash Sharding", "WAL Replication", "Redis Caching"]
  },
  {
    id: "aiml",
    title: "AI / ML & Infrastructure",
    badge: "PyTorch · LLM Ops · Latency",
    speechIntro: "Excellent. Calibrating for AI Systems, Inference, and LLM Orchestration.",
    warmupQuestion: "What strategies do you adopt to minimize time-to-first-token (TTFT) when streaming large language model responses to web clients?",
    sampleAnswer: "I leverage speculative decoding, KV-cache reuse, vLLM continuous batching, and HTTP/2 Server-Sent Events (SSE) streaming direct to the browser edge.",
    suggestedTags: ["KV Cache", "Speculative Decoding", "SSE Stream"]
  }
];

const TARGET_TIERS = [
  { id: "faang", title: "FAANG & Tier 1 Tech", desc: "Target: 30–60 Days", icon: "⚡" },
  { id: "unicorn", title: "High-Growth Unicorns", desc: "Target: Series B+ / Remote", icon: "🦄" },
  { id: "campus", title: "Campus Drives & Grad", desc: "Target: 2025 / 2026 Batch", icon: "🎓" },
  { id: "practice", title: "Benchmark & Practice", desc: "Continuous improvement", icon: "🎯" }
];

export const InteractiveScreenStage: React.FC<InteractiveScreenStageProps> = ({
  onScrollToFeatures,
  className = ""
}) => {
  const navigate = useNavigate();

  // Steps: 0 = Role Selection, 1 = Target Horizon, 2 = Rapid Warmup, 3 = Continuation Fork
  const [step, setStep] = useState<number>(0);
  const [selectedRole, setSelectedRole] = useState<RoleConfig>(ROLES[0]);
  const [selectedTier, setSelectedTier] = useState<string>(TARGET_TIERS[0].id);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);

  // Voice AI States
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isListening, setIsListening] = useState<boolean>(false);
  const [speechSupported, setSpeechSupported] = useState<boolean>(true);
  const [voiceMuted, setVoiceMuted] = useState<boolean>(false);

  // Speech Recognition instance ref
  const recognitionRef = useRef<any>(null);

  // Text-To-Speech: Speak question aloud using native SpeechSynthesis
  const speakText = useCallback((text: string, onEndCallback?: () => void) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window) || voiceMuted) {
      if (onEndCallback) onEndCallback();
      return;
    }

    try {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      // Prefer high quality English voice
      const voices = window.speechSynthesis.getVoices();
      const preferredVoice = voices.find(
        (v) => (v.lang.startsWith("en") && (v.name.includes("Google") || v.name.includes("Samantha") || v.name.includes("Natural") || v.name.includes("Daniel")))
      ) || voices.find((v) => v.lang.startsWith("en"));

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      utterance.onstart = () => {
        setIsAiSpeaking(true);
      };

      utterance.onend = () => {
        setIsAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      utterance.onerror = () => {
        setIsAiSpeaking(false);
        if (onEndCallback) onEndCallback();
      };

      window.speechSynthesis.speak(utterance);
    } catch {
      setIsAiSpeaking(false);
      if (onEndCallback) onEndCallback();
    }
  }, [voiceMuted]);

  // Speech-To-Text: Listen to user voice via SpeechRecognition
  const startListening = useCallback(() => {
    if (typeof window === "undefined") return;

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setSpeechSupported(false);
      return;
    }

    try {
      // Stop existing instance
      if (recognitionRef.current) {
        try { recognitionRef.current.stop(); } catch {}
      }

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = "en-US";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = 0; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript.trim()) {
          setUserAnswer(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        if (event.error !== "no-speech") {
          setIsListening(false);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      console.warn("Could not start speech recognition:", err);
      setIsListening(false);
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
    }
    setIsListening(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      stopListening();
    };
  }, [stopListening]);

  // When step changes, speak the question naturally!
  useEffect(() => {
    if (voiceMuted) return;

    if (step === 0) {
      speakText("Welcome to Voke. Which technical track are you preparing for?");
    } else if (step === 1) {
      speakText(`${selectedRole.speechIntro} What is your target company tier and timeline?`);
    } else if (step === 2) {
      // Step 2 is the warmup: speak the question, and automatically start listening when done!
      speakText(
        `Here is your technical warmup: ${selectedRole.warmupQuestion}`,
        () => {
          // AI finished speaking, auto-start listening to user
          startListening();
        }
      );
    } else if (step === 3) {
      speakText("Calibration complete. Would you like to launch the live mock interview now, or explore your dashboard?");
    }
  }, [step, selectedRole, speakText, startListening, voiceMuted]);

  const handleAuthNavigation = (destination: string) => {
    try {
      sessionStorage.setItem("voke_calibration_role", selectedRole.title);
      sessionStorage.setItem("voke_calibration_tier", selectedTier);
      sessionStorage.setItem("voke_calibration_answer", userAnswer);
    } catch {}

    const isBypassed = localStorage.getItem("voke_waitlist_bypass") === "true";
    if (WAITLIST_CONFIG.enabled && !isBypassed) {
      navigate("/waitlist");
    } else {
      navigate(destination);
    }
  };

  const handleWarmupSubmit = () => {
    stopListening();
    setIsEvaluating(true);
    setTimeout(() => {
      setIsEvaluating(false);
      setStep(3);
    }, 1200);
  };

  return (
    <div className={`w-full max-w-4xl mx-auto ${className}`}>
      {/* Outer Glow & Glassmorphic Container */}
      <div className="relative rounded-3xl p-1 bg-gradient-to-b from-sky-500/35 via-white/15 to-blue-500/25 shadow-[0_0_80px_rgba(56,189,248,0.22)]">
        <div className="rounded-[22px] bg-[#090b12]/95 backdrop-blur-2xl border border-white/10 overflow-hidden text-left relative z-10">
          
          {/* Top macOS App Window Bar */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-white/10 bg-black/40">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-rose-500/80 border border-rose-400/40" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80 border border-amber-400/40" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80 border border-emerald-400/40" />
              <span className="ml-3 font-mono text-xs text-gray-400 font-medium flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-sky-400" />
                voke-ai // voice-calibration-session
              </span>
            </div>

            {/* Voice Waveform Indicator & Controls */}
            <div className="flex items-center gap-3">
              {/* Speaker / Listener dynamic indicator */}
              <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-mono">
                {isAiSpeaking ? (
                  <>
                    <span className="flex items-center gap-0.5 h-3">
                      {[1, 2, 3, 4].map((bar) => (
                        <span
                          key={bar}
                          className="w-0.5 bg-sky-400 rounded-full animate-bounce"
                          style={{ height: `${8 + (bar % 3) * 5}px`, animationDuration: `${0.4 + bar * 0.15}s` }}
                        />
                      ))}
                    </span>
                    <span className="text-sky-300 font-semibold">AI Speaking...</span>
                  </>
                ) : isListening ? (
                  <>
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    <span className="text-emerald-300 font-semibold">Listening to you...</span>
                  </>
                ) : (
                  <>
                    <span className="w-2 h-2 rounded-full bg-gray-500" />
                    <span className="text-gray-400">Voice Ready</span>
                  </>
                )}
              </div>

              {/* Mute/Unmute Toggle */}
              <button
                type="button"
                onClick={() => {
                  if (!voiceMuted) {
                    window.speechSynthesis?.cancel();
                    setIsAiSpeaking(false);
                  }
                  setVoiceMuted(!voiceMuted);
                }}
                className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
                title={voiceMuted ? "Unmute AI Voice" : "Mute AI Voice"}
              >
                {voiceMuted ? <VolumeX className="w-4 h-4 text-rose-400" /> : <Volume2 className="w-4 h-4 text-sky-400" />}
              </button>

              {/* Step counter */}
              <Badge className="bg-sky-500/10 text-sky-300 border-sky-500/20 text-[10px] px-2 py-0.5 font-mono">
                {step === 3 ? "Complete" : `Step ${step + 1} of 3`}
              </Badge>
            </div>
          </div>

          {/* Inner Interactive Body */}
          <div className="p-6 md:p-10 min-h-[470px] flex flex-col justify-between">
            <AnimatePresence mode="wait">
              
              {/* STEP 0: Role Selection */}
              {step === 0 && (
                <motion.div
                  key="step-0"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/25 text-sky-300 text-xs font-semibold uppercase tracking-wider">
                        <Bot className="w-3.5 h-3.5 text-sky-400" /> Voice AI Prompt
                      </div>

                      <button
                        type="button"
                        onClick={() => speakText("Welcome to Voke. Which technical track are you preparing for?")}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Replay Voice
                      </button>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      Welcome to Voke. Which technical track are you preparing for?
                    </h2>
                    <p className="text-sm md:text-base text-gray-400">
                      Your technical evaluation, live code sandbox, and algorithmic grilling will automatically calibrate to this track.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5 py-2">
                    {ROLES.map((role) => {
                      const isSelected = selectedRole.id === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            setSelectedRole(role);
                            speakText(role.speechIntro);
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all duration-300 relative group ${
                            isSelected
                              ? "bg-sky-500/15 border-sky-400/80 shadow-[0_0_25px_rgba(56,189,248,0.2)]"
                              : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <div className="flex items-start justify-between">
                            <h4 className={`text-base font-bold transition-colors ${isSelected ? "text-white" : "text-gray-200"}`}>
                              {role.title}
                            </h4>
                            {isSelected && (
                              <CheckCircle2 className="w-5 h-5 text-sky-400 shrink-0" />
                            )}
                          </div>
                          <p className="text-xs text-gray-400 font-mono mt-1.5">
                            {role.badge}
                          </p>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <span className="text-xs text-gray-500 font-mono">
                      Selected: <span className="text-sky-400 font-semibold">{selectedRole.title}</span>
                    </span>
                    <Button
                      onClick={() => setStep(1)}
                      className="bg-white text-black hover:bg-sky-400 hover:text-black font-bold px-7 rounded-full text-xs h-10 shadow-lg transition-all"
                    >
                      Next Step <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 1: Target Tier & Horizon */}
              {step === 1 && (
                <motion.div
                  key="step-1"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/25 text-blue-300 text-xs font-semibold uppercase tracking-wider">
                        <Flame className="w-3.5 h-3.5 text-blue-400" /> Benchmark Level
                      </div>

                      <button
                        type="button"
                        onClick={() => speakText(`What is your target company tier and interview timeline?`)}
                        className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors"
                      >
                        <Volume2 className="w-3.5 h-3.5" /> Replay Voice
                      </button>
                    </div>

                    <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
                      What is your target company tier and interview timeline?
                    </h2>
                    <p className="text-sm md:text-base text-gray-400">
                      We calibrate the rubric strictness, algorithmic complexity, and system scaling depth to your goals.
                    </p>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3.5 py-2">
                    {TARGET_TIERS.map((tier) => {
                      const isSelected = selectedTier === tier.id;
                      return (
                        <button
                          key={tier.id}
                          type="button"
                          onClick={() => {
                            setSelectedTier(tier.id);
                            speakText(`Selected ${tier.title}.`);
                          }}
                          className={`p-4 rounded-2xl border text-left transition-all duration-300 flex items-start gap-3.5 ${
                            isSelected
                              ? "bg-blue-500/15 border-blue-400/80 shadow-[0_0_25px_rgba(59,130,246,0.2)]"
                              : "bg-white/[0.03] border-white/10 hover:border-white/20 hover:bg-white/[0.06]"
                          }`}
                        >
                          <span className="text-2xl p-1 rounded-xl bg-white/5">{tier.icon}</span>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h4 className="text-sm font-bold text-white truncate">{tier.title}</h4>
                              {isSelected && (
                                <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-gray-400 mt-1">{tier.desc}</p>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={() => setStep(0)}
                      className="text-gray-400 hover:text-white text-xs h-10 px-4 rounded-full"
                    >
                      ← Back
                    </Button>
                    <Button
                      onClick={() => setStep(2)}
                      className="bg-white text-black hover:bg-sky-400 hover:text-black font-bold px-7 rounded-full text-xs h-10 shadow-lg transition-all"
                    >
                      Continue to Warmup <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 2: Rapid Technical Warmup Prompt (Voice Question + Voice Listening!) */}
              {step === 2 && (
                <motion.div
                  key="step-2"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-300 text-xs font-semibold uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Voice Warmup · {selectedRole.title}
                      </div>

                      {/* Speaking / Listening Status Pill */}
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => speakText(selectedRole.warmupQuestion, () => startListening())}
                          className="text-xs text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono transition-colors"
                        >
                          <Volume2 className="w-3.5 h-3.5" /> Re-ask via Voice
                        </button>

                        <div className="flex items-center gap-2 text-xs text-gray-400 font-mono">
                          <span className={`w-2 h-2 rounded-full ${isListening ? "bg-emerald-400 animate-ping" : "bg-sky-400"}`} />
                          {isListening ? "Microphone Live" : "Mic Ready"}
                        </div>
                      </div>
                    </div>

                    {/* AI Question Box with Voice Waveform */}
                    <div className="p-4 rounded-2xl bg-black/60 border border-white/10 space-y-2 relative overflow-hidden">
                      <div className="flex items-center justify-between text-[11px] font-bold text-sky-400 uppercase font-mono">
                        <span className="flex items-center gap-1.5">
                          <Bot className="w-3.5 h-3.5 text-sky-400" /> AI Interviewer Asked:
                        </span>

                        {isAiSpeaking && (
                          <span className="text-sky-300 font-mono text-[10px] flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" /> Speaking Question...
                          </span>
                        )}
                      </div>

                      <p className="text-base font-semibold text-white leading-relaxed">
                        "{selectedRole.warmupQuestion}"
                      </p>
                    </div>
                  </div>

                  {/* Voice Input / Live Speech Transcription Box */}
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between text-xs text-gray-400">
                      <span className="flex items-center gap-1.5">
                        {isListening ? (
                          <span className="text-emerald-400 font-semibold flex items-center gap-1">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                            Listening to you speak:
                          </span>
                        ) : (
                          <span>Speak into microphone or type your approach:</span>
                        )}
                      </span>

                      <button
                        type="button"
                        onClick={() => {
                          setUserAnswer(selectedRole.sampleAnswer);
                          speakText("Sample high scoring answer loaded.");
                        }}
                        className="text-sky-400 hover:text-sky-300 transition-colors underline font-medium text-[11px]"
                      >
                        Insert Sample High-Scoring Response
                      </button>
                    </div>

                    <div className="relative">
                      <textarea
                        value={userAnswer}
                        onChange={(e) => setUserAnswer(e.target.value)}
                        placeholder="Speak your answer or type key tradeoffs and architecture layers here..."
                        rows={3}
                        className={`w-full bg-black/70 border rounded-xl p-3.5 pr-14 text-sm text-gray-200 placeholder:text-gray-600 focus:outline-none transition-all font-mono ${
                          isListening 
                            ? "border-emerald-400/80 ring-2 ring-emerald-400/20 shadow-[0_0_20px_rgba(16,185,129,0.15)]" 
                            : "border-white/15 focus:border-sky-400 focus:ring-1 focus:ring-sky-400/50"
                        }`}
                      />

                      {/* Microphone Toggle Button embedded inside textarea */}
                      <button
                        type="button"
                        onClick={() => {
                          if (isListening) {
                            stopListening();
                          } else {
                            startListening();
                          }
                        }}
                        className={`absolute right-3 top-3.5 p-2.5 rounded-xl border transition-all duration-300 ${
                          isListening
                            ? "bg-emerald-500 text-black border-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.6)] animate-pulse"
                            : "bg-white/10 text-gray-300 border-white/10 hover:bg-sky-500/20 hover:text-sky-300 hover:border-sky-400/40"
                        }`}
                        title={isListening ? "Click to pause listening" : "Click to speak answer via microphone"}
                      >
                        {isListening ? <Mic className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                      </button>
                    </div>

                    {/* Live Keywords feedback */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold font-mono">Recognized Concepts:</span>
                      {selectedRole.suggestedTags.map((tag) => {
                        const matched = userAnswer.toLowerCase().includes(tag.toLowerCase().split(" ")[0]);
                        return (
                          <span
                            key={tag}
                            className={`text-[10px] px-2 py-0.5 rounded border transition-all font-mono ${
                              matched
                                ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30 font-bold"
                                : "bg-white/5 text-gray-400 border-white/10"
                            }`}
                          >
                            {matched ? `✓ ${tag}` : tag}
                          </span>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <Button
                      variant="ghost"
                      onClick={() => setStep(1)}
                      className="text-gray-400 hover:text-white text-xs h-10 px-4 rounded-full"
                    >
                      ← Back
                    </Button>
                    
                    <Button
                      onClick={handleWarmupSubmit}
                      disabled={isEvaluating}
                      className="bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold px-7 rounded-full text-xs h-10 shadow-lg transition-all flex items-center gap-2"
                    >
                      {isEvaluating ? (
                        <>
                          <span className="w-3.5 h-3.5 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                          Analyzing Logic & Speech...
                        </>
                      ) : (
                        <>
                          Submit Baseline <Send className="w-3.5 h-3.5 ml-1" />
                        </>
                      )}
                    </Button>
                  </div>
                </motion.div>
              )}

              {/* STEP 3: Calibration Complete & Continuation Fork */}
              {step === 3 && (
                <motion.div
                  key="step-3"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.4 }}
                  className="space-y-6 flex-1 flex flex-col justify-between"
                >
                  <div className="text-center space-y-3 pt-2">
                    <div className="w-14 h-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(16,185,129,0.3)]">
                      <ShieldCheck className="w-8 h-8" />
                    </div>

                    <h2 className="text-3xl font-extrabold text-white tracking-tight">
                      Baseline Calibration Complete!
                    </h2>
                    
                    <p className="text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
                      Your technical and speech baseline for <span className="text-sky-400 font-bold">{selectedRole.title}</span> has been scored. Would you like to continue into the full live simulated interview?
                    </p>
                  </div>

                  {/* Diagnostic Preliminary Scorecard Pill */}
                  <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-black/60 border border-white/10 text-center max-w-xl mx-auto w-full">
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Match Score</p>
                      <p className="text-xl font-extrabold text-emerald-400 mt-1">94%</p>
                      <span className="text-[9px] text-emerald-300/80">Strong Foundation</span>
                    </div>
                    <div className="border-x border-white/10">
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Role Track</p>
                      <p className="text-xs font-bold text-white mt-2 truncate px-1">{selectedRole.title}</p>
                      <span className="text-[9px] text-sky-400">Standard Tier</span>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-500 font-bold uppercase tracking-wider font-mono">Speech Cadence</p>
                      <p className="text-xs font-bold text-gray-200 mt-2">138 WPM</p>
                      <span className="text-[9px] text-yellow-400">Optimal Pace</span>
                    </div>
                  </div>

                  {/* Main Question & Dual Continuation Fork */}
                  <div className="space-y-4 pt-2">
                    <p className="text-center text-xs font-semibold text-gray-400 uppercase tracking-widest font-mono">
                      Continue your full interview or access your student dashboard:
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                      <Button
                        onClick={() => handleAuthNavigation("/voice-assistant")}
                        className="w-full sm:w-auto bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 hover:from-sky-400 hover:to-indigo-500 text-white font-bold text-sm px-8 h-12 rounded-full shadow-[0_0_30px_rgba(56,189,248,0.35)] hover:scale-105 transition-all duration-300 flex items-center justify-center"
                      >
                        <Mic className="w-4 h-4 mr-2 text-white animate-pulse" />
                        Launch Full AI Mock Interview
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>

                      <Button
                        onClick={() => handleAuthNavigation("/dashboard")}
                        variant="outline"
                        className="w-full sm:w-auto border-white/20 text-white hover:bg-white/10 font-bold text-sm px-7 h-12 rounded-full transition-all duration-300 flex items-center justify-center"
                      >
                        <LayoutDashboard className="w-4 h-4 mr-2 text-gray-300" />
                        Explore Dashboard / Sign In
                      </Button>
                    </div>

                    <div className="flex items-center justify-center gap-6 pt-2 text-xs text-gray-500">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(0);
                          setUserAnswer("");
                        }}
                        className="hover:text-gray-300 transition-colors flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" /> Re-calibrate Answers
                      </button>

                      {onScrollToFeatures && (
                        <button
                          type="button"
                          onClick={onScrollToFeatures}
                          className="text-sky-400 hover:text-sky-300 transition-colors flex items-center gap-1 font-semibold"
                        >
                          Explore Platform Features ↓
                        </button>
                      )}
                    </div>
                  </div>
                </motion.div>
              )}

            </AnimatePresence>
          </div>

        </div>
      </div>
    </div>
  );
};

export default InteractiveScreenStage;
