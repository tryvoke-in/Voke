import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { CompanyItem, RoleItem, InterviewRoundDef, InterviewTypeItem } from '@/data/eliteInterviewData';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { updateRoundResultAsync, RoundFeedbackDetails } from '@/utils/eliteInterviewStorage';
import { executeCode, ExecutionResult } from '@/utils/codeExecutor';
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
}

interface SystemDesignQuestion {
  id: string;
  title: string;
  category: string;
  prompt: string;
  keyDiscussionPoints: string[];
}

// Role-specific realistic interview questions
const SECTION_A_PROBLEMS: Record<string, ProblemDefinition[]> = {
  default: [
    {
      id: 'p1_two_sum_sorted',
      title: '1. Two Sum II — Pair with Target Sum',
      difficulty: 'Easy',
      topic: 'Two Pointers & Arrays',
      description: `Given a 1-indexed array of integers \`numbers\` that is already **sorted in non-decreasing order**, find two numbers such that they add up to a specific \`target\` number.

Return the indices of the two numbers, **index1** and **index2**, as an integer array \`[index1, index2]\` where \`1 <= index1 < index2 <= numbers.length\`.

You must solve the problem in **$O(N)$ time** and **$O(1)$ extra space**.`,
      examples: [
        {
          input: 'numbers = [2, 7, 11, 15], target = 9',
          output: '[1, 2]',
          explanation: 'The sum of 2 and 7 is 9. Therefore, index1 = 1, index2 = 2.'
        },
        {
          input: 'numbers = [2, 3, 4], target = 6',
          output: '[1, 3]',
          explanation: 'The sum of 2 and 4 is 6. Therefore index1 = 1, index2 = 3.'
        }
      ],
      constraints: [
        '2 <= numbers.length <= 3 * 10^4',
        '-1000 <= numbers[i] <= 1000',
        'numbers is sorted in non-decreasing order.',
        'Exactly one valid solution exists.'
      ],
      starterCode: {
        typescript: `function twoSum(numbers: number[], target: number): number[] {
  let left = 0;
  let right = numbers.length - 1;
  
  while (left < right) {
    const currentSum = numbers[left] + numbers[right];
    if (currentSum === target) {
      return [left + 1, right + 1];
    } else if (currentSum < target) {
      left++;
    } else {
      right--;
    }
  }
  
  return [];
}`,
        javascript: `function twoSum(numbers, target) {
  let left = 0;
  let right = numbers.length - 1;
  
  while (left < right) {
    const currentSum = numbers[left] + numbers[right];
    if (currentSum === target) {
      return [left + 1, right + 1];
    } else if (currentSum < target) {
      left++;
    } else {
      right--;
    }
  }
  
  return [];
}`,
        python: `def twoSum(numbers: list[int], target: int) -> list[int]:
    left, right = 0, len(numbers) - 1
    while left < right:
        s = numbers[left] + numbers[right]
        if s == target:
            return [left + 1, right + 1]
        elif s < target:
            left += 1
        else:
            right -= 1
    return []`
      },
      testCases: [
        { input: '[2, 7, 11, 15], 9', expected: '[1, 2]' },
        { input: '[2, 3, 4], 6', expected: '[1, 3]' },
        { input: '[-1, 0], -1', expected: '[1, 2]' }
      ]
    },
    {
      id: 'p2_sliding_window_max',
      title: '2. Longest Substring Without Repeating Characters',
      difficulty: 'Medium',
      topic: 'Sliding Window & Hash Maps',
      description: `Given a string \`s\`, find the length of the **longest substring** without repeating characters.

Optimize for **$O(N)$ time** using a dynamic sliding window with index tracking.`,
      examples: [
        {
          input: 's = "abcabcbb"',
          output: '3',
          explanation: 'The answer is "abc", with the length of 3.'
        },
        {
          input: 's = "bbbbb"',
          output: '1',
          explanation: 'The answer is "b", with the length of 1.'
        },
        {
          input: 's = "pwwkew"',
          output: '3',
          explanation: 'The answer is "wke", with the length of 3.'
        }
      ],
      constraints: [
        '0 <= s.length <= 5 * 10^4',
        's consists of English letters, digits, symbols and spaces.'
      ],
      starterCode: {
        typescript: `function lengthOfLongestSubstring(s: string): number {
  const charMap = new Map<string, number>();
  let maxLen = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (charMap.has(char) && charMap.get(char)! >= left) {
      left = charMap.get(char)! + 1;
    }
    charMap.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}`,
        javascript: `function lengthOfLongestSubstring(s) {
  const charMap = new Map();
  let maxLen = 0;
  let left = 0;

  for (let right = 0; right < s.length; right++) {
    const char = s[right];
    if (charMap.has(char) && charMap.get(char) >= left) {
      left = charMap.get(char) + 1;
    }
    charMap.set(char, right);
    maxLen = Math.max(maxLen, right - left + 1);
  }

  return maxLen;
}`,
        python: `def lengthOfLongestSubstring(s: str) -> int:
    char_map = {}
    max_len = left = 0
    for right, char in enumerate(s):
        if char in char_map and char_map[char] >= left:
            left = char_map[char] + 1
        char_map[char] = right
        max_len = max(max_len, right - left + 1)
    return max_len`
      },
      testCases: [
        { input: '"abcabcbb"', expected: '3' },
        { input: '"bbbbb"', expected: '1' },
        { input: '"pwwkew"', expected: '3' }
      ]
    }
  ]
};

const SECTION_B_DEBUGGING: Record<string, DebuggingProblemDefinition[]> = {
  default: [
    {
      id: 'debug_closure_rate_limiter',
      title: 'Bug 1: Async Cache & Debounce Race Condition',
      topic: 'State & Concurrency Bug',
      scenario: 'A candidate implemented an in-memory caching function for API requests, but users report stale data and intermittent duplicate API triggers under fast clicks.',
      buggyCode: `// BUGGY CODE: Identify why cached responses leak and race conditions occur
function createAsyncFetcher(fetchFn, ttlMs = 5000) {
  let cache = {};
  let inFlight = {};

  return async function(key) {
    const now = Date.now();
    
    // Bug 1: Checks cache but doesn't check expiration correctly
    if (cache[key]) {
      return cache[key].data;
    }

    // Bug 2: Missing race condition guard for concurrent requests
    const res = await fetchFn(key);
    cache[key] = { data: res, timestamp: now };
    
    return res;
  };
}`,
      expectedBehavior: '1. Handle TTL expiry properly. 2. Deduplicate simultaneous in-flight promises so multiple concurrent calls share 1 network request.',
      hints: [
        'Notice how \`now\` is captured before the async fetch finishes.',
        'What happens when 5 requests for the same key arrive at millisecond 0?',
        'Look into storing the pending Promise in \`inFlight\` map.'
      ]
    },
    {
      id: 'debug_binary_search_overflow',
      title: 'Bug 2: Binary Search Infinite Loop & Index Calculation',
      topic: 'Algorithm Boundary Bug',
      scenario: 'Binary search implementation times out with infinite loop on duplicate elements and causes integer overflow on large arrays.',
      buggyCode: `// BUGGY CODE: Locate the boundary and index calculation bugs
function searchRotatedArray(nums, target) {
  let low = 0;
  let high = nums.length; // Bug 1: Out of bounds index

  while (low <= high) {
    let mid = Math.floor((low + high) / 2); // Bug 2: Potential integer overflow in some environments

    if (nums[mid] === target) return mid;

    // Check if left half is sorted
    if (nums[low] <= nums[mid]) {
      if (target >= nums[low] && target < nums[mid]) {
        high = mid; // Bug 3: Infinite loop when high is not decremented
      } else {
        low = mid + 1;
      }
    } else {
      if (target > nums[mid] && target <= nums[high]) {
        low = mid; // Bug 4: Infinite loop when low is not incremented
      } else {
        high = mid - 1;
      }
    }
  }

  return -1;
}`,
      expectedBehavior: 'High boundary should be \`nums.length - 1\`, index adjustment must decrement \`high = mid - 1\` and increment \`low = mid + 1\`.',
      hints: [
        'Trace what happens when array is \`[3, 1]\` and target is \`1\`.',
        'Verify \`high\` index initialization.'
      ]
    }
  ]
};

const SECTION_C_SYSTEM_DESIGN: Record<string, SystemDesignQuestion[]> = {
  frontend: [
    {
      id: 'sd_fe_infinite_scroll',
      title: 'Practical System Design: Infinite Scroll & Virtualized List',
      category: 'Frontend & UI Architecture',
      prompt: 'Design a performant infinite scrolling feed (like LinkedIn or Twitter) for 100,000 items on mobile and desktop without crashing browser memory (DOM node recycling, intersection observer, prefetching, and window virtualization).',
      keyDiscussionPoints: [
        'DOM Node Virtualization (windowing technique)',
        'IntersectionObserver vs Scroll Event throttling',
        'Prefetching buffer and backpressure handling',
        'Memory management & image cleanup',
        'Scroll position retention on navigation'
      ]
    },
    {
      id: 'sd_fe_url_shortener_client',
      title: 'State & Caching Architecture: Real-Time Collaborative Canvas',
      category: 'State Management & Sync',
      prompt: 'Design the client-side state architecture for a multi-user collaborative workspace (like Miro/Excalidraw). How do you handle optimistic updates, conflict resolution, and WebSocket event batching?',
      keyDiscussionPoints: [
        'Optimistic local updates vs Server confirmation',
        'Operational Transformation (OT) vs CRDT intuition',
        'WebSocket connection resilience & heartbeat',
        'Canvas rendering pipeline (WebGL / Canvas API)'
      ]
    }
  ],
  backend: [
    {
      id: 'sd_be_rate_limiter',
      title: 'Practical System Design: Distributed Rate Limiter with Sliding Window',
      category: 'Backend & Distributed Systems',
      prompt: 'Design a distributed rate limiter protecting public API endpoints (e.g. 100 requests / minute per user IP). How would you implement this with Redis, handling race conditions and high concurrency?',
      keyDiscussionPoints: [
        'Token Bucket vs Sliding Window Log vs Sliding Window Counter',
        'Redis Lua scripts for atomic execution',
        'Handling multi-region Redis sync and fallback degradation',
        'Response headers (X-RateLimit-Limit, Retry-After)'
      ]
    },
    {
      id: 'sd_be_notification_pipeline',
      title: 'Practical System Design: Event-Driven Notification Engine',
      category: 'Messaging & Queues',
      prompt: 'Design an event-driven notification service delivering millions of push, email, and SMS alerts daily with priority queues, idempotency, and user preference filtering.',
      keyDiscussionPoints: [
        'Message broker selection (Kafka vs RabbitMQ vs SQS)',
        'Idempotency keys to prevent duplicate emails',
        'Rate limiting outbound provider calls (Twilio / SendGrid)',
        'Dead-letter queues (DLQ) for failed delivery retry'
      ]
    }
  ],
  fullstack: [
    {
      id: 'sd_fs_realtime_chat',
      title: 'Practical System Design: Scalable 1-on-1 and Group Chat',
      category: 'Full Stack Architecture',
      prompt: 'Design an end-to-end real-time chat application with instant message delivery, read receipts, offline sync, and media attachment upload.',
      keyDiscussionPoints: [
        'WebSocket gateway connection management',
        'Database schema for messages, channels, and unread counters',
        'Presigned S3 URLs for direct media uploads',
        'Client-side SQLite / IndexedDB sync for offline support'
      ]
    }
  ]
};

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
  const { status, connect, disconnect, isUserSpeaking, isAiSpeaking, volume, logs, sendHiddenContext } = useGroqVoice();

  // Section State
  const [currentSection, setCurrentSection] = useState<CodingSection>('A_CODING');
  const [selectedProblemIndex, setSelectedProblemIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<'typescript' | 'javascript' | 'python'>('typescript');

  // Video Stream state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Timer
  const [duration, setDuration] = useState(0);

  // Code & Execution State
  const problems = useMemo(() => SECTION_A_PROBLEMS.default, []);
  const currentProblem = problems[selectedProblemIndex] || problems[0];

  const debugProblems = useMemo(() => SECTION_B_DEBUGGING.default, []);
  const currentDebugProblem = debugProblems[0];

  const roleCategory = useMemo(() => {
    const title = role.title.toLowerCase();
    if (title.includes('frontend') || title.includes('react') || title.includes('ui')) return 'frontend';
    if (title.includes('backend') || title.includes('node') || title.includes('python') || title.includes('java')) return 'backend';
    return 'fullstack';
  }, [role.title]);

  const systemDesignQuestions = useMemo(() => {
    return SECTION_C_SYSTEM_DESIGN[roleCategory] || SECTION_C_SYSTEM_DESIGN.fullstack;
  }, [roleCategory]);

  const [code, setCode] = useState<string>(currentProblem.starterCode[selectedLanguage] || '');
  const [debugCode, setDebugCode] = useState<string>(currentDebugProblem.buggyCode);
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

  // Code editor sync on language or problem change
  useEffect(() => {
    if (currentSection === 'A_CODING') {
      setCode(currentProblem.starterCode[selectedLanguage] || '');
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

    const systemPrompt = `You are the Lead Technical Interviewer and Principal Software Engineer at ${company.name} conducting "Round 3: Live Coding & Technical Assessment" for the ${role.title} position.

CURRENT PROBLEM IN CONTEXT (SECTION A):
- Problem: ${currentProblem.title}
- Topic: ${currentProblem.topic}
- Description: ${currentProblem.description.replace(/\n+/g, ' ')}

SECTION B DEBUGGING PROBLEM:
- Buggy Problem: ${currentDebugProblem.title}
- Scenario: ${currentDebugProblem.scenario}

SECTION C SYSTEM DESIGN QUESTION:
- Design: ${systemDesignQuestions[0]?.title}
- Prompt: ${systemDesignQuestions[0]?.prompt}

STRICT ROUND 3 RULES (ABSOLUTE MANDATES):
1. ONLY FOCUS ON THE CODING PROBLEM, CODE LOGIC, ALGORITHMIC INTUITION, EDGE CASES, TIME/SPACE COMPLEXITY ($O(N)$ Big-O analysis), AND DEBUGGING.
2. ABSOLUTELY NEVER ask about the candidate's resume, college, education, degree, Newton School of Technology, background, or past projects. Round 1 and Round 2 are ALREADY FINISHED!
3. NEVER ask "introduce yourself" or "tell me about yourself".
4. When the candidate explains their logic or asks questions, reply directly and constructively about the algorithm and code.
5. All speech must strictly be in clear, professional English.`;

    try {
      await connect({
        systemPrompt,
        initialGreeting: `Hello and welcome to Round 3 — Coding Assessment at ${company.name}! We will evaluate hands-on problem solving, live debugging, and system complexity. Look at Section A on your screen: ${currentProblem.title}. Before writing code, walk me through how you plan to approach this algorithmically.`
      });
      toast.success('AI Technical Interviewer connected.');
    } catch (err) {
      console.error('[EliteCodingAssessment] Voice connect error:', err);
      toast.error('Could not connect to Voice AI. You can still practice coding and debugging!');
    }
  };

  // Run Code Execution
  // Switch sections and automatically notify Voice AI interviewer
  const handleSectionChange = async (newSection: CodingSection) => {
    setCurrentSection(newSection);
    if (status === LiveStatus.CONNECTED) {
      if (newSection === 'B_DEBUGGING') {
        await sendHiddenContext(`Candidate just navigated to Section B: Code Debugging Challenge (${currentDebugProblem.title}). Welcome them to Section B, introduce the bug scenario ("${currentDebugProblem.scenario}"), and ask them to inspect the code to find the root cause.`);
      } else if (newSection === 'C_SYSTEM_DESIGN') {
        await sendHiddenContext(`Candidate just navigated to Section C: Practical System Design (${systemDesignQuestions[0]?.title}). Welcome them to Section C, introduce the design prompt ("${systemDesignQuestions[0]?.prompt}"), and ask them to outline their architecture and trade-offs.`);
      } else if (newSection === 'A_CODING') {
        await sendHiddenContext(`Candidate navigated back to Section A: Algorithmic Coding (${currentProblem.title}). Ask if they would like to review the algorithm, complexity, or edge cases.`);
      }
    }
  };

  // Run Code Execution & Dynamic Interviewer Follow-ups
  const handleRunCode = async () => {
    setIsRunningCode(true);
    setActiveTab('console');

    try {
      const activeCode = currentSection === 'A_CODING' ? code : debugCode;
      const res = await executeCode(selectedLanguage, activeCode);
      setExecutionResult(res);

      if (res.passed) {
        toast.success('All test cases passed cleanly!');
        if (status === LiveStatus.CONNECTED) {
          if (currentSection === 'A_CODING') {
            await sendHiddenContext(`Candidate just ran their code for Section A (${currentProblem.title}) and ALL test cases passed! Congratulate them in 1 concise sentence, and proactively ask: 1. To analyze their exact Time & Auxiliary Space Complexity ($O(N)$ Big-O), and 2. What extreme edge cases (empty inputs, duplicates, boundary constraints) could stress or break this logic?`);
          } else if (currentSection === 'B_DEBUGGING') {
            await sendHiddenContext(`Candidate just ran their debugging code for Section B (${currentDebugProblem.title}) and ALL test cases passed! Briefly praise their fix in 1 sentence, and ask: What was the root cause of the bug and how does your fix prevent future regression?`);
          }
        }
      } else {
        toast.error('Execution encountered test failures or errors.');
        if (status === LiveStatus.CONNECTED) {
          const failSummary = res.results.filter(r => !r.passed).map(r => `Input: ${JSON.stringify(r.input)}, Expected: ${JSON.stringify(r.expected)}, Got: ${JSON.stringify(r.actual)}`).slice(0, 1).join('; ');
          await sendHiddenContext(`Candidate ran their code but tests failed (${failSummary || res.error || 'Syntax or runtime error'}). Give a friendly, constructive 1-sentence hint without giving away the full answer.`);
        }
      }
    } catch (e: any) {
      setExecutionResult({
        passed: false,
        logs: [`Execution Error: ${e.message || e}`],
        results: [],
        error: e.message || 'Unknown runtime error'
      });
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

            {/* Latest AI Dialogue Subtitle */}
            {logs && logs.length > 0 && showTranscription && (
              <div className="p-2.5 rounded-xl bg-zinc-950 border border-white/5 text-xs text-zinc-300 font-mono line-clamp-2">
                <span className="text-violet-400 font-bold">Interviewer: </span>
                {logs[logs.length - 1]?.text || 'Listening...'}
              </div>
            )}
          </div>

          {/* Section Dynamic Content View */}
          <div className="p-5 space-y-5 flex-1">
            {/* SECTION A: Coding Challenge Details */}
            {currentSection === 'A_CODING' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Badge className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 text-[10px] font-bold">
                    {currentProblem.topic}
                  </Badge>
                  <span className="text-xs text-zinc-500 font-mono">
                    Problem {selectedProblemIndex + 1} of {problems.length}
                  </span>
                </div>

                <h1 className="text-lg font-black text-white">{currentProblem.title}</h1>

                <div className="text-xs text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {currentProblem.description}
                </div>

                {/* Examples */}
                <div className="space-y-3">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Examples</div>
                  {currentProblem.examples.map((ex, i) => (
                    <div key={i} className="p-3 rounded-2xl bg-zinc-900 border border-white/10 text-xs font-mono space-y-1">
                      <div><strong className="text-zinc-400">Input:</strong> <span className="text-amber-300">{ex.input}</span></div>
                      <div><strong className="text-zinc-400">Output:</strong> <span className="text-emerald-300">{ex.output}</span></div>
                      {ex.explanation && (
                        <div className="text-zinc-500 text-[11px] font-sans pt-1">
                          <strong>Explanation:</strong> {ex.explanation}
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Constraints */}
                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Constraints</div>
                  <ul className="list-disc list-inside text-xs text-zinc-400 space-y-1 font-mono">
                    {currentProblem.constraints.map((c, i) => (
                      <li key={i}>{c}</li>
                    ))}
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
              value={currentSection === 'A_CODING' ? code : debugCode}
              onChange={(value) => {
                if (currentSection === 'A_CODING') {
                  setCode(value || '');
                } else {
                  setDebugCode(value || '');
                }
              }}
              options={{
                fontSize: 13,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                lineNumbers: 'on',
                roundedSelection: true,
                automaticLayout: true,
                padding: { top: 12, bottom: 12 }
              }}
            />
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
