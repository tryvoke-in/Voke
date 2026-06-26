import { useState } from "react";
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
import { Star, Send, CheckCircle, Sparkles, Loader2 } from "lucide-react";
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
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [liked, setLiked] = useState("");
  const [improvements, setImprovements] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      toast({
        title: "Rating required",
        description: "Please select a star rating before submitting.",
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

      // Insert feedback into Supabase
      const { error } = await supabase.from("user_feedback").insert([
        {
          user_id: user.id,
          rating,
          liked: liked.trim() || null,
          improvements: improvements.trim() || null,
        },
      ]);

      if (error) {
        console.error("Supabase feedback insert error:", error);
        // Fallback: we still proceed to grant credits if the database fails (e.g. table doesn't exist yet/migration pending)
        // because we don't want to block the user. We can save in localStorage as backup.
        const backupFeedback = {
          rating,
          liked,
          improvements,
          timestamp: new Date().toISOString()
        };
        const existingBackup = JSON.parse(localStorage.getItem("voke_feedback_backup") || "[]");
        existingBackup.push(backupFeedback);
        localStorage.setItem("voke_feedback_backup", JSON.stringify(existingBackup));
      }

      // Grant the 2 bonus credits by updating user metadata
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

  const resetForm = () => {
    setRating(0);
    setHoverRating(0);
    setLiked("");
    setImprovements("");
    setSubmitted(false);
  };

  const handleClose = (newOpen: boolean) => {
    onOpenChange(newOpen);
    if (!newOpen) {
      // Delay reset so animation completes
      setTimeout(resetForm, 300);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="bg-zinc-950 border-white/10 text-white max-w-md overflow-hidden rounded-3xl">
        <AnimatePresence mode="wait">
          {!submitted ? (
            <motion.div
              key="feedback-form"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="space-y-6"
            >
              <DialogHeader>
                <div className="mx-auto w-12 h-12 rounded-2xl bg-violet-600/10 border border-violet-500/20 flex items-center justify-center mb-2">
                  <Sparkles className="w-6 h-6 text-violet-400" />
                </div>
                <DialogTitle className="text-2xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-white to-white/70">
                  Help Us Improve
                </DialogTitle>
                <DialogDescription className="text-zinc-400 text-xs text-center">
                  Share your thoughts about your Voke experience and unlock <strong className="text-violet-400">2 bonus mock interviews</strong> for free!
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-5">
                {/* Star Rating */}
                <div className="space-y-2 text-center">
                  <Label className="text-zinc-300 text-xs font-semibold uppercase tracking-wider block">
                    Your Rating
                  </Label>
                  <div className="flex items-center justify-center gap-1.5 py-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHoverRating(star)}
                        onMouseLeave={() => setHoverRating(0)}
                        className="p-1 hover:scale-125 transition-transform duration-150 focus:outline-none"
                      >
                        <Star
                          className={`w-9 h-9 transition-colors duration-150 ${
                            star <= (hoverRating || rating)
                              ? "fill-yellow-500 text-yellow-500 drop-shadow-[0_0_10px_rgba(234,179,8,0.3)]"
                              : "text-zinc-700 hover:text-zinc-500"
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Liked Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="liked" className="text-zinc-300 text-xs font-semibold">
                    What did you like the most about Voke?
                  </Label>
                  <Textarea
                    id="liked"
                    placeholder="Realistic AI voices, detailed feedback, resume analysis..."
                    value={liked}
                    onChange={(e) => setLiked(e.target.value)}
                    className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl resize-none h-20 text-sm"
                  />
                </div>

                {/* Improvement Textarea */}
                <div className="space-y-2">
                  <Label htmlFor="improvements" className="text-zinc-300 text-xs font-semibold">
                    What can we do to improve your experience?
                  </Label>
                  <Textarea
                    id="improvements"
                    placeholder="Add more roles, improve audio delay, peer review..."
                    value={improvements}
                    onChange={(e) => setImprovements(e.target.value)}
                    className="bg-zinc-900/50 border-white/10 text-white focus-visible:ring-violet-500 rounded-xl resize-none h-20 text-sm"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => handleClose(false)}
                    className="flex-1 text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-11 border border-white/5"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={rating === 0 || isSubmitting}
                    className="flex-1 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-semibold rounded-xl h-11 shadow-lg shadow-violet-500/20"
                  >
                    {isSubmitting ? (
                      <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                    ) : (
                      <span className="flex items-center justify-center gap-2">
                        Submit & Unlock
                        <Send className="w-3.5 h-3.5" />
                      </span>
                    )}
                  </Button>
                </div>
              </form>
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
