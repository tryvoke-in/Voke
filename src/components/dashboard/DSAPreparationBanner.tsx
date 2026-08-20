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
      className="cursor-pointer border border-border/60 hover:border-blue-500/40 transition-all shadow-md hover:shadow-lg rounded-2xl overflow-hidden"
    >
      <CardContent className="p-4 sm:p-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center shrink-0 border border-blue-500/20">
                <Code2 className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-sm sm:text-base text-foreground">
                    DSA Preparation
                  </h3>
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {solvedCount} of {TOTAL_QUESTIONS} completed
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 pt-1">
            <div className="flex items-baseline gap-1.5 text-xs">
              <span className="text-muted-foreground">({progressPercentage}% done)</span>
            </div>
            <Button
              size="sm"
              className="h-7 px-3 text-xs bg-blue-600 hover:bg-blue-500 text-white gap-1 rounded-lg shadow-xs"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/dsa-sheet");
              }}
            >
              <span>Practice</span>
              <ArrowRight className="w-3 h-3" />
            </Button>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="mt-3">
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
