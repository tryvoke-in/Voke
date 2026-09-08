import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Crown, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CreatePlanOptions } from "@/services/careerPlanService";

interface RoadmapCustomizeModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetRole: string;
  companyName?: string;
  skillGaps?: Array<{ skill: string }>;
  skillsRequired?: string[];
  initialDuration?: number;
  initialLevel?: "entry" | "mid" | "senior";
  onGenerate: (options: CreatePlanOptions) => Promise<void>;
  isLoading?: boolean;
}

export function RoadmapCustomizeModal({
  isOpen,
  onClose,
  targetRole,
  companyName,
  initialDuration = 4,
  initialLevel,
  onGenerate,
  isLoading = false,
}: RoadmapCustomizeModalProps) {
  const inferDefaultLevel = (): "entry" | "mid" | "senior" => {
    if (initialLevel) return initialLevel;
    const r = targetRole.toLowerCase();
    if (r.includes("senior") || r.includes("staff") || r.includes("lead") || r.includes("principal")) {
      return "senior";
    }
    if (r.includes("junior") || r.includes("entry") || r.includes("intern") || r.includes("associate")) {
      return "entry";
    }
    return "mid";
  };

  const [durationWeeks, setDurationWeeks] = useState<number>(initialDuration);
  const [level, setLevel] = useState<"entry" | "mid" | "senior">(inferDefaultLevel());

  useEffect(() => {
    if (isOpen) {
      setDurationWeeks(initialDuration || 4);
      setLevel(inferDefaultLevel());
    }
  }, [isOpen, targetRole, initialDuration]);

  const durations = [
    { weeks: 2, label: "2 Weeks", sub: "Sprint Prep" },
    { weeks: 4, label: "4 Weeks", sub: "1 Month (Recommended)" },
    { weeks: 8, label: "8 Weeks", sub: "2 Months" },
    { weeks: 12, label: "12 Weeks", sub: "3 Months" },
  ];

  const handleConfirm = async () => {
    await onGenerate({
      durationWeeks,
      experienceLevel: level,
      weeklyHours: 15,
      focusArea: "Complete Interview Readiness",
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && !isLoading && onClose()}>
      <DialogContent className="max-w-md bg-zinc-950/98 border border-white/10 text-white shadow-2xl backdrop-blur-xl p-6 rounded-3xl">
        <DialogHeader className="space-y-1.5 text-left">
          <div className="flex items-center justify-between">
            <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/30 text-[11px] font-semibold px-2 py-0.5">
              Prep Roadmap
            </Badge>
            {companyName && (
              <span className="text-xs text-zinc-400 truncate max-w-[180px]">{companyName}</span>
            )}
          </div>
          <DialogTitle className="text-xl font-bold text-white tracking-tight">
            Choose Plan Duration
          </DialogTitle>
          <DialogDescription className="text-zinc-400 text-xs">
            How much time do you want to prepare for <span className="text-zinc-200 font-medium">{targetRole}</span>?
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* 4 Clean Compact Duration Cards */}
          <div className="grid grid-cols-2 gap-2.5">
            {durations.map((d) => {
              const isSelected = durationWeeks === d.weeks;
              return (
                <button
                  key={d.weeks}
                  type="button"
                  onClick={() => !isLoading && setDurationWeeks(d.weeks)}
                  className={cn(
                    "p-3.5 rounded-2xl border text-left transition-all relative flex flex-col justify-center select-none",
                    isSelected
                      ? "bg-sky-500/15 border-sky-500 text-white ring-1 ring-sky-500/40 shadow-md shadow-sky-500/10"
                      : "bg-zinc-900/60 border-white/5 text-zinc-400 hover:bg-zinc-900 hover:text-white"
                  )}
                >
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-base font-extrabold text-white">{d.label}</span>
                    {isSelected && (
                      <span className="w-4 h-4 rounded-full bg-sky-500 text-black flex items-center justify-center text-[10px] font-black">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </span>
                    )}
                  </div>
                  <span className="text-[11px] text-zinc-400 font-medium">{d.sub}</span>
                </button>
              );
            })}
          </div>

          {/* Simple Level Selector */}
          <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-2">
            <span className="text-xs text-zinc-400 font-medium flex items-center gap-1.5">
              <Crown className="w-3.5 h-3.5 text-yellow-400" />
              Target Level:
            </span>
            <div className="flex bg-zinc-900 rounded-xl p-1 border border-white/5">
              {(["entry", "mid", "senior"] as const).map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => !isLoading && setLevel(l)}
                  className={cn(
                    "px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all",
                    level === l
                      ? "bg-sky-600 text-white shadow-xs"
                      : "text-zinc-400 hover:text-white"
                  )}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-white/5">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isLoading}
            className="rounded-xl text-zinc-400 hover:text-white text-xs h-9"
          >
            Cancel
          </Button>
          <Button
            type="button"
            onClick={handleConfirm}
            disabled={isLoading}
            className="flex-1 rounded-xl bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs h-9 shadow-md shadow-sky-500/20 gap-1.5"
          >
            {isLoading ? (
              <>
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Generating Plan...
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                Generate {durationWeeks}-Week Plan
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
