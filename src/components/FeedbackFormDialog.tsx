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
import { Star, Send, CheckCircle, Sparkles, Loader2, ArrowLeft, ArrowRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface FeedbackFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  grantFeedbackCredits?: () => Promise<boolean>;
}

export const FeedbackFormDialog = ({
  open,
  onOpenChange,
  onSuccess,
  grantFeedbackCredits,
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

  const handleClose = (newOpen: boolean) => {
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

    if (!liked.trim()) {
      toast({
        title: "Feedback required",
        description: "Please share what you liked most about Voke.",
        variant: "destructive",
      });
      return;
    }
    if (!improvements.trim()) {
      toast({
        title: "Feedback required",
        description: "Please share what features or improvements we can make.",
        variant: "destructive",
      });
      return;
    }
    if (!inputIssues.trim()) {
      toast({
        title: "Feedback required",
        description: "Please let us know if you faced any input issues (mic, video, etc.). Use 'None' if none.",
        variant: "destructive",
      });
      return;
    }
    if (!bugsFaced.trim()) {
      toast({
        title: "Feedback required",
        description: "Please let us know if you encountered any bugs. Use 'None' if none.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast({
          title: "Not Authenticated",
          description: "Please sign in to submit feedback.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }

      // Insert extended feedback into Supabase
      const { error } = await supabase.from("user_feedback").insert([
        {
          user_id: user.id,
          rating,
          liked: liked.trim() || null,
          improvements: improvements.trim() || null,
          modes_practiced: modesPracticed,
          technical_performance: technicalPerformance || null,
          difficulty_level: difficultyLevel || null,
          feedback_helpfulness: feedbackHelpfulness || null,
          valuable_feedback_part: valuableFeedbackPart || null,
          input_issues: inputIssues.trim() || null,
          recommended: recommended || null,
          bugs_faced: bugsFaced.trim() || null,
        },
      ]);

      if (error) {
        console.error("Supabase feedback insert error:", error);
        // Fallback to local backup in case table is not modified / error occurs
        const backupFeedback = {
          rating,
          liked,
          improvements,
          modes_practiced: modesPracticed,
          technical_performance: technicalPerformance,
          difficulty_level: difficultyLevel,
          feedback_helpfulness: feedbackHelpfulness,
          valuable_feedback_part: valuableFeedbackPart,
          input_issues: inputIssues,
          recommended,
          bugs_faced: bugsFaced,
          timestamp: new Date().toISOString(),
        };
        const existingBackup = JSON.parse(localStorage.getItem("voke_feedback_backup") || "[]");
        existingBackup.push(backupFeedback);
        localStorage.setItem("voke_feedback_backup", JSON.stringify(existingBackup));
      }

      // Grant credits
      if (grantFeedbackCredits) {
        const granted = await grantFeedbackCredits();
        if (granted) {
          toast({
            title: "🎉 Credits Unlocked!",
            description: "You've earned 2 bonus mock interview credits.",
          });
        }
      }

      setSubmitted(true);
      if (onSuccess) {
        onSuccess();
      }
    } catch (err: any) {
      console.error("Feedback submit error:", err);
      toast({
        title: "Submission failed",
        description: "An unexpected error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md overflow-hidden rounded-3xl p-6 md:p-8">
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
                <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-violet-400 animate-pulse" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  Help Us Improve
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs text-center">
                  Step {step} of 3 • Sharing feedback unlocks <strong className="text-violet-400">2 bonus mock interviews</strong> for free!
                </DialogDescription>
              </DialogHeader>

              {/* Step Progress Dots */}
              <div className="flex items-center justify-center gap-1.5 py-1">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1.5 rounded-full transition-all duration-300 ${
                      step === s ? "w-6 bg-violet-500" : "w-1.5 bg-zinc-800"
                    }`}
                  />
                ))}
              </div>

              <div className="space-y-4">
                {/* === STEP 1 === */}
                {step === 1 && (
                  <div className="space-y-4">
                    {/* Star Rating */}
                    <div className="space-y-1.5 text-center">
                      <Label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">
                        Your Rating *
                      </Label>
                      <div className="flex items-center justify-center gap-1 py-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            key={star}
                            type="button"
                            onClick={() => setRating(star)}
                            onMouseEnter={() => setHoverRating(star)}
                            onMouseLeave={() => setHoverRating(0)}
                            className="p-1 hover:scale-125 transition-transform focus:outline-none"
                          >
                            <Star
                              className={`w-9 h-9 transition-colors ${
                                star <= (hoverRating || rating)
                                  ? "fill-yellow-500 text-yellow-500 drop-shadow-[0_0_8px_rgba(234,179,8,0.3)]"
                                  : "text-zinc-700 hover:text-zinc-500"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Technical Performance */}
                    <div className="space-y-1.5">
                      <Label className="text-zinc-300 text-xs font-semibold">
                        Overall Technical Performance of the Platform *
                      </Label>
                      <Select value={technicalPerformance} onValueChange={setTechnicalPerformance}>
                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white rounded-xl focus:ring-violet-500 h-10 text-sm">
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
                        Difficulty Level of the Interview *
                      </Label>
                      <Select value={difficultyLevel} onValueChange={setDifficultyLevel}>
                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white rounded-xl focus:ring-violet-500 h-10 text-sm">
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
                    <div className="space-y-1.5">
                      <Label className="text-zinc-300 text-xs font-semibold">
                        Would you recommend Voke to a friend? *
                      </Label>
                      <Select value={recommended} onValueChange={setRecommended}>
                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white rounded-xl focus:ring-violet-500 h-10 text-sm">
                          <SelectValue placeholder="Select recommendation..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                          <SelectItem value="Definitely">Definitely</SelectItem>
                          <SelectItem value="Maybe">Maybe</SelectItem>
                          <SelectItem value="No">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* === STEP 2 === */}
                {step === 2 && (
                  <div className="space-y-4">
                    {/* Interview Modes checklist */}
                    <div className="space-y-2">
                      <Label className="text-zinc-300 text-xs font-semibold block mb-1">
                        Which interview modes did you practice today? *
                      </Label>
                      <div className="grid grid-cols-1 gap-2.5 bg-zinc-900/40 p-3 rounded-xl border border-white/5">
                        {[
                          "Video-based Interview",
                          "Voice-based Interview",
                          "Text-based Interview",
                        ].map((mode) => (
                          <div key={mode} className="flex items-center gap-3">
                            <Checkbox
                              id={`mode-${mode}`}
                              checked={modesPracticed.includes(mode)}
                              onCheckedChange={(checked) => handleModeChange(mode, !!checked)}
                              className="border-white/20 data-[state=checked]:bg-violet-600 data-[state=checked]:border-violet-600 text-white rounded"
                            />
                            <Label
                              htmlFor={`mode-${mode}`}
                              className="text-zinc-300 text-sm cursor-pointer select-none"
                            >
                              {mode}
                            </Label>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Feedback Helpfulness */}
                    <div className="space-y-1.5">
                      <Label className="text-zinc-300 text-xs font-semibold">
                        How helpful was the AI feedback and score? *
                      </Label>
                      <Select value={feedbackHelpfulness} onValueChange={setFeedbackHelpfulness}>
                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white rounded-xl focus:ring-violet-500 h-10 text-sm">
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
                        Which part of the feedback was most valuable? *
                      </Label>
                      <Select value={valuableFeedbackPart} onValueChange={setValuableFeedbackPart}>
                        <SelectTrigger className="bg-zinc-900 border-white/10 text-white rounded-xl focus:ring-violet-500 h-10 text-sm">
                          <SelectValue placeholder="Select feedback part..." />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-900 border-white/10 text-white rounded-xl">
                          <SelectItem value="Communication & Tone Analysis">Communication & Tone Analysis</SelectItem>
                          <SelectItem value="Technical Accuracy / Answer Content">Technical Accuracy / Answer Content</SelectItem>
                          <SelectItem value="Body Language & Eye Contact (For Video Mode)">Body Language & Eye Contact (For Video Mode)</SelectItem>
                          <SelectItem value="Confidence & Pacing Metrics">Confidence & Pacing Metrics</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                )}

                {/* === STEP 3 === */}
                {step === 3 && (
                  <div className="space-y-3.5 max-h-[360px] overflow-y-auto pr-1">
                    {/* Liked most */}
                    <div className="space-y-1.5">
                      <Label htmlFor="liked" className="text-zinc-300 text-xs font-semibold">
                        What did you like the most about Voke? *
                      </Label>
                      <Textarea
                        id="liked"
                        placeholder="Realistic AI voices, detailed feedback, playground..."
                        value={liked}
                        onChange={(e) => setLiked(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl resize-none h-16 text-sm"
                      />
                    </div>

                    {/* Improvements */}
                    <div className="space-y-1.5">
                      <Label htmlFor="improvements" className="text-zinc-300 text-xs font-semibold">
                        What features or improvements would make Voke your go-to platform? *
                      </Label>
                      <Textarea
                        id="improvements"
                        placeholder="Please add a timer for answers, more coding questions, etc."
                        value={improvements}
                        onChange={(e) => setImprovements(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl resize-none h-16 text-sm"
                      />
                    </div>

                    {/* Input Issues */}
                    <div className="space-y-1.5">
                      <Label htmlFor="inputIssues" className="text-zinc-300 text-xs font-semibold">
                        Did you face any issues with AI understanding, mic, or video capture? *
                      </Label>
                      <Textarea
                        id="inputIssues"
                        placeholder="Yes, the mic didn't pick up my voice properly in the 2nd question..."
                        value={inputIssues}
                        onChange={(e) => setInputIssues(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl resize-none h-16 text-sm"
                      />
                    </div>

                    {/* Bugs Faced */}
                    <div className="space-y-1.5">
                      <Label htmlFor="bugsFaced" className="text-zinc-300 text-xs font-semibold">
                        Did you face any bugs in the product? *
                      </Label>
                      <Textarea
                        id="bugsFaced"
                        placeholder="Describe any glitches or bugs you encountered..."
                        value={bugsFaced}
                        onChange={(e) => setBugsFaced(e.target.value)}
                        className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl resize-none h-16 text-sm"
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Footer Buttons */}
              <div className="flex gap-3 pt-2 border-t border-white/5">
                {step > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={prevStep}
                    className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-11 border border-white/5 flex items-center justify-center gap-1.5"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" />
                    Back
                  </Button>
                )}

                {step < 3 ? (
                  <Button
                    type="button"
                    onClick={nextStep}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-1.5"
                  >
                    Continue
                    <ArrowRight className="w-3.5 h-3.5" />
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-violet-500/20 flex items-center justify-center gap-1.5"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      <>
                        Submit & Unlock
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
                  Thank you for helping us make Voke better! Your insights are incredibly valuable.
                </p>
              </div>

              <div className="bg-violet-500/10 border border-violet-500/20 rounded-2xl p-4 mx-4">
                <p className="text-violet-300 font-bold text-lg flex items-center justify-center gap-2">
                  <Sparkles className="w-5 h-5 fill-violet-300" />
                  +2 Free Mock Interviews
                </p>
                <p className="text-zinc-500 text-xs mt-1">
                  You can now practice two more sessions of any interview type.
                </p>
              </div>

              <Button
                onClick={() => handleClose(false)}
                className="w-full bg-white hover:bg-zinc-200 text-black font-semibold rounded-xl h-11 transition-all duration-300"
              >
                Awesome, Let's Go
              </Button>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
