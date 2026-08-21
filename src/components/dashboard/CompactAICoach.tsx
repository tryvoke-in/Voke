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

const EMOTION_THEMES: EmotionTheme[] = [
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

  // Direct, Actionable Mock Interview Reminders
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

  // Interactive emotion index
  const [emotionIndex, setEmotionIndex] = useState(0);
  const [isInteracting, setIsInteracting] = useState(false);

  const currentTheme = EMOTION_THEMES[emotionIndex % EMOTION_THEMES.length];
  const dockRef = useRef<HTMLDivElement>(null);

  const isAtDock = isDoneMoving || isUserDragged || step === "home";

  // Mathematically precise Trigonometric Cursor Eye Tracking (active ONLY when at dock)
  useEffect(() => {
    if (!isAtDock) {
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
  }, [isAtDock]);

  // Dynamically calculate precise offsets using real DOM bounding rects
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

  // Update coordinates whenever the tour step changes
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

  // Play tour ONLY on initial website open, NOT on every refresh
  useEffect(() => {
    if (hasTouredSession || isUserDragged) {
      setIsDoneMoving(true);
      setStep("home");
      return;
    }

    // Step 1: Greet at Home Dock (0s - 1.8s)
    setStep("greet");
    setIsWaving(true);
    setShowBubble(true);

    // Step 2: Travel to Pro Interview Card (1.8s - 3.8s)
    const timer1 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("interview");
        setShowBubble(true);
        setIsWaving(true);
        setTimeout(() => setIsWaving(false), 1000);
      }
    }, 1800);

    // Step 3: Travel to Overall Score Progress Bar (3.8s - 5.8s)
    const timer2 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("percent");
        setShowBubble(true);
      }
    }, 3800);

    // Step 4: Travel to View Details Button (5.8s - 7.6s)
    const timer3 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("details");
        setShowBubble(true);
      }
    }, 5800);

    // Step 5: Travel to Daily Practice Card (7.6s - 9.4s)
    const timer4 = setTimeout(() => {
      if (!isUserDragged) {
        setStep("practice");
        setShowBubble(true);
      }
    }, 7600);

    // Step 6: Return Home Dock & Save to SessionStorage so refresh doesn't trigger it again
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

  // Rotate mock interview reminder quotes periodically (every 5 seconds) once settled at dock
  useEffect(() => {
    if (!isAtDock) return;

    const emotionInterval = setInterval(() => {
      if (!isInteracting) {
        setEmotionIndex((prev) => (prev + 1) % EMOTION_THEMES.length);
        setQuoteIndex((prev) => (prev + 1) % interviewReminderPrompts.length);
        setShowBubble(true);
      }
    }, 5000);

    return () => clearInterval(emotionInterval);
  }, [isInteracting, isAtDock, interviewReminderPrompts.length]);

  // Continuous Periodic Eye Blinking ONLY when settled at dock
  useEffect(() => {
    if (!isAtDock) {
      setIsBlinking(false);
      return;
    }

    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 140);
    }, 2400 + Math.random() * 800);

    return () => clearInterval(blinkInterval);
  }, [isAtDock]);

  // Dialogue corresponding to tour steps or user clicks (NO EMOJIS, NO "CHAMPION")
  const getMessage = () => {
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

  // Click handler: switches emotion, changes color themes, animates mascot!
  const handleMascotClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInteracting(true);
    setIsWaving(true);
    setEmotionIndex((prev) => (prev + 1) % EMOTION_THEMES.length);
    setShowBubble(true);

    setTimeout(() => {
      setIsWaving(false);
      setIsInteracting(false);
    }, 3200);
  };

  const effectiveEyeOffset = isAtDock ? eyeOffset : { x: 0, y: 0 };

  return (
    <div ref={dockRef} id="tour-mascot-dock" className="relative flex items-center mr-4">
      {/* Compact Landing Dock for Voki Mascot */}
      <div className="relative w-12 h-10 flex items-center justify-center shrink-0">
        {/* Subtle Cyber Dock Glow */}
        <div className="absolute inset-0 rounded-full bg-violet-500/10 border border-violet-500/20 pointer-events-none" />

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
          {/* Clean Message Box */}
          <AnimatePresence mode="wait">
            {showBubble && (
              <motion.div
                key={quoteIndex + step + emotionIndex + (isInteracting ? "_int" : "")}
                initial={{ opacity: 0, scale: 0.88, y: 4 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.88, y: -4 }}
                transition={{ duration: 0.22 }}
                className="absolute bottom-[76px] left-1/2 -translate-x-1/2 min-w-[160px] max-w-[220px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl px-3.5 py-2.5 shadow-2xl border border-violet-500/30 cursor-pointer pointer-events-auto text-center"
                onClick={handleMascotClick}
              >
                {/* Bubble Tail */}
                <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-900/95 dark:border-t-slate-950/95" />

                {/* Pure Clean Message */}
                <p className="text-[11.5px] font-medium text-foreground leading-snug">
                  {getMessage()}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Super Cute & Adorable Chibi Robot Mascot */}
          <div
            className="relative group cursor-pointer"
            onClick={handleMascotClick}
            onMouseEnter={() => setShowBubble(true)}
            title="Click to interact, or move your mouse to watch Voki follow your cursor!"
          >
            {/* Floating / Bobbing Hover Physics + Cursor Angle Tilt */}
            <motion.div
              animate={{
                y: isInteracting ? [0, -10, 0, -6, 0] : [0, -6, 0],
                rotate: isWaving ? [-5, 5, -5, 0] : isAtDock ? headAngle : [-1.5, 1.5, -1.5],
                scale: [1, 1.03, 1],
              }}
              transition={{
                y: { duration: isInteracting ? 0.7 : 2.4, repeat: Infinity, ease: "easeInOut" },
                rotate: { duration: isWaving ? 0.38 : 0.3, repeat: isWaving ? 3 : 0, ease: "easeOut" },
                scale: { duration: 2.2, repeat: Infinity, ease: "easeInOut" },
              }}
              whileHover={{ scale: 1.18 }}
              whileTap={{ scale: 0.92 }}
              className="relative w-14 h-17 flex flex-col items-center justify-center pointer-events-none"
            >
              {/* Cute Bouncy Antenna with Glowing Candy Orb */}
              <div className="relative flex flex-col items-center -mb-0.5">
                <motion.div
                  animate={{
                    scale: isInteracting ? [1, 1.45, 1] : [1, 1.25, 1],
                    boxShadow: [
                      currentTheme.antennaGlow,
                      "0 0 18px rgba(255,255,255,0.95)",
                      currentTheme.antennaGlow,
                    ],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-3 h-3 rounded-full bg-gradient-to-br ${currentTheme.antennaColor} border-2 border-white shadow-md z-10 transition-colors duration-300 flex items-center justify-center`}
                >
                  <div className="w-1 h-1 rounded-full bg-white/90" />
                </motion.div>
                <div className="w-1 h-2 bg-gradient-to-b from-slate-300 to-slate-600 rounded-t-xs" />
              </div>

              {/* Super Cute Pillowy Head (Chibi Curved Corners) */}
              <div className={`relative w-13 h-10 rounded-[18px] bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[2px] border-violet-300/80 shadow-xl flex items-center justify-center overflow-hidden p-0.5 transition-colors duration-300`}>
                {/* Cute Round Cat-Ear Headphone Pods */}
                <div className={`absolute -left-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-full bg-gradient-to-b ${currentTheme.earColor} border border-white/70 shadow-xs transition-colors duration-300`} />
                <div className={`absolute -right-1.5 top-1/2 -translate-y-1/2 w-2 h-5 rounded-full bg-gradient-to-b ${currentTheme.earColor} border border-white/70 shadow-xs transition-colors duration-300`} />

                {/* Visor Screen with 3D Luminous Eye Sockets & Interactive Eyeballs */}
                <div className={`w-full h-full rounded-[14px] bg-slate-950 border ${currentTheme.visorBorder} flex items-center justify-around px-1.5 relative shadow-inner overflow-hidden transition-colors duration-300`}>
                  {/* Top Glass Gloss Highlight */}
                  <div className="absolute top-0 left-0 right-0 h-2 bg-gradient-to-b from-white/35 to-transparent rounded-t-[12px] pointer-events-none z-30" />

                  {/* Cute Fluffy Blushing Pink Cheeks */}
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1 left-1 w-2.5 h-1.5 rounded-full bg-rose-500/80 blur-[0.4px] z-20"
                  />
                  <motion.div
                    animate={{ scale: [1, 1.25, 1], opacity: [0.7, 1, 0.7] }}
                    transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
                    className="absolute bottom-1 right-1 w-2.5 h-1.5 rounded-full bg-rose-500/80 blur-[0.4px] z-20"
                  />

                  {/* LEFT EYE SOCKET & EYEBALL */}
                  <div className="relative w-3.5 h-4.5 rounded-full bg-slate-900 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner z-10">
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
                          {/* Inner Dark Pupil */}
                          <div className="w-1.5 h-2 rounded-full bg-slate-950/70 absolute" />
                          {/* Primary White Catchlight Sparkle */}
                          <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5 shadow-xs" />
                          {/* Micro Glint */}
                          <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                        </>
                      )}
                    </motion.div>
                  </div>

                  {/* CUTE DIGITAL MOUTH */}
                  {currentTheme.name === "wink" ? (
                    <div className="w-1.5 h-1 border-b-[2px] border-cyan-300 rounded-b-md shadow-[0_0_4px_#67e8f9] z-20 rotate-6" />
                  ) : (
                    <motion.div
                      animate={{ scale: isWaving ? [1, 1.3, 1] : 1 }}
                      className="w-2 h-1.5 border-b-[2px] border-cyan-300 rounded-b-full shadow-[0_0_4px_#67e8f9] z-20"
                    />
                  )}

                  {/* RIGHT EYE SOCKET & EYEBALL */}
                  <div className="relative w-3.5 h-4.5 rounded-full bg-slate-900 border border-cyan-500/30 overflow-hidden flex items-center justify-center shadow-inner z-10">
                    {currentTheme.name === "wink" ? (
                      /* Playful Wink Arc */
                      <div className="w-2.5 h-1.5 border-t-[2.5px] border-sky-300 rounded-t-full shadow-[0_0_8px_#38bdf8] mt-0.5" />
                    ) : (
                      /* Glowing Boba Eyeball with Real-time Cursor Direction Tracking */
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
                            {/* Inner Dark Pupil */}
                            <div className="w-1.5 h-2 rounded-full bg-slate-950/70 absolute" />
                            {/* Primary White Catchlight Sparkle */}
                            <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5 shadow-xs" />
                            {/* Micro Glint */}
                            <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                          </>
                        )}
                      </motion.div>
                    )}
                  </div>
                </div>
              </div>

              {/* Chubby Cute Robot Torso */}
              <div className="relative w-10 h-5 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[1.5px] border-violet-400/60 shadow-md flex items-center justify-center -mt-0.5">
                {/* Cute Mini Power Reactor */}
                <motion.div
                  animate={{ scale: isInteracting ? [1, 1.4, 1] : [1, 1.2, 1] }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: "easeInOut" }}
                  className={`w-3 h-3 rounded-full bg-gradient-to-br ${currentTheme.reactorColor} shadow-md flex items-center justify-center transition-colors duration-300 border border-white/40`}
                >
                  <Zap className="w-1.5 h-1.5 text-white fill-white" />
                </motion.div>

                {/* Left Cute Mitten Arm */}
                <motion.div
                  animate={{
                    rotate:
                      step === "greet" || isWaving || isInteracting
                        ? [-25, 60, -25, 60, 0]
                        : step === "interview"
                        ? [-45, 20, -45]
                        : [-12, 0, -12],
                    originX: 1,
                    originY: 0
                  }}
                  transition={{
                    duration: isWaving || step === "greet" || isInteracting ? 0.38 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -left-2 top-0.5 w-1.5 h-3.5 rounded-full bg-violet-500 border border-white/50 flex items-end justify-center pb-0.5 shadow-xs"
                >
                  <div className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_4px_#67e8f9]" />
                </motion.div>

                {/* Right Cute Mitten Arm */}
                <motion.div
                  animate={{
                    rotate:
                      isInteracting
                        ? [25, -50, 25, -50, 0]
                        : step === "details" || step === "practice"
                        ? [40, 60, 40]
                        : [5, 18, 5],
                    originX: 0,
                    originY: 0
                  }}
                  transition={{
                    duration: isInteracting ? 0.38 : 1.6,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="absolute -right-2 top-0.5 w-1.5 h-3.5 rounded-full bg-violet-500 border border-white/50 flex items-end justify-center pb-0.5 shadow-xs"
                >
                  <div className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_4px_#67e8f9]" />
                </motion.div>
              </div>

              {/* Cute Floating Energy Base */}
              <motion.div
                animate={{ scale: [0.8, 1.25, 0.8], opacity: [0.5, 0.9, 0.5] }}
                transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
                className="w-6 h-1.5 rounded-full blur-[1px] mt-0.5 bg-cyan-400/70"
              />
            </motion.div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};
