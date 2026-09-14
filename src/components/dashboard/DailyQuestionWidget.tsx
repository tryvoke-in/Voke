import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Flame } from "lucide-react";
import { motion } from "motion/react";
import { getDailyQuestion } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";

interface DailyQuestionWidgetProps {
  questionStreak?: number;
  userStreak?: number;
}

const calculateStreak = (dates: (string | null | undefined)[]) => {
  if (!dates || dates.length === 0) return 0;

  const validDates = dates.filter(Boolean).map((d) => {
    const date = new Date(d!);
    return !isNaN(date.getTime()) ? date.toISOString().split("T")[0] : null;
  }).filter(Boolean) as string[];

  const uniqueDates = Array.from(new Set(validDates))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

  if (uniqueDates.length === 0) return 0;

  const today = new Date().toISOString().split("T")[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  const currentCheck = uniqueDates.includes(today) ? new Date(today) : new Date(yesterday);

  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr);
    const d1 = new Date(currentCheck).setHours(12, 0, 0, 0);
    const d2 = new Date(date).setHours(12, 0, 0, 0);

    if (d1 === d2) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break;
    }
  }
  return streak;
};

export const DailyQuestionWidget: React.FC<DailyQuestionWidgetProps> = ({ questionStreak, userStreak }) => {
  const navigate = useNavigate();
  const dailyQuestion = getDailyQuestion();
  const [internalStreak, setInternalStreak] = useState<number | null>(null);

  // If questionStreak is not provided, fetch solved_questions streak directly
  useEffect(() => {
    if (typeof questionStreak === "number") {
      setInternalStreak(questionStreak);
      return;
    }

    const fetchQuestionStreak = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { data: solvedQuestions } = await supabase
            .from("solved_questions" as any)
            .select("solved_at")
            .eq("user_id", user.id);

          const dates = (solvedQuestions || []).map((sq: any) => sq.solved_at);
          setInternalStreak(calculateStreak(dates));
        }
      } catch {
        setInternalStreak(userStreak || 0);
      }
    };

    fetchQuestionStreak();
  }, [questionStreak, userStreak]);

  const activeStreak = typeof questionStreak === "number" ? questionStreak : (internalStreak ?? (userStreak || 0));

  // Difficulty style tokens
  const difficultyConfig = {
    Easy: {
      badge: "bg-emerald-50 dark:bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-500/30",
      accent: "text-emerald-500",
      xp: "+30 XP",
      timeEstimate: "15-20 min"
    },
    Medium: {
      badge: "bg-amber-50 dark:bg-amber-500/15 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-500/30",
      accent: "text-amber-500",
      xp: "+50 XP",
      timeEstimate: "25-35 min"
    },
    Hard: {
      badge: "bg-rose-50 dark:bg-rose-500/15 text-rose-700 dark:text-rose-400 border border-rose-200/70 dark:border-rose-500/30",
      accent: "text-rose-500",
      xp: "+100 XP",
      timeEstimate: "45-60 min"
    }
  };

  const currentDiff = difficultyConfig[dailyQuestion.difficulty as keyof typeof difficultyConfig] || difficultyConfig.Medium;

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      <Card id="tour-daily-practice" className="relative border border-slate-200/80 dark:border-border/90 shadow-xs hover:shadow-md bg-white dark:bg-card text-card-foreground transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col justify-between group dark:shadow-md">
        <CardContent className="p-5 flex flex-col justify-between flex-1 space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.08 }}
                className="w-9 h-9 rounded-xl bg-orange-50 dark:bg-orange-500/15 border border-orange-200/60 dark:border-orange-500/30 flex items-center justify-center text-orange-600 dark:text-orange-400 shrink-0 group-hover:bg-orange-100 dark:group-hover:bg-orange-500/25 transition-colors"
              >
                <Target className="w-4 h-4" />
              </motion.div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                Daily Practice
              </h3>
            </div>

            <Badge className={`${currentDiff.badge} text-[10px] font-bold px-2.5 py-0.5 rounded-full`}>
              {dailyQuestion.difficulty}
            </Badge>
          </div>

          {/* Problem Title & Category Subtitle */}
          <div className="space-y-1">
            <h4
              className="text-xs sm:text-sm font-bold text-slate-900 dark:text-slate-100 hover:text-[#5E37E8] dark:hover:text-indigo-400 transition-colors cursor-pointer line-clamp-1"
              onClick={() => navigate("/daily-challenge/solve")}
            >
              {dailyQuestion.title}
            </h4>
            <p className="text-xs text-slate-500 dark:text-slate-400 truncate">
              {dailyQuestion.tags && dailyQuestion.tags.length > 0
                ? dailyQuestion.tags.slice(0, 3).join(" · ")
                : "Array · Dynamic Programming"}
            </p>
          </div>

          {/* Type & Question Solving Streak Info Cards */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-slate-50 dark:bg-muted/30 border border-slate-200/60 dark:border-border/60 hover:bg-slate-100/70 dark:hover:bg-muted/50 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-default"
            >
              <span className="text-[10px] text-slate-500 dark:text-slate-400 uppercase font-semibold tracking-wider">Type</span>
              <span className="text-xs font-bold text-slate-800 dark:text-slate-200 mt-0.5">Coding</span>
            </motion.div>

            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-orange-50/70 dark:bg-orange-500/10 border border-orange-200/70 dark:border-orange-500/30 hover:bg-orange-100/70 dark:hover:bg-orange-500/15 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-default"
            >
              <span className="text-[10px] text-orange-700/80 dark:text-orange-400/90 uppercase font-semibold tracking-wider">Solving Streak</span>
              <span className="text-xs font-extrabold text-orange-600 dark:text-orange-400 mt-0.5 flex items-center justify-center gap-1.5">
                <Flame className="w-3.5 h-3.5 fill-orange-500 text-orange-500 animate-pulse" />
                <span>{activeStreak} {activeStreak === 1 ? 'Day' : 'Days'}</span>
              </span>
            </motion.div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={() => navigate("/daily-challenge/solve")}
              className="w-full relative overflow-hidden bg-[#5E37E8] hover:bg-[#522fd6] text-white font-semibold text-xs sm:text-sm h-10 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#5E37E8]/25 hover:shadow-md hover:shadow-[#5E37E8]/35 transition-all duration-200 active:scale-[0.99] group/btn cursor-pointer"
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
