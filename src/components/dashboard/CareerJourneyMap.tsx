import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "motion/react";
import {
  Trophy, Crown, Check, Lock, Sparkles, Flame, Zap,
  Bot, Layers, ArrowRight, Gift, Star, Code2, Brain,
  ChevronRight, X, Compass, Award, ExternalLink, HelpCircle
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
  userStreak = 1,
  allSessions = [],
}) => {
  const navigate = useNavigate();
  const company = profile?.dream_company || "Google";
  const [selectedNode, setSelectedNode] = useState<JourneyNode | null>(null);
  const [chestClaimed, setChestClaimed] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [currentXP, setCurrentXP] = useState(1450);

  // Initialize chest claimed state from localStorage for today
  useEffect(() => {
    const today = new Date().toDateString();
    const lastClaim = localStorage.getItem("voke_daily_chest_claim");
    if (lastClaim === today) {
      setChestClaimed(true);
    }
  }, []);

  const handleClaimChest = () => {
    if (chestClaimed) {
      toast.info("You've already claimed today's mystery reward! Come back tomorrow.");
      return;
    }

    const today = new Date().toDateString();
    localStorage.setItem("voke_daily_chest_claim", today);
    setChestClaimed(true);
    setCurrentXP((prev) => prev + 100);
    setShowConfetti(true);

    toast.success("🎁 Daily Mystery Loot Claimed! +100 XP & Streak Shield Activated!", {
      description: "Keep practicing daily to level up your career rank.",
    });

    setTimeout(() => {
      setShowConfetti(false);
    }, 4500);
  };

  // Define the 7 Journey Nodes
  const nodes: JourneyNode[] = [
    {
      id: "node-1",
      title: "Array & String Bastion",
      category: "Data Structures",
      stage: "Stage 1",
      status: "completed",
      x: 75,
      y: 130,
      xp: 150,
      icon: Code2,
      badge: "Mastered",
      description: "Fundamental memory layouts, hashing, sliding windows, and algorithmic foundations.",
      questTasks: [
        "Two Sum & Hash Maps (Completed)",
        "Longest Substring Without Repeating Characters (Completed)",
        "Sliding Window Maximum (Completed)"
      ],
      ctaText: "Review Questions",
      ctaPath: "/dsa-sheet"
    },
    {
      id: "node-2",
      title: "Two Pointers & Linked Lists",
      category: "Algorithms",
      stage: "Stage 1",
      status: "completed",
      x: 235,
      y: 65,
      xp: 200,
      icon: Check,
      badge: "Mastered",
      description: "In-place array manipulations, fast & slow pointers, and singly/doubly linked chains.",
      questTasks: [
        "Trapping Rain Water (Completed)",
        "Linked List Cycle Detection (Completed)",
        "Reverse Nodes in k-Group (Completed)"
      ],
      ctaText: "Review Solutions",
      ctaPath: "/dsa-sheet"
    },
    {
      id: "node-3",
      title: "Tree & Graph Labyrinth",
      category: "Advanced DSA",
      stage: "Stage 2",
      status: "active",
      x: 395,
      y: 140,
      xp: 350,
      icon: Brain,
      badge: "Current Quest",
      description: "Recursive DFS/BFS traversals, binary search trees, topological sorting, and shortest path algorithms.",
      questTasks: [
        "Lowest Common Ancestor in BST (Solved)",
        "Word Ladder II (Pending)",
        "Course Schedule & Cycle Detection (In Progress)"
      ],
      ctaText: "Resume DSA Quest",
      ctaPath: "/dsa-sheet"
    },
    {
      id: "node-4",
      title: "AI Behavioral & STAR Arena",
      category: "Mock Interviews",
      stage: "Stage 2",
      status: "unlocked",
      x: 555,
      y: 65,
      xp: 450,
      icon: Bot,
      badge: "Next Challenger",
      description: "Master situation, task, action, and result frameworks with real-time vocal AI evaluation.",
      questTasks: [
        "Handle Conflict with Senior Teammates",
        "Tell Me About a Tough Architecture Mistake",
        "Achieve 85%+ STAR Communication Score"
      ],
      ctaText: "Enter AI Arena",
      ctaPath: "/interview/new"
    },
    {
      id: "node-5",
      title: "System Design Citadel",
      category: "Architecture",
      stage: "Stage 3",
      status: "locked",
      x: 715,
      y: 140,
      xp: 550,
      icon: Layers,
      badge: "Locked Lv. 5",
      description: "Distributed caching, database sharding, rate limiting, and CAP theorem trade-offs.",
      questTasks: [
        "Design TinyURL / Bitly at 100M QPS",
        "Design Instagram News Feed & Fanout",
        "Complete 1 System Design Simulation"
      ],
      ctaText: "Unlock at Level 5",
      ctaPath: "/video-interview"
    },
    {
      id: "node-6",
      title: `${company} Boss Trial`,
      category: "Company Raid",
      stage: "Stage 3",
      status: "boss",
      boss: true,
      x: 875,
      y: 65,
      xp: 750,
      icon: Zap,
      badge: "Boss Challenge",
      description: `Comprehensive multi-round simulation tailored to real ${company} hiring bar standards.`,
      questTasks: [
        `Pass ${company} Technical Bar Assessment`,
        `Leadership Principles & Culture Fit`,
        `Live Code & Complexity Defense`
      ],
      ctaText: `Explore ${company} Guide`,
      ctaPath: `/companies/${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}`
    },
    {
      id: "node-7",
      title: "The Offer Summit",
      category: "Victory",
      stage: "Goal",
      status: "summit",
      x: 1025,
      y: 125,
      xp: 1000,
      icon: Crown,
      badge: "Victory Goal",
      description: `Signed Offer Letter at ${company} with competitive tier package and elite status.`,
      questTasks: [
        "Negotiate Offer Package",
        "Celebrate Career Breakthrough",
        "Join Voke Hall of Fame"
      ],
      ctaText: "View Career Perks",
      ctaPath: "/pricing"
    }
  ];

  const maxXP = 2500;
  const level = 4;
  const progressPercent = Math.min(100, Math.round((currentXP / maxXP) * 100));

  // Path coordinates for the undulating adventure spline
  const pathD = "M 75 130 C 130 130, 180 65, 235 65 C 290 65, 340 140, 395 140 C 450 140, 500 65, 555 65 C 610 65, 660 140, 715 140 C 770 140, 820 65, 875 65 C 930 65, 970 125, 1025 125";
  // Completed portion of path (Nodes 1 -> 3)
  const completedPathD = "M 75 130 C 130 130, 180 65, 235 65 C 290 65, 340 140, 395 140";

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

      {/* Top HUD: Level, Rank, XP Bar, and Target Badge */}
      <div className="relative z-10 px-6 pt-5 pb-4 border-b border-slate-200/60 dark:border-border/60 bg-white/80 dark:bg-card/85 backdrop-blur-md flex flex-wrap items-center justify-between gap-4">
        {/* Left: Quest Chapter Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-[#5E37E8] to-indigo-500 text-white flex items-center justify-center shadow-md shadow-[#5E37E8]/25 shrink-0">
            <Compass className="w-5 h-5 animate-spin-slow" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-extrabold tracking-tight text-slate-900 dark:text-slate-100 flex items-center gap-2">
                
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-indigo-50 dark:bg-indigo-500/15 text-[#5E37E8] dark:text-indigo-300 border border-indigo-200/60 dark:border-indigo-400/30">
                  Chapter 2: The Data Dungeon
                </span>
              </h3>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 flex items-center gap-1.5">
              
            </p>
          </div>
        </div>

        {/* Right: Gamified Stats Pill Row */}
        <div className="flex flex-wrap items-center gap-3">
          {/* XP Progress Capsule */}
          <div className="bg-slate-50 dark:bg-muted/40 border border-slate-200/80 dark:border-border/80 px-3.5 py-1.5 rounded-2xl flex items-center gap-3 shadow-2xs">
            <div className="flex items-center gap-1.5">
              <Award className="w-4 h-4 text-indigo-500" />
              <div className="text-left">
                <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                  Lv. {level} Explorer
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

          {/* Daily Streak Flame Pill */}
          <div className="bg-orange-50 dark:bg-orange-500/10 border border-orange-200/70 dark:border-orange-500/30 px-3 py-1.5 rounded-2xl flex items-center gap-1.5 text-orange-600 dark:text-orange-400 shadow-2xs">
            <Flame className="w-4 h-4 fill-orange-500 text-orange-500 animate-pulse" />
            <span className="text-xs font-bold">{userStreak || 1} Day Streak</span>
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

            {/* Active & Completed Energy Trail with glowing gradient */}
            <path
              d={completedPathD}
              stroke="url(#completedGrad)"
              strokeWidth="5"
              strokeLinecap="round"
              filter="url(#glow)"
            />

            {/* Flowing animated energy pulses along completed track */}
            <path
              d={completedPathD}
              stroke="#FFFFFF"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeDasharray="14 120"
              className="animate-dash"
              opacity="0.9"
            />

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
            { x: 155, y: 97, completed: true },
            { x: 315, y: 102, completed: true },
            { x: 475, y: 102, completed: false },
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
                    className="absolute -top-12 flex flex-col items-center z-30 pointer-events-none"
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
             Complete <strong>Tree & Graph Labyrinth</strong> to unlock the <strong>AI Behavioral Arena</strong>!
          </span>
        </div>

        <button
          onClick={() => navigate("/dsa-sheet")}
          className="h-8 px-4 rounded-xl bg-[#5E37E8] hover:bg-[#522fd6] text-white text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all active:scale-[0.98] cursor-pointer"
        >
          <span>Continue Journey</span>
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
                <p className="text-xs font-bold text-slate-800 dark:text-slate-200">
                  Quest Objectives:
                </p>
                <div className="space-y-1.5">
                  {selectedNode.questTasks.map((task, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2.5 text-xs text-slate-700 dark:text-slate-300 bg-slate-50 dark:bg-muted/40 p-2 rounded-xl border border-slate-200/50 dark:border-border/50"
                    >
                      <div
                        className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          selectedNode.status === "completed" || task.includes("Completed") || task.includes("Solved")
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
    </div>
  );
};
