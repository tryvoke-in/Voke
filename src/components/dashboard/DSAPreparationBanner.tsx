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
      className="mb-6 cursor-pointer border hover:border-emerald-500/40 transition-colors"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center shrink-0">
              <Code2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-sm sm:text-base text-foreground">
                  Data Structures & Algorithms
                </h3>
                <span className="text-[11px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded">
                  75 Days
                </span>
              </div>
              <p className="text-xs text-muted-foreground mt-0.5">
                5 questions daily • {solvedCount} of {TOTAL_QUESTIONS} completed
              </p>
            </div>
          </div>

          <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
            <div className="flex sm:flex-col items-baseline sm:items-end gap-2 sm:gap-0 text-xs">
              <span className="font-medium text-foreground">Day {currentDay} of {TOTAL_DAYS}</span>
              <span className="text-muted-foreground">{progressPercentage}% done</span>
            </div>
            <Button
              size="sm"
              className="h-8 px-3.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white gap-1.5 rounded-lg"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/dsa-sheet");
              }}
            >
              <span>Practice</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Button>
          </div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="mt-3.5">
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
