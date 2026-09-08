import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { useAntiCheat } from '@/hooks/useAntiCheat';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { LiveStatus } from '@/types/voice';
import { CompanyItem, RoleItem, InterviewRoundDef, InterviewTypeItem } from '@/data/eliteInterviewData';
import { updateRoundResultAsync, saveSelectedGithubRepo, fetchSelectedGithubRepo } from '@/utils/eliteInterviewStorage';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, CheckCircle2, XCircle,
  Sparkles, HelpCircle, ShieldCheck, ChevronRight, User, Award, Clock,
  Volume2, Maximize2, Zap, Radio, MessageSquare, FileText, Subtitles,
  GitBranch, FolderCode, Check, Github, Plus, RefreshCw, AlertCircle, Link2, ExternalLink, ArrowLeft
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import { JobInterviewContext } from '@/types/jobInterview';
import {
  extractGithubUsername,
  fetchUserGithubRepos,
  getCachedGithubRepos,
  saveCustomRepo,
  GitHubRepoItem
} from '@/utils/profileContext';

interface EliteVoiceRoomProps {
  interviewType: InterviewTypeItem;
  company: CompanyItem;
  role: RoleItem;
  round: InterviewRoundDef;
  candidateProfileContext?: string;
  githubRepos?: { name: string; description: string; language?: string; summary?: string }[];
  isLoadingRepos?: boolean;
  userId: string;
  jobInterviewContext?: JobInterviewContext;
  onCompleteRound: (verdict: 'PASSED' | 'FAILED') => void;
  onExit: () => void;
}

export const EliteVoiceRoom: React.FC<EliteVoiceRoomProps> = ({
  interviewType,
  company,
  role,
  round,
  candidateProfileContext,
  githubRepos,
  isLoadingRepos = false,
  userId,
  jobInterviewContext,
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
    logs,
    apiLabel
  } = useGroqVoice();
  const { violationCount, AntiCheatOverlay } = useAntiCheat({
    onTerminate: () => {
      disconnect();
      onCompleteRound('FAILED');
    }
  });

  // Video & Audio state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Active AI Engine & API Key info
  const [activeApiInfo, setActiveApiInfo] = useState<{
    provider: string;
    model: string;
    keyLabel: string;
    isFallbackKey: boolean;
  }>({
    provider: "Google Gemini REST API",
    model: "gemini-2.0-flash-lite",
    keyLabel: "Primary GOOGLE_API_KEY",
    isFallbackKey: false
  });

  // Timer & Question Counter
  const [duration, setDuration] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const totalQuestions = round.questionCount || 9;

  // Verdict state
  const navigate = useNavigate();
  const [verdict, setVerdict] = useState<'PASSED' | 'FAILED' | null>(null);
  const [verdictReason, setVerdictReason] = useState<string>('');
  const [verdictScore, setVerdictScore] = useState<number>(85);
  const [isEnding, setIsEnding] = useState(false);
  const [savedSessionId, setSavedSessionId] = useState<string | null>(null);

  // Target Repository Selection State (Dynamically loaded from Candidate's Profile + Live Fetch + Manual Cache)
  const [customRepoList, setCustomRepoList] = useState<GitHubRepoItem[]>(() => {
    if (githubRepos && githubRepos.length > 0) return githubRepos as GitHubRepoItem[];
    return getCachedGithubRepos();
  });

  const [githubUsernameInput, setGithubUsernameInput] = useState<string>(() => {
    if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
      return localStorage.getItem('voke_github_username') || '';
    }
    return '';
  });

  const [isFetchingRepos, setIsFetchingRepos] = useState(false);
  const [manualProjectInput, setManualProjectInput] = useState('');
  const [manualProjectTech, setManualProjectTech] = useState('');
  const [showManualAdd, setShowManualAdd] = useState(false);
  const [oauthLoading, setOauthLoading] = useState(false);

  // Sync customRepoList whenever parent passes new githubRepos
  useEffect(() => {
    if (githubRepos && githubRepos.length > 0) {
      setCustomRepoList(githubRepos as GitHubRepoItem[]);
    }
  }, [githubRepos]);

  const availableRepoOptions = React.useMemo(() => {
    const combined: string[] = [];
    if (customRepoList.length > 0) {
      combined.push(...customRepoList.map(r => r.name.trim()));
    }
    if (githubRepos && githubRepos.length > 0) {
      combined.push(...githubRepos.map(r => r.name.trim()));
    }
    if (candidateProfileContext) {
      const matches = Array.from(candidateProfileContext.matchAll(/Project:\s*([^\n\r]+)/gi));
      if (matches.length > 0) {
        combined.push(...matches.map(m => m[1].trim()));
      }
    }
    // Check cached repos in localStorage as fallback
    const cached = getCachedGithubRepos();
    if (cached.length > 0) {
      combined.push(...cached.map(c => c.name.trim()));
    }
    return Array.from(new Set(combined.filter(Boolean)));
  }, [customRepoList, githubRepos, candidateProfileContext]);

  const [selectedRepos, setSelectedRepos] = useState<string[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Auto-fill username from candidateProfileContext or DB if input is empty
  useEffect(() => {
    if (!githubUsernameInput && candidateProfileContext) {
      const match = candidateProfileContext.match(/github\.com\/([^\s\n\r/]+)/i);
      if (match && match[1]) {
        setGithubUsernameInput(match[1]);
      }
    }
  }, [candidateProfileContext, githubUsernameInput]);

  // Initialize selection: Fetch saved repos or select first repo by default (compulsory min 1)
  useEffect(() => {
    const loadRepoPreference = async () => {
      if (userId && interviewType?.id && company?.id && role?.id) {
        const saved = await fetchSelectedGithubRepo(userId, interviewType.id, company.id, role.id);
        if (saved) {
          const split = saved.split(',').map(s => s.trim()).filter(s => availableRepoOptions.includes(s));
          if (split.length > 0) {
            setSelectedRepos(split);
            return;
          }
        }
      }
      // If no saved repo or not found, automatically select ONLY the first available repo (never all)
      if (availableRepoOptions.length > 0) {
        setSelectedRepos(prev => {
          const valid = prev.filter(r => availableRepoOptions.includes(r));
          return valid.length > 0 ? valid : [availableRepoOptions[0]];
        });
      }
    };
    loadRepoPreference();
  }, [userId, interviewType?.id, company?.id, role?.id, availableRepoOptions]);

  const toggleRepoSelection = (repoName: string) => {
    if (selectedRepos.includes(repoName)) {
      if (selectedRepos.length === 1) {
        toast.info(`At least one repository must remain selected for the interview.`);
        return;
      }
      const updated = selectedRepos.filter(r => r !== repoName);
      setSelectedRepos(updated);
      toast.success(`Deselected "${repoName}" (${updated.length} selected).`);
    } else {
      const updated = [...selectedRepos, repoName];
      setSelectedRepos(updated);
      toast.success(`Selected "${repoName}" (${updated.length} selected).`);
    }
  };

  const handleConnectGitHubOAuth = async () => {
    setOauthLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        console.log('[EliteVoiceRoom] Linking GitHub identity to existing session...');
        const { data, error } = await supabase.auth.linkIdentity({
          provider: 'github',
          options: {
            scopes: 'read:user repo read:org',
            redirectTo: window.location.href
          }
        });
        if (!error && data?.url) {
          window.location.href = data.url;
          return;
        }
        if (error) {
          console.warn('[EliteVoiceRoom] linkIdentity note:', error.message);
        }
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          scopes: 'read:user repo read:org',
          redirectTo: window.location.href
        }
      });
      if (error) toast.error(error.message);
    } catch (err: any) {
      toast.error(`GitHub OAuth error: ${err.message || 'Failed to connect'}`);
    } finally {
      setOauthLoading(false);
    }
  };

  const handleFetchReposByUsername = async () => {
    const cleanUsername = extractGithubUsername(githubUsernameInput);
    if (!cleanUsername) {
      toast.error('Please enter a valid GitHub username or profile link.');
      return;
    }

    setIsFetchingRepos(true);
    try {
      if (typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
        localStorage.setItem('voke_github_username', cleanUsername);
      }
      const fetched = await fetchUserGithubRepos(cleanUsername);
      if (fetched && fetched.length > 0) {
        setCustomRepoList(fetched);
        setSelectedRepos([fetched[0].name]);
        toast.success(`Found ${fetched.length} repositories for @${cleanUsername}!`);
      } else {
        handleLoadResumeProjects();
        toast.warning(`GitHub API rate limit or no public repos found for @${cleanUsername}. You can add your project directly below!`);
      }
    } catch (err: any) {
      handleLoadResumeProjects();
      toast.error('Could not query GitHub API. You can add your project directly below.');
    } finally {
      setIsFetchingRepos(false);
    }
  };

  const handleAddManualProject = () => {
    if (!manualProjectInput.trim()) {
      toast.error('Please enter a project or repository name.');
      return;
    }
    const cleanName = manualProjectInput.trim();
    const updated = saveCustomRepo({
      name: cleanName,
      description: manualProjectTech.trim() || 'Candidate project for technical architecture interrogation',
      language: 'TypeScript/JavaScript'
    });
    setCustomRepoList(updated);
    setSelectedRepos(prev => prev.includes(cleanName) ? prev : [...prev, cleanName]);
    setManualProjectInput('');
    setManualProjectTech('');
    setShowManualAdd(false);
    toast.success(`Added "${cleanName}"! Ready for mock interview.`);
  };

  const handleLoadResumeProjects = () => {
    if (typeof window === 'undefined' || typeof localStorage === 'undefined') return;
    try {
      const saved = localStorage.getItem('voke_resume_data');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed.projects) && parsed.projects.length > 0) {
          const mapped: GitHubRepoItem[] = parsed.projects
            .filter((p: any) => p && (p.name || p.title))
            .map((p: any) => ({
              name: (p.name || p.title).trim(),
              description: p.description || 'Project from candidate profile',
              language: p.techStack || 'TypeScript/JavaScript',
              summary: `${p.name || p.title}: ${p.description || 'Portfolio project'}`
            }));
          if (mapped.length > 0) {
            setCustomRepoList(prev => [...mapped, ...prev]);
            setSelectedRepos([mapped[0].name]);
            toast.success(`Loaded ${mapped.length} projects from your Profile resume!`);
            return;
          }
        }
      }
    } catch (e) {
      console.warn('Error loading resume projects:', e);
    }
  };

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcription logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Start Camera
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true
      });
      setStream(mediaStream);
      setIsVideoEnabled(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Initialize MediaRecorder for full round video recording
      try {
        const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
          ? 'video/webm;codecs=vp9'
          : MediaRecorder.isTypeSupported('video/webm')
            ? 'video/webm'
            : 'video/mp4';

        const recorder = new MediaRecorder(mediaStream, { mimeType, videoBitsPerSecond: 250000 });
        videoChunksRef.current = [];
        recorder.ondataavailable = (e) => {
          if (e.data && e.data.size > 0) {
            videoChunksRef.current.push(e.data);
          }
        };
        recorder.start(1000);
        mediaRecorderRef.current = recorder;
        console.log('[EliteVoiceRoom] Full round video recording started.');
      } catch (recErr) {
        console.warn('[EliteVoiceRoom] MediaRecorder init note:', recErr);
      }
    } catch (err) {
      console.error("Error accessing camera/mic:", err);
      toast.error("Camera and microphone permissions required.");
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
        console.warn('[EliteVoiceRoom] Error stopping MediaRecorder:', e);
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

  const getRecordedVideoBlob = (): Blob | null => {
    if (videoChunksRef.current.length > 0) {
      const mimeType = mediaRecorderRef.current?.mimeType || 'video/webm';
      return new Blob(videoChunksRef.current, { type: mimeType });
    }
    return null;
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

  // Pre-interview repository setup modal state
  const [isPreInterviewSetupOpen, setIsPreInterviewSetupOpen] = useState(true);

  const handleConfirmSetupAndStart = async () => {
    const targetProjects = selectedRepos.length > 0 
      ? selectedRepos 
      : (availableRepoOptions.length > 0 ? [availableRepoOptions[0]] : []);

    if (targetProjects.length === 0) {
      toast.error('Please connect your GitHub account or add projects to your profile to proceed.');
      return;
    }
    
    if (selectedRepos.length === 0) {
      setSelectedRepos(targetProjects);
    }
    
    // Save selected project(s) to DB (comma-separated if multiple)
    try {
      const activeUserId = userId || (await supabase.auth.getSession()).data.session?.user.id;
      if (activeUserId) {
        await saveSelectedGithubRepo(
          activeUserId, 
          interviewType.id, 
          company.id, 
          role.id, 
          targetProjects.join(',')
        );
      }
    } catch (e) {
      console.error('Failed to save project:', e);
    }

    setIsPreInterviewSetupOpen(false);
    startCamera();
    initiateSession();
  };

  useEffect(() => {
    return () => {
      stopCamera();
      disconnect();
    };
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === LiveStatus.CONNECTED) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Track question count (assistant turns count as questions)
  useEffect(() => {
    const assistantTurns = logs.filter(l => l.role === 'assistant');
    if (assistantTurns.length > 0) {
      const qNum = Math.min(assistantTurns.length, totalQuestions);
      setCurrentQuestionNumber(qNum);
    }
  }, [logs, totalQuestions]);

  // Listen for AI verdict tokens & Question completion
  useEffect(() => {
    if (logs.length > 0 && !isEnding && !verdict) {
      const lastMsg = logs[logs.length - 1];
      const assistantTurns = logs.filter(l => l.role === 'assistant');
      const userTurns = logs.filter(l => l.role === 'user');

      if (lastMsg.role === 'assistant') {
        if (lastMsg.text.includes('[VERDICT: PASSED]') || lastMsg.text.includes('[VERDICT: SELECTED]')) {
          const reasonMatch = lastMsg.text.match(/\[REASON:(.*?)\]/);
          const fullReason = reasonMatch ? reasonMatch[1].trim() : lastMsg.text.replace(/\[VERDICT:.*?\]/g, '').replace(/\[REASON:.*?\]/g, '').trim();
          handleTriggerVerdict('PASSED', fullReason);
        } else if (lastMsg.text.includes('[VERDICT: FAILED]') || lastMsg.text.includes('[VERDICT: NOT_SELECTED]')) {
          const reasonMatch = lastMsg.text.match(/\[REASON:(.*?)\]/);
          const fullReason = reasonMatch ? reasonMatch[1].trim() : lastMsg.text.replace(/\[VERDICT:.*?\]/g, '').replace(/\[REASON:.*?\]/g, '').trim();
          handleTriggerVerdict('FAILED', fullReason);
        } else if (userTurns.length >= totalQuestions && assistantTurns.length > totalQuestions) {
          // Candidate answered all 10 questions AND AI spoke its closing goodbye speech (turn 11)
          console.log(`[Elite Voice Room] Completed all ${totalQuestions} questions and closing speech. Triggering wrap-up...`);
          const timer = setTimeout(() => {
            handleTriggerVerdict('PASSED', `Candidate successfully completed all ${totalQuestions} questions for ${round.title}.`);
          }, 6000);
          return () => clearTimeout(timer);
        }
      }
    }
  }, [logs, isEnding, verdict, totalQuestions]);

  const initiateSession = () => {
    const isRound1 = round.roundNumber === 1;
    const isJobMode = !!jobInterviewContext;
    const skillGapStrings: string[] = (jobInterviewContext?.skillGaps || []).map((g: any) =>
      typeof g === 'string' ? g : g.skill
    ).filter(Boolean);
    const gap1 = skillGapStrings[0] || 'Core Architecture';
    const gap2 = skillGapStrings[1] || skillGapStrings[0] || 'System Design';
    const gap3 = skillGapStrings[2] || '';
    const targetComp = jobInterviewContext?.companyName || company.name;
    const targetRoleName = jobInterviewContext?.jobTitle || role.title;
    const descExcerpt = jobInterviewContext?.jobDescription ? jobInterviewContext.jobDescription.slice(0, 600) : '';

    const jobInterviewCategoryFlow = `
=== TARGET JOB MOCK INTERVIEW — RESUME, GITHUB & SPECIFIC SKILL GAP EVALUATION ===
TARGET ROLE: ${targetRoleName}
TARGET COMPANY: ${targetComp}
CANDIDATE'S IDENTIFIED RESUME SKILL GAPS FOR THIS ROLE: [${skillGapStrings.join(', ')}]
JOB DESCRIPTION CONTEXT:
${descExcerpt}

OBJECTIVE:
You are the Technical Hiring Manager conducting an in-depth interview for the ${targetRoleName} position at ${targetComp}.
CRITICAL MANDATES (YOU MUST STRICTLY FOLLOW ALL OF THESE):
1. EVALUATE FOR THIS SPECIFIC ROLE: Keep the entire evaluation tailored to ${targetRoleName} at ${targetComp}.
2. ASK RESUME QUESTIONS: Interrogate the candidate on their real education and previous experience listed on their resume.
3. ASK GITHUB QUESTIONS: Question them on the concrete technical architecture and tradeoffs of their chosen GitHub ${selectedRepos.length > 1 ? 'repositories' : 'repository'} (${selectedRepos.join(', ') || 'their top repository'}).
4. CRUCIAL — PROBE IDENTIFIED SKILL GAPS: The candidate's resume currently lacks or has weak alignment on [${skillGapStrings.join(', ')}]. You MUST probe their grasp of these missing skills to assess their true depth, architectural principles, or how fast they can ramp up!

EXACT 10-QUESTION RESUME, GITHUB & SKILL GAP ALLOCATION:
- Question 1 (Warm Intro & Role Alignment): Warmly welcome the candidate to their interview for the ${targetRoleName} role at ${targetComp}. Ask them to introduce their technical journey and why they want to join ${targetComp} for this position.
- Question 2 (Resume - Educational Foundations & Background): Ask about their computer science or technical degree, coursework, or how they established their engineering foundation as listed on their resume.
- Question 3 (Resume - Claimed Core Competencies & Past Experience): Ask about the primary technical stack, languages, or tools explicitly highlighted in their resume's work experience and project section.
- Question 4 (GITHUB PROJECT QUESTION 1 OF 2): Deep dive into their selected GitHub repository (${selectedRepos[0] || 'their top repository'}). Ask a concrete question about the repository's component structure, data flow, API design, or package architecture.
- Question 5 (GITHUB PROJECT QUESTION 2 OF 2): ${selectedRepos.length > 1 
  ? `Inspect their second selected GitHub repository (${selectedRepos[1]}). Ask about its architecture, technical tradeoffs, edge cases, or how its architecture complements or contrasts with ${selectedRepos[0]}.` 
  : `Follow up on their selected GitHub repository (${selectedRepos[0] || 'their top repository'}) regarding a technical tradeoff, edge case, state synchronization challenge, or performance bottleneck they solved in that codebase.`}
- Question 6 (CRITICAL SKILL GAP 1 PROBE): The candidate lacks or has not explicitly demonstrated "${gap1}" on their resume, which is an important requirement for this ${targetRoleName} opening at ${targetComp}. Probe their conceptual understanding of "${gap1}" or ask a foundational problem-solving question on "${gap1}".
- Question 7 (CRITICAL SKILL GAP 2 / PRODUCTION SCENARIO): Probe their knowledge on "${gap2}"${gap3 ? ` or "${gap3}"` : ''}. Ask a practical production scenario question involving this skill, or ask how their existing background will allow them to ramp up on "${gap2}" immediately without slowing down the team.
- Question 8 (Job-Specific Technical Scenario): Present a realistic system design or architectural scenario based on the day-to-day requirements described in the ${targetComp} ${targetRoleName} job description.
- Question 9 (Learning Velocity & Technical Adaptability): Ask a behavioral question about a time they had to rapidly master an unfamiliar technology or bridge a critical skill gap to deliver a project under tight deadlines.
- Question 10 (Outro, Readiness & Closing Speech): Ask a final wrap-up question on their confidence for this ${targetRoleName} role at ${targetComp}, then speak a warm, polite closing goodbye thanking them for their time!

=== CONVERSATIONAL VOICE RULES ===
- EVERY QUESTION MUST BE CONCISE (1-2 sentences MAX, under 25 words).
- Zero robotic fluff. Use natural transitions: "Got it!", "Thanks for clarifying.", "Understood."
- Ask EXACTLY ONE question at a time. Never ask compound multi-part questions.
`;

    const round1CategoryFlow = `
=== ROUND 1 — RESUME SCREENING & VERIFICATION (EXACT 10-QUESTION ALLOCATION) ===
OBJECTIVE: Validate candidate's resume, claimed technical skills, education, role motivation, and communication clarity.

STRICT PROJECT QUESTION LIMIT (MAXIMUM 2 PROJECT QUESTIONS):
- OUT OF THE 10 TOTAL QUESTIONS IN THIS ROUND, YOU ARE STRICTLY ALLOWED TO ASK AT MOST 2 QUESTIONS ABOUT CANDIDATE'S PROJECTS.
- ALL OTHER 8 QUESTIONS MUST FOCUS STRICTLY ON RESUME CONTENT (Education, Core Claimed Skills, Practical Skill Experience, Tools & Workflow, Role Motivation, and Skill Growth).

EXACT 10-QUESTION RESUME SCREENING ALLOCATION (FOLLOW THIS PATTERN):
- Question 1 (Self Intro): Warm introduction and overall background ("Tell me about yourself and your technical background.").
- Question 2 (Resume - Education & Background): Ask about their education, degree, or relevant coursework listed on their resume.
- Question 3 (Resume - Core Claimed Skills): Ask about the primary technical skills listed on their resume (e.g. React, JavaScript, HTML/CSS).
- Question 4 (Resume - Practical Skill Application): Ask how they learned or applied those specific resume skills in their practical studies or work.
- Question 5 (PROJECT QUESTION 1 OF 2 ONLY): Ask a targeted question about their first selected project (${selectedRepos[0] || 'on their resume'}).
- Question 6 (PROJECT QUESTION 2 OF 2 ONLY): Ask a targeted question about their second selected project (${selectedRepos[1] || selectedRepos[0] || 'on their resume'}).
- Question 7 (Resume - Tools, Libraries & Workflow): Ask about development tools, libraries, version control (Git), or testing utilities listed on their resume.
- Question 8 (Resume - Role Motivation & Company Fit): Ask why their background and resume skills make them interested in joining ${company.name} for this ${role.title} position.
- Question 9 (Resume - Learning Mindset & Growth): Ask what technical skills or concepts they are currently focusing on expanding on their resume.
- Question 10 (Outro / Closing Question & Goodbye Speech): Ask a final wrap-up question on their career goals, then speak a warm, polite closing goodbye thanking them for their time!

=== DYNAMIC QUESTION VARIATION & NO-REPEAT MANDATE ===
- SESSION VARIATION SEED: ${Date.now()}_${Math.floor(Math.random() * 10000)}
- YOU MUST GENERATE A FRESH, UNIQUE, AND DYNAMIC TECHNICAL QUESTION ON EVERY TURN.
- NEVER USE CANNED QUESTION TEMPLATES (e.g. NEVER ask "what inspired you to choose React and Vite").
- Dynamically vary question focus across UI architecture, API integration, state management, debugging, performance, and testing!

=== COMPANY DIFFICULTY CALIBRATION (ROUND 1) ===
COMPANY: ${company.name} | ROLE: ${role.title}
DIFFICULTY MANDATE:
- Keep Round 1 questions MODERATE, ACCESSIBLE, AND ENCOURAGING (Entry-level B.Tech CSE Student screening level).
- DO NOT make questions overly difficult, punishing, or hyper-theoretical.
- Tailor tone to ${company.name}'s engineering focus (${company.name === 'Google' ? 'clean web standards & scalability' : company.name === 'Meta' ? 'UI component architecture & state responsiveness' : company.name === 'Microsoft' ? 'enterprise modularity & software testing' : 'practical engineering fundamentals'}), while keeping questions friendly, direct, and straightforward.

=== CRITICAL VOICE-ONLY RULES (STRICTLY ENFORCED) ===
- EVERY QUESTION MUST BE EXTREMELY SHORT (1-2 sentences MAX, under 20 words total).
- ABSOLUTELY ZERO FLUFF OR COMPLIMENTS: NEVER say "Congratulations...", "That's awesome...", "Great job...", or repeat candidate answers. Move DIRECTLY to the next question.
- ASK EXACTLY ONE FOCUSED QUESTION PER TURN. NEVER ask multi-part compound questions.
- NEVER ask candidate to write code or type syntax. Ask for verbal conceptual explanations only.
`;

    const rawCleanedContext = candidateProfileContext ? candidateProfileContext
      .replace(/!\[.*?\]\(https?:\/\/[^\)]+\)/g, '')
      .replace(/\[https?:\/\/img\.shields\.io\/[^\]]+\]/g, '')
      .replace(/https?:\/\/img\.shields\.io\/[^\s]+/g, '')
      .replace(/\n\s*\n\s*\n/g, '\n\n')
      .trim() : '';

    // STRICT REPOSITORY FILTERING: Only include candidate-selected target repos in AI prompt context
    let cleanedContext = rawCleanedContext;
    if (selectedRepos.length > 0 && rawCleanedContext.includes('GITHUB PROJECTS:')) {
      const parts = rawCleanedContext.split('GITHUB PROJECTS:');
      const headerPart = parts[0];
      const projectsPart = parts[1] || '';
      
      const projectBlocks = projectsPart.split(/Project:\s*/);
      const matchedBlocks = projectBlocks.filter(block => {
        if (!block.trim()) return false;
        const projectName = block.split('\n')[0].trim();
        return selectedRepos.some(sr => 
          sr.toLowerCase() === projectName.toLowerCase() || 
          projectName.toLowerCase().includes(sr.toLowerCase()) || 
          sr.toLowerCase().includes(projectName.toLowerCase())
        );
      });

      if (matchedBlocks.length > 0) {
        cleanedContext = `${headerPart}\nGITHUB PROJECTS (STRICTLY SELECTED REPOSITORIES ONLY: ${selectedRepos.join(', ')}):\nProject: ${matchedBlocks.join('Project: ')}`;
      } else {
        cleanedContext = `${headerPart}\nTARGET REPOSITORIES FOR THIS SESSION: ${selectedRepos.join(', ')}\n`;
      }
    }

    if (selectedRepos.length > 0 && !cleanedContext.includes('GITHUB PROJECTS (STRICTLY SELECTED REPOSITORIES ONLY:')) {
      const projectsText = selectedRepos.map(repoName => {
        const customProjectDesc = customRepoList.find(r => r.name.toLowerCase() === repoName.toLowerCase());
        return `Project: ${repoName}\n- Description: ${customProjectDesc?.description || 'Candidate selected project repository for architectural and technical code interrogation'}\n- Tech: ${customProjectDesc?.language || 'Fullstack / Software Engineering'}`;
      }).join('\n\n');
      cleanedContext += `\nGITHUB PROJECTS (STRICTLY SELECTED REPOSITORIES ONLY: ${selectedRepos.join(', ')}):\n${projectsText}\n`;
    }

    const repoSelectionMandate = selectedRepos.length > 0 ? `
=== STRICT REPOSITORY SELECTION MANDATE ===
- CANDIDATE HAS EXPLICITLY SELECTED ONLY THESE TARGET REPOSITORIES FOR THIS INTERVIEW: [${selectedRepos.join(', ')}].
- YOU MUST ONLY ASK QUESTIONS ABOUT THESE SELECTED REPOSITORIES: [${selectedRepos.join(', ')}].
- STRICTLY FORBIDDEN: DO NOT ASK ABOUT ANY OTHER REPOSITORIES (such as unselected GitHub projects or other repos).
` : '';

    const isFrontend = role.title.toLowerCase().includes('frontend') || role.id.includes('frontend');
    const isBackend = role.title.toLowerCase().includes('backend') || role.id.includes('backend');

    const domainFocusMandate = isFrontend
      ? `=== FRONTEND DEVELOPER DOMAIN SPECIALIZATION MANDATE ===
TARGET DOMAIN: FRONTEND ENGINEERING (${role.title} at ${company.name})
- ALL QUESTIONS MUST BE STRICTLY TAILORED TO FRONTEND DEVELOPMENT & WEB TECHNOLOGIES.
- Primary Focus: React / Modern UI frameworks, JavaScript/TypeScript fundamentals, DOM manipulation & Browser rendering, State Management (Redux/Context/Zustand), Component Lifecycle & Hooks, CSS/Layouts, Web Performance, and Frontend API integration.
- Even during resume and project screening, focus on candidate's frontend contributions, UI choices, state handling, and client-side performance.`
      : isBackend
      ? `=== BACKEND DEVELOPER DOMAIN SPECIALIZATION MANDATE ===
TARGET DOMAIN: BACKEND ENGINEERING (${role.title} at ${company.name})
- ALL QUESTIONS MUST BE STRICTLY TAILORED TO BACKEND DEVELOPMENT & SERVER ARCHITECTURE.
- Primary Focus: REST APIs, Databases (SQL/NoSQL) & Indexing, Node.js / Server-side Runtimes, Microservices, Authentication/Security, Caching (Redis), and Data Structures.
- Focus questions on server-side logic, API design, scalability, and backend trade-offs.`
      : `=== FULL STACK DEVELOPER DOMAIN SPECIALIZATION MANDATE ===
TARGET DOMAIN: FULL STACK ENGINEERING (${role.title} at ${company.name})
- QUESTIONS MUST BE BALANCED BETWEEN FRONTEND (React/UI/Client state) AND BACKEND (APIs/Databases/Server architecture).`;

    const systemPrompt = `
ROLE: You are an Elite Technical Interviewer at ${isJobMode ? targetComp : company.name} conducting a pure voice/video interview.
CATEGORY: ${isJobMode ? 'Target Job Interview' : interviewType.title}
TARGET ROLE: ${isJobMode ? targetRoleName : role.title}
CURRENT ROUND: ${round.title} (Round ${round.roundNumber} of 4)
FOCUS AREAS: ${round.focusAreas.join(', ')}
${cleanedContext ? `CANDIDATE CONTEXT / RESUME:\n${cleanedContext}` : ''}
${isJobMode && skillGapStrings.length > 0 ? `TARGET SKILL GAPS IDENTIFIED FOR THIS ROLE: ${skillGapStrings.join(', ')}` : ''}

${isJobMode ? '' : domainFocusMandate}

${repoSelectionMandate}

=== CONVERSATIONAL TONE & NATURAL TRANSITIONS ===
1. WARM CONVERSATIONAL OPENING (QUESTION 1):
   - Open naturally and warmly on your first message (e.g. "Hi! Welcome to your interview for the ${isJobMode ? targetRoleName : role.title} position at ${isJobMode ? targetComp : company.name}. It's great to connect with you! To get us started, could you briefly introduce yourself and share your core background?")
   - DO NOT jump straight into cold robotic questions without a warm greeting.

2. NATURAL INTER-QUESTION BRIDGES:
   - Use short, natural 2-3 word conversational bridges before asking follow-up questions based on the candidate's last spoken response (e.g. "Got it!", "Thanks for sharing that overview!", "That makes sense. Building on that...", "Understood!").

3. QUESTION COUNT & SEQUENCING:
   - Conduct an interview of EXACTLY ${totalQuestions} sequential questions.
   - Listen to candidate's response, then proceed to the next question using a short conversational bridge.

4. WRAP-UP & CLOSING SPEECH (ON QUESTION ${totalQuestions}):
   - After candidate answers Question ${totalQuestions} (the final question), output a warm, polite closing message thanking them for their time before outputting the final verdict token:
     "Thank you so much for taking the time to speak with me today! That completes all ${totalQuestions} questions for this session. We are finalizing your evaluation report and video analysis now. Have a wonderful day! [VERDICT: PASSED] [REASON: Candidate successfully completed all ${totalQuestions} screening questions with solid communication.]"

${isJobMode ? jobInterviewCategoryFlow : (isRound1 ? round1CategoryFlow : '')}
`;

    connect(systemPrompt);
  };

  const [feedbackDetails, setFeedbackDetails] = useState<RoundFeedbackDetails | null>(null);

  // Real Transcript-Based Performance Evaluator
  const evaluateTranscriptPerformance = (aiVerdict: 'PASSED' | 'FAILED', aiReason?: string): {
    finalVerdict: 'PASSED' | 'FAILED';
    finalScore: number;
    reason: string;
    details: RoundFeedbackDetails;
  } => {
    // 1. Gather spoken user responses from transcript logs
    const userLogs = logs.filter(l => l.role === 'user');
    const userTexts = userLogs.map(l => l.text.trim());
    const fullTranscript = userTexts.join(' ');
    const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
    const avgWordsPerAnswer = userLogs.length > 0 ? wordCount / userLogs.length : 0;

    if (userLogs.length === 0 || fullTranscript.length === 0 || wordCount === 0) {
      return {
        finalVerdict: 'FAILED',
        finalScore: 0,
        reason: 'Interview attempt invalid as the candidate did not speak or participate in the conversation.',
        details: {
          communicationScore: 0,
          confidenceScore: 0,
          technicalScore: 0,
          resumeAuthenticityScore: 0,
          strengths: ['None (No candidate responses recorded)'],
          improvements: ['No response provided during the session'],
          summary: 'Interview attempt invalid as the candidate did not speak or participate in the conversation.'
        }
      };
    }

    // Special rule: If candidate ONLY gave an introduction (1 response out of total questions)
    if (userLogs.length <= 1) {
      const introScore = Math.min(10, Math.max(5, Math.round(wordCount * 0.2)));
      return {
        finalVerdict: 'FAILED',
        finalScore: introScore,
        reason: `Interview ended prematurely after candidate introduction. Candidate answered 1 of ${totalQuestions} questions and did not complete technical or resume verification evaluation.`,
        details: {
          communicationScore: Math.min(20, introScore + 10),
          confidenceScore: Math.min(15, introScore),
          technicalScore: 0,
          resumeAuthenticityScore: 0,
          strengths: ['Candidate provided an initial spoken self-introduction.'],
          improvements: ['Interview ended early before candidate answered technical or resume verification questions.'],
          summary: `Interview ended prematurely after candidate introduction. Candidate answered 1 of ${totalQuestions} questions and did not complete technical or resume verification evaluation.`
        }
      };
    }

    // Extract AI evaluation sentiment from AI's reason summary
    const rawAiReason = aiReason || '';
    const isAiFail = aiVerdict === 'FAILED' || 
      /gaps|lacked|struggled|lack of|insufficient|failed|cannot|inconsistencies|below|unprepared/i.test(rawAiReason);

    // 2. Identify technical keywords mentioned in candidate's responses
    const techKeywords = [
      ...role.skills.map(s => s.toLowerCase()),
      'react', 'javascript', 'typescript', 'api', 'rest', 'graphql', 'state', 'component',
      'hooks', 'dom', 'rendering', 'virtual dom', 'node', 'express', 'database', 'sql',
      'postgres', 'supabase', 'architecture', 'performance', 'optimization', 'async',
      'await', 'promise', 'function', 'object', 'array', 'algorithm', 'system', 'design',
      'testing', 'git', 'ci/cd', 'deployment', 'latency', 'cache', 'security', 'props'
    ];

    const lowerTranscript = fullTranscript.toLowerCase();
    const matchedKeywords = Array.from(new Set(techKeywords.filter(kw => lowerTranscript.includes(kw))));
    const techKeywordCount = matchedKeywords.length;

    // 3. Calculate metric scores accurately aligned with AI verdict
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

    // Weighted Overall Score
    let overallScore = Math.round(
      commScore * 0.30 +
      techScore * 0.35 +
      confScore * 0.20 +
      authScore * 0.15
    );

    // If AI verdict indicates FAILED, strictly cap overall score below 70% (e.g. 45-64%)
    if (isAiFail) {
      overallScore = Math.min(overallScore, 64);
    } else {
      overallScore = Math.max(overallScore, 72);
    }

    const finalVerdict: 'PASSED' | 'FAILED' = isAiFail ? 'FAILED' : 'PASSED';

    // Tailored Reason derived from AI verdict
    const cleanReason = rawAiReason
      .replace(/\[VERDICT:.*?\]/g, '')
      .replace(/\[REASON:.*?\]/g, '')
      .trim() || (isAiFail ? `Failed to clear ${company.name} screening benchmark due to technical gaps and lack of depth.` : `Passed ${company.name} technical screening for ${role.title}.`);

    // Dynamic Evidence-Based Strengths & Improvements
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (!isAiFail) {
      strengths.push(`Strong verbal communication averaging ${Math.round(avgWordsPerAnswer)} words per response.`);
      if (matchedKeywords.length > 0) {
        strengths.push(`Effective use of technical concepts: ${matchedKeywords.slice(0, 4).join(', ')}.`);
      }
      strengths.push("Maintained consistent answer volume and conversational momentum across prompts.");
      strengths.push("Demonstrated hands-on ownership during project walkthrough questions.");

      improvements.push("Keep project walk-throughs concise using the STAR framework (Situation, Task, Action, Result).");
      improvements.push("Quantify project impact with specific metrics (e.g., latency reduction, user scale).");
    } else {
      strengths.push("Showed positive attitude and enthusiasm during screening prompts.");
      strengths.push("Completed interview sequence under live voice conditions.");

      improvements.push(`Review core JavaScript, CSS, and architecture concepts required for ${role.title}.`);
      improvements.push("Provide specific code examples and clear explanations instead of vague high-level answers.");
      improvements.push("Elaborate on 'why' and 'how' when answering technical questions rather than relying on brief answers.");
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
    // SILENCE TTS & DISCONNECT VOICE IMMEDIATELY
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
    let videoAnalysisData: any = null;
    let uploadedVideoUrl: string | null = null;

    try {
      const userLogs = logs.filter(l => l.role === 'user');
      const transcript = userLogs.map(l => l.text).join('\n');
      const messages = logs.map(l => ({
        role: l.role === 'assistant' ? 'assistant' : 'user',
        content: l.text
      }));

      // STEP 1 (background, non-blocking): Upload video & run video analysis in parallel with text evaluation
      // Video upload runs asynchronously - we do NOT await it before showing evaluation results
      const videoUploadPromise = (async () => {
        try {
          const videoBlob = getRecordedVideoBlob();
          const { data: { user } } = await supabase.auth.getUser();
          if (videoBlob && user) {
            const roundSessionId = `elite-${round.roundNumber}-${Date.now()}`;
            const videoPath = `${user.id}/elite_${roundSessionId}.webm`;
            console.log(`[Elite Interview] Background uploading video (${(videoBlob.size / 1024 / 1024).toFixed(2)} MB)...`);
            const { error: uploadErr } = await supabase.storage
              .from('video-interviews')
              .upload(videoPath, videoBlob, { contentType: videoBlob.type, upsert: true });
            if (!uploadErr) {
              const { data: { publicUrl } } = supabase.storage
                .from('video-interviews').getPublicUrl(videoPath);
              uploadedVideoUrl = publicUrl;
              console.log("[Elite Interview] Background video upload complete:", uploadedVideoUrl);
            } else {
              console.warn("[Elite Interview] Video upload note:", uploadErr.message);
            }
          }
        } catch (vidErr) {
          console.warn("[Elite Interview] Video upload fallback:", vidErr);
        }
      })();

      // STEP 2 (immediate, parallel): Run AI text evaluation RIGHT AWAY — no waiting for video upload
      console.log("[Elite Interview] Starting AI evaluation immediately (parallel to video upload)...");

      // Video analysis & text evaluation run in parallel
      const [evalReport] = await Promise.all([
        // Text-based evaluation (fast, ~2-3s)
        supabase.functions.invoke('evaluate-interview', {
          body: {
            messages,
            interview_type: `Elite Interview - ${company.name} - ${role.title} (${round.title})`
          }
        }).then(r => r.data),

        // Video analysis (uses existing URL if upload finished, else null)
        supabase.functions.invoke('analyze-video-interview', {
          body: {
            sessionId: `elite-${round.roundNumber}-${Date.now()}`,
            videoUrl: uploadedVideoUrl,
            question: round.title,
            transcript,
            userContext: candidateProfileContext,
            role: role.title
          }
        }).then(r => {
          videoAnalysisData = r.data?.analysis || r.data;
          return videoAnalysisData;
        }).catch(() => null)
      ]);

      evalReportData = evalReport;

      // Let video upload finish in background (don't block UI on it)
      videoUploadPromise.catch(() => {});

      if (evalReport && evalReport.score !== undefined) {
        console.log("[Elite Interview] Step 2 & 3 AI Evaluation complete:", evalReport);
        const userLogsCount = logs.filter(l => l.role === 'user').length;
        const completionRatio = Math.min(1, userLogsCount / Math.max(1, totalQuestions));
        const isNoUserSpeech = userLogsCount === 0 || logs.filter(l => l.role === 'user').map(l => l.text.trim()).join('').length === 0;

        let finalScore = isNoUserSpeech ? 0 : (evalReport.score !== undefined ? evalReport.score : evaluation.finalScore);

        // Strict Pro-Rating for Incomplete & Early Ended Attempts
        if (userLogsCount <= 1 && !isNoUserSpeech) {
          finalScore = Math.min(10, finalScore);
        } else if (completionRatio < 0.9 && !isNoUserSpeech) {
          finalScore = Math.min(Math.round(completionRatio * 100), Math.round(finalScore * completionRatio));
        }

        const finalVerdict = finalScore >= 70 ? 'PASSED' : 'FAILED';
        
        evaluation = {
          finalVerdict,
          finalScore,
          reason: evalReport.feedback || evaluation.reason,
          details: {
            communicationScore: isNoUserSpeech ? 0 : (userLogsCount <= 1 ? Math.min(20, evalReport.metrics?.communication || 20) : Math.round((evalReport.metrics?.communication || evaluation.details.communicationScore) * completionRatio)),
            confidenceScore: isNoUserSpeech ? 0 : (userLogsCount <= 1 ? Math.min(15, evalReport.metrics?.problem_solving || 15) : Math.round((evalReport.metrics?.problem_solving || evaluation.details.confidenceScore) * completionRatio)),
            technicalScore: isNoUserSpeech ? 0 : (userLogsCount <= 1 ? 0 : Math.round((evalReport.metrics?.technical_accuracy || evaluation.details.technicalScore) * completionRatio)),
            resumeAuthenticityScore: isNoUserSpeech ? 0 : (userLogsCount <= 1 ? 0 : Math.round((evaluation.details.resumeAuthenticityScore || 50) * completionRatio)),
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
      console.error("[Elite Interview] Step 2/3 AI Pipeline failover fallback:", err);
    }

    // Save session to interview_sessions Supabase table (matching Pro Interview)
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const computedBodyLangScore = videoAnalysisData?.body_language_score || 
          videoAnalysisData?.scores?.body_language || 
          Math.min(92, Math.max(60, Math.round(evaluation.details.communicationScore * 0.95)));

        const { data: dbSession, error: dbError } = await supabase
          .from('interview_sessions')
          .insert({
            user_id: user.id,
            role: `${company.name} - ${role.title} (${round.title})`,
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
              video_url: uploadedVideoUrl,
              body_language_score: computedBodyLangScore,
              video_analysis_details: videoAnalysisData?.video_analysis_details || null,
              six_q_score: evalReportData?.six_q_score || videoAnalysisData?.six_q_score || null,
              personality_cluster: evalReportData?.personality_cluster || videoAnalysisData?.personality_cluster || null
            },
            created_at: new Date().toISOString()
          } as any)
          .select('id')
          .single();

        if (dbError) {
          console.error("Error inserting interview_session:", dbError);
        } else if (dbSession) {
          newSessionId = dbSession.id;
          setSavedSessionId(newSessionId);
        }
      }
    } catch (dbErr) {
      console.error("Failed to save elite session to DB:", dbErr);
    }

    // Save progress with real AI-driven verdict, feedback, and sessionId
    try {
      await updateRoundResultAsync(
        userId,
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
    } catch (err) {
      console.error("Failed to update round result async:", err);
    }

    // Complete round & navigate directly to results report page (or return to rounds hub if no DB session)
    if (newSessionId) {
      navigate(`/voice-interview/results/${newSessionId}?from=elite`);
    } else {
      onCompleteRound(evaluation.finalVerdict);
    }
  };

  const handleManualEndSession = () => {
    setIsEnding(true);
    const userMsgCount = logs.filter(l => l.role === 'user').length;
    const passed = userMsgCount >= Math.floor(totalQuestions * 0.6);
    handleTriggerVerdict(passed ? 'PASSED' : 'FAILED', passed ? 'Completed round session satisfactorily.' : 'Interview ended early before evaluation bar was satisfied.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-[#050508] text-white flex flex-col overflow-hidden font-sans relative select-none">
      <AntiCheatOverlay />

      {/* SETUP MODAL (GitHub / Resume) */}
      {isPreInterviewSetupOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-in fade-in duration-200 select-text">
          <div className="bg-[#0a0b12]/95 border border-white/10 backdrop-blur-2xl rounded-2xl max-w-2xl w-full max-h-[85vh] flex flex-col p-6 shadow-2xl relative overflow-hidden space-y-4">

            {/* Simplified Header */}
            <div className="flex items-center justify-between gap-4 border-b border-white/10 pb-3">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 shrink-0">
                  <GitBranch className="w-4 h-4 text-sky-400" />
                </div>
                <div className="min-w-0">
                  <h2 className="text-sm font-bold text-white tracking-tight">
                    Select Target Repositories
                  </h2>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5 truncate">
                    <span className="font-semibold text-zinc-200">
                      {jobInterviewContext ? jobInterviewContext.companyName : company.name}
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span className="truncate">
                      {jobInterviewContext ? jobInterviewContext.jobTitle : role.title}
                    </span>
                    {jobInterviewContext?.skillGaps && jobInterviewContext.skillGaps.length > 0 && (
                      <>
                        <span className="text-zinc-600">•</span>
                        <span className="text-amber-400/90 font-medium truncate">
                          Gaps: {jobInterviewContext.skillGaps.map((g: any) => typeof g === 'string' ? g : g.skill).join(', ')}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="shrink-0">
                <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                  {selectedRepos.length} Selected
                </span>
              </div>
            </div>

            {/* Repositories Section */}
            <div className="space-y-2.5 flex-1 flex flex-col min-h-0">
              {/* Sleek Search & Quick Action Bar */}
              <div className="flex items-center justify-between gap-2">
                <div className="relative flex-1 max-w-sm">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={`Search ${availableRepoOptions.length} repositories...`}
                    className="w-full bg-[#121422] border border-white/10 rounded-lg pl-3 pr-8 py-1.5 text-xs text-white placeholder:text-zinc-500 focus:outline-none focus:border-sky-500/60"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                    >
                      ×
                    </button>
                  )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setShowManualAdd(!showManualAdd)}
                    className="text-[11px] font-medium text-sky-400 hover:text-sky-300 flex items-center gap-1 cursor-pointer transition-colors"
                  >
                    <Plus className="w-3 h-3" /> Add Project
                  </button>
                  <span className="text-zinc-700">|</span>
                  <span className="text-[11px] text-zinc-400 font-mono">
                    @{githubUsernameInput || 'GitHub'}
                  </span>
                </div>
              </div>

              {/* Inline Quick Add Form (toggled on demand) */}
              {showManualAdd && (
                <div className="p-3 rounded-xl bg-[#121422] border border-sky-500/30 space-y-2 animate-in fade-in duration-150">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-sky-300">Add Project Manually</span>
                    <button onClick={() => setShowManualAdd(false)} className="text-zinc-400 hover:text-white text-xs">×</button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={manualProjectInput}
                      onChange={(e) => setManualProjectInput(e.target.value)}
                      placeholder="Project Name (e.g. Distributed Cache)"
                      className="flex-1 bg-[#0a0b12] border border-white/10 rounded-lg px-2.5 py-1 text-xs text-white placeholder:text-zinc-500 focus:border-sky-500"
                    />
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddManualProject}
                      disabled={!manualProjectInput.trim()}
                      className="h-8 px-3 bg-sky-600 hover:bg-sky-500 text-white text-xs font-bold rounded-lg"
                    >
                      Add & Select
                    </Button>
                  </div>
                </div>
              )}

              {/* Repositories Loading Skeletons */}
              {isLoadingRepos || isFetchingRepos ? (
                <div className="p-8 rounded-2xl bg-[#121422]/60 border border-white/10 text-center space-y-4 my-auto flex flex-col items-center justify-center min-h-[180px]">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-full border-2 border-sky-500/30 border-t-sky-500 animate-spin" />
                    <Sparkles className="w-4 h-4 text-sky-400 absolute inset-0 m-auto" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white tracking-wide">Fetching Your GitHub Repositories...</h4>
                    <p className="text-[11px] text-zinc-400 mt-1">
                      Querying GitHub API for personal & organization projects...
                    </p>
                  </div>
                </div>
              ) : availableRepoOptions.length === 0 ? (
                <div className="p-6 rounded-2xl bg-[#121422]/70 border border-white/10 text-center space-y-3.5 my-auto flex flex-col items-center justify-center">
                  <div className="w-10 h-10 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
                    <Github className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">No GitHub Repositories Loaded</h4>
                    <p className="text-[11px] text-zinc-400 mt-1 max-w-sm mx-auto">
                      Add a project manually or enter your GitHub handle in Profile to start.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowManualAdd(true)}
                    className="px-3.5 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-extrabold text-xs inline-flex items-center gap-1.5 shadow-lg shadow-sky-600/20 cursor-pointer transition-all"
                  >
                    <Plus className="w-3.5 h-3.5" /> Add Project Manually
                  </button>
                </div>
              ) : (
                /* Spacious, clean repository grid */
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-[46vh] overflow-y-auto pr-1 flex-1">
                  {availableRepoOptions
                    .filter(repo => repo.toLowerCase().includes(searchQuery.toLowerCase()))
                    .map((repo) => {
                      const isSelected = selectedRepos.includes(repo);
                      const detail = customRepoList.find(r => r.name.toLowerCase() === repo.toLowerCase());
                      return (
                        <div
                          key={repo}
                          onClick={() => toggleRepoSelection(repo)}
                          className={`p-3 rounded-xl border cursor-pointer transition-all duration-150 flex items-center justify-between gap-3 ${
                            isSelected
                              ? 'bg-[#14182e] border-sky-500 shadow-md shadow-sky-500/10 ring-1 ring-sky-500/40'
                              : 'bg-[#0e101c]/80 border-white/5 hover:border-white/20 hover:bg-[#121526]'
                          }`}
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shrink-0 transition-all ${
                              isSelected ? 'bg-sky-500 text-white shadow-sm shadow-sky-500/30' : 'bg-zinc-800 text-zinc-500'
                            }`}>
                              {isSelected ? <Check className="w-3.5 h-3.5 stroke-[3]" /> : <GitBranch className="w-3.5 h-3.5" />}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-sky-200' : 'text-zinc-200'}`}>
                                {repo}
                              </h4>
                              <span className="text-[10px] text-zinc-400 truncate block mt-0.5">
                                {detail?.language || 'GitHub Project'}
                              </span>
                            </div>
                          </div>

                          <div className="shrink-0">
                            <span className={`text-[10px] font-semibold px-2 py-0.5 rounded transition-all ${
                              isSelected
                                ? 'bg-sky-500/20 text-sky-300 font-bold border border-sky-500/30'
                                : 'text-zinc-500 border border-white/5 hover:text-zinc-300'
                            }`}>
                              {isSelected ? '✓ Selected' : '+ Select'}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                </div>
              )}
            </div>

            {/* Bottom Action Bar */}
            <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="text-xs text-zinc-400 self-start sm:self-auto min-w-0 flex items-center gap-1.5 flex-wrap">
                <span>Selected ({selectedRepos.length}):</span>
                {selectedRepos.length > 0 ? (
                  <span className="text-sky-300 font-bold truncate max-w-xs sm:max-w-md">
                    {selectedRepos.join(', ')}
                  </span>
                ) : (
                  <span className="text-zinc-500 italic">None</span>
                )}
              </div>

              <Button
                onClick={handleConfirmSetupAndStart}
                disabled={availableRepoOptions.length === 0 && selectedRepos.length === 0}
                className="w-full sm:w-auto h-11 px-6 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-extrabold text-xs tracking-wide shadow-lg shadow-sky-600/20 transition-all cursor-pointer flex items-center justify-center gap-2 shrink-0"
              >
                <Zap className="w-4 h-4 text-amber-400" />
                {selectedRepos.length > 1
                  ? `Start Interview (${selectedRepos.length} Projects)`
                  : selectedRepos.length === 1
                  ? `Start Interview (${selectedRepos[0]})`
                  : 'Start Interview Session'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* TOP FLOATING HUD BAR */}
      <header className="h-14 border-b border-white/10 bg-zinc-950/90 backdrop-blur-xl px-5 flex items-center justify-between z-20 shrink-0">
        {/* Left: Company & Role Details */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-white/10 border border-white/10 p-1 flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src={company.logo}
              alt={company.name}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=18181b&color=fff&size=64`;
              }}
              className="w-full h-full object-contain rounded"
            />
          </div>
          <div className="flex items-center gap-2 min-w-0">
            <span className="font-bold text-sm text-white truncate">
              {jobInterviewContext ? jobInterviewContext.companyName : company.name}
            </span>
            <span className="text-zinc-600">•</span>
            <span className="text-xs font-medium text-zinc-300 truncate max-w-[240px] sm:max-w-xs md:max-w-md">
              {jobInterviewContext ? jobInterviewContext.jobTitle : role.title}
            </span>
          </div>
        </div>

        {/* Center: Clean Question Progress */}
        <div className="hidden md:flex items-center gap-3 px-3 py-1 rounded-full bg-white/[0.04] border border-white/10">
          <span className="text-xs text-zinc-300 font-medium">
            Question <strong className="text-white">{currentQuestionNumber}</strong> of {totalQuestions}
          </span>
          <div className="flex items-center gap-1">
            {Array.from({ length: totalQuestions }).map((_, i) => {
              const qIndex = i + 1;
              const isDone = qIndex < currentQuestionNumber;
              const isCurrent = qIndex === currentQuestionNumber;

              return (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    isDone
                      ? 'w-2.5 bg-emerald-400'
                      : isCurrent
                      ? 'w-4 bg-sky-400'
                      : 'w-1.5 bg-zinc-700'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Live Timer & Clean Actions */}
        <div className="flex items-center gap-2.5">
          {status === LiveStatus.CONNECTED && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono font-medium">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>{formatTime(duration)}</span>
            </div>
          )}

          {jobInterviewContext && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onExit}
              className="text-xs text-zinc-400 hover:text-white hover:bg-white/10 h-8 px-2.5 rounded-lg flex items-center gap-1.5 font-medium cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Exit</span>
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleManualEndSession}
            disabled={isEnding}
            className="h-8 px-3 rounded-lg border-red-500/30 bg-red-500/10 hover:bg-red-500/20 text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
          >
            <PhoneOff className="w-3.5 h-3.5" />
            <span>End Interview</span>
          </Button>
        </div>
      </header>

      {/* MAIN DUAL STAGE WORKSPACE */}
      <main className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 bg-[#050508] relative overflow-hidden">
        
        {/* LEFT AREA: AI ORB STAGE WITH CONTROL NAVBAR SLIGHTLY SHIFTED RIGHT */}
        <div className="flex-1 flex flex-col relative min-h-0 h-full">
          
          {/* AI INTERVIEWER STAGE CARD */}
          <div className="flex-1 relative rounded-3xl bg-zinc-950 border border-white/15 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 group h-full">
            {/* Ambient Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-sky-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />

            {/* AI Sphere Visualizer */}
            <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 flex items-center justify-center my-auto">
              <AudioVisualizer
                isUserSpeaking={isUserSpeaking}
                isAiSpeaking={isAiSpeaking}
                volume={volume}
              />
            </div>

            {/* AI Badge Overlay (Top-Left) */}
            <div className="absolute top-5 left-5 z-20 flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-900/80 backdrop-blur-md border border-white/10 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
              <div className="text-xs font-semibold text-white">
                {company.name} AI Technical Lead
              </div>
            </div>

            {/* ENLARGED CANDIDATE WEBCAM PIP BOX (TOP-RIGHT CORNER INSIDE AI BOX) */}
            <div className="absolute top-5 right-5 z-20 w-64 md:w-76 lg:w-84 aspect-video rounded-2xl bg-zinc-900 border-2 border-white/20 overflow-hidden shadow-2xl ring-1 ring-white/10 group/pip">
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

            {/* Real-time Status Pill (Bottom-Left INSIDE AI BOX) */}
            <div className="absolute bottom-5 left-5 z-20 hidden lg:flex items-center gap-2">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-lg ${
                isAiSpeaking
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                  : isUserSpeaking
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-zinc-900/90 border-white/10 text-zinc-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-amber-400 animate-ping' : isUserSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                {isAiSpeaking ? "AI Speaking..." : isUserSpeaking ? "Listening to Candidate..." : "Voice Connected"}
              </div>
            </div>

            {/* CONTROL NAVBAR INSIDE AI BOX POSITIONED SLIGHTLY TO THE RIGHT */}
            <div className="absolute bottom-5 left-1/2 sm:left-[55%] md:left-[58%] -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-3 rounded-full bg-zinc-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl ring-1 ring-white/10 pointer-events-auto">
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  isMicEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white shadow-md'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
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
                title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-400" />}
              </button>

              {/* Subtitles / Transcription Toggle */}
              <button
                onClick={() => setShowTranscription(!showTranscription)}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  showTranscription
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                }`}
                title="Toggle Live Speech Transcription Panel"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/15" />

              {/* End Call Button */}
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

        {/* RIGHT AREA: LIVE AUDIO TRANSCRIPTION PANEL */}
        {showTranscription && (
          <div className="w-full md:w-96 lg:w-[420px] bg-zinc-950/90 backdrop-blur-2xl rounded-3xl border border-white/15 flex flex-col shrink-0 min-h-0 shadow-2xl overflow-hidden h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Live Speech Transcription</h4>
              </div>
              <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400">
                Real-time
              </Badge>
            </div>

            {/* Scrolling Logs */}
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
                        log.role === 'assistant' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}>
                        {log.role === 'assistant' ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] border shadow-md ${
                        log.role === 'assistant'
                          ? 'bg-zinc-900 text-zinc-200 border-white/10'
                          : 'bg-sky-950/50 text-sky-200 border-sky-500/30'
                      }`}>
                        <div className="text-[10px] font-bold mb-1 opacity-70">
                          {log.role === 'assistant' ? `${company.name} AI Lead` : 'You (Candidate)'}
                        </div>
                        {log.text
                          .replace(/\[.*?\]/g, '')
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
