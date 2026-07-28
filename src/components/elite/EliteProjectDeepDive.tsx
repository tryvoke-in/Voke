import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { LiveStatus } from '@/types/voice';
import { CompanyItem, RoleItem, InterviewRoundDef, InterviewTypeItem } from '@/data/eliteInterviewData';
import { updateRoundResult } from '@/utils/eliteInterviewStorage';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, CheckCircle2, XCircle,
  Sparkles, ShieldCheck, User, Award, Clock,
  Volume2, Zap, Radio, MessageSquare, FileText, Subtitles,
  GitBranch, FolderCode, Check, Github, Search,
  TrendingUp, Layers, AlertTriangle, ChevronUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';

interface GitHubRepo {
  name: string;
  description: string;
  language?: string;
  summary?: string;
}

interface RoundFeedbackDetails {
  communicationScore: number;
  confidenceScore: number;
  technicalScore: number;
  resumeAuthenticityScore: number;
  strengths: string[];
  improvements: string[];
  summary: string;
}

interface EliteProjectDeepDiveProps {
  interviewType: InterviewTypeItem;
  company: CompanyItem;
  role: RoleItem;
  round: InterviewRoundDef;
  candidateProfileContext?: string;
  githubRepos?: GitHubRepo[];
  isLoadingRepos?: boolean;
  onCompleteRound: (verdict: 'PASSED' | 'FAILED') => void;
  onExit: () => void;
}

type DifficultyLevel = 'easy' | 'medium' | 'hard';

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300',
  medium: 'bg-amber-500/20 border-amber-500/40 text-amber-300',
  hard: 'bg-red-500/20 border-red-500/40 text-red-300'
};

const DIFFICULTY_DOT: Record<DifficultyLevel, string> = {
  easy: 'bg-emerald-400',
  medium: 'bg-amber-400',
  hard: 'bg-red-400'
};

const DIFFICULTY_LABEL: Record<DifficultyLevel, string> = {
  easy: '🟢 Easy',
  medium: '🟡 Medium',
  hard: '🔴 Hard'
};

export const EliteProjectDeepDive: React.FC<EliteProjectDeepDiveProps> = ({
  interviewType,
  company,
  role,
  round,
  candidateProfileContext,
  githubRepos,
  isLoadingRepos = false,
  onCompleteRound,
  onExit
}) => {
  const {
    status,
    connect,
    disconnect,
    isUserSpeaking,
    isAiSpeaking,
    volume,
    logs
  } = useGroqVoice();

  // Video & Audio state — camera is shown for realism, but no video analysis
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  // Timer
  const [duration, setDuration] = useState(0);

  // Verdict & session state
  const navigate = useNavigate();
  const [verdict, setVerdict] = useState<'PASSED' | 'FAILED' | null>(null);
  const [verdictReason, setVerdictReason] = useState<string>('');
  const [verdictScore, setVerdictScore] = useState<number>(85);
  const [isEnding, setIsEnding] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);
  const [feedbackDetails, setFeedbackDetails] = useState<RoundFeedbackDetails | null>(null);

  // Dynamic difficulty tracking
  const [currentDifficulty, setCurrentDifficulty] = useState<DifficultyLevel>('easy');
  const [weakAnswerStreak, setWeakAnswerStreak] = useState(0);

  // GitHub Project Selection (single project for Round 2)
  const availableRepos: string[] = React.useMemo(() => {
    if (githubRepos && githubRepos.length > 0) {
      return Array.from(new Set(githubRepos.map(r => r.name.trim())));
    }
    if (candidateProfileContext) {
      const matches = Array.from(candidateProfileContext.matchAll(/Project:\s*([^\n\r]+)/gi));
      if (matches.length > 0) {
        return Array.from(new Set(matches.map(m => m[1].trim())));
      }
    }
    return [];
  }, [githubRepos, candidateProfileContext]);

  const [selectedProject, setSelectedProject] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isPreInterviewSetupOpen, setIsPreInterviewSetupOpen] = useState(true);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcription
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Timer logic
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === LiveStatus.CONNECTED) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Listen for AI difficulty tokens and verdict tokens
  useEffect(() => {
    if (logs.length > 0 && !isEnding && !verdict) {
      const lastMsg = logs[logs.length - 1];
      if (lastMsg.role === 'assistant') {
        const text = lastMsg.text;

        // Difficulty tracking
        if (text.includes('[DIFFICULTY_UP]')) {
          setCurrentDifficulty(prev => prev === 'easy' ? 'medium' : 'hard');
          setWeakAnswerStreak(0);
        } else if (text.includes('[DIFFICULTY_DOWN]')) {
          setWeakAnswerStreak(s => {
            const newStreak = s + 1;
            return newStreak;
          });
          setCurrentDifficulty(prev => prev === 'hard' ? 'medium' : 'easy');
        }

        // Verdict detection
        if (text.includes('[VERDICT: PASSED]') || text.includes('[VERDICT: SELECTED]')) {
          const reasonMatch = text.match(/\[REASON:(.*?)\]/);
          const fullReason = reasonMatch ? reasonMatch[1].trim() : text.replace(/\[VERDICT:.*?\]/g, '').replace(/\[REASON:.*?\]/g, '').trim();
          handleTriggerVerdict('PASSED', fullReason);
        } else if (text.includes('[VERDICT: FAILED]') || text.includes('[VERDICT: NOT_SELECTED]')) {
          const reasonMatch = text.match(/\[REASON:(.*?)\]/);
          const fullReason = reasonMatch ? reasonMatch[1].trim() : text.replace(/\[VERDICT:.*?\]/g, '').replace(/\[REASON:.*?\]/g, '').trim();
          handleTriggerVerdict('FAILED', fullReason);
        }

        // Auto-complete after all phases done (assistant has given a long closing speech)
        const userTurns = logs.filter(l => l.role === 'user');
        const assistantTurns = logs.filter(l => l.role === 'assistant');
        const totalExpected = round.questionCount || 12;
        if (userTurns.length >= totalExpected && assistantTurns.length > totalExpected) {
          console.log('[EliteProjectDeepDive] All phases complete. Triggering final verdict...');
          const timer = setTimeout(() => {
            const userAnswerCount = userTurns.length;
            const passed = userAnswerCount >= Math.floor(totalExpected * 0.75);
            handleTriggerVerdict(
              passed ? 'PASSED' : 'FAILED',
              passed
                ? `Candidate completed all ${totalExpected} technical deep dive questions and demonstrated strong project ownership.`
                : `Candidate completed ${userAnswerCount} of ${totalExpected} questions but did not demonstrate sufficient technical depth.`
            );
          }, 6000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [logs, isEnding, verdict]);

  // Camera start
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true
      });
      setStream(mediaStream);
      setIsVideoEnabled(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
      // Record video for realism, but we won't analyze it
      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4';
        const recorder = new MediaRecorder(mediaStream, { mimeType });
        videoChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) videoChunksRef.current.push(e.data);
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
      } catch (recErr) {
        console.warn('[EliteProjectDeepDive] MediaRecorder init note:', recErr);
      }
    } catch (err) {
      console.error('[EliteProjectDeepDive] Camera error:', err);
      toast.error('Camera and microphone permissions required.');
    }
  };

  const stopCamera = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.requestData();
        }
        mediaRecorderRef.current.stop();
      } catch (e) {
        console.warn('[EliteProjectDeepDive] MediaRecorder stop note:', e);
      }
    }
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMicEnabled(!isMicEnabled);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
      disconnect();
    };
  }, []);

  // Build the project context string for the AI
  const buildProjectContext = (): string => {
    if (!selectedProject) return '';

    // Find matching repo metadata
    const repoMeta = githubRepos?.find(r => r.name.trim() === selectedProject);
    const repoDescription = repoMeta?.description || 'No description available';
    const repoLanguage = repoMeta?.language || 'Not specified';
    const repoSummary = repoMeta?.summary || '';

    // Also look for context in candidateProfileContext
    let projectContextFromProfile = '';
    if (candidateProfileContext) {
      const projectRegex = new RegExp(`Project:\\s*${selectedProject}[\\s\\S]*?(?=Project:|$)`, 'i');
      const match = candidateProfileContext.match(projectRegex);
      if (match) {
        projectContextFromProfile = match[0].trim();
      }
    }

    return `
SELECTED PROJECT FOR TECHNICAL DEEP DIVE:
Project Name: ${selectedProject}
Language / Tech Stack: ${repoLanguage}
Description: ${repoDescription}
${repoSummary ? `Summary: ${repoSummary}` : ''}
${projectContextFromProfile ? `\nDetailed Project Context from Candidate Profile:\n${projectContextFromProfile}` : ''}
`.trim();
  };

  const handleConfirmSetupAndStart = () => {
    if (!selectedProject) {
      toast.error('Please select a project to continue.');
      return;
    }
    setIsPreInterviewSetupOpen(false);
    startCamera();
    initiateSession();
  };

  const initiateSession = () => {
    const rawCleanedContext = candidateProfileContext
      ? candidateProfileContext
          .replace(/!\[.*?\]\(https?:\/\/[^\)]+\)/g, '')
          .replace(/\[https?:\/\/img\.shields\.io\/[^\]]+\]/g, '')
          .replace(/https?:\/\/img\.shields\.io\/[^\s]+/g, '')
          .replace(/\n\s*\n\s*\n/g, '\n\n')
          .trim()
      : '';

    const projectCtx = buildProjectContext();

    const isFrontend = role.title.toLowerCase().includes('frontend') || role.id.includes('frontend');
    const isBackend = role.title.toLowerCase().includes('backend') || role.id.includes('backend');

    const domainFocus = isFrontend
      ? 'Frontend: React/UI architecture, state management, component design, DOM, CSS, web performance, API integration.'
      : isBackend
      ? 'Backend: REST APIs, DB design, Node.js/Python, authentication, caching, microservices, security.'
      : 'Full Stack: Both frontend UI/state and backend APIs/databases/architecture.';

    const systemPrompt = `
ROLE: You are a Senior Technical Interviewer at ${company.name} conducting a Technical & Project Deep Dive interview.
CATEGORY: ${interviewType.title}
TARGET ROLE: ${role.title}
CURRENT ROUND: ${round.title} (Round ${round.roundNumber} of 4)
DOMAIN FOCUS: ${domainFocus}

CANDIDATE RESUME CONTEXT:
${rawCleanedContext || 'No resume context available.'}

${projectCtx}

=== STRICT PROJECT MANDATE ===
- THIS ENTIRE INTERVIEW IS ABOUT THE PROJECT: "${selectedProject}" ONLY.
- EVERY QUESTION must be based on this project specifically.
- Ask about actual implementation choices made in this project, not hypothetical scenarios.
- If the candidate says they didn't build a part, probe why and what they would do.

=== ROUND 2 INTERVIEW STRUCTURE — 5 PHASES (ADAPTIVE) ===
You will conduct approximately 12-15 questions across 5 phases. Move between phases naturally.
START at EASY difficulty.

PHASE 1 — Project Understanding (3 questions, EASY):
- "Explain the ${selectedProject} project. What problem does it solve?"
- "What was specifically your contribution to ${selectedProject}?"
- "What was the core tech stack you chose for ${selectedProject} and why?"

PHASE 2 — Technical Decisions (3 questions, MEDIUM):
- Probe specific framework/database/auth/architecture choices made in THIS project.
- e.g. "Why did you choose [detected tech] in ${selectedProject} instead of [alternative]?"
- Ask about tradeoffs they considered.

PHASE 3 — Implementation Deep Dive (3 questions, MEDIUM → HARD):
- "Walk me through the authentication flow in ${selectedProject}."
- "Explain how the frontend communicates with the backend in ${selectedProject}."
- "Describe the database schema or data model in ${selectedProject}."
- "How is state managed in ${selectedProject}? Why?"
- "Explain one specific API endpoint in detail."

PHASE 4 — Edge Cases & Debugging (3 questions, HARD):
- "What happens in ${selectedProject} if your server crashes mid-request?"
- "How do you handle race conditions if two users update the same data?"
- "How do you prevent duplicate requests in ${selectedProject}?"
- "What would you do if a core API in ${selectedProject} becomes slow?"

PHASE 5 — Scalability (3 questions, HARD):
- "How would you scale ${selectedProject} to support 1 million users?"
- "How would you reduce API latency in ${selectedProject}?"
- "How would you redesign ${selectedProject}'s database for high performance?"
- "What CI/CD or deployment improvements would you make to ${selectedProject}?"

=== DYNAMIC DIFFICULTY SYSTEM (MANDATORY) ===
After EACH candidate response, evaluate it internally:
- STRONG answer (detailed, specific, technically correct, shows real ownership) → output token [DIFFICULTY_UP] then ask harder question
- AVERAGE answer (partially correct, vague but relevant) → stay at same difficulty, no token
- WEAK answer (incorrect, evasive, "I don't know", copy-paste generic) → output token [DIFFICULTY_DOWN] then ask simpler follow-up
- TWO CONSECUTIVE [DIFFICULTY_DOWN] tokens → end the interview: output [VERDICT: FAILED] [REASON: Candidate showed insufficient technical ownership and understanding of their project.]

=== PASS/FAIL CRITERIA (75% THRESHOLD) ===
PASS requires ALL THREE:
1. Project Ownership: Candidate clearly built and understands this project (not just forked/copied)
2. Technical Reasoning: Can explain WHY specific choices were made (not just WHAT was used)
3. Architecture Understanding: Knows how the different parts of the system connect

FAIL if candidate:
- Cannot explain basic parts of their own project
- Gives 2+ consecutive weak/evasive answers
- Clearly did not build the project (cannot answer implementation questions)

At the END of Phase 5 or when criteria is clearly met/not met:
- PASS: "Thank you for the deep technical discussion on ${selectedProject}! That completes our Round 2 evaluation. Your project ownership and technical reasoning were excellent. [VERDICT: PASSED] [REASON: Candidate demonstrated strong technical ownership, clear architectural understanding, and solid decision-making across all 5 phases.]"
- FAIL: "Thank you for your time. Unfortunately, the technical depth required for this role needs further development. [VERDICT: FAILED] [REASON: Candidate struggled to demonstrate clear project ownership and technical reasoning for ${selectedProject}.]"

=== VOICE-ONLY STRICT RULES ===
- NO markdown formatting in spoken responses (no **, no #, no bullet points)
- ALL questions must be 1-2 sentences maximum
- NEVER ask candidate to write or type code — verbal explanations only
- Use short, natural transitions between questions: "Got it!", "Interesting.", "Makes sense."
- ONE focused question per turn — never compound multi-part questions
- Strip ALL tokens ([DIFFICULTY_UP], [DIFFICULTY_DOWN], [VERDICT], [REASON]) from your spoken text — only output them silently at the end of your response

=== WARM OPENING ===
Start naturally: "Hi! Welcome to Round 2 of your ${company.name} ${role.title} interview. Today we're doing a deep technical dive into your project — ${selectedProject}. Let's start simply — can you explain what ${selectedProject} does and what problem it solves?"
`;

    connect(systemPrompt);
  };

  // Evaluation — identical logic to EliteVoiceRoom Round 1
  const evaluateTranscriptPerformance = (
    aiVerdict: 'PASSED' | 'FAILED',
    aiReason?: string
  ): { finalVerdict: 'PASSED' | 'FAILED'; finalScore: number; reason: string; details: RoundFeedbackDetails } => {
    const userLogs = logs.filter(l => l.role === 'user');
    const userTexts = userLogs.map(l => l.text.trim());
    const fullTranscript = userTexts.join(' ');
    const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
    const avgWordsPerAnswer = userLogs.length > 0 ? wordCount / userLogs.length : 0;

    if (userLogs.length === 0 || fullTranscript.length === 0 || wordCount === 0) {
      return {
        finalVerdict: 'FAILED',
        finalScore: 0,
        reason: 'Interview attempt invalid as the candidate did not speak or participate.',
        details: {
          communicationScore: 0,
          confidenceScore: 0,
          technicalScore: 0,
          resumeAuthenticityScore: 0,
          strengths: ['None (No candidate responses recorded)'],
          improvements: ['No response provided during the session'],
          summary: 'Interview attempt invalid.'
        }
      };
    }

    if (userLogs.length <= 1) {
      const introScore = Math.min(10, Math.max(5, Math.round(wordCount * 0.2)));
      return {
        finalVerdict: 'FAILED',
        finalScore: introScore,
        reason: `Interview ended prematurely. Candidate answered only 1 of ${round.questionCount || 12} questions.`,
        details: {
          communicationScore: Math.min(20, introScore + 10),
          confidenceScore: Math.min(15, introScore),
          technicalScore: 0,
          resumeAuthenticityScore: 0,
          strengths: ['Candidate provided an initial spoken introduction.'],
          improvements: ['Interview ended before technical evaluation could be completed.'],
          summary: 'Interview ended prematurely.'
        }
      };
    }

    const rawAiReason = aiReason || '';
    const isAiFail = aiVerdict === 'FAILED' ||
      /gaps|lacked|struggled|lack of|insufficient|failed|cannot|inconsistencies|below|unprepared|ownership|evasive/i.test(rawAiReason);

    // Technical keywords for project deep dives
    const techKeywords = [
      ...role.skills.map(s => s.toLowerCase()),
      'react', 'javascript', 'typescript', 'api', 'rest', 'graphql', 'state', 'component',
      'hooks', 'dom', 'rendering', 'virtual dom', 'node', 'express', 'database', 'sql',
      'postgres', 'supabase', 'architecture', 'performance', 'optimization', 'async',
      'await', 'promise', 'function', 'object', 'array', 'algorithm', 'system', 'design',
      'testing', 'git', 'ci/cd', 'deployment', 'latency', 'cache', 'security', 'props',
      'schema', 'auth', 'authentication', 'scalability', 'microservice', 'docker', 'redis',
      'mongodb', 'endpoint', 'route', 'controller', 'middleware', 'fetch', 'axios', 'cors'
    ];

    const lowerTranscript = fullTranscript.toLowerCase();
    const matchedKeywords = Array.from(new Set(techKeywords.filter(kw => lowerTranscript.includes(kw))));
    const techKeywordCount = matchedKeywords.length;

    let commScore = 65;
    let techScore = 60;
    let confScore = 65;
    let authScore = 60;

    if (isAiFail) {
      commScore = Math.min(65, Math.max(40, Math.round(avgWordsPerAnswer * 1.2) + 35));
      techScore = Math.min(58, Math.max(30, techKeywordCount * 8 + 30));
      confScore = Math.min(65, Math.max(35, Math.round(wordCount / 4) + 30));
      authScore = Math.min(60, Math.max(30, techKeywordCount * 6 + 35));
    } else {
      commScore = Math.min(95, Math.max(72, Math.round(avgWordsPerAnswer * 1.5) + 50));
      techScore = Math.min(96, Math.max(70, techKeywordCount * 6 + 65));
      confScore = Math.min(95, Math.max(72, Math.round(wordCount / 5) + 60));
      authScore = Math.min(98, Math.max(75, techKeywordCount * 5 + 70));
    }

    let overallScore = Math.round(
      commScore * 0.25 +
      techScore * 0.40 +  // Higher weight for technical depth in Round 2
      confScore * 0.15 +
      authScore * 0.20    // Higher weight for project ownership in Round 2
    );

    // Round 2 uses 75% pass threshold (per spec)
    if (isAiFail) {
      overallScore = Math.min(overallScore, 69);
    } else {
      overallScore = Math.max(overallScore, 75);
    }

    const finalVerdict: 'PASSED' | 'FAILED' = isAiFail ? 'FAILED' : 'PASSED';

    const cleanReason = rawAiReason
      .replace(/\[VERDICT:.*?\]/g, '')
      .replace(/\[REASON:.*?\]/g, '')
      .replace(/\[DIFFICULTY.*?\]/g, '')
      .trim() || (isAiFail
        ? `Failed to demonstrate sufficient technical ownership of ${selectedProject} for the ${role.title} position at ${company.name}.`
        : `Passed ${company.name} technical deep dive on ${selectedProject} for ${role.title}.`
      );

    const strengths: string[] = [];
    const improvements: string[] = [];

    if (!isAiFail) {
      strengths.push(`Strong verbal articulation averaging ${Math.round(avgWordsPerAnswer)} words per technical answer.`);
      if (matchedKeywords.length > 0) {
        strengths.push(`Effective use of technical concepts: ${matchedKeywords.slice(0, 4).join(', ')}.`);
      }
      strengths.push(`Demonstrated genuine project ownership and implementation knowledge of ${selectedProject}.`);
      strengths.push('Showed clear architectural reasoning and decision-making throughout the deep dive.');
      improvements.push('Practice explaining scalability tradeoffs with concrete numbers (e.g., latency targets, throughput goals).');
      improvements.push('When discussing architecture, use the C4 model or similar structure to be more precise.');
    } else {
      strengths.push('Showed willingness to engage with technical questions.');
      strengths.push('Completed the technical deep dive session.');
      improvements.push(`Review the core architecture and implementation details of ${selectedProject} thoroughly.`);
      improvements.push('Practice explaining your projects using the STAR+T format: Situation, Task, Action, Result, Tech choices.');
      improvements.push('Be specific about WHY you chose each technology — not just what you used.');
    }

    return {
      finalVerdict,
      finalScore: overallScore,
      reason: cleanReason,
      details: {
        communicationScore: commScore,
        confidenceScore: confScore,
        technicalScore: techScore,
        resumeAuthenticityScore: authScore,
        strengths,
        improvements,
        summary: cleanReason
      }
    };
  };

  const handleTriggerVerdict = async (initialResult: 'PASSED' | 'FAILED', reason?: string) => {
    window.speechSynthesis.cancel();
    disconnect();
    stopCamera();
    setIsEnding(true);

    let evaluation = evaluateTranscriptPerformance(initialResult, reason);

    setVerdict(evaluation.finalVerdict);
    setVerdictReason(evaluation.reason);
    setVerdictScore(evaluation.finalScore);
    setFeedbackDetails(evaluation.details);

    let newSessionId: string | null = null;
    let evalReportData: any = null;

    try {
      const messages = logs.map(l => ({
        role: l.role === 'assistant' ? 'assistant' : 'user',
        content: l.text
      }));

      // NOTE: No video analysis for Round 2 (voice-only round by design)
      // Camera window is shown for professionalism, but no analyze-video-interview call

      // Call evaluate-interview edge function — EXACT SAME as Round 1
      console.log('[EliteProjectDeepDive] Calling evaluate-interview edge function...');
      const { data: evalReport } = await supabase.functions.invoke('evaluate-interview', {
        body: {
          messages,
          interview_type: `Elite Interview Round 2 — ${company.name} - ${role.title} (Technical & Project Deep Dive: ${selectedProject})`
        }
      });

      evalReportData = evalReport;

      if (evalReport && evalReport.score !== undefined) {
        console.log('[EliteProjectDeepDive] AI Evaluation complete:', evalReport);
        const userLogsCount = logs.filter(l => l.role === 'user').length;
        const completionRatio = Math.min(1, userLogsCount / Math.max(1, round.questionCount || 12));
        const isNoUserSpeech = userLogsCount === 0 || logs.filter(l => l.role === 'user').map(l => l.text.trim()).join('').length === 0;

        let finalScore = isNoUserSpeech ? 0 : (evalReport.score !== undefined ? evalReport.score : evaluation.finalScore);

        if (userLogsCount <= 1 && !isNoUserSpeech) {
          finalScore = Math.min(10, finalScore);
        } else if (completionRatio < 0.9 && !isNoUserSpeech) {
          finalScore = Math.min(Math.round(completionRatio * 100), Math.round(finalScore * completionRatio));
        }

        // Round 2 uses 75% pass threshold
        const finalVerdict = finalScore >= 75 ? 'PASSED' : 'FAILED';

        evaluation = {
          finalVerdict,
          finalScore,
          reason: evalReport.feedback || evaluation.reason,
          details: {
            communicationScore: isNoUserSpeech ? 0 : Math.round((evalReport.metrics?.communication || evaluation.details.communicationScore) * completionRatio),
            confidenceScore: isNoUserSpeech ? 0 : Math.round((evalReport.metrics?.problem_solving || evaluation.details.confidenceScore) * completionRatio),
            technicalScore: isNoUserSpeech ? 0 : Math.round((evalReport.metrics?.technical_accuracy || evaluation.details.technicalScore) * completionRatio),
            resumeAuthenticityScore: isNoUserSpeech ? 0 : Math.round((evaluation.details.resumeAuthenticityScore || 50) * completionRatio),
            strengths: evalReport.strengths || evaluation.details.strengths,
            improvements: evalReport.weaknesses || evaluation.details.improvements,
            summary: evalReport.feedback || evaluation.details.summary
          }
        };

        setVerdict(evaluation.finalVerdict);
        setVerdictReason(evaluation.reason);
        setVerdictScore(evaluation.finalScore);
        setFeedbackDetails(evaluation.details);
      }
    } catch (err) {
      console.error('[EliteProjectDeepDive] Evaluation pipeline error:', err);
    }

    // Save session to interview_sessions (same schema as Round 1)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: dbSession, error: dbError } = await supabase
          .from('interview_sessions')
          .insert({
            user_id: user.id,
            role: `${company.name} - ${role.title} (${round.title}: ${selectedProject})`,
            time_limit_minutes: Math.ceil(duration / 60) || 1,
            status: 'completed',
            interview_type: 'elite_interview',
            total_duration_seconds: duration,
            overall_score: evaluation.finalScore,
            delivery_score: evaluation.details.communicationScore,
            confidence_score: evaluation.details.technicalScore,
            feedback_summary: evaluation.reason,
            whats_good: evaluation.details.strengths,
            whats_wrong: evaluation.details.improvements,
            analysis_result: {
              ...(evalReportData || evaluation),
              transcript: logs,
              selected_project: selectedProject,
              round_number: round.roundNumber,
              final_difficulty: currentDifficulty,
              six_q_score: evalReportData?.six_q_score || null,
              personality_cluster: evalReportData?.personality_cluster || null
            },
            created_at: new Date().toISOString()
          } as any)
          .select('id')
          .single();

        if (dbError) {
          console.error('[EliteProjectDeepDive] DB insert error:', dbError);
        } else if (dbSession) {
          newSessionId = dbSession.id;
          setSavedSessionId(newSessionId);
        }
      }
    } catch (dbErr) {
      console.error('[EliteProjectDeepDive] Failed to save session:', dbErr);
    }

    // Update local round progress
    updateRoundResult(
      interviewType.id,
      company.id,
      role.id,
      round.roundNumber,
      evaluation.finalVerdict,
      evaluation.reason,
      evaluation.finalScore,
      evaluation.details,
      newSessionId || undefined
    );

    // Navigate to results
    if (newSessionId) {
      navigate(`/voice-interview/results/${newSessionId}?from=elite`);
    } else {
      onCompleteRound(evaluation.finalVerdict);
    }
  };

  const handleManualEndSession = () => {
    setIsEnding(true);
    const userMsgCount = logs.filter(l => l.role === 'user').length;
    const totalQ = round.questionCount || 12;
    const passed = userMsgCount >= Math.floor(totalQ * 0.75);
    handleTriggerVerdict(
      passed ? 'PASSED' : 'FAILED',
      passed ? 'Candidate completed sufficient phases of the technical deep dive.' : 'Interview ended early before technical evaluation bar was satisfied.'
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredRepos = availableRepos.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-screen w-screen bg-[#050508] text-white flex flex-col overflow-hidden font-sans relative select-none">

      {/* PRE-INTERVIEW MODAL — Single Project Selection */}
      {isPreInterviewSetupOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-text">
          <div className="bg-[#0a0b12]/95 border border-white/10 backdrop-blur-2xl rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative overflow-hidden space-y-5">

            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-4">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 flex items-center justify-center text-violet-400 shrink-0">
                  <Layers className="w-5 h-5 text-violet-400" />
                </div>
                <div>
                  <h2 className="text-lg font-extrabold text-white tracking-tight">
                    Select Project for Technical Deep Dive
                  </h2>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Choose ONE GitHub project — the AI will grill you specifically on this project
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2.5 bg-[#121422] border border-white/10 px-3 py-1.5 rounded-xl self-start sm:self-auto shrink-0">
                <div className="w-6 h-6 rounded-lg bg-white p-0.5 border border-zinc-200 overflow-hidden shrink-0 flex items-center justify-center">
                  <img
                    src={company.logo}
                    alt={company.name}
                    onError={(e) => {
                      e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=18181b&color=fff&size=64`;
                    }}
                    className="w-full h-full object-contain"
                  />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-white leading-tight">{company.name}</span>
                  <span className="text-[10px] text-violet-400 font-semibold leading-tight">{role.title}</span>
                </div>
              </div>
            </div>

            {/* Round Info Banner */}
            <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <div className="text-xs text-zinc-300 leading-relaxed">
                <span className="font-bold text-amber-300">Round 2 — Technical & Project Deep Dive.</span>{' '}
                The AI interviewer will ask 12–15 adaptive questions across 5 phases: Project Understanding → Technical Decisions → Implementation → Edge Cases → Scalability.
                Difficulty escalates in real-time based on your answers.
              </div>
            </div>

            {/* Repos Section */}
            <div className="space-y-3 flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between text-xs font-medium text-zinc-400 px-1">
                <span className="flex items-center gap-1.5 text-zinc-200 font-bold">
                  <FolderCode className="w-4 h-4 text-violet-400" />
                  Your GitHub Repositories ({availableRepos.length} available)
                </span>
                <span className="text-[10px] text-zinc-500">Pick exactly one</span>
              </div>

              {/* Search */}
              {availableRepos.length > 4 && (
                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search repositories..."
                    className="w-full bg-[#121422] border border-white/10 rounded-xl pl-9 pr-3.5 py-2 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-violet-500/60 transition-colors"
                  />
                </div>
              )}

              {/* Repos Grid */}
              {isLoadingRepos ? (
                <div className="p-8 rounded-2xl bg-[#121422]/60 border border-white/10 text-center space-y-4 flex flex-col items-center justify-center min-h-[220px]">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-violet-500/30 border-t-violet-500 animate-spin" />
                    <Sparkles className="w-4 h-4 text-violet-400 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">Fetching Your GitHub Repositories...</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">Querying GitHub API for your projects...</p>
                  </div>
                </div>
              ) : availableRepos.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121422]/70 border border-white/10 text-center space-y-3 flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">No GitHub Repositories Found</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto">
                      Connect your GitHub account in your Profile to enable project-based technical interviews.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      const { error } = await supabase.auth.signInWithOAuth({
                        provider: 'github',
                        options: {
                          scopes: 'read:user repo read:org',
                          redirectTo: `${window.location.origin}/elite-prep`
                        }
                      });
                      if (error) toast.error(error.message);
                    }}
                    className="px-4 py-2.5 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs inline-flex items-center gap-2 shadow-lg shadow-violet-600/20 cursor-pointer transition-all transform hover:scale-[1.02]"
                  >
                    <Github className="w-4 h-4" /> Connect GitHub Account
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[38vh] overflow-y-auto pr-1 flex-1">
                  {filteredRepos.map((repo) => {
                    const isSelected = selectedProject === repo;
                    const repoMeta = githubRepos?.find(r => r.name.trim() === repo);
                    return (
                      <div
                        key={repo}
                        onClick={() => setSelectedProject(repo)}
                        className={`group p-3.5 rounded-xl border cursor-pointer transition-all duration-150 flex flex-col justify-between relative ${
                          isSelected
                            ? 'bg-[#141628] border-violet-500/50 shadow-md shadow-violet-500/10 ring-1 ring-violet-500/20'
                            : 'bg-[#0d0e17]/80 border-white/5 hover:border-white/15 hover:bg-[#121422]/60 opacity-70 hover:opacity-100'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div className="flex items-center gap-2.5">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold transition-all shrink-0 ${
                              isSelected
                                ? 'bg-violet-500 text-white shadow-sm shadow-violet-500/20'
                                : 'bg-zinc-800 text-zinc-500 group-hover:text-zinc-300'
                            }`}>
                              {isSelected ? <Check className="w-3.5 h-3.5 text-white stroke-[3]" /> : <GitBranch className="w-3.5 h-3.5 text-zinc-500" />}
                            </div>
                            <div>
                              <h4 className="text-xs font-bold text-white tracking-tight group-hover:text-violet-300 transition-colors">{repo}</h4>
                              {repoMeta?.language && (
                                <span className="text-[9px] font-mono text-zinc-400 bg-zinc-900 px-1.5 py-0.5 rounded border border-white/5 inline-block mt-0.5">
                                  {repoMeta.language}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {repoMeta?.description && (
                          <p className="text-[10px] text-zinc-500 line-clamp-2 mb-2">{repoMeta.description}</p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-white/5 text-[10px]">
                          <span className="text-zinc-500 font-medium">Deep Dive Target</span>
                          <span className={`font-bold ${isSelected ? 'text-violet-400' : 'text-zinc-600'}`}>
                            {isSelected ? '✓ Selected' : 'Tap to Select'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* CTA */}
            <div className="pt-2 border-t border-white/10">
              <Button
                onClick={handleConfirmSetupAndStart}
                disabled={!selectedProject || isLoadingRepos}
                className={`w-full h-12 rounded-xl font-extrabold text-xs tracking-wide shadow-lg transition-all cursor-pointer flex items-center justify-center gap-2 ${
                  selectedProject
                    ? 'bg-violet-600 hover:bg-violet-500 text-white shadow-violet-600/20'
                    : 'bg-zinc-800 text-zinc-500 cursor-not-allowed'
                }`}
              >
                {selectedProject ? (
                  <>
                    <Zap className="w-4 h-4" />
                    Start Technical Deep Dive — {selectedProject}
                  </>
                ) : (
                  'Select a project to continue'
                )}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TOP HUD BAR */}
      <header className="h-16 border-b border-white/10 bg-zinc-950/80 backdrop-blur-2xl px-6 flex items-center justify-between z-20 shrink-0 shadow-2xl">
        {/* Left: Company & Role */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
            <img
              src={company.logo}
              alt={company.name}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=18181b&color=fff&size=64`;
              }}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-white tracking-wide">{company.name}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-bold text-violet-400">{role.title}</span>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] py-0.5 font-semibold">
                {interviewType.title}
              </Badge>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono mt-0.5">
              {round.title} {selectedProject ? `— ${selectedProject}` : ''}
            </div>
          </div>
        </div>

        {/* Center: Dynamic Difficulty Pill */}
        <div className="hidden md:flex items-center gap-3">
          <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold border ${DIFFICULTY_COLORS[currentDifficulty]} transition-all duration-500`}>
            <span className={`w-2 h-2 rounded-full ${DIFFICULTY_DOT[currentDifficulty]} animate-pulse`} />
            {DIFFICULTY_LABEL[currentDifficulty]}
          </div>
          {status === LiveStatus.CONNECTED && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-extrabold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{formatTime(duration)}</span>
            </div>
          )}
        </div>

        {/* Right: End Interview */}
        <div className="flex items-center gap-3">
          <Button
            variant="destructive"
            size="sm"
            onClick={handleManualEndSession}
            disabled={isEnding}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl text-xs px-4 h-9 shadow-lg shadow-red-600/20"
          >
            <PhoneOff className="w-3.5 h-3.5 mr-1.5" /> End Interview
          </Button>
        </div>
      </header>

      {/* MAIN WORKSPACE */}
      <main className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 bg-[#050508] relative overflow-hidden">

        {/* LEFT: AI ORB STAGE */}
        <div className="flex-1 flex flex-col relative min-h-0 h-full">
          <div className="flex-1 relative rounded-3xl bg-zinc-950 border border-white/15 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 group h-full">
            {/* Ambient Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />

            {/* AI Audio Visualizer */}
            <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 flex items-center justify-center my-auto">
              <AudioVisualizer
                isUserSpeaking={isUserSpeaking}
                isAiSpeaking={isAiSpeaking}
                volume={volume}
              />
            </div>

            {/* AI Badge */}
            <div className="absolute top-5 left-5 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-white/15 shadow-xl">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">{company.name} Senior Technical Interviewer</div>
                <div className="text-[10px] text-zinc-400 font-mono">Project Deep Dive — Round 2</div>
              </div>
            </div>

            {/* Candidate Video PIP — camera shown for professionalism, no analysis */}
            <div className="absolute top-5 right-5 z-20 w-64 md:w-76 lg:w-84 aspect-video rounded-2xl bg-zinc-900 border-2 border-white/20 overflow-hidden shadow-2xl ring-1 ring-white/10">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 text-xs font-semibold">
                  <VideoOff className="w-6 h-6 mb-1 text-zinc-600" />
                  <span>Camera Off</span>
                </div>
              )}
              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-extrabold text-white flex items-center gap-1.5 shadow-md">
                <span className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-zinc-400'}`} />
                <span>You (Candidate)</span>
              </div>
            </div>

            {/* Status Pill */}
            <div className="absolute bottom-5 left-5 z-20 hidden lg:flex items-center gap-2">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-lg ${
                isAiSpeaking
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                  : isUserSpeaking
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-zinc-900/90 border-white/10 text-zinc-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-amber-400 animate-ping' : isUserSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                {isAiSpeaking ? 'AI Speaking...' : isUserSpeaking ? 'Listening to Candidate...' : 'Voice Connected'}
              </div>
            </div>

            {/* Control Navbar */}
            <div className="absolute bottom-5 left-1/2 sm:left-[55%] md:left-[58%] -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-3 rounded-full bg-zinc-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl ring-1 ring-white/10 pointer-events-auto">
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  isMicEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white shadow-md'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isMicEnabled ? 'Mute Microphone' : 'Unmute Microphone'}
              >
                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  isVideoEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white shadow-md'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isVideoEnabled ? 'Turn Off Camera' : 'Turn On Camera'}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-400" />}
              </button>

              {/* Transcription Toggle */}
              <button
                onClick={() => setShowTranscription(!showTranscription)}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  showTranscription
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                }`}
                title="Toggle Live Speech Transcription"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/15" />

              {/* End Call */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleManualEndSession}
                disabled={isEnding}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-full px-5 h-11 text-xs shadow-lg shadow-red-600/30"
              >
                <PhoneOff className="w-4 h-4 mr-2" /> End Interview
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT: TRANSCRIPTION PANEL */}
        {showTranscription && (
          <div className="w-full md:w-96 lg:w-[420px] bg-zinc-950/90 backdrop-blur-2xl rounded-3xl border border-white/15 flex flex-col shrink-0 min-h-0 shadow-2xl overflow-hidden h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Live Transcript</h4>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400">Real-time</Badge>
                {selectedProject && (
                  <span className="text-[10px] text-violet-400 font-bold bg-violet-500/10 border border-violet-500/20 px-2 py-0.5 rounded-full">
                    {selectedProject}
                  </span>
                )}
              </div>
            </div>

            {/* Logs */}
            <ScrollArea className="flex-1 p-4 space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-24 text-zinc-600 space-y-2">
                  <Sparkles className="w-6 h-6 mx-auto text-amber-500/40 animate-pulse" />
                  <p className="text-xs font-semibold text-zinc-500">Live speech transcript will appear here as the interview progresses...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex gap-3 ${log.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        log.role === 'assistant' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      }`}>
                        {log.role === 'assistant' ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] border shadow-md ${
                        log.role === 'assistant'
                          ? 'bg-zinc-900 text-zinc-200 border-white/10'
                          : 'bg-violet-950/50 text-violet-200 border-violet-500/30'
                      }`}>
                        <div className="text-[10px] font-bold mb-1 opacity-70">
                          {log.role === 'assistant' ? `${company.name} Technical Lead` : 'You (Candidate)'}
                        </div>
                        {log.text
                          .replace(/\[DIFFICULTY_UP\]/g, '')
                          .replace(/\[DIFFICULTY_DOWN\]/g, '')
                          .replace(/\[VERDICT:.*?\]/g, '')
                          .replace(/\[REASON:.*?\]/g, '')
                          .trim()}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>
          </div>
        )}
      </main>
    </div>
  );
};
