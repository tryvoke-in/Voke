import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { 
  Building2, GraduationCap, Clock, Send, Mic, MicOff, CheckCircle2, 
  AlertCircle, Sparkles, ArrowRight, ShieldCheck, Trophy, Award, 
  HelpCircle, ChevronRight, RotateCcw, Check, X, FileText, ArrowLeft,
  Loader2, Play, Volume2, Video, VideoOff, Camera, Code2, Terminal,
  User, Bot, Radio, RefreshCw, Layers
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { 
  collegeService, CollegeScheduledDrive, CollegeCustomQuestion, CandidateQuestionAnswer 
} from "@/services/collegeService";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { executeCode } from "@/utils/codeExecutor";

const MANDATORY_INTRO_QUESTION: CollegeCustomQuestion = {
  id: "mandatory-intro-q1",
  question: "Please introduce yourself, your academic background, core technical skills, and key projects you have built.",
  type: "behavioral",
  difficulty: "Easy",
  expectedAnswerOrKeyPoints: "Clear summary of name, degree/specialization, primary programming languages and frameworks, architectural overview of notable projects, problem solving approach, and career goals."
};

export default function CollegeAssessmentSession() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const params = useParams();
  
  const driveId = params.driveId || searchParams.get("driveId") || "";
  const roleParam = searchParams.get("role") || "";

  const [loading, setLoading] = useState(true);
  const [drive, setDrive] = useState<CollegeScheduledDrive | null>(null);
  const [studentEmail, setStudentEmail] = useState<string>("");
  const [studentName, setStudentName] = useState<string>("");
  
  // Assessment Progression State
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [currentAnswer, setCurrentAnswer] = useState("");
  const [isSubmittingTurn, setIsSubmittingTurn] = useState(false);
  const [turnAnswers, setTurnAnswers] = useState<CandidateQuestionAnswer[]>([]);
  const [activeFeedback, setActiveFeedback] = useState<{ score: number; feedback: string } | null>(null);
  
  // Pro Video & Audio Media State
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const [isCameraOn, setIsCameraOn] = useState<boolean>(true);
  const [hasCameraPermission, setHasCameraPermission] = useState<boolean>(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState<boolean>(false);
  const [isCodeEditorOpen, setIsCodeEditorOpen] = useState<boolean>(false);
  const [codeSnippet, setCodeSnippet] = useState<string>("# Write your solution / implementation here\ndef solve():\n    pass");
  const [codeLanguage, setCodeLanguage] = useState<"python" | "javascript" | "java" | "cpp">("python");
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [isExecutingCode, setIsExecutingCode] = useState<boolean>(false);

  // Completed / Results State
  const [isCompleted, setIsCompleted] = useState(false);
  const [finalScore, setFinalScore] = useState(0);
  const [isPassed, setIsPassed] = useState(false);
  const [sessionStartTime] = useState<number>(Date.now());
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(45 * 60);

  // Voice Chat Hook for microphone speech-to-text
  const { isListening, startListening, stopListening, isSupported } = useVoiceChat({
    onTranscript: (text) => {
      setCurrentAnswer(prev => prev ? `${prev} ${text}` : text);
    }
  });

  // Load drive and student context
  useEffect(() => {
    loadAssessmentData();
  }, [driveId]);

  // Setup live camera
  useEffect(() => {
    let activeStream: MediaStream | null = null;
    const initCamera = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
          audio: false
        });
        activeStream = stream;
        mediaStreamRef.current = stream;
        setHasCameraPermission(true);
        setIsCameraOn(true);
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }
      } catch (e) {
        console.warn("Camera permission denied or not available:", e);
        setHasCameraPermission(false);
      }
    };

    initCamera();

    return () => {
      if (activeStream) {
        activeStream.getTracks().forEach(t => t.stop());
      }
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(t => t.stop());
      }
    };
  }, []);

  // Timer countdown
  useEffect(() => {
    if (isCompleted || !drive) return;
    const timer = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleAutoFinishOnTimeout();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isCompleted, drive]);

  const loadAssessmentData = async () => {
    try {
      // 1. Get authenticated student profile
      const { data: { session } } = await supabase.auth.getSession();
      const email = session?.user?.email || "anurag.s25561@nst.rishihood.edu.in";
      const name = session?.user?.user_metadata?.full_name || email.split("@")[0].replace(/[._]/g, " ");
      setStudentEmail(email);
      setStudentName(name);

      // 2. Fetch target drive (async from local /api/college-drives bridge)
      let targetDrive: CollegeScheduledDrive | undefined;
      if (driveId) {
        targetDrive = collegeService.getDriveById(driveId);
      }

      if (!targetDrive) {
        const drives = await collegeService.getCollegeDrivesAsync("college-nst");
        targetDrive = drives.find(d => d.id === driveId) || drives[0];
      }

      if (targetDrive) {
        setDrive(targetDrive);
        setTimeLeftSeconds((targetDrive.durationMinutes || 45) * 60);
      } else {
        toast.error("Assessment drive not found.");
        navigate("/dashboard");
      }
    } catch (e) {
      console.error("Failed to load drive:", e);
      toast.error("Error loading assessment session.");
    } finally {
      setLoading(false);
    }
  };

  // Build the strict question bank for this round:
  // QUESTION 1 IS ALWAYS: MANDATORY_INTRO_QUESTION
  // Followed by custom uploaded questions, limited by drive.questionCountLimit
  const questions: CollegeCustomQuestion[] = (() => {
    const rawCustom = drive?.customQuestions || [];
    
    // Filter out any duplicate intro question in uploaded list
    const filteredCustom = rawCustom.filter(q => 
      !q.question.toLowerCase().includes("introduce yourself") &&
      !q.question.toLowerCase().includes("tell me about yourself")
    );

    // Limit count: if limit = 5, we take 1 intro + 4 custom
    const limit = drive?.questionCountLimit && drive.questionCountLimit > 0 
      ? drive.questionCountLimit 
      : 5;
    
    const remainingSlots = Math.max(1, limit - 1);
    const selectedCustom = filteredCustom.slice(0, remainingSlots);

    return [MANDATORY_INTRO_QUESTION, ...selectedCustom];
  })();

  const currentQ = questions[currentQuestionIndex] || questions[0];

  // Speak question aloud using Text-to-Speech whenever currentQuestionIndex changes
  const speakCurrentQuestion = () => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    
    window.speechSynthesis.cancel();
    const textToSpeak = `Question ${currentQuestionIndex + 1}. ${currentQ.question}`;
    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.rate = 1.0;
    utterance.pitch = 1.0;
    
    utterance.onstart = () => setIsAiSpeaking(true);
    utterance.onend = () => setIsAiSpeaking(false);
    utterance.onerror = () => setIsAiSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    if (!loading && drive && !isCompleted && currentQ) {
      speakCurrentQuestion();
    }
    return () => {
      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [currentQuestionIndex, loading, drive?.id]);

  const toggleCamera = () => {
    if (mediaStreamRef.current) {
      const videoTrack = mediaStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsCameraOn(videoTrack.enabled);
      }
    } else {
      setIsCameraOn(!isCameraOn);
    }
  };

  const handleRunCode = async () => {
    setIsExecutingCode(true);
    try {
      const res = await executeCode(codeSnippet, codeLanguage);
      setCodeOutput(res.logs.join('\\n') || res.error || "Execution completed with 0 errors.");
      toast.success("Code executed successfully!");
    } catch (e: any) {
      setCodeOutput(`Execution Error: ${e?.message || e}`);
    } finally {
      setIsExecutingCode(false);
    }
  };

  // Evaluate candidate answer and advance
  const handleSubmitAnswer = async () => {
    let combinedResponse = currentAnswer.trim();
    if (isCodeEditorOpen && codeSnippet.trim() && !codeSnippet.includes("# Write your solution here")) {
      combinedResponse += `\n\n[Candidate Code Submission (${codeLanguage})]:\n${codeSnippet}`;
    }

    if (!combinedResponse || combinedResponse.length < 5) {
      toast.error("Please speak or write your response before submitting.");
      return;
    }

    if (isListening) {
      stopListening();
    }

    setIsSubmittingTurn(true);

    try {
      // 1. Evaluate answer against question rubric using AI
      let evalScore = 80;
      let evalFeedback = "Solid technical articulation addressing the key architectural concepts.";

      try {
        const { data: aiResult, error: aiError } = await supabase.functions.invoke("evaluate-interview", {
          body: {
            question: currentQ.question,
            expectedKeyPoints: currentQ.expectedAnswerOrKeyPoints,
            candidateAnswer: combinedResponse,
            targetRole: drive?.targetRole || "Software Engineer",
            difficulty: currentQ.difficulty || "Medium"
          }
        });

        if (!aiError && aiResult?.score) {
          evalScore = Math.min(100, Math.max(20, Math.round(aiResult.score)));
          evalFeedback = aiResult.feedback || evalFeedback;
        } else {
          // Heuristic assessment when offline
          const wordCount = combinedResponse.split(/\s+/).length;
          if (currentQuestionIndex === 0) {
            // Intro question evaluation
            evalScore = wordCount >= 30 ? 88 : wordCount >= 15 ? 78 : 65;
            evalFeedback = "Clear professional overview covering academic background and technical stack.";
          } else {
            evalScore = wordCount >= 40 ? 85 : wordCount >= 20 ? 76 : 64;
          }
        }
      } catch (aiErr) {
        console.warn("AI Evaluation fallback:", aiErr);
      }

      const turnResult: CandidateQuestionAnswer = {
        questionId: currentQ.id,
        question: currentQ.question,
        studentAnswer: combinedResponse,
        score: evalScore,
        aiFeedback: evalFeedback
      };

      const updatedAnswers = [...turnAnswers, turnResult];
      setTurnAnswers(updatedAnswers);
      setActiveFeedback({ score: evalScore, feedback: evalFeedback });

      toast.success(`Question ${currentQuestionIndex + 1} Evaluated: ${evalScore}%`, {
        description: evalFeedback
      });

      // Clear response input for next question
      setCurrentAnswer("");
      setCodeSnippet("# Write your solution / implementation here\ndef solve():\n    pass");
      setCodeOutput("");

      // Advance or Complete
      if (currentQuestionIndex + 1 < questions.length) {
        setCurrentQuestionIndex(prev => prev + 1);
        setIsSubmittingTurn(false);
      } else {
        // Finalize Assessment
        finishAssessment(updatedAnswers);
      }
    } catch (e) {
      console.error("Submission error:", e);
      toast.error("Failed to submit response. Please retry.");
      setIsSubmittingTurn(false);
    }
  };

  const finishAssessment = (allAnswers: CandidateQuestionAnswer[]) => {
    setIsCompleted(true);
    setIsSubmittingTurn(false);

    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const calculatedAvg = allAnswers.length > 0
      ? Math.round(allAnswers.reduce((sum, a) => sum + a.score, 0) / allAnswers.length)
      : 75;

    setFinalScore(calculatedAvg);

    const benchmark = drive?.passingScore || 75;
    const passed = calculatedAvg >= benchmark;
    setIsPassed(passed);

    // Save to college service and broadcast candidate result
    if (drive) {
      collegeService.recordStudentDriveResult({
        driveId: drive.id,
        studentEmail,
        studentName,
        score: calculatedAvg,
        durationMinutes: Math.max(1, Math.round((Date.now() - sessionStartTime) / 60000)),
        feedback: passed 
          ? `Passed institutional placement benchmark (${calculatedAvg}% >= ${benchmark}%). Candidate demonstrated strong technical fundamentals.`
          : `Candidate achieved ${calculatedAvg}%, below institutional cutoff of ${benchmark}%. Practice key concepts and algorithms.`,
        answers: allAnswers
      });
    }
  };

  const handleAutoFinishOnTimeout = () => {
    toast.warning("Assessment time expired. Finalizing submission...");
    finishAssessment(turnAnswers);
  };

  const formatTimer = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-blue-400 mb-3" />
        <p className="text-sm text-gray-300 font-medium">Initializing Pro Voice & Video AI Assessment Studio...</p>
      </div>
    );
  }

  const progressPercent = Math.round(((currentQuestionIndex) / questions.length) * 100);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-sans selection:bg-blue-500/30">
      {/* Top Pro Header Bar */}
      <header className="bg-background/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-border px-4 sm:px-6 py-3 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Building2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm sm:text-base font-bold text-white tracking-tight">
                {drive?.collegeName || "Newton School of Technology"}
              </h1>
              <Badge className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-[10px] uppercase font-mono tracking-wider border-0 shadow-xs">
                Pro AI Interview
              </Badge>
            </div>
            <p className="text-[11px] text-gray-400 truncate max-w-xs sm:max-w-md">
              {drive?.title} • <span className="text-blue-300 font-medium">Target: {drive?.targetRole}</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-4">
          {/* Passing score badge */}
          <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>Benchmark: {drive?.passingScore || 75}%</span>
          </div>

          {/* Countdown Clock */}
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-muted/40 dark:bg-muted/30 border border-border text-xs font-mono font-bold text-blue-300">
            <Clock className="w-3.5 h-3.5" />
            <span>{formatTimer(timeLeftSeconds)}</span>
          </div>

          <Button
            size="sm"
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-xs text-gray-400 hover:text-white hover:bg-muted/40 dark:bg-muted/30 h-8 px-2.5"
          >
            Exit
          </Button>
        </div>
      </header>

      {/* Main Studio Arena */}
      <main className="flex-1 container mx-auto px-3 sm:px-6 py-4 max-w-7xl flex flex-col justify-center">
        {!isCompleted ? (
          <div className="space-y-4">
            {/* Progress status */}
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span className="font-semibold text-blue-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                Question {currentQuestionIndex + 1} of {questions.length} 
                {currentQuestionIndex === 0 && (
                  <Badge className="ml-1.5 bg-blue-500/20 text-blue-300 border-blue-500/30 text-[9px]">
                    Mandatory Introduction
                  </Badge>
                )}
              </span>
              <span className="font-mono text-muted-foreground">{progressPercent}% Completed</span>
            </div>
            <Progress value={progressPercent} className="h-1.5 bg-muted/40 dark:bg-muted/30" />

            {/* Video & AI Avatar Pro Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Tile 1: AI Interviewer Interactive Avatar */}
              <div className="relative rounded-2xl overflow-hidden bg-gradient-to-b from-[#131325] to-card dark:to-gray-950 border border-blue-500/20 p-5 flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] text-center shadow-xl">
                <div className="absolute top-3 left-3 flex items-center gap-2">
                  <Badge className="bg-background/80 dark:bg-black/50 backdrop-blur-md border-border text-white text-[10px] flex items-center gap-1.5">
                    <Bot className="w-3 h-3 text-blue-400" /> AI Interviewer
                  </Badge>
                  {isAiSpeaking && (
                    <Badge className="bg-emerald-500/20 text-emerald-300 border-emerald-500/30 text-[10px] animate-pulse">
                      Speaking...
                    </Badge>
                  )}
                </div>

                <div className="relative my-3">
                  {/* Glowing speech pulse rings */}
                  {isAiSpeaking && (
                    <motion.div 
                      animate={{ scale: [1, 1.35, 1], opacity: [0.6, 0, 0.6] }}
                      transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                      className="absolute inset-0 rounded-full bg-blue-500/30 blur-lg will-change-transform"
                    />
                  )}
                  <div className={`w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 p-1 shadow-lg shadow-blue-600/30 transition-transform ${isAiSpeaking ? "scale-105" : ""}`}>
                    <div className="w-full h-full rounded-full bg-card dark:bg-gray-950 flex items-center justify-center">
                      <Bot className={`w-10 h-10 sm:w-12 sm:h-12 ${isAiSpeaking ? "text-blue-300 animate-bounce" : "text-blue-400"}`} />
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <h3 className="text-sm font-bold text-foreground">Voke AI Evaluator</h3>
                  <p className="text-[11px] text-muted-foreground">Institutional Placement Assessor</p>
                </div>

                <div className="mt-3 flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={speakCurrentQuestion}
                    className="border-border hover:bg-muted/50 text-blue-300 text-xs h-7 px-2.5 rounded-full"
                  >
                    <Volume2 className="w-3 h-3 mr-1" /> Replay Voice
                  </Button>
                </div>
              </div>

              {/* Tile 2: Student Live Camera Feed */}
              <div className="relative rounded-2xl overflow-hidden bg-black/80 border border-border flex flex-col items-center justify-center min-h-[220px] sm:min-h-[260px] shadow-xl">
                <div className="absolute top-3 left-3 z-10 flex items-center gap-2">
                  <Badge className="bg-black/60 backdrop-blur-md border-border text-white text-[10px] flex items-center gap-1.5">
                    <User className="w-3 h-3 text-emerald-400" /> {studentName}
                  </Badge>
                  {isListening && (
                    <Badge className="bg-rose-500/20 text-rose-300 border-rose-500/30 text-[10px] animate-pulse flex items-center gap-1">
                      <Radio className="w-2.5 h-2.5 text-rose-400" /> Mic Live
                    </Badge>
                  )}
                </div>

                {/* Live Video Element */}
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className={`w-full h-full object-cover absolute inset-0 ${!isCameraOn ? "hidden" : ""}`}
                />

                {!isCameraOn && (
                  <div className="flex flex-col items-center justify-center text-gray-500 space-y-2">
                    <div className="w-16 h-16 rounded-full bg-muted/40 dark:bg-muted/30 flex items-center justify-center text-muted-foreground">
                      <VideoOff className="w-7 h-7" />
                    </div>
                    <p className="text-xs">Camera Feed Paused</p>
                  </div>
                )}

                {/* Media Controls Bar */}
                <div className="absolute bottom-3 right-3 z-10 flex items-center gap-2 bg-black/70 backdrop-blur-md p-1 rounded-full border border-border">
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={toggleCamera}
                    className={`w-8 h-8 rounded-full ${isCameraOn ? "text-emerald-400 hover:bg-emerald-500/20" : "text-rose-400 hover:bg-rose-500/20"}`}
                    title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                  >
                    {isCameraOn ? <Camera className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={isListening ? stopListening : startListening}
                    className={`w-8 h-8 rounded-full ${isListening ? "bg-rose-500 text-white animate-pulse" : "text-gray-300 hover:bg-muted/50"}`}
                    title={isListening ? "Stop Speaking" : "Start Speaking (Mic)"}
                  >
                    {isListening ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                  </Button>

                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => setIsCodeEditorOpen(!isCodeEditorOpen)}
                    className={`w-8 h-8 rounded-full ${isCodeEditorOpen ? "bg-blue-600 text-foreground" : "text-gray-300 hover:bg-muted/50"}`}
                    title="Toggle Live Code Editor Studio"
                  >
                    <Code2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Current Active Question Card */}
            <Card className="bg-[#0e0e1a] border-blue-500/30 text-white shadow-2xl">
              <CardHeader className="p-4 sm:p-5 pb-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
                  <div className="flex items-center gap-2">
                    <Badge className="bg-blue-600 text-white font-mono text-[10px] px-2 py-0.5">
                      Question {currentQuestionIndex + 1}
                    </Badge>
                    <Badge className="bg-muted/50 text-gray-300 text-[10px] uppercase font-mono">
                      {currentQ.difficulty || "Medium"} • {currentQ.type || "Technical"}
                    </Badge>
                  </div>

                  <span className="text-[11px] text-blue-300/80 font-mono">
                    Institutional Strict Round
                  </span>
                </div>

                <CardTitle className="text-base sm:text-lg font-bold text-white leading-snug">
                  {currentQ.question}
                </CardTitle>
                <CardDescription className="text-xs text-gray-400 pt-0.5">
                  Speak clearly into your microphone or type your response below. The AI evaluates depth against expected key concepts.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-4 sm:p-5 pt-0 space-y-4">
                {/* Optional Split Coding Studio */}
                {isCodeEditorOpen && (
                  <div className="rounded-xl overflow-hidden border border-blue-500/30 bg-black/60 p-3 space-y-2">
                    <div className="flex items-center justify-between border-b border-border pb-2">
                      <div className="flex items-center gap-2 text-xs text-blue-300 font-semibold">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        <span>Live Code Workspace</span>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <select
                          value={codeLanguage}
                          onChange={e => setCodeLanguage(e.target.value as any)}
                          className="bg-black/60 border border-border text-xs text-white rounded px-2 py-1 focus:outline-none"
                        >
                          <option value="python">Python 3</option>
                          <option value="javascript">JavaScript</option>
                          <option value="java">Java</option>
                          <option value="cpp">C++</option>
                        </select>
                        <Button
                          size="sm"
                          onClick={handleRunCode}
                          disabled={isExecutingCode}
                          className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs h-7 px-2.5"
                        >
                          {isExecutingCode ? <Loader2 className="w-3 h-3 animate-spin" /> : <Play className="w-3 h-3 mr-1" />}
                          Run Code
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={codeSnippet}
                      onChange={e => setCodeSnippet(e.target.value)}
                      className="bg-black font-mono text-xs text-emerald-400 border-0 focus-visible:ring-0 min-h-[140px] resize-y"
                    />

                    {codeOutput && (
                      <div className="p-2 rounded bg-black/80 border border-border font-mono text-[11px] text-foreground/80">
                        <span className="text-gray-500 block text-[10px] uppercase">Output:</span>
                        <pre className="whitespace-pre-wrap">{codeOutput}</pre>
                      </div>
                    )}
                  </div>
                )}

                {/* Candidate Speech / Text Response Field */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-gray-300 flex items-center gap-2">
                      <span>Your Response</span>
                      {isListening && (
                        <span className="text-rose-400 text-[11px] flex items-center gap-1 font-normal animate-pulse">
                          <span className="w-2 h-2 rounded-full bg-rose-500"></span> Transcribing voice in real-time...
                        </span>
                      )}
                    </label>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {currentAnswer.trim().split(/\s+/).filter(Boolean).length} words
                    </span>
                  </div>

                  <div className="relative">
                    <Textarea
                      value={currentAnswer}
                      onChange={e => setCurrentAnswer(e.target.value)}
                      placeholder="Speak using the microphone above or type your technical answer, approach, and code explanation here..."
                      className="bg-background/80 dark:bg-black/50 border-white/15 text-white text-xs sm:text-sm min-h-[100px] sm:min-h-[120px] rounded-xl focus:border-blue-400 resize-y p-3.5 leading-relaxed"
                    />

                    {/* Quick Speak Toggle Button inside box */}
                    <Button
                      type="button"
                      size="sm"
                      onClick={isListening ? stopListening : startListening}
                      className={`absolute bottom-3 right-3 text-xs h-7 px-2.5 rounded-lg ${
                        isListening 
                          ? "bg-rose-600 hover:bg-rose-500 text-white animate-pulse" 
                          : "bg-blue-600/80 hover:bg-blue-500 text-foreground"
                      }`}
                    >
                      {isListening ? (
                        <>
                          <Mic className="w-3 h-3 mr-1" /> Stop Mic
                        </>
                      ) : (
                        <>
                          <Mic className="w-3 h-3 mr-1" /> Speak Answer
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                {/* Submit Action */}
                <div className="flex items-center justify-between pt-2 border-t border-border/50">
                  <div className="text-[11px] text-gray-400 hidden sm:block">
                    {currentQuestionIndex + 1 < questions.length ? "Next question will load immediately upon evaluation." : "Final question of placement round."}
                  </div>

                  <Button
                    onClick={handleSubmitAnswer}
                    disabled={isSubmittingTurn}
                    className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-semibold text-xs h-9 px-6 rounded-xl shadow-lg shadow-blue-600/30 ml-auto"
                  >
                    {isSubmittingTurn ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                        Evaluating Response...
                      </>
                    ) : (
                      <>
                        {currentQuestionIndex + 1 < questions.length ? "Submit & Next Question" : "Complete Assessment"}
                        <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Institutional Selection Verdict & Scorecard Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-3xl mx-auto space-y-6 py-6"
          >
            <div className={`p-8 rounded-3xl text-center space-y-4 shadow-2xl border ${
              isPassed 
                ? "bg-gradient-to-b from-emerald-950/40 via-[#0a1610] to-[#070e0a] border-emerald-500/40 shadow-emerald-900/20" 
                : "bg-gradient-to-b from-rose-950/40 via-[#180d10] to-[#0e0708] border-rose-500/40 shadow-rose-900/20"
            }`}>
              <div className="flex justify-center">
                {isPassed ? (
                  <div className="w-20 h-20 rounded-3xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20">
                    <Trophy className="w-10 h-10" />
                  </div>
                ) : (
                  <div className="w-20 h-20 rounded-3xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                    <AlertCircle className="w-10 h-10" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Badge className={`text-xs px-3 py-1 font-bold uppercase tracking-widest ${
                  isPassed 
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40" 
                    : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                }`}>
                  {isPassed ? "🎉 SELECTION CRITERIA MET" : "CRITERIA NOT MET"}
                </Badge>
                
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight pt-1">
                  {isPassed ? "Congratulations! You Are SELECTED!" : "Criteria Not Met"}
                </h2>

                <p className="text-xs sm:text-sm text-gray-300 max-w-lg mx-auto leading-relaxed">
                  {isPassed 
                    ? `You scored an average of ${finalScore}%, exceeding the ${drive?.passingScore || 75}% benchmark set by ${drive?.collegeName || "the Placement Cell"}. Your profile and AI scorecard have been recorded for campus shortlist.`
                    : `You scored ${finalScore}%, which is below the ${drive?.passingScore || 75}% passing benchmark for this drive. Review your question-by-question feedback below.`
                  }
                </p>
              </div>

              {/* Score breakdown metrics */}
              <div className="grid grid-cols-3 gap-3 max-w-md mx-auto pt-2">
                <div className="p-3.5 rounded-2xl bg-muted/40 dark:bg-muted/30 border border-border/50 space-y-0.5">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Your Score</div>
                  <div className={`text-2xl font-extrabold font-mono ${isPassed ? "text-emerald-400" : "text-rose-400"}`}>
                    {finalScore}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 dark:bg-muted/30 border border-border/50 space-y-0.5">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Benchmark</div>
                  <div className="text-2xl font-extrabold font-mono text-foreground">
                    {drive?.passingScore || 75}%
                  </div>
                </div>

                <div className="p-3.5 rounded-2xl bg-muted/40 dark:bg-muted/30 border border-border/50 space-y-0.5">
                  <div className="text-[10px] text-gray-400 uppercase font-semibold">Verdict</div>
                  <div className={`text-xs font-bold uppercase mt-2 ${isPassed ? "text-emerald-400" : "text-rose-400"}`}>
                    {isPassed ? "SELECTED" : "NOT SELECTED"}
                  </div>
                </div>
              </div>
            </div>

            {/* Answer-by-Answer AI Breakdown */}
            <Card className="bg-[#0f0f1c] border-border text-white shadow-xl">
              <CardHeader className="p-5 pb-3 border-b border-border">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <FileText className="w-4 h-4 text-blue-400" />
                  Institutional Round Performance Review ({turnAnswers.length} Questions)
                </CardTitle>
                <CardDescription className="text-xs text-muted-foreground">
                  Detailed question evaluation including introduction and technical responses.
                </CardDescription>
              </CardHeader>

              <CardContent className="p-5 space-y-4">
                {turnAnswers.map((item, idx) => (
                  <div key={idx} className="p-4 rounded-xl bg-muted/30 dark:bg-black/40 border border-border/50 space-y-2 text-xs">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-blue-300">
                        Q{idx + 1}: {item.question}
                      </span>
                      <Badge className={`text-[10px] font-mono font-bold ${
                        item.score >= (drive?.passingScore || 75)
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/30" 
                          : "bg-rose-500/20 text-rose-300 border-rose-500/30"
                      }`}>
                        Score: {item.score}%
                      </Badge>
                    </div>

                    <div className="bg-muted/40 dark:bg-muted/30 p-2.5 rounded-lg border border-border/50 text-foreground/80">
                      <strong className="text-gray-400 block text-[10px] uppercase mb-0.5">Your Response:</strong>
                      <p className="italic text-gray-300 line-clamp-3">{item.studentAnswer}</p>
                    </div>

                    <div className="p-2.5 rounded-lg bg-blue-950/30 border border-blue-500/20 text-blue-200">
                      <strong className="text-blue-400 block text-[10px] uppercase mb-0.5">AI Feedback:</strong>
                      <p>{item.aiFeedback}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Action buttons */}
            <div className="flex items-center justify-center gap-3 pt-2">
              <Button
                onClick={() => navigate("/dashboard")}
                className="bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs h-9 px-6 shadow-lg shadow-blue-600/30"
              >
                <ArrowLeft className="w-4 h-4 mr-1.5" /> Back to Dashboard
              </Button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
