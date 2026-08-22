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

export const saveSelectedType = (typeId: string | null) => {
  if (typeId) {
    localStorage.setItem(SELECTED_TYPE_KEY, typeId);
  } else {
    localStorage.removeItem(SELECTED_TYPE_KEY);
  }
};

export const getSelectedType = (): string | null => {
  return localStorage.getItem(SELECTED_TYPE_KEY);
};

export const saveSelectedRole = (roleId: string | null) => {
  if (roleId) {
    localStorage.setItem(SELECTED_ROLE_KEY, roleId);
  } else {
    localStorage.removeItem(SELECTED_ROLE_KEY);
  }
};

export const getSelectedRole = (): string | null => {
  return localStorage.getItem(SELECTED_ROLE_KEY);
};

export const saveSelectedCompany = (companyId: string | null) => {
  if (companyId) {
    localStorage.setItem(SELECTED_COMPANY_KEY, companyId);
  } else {
    localStorage.removeItem(SELECTED_COMPANY_KEY);
  }
};

export const getSelectedCompany = (): string | null => {
  return localStorage.getItem(SELECTED_COMPANY_KEY);
};

export const clearEliteSelections = () => {
  localStorage.removeItem(SELECTED_TYPE_KEY);
  localStorage.removeItem(SELECTED_ROLE_KEY);
  localStorage.removeItem(SELECTED_COMPANY_KEY);
};

// --- DATABASE PERSISTENCE METHODS ---

export const fetchCompanyRoleProgress = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string
): Promise<CompanyRoleProgress | null> => {
  const localKey = `${STORAGE_KEY_PREFIX}${typeId}_${companyId}_${roleId}`;
  
  if (!userId || userId === 'guest_user') {
    try {
      const stored = localStorage.getItem(localKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }

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
      console.warn("[eliteInterviewStorage] DB fetch error, checking local storage:", error.message);
      const stored = localStorage.getItem(localKey);
      return stored ? JSON.parse(stored) : null;
    }

    if (data && data.progress_data) {
      const prog = data.progress_data as unknown as CompanyRoleProgress;
      try {
        localStorage.setItem(localKey, JSON.stringify(prog));
      } catch {}
      return prog;
    }

    // Check local fallback
    const stored = localStorage.getItem(localKey);
    return stored ? JSON.parse(stored) : null;
  } catch (e) {
    console.warn("[eliteInterviewStorage] DB fetch exception, fallback to localStorage:", e);
    try {
      const stored = localStorage.getItem(localKey);
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  }
};

export const upsertCompanyRoleProgress = async (
  userId: string,
  progress: CompanyRoleProgress
): Promise<void> => {
  const localKey = `${STORAGE_KEY_PREFIX}${progress.typeId}_${progress.companyId}_${progress.roleId}`;
  try {
    localStorage.setItem(localKey, JSON.stringify(progress));
  } catch {}

  if (!userId || userId === 'guest_user') return;

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
      console.warn("[eliteInterviewStorage] DB upsert warning:", error.message);
    }
  } catch (e) {
    console.warn("[eliteInterviewStorage] DB upsert exception:", e);
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

// --- FINAL RECOMMENDATION ENGINE ---

export type FinalHiringDecision = 'Strong Hire' | 'Hire' | 'Hold / Review' | 'Reject';

export interface FinalRecommendation {
  overallScore: number;
  decision: FinalHiringDecision;
  decisionBadgeColor: string;
  decisionDescription: string;
  isHardRejected: boolean;
  hardRejectionReason?: string;
  weightedBreakdown: {
    roundNumber: number;
    title: string;
    weightPercent: number;
    rawScore: number;
    weightedContribution: number;
    status: RoundStatus;
  }[];
  strengths: string[];
  improvements: string[];
  recommendedResources: {
    title: string;
    category: string;
    url?: string;
    description: string;
  }[];
}

export const ROUND_WEIGHTS: Record<number, number> = {
  1: 0.20, // Resume & Intro: 20%
  2: 0.35, // Project Discussion: 35%
  3: 0.35, // Coding Assessment: 35%
  4: 0.10  // HR & Behavioral: 10%
};

export const computeFinalRecommendation = (
  progress: CompanyRoleProgress,
  hardRejectionFlag?: { triggered: boolean; reason: string }
): FinalRecommendation => {
  let totalWeightedScore = 0;
  let totalCalculatedWeight = 0;
  const allStrengths: string[] = [];
  const allImprovements: string[] = [];

  const breakdown = progress.rounds.map(r => {
    const weight = ROUND_WEIGHTS[r.roundNumber] || 0.25;
    const rawScore = r.score ?? (r.status === 'passed' ? 85 : 0);
    const weightedContribution = Math.round(rawScore * weight);

    if (r.status === 'passed' || r.status === 'failed') {
      totalWeightedScore += weightedContribution;
      totalCalculatedWeight += weight;
    }

    if (r.feedbackDetails?.strengths) {
      allStrengths.push(...r.feedbackDetails.strengths);
    }
    if (r.feedbackDetails?.improvements) {
      allImprovements.push(...r.feedbackDetails.improvements);
    }

    return {
      roundNumber: r.roundNumber,
      title: r.title,
      weightPercent: Math.round(weight * 100),
      rawScore,
      weightedContribution,
      status: r.status
    };
  });

  const normalizedOverallScore = totalCalculatedWeight > 0
    ? Math.round((totalWeightedScore / totalCalculatedWeight))
    : 0;

  // Evaluate Decision Bands
  let decision: FinalHiringDecision = 'Reject';
  let decisionBadgeColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
  let decisionDescription = 'Performance below hiring threshold. Needs further technical and problem-solving preparation.';

  if (normalizedOverallScore >= 85) {
    decision = 'Strong Hire';
    decisionBadgeColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    decisionDescription = 'Outstanding technical aptitude, problem solving, system intuition, and communication.';
  } else if (normalizedOverallScore >= 75) {
    decision = 'Hire';
    decisionBadgeColor = 'bg-blue-500/10 border-blue-500/30 text-blue-400';
    decisionDescription = 'Solid technical capability meeting company benchmarks. Recommended for internship placement.';
  } else if (normalizedOverallScore >= 65) {
    decision = 'Hold / Review';
    decisionBadgeColor = 'bg-amber-500/10 border-amber-500/30 text-amber-400';
    decisionDescription = 'Borderline performance with strong potential. Committee review or follow-up challenge recommended.';
  } else {
    decision = 'Reject';
    decisionBadgeColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    decisionDescription = 'Did not meet the core engineering and problem-solving benchmarks for this role.';
  }

  // Check Hard Rejection Rules
  let isHardRejected = false;
  let hardRejectionReason: string | undefined;

  if (hardRejectionFlag?.triggered) {
    isHardRejected = true;
    hardRejectionReason = hardRejectionFlag.reason;
    decision = 'Reject';
    decisionBadgeColor = 'bg-rose-500/10 border-rose-500/30 text-rose-400';
    decisionDescription = `Hard Rejection Triggered: ${hardRejectionFlag.reason}`;
  }

  // Role-specific recommended resources
  const recommendedResources = [
    {
      title: 'NeetCode 150 & Two-Pointers Patterns',
      category: 'Data Structures & Algorithms',
      description: 'Master core patterns in sliding window, two pointers, and hash maps.'
    },
    {
      title: 'System Design Interview – Alex Xu',
      category: 'System Architecture',
      description: 'Fundamental architectures for rate limiters, caching, and state flow.'
    },
    {
      title: 'Clean Code & JavaScript/TypeScript Deep Dive',
      category: 'Code Quality',
      description: 'Idiomatic patterns, error handling, and modular component architecture.'
    }
  ];

  return {
    overallScore: normalizedOverallScore,
    decision,
    decisionBadgeColor,
    decisionDescription,
    isHardRejected,
    hardRejectionReason,
    weightedBreakdown: breakdown,
    strengths: Array.from(new Set(allStrengths)).slice(0, 5),
    improvements: Array.from(new Set(allImprovements)).slice(0, 5),
    recommendedResources
  };
};

// --- DEV TOOL TESTING UTILITIES ---
export const DEV_UNLOCK_ALL_KEY = 'voke_dev_unlock_all_rounds';

export const isDevUnlockAllActive = (): boolean => {
  try {
    return localStorage.getItem(DEV_UNLOCK_ALL_KEY) === 'true';
  } catch {
    return false;
  }
};

export const setDevUnlockAllActive = (active: boolean): void => {
  try {
    if (active) {
      localStorage.setItem(DEV_UNLOCK_ALL_KEY, 'true');
    } else {
      localStorage.removeItem(DEV_UNLOCK_ALL_KEY);
    }
    window.dispatchEvent(new Event('voke-dev-unlock-change'));
  } catch (e) {
    console.warn('[eliteInterviewStorage] Error setting dev unlock:', e);
  }
};

export const devPassAllRoundsAsync = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string,
  roundsDef?: { roundId: string; roundNumber: number; title: string }[]
): Promise<CompanyRoleProgress> => {
  const current = await fetchCompanyRoleProgress(userId, typeId, companyId, roleId);
  const baseRounds = current?.rounds || (roundsDef || []).map((r) => ({
    roundId: r.roundId,
    roundNumber: r.roundNumber,
    title: r.title,
    status: 'unlocked' as RoundStatus,
    attempts: 1
  }));

  const passedRounds: RoundProgress[] = baseRounds.map((r, i) => ({
    ...r,
    status: 'passed' as RoundStatus,
    score: [88, 92, 85, 90][i] || 88,
    feedback: `Dev benchmark verification passed for Round ${r.roundNumber}`,
    feedbackDetails: {
      communicationScore: 90,
      confidenceScore: 88,
      technicalScore: 92,
      resumeAuthenticityScore: 95,
      strengths: ['Clear algorithmic articulation', 'Deep system intuition', 'Effective problem decomposition'],
      improvements: ['Consider asynchronous boundary safety in high-load scenarios'],
      summary: 'Candidate demonstrated exemplary mastery meeting FAANG high-bar criteria.'
    },
    attempts: Math.max(1, r.attempts || 1),
    completedAt: new Date().toISOString()
  }));

  const updatedProg: CompanyRoleProgress = {
    typeId,
    companyId,
    roleId,
    currentRoundNumber: 4,
    rounds: passedRounds,
    lastUpdated: new Date().toISOString()
  };

  await upsertCompanyRoleProgress(userId, updatedProg);
  window.dispatchEvent(new Event('voke-dev-unlock-change'));
  return updatedProg;
};

export const devResetPipelineProgressAsync = async (
  userId: string,
  typeId: string,
  companyId: string,
  roleId: string,
  roundsDef: { roundId: string; roundNumber: number; title: string }[]
): Promise<CompanyRoleProgress> => {
  const resetRounds: RoundProgress[] = roundsDef.map((r, idx) => ({
    roundId: r.roundId,
    roundNumber: r.roundNumber,
    title: r.title,
    status: idx === 0 ? 'unlocked' : 'locked',
    attempts: 0
  }));

  const resetProg: CompanyRoleProgress = {
    typeId,
    companyId,
    roleId,
    currentRoundNumber: 1,
    rounds: resetRounds,
    lastUpdated: new Date().toISOString()
  };

  await upsertCompanyRoleProgress(userId, resetProg);
  window.dispatchEvent(new Event('voke-dev-unlock-change'));
  return resetProg;
};

// Deprecated fallback methods for backwards compatibility
export const getCompanyRoleProgress = (t: string, c: string, r: string): any => null;
export const saveCompanyRoleProgress = (p: any): void => {};
export const initializeCompanyRoleProgress = (t: string, c: string, r: string, d: any): any => null;
export const updateRoundResult = (t: string, c: string, r: string, n: number, v: any, ...args: any): any => null;
