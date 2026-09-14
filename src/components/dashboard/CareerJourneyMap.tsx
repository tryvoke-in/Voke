import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Crown, Check, Lock, Sparkles, Flame, Zap,
  Bot, Layers, ArrowRight, Gift, Star, Code2, Brain,
  ChevronRight, X, Compass, Award, ExternalLink, HelpCircle,
  ShieldCheck
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { toast } from "sonner";
import Confetti from "react-confetti";

interface CareerJourneyMapProps {
  profile: any;
  userStreak?: number;
  allSessions?: any[];
}

interface JourneyNode {
  id: string;
  title: string;
  category: string;
  stage: string;
  status: "completed" | "active" | "unlocked" | "locked" | "boss" | "summit";
  x: number;
  y: number;
  xp: number;
  icon: any;
  badge: string;
  description: string;
  questTasks: string[];
  ctaText: string;
  ctaPath: string;
  boss?: boolean;
}

export const CareerJourneyMap: React.FC<CareerJourneyMapProps> = ({
  profile,
  userStreak = 0,
  allSessions = [],
}) => {
  const navigate = useNavigate();
  const company = profile?.dream_company || "Google";
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [chestClaimed, setChestClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [showStreakModal, setShowStreakModal] = useState(false);

  // Initialize chest claimed state from localStorage for today scoped to this user
  useEffect(() => {
    const today = new Date().toDateString();
    const claimKey = `voke_daily_chest_${profile?.id || 'guest'}_${today}`;
    const lastClaim = localStorage.getItem(claimKey);
    if (lastClaim === today) {
      setChestClaimed(true);
    }
  }, [profile?.id]);

  const handleClaimChest = () => {
    if (chestClaimed) {
      toast.info("You've already claimed today's mystery reward! Come back tomorrow.");
      return;
    }

    const today = new Date().toDateString();
    const claimKey = `voke_daily_chest_${profile?.id || 'guest'}_${today}`;
    localStorage.setItem(claimKey, today);
    setChestClaimed(true);
    setShowConfetti(true);

    toast.success("🎁 Daily Mystery Loot Claimed! +50 XP & Streak Shield Activated!", {
      description: "Keep practicing daily to level up your career rank.",
    });

    setTimeout(() => {
      setShowConfetti(false);
    }, 4500);
  };

  // Real dynamic user progress metrics
  const solvedCount = useMemo(() => {
    return allSessions.filter((s: any) => s.type === 'Coding Practice' || s.question_id).length;
  }, [allSessions]);

  const interviewCount = useMemo(() => {
    return allSessions.filter((s: any) => s.type === 'Text' || s.type === 'Video' || s.type === 'Peer').length;
  }, [allSessions]);

  const systemDesignCount = useMemo(() => {
    return allSessions.filter((s: any) => 
      s.category?.toLowerCase()?.includes('system') || 
      s.role?.toLowerCase()?.includes('system') ||
      s.title?.toLowerCase()?.includes('system')
    ).length;
  }, [allSessions]);

  // Stage unlock thresholds
  const isDsaCompleted = solvedCount >= 5;
  const isInterviewCompleted = isDsaCompleted && interviewCount >= 3;
  const isSystemDesignCompleted = isInterviewCompleted && systemDesignCount >= 1;

  // Real Dynamic XP calculation based on genuine activity
  const currentXP = useMemo(() => {
    let xp = 0;

    // 1. XP from Solved Questions / Coding Practice (50 XP per question + bonus for high score)
    const codingSessions = allSessions.filter((s: any) => s.type === 'Coding Practice' || s.question_id);
    codingSessions.forEach((s: any) => {
      xp += 50;
      if (s.score && s.score >= 80) xp += 25;
    });

    // 2. XP from Completed Interview Simulations (150 XP per mock + score bonus)
    const interviewSessions = allSessions.filter((s: any) => s.type === 'Text' || s.type === 'Video' || s.type === 'Peer');
    interviewSessions.forEach((s: any) => {
      xp += 150;
      const score = s.overall_score || s.score || 0;
      if (score > 0) {
        xp += Math.round(score * 0.5);
      }
    });

    // 3. Platform Streak Momentum Bonus (25 XP per day of active streak)
    if (userStreak && userStreak > 0) {
      xp += userStreak * 25;
    }

    // 4. Daily Mystery Loot Claimed Today (+50 XP)
    if (chestClaimed) {
      xp += 50;
    }

    return xp;
  }, [allSessions, userStreak, chestClaimed]);

  const maxXP = 2500;
  const progressPercent = Math.min(100, Math.round((currentXP / maxXP) * 100));

  // Today's goals for the streak modal
  const solvedToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allSessions.filter((s: any) => {
      const isCoding = s.type === 'Coding Practice' || s.question_id;
      if (!isCoding) return false;
      const d = s.date || s.solved_at || s.created_at;
      return d && d.startsWith(today);
    }).length;
  }, [allSessions]);

  const mocksToday = useMemo(() => {
    const today = new Date().toISOString().split("T")[0];
    return allSessions.filter((s: any) => {
      const isMock = s.type === 'Text' || s.type === 'Video' || s.type === 'Peer';
      if (!isMock) return false;
      const d = s.date || s.created_at;
      return d && d.startsWith(today);
    }).length;
  }, [allSessions]);

  const dailyGoalPercent = Math.min(100, Math.round(((Math.min(2, solvedToday) + Math.min(1, mocksToday)) / 3) * 100));
  const outerOffset = 201 - Math.round(201 * (Math.min(2, solvedToday) / 2));
  const innerOffset = 138 - Math.round(138 * (Math.min(1, mocksToday) / 1));

  // Define the 7 Career Journey Nodes (Dynamically adapting to real user achievements)
  const nodes: JourneyNode[] = [
    {
      id: "node-1",
      title: "DSA Preparation",
      category: "Algorithmic Foundation",
      stage: "Stage 1",
      status: isDsaCompleted ? "completed" : "active",
      x: 75,
      y: 130,
      xp: 250,
      icon: Code2,
      badge: isDsaCompleted ? "Completed" : "Active Focus",
      description: "Data Structures & Algorithms problem-solving patterns, time/space complexity analysis, and core interview questions.",
      questTasks: isDsaCompleted
        ? [
            "Master High-Yield Algorithmic Patterns (Mastered)",
            "Optimize Time & Space Complexities (Mastered)",
            `${solvedCount} Curated Problems Solved on Platform`
          ]
        : [
            `${solvedCount}/5 Problems Solved to Clear Stage`,
            "Review Core Algorithmic Patterns",
            "Complete Daily Coding Practice"
          ],
      ctaText: isDsaCompleted ? "Review DSA Sheet" : "Solve Questions",
      ctaPath: "/dsa-sheet"
    },
    {
      id: "node-2",
      title: "AI Mock Interviews",
      category: "Live Simulation",
      stage: "Stage 2",
      status: isInterviewCompleted ? "completed" : isDsaCompleted ? "active" : "unlocked",
      x: 235,
      y: 65,
      xp: 450,
      icon: Bot,
      badge: isInterviewCompleted ? "Completed" : isDsaCompleted ? "Active Focus" : "Next Stage",
      description: "Interactive AI voice & video technical interview simulations with real-time scoring, live coding, and diagnostic feedback.",
      questTasks: isInterviewCompleted
        ? [
            "3 Technical Coding Mocks (Completed)",
            "Achieve 80%+ Evaluation Score (Mastered)",
            "AI Diagnostic Feedback Reviewed"
          ]
        : [
            `${interviewCount}/3 Technical Coding Mocks (${interviewCount > 0 ? `${interviewCount} Done` : "Pending"})`,
            "Achieve 80%+ Evaluation Score",
            isDsaCompleted ? "Active AI Interview Simulation" : "Unlock by Completing DSA Preparation"
          ],
      ctaText: "Start AI Interview",
      ctaPath: "/interview/new"
    },
    {
      id: "node-3",
      title: "System Design",
      category: "Scalable Architecture",
      stage: "Stage 3",
      status: isSystemDesignCompleted ? "completed" : isInterviewCompleted ? "active" : isDsaCompleted ? "unlocked" : "locked",
      x: 395,
      y: 140,
      xp: 550,
      icon: Layers,
      badge: isSystemDesignCompleted ? "Completed" : isInterviewCompleted ? "Active Focus" : isDsaCompleted ? "Next Stage" : "Locked Lv. 3",
      description: "High-Level distributed systems, caching strategies, database sharding, microservices, and load balancing.",
      questTasks: [
        "Design High-Throughput Distributed System",
        "Evaluate Caching, Sharding & CAP Theorem",
        "Architect Fault-Tolerant Microservices"
      ],
      ctaText: "Explore System Design",
      ctaPath: "/video-interview"
    },
    {
      id: "node-4",
      title: "Behavioral & Leadership",
      category: "Culture & HR Fit",
      stage: "Stage 4",
      status: "locked",
      x: 555,
      y: 65,
      xp: 600,
      icon: Award,
      badge: "Locked Lv. 4",
      description: "STAR method storytelling, conflict management, cross-functional collaboration, and cultural alignment.",
      questTasks: [
        "Formulate 5 Key Leadership Stories",
        "Master STAR Method Response Framework",
        "Demonstrate Ownership & Conflict Resolution"
      ],
      ctaText: "Practice Behavioral",
      ctaPath: "/interview/new"
    },
    {
      id: "node-5",
      title: `${company} Boss Trial`,
      category: "Target Company",
      stage: "Stage 5",
      status: "boss",
      boss: true,
      x: 715,
      y: 140,
      xp: 850,
      icon: Zap,
      badge: "Boss Challenge",
      description: `Comprehensive multi-round simulation tailored to real ${company} hiring bar standards and actual rounds.`,
      questTasks: [
        `Pass ${company} Technical Screen`,
        `${company} Architecture & Deep Dive`,
        `Leadership Principles & Bar Raiser Round`
      ],
      ctaText: `Explore ${company} Guide`,
      ctaPath: `/companies/${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    },
    {
      id: "node-6",
      title: "Bar Raiser Trial",
      category: "Executive Screen",
      stage: "Stage 6",
      status: "locked",
      x: 875,
      y: 65,
      xp: 900,
      icon: ShieldCheck,
      badge: "Elite Gauntlet",
      description: "The senior cross-functional bar raiser round testing long-term engineering judgment, system trade-offs, and ownership.",
      questTasks: [
        "Defend Complex Architecture Decisions",
        "Demonstrate Scaled Engineering Judgment",
        "Surpass Universal Hiring Bar"
      ],
      ctaText: "Take Bar Raiser Mock",
      ctaPath: "/interview/new"
    },
    {
      id: "node-7",
      title: "The Offer Summit",
      category: "Victory Goal",
      stage: "Final Goal",
      status: "summit",
      x: 1025,
      y: 125,
      xp: 1000,
      icon: Crown,
      badge: "Dream Offer",
      description: `Signed Offer Letter at ${company} with competitive compensation, equity package, and elite career milestone.`,
      questTasks: [
        "Receive Official Written Offer",
        "Negotiate Package & Equity",
        "Celebrate Career Breakthrough"
      ],
      ctaText: "View Offer Perks",
      ctaPath: "/pricing"
    }
  ];

  // Path coordinates for the undulating adventure spline
  const pathD = "M 75 130 C 130 130, 180 65, 235 65 C 290 65, 340 140, 395 140 C 450 140, 500 65, 555 65 C 610 65, 660 140, 715 140 C 770 140, 820 65, 875 65 C 930 65, 970 125, 1025 125";

  // Completed portion of path (dynamically based on completed milestones)
  const completedPathD = isInterviewCompleted
    ? "M 75 130 C 130 130, 180 65, 235 65 C 290 65, 340 140, 395 140"
    : isDsaCompleted
    ? "M 75 130 C 130 130, 180 65, 235 65"
    : "";

  return (
    <div className="relative w-full rounded-3xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card shadow-sm hover:shadow-md transition-all duration-300 overflow-hidden select-none">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          <Confetti width={window.innerWidth} height={window.innerHeight} recycle={false} numberOfPieces={350} />
        </div>
      )}

      {/* Animated Mountain Landscape Background with Red Flag on Summit */}
      <div className="absolute inset-0 pointer-events-none select-none overflow-hidden">
        <img
          src="/images/mountain_journey_bg.jpg"
          alt="Majestic Mountain Summit with Red Flag"
          className="w-full h-full object-cover object-[center_32%] scale-[1.02] transition-transform duration-1000"
        />

        {/* Soft atmospheric gradient wash ensuring high legibility for interactive UI elements */}
        <div className="absolute inset-0 bg-white/40 dark:bg-slate-950/65 backdrop-blur-[0.5px]" />
        <div className="absolute inset-0 bg-gradient-to-t from-white/75 via-transparent to-white/60 dark:from-slate-950/85 dark:via-transparent dark:to-slate-950/70" />

        {/* Ambient Drifting Mountain Mist Layers */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-40 dark:opacity-25">
          <div className="absolute top-[28%] -left-20 w-[120%] h-24 bg-gradient-to-r from-transparent via-white/40 to-transparent dark:via-sky-200/20 rounded-full blur-2xl animate-cloud-drift" />
          <div className="absolute top-[52%] -right-20 w-[110%] h-28 bg-gradient-to-r from-transparent via-white/35 to-transparent dark:via-indigo-200/15 rounded-full blur-3xl animate-cloud-drift-reverse" />
        </div>
      </div>

      {/* Top HUD: XP Bar, Duolingo-Style Streak Badge, and Daily Mystery Loot */}
      <div className="relative z-10 px-6 pt-5 pb-4 border-b border-slate-200/60 dark:border-border/60 bg-white/80 dark:bg-card/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Stats Pill Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* XP Progress Capsule */}
          <div className="bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-500" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block leading-none">
                  Total XP
                </span>
                <span className="text-xs font-extrabold text-slate-900 dark:text-slate-100">
                  {currentXP} / {maxXP} <span className="text-[10px] text-slate-500 font-normal">XP</span>
                </span>
              </div>
            </div>
            {/* Mini Progress Bar */}
            <div className="w-20 sm:w-24 h-2 bg-slate-200 dark:bg-border rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercent}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 to-[#5E37E8] rounded-full"
              />
            </div>
          </div>

          {/* Duolingo-Style Streak Card (Light & Dark Mode) */}
          <div className="flex flex-wrap items-center gap-2">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => setShowStreakModal(true)}
              className="bg-white dark:bg-[#18181b] border border-slate-200/90 dark:border-zinc-800 rounded-2xl px-3.5 py-2 flex items-center gap-2.5 shadow-2xs hover:shadow-xs transition-all cursor-pointer select-none"
            >
              {/* Flame Badge (Lit if streak > 0, unlit/dormant if 0) */}
              <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                userStreak > 0
                  ? "bg-gradient-to-tr from-amber-500 via-orange-500 to-red-500 shadow-xs shadow-orange-500/30"
                  : "bg-slate-100 dark:bg-zinc-800/80 border border-slate-200/60 dark:border-zinc-700/50"
              }`}>
                <Flame className={`w-4 h-4 ${userStreak > 0 ? "fill-white text-white animate-pulse" : "text-slate-400 dark:text-zinc-500"}`} />
              </div>
              <div className="leading-none">
                <span className="text-base sm:text-lg font-black text-slate-900 dark:text-white block tracking-tight">
                  {userStreak}
                </span>
                <span className="text-[10px] font-bold text-slate-500 dark:text-zinc-400 uppercase tracking-wide block mt-0.5">
                  {userStreak === 1 ? "Streak Day" : "Streak Days"}
                </span>
              </div>
            </motion.div>
          </div>

          {/* Daily Mystery Chest Action */}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <motion.button
                  whileHover={{ scale: 1.06 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={handleClaimChest}
                  className={`px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-xs font-bold transition-all shadow-2xs cursor-pointer ${
                    chestClaimed
                      ? "bg-slate-100 dark:bg-muted/50 text-slate-400 dark:text-slate-500 border border-slate-200/60 dark:border-border/60"
                      : "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-amber-500/25 animate-bounce-subtle"
                  }`}
                >
                  <Gift className={`w-4 h-4 ${chestClaimed ? "" : "animate-wiggle"}`} />
                  <span>{chestClaimed ? "Loot Claimed" : "Daily Mystery Loot"}</span>
                </motion.button>
              </TooltipTrigger>
              <TooltipContent>
                <p className="text-xs">
                  {chestClaimed
                    ? "Come back tomorrow for new mystery XP & badges!"
                    : "Tap to crack open today's bonus XP and streak boost!"}
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main Interactive World Map Canvas */}
      <div className="relative w-full overflow-x-auto no-scrollbar py-6 px-4 sm:px-8">
        <div className="relative w-full min-w-[1020px] h-[210px] mx-auto select-none">
          {/* Animated Background Spline Grid & Mountain Silhouette */}
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none"
            viewBox="0 0 1080 210"
            fill="none"
            preserveAspectRatio="none"
          >
            <defs>
              {/* Glow filter for completed path */}
              <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
                <feGaussianBlur stdDeviation="3" result="blur" />
                <feComposite in="SourceGraphic" in2="blur" operator="over" />
              </filter>

              {/* Completed Path Gradient: Emerald into Purple */}
              <linearGradient id="completedGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#10B981" />
                <stop offset="60%" stopColor="#6366F1" />
                <stop offset="100%" stopColor="#5E37E8" />
              </linearGradient>

              {/* Future Path Gradient */}
              <linearGradient id="futureGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#6366F1" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.2" />
              </linearGradient>
            </defs>

            {/* Base Trail Contour (Dashed track) */}
            <path
              d={pathD}
              stroke="currentColor"
              className="text-slate-200 dark:text-slate-800"
              strokeWidth="6"
              strokeLinecap="round"
            />

            {/* Dotted Guide Trail for future milestones */}
            <path
              d={pathD}
              stroke="url(#futureGrad)"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeDasharray="6 8"
              className="animate-pulse"
            />

            {/* Active & Completed Energy Trail with glowing gradient (only rendered when user has completions) */}
            {completedPathD && (
              <>
                <path
                  d={completedPathD}
                  stroke="url(#completedGrad)"
                  strokeWidth="5"
                  strokeLinecap="round"
                  filter="url(#glow)"
                />
                <path
                  d={completedPathD}
                  stroke="#FFFFFF"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeDasharray="14 120"
                  className="animate-dash"
                  opacity="0.9"
                />
              </>
            )}

            {/* Decorative terrain contour hills */}
            <path
              d="M 50 190 Q 200 170 350 195 T 700 185 T 1050 190"
              stroke="currentColor"
              className="text-slate-200/50 dark:text-slate-800/40"
              strokeWidth="1.5"
              fill="none"
            />
          </svg>

          {/* Stepping Stones / Intermediate Waypoint Dots */}
          {[
            { x: 155, y: 97, completed: isDsaCompleted },
            { x: 315, y: 102, completed: isInterviewCompleted },
            { x: 475, y: 102, completed: isSystemDesignCompleted },
            { x: 635, y: 102, completed: false },
            { x: 795, y: 102, completed: false },
            { x: 950, y: 95, completed: false }
          ].map((dot, idx) => (
            <div
              key={`dot-${idx}`}
              style={{ left: `${(dot.x / 1080) * 100}%`, top: `${(dot.y / 210) * 100}%` }}
              className={`absolute -translate-x-1/2 -translate-y-1/2 w-2.5 h-2.5 rounded-full pointer-events-none transition-all ${
                dot.completed
                  ? "bg-indigo-500 shadow-sm shadow-indigo-500/50 ring-2 ring-indigo-200 dark:ring-indigo-900/60"
                  : "bg-slate-300 dark:bg-slate-700"
              }`}
            />
          ))}

          {/* Interactive Quest Nodes */}
          {nodes.map((node) => {
            const IconComponent = node.icon;
            const leftPct = (node.x / 1080) * 100;
            const topPct = (node.y / 210) * 100;

            return (
              <div
                key={node.id}
                style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                className="absolute -translate-x-1/2 -translate-y-1/2 z-20 flex flex-col items-center"
              >
                {/* Floating "YOU ARE HERE" player marker for active node */}
                {node.status === "active" && (
                  <motion.div
                    initial={{ y: 0 }}
                    animate={{ y: [-4, 3, -4] }}
                    transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                    className="absolute -top-10 flex flex-col items-center z-30 pointer-events-none"
                  >
                    <div className="px-2.5 py-0.5 rounded-full bg-[#5E37E8] text-white text-[10px] font-extrabold shadow-lg shadow-[#5E37E8]/40 tracking-wider uppercase flex items-center gap-1 border border-white/30 whitespace-nowrap">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                      <span>YOU ARE HERE</span>
                    </div>
                    <div className="w-0 h-0 border-x-4 border-x-transparent border-t-5 border-t-[#5E37E8] drop-shadow-xs" />
                  </motion.div>
                )}

                {/* Summit Victory Flag Banner */}
                {node.status === "summit" && (
                  <div className="absolute -top-8 flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-red-500/15 border border-red-500/40 text-red-600 dark:text-red-400 text-[10px] font-extrabold pointer-events-none whitespace-nowrap shadow-xs backdrop-blur-xs">
                    <span>Goal Summit 🚩</span>
                  </div>
                )}

                {/* Boss Badge for target company */}
                {node.boss && (
                  <div className="absolute -top-6 flex items-center gap-1 px-2 py-0.5 rounded-full bg-red-500/15 border border-red-500/30 text-red-600 dark:text-red-400 text-[9.5px] font-extrabold pointer-events-none whitespace-nowrap">
                    <Zap className="w-2.5 h-2.5 fill-red-500" />
                    <span>BOSS RAID</span>
                  </div>
                )}

                {/* Interactive Node Token */}
                <motion.button
                  whileHover={{ scale: 1.15, y: -2 }}
                  whileTap={{ scale: 0.94 }}
                  onClick={() => setSelectedNode(node)}
                  className={`relative w-12 h-12 rounded-2xl flex items-center justify-center transition-all cursor-pointer shadow-md ${
                    node.status === "completed"
                      ? "bg-emerald-600 text-white shadow-emerald-600/25 ring-3 ring-emerald-500/20"
                      : node.status === "active"
                      ? "bg-gradient-to-tr from-[#5E37E8] to-indigo-500 text-white ring-4 ring-[#5E37E8]/30 shadow-[#5E37E8]/40 animate-pulse-subtle"
                      : node.status === "unlocked"
                      ? "bg-white dark:bg-card border-2 border-indigo-500 text-indigo-600 dark:text-indigo-400 hover:bg-indigo-50 dark:hover:bg-indigo-500/15 shadow-indigo-500/20"
                      : node.boss
                      ? "bg-gradient-to-tr from-amber-600 to-orange-500 text-white shadow-orange-500/30 ring-3 ring-orange-500/25"
                      : node.status === "summit"
                      ? "bg-gradient-to-tr from-amber-400 via-amber-500 to-yellow-400 text-white shadow-amber-500/40 ring-4 ring-amber-400/30"
                      : "bg-slate-100 dark:bg-card border border-slate-200 dark:border-border text-slate-400 dark:text-slate-500"
                  }`}
                >
                  {/* Radar beacon for active node */}
                  {node.status === "active" && (
                    <span className="absolute inset-0 rounded-2xl ring-2 ring-[#5E37E8] animate-ping opacity-50 pointer-events-none" />
                  )}

                  <IconComponent className={`w-5 h-5 ${node.status === "completed" ? "stroke-[2.5]" : ""}`} />

                  {/* Corner XP Tag */}
                  <span className="absolute -bottom-1 -right-1 px-1.5 py-0.2 rounded-md bg-slate-900/80 dark:bg-black text-[8.5px] font-bold text-white shadow-xs">
                    +{node.xp}
                  </span>
                </motion.button>

                {/* Node Title & Status Subtitle */}
                <div className="mt-2 text-center max-w-[110px]">
                  <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate leading-tight">
                    {node.title}
                  </p>
                  <p
                    className={`text-[10px] font-semibold mt-0.5 ${
                      node.status === "completed"
                        ? "text-emerald-600 dark:text-emerald-400"
                        : node.status === "active"
                        ? "text-[#5E37E8] dark:text-indigo-400 font-extrabold"
                        : node.status === "unlocked"
                        ? "text-indigo-600 dark:text-indigo-400"
                        : node.boss
                        ? "text-orange-600 dark:text-orange-400 font-bold"
                        : node.status === "summit"
                        ? "text-amber-600 dark:text-amber-400 font-extrabold"
                        : "text-slate-400 dark:text-slate-500"
                    }`}
                  >
                    {node.badge}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Motivation & Quick Quest Action Footer */}
      <div className="relative z-10 px-6 py-3 bg-white/80 dark:bg-card/85 backdrop-blur-md border-t border-slate-200/60 dark:border-border/60 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-slate-300">
          <span>
            {isDsaCompleted ? (
              <>Active Focus: Complete your <strong>AI Mock Interviews</strong> to unlock <strong>System Design</strong>!</>
            ) : (
              <>Active Focus: Start with <strong>DSA Preparation</strong> to build your algorithmic foundation ({solvedCount}/5 solved)!</>
            )}
          </span>
        </div>

        <button
          onClick={() => navigate(isDsaCompleted ? "/interview/new" : "/dsa-sheet")}
          className="h-8 px-4 rounded-xl bg-[#5E37E8] hover:bg-[#522fd6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>{isDsaCompleted ? "Start AI Interview" : "Start DSA Practice"}</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Interactive Quest Modal / Inspector Dialog */}
      <AnimatePresence>
        {selectedNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-md rounded-3xl bg-white dark:bg-card border border-slate-200 dark:border-border p-6 shadow-2xl space-y-4 relative overflow-hidden"
            >
              {/* Background gradient banner */}
              <div className="absolute top-0 left-0 right-0 h-24 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-emerald-500/10 dark:from-indigo-500/20 dark:to-purple-500/20 pointer-events-none" />

              {/* Close Button */}
              <button
                onClick={() => setSelectedNode(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-muted text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              {/* Node Header */}
              <div className="relative z-10 flex items-start gap-3.5">
                <div
                  className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white shrink-0 shadow-md ${
                    selectedNode.status === "completed"
                      ? "bg-emerald-600 shadow-emerald-600/30"
                      : selectedNode.status === "active"
                      ? "bg-[#5E37E8] shadow-[#5E37E8]/40"
                      : selectedNode.boss
                      ? "bg-orange-600 shadow-orange-600/40"
                      : selectedNode.status === "summit"
                      ? "bg-amber-500 shadow-amber-500/40"
                      : "bg-indigo-600 shadow-indigo-600/30"
                  }`}
                >
                  <selectedNode.icon className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#5E37E8] dark:text-indigo-400">
                      {selectedNode.stage} • {selectedNode.category}
                    </span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 dark:bg-muted font-bold text-slate-700 dark:text-slate-300">
                      +{selectedNode.xp} XP
                    </span>
                  </div>
                  <h4 className="text-lg font-bold text-slate-900 dark:text-slate-100 mt-0.5">
                    {selectedNode.title}
                  </h4>
                </div>
              </div>

              {/* Description */}
              <p className="relative z-10 text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                {selectedNode.description}
              </p>

              {/* Quest Tasks Checklist */}
              <div className="space-y-2 pt-2 border-t border-slate-100 dark:border-border/60">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Stage Objectives:
                </span>
                <div className="space-y-1.5">
                  {selectedNode.questTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-muted/40 p-2 rounded-xl border border-slate-200/50 dark:border-border/50"
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          selectedNode.status === "completed" || task.includes("Completed") || task.includes("Mastered")
                            ? "bg-emerald-500 text-white"
                            : "border border-slate-400 text-transparent"
                        }`}
                      >
                        <Check className="w-2.5 h-2.5 stroke-[3]" />
                      </div>
                      <span className="flex-1 font-medium">{task}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100 dark:border-border/60">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedNode(null)}
                  className="h-9 text-xs rounded-xl cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setSelectedNode(null);
                    navigate(selectedNode.ctaPath);
                  }}
                  className="h-9 text-xs rounded-xl bg-[#5E37E8] hover:bg-[#522fd6] text-white font-semibold flex items-center gap-1.5 shadow-sm shadow-[#5E37E8]/25 cursor-pointer"
                >
                  <span>{selectedNode.ctaText}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Duolingo-Style Detailed Streak & Daily Goal Modal */}
      <AnimatePresence>
        {showStreakModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.94, y: 10 }}
              transition={{ duration: 0.2 }}
              className="w-full max-w-lg rounded-3xl bg-white dark:bg-[#18181b] border border-slate-200 dark:border-zinc-800 p-6 shadow-2xl space-y-5 relative overflow-hidden"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowStreakModal(false)}
                className="absolute top-4 right-4 p-1.5 rounded-full bg-slate-100 dark:bg-zinc-800 text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors cursor-pointer z-10"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2">
                <span className="text-xl">🔥</span>
                <h3 className="text-lg font-black text-slate-900 dark:text-white tracking-tight">
                  Daily Momentum & Streak Goals
                </h3>
              </div>

              {/* Grid of the 2 Featured Reference Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Large Streak Days Card */}
                <div className={`rounded-2xl p-5 text-white border shadow-md flex flex-col justify-between relative overflow-hidden min-h-[160px] ${
                  userStreak > 0
                    ? "bg-gradient-to-b from-amber-400 to-amber-500 dark:from-[#202024] dark:to-[#18181b] border-amber-300 dark:border-zinc-800"
                    : "bg-slate-100 dark:bg-[#1c1c1f] text-slate-900 dark:text-white border-slate-200 dark:border-zinc-800"
                }`}>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        userStreak > 0 ? "bg-white/20 dark:bg-orange-500/20" : "bg-slate-200 dark:bg-zinc-700/50"
                      }`}>
                        <Flame className={`w-5 h-5 ${
                          userStreak > 0
                            ? "fill-white text-white dark:text-orange-500 dark:fill-orange-500"
                            : "text-slate-400 dark:text-zinc-400"
                        }`} />
                      </div>
                      <span className="text-3xl font-black tracking-tight">{userStreak}</span>
                    </div>
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      userStreak > 0 ? "text-white/90 dark:text-zinc-400" : "text-slate-500 dark:text-zinc-400"
                    }`}>
                      {userStreak === 1 ? "Streak Day" : "Streak Days"}
                    </span>
                  </div>

                  {/* Motivational Mascot Note */}
                  <div className="relative z-10 mt-4 pt-3 border-t border-slate-200/60 dark:border-zinc-800/80">
                    <p className={`text-xs font-medium leading-snug ${
                      userStreak > 0 ? "text-white/90 dark:text-zinc-300" : "text-slate-600 dark:text-zinc-400"
                    }`}>
                      {userStreak > 0
                        ? `Consistent practice gets you to ${company || "Google"}! Keep your momentum blazing.`
                        : `Complete your first practice session today to ignite your streak towards ${company || "Google"}!`}
                    </p>
                  </div>

                  {/* Background flame artwork silhouette */}
                  <Flame className={`absolute -bottom-6 -right-6 w-32 h-32 fill-current pointer-events-none ${
                    userStreak > 0 ? "text-white/15 dark:text-orange-500/10" : "text-slate-300/30 dark:text-zinc-700/15"
                  }`} />
                </div>

                {/* 2. Concentric Dual-Ring Daily Goal Card */}
                <div className="rounded-2xl p-5 bg-slate-50 dark:bg-[#202024] border border-slate-200/80 dark:border-zinc-800/90 shadow-sm flex flex-col justify-between">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <div className="w-5 h-5 rounded-full bg-blue-500/15 text-blue-500 flex items-center justify-center text-xs">
                        🎯
                      </div>
                      <span className="text-xs font-bold text-slate-900 dark:text-white">Daily Goal</span>
                    </div>
                  </div>

                  {/* Concentric Dual Rings SVG */}
                  <div className="flex items-center justify-center my-2">
                    <div className="relative w-20 h-20 flex items-center justify-center">
                      <svg className="w-full h-full -rotate-90" viewBox="0 0 80 80">
                        {/* Outer Ring Background (DSA: 2 target) */}
                        <circle cx="40" cy="40" r="32" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-zinc-700" fill="none" />
                        <circle cx="40" cy="40" r="32" stroke="#3b82f6" strokeWidth="6" strokeDasharray="201" strokeDashoffset={outerOffset} strokeLinecap="round" fill="none" />

                        {/* Inner Ring Background (Mocks: 1 target) */}
                        <circle cx="40" cy="40" r="22" stroke="currentColor" strokeWidth="6" className="text-slate-200 dark:text-zinc-700" fill="none" />
                        <circle cx="40" cy="40" r="22" stroke="#06b6d4" strokeWidth="6" strokeDasharray="138" strokeDashoffset={innerOffset} strokeLinecap="round" fill="none" />
                      </svg>
                      <span className="absolute text-xs font-black text-slate-800 dark:text-white">{dailyGoalPercent}%</span>
                    </div>
                  </div>

                  {/* Ring Legend Counters */}
                  <div className="flex items-center justify-around gap-2 text-xs font-bold pt-2 border-t border-slate-200/60 dark:border-zinc-800">
                    <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400">
                      <div className="w-2 h-2 rounded-full bg-blue-500" />
                      <span>📖 {solvedToday}/2 Solved</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-cyan-600 dark:text-cyan-400">
                      <div className="w-2 h-2 rounded-full bg-cyan-500" />
                      <span>🥊 {mocksToday}/1 Mocks</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-zinc-800">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowStreakModal(false)}
                  className="h-9 text-xs rounded-xl cursor-pointer"
                >
                  Close
                </Button>
                <Button
                  size="sm"
                  onClick={() => {
                    setShowStreakModal(false);
                    navigate("/dsa-sheet");
                  }}
                  className="h-9 text-xs rounded-xl bg-[#5E37E8] hover:bg-[#522fd6] text-white font-semibold flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <span>{isDsaCompleted ? "Practice Questions" : "Start First Practice"}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
};
