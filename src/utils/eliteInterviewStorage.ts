export type RoundStatus = 'locked' | 'unlocked' | 'passed' | 'failed';

export interface RoundProgress {
  roundId: string;
  roundNumber: number;
  title: string;
  status: RoundStatus;
  score?: number;
  feedback?: string;
  completedAt?: string;
  attempts: number;
}

export interface CompanyRoleProgress {
  typeId: string;
  roleId: string;
  companyId: string;
  currentRoundNumber: number;
  rounds: RoundProgress[];
  lastUpdated: string;
}

const STORAGE_KEY_PREFIX = 'voke_elite_progress_';
const SELECTED_TYPE_KEY = 'voke_elite_selected_type';
const SELECTED_ROLE_KEY = 'voke_elite_selected_role';
const SELECTED_COMPANY_KEY = 'voke_elite_selected_company';

export const saveSelectedType = (typeId: string) => {
  localStorage.setItem(SELECTED_TYPE_KEY, typeId);
};

export const getSelectedType = (): string | null => {
  return localStorage.getItem(SELECTED_TYPE_KEY) || 'internship';
};

export const saveSelectedRole = (roleId: string) => {
  localStorage.setItem(SELECTED_ROLE_KEY, roleId);
};

export const getSelectedRole = (): string | null => {
  return localStorage.getItem(SELECTED_ROLE_KEY);
};

export const saveSelectedCompany = (companyId: string) => {
  localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
};

export const getSelectedCompany = (): string | null => {
  return localStorage.getItem(SELECTED_COMPANY_KEY);
};

export const getProgressKey = (typeId: string, companyId: string, roleId: string) => {
  return `${STORAGE_KEY_PREFIX}${typeId}_${companyId}_${roleId}`;
};

export const getCompanyRoleProgress = (typeId: string, companyId: string, roleId: string): CompanyRoleProgress | null => {
  try {
    const raw = localStorage.getItem(getProgressKey(typeId, companyId, roleId));
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.error("Failed to load elite progress:", e);
    return null;
  }
};

export const saveCompanyRoleProgress = (progress: CompanyRoleProgress) => {
  try {
    localStorage.setItem(getProgressKey(progress.typeId, progress.companyId, progress.roleId), JSON.stringify(progress));
  } catch (e) {
    console.error("Failed to save elite progress:", e);
  }
};

export const initializeCompanyRoleProgress = (
  typeId: string,
  companyId: string,
  roleId: string,
  defaultRounds: { roundId: string; roundNumber: number; title: string }[]
): CompanyRoleProgress => {
  const existing = getCompanyRoleProgress(typeId, companyId, roleId);
  if (existing) return existing;

  const rounds: RoundProgress[] = defaultRounds.map((r, index) => ({
    roundId: r.roundId,
    roundNumber: r.roundNumber,
    title: r.title,
    status: index === 0 ? 'unlocked' : 'locked',
    attempts: 0
  }));

  const initial: CompanyRoleProgress = {
    typeId,
    companyId,
    roleId,
    currentRoundNumber: 1,
    rounds,
    lastUpdated: new Date().toISOString()
  };

  saveCompanyRoleProgress(initial);
  return initial;
};

export const updateRoundResult = (
  typeId: string,
  companyId: string,
  roleId: string,
  roundNumber: number,
  verdict: 'PASSED' | 'FAILED',
  feedbackReason?: string,
  score?: number
): CompanyRoleProgress => {
  const currentProgress = getCompanyRoleProgress(typeId, companyId, roleId);
  if (!currentProgress) throw new Error("No progress record found");

  const updatedRounds = currentProgress.rounds.map(round => {
    if (round.roundNumber === roundNumber) {
      const isPass = verdict === 'PASSED';
      return {
        ...round,
        status: (isPass ? 'passed' : 'failed') as RoundStatus,
        score: score ?? (isPass ? 85 : 45),
        feedback: feedbackReason || (isPass ? "Passed benchmark expectations" : "Needs re-attempt"),
        completedAt: new Date().toISOString(),
        attempts: round.attempts + 1
      };
    }
    return round;
  });

  // Unlock next round if passed
  if (verdict === 'PASSED') {
    const nextRoundIndex = updatedRounds.findIndex(r => r.roundNumber === roundNumber + 1);
    if (nextRoundIndex !== -1 && updatedRounds[nextRoundIndex].status === 'locked') {
      updatedRounds[nextRoundIndex].status = 'unlocked';
    }
  }

  const newProgress: CompanyRoleProgress = {
    ...currentProgress,
    currentRoundNumber: verdict === 'PASSED' ? Math.max(currentProgress.currentRoundNumber, roundNumber + 1) : currentProgress.currentRoundNumber,
    rounds: updatedRounds,
    lastUpdated: new Date().toISOString()
  };

  saveCompanyRoleProgress(newProgress);
  return newProgress;
};
