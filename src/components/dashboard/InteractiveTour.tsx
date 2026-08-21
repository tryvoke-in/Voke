import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Mic, FileText, Users, Sparkles, ChevronRight, 
  ChevronLeft, CheckCircle, ArrowRight, Compass, X,
  MessageSquare, Play, Zap, Bot, Video, Crown
} from "lucide-react";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  icon: any;
  color: string;
}

interface InteractiveTourProps {
  userId: string;
  isOpen: boolean;
  onClose: () => void;
  userName?: string;
  onTrackSelected?: (track: string) => void;
}

const CAREER_TRACKS = [
  { id: "frontend", label: "Frontend Developer", description: "React, CSS, JavaScript, UI/UX" },
  { id: "backend", label: "Backend Developer", description: "Node.js, Databases, System Design, APIs" },
  { id: "fullstack", label: "Fullstack Developer", description: "End-to-end applications, Web Architecture" },
  { id: "product_manager", label: "Product Manager", description: "Product Strategy, Analytics, System Design" },
  { id: "data_science", label: "Data Scientist / AI", description: "Python, Machine Learning, SQL, Stats" },
  { id: "other", label: "Other Track", description: "General technical and behavioral preparation" }
];

const TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-text-interview",
    title: "Text Interview",
    description: "Practice mock interviews in a chat-like format. Our AI dynamically changes and adapts its follow-up questions to assess your depth of knowledge.",
    position: "bottom",
    icon: Bot,
    color: "text-violet-500"
  },
  {
    targetId: "tour-voice-agent",
    title: "Pro Interview",
    description: "Practice real-time speech interviews verbally. Speak naturally and get immediate grading on communication skills, delivery tone, and clarity.",
    position: "bottom",
    icon: Video,
    color: "text-pink-500"
  },
  {
    targetId: "tour-job-matches",
    title: "Personalized Job Matches",
    description: "Voke tracks your interview performance metrics to match you automatically with real-world job roles matching your capabilities.",
    position: "bottom",
    icon: Compass,
    color: "text-blue-500"
  },
  {
    targetId: "tour-elite-prep",
    title: "Elite Prep",
    description: "Unlock advanced structures, standard system design preparation, and elite mock resources to target premium positions.",
    position: "bottom",
    icon: Crown,
    color: "text-amber-500"
  },
  {
    targetId: "tour-profile",
    title: "Complete Your Profile settings",
    description: "Click your avatar in the navbar to configure settings. Be sure to link your GitHub profile and upload your Resume to customize mock questions and unlock ATS auditing recommendations.",
    position: "bottom",
    icon: Compass,
    color: "text-violet-500"
  }
];

export const InteractiveTour: React.FC<InteractiveTourProps> = ({
  userId,
  isOpen,
  onClose,
  userName = "Scholar",
  onTrackSelected
}) => {
  const [step, setStep] = useState(0); // Step 0 is track setup, 1+ are spotlight steps
  const [selectedTrack, setSelectedTrack] = useState<string>("");
  const [name, setName] = useState(userName);
  const [highlightRect, setHighlightRect] = useState<{
    top: number;
    left: number;
    width: number;
    height: number;
  } | null>(null);

  useEffect(() => {
    setName(userName);
  }, [userName]);

  // Handle Spotlight Element Highlighting & Auto-scroll
  useEffect(() => {
    if (!isOpen || step === 0) {
      setHighlightRect(null);
      return;
    }

    const currentTourStep = TOUR_STEPS[step - 1];
    if (!currentTourStep) return;

    const element = document.getElementById(currentTourStep.targetId);
    
    if (element) {
      // Scroll smoothly to target element
      element.scrollIntoView({ behavior: "smooth", block: "center" });

      const updateRect = () => {
        const rect = element.getBoundingClientRect();
        setHighlightRect({
          top: rect.top,
          left: rect.left,
          width: rect.width,
          height: rect.height
        });
      };

      // Shorter, snappier delay for fast rendering
      const timer = setTimeout(updateRect, 250);

      window.addEventListener("scroll", updateRect, { passive: true });
      window.addEventListener("resize", updateRect);

      return () => {
        clearTimeout(timer);
        window.removeEventListener("scroll", updateRect);
        window.removeEventListener("resize", updateRect);
      };
    } else {
      console.warn(`Element with ID ${currentTourStep.targetId} not found, skipping.`);
      setHighlightRect(null);
    }
  }, [isOpen, step]);

  const handleNext = () => {
    if (step === 0) {
      if (!selectedTrack) {
        toast.warning("Please select a career track to customize your experience.");
        return;
      }
      localStorage.setItem(`voke_career_track_${userId}`, selectedTrack);
      if (onTrackSelected) {
        onTrackSelected(selectedTrack);
      }
    }
    setStep(prev => prev + 1);
  };

  const handlePrev = () => {
    setStep(prev => Math.max(0, prev - 1));
  };

  const handleFinish = async () => {
    try {
      if (name.trim() && name !== userName) {
        await supabase
          .from("profiles")
          .update({ full_name: name.trim() })
          .eq("id", userId);
      }
      localStorage.setItem(`voke_tour_seen_${userId}`, "true");
      localStorage.setItem(`voke_checklist_dismissed_${userId}`, "true");
      toast.success("guided tour complete! You are ready to excel.");
      onClose();
    } catch (err) {
      console.error("Error finishing tour:", err);
      onClose();
    }
  };

  if (!isOpen) return null;

  // STEP 0: Welcoming Dialog & Track Setup
  if (step === 0) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleFinish(); }}>
        <DialogContent className="max-w-3xl p-0 overflow-hidden bg-background border-border/80 rounded-2xl shadow-2xl z-50">
          <DialogTitle className="sr-only">Voke Setup</DialogTitle>
          <DialogDescription className="sr-only">Step 1: Setup preferences</DialogDescription>
          
          <div className="h-32 bg-gradient-to-r from-violet-600 via-indigo-600 to-fuchsia-600 relative flex items-center justify-between px-8 text-white select-none">
            <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.08]" />
            <div className="absolute bottom-0 left-0 right-0 h-16 bg-gradient-to-t from-background to-transparent" />
            <div className="z-10 flex items-center gap-3">
              <div className="p-2.5 bg-white/10 backdrop-blur-md rounded-xl border border-white/20">
                <Sparkles className="w-6 h-6 text-yellow-300 fill-yellow-300 animate-pulse" />
              </div>
              <div>
                <h3 className="text-xl font-bold tracking-tight">Voke Interactive Tour</h3>
                <p className="text-xs text-white/80">Guided platform walkthrough</p>
              </div>
            </div>
          </div>

          <div className="p-6 sm:p-8 space-y-6">
            <div className="text-center sm:text-left space-y-2">
              <h4 className="text-2xl font-bold text-foreground">
                Welcome to Voke, <span className="text-violet-500 font-extrabold">{name || "Scholar"}</span>!
              </h4>
              <p className="text-sm text-muted-foreground">
                Let's personalize your prep. Tell us what you are preparing for so we can highlight the best features for your goals.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3 items-center">
                <label className="text-xs font-bold text-muted-foreground uppercase tracking-wider shrink-0">Your Name:</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your name"
                  className="w-full sm:max-w-xs px-3.5 py-1.5 rounded-xl border border-border bg-muted/30 focus:bg-background focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 outline-none text-sm transition-all"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
                {CAREER_TRACKS.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => setSelectedTrack(track.id)}
                    className={`p-4 rounded-2xl border text-left cursor-pointer transition-all duration-200 hover:scale-[1.01] ${
                      selectedTrack === track.id
                        ? "bg-violet-500/10 border-violet-500 shadow-md shadow-violet-500/5"
                        : "bg-card/50 hover:bg-muted/40 border-border/60"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <h5 className="font-bold text-sm text-foreground">{track.label}</h5>
                      {selectedTrack === track.id && (
                        <div className="w-4 h-4 rounded-full bg-violet-500 flex items-center justify-center text-white">
                          <CheckCircle className="w-3.5 h-3.5 fill-violet-500" />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-snug">
                      {track.description}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border/40 pt-6">
              <Button
                variant="ghost"
                onClick={handleFinish}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>
              <Button
                onClick={handleNext}
                className="gap-1.5 text-xs font-bold rounded-xl bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20 hover:scale-[1.02] transition-all"
              >
                Start Guided Tour <ArrowRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  // SPOTLIGHT INTERACTIVE PHASE (Steps 1+)
  const activeStep = TOUR_STEPS[step - 1];
  
  // Calculate dynamic tooltip style based on position and rect bounds
  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "fixed" };

    const padding = 16;
    const { top, left, width, height } = highlightRect;

    switch (activeStep.position) {
      case "bottom":
        return {
          position: "fixed",
          top: `${top + height + padding}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - 340, left + width / 2 - 160))}px`,
          width: "320px"
        };
      case "top":
        return {
          position: "fixed",
          top: `${top - padding - 180}px`,
          left: `${Math.max(padding, Math.min(window.innerWidth - 340, left + width / 2 - 160))}px`,
          width: "320px"
        };
      case "left":
        return {
          position: "fixed",
          top: `${top + height / 2 - 90}px`,
          left: `${Math.max(padding, left - 320 - padding)}px`,
          width: "320px"
        };
      case "right":
        return {
          position: "fixed",
          top: `${top + height / 2 - 90}px`,
          left: `${Math.min(window.innerWidth - 340, left + width + padding)}px`,
          width: "320px"
        };
      default:
        return { top: "50%", left: "50%", transform: "translate(-50%, -50%)", position: "fixed" };
    }
  };

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden pointer-events-none">
      {/* SVG Spotlight backdrop mask */}
      <div className="absolute inset-0 bg-black/60 pointer-events-auto">
        {highlightRect && (
          <svg className="w-full h-full">
            <defs>
              <mask id="spotlight-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={highlightRect.left - 4}
                  y={highlightRect.top - 4}
                  width={highlightRect.width + 8}
                  height={highlightRect.height + 8}
                  rx="16"
                  fill="black"
                  className="transition-all duration-300 ease-out"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="black" opacity="0.65" mask="url(#spotlight-mask)" />
            {/* Spotlight Glowing Border */}
            <rect
              x={highlightRect.left - 6}
              y={highlightRect.top - 6}
              width={highlightRect.width + 12}
              height={highlightRect.height + 12}
              rx="18"
              fill="none"
              stroke="url(#glowing-gradient)"
              strokeWidth="3.5"
              className="animate-pulse transition-all duration-300 ease-out"
            />
            <defs>
              <linearGradient id="glowing-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8b5cf6" />
                <stop offset="50%" stopColor="#d946ef" />
                <stop offset="100%" stopColor="#3b82f6" />
              </linearGradient>
            </defs>
          </svg>
        )}
      </div>

      {/* Floating Tooltip Panel */}
      <AnimatePresence mode="wait">
        {activeStep && (
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -10 }}
            transition={{ duration: 0.2 }}
            style={getTooltipStyle()}
            className="bg-card/95 dark:bg-zinc-900/95 border border-border/80 backdrop-blur-md rounded-2xl p-5 shadow-2xl pointer-events-auto select-none transition-all duration-300 ease-out"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-violet-500/10 rounded-lg">
                  <activeStep.icon className={`w-4 h-4 ${activeStep.color}`} />
                </div>
                <h5 className="font-extrabold text-sm text-foreground">{activeStep.title}</h5>
              </div>
              <button 
                onClick={handleFinish} 
                className="text-muted-foreground hover:text-foreground transition-colors"
                title="Exit Tour"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {activeStep.description}
            </p>

            {/* Controls footer */}
            <div className="flex items-center justify-between border-t border-border/30 pt-3 mt-1.5">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wide">
                {step} of {TOUR_STEPS.length}
              </span>
              <div className="flex items-center gap-1.5">
                {step > 1 && (
                  <Button
                    size="sm"
                    onClick={handlePrev}
                    className="h-7 px-3 text-xs font-semibold rounded-lg bg-transparent border border-border/60 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-foreground transition-colors"
                  >
                    Back
                  </Button>
                )}
                {step < TOUR_STEPS.length ? (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-7 px-3 text-xs font-bold rounded-lg bg-violet-600 hover:bg-violet-700 text-white shadow-md shadow-violet-500/20"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleFinish}
                    className="h-7 px-3 text-xs font-bold rounded-lg bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:opacity-90 text-white shadow-md"
                  >
                    Finish
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
