import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Zap, Flame, Trophy, TrendingUp, TrendingDown, Heart } from "lucide-react";

interface ProgressBarMascotProps {
  score: number;
  scoreChange?: number; // e.g. +5, -3, 0
  recentSessionsCount?: number;
}

export const ProgressBarMascot: React.FC<ProgressBarMascotProps> = ({
  score,
  scoreChange = 0,
  recentSessionsCount = 0,
}) => {
  const [isBlinking, setIsBlinking] = useState(false);
  const [isWaving, setIsWaving] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [cheerMessage, setCheerMessage] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; icon: string }>>([]);

  // Determine emotional state
  // Happy/Celebration: scoreChange > 0 OR score >= 70
  // Encouraging/Dipped: scoreChange < 0 OR (score < 40 && recentSessionsCount > 0)
  // Steady/Neutral: baseline
  const isHappy = scoreChange > 0 || score >= 65;
  const isDipped = scoreChange < 0 || (score > 0 && score < 45);

  const getQuotes = () => {
    if (isHappy) {
      return [
        "Woohoo! Crushing it! Keep the momentum! 🚀",
        scoreChange > 0 ? `Awesome! +${Math.round(scoreChange)}% boost! 🎉` : "Look at that progress! Interview ready! 🌟",
        "You're on fire! Dream offer incoming! 🔥",
        "High score energy! Keep shining! 💫",
      ];
    } else if (isDipped) {
      return [
        "Small dip, big comeback! You've got this! 💪",
        "Every mistake is proof of learning! ⚡",
        "Let's bounce back with 1 quick mock! 🎯",
        "Resilience builds champions! Keep going! 💡",
      ];
    } else {
      return [
        "Ready to level up your score today? 🚀",
        "1 mock interview makes all the difference! ⚡",
        "Consistency is your secret weapon! 🎯",
        "Let's aim higher together! ✨",
      ];
    }
  };

  const quotes = getQuotes();
  const [quoteIndex, setQuoteIndex] = useState(0);

  // Rotate quotes periodically
  useEffect(() => {
    const timer = setInterval(() => {
      setQuoteIndex((prev) => (prev + 1) % quotes.length);
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 5000);
    }, 9000);
    return () => clearInterval(timer);
  }, [quotes.length]);

  // Initial bubble display
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowBubble(true);
      setTimeout(() => setShowBubble(false), 5500);
    }, 800);
    return () => clearTimeout(timer);
  }, [score, isHappy, isDipped]);

  // Natural blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3200 + Math.random() * 2000);
    return () => clearInterval(blinkInterval);
  }, []);

  // Periodic waving / fist pump
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1400);
    }, 5500);
    return () => clearInterval(waveInterval);
  }, []);

  // Tap/poke interaction
  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1600);

    const cheers = isHappy
      ? ["BOOM! Absolute champion! 🔥", "You're unstoppable! 🚀", "Score is soaring! 🌟"]
      : isDipped
      ? ["Comeback mode activated! 💪", "You've got the power! ⚡", "Never give up! 🔥"]
      : ["Let's crush today's mock! 🚀", "High five! 🖐️", "Energy 100%! ⚡"];

    const chosen = cheers[Math.floor(Math.random() * cheers.length)];
    setCheerMessage(chosen);
    setShowBubble(true);
    setTimeout(() => {
      setCheerMessage(null);
      setTimeout(() => setShowBubble(false), 3500);
    }, 3500);

    // Spawn particles
    const newParticles = Array.from({ length: 6 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 50,
      y: -15 - Math.random() * 30,
      icon: isHappy ? ["🎉", "🔥", "🚀", "✨", "⭐"][i % 5] : ["💪", "⚡", "💡", "🔥", "✨"][i % 5]
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles([]), 900);
  };

  // Clamp position along progress bar (keep mascot within bar margins)
  const clampedPosition = Math.max(6, Math.min(94, score));

  return (
    <div
      className="absolute top-1/2 -translate-y-1/2 pointer-events-none transition-all duration-700 ease-out z-20"
      style={{ left: `${clampedPosition}%` }}
    >
      {/* Speech Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 5 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 3 }}
            transition={{ duration: 0.2 }}
            className={`absolute bottom-[46px] left-1/2 -translate-x-1/2 min-w-[150px] max-w-[200px] backdrop-blur-md rounded-xl px-2.5 py-1.5 shadow-xl text-center pointer-events-auto cursor-pointer z-30 border ${
              isHappy
                ? "bg-slate-900/95 border-emerald-500/50 shadow-emerald-500/10"
                : isDipped
                ? "bg-slate-900/95 border-amber-500/50 shadow-amber-500/10"
                : "bg-slate-900/95 border-violet-500/50 shadow-violet-500/10"
            }`}
            onClick={handlePoke}
          >
            {/* Bubble Tail */}
            <div
              className={`absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[5px] border-l-transparent border-r-[5px] border-r-transparent border-t-[6px] ${
                isHappy ? "border-t-slate-900/95" : isDipped ? "border-t-slate-900/95" : "border-t-slate-900/95"
              }`}
            />

            <p className="text-[10.5px] font-bold text-white leading-snug">
              {cheerMessage || quotes[quoteIndex % quotes.length]}
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

      {/* Mascot Robot (Riding on Progress Bar) */}
      <div
        className="relative -translate-x-1/2 -translate-y-[18px] pointer-events-auto cursor-pointer group"
        onClick={handlePoke}
        onMouseEnter={() => setShowBubble(true)}
      >
        {/* Mood Ambient Glow Aura */}
        <div
          className={`absolute -inset-1 rounded-full blur-xs opacity-70 group-hover:opacity-100 transition-opacity animate-pulse pointer-events-none ${
            isHappy
              ? "bg-gradient-to-r from-emerald-400 to-teal-400"
              : isDipped
              ? "bg-gradient-to-r from-amber-400 to-orange-400"
              : "bg-gradient-to-r from-violet-400 to-cyan-400"
          }`}
        />

        {/* Mascot Body with Floating/Bobbing & Mood Reactions */}
        <motion.div
          animate={{
            y: isHappy ? [0, -6, 0] : isDipped ? [0, -3, 0] : [0, -4, 0],
            rotate: isWaving ? (isHappy ? [0, -8, 8, -4, 0] : [0, -4, 4, 0]) : [0, 1, 0, -1, 0],
          }}
          transition={{
            y: { duration: isHappy ? 1.6 : 2.2, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: isWaving ? 0.5 : 3, repeat: isWaving ? 2 : Infinity, ease: "easeInOut" }
          }}
          whileHover={{ scale: 1.15 }}
          whileTap={{ scale: 0.9 }}
          className="relative w-10 h-12 flex flex-col items-center justify-center"
        >
          {/* Antenna */}
          <div className="relative flex flex-col items-center">
            {/* Glowing Orb */}
            <motion.div
              animate={{
                scale: isHappy ? [1, 1.4, 1] : [1, 1.2, 1],
                boxShadow: isHappy
                  ? ["0 0 6px #10b981", "0 0 12px #34d399", "0 0 6px #10b981"]
                  : isDipped
                  ? ["0 0 6px #f59e0b", "0 0 12px #fbbf24", "0 0 6px #f59e0b"]
                  : ["0 0 6px #a855f7", "0 0 12px #c084fc", "0 0 6px #a855f7"]
              }}
              transition={{ duration: 1.2, repeat: Infinity, ease: "easeInOut" }}
              className={`w-2 h-2 rounded-full border border-white z-10 ${
                isHappy
                  ? "bg-gradient-to-br from-emerald-300 to-teal-400"
                  : isDipped
                  ? "bg-gradient-to-br from-amber-300 to-orange-400"
                  : "bg-gradient-to-br from-violet-300 to-fuchsia-400"
              }`}
            />
            <div className="w-0.5 h-1 bg-slate-500" />
          </div>

          {/* Robot Head */}
          <div className={`relative w-8 h-6 rounded-lg bg-slate-900 border-[1.5px] shadow-md flex items-center justify-center p-0.5 ${
            isHappy ? "border-emerald-400/80" : isDipped ? "border-amber-400/80" : "border-violet-400/80"
          }`}>
            {/* Visor Screen */}
            <div className="w-full h-full rounded-md bg-slate-950 flex items-center justify-around px-1 relative shadow-inner overflow-hidden">
              {/* Glass Reflection */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-white/20 rounded-t-sm" />

              {/* Eyes Expression */}
              {isHappy ? (
                // Happy Arc Eyes (^ ^)
                <>
                  <div className="w-1.5 h-1.5 border-t-2 border-emerald-400 rounded-t-full shadow-[0_0_4px_#34d399]" />
                  <div className="w-1 h-0.5 border-b border-emerald-400 rounded-b-full" />
                  <div className="w-1.5 h-1.5 border-t-2 border-emerald-400 rounded-t-full shadow-[0_0_4px_#34d399]" />
                </>
              ) : isDipped ? (
                // Determined Focused Eyes (o o)
                <>
                  <motion.div
                    animate={{ scaleY: isBlinking ? 0.1 : 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]"
                  />
                  <div className="w-1 h-0.5 border-b border-amber-400 rounded-b-sm" />
                  <motion.div
                    animate={{ scaleY: isBlinking ? 0.1 : 1 }}
                    className="w-1.5 h-1.5 rounded-full bg-amber-400 shadow-[0_0_4px_#fbbf24]"
                  />
                </>
              ) : (
                // Normal Cheerful Eyes
                <>
                  <motion.div
                    animate={{ scaleY: isBlinking ? 0.1 : 1 }}
                    className="w-1.5 h-2 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]"
                  />
                  <div className="w-1 h-0.5 border-b border-cyan-400 rounded-b-full" />
                  <motion.div
                    animate={{ scaleY: isBlinking ? 0.1 : 1 }}
                    className="w-1.5 h-2 rounded-full bg-cyan-400 shadow-[0_0_4px_#22d3ee]"
                  />
                </>
              )}
            </div>
          </div>

          {/* Torso */}
          <div className="relative w-6 h-4 rounded-md bg-slate-900 border border-slate-700 shadow-xs flex items-center justify-center -mt-0.5">
            {/* Core Reactor */}
            <motion.div
              animate={{ scale: [1, 1.25, 1] }}
              transition={{ duration: 0.9, repeat: Infinity }}
              className={`w-2 h-2 rounded-full flex items-center justify-center ${
                isHappy ? "bg-emerald-500 shadow-[0_0_6px_#10b981]" : isDipped ? "bg-amber-500 shadow-[0_0_6px_#f59e0b]" : "bg-violet-500 shadow-[0_0_6px_#8b5cf6]"
              }`}
            >
              <Zap className="w-1 h-1 text-white fill-white" />
            </motion.div>

            {/* Left Arm (Pumps up when happy, waves when dipped) */}
            <motion.div
              animate={{
                rotate: isHappy
                  ? (isWaving ? [-30, 60, -30, 60, 0] : [-15, 20, -15])
                  : isWaving
                  ? [-20, 45, -20, 45, 0]
                  : [-5, 5, -5],
                originX: 1,
                originY: 0
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-1.5 top-0.5 w-1 h-2.5 rounded-full bg-violet-600 border border-violet-300"
            />

            {/* Right Arm */}
            <motion.div
              animate={{
                rotate: isHappy
                  ? (isWaving ? [30, -60, 30, -60, 0] : [15, -20, 15])
                  : [5, -5, 5],
                originX: 0,
                originY: 0
              }}
              transition={{ duration: 0.6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-1.5 top-0.5 w-1 h-2.5 rounded-full bg-violet-600 border border-violet-300"
            />
          </div>

          {/* Jet Ring Beneath (Pins to progress bar) */}
          <div className={`w-3 h-1 rounded-full blur-[1px] -mt-0.5 ${
            isHappy ? "bg-emerald-400" : isDipped ? "bg-amber-400" : "bg-cyan-400"
          }`} />
        </motion.div>
      </div>
    </div>
  );
};
