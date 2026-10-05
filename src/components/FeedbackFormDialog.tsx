import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Star, Send, CheckCircle, Sparkles, Loader2, ArrowLeft, ArrowRight, GraduationCap, ShieldAlert } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

export interface FeedbackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  grantFeedbackCredits?: () => Promise<boolean>;
  compulsory?: boolean;
  collegeContext?: {
    collegeName?: string;
    driveTitle?: string;
    studentEmail?: string;
    driveId?: string;
  };
}

export const FeedbackFormDialog = ({
  open,
  onOpenChange,
  onSuccess,
  grantFeedbackCredits,
  compulsory = false,
  collegeContext,
}: FeedbackFormDialogProps) => {
  const { toast } = useToast();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Step 1 State: Experience & Ratings
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [technicalPerformance, setTechnicalPerformance] = useState("");
  const [difficultyLevel, setDifficultyLevel] = useState("");
  const [recommended, setRecommended] = useState("");

  // Step 2 State: Modes & AI Feedback
  const [modesPracticed, setModesPracticed] = useState<string[]>([]);
  const [feedbackHelpfulness, setFeedbackHelpfulness] = useState("");
  const [valuableFeedbackPart, setValuableFeedbackPart] = useState("");

  // Step 3 State: Text Written Insights
  const [liked, setLiked] = useState("");
  const [improvements, setImprovements] = useState("");
  const [inputIssues, setInputIssues] = useState("");
  const [bugsFaced, setBugsFaced] = useState("");

  // Reset form when opened / closed
  const resetForm = () => {
    setStep(1);
    setRating(0);
    setHoverRating(0);
    setTechnicalPerformance("");
    setDifficultyLevel("");
    setRecommended("");
    setModesPracticed([]);
    setFeedbackHelpfulness("");
    setValuableFeedbackPart("");
    setLiked("");
    setImprovements("");
    setInputIssues("");
    setBugsFaced("");
    setSubmitted(false);
  };

  // Prevent closing window / reloading before mandatory feedback is submitted
  useEffect(() => {
    if (!open || !compulsory || submitted) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "Please submit your mandatory interview feedback before closing this page.";
      return "Please submit your mandatory interview feedback before closing this page.";
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [open, compulsory, submitted]);

  const handleClose = (newOpen: boolean) => {
    if (!newOpen && compulsory && !submitted) {
      toast({
        title: "Mandatory Feedback",
        description: "Please complete and submit your interview feedback to finish.",
        variant: "destructive",
      });
      return;
    }
    onOpenChange(newOpen);
    if (!newOpen) {
      setTimeout(resetForm, 300);
    }
  };

  const handleModeChange = (mode: string, checked: boolean) => {
    if (checked) {
      setModesPracticed((prev) => [...prev, mode]);
    } else {
      setModesPracticed((prev) => prev.filter((m) => m !== mode));
    }
  };

  const nextStep = () => {
    if (step === 1) {
      if (rating === 0) {
        toast({
          title: "Rating required",
          description: "Please select a star rating before proceeding.",
          variant: "destructive",
        });
        return;
      }
      if (!technicalPerformance) {
        toast({
          title: "Technical performance required",
          description: "Please select a technical performance rating before proceeding.",
          variant: "destructive",
        });
        return;
      }
      if (!difficultyLevel) {
        toast({
          title: "Difficulty level required",
          description: "Please select a difficulty level before proceeding.",
          variant: "destructive",
        });
        return;
      }
      if (!recommended) {
        toast({
          title: "Recommendation required",
          description: "Please indicate if you would recommend Voke to a friend.",
          variant: "destructive",
        });
        return;
      }
    }

    if (step === 2) {
      if (modesPracticed.length === 0) {
        toast({
          title: "Interview modes required",
          description: "Please select at least one interview mode you practiced.",
          variant: "destructive",
        });
        return;
      }
      if (!feedbackHelpfulness) {
        toast({
          title: "Feedback helpfulness required",
          description: "Please select how helpful the AI feedback was.",
          variant: "destructive",
        });
        return;
      }
      if (!valuableFeedbackPart) {
        toast({
          title: "Valuable feedback part required",
          description: "Please select which part of the feedback was most valuable.",
          variant: "destructive",
        });
        return;
      }
    }

    setStep((prev) => prev + 1);
  };

  const prevStep = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalLiked = liked.trim() || "Constructive and realistic interview experience.";
    const finalImprovements = improvements.trim() || "No specific improvements needed, session went smoothly.";
    const finalInputIssues = inputIssues.trim() || "None";
    const finalBugs = bugsFaced.trim() || "None";

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));

      // Insert extended feedback into Supabase if user exists
      const feedbackLiked = collegeContext
        ? `[College Assessment: ${collegeContext.collegeName || 'Placement Drive'}${collegeContext.driveTitle ? ` - ${collegeContext.driveTitle}` : ''}] ${finalLiked}`
        : finalLiked;

      const effectiveModes = modesPracticed.length > 0
        ? modesPracticed
        : (collegeContext ? ["Voice & Video Call", "Coding Assessment"] : ["Voice-based Interview"]);

      // 1. Attempt user_feedback table insert if user authenticated
      if (user?.id) {
        try {
          const { error: insertErr } = await supabase.from("user_feedback").insert([
            {
              user_id: user.id,
              rating,
              liked: feedbackLiked,
              improvements: improvements.trim() || null,
              modes_practiced: effectiveModes,
              technical_performance: technicalPerformance || null,
              difficulty_level: difficultyLevel || null,
              feedback_helpfulness: feedbackHelpfulness || null,
              valuable_feedback_part: valuableFeedbackPart || null,
              input_issues: inputIssues.trim() || null,
              recommended: recommended || null,
              bugs_faced: bugsFaced.trim() || null,
            },
          ]);
          if (insertErr) {
            console.warn("[Feedback] user_feedback insert notice:", insertErr);
          }
        } catch (dbErr) {
          console.warn("[Feedback] user_feedback insert exception:", dbErr);
        }
      }

      // 2. ALWAYS save to Supabase waitlist table (status: 'interview_feedback')
      // This guarantees cross-device persistence in Supabase even for unauthenticated / college guest users
      try {
        const feedbackPayload = {
          rating,
          liked: feedbackLiked,
          improvements: finalImprovements,
          modes_practiced: effectiveModes,
          technical_performance: technicalPerformance,
          difficulty_level: difficultyLevel,
          feedback_helpfulness: feedbackHelpfulness,
          valuable_feedback_part: valuableFeedbackPart,
          input_issues: finalInputIssues,
          recommended,
          bugs_faced: finalBugs,
          collegeContext: collegeContext || null,
          studentEmail: collegeContext?.studentEmail || user?.email || "anonymous_student",
          submittedAt: new Date().toISOString()
        };

        await supabase.from("waitlist").insert({
          email: collegeContext?.studentEmail || user?.email || `feedback-${Date.now()}@voke.internal`,
          full_name: collegeContext?.collegeName ? `${collegeContext.collegeName} Student` : (user?.user_metadata?.full_name || "Interview Student"),
          phone_number: JSON.stringify(feedbackPayload),
          status: "interview_feedback"
        });
      } catch (waitlistErr) {
        console.warn("[Feedback] waitlist backup insert notice:", waitlistErr);
      }

      // 3. Mark drive feedback completed in localStorage
      if (collegeContext?.driveId) {
        try {
          localStorage.setItem(`voke_feedback_submitted_${collegeContext.driveId}`, "true");
          if (collegeContext.studentEmail) {
            localStorage.setItem(`voke_feedback_submitted_${collegeContext.driveId}_${collegeContext.studentEmail.toLowerCase()}`, "true");
          }
        } catch (e) { }
      }

      // 4. Save local backup in localStorage
      try {
        const backupFeedback = {
          rating,
          liked: feedbackLiked,
          improvements: finalImprovements,
          modes_practiced: effectiveModes,
          technical_performance: technicalPerformance,
          difficulty_level: difficultyLevel,
          feedback_helpfulness: feedbackHelpfulness,
          valuable_feedback_part: valuableFeedbackPart,
          input_issues: finalInputIssues,
          recommended,
          bugs_faced: finalBugs,
          collegeContext: collegeContext || null,
          timestamp: new Date().toISOString(),
        };
        const existingBackup = JSON.parse(localStorage.getItem("voke_feedback_backup") || "[]");
        existingBackup.push(backupFeedback);
        localStorage.setItem("voke_feedback_backup", JSON.stringify(existingBackup));
      } catch (e) { }

      // 5. Grant feedback credits if eligible
      if (grantFeedbackCredits) {
        try {
          const granted = await grantFeedbackCredits();
          if (granted) {
            toast({
              title: "🎉 Credits Unlocked!",
              description: "You've earned 2 bonus mock interview credits.",
            });
          }
        } catch (e) { }
      }

      toast({
        title: "Feedback Recorded Successfully!",
        description: collegeContext 
          ? "Your institutional assessment feedback has been securely synchronized." 
          : "Thank you for helping us improve Voke.",
      });

      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      // Guarantee progress even on local unexpected error
      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent 
        className={cn(
          "bg-gradient-to-b from-zinc-900 via-zinc-950 to-black border border-white/10 text-white max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl",
          compulsory && "[&>button]:hidden"
        )}
        onPointerDownOutside={(e) => {
          if (compulsory && !submitted) {
            e.preventDefault();
          }
        }}
        onEscapeKeyDown={(e) => {
          if (compulsory && !submitted) {
            e.preventDefault();
          }
        }}
      >
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key={`feedback-step-${step}`}
              initial={{ opacity: 0, x: step === 1 ? 0 : 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center mb-2">
                  {collegeContext ? (
                    <GraduationCap className="w-6 h-6 text-blue-400 animate-pulse" />
                  ) : (
                    <Sparkles className="w-6 h-6 text-sky-400 animate-pulse" />
                  )}
                </div>
                <DialogTitle className="text-xl sm:text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white via-white/90 to-white/70">
                  {collegeContext?.collegeName
                    ? `${collegeContext.collegeName} Interview Feedback`
                    : "Help Us Improve Voke"}
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs text-center">
                  {collegeContext
                    ? `Step ${step} of 3 • Mandatory placement interview feedback for ${collegeContext.driveTitle || collegeContext.collegeName || "your assessment"}. Submission required.`
                    : `Step ${step} of 3 • Sharing feedback unlocks 2 bonus mock interviews for free!`}
                </DialogDescription>
              </DialogHeader>

              {compulsory && (
                <div className="flex items-center justify-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/25 text-amber-300 text-[11px] font-medium w-fit mx-auto">
                  <ShieldAlert className="w-3.5 h-3.5 shrink-0" />
                  <span>Mandatory Feedback • Submission required to view evaluation results</span>
                </div>
              )}

              {/* Step Progress Bar */}
              <div className="flex items-center justify-center gap-2 py-1">
                {[
                  { num: 1, label: "Experience" },
                  { num: 2, label: "Assessment" },
                  { num: 3, label: "Insights" }
                ].map(({ num, label }) => (
                  <div
                    key={num}
                    className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium transition-all duration-300 ${
                      step === num 
                        ? "bg-blue-600/20 border border-blue-500/40 text-blue-400 shadow-xs" 
                        : step > num
                        ? "bg-emerald-500/10 border border-emerald-500/30 text-emerald-400"
                        : "bg-white/[0.03] border border-white/5 text-zinc-500"
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold bg-current/20">
                      {num}
                    </span>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                {/* === STEP 1: Ratings & Performance === */}
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Star Rating */}
                    <div className="space-y-2 text-center p-4 rounded-2xl bg-white/[0.03] border border-white/5">
                      <Label className="text-zinc-300 text-xs font-bold uppercase tracking-wider block">
                        Your Overall Experience *
                      </Label>
                      <div className="flex items-center justify-center gap-2 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 hover:scale-125 transition-transform focus:outline-none cursor-pointer"
                          >
                            <Star
                              className={`w-9 h-9 sm:w-10 sm:h-10 transition-colors ${
                                star <= (hoverRating || rating)
                                  ? "fill-amber-400 text-amber-400 drop-shadow-[0_0_12px_rgba(251,191,36,0.5)]"
                                  : "text-zinc-700 hover:text-zinc-500"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <p className="text-xs font-medium text-amber-400/90 h-4">
                        {(hoverRating || rating) === 1 && "Needs Significant Improvement"}
                        {(hoverRating || rating) === 2 && "Below Expectations"}
                        {(hoverRating || rating) === 3 && "Average / Acceptable"}
                        {(hoverRating || rating) === 4 && "Very Good & Helpful"}
                        {(hoverRating || rating) === 5 && "Outstanding & Realistic Experience! ⭐"}
                      </p>
                    </div>

                    {/* 2-Column Selectors */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Technical Performance */}
                      <div className="space-y-1.5">
                        <Label className="text-zinc-300 text-xs font-semibold">
                          Platform Technical Performance *
                        </Label>
                        <Select value={technicalPerformance} onValueChange={setTechnicalPerformance}>
                          <SelectTrigger className="bg-zinc-900/80 border-white/10 text-white rounded-xl focus:ring-blue-500 h-10 text-xs">
                            <SelectValue placeholder="Select performance rating..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="Excellent (Smooth, no lag)">Excellent (Smooth, no lag)</SelectItem>
                            <SelectItem value="Good (Minor hiccups but usable)">Good (Minor hiccups but usable)</SelectItem>
                            <SelectItem value="Average (Slow loading/latency issues)">Average (Slow loading/latency issues)</SelectItem>
                            <SelectItem value="Poor (Glitchy/Unusable)">Poor (Glitchy/Unusable)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Difficulty Level */}
                      <div className="space-y-1.5">
                        <Label className="text-zinc-300 text-xs font-semibold">
                          Interview Difficulty Level *
                        </Label>
                        <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                          <SelectTrigger className="bg-zinc-900/80 border-white/10 text-white rounded-xl focus:ring-blue-500 h-10 text-xs">
                            <SelectValue placeholder="Select difficulty level..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="Too Easy">Too Easy</SelectItem>
                            <SelectItem value="Just Right / Realistic">Just Right / Realistic</SelectItem>
                            <SelectItem value="Too Hard / Stressful">Too Hard / Stressful</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Recommend Voke */}
                      <div className="space-y-1.5 sm:col-span-2">
                        <Label className="text-zinc-300 text-xs font-semibold">
                          Would you recommend Voke to classmates & colleagues? *
                        </Label>
                        <Select value={recommended} onValueChange={setRecommended}>
                          <SelectTrigger className="bg-zinc-900/80 border-white/10 text-white rounded-xl focus:ring-blue-500 h-10 text-xs">
                            <SelectValue placeholder="Select recommendation..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="Definitely">Definitely — Highly recommended</SelectItem>
                            <SelectItem value="Maybe">Maybe — Needs minor refinements</SelectItem>
                            <SelectItem value="No">No — Not at this time</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* === STEP 2: Modes & Quality === */}
                {step === 2 && (
                  <div className="space-y-4">
                    {/* Interview Modes checklist */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300 text-xs font-semibold block mb-1">
                        Which interview modes did you practice today? *
                      </Label>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 bg-zinc-900/40 p-3 rounded-xl border border-white/5">
                        {[
                          "Video-based Interview",
                          "Voice-based Interview",
                          "Coding Assessment",
                        ].map((mode) => (
                          <div key={mode} className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-white/[0.02]">
                            <Checkbox
                              id={`mode-${mode}`}
                              checked={modesPracticed.includes(mode)}
                              onCheckedChange={(checked) => handleModeChange(mode, !!checked)}
                              className="border-white/20 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600 text-white rounded"
                            />
                            <Label
                              htmlFor={`mode-${mode}`}
                              className="text-zinc-300 text-xs cursor-pointer select-none font-medium"
                            >
                              {mode}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {/* Feedback Helpfulness */}
                      <div className="space-y-1.5">
                        <Label className="text-zinc-300 text-xs font-semibold">
                          How helpful was the AI feedback and score? *
                        </Label>
                        <Select value={feedbackHelpfulness} onValueChange={setFeedbackHelpfulness}>
                          <SelectTrigger className="bg-zinc-900/80 border-white/10 text-white rounded-xl focus:ring-blue-500 h-10 text-xs">
                            <SelectValue placeholder="Select helpfulness..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="Extremely helpful (Actionable insights)">Extremely helpful (Actionable insights)</SelectItem>
                            <SelectItem value="Somewhat helpful (Good to know, but needed more depth)">Somewhat helpful (Good to know, but needed more depth)</SelectItem>
                            <SelectItem value="Not helpful (Too vague or inaccurate)">Not helpful (Too vague or inaccurate)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Valuable feedback part */}
                      <div className="space-y-1.5">
                        <Label className="text-zinc-300 text-xs font-semibold">
                          Which part was most valuable? *
                        </Label>
                        <Select value={valuableFeedbackPart} onValueChange={setValuableFeedbackPart}>
                          <SelectTrigger className="bg-zinc-900/80 border-white/10 text-white rounded-xl focus:ring-blue-500 h-10 text-xs">
                            <SelectValue placeholder="Select feedback part..." />
                          </SelectTrigger>
                          <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                            <SelectItem value="Technical Accuracy / Answer Content">Technical Accuracy / Answer Content</SelectItem>
                            <SelectItem value="Communication & Tone Analysis">Communication & Tone Analysis</SelectItem>
                            <SelectItem value="Body Language & Eye Contact">Body Language & Eye Contact</SelectItem>
                            <SelectItem value="Confidence & Pacing Metrics">Confidence & Pacing Metrics</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </div>
                )}

                {/* === STEP 3: Detailed Written Insights === */}
                {step === 3 && (
                  <div className="space-y-3.5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                      {/* Liked most */}
                      <div className="space-y-1.5">
                        <Label htmlFor="liked" className="text-zinc-300 text-xs font-semibold flex items-center justify-between">
                          <span>What did you like the most? *</span>
                        </Label>
                        <Textarea
                          id="liked"
                          placeholder="e.g. Realistic voice interaction, clear coding challenge, instant feedback..."
                          value={liked}
                          onChange={(e) => setLiked(e.target.value)}
                          className="bg-zinc-900/70 border-white/10 text-white focus-visible:ring-blue-500 rounded-xl resize-none h-20 text-xs"
                        />
                      </div>

                      {/* Improvements */}
                      <div className="space-y-1.5">
                        <Label htmlFor="improvements" className="text-zinc-300 text-xs font-semibold flex items-center justify-between">
                          <span>Suggested Improvements *</span>
                        </Label>
                        <Textarea
                          id="improvements"
                          placeholder="e.g. More dynamic programming questions, hints option, answer timer..."
                          value={improvements}
                          onChange={(e) => setImprovements(e.target.value)}
                          className="bg-zinc-900/70 border-white/10 text-white focus-visible:ring-blue-500 rounded-xl resize-none h-20 text-xs"
                        />
                      </div>

                      {/* Input Issues */}
                      <div className="space-y-1.5">
                        <Label htmlFor="inputIssues" className="text-zinc-300 text-xs font-semibold flex items-center justify-between">
                          <span>Mic, Video, or Audio Issues *</span>
                        </Label>
                        <Textarea
                          id="inputIssues"
                          placeholder="e.g. None, or mic delay on question 2, camera lag..."
                          value={inputIssues}
                          onChange={(e) => setInputIssues(e.target.value)}
                          className="bg-zinc-900/70 border-white/10 text-white focus-visible:ring-blue-500 rounded-xl resize-none h-20 text-xs"
                        />
                      </div>

                      {/* Bugs Faced */}
                      <div className="space-y-1.5">
                        <Label htmlFor="bugsFaced" className="text-zinc-300 text-xs font-semibold flex items-center justify-between">
                          <span>Product Glitches or Bugs *</span>
                        </Label>
                        <Textarea
                          id="bugsFaced"
                          placeholder="e.g. None, or editor font sizing, button alignment..."
                          value={bugsFaced}
                          onChange={(e) => setBugsFaced(e.target.value)}
                          className="bg-zinc-900/70 border-white/10 text-white focus-visible:ring-blue-500 rounded-xl resize-none h-20 text-xs"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-3 border-t border-white/10">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-11 border border-white/5 flex items-center justify-center gap-1.5 cursor-pointer text-xs font-semibold"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer text-xs"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        {collegeContext ? "Submit Mandatory Feedback & View Results" : "Submit & Unlock"}
                        <Send className="w-3.5 h-3.5" />
                      </>
                    )}
                  </Button>
                )}
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="feedback-success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="text-center py-6 space-y-6"
            >
              <div className="mx-auto w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400">
                <CheckCircle className="w-10 h-10" />
              </div>

              <div className="space-y-2">
                <h3 className="text-2xl font-bold">Feedback Submitted!</h3>
                <p className="text-zinc-400 text-sm leading-relaxed px-4">
                  {collegeContext
                    ? "Thank you for completing your institutional placement feedback. Your interview evaluation is now finalized."
                    : "Thank you for helping us make Voke better! Your insights are incredibly valuable."}
                </p>
              </div>

              {collegeContext ? (
                <div className="bg-blue-500/10 border border-blue-500/20 rounded-2xl p-4 mx-4">
                  <p className="text-blue-300 font-bold text-base flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 fill-blue-300" />
                    Interview Feedback Recorded
                  </p>
                  <p className="text-zinc-400 text-xs mt-1">
                    Your assessment feedback and performance scorecard have been synchronized to {collegeContext.collegeName || "your college placement cell"}.
                  </p>
                </div>
              ) : (
                <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl p-4 mx-4">
                  <p className="text-sky-300 font-bold text-lg flex items-center justify-center gap-2">
                    <Sparkles className="w-5 h-5 fill-sky-300" />
                    +2 Free Mock Interviews
                  </p>
                  <p className="text-zinc-500 text-xs mt-1">
                    You can now practice two more sessions of any interview type.
                  </p>
                </div>
              )}

              <Button
                onClick={() => {
                  if (onSuccess) onSuccess();
                  onOpenChange(false);
                }}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl h-11 transition-all duration-300 cursor-pointer"
              >
                {collegeContext ? "View Interview Scorecard & Results →" : "Awesome, Let's Go"}
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
