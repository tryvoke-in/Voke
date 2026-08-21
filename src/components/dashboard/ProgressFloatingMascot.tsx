import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Zap } from "lucide-react";

interface ProgressFloatingMascotProps {
  score: number;
  scoreChange?: number;
  onOpenDetails?: () => void;
  isExpanded?: boolean;
}

type TourStep = "greet" | "percent" | "details" | "home";

const SHORT_MOTIVATIONAL_QUOTES = [
  "You are ready. Keep practicing.",
  "Preparation brings confidence.",
  "Consistency is your strength.",
  "Focus on progress, not perfection.",
  "Every session sharpens your skills.",
  "Small daily efforts yield big results.",
  "Stay disciplined. You are on track.",
  "One question at a time builds mastery.",
  "Turn nervous energy into focus.",
  "Confidence comes from preparation.",
  "Great achievements take daily practice.",
  "Your dedication will pay off.",
];

export const ProgressFloatingMascot: React.FC<ProgressFloatingMascotProps> = ({
  score,
  scoreChange = 0,
  onOpenDetails,
  isExpanded = false,
}) => {
  const isHappy = scoreChange > 0 || score >= 50;

  const [step, setStep] = useState<TourStep>("greet");
  const [isDoneMoving, setIsDoneMoving] = useState<boolean>(false);
  const [isUserDragged, setIsUserDragged] = useState<boolean>(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWaving, setIsWaving] = useState(true);
  const [showBubble, setShowBubble] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Complete On-Refresh Tour Sequence:
  // Step 1: Say "Hi!" and wave (0s - 2.4s)
  // Step 2: Travel to Percent & Progress Bar (2.4s - 5.2s)
  // Step 3: Travel to View Details button (5.2s - 8.0s)
  // Step 4: Return Home to Progress Bar & begin short daily focus quotes (8.0s+)
  useEffect(() => {
    if (isUserDragged || isExpanded) return;

    // Step 1: Greet and wave at user on refresh
    setStep("greet");
    setIsWaving(true);
    setShowBubble(true);

    // Step 2: Travel to Percent text after 2.4s
    const timer1 = setTimeout(() => {
      if (!isUserDragged && !isExpanded) {
        setStep("percent");
        setShowBubble(true);
      }
    }, 2400);

    // Step 3: Travel to View Details button after 5.2s
    const timer2 = setTimeout(() => {
      if (!isUserDragged && !isExpanded) {
        setStep("details");
        setShowBubble(true);
      }
    }, 5200);

    // Step 4: Return Home to Progress Bar after 8.0s
    const timer3 = setTimeout(() => {
      if (!isUserDragged && !isExpanded) {
        setStep("home");
        setShowBubble(true);
        setIsDoneMoving(true);
        setIsWaving(false);
      }
    }, 8000);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(timer3);
    };
  }, [isUserDragged, isExpanded]);

  // Frequently rotate motivational quotes every 5 seconds once settled
  useEffect(() => {
    const quoteInterval = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % SHORT_MOTIVATIONAL_QUOTES.length);
      setShowBubble(true);
    }, 5000);

    return () => clearInterval(quoteInterval);
  }, []);

  // Continuous Periodic Eye Blinking (every 2.4 - 3.2s)
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 160);
    }, 2400 + Math.random() * 1000);

    return () => clearInterval(blinkInterval);
  }, []);

  // When isExpanded changes: animate to the empty space below feature cards!
  useEffect(() => {
    setIsUserDragged(false);
    setShowBubble(true);
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1400);
  }, [isExpanded]);

  // Coordinates calculation
  const getCoordinates = () => {
    if (isExpanded) {
      const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
      if (isDesktop) {
        const targetX = -Math.min(640, Math.max(440, window.innerWidth * 0.38));
        const targetY = 410;
        return { x: targetX, y: targetY }; // Empty space below feature cards on left
      }
      return { x: 0, y: -8 };
    }

    if (!isDoneMoving) {
      switch (step) {
        case "greet":
          return { x: 0, y: 10 }; // Top-right starting spot for initial wave & greeting
        case "percent":
          return { x: -165, y: 8 }; // Over Progress Bar & Score %
        case "details":
          return { x: -20, y: 215 }; // Above View Details button
        case "home":
        default:
          return { x: -165, y: 8 }; // Home on Progress Bar
      }
    }

    return { x: -165, y: 8 }; // Default resting position: on the Progress Bar
  };

  // Clean, professional messages for each step of the tour and daily focus
  const getMessage = () => {
    if (isExpanded && quoteIndex % 2 === 0) {
      return "Detailed analytics breakdown.";
    }

    if (!isDoneMoving && !isUserDragged && !isExpanded) {
      if (step === "greet") {
        return "Hi! Ready for practice?";
      }
      if (step === "percent") {
        return `Current score is ${score}%.`;
      }
      if (step === "details") {
        return "Click View Details for analytics.";
      }
    }

    // Dynamic frequently rotating motivational quote
    return SHORT_MOTIVATIONAL_QUOTES[quoteIndex % SHORT_MOTIVATIONAL_QUOTES.length];
  };

  const coords = getCoordinates();

  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1600);
    setQuoteIndex((prev) => (prev + 1) % SHORT_MOTIVATIONAL_QUOTES.length);
    setShowBubble(true);
  };

  return (
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
        duration: 2.0,
        ease: [0.35, 0.1, 0.25, 1],
      }}
      className="absolute top-2 right-4 z-50 select-none flex items-center justify-end cursor-grab active:cursor-grabbing"
      style={{ touchAction: "none" }}
    >
      {/* Sleek, Minimal Message Box (No Emojis, Short Text, Smooth Refresh Animation) */}
      <AnimatePresence mode="wait">
        {showBubble && (
          <motion.div
            key={quoteIndex + step + (isExpanded ? "_exp" : "_col")}
            initial={{ opacity: 0, scale: 0.88, y: 4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: -4 }}
            transition={{ duration: 0.25 }}
            className={`absolute ${
              isExpanded ? "left-[76px] top-1/2 -translate-y-1/2" : "right-[82px] top-1/2 -translate-y-1/2"
            } min-w-[145px] max-w-[195px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl px-3 py-2 shadow-2xl border border-violet-500/30 cursor-pointer pointer-events-auto`}
            onClick={handlePoke}
          >
            {/* Bubble Tail */}
            {isExpanded ? (
              <div className="absolute top-1/2 -left-1.5 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[6px] border-r-slate-900/95 dark:border-r-slate-950/95" />
            ) : (
              <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-slate-900/95 dark:border-l-slate-950/95" />
            )}

            <div className="flex items-center justify-between mb-0.5">
              <span className="text-[8.5px] font-bold text-violet-400 uppercase tracking-wider">
                {step === "greet" && !isDoneMoving
                  ? "Welcome"
                  : isExpanded
                  ? "Overview"
                  : isDoneMoving || isUserDragged
                  ? "Daily Focus"
                  : "Progress Guide"}
              </span>
            </div>

            <p className="text-[11px] font-medium text-foreground leading-snug">
              {getMessage()}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Super Cute & Happy Robot Mascot */}
      <div
        className="relative group cursor-grab active:cursor-grabbing"
        onClick={handlePoke}
        onMouseEnter={() => setShowBubble(true)}
        title="Drag Voki anywhere across the website!"
      >
        {/* Soft Ambient Glow Aura */}
        <div className="absolute -inset-2.5 rounded-full blur-md opacity-75 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r from-violet-500/35 via-fuchsia-500/25 to-cyan-500/35 animate-pulse" />

        {/* Floating / Bobbing Hover Animation */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: isWaving ? [-3, 3, -3, 0] : [0, 1.2, 0, -1.2, 0],
          }}
          transition={{
            y: { duration: 2.4, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: isWaving ? 0.5 : 3.6, repeat: isWaving ? 2 : Infinity, ease: "easeInOut" }
          }}
          whileHover={{ scale: 1.12 }}
          whileTap={{ scale: 0.95 }}
          className="relative w-16 h-20 flex flex-col items-center justify-center pointer-events-none"
        >
          {/* Antenna */}
          <div className="relative flex flex-col items-center">
            {/* Glowing Energy Orb on Antenna */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                boxShadow: [
                  "0 0 8px rgba(168,85,247,0.7)",
                  "0 0 16px rgba(168,85,247,1)",
                  "0 0 8px rgba(168,85,247,0.7)"
                ]
              }}
              transition={{ duration: 1.4, repeat: Infinity, ease: "easeInOut" }}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-violet-400 via-fuchsia-400 to-pink-400 border-2 border-white shadow-md z-10"
            />
            {/* Antenna Rod */}
            <div className="w-0.5 h-2 bg-gradient-to-b from-violet-300 to-slate-600 rounded-t-sm" />
          </div>

          {/* Cute Robot Head with Rounded Curves */}
          <div className="relative w-15 h-11 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-violet-400/80 shadow-xl flex items-center justify-center overflow-hidden p-0.5">
            {/* Headphone Ear Cups */}
            <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-l-md bg-gradient-to-b from-violet-500 to-fuchsia-600 border border-violet-300 shadow-xs" />
            <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-md bg-gradient-to-b from-violet-500 to-fuchsia-600 border border-violet-300 shadow-xs" />

            {/* Glowing Face Visor Screen with Cute Happy Eyes & Blushing Cheeks */}
            <div className="w-full h-full rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-around px-2 relative shadow-inner overflow-hidden">
              {/* Glass Reflection Highlight */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 rounded-t-lg pointer-events-none" />

              {/* Cute Blushing Pink Cheeks */}
              <div className="absolute bottom-1.5 left-1.5 w-2 h-1 rounded-full bg-rose-500/70 blur-[0.5px]" />
              <div className="absolute bottom-1.5 right-1.5 w-2 h-1 rounded-full bg-rose-500/70 blur-[0.5px]" />

              {/* Left Eye */}
              <motion.div
                animate={{
                  scaleY: isBlinking ? 0.08 : 1,
                  scaleX: isBlinking ? 1.25 : 1,
                }}
                transition={{ duration: 0.1 }}
                className="w-2.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center relative"
              >
                {!isBlinking && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5" />
                    <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                  </>
                )}
              </motion.div>

              {/* Cute Digital Smile */}
              <motion.div
                animate={{
                  scale: isWaving ? [1, 1.3, 1] : 1,
                }}
                className="w-2 h-1.5 border-b-2 border-cyan-400 rounded-b-full shadow-[0_0_4px_#22d3ee]"
              />

              {/* Right Eye */}
              <motion.div
                animate={{
                  scaleY: isBlinking ? 0.08 : 1,
                  scaleX: isBlinking ? 1.25 : 1,
                }}
                transition={{ duration: 0.1 }}
                className="w-2.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center relative"
              >
                {!isBlinking && (
                  <>
                    <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5" />
                    <div className="w-0.5 h-0.5 rounded-full bg-white absolute bottom-0.5 left-0.5" />
                  </>
                )}
              </motion.div>
            </div>
          </div>

          {/* Robot Neck */}
          <div className="w-2.5 h-0.5 bg-slate-700 -my-0.5 z-0" />

          {/* Robot Torso */}
          <div className="relative w-11 h-6 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[1.5px] border-violet-400/60 shadow-md flex items-center justify-center">
            {/* Chest Core Power Orb */}
            <motion.div
              animate={{
                scale: [1, 1.25, 1],
              }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-3 h-3 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_8px_#f97316] flex items-center justify-center"
            >
              <Zap className="w-1.5 h-1.5 text-white fill-white" />
            </motion.div>

            {/* Left Arm */}
            <motion.div
              animate={{
                rotate:
                  step === "greet" || isWaving
                    ? [-25, 55, -25, 55, 0]
                    : isExpanded
                    ? [-30, 20, -30]
                    : step === "percent" || isDoneMoving
                    ? [-35, 15, -35]
                    : [-10, 0, -10],
                originX: 1,
                originY: 0
              }}
              transition={{
                duration: isWaving || step === "greet" ? 0.45 : 2,
                repeat: isWaving || step === "greet" ? Infinity : Infinity,
                ease: "easeInOut"
              }}
              className="absolute -left-2 top-0.5 w-1.5 h-4 rounded-full bg-violet-600 border border-violet-300 shadow-xs flex items-end justify-center pb-0.5"
            >
              <div className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_3px_#67e8f9]" />
            </motion.div>

            {/* Right Arm */}
            <motion.div
              animate={{
                rotate: isExpanded ? [-20, 10, -20] : step === "details" ? [40, 60, 40] : [5, 15, 5],
                originX: 0,
                originY: 0
              }}
              transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-2 top-0.5 w-1.5 h-4 rounded-full bg-violet-600 border border-violet-300 shadow-xs flex items-end justify-center pb-0.5"
            >
              <div className="w-1 h-1 rounded-full bg-cyan-300 shadow-[0_0_3px_#67e8f9]" />
            </motion.div>
          </div>

          {/* Floating Base Glow */}
          <motion.div
            animate={{
              scale: [0.8, 1.25, 0.8],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-7 h-1.5 rounded-full blur-[1px] mt-1 bg-cyan-400/60"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
