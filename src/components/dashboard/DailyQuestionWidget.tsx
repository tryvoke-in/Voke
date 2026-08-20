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
    <Card className="relative overflow-hidden border border-border/60 bg-gradient-to-br from-card via-card to-muted/20 shadow-md hover:shadow-xl transition-all duration-300 rounded-2xl group">
      {/* Subtle top accent bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-blue-400 to-blue-400" />

      <CardContent className="p-5 sm:p-6">
        {/* Top Header Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-border/40">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-sm">
              <Target className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-bold text-base sm:text-lg text-foreground tracking-tight">
                  Daily Challenge
                </h3>
                {isSolved && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
                    <CheckCircle2 className="w-3 h-3" /> Solved
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Badges Right (Streak & Countdown) */}
          <div className="flex items-center gap-2">
            {/* Streak Chip */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-orange-500/20 text-orange-600 dark:text-orange-400 text-xs font-semibold shadow-xs">
              <Flame className="w-4 h-4 fill-orange-500 text-orange-500" />
              <span>{streak} Day{streak === 1 ? "" : "s"}</span>
            </div>

            {/* Countdown Timer */}
            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-muted/60 border border-border/60 text-muted-foreground text-xs font-mono font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-500" />
              <span>
                {String(timeLeft.hours).padStart(2, "0")}:
                {String(timeLeft.minutes).padStart(2, "0")}:
                {String(timeLeft.seconds).padStart(2, "0")}
              </span>
            </div>
          </div>
        </div>

        {/* Main Problem Content Body */}
        <div className="py-4 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h4 
                className="text-xl sm:text-2xl font-bold text-foreground hover:text-orange-500 transition-colors cursor-pointer" 
                onClick={() => navigate("/daily-challenge/solve")}
              >
                {dailyQuestion.title}
              </h4>
              <Badge className={`${currentDiff.badge} text-xs font-semibold px-2.5 py-0.5 border shadow-2xs`}>
                {dailyQuestion.difficulty}
              </Badge>
              <Badge variant="outline" className="text-xs font-medium text-muted-foreground bg-muted/40">
                {dailyQuestion.platform}
              </Badge>
            </div>

            {/* Copy button */}
            <button
              onClick={handleCopyTitle}
              className="self-start sm:self-auto text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 px-2 py-1 rounded-md hover:bg-muted/60 transition-colors"
              title="Copy problem name and link"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{isCopied ? "Copied" : "Share"}</span>
            </button>
          </div>

          {/* Tags Row */}
          <div className="flex flex-wrap items-center gap-1.5">
            {dailyQuestion.tags.map((tag) => (
              <span
                key={tag}
                className="text-xs font-medium px-2.5 py-0.5 rounded-lg bg-secondary/60 text-secondary-foreground border border-border/40 hover:bg-secondary transition-colors"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Companies Asking This */}
          {dailyQuestion.companies && dailyQuestion.companies.length > 0 && (
            <div className="flex items-center flex-wrap gap-1.5 pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 mr-1">
                <Building2 className="w-3.5 h-3.5 text-amber-500" /> Asked by:
              </span>
              {dailyQuestion.companies.slice(0, 5).map((comp) => (
                <span
                  key={comp}
                  className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted/60 hover:bg-muted text-foreground border border-border/50 transition-colors"
                >
                  {comp}
                </span>
              ))}
              {dailyQuestion.companies.length > 5 && (
                <span className="text-xs font-medium px-2 py-0.5 rounded-md bg-muted/40 text-muted-foreground border border-border/30">
                  +{dailyQuestion.companies.length - 5} more
                </span>
              )}
            </div>
          )}

          {/* Hint Drawer / Accordion */}
          {/* <div className="pt-1">
            <button
              onClick={handleFetchQuickHint}
              className="text-xs font-semibold text-amber-600 dark:text-amber-400 hover:text-amber-500 flex items-center gap-1.5 transition-colors group"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500 group-hover:rotate-12 transition-transform" />
              <span>{showHint ? "Hide AI Conceptual Hint" : "Need a Hint? Ask AI Coach"}</span>
              {showHint ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <AnimatePresence>
              {showHint && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden mt-2"
                >
                  <div className="p-3.5 rounded-xl bg-amber-500/5 dark:bg-amber-950/20 border border-amber-500/20 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                    {loadingHint ? (
                      <div className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                        <Sparkles className="w-4 h-4 animate-spin" />
                        <span>Generating tailored algorithmic hint...</span>
                      </div>
                    ) : (
                      <div className="space-y-1">
                        <p className="font-medium text-foreground flex items-center gap-1.5">
                          <Zap className="w-3.5 h-3.5 text-amber-500" /> Key Strategy Tip:
                        </p>
                        <p className="text-xs sm:text-sm text-foreground/80">{hintText}</p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div> */}
        </div>

        {/* Action Buttons Footer */}
        <div className="pt-3 border-t border-border/40 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* <Button
              variant="outline"
              size="sm"
              onClick={() => navigate("/daily-challenge")}
              className="text-xs font-semibold rounded-xl border-border/60 hover:bg-muted/80 text-foreground"
            >
              <Trophy className="w-3.5 h-3.5 mr-1.5 text-amber-500" />
              Challenge Hub & Leaderboard
            </Button> */}

            {dailyQuestion.url && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.open(dailyQuestion.url, "_blank")}
                className="text-xs text-muted-foreground hover:text-foreground font-medium rounded-xl h-8 px-2.5"
                title={`Open on ${dailyQuestion.platform}`}
              >
                <ExternalLink className="w-3.5 h-3.5 mr-1" />
                {dailyQuestion.platform}
              </Button>
            )}
          </div>

          <Button
            size="sm"
            onClick={() => navigate("/daily-challenge/solve")}
            className="bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs sm:text-sm px-5 py-2 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-lg hover:shadow-blue-500/25 transition-all group"
          >
            <Play className="w-3.5 h-3.5 mr-1.5 fill-white" />
            <span>Solve Challenge</span>
            <ArrowRight className="w-4 h-4 ml-1.5 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
