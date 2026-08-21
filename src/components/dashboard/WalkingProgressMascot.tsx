import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Zap, Flame, Trophy } from "lucide-react";

interface WalkingProgressMascotProps {
  score: number;
  scoreChange?: number;
  recentSessionsCount?: number;
}

type EmotionState = "happy" | "sad" | "determined";

export const WalkingProgressMascot: React.FC<WalkingProgressMascotProps> = ({
  score,
  scoreChange = 0,
  recentSessionsCount = 0,
}) => {
  const isHappy = scoreChange > 0 || score >= 60;
  const isSad = scoreChange < 0 || (score > 0 && score < 45);

  const [emotion, setEmotion] = useState<EmotionState>(
    isHappy ? "happy" : isSad ? "sad" : "determined"
  );
  const [isBlinking, setIsBlinking] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; icon: string }>>([]);

  // Walk progression along the progress bar
  // Mascot walks from 10% to target score position and back/patrols
  const targetPercent = Math.max(8, Math.min(88, score));
  const [walkPos, setWalkPos] = useState<number>(targetPercent);
  const [facingRight, setFacingRight] = useState<boolean>(true);

  // Sync emotion when score props update
  useEffect(() => {
    if (scoreChange > 0 || score >= 60) {
      setEmotion("happy");
    } else if (scoreChange < 0 || (score > 0 && score < 45)) {
      setEmotion("sad");
    } else {
      setEmotion("determined");
    }
  }, [score, scoreChange]);

  // Autonomous Walking Patrol on the progress bar
  useEffect(() => {
    const walkInterval = setInterval(() => {
      setWalkPos((prev) => {
        // Patrol around the target score (between target-15% and target+15%)
        const minBound = Math.max(8, targetPercent - 18);
        const maxBound = Math.min(88, targetPercent + 18);

        if (prev <= minBound + 2) {
          setFacingRight(true);
          return maxBound;
        } else {
          setFacingRight(false);
          return minBound;
        }
      });

      // Rotate quote occasionally
      setQuoteIndex((prev) => (prev + 1) % 4);
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 4500);
    }, 5500);

    return () => clearInterval(walkInterval);
  }, [targetPercent]);

  // Periodic eye blinking (every 2.4 - 3.2s)
  useEffect(() => {
    const blinkCycle = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 2600 + Math.random() * 1000);

    return () => clearInterval(blinkCycle);
  }, []);

  // Quotes tailored to emotion
  const getQuotes = () => {
    if (emotion === "happy") {
      return [
        "Marching forward! Score is soaring! 🚀",
        "Yay! Look at that progress! 🎉",
        "Strutting towards that dream offer! 🌟",
        "Keep this momentum going! 🔥",
      ];
    } else if (emotion === "sad") {
      return [
        "One step at a time! We will bounce back! 💧",
        "Walking through the dip! 1 mock fixes it! 💪",
        "Never stopping! Resilience builds champions! ⚡",
        "I believe in you! Keep walking! 🔥",
      ];
    } else {
      return [
        "Marching towards your next interview! 🚀",
        "Every step counts! Let's level up! ⚡",
        "Consistency is key! 🎯",
      ];
    }
  };

  const quotes = getQuotes();

  // Tap interaction
  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Toggle emotion
    if (emotion === "sad") {
      setEmotion("determined");
    } else if (emotion === "happy") {
      setEmotion("happy");
    } else {
      setEmotion("happy");
    }

    setShowBubble(true);

    const icons =
      emotion === "happy"
        ? ["🎉", "🔥", "🚀", "✨", "⭐", "💎"]
        : ["💪", "⚡", "💡", "💖", "🔥", "🌟"];

    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 50,
      y: -20 - Math.random() * 25,
      icon: icons[i % icons.length]
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles([]), 900);
  };

  // Color theme
  const theme = {
    happy: {
      color: "text-emerald-400",
      border: "border-emerald-400/80",
      glow: "from-emerald-400/40 via-teal-400/30 to-emerald-500/40",
      eyeColor: "#34d399",
      label: "🎉 Marching!",
    },
    sad: {
      color: "text-amber-400",
      border: "border-amber-400/80",
      glow: "from-amber-400/40 via-orange-400/30 to-rose-400/40",
      eyeColor: "#fbbf24",
      label: "💧 Stepping Up",
    },
    determined: {
      color: "text-cyan-400",
      border: "border-cyan-400/80",
      glow: "from-cyan-400/40 via-blue-400/30 to-violet-400/40",
      eyeColor: "#22d3ee",
      label: "🎯 On Track",
    },
  }[emotion];

  return (
    <motion.div
      animate={{
        left: `${walkPos}%`,
      }}
      transition={{
        duration: 4.8,
        ease: "easeInOut",
      }}
      className="absolute top-0 -translate-x-1/2 -translate-y-full pointer-events-none select-none z-30"
      style={{ touchAction: "none" }}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 6 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-[58px] left-1/2 -translate-x-1/2 min-w-[140px] max-w-[180px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl px-2.5 py-1.5 shadow-2xl text-center pointer-events-auto cursor-pointer border ${theme.border}`}
            onClick={handlePoke}
          >
            {/* Bubble Tail */}
            <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] border-t-slate-900/95 dark:border-t-slate-950/95" />

            <div className="flex items-center justify-between gap-1 mb-0.5">
              <span className={`text-[8.5px] font-extrabold uppercase tracking-wider ${theme.color}`}>
                {theme.label}
              </span>
              <span className="text-[7.5px] text-slate-400">Tap me!</span>
            </div>

            <p className="text-[10px] font-bold text-white leading-tight">
              {quotes[quoteIndex % quotes.length]}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.3 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 text-xs select-none"
          >
            {p.icon}
          </motion.span>
        ))}
      </div>

      {/* Walking Robot Mascot Character */}
      <div
        className="relative pointer-events-auto cursor-pointer group"
        onClick={handlePoke}
        onMouseEnter={() => setShowBubble(true)}
      >
        {/* Glow Aura */}
        <div
          className={`absolute -inset-1.5 rounded-full blur-md opacity-70 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none bg-gradient-to-r ${theme.glow}`}
        />

        {/* Character Facing Flip & Rhythmic Walking Motion */}
        <motion.div
          animate={{
            scaleX: facingRight ? 1 : -1,
          }}
          transition={{ duration: 0.3 }}
          className="relative w-14 h-16 flex items-center justify-center"
        >
          {/* Walking Animated SVG Engine */}
          <svg className="w-full h-full" viewBox="0 0 50 56">
            {/* 1. LEFT ARM (Swinging in walk cycle) */}
            <motion.g
              animate={{
                rotate: [-28, 28, -28],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "11px", originY: "22px" }}
            >
              <rect x="8" y="20" width="4.5" height="11" rx="2" fill="#475569" stroke={theme.eyeColor} strokeWidth="1" />
              <circle cx="10" cy="30" r="2" fill={theme.eyeColor} />
            </motion.g>

            {/* 2. LEFT LEG (Stepping forward / backward) */}
            <motion.g
              animate={{
                rotate: [-32, 32, -32],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "19px", originY: "36px" }}
            >
              <rect x="16" y="34" width="5" height="12" rx="2.5" fill="#334155" />
              {/* Left Foot */}
              <ellipse cx="18" cy="46" rx="4.5" ry="2.5" fill={theme.eyeColor} />
            </motion.g>

            {/* 3. RIGHT LEG (Opposite alternating stride) */}
            <motion.g
              animate={{
                rotate: [32, -32, 32],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "31px", originY: "36px" }}
            >
              <rect x="28" y="34" width="5" height="12" rx="2.5" fill="#334155" />
              {/* Right Foot */}
              <ellipse cx="30" cy="46" rx="4.5" ry="2.5" fill={theme.eyeColor} />
            </motion.g>

            {/* 4. BODY + HEAD BOUNCING WITH EACH STEP */}
            <motion.g
              animate={{
                y: [0, -3.5, 0, -3.5, 0],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            >
              {/* Antenna */}
              <motion.circle
                animate={{
                  scale: [1, 1.3, 1],
                }}
                transition={{ duration: 1.2, repeat: Infinity }}
                cx="25"
                cy="4"
                r="3"
                fill={theme.eyeColor}
                stroke="#ffffff"
                strokeWidth="1.5"
              />
              <line x1="25" y1="7" x2="25" y2="10" stroke="#64748b" strokeWidth="1.5" />

              {/* Robot Head */}
              <rect
                x="12"
                y="10"
                width="26"
                height="18"
                rx="6"
                fill="#0f172a"
                stroke={theme.eyeColor}
                strokeWidth="1.5"
              />
              {/* Headphone Ears */}
              <rect x="9" y="14" width="3" height="8" rx="1.5" fill={theme.eyeColor} />
              <rect x="38" y="14" width="3" height="8" rx="1.5" fill={theme.eyeColor} />

              {/* Glowing Visor */}
              <rect x="15" y="13" width="20" height="12" rx="4" fill="#020617" />

              {/* EXPRESSIVE EYES */}
              {emotion === "happy" && (
                <g>
                  {/* Left Happy Curved Eye with Blinking */}
                  <motion.path
                    animate={{
                      d: isBlinking
                        ? "M 18 19 L 23 19"
                        : ["M 17 19 Q 20 13 23 19", "M 17 18 Q 20 11 23 18", "M 17 19 Q 20 13 23 19"],
                    }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    stroke={theme.eyeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Right Happy Curved Eye */}
                  <motion.path
                    animate={{
                      d: isBlinking
                        ? "M 27 19 L 32 19"
                        : ["M 27 19 Q 30 13 32 19", "M 27 18 Q 30 11 32 18", "M 27 19 Q 30 13 32 19"],
                    }}
                    transition={{ duration: 0.6, repeat: Infinity }}
                    stroke={theme.eyeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Open Beaming Mouth */}
                  <path d="M 22 21 Q 25 25 28 21 Z" fill={theme.eyeColor} />
                  {/* Blush */}
                  <circle cx="16" cy="22" r="1.5" fill="#f43f5e" opacity="0.8" />
                  <circle cx="34" cy="22" r="1.5" fill="#f43f5e" opacity="0.8" />
                </g>
              )}

              {emotion === "sad" && (
                <g>
                  {/* Left Drooped Sad Eye */}
                  <motion.path
                    animate={{
                      d: isBlinking
                        ? "M 17 19 L 23 19"
                        : "M 17 16 Q 20 21 23 16",
                    }}
                    stroke={theme.eyeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Right Drooped Sad Eye */}
                  <motion.path
                    animate={{
                      d: isBlinking
                        ? "M 27 19 L 33 19"
                        : "M 27 16 Q 30 21 33 16",
                    }}
                    stroke={theme.eyeColor}
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    fill="none"
                  />
                  {/* Sad Quivering Mouth */}
                  <path d="M 22 23 Q 25 20 28 23" stroke={theme.eyeColor} strokeWidth="1.8" fill="none" />
                  {/* Animated Teardrop 💧 */}
                  <motion.circle
                    animate={{ cy: [17, 24], opacity: [1, 0] }}
                    transition={{ duration: 0.9, repeat: Infinity, ease: "easeIn" }}
                    cx="18"
                    r="1.2"
                    fill="#38bdf8"
                  />
                </g>
              )}

              {emotion === "determined" && (
                <g>
                  {/* Left Eye */}
                  <motion.ellipse
                    animate={{ ry: isBlinking ? 0.3 : 3 }}
                    cx="20"
                    cy="18"
                    rx="2.5"
                    fill={theme.eyeColor}
                  />
                  <circle cx="21" cy="17" r="0.8" fill="#ffffff" />

                  {/* Right Eye */}
                  <motion.ellipse
                    animate={{ ry: isBlinking ? 0.3 : 3 }}
                    cx="30"
                    cy="18"
                    rx="2.5"
                    fill={theme.eyeColor}
                  />
                  <circle cx="31" cy="17" r="0.8" fill="#ffffff" />

                  {/* Confident Smile */}
                  <path d="M 22 22 Q 25 24 28 22" stroke={theme.eyeColor} strokeWidth="1.8" strokeLinecap="round" fill="none" />
                </g>
              )}

              {/* Robot Torso */}
              <rect
                x="16"
                y="27"
                width="18"
                height="10"
                rx="3"
                fill="#0f172a"
                stroke={theme.eyeColor}
                strokeWidth="1"
              />
              {/* Chest Reactor */}
              <motion.circle
                animate={{ scale: [1, 1.25, 1] }}
                transition={{ duration: 0.8, repeat: Infinity }}
                cx="25"
                cy="32"
                r="2.5"
                fill={theme.eyeColor}
              />
            </motion.g>

            {/* 5. RIGHT ARM (Swinging in opposite walk cycle) */}
            <motion.g
              animate={{
                rotate: [28, -28, 28],
              }}
              transition={{
                duration: 0.6,
                repeat: Infinity,
                ease: "easeInOut",
              }}
              style={{ originX: "38px", originY: "22px" }}
            >
              <rect x="37" y="20" width="4.5" height="11" rx="2" fill="#475569" stroke={theme.eyeColor} strokeWidth="1" />
              <circle cx="39" cy="30" r="2" fill={theme.eyeColor} />
            </motion.g>
          </svg>
        </motion.div>
      </div>
    </motion.div>
  );
};
