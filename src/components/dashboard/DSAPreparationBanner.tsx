import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { DSA_QUESTIONS } from "@/data/dsaQuestions";
import { motion } from "motion/react";

const PLANS: Record<string, { label: string; days: number; questionsPerDay: number }> = {
  "2_months": { label: "2 Months Plan", days: 60, questionsPerDay: Math.ceil(375 / 60) },
  "2.5_months": { label: "2.5 Months Plan", days: 75, questionsPerDay: 5 },
  "3_months": { label: "3 Months Plan", days: 90, questionsPerDay: Math.ceil(375 / 90) },
  "4_months": { label: "4 Months Plan", days: 120, questionsPerDay: Math.ceil(375 / 120) },
  "6_months": { label: "6 Months Plan", days: 180, questionsPerDay: Math.ceil(375 / 180) },
};

export const DSAPreparationBanner = () => {
  const navigate = useNavigate();
  const [solvedCount, setSolvedCount] = useState<number>(0);
  const [todaySolvedCount, setTodaySolvedCount] = useState<number>(0);
  const [selectedPlanKey, setSelectedPlanKey] = useState<string>("2.5_months");

  const TOTAL_QUESTIONS = DSA_QUESTIONS.length || 375;
  const currentPlan = PLANS[selectedPlanKey] || PLANS["2.5_months"];
  const TOTAL_DAYS = currentPlan.days;
  const QUESTIONS_PER_DAY = currentPlan.questionsPerDay;

  const loadSolvedStats = async () => {
    try {
      const savedPlan = localStorage.getItem("voke_dsa_plan");
      if (savedPlan && PLANS[savedPlan]) {
        setSelectedPlanKey(savedPlan);
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setSolvedCount(0);
        setTodaySolvedCount(0);
        return;
      }

      const { data, error } = await supabase
        .from("solved_questions" as any)
        .select("question_id, solved_at")
        .eq("user_id", user.id);

      if (!error && Array.isArray(data)) {
        setSolvedCount(data.length);

        const todayDateStr = new Date().toDateString();
        const todayCount = data.filter((item: any) => {
          if (!item.solved_at) return false;
          const d = new Date(item.solved_at);
          return !isNaN(d.getTime()) && d.toDateString() === todayDateStr;
        }).length;

        setTodaySolvedCount(todayCount);
      } else {
        setSolvedCount(0);
        setTodaySolvedCount(0);
      }
    } catch {
      setSolvedCount(0);
      setTodaySolvedCount(0);
    }
  };

  useEffect(() => {
    loadSolvedStats();

    const handlePlanChange = () => {
      const savedPlan = localStorage.getItem("voke_dsa_plan");
      if (savedPlan && PLANS[savedPlan]) {
        setSelectedPlanKey(savedPlan);
      }
    };

    const handleProgressUpdate = () => {
      loadSolvedStats();
    };

    window.addEventListener("dsa_plan_changed", handlePlanChange);
    window.addEventListener("dsa_progress_updated", handleProgressUpdate);
    window.addEventListener("storage", (e) => {
      if (e.key === "voke_dsa_plan") handlePlanChange();
    });

    const channel = supabase
      .channel("realtime_solved_questions_banner")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "solved_questions",
        },
        () => {
          loadSolvedStats();
        }
      )
      .subscribe();

    return () => {
      window.removeEventListener("dsa_plan_changed", handlePlanChange);
      window.removeEventListener("dsa_progress_updated", handleProgressUpdate);
      supabase.removeChannel(channel);
    };
  }, []);

  const progressPercentage = TOTAL_QUESTIONS > 0
    ? Math.min(100, Math.round((solvedCount / TOTAL_QUESTIONS) * 100))
    : 0;

  const completedDays = Math.floor(solvedCount / QUESTIONS_PER_DAY);
  const currentDay = Math.min(TOTAL_DAYS, Math.max(1, completedDays + 1));
  const todayDone = Math.min(QUESTIONS_PER_DAY, todaySolvedCount);

  return (
    <motion.div
      whileHover={{ y: -3 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      <Card
        className="relative border border-slate-200/80 dark:border-border/90 shadow-xs hover:shadow-md bg-white dark:bg-card text-card-foreground transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col justify-between group dark:shadow-md"
      >
        <CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.08 }}
                className="w-9 h-9 rounded-xl bg-indigo-50 dark:bg-indigo-500/15 border border-indigo-200/60 dark:border-indigo-400/30 flex items-center justify-center text-indigo-600 dark:text-indigo-400 shrink-0 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-500/25 transition-colors"
              >
                <Code2 className="w-4 h-4" />
              </motion.div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-slate-900 dark:text-slate-100 truncate">
                Data Structures & Algorithms
              </h3>
            </div>
          </div>

          {/* Day & Solved Stats */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1.5">
                <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  Day {currentDay}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  of {TOTAL_DAYS}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-indigo-600 dark:text-indigo-400 mr-1.5">
                  {progressPercentage}%
                </span>
                <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">
                  {solvedCount} / {TOTAL_QUESTIONS} Solved
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-slate-100 dark:bg-muted/70 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-purple-600 dark:from-indigo-500 dark:to-purple-400 rounded-full"
              />
            </div>
          </div>

          {/* Today's Goal */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-slate-700 dark:text-slate-200 flex items-center gap-1">
                Today's Goal ({QUESTIONS_PER_DAY} Problems)
              </span>
              <span className="font-bold text-indigo-600 dark:text-indigo-400">
                {todaySolvedCount} / {QUESTIONS_PER_DAY} Done
              </span>
            </div>

            {/* Segmented Bars */}
            <div
              className="grid gap-1.5"
              style={{ gridTemplateColumns: `repeat(${QUESTIONS_PER_DAY}, minmax(0, 1fr))` }}
            >
              {Array.from({ length: QUESTIONS_PER_DAY }).map((_, index) => {
                const isFilled = index < todayDone;
                return (
                  <motion.div
                    key={index}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      isFilled
                        ? "bg-indigo-600 dark:bg-indigo-500 shadow-xs shadow-indigo-500/30"
                        : "bg-slate-100 dark:bg-muted/70"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Action Button */}
          <div className="pt-2">
            <Button
              onClick={() => navigate("/dsa-sheet")}
              className="w-full relative overflow-hidden bg-[#5E37E8] hover:bg-[#522fd6] text-white font-semibold text-xs sm:text-sm h-10 rounded-xl flex items-center justify-center gap-2 shadow-sm shadow-[#5E37E8]/25 hover:shadow-md hover:shadow-[#5E37E8]/35 transition-all duration-200 active:scale-[0.99] group/btn cursor-pointer"
            >
              <span>Continue DSA Practice</span>
              <ArrowRight className="w-4 h-4 group-hover/btn:translate-x-1 transition-transform duration-200" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
};


