export interface JobInterviewContext {
  jobTitle: string;
  companyName: string;
  jobDescription?: string;
  skillsRequired?: string[];
  skillGaps?: Array<{ skill: string; priority?: string; estimated_time?: string } | string>;
  matchRationale?: string[];
  recommendationId?: string;
  matchScore?: number;
}
