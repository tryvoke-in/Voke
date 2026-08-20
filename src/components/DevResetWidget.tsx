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
  RefreshCw,
  X
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
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
import { cn } from "@/lib/utils";

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
  const [isProctoringDisabled, setIsProctoringDisabled] = useState<boolean>(
    () => typeof window !== 'undefined' && localStorage.getItem('voke_dev_proctoring_disabled') === 'true'
  );
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
            initial={{ opacity: 0, y: 8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute bottom-full mb-2 left-0 w-80 bg-card border border-border/60 rounded-2xl p-4 shadow-xl text-foreground overflow-hidden"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 pb-2.5 mb-3">
              <div className="flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4 text-blue-500" />
                <span className="font-bold text-xs tracking-wider text-foreground uppercase">Dev Testing</span>
              </div>
              <span className="text-[10px] bg-blue-500/10 text-blue-500 border border-blue-500/20 px-2 py-0.5 rounded-full font-semibold">
                Admin
              </span>
            </div>

            {/* Navigation Tabs */}
            <div className="grid grid-cols-2 gap-1 bg-muted/50 p-1 rounded-xl mb-3 border border-border/40">
              <button
                type="button"
                onClick={() => setActiveTab('elite')}
                className={cn(
                  "text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'elite'
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <Award className="w-3.5 h-3.5 text-blue-500" />
                <span>Elite Prep</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('credits')}
                className={cn(
                  "text-[11px] font-semibold py-1.5 px-2 rounded-lg transition-all flex items-center justify-center gap-1.5 cursor-pointer",
                  activeTab === 'credits'
                    ? "bg-background text-foreground shadow-2xs font-bold"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                <span>Credits & Gates</span>
              </button>
            </div>

            {/* TAB 1: ELITE PREP CONTROLS */}
            {activeTab === 'elite' && (
              <div className="space-y-2.5">
                {/* Master Unlock Switch */}
                <div className="p-3 rounded-xl bg-muted/30 border border-border/50 space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      {isUnlockedAll ? (
                        <Unlock className="w-3.5 h-3.5 text-blue-500" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-muted-foreground" />
                      )}
                      <span className="text-xs font-semibold text-foreground">Unlock All 4 Rounds</span>
                    </div>
                    <button
                      type="button"
                      onClick={handleToggleUnlockAll}
                      className={cn(
                        "text-[10px] font-bold px-2.5 py-0.5 rounded-full border transition-all cursor-pointer",
                        isUnlockedAll
                          ? "bg-blue-600 text-white border-blue-500 shadow-2xs"
                          : "bg-muted text-muted-foreground border-border hover:bg-muted/80"
                      )}
                    >
                      {isUnlockedAll ? 'ENABLED' : 'DISABLED'}
                    </button>
                  </div>


                  {/* Disable Proctoring Switch */}
                  <div className="p-2.5 rounded-xl bg-zinc-900/70 border border-zinc-800/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <ShieldCheck className={`w-3.5 h-3.5 ${isProctoringDisabled ? 'text-rose-400' : 'text-emerald-400'}`} />
                        <span className="text-xs font-bold text-zinc-200">Anti-Cheat System</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newVal = !isProctoringDisabled;
                          setIsProctoringDisabled(newVal);
                          if (newVal) localStorage.setItem('voke_dev_proctoring_disabled', 'true');
                          else localStorage.removeItem('voke_dev_proctoring_disabled');
                          window.dispatchEvent(new Event('voke-dev-proctoring-change'));
                        }}
                        className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full border transition-all cursor-pointer ${
                          !isProctoringDisabled
                            ? 'bg-emerald-500 text-white border-emerald-400 shadow-md shadow-emerald-500/20'
                            : 'bg-zinc-800 text-zinc-300 border-zinc-700 hover:bg-zinc-700'
                        }`}
                      >
                        {!isProctoringDisabled ? 'ACTIVE' : 'DISABLED'}
                      </button>
                    </div>
                    <p className="text-[10px] text-zinc-400 leading-snug">
                      {isProctoringDisabled
                        ? 'Anti-cheat is DISABLED. You can copy/paste and switch tabs freely.'
                        : 'Anti-cheat is ACTIVE. Copy/paste and tab switching are blocked.'}
                    </p>
                  </div>

                  {/* Force Unlock Editor Shortcut */}
                  <Button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('voke-dev-unlock-editor'));
                      toast.success("Editor unlocked! You can now start coding.");
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center h-7.5 px-2 bg-zinc-900 border-amber-500/20 hover:bg-amber-950/40 hover:text-amber-300 rounded-lg text-[10px] font-bold"
                  >
                    <Unlock className="w-3 h-3 mr-1.5 text-amber-400" />
                    Force Unlock Editor (Skip AI)
                  </Button>

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

                  {/* Instant Unlock Editor Shortcut */}
                  <Button
                    onClick={() => {
                      window.dispatchEvent(new CustomEvent('voke-dev-unlock-editor'));
                      toast.success("Editor unlocked! You can now start coding.");
                    }}
                    variant="outline"
                    size="sm"
                    className="w-full justify-center h-7.5 px-2 bg-zinc-900 border-amber-500/20 hover:bg-amber-950/40 hover:text-amber-300 rounded-lg text-[10px] font-bold"
                  >
                    <Unlock className="w-3 h-3 mr-1.5 text-amber-400" />
                    Force Unlock Editor (Skip AI)
                  </Button>
                </div>

                {/* Fast Action Buttons */}
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    onClick={handlePassAllRounds}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-8 px-2.5 bg-muted/40 border-border/50 hover:bg-muted text-foreground rounded-xl text-[11px] font-medium"
                  >
                    <Check className="w-3.5 h-3.5 mr-1 text-emerald-500" />
                    Pass All 4 (90%)
                  </Button>

                  <Button
                    onClick={handleResetProgress}
                    disabled={isProcessing}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-8 px-2.5 bg-muted/40 border-border/50 hover:bg-muted text-foreground rounded-xl text-[11px] font-medium"
                  >
                    <RefreshCw className={cn("w-3.5 h-3.5 mr-1 text-blue-500", isProcessing && "animate-spin")} />
                    Reset Pipeline
                  </Button>
                </div>

                {/* Navigation shortcut */}
                <Button
                  onClick={() => navigate('/elite-prep')}
                  variant="outline"
                  size="sm"
                  className="w-full justify-start h-8 px-2.5 bg-muted/40 border-border/50 hover:bg-muted text-foreground rounded-xl text-[11px] font-medium"
                >
                  <Layers className="w-3.5 h-3.5 mr-1.5 text-blue-500" />
                  Open Elite Prep Mind Map
                </Button>
              </div>
            )}

            {/* TAB 2: CREDITS & GATES */}
            {activeTab === 'credits' && (
              <div className="space-y-2">
                {/* Status Section */}
                <div className="space-y-1.5 bg-muted/30 rounded-xl p-2.5 border border-border/50">
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Elite Credits:</span>
                    <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 text-[11px]">
                      {isPremium ? "Unlimited" : creditsElite}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Voice Credits:</span>
                    <span className="font-mono font-bold text-foreground bg-muted px-1.5 py-0.5 rounded border border-border/40 text-[11px]">
                      {isPremium ? "Unlimited" : creditsVoice}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-muted-foreground">Subscription:</span>
                    <span className={cn("font-semibold text-[11px]", isPremium ? 'text-blue-500' : 'text-muted-foreground')}>
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
                    className="w-full justify-start h-7.5 px-2.5 bg-muted/40 border-border/50 hover:bg-muted text-foreground rounded-xl text-[11px] font-medium"
                  >
                    <RotateCcw className="w-3 h-3 mr-1.5 text-muted-foreground" />
                    Reset to Start (1 Credit)
                  </Button>

                  <Button
                    onClick={() => setCreditsForTesting(0, false, false)}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-7.5 px-2.5 bg-muted/40 border-border/50 hover:bg-muted text-foreground rounded-xl text-[11px] font-medium"
                  >
                    <Lock className="w-3 h-3 mr-1.5 text-muted-foreground" />
                    Set 0 Credits (Feedback Gate)
                  </Button>

                  <Button
                    onClick={() => setCreditsForTesting(0, true, false)}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-7.5 px-2.5 bg-muted/40 border-border/50 hover:bg-muted text-foreground rounded-xl text-[11px] font-medium"
                  >
                    <CreditCard className="w-3 h-3 mr-1.5 text-muted-foreground" />
                    Set 0 Credits + FB (Pricing Gate)
                  </Button>

                  <Button
                    onClick={() => setCreditsForTesting(999, false, true)}
                    variant="outline"
                    size="sm"
                    className="w-full justify-start h-7.5 px-2.5 bg-muted/40 border-border/50 hover:bg-muted text-foreground rounded-xl text-[11px] font-medium"
                  >
                    Make Premium (Unlimited)
                  </Button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-3 py-1.5 bg-card/90 hover:bg-card text-muted-foreground hover:text-foreground rounded-full shadow-lg border border-border/60 backdrop-blur-md transition-all text-xs font-medium cursor-pointer group"
      >
        <FlaskConical className="w-3.5 h-3.5 text-blue-500 group-hover:rotate-12 transition-transform" />
        <span>Dev Tool</span>
        {isUnlockedAll && (
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500 animate-pulse" title="All Rounds Unlocked" />
        )}
        {isOpen ? <ChevronDown className="w-3 h-3 text-muted-foreground" /> : <ChevronUp className="w-3 h-3 text-muted-foreground" />}
      </button>
    </div>
  );
};
