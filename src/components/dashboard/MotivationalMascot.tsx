import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Sparkles, Zap, Flame } from "lucide-react";

interface MotivationalMascotProps {
  userName?: string;
  userStreak?: number;
}

const SHORT_QUOTES = [
  "You're 1 mock away from your dream job! 🚀",
  "Consistency is your superpower! ⚡",
  "Google & Meta are waiting for you! 🎯",
  "Turn anxiety into pure confidence! ✨",
  "Every problem solved is progress! 💡",
  "Practice 10 mins & stay ahead! 🔥",
  "Keep that interview streak burning! 🌟",
  "Believe in yourself, you're ready! 💫",
  "Crush today's coding challenge! 💻",
  "Champions practice every day! 🏆",
];

const CHEER_QUOTES = [
  "Wohoo! You're unstoppable! 🔥",
  "BOOM! Energy level 100%! ⚡",
  "High five! You got this! 🖐️",
  "Go get that dream offer! 🚀",
  "Confidence unlocked! 💫",
];

export const MotivationalMascot: React.FC<MotivationalMascotProps> = ({
  userStreak = 0,
}) => {
  const [quoteIndex, setQuoteIndex] = useState(0);
  const [isWaving, setIsWaving] = useState(false);
  const [isBlinking, setIsBlinking] = useState(false);
  const [showBubble, setShowBubble] = useState(true);
  const [cheerMessage, setCheerMessage] = useState<string | null>(null);
  const [particles, setParticles] = useState<Array<{ id: number; x: number; y: number; icon: string }>>([]);

  // Autonomous Roaming Coordinates
  const [coords, setCoords] = useState<{ x: number; y: number }>({ x: 60, y: 400 });
  const [tilt, setTilt] = useState<number>(0);
  const prevX = useRef(60);

  // Initialize starting position based on window size
  useEffect(() => {
    if (typeof window !== "undefined") {
      const initialX = Math.max(40, Math.min(window.innerWidth - 180, 80));
      const initialY = Math.max(120, Math.min(window.innerHeight - 200, window.innerHeight * 0.65));
      setCoords({ x: initialX, y: initialY });
      prevX.current = initialX;
    }
  }, []);

  // Autonomous Roaming Logic: Flies to random spots on the screen every 8 seconds
  useEffect(() => {
    const roamInterval = setInterval(() => {
      if (typeof window === "undefined") return;

      const screenW = window.innerWidth;
      const screenH = window.innerHeight;

      // Safe bounds (keep mascot within visible screen margins)
      const minX = 40;
      const maxX = Math.max(minX + 100, screenW - 160);
      const minY = 100;
      const maxY = Math.max(minY + 100, screenH - 180);

      // Generate random destination
      const nextX = Math.floor(minX + Math.random() * (maxX - minX));
      const nextY = Math.floor(minY + Math.random() * (maxY - minY));

      // Calculate tilt based on movement direction
      const diffX = nextX - prevX.current;
      const newTilt = diffX > 30 ? 12 : diffX < -30 ? -12 : 0;

      prevX.current = nextX;
      setTilt(newTilt);
      setCoords({ x: nextX, y: nextY });

      // Rotate to next quote and pop bubble briefly
      setQuoteIndex((prev) => (prev + 1) % SHORT_QUOTES.length);
      setShowBubble(true);

      // Reset tilt after flight
      setTimeout(() => {
        setTilt(0);
      }, 3000);

      // Hide bubble after 5.5s so it stays clean
      setTimeout(() => {
        setShowBubble(false);
      }, 5500);
    }, 8500);

    return () => clearInterval(roamInterval);
  }, []);

  // Periodic natural eye blinking
  useEffect(() => {
    const blinkInterval = setInterval(() => {
      setIsBlinking(true);
      setTimeout(() => setIsBlinking(false), 180);
    }, 3000 + Math.random() * 2500);
    return () => clearInterval(blinkInterval);
  }, []);

  // Periodic natural friendly wave
  useEffect(() => {
    const waveInterval = setInterval(() => {
      setIsWaving(true);
      setTimeout(() => setIsWaving(false), 1400);
    }, 6000);
    return () => clearInterval(waveInterval);
  }, []);

  // Handle character poke/tap interaction
  const handlePoke = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsWaving(true);
    setTimeout(() => setIsWaving(false), 1600);

    // Pick random cheer
    const randomCheer = CHEER_QUOTES[Math.floor(Math.random() * CHEER_QUOTES.length)];
    setCheerMessage(randomCheer);
    setShowBubble(true);
    setTimeout(() => {
      setCheerMessage(null);
      setTimeout(() => setShowBubble(false), 3500);
    }, 3500);

    // Spawn celebratory burst particles
    const newParticles = Array.from({ length: 7 }).map((_, i) => ({
      id: Date.now() + i,
      x: (Math.random() - 0.5) * 80,
      y: -20 - Math.random() * 50,
      icon: ["✨", "🔥", "🚀", "⭐", "🎉", "💎", "⚡"][i % 7]
    }));
    setParticles((prev) => [...prev, ...newParticles]);
    setTimeout(() => setParticles([]), 1100);
  };

  const currentQuote = SHORT_QUOTES[quoteIndex];

  return (
    <motion.div
      animate={{
        x: coords.x,
        y: coords.y,
        rotate: tilt,
      }}
      transition={{
        x: { duration: 3.5, ease: [0.25, 0.1, 0.25, 1] },
        y: { duration: 3.5, ease: [0.25, 0.1, 0.25, 1] },
        rotate: { duration: 0.8, ease: "easeOut" },
      }}
      className="fixed top-0 left-0 z-50 select-none pointer-events-none flex flex-col items-center"
      style={{ touchAction: "none" }}
    >
      {/* Short & Clean Floating Speech Bubble */}
      <AnimatePresence>
        {showBubble && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 5 }}
            transition={{ duration: 0.25 }}
            className="absolute bottom-[105px] left-1/2 -translate-x-1/2 min-w-[160px] max-w-[220px] bg-slate-900/95 dark:bg-slate-950/95 backdrop-blur-md border border-violet-500/50 rounded-2xl px-3 py-2 shadow-2xl text-center pointer-events-auto cursor-pointer"
            onClick={handlePoke}
          >
            {/* Bubble Tail pointing to mascot */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[8px] border-t-slate-900/95 dark:border-t-slate-950/95" />

            <p className="text-xs font-bold text-white leading-snug">
              {cheerMessage || currentQuote}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Particles Container */}
      <div className="absolute inset-0 pointer-events-none z-40">
        {particles.map((p) => (
          <motion.span
            key={p.id}
            initial={{ opacity: 1, x: 0, y: 0, scale: 0.5 }}
            animate={{ opacity: 0, x: p.x, y: p.y, scale: 1.4 }}
            transition={{ duration: 0.9, ease: "easeOut" }}
            className="absolute left-1/2 top-1/2 text-sm select-none"
          >
            {p.icon}
          </motion.span>
        ))}
      </div>

      {/* Robot Mascot Body (Prominent & Clear Size) */}
      <div
        className="relative group pointer-events-auto cursor-pointer"
        onClick={handlePoke}
        onMouseEnter={() => setShowBubble(true)}
      >
        {/* Soft Ambient Glow Aura */}
        <div className="absolute -inset-2 bg-gradient-to-r from-violet-500/35 via-fuchsia-500/25 to-cyan-500/35 rounded-full blur-lg opacity-80 group-hover:opacity-100 transition-opacity duration-300 animate-pulse pointer-events-none" />

        {/* Hovering Bob Animation */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotate: isWaving ? [0, -6, 6, -3, 0] : [0, 1.5, 0, -1.5, 0],
          }}
          transition={{
            y: { duration: 2.6, repeat: Infinity, ease: "easeInOut" },
            rotate: { duration: isWaving ? 0.6 : 3.5, repeat: isWaving ? 2 : Infinity, ease: "easeInOut" }
          }}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.92 }}
          className="relative w-20 h-24 flex flex-col items-center justify-center"
        >
          {/* Antenna */}
          <div className="relative flex flex-col items-center">
            {/* Glowing Antenna Orb */}
            <motion.div
              animate={{
                scale: [1, 1.35, 1],
                boxShadow: [
                  "0 0 10px rgba(168,85,247,0.8)",
                  "0 0 22px rgba(168,85,247,1)",
                  "0 0 10px rgba(168,85,247,0.8)"
                ]
              }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
              className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-violet-400 to-fuchsia-500 border-2 border-white shadow-md z-10"
            />
            {/* Antenna Rod */}
            <div className="w-1 h-3 bg-gradient-to-b from-violet-300 to-slate-600 rounded-t-sm" />
          </div>

          {/* Robot Head */}
          <div className="relative w-16 h-12 rounded-2xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-2 border-violet-400/70 shadow-xl flex items-center justify-center overflow-hidden p-1">
            {/* Headphone Ear Cups */}
            <div className="absolute -left-2 top-1/2 -translate-y-1/2 w-2 h-6 rounded-l-md bg-violet-600 border border-violet-300 shadow-xs shadow-violet-500/50" />
            <div className="absolute -right-2 top-1/2 -translate-y-1/2 w-2 h-6 rounded-r-md bg-violet-600 border border-violet-300 shadow-xs shadow-violet-500/50" />

            {/* Glowing Face Visor Screen */}
            <div className="w-full h-full rounded-xl bg-slate-950 border border-cyan-500/40 flex items-center justify-around px-2 relative shadow-inner overflow-hidden">
              {/* Glass Reflection Highlight */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-white/25 rounded-t-lg pointer-events-none" />

              {/* Left Eye */}
              <motion.div
                animate={{
                  scaleY: isBlinking ? 0.1 : 1,
                  scaleX: isBlinking ? 1.2 : 1
                }}
                transition={{ duration: 0.1 }}
                className="w-2.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center relative"
              >
                <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5" />
              </motion.div>

              {/* Digital Smile */}
              <motion.div
                animate={{
                  scale: cheerMessage ? [1, 1.4, 1] : 1,
                }}
                className="w-2 h-1.5 border-b-2 border-cyan-400 rounded-b-full shadow-[0_0_4px_#22d3ee]"
              />

              {/* Right Eye */}
              <motion.div
                animate={{
                  scaleY: isBlinking ? 0.1 : 1,
                  scaleX: isBlinking ? 1.2 : 1
                }}
                transition={{ duration: 0.1 }}
                className="w-2.5 h-3.5 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee] flex items-center justify-center relative"
              >
                <div className="w-1 h-1 rounded-full bg-white absolute top-0.5 right-0.5" />
              </motion.div>
            </div>
          </div>

          {/* Robot Neck */}
          <div className="w-3.5 h-1 bg-slate-700 -my-0.5 z-0" />

          {/* Robot Torso */}
          <div className="relative w-12 h-8 rounded-xl bg-gradient-to-b from-slate-800 via-slate-900 to-slate-950 border-[1.5px] border-violet-400/60 shadow-lg flex items-center justify-center">
            {/* Chest Core Power Orb (Glowing Flame / Zap) */}
            <motion.div
              animate={{
                scale: [1, 1.3, 1],
                opacity: [0.85, 1, 0.85]
              }}
              transition={{ duration: 1.1, repeat: Infinity, ease: "easeInOut" }}
              className="w-4 h-4 rounded-full bg-gradient-to-br from-amber-400 via-orange-500 to-rose-500 shadow-[0_0_10px_#f97316] flex items-center justify-center"
            >
              <Zap className="w-2.5 h-2.5 text-white fill-white" />
            </motion.div>

            {/* Left Arm (Waving Motion) */}
            <motion.div
              animate={{
                rotate: isWaving ? [-20, 55, -20, 55, 0] : [-10, 0, -10],
                originX: 1,
                originY: 0
              }}
              transition={{
                duration: isWaving ? 0.5 : 2,
                repeat: isWaving ? 2 : Infinity,
                ease: "easeInOut"
              }}
              className="absolute -left-2.5 top-0.5 w-2 h-4.5 rounded-full bg-violet-600 border border-violet-300 shadow-xs flex items-end justify-center pb-0.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_4px_#67e8f9]" />
            </motion.div>

            {/* Right Arm */}
            <motion.div
              animate={{
                rotate: [5, 18, 5],
                originX: 0,
                originY: 0
              }}
              transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-2.5 top-0.5 w-2 h-4.5 rounded-full bg-violet-600 border border-violet-300 shadow-xs flex items-end justify-center pb-0.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-300 shadow-[0_0_4px_#67e8f9]" />
            </motion.div>
          </div>

          {/* Floating Base Shadow / Jet Thrust Glow */}
          <motion.div
            animate={{
              scale: [0.8, 1.25, 0.8],
              opacity: [0.3, 0.7, 0.3]
            }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
            className="w-10 h-2 rounded-full bg-violet-500/50 blur-xs mt-1.5"
          />
        </motion.div>
      </div>
    </motion.div>
  );
};
