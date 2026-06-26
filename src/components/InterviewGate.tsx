import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { FeedbackFormDialog } from "./FeedbackFormDialog";
import { Lock, Sparkles, CreditCard, ChevronRight, MessageSquareHeart, ShieldAlert } from "lucide-react";
import { motion } from "framer-motion";

interface InterviewGateProps {
  credits: number;
  hasGivenFeedback: boolean;
  isPremium: boolean;
  onFeedbackSuccess?: () => void;
  grantFeedbackCredits?: () => Promise<boolean>;
  title?: string;
  description?: string;
}

export const InterviewGate = ({
  credits,
  hasGivenFeedback,
  isPremium,
  onFeedbackSuccess,
  grantFeedbackCredits,
  title = "Unlock Unlimited Practice",
  description = "Get feedback on your performance, practice as much as you need, and land your dream job."
}: InterviewGateProps) => {
  const navigate = useNavigate();
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // If premium or has credits, don't show the gate
  if (isPremium || credits > 0) {
    return null;
  }

  const handleGrantSuccess = () => {
    setShowFeedbackModal(false);
    if (onFeedbackSuccess) {
      onFeedbackSuccess();
    }
  };

  return (
    <div className="w-full min-h-[500px] flex items-center justify-center p-4 bg-zinc-950/80 backdrop-blur-md rounded-3xl border border-white/5 relative overflow-hidden my-6">
      {/* Glow Effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-72 h-72 bg-violet-600/10 rounded-full blur-[100px] -z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-fuchsia-600/5 rounded-full blur-[120px] -z-10" />

      <div className="max-w-md w-full text-center space-y-8 p-6 md:p-8">
        {/* Lock / Icon Header */}
        <div className="relative inline-flex">
          <div className="w-16 h-16 rounded-2xl bg-zinc-900 border border-white/10 flex items-center justify-center text-zinc-400 shadow-2xl relative z-10">
            <Lock className="w-6 h-6 text-violet-400 animate-pulse" />
          </div>
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-fuchsia-500 rounded-full animate-ping opacity-75" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-fuchsia-500 rounded-full" />
        </div>

        {/* Content */}
        <div className="space-y-3">
          <h2 className="text-2.5xl font-extrabold text-white tracking-tight">
            {!hasGivenFeedback ? "Mock Interview Locked" : "Free Trial Completed"}
          </h2>
          <p className="text-zinc-400 text-sm leading-relaxed">
            {!hasGivenFeedback
              ? "You have used your 1 free mock interview credit. Help us improve Voke by sharing feedback to unlock 2 more free sessions!"
              : "You've successfully used all your free trial credits. Upgrade to Voke Elite to unlock unlimited interviews and premium features."}
          </p>
        </div>

        {/* Action Gate Cards */}
        {!hasGivenFeedback ? (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-gradient-to-r from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-2xl text-left space-y-4 cursor-pointer relative group"
            onClick={() => setShowFeedbackModal(true)}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-violet-500/20 flex items-center justify-center text-violet-300 shrink-0">
                <MessageSquareHeart className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                  Share Quick Feedback
                  <Sparkles className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Takes less than a minute. Unlocks 2 bonus interviews immediately.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto self-center" />
            </div>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs h-10 rounded-xl"
              onClick={(e) => {
                e.stopPropagation();
                setShowFeedbackModal(true);
              }}
            >
              Give Feedback & Get Credits
            </Button>
          </motion.div>
        ) : (
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="p-5 bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 rounded-2xl text-left space-y-4 cursor-pointer relative group"
            onClick={() => navigate("/pricing")}
          >
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center text-amber-300 shrink-0">
                <CreditCard className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h4 className="text-white font-bold text-sm flex items-center gap-1.5">
                  Upgrade to Voke Elite
                  <span className="text-[10px] bg-amber-500/20 text-amber-300 font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider">
                    ₹99 ONLY
                  </span>
                </h4>
                <p className="text-zinc-400 text-xs leading-relaxed">
                  Unlock unlimited Text, Video, Voice & Adaptive mock interviews.
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-zinc-500 group-hover:text-white group-hover:translate-x-1 transition-all ml-auto self-center" />
            </div>
            <Button
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs h-10 rounded-xl shadow-lg shadow-orange-500/10"
              onClick={(e) => {
                e.stopPropagation();
                navigate("/pricing");
              }}
            >
              Unlock Unlimited for ₹99
            </Button>
          </motion.div>
        )}

        {/* Subtitle/Offer */}
        <div className="text-zinc-500 text-xs flex items-center justify-center gap-1.5">
          <ShieldAlert className="w-3.5 h-3.5" />
          <span>Pay once. Upgrade anytime. Cancel anytime.</span>
        </div>
      </div>

      <FeedbackFormDialog
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        onSuccess={handleGrantSuccess}
        grantFeedbackCredits={grantFeedbackCredits}
      />
    </div>
  );
};
