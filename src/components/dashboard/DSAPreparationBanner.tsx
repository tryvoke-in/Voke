import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, ArrowRight, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { motion } from "motion/react";

export const DSAPreparationBanner = () => {
  const navigate = useNavigate();
  const [solvedCount, setSolvedCount] = useState<number>(19);

  const TOTAL_DAYS = 75;
  const TOTAL_QUESTIONS = 375;
  const QUESTIONS_PER_DAY = 5;

  useEffect(() => {
    const loadSolvedStats = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const { count, error } = await supabase
            .from("solved_questions" as any)
            .select("*", { count: "exact", head: true })
            .eq("user_id", user.id);
          if (!error && typeof count === "number" && count > 0) {
            setSolvedCount(count);
          }
        }
      } catch {
        // Fallback gracefully
      }
    };
    loadSolvedStats();
  }, []);

  const progressPercentage = Math.min(100, Math.round((solvedCount / TOTAL_QUESTIONS) * 100));
  const currentDay = Math.max(1, Math.min(TOTAL_DAYS, Math.ceil((solvedCount + 1) / QUESTIONS_PER_DAY)));
  const todaySolved = Math.max(1, solvedCount % QUESTIONS_PER_DAY === 0 && solvedCount > 0 ? 5 : solvedCount % QUESTIONS_PER_DAY || 4);

  return (
    <motion.div
      whileHover={{ y: -4 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className="h-full"
    >
      <Card
        className="relative border border-border/60 bg-gradient-to-b from-card via-card to-card/90 text-card-foreground hover:border-emerald-500/40 hover:shadow-[0_8px_30px_rgba(16,185,129,0.08)] transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col justify-between group"
      >
        {/* Subtle glowing accent line on top */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        <CardContent className="p-5 flex flex-col justify-between flex-1 space-y-4">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                whileHover={{ rotate: 5, scale: 1.1 }}
                className="w-8 h-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0 group-hover:bg-emerald-500/20 group-hover:text-emerald-300 transition-colors"
              >
                <Code2 className="w-4 h-4" />
              </motion.div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                Data Structures & Algorithms
              </h3>
            </div>
          </div>

          {/* Day & Solved Stats */}
          <div className="space-y-2">
            <div className="flex items-baseline justify-between">
              <div className="flex items-baseline gap-1">
                <span className="text-xl sm:text-2xl font-extrabold text-foreground tracking-tight">
                  Day {currentDay}
                </span>
                <span className="text-xs text-muted-foreground font-medium">
                  of {TOTAL_DAYS}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-400 mr-1.5">
                  {progressPercentage}%
                </span>
                <span className="text-[11px] text-muted-foreground font-medium">
                  {solvedCount} / {TOTAL_QUESTIONS} Solved
                </span>
              </div>
            </div>

            {/* Progress Bar */}
            <div className="h-1.5 w-full bg-muted/60 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.max(progressPercentage, 5)}%` }}
                transition={{ duration: 0.8, ease: "easeOut" }}
                className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.4)]"
              />
            </div>
          </div>

          {/* Today's Goal */}
          <div className="space-y-2 pt-1">
            <div className="flex items-center justify-between text-xs">
              <span className="font-semibold text-foreground flex items-center gap-1">
                Today's Goal ({QUESTIONS_PER_DAY} Problems)
              </span>
              <span className="font-bold text-emerald-400">
                {todaySolved} / {QUESTIONS_PER_DAY} Done
              </span>
            </div>

            {/* 5 Segmented Bars */}
            <div className="grid grid-cols-5 gap-1.5">
              {Array.from({ length: QUESTIONS_PER_DAY }).map((_, index) => {
                const isFilled = index < todaySolved;
                return (
                  <motion.div
                    key={index}
                    initial={{ scaleX: 0 }}
                    animate={{ scaleX: 1 }}
                    transition={{ delay: index * 0.08, duration: 0.3 }}
                    className={`h-1.5 rounded-full transition-all duration-300 ${isFilled
                        ? "bg-gradient-to-r from-emerald-500 to-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.3)]"
                        : "bg-muted/80"
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
              className="w-full relative overflow-hidden bg-gradient-to-r from-emerald-600 via-emerald-500 to-emerald-600 hover:from-emerald-500 hover:to-emerald-400 text-white font-semibold text-xs sm:text-sm h-10 rounded-xl flex items-center justify-center gap-2 shadow-md shadow-emerald-900/20 hover:shadow-lg hover:shadow-emerald-600/30 transition-all duration-300 group/btn"
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

