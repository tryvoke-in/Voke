import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Zap, Flame, Trophy, Heart } from "lucide-react";

interface ProgressSectionMascotProps {
  score: number;
  scoreChange?: number;
  recentSessionsCount?: number;
}

type EmotionState = "happy" | "sad" | "excited" | "determined";

export const ProgressSectionMascot: React.FC<ProgressSectionMascotProps> = ({
  score,
  scoreChange = 0,
  recentSessionsCount = 0,
}) => {
  // Determine emotional state from score & trend
  // If score is >= 60 or score increased -> Happy
  // If score is < 45 or score decreased -> Sad
  const isHappy = scoreChange > 0 || score >= 60;
  const isSad = scoreChange < 0 || (score > 0 && score < 45);

  const [emotion, setEmotion] = useState<EmotionState>(
    isHappy ? "happy" : isSad ? "sad" : "determined"
  );
  const [isBlinking, setIsBlinking] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; icon: string }>>([]);

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

  // Continuous Periodic Blinking Loop (every 2.4 - 3.2s)
  useEffect(() => {
    const blinkCycle = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 200);
    }, 2500 + Math.random() * 1000);

    return () => clearInterval(blinkCycle);
  }, []);

  // Quotes tailored to emotion
  const getQuotes = () => {
    if (emotion === "happy") {
      return [
        "Yay! Score is climbing! We're crushing it! 🎉",
        "Woohoo! Interview ready! Dream offer is loading! 🚀",
        "You're on fire! Keep this momentum going! 🔥",
        "Superstar performance! Keep leveling up! 🌟",
      ];
    } else if (emotion === "sad") {
      return [
        "Aww, score dipped! Don't give up, let's bounce back! 💧",
        "Every mistake is proof we are learning! 💪",
        "Small dip, huge comeback! Let's do 1 quick mock! ⚡",
        "I believe in you! Let's crush the next one! 🔥",
      ];
    } else if (emotion === "excited") {
      return [
        "YESSS! Maximum power! Let's smash that interview! ⚡",
        "Unstoppable energy! Google is waiting! 🚀",
        "High score energy! You're in the top tier! 💎",
      ];
    } else {
      return [
        "Ready to level up your score today? 🚀",
        "1 mock interview makes all the difference! ⚡",
        "Consistency is your superpower! 🎯",
      ];
    }
  };

  const quotes = getQuotes();

  // Rotate quotes periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 5500);
    }, 8500);
    return () => clearInterval(timer);
  }, [quotes.length]);

  // Handle tap / poke interaction
  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation();

    // Cycling emotions on click for interactive feedback
    if (emotion === "sad") {
      setEmotion("determined");
    } else if (emotion === "happy") {
      setEmotion("excited");
    } else {
      setEmotion("happy");
    }

    setShowBubble(true);

    const icons =
      emotion === "happy" || emotion === "excited"
        ? ["🎉", "🔥", "🚀", "✨", "⭐", "💎"]
        : ["💪", "⚡", "💡", "💖", "🔥", "🌟"];

    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 60,
      y: -20 - Math.random() * 30,
      icon: icons[i % icons.length]
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles([]), 1000);
  };

  // Color tokens per emotion
  const theme = {
    happy: {
      color: "text-emerald-400",
      border: "border-emerald-400/80",
      glow: "from-emerald-400/40 via-teal-400/30 to-emerald-500/40",
      eyeColor: "#34d399",
      label: "🎉 Celebrating!",
    },
    sad: {
      color: "text-amber-400",
      border: "border-amber-400/80",
      glow: "from-amber-400/40 via-orange-400/30 to-rose-400/40",
      eyeColor: "#fbbf24",
      label: "💧 Bounce Back",
    },
    excited: {
      color: "text-violet-400",
      border: "border-violet-400/80",
      glow: "from-violet-400/45 via-fuchsia-400/35 to-cyan-400/45",
      eyeColor: "#c084fc",
      label: "⚡ Super Charged!",
    },
    determined: {
      color: "text-cyan-400",
      border: "border-cyan-400/80",
      glow: "from-cyan-400/40 via-blue-400/30 to-violet-400/40",
      eyeColor: "#22d3ee",
      label: "🎯 Level Up",
    },
  }[emotion];

  return (
    <div className="relative flex items-center justify-end select-none shrink-0">
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, x: 10 }}
            animate={{ opacity: 1, scale: 1, x: 0 }}
            exit={{ opacity: 0, scale: 0.8, x: 6 }}
            transition={{ duration: 0.2 }}
            className={`absolute right-[76px] top-1/2 -translate-y-1/2 min-w-[145px] max-w-[180px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md rounded-2xl px-2.5 py-1.5 shadow-2xl text-center z-30 border cursor-pointer ${theme.border}`}
            onClick={handlePoke}
          >
            {/* Bubble Tail pointing right to mascot */}
            <div className="absolute top-1/2 -right-1.5 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-l-[6px] border-l-slate-900/95 dark:border-l-slate-950/95" />

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
            animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.4 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 text-xs select-none"
          >
            {p.icon}
          </motion.span>
        ))}
      </div>

      {/* Floating Mascot Character Container */}
      <div
        className="relative cursor-pointer group"
        onClick={handlePoke}
        onMouseEnter={() => setShowBubble(true)}
        title="Tap Voki to cheer or interact!"
      >
        {/* Mood Ambient Glow Aura */}
        <div
          className={`absolute -inset-2 rounded-full blur-md opacity-80 group-hover:opacity-100 transition-opacity duration-300 animate-pulse pointer-events-none bg-gradient-to-r ${theme.glow}`}
        />

        {/* Continuous Multi-Axis Floating Bob & Wave Animation */}
        <motion.div
          animate={{
            y: [0, -10, 0, -5, 0],
            x: [0, 4, 0, -4, 0],
            rotate: emotion === "happy" ? [0, -4, 4, -2, 0] : [0, 1.5, 0, -1.5, 0],
          }}
          transition={{
            y: { duration: 2.8, repeat: Infinity, ease: "easeInOut" },
            x: { duration: 4.5, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: 3.2, repeat: Infinity, ease: "easeInOut" }
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-16 h-22 flex flex-col items-center justify-center"
        >
          {/* Antenna */}
          <div className="relative flex flex-col items-center">
            {/* Glowing Antenna Orb */}
            <motion.div
              animate={{
                scale: [1, 1.35, 1],
                boxShadow: [
                  `0 0 8px ${theme.eyeColor}`,
                  `0 0 16px ${theme.eyeColor}`,
                  `0 0 8px ${theme.eyeColor}`
                ]
              }}
              transition={{ duration: 1.3, repeat: Infinity, ease: "easeInOut" }}
              className="w-2.5 h-2.5 rounded-full border-2 border-white z-10"
              style={{ backgroundColor: theme.eyeColor }}
            />
            <div className="w-0.5 h-2 bg-slate-500" />
          </div>

          {/* Robot Head */}
          <div className={`relative w-14 h-11 rounded-2xl bg-slate-900 border-2 shadow-xl flex items-center justify-center p-1 ${theme.border}`}>
            {/* Headphone Ear Cups */}
            <div
              className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-l-xs border border-white/40 shadow-xs"
              style={{ backgroundColor: theme.eyeColor }}
            />
            <div
              className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-1.5 h-5 rounded-r-xs border border-white/40 shadow-xs"
              style={{ backgroundColor: theme.eyeColor }}
            />

            {/* Glowing Visor Screen with Expressive Animated SVG Face */}
            <div className="w-full h-full rounded-xl bg-slate-950 flex items-center justify-center relative shadow-inner overflow-hidden">
              {/* Glass Reflection Highlight */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/20 rounded-t-lg pointer-events-none" />

              {/* Expressive SVG Eyes & Mouth with Active Blinking */}
              <svg className="w-full h-full p-1" viewBox="0 0 50 36">
                {/* 1. HAPPY / CELEBRATING EYES (^ ^ with big open smile & blush) */}
                {emotion === "happy" && (
                  <g>
                    {/* Left Happy Curved Eye with Blinking squish */}
                    <motion.path
                      animate={{
                        d: isBlinking
                          ? "M 8 18 Q 16 18 22 18"
                          : ["M 8 17 Q 16 7 22 17", "M 8 16 Q 16 5 22 16", "M 8 17 Q 16 7 22 17"],
                      }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      stroke={theme.eyeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Right Happy Curved Eye with Blinking squish */}
                    <motion.path
                      animate={{
                        d: isBlinking
                          ? "M 28 18 Q 34 18 42 18"
                          : ["M 28 17 Q 34 7 42 17", "M 28 16 Q 34 5 42 16", "M 28 17 Q 34 7 42 17"],
                      }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      stroke={theme.eyeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Beaming Open Smile */}
                    <motion.path
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.8, repeat: Infinity }}
                      d="M 18 22 Q 25 32 32 22 Z"
                      fill={theme.eyeColor}
                    />
                    {/* Cute Blushing Cheeks */}
                    <circle cx="9" cy="23" r="2.5" fill="#f43f5e" opacity="0.7" />
                    <circle cx="41" cy="23" r="2.5" fill="#f43f5e" opacity="0.7" />
                  </g>
                )}

                {/* 2. SAD / CRYING EYES (Drooped Eyes with Animated Falling Tear 💧 & Blinking) */}
                {emotion === "sad" && (
                  <g>
                    {/* Left Drooped Sad Eye */}
                    <motion.path
                      animate={{
                        d: isBlinking
                          ? "M 8 16 Q 15 16 22 16"
                          : "M 8 13 Q 15 20 22 13",
                      }}
                      stroke={theme.eyeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Right Drooped Sad Eye */}
                    <motion.path
                      animate={{
                        d: isBlinking
                          ? "M 28 16 Q 35 16 42 16"
                          : "M 28 13 Q 35 20 42 13",
                      }}
                      stroke={theme.eyeColor}
                      strokeWidth="3.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Sad Quivering Mouth */}
                    <path
                      d="M 20 26 Q 25 21 30 26"
                      stroke={theme.eyeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                    {/* Animated Falling Teardrop 💧 */}
                    <motion.circle
                      animate={{ cy: [15, 29], opacity: [1, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: "easeIn" }}
                      cx="11"
                      r="2"
                      fill="#38bdf8"
                    />
                  </g>
                )}

                {/* 3. EXCITED / SUPER STAR EYES (Sparkle Star Eyes ★ ★) */}
                {emotion === "excited" && (
                  <g>
                    {/* Left Star Eye */}
                    <motion.text
                      animate={{ scale: isBlinking ? 0.2 : [1, 1.25, 1], rotate: [0, 15, -15, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      x="14"
                      y="19"
                      fontSize="14"
                      textAnchor="middle"
                      fill={theme.eyeColor}
                    >
                      ★
                    </motion.text>
                    {/* Right Star Eye */}
                    <motion.text
                      animate={{ scale: isBlinking ? 0.2 : [1, 1.25, 1], rotate: [0, -15, 15, 0] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      x="36"
                      y="19"
                      fontSize="14"
                      textAnchor="middle"
                      fill={theme.eyeColor}
                    >
                      ★
                    </motion.text>
                    {/* Excited Big Open Mouth */}
                    <path d="M 18 21 Q 25 33 32 21 Z" fill={theme.eyeColor} />
                  </g>
                )}

                {/* 4. DETERMINED / LEVEL UP EYES (Anime Blinking Eyes with Eye Sparkle) */}
                {emotion === "determined" && (
                  <g>
                    {/* Left Eye */}
                    <motion.ellipse
                      animate={{
                        ry: isBlinking ? 0.5 : 4.5,
                      }}
                      cx="15"
                      cy="15"
                      rx="3.5"
                      fill={theme.eyeColor}
                    />
                    <circle cx="16" cy="13" r="1.2" fill="#ffffff" />

                    {/* Right Eye */}
                    <motion.ellipse
                      animate={{
                        ry: isBlinking ? 0.5 : 4.5,
                      }}
                      cx="35"
                      cy="15"
                      rx="3.5"
                      fill={theme.eyeColor}
                    />
                    <circle cx="36" cy="13" r="1.2" fill="#ffffff" />

                    {/* Confident Smile */}
                    <path
                      d="M 20 24 Q 25 28 30 24"
                      stroke={theme.eyeColor}
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      fill="none"
                    />
                  </g>
                )}
              </svg>
            </div>
          </div>

          {/* Neck */}
          <div className="w-3 h-0.5 bg-slate-600 -my-0.5 z-0" />

          {/* Torso */}
          <div className={`relative w-10 h-6 rounded-xl bg-slate-900 border shadow-md flex items-center justify-center ${theme.border}`}>
            {/* Core Reactor */}
            <motion.div
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ duration: 0.8, repeat: Infinity }}
              className="w-3 h-3 rounded-full flex items-center justify-center shadow-lg"
              style={{ backgroundColor: theme.eyeColor }}
            >
              <Zap className="w-1.5 h-1.5 text-slate-950 fill-slate-950" />
            </motion.div>

            {/* Left Arm */}
            <motion.div
              animate={{
                rotate:
                  emotion === "happy" || emotion === "excited"
                    ? [-35, 65, -35, 65, 0] // Victory fist pump!
                    : emotion === "sad"
                    ? [-15, 25, -15] // Comforting wave
                    : [-20, 20, -20],
                originX: 1,
                originY: 0
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-2 top-0.5 w-1.5 h-4 rounded-full border border-white/30"
              style={{ backgroundColor: theme.eyeColor }}
            />

            {/* Right Arm */}
            <motion.div
              animate={{
                rotate:
                  emotion === "happy" || emotion === "excited"
                    ? [35, -65, 35, -65, 0] // Both arms raised in triumph!
                    : emotion === "sad"
                    ? [10, -10, 10]
                    : [20, -20, 20],
                originX: 0,
                originY: 0
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-2 top-0.5 w-1.5 h-4 rounded-full border border-white/30"
              style={{ backgroundColor: theme.eyeColor }}
            />
          </div>

          {/* Floating Jet Ring Beneath */}
          <motion.div
            animate={{
              scale: [0.8, 1.25, 0.8],
              opacity: [0.4, 0.8, 0.4]
            }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="w-6 h-1.5 rounded-full blur-[2px] mt-1"
            style={{ backgroundColor: theme.eyeColor }}
          />
        </motion.div>
      </div>
    </div>
  );
};
