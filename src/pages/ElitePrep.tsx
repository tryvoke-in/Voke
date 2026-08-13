import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  INTERVIEW_TYPES, ELITE_ROLES, TOP_COMPANIES,
  InterviewTypeItem, RoleItem, CompanyItem, InterviewRoundDef, getInterviewRounds
} from '@/data/eliteInterviewData';
import {
  saveSelectedType, getSelectedType,
  saveSelectedRole, getSelectedRole,
  saveSelectedCompany, getSelectedCompany,
  initializeCompanyRoleProgressAsync, getCompanyRoleProgress, CompanyRoleProgress,
  isDevUnlockAllActive, fetchCompanyRoleProgress
} from '@/utils/eliteInterviewStorage';
import { EliteNotebookLMMindMap } from '@/components/elite/EliteNotebookLMMindMap';
import { EliteVoiceRoom } from '@/components/elite/EliteVoiceRoom';
import { EliteProjectDeepDive } from '@/components/elite/EliteProjectDeepDive';
import { EliteCodingAssessment } from '@/components/elite/EliteCodingAssessment';
import { EliteHRRound } from '@/components/elite/EliteHRRound';
import { useInterviewCredits } from '@/hooks/useInterviewCredits';
import { loadUserProfileContext, ProfileContext } from '@/utils/profileContext';
import { Crown, AlertTriangle, Sparkles, Wrench, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type ViewMode = 'notebook_mindmap' | 'in_interview';

const ElitePrep: React.FC = () => {
  const navigate = useNavigate();
  const { credits, isPremium, loading: creditsLoading, consumeCredit } = useInterviewCredits('elite');

  // Beta / Under Development Notice Modal State (Shows every time user enters Elite Prep)
  const [showBetaNotice, setShowBetaNotice] = useState<boolean>(true);

  const handleAcknowledgeBeta = () => {
    setShowBetaNotice(false);
  };

  // View mode
  const [viewMode, setViewMode] = useState<ViewMode>('notebook_mindmap');

  // Selections
  const [selectedType, setSelectedType] = useState<InterviewTypeItem | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<CompanyItem | null>(null);
  const [selectedRole, setSelectedRole] = useState<RoleItem | null>(null);
  const [activeRound, setActiveRound] = useState<InterviewRoundDef | null>(null);

  const [rounds, setRounds] = useState<InterviewRoundDef[]>([]);
  const [progress, setProgress] = useState<CompanyRoleProgress | null>(null);

  // Profile Context
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [userId, setUserId] = useState<string | null>(null);

  // Final Recommendation Engine State
  const [showFinalVerdictModal, setShowFinalVerdictModal] = useState(false);

  const setupRoundsHub = async (typeItem: InterviewTypeItem, company: CompanyItem, role: RoleItem, uidOverride?: string | null) => {
    const generatedRounds = getInterviewRounds(typeItem.id, company.id, role.id);
    setRounds(generatedRounds);
    const activeUid = uidOverride ?? userId ?? 'guest_user';
    const prog = await initializeCompanyRoleProgressAsync(activeUid, typeItem.id, company.id, role.id, generatedRounds);
    setProgress(prog);
  };

  useEffect(() => {
    const initProfileAndUser = async () => {
      let activeUid = 'guest_user';
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          activeUid = user.id;
          setUserId(user.id);
        } else {
          setUserId('guest_user');
        }

        const ctx = await loadUserProfileContext();
        setProfileContext(ctx);
      } catch (err) {
        console.warn('[ElitePrep] Profile load fallback:', err);
        setUserId('guest_user');
      } finally {
        setLoadingProfile(false);
      }

      // Restore saved or default selections on mount
      try {
        const savedTypeId = getSelectedType();
        const savedCompId = getSelectedCompany();
        const savedRoleId = getSelectedRole();

        const typeObj = INTERVIEW_TYPES.find(t => t.id === savedTypeId) || INTERVIEW_TYPES[0];
        const compObj = TOP_COMPANIES.find(c => c.id === savedCompId) || null;
        const roleObj = ELITE_ROLES.find(r => r.id === savedRoleId) || null;

        if (typeObj) setSelectedType(typeObj);
        if (compObj) setSelectedCompany(compObj);
        if (roleObj) setSelectedRole(roleObj);

        if (typeObj && compObj && roleObj) {
          await setupRoundsHub(typeObj, compObj, roleObj, activeUid);
        }
      } catch (e) {
        console.warn('[ElitePrep] Selection restore warning:', e);
      }
      // Listen for Dev Tool progress/unlock changes
      const handleDevChange = async () => {
        if (selectedType && selectedCompany && selectedRole) {
          const updated = await fetchCompanyRoleProgress(activeUid, selectedType.id, selectedCompany.id, selectedRole.id);
          if (updated) setProgress(updated);
        }
      };
      window.addEventListener('voke-dev-unlock-change', handleDevChange);

      return () => {
        window.removeEventListener('voke-dev-unlock-change', handleDevChange);
      };
    };
    initProfileAndUser();
  }, [selectedType?.id, selectedCompany?.id, selectedRole?.id]);

  // Clicking Step 1 Track: Toggle off or switch track (collapsing downstream choices)
  const handleSelectType = (typeItem: InterviewTypeItem) => {
    if (selectedType?.id === typeItem.id) {
      setSelectedType(null);
      setSelectedCompany(null);
      setSelectedRole(null);
      setRounds([]);
      setProgress(null);
      return;
    }
    setSelectedType(typeItem);
    saveSelectedType(typeItem.id);
    setSelectedCompany(null);
    setSelectedRole(null);
    setRounds([]);
    setProgress(null);
  };

  // Clicking Step 2 Company: Toggle off or switch company (collapsing role/pipeline choices)
  const handleSelectCompany = (company: CompanyItem) => {
    if (selectedCompany?.id === company.id) {
      setSelectedCompany(null);
      setSelectedRole(null);
      setRounds([]);
      setProgress(null);
      return;
    }
    setSelectedCompany(company);
    saveSelectedCompany(company.id);
    setSelectedRole(null);
    setRounds([]);
    setProgress(null);
  };

  // Clicking Step 3 Role: Toggle off (collapses pipeline) or switch role (unfolds pipeline)
  const handleSelectRole = (role: RoleItem) => {
    if (selectedRole?.id === role.id) {
      setSelectedRole(null);
      setRounds([]);
      setProgress(null);
      return;
    }
    setSelectedRole(role);
    saveSelectedRole(role.id);
    if (selectedType && selectedCompany) {
      setupRoundsHub(selectedType, selectedCompany, role);
    }
  };

  const handleResetSelection = () => {
    setSelectedType(null);
    setSelectedCompany(null);
    setSelectedRole(null);
    setRounds([]);
    setProgress(null);
  };

  const handleStartRound = async (round: InterviewRoundDef) => {
    const isDevUnlocked = isDevUnlockAllActive();
    if (!isDevUnlocked && selectedType && selectedCompany && selectedRole) {
      const targetRoundState = progress?.rounds.find(r => r.roundNumber === round.roundNumber);
      if (round.roundNumber > 1 && targetRoundState?.status === 'locked') {
        toast.error(`🔒 Round ${round.roundNumber} is locked! You must pass Round ${round.roundNumber - 1} first.`);
        return;
      }
    }
    setActiveRound(round);
    if (credits > 0 || isPremium) {
      await consumeCredit();
    }
    setViewMode('in_interview');
  };

  const handleCompleteRound = async (verdict: 'PASSED' | 'FAILED') => {
    if (selectedType && selectedCompany && selectedRole) {
      const activeUid = userId || 'guest_user';
      const updatedProg = await initializeCompanyRoleProgressAsync(
        activeUid, selectedType.id, selectedCompany.id, selectedRole.id, rounds
      );
      if (updatedProg) setProgress(updatedProg);
      
      // Trigger Final Recommendation Engine if Round 4 is completed
      if (activeRound?.roundNumber === 4) {
        setShowFinalVerdictModal(true);
      }
    }
    setViewMode('notebook_mindmap');
  };

  const calculateFinalRecommendation = () => {
    if (!progress || progress.rounds.length < 4) return null;

    const scores = progress.rounds.map(r => r.score || 0);
    // Hard Rejection Logic: Fails if any round score is below 65 (assuming 65 is minimum pass)
    const hasFailedRound = progress.rounds.some(r => r.status === 'failed');

    if (hasFailedRound) {
      return { score: 0, decision: 'Reject', color: 'text-red-500', bg: 'bg-red-500/10' };
    }

    // Weighted Scores
    // R1: 20%, R2: 35%, R3: 35%, R4: 10%
    const finalScore = Math.round(
      (scores[0] * 0.20) +
      (scores[1] * 0.35) +
      (scores[2] * 0.35) +
      (scores[3] * 0.10)
    );

    if (finalScore >= 85) return { score: finalScore, decision: 'Strong Hire', color: 'text-green-400', bg: 'bg-green-500/10' };
    if (finalScore >= 75) return { score: finalScore, decision: 'Hire', color: 'text-teal-400', bg: 'bg-teal-500/10' };
    if (finalScore >= 65) return { score: finalScore, decision: 'Hold / Review', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    return { score: finalScore, decision: 'Reject', color: 'text-red-500', bg: 'bg-red-500/10' };
  };

  const finalVerdict = calculateFinalRecommendation();

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col font-sans select-none overflow-hidden relative">
      {/* EARLY ACCESS & FEATURES UNDER DEVELOPMENT POPUP MODAL */}
      {showBetaNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-md bg-[#0d0e17] border border-white/10 rounded-2xl p-6 shadow-2xl text-center space-y-4 overflow-hidden">
            {/* Ambient Background Glow */}
            <div className="absolute -top-12 -left-12 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />
            <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-violet-500/10 rounded-full blur-2xl pointer-events-none" />

            {/* Icon Header */}
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
              <AlertTriangle className="w-6 h-6 text-amber-400" />
            </div>

            {/* Title & Description */}
            <div className="space-y-1.5">
              <h3 className="text-base font-extrabold text-white tracking-tight">
                Features Still Under Development
              </h3>
              <p className="text-xs text-zinc-400 leading-relaxed max-w-xs mx-auto">
                Elite Prep is currently under active development. Dynamic question paths, repository analysis, and company benchmarks are continuously being calibrated.
              </p>
            </div>

            {/* Feature Chips */}
            <div className="grid grid-cols-2 gap-2 text-left pt-1">
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                <span className="text-[11px] font-medium text-zinc-300">Live AI Engine</span>
              </div>
              <div className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 flex items-center gap-2">
                <Wrench className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                <span className="text-[11px] font-medium text-zinc-300">Active Calibration</span>
              </div>
            </div>

            {/* Acknowledge Button */}
            <div className="pt-2">
              <button
                type="button"
                onClick={handleAcknowledgeBeta}
                className="w-full py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-violet-600/25 transition-all cursor-pointer transform hover:scale-[1.01] active:scale-[0.99]"
              >
                Acknowledge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* FINAL RECOMMENDATION ENGINE MODAL */}
      {showFinalVerdictModal && finalVerdict && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-xl animate-in fade-in duration-500">
          <div className="relative w-full max-w-lg bg-[#0a0a0a] border border-white/10 rounded-3xl p-8 shadow-2xl text-center overflow-hidden">
            <div className="absolute -top-32 -left-32 w-64 h-64 bg-violet-600/20 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute -bottom-32 -right-32 w-64 h-64 bg-amber-600/20 rounded-full blur-3xl pointer-events-none" />
            
            <div className="relative z-10 space-y-6">
              <div className="mx-auto w-20 h-20 rounded-full bg-zinc-900 border border-white/10 flex items-center justify-center shadow-2xl">
                <Crown className={`w-10 h-10 ${finalVerdict.color}`} />
              </div>
              
              <div className="space-y-2">
                <h2 className="text-3xl font-black text-white tracking-tight uppercase">Final Recommendation</h2>
                <p className="text-sm text-zinc-400">Based on your performance across all 4 interview rounds.</p>
              </div>

              <div className={`p-6 rounded-2xl border border-white/5 ${finalVerdict.bg} backdrop-blur-sm space-y-2`}>
                <div className={`text-5xl font-black ${finalVerdict.color}`}>{finalVerdict.score}%</div>
                <div className="text-sm font-bold text-white uppercase tracking-widest">{finalVerdict.decision}</div>
              </div>

              <div className="grid grid-cols-2 gap-3 text-left">
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">R1: Resume</span>
                  <span className="text-xs font-bold text-white">{progress?.rounds[0]?.score || 0}%</span>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">R2: Project</span>
                  <span className="text-xs font-bold text-white">{progress?.rounds[1]?.score || 0}%</span>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">R3: Coding</span>
                  <span className="text-xs font-bold text-white">{progress?.rounds[2]?.score || 0}%</span>
                </div>
                <div className="p-3 bg-zinc-900/50 rounded-xl border border-white/5 flex justify-between items-center">
                  <span className="text-xs text-zinc-400">R4: HR</span>
                  <span className="text-xs font-bold text-white">{progress?.rounds[3]?.score || 0}%</span>
                </div>
              </div>

              <button
                onClick={() => setShowFinalVerdictModal(false)}
                className="w-full py-3.5 rounded-xl bg-white text-black font-extrabold text-sm tracking-wide shadow-xl shadow-white/10 hover:bg-zinc-200 transition-all active:scale-[0.98]"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main View */}
      <main className="flex-1 min-h-0 relative">
        {viewMode === 'notebook_mindmap' && (
          <EliteNotebookLMMindMap
            selectedType={selectedType}
            selectedCompany={selectedCompany}
            selectedRole={selectedRole}
            rounds={rounds}
            progress={progress}
            onSelectType={handleSelectType}
            onSelectCompany={handleSelectCompany}
            onSelectRole={handleSelectRole}
            onStartRound={handleStartRound}
            onResetSelection={handleResetSelection}
            onNavigateDashboard={() => navigate('/dashboard')}
          />
        )}

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && (activeRound.roundNumber === 1) && (
          <EliteVoiceRoom
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            githubRepos={profileContext?.githubRepos}
            isLoadingRepos={loadingProfile}
            userId={userId || 'guest_user'}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && activeRound.roundNumber === 2 && (
          <EliteProjectDeepDive
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            githubRepos={profileContext?.githubRepos}
            isLoadingRepos={loadingProfile}
            userId={userId || 'guest_user'}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && activeRound.roundNumber === 3 && (
          <EliteCodingAssessment
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            userId={userId || 'guest_user'}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && activeRound.roundNumber === 4 && (
          <EliteHRRound
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            userId={userId || 'guest_user'}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}
      </main>
    </div>
  );
};

export default ElitePrep;
