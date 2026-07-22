import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Sparkles, Code2, Trophy, ChevronRight, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";

export const DSAPreparationBanner = () => {
  const navigate = useNavigate();
  
  const intensityData = {
    text: "Daily 5 Questions. Build core logic.",
    gradient: "from-emerald-400 via-teal-400 to-emerald-500",
    intensity: "STEADY"
  };
  const progressPercentage = 15; // Example visual progress

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mb-6"
    >
      <Card className="relative overflow-hidden group border-0 shadow-xl bg-white dark:bg-gradient-to-br dark:from-[#0f0f13] dark:to-[#1a1a23] ring-1 ring-black/5 dark:ring-white/10">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-emerald-600/10 dark:bg-emerald-600/20 rounded-full blur-[50px] group-hover:bg-emerald-600/20 dark:group-hover:bg-emerald-600/30 transition-all duration-700" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-teal-600/10 dark:bg-teal-600/20 rounded-full blur-[50px] group-hover:bg-teal-600/20 dark:group-hover:bg-teal-600/30 transition-all duration-700" />

        <CardHeader className="pb-2 relative z-10">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900 dark:text-white">
                <span className="bg-gradient-to-r from-emerald-600 to-teal-600 dark:from-emerald-400 dark:to-teal-400 bg-clip-text text-transparent font-bold">
                  Data Structures & Algorithms
                </span>
                <Sparkles className="w-4 h-4 text-emerald-500 dark:text-emerald-400 fill-emerald-500 dark:emerald-yellow-400 animate-pulse" />
              </CardTitle>
              <CardDescription className="text-xs text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1">
                Ultimate 2.5 Month Prep Plan
              </CardDescription>
            </div>

            <div className="flex items-center gap-3">
              <motion.div
                className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 p-1.5 shadow-lg overflow-hidden flex items-center justify-center ring-1 ring-emerald-500/20 border border-transparent"
                whileHover={{ rotate: [0, -5, 5, 0], scale: 1.1 }}
              >
                <Code2 className="w-full h-full text-emerald-600 dark:text-emerald-400" />
              </motion.div>
            </div>
          </div>
        </CardHeader>

        <CardContent className="flex flex-col gap-6 relative z-10 pt-4">
          <div className="flex items-end justify-between">
            <div className="flex flex-col">
              <div className="flex items-baseline gap-1">
                <motion.span
                  className="text-5xl font-black text-gray-900 dark:text-white tracking-tighter"
                >
                  75
                </motion.span>
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400 mb-1">DAYS PLAN</span>
              </div>
            </div>

            <div className="text-right flex flex-col items-end">
              <div className={cn("text-xs font-bold px-2 py-0.5 rounded uppercase tracking-wider mb-1 shadow-sm text-white", intensityData.gradient)}>
                {intensityData.intensity} INTENSITY
              </div>
              <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-300 font-medium">
                <Flame className="w-3 h-3 fill-emerald-500 text-emerald-500" />
                Recommended Pace
              </div>
            </div>
          </div>

          <motion.div
            className="relative bg-gray-50/50 dark:bg-white/5 rounded-xl p-4 border border-gray-100 dark:border-white/10 backdrop-blur-sm overflow-hidden cursor-pointer group/mission"
            whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.07)" }}
            onClick={() => navigate('/dsa-sheet')}
          >
            <div className={cn("absolute left-0 top-0 w-1 h-full bg-gradient-to-b", intensityData.gradient)} />
            <div className="flex gap-3">
              <div className="min-w-[40px] h-[40px] rounded-full bg-emerald-100 dark:bg-gradient-to-br dark:from-emerald-500/20 dark:to-teal-500/20 flex items-center justify-center border border-emerald-200 dark:border-white/5">
                <Trophy className="w-5 h-5 text-emerald-600 dark:text-emerald-300" />
              </div>
              <div className="flex-1 flex justify-between items-center">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-0.5 flex items-center gap-2">
                    Start Coding
                    <ChevronRight className="w-3 h-3 text-gray-400 dark:text-gray-500" />
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed font-medium">
                    {intensityData.text}
                  </p>
                </div>
                <div className="text-xs font-bold text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">
                  Solve Now →
                </div>
              </div>
            </div>
          </motion.div>

          <div className="space-y-2">
            <div className="flex justify-between text-[10px] uppercase tracking-wider font-semibold text-gray-400 dark:text-gray-500">
              <span>Day 1</span>
              <span>Day 75</span>
            </div>
            <div className="h-2 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden relative shadow-inner">
              <motion.div
                className={cn("h-full bg-gradient-to-r relative", intensityData.gradient)}
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1.5, ease: "circOut" }}
              >
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
              </motion.div>
              <div className="absolute top-0 left-1/3 w-[1px] h-full bg-white/50 dark:bg-black/40 mix-blend-overlay" />
              <div className="absolute top-0 left-2/3 w-[1px] h-full bg-white/50 dark:bg-black/40 mix-blend-overlay" />
            </div>
          </div>

        </CardContent>
      </Card>
    </motion.div>
  );
};
