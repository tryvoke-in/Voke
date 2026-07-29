import { supabase } from '@/integrations/supabase/client';

export type RoundStatus = 'locked' | 'unlocked' | 'passed' | 'failed';

export interface RoundFeedbackDetails {
  communicationScore: number;
  confidenceScore: number;
  technicalScore: number;
  resumeAuthenticityScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

export interface RoundProgress {
  roundId: string;
  roundNumber: number;
  title: string;
  status: RoundStatus;
  score?: number;
  feedback?: string;
  feedbackDetails?: RoundFeedbackDetails;
  sessionId?: string;
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

// --- DATABASE PERSISTENCE METHODS ---

export const fetchCompanyRoleProgress = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string
): Promise<CompanyRoleProgress | null> => {
  try {
    const { data, error } = await supabase
      .from('elite_prep_progress')
      .select('progress_data')
      .eq('user_id', userId)
      .eq('type_id', typeId)
      .eq('company_id', companyId)
      .eq('role_id', roleId)
      .maybeSingle();

    if (error) {
      console.error("[eliteInterviewStorage] Error fetching progress:", error);
      return null;
    }

    if (data && data.progress_data) {
      return data.progress_data as unknown as CompanyRoleProgress;
    }
    return null;
  } catch (e) {
    console.error("[eliteInterviewStorage] DB fetch exception:", e);
    return null;
  }
};

export const upsertCompanyRoleProgress = async (
  userId: string,
  progress: CompanyRoleProgress
): Promise<void> => {
  try {
    const { error } = await supabase
      .from('elite_prep_progress')
      .upsert(
        {
          user_id: userId,
          type_id: progress.typeId,
          company_id: progress.companyId,
          role_id: progress.roleId,
          progress_data: progress as any
        },
        { onConflict: 'user_id, type_id, company_id, role_id' }
      );

    if (error) {
      console.error("[eliteInterviewStorage] Error upserting progress:", error);
    }
  } catch (e) {
    console.error("[eliteInterviewStorage] DB upsert exception:", e);
  }
};

export const fetchSelectedGithubRepo = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string
): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('elite_prep_progress')
      .select('selected_github_repo')
      .eq('user_id', userId)
      .eq('type_id', typeId)
      .eq('company_id', companyId)
      .eq('role_id', roleId)
      .maybeSingle();

    if (error) {
      console.error("[eliteInterviewStorage] Error fetching github repo:", error);
      return null;
    }

    return data?.selected_github_repo || null;
  } catch (e) {
    console.error("[eliteInterviewStorage] DB fetch repo exception:", e);
    return null;
  }
};

export const saveSelectedGithubRepo = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string,
  repoName: string
): Promise<void> => {
  try {
    const { data, error } = await supabase
      .from('elite_prep_progress')
      .update({ selected_github_repo: repoName })
      .eq('user_id', userId)
      .eq('type_id', typeId)
      .eq('company_id', companyId)
      .eq('role_id', roleId)
      .select();

    if (error) {
      console.error("[eliteInterviewStorage] Error updating github repo:", error);
    } else if (!data || data.length === 0) {
      console.error("[eliteInterviewStorage] No rows matched for update!", { userId, typeId, companyId, roleId });
    }
  } catch (e) {
    console.error("[eliteInterviewStorage] DB update repo exception:", e);
  }
};

export const initializeCompanyRoleProgressAsync = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string,
  defaultRounds: { roundId: string; roundNumber: number; title: string }[]
): Promise<CompanyRoleProgress> => {
  const existing = await fetchCompanyRoleProgress(userId, typeId, companyId, roleId);
  if (existing) {
    // Ensure all rounds from default exist in DB, if definition changed (like title/number of rounds)
    // For simplicity, we just return the existing for now.
    return existing;
  }

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

  await upsertCompanyRoleProgress(userId, initial);
  return initial;
};

export const updateRoundResultAsync = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string,
  roundNumber: number,
  verdict: 'PASSED' | 'FAILED',
  feedbackReason?: string,
  score?: number,
  feedbackDetails?: RoundFeedbackDetails,
  sessionId?: string
): Promise<CompanyRoleProgress> => {
  const currentProgress = await fetchCompanyRoleProgress(userId, typeId, companyId, roleId);
  if (!currentProgress) throw new Error("No progress record found in DB");

  const updatedRounds = currentProgress.rounds.map(round => {
    if (round.roundNumber === roundNumber) {
      const isPass = verdict === 'PASSED';
      return {
        ...round,
        status: (isPass ? 'passed' : 'failed') as RoundStatus,
        score: score ?? (isPass ? 85 : 45),
        feedback: feedbackReason || (isPass ? "Passed benchmark expectations" : "Needs re-attempt"),
        feedbackDetails,
        sessionId: sessionId || round.sessionId,
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

  await upsertCompanyRoleProgress(userId, newProgress);
  return newProgress;
};

// Keep deprecated local storage methods around temporarily to prevent import breaks,
// but they shouldn't be used if we are doing DB persistence.
export const getCompanyRoleProgress = (t: string, c: string, r: string): any => null;
export const saveCompanyRoleProgress = (p: any): void => {};
export const initializeCompanyRoleProgress = (t: string, c: string, r: string, d: any): any => null;
export const updateRoundResult = (t: string, c: string, r: string, n: number, v: any, ...args: any): any => null;
