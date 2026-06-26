import React, { useState, useEffect } from "react";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { Button } from "@/components/ui/button";
import { FlaskConical, RotateCcw, Lock, CreditCard, Sparkles, ChevronUp, ChevronDown, Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";

const AUTHORIZED_EMAILS = [
  "anurag50434411@gmail.com",
  "nikhilbhor201@gmail.com",
  "sharma.priyanshu3434@gmail.com",
  "24_nikhil.bhor@ges-coengg.org",
  "ompawar396@gmail.com"
];

export const DevResetWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  const {
    isPremium,
    resetCredits,
    setCreditsForTesting,
    loading,
    creditsElite,
    creditsVoice,
    creditsVideo,
    hasGivenFeedback,
  } = useInterviewCredits();  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUserEmail(session?.user?.email || null);
      } catch (err) {
        console.error("Error checking auth for dev tool:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
      setAuthLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading || authLoading) return null;
  if (!userEmail || !AUTHORIZED_EMAILS.includes(userEmail.toLowerCase())) return null;

  return (
    <div className="fixed bottom-6 left-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="mb-3 w-80 bg-zinc-950/90 backdrop-blur-xl border border-zinc-800 rounded-3xl p-5 shadow-2xl text-white overflow-hidden relative"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -left-12 w-24 h-24 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-24 h-24 bg-fuchsia-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-3 mb-4">
                <div className="flex items-center gap-2">
                  <FlaskConical className="w-5 h-5 text-violet-400 animate-pulse" />
                  <span className="font-extrabold text-sm tracking-wider text-zinc-100 uppercase">Dev Test Panel</span>
                </div>
                <span className="text-[10px] bg-violet-500/10 text-violet-300 border border-violet-500/20 px-2 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Active
                </span>
              </div>

              {/* Status Section */}
              <div className="space-y-2 mb-4 bg-zinc-900/60 rounded-2xl p-3.5 border border-zinc-800/50">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-medium">Elite Credits:</span>
                  <span className="font-mono font-bold text-white bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                    {isPremium ? "Unlimited" : creditsElite}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-medium">Voice Credits:</span>
                  <span className="font-mono font-bold text-white bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                    {isPremium ? "Unlimited" : creditsVoice}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-medium">Video Credits:</span>
                  <span className="font-mono font-bold text-white bg-zinc-800/80 px-2 py-0.5 rounded border border-zinc-700">
                    {isPremium ? "Unlimited" : creditsVideo}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-zinc-800">
                  <span className="text-zinc-400 font-medium">Has Given Feedback:</span>
                  <span className={`font-semibold text-xs flex items-center gap-1 ${hasGivenFeedback ? 'text-emerald-400' : 'text-amber-400'}`}>
                    {hasGivenFeedback ? (
                      <>
                        <Check className="w-3.5 h-3.5" /> Yes
                      </>
                    ) : "No"}
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-zinc-400 font-medium">Subscription Level:</span>
                  <span className={`font-semibold text-xs flex items-center gap-1 ${isPremium ? 'text-amber-400' : 'text-zinc-400'}`}>
                    {isPremium ? (
                      <>
                        <Sparkles className="w-3 h-3 fill-amber-400" /> Premium
                      </>
                    ) : "Free Tier"}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                <Button
                  onClick={() => resetCredits()}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl text-xs font-semibold"
                >
                  <RotateCcw className="w-3.5 h-3.5 mr-2 text-violet-400" />
                  Reset to Start (1 Credit)
                </Button>

                <Button
                  onClick={() => setCreditsForTesting(0, false, false)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl text-xs font-semibold"
                >
                  <Lock className="w-3.5 h-3.5 mr-2 text-amber-400" />
                  Set 0 Credits (Show Feedback Gate)
                </Button>

                <Button
                  onClick={() => setCreditsForTesting(0, true, false)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl text-xs font-semibold"
                >
                  <CreditCard className="w-3.5 h-3.5 mr-2 text-rose-400" />
                  Set 0 Credits + Feedback (Show Pricing Gate)
                </Button>

                <Button
                  onClick={() => setCreditsForTesting(999, false, true)}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-9 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-xl text-xs font-semibold"
                >
                  <Sparkles className="w-3.5 h-3.5 mr-2 text-emerald-400 fill-emerald-500/20" />
                  Make Premium (Unlimited)
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white rounded-full shadow-lg hover:shadow-violet-600/35 active:scale-95 transition-all text-xs font-bold border border-violet-500/30"
      >
        <FlaskConical className="w-4 h-4" />
        <span>Dev Test Tool</span>
        {isOpen ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
      </button>
    </div>
  );
};
