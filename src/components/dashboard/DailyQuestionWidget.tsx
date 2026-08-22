import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Target, ArrowRight, Zap } from "lucide-react";
import { motion } from "motion/react";
import { getDailyQuestion } from "@/data/questions";
import { supabase } from "@/integrations/supabase/client";

interface DailyQuestionWidgetProps {
  userStreak?: number;
}

export const DailyQuestionWidget: React.FC<DailyQuestionWidgetProps> = ({ userStreak }) => {
  const navigate = useNavigate();
  const dailyQuestion = getDailyQuestion();

  // Difficulty style tokens
  const difficultyConfig = {
    Easy: {
      badge: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
      accent: "text-emerald-500",
      xp: "+30 XP",
      timeEstimate: "15-20 min"
    },
    Medium: {
      badge: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
      accent: "text-amber-500",
      xp: "+50 XP",
      timeEstimate: "25-35 min"
    },
    Hard: {
      badge: "bg-rose-500/10 text-rose-600 dark:text-rose-400",
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
      <Card id="tour-daily-practice" className="relative border border-border/60 shadow-sm hover:shadow-md bg-card text-card-foreground transition-all duration-300 rounded-2xl overflow-hidden h-full flex flex-col justify-between group">
        <CardContent className="p-5 flex flex-col justify-between flex-1 space-y-6">
          {/* Header Row */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <motion.div
                whileHover={{ rotate: 15, scale: 1.1 }}
                className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0 group-hover:bg-orange-500/20 group-hover:text-orange-400 transition-colors"
              >
                <Target className="w-4 h-4" />
              </motion.div>
              <h3 className="text-sm sm:text-base font-bold tracking-tight text-foreground truncate">
                Daily Practice
              </h3>
            </div>

            <Badge className={`${currentDiff.badge} text-[10px] font-bold px-2 py-0.5 rounded-full border-0`}>
              {dailyQuestion.difficulty}
            </Badge>
          </div>

          {/* Problem Title & Category Subtitle */}
          <div className="space-y-1">
            <h4
              className="text-xs sm:text-sm font-bold text-foreground transition-colors cursor-pointer line-clamp-1"
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
              className="bg-muted/30 hover:bg-muted/50 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-default"
            >
              <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">Type</span>
              <span className="text-xs font-bold text-foreground mt-0.5">Coding</span>
            </motion.div>
            <motion.div
              whileHover={{ scale: 1.02 }}
              className="bg-muted/30 hover:bg-muted/50 rounded-xl p-2.5 text-center flex flex-col items-center justify-center transition-all cursor-default"
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
              className="w-full relative overflow-hidden bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm h-10 rounded-xl flex items-center justify-center gap-2 shadow-sm transition-all duration-300 group/btn"
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

