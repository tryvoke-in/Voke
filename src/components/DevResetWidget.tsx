import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  RotateCcw,
  Lock,
  Unlock,
  CreditCard,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Check,
  ShieldCheck,
  Play,
  Layers,
  Award,
  Zap,
  RefreshCw
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import {
  isDevUnlockAllActive,
  setDevUnlockAllActive,
  devPassAllRoundsAsync,
  devResetPipelineProgressAsync,
  getSelectedType,
  getSelectedCompany,
  getSelectedRole
} from "@/utils/eliteInterviewStorage";
import { getInterviewRounds } from "@/data/eliteInterviewData";
import { toast } from "sonner";

const AUTHORIZED_EMAILS = [
  "anurag50434411@gmail.com",
  "nikhilbhor201@gmail.com",
  "priyanshu.sharmaiia@gmail.com",
  "24_nikhil.bhor@ges-coengg.org",
  "ompawar396@gmail.com"
];

export const DevResetWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'elite' | 'credits'>('elite');
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [isUnlockedAll, setIsUnlockedAll] = useState<boolean>(() => isDevUnlockAllActive());
  const [isProcessing, setIsProcessing] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const {
    isPremium,
    resetCredits,
    setCreditsForTesting,
    loading,
    creditsElite,
    creditsVoice,
    creditsVideo,
    hasGivenFeedback,
  } = useInterviewCredits();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUserEmail(session?.user?.email || null);
        setUserId(session?.user?.id || null);
      } catch (err) {
        console.error("Error checking auth for dev tool:", err);
      } finally {
        setAuthLoading(false);
      }
    };
    fetchUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserEmail(session?.user?.email || null);
      setUserId(session?.user?.id || null);
      setAuthLoading(false);
    });

    const handleUnlockChange = () => {
      setIsUnlockedAll(isDevUnlockAllActive());
    };
    window.addEventListener('voke-dev-unlock-change', handleUnlockChange);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('voke-dev-unlock-change', handleUnlockChange);
    };
  }, []);

  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.hostname.includes('ngrok') ||
      localStorage.getItem('voke_dev_mode') === 'true');

  const isAuthorized = isLocalhost || (userEmail && AUTHORIZED_EMAILS.includes(userEmail.toLowerCase()));

  if (loading || authLoading) return null;
  if (!isAuthorized) return null;

  // Toggle All Rounds Unlocked in Elite Prep
  const handleToggleUnlockAll = () => {
    const nextState = !isUnlockedAll;
    setIsUnlockedAll(nextState);
    setDevUnlockAllActive(nextState);
    if (nextState) {
      toast.success("🔓 Dev Mode: All 4 Elite Interview Rounds Unlocked!");
    } else {
      toast.info("🔒 Normal Mode: Standard Progression Re-enabled");
    }
  };

  // Pass All 4 Rounds Instantly for the active selection
  const handlePassAllRounds = async () => {
    setIsProcessing(true);
    try {
      const typeId = getSelectedType() || 'internship';
      const compId = getSelectedCompany() || 'google';
      const roleId = getSelectedRole() || 'frontend-developer';
      const activeUid = userId || 'guest_user';

      const roundsDef = getInterviewRounds(typeId, compId, roleId);
      await devPassAllRoundsAsync(activeUid, typeId, compId, roleId, roundsDef);
      toast.success("✅ All 4 Rounds Marked as PASSED (Scores: 88-92%)");
    } catch (err: any) {
      toast.error("Failed to update rounds: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  // Reset progress for active track
  const handleResetProgress = async () => {
    setIsProcessing(true);
    try {
      const typeId = getSelectedType() || 'internship';
      const compId = getSelectedCompany() || 'google';
      const roleId = getSelectedRole() || 'frontend-developer';
      const activeUid = userId || 'guest_user';

      const roundsDef = getInterviewRounds(typeId, compId, roleId);
      await devResetPipelineProgressAsync(activeUid, typeId, compId, roleId, roundsDef);
      toast.info("🔄 Pipeline Reset: Round 1 Unlocked, Rounds 2-4 Locked");
    } catch (err: any) {
      toast.error("Failed to reset: " + err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed bottom-4 left-4 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 w-80 bg-zinc-950/95 backdrop-blur-xl border border-zinc-800 rounded-2xl p-4 shadow-2xl text-white overflow-hidden"
          >
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -left-12 w-28 h-28 bg-amber-500/15 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-28 h-28 bg-violet-600/20 rounded-full blur-2xl pointer-events-none" />

            <div className="relative z-10">
              <div className="flex items-center justify-between border-b border-zinc-800 pb-2 mb-2.5">
                <div className="flex items-center gap-1.5">
                  <FlaskConical className="w-4 h-4 text-amber-400 animate-pulse" />
                  <span className="font-extrabold text-xs tracking-wider text-zinc-100 uppercase">Dev Testing Suite</span>
                </div>
                <span className="text-[9px] bg-amber-500/10 text-amber-300 border border-amber-500/20 px-1.5 py-0.5 rounded-full font-bold uppercase tracking-widest">
                  Admin Active
                </span>
              </div>

              {/* Navigation Tabs */}
              <div className="grid grid-cols-2 gap-1 bg-zinc-900/90 p-1 rounded-xl mb-3 border border-zinc-800/80">
                <button
                  type="button"
                  onClick={() => setActiveTab('elite')}
                  className={`text-[11px] font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'elite'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Award className="w-3 h-3 text-amber-400" />
                  <span>Elite Prep</span>
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('credits')}
                  className={`text-[11px] font-bold py-1 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                    activeTab === 'credits'
                      ? 'bg-violet-500/20 text-violet-300 border border-violet-500/40 shadow'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Sparkles className="w-3 h-3 text-violet-400" />
                  <span>Credits & Gates</span>
                </button>
              </div>

              {/* TAB 1: ELITE PREP CONTROLS */}
              {activeTab === 'elite' && (
                <div className="space-y-2">
                  {/* Master Unlock Switch */}
                  <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        {isUnlockedAll ? (
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                        ) : (
                          <Lock className="w-3.5 h-3.5 text-zinc-400" />
                        )}
                        <span className="text-xs font-bold text-zinc-200">Unlock All 4 Rounds</span>
                      </div>
                      <button
                        type="button"
                        onClick={handleToggleUnlockAll}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          isUnlockedAll
                            ? 'bg-amber-500 text-black border-amber-400 shadow-md shadow-amber-500/20'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {isUnlockedAll ? 'ENABLED' : 'DISABLED'}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-snug">
                      {isUnlockedAll
                        ? 'All 4 rounds are unlocked. You can directly click & test any round in the mind map.'
                        : 'Standard progression: Round 2-4 require passing earlier rounds.'}
                    </p>
                  </div>

                  {/* Fast Action Buttons */}
                  <div className="grid grid-cols-2 gap-1.5">
                    <Button
                      onClick={handlePassAllRounds}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-7.5 px-2 bg-zinc-900 border-zinc-800 hover:bg-emerald-950/40 hover:text-emerald-300 hover:border-emerald-500/40 rounded-lg text-[10px] font-semibold"
                    >
                      <Check className="w-3 h-3 mr-1 text-emerald-400" />
                      Pass All 4 (90%)
                    </Button>

                    <Button
                      onClick={handleResetProgress}
                      disabled={isProcessing}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-7.5 px-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg text-[10px] font-semibold"
                    >
                      <RefreshCw className={`w-3 h-3 mr-1 text-amber-400 ${isProcessing ? 'animate-spin' : ''}`} />
                      Reset Pipeline
                    </Button>
                  </div>

                  {/* Navigation shortcut */}
                  <Button
                    onClick={() => navigate('/elite-prep')}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-7.5 px-2.5 bg-gradient-to-r from-amber-500/10 to-violet-500/10 border-amber-500/30 text-amber-300 hover:bg-amber-500/20 rounded-lg text-[11px] font-bold"
                  >
                    <Layers className="w-3 h-3 mr-1.5 text-amber-400" />
                    Open Elite Prep Mind Map
                  </Button>
                </div>
              )}

              {/* TAB 2: CREDITS & GATES */}
              {activeTab === 'credits' && (
                <div className="space-y-2">
                  {/* Status Section */}
                  <div className="space-y-1 bg-zinc-900/60 rounded-xl p-2 border border-zinc-800/50">
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400">Elite Credits:</span>
                      <span className="font-mono font-bold text-white bg-zinc-800 px-1 py-0.2 rounded border border-zinc-700">
                        {isPremium ? "Unlimited" : creditsElite}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400">Voice Credits:</span>
                      <span className="font-mono font-bold text-white bg-zinc-800 px-1 py-0.2 rounded border border-zinc-700">
                        {isPremium ? "Unlimited" : creditsVoice}
                      </span>
                    </div>
                    <div className="flex justify-between items-center text-[10px]">
                      <span className="text-zinc-400">Subscription:</span>
                      <span className={`font-semibold ${isPremium ? 'text-amber-400' : 'text-zinc-400'}`}>
                        {isPremium ? "Premium (Unlimited)" : "Free Tier"}
                      </span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="space-y-1">
                    <Button
                      onClick={() => resetCredits()}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-7 px-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg text-[10px] font-semibold"
                    >
                      <RotateCcw className="w-3 h-3 mr-1.5 text-violet-400" />
                      Reset to Start (1 Credit)
                    </Button>

                    <Button
                      onClick={() => setCreditsForTesting(0, false, false)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-7 px-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg text-[10px] font-semibold"
                    >
                      <Lock className="w-3 h-3 mr-1.5 text-amber-400" />
                      Set 0 Credits (Feedback Gate)
                    </Button>

                    <Button
                      onClick={() => setCreditsForTesting(0, true, false)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-7 px-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg text-[10px] font-semibold"
                    >
                      <CreditCard className="w-3 h-3 mr-1.5 text-rose-400" />
                      Set 0 Credits + FB (Pricing Gate)
                    </Button>

                    <Button
                      onClick={() => setCreditsForTesting(999, false, true)}
                      variant="outline"
                      size="sm"
                      className="w-full justify-start h-7 px-2 bg-zinc-900 border-zinc-800 hover:bg-zinc-800 hover:text-white rounded-lg text-[10px] font-semibold"
                    >
                      <Sparkles className="w-3 h-3 mr-1.5 text-emerald-400 fill-emerald-500/20" />
                      Make Premium (Unlimited)
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900/95 hover:bg-zinc-800 text-zinc-300 hover:text-white rounded-full shadow-2xl border border-amber-500/40 backdrop-blur-md transition-all text-xs font-semibold cursor-pointer group"
      >
        <FlaskConical className="w-3.5 h-3.5 text-amber-400 group-hover:rotate-12 transition-transform" />
        <span>Dev Tool</span>
        {isUnlockedAll && (
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" title="All Rounds Unlocked" />
        )}
        {isOpen ? <ChevronDown className="w-3 h-3 text-zinc-400" /> : <ChevronUp className="w-3 h-3 text-zinc-400" />}
      </button>
    </div>
  );
};
