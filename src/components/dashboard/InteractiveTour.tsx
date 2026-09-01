import React, { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Check, ArrowRight, Compass, X,
  Bot, Video, Crown, User
} from "lucide-react";

interface TourStep {
  targetId: string;
  title: string;
  description: string;
  position: "top" | "bottom" | "left" | "right";
  icon: React.ComponentType<{ className?: string }>;
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
    icon: Bot
  },
  {
    targetId: "tour-voice-agent",
    title: "Pro Interview",
    description: "Practice real-time speech interviews verbally. Speak naturally and get immediate grading on communication skills, delivery tone, and clarity.",
    position: "bottom",
    icon: Video
  },
  {
    targetId: "tour-job-matches",
    title: "Personalized Job Matches",
    description: "Voke tracks your interview performance metrics to match you automatically with real-world job roles matching your capabilities.",
    position: "bottom",
    icon: Compass
  },
  {
    targetId: "tour-elite-prep",
    title: "Elite Prep",
    description: "Unlock advanced structures, standard system design preparation, and elite mock resources to target premium positions.",
    position: "bottom",
    icon: Crown
  },
  {
    targetId: "tour-profile",
    title: "Complete Your Profile Settings",
    description: "Click your avatar in the navbar to configure settings. Link your GitHub profile and upload your Resume to customize mock questions and unlock ATS auditing recommendations.",
    position: "bottom",
    icon: User
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
      toast.success("Guided tour complete! You're ready to start.");
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
        <DialogContent className="max-w-2xl p-6 sm:p-8 bg-card text-card-foreground border-border rounded-2xl shadow-xl z-50">
          <DialogHeader className="space-y-2 pb-1 text-left">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="font-medium text-[11px] px-2.5 py-0.5 text-muted-foreground border-border">
                Guided Tour
              </Badge>
            </div>
            <DialogTitle className="text-xl sm:text-2xl font-bold tracking-tight text-foreground">
              Welcome to Voke{name ? `, ${name}` : ""}
            </DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
              Personalize your prep. Select your target track so we can highlight the most relevant practice modules and recommendations.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 pt-2">
            <div className="space-y-1.5 max-w-sm">
              <Label htmlFor="tour-name" className="text-xs font-medium text-muted-foreground">
                Your Name
              </Label>
              <Input
                id="tour-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter your name"
                className="h-9 text-sm rounded-lg bg-background border-input focus-visible:ring-1 focus-visible:ring-ring"
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-medium text-muted-foreground">
                  Select Your Career Track
                </Label>
                <span className="text-[11px] text-muted-foreground">
                  Required
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {CAREER_TRACKS.map((track) => {
                  const isSelected = selectedTrack === track.id;
                  return (
                    <div
                      key={track.id}
                      onClick={() => setSelectedTrack(track.id)}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-150 relative group ${
                        isSelected
                          ? "bg-accent/80 border-foreground/40 shadow-sm"
                          : "bg-background/50 hover:bg-accent/30 border-border/70 hover:border-border"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="font-medium text-sm text-foreground">{track.label}</div>
                        <div
                          className={`w-4 h-4 rounded-full flex items-center justify-center shrink-0 mt-0.5 transition-colors ${
                            isSelected
                              ? "bg-foreground text-background"
                              : "border border-muted-foreground/30 group-hover:border-muted-foreground/60"
                          }`}
                        >
                          {isSelected && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 leading-snug">
                        {track.description}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-border pt-4 mt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleFinish}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Skip Tour
              </Button>
              <Button
                size="sm"
                onClick={handleNext}
                className="text-xs font-semibold gap-1.5 rounded-lg px-4 h-9"
              >
                Start Guided Tour <ArrowRight className="w-3.5 h-3.5" />
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
                  rx="12"
                  fill="black"
                  className="transition-all duration-300 ease-out"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="black" opacity="0.65" mask="url(#spotlight-mask)" />
            {/* Minimal Spotlight Border */}
            <rect
              x={highlightRect.left - 4}
              y={highlightRect.top - 4}
              width={highlightRect.width + 8}
              height={highlightRect.height + 8}
              rx="12"
              fill="none"
              stroke="rgba(255, 255, 255, 0.75)"
              strokeWidth="2"
              className="transition-all duration-300 ease-out"
            />
          </svg>
        )}
      </div>

      {/* Floating Tooltip Panel */}
      <AnimatePresence mode="wait">
        {activeStep && (
          <motion.div
            key={step}
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -8 }}
            transition={{ duration: 0.18 }}
            style={getTooltipStyle()}
            className="bg-card border border-border rounded-xl p-4 sm:p-5 shadow-xl pointer-events-auto select-none transition-all duration-300 ease-out"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-2.5">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-muted rounded-md text-foreground">
                  <activeStep.icon className="w-4 h-4" />
                </div>
                <h5 className="font-semibold text-sm text-foreground">{activeStep.title}</h5>
              </div>
              <button 
                onClick={handleFinish} 
                className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted"
                title="Exit Tour"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed mb-4">
              {activeStep.description}
            </p>

            {/* Controls footer */}
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-[11px] font-medium text-muted-foreground">
                {step} of {TOUR_STEPS.length}
              </span>
              <div className="flex items-center gap-2">
                {step > 1 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handlePrev}
                    className="h-7 px-2.5 text-xs font-medium"
                  >
                    Back
                  </Button>
                )}
                {step < TOUR_STEPS.length ? (
                  <Button
                    size="sm"
                    onClick={handleNext}
                    className="h-7 px-3 text-xs font-medium"
                  >
                    Next
                  </Button>
                ) : (
                  <Button
                    size="sm"
                    onClick={handleFinish}
                    className="h-7 px-3 text-xs font-medium"
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
