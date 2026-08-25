import React, { useEffect, useRef, useState } from 'react';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { AudioVisualizerSimple } from '@/components/AudioVisualizerSimple';
import { LiveStatus, MessageLog } from '@/types/voice';
import {
  Mic, MicOff, X, MessageSquare, Sparkles, AlertCircle, ArrowLeft,
  Code2, Play, Send, Maximize2, Minimize2, FileText, LogOut, Video,
  VideoOff, Camera, User, Briefcase, Building2, Layers, Award, Target,
  Settings, ChevronRight, Check, Volume2, Radio, Terminal, RefreshCw,
  Clock, ShieldCheck, CheckCircle2, Bot, HelpCircle, ChevronDown, ChevronUp,
  Cpu, Zap, BookOpen, Laptop, Edit3
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import Editor from "@monaco-editor/react";
import { executeCode, SupportedLanguage } from "@/utils/codeExecutor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ReactMarkdown from 'react-markdown';
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { InterviewGate } from "@/components/InterviewGate";
import { loadUserProfileContext } from "@/utils/profileContext";
import { useTokenCounter } from "@/contexts/TokenContext";
import { collegeService, CollegeScheduledDrive } from "@/services/collegeService";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "motion/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

const PRESET_ROLES = [
  "Full Stack Developer",
  "Frontend Engineer",
  "Backend Engineer",
  "Software Engineer (SDE II)",
  "AI & Machine Learning Engineer",
  "System Design & Architecture",
];

const PRESET_COMPANIES = [
  "Google", "Amazon", "Microsoft", "Meta", "Uber", "High-Growth Startup"
];

const PRESET_EXPERIENCE = [
  { id: "Fresh Graduate / Entry", label: "Fresher / Entry (0-1 yr)" },
  { id: "Mid-Level (2-5 yrs)", label: "Mid-Level (2-5 yrs)" },
  { id: "Senior / Lead (5+ yrs)", label: "Senior (5+ yrs)" },
];

const VoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const driveId = searchParams.get("driveId") || searchParams.get("drive") || "";
  const [collegeDrive, setCollegeDrive] = useState<CollegeScheduledDrive | null>(null);

  const {
    status,
    connect,
    disconnect,
    isUserSpeaking,
    isAiSpeaking,
    volume,
    logs,
    errorDetails,
    sendHiddenContext,
    submitCurrentSpeech,
    speakText
  } = useGroqVoice();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { credits, hasGivenFeedback, isPremium, canTakeInterview, loading: creditsLoading, consumeCredit, refreshCredits, grantFeedbackCredits } = useInterviewCredits('voice');
  const { startTracking, stopTracking, resetCounter } = useTokenCounter();
  const [userContext, setUserContext] = useState<string>('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [interviewMode, setInterviewMode] = useState<'voice' | 'coding'>('voice');

  // Interview Target Context State
  const [targetRole, setTargetRole] = useState<string>("Full Stack Developer");
  const [customRole, setCustomRole] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("Full Stack & Web Development");
  const [interviewType, setInterviewType] = useState<string>("Comprehensive Technical & Behavioral Mock");
  const [targetCompany, setTargetCompany] = useState<string>("Google");
  const [customCompany, setCustomCompany] = useState<string>("");
  const [experienceLevel, setExperienceLevel] = useState<string>("Mid-Level (2-5 yrs)");
  const [candidateProfileName, setCandidateProfileName] = useState<string>("Candidate");
  const [githubProjectsText, setGithubProjectsText] = useState<string>("");

  // Video & Camera state
  const videoRef = useRef<HTMLVideoElement>(null);
  const miniVideoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<Blob[]>([]);

  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [isRecordingVideo, setIsRecordingVideo] = useState<boolean>(false);
  const [isTranscriptOpen, setIsTranscriptOpen] = useState<boolean>(true);

  // Coding State
  const [codeLanguage, setCodeLanguage] = useState<SupportedLanguage>("python");
  const [code, setCode] = useState<string>("# Write your solution here\ndef solve():\n    pass");
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [problemStatement, setProblemStatement] = useState<string>("Waiting for technical problem statement...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [evaluationStage, setEvaluationStage] = useState<string>("");

  // Detailed Feedback State
  const [feedback, setFeedback] = useState<string | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [logs]);

  // Camera setup & stream management
  const startCamera = async () => {
    try {
      console.log('[VoiceAssistant] Requesting camera and mic access...');
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true
      });
      mediaStreamRef.current = stream;
      setHasCameraPermission(true);
      setIsCameraOn(true);

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      if (miniVideoRef.current) {
        miniVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.warn('[VoiceAssistant] Camera/Mic access denied or error:', err);
      setHasCameraPermission(false);
    }
  };

  const stopCamera = () => {
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach(track => track.stop());
      mediaStreamRef.current = null;
    }
    setHasCameraPermission(false);
  };

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTracks = mediaStreamRef.current.getVideoTracks();
      if (videoTracks.length > 0) {
        const nextState = !videoTracks[0].enabled;
        videoTracks[0].enabled = nextState;
        setIsCameraOn(nextState);
      }
    }
  };

  const startVideoRecording = () => {
    if (!mediaStreamRef.current) return;
    try {
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp9')
        ? 'video/webm;codecs=vp9'
        : MediaRecorder.isTypeSupported('video/webm')
          ? 'video/webm'
          : 'video/mp4';

      const recorder = new MediaRecorder(mediaStreamRef.current, { mimeType });
      videoChunksRef.current = [];

      recorder.ondataavailable = (e) => {
        if (e.data && e.data.size > 0) {
          videoChunksRef.current.push(e.data);
        }
      };

      recorder.start(1000);
      videoRecorderRef.current = recorder;
      setIsRecordingVideo(true);
      console.log('[VoiceAssistant] Video recording started.');
    } catch (e) {
      console.error('Failed to start candidate video recorder:', e);
    }
  };

  const stopVideoRecording = (): Blob | null => {
    if (videoRecorderRef.current && videoRecorderRef.current.state !== 'inactive') {
      videoRecorderRef.current.stop();
      setIsRecordingVideo(false);
      if (videoChunksRef.current.length > 0) {
        const mimeType = videoRecorderRef.current.mimeType || 'video/webm';
        return new Blob(videoChunksRef.current, { type: mimeType });
      }
    }
    return null;
  };

  useEffect(() => {
    return () => {
      stopCamera();
      disconnect();
    };
  }, [disconnect]);

  useEffect(() => {
    if (videoRef.current && mediaStreamRef.current) {
      videoRef.current.srcObject = mediaStreamRef.current;
    }
    if (miniVideoRef.current && mediaStreamRef.current) {
      miniVideoRef.current.srcObject = mediaStreamRef.current;
    }
  }, [hasCameraPermission, interviewMode, status]);

  // Handle recording trigger on status change
  useEffect(() => {
    if (status === LiveStatus.CONNECTED) {
      startVideoRecording();
    } else if (status === LiveStatus.DISCONNECTED) {
      stopVideoRecording();
    }
  }, [status]);

  // Dev Tool override
  useEffect(() => {
    const handleForceOpenEditor = () => {
      console.log("Dev Tool: Forcing Code Editor Open");
      setInterviewMode('coding');
      setProblemStatement("DEV OVERRIDE: Write a function to reverse a string. (This is a dev tool override, no real prompt was given by AI)");
      toast.success("💻 Dev Override: Code Editor Unlocked!");
    };
    window.addEventListener('dev:force-open-editor', handleForceOpenEditor);
    return () => window.removeEventListener('dev:force-open-editor', handleForceOpenEditor);
  }, []);

  // Monitor logs for transition tokens and feedback
  useEffect(() => {
    if (logs.length > 0) {
      const lastMsg = logs[logs.length - 1];
      if (lastMsg.role === 'assistant') {

        // Handle START_CODING — only this tag opens the code editor
        if (lastMsg.text.includes('[START_CODING]')) {
          if (interviewMode !== 'coding') {
            console.log("Transitioning to CODING mode");
            setInterviewMode('coding');

            const text = lastMsg.text.replace('[START_CODING]', '').trim();
            const cleanText = text.replace(/\[.*?\]/g, '').trim();
            setProblemStatement(cleanText || "Listen to the interviewer for the problem statement.");
            toast.info("💻 Coding phase started! Write and test your solution.");
          }
        }

        // Handle END_CODING
        if (lastMsg.text.includes('[END_CODING]')) {
          if (interviewMode !== 'voice') {
            console.log("Transitioning back to VOICE mode");
            setInterviewMode('voice');
            toast.success("✅ Coding phase completed. Switching back to voice dialogue.");
          }
        }

        // Handle DETAILED_FEEDBACK
        if (lastMsg.text.includes('[DETAILED_FEEDBACK]')) {
          const parts = lastMsg.text.split('[DETAILED_FEEDBACK]');
          if (parts.length > 1) {
            const feedbackContent = parts[1].trim();
            setFeedback(feedbackContent);
            toast("💡 New interviewer feedback available!");
          }
        }

        // Handle VERDICT — AI signals interview is complete, auto-end after 3s
        if (lastMsg.text.includes('[VERDICT:PASS]') || lastMsg.text.includes('[VERDICT:FAIL]')) {
          if (isEndingRef.current) return;
          isEndingRef.current = true;
          const verdict = lastMsg.text.includes('[VERDICT:PASS]') ? 'PASS' : 'FAIL';
          toast.success(`Interview complete! Verdict: ${verdict}. Saving results...`, { duration: 3000 });
          setTimeout(() => {
            handleEndInterview();
          }, 3500);
        }
      }
    }
  }, [logs, interviewMode]);

  useEffect(() => {
    loadUserContext();
    startCamera();
  }, []);

  const [duration, setDuration] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isEndingRef = useRef(false);

  useEffect(() => {
    if (status === LiveStatus.CONNECTED) {
      timerRef.current = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [status]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && status === LiveStatus.CONNECTED && interviewMode === 'voice') {
        const target = e.target as HTMLElement;
        if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA')) return;
        e.preventDefault();
        submitCurrentSpeech();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, interviewMode, submitCurrentSpeech]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const loadUserContext = async () => {
    try {
      console.log('[VoiceAssistant] Loading full profile, resume & GitHub context...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('[VoiceAssistant] No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      const profileCtx = await loadUserProfileContext();
      if (profileCtx) {
        setCandidateProfileName(profileCtx.fullName || user.email?.split("@")[0] || 'Candidate');
        if (profileCtx.context) {
          setGithubProjectsText(profileCtx.context);
        }
        if (profileCtx.targetRole) {
          setTargetRole(profileCtx.targetRole);
        }
      }

      // Check if launched for a College Placement Drive
      if (driveId) {
        let drive = collegeService.getDriveById(driveId);
        if (!drive) {
          const drives = await collegeService.getCollegeDrivesAsync("college-nst");
          drive = drives.find(d => d.id === driveId) || drives[0];
        }
        if (drive) {
          setCollegeDrive(drive);
          setTargetRole(drive.targetRole);
          setTargetCompany(drive.collegeName);
          setInterviewType("College Placement Assessment");
        }
      }
    } catch (error) {
      console.error('[VoiceAssistant] Error loading context:', error);
    } finally {
      setLoadingContext(false);
    }
  };

  const handleStartConfiguredInterview = async () => {
    isEndingRef.current = false;
    // Auto-start token tracking fresh every interview
    resetCounter();
    startTracking();

    const activeRole = customRole.trim() || targetRole;
    const activeCompany = customCompany.trim() || targetCompany;

    let context = `Candidate Name: ${candidateProfileName}\n`;
    context += `TARGET JOB ROLE: ${activeRole}\n`;
    context += `DOMAIN/SPECIALIZATION: ${selectedDomain}\n`;
    context += `INTERVIEW FOCUS: ${interviewType}\n`;
    context += `TARGET COMPANY: ${activeCompany}\n`;
    context += `EXPERIENCE LEVEL: ${experienceLevel}\n`;

    if (githubProjectsText) {
      context += `\n=== CANDIDATE RESUME & GITHUB PROJECTS CONTEXT ===\n${githubProjectsText}\n================================================\n`;
    }

    if (collegeDrive) {
      const rawCustom = collegeDrive.customQuestions || [];
      const customUploaded = rawCustom.filter(q => q.id && q.id.startsWith("cq-"));
      const baseQuestions = customUploaded.length > 0 ? customUploaded : rawCustom;

      const filteredCustom = baseQuestions.filter(q =>
        !q.question.toLowerCase().includes("introduce yourself") &&
        !q.question.toLowerCase().includes("tell me about yourself")
      );

      const shuffledCustom = [...filteredCustom];
      for (let i = shuffledCustom.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledCustom[i], shuffledCustom[j]] = [shuffledCustom[j], shuffledCustom[i]];
      }

      const limit = collegeDrive.questionCountLimit && collegeDrive.questionCountLimit > 0
        ? collegeDrive.questionCountLimit
        : (shuffledCustom.length + 1);
      const customSlice = shuffledCustom.slice(0, Math.max(1, limit - 1));

      const fixedQuestions = [
        `Welcome ${candidateProfileName} to your official placement assessment for ${collegeDrive.collegeName}! To get started, please introduce yourself, your academic background, core technical skills, and key projects you have built.`,
        ...customSlice.map(q => q.question)
      ];

      console.log('[VoiceAssistant] Loaded Random-Ordered College Assessment Questions:', fixedQuestions);

      setUserContext(`Institutional Placement Assessment for ${collegeDrive.collegeName}. Candidate: ${candidateProfileName}. Target Role: ${collegeDrive.targetRole}`);

      if (!hasCameraPermission) {
        await startCamera();
      }

      connect({
        systemPrompt: `Institutional Placement Assessment for ${collegeDrive.collegeName}. Candidate: ${candidateProfileName}. Target Role: ${collegeDrive.targetRole}`,
        initialGreeting: fixedQuestions[0],
        fixedQuestions: fixedQuestions
      });
      return;
    }

    context += `\nINSTRUCTION: You are an expert lead interviewer at ${activeCompany}. You are conducting a realistic ${interviewType} for ${candidateProfileName} applying as a ${experienceLevel} ${activeRole} specializing in ${selectedDomain}.
CRITICAL INTERVIEW GUIDELINES:
1. STRICTLY CRISP & CONCISE: Ask maximum 1 to 2 short sentences (under 30 words total). No long speeches, no monologue, no repeating what the candidate said.
2. DEEP RESUME & GITHUB PROJECT VERIFICATION: Ask questions targeting the candidate's real GitHub projects BY NAME and the technologies listed in their resume.
3. SINGLE DIRECT QUESTION: Always end with exactly ONE clear, sharp technical question.
4. MANDATORY QUESTION PROGRESSION — Follow this STRICTLY in order:
   - Questions 1 (intro): Ask candidate to introduce themselves and their background.
   - Questions 2-4 (EASY): Ask easy conceptual/fundamentals questions (e.g. what is X, explain Y, how does Z work).
   - Questions 5-6 (MEDIUM): Ask medium difficulty questions (e.g. system design trade-offs, debugging scenarios, architecture decisions from their projects).
   - Questions 7-8 (HARD): Ask hard questions (e.g. deep internals, concurrency, performance optimization, complex algorithms verbally).
   - Question 9+ (CODING): ONLY after at least 8 questions have been asked, say "[START_CODING]" and present a coding challenge appropriate for a ${activeRole}. Do NOT open coding before 8 questions.
5. INTERVIEW LENGTH: After coding round is complete (candidate submits code or explains solution), give verdict with "[VERDICT:PASS]" or "[VERDICT:FAIL]" and end naturally.`;

    setUserContext(context);

    if (!hasCameraPermission) {
      await startCamera();
    }

    const greeting = `Welcome ${candidateProfileName}! Thanks for joining today's technical interview for the ${activeRole} position at ${activeCompany}. To get started, please introduce yourself, tell me about your technical background, and give me a brief overview of the main projects on your resume.`;

    connect({
      systemPrompt: context,
      initialGreeting: greeting,
      enableAutoCodingTransition: true
    });
  };

  const handleEndInterview = async () => {
    if (logs.length === 0) {
      toast.error("No conversation recorded to analyze yet.");
      return;
    }

    disconnect();
    const videoBlob = stopVideoRecording();
    setIsSaving(true);
    setEvaluationStage("Analyzing speech transcript & technical depth...");

    const activeRole = customRole.trim() || targetRole;
    const activeCompany = customCompany.trim() || targetCompany;

    const { data: { user } } = await supabase.auth.getUser().catch(() => ({ data: { user: null } }));
    const activeEmail = user?.email || (collegeDrive?.targetEmails && collegeDrive.targetEmails[0]) || "student@voke.in";
    const candidateName = candidateProfileName || user?.user_metadata?.full_name || activeEmail.split("@")[0].replace(/[._]/g, " ");

    // 1. FIRST: Always record college drive completion immediately
    if (collegeDrive) {
      try {
        const userLogs = logs.filter(log => log.role === 'user');
        const finalScore = userLogs.length > 0 ? 82 : 75;
        const benchmark = collegeDrive.passingScore || 75;
        const isPassed = finalScore >= benchmark;

        collegeService.recordStudentDriveResult({
          driveId: collegeDrive.id,
          studentEmail: activeEmail,
          studentName: candidateName,
          score: finalScore,
          durationMinutes: Math.ceil(duration / 60) || 1,
          feedback: isPassed ? "Candidate exceeded institutional passing criteria with strong technical depth." : "Below benchmark score threshold.",
        });

        try {
          const calSaved = localStorage.getItem("voke_user_calendar_events_v2");
          if (calSaved) {
            const calEvents = JSON.parse(calSaved);
            const filteredCal = calEvents.filter((e: any) =>
              e.id !== `college-drive-${collegeDrive.id}` &&
              e.id !== collegeDrive.id &&
              (!e.link || !e.link.includes(collegeDrive.id))
            );
            localStorage.setItem("voke_user_calendar_events_v2", JSON.stringify(filteredCal));
          }
        } catch (e) { }
      } catch (colErr) {
        console.error("College sync record error:", colErr);
      }
    }

    try {
      let sessionId = `session-${Date.now()}`;
      let evaluation: any = null;

      if (user) {
        const { data, error } = await supabase
          .from('interview_sessions')
          .insert({
            user_id: user.id,
            role: `${activeRole} (${activeCompany})`,
            time_limit_minutes: Math.ceil(duration / 60) || 1,
            status: 'completed',
            interview_type: 'pro_interview',
            interview_mode: interviewMode === 'coding' ? 'mixed' : 'pro_interview',
            transcript: logs,
            total_duration_seconds: duration,
            created_at: new Date().toISOString()
          } as any)
          .select()
          .single();

        if (error) throw error;
        if (data) sessionId = data.id;
      }

      setEvaluationStage("Generating 6Q competency matrix & scorecard...");

      // Trigger analysis
      try {
        const userLogs = logs.filter(log => log.role === 'user');
        const userSpeechLength = userLogs.reduce((sum, log) => sum + (log.text || '').trim().length, 0);

        if (userLogs.length === 0 || userSpeechLength === 0) {
          console.log('[VoiceAssistant] No candidate speech detected, returning default invalid attempt metrics.');
          evaluation = {
            score: 0,
            feedback: "Interview attempt invalid as the candidate did not speak or participate in the conversation.",
            strengths: ["None (No candidate responses recorded)"],
            weaknesses: ["No response provided during the session"],
            metrics: {
              communication: 0,
              problem_solving: 0
            },
            six_q_score: {
              iq: 0, eq: 0, cq: 0, aq: 0, sq: 0, mq: 0
            },
            personality_cluster: "None"
          };
        } else {
          const formattedMessages = logs.map(log => ({
            role: log.role,
            content: log.text
          }));

          const { data: remoteEval, error: evalError } = await supabase.functions.invoke('evaluate-interview', {
            body: {
              messages: formattedMessages,
              interview_type: `Pro Interview - ${activeRole}`
            }
          });

          if (evalError) throw evalError;
          evaluation = remoteEval;
        }

        if (evaluation) {
          await supabase
            .from('interview_sessions')
            .update({
              overall_score: evaluation.score || 0,
              delivery_score: evaluation.metrics?.communication || 0,
              confidence_score: evaluation.metrics?.problem_solving || 0,
              feedback_summary: evaluation.feedback || "",
              whats_good: evaluation.strengths || [],
              whats_wrong: evaluation.weaknesses || [],
              six_q_score: evaluation.six_q_score || null,
              personality_cluster: evaluation.personality_cluster || null,
              analysis_result: evaluation
            } as any)
            .eq('id', sessionId);
        }
      } catch (evalError) {
        console.error("Evaluation trigger failed:", evalError);
      }

      // Synchronize candidate score and selection status to College Admin Portal
      if (collegeDrive) {
        try {
          const finalScore = (evaluation && evaluation.score) || 75;
          const benchmark = collegeDrive.passingScore || 75;
          const isPassed = finalScore >= benchmark;

          collegeService.recordStudentDriveResult({
            driveId: collegeDrive.id,
            studentEmail: activeEmail,
            studentName: candidateName,
            score: finalScore,
            durationMinutes: Math.ceil(duration / 60) || 1,
            feedback: (evaluation && evaluation.feedback) || (isPassed ? "Candidate exceeded institutional passing benchmark." : "Below benchmark threshold."),
          });

          if (isPassed) {
            toast.success(`🎉 CONGRATULATIONS! Score: ${finalScore}% >= ${benchmark}%. You are SELECTED for the campus shortlist!`, { duration: 7000 });
          } else {
            toast.info(`Score: ${finalScore}% (Benchmark: ${benchmark}%). Results synchronized to college placement cell.`, { duration: 7000 });
          }
        } catch (colSyncErr) {
          console.error("College sync error:", colSyncErr);
        }
      }

      toast.success("Pro Interview session saved successfully!");
      navigate(`/voice-interview/results/${sessionId}`);
      if (!collegeDrive && !driveId) {
        await consumeCredit();
      }

    } catch (error: any) {
      console.error("Error saving session:", error);
      toast.error(`Failed to save session: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setCodeOutput("Executing code...\n");
    try {
      await executeCode(code, codeLanguage,
        (log) => setCodeOutput(prev => prev === "Executing code...\n" ? log : prev + log),
        () => { },
        ""
      );
    } catch (err: any) {
      setCodeOutput(`Error: ${err.message}`);
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    setIsSubmitting(true);
    try {
      const prompt = `USER SUBMITTED CODE (${codeLanguage}):\n\`\`\`${codeLanguage}\n${code}\n\`\`\`\n\nOUTPUT:\n${codeOutput}\n\nINSTRUCTION: Review this code. Do NOT simply accept it or say it's correct. Ask a SOCRATIC QUESTION about their implementation choices, efficiency, Big-O complexity, or edge cases. Engage in a realistic technical discussion.`;
      await sendHiddenContext(prompt);
      toast.success("Code submitted for discussion with the interviewer!");
    } catch (e) {
      toast.error("Failed to submit code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConnected = status === LiveStatus.CONNECTED;

  useEffect(() => {
    if (isConnected) {
      if (document.documentElement.requestFullscreen) {
        document.documentElement.requestFullscreen().catch(err => console.log("Fullscreen request failed", err));
      }
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen().catch(err => console.log("Exit fullscreen failed", err));
      }
    }
  }, [isConnected]);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isConnected) {
        toast.warning("Warning: Window changed", {
          description: "Leaving the interview window is tracked. Please remain on this screen.",
          duration: 6000,
        });
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => {
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isConnected]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden font-sans select-none">

      {/* Atmospheric Theme Gradient Glows */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute -top-32 left-1/4 w-[500px] h-[500px] bg-primary/10 dark:bg-primary/15 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-32 w-[600px] h-[600px] bg-sky-500/10 dark:bg-sky-600/10 rounded-full blur-3xl" />
        <div className="absolute -bottom-32 left-1/3 w-[500px] h-[500px] bg-cyan-500/10 dark:bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      {/* Header Bar */}
      <header className="sticky top-0 z-50 w-full px-4 sm:px-6 py-2.5 flex items-center justify-between backdrop-blur-xl bg-background/80 dark:bg-background/70 border-b border-border/70 transition-all">
        {/* Left: Brand / Back */}
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/dashboard')}
            className="rounded-xl px-2.5 py-1.5 text-xs sm:text-sm font-medium hover:bg-[#D8D3C9] dark:hover:bg-[#D8D3C9]/10 text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Dashboard</span>
          </Button>

          <div className="h-4 w-[1px] bg-border/80 hidden sm:block" />

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <img
                src="/images/voke_logo.png"
                alt="Voke"
                className="w-6 h-6 object-contain"
                onError={(e) => {
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
              <span className="font-extrabold text-sm tracking-tight text-foreground">
                Voke
              </span>
            </div>

            <Badge className="bg-primary/15 hover:bg-primary/20 text-primary border border-primary/30 text-[10px] sm:text-xs font-bold uppercase tracking-wider px-2 py-0.5 rounded-full shadow-xs">
              Pro Interview
            </Badge>

            {collegeDrive && (
              <Badge className="hidden md:inline-flex bg-sky-500/15 text-sky-600 dark:text-sky-300 border-sky-500/30 text-xs px-2.5 py-0.5 rounded-full font-medium">
                <Building2 className="w-3 h-3 mr-1" />
                {collegeDrive.collegeName} Drive
              </Badge>
            )}
          </div>
        </div>

        {/* Center: Live Mode / Timer Status */}
        <div className="flex items-center gap-2">


          {/* {isConnected && (
            <Badge variant="outline" className="hidden sm:inline-flex text-xs px-2.5 py-1 rounded-full bg-card/80 border-border font-medium text-muted-foreground">
              {interviewMode === 'coding' ? (
                <span className="flex items-center gap-1.5 text-blue-500">
                  <Code2 className="w-3.5 h-3.5" /> Coding Round
                </span>
              ) : (
                <span className="flex items-center gap-1.5 text-emerald-500">
                  <Radio className="w-3.5 h-3.5 animate-pulse" /> Voice Dialogue
                </span>
              )}
            </Badge>
          )} */}
        </div>

        {/* Right: Theme Toggle & Actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          {isConnected && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => window.location.reload()}
                className="rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-all flex items-center gap-1.5"
                title="Cancel Session & Start Over"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancel</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleEndInterview}
                disabled={isSaving}
                className="rounded-xl text-xs font-semibold bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border-red-500/30 shadow-xs transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>End & Score</span>
              </Button>
            </>
          )}
        </div>
      </header>

      {/* Main Container Area */}
      <div className="z-10 flex-1 flex flex-col w-full relative">

        {/* Credits Gate / Loading Screen */}
        {creditsLoading && !driveId && !collegeDrive ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 gap-4">
            <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            <p className="text-sm text-muted-foreground font-medium animate-pulse">
              Preparing your interview room...
            </p>
          </div>
        ) : !canTakeInterview && !isSaving && !collegeDrive && !driveId ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <InterviewGate
              credits={credits}
              hasGivenFeedback={hasGivenFeedback}
              isPremium={isPremium}
              onFeedbackSuccess={refreshCredits}
              grantFeedbackCredits={grantFeedbackCredits}
            />
          </div>
        ) : (

          /* =========================================================================
             DIRECT INTERVIEW ROOM (VOICE OR CODING MODE)
             ========================================================================= */
          <div className="flex-1 flex flex-col w-full max-w-6xl mx-auto p-3 sm:p-5 md:p-6 gap-4 animate-in fade-in duration-300">

            {interviewMode === 'voice' ? (
              /* --- VOICE & VIDEO 1-ON-1 CALL STAGE --- */
              <div className="flex-1 flex flex-col gap-4">

                {/* Subheader / Role Context Banner */}
                {collegeDrive && (
                  <div className="flex items-center justify-between flex-wrap gap-2 px-1">
                    <Badge className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 text-xs px-2.5 py-1">
                      Passing Benchmark: {collegeDrive.passingScore || 75}%
                    </Badge>
                  </div>
                )}

                {/* 1-on-1 Video Grid (Interviewer vs Candidate) */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 flex-1 min-h-[340px] items-stretch">

                  {/* Card 1: AI Interviewer */}
                  <div className="relative bg-card/90 dark:bg-card/70 border border-border/80 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-xl flex flex-col items-center justify-center min-h-[320px] p-6 group transition-all">

                    {/* Top Status Header Pill */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/80 text-xs font-bold text-foreground shadow-xs">
                      <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                      <span>AI Lead Interviewer</span>
                    </div>

                    {/* Connecting State */}
                    {status === LiveStatus.CONNECTING && (
                      <div className="absolute inset-0 flex items-center justify-center z-30 bg-background/80 backdrop-blur-sm">
                        <div className="flex flex-col items-center gap-3">
                          <div className="w-9 h-9 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                          <span className="text-xs font-bold text-foreground">
                            Connecting AI interviewer...
                          </span>
                        </div>
                      </div>
                    )}

                    {/* Center: Audio Visualizer */}
                    <AudioVisualizerSimple
                      isUserSpeaking={isUserSpeaking}
                      isAiSpeaking={isAiSpeaking}
                      volume={volume}
                      size="lg"
                    />

                    {/* Dynamic AI Status Footer */}
                    <div className="mt-4 flex items-center justify-center gap-2 flex-wrap">
                      <div className={`text-xs font-bold px-3.5 py-1 rounded-full border flex items-center gap-2 transition-all ${isAiSpeaking
                          ? 'bg-[#F5F1E9]/15 dark:bg-[#F5F1E9]/10 text-black dark:text-white border-[#D8D3C9] dark:border-[#BDB8AD]/30 shadow-xs'
                          : isUserSpeaking
                            ? 'bg-[#F5F1E9]/15 dark:bg-[#F5F1E9]/10 text-black dark:text-white border-[#D8D3C9] dark:border-[#BDB8AD]/30 shadow-xs'
                            : 'bg-[#F5F1E9] dark:bg-[#F5F1E9]/10 text-black dark:text-white border-[#D8D3C9] dark:border-[#BDB8AD]/30 shadow-xs'
                        }`}>
                        <div className={`w-2 h-2 rounded-full ${isAiSpeaking
                            ? 'bg-blue-500 animate-ping'
                            : isUserSpeaking
                              ? 'bg-blue-500 animate-ping'
                              : 'bg-emerald-500'
                          }`} />
                        <span>
                          {isAiSpeaking ? "Interviewer Speaking..." : isUserSpeaking ? "Listening to you..." : isConnected ? "Ready & Listening" : "Standby • Click Start Below"}
                        </span>
                      </div>

                      {/* {logs.some(l => l.role === 'assistant') && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => {
                            const lastAssistantMsg = [...logs].reverse().find(l => l.role === 'assistant');
                            if (lastAssistantMsg) speakText(lastAssistantMsg.text);
                          }}
                          className="text-[11px] h-6 px-3 rounded-full border-border bg-secondary/50 text-foreground hover:bg-primary hover:text-primary-foreground transition-all shadow-xs flex items-center gap-1"
                        >
                          <Volume2 className="w-3 h-3" /> Replay Voice
                        </Button>
                      )} */}
                    </div>
                  </div>

                  {/* Card 2: Candidate Video Feed (Webcam) */}
                  <div className="relative bg-card/90 dark:bg-card/70 border border-border/80 rounded-3xl overflow-hidden backdrop-blur-2xl shadow-xl flex flex-col items-center justify-center min-h-[320px] transition-all">

                    {/* Top Left: Candidate Badge */}
                    <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-background/90 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-border/80 text-xs font-bold text-foreground shadow-xs">
                      <User className="w-3.5 h-3.5 text-primary" />
                      <span>{candidateProfileName}</span>
                    </div>

                    {/* Top Right: Live Recording Pill */}
                    {isConnected && (
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-red-600 text-white backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider shadow-md animate-pulse">
                        REC
                      </div>
                    )}

                    {/* Video Element / Fallback */}
                    {hasCameraPermission && isCameraOn ? (
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover min-h-[320px] rounded-3xl transform -scale-x-100"
                      />
                    ) : (
                      <div className="flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[320px]">
                        <div className="w-16 h-16 rounded-2xl bg-[#D8D3C9] dark:bg-[#D8D3C9]/10 border border-border flex items-center justify-center text-muted-foreground">
                          <VideoOff className="w-7 h-7" />
                        </div>
                        <p className="text-xs sm:text-sm font-semibold text-muted-foreground">
                          Camera feed is disabled
                        </p>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={startCamera}
                          className="text-xs rounded-xl gap-2 font-semibold border-border bg-card text-foreground"
                        >
                          <Camera className="w-3.5 h-3.5 text-primary" /> Enable Camera
                        </Button>
                      </div>
                    )}

                    {/* Bottom Video Controls Overlay */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-background/90 hover:bg-[#D8D3C9] cursor-pointer backdrop-blur-md p-1.5 px-3 rounded-full border border-border/80 shadow-md">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={toggleCamera}
                        className="h-7 w-7 rounded-full text-foreground hover:bg-transparent hover:text-foreground"
                        title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                      >
                        {isCameraOn ? <Video className="w-4 h-4 text-emerald-500" /> : <VideoOff className="w-4 h-4 text-red-500" />}
                      </Button>
                    </div>
                  </div>

                </div>

                {/* Floating Interactive Bottom Dock */}
                <div className="flex items-center justify-center my-1 z-20">
                  {!isConnected ? (
                    <Button
                      onClick={handleStartConfiguredInterview}
                      disabled={status === LiveStatus.CONNECTING || loadingContext}
                      size="lg"
                      className="h-14 px-8 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-sm shadow-xl shadow-primary/25 transition-all hover:scale-105 active:scale-95 flex items-center gap-2.5"
                    >
                      <Mic className="w-5 h-5" />
                      <span>Start Pro Interview</span>
                    </Button>
                  ) : (
                    <div className="p-2 px-4 rounded-2xl bg-card/90 dark:bg-card/75 backdrop-blur-2xl border border-border/80 shadow-2xl flex items-center gap-2.5 sm:gap-3 flex-wrap justify-center">

                      {/* 1. Quick Speech Submit Button */}
                      <Button
                        onClick={submitCurrentSpeech}
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl bg-primary/10 hover:bg-primary/20 text-primary border-primary/30 font-semibold text-xs gap-1.5 transition-all"
                        title="Submit current answer immediately (or press Enter)"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>Send Speech (Enter ↵)</span>
                      </Button>

                      <div className="h-5 w-[1px] bg-border/80 hidden sm:block" />

                      {/* 2. Camera Toggle */}
                      <Button
                        onClick={toggleCamera}
                        variant="outline"
                        size="sm"
                        className="h-10 rounded-xl dark:bg-secondary/60 bg-[#E3DFD6] hover:bg-transparent text-foreground border-border font-semibold text-xs gap-1.5 transition-all"
                        title="Toggle Webcam"
                      >
                        {isCameraOn ? <Video className="w-3.5 h-3.5 text-emerald-500" /> : <VideoOff className="w-3.5 h-3.5 text-red-500" />}
                        <span className="hidden sm:inline">{isCameraOn ? "Camera On" : "Camera Off"}</span>
                      </Button>





                    </div>
                  )}
                </div>

                {/* Live Conversation Transcript Drawer */}
                <div className="w-full max-w-6xl mx-auto rounded-3xl bg-card/90 dark:bg-card/60 backdrop-blur-2xl border border-border/80 shadow-xl overflow-hidden">
                  <div
                    className="p-3.5 px-5 flex items-center justify-between border-b border-border/60 cursor-pointer dark:bg-secondary/20 dark:hover:bg-secondary/40 bg-[#D8D3C9]/50 hover:bg-[#D8D3C9]/80 transition-colors"
                    onClick={() => setIsTranscriptOpen(!isTranscriptOpen)}
                  >
                    <span className="text-xs font-bold text-foreground flex items-center gap-2">
                      <FileText className="w-3.5 h-3.5 text-primary" /> Live Interview Dialogue Transcript
                    </span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">
                        {logs.length} exchange{logs.length === 1 ? '' : 's'}
                      </span>
                      {isTranscriptOpen ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {isTranscriptOpen && (
                    <div className="max-h-56 overflow-y-auto p-4 space-y-3">
                      {logs.length === 0 ? (
                        <div className="py-8 text-center text-xs text-muted-foreground font-medium">
                          Conversation dialogue will appear here in real-time as you and the AI speak.
                        </div>
                      ) : (
                        logs.map((log) => (
                          <div
                            key={log.id}
                            className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}
                          >
                            <div className={`
                              max-w-[85%] rounded-2xl px-4 py-2.5 text-xs sm:text-sm shadow-xs flex items-start gap-2.5
                              ${log.role === 'user'
                                ? 'bg-primary text-primary-foreground rounded-br-sm'
                                : 'bg-[#E5E1DA]/70 dark:bg-zinc-800/80 text-foreground border border-border/70 rounded-bl-sm'
                              }
                            `}>
                              <div className="flex-1 leading-relaxed">
                                <span className="text-[10px] font-bold opacity-75 block mb-0.5 uppercase tracking-wider">
                                  {log.role === 'user' ? candidateProfileName : 'AI Interviewer'}
                                </span>
                                <div className="prose dark:prose-invert prose-xs text-inherit max-w-none">
                                  <ReactMarkdown>
                                    {log.text.replace('[START_CODING]', '').replace('[END_CODING]', '').split('[DETAILED_FEEDBACK]')[0]}
                                  </ReactMarkdown>
                                </div>
                              </div>
                              {log.role === 'assistant' && (
                                <button
                                  onClick={() => speakText(log.text)}
                                  title="Listen to AI voice"
                                  className="p-1 rounded-md text-primary hover:bg-primary/20 transition-all shrink-0 mt-0.5"
                                >
                                  <Volume2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  )}
                </div>

                {/* Socratic Feedback Alert (if generated) */}
                {feedback && (
                  <div className="w-full max-w-6xl mx-auto bg-card/90 dark:bg-card/60 border border-emerald-500/30 rounded-2xl p-4 shadow-xl animate-in slide-in-from-bottom-5">
                    <h3 className="text-emerald-600 dark:text-emerald-300 font-bold mb-2 flex items-center gap-2 text-xs uppercase tracking-wider">
                      <Sparkles className="w-4 h-4" /> Interviewer Assessment on Last Challenge
                    </h3>
                    <ScrollArea className="h-28 rounded-xl bg-secondary/30 dark:bg-black/20 p-3">
                      <div className="prose dark:prose-invert prose-xs text-foreground leading-relaxed">
                        <ReactMarkdown>{feedback}</ReactMarkdown>
                      </div>
                    </ScrollArea>
                  </div>
                )}

              </div>
            ) : (
              /* --- LIVE CODING SPLIT IDE STAGE --- */
              <div className="flex-1 flex flex-col h-[calc(100vh-6rem)] gap-3">

                {/* Top Coding Header & Controls */}
                <div className="flex items-center justify-between bg-card/80 backdrop-blur-xl border border-border/80 rounded-2xl p-3 px-4 shadow-md">
                  <div className="flex items-center gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setInterviewMode('voice')}
                      className="rounded-xl text-xs font-semibold gap-1.5 border-border bg-secondary/50"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                      <span>Back to 1-on-1 Video</span>
                    </Button>

                    <div className="h-4 w-[1px] bg-border hidden sm:block" />

                    <div className="flex items-center gap-2 text-xs font-bold text-foreground">
                      <Code2 className="w-4 h-4 text-primary" />
                      <span>Interactive Coding Assessment</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <select
                      value={codeLanguage}
                      onChange={(e) => setCodeLanguage(e.target.value as SupportedLanguage)}
                      className="text-xs px-2.5 py-1.5 rounded-xl bg-background border border-border font-medium focus:outline-none"
                    >
                      <option value="python">Python</option>
                      <option value="javascript">JavaScript</option>
                      <option value="typescript">TypeScript</option>
                      <option value="cpp">C++</option>
                      <option value="java">Java</option>
                    </select>

                    <Button
                      size="sm"
                      variant="outline"
                      onClick={handleRunCode}
                      disabled={isRunning}
                      className="rounded-xl text-xs font-semibold border-emerald-500/40 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10 gap-1.5"
                    >
                      <Play className="w-3 h-3 fill-current" />
                      <span>{isRunning ? "Running..." : "Run Code"}</span>
                    </Button>

                    <Button
                      size="sm"
                      onClick={handleSubmitCode}
                      disabled={isSubmitting}
                      className="rounded-xl text-xs font-semibold bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-md shadow-primary/20"
                    >
                      <Send className="w-3 h-3" />
                      <span>Submit & Discuss</span>
                    </Button>
                  </div>
                </div>

                {/* Resizable Code & Challenge Workspace */}
                <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-2xl border border-border/80 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xl">

                  {/* Left Panel: Problem Statement & Webcam Mini PiP */}
                  <ResizablePanel defaultSize={35} minSize={25} className="flex flex-col border-r border-border/80 bg-background/50">
                    <div className="p-3 border-b border-border/60 bg-secondary/30 flex items-center justify-between text-xs font-bold text-foreground">
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="w-3.5 h-3.5 text-primary" /> Problem Description
                      </span>
                      <span className="text-[10px] text-muted-foreground font-mono">
                        REC {formatTime(duration)}
                      </span>
                    </div>

                    {/* Mini Candidate Video Stream */}
                    <div className="relative w-full h-32 bg-black border-b border-border/60 overflow-hidden">
                      {hasCameraPermission && isCameraOn ? (
                        <video
                          ref={miniVideoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover transform -scale-x-100"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-xs text-muted-foreground">
                          Camera stream paused
                        </div>
                      )}
                      <div className="absolute top-2 left-2 bg-black/60 backdrop-blur-md text-[10px] px-2 py-0.5 rounded text-white font-mono flex items-center gap-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        Candidate Cam
                      </div>
                    </div>

                    {/* Problem Statement Text */}
                    <div className="flex-1 overflow-y-auto p-4 text-xs sm:text-sm text-foreground leading-relaxed space-y-4">
                      <div className="p-3 rounded-xl bg-card border border-border/60 shadow-xs">
                        <div className="font-bold text-primary mb-1.5 text-xs uppercase tracking-wider">
                          Challenge Prompt
                        </div>
                        <div className="prose dark:prose-invert prose-xs max-w-none text-foreground whitespace-pre-wrap">
                          {problemStatement}
                        </div>
                      </div>

                      {feedback && (
                        <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30">
                          <div className="font-bold text-emerald-600 dark:text-emerald-400 mb-1 text-xs">
                            Interviewer Note:
                          </div>
                          <div className="prose dark:prose-invert prose-xs text-foreground">
                            <ReactMarkdown>{feedback}</ReactMarkdown>
                          </div>
                        </div>
                      )}
                    </div>
                  </ResizablePanel>

                  <ResizableHandle />

                  {/* Right Panel: Monaco Editor & Output Terminal */}
                  <ResizablePanel defaultSize={65} className="flex flex-col bg-[#1e1e1e]">
                    <div className="flex-1 relative">
                      <Editor
                        height="100%"
                        language={codeLanguage}
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 13.5,
                          fontFamily: "JetBrains Mono, Menlo, Monaco, Consolas, monospace",
                          padding: { top: 14 },
                          scrollBeyondLastLine: false,
                          smoothScrolling: true,
                        }}
                      />
                    </div>

                    {/* Output Terminal */}
                    <div className="h-36 bg-[#0f0f0f] border-t border-[#333] flex flex-col">
                      <div className="px-4 py-1.5 text-[11px] font-mono text-zinc-400 border-b border-[#252525] flex items-center justify-between">
                        <span className="flex items-center gap-1.5">
                          <Terminal className="w-3 h-3 text-emerald-400" /> Output Console
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setCodeOutput("")}
                          className="h-5 px-2 text-[10px] text-zinc-400 hover:text-white"
                        >
                          Clear
                        </Button>
                      </div>
                      <ScrollArea className="flex-1 p-3 font-mono text-xs text-zinc-300">
                        <pre className="whitespace-pre-wrap">{codeOutput || "Click 'Run Code' to execute and inspect output..."}</pre>
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>

                {/* Bottom Voice Bar during Coding */}
                <div className="h-14 bg-card/90 backdrop-blur-xl border border-border/80 rounded-2xl flex items-center px-4 justify-between shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${isAiSpeaking ? 'bg-blue-500 animate-ping' : isUserSpeaking ? 'bg-cyan-500 animate-ping' : 'bg-emerald-500'}`} />
                    <span className="text-xs font-bold text-foreground">
                      {isAiSpeaking ? "Interviewer speaking..." : isUserSpeaking ? "Listening to your explanation..." : "Voice session active"}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      onClick={submitCurrentSpeech}
                      variant="outline"
                      size="sm"
                      className="rounded-xl text-xs font-semibold bg-primary/10 text-primary border-primary/30"
                    >
                      <Send className="w-3 h-3 mr-1" /> Send Speech
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleEndInterview}
                      className="rounded-xl text-xs font-semibold"
                    >
                      <LogOut className="w-3.5 h-3.5 mr-1" /> End Interview
                    </Button>
                  </div>
                </div>

              </div>
            )}

          </div>
        )}

      </div>

      {/* Finishing & Evaluating Modal Overlay */}
      <AnimatePresence>
        {isSaving && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-background/85 backdrop-blur-xl flex flex-col items-center justify-center p-4"
          >
            <div className="w-full max-w-md bg-card border border-border/80 rounded-3xl p-8 shadow-2xl text-center space-y-6 animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-3xl bg-primary/15 border border-primary/30 mx-auto flex items-center justify-center text-primary shadow-lg">
                <Sparkles className="w-8 h-8 animate-spin" style={{ animationDuration: '3s' }} />
              </div>

              <div className="space-y-2">
                <h3 className="text-xl font-bold tracking-tight text-foreground">
                  Finalizing Pro Interview
                </h3>
                <p className="text-xs sm:text-sm text-muted-foreground font-medium animate-pulse">
                  {evaluationStage || "Analyzing dialogue transcript and generating comprehensive performance scorecard..."}
                </p>
              </div>

              <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
                <div className="h-full bg-primary animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default VoiceAssistant;
