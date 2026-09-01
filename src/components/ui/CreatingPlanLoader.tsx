import { motion } from "framer-motion";
import { Loader2, TrendingUp, Sparkles } from "lucide-react";

export function CreatingPlanLoader() {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/70 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2 }}
        className="bg-card border border-border/80 rounded-2xl p-6 sm:p-7 shadow-xl max-w-sm w-full flex flex-col items-center text-center space-y-4"
      >
        {/* Minimal Spinner / Icon */}
        <div className="relative flex items-center justify-center">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-600 dark:text-sky-400">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-card border border-border flex items-center justify-center">
            <Loader2 className="w-3 h-3 text-sky-600 dark:text-sky-400 animate-spin" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-1">
          <h3 className="text-base font-bold text-foreground">
            Creating Career Plan
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Analyzing role requirements and tailoring your 30-day interview milestones...
          </p>
        </div>

        {/* Subtle indeterminate progress bar */}
        <div className="w-full bg-muted rounded-full h-1.5 overflow-hidden border border-border/40 relative">
          <motion.div
            className="h-full bg-sky-600 dark:bg-sky-500 rounded-full w-1/3"
            animate={{ x: ["-100%", "300%"] }}
            transition={{
              repeat: Infinity,
              duration: 1.4,
              ease: "easeInOut",
            }}
          />
        </div>
      </motion.div>
    </div>
  );
}
