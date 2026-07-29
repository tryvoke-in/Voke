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
  initializeCompanyRoleProgressAsync, getCompanyRoleProgress, CompanyRoleProgress
} from '@/utils/eliteInterviewStorage';
import { EliteNotebookLMMindMap } from '@/components/elite/EliteNotebookLMMindMap';
import { EliteVoiceRoom } from '@/components/elite/EliteVoiceRoom';
import { EliteProjectDeepDive } from '@/components/elite/EliteProjectDeepDive';
import { useInterviewCredits } from '@/hooks/useInterviewCredits';
import { loadUserProfileContext, ProfileContext } from '@/utils/profileContext';
import { Crown, AlertTriangle, Sparkles, Wrench, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

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

  useEffect(() => {
    const initProfileAndUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) setUserId(user.id);

        const ctx = await loadUserProfileContext();
        setProfileContext(ctx);
      } catch (err) {
        console.error('[ElitePrep] Profile load error:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    initProfileAndUser();
  }, []);

  const setupRoundsHub = async (typeItem: InterviewTypeItem, company: CompanyItem, role: RoleItem) => {
    if (!userId) return;
    const generatedRounds = getInterviewRounds(typeItem.id, company.id, role.id);
    setRounds(generatedRounds);
    const prog = await initializeCompanyRoleProgressAsync(userId, typeItem.id, company.id, role.id, generatedRounds);
    setProgress(prog);
  };

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
    if (selectedType && selectedCompany && selectedRole) {
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
    if (selectedType && selectedCompany && selectedRole && userId) {
      // The updateRoundResultAsync should have been called by the interview component.
      // We just need to refresh local state.
      const updatedProg = await initializeCompanyRoleProgressAsync(
        userId, selectedType.id, selectedCompany.id, selectedRole.id, rounds
      );
      if (updatedProg) setProgress(updatedProg);
    }
    setViewMode('notebook_mindmap');
  };

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

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && activeRound.roundNumber === 1 && userId && (
          <EliteVoiceRoom
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            githubRepos={profileContext?.githubRepos}
            isLoadingRepos={loadingProfile}
            userId={userId}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && activeRound.roundNumber === 2 && userId && (
          <EliteProjectDeepDive
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            githubRepos={profileContext?.githubRepos}
            isLoadingRepos={loadingProfile}
            userId={userId}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}
      </main>
    </div>
  );
};

export default ElitePrep;
