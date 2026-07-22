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
  initializeCompanyRoleProgress, getCompanyRoleProgress, CompanyRoleProgress
} from '@/utils/eliteInterviewStorage';
import { EliteNotebookLMMindMap } from '@/components/elite/EliteNotebookLMMindMap';
import { EliteVoiceRoom } from '@/components/elite/EliteVoiceRoom';
import { useInterviewCredits } from '@/hooks/useInterviewCredits';
import { loadUserProfileContext, ProfileContext } from '@/utils/profileContext';
import { Crown } from 'lucide-react';

type ViewMode = 'notebook_mindmap' | 'in_interview';

const ElitePrep: React.FC = () => {
  const navigate = useNavigate();
  const { credits, isPremium, loading: creditsLoading, consumeCredit } = useInterviewCredits('elite');

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

  useEffect(() => {
    const initProfile = async () => {
      try {
        const ctx = await loadUserProfileContext();
        setProfileContext(ctx);
      } catch (err) {
        console.error('[ElitePrep] Profile load error:', err);
      } finally {
        setLoadingProfile(false);
      }
    };
    initProfile();
  }, []);

  const setupRoundsHub = (typeItem: InterviewTypeItem, company: CompanyItem, role: RoleItem) => {
    const generatedRounds = getInterviewRounds(typeItem.id, company.id, role.id);
    setRounds(generatedRounds);
    const prog = initializeCompanyRoleProgress(typeItem.id, company.id, role.id, generatedRounds);
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
    setActiveRound(round);
    if (credits > 0 || isPremium) {
      await consumeCredit();
    }
    setViewMode('in_interview');
  };

  const handleCompleteRound = (verdict: 'PASSED' | 'FAILED') => {
    if (selectedType && selectedCompany && selectedRole) {
      const updatedProg = getCompanyRoleProgress(selectedType.id, selectedCompany.id, selectedRole.id);
      if (updatedProg) setProgress(updatedProg);
    }
    setViewMode('notebook_mindmap');
  };

  return (
    <div className="min-h-screen bg-[#080B11] text-white flex flex-col font-sans select-none overflow-hidden">
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

        {viewMode === 'in_interview' && selectedType && selectedCompany && selectedRole && activeRound && (
          <EliteVoiceRoom
            interviewType={selectedType}
            company={selectedCompany}
            role={selectedRole}
            round={activeRound}
            candidateProfileContext={profileContext?.context}
            onCompleteRound={handleCompleteRound}
            onExit={() => setViewMode('notebook_mindmap')}
          />
        )}
      </main>
    </div>
  );
};

export default ElitePrep;
