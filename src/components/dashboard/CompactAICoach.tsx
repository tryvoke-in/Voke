import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap } from "lucide-react";

interface CompactAICoachProps {
  score?: number;
  userStreak?: number;
  scoreChange?: number;
  totalInterviews?: number;
  hasGivenInterview?: boolean;
  userName?: string;
}

type TourStep = "greet" | "interview" | "percent" | "details" | "practice" | "home";

interface EmotionTheme {
  name: "happy" | "wink" | "mastery";
  eyeColor: string;
  eyeGlow: string;
  antennaColor: string;
  antennaGlow: string;
  reactorColor: string;
  visorBorder: string;
  earColor: string;
  message: string;
}

const DEFAULT_THEMES: EmotionTheme[] = [
  {
    name: "happy",
    eyeColor: "from-cyan-200 via-cyan-400 to-blue-500",
    eyeGlow: "shadow-[0_0_12px_#38bdf8]",
    antennaColor: "from-cyan-300 via-sky-400 to-blue-500",
    antennaGlow: "0 0 16px rgba(56,189,248,1)",
    reactorColor: "from-cyan-400 to-blue-600",
    visorBorder: "border-cyan-400/60",
    earColor: "from-cyan-400 to-blue-600",
    message: "Ready to practice? Let's start a mock interview!",
  },
  {
    name: "mastery",
    eyeColor: "from-amber-200 via-amber-400 to-yellow-500",
    eyeGlow: "shadow-[0_0_14px_#fde047]",
    antennaColor: "from-amber-300 via-yellow-400 to-orange-500",
    antennaGlow: "0 0 16px rgba(251,191,36,1)",
    reactorColor: "from-amber-400 to-orange-600",
    visorBorder: "border-amber-400/70",
    earColor: "from-amber-400 to-orange-600",
    message: "Sharpen your edge! Jump into a practice interview.",
  },
  {
    name: "wink",
    eyeColor: "from-sky-200 via-sky-400 to-indigo-500",
    eyeGlow: "shadow-[0_0_12px_#38bdf8]",
    antennaColor: "from-sky-300 via-blue-400 to-indigo-500",
    antennaGlow: "0 0 16px rgba(99,102,241,1)",
    reactorColor: "from-sky-400 to-indigo-600",
    visorBorder: "border-sky-400/70",
    earColor: "from-sky-400 to-indigo-600",
    message: "Time for your daily mock interview session!",
  },
];

export const CompactAICoach: React.FC<CompactAICoachProps> = ({
  score = 10,
  userStreak = 2,
  scoreChange = 0,
  totalInterviews = 0,
  hasGivenInterview = false,
  userName = "Anurag",
}) => {
  // Temporary celebration / sad reaction states (auto-resets to normal after 7s)
  const [celebrationActive, setCelebrationActive] = useState(false);
  const [sadActive, setSadActive] = useState(false);
  const [announcementMsg, setAnnouncementMsg] = useState<string | null>(null);

  // Trigger celebration or sad reaction for 7 seconds then reset back to normal
  const triggerScoreReaction = useCallback((change: number) => {
    if (change > 0) {
      setCelebrationActive(true);
      setSadActive(false);
      setAnnouncementMsg(`🎉 Score increased by +${change}%! Outstanding work, ${userName}!`);
      setShowBubble(true);
      setTimeout(() => {
        setCelebrationActive(false);
        setAnnouncementMsg(null);
      }, 7000);
    } else if (change < 0) {
      setSadActive(true);
      setCelebrationActive(false);
      setAnnouncementMsg(`🥺 Score dropped by ${change}%. Let's bounce back with practice!`);
      setShowBubble(true);
      setTimeout(() => {
        setSadActive(false);
        setAnnouncementMsg(null);
      }, 7000);
    }
  }, [userName]);

  // Listen for test events from Dev Tool
  useEffect(() => {
    const handleTestScore = (e: any) => {
      if (e.detail && typeof e.detail.change !== "undefined") {
        if (e.detail.change !== null) {
          triggerScoreReaction(e.detail.change);
        } else {
          setCelebrationActive(false);
          setSadActive(false);
          setAnnouncementMsg(null);
        }
      }
    };
    window.addEventListener("voki:test-score", handleTestScore);
    return () => window.removeEventListener("voki:test-score", handleTestScore);
  }, [triggerScoreReaction]);

  // Trigger score reaction once on mount if score has changed
  useEffect(() => {
    if (scoreChange !== 0) {
      triggerScoreReaction(scoreChange);
    }
  }, [scoreChange, triggerScoreReaction]);

  // Check if user has already seen the tour in this browser session
  const [hasTouredSession] = useState<boolean>(() => {
    try {
      return sessionStorage.getItem("voki_has_toured") === "true";
    } catch {
      return false;
    }
  });

  const [step, setStep] = useState<TourStep>(hasTouredSession ? "home" : "greet");
  const [isDoneMoving, setIsDoneMoving] = useState<boolean>(hasTouredSession);
  const [isUserDragged, setIsUserDragged] = useState<boolean>(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWaving, setIsWaving] = useState(!hasTouredSession);
  const [showBubble, setShowBubble] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  // Cursor tracking coordinates (eyes look directly at cursor)
  const [eyeOffset, setEyeOffset] = useState({ x: 0, y: 0 });
  const [headAngle, setHeadAngle] = useState(0);

  // Check if tour is currently actively flying across cards
  const isTouring = !isDoneMoving && step !== "home" && !isUserDragged;

  // Actionable Mock Interview Reminders
  const interviewReminderPrompts = [
    "Take a 10-minute mock interview to test your responses.",
    "Practice makes perfect. Start your mock session today.",
    "Test your real-time speaking with Pro Voice AI.",
    "Simulate a real technical round before your actual interview.",
    "Have you practiced your interview questions today?",
    "Give a quick mock interview to keep your streak alive.",
    "Practice behavioral and technical questions in mock mode.",
    "One mock interview a day builds unstoppable confidence.",
  ];

  // Interactive emotion index (rotates between happy, mastery, and wink)
  const [emotionIndex, setEmotionIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const currentTheme = DEFAULT_THEMES[emotionIndex % DEFAULT_THEMES.length];
  const dockRef = useRef<HTMLDivElement>(null);

  const isAtDock = isDoneMoving || isUserDragged || step === "home";

  // Cursor eye tracking (active when at dock and not in special celebration/sad override)
  useEffect(() => {
    if (!isAtDock || celebrationActive || sadActive) {
      setEyeOffset({ x: 0, y: 0 });
      setHeadAngle(0);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const dockEl = document.getElementById("tour-mascot-dock");
      if (!dockEl) return;
      const rect = dockEl.getBoundingClientRect();
      const mascotCenterX = rect.left + rect.width / 2;
      const mascotCenterY = rect.top + rect.height / 2;

      const deltaX = e.clientX - mascotCenterX;
      const deltaY = e.clientY - mascotCenterY;
      const angle = Math.atan2(deltaY, deltaX);
      const distance = Math.hypot(deltaX, deltaY);

      if (distance > 10) {
        const maxOffset = 2.8;
        const intensity = Math.min(distance / 200, 1);
        const offsetX = Math.cos(angle) * maxOffset * intensity;
        const offsetY = Math.sin(angle) * maxOffset * intensity;
        const headTilt = Math.max(-6, Math.min(6, (deltaX / window.innerWidth) * 16));

        setEyeOffset({ x: offsetX, y: offsetY });
        setHeadAngle(headTilt);
      }
    };

    window.addEventListener("mousemove", handleMouseMove, { passive: true });
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, [isAtDock, celebrationActive, sadActive]);

  // Target offsets for flight tour
  const calculateTargetOffset = useCallback((targetId: string) => {
    if (!dockRef.current) return { x: 0, y: 0 };
    const targetEl = document.getElementById(targetId);
    if (!targetEl) return { x: 0, y: 0 };

    const dockRect = dockRef.current.getBoundingClientRect();
    const targetRect = targetEl.getBoundingClientRect();

    const deltaX = (targetRect.left + targetRect.width / 2) - (dockRect.left + dockRect.width / 2);
    const deltaY = (targetRect.top + targetRect.height / 3.2) - (dockRect.top + dockRect.height / 2);

    return { x: deltaX, y: deltaY };
  }, []);

  // Update position during tour
  useEffect(() => {
    if (isUserDragged) return;

    if (isDoneMoving || step === "home" || step === "greet") {
      setCoords({ x: 0, y: 0 });
      return;
    }

    const updatePosition = () => {
      let targetId = "";
      switch (step) {
        case "interview":
          targetId = "tour-pro-interview";
          break;
        case "percent":
          targetId = "tour-overall-score";
          break;
        case "details":
          targetId = "tour-view-details-btn";
          break;
        case "practice":
          targetId = "tour-daily-practice";
          break;
        default:
          targetId = "";
      }

      if (targetId) {
        const offset = calculateTargetOffset(targetId);
        setCoords(offset);
      } else {
        setCoords({ x: 0, y: 0 });
      }
    };

    updatePosition();
    window.addEventListener("resize", updatePosition);
    return () => window.removeEventListener("resize", updatePosition);
  }, [step, isDoneMoving, isUserDragged, calculateTargetOffset]);

  // Tour lifecycle
  useEffect(() => {
    if (hasTouredSession || isUserDragged) {
      setIsDoneMoving(true);
      setStep("home");
      return;
    }

    setStep("greet");
    setIsWaving(true);
    setShowBubble(true);

    const timer1 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("interview");
        setShowBubble(true);
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 1000);
      }
    }, 1800);

    const timer2 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("percent");
        setShowBubble(true);
      }
    }, 3800);

    const timer3 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("details");
        setShowBubble(true);
      }
    }, 5800);

    const timer4 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("practice");
        setShowBubble(true);
      }
    }, 7600);

    const timer5 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("home");
        setShowBubble(true);
        setIsDoneMoving(true);
        setIsWaving(false);
        try {
          sessionStorage.setItem("voki_has_toured", "true");
        } catch {
          // ignore
        }
      }
    }, 9400);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
      clearTimeout(timer4);
      clearTimeout(timer5);
    };
  }, [hasTouredSession, isUserDragged]);

  // Regular periodic quote & theme rotation (every 5 seconds)
  useEffect(() => {
    if (!isAtDock) return;

    const emotionInterval = setInterval(() => {
      if (!isInteracting && !announcementMsg) {
        setEmotionIndex((prev) => (prev + 1) % DEFAULT_THEMES.length);
        setQuoteIndex((prev) => (prev + 1) % interviewReminderPrompts.length);
        setShowBubble(true);
      }
    }, 5000);

    return () => clearInterval(emotionInterval);
  }, [isInteracting, isAtDock, announcementMsg, interviewReminderPrompts.length]);

  // Eye Blinking (active in normal mode)
  useEffect(() => {
    if (!isAtDock || celebrationActive || sadActive) {
      setIsBlinking(false);
      return;
    }

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 2400 + Math.random() * 800);

    return () => clearInterval(blinkInterval);
  }, [isAtDock, celebrationActive, sadActive]);

  // Message resolution
  const getMessage = () => {
    if (announcementMsg) {
      return announcementMsg;
    }

    if (isInteracting) {
      return currentTheme.message;
    }

    if (!isDoneMoving && !isUserDragged) {
      if (step === "greet") {
        return hasGivenInterview ? `Hi ${userName}! Welcome back!` : `Hi ${userName}! Ready for practice?`;
      }
      if (step === "interview") {
        return "Try Pro Interview with Voice & Video AI.";
      }
      if (step === "percent") {
        return `Current score is ${score}%. Keep pushing.`;
      }
      if (step === "details") {
        return "Click View Details for performance breakdown.";
      }
      if (step === "practice") {
        return `Maintain your ${userStreak}-day streak with daily practice.`;
      }
    }

    return interviewReminderPrompts[quoteIndex % interviewReminderPrompts.length];
  };

  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInteracting(true);
    setIsWaving(true);
    setEmotionIndex((prev) => (prev + 1) % DEFAULT_THEMES.length);
    setShowBubble(true);

    setTimeout(() => {
      setIsWaving(false);
      setIsInteracting(false);
    }, 3200);
  };

  const effectiveEyeOffset = isAtDock && !celebrationActive && !sadActive ? eyeOffset : { x: 0, y: 0 };

  return (
    <div ref={dockRef} id="tour-mascot-dock" className="relative flex items-center mr-4">
      {/* Compact Landing Dock for Voki Mascot */}
      <div className="relative w-12 h-10 flex items-center justify-center shrink-0">
        {/* Subtle Cyber Dock Glow */}
        <div
          className={`absolute inset-0 rounded-full ${
            celebrationActive
              ? "bg-amber-500/20 border border-amber-500/40 animate-pulse"
              : sadActive
              ? "bg-blue-500/10 border border-blue-500/20"
              : "bg-violet-500/10 border border-violet-500/20"
          } pointer-events-none transition-colors duration-500`}
        />

        {/* Draggable Mascot */}
        <motion.div
          drag
          dragMomentum={true}
          dragElastic={0.1}
          onDragStart={() => {
            setIsUserDragged(true);
            setIsDoneMoving(true);
          }}
          whileDrag={{ scale: 1.18, cursor: "grabbing" }}
          animate={
            isUserDragged
              ? undefined
              : {
                  x: coords.x,
                  y: coords.y,
                }
          }
          transition={{
            duration: 1.1,
            ease: [0.25, 0.1, 0.25, 1],
          }}
          className="absolute z-50 select-none flex items-center justify-center cursor-grab active:cursor-grabbing"
          style={{ touchAction: "none" }}
        >
          {/* Confetti & Golden Sparkles on Celebration */}
          {celebrationActive && (
            <div className="absolute -inset-4 pointer-events-none z-0 overflow-visible flex items-center justify-center">
              <motion.div
                animate={{
                  scale: [0.8, 1.4, 0.8],
                  opacity: [0.6, 1, 0.6],
                  rotate: [0, 45, 90],
                }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-3 -left-2 text-amber-300 font-bold text-xs"
              >
                ✦
              </motion.div>
              <motion.div
                animate={{
                  scale: [1, 1.5, 1],
                  opacity: [0.7, 1, 0.7],
                  rotate: [0, -45, -90],
                }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                className="absolute -top-4 right-0 text-yellow-300 font-bold text-sm"
              >
                ★
              </motion.div>
              <motion.div
                animate={{
                  scale: [0.6, 1.3, 0.6],
                  opacity: [0.4, 0.9, 0.4],
                }}
                transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                className="absolute top-2 -right-3 text-amber-200 text-xs"
              >
                ✨
              </motion.div>
            </div>
          )}

          {/* Clean Message Box */}
          <AnimatePresence mode="wait">
            {showBubble && (
              <motion.div
                key={quoteIndex + step + emotionIndex + (isInteracting ? "_int" : "") + (announcementMsg || "") + (celebrationActive ? "_cel" : "") + (sadActive ? "_sad" : "")}
                initial={{ opacity: 0, scale: 0.88, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -4 }}
                transition={{ duration: 0.22 }}
                className={`absolute bottom-[76px] left-1/2 -translate-x-1/2 min-w-[160px] max-w-[220px] bg-white/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-xl dark:shadow-2xl border ${
                  celebrationActive
                    ? "border-amber-400/60 dark:border-amber-500/50 shadow-amber-500/10 text-amber-950 dark:text-amber-200"
                    : sadActive
                    ? "border-sky-400/60 dark:border-sky-500/40 shadow-sky-500/10 text-sky-950 dark:text-sky-200"
                    : "border-border/80 dark:border-violet-500/30 text-slate-800 dark:text-slate-100"
                } cursor-pointer pointer-events-auto text-center`}
                onClick={handleMascotClick}
              >
                {/* Bubble Tail */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-white/95 dark:border-t-slate-950/95" />

                {/* Pure Clean Message */}
                <p className="text-[11.5px] font-medium leading-snug">
                  {getMessage()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Super Cute & Expressive Chibi Robot Mascot */}
          <div
            className="relative group cursor-pointer"
            onClick={handleMascotClick}
            onMouseEnter={() => setShowBubble(true)}
            title="Click to interact!"
          >
            {/* Dynamic Bobbing & Celebration Jumps */}
            <motion.div
              animate={{
                y: celebrationActive
                  ? [0, -12, 0, -6, 0]
                  : sadActive
                  ? [0, 4, 0]
                  : isInteracting
                  ? [0, -10, 0, -6, 0]
                  : [0, -6, 0],
                rotate: celebrationActive
                  ? [-4, 4, -4, 4, 0]
                  : sadActive
                  ? [-1, 1, -1]
                  : isWaving
                  ? [-5, 5, -5, 0]
                  : isAtDock
                  ? headAngle
                  : [-1.5, 1.5, -1.5],
                scale: sadActive ? [0.96, 0.99, 0.96] : celebrationActive ? [1, 1.06, 1] : [1, 1.03, 1],
              }}
              transition={{
                y: {
                  duration: celebrationActive ? 0.9 : sadActive ? 3.2 : isInteracting ? 0.7 : 2.4,
                  repeat: Infinity,
                  ease: "easeInOut",
                },
                rotate: {
                  duration: celebrationActive ? 0.45 : sadActive ? 2.5 : isWaving ? 0.38 : 0.3,
                  repeat: celebrationActive || sadActive ? Infinity : isWaving ? 3 : 0,
                  ease: "easeInOut",
                },
                scale: { duration: 2.0, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.18 }}
              whileTap={{ scale: 0.92 }}
              className="relative w-14 h-17 flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Antenna */}
              <div className="relative flex flex-col items-center -mb-0.5">
                <motion.div
                  animate={{
                    scale: celebrationActive ? [1, 1.5, 1] : sadActive ? [0.9, 1.05, 0.9] : [1, 1.25, 1],
                    boxShadow: [
                      celebrationActive
                        ? "0 0 24px rgba(251,191,36,1)"
                        : sadActive
                        ? "0 0 10px rgba(56,189,248,0.6)"
                        : currentTheme.antennaGlow,
                      celebrationActive
                        ? "0 0 28px rgba(251,191,36,1)"
                        : sadActive
                        ? "0 0 6px rgba(56,189,248,0.4)"
                        : "0 0 18px rgba(255,255,255,0.95)",
                      celebrationActive
                        ? "0 0 24px rgba(251,191,36,1)"
                        : sadActive
                        ? "0 0 10px rgba(56,189,248,0.6)"
                        : currentTheme.antennaGlow,
                    ],
                  }}
                  transition={{ duration: celebrationActive ? 0.7 : sadActive ? 2.8 : 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-3 h-3 rounded-full bg-gradient-to-br ${
                    celebrationActive
                      ? "from-amber-300 via-yellow-400 to-orange-500"
                      : sadActive
                      ? "from-sky-400 via-blue-500 to-indigo-600"
                      : currentTheme.antennaColor
                  } border-2 border-white shadow-md z-10 transition-colors duration-300 flex items-center justify-center`}
                >
                  <div className="w-1 h-1 rounded-full bg-white/90" />
                </motion.div>
                <div
                  className={`w-1 h-2 ${
                    sadActive
                      ? "rotate-3 bg-gradient-to-b from-sky-400 to-slate-600"
                      : "bg-gradient-to-b from-slate-300 to-slate-600"
                  } rounded-t-xs transition-transform duration-300`}
                />
              </div>

              {/* Head Shell */}
              <div
                className={`relative w-13 h-10 rounded-[18px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[2px] ${
                  celebrationActive
                    ? "border-amber-300/90 shadow-amber-500/20"
                    : sadActive
                    ? "border-sky-400/60 shadow-sky-500/10"
                    : "border-violet-300/80"
                } shadow-xl flex items-center justify-center overflow-hidden p-0.5 transition-colors duration-300`}
              >
                {/* Cat-Ear Headphone Pods */}
                <div
                  className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-full bg-gradient-to-b ${
                    celebrationActive
                      ? "from-amber-400 to-orange-600"
                      : sadActive
                      ? "from-sky-500 to-blue-600"
                      : currentTheme.earColor
                  } border border-white/70 shadow-xs transition-colors duration-300`}
                />
                <div
                  className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-full bg-gradient-to-b ${
                    celebrationActive
                      ? "from-amber-400 to-orange-600"
                      : sadActive
                      ? "from-sky-500 to-blue-600"
                      : currentTheme.earColor
                  } border border-white/70 shadow-xs transition-colors duration-300`}
                />

                {/* Visor Screen */}
                <div
                  className={`w-full h-full rounded-[14px] bg-slate-950 border ${
                    celebrationActive
                      ? "border-amber-400/90"
                      : sadActive
                      ? "border-sky-400/60"
                      : currentTheme.visorBorder
                  } flex items-center justify-around px-1.5 relative shadow-inner overflow-hidden transition-colors duration-300`}
                >
                  {/* Top Glass Gloss Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/35 to-transparent rounded-t-[12px] pointer-events-none z-30" />

                  {/* Expressive Eyebrows for Sad Emotion */}
                  {sadActive && (
                    <>
                      <div className="absolute top-1 left-2.5 w-3 h-0.5 bg-sky-300/90 rounded-full rotate-20 z-30 shadow-[0_0_4px_#38bdf8]" />
                      <div className="absolute top-1 right-2.5 w-3 h-0.5 bg-sky-300/90 rounded-full -rotate-20 z-30 shadow-[0_0_4px_#38bdf8]" />
                    </>
                  )}

                  {/* Cheeks */}
                  {celebrationActive ? (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1 left-1 w-2.5 h-1.5 rounded-full bg-rose-500 blur-[0.3px] z-20"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.4, 1], opacity: [0.8, 1, 0.8] }}
                        transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1 right-1 w-2.5 h-1.5 rounded-full bg-rose-500 blur-[0.3px] z-20"
                      />
                    </>
                  ) : sadActive ? (
                    <>
                      <div className="absolute bottom-1 left-1 w-2 h-1 rounded-full bg-indigo-500/40 blur-[0.4px] z-20" />
                      <div className="absolute bottom-1 right-1 w-2 h-1 rounded-full bg-indigo-500/40 blur-[0.4px] z-20" />
                    </>
                  ) : (
                    <>
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1 left-1 w-2.5 h-1.5 rounded-full bg-rose-500/80 blur-[0.4px] z-20"
                      />
                      <motion.div
                        animate={{ scale: [1, 1.2, 1], opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute bottom-1 right-1 w-2.5 h-1.5 rounded-full bg-rose-500/80 blur-[0.4px] z-20"
                      />
                    </>
                  )}

                  {/* LEFT EYE SOCKET */}
                  <div className="relative w-3.5 h-4.5 rounded-full bg-slate-900 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner z-10">
                    {celebrationActive ? (
                      /* Joyful Anime Squint Eye `^` */
                      <motion.div
                        animate={{ scaleY: [1, 1.2, 1], scaleX: [1, 1.1, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                        className="w-3 h-2 border-t-[3.5px] border-amber-300 rounded-t-full shadow-[0_0_12px_#fde047] z-20 mt-1"
                      />
                    ) : sadActive ? (
                      /* Sad / Drooping Gaze Eye */
                      <div className="relative w-2.5 h-3 rounded-full bg-gradient-to-b from-sky-400 to-indigo-600 shadow-[0_0_8px_#38bdf8] flex items-center justify-center translate-y-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-950/80 absolute translate-y-0.5" />
                        <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5 shadow-xs" />
                        <div className="w-0.5 h-0.5 rounded-full bg-sky-200 absolute bottom-0.5 left-0.5" />
                      </div>
                    ) : (
                      /* Standard Cursor-Tracking Boba Eye */
                      <motion.div
                        animate={{
                          x: effectiveEyeOffset.x,
                          y: effectiveEyeOffset.y,
                          scaleY: isBlinking ? 0.08 : 1,
                          scaleX: isBlinking ? 1.25 : 1,
                        }}
                        transition={{
                          x: { type: "spring", stiffness: 350, damping: 25 },
                          y: { type: "spring", stiffness: 350, damping: 25 },
                          scaleY: { duration: 0.09 },
                          scaleX: { duration: 0.09 },
                        }}
                        className={`w-2.5 h-3.5 rounded-full bg-gradient-to-b ${currentTheme.eyeColor} ${currentTheme.eyeGlow} flex items-center justify-center relative shadow-sm`}
                      >
                        {!isBlinking && (
                          <>
                            <div className="w-1.5 h-2 rounded-full bg-slate-950/70 absolute" />
                            <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5 shadow-xs" />
                            <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>

                  {/* CUTE EXPRESSIVE DIGITAL MOUTH */}
                  {celebrationActive ? (
                    /* Big Joyful Open Smile :D */
                    <motion.div
                      animate={{ scale: [1, 1.3, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                      className="w-3 h-2 bg-gradient-to-b from-emerald-400 to-emerald-500 rounded-b-full border border-white/80 shadow-[0_0_8px_#34d399] z-20 flex items-center justify-center"
                    >
                      <div className="w-1.5 h-0.5 bg-rose-400 rounded-full mb-0.5" />
                    </motion.div>
                  ) : sadActive ? (
                    /* Distinct Sad Frown */
                    <motion.div
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                      className="w-2.5 h-1.5 border-t-[3px] border-sky-400 rounded-t-full shadow-[0_0_8px_#38bdf8] z-20 mt-1.5"
                    />
                  ) : currentTheme.name === "wink" ? (
                    <div className="w-1.5 h-1 border-b-[2px] border-cyan-300 rounded-b-md shadow-[0_0_4px_#67e8f9] z-20 rotate-6" />
                  ) : (
                    <motion.div
                      animate={{ scale: isWaving ? [1, 1.3, 1] : 1 }}
                      className="w-2 h-1.5 border-b-[2px] border-cyan-300 rounded-b-full shadow-[0_0_4px_#67e8f9] z-20"
                    />
                  )}

                  {/* RIGHT EYE SOCKET */}
                  <div className="relative w-3.5 h-4.5 rounded-full bg-slate-900 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner z-10">
                    {celebrationActive ? (
                      /* Joyful Anime Squint Eye `^` */
                      <motion.div
                        animate={{ scaleY: [1, 1.2, 1], scaleX: [1, 1.1, 1] }}
                        transition={{ duration: 0.8, repeat: Infinity, ease: "easeInOut" }}
                        className="w-3 h-2 border-t-[3.5px] border-amber-300 rounded-t-full shadow-[0_0_12px_#fde047] z-20 mt-1"
                      />
                    ) : sadActive ? (
                      /* Sad / Drooping Gaze Eye */
                      <div className="relative w-2.5 h-3 rounded-full bg-gradient-to-b from-sky-400 to-indigo-600 shadow-[0_0_8px_#38bdf8] flex items-center justify-center translate-y-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-950/80 absolute translate-y-0.5" />
                        <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5 shadow-xs" />
                        <div className="w-0.5 h-0.5 rounded-full bg-sky-200 absolute bottom-0.5 left-0.5" />
                      </div>
                    ) : currentTheme.name === "wink" ? (
                      /* Playful Wink Arc */
                      <div className="w-2.5 h-1.5 border-t-[2.5px] border-sky-300 rounded-t-full shadow-[0_0_8px_#38bdf8] mt-0.5" />
                    ) : (
                      /* Standard Cursor-Tracking Boba Eye */
                      <motion.div
                        animate={{
                          x: effectiveEyeOffset.x,
                          y: effectiveEyeOffset.y,
                          scaleY: isBlinking ? 0.08 : 1,
                          scaleX: isBlinking ? 1.25 : 1,
                        }}
                        transition={{
                          x: { type: "spring", stiffness: 350, damping: 25 },
                          y: { type: "spring", stiffness: 350, damping: 25 },
                          scaleY: { duration: 0.09 },
                          scaleX: { duration: 0.09 },
                        }}
                        className={`w-2.5 h-3.5 rounded-full bg-gradient-to-b ${currentTheme.eyeColor} ${currentTheme.eyeGlow} flex items-center justify-center relative shadow-sm`}
                      >
                        {!isBlinking && (
                          <>
                            <div className="w-1.5 h-2 rounded-full bg-slate-950/70 absolute" />
                            <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5 shadow-xs" />
                            <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Robot Torso */}
              <div
                className={`relative w-10 h-5 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[1.5px] ${
                  celebrationActive
                    ? "border-amber-400/80"
                    : sadActive
                    ? "border-sky-400/60"
                    : "border-violet-400/60"
                } shadow-md flex items-center justify-center -mt-0.5`}
              >
                {/* Mini Power Reactor */}
                <motion.div
                  animate={{ scale: celebrationActive ? [1, 1.45, 1] : [1, 1.2, 1] }}
                  transition={{ duration: celebrationActive ? 0.6 : 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-3 h-3 rounded-full bg-gradient-to-br ${
                    celebrationActive
                      ? "from-amber-400 to-orange-600"
                      : sadActive
                      ? "from-sky-400 to-blue-600"
                      : currentTheme.reactorColor
                  } shadow-md flex items-center justify-center transition-colors duration-300 border border-white/40`}
                >
                  <Zap className="w-1.5 h-1.5 text-white fill-white" />
                </motion.div>

                {/* Left Mitten Arm - Victory Waving on Celebration */}
                <motion.div
                  animate={{
                    rotate: celebrationActive
                      ? [-60, 50, -60]
                      : sadActive
                      ? [-5, 5, -5]
                      : step === "greet" || isWaving || isInteracting
                      ? [-25, 60, -25, 60, 0]
                      : [-12, 0, -12],
                    originX: 1,
                    originY: 0,
                  }}
                  transition={{
                    duration: celebrationActive
                      ? 0.35
                      : sadActive
                      ? 2.5
                      : isWaving || step === "greet" || isInteracting
                      ? 0.38
                      : 2,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -left-2 top-0.5 w-1.5 h-3.5 rounded-full bg-violet-500 border border-white/50 flex items-end justify-center pb-0.5 shadow-xs"
                >
                  <div
                    className={`w-1 h-1 rounded-full ${
                      celebrationActive
                        ? "bg-amber-300 shadow-[0_0_4px_#fde047]"
                        : "bg-cyan-300 shadow-[0_0_4px_#67e8f9]"
                    }`}
                  />
                </motion.div>

                {/* Right Mitten Arm - Victory Waving on Celebration */}
                <motion.div
                  animate={{
                    rotate: celebrationActive
                      ? [60, -50, 60]
                      : sadActive
                      ? [5, -5, 5]
                      : isInteracting
                      ? [25, -50, 25, -50, 0]
                      : [5, 18, 5],
                    originX: 0,
                    originY: 0,
                  }}
                  transition={{
                    duration: celebrationActive
                      ? 0.35
                      : sadActive
                      ? 2.5
                      : isInteracting
                      ? 0.38
                      : 1.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="absolute -right-2 top-0.5 w-1.5 h-3.5 rounded-full bg-violet-500 border border-white/50 flex items-end justify-center pb-0.5 shadow-xs"
                >
                  <div
                    className={`w-1 h-1 rounded-full ${
                      celebrationActive
                        ? "bg-amber-300 shadow-[0_0_4px_#fde047]"
                        : "bg-cyan-300 shadow-[0_0_4px_#67e8f9]"
                    }`}
                  />
                </motion.div>
              </div>

              {/* Floating Energy Base */}
              <motion.div
                animate={{
                  scale: celebrationActive
                    ? [1.2, 1.6, 1.2]
                    : sadActive
                    ? [0.7, 1.0, 0.7]
                    : [0.8, 1.25, 0.8],
                  opacity: celebrationActive ? [0.7, 1, 0.7] : [0.5, 0.8, 0.5],
                }}
                transition={{ duration: celebrationActive ? 0.9 : 2.2, repeat: Infinity, ease: "easeInOut" }}
                className={`w-6 h-1.5 rounded-full blur-[1px] mt-0.5 ${
                  celebrationActive ? "bg-amber-400" : "bg-cyan-400/70"
                }`}
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
