import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Target, Flame, Clock, Sparkles, ArrowRight, ExternalLink,
  Code2, CheckCircle2, Trophy, Building2, Tag, HelpCircle,
  ChevronDown, ChevronUp, Copy, Check, Zap, Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { getDailyQuestion } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface DailyQuestionWidgetProps {
  userStreak?: number;
}

export const DailyQuestionWidget: React.FC<DailyQuestionWidgetProps> = ({ userStreak }) => {
  const navigate = useNavigate();
  const dailyQuestion = getDailyQuestion();

  const [timeLeft, setTimeLeft] = useState<{ hours: number; minutes: number; seconds: number }>({
    hours: 0,
    minutes: 0,
    seconds: 0,
  });
  const [isSolved, setIsSolved] = useState(false);
  const [streak, setStreak] = useState<number>(userStreak || 0);
  const [showHint, setShowHint] = useState(false);
  const [isCopied, setIsCopied] = useState(false);
  const [hintText, setHintText] = useState<string | null>(null);
  const [loadingHint, setLoadingHint] = useState(false);

  // Calculate time left until UTC midnight
  useEffect(() => {
    const updateCountdown = () => {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setUTCHours(24, 0, 0, 0);
      const diff = tomorrow.getTime() - now.getTime();

      if (diff <= 0) {
        setTimeLeft({ hours: 0, minutes: 0, seconds: 0 });
        return;
      }

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      setTimeLeft({ hours, minutes, seconds });
    };

    updateCountdown();
    const timer = setInterval(updateCountdown, 1000);
    return () => clearInterval(timer);
  }, []);

  // Check if solved today and fetch streak if not passed in props
  useEffect(() => {
    const checkSolvedAndStreak = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;
        if (!user) return;

        // Check if current question is solved
        const { data: solved } = await supabase
          .from("solved_questions" as any)
          .select("id, created_at")
          .eq("user_id", user.id)
          .eq("question_id", dailyQuestion.id)
          .maybeSingle();

        if (solved) {
          setIsSolved(true);
        }

        // Fetch activity for streak if not provided
        if (userStreak === undefined) {
          const { data: textSessions } = await supabase.from("interview_sessions").select("created_at").eq("user_id", user.id);
          const { data: videoSessions } = await supabase.from("video_interview_sessions").select("created_at").eq("user_id", user.id);
          const { data: peerSessions } = await supabase.from("peer_interview_sessions").select("scheduled_at").eq("host_user_id", user.id);
          const { data: allSolved } = await supabase.from("solved_questions" as any).select("created_at").eq("user_id", user.id);

          const allDates = [
            ...(textSessions || []).map(s => s.created_at),
            ...(videoSessions || []).map(s => s.created_at),
            ...(peerSessions || []).map(s => s.scheduled_at),
            ...(allSolved || []).map((s: any) => s.created_at)
          ].filter(Boolean);

          const calculatedStreak = computeStreak(allDates);
          setStreak(calculatedStreak);
        }
      } catch (err) {
        console.error("Error checking daily question status:", err);
      }
    };

    checkSolvedAndStreak();
  }, [dailyQuestion.id, userStreak]);

  const computeStreak = (dates: string[]) => {
    if (!dates || dates.length === 0) return 0;
    const sorted = [...new Set(dates.map(d => new Date(d).toISOString().split('T')[0]))].sort().reverse();
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    if (sorted[0] !== today && sorted[0] !== yesterday) return 0;

    let count = 0;
    let current = new Date(sorted[0]);

    for (let i = 0; i < sorted.length; i++) {
      const expected = current.toISOString().split('T')[0];
      if (sorted[i] === expected) {
        count++;
        current.setDate(current.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  };

  const handleCopyTitle = () => {
    navigator.clipboard.writeText(`${dailyQuestion.title} - ${dailyQuestion.url}`);
    setIsCopied(true);
    toast.success("Problem info copied to clipboard!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFetchQuickHint = async () => {
    if (hintText) {
      setShowHint(!showHint);
      return;
    }

    setShowHint(true);
    setLoadingHint(true);
    try {
      const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
        body: {
          messages: [
            {
              role: "user",
              content: `Give me a concise 2-sentence intuition/hint for solving the DSA problem "${dailyQuestion.title}" (${dailyQuestion.difficulty}, tags: ${dailyQuestion.tags.join(", ")}). Do NOT give the solution code. Give an intuitive algorithmic hint.`
            }
          ],
          userContext: "Provide a sharp, intuitive algorithm hint for a coding interview challenge."
        }
      });

      if (error) throw error;
      if (data?.response) {
        setHintText(data.response);
      } else {
        setHintText(`Focus on identifying the core pattern for ${dailyQuestion.tags[0] || "this topic"}. Consider time-space tradeoffs before coding.`);
      }
    } catch (err) {
      setHintText(`Think about using ${dailyQuestion.tags.slice(0, 2).join(" or ")} to optimize your approach from brute force.`);
    } finally {
      setLoadingHint(false);
    }
  };

  // Difficulty style tokens
  const difficultyConfig = {
    Easy: {
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      glow: "from-emerald-500/20 to-transparent",
      border: "border-emerald-500/30",
      accent: "text-emerald-500",
      xp: "+30 XP",
      timeEstimate: "15-20 min"
    },
    Medium: {
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      glow: "from-amber-500/20 to-transparent",
      border: "border-amber-500/30",
      accent: "text-amber-500",
      xp: "+50 XP",
      timeEstimate: "25-35 min"
    },
    Hard: {
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      glow: "from-rose-500/20 to-transparent",
      border: "border-rose-500/30",
      accent: "text-rose-500",
      xp: "+100 XP",
      timeEstimate: "45-60 min"
    }
  };

  const currentDiff = difficultyConfig[dailyQuestion.difficulty as keyof typeof difficultyConfig] || difficultyConfig.Medium;

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      <Card id="tour-daily-practice" className="relative border border-border/60 bg-gradient-to-b from-card via-card to-card/90 text-card-foreground hover:border-orange-500/40 hover:shadow-[0_8px_30px_rgba(249,115,22,0.08)] transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col justify-between group">
        {/* Subtle glowing accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-rose-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-8 h-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-colors"
              >
                <Target className="w-4 h-4" />
              </motion.div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                Daily Practice
              </h3>
            </div>

            <Badge className={`${currentDiff.badge} text-[10px] font-bold px-2 py-0.5 border shadow-2xs rounded-full`}>
              {dailyQuestion.difficulty}
            </Badge>
          </div>

          {/* Problem Title & Category Subtitle */}
          <div className="space-y-1">
            <h4
              className="text-xs sm:text-sm font-bold text-foreground hover:text-orange-400 transition-colors cursor-pointer line-clamp-1 group-hover:text-orange-400"
              onClick={() => navigate("/daily-challenge/solve")}
            >
              {dailyQuestion.title}
            </h4>
            <p className="text-xs text-muted-foreground truncate">
              {dailyQuestion.tags && dailyQuestion.tags.length > 0
                ? dailyQuestion.tags.slice(0, 3).join(" · ")
                : "Array · Dynamic Programming"}
            </p>
          </div>

          {/* Type & Reward Info Cards */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-muted/30 hover:bg-muted/50 border border-border/60 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-default"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Type</span>
              <span className="text-xs font-bold text-foreground mt-0.5">Coding</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-muted/30 hover:bg-muted/50 border border-border/60 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-default"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Reward</span>
              <span className="text-xs font-extrabold text-amber-400 mt-0.5 flex items-center gap-1">
                <Zap className="w-3 h-3 fill-amber-400 text-amber-400" />
                {currentDiff.xp}
              </span>
            </motion.div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={() => navigate("/daily-challenge/solve")}
              className="w-full relative overflow-hidden bg-gradient-to-r from-orange-500 via-rose-500 to-orange-500 hover:from-orange-600 hover:to-rose-600 text-white font-semibold text-xs sm:text-sm h-10 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-orange-950/20 hover:shadow-lg hover:shadow-orange-500/30 transition-all duration-300 group/btn"
            >
              <span>Solve Today's Practice</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};
