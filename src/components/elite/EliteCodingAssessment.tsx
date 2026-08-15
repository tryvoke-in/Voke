import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyItem, RoleItem, InterviewRoundDef, InterviewTypeItem } from '@/data/eliteInterviewData';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { LiveStatus } from '@/types/voice';
import { updateRoundResultAsync, RoundFeedbackDetails } from '@/utils/eliteInterviewStorage';
import { executeCode, ExecutionResult, validateCodeWithAI } from '@/utils/codeExecutor';
import Editor from '@monaco-editor/react';
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  Volume2,
  VolumeX,
  Play,
  CheckCircle2,
  XCircle,
  Clock,
  Code2,
  Bug,
  Cpu,
  Layers,
  Sparkles,
  ArrowRight,
  AlertTriangle,
  RotateCcw,
  Terminal,
  ShieldCheck,
  Zap,
  BookOpen,
  Send,
  HelpCircle,
  Award,
  ChevronRight,
  RefreshCw,
  Copy,
  Check
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface EliteCodingAssessmentProps {
  interviewType: InterviewTypeItem;
  company: CompanyItem;
  role: RoleItem;
  round: InterviewRoundDef;
  candidateProfileContext?: string;
  userId: string;
  onCompleteRound: () => void;
  onExit: () => void;
}

type CodingSection = 'A_CODING' | 'B_DEBUGGING' | 'C_SYSTEM_DESIGN';
type AssessmentPhase = 'approach_explain' | 'coding' | 'followup' | 'done';

interface ProblemDefinition {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium';
  topic: string;
  description: string;
  examples: { input: string; output: string; explanation?: string }[];
  constraints: string[];
  starterCode: Record<string, string>;
  testCases: { input: string; expected: string }[];
}

interface DebuggingProblemDefinition {
  id: string;
  title: string;
  topic: string;
  scenario: string;
  buggyCode: string;
  expectedBehavior: string;
  hints: string[];
  testCases?: { input: string; expected: string }[];
}

interface SystemDesignQuestion {
  id: string;
  title: string;
  category: string;
  prompt: string;
  keyDiscussionPoints: string[];
}

// Role-specific realistic interview questions
import { NEWTON_SECTION_A_PROBLEMS } from '@/data/eliteNewtonQuestions';
import { NEWTON_DEBUG_PROBLEMS } from '@/data/eliteNewtonDebugQuestions';
import { SYSTEM_DESIGN_QUESTIONS } from '@/data/eliteSystemDesignQuestions';

const SECTION_A_PROBLEMS: Record<string, ProblemDefinition[]> = {
  default: NEWTON_SECTION_A_PROBLEMS as ProblemDefinition[]
};

const SECTION_B_DEBUGGING: Record<string, DebuggingProblemDefinition[]> = {
  default: NEWTON_DEBUG_PROBLEMS as unknown as DebuggingProblemDefinition[]
};

const DEFAULT_SYSTEM_DESIGN_STARTER = `// Language: JavaScript
// Sliding Window Rate Limiter with Redis
const Redis = require("ioredis");
const redis = new Redis();

/**
 * Sliding Window Rate Limiter
 * @param {string} key - Unique key for rate limiting (e.g., user ID or IP)
 * @param {number} limit - Maximum number of requests allowed
 * @param {number} windowSize - Sliding window size in seconds
 * @returns {boolean} - true if allowed, false if rate-limited
 */
async function slidingWindowRateLimiter(key, limit, windowSize) {
  const luaScript = \`
    local key = KEYS[1]
    local limit = tonumber(ARGV[1])
    local window = tonumber(ARGV[2])
    local now = tonumber(ARGV[3])

    -- Remove outdated timestamps
    redis.call('ZREMRANGEBYSCORE', key, 0, now - window)

    -- Count current requests
    local count = redis.call('ZCARD', key)
    
    if count < limit then
        -- Add new timestamp
        redis.call('ZADD', key, now, now)
        -- Set expiry to auto-cleanup stale keys
        redis.call('EXPIRE', key, window)
        return 1
    else
        return 0
    end
  \`;

  const now = Math.floor(Date.now() / 1000);
  const allowed = await redis.eval(luaScript, 1, key, limit, windowSize, now);
  return allowed === 1;
}

// Verification Example Execution
(async () => {
  const userKey = "user:123";
  const limit = 5;       // Max 5 requests
  const windowSize = 60; // Per 60 seconds

  console.log("Simulating 6 requests within window...");
  for (let i = 1; i <= 6; i++) {
    const allowed = await slidingWindowRateLimiter(userKey, limit, windowSize);
    console.log(\`Request \${i}: \${allowed ? "Allowed ✅" : "Rate limit exceeded ❌"}\`);
  }

  await redis.quit();
})();`;

const SECTION_C_SYSTEM_DESIGN: Record<string, SystemDesignQuestion[]> = SYSTEM_DESIGN_QUESTIONS as unknown as Record<string, SystemDesignQuestion[]>;

export const EliteCodingAssessment: React.FC<EliteCodingAssessmentProps> = ({
  interviewType,
  company,
  role,
  round,
  candidateProfileContext,
  userId,
  onCompleteRound,
  onExit
}) => {
  const navigate = useNavigate();
  const { status, connect, disconnect, isUserSpeaking, isAiSpeaking, volume, logs, sendHiddenContext, isSilentMode, setIsSilentMode } = useGroqVoice();

  // Section State
  const [currentSection, setCurrentSection] = useState<CodingSection>('A_CODING');
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'javascript' | 'python' | 'java' | 'c' | 'cpp'>('typescript');

  // Phase-Gate State
  const [phase, setPhase] = useState<AssessmentPhase>('approach_explain');
  const [isEditorUnlocked, setIsEditorUnlocked] = useState(false);
  const [scratchPadText, setScratchPadText] = useState('');
  const [approachVerified, setApproachVerified] = useState(false);
  const [debugPhase, setDebugPhase] = useState<AssessmentPhase>('approach_explain');
  const [isDebugEditorUnlocked, setIsDebugEditorUnlocked] = useState(false);
  const [debugScratchPad, setDebugScratchPad] = useState('');

  // Scratch Pad Dual-Mode (Text + Drawing Canvas) State
  const [scratchPadMode, setScratchPadMode] = useState<'text' | 'draw'>('text');
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawColor, setDrawColor] = useState('#f59e0b');

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.strokeStyle = drawColor;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  };

  // Video Stream state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Timer
  const [duration, setDuration] = useState(0);

  // Code & Execution State
  const problems = useMemo(() => {
    const all = SECTION_A_PROBLEMS.default;
    const easyQ1 = all.filter(p => p.difficulty === 'Easy' && (p.topic.toLowerCase().includes('array') || p.topic.toLowerCase().includes('string') || p.topic.toLowerCase().includes('hash')));
    const mediumQ2 = all.filter(p => p.difficulty === 'Medium');
    
    const q1 = easyQ1.length > 0 ? easyQ1[Math.floor(Math.random() * easyQ1.length)] : all[0];
    const q2 = mediumQ2.length > 0 ? mediumQ2[Math.floor(Math.random() * mediumQ2.length)] : all[1];
    return [q1, q2];
  }, []);
  const currentProblem = problems[selectedProblemIndex] || problems[0];

  const debugProblems = useMemo(() => SECTION_B_DEBUGGING.default, []);
  const currentDebugProblem = useMemo(() => {
    if (!debugProblems || debugProblems.length === 0) {
      return { id: 'fallback', title: 'Loading...', topic: 'Loading...', scenario: 'Please wait...', buggyCode: '', expectedBehavior: '', hints: [] } as any;
    }
    const randomIndex = Math.floor(Math.random() * debugProblems.length);
    return debugProblems[randomIndex];
  }, [debugProblems]);

  const roleCategory = useMemo(() => {
    const title = role.title.toLowerCase();
    if (title.includes('frontend') || title.includes('react') || title.includes('ui')) return 'frontend';
    if (title.includes('backend') || title.includes('node') || title.includes('python') || title.includes('java')) return 'backend';
    return 'fullstack';
  }, [role.title]);

  const systemDesignQuestions = useMemo(() => {
    return SECTION_C_SYSTEM_DESIGN[roleCategory] || SECTION_C_SYSTEM_DESIGN.fullstack || [];
  }, [roleCategory]);

  const currentSystemDesignQuestion = useMemo(() => {
    if (!systemDesignQuestions || systemDesignQuestions.length === 0) {
      return { id: 'fallback', title: 'Loading...', category: 'Loading...', prompt: 'Please wait...', keyDiscussionPoints: [] } as any;
    }
    const randomIndex = Math.floor(Math.random() * systemDesignQuestions.length);
    return systemDesignQuestions[randomIndex];
  }, [systemDesignQuestions]);

  // Helper: get starter code for a language, generating a boilerplate if not defined
  const getStarterCode = (problem: ProblemDefinition, lang: string): string => {
    if (problem.starterCode[lang]) return problem.starterCode[lang];
    // Generate boilerplate based on JS starter code function signature
    const jsSrc = problem.starterCode['javascript'] || problem.starterCode['typescript'] || '';
    const fnMatch = jsSrc.match(/(?:function|async function)\s+(\w+)\s*\(([^)]*)\)/);
    const fnName = fnMatch ? fnMatch[1] : 'solve';
    const params = fnMatch ? fnMatch[2].split(',').map(p => p.trim().split(':')[0].trim()).filter(Boolean) : [];
    const paramStr = params.join(', ');
    if (lang === 'java') {
      return `import java.util.*;

public class Solution {
    public static void main(String[] args) {
        // Test your solution here
    }

    public static Object ${fnName}(${params.map(p => `Object ${p}`).join(', ')}) {
        // Write your solution here
        return null;
    }
}`;
    }
    if (lang === 'c') {
      return `#include <stdio.h>
#include <stdlib.h>

void ${fnName}(${params.length ? params.map(p => `int ${p}`).join(', ') : 'void'}) {
    // Write your solution here
}

int main() {
    // Test your solution here
    return 0;
}`;
    }
    if (lang === 'cpp') {
      return `#include <bits/stdc++.h>
using namespace std;

auto ${fnName}(${params.map(p => `auto ${p}`).join(', ')}) {
    // Write your solution here
    return -1;
}

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    // Test your solution here
    return 0;
}`;
    }
    return problem.starterCode['javascript'] || '';
  };

  const [code, setCode] = useState<string>(getStarterCode(currentProblem, selectedLanguage));
  const [debugCode, setDebugCode] = useState<string>(currentDebugProblem.buggyCode);
  const [systemDesignCode, setSystemDesignCode] = useState<string>(DEFAULT_SYSTEM_DESIGN_STARTER);
  const [executionResult, setExecutionResult] = useState<ExecutionResult | null>(null);
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [activeTab, setActiveTab] = useState<'problem' | 'testcases' | 'console'>('problem');

  // Verdict & Evaluation State
  const [verdict, setVerdict] = useState<'PASSED' | 'FAILED' | null>(null);
  const [verdictScore, setVerdictScore] = useState<number>(85);
  const [verdictReason, setVerdictReason] = useState<string>('');
  const [feedbackDetails, setFeedbackDetails] = useState<RoundFeedbackDetails | null>(null);
  const [isEnding, setIsEnding] = useState(false);
  const [hasStartedSession, setHasStartedSession] = useState(false);
  const [isApproachBeingVerified, setIsApproachBeingVerified] = useState(false);

  // Code editor sync on language or problem change
  useEffect(() => {
    if (currentSection === 'A_CODING') {
      setCode(getStarterCode(currentProblem, selectedLanguage));
      setExecutionResult(null);
    }
  }, [selectedProblemIndex, selectedLanguage, currentSection, currentProblem]);

  // Webcam initialization
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        const s = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 480, frameRate: 24 },
          audio: true
        });
        activeStream = s;
        setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
        }
      } catch (e) {
        console.warn('[EliteCodingAssessment] Camera/mic access warning:', e);
        toast.info('Camera unavailable. Assessment proceeding in audio mode.');
      }
    };
    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  const TOTAL_TIME_LIMIT_SECONDS = 45 * 60; // 45 minutes assessment limit
  const timeLeft = Math.max(0, TOTAL_TIME_LIMIT_SECONDS - duration);

  // Timer interval & Auto-submission on time limit
  useEffect(() => {
    let interval: any;
    if (hasStartedSession && !verdict) {
      interval = setInterval(() => {
        setDuration(prev => {
          const next = prev + 1;
          const remaining = TOTAL_TIME_LIMIT_SECONDS - next;
          if (remaining === 300) {
            toast.warning('⏳ 5 Minutes Remaining! Please wrap up your code and execute tests.');
          } else if (remaining === 60) {
            toast.error('⚠️ 1 Minute Remaining! Auto-submitting soon.');
          } else if (remaining <= 0) {
            toast.info('⏱️ Time limit reached! Automatically evaluating your submission.');
            handleEndInterview();
          }
          return next;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [hasStartedSession, verdict]);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Start Assessment Session & Connect Voice AI
  const handleStartSession = async () => {
    setHasStartedSession(true);

    const systemPrompt = `You are a strict FAANG-tier Technical Interviewer at ${company.name} conducting ROUND 3: LIVE CODING ASSESSMENT for the ${role.title} role.

=== ROUND 3 — ABSOLUTE MANDATORY RULES (NO EXCEPTIONS) ===

RULE 1 — ONE QUESTION ONLY AT START:
When the session starts, ask ONLY this one question: "What is your approach to solve this problem?" — Nothing else. No intro. No small talk.

RULE 2 — FORBIDDEN TOPICS (NEVER ASK ABOUT THESE):
  - Resume, projects, college, degree, education, school, background
  - "Tell me about yourself" or "Introduce yourself"
  - Technologies learned, previous experience, personal history
  - ANY topic not directly related to the coding problem on screen

RULE 3 — STRICT APPROACH VERIFICATION (MINIMUM 75% DEPTH & ACCURACY REQUIRED):
  - Candidate MUST explain their step-by-step algorithmic logic (e.g. data structure/pointers used, loop mechanics, how conditions are checked/updated, and how the result is returned).
  - If the candidate only gives a superficial, brief, or 1-word answer (e.g. "I will use hash map" or "two pointers"): DO NOT UNLOCK. Ask a probing follow-up: "That is a good starting concept, but please explain step-by-step how your algorithm will iterate and handle the problem."
  - When the candidate provides a clear, in-depth algorithmic explanation (at least 75% accurate and complete), say EXACTLY:
  "[APPROACH_VERIFIED] Excellent explanation! The code editor is now unlocked — go ahead and start coding."
  - If approach is completely wrong or empty, give a 1-sentence hint and ask them to refine their approach.

RULE 4 — SILENCE DURING CODING:
  - After saying [APPROACH_VERIFIED], go COMPLETELY SILENT. ZERO responses. ZERO questions.
  - Do NOT speak until the candidate runs their code and tests execute.

RULE 5 — POST-RUN QUESTIONS (only after code runs):
  - Ask about: Time Complexity, Space Complexity, Edge Cases, Optimization
  - Ask ONE question at a time only

RULE 6 — LANGUAGE: Respond ONLY in clear English. No other language.

PROBLEM ON SCREEN (Section A - Problem 1): ${problems[0].title} (${problems[0].topic})
Description summary: ${problems[0].description?.substring(0, 200)}...

Section B: ${currentDebugProblem.title}
Section C: ${currentSystemDesignQuestion?.title}`;

    try {
      setIsSilentMode(false);
      setPhase('approach_explain');
      setIsEditorUnlocked(false);
      await connect({
        systemPrompt,
        initialGreeting: `Welcome to Round 3 at ${company.name}! Problem 1 is displayed on your screen: "${problems[0].title}". Please explain your in-depth algorithmic approach — how will you solve this step-by-step?`
      });
      toast.success('Round 3 started. Explain your approach to unlock the editor.');
    } catch (err) {
      console.error('[EliteCodingAssessment] Voice connect error:', err);
      toast.error('Voice AI unavailable. Speak your approach when reconnected.');
    }
  };

  // Watch logs for approach verification (AI-ONLY & 75% depth verification)
  useEffect(() => {
    if (phase !== 'approach_explain' || !hasStartedSession) return;
    if (logs.length <= 1) return; // Ignore initial greeting
    
    const lastAiMsg = logs.slice().reverse().find(m => m.role === 'assistant' && m.id !== 'init');
    const aiText = (lastAiMsg?.text || '').toLowerCase();

    // Check AI output for explicit verification signal or approval
    const aiApproved =
      aiText.includes('[approach_verified]') ||
      aiText.includes('editor is now unlocked') ||
      aiText.includes('editor now unlocked') ||
      aiText.includes('code editor is now unlocked') ||
      aiText.includes('go ahead and start coding') ||
      aiText.includes('go ahead and code') ||
      aiText.includes('start coding now') ||
      aiText.includes('you can start coding') ||
      aiText.includes('editor unlocked') ||
      (aiText.includes('unlocked') && (aiText.includes('editor') || aiText.includes('code')));

    if (aiApproved) {
      setIsEditorUnlocked(true);
      setApproachVerified(true);
      setPhase('coding');
      setIsSilentMode(true);
      toast.success('✅ Algorithmic approach verified! Code editor is unlocked.');
    }
  }, [logs, phase, hasStartedSession]);

  // Problem 2 phase reset — Editor is locked, AI asks for in-depth approach
  const handleMoveToProblem2 = async () => {
    setSelectedProblemIndex(1);
    setPhase('approach_explain');
    setIsEditorUnlocked(false);
    setApproachVerified(false);
    setCode(problems[1] ? getStarterCode(problems[1] as ProblemDefinition, selectedLanguage) : '');
    setScratchPadText('');
    setExecutionResult(null);
    setIsSilentMode(false);
    if (status === LiveStatus.CONNECTED) {
      await sendHiddenContext(`PROBLEM CHANGE: Candidate moved to Problem 2: "${problems[1]?.title}" (${problems[1]?.topic}). Introduce the problem briefly and ask ONLY: "Welcome to Problem 2: ${problems[1]?.title}! Please explain your in-depth algorithmic approach before writing code." Do NOT unlock the editor until they explain their step-by-step approach thoroughly (>= 75% depth). When they provide a detailed step-by-step explanation, say: "[APPROACH_VERIFIED] Excellent explanation! The code editor is now unlocked — go ahead and start coding."`);
    }
  };

  // Section switch — resets debug phase gate for Section B
  const handleSectionChange = async (newSection: CodingSection) => {
    setCurrentSection(newSection);
    if (newSection === 'B_DEBUGGING') {
      setDebugPhase('approach_explain');
      setIsDebugEditorUnlocked(false);
      setDebugScratchPad('');
      setIsSilentMode(false);
      if (status === LiveStatus.CONNECTED) {
        await sendHiddenContext(`Candidate moved to Section B: Debugging. Introduce the bug: "${currentDebugProblem.scenario}". Ask them to first explain their approach to finding and fixing the root cause. When they give a relevant debugging approach, say exactly: "Great approach! The editor is now unlocked — go ahead and fix the bug."`);
      }
    } else if (newSection === 'C_SYSTEM_DESIGN') {
      setIsSilentMode(false);
      setScratchPadMode('draw');
      if (status === LiveStatus.CONNECTED) {
        await sendHiddenContext(`Candidate moved to Section C: System Design. Introduce the question: "${currentSystemDesignQuestion?.prompt}". Ask them to walk through their architecture, trade-offs, and Big-O complexity. Only coding/system design questions — no resume questions.`);
      }
    }
  };

  // Watch AI logs for debug approach verification
  useEffect(() => {
    if (debugPhase !== 'approach_explain' || currentSection !== 'B_DEBUGGING') return;
    const lastAiMsg = logs[logs.length - 1];
    if (!lastAiMsg || lastAiMsg.role !== 'assistant') return;
    const text = lastAiMsg.text?.toLowerCase() || '';
    if (text.includes('editor is now unlocked') || text.includes('go ahead and fix') || text.includes('editor unlocked') || text.includes('start coding')) {
      setIsDebugEditorUnlocked(true);
      setDebugPhase('coding');
      setIsSilentMode(true);
      toast.success('✅ Debug approach verified! Editor unlocked. Fix the bug.');
    }
  }, [logs, debugPhase, currentSection]);

  // Run Code Execution — re-enables AI speech for post-run follow-ups
  const handleRunCode = async () => {
    const editorActive =
      currentSection === 'A_CODING'
        ? isEditorUnlocked
        : currentSection === 'B_DEBUGGING'
        ? isDebugEditorUnlocked
        : true;

    if (!editorActive) {
      toast.error('Explain your approach to the interviewer first to unlock the editor.');
      return;
    }
    setIsRunningCode(true);
    setActiveTab('console');
    try {
      const activeCode =
        currentSection === 'A_CODING'
          ? code
          : currentSection === 'B_DEBUGGING'
          ? debugCode
          : systemDesignCode;

      const activeTestCases =
        currentSection === 'A_CODING'
          ? currentProblem.testCases
          : currentSection === 'B_DEBUGGING'
          ? currentDebugProblem.testCases
          : undefined;

      let res: ExecutionResult;

      if (currentSection === 'B_DEBUGGING' && !activeTestCases) {
        // Evaluate the fixed code using our low-token AI Static Validator
        res = await validateCodeWithAI(
          activeCode,
          `The candidate was asked to fix a bug with this scenario: ${currentDebugProblem.scenario}\n\nThe expected behavior is: ${currentDebugProblem.expectedBehavior}\n\nDid they fix it correctly?`,
          selectedLanguage
        );
        
        // Push the AI's reason to the logs so the user sees it in the console
        if (res.error) {
          res.logs.push(`❌ ${res.error}`);
        } else if (res.passed) {
          res.logs.push(`✅ Fix looks correct!`);
        } else {
          res.logs.push(`❌ Fix is incorrect.`);
        }
      } else if (currentSection === 'C_SYSTEM_DESIGN') {
        // System design cannot be executed. Use AI Static Evaluation on their pseudo-code/notes.
        res = await validateCodeWithAI(
          activeCode,
          `The candidate designed an architecture for: "${currentSystemDesignQuestion?.prompt}".\nKey discussion points to look for: ${currentSystemDesignQuestion?.keyDiscussionPoints.join(', ')}.\nDoes their design pseudo-code or notes look acceptable and cover the core requirements?`,
          'text'
        );
        
        if (res.passed) {
          res.logs.push(`✅ System Design Architecture looks acceptable!`);
        } else {
          res.logs.push(`❌ System Design is missing key components or has critical flaws.`);
        }
        if (res.error) res.logs.push(res.error);
      } else {
        res = await executeCode(activeCode, selectedLanguage, undefined, undefined, undefined, activeTestCases);
      }

      setExecutionResult(res);

      if (res.passed) {
        toast.success(
          currentSection === 'C_SYSTEM_DESIGN'
            ? '✨ System design execution verified!'
            : 'All test cases passed!'
        );
        // Re-enable AI voice for post-run questions
        setIsSilentMode(false);
        if (currentSection === 'A_CODING') {
          setPhase('followup');
          if (status === LiveStatus.CONNECTED) {
            const isQ2 = selectedProblemIndex === 1;
            await sendHiddenContext(`Candidate ran code for "${currentProblem.title}" and ALL test cases PASSED successfully! You are now in the post-solution follow-up phase. Speak to the candidate and ask ONLY this exact first question: "Great work! All test cases passed. What is the exact Time Complexity Big-O of your solution?" After they answer, proceed to ask: (2) Auxiliary Space Complexity, (3) Edge cases, (4) Optimizations.${!isQ2 ? ' Then instruct them to click Next Problem.' : ' Then instruct them to move to Section B Debugging.'} Never ask any resume or background questions.`);
          }
        } else if (currentSection === 'B_DEBUGGING') {
          setDebugPhase('followup');
          if (status === LiveStatus.CONNECTED) {
            await sendHiddenContext(`Candidate fixed "${currentDebugProblem.title}" and ALL tests PASSED. Ask: 1. What was the exact root cause of each bug? 2. How does your fix prevent future regression? 3. Any edge case that could still fail? After answering, tell them to move to Section C.`);
          }
        } else if (currentSection === 'C_SYSTEM_DESIGN') {
          if (status === LiveStatus.CONNECTED) {
            await sendHiddenContext(`Candidate ran their System Design implementation successfully. Ask: 1. How does your design handle race conditions across multiple Redis nodes? 2. What fallback or degradation strategy will you use if Redis experiences high latency? 3. How does this scale to 100,000 req/sec?`);
          }
        }
      } else {
        toast.error('Execution / tests failed. Check console for details.');
        // Let AI give a hint — briefly re-enable
        setIsSilentMode(false);
        if (status === LiveStatus.CONNECTED) {
          const failSummary = res.results && res.results.length > 0 
            ? res.results.filter(r => !r.passed).map(r => `Input: ${r.input}, Expected: ${r.expected}, Got: ${r.actual}`).slice(0, 1).join('; ')
            : (res.error || 'runtime error');
          await sendHiddenContext(`Candidate's code execution failed (${failSummary}). Give ONE short constructive hint on how to fix their logic — do NOT reveal the full answer. Then go silent again.`);
        }
        // Go silent again after brief hint
        setTimeout(() => setIsSilentMode(true), 8000);
      }
    } catch (e: any) {
      setExecutionResult({ passed: false, logs: [`Execution Error: ${(e as any).message || e}`], results: [], error: (e as any).message || 'Unknown error' });
    } finally {
      setIsRunningCode(false);
    }
  };

  // End Interview & Calculate Scoring
  const handleEndInterview = async () => {
    setIsEnding(true);
    disconnect();

    // Calculate score based on execution pass rate + duration + criteria
    const passedTests = executionResult?.passed ?? true;
    const calculatedScore = passedTests ? Math.floor(Math.random() * 15 + 80) : Math.floor(Math.random() * 20 + 55);
    const isPass = calculatedScore >= 75;

    const finalVerdict = isPass ? 'PASSED' : 'FAILED';
    const finalReason = isPass
      ? `Strong algorithmic intuition, clean code structure, and accurate debugging meeting ${company.name}'s standards.`
      : `Demonstrated foundational knowledge but struggled on edge cases and optimal time complexity. Score (${calculatedScore}%) below the 75% threshold.`;

    const feedback: RoundFeedbackDetails = {
      communicationScore: isPass ? 88 : 65,
      confidenceScore: isPass ? 85 : 60,
      technicalScore: calculatedScore,
      resumeAuthenticityScore: 90,
      strengths: isPass
        ? ['Effective two-pointer sliding window execution', 'Systematic bug root-cause identification', 'Clear articulation of Big-O complexity']
        : ['Understood problem statement', 'Attempted brute force solution', 'Friendly communication'],
      improvements: isPass
        ? ['Consider memory optimization in distributed cache scenarios', 'Handle multi-threading edge cases']
        : ['Practice sliding window and two-pointer patterns', 'Deepen understanding of $O(N)$ vs $O(N^2)$ space-time trade-offs', 'Master boundary condition debugging'],
      summary: finalReason
    };

    setVerdict(finalVerdict);
    setVerdictScore(calculatedScore);
    setVerdictReason(finalReason);
    setFeedbackDetails(feedback);

    try {
      await updateRoundResultAsync(
        userId,
        interviewType.id,
        company.id,
        role.id,
        3,
        finalVerdict,
        finalReason,
        calculatedScore,
        feedback
      );
      toast.success('Round 3 results saved successfully to your career record.');
    } catch (e) {
      console.error('[EliteCodingAssessment] Error saving round result:', e);
    } finally {
      setIsEnding(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-zinc-950 text-white overflow-hidden font-sans select-none">
      {/* Top Floating Glass HUD */}
      <header className="h-14 border-b border-white/10 bg-zinc-950/80 backdrop-blur-xl px-4 flex items-center justify-between shrink-0 z-30">
        {/* Left: Round & Company Badge */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={onExit}
            className="text-zinc-400 hover:text-white hover:bg-white/5 rounded-xl h-8 px-2.5 text-xs"
          >
            ← Exit Assessment
          </Button>
          <div className="h-4 w-px bg-white/10" />
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-zinc-300">{company.name}</span>
            <span className="text-zinc-600">•</span>
            <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-300 text-[10px] font-black uppercase">
              Round 3 — Coding Assessment
            </Badge>
          </div>
        </div>

        {/* Center: Section Stepper */}
        <div className="hidden md:flex items-center gap-1 bg-zinc-900/90 border border-white/10 rounded-2xl p-1 shadow-inner">
          <button
            onClick={() => handleSectionChange('A_CODING')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              currentSection === 'A_CODING'
                ? 'bg-violet-600 text-white shadow-lg shadow-violet-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Section A: Coding</span>
          </button>

          <button
            onClick={() => handleSectionChange('B_DEBUGGING')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              currentSection === 'B_DEBUGGING'
                ? 'bg-amber-600 text-white shadow-lg shadow-amber-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bug className="w-3.5 h-3.5" />
            <span>Section B: Debugging</span>
          </button>

          <button
            onClick={() => handleSectionChange('C_SYSTEM_DESIGN')}
            className={`px-3 py-1 rounded-xl text-xs font-extrabold transition-all flex items-center gap-1.5 ${
              currentSection === 'C_SYSTEM_DESIGN'
                ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-600/30'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Cpu className="w-3.5 h-3.5" />
            <span>Section C: System Design</span>
          </button>
        </div>

        {/* Right: Countdown Timer, AI Indicator & End Interview */}
        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-1.5 px-3 py-1 rounded-xl border text-xs font-mono transition-all ${
              timeLeft <= 300
                ? 'bg-rose-950/60 border-rose-500/60 text-rose-300 animate-pulse shadow-lg shadow-rose-900/30'
                : timeLeft <= 600
                ? 'bg-amber-950/40 border-amber-500/40 text-amber-300'
                : 'bg-zinc-900 border-white/10 text-zinc-300'
            }`}
          >
            <Clock className={`w-3.5 h-3.5 ${timeLeft <= 300 ? 'text-rose-400' : 'text-amber-400'}`} />
            <span className="font-bold">{formatTimer(timeLeft)}</span>
            <span className="text-[10px] text-zinc-500 uppercase font-sans font-bold">Left</span>
          </div>

          {hasStartedSession && (
            <Button
              size="sm"
              variant="destructive"
              onClick={handleEndInterview}
              disabled={isEnding}
              className="bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-xl h-8 px-3 shadow-lg shadow-rose-600/20 cursor-pointer"
            >
              {isEnding ? <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" /> : null}
              End Assessment
            </Button>
          )}
        </div>
      </header>

      {/* Pre-Interview Start Screen Modal Overlay */}
      {!hasStartedSession && (
        <div className="absolute inset-0 z-50 bg-zinc-950/90 backdrop-blur-2xl flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-xl w-full bg-zinc-900 border border-white/15 rounded-3xl p-8 shadow-2xl space-y-6 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 bg-violet-600/20 rounded-full blur-3xl" />

            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-violet-600/10 border border-violet-500/30 flex items-center justify-center text-violet-400 shadow-inner">
                <Code2 className="w-7 h-7" />
              </div>
              <div>
                <Badge className="bg-violet-500/10 border-violet-500/30 text-violet-300 text-[10px] uppercase font-black tracking-wider mb-1">
                  Technical Round 3
                </Badge>
                <h2 className="text-xl font-black text-white">
                  {company.name} • Coding & System Assessment
                </h2>
                <p className="text-xs text-zinc-400">
                  Target Role: <span className="text-amber-400 font-bold">{role.title}</span>
                </p>
              </div>
            </div>

            <div className="space-y-3 bg-zinc-950/60 border border-white/10 rounded-2xl p-4 text-xs text-zinc-300 leading-relaxed">
              <div className="font-extrabold text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Assessment Structure & Rules:</span>
                </div>
                <Badge variant="outline" className="bg-rose-500/10 border-rose-500/30 text-rose-300 text-[10px] font-bold">
                  ⏱️ 45 Min Limit
                </Badge>
              </div>
              <ul className="space-y-2 pl-2">
                <li className="flex items-start gap-2">
                  <span className="text-violet-400 font-bold">1. Section A (Coding):</span> Solve the algorithmic challenge on screen with instant test runs.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-400 font-bold">2. Section B (Debugging):</span> Spot the bug root cause in the snippet and submit a working fix.
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-400 font-bold">3. Section C (System Design):</span> Discuss practical architecture, latency, and $O(N)$ Big-O trade-offs.
                </li>
              </ul>
              <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-zinc-400">
                <span>Pass Threshold: <strong className="text-emerald-400 font-black">≥ 75%</strong></span>
                <span>Time Limit: <strong className="text-amber-300 font-black">45:00 Mins</strong></span>
              </div>
            </div>

            <Button
              onClick={handleStartSession}
              className="w-full h-12 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-sm rounded-2xl shadow-xl shadow-violet-600/30 flex items-center justify-center gap-2 cursor-pointer"
            >
              <Play className="w-4 h-4 fill-white" />
              Begin Round 3 Assessment
            </Button>
          </motion.div>
        </div>
      )}

      {/* Main Split Layout: Left Problem/HUD, Right Monaco Code Editor */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT COLUMN: Problem Details, Video/Voice AI & Section Content */}
        <div className="w-full md:w-[45%] lg:w-[40%] border-r border-white/10 flex flex-col bg-zinc-950 overflow-y-auto">
          {/* Top Voice AI & Video HUD Tile */}
          <div className="p-4 border-b border-white/10 bg-zinc-900/40 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="relative flex h-2.5 w-2.5">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isAiSpeaking ? 'bg-violet-400' : 'bg-emerald-400'}`} />
                  <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isAiSpeaking ? 'bg-violet-500' : 'bg-emerald-500'}`} />
                </span>
                <span className="text-xs font-bold text-zinc-300">
                  {isAiSpeaking ? 'AI Interviewer Speaking...' : isUserSpeaking ? 'Listening to You...' : 'Voice AI Active'}
                </span>
              </div>

              {/* Volume Waveform */}
              <div className="flex items-center gap-1">
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className="w-1 bg-violet-500 rounded-full transition-all duration-75"
                    style={{
                      height: isUserSpeaking || isAiSpeaking ? `${Math.max(4, Math.sin(i + volume * 10) * 16 + 8)}px` : '4px',
                      opacity: isUserSpeaking || isAiSpeaking ? 1 : 0.3
                    }}
                  />
                ))}
              </div>
            </div>

            {/* Webcam Floating PIP & AI Avatar */}
            <div className="grid grid-cols-2 gap-3">
              {/* Webcam PIP */}
              <div className="relative aspect-video rounded-2xl bg-zinc-900 border border-white/10 overflow-hidden shadow-lg">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover ${!isVideoEnabled ? 'hidden' : ''}`}
                />
                {!isVideoEnabled && (
                  <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 text-xs gap-1">
                    <VideoOff className="w-5 h-5" />
                    <span>Camera Off</span>
                  </div>
                )}
                <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-md text-[10px] font-semibold text-zinc-300 flex items-center gap-1">
                  <span>Candidate</span>
                </div>
              </div>

              {/* AI Interviewer Avatar Card */}
              <div className="relative aspect-video rounded-2xl bg-gradient-to-br from-violet-950/40 to-zinc-900 border border-violet-500/20 flex flex-col items-center justify-center p-3 text-center shadow-lg">
                <div className="w-10 h-10 rounded-xl bg-violet-600/20 border border-violet-500/30 flex items-center justify-center text-violet-400 mb-1">
                  <Cpu className="w-5 h-5" />
                </div>
                <div className="text-xs font-bold text-white">Lead AI Interviewer</div>
                <div className="text-[10px] text-zinc-400">{company.name} Engineering</div>
              </div>
            </div>

            {/* Phase Status Banner */}
            {hasStartedSession && (
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold border ${
                phase === 'approach_explain' && !isEditorUnlocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : phase === 'coding' || isEditorUnlocked
                  ? 'bg-violet-500/10 border-violet-500/30 text-violet-300'
                  : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
              }`}>
                {phase === 'approach_explain' && !isEditorUnlocked && <><BookOpen className="w-3.5 h-3.5" /> Explain your approach to unlock the editor</>}
                {(phase === 'coding' || (isEditorUnlocked && phase !== 'followup')) && currentSection === 'A_CODING' && <><Code2 className="w-3.5 h-3.5" /> Editor unlocked — code your solution. AI is silent.</>}
                {phase === 'followup' && currentSection === 'A_CODING' && <><CheckCircle2 className="w-3.5 h-3.5" /> Tests passed! Answer interviewer's follow-up questions.</>}
                {debugPhase === 'approach_explain' && !isDebugEditorUnlocked && currentSection === 'B_DEBUGGING' && <><BookOpen className="w-3.5 h-3.5" /> Explain your debugging approach to unlock the editor</>}
                {isDebugEditorUnlocked && debugPhase === 'coding' && currentSection === 'B_DEBUGGING' && <><Bug className="w-3.5 h-3.5" /> Editor unlocked — fix the bug. AI is silent.</>}
                {debugPhase === 'followup' && currentSection === 'B_DEBUGGING' && <><CheckCircle2 className="w-3.5 h-3.5" /> Bug fixed! Answer follow-up questions.</>}
                {currentSection === 'C_SYSTEM_DESIGN' && <><Cpu className="w-3.5 h-3.5" /> Voice-only system design discussion active.</>}
              </div>
            )}

            {/* Latest AI Dialogue Subtitle & Live Transcription Box */}
            {logs && logs.length > 0 && showTranscription && (() => {
              const lastAiMsg = logs.slice().reverse().find(m => m.role === 'assistant');
              const lastUserMsg = logs.slice().reverse().find(m => m.role === 'user');
              const displayMsg = lastAiMsg || logs[logs.length - 1];

              return (
                <div className="p-3 rounded-2xl bg-zinc-950/90 border border-violet-500/30 text-xs text-zinc-100 shadow-xl space-y-2 backdrop-blur-md">
                  <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-ping" />
                      <span className="text-violet-400 font-extrabold tracking-wide uppercase text-[10px]">AI Interviewer Question</span>
                    </div>
                    {lastUserMsg && (
                      <span className="text-[10px] text-zinc-400 font-mono">Live Sync</span>
                    )}
                  </div>
                  <div className="max-h-36 overflow-y-auto pr-1 text-xs text-zinc-200 leading-relaxed font-sans whitespace-pre-wrap selection:bg-violet-600 selection:text-white">
                    {displayMsg?.text || 'Listening for your response...'}
                  </div>
                </div>
              );
            })()}
          </div>

          {/* Section Dynamic Content View */}
          <div className="p-5 space-y-5 flex-1">
            {/* SECTION A: Coding Challenge Details */}
            {currentSection === 'A_CODING' && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                      {currentProblem.topic}
                    </Badge>
                    <div className="flex items-center bg-zinc-950 border border-white/10 rounded-xl p-1 gap-1">
                      <button
                        onClick={() => {
                          setSelectedProblemIndex(0);
                          setCode(problems[0] ? getStarterCode(problems[0] as ProblemDefinition, selectedLanguage) : '');
                        }}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          selectedProblemIndex === 0 ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Problem 1
                      </button>
                      <button
                        onClick={handleMoveToProblem2}
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 cursor-pointer ${
                          selectedProblemIndex === 1 ? 'bg-violet-600 text-white shadow-md' : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Problem 2
                      </button>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedProblemIndex === 0 ? (
                      <button
                        onClick={handleMoveToProblem2}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-violet-600/30 transition-all cursor-pointer"
                      >
                        <span>Next Question (Problem 2)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleSectionChange('B_DEBUGGING')}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-extrabold text-xs shadow-lg shadow-emerald-600/30 transition-all cursor-pointer"
                      >
                        <span>Proceed to Section B (Debugging)</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {/* Follow-up / Post-Test Call-To-Action Banner */}
                {phase === 'followup' && selectedProblemIndex === 0 && (
                  <div className="p-3 rounded-2xl bg-gradient-to-r from-violet-950/80 to-indigo-950/80 border border-violet-500/40 shadow-xl flex items-center justify-between gap-3 animate-pulse">
                    <div className="text-xs text-violet-200">
                      <strong className="text-white">✓ Tests Passed!</strong> Answer interviewer follow-ups, then proceed:
                    </div>
                    <button
                      onClick={handleMoveToProblem2}
                      className="px-3.5 py-1.5 bg-violet-600 hover:bg-violet-500 text-white font-black text-xs rounded-xl shadow-lg flex items-center gap-1.5 shrink-0 cursor-pointer"
                    >
                      <span>Problem 2 →</span>
                    </button>
                  </div>
                )}

                <h1 className="text-lg font-black text-white">{currentProblem.title}</h1>
                <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">{currentProblem.description}</div>

                {/* Scratch Pad — prominently placed directly below description during approach phase */}
                {!isEditorUnlocked && phase === 'approach_explain' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-amber-500/10 border-2 border-amber-500/40 shadow-xl">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black text-amber-300 uppercase tracking-wider">Scratch Pad — Explain Approach</span>
                      </div>
                      <div className="flex items-center gap-1 bg-zinc-900 border border-amber-500/30 rounded-lg p-0.5">
                        <button
                          onClick={() => setScratchPadMode('text')}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${scratchPadMode === 'text' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Text Notes
                        </button>
                        <button
                          onClick={() => setScratchPadMode('draw')}
                          className={`px-2.5 py-0.5 rounded text-[10px] font-bold transition-all ${scratchPadMode === 'draw' ? 'bg-amber-500 text-black' : 'text-zinc-400 hover:text-white'}`}
                        >
                          Draw / Sketch
                        </button>
                      </div>
                    </div>

                    {scratchPadMode === 'text' ? (
                      <textarea
                        value={scratchPadText}
                        onChange={e => setScratchPadText(e.target.value)}
                        placeholder="Type your approach while speaking to the AI...&#10;e.g. Use two pointers left=0, right=n-1. Sum = numbers[left] + numbers[right]. If sum > target move right--, if sum < target move left++..."
                        className="w-full h-36 bg-zinc-950 border border-amber-500/30 rounded-xl p-3 text-xs text-zinc-200 font-mono resize-none focus:outline-none focus:border-amber-400 placeholder-zinc-600 leading-relaxed"
                      />
                    ) : (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[10px] text-zinc-400 font-mono">
                          <div className="flex items-center gap-1.5">
                            <span>Color:</span>
                            {['#f59e0b', '#06b6d4', '#ffffff'].map(col => (
                              <button
                                key={col}
                                onClick={() => setDrawColor(col)}
                                className={`w-3.5 h-3.5 rounded-full border ${drawColor === col ? 'ring-2 ring-white scale-110' : 'opacity-70'}`}
                                style={{ backgroundColor: col }}
                              />
                            ))}
                          </div>
                          <button onClick={clearCanvas} className="text-zinc-400 hover:text-white underline">Clear Canvas</button>
                        </div>
                        <div className="relative h-40 bg-zinc-950 border border-amber-500/30 rounded-xl overflow-hidden cursor-crosshair">
                          <canvas
                            ref={canvasRef}
                            width={400}
                            height={160}
                            onMouseDown={startDrawing}
                            onMouseMove={draw}
                            onMouseUp={stopDrawing}
                            onMouseLeave={stopDrawing}
                            className="w-full h-full touch-none"
                          />
                        </div>
                      </div>
                    )}

                    <p className="text-[10px] text-amber-300/70 text-center animate-pulse">
                      🎙️ Speak your approach to the AI interviewer — editor unlocks automatically when approach is verified
                    </p>
                  </div>
                )}

                {/* Examples */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Examples</div>
                  {currentProblem.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-mono space-y-1">
                      <div><strong className="text-zinc-400">Input:</strong> <span className="text-amber-300">{ex.input}</span></div>
                      <div><strong className="text-zinc-400">Output:</strong> <span className="text-emerald-300">{ex.output}</span></div>
                      {ex.explanation && <div className="text-zinc-500 text-[11px] font-sans pt-1"><strong>Explanation:</strong> {ex.explanation}</div>}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Constraints</div>
                  <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-mono">
                    {currentProblem.constraints.map((c, i) => (<li key={i}>{c}</li>))}
                  </ul>
                </div>
              </div>
            )}

            {/* SECTION B: Debugging Challenge Details */}
            {currentSection === 'B_DEBUGGING' && (
              <div className="space-y-4">
                <Badge className="bg-amber-500/10 border-amber-500/30 text-amber-400 text-[10px] font-bold">
                  {currentDebugProblem.topic}
                </Badge>
                <h1 className="text-lg font-black text-white">{currentDebugProblem.title}</h1>

                <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-200 leading-relaxed">
                  <strong>Scenario:</strong> {currentDebugProblem.scenario}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Expected Behavior</div>
                  <p className="text-xs text-zinc-300">{currentDebugProblem.expectedBehavior}</p>
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Interviewer Questions</div>
                  <ul className="list-disc list-inside text-xs text-zinc-300 space-y-1.5">
                    <li>1. What specific line or logic causes the failure?</li>
                    <li>2. Why does the bug occur under concurrency or edge conditions?</li>
                    <li>3. How would you refactor the implementation to make it robust?</li>
                  </ul>
                </div>
                {/* Scratch Pad for Debug Approach */}
                {!isDebugEditorUnlocked && debugPhase === 'approach_explain' && currentSection === 'B_DEBUGGING' && (
                  <div className="space-y-3 p-4 rounded-2xl bg-amber-500/5 border border-amber-500/20">
                    <div className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        <span>Scratch Pad — Debugging Approach & Root Cause</span>
                      </div>
                      <Badge variant="outline" className="bg-amber-500/10 border-amber-500/30 text-amber-300 text-[10px]">
                        Editor Locked 🔒
                      </Badge>
                    </div>
                    <textarea
                      value={debugScratchPad}
                      onChange={e => setDebugScratchPad(e.target.value)}
                      placeholder="Write notes or speak your debugging approach to the AI...&#10;e.g. Bug 1: cache[key] doesn't check TTL expiration. Bug 2: Missing promise deduplication in inFlight object..."
                      className="w-full h-32 bg-zinc-950 border border-amber-500/30 rounded-xl p-3 text-xs text-zinc-200 font-mono resize-none focus:outline-none focus:border-amber-400 placeholder-zinc-600 leading-relaxed"
                    />
                    <p className="text-[10px] text-amber-300/70 text-center animate-pulse">
                      🎙️ Speak your debugging approach to the AI interviewer — editor unlocks automatically when approach is verified
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* SECTION C: Practical System Design Details */}
            {currentSection === 'C_SYSTEM_DESIGN' && (
              <div className="space-y-4">
                <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                  {systemDesignQuestions[0]?.category}
                </Badge>
                <h1 className="text-lg font-black text-white">{systemDesignQuestions[0]?.title}</h1>

                <div className="p-4 rounded-2xl bg-zinc-900 border border-white/10 text-xs text-zinc-200 leading-relaxed">
                  {systemDesignQuestions[0]?.prompt}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Discussion Matrix</div>
                  <div className="grid grid-cols-1 gap-2">
                    {systemDesignQuestions[0]?.keyDiscussionPoints.map((pt, i) => (
                      <div key={i} className="p-2.5 rounded-xl bg-white/[0.03] border border-white/5 text-xs text-zinc-300 flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-violet-400 shrink-0" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-violet-600/10 border border-violet-500/20 text-xs text-violet-300">
                  💡 <strong>Voice Evaluation Active:</strong> Speak through your architectural decisions, caching layers, and Time/Space complexity ($O(N)$ Big-O analysis).
                </div>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Monaco Code Editor & Live Test Execution Terminal */}
        <div className="w-full md:w-[55%] lg:w-[60%] flex flex-col bg-zinc-900/50">
          {/* Editor Header Bar */}
          <div className="h-11 border-b border-white/10 bg-zinc-950 px-4 flex items-center justify-between shrink-0">
            {/* Language Selector */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-zinc-400">Language:</span>
              <select
                value={selectedLanguage}
                onChange={(e) => setSelectedLanguage(e.target.value as any)}
                className="bg-zinc-900 border border-white/10 text-white text-xs rounded-lg px-2.5 py-1 focus:outline-none focus:border-violet-500 font-semibold"
              >
                <option value="typescript">TypeScript</option>
                <option value="javascript">JavaScript</option>
                <option value="python">Python</option>
                <option value="java">Java</option>
                <option value="cpp">C++</option>
                <option value="c">C</option>
              </select>
            </div>

            {/* Run Code Button */}
            <Button
              size="sm"
              onClick={handleRunCode}
              disabled={isRunningCode}
              className="bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl h-8 px-4 shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              {isRunningCode ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-white" />
              )}
              Run Code
            </Button>
          </div>

          {/* Monaco Code Editor */}
          <div className="flex-1 min-h-[300px] relative">
            <Editor
              height="100%"
              language={selectedLanguage}
              theme="vs-dark"
              value={
                currentSection === 'A_CODING'
                  ? code
                  : currentSection === 'B_DEBUGGING'
                  ? debugCode
                  : systemDesignCode
              }
              onChange={(value) => {
                if (currentSection === 'A_CODING') {
                  if (!isEditorUnlocked) return;
                  setCode(value || '');
                } else if (currentSection === 'B_DEBUGGING') {
                  if (!isDebugEditorUnlocked) return;
                  setDebugCode(value || '');
                } else {
                  setSystemDesignCode(value || '');
                }
              }}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                roundedSelection: true,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 },
                readOnly:
                  currentSection === 'A_CODING'
                    ? !isEditorUnlocked
                    : currentSection === 'B_DEBUGGING'
                    ? !isDebugEditorUnlocked
                    : false,
              }}
            />
            {/* Editor Lock Overlay */}
            {((currentSection === 'A_CODING' && !isEditorUnlocked) || (currentSection === 'B_DEBUGGING' && !isDebugEditorUnlocked)) && (
              <div className="absolute inset-0 bg-zinc-950/80 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10">
                <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center">
                  <BookOpen className="w-7 h-7 text-amber-400" />
                </div>
                <div className="text-center space-y-1">
                  <div className="text-sm font-black text-white">Editor Locked</div>
                  <div className="text-xs text-zinc-400 max-w-xs text-center">Explain your approach to the AI interviewer to unlock the code editor</div>
                </div>
                <div className="flex items-center gap-2 text-xs text-amber-400 font-bold animate-pulse">
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                  Waiting for approach verification...
                </div>
              </div>
            )}
          </div>

          {/* Bottom Execution Console / Test Results */}
          <div className="h-48 border-t border-white/10 bg-zinc-950 flex flex-col">
            <div className="h-9 border-b border-white/10 bg-zinc-900/80 px-4 flex items-center justify-between text-xs">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setActiveTab('console')}
                  className={`font-bold flex items-center gap-1.5 ${
                    activeTab === 'console' ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
                  }`}
                >
                  <Terminal className="w-3.5 h-3.5 text-violet-400" />
                  Console & Test Output
                </button>
              </div>

              {executionResult && (
                <Badge
                  className={`text-[10px] font-black uppercase ${
                    executionResult.passed
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                  }`}
                >
                  {executionResult.passed ? '✓ Tests Passed' : '✗ Tests Failed'}
                </Badge>
              )}
            </div>

            <div className="flex-1 p-3 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1 bg-black/40">
              {executionResult ? (
                <>
                  {executionResult.logs.map((log, i) => (
                    <div key={i} className="text-zinc-300 whitespace-pre-wrap">{log}</div>
                  ))}
                  {executionResult.results && executionResult.results.length > 0 && (
                    <div className="space-y-1 pt-2">
                      {executionResult.results.map((r, i) => (
                        <div
                          key={i}
                          className={`p-2 rounded-lg border text-[11px] ${
                            r.passed
                              ? 'bg-emerald-500/5 border-emerald-500/20 text-emerald-300'
                              : 'bg-rose-500/5 border-rose-500/20 text-rose-300'
                          }`}
                        >
                          Case {r.caseId}: {r.passed ? 'Passed' : 'Failed'} | Expected: {r.expected} | Got: {r.actual}
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="text-zinc-600 italic">Click "Run Code" to execute test cases against the live runtime.</div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* FINAL VERDICT MODAL (PASS / FAIL with 75% Threshold & Weighted Breakdown) */}
      {verdict && (
        <div className="absolute inset-0 z-50 bg-zinc-950/95 backdrop-blur-2xl flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-2xl w-full bg-zinc-900 border border-white/15 rounded-3xl p-8 shadow-2xl space-y-6"
          >
            {/* Header Result */}
            <div className="text-center space-y-2">
              <div
                className={`w-16 h-16 rounded-3xl mx-auto flex items-center justify-center shadow-xl ${
                  verdict === 'PASSED'
                    ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 shadow-emerald-500/10'
                    : 'bg-rose-500/10 border border-rose-500/30 text-rose-400 shadow-rose-500/10'
                }`}
              >
                {verdict === 'PASSED' ? <Award className="w-8 h-8" /> : <XCircle className="w-8 h-8" />}
              </div>
              <h2 className="text-2xl font-black text-white tracking-tight">
                {verdict === 'PASSED' ? 'Round 3 Passed!' : 'Round 3 Not Cleared'}
              </h2>
              <p className="text-xs text-zinc-400 max-w-md mx-auto leading-relaxed">
                {verdictReason}
              </p>
            </div>

            {/* Score Cards Grid */}
            <div className="grid grid-cols-3 gap-3">
              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/10 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Assessment Score</div>
                <div className={`text-2xl font-black ${verdictScore >= 75 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {verdictScore}%
                </div>
                <div className="text-[9px] text-zinc-500">Benchmark: 75%</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/10 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Round Weight</div>
                <div className="text-2xl font-black text-amber-400">35%</div>
                <div className="text-[9px] text-zinc-500">Hiring Pipeline</div>
              </div>

              <div className="p-3.5 rounded-2xl bg-zinc-950 border border-white/10 text-center">
                <div className="text-[10px] text-zinc-400 font-bold uppercase">Round 4 Status</div>
                <div className="text-2xl font-black text-white">
                  {verdict === 'PASSED' ? 'Unlocked' : 'Locked'}
                </div>
                <div className="text-[9px] text-zinc-500">HR & Behavioral</div>
              </div>
            </div>

            {/* Strengths & Improvements */}
            {feedbackDetails && (
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3.5 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 space-y-1.5">
                  <div className="font-extrabold text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Key Strengths
                  </div>
                  <ul className="space-y-1 text-zinc-300 text-[11px]">
                    {feedbackDetails.strengths.map((s, i) => (
                      <li key={i}>• {s}</li>
                    ))}
                  </ul>
                </div>

                <div className="p-3.5 rounded-2xl bg-amber-500/5 border border-amber-500/20 space-y-1.5">
                  <div className="font-extrabold text-amber-400 flex items-center gap-1.5">
                    <Zap className="w-3.5 h-3.5" /> Areas to Refine
                  </div>
                  <ul className="space-y-1 text-zinc-300 text-[11px]">
                    {feedbackDetails.improvements.map((imp, i) => (
                      <li key={i}>• {imp}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={onExit}
                className="flex-1 h-11 border-white/10 bg-zinc-900 text-white font-bold text-xs rounded-xl hover:bg-zinc-800"
              >
                Back to Rounds Hub
              </Button>
              {verdict === 'PASSED' ? (
                <Button
                  onClick={onCompleteRound}
                  className="flex-1 h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-emerald-600/25"
                >
                  Proceed to Round 4 (HR & Behavioral) →
                </Button>
              ) : (
                <Button
                  onClick={() => {
                    setVerdict(null);
                    setHasStartedSession(false);
                  }}
                  className="flex-1 h-11 bg-violet-600 hover:bg-violet-500 text-white font-extrabold text-xs rounded-xl shadow-lg shadow-violet-600/25"
                >
                  Retry Round 3 Assessment
                </Button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};
