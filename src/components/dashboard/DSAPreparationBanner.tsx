import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Code2, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const DSAPreparationBanner = () => {
  const navigate = useNavigate();
  const [solvedCount, setSolvedCount] = useState<number>(0);

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
          if (!error && typeof count === "number") {
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

  return (
    <Card
      onClick={() => navigate("/dsa-sheet")}
      className="cursor-pointer border border-border/60 hover:border-blue-500/40 transition-all shadow-md hover:shadow-lg rounded-2xl overflow-hidden h-full flex flex-col justify-between bg-card text-card-foreground"
    >
      <CardContent className="p-4 sm:p-5 space-y-3.5 flex flex-col justify-between flex-1">
        {/* Top Header Row */}
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-0.5 min-w-0">
            <h3 className="text-base font-bold tracking-tight text-foreground truncate mt-1">
              DSA Preparation
            </h3>
            <p className="text-[11px] text-muted-foreground">
              75-Day Curated Roadmap
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shadow-2xs">
              <Code2 className="w-4 h-4" />
            </div>
          </div>
        </div>

        {/* Compact Solved & Practice Guide in same row */}
        <div className="flex items-center justify-between gap-2 py-1.5 border-y border-border/50">
          <div className="flex items-baseline gap-1.5 shrink-0">
            <span className="text-2xl sm:text-3xl font-extrabold tracking-tight text-foreground">
              {solvedCount}
            </span>
            <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              / {TOTAL_QUESTIONS} Solved
            </span>
          </div>

          <div
            onClick={(e) => {
              e.stopPropagation();
              navigate("/dsa-sheet");
            }}
            className="group flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-muted/40 hover:bg-muted/80 border border-border/50 transition-all cursor-pointer text-xs font-medium text-foreground hover:text-blue-500 max-w-[60%] truncate"
          >
            <span className="truncate font-medium">
              Day {currentDay} Practice
            </span>
            <ArrowRight className="w-3 h-3 text-muted-foreground group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all shrink-0 ml-0.5" />
          </div>
        </div>

        {/* Progress Bar */}
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] uppercase font-medium tracking-wider text-muted-foreground">
            <span>Start</span>
            <span>{progressPercentage}% Done</span>
          </div>
          <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-emerald-500 rounded-full transition-all duration-500"
              style={{ width: `${Math.max(progressPercentage, progressPercentage > 0 ? progressPercentage : 1)}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
