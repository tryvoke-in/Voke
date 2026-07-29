import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { LiveStatus } from '@/types/voice';
import { CompanyItem, RoleItem, InterviewRoundDef, InterviewTypeItem } from '@/data/eliteInterviewData';
import { updateRoundResultAsync, fetchSelectedGithubRepo, saveSelectedGithubRepo } from '@/utils/eliteInterviewStorage';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, CheckCircle2, XCircle,
  Sparkles, ShieldCheck, User, Award, Clock,
  Volume2, Zap, Radio, MessageSquare, FileText, Subtitles,
  GitBranch, FolderCode, Check, Github, Search, Loader2,
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
  userId: string;
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
  userId,
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
  const [isFetchingRepo, setIsFetchingRepo] = useState(true);
  const [hasStartedSession, setHasStartedSession] = useState(false);

  // Check for existing saved repo
  useEffect(() => {
    const checkSavedRepo = async () => {
      const saved = await fetchSelectedGithubRepo(userId, interviewType.id, company.id, role.id);
      if (saved && availableRepos.includes(saved)) {
        setSelectedProject(saved);
        setIsPreInterviewSetupOpen(false); // Skip modal if already selected
      }
      setIsFetchingRepo(false);
    };
    checkSavedRepo();
  }, [userId, interviewType.id, company.id, role.id, availableRepos]);

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

  const handleStartInterview = async () => {
    if (!selectedProject) {
      toast.error('Please select a project to proceed.');
      return;
    }
    
    // Save selected project to DB
    await saveSelectedGithubRepo(userId, interviewType.id, company.id, role.id, selectedProject);

    setIsPreInterviewSetupOpen(false);
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

    const domainFocusMandate = isFrontend
      ? `=== DOMAIN: FRONTEND ENGINEERING (${role.title} at ${company.name}) ===
Your interrogation must stay inside the frontend engineering universe. Every question you ask must be anchored to what a real frontend engineer does in ${selectedProject}:
- Component design, React architecture, rendering strategies (CSR/SSR/SSG if applicable)
- State management decisions — why Context vs Redux vs Zustand vs local state
- JavaScript/TypeScript fundamentals as demonstrated in real code they wrote
- API integration from the client side — fetch, axios, error handling, loading states
- CSS approaches, responsive design, accessibility considerations they made
- Web performance — bundle size, code splitting, lazy loading, Lighthouse scores
- How they handled cross-browser quirks, race conditions, or UI edge cases`
      : isBackend
      ? `=== DOMAIN: BACKEND ENGINEERING (${role.title} at ${company.name}) ===
Your interrogation must stay inside the backend engineering universe. Every question must be anchored to the server-side work in ${selectedProject}:
- REST API design — endpoint naming, HTTP methods, status codes, error handling strategy
- Database schema design, normalization decisions, indexing choices they actually made
- Authentication & authorization flows — JWT lifecycle, session management, OAuth implementation
- Server-side logic, middleware, request validation, input sanitization
- Node.js/Python runtime specifics — async patterns, event loops, process management
- Caching strategies — Redis, in-memory, HTTP caching headers they actually implemented
- Security practices — CORS, rate limiting, SQL injection prevention, env variable handling`
      : `=== DOMAIN: FULL STACK ENGINEERING (${role.title} at ${company.name}) ===
Your interrogation must balance both frontend and backend concerns in ${selectedProject}:
- Client-server communication: how the UI actually talks to the API, what the data flow looks like
- React architecture on the frontend AND the Express/Node/backend API structure
- Database integration from both query design (backend) and how the data is consumed (frontend)
- Authentication flow end-to-end: from login button click all the way to a protected route response
- State management on the client AND data persistence on the server
- Full request lifecycle: what happens from the moment a user triggers an action`;

    const companyToneCalibration = company.name === 'Google'
      ? `COMPANY TONE (Google): Be crisp, precise, and intellectually rigorous. Google values systems thinking and scalable architecture. Probe deeply on WHY decisions were made — not just what was built. When a candidate gives a good answer, push into the harder version of the same concept. Expect candidates to think at scale.`
      : company.name === 'Meta'
      ? `COMPANY TONE (Meta): Be direct, fast-paced, and product-focused. Meta values move-fast pragmatism — probe on real tradeoffs made under time pressure, not theoretical ideals. Ask how they iterated, what they would do differently, and how their component decisions affected user experience.`
      : company.name === 'Microsoft'
      ? `COMPANY TONE (Microsoft): Be methodical and quality-focused. Microsoft values engineering rigor, testing discipline, and modular architecture. Probe on how they structured code for maintainability, what tests they wrote, and how their design choices would hold up as the codebase grows.`
      : company.name === 'Amazon'
      ? `COMPANY TONE (Amazon): Be outcome-driven and dive-deep oriented. Amazon's bar-raiser culture demands specificity — push them to be specific about exactly WHAT they did, WHAT broke, HOW they fixed it, and WHAT metrics improved. Never accept vague answers. Always follow up.`
      : `COMPANY TONE (${company.name}): Be professional, technically sharp, and genuinely curious. Probe for depth — not breadth. When they mention something specific to ${selectedProject}, follow it. Let their answers guide you deeper rather than switching topics.`;

    const systemPrompt = `
ROLE: You are a Senior Technical Interviewer at ${company.name} conducting Round 2 — Technical & Project Deep Dive.
CANDIDATE ROLE: ${role.title}
PROJECT UNDER EVALUATION: "${selectedProject}"
SESSION VARIATION SEED: ${Date.now()}_${Math.floor(Math.random() * 10000)}

${projectCtx}

CANDIDATE RESUME CONTEXT:
${rawCleanedContext || 'No resume context available.'}

${domainFocusMandate}

${companyToneCalibration}

=== WHAT THIS ROUND IS AND IS NOT ===
Round 1 already covered background, communication style, and resume walkthrough. You have that data. You do NOT need to revisit it.
Round 2 is a surgical technical interrogation of "${selectedProject}" — one project, deep. Every question you ask must connect back to actual decisions, actual implementations, or actual problems the candidate encountered while building this project.
You are NOT a quiz machine reading from a list. You are a senior engineer who just spent 20 minutes reading their GitHub repo and wants to understand what they actually know. Think that way. React to what they say. Go deeper when something is interesting. Simplify when something is unclear. Follow threads.

=== NATURAL CONVERSATIONAL STYLE — MANDATORY ===
1. WARM BUT PROFESSIONAL OPENING:
   - Open with a brief, natural intro that acknowledges Round 1 is done and this is the technical deep dive.
   - Example tone: "Good to continue. So I've had a look at ${selectedProject} — let's get into it. What problem is this actually solving, and who's the intended user?"
   - Do NOT say "Welcome to Round 2 of your interview, my name is..." — that's stiff and robotic. Speak like a real engineer who knows them from Round 1.

2. RESPOND TO WHAT THEY ACTUALLY SAID:
   - Before each question, use a SHORT (2-5 word max) natural acknowledgement of their previous answer.
   - Examples: "Right, that makes sense.", "Okay, interesting.", "Got it — so then...", "Fair enough.", "Hmm, okay. And then...", "That's a reasonable choice."
   - NEVER say "Great answer!", "Wow, that's impressive!", "Congratulations on that!", or any hollow compliment. Real interviewers don't do that.
   - NEVER repeat or rephrase what the candidate just said back to them. Acknowledge briefly, then move.

3. DYNAMIC QUESTION GENERATION — NON-NEGOTIABLE:
   - NEVER ask from a pre-written script. Generate each question fresh based on what the candidate just told you.
   - If they mention a specific technology, library, or decision — probe THAT. Don't switch to a generic question.
   - If they give a weak answer, dig into the same concept from a simpler angle before moving on.
   - If they give a strong answer, immediately escalate to the harder dimension of that same topic.
   - Vary your phrasing every time. Never ask the same structural question twice (e.g. don't keep saying "walk me through...").

4. ONE QUESTION ONLY PER TURN:
   - Ask exactly one focused, sharp question per turn. Never compound two questions into one.
   - Keep every question to 1-2 sentences maximum. Under 25 words is the target.

=== 5-PHASE INTERROGATION FRAMEWORK ===
Move through all five phases naturally. Never announce which phase you are in. Never say "let's move to the next topic." Let the candidate's answers pull the conversation deeper — follow every thread they open, because threads they open voluntarily reveal what they actually know. A candidate who genuinely built this project will give you specific, unsolicited detail. Someone who didn't will give you confident-sounding generalities. Your job across all five phases is to find that difference.

PHASE 1 — Project Understanding (EASY):
This phase is about establishing ground truth before you push hard. Your opening question should be warm but direct — acknowledge that Round 1 is behind you and dive straight into the project. What you need to extract here covers three things, and you should not move to Phase 2 until you have all three clearly established.

First: the real-world problem ${selectedProject} solves and who it is specifically built for. "I made a task management app" is not acceptable. Push for specificity — what type of user, what pain point exactly, what did they experience before this existed. The more specific their answer, the more likely they built it themselves.

Second: the candidate's personal contribution. "I worked on the full stack" is not acceptable. Push until you know exactly which features, which files, which components, which API routes they personally wrote. If it was a team project, what was their slice? If they built it solo, ask what took the longest and why. People who built something remember what was hard. People who didn't will give you a flat summary.

Third: the tech stack with at least one considered reason per major piece. If they list technologies without reasoning — stop and ask immediately. "Why React for this?" should come in Phase 1 if they didn't explain it, not Phase 2. A person who chose a technology deliberately can always tell you why. Someone who copied a tutorial cannot.

What a strong Phase 1 answer looks like: they give you unprompted specifics — exact feature names, a bug they hit, a design decision they argued for, a library they chose and replaced. That's ownership. What a weak Phase 1 answer looks like: smooth, high-level, could describe any project — no friction, no detail, nothing that could only be said by the person who built it.

PHASE 2 — Technical Decision Making (MEDIUM):
Now that you know what they built, probe the WHY behind every significant technical choice. Your goal is to distinguish deliberate engineering decisions from cargo-culted defaults. A candidate who chose React because "it's what I know" is very different from one who chose it because of a specific requirement like component reuse or ecosystem maturity.

For every major technology in their stack, find the alternative they didn't choose and ask why. Do not ask about technologies that aren't in their stack. Only probe what they actually used. If they used React, ask why not Vue, Angular, or Svelte — and push for a reason tied to ${selectedProject}'s specific requirements, not general industry opinions. If they used MongoDB or another NoSQL database, ask whether they considered a relational database and what made that tradeoff clear. If they used REST, ask why not GraphQL — especially if their frontend has complex nested data requirements. If they implemented JWT authentication, ask about the token expiry strategy, what happens when a token is stolen, how they handle refresh, and whether they considered sessions instead and why they didn't.

When probing decisions, listen for the quality of the reasoning, not just the conclusion. An engineer who says "I chose MongoDB because our data structure was highly variable and we didn't have a fixed schema early on" is showing decision-making. An engineer who says "I chose MongoDB because it's fast and scalable" is showing they read a blog post. Push past the surface. Ask what they would choose differently today and why. Real builders have opinions and regrets. People who didn't build it will defend every choice as perfect.

If they made an unusual or non-obvious tech choice — something you wouldn't expect for a project like this — dig into it first. Unusual decisions reveal the most about real ownership.

PHASE 3 — Implementation Deep Dive (MEDIUM to HARD):
This is where the interview separates people who talked about a project from people who coded it. Stop asking about choices and reasoning. Start asking about actual implementations — how things work at the code level, step by step, without writing any code.

Pick the most architecturally interesting feature in ${selectedProject} based on what they've told you and ask them to explain how it actually works. Not conceptually — mechanically. What happens when the user triggers it, what code runs, in what order, what data moves where.

For authentication — which almost every project has — go end-to-end. The moment the user clicks login: what does the frontend send, to which endpoint, what does the backend do with it, how does it verify the password, what does it return, how does the frontend store that, how does it attach it to subsequent requests, what does a protected route check, how does token expiry get handled. Every gap in that chain is information.

For data fetching — ask what a real API call looks like in their frontend. Where is it triggered, what library or native API do they use, how do they handle the loading state, how do they handle an error response, what happens to the UI in each state. If they used React Query, SWR, or Zustand with async actions — ask why, and how they handled cache invalidation.

For the database schema — ask them to describe the main tables or collections, the relationships between them, the foreign keys or document references. Ask why a specific relationship is structured the way it is. Ask whether they use any indexes and what queries those indexes support. Ask what happens to query performance if that table grows to a million rows.

For state management — ask where global state lives in their application, what triggers a state update, how that state flows down to components, how they avoid prop drilling, and whether they ever had a stale state bug and how they debugged it. The answer to the last question is diagnostic — a real builder will remember a specific bug. Someone who didn't build it will give you a generic explanation of how React state works.

This entire phase should feel like you have their GitHub repo open and you are walking through it folder by folder. Every answer should give you more specific detail than the last.

PHASE 4 — Edge Cases & Debugging Mindset (HARD):
Every real application breaks in predictable and unpredictable ways. A developer who built and deployed ${selectedProject} has hit at least some of these. This phase is about finding whether they thought about failure or only about the happy path.

Start with failure scenarios tied specifically to their architecture. If they have a backend API, ask what happens to a frontend that is mid-request when the server goes down — does it timeout, does it retry with backoff, does the user get an error they understand or a white screen? If they have a database, ask what happens if a write fails halfway through a multi-step operation — do they have transactions, do they roll back, is the data left in a corrupted partial state?

Ask about concurrency. If two users load the same record, edit it, and both submit at the same time — which update wins, does one get silently overwritten, does the system detect the conflict? Did they implement any form of optimistic locking, version fields, or last-write-wins? If they didn't think about it, say so naturally and follow up with what they would implement if they had to handle it now.

Ask about duplicate submissions. What prevents a user from clicking submit twice on a slow network? Is there a loading state that disables the button? Is there server-side idempotency? Is the API endpoint safe to call twice with the same data? A developer who shipped something real has thought about this because users do it constantly.

Ask about performance degradation. If one of the core API endpoints in ${selectedProject} starts responding in 3 seconds instead of 200ms under load — how would they debug it? What tools would they use? What's the first thing they'd check? Push for a specific, ordered approach — not "I'd use a profiler." Which profiler? What would they look at first? What's the most likely root cause based on their stack?

Listen for the difference between candidates who describe failure modes from personal experience and candidates who recite textbook answers. Real builders say things like "this actually happened once when..." or "I hit this when I deployed to..." Theoretical knowledge sounds smooth and complete. Real experience sounds specific and slightly messy.

PHASE 5 — Scalability & Architectural Thinking (HARD):
Now zoom out completely. ${selectedProject} is no longer a student project — it has real users, real load, real infrastructure costs. This phase tests whether the candidate can think like an engineer who ships to production, not just to localhost.

Start with the weakest point in their current architecture. Ask them directly: if ${selectedProject} suddenly had to handle 100,000 concurrent users instead of the handful it has now, what breaks first? Push them to be specific — is it the database connection pool? The single API server with no horizontal scaling? The session storage? The file uploads going directly to the server filesystem? A candidate who has thought about scalability will know exactly where their current design cannot hold. A candidate who hasn't will give you a vague answer about "adding more servers."

Then go into API latency. Their current API might respond in 300ms. How would they get it to under 100ms under load? Push for a concrete plan: what gets cached and at what layer — in-memory, Redis, HTTP response headers? What queries get indexes added? What database calls get batched or eliminated? What operations get moved to a background worker? Do not accept "I'd use caching" — ask what specifically gets cached, where, with what invalidation strategy.

Then go into the database. If their read traffic grows 10x, what breaks in their current schema design? Would they add read replicas? Would they denormalize to eliminate joins? Would they introduce a caching layer in front of the DB? Would they partition or shard? Ask them to reason through the tradeoffs of at least one specific approach — what does it give them and what does it cost them.

Then go into deployment and operational maturity. What would a proper CI/CD pipeline for ${selectedProject} look like — not what they currently have, what it should look like. What does their deploy process do step by step: run tests, build artifacts, push to staging, run smoke tests, promote to production, what's the rollback strategy if something breaks in production? What monitoring would they add — what metrics, what alerts, what does an on-call engineer look at first when something goes wrong at 3am?

This phase is not about knowing buzzwords. It's about whether they can reason through a real engineering constraint with real tradeoffs. Someone who has genuinely thought about production will have opinions and uncertainty — they'll say "I'd probably start with X but I'd need to measure whether that's actually the bottleneck." Someone who hasn't will give you a clean, confident list of scaling patterns they've read about.

=== DYNAMIC DIFFICULTY — MANDATORY TOKEN SYSTEM ===
After every single candidate response, run this internal assessment silently before formulating your next question:

STRONG answer — They were specific, technically accurate, and clearly spoke from hands-on experience with ${selectedProject}. Their answer could only have come from someone who built it.
→ Append [DIFFICULTY_UP] at the very end of your response (after all spoken content). Push into a harder dimension of the same concept — not a new topic, the harder version of what they just answered.

AVERAGE answer — They were partially correct but drifted into generalities, gave the concept without the implementation detail, or answered correctly but vaguely.
→ No token. Hold difficulty. Come at the same concept from a different angle. Do not move to the next topic yet.

WEAK answer — They were wrong, evasive, said "I don't know", gave a textbook definition that didn't apply to their project, or clearly did not know what they were talking about.
→ Append [DIFFICULTY_DOWN] at the very end of your response. Step back to a simpler version of the same question. Give them one more chance on this concept before moving on.

TWO CONSECUTIVE WEAK answers — Do not continue. End the interview immediately.
→ Say naturally: "Alright, I think that's enough for today. Thanks for your time — we'll be in touch." Then output on a new line: [VERDICT: FAILED] [REASON: Candidate demonstrated insufficient hands-on technical depth and was unable to verify genuine project ownership for ${selectedProject} across repeated follow-up attempts.]

=== AI EVALUATION DIMENSIONS — WHAT YOU ARE SCORING THROUGHOUT ===
You are continuously evaluating the candidate across six dimensions. Weight every answer against all six:
1. Technical Depth — Do they know the implementation, not just the concept? Can they explain HOW, not just WHAT?
2. Project Ownership — Is it obvious they built this themselves? Do they know parts of the project you didn't ask about?
3. Architecture Understanding — Do they understand how every component connects? Could they draw the system diagram from memory?
4. Debugging Mindset — Do they think in failure modes? Do they have systematic approaches to diagnosing problems?
5. Decision Making — Did they make deliberate tradeoff decisions, or did they use the first option they knew?
6. Scalability Thinking — Can they reason about their system under real load with real constraints, not just describe patterns?

=== PASS / FAIL CRITERIA (75% threshold) ===
PASS requires demonstrating all six evaluation dimensions at an acceptable level:
- Clear project ownership: they built it, they know it in detail, unprompted specificity proves it.
- Technical reasoning with tradeoffs: WHY every major decision was made, not just what was chosen.
- End-to-end architecture understanding: they can trace any request from client to database and back.
- Debugging and failure-mode thinking: they have considered and handled real edge cases in this project.
- Evidence-based decision making: choices tied to actual project requirements, not cargo-culted defaults.
- At least foundational scalability awareness: they know what would break first and have a direction for fixing it.

FAIL if any of the following are true:
- They cannot explain core implementations in their own project with any specificity.
- They give two consecutive weak or evasive answers on the same concept.
- Their answers are consistently interchangeable with any generic project — nothing they say is specific to ${selectedProject}.
- It becomes evident through repeated probing that they did not personally build this project.
- They show zero debugging or failure-mode thinking across the entire session.

At the end of Phase 5, when the verdict is clear, close naturally — as a human interviewer would:
- PASS: "Alright, I think we've covered everything I needed to see. Good session on ${selectedProject} — the technical detail you went into makes it clear you built this. We'll follow up on next steps. [VERDICT: PASSED] [REASON: Candidate demonstrated strong project ownership, technical depth across all five phases, clear architectural reasoning, evidence-based decision making, a solid debugging mindset, and sound scalability thinking for ${selectedProject}.]"
- FAIL: "Okay, I think that's enough for today. Thanks for your time — we'll be in touch with feedback. [VERDICT: FAILED] [REASON: Candidate was unable to demonstrate sufficient technical depth, project ownership, or architectural understanding for ${selectedProject} across the required evaluation phases.]"

=== VOICE-ONLY RULES — NON-NEGOTIABLE ===
- ZERO markdown in any spoken response — no asterisks, no hashtags, no bullet points, no numbered lists, no backticks, no bold, no italics.
- Every spoken response must be natural, flowing prose — the way a real senior engineer speaks, not how a document reads.
- Every question must be 1-2 sentences only. Sharp. Direct. Under 25 words per question.
- NEVER ask the candidate to write code, type anything, or share their screen. Verbal explanation only, always.
- ALL control tokens ([DIFFICULTY_UP], [DIFFICULTY_DOWN], [VERDICT], [REASON]) are silent signals only — they must appear at the very end of the text output, after all spoken content, on their own line, where the TTS engine will not read them.
- NEVER re-introduce yourself or reference the round structure mid-interview. No "As we move into Phase 4..." — just ask the question.
- BANNED expressions (do not use under any circumstances): "Great!", "Excellent!", "That's amazing!", "Perfect answer!", "Wow", "Congratulations", "That's a great point", "Well done".
`;

    connect(systemPrompt);
  };

  // Round 2 — Verbal-only transcript evaluation (no video/body language analysis).
  // Scores 6 spec dimensions from what the candidate actually said:
  // Technical Depth (40%), Project Ownership (25%), Architecture Understanding (20%), Debugging+Decision Mindset (15%)
  const evaluateTranscriptPerformance = (
    aiVerdict: 'PASSED' | 'FAILED',
    aiReason?: string
  ): { finalVerdict: 'PASSED' | 'FAILED'; finalScore: number; reason: string; details: RoundFeedbackDetails } => {
    const userLogs = logs.filter(l => l.role === 'user');
    const userTexts = userLogs.map(l => l.text.trim());
    const fullTranscript = userTexts.join(' ');
    const wordCount = fullTranscript.split(/\s+/).filter(Boolean).length;
    const avgWordsPerAnswer = userLogs.length > 0 ? wordCount / userLogs.length : 0;
    const lowerTranscript = fullTranscript.toLowerCase();

    // Guard: no speech at all
    if (userLogs.length === 0 || fullTranscript.length === 0 || wordCount === 0) {
      return {
        finalVerdict: 'FAILED',
        finalScore: 0,
        reason: 'Interview attempt invalid — candidate did not speak or participate.',
        details: {
          communicationScore: 0,
          confidenceScore: 0,
          technicalScore: 0,
          resumeAuthenticityScore: 0,
          strengths: ['None — no candidate responses were recorded.'],
          improvements: ['Ensure microphone is working and speak clearly during the interview.'],
          summary: 'Interview attempt invalid — no verbal responses recorded.'
        }
      };
    }

    // Guard: interview abandoned after opening question only
    if (userLogs.length <= 1) {
      const introScore = Math.min(10, Math.max(5, Math.round(wordCount * 0.2)));
      return {
        finalVerdict: 'FAILED',
        finalScore: introScore,
        reason: `Interview ended prematurely. Candidate answered only 1 of ${round.questionCount || 12} questions — insufficient for technical evaluation.`,
        details: {
          communicationScore: Math.min(20, introScore + 10),
          confidenceScore: Math.min(15, introScore),
          technicalScore: 0,
          resumeAuthenticityScore: 0,
          strengths: ['Candidate was present and provided an initial response.'],
          improvements: [
            'Complete the full interview session — all 5 phases must be answered for a valid evaluation.',
            'Do not leave the interview before the AI interviewer delivers a closing verdict.'
          ],
          summary: 'Interview ended prematurely after the opening question. No technical evaluation was possible.'
        }
      };
    }

    // AI verdict sentiment — primary signal
    const rawAiReason = aiReason || '';
    const isAiFail = aiVerdict === 'FAILED' ||
      /gaps|lacked|struggled|lack of|insufficient|failed|cannot|inconsistencies|below|unprepared|ownership|evasive|vague|generic|did not|unable/i.test(rawAiReason);

    // ─── DIMENSION 1: Technical Depth ────────────────────────────────────────
    // Keywords covering Phase 2 (tech decisions) and Phase 3 (implementation)
    const techDepthKeywords = [
      ...role.skills.map(s => s.toLowerCase()),
      'react', 'vue', 'angular', 'svelte', 'javascript', 'typescript', 'jsx', 'tsx',
      'hooks', 'useeffect', 'usestate', 'usememo', 'usecallback', 'context', 'redux',
      'zustand', 'recoil', 'component', 'props', 'rendering', 'virtual dom', 'dom',
      'node', 'express', 'fastapi', 'django', 'flask', 'spring', 'nest',
      'rest', 'graphql', 'api', 'endpoint', 'route', 'middleware', 'controller',
      'jwt', 'oauth', 'token', 'refresh', 'session', 'cookie', 'bearer',
      'database', 'sql', 'nosql', 'schema', 'table', 'collection', 'document',
      'postgres', 'mysql', 'mongodb', 'firebase', 'supabase', 'prisma', 'orm',
      'fetch', 'axios', 'http', 'cors', 'async', 'await', 'promise', 'callback',
      'state', 'store', 'loading', 'error', 'response', 'request', 'payload'
    ];

    // ─── DIMENSION 2: Project Ownership ──────────────────────────────────────
    // Signals: specific feature names, personal pronouns of ownership, "I built", "I wrote", "my implementation"
    const ownershipKeywords = [
      'i built', 'i wrote', 'i implemented', 'i designed', 'i created', 'i added',
      'i decided', 'i chose', 'i picked', 'i used', 'i deployed', 'i configured',
      'my project', 'my code', 'my implementation', 'my approach', 'my design',
      'specifically', 'exactly', 'in my case', 'what i did', 'the way i', 'i handled',
      'i ran into', 'i hit a bug', 'i had a problem', 'i fixed', 'i debugged',
      selectedProject.toLowerCase()
    ];

    // ─── DIMENSION 3: Architecture Understanding ──────────────────────────────
    // Signals: system-level thinking, component connections, data flow
    const architectureKeywords = [
      'architecture', 'system', 'flow', 'pipeline', 'layer', 'structure', 'pattern',
      'frontend', 'backend', 'fullstack', 'client', 'server', 'database layer',
      'microservice', 'monolith', 'module', 'service', 'repository', 'abstraction',
      'separation of concerns', 'mvc', 'mvvm', 'clean architecture', 'solid',
      'end to end', 'request', 'response', 'lifecycle', 'flow', 'connection',
      'how it works', 'the way it connects', 'communicates', 'integrates'
    ];

    // ─── DIMENSION 4: Debugging Mindset ──────────────────────────────────────
    const debuggingKeywords = [
      'debug', 'debugger', 'console.log', 'breakpoint', 'trace', 'log', 'error',
      'exception', 'crash', 'fail', 'timeout', 'retry', 'fallback', 'graceful',
      'race condition', 'concurrency', 'conflict', 'duplicate', 'idempotent',
      'network error', 'status code', '500', '404', '429', '503', '401', '403',
      'what went wrong', 'root cause', 'first thing i check', 'profiler', 'monitor'
    ];

    // ─── DIMENSION 5: Decision Making ────────────────────────────────────────
    const decisionKeywords = [
      'tradeoff', 'trade-off', 'because', 'reason', 'why i chose', 'instead of',
      'over', 'compared to', 'alternative', 'considered', 'decided against',
      'pros and cons', 'benefit', 'drawback', 'limitation', 'constraint',
      'requirement', 'use case', 'makes sense for', 'better fit', 'suited for'
    ];

    // ─── DIMENSION 6: Scalability Thinking ───────────────────────────────────
    const scalabilityKeywords = [
      'scale', 'scalability', 'million', 'thousand', 'users', 'load', 'throughput',
      'latency', 'performance', 'bottleneck', 'horizontal', 'vertical', 'replica',
      'cache', 'caching', 'redis', 'cdn', 'queue', 'worker', 'background job',
      'index', 'indexing', 'query optimization', 'connection pool', 'rate limit',
      'ci/cd', 'deployment', 'pipeline', 'staging', 'production', 'rollback',
      'monitoring', 'alert', 'metric', 'logging', 'observability', 'uptime',
      'docker', 'kubernetes', 'load balancer', 'auto scaling', 'shard', 'partition'
    ];

    // Score each dimension by keyword match count (capped, scaled to 0-100)
    const matchDim = (keywords: string[]) => Array.from(new Set(keywords.filter(kw => lowerTranscript.includes(kw))));

    const techMatches = matchDim(techDepthKeywords);
    const ownMatches = matchDim(ownershipKeywords);
    const archMatches = matchDim(architectureKeywords);
    const debugMatches = matchDim(debuggingKeywords);
    const decisionMatches = matchDim(decisionKeywords);
    const scaleMatches = matchDim(scalabilityKeywords);

    // All matched unique terms for feedback reporting
    const allMatchedKeywords = Array.from(new Set([
      ...techMatches, ...archMatches, ...scaleMatches
    ]));

    // Per-dimension raw scores (based on keyword density + avg answer length)
    const scoreFromMatches = (matches: string[], multiplier: number, base: number, max: number) =>
      Math.min(max, Math.max(base, matches.length * multiplier + Math.round(avgWordsPerAnswer * 0.3)));

    let techScore: number;
    let ownershipScore: number;
    let architectureScore: number;
    let debugDecisionScore: number;

    if (isAiFail) {
      // Capped lower for failed sessions
      techScore        = Math.min(60, Math.max(25, techMatches.length * 4 + 25));
      ownershipScore   = Math.min(58, Math.max(20, ownMatches.length * 7 + 20));
      architectureScore= Math.min(58, Math.max(20, archMatches.length * 6 + 20));
      debugDecisionScore = Math.min(60, Math.max(20, (debugMatches.length + decisionMatches.length) * 4 + 20));
    } else {
      techScore        = Math.min(98, Math.max(72, techMatches.length * 3 + 65));
      ownershipScore   = Math.min(98, Math.max(75, ownMatches.length * 6 + 68));
      architectureScore= Math.min(96, Math.max(72, archMatches.length * 5 + 65));
      debugDecisionScore = Math.min(96, Math.max(70, (debugMatches.length + decisionMatches.length) * 4 + 62));
    }

    // Weighted overall score — Round 2 weights (spec: Technical 40%, Ownership 25%, Architecture 20%, Debug+Decision 15%)
    let overallScore = Math.round(
      techScore         * 0.40 +
      ownershipScore    * 0.25 +
      architectureScore * 0.20 +
      debugDecisionScore * 0.15
    );

    // Hard clamp to match 75% pass threshold
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
        ? `Candidate did not demonstrate sufficient technical ownership and depth on ${selectedProject} for the ${role.title} position at ${company.name}.`
        : `Candidate passed the Round 2 technical deep dive on ${selectedProject} for ${role.title} at ${company.name}.`
      );

    // Evidence-based feedback mapped to the 6 evaluation dimensions
    const strengths: string[] = [];
    const improvements: string[] = [];

    if (!isAiFail) {
      if (techMatches.length > 0)
        strengths.push(`Technical Depth: Used precise technical vocabulary throughout — ${techMatches.slice(0, 5).join(', ')}.`);
      if (ownMatches.length > 0)
        strengths.push(`Project Ownership: Answers were specific and personal — clearly spoke from direct build experience on ${selectedProject}.`);
      if (archMatches.length > 0)
        strengths.push('Architecture Understanding: Demonstrated end-to-end system awareness — connected frontend, backend, and database concerns.');
      if (debugMatches.length > 0 || decisionMatches.length > 0)
        strengths.push('Debugging & Decision Making: Showed systematic thinking on edge cases and explained technology tradeoffs with real reasoning.');
      if (scaleMatches.length > 0)
        strengths.push('Scalability Thinking: Reasoned through real-world constraints — bottlenecks, caching, latency, and deployment maturity.');
      if (avgWordsPerAnswer >= 40)
        strengths.push(`Communication: Gave well-developed answers averaging ${Math.round(avgWordsPerAnswer)} words — sufficient depth per question.`);

      improvements.push('Add specific numbers when discussing scalability — e.g., target latency in ms, expected user load, cache TTL values.');
      improvements.push('When explaining architecture, trace the full request path (client → API → DB → response) rather than describing components in isolation.');
    } else {
      if (techMatches.length < 5)
        improvements.push(`Technical Depth: Answers lacked specific implementation detail. Study the actual code in ${selectedProject} — be able to explain every function you wrote.`);
      if (ownMatches.length < 3)
        improvements.push('Project Ownership: Answers sounded generic — could apply to any project. Practice describing what YOU specifically built, not what the project does.');
      if (archMatches.length < 2)
        improvements.push('Architecture Understanding: Practice tracing a full request through your system — from UI click to database write and back.');
      if (debugMatches.length < 2)
        improvements.push('Debugging Mindset: Think about what breaks in your project. Practice explaining failure modes — what happens when the server crashes, when two users conflict, when a token expires mid-session.');
      if (decisionMatches.length < 2)
        improvements.push('Decision Making: For every technology you used, prepare a one-sentence tradeoff explanation — why THIS over the main alternative.');
      if (scaleMatches.length < 2)
        improvements.push('Scalability Thinking: Study the scaling story of your stack. Know what breaks first under load and have a concrete first step for fixing it.');

      strengths.push('Participated in a full voice technical interview session under live conditions.');
      strengths.push('Engaged with all five phases of the interrogation framework without abandoning the interview.');
    }

    return {
      finalVerdict,
      finalScore: overallScore,
      reason: cleanReason,
      details: {
        communicationScore: Math.min(98, Math.max(isAiFail ? 35 : 70, Math.round(avgWordsPerAnswer * (isAiFail ? 1.0 : 1.6) + (isAiFail ? 30 : 48)))),
        confidenceScore: debugDecisionScore,
        technicalScore: techScore,
        resumeAuthenticityScore: ownershipScore,
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

    // Step 1: Local transcript-based evaluation (verbal signals only — no video/body language)
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

      // Step 2: AI Evaluation — evaluate-interview edge function (Gemini → Groq fallback on server-side)
      // Round 2 is voice-only: no video upload, no body language analysis, no analyze-video-interview call.
      // Only the full conversation transcript is evaluated for technical depth, ownership, and reasoning.
      console.log('[EliteProjectDeepDive] Step 2 — Calling evaluate-interview (Gemini → Groq fallback)...');
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

      setVerdictScore(evaluation.finalScore);

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
          newSessionId
        );
        console.log('[EliteProjectDeepDive] DB result updated successfully');
      } catch (err) {
        console.error('[EliteProjectDeepDive] Failed to update round result:', err);
      }
      
    } catch (err) {
      console.error('[EliteProjectDeepDive] Failed to save session:', err);
    }

    // Navigate to results
    if (newSessionId) {
      navigate(`/voice-interview/results/${newSessionId}?from=elite`);
    } else {
      onCompleteRound(evaluation.finalVerdict);
    }
  };

  const handleManualEndSession = async () => {
    if (isEnding) return; // prevent double-click
    setIsEnding(true);
    const userMsgCount = logs.filter(l => l.role === 'user').length;
    const totalQ = round.questionCount || 12;
    const passed = userMsgCount >= Math.floor(totalQ * 0.75);
    await handleTriggerVerdict(
      passed ? 'PASSED' : 'FAILED',
      passed
        ? 'Candidate completed sufficient phases of the technical deep dive.'
        : 'Interview ended early before the technical evaluation threshold was met.'
    );
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const filteredRepos = availableRepos.filter(r => r.toLowerCase().includes(searchQuery.toLowerCase()));

  useEffect(() => {
    if (!isPreInterviewSetupOpen && selectedProject && !hasStartedSession) {
      setHasStartedSession(true);
      startCamera();
      initiateSession();
    }
  }, [isPreInterviewSetupOpen, selectedProject, hasStartedSession]);

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
                onClick={handleStartInterview}
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
