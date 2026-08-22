import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  MessageSquare,
  Send, User, Mic, MicOff, LogOut,
  Sparkles, ArrowLeft, Activity, Loader2, Check,
  ChevronDown, ChevronUp, Award, CheckCircle2,
  StopCircle, ArrowRight, AlertTriangle, RotateCcw,
  Bot, Lightbulb, BookOpen, HelpCircle, Layers,
  Volume2, PanelRightClose, PanelRightOpen, Target,
  Cpu, FileText, CheckSquare
} from "lucide-react";
import { toast } from "sonner";
import { trackEvent } from "@/utils/analytics";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "motion/react";
import ReactMarkdown from "react-markdown";
import { useVoiceChat } from "@/hooks/useVoiceChat";
import { loadUserProfileContext, ProfileContext } from "@/utils/profileContext";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";

// Interview Categories
const CATEGORIES = [
  { id: 'general', label: 'General Technical & Behavioral', icon: MessageSquare, color: 'text-blue-500', bg: 'bg-blue-500/10' },
];

interface Message {
  role: "assistant" | "user";
  content: string;
}

interface InterviewTurn {
  question: string;
  answer?: string;
  feedback?: string;
}

// Parses consecutive assistant/user messages into paired structured turns
const getInterviewTurns = (msgs: Message[]) => {
  const turns: InterviewTurn[] = [];
  
  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    
    if (msg.role === "assistant") {
      const isFeedback = msg.content.startsWith("### ✅") || msg.content.includes("### What Went Well") || msg.content.includes("### ✅ What Went Well");
      
      if (isFeedback) {
        if (turns.length > 0) {
          turns[turns.length - 1].feedback = msg.content;
        }
      } else {
        turns.push({ question: msg.content });
      }
    } else if (msg.role === "user") {
      if (turns.length > 0) {
        turns[turns.length - 1].answer = msg.content;
      }
    }
  }
  
  return turns;
};

const InterviewNew = () => {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState('general');
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [voiceMode, setVoiceMode] = useState(false);
  const [questionCount, setQuestionCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionActive, setSessionActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [codingStats, setCodingStats] = useState<any>(null);
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isConfiguring, setIsConfiguring] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [showCoachPanel, setShowCoachPanel] = useState(true);
  const [showHint, setShowHint] = useState(false);
  const [activeApiInfo, setActiveApiInfo] = useState<{
    provider: string;
    model: string;
    keyLabel: string;
    isFallbackKey: boolean;
  } | null>(null);
  
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<Record<number, boolean>>({});

  const chatScrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { creditsElite, consumeCredit, isPremium, loading: creditsLoading } = useInterviewCredits('elite');

  // Voice Chat Hook
  const { isListening, speak, stopListening, stopSpeaking } = useVoiceChat({
    onTranscript: (text, isFinal) => {
      if (isFinal) {
        setInput(text);
        setTimeout(() => {
          if (text.trim()) handleSendMessage(text);
        }, 1000);
      }
    },
    onError: (error) => toast.error(error),
  });

  useEffect(() => {
    checkAuth();
    loadCodingStats();
    loadContext();
  }, []);

  useEffect(() => {
    setSessionActive(false);
    setMessages([]);
    setQuestionCount(0);
    setIsFinished(false);
    setShowHint(false);
  }, [activeCategory]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (sessionActive && !isFinished && !isConfiguring) {
        setElapsedTime(Math.round((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, sessionActive, isFinished, isConfiguring]);

  useEffect(() => {
    if (!sending && !isConfiguring && !isFinished) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sending, isConfiguring, isFinished]);

  // Scroll to bottom of chat when messages change
  useEffect(() => {
    chatScrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, sending]);

  const loadContext = async () => {
    try {
      const context = await loadUserProfileContext();
      setProfileContext(context);
    } catch (error) {
      console.error("Error loading profile context:", error);
    }
  };

  const loadCodingStats = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from("profiles")
        .select("coding_stats")
        .eq("id", user.id)
        .single();

      if (profile && (profile as any).coding_stats) {
        setCodingStats((profile as any).coding_stats);
      }
    } catch (error) {
      console.error("Error loading coding stats:", error);
    }
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const generateAIQuestion = async (currentMessages: Message[], count: number, limit = totalQuestions) => {
    try {
      setSending(true);
      setShowHint(false);
      const { data, error } = await supabase.functions.invoke('generate-interview-question', {
        body: {
          messages: currentMessages,
          interview_type: CATEGORIES.find(c => c.id === activeCategory)?.label || "General",
          question_count: count,
          total_questions: limit,
          coding_stats: codingStats,
          profile_context: profileContext?.context
        }
      });

      if (error) throw error;

      if (data) {
        if (data.is_error) {
          console.error("Deno execution error:", data.error, data.stack);
          throw new Error(data.error || "Unknown Deno error");
        }

        if (data.provider_info) {
          setActiveApiInfo(data.provider_info);
        }

        if (data.feedback) {
          const feedbackContent = `### ✅ What Went Well
${data.feedback.what_went_well?.map((point: string) => `- ${point}`).join('\n') || '- Clear context provided'}

### ⚠️ What Needs Improvement
${data.feedback.what_needs_improvement?.map((point: string) => `- ${point}`).join('\n') || '- Try to provide more concrete metrics'}

### 📝 Model Answer
${data.feedback.model_answer || 'N/A'}

${data.feedback.verification_note ? `### 🔍 Verification Note\n${data.feedback.verification_note}` : ''}`;

          const feedbackMsg: Message = { role: "assistant", content: feedbackContent };
          setMessages(prev => [...prev, feedbackMsg]);
        }

        const aiMsg: Message = { role: "assistant", content: data.question };
        setMessages(prev => [...prev, aiMsg]);
        if (voiceMode) speak(data.question);

        if (data.is_finished) {
          setIsFinished(true);
          setSessionActive(false);
        } else {
          setQuestionCount(prev => prev + 1);
        }
      }
    } catch (error) {
      console.error("Error generating question:", error);
      toast.error("Failed to generate question. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const startSession = (category: string, numQuestions = totalQuestions) => {
    trackEvent("interview_start", "/interview/new", { category, total_questions: numQuestions });
    setMessages([]);
    setQuestionCount(0);
    setStartTime(Date.now());
    setElapsedTime(0);
    setSessionActive(true);
    setIsFinished(false);
    setShowHint(false);

    generateAIQuestion([], 0, numQuestions);
  };

  const handleStartInterview = async (numQuestions: number) => {
    if (!isPremium && creditsElite <= 0) {
      toast.error("You have reached your interview limit. Please upgrade to Pro for unlimited sessions.");
      navigate("/pricing");
      return;
    }

    if (!isPremium) {
      const success = await consumeCredit();
      if (!success) {
        toast.error("Could not deduct interview credit.");
        return;
      }
    }

    setTotalQuestions(numQuestions);
    setIsConfiguring(false);
    startSession(activeCategory, numQuestions);
  };

  const completeSession = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setSessionActive(false);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: evaluation, error: aiError } = await supabase.functions.invoke('evaluate-interview', {
          body: {
            messages: messages,
            interview_type: CATEGORIES.find(c => c.id === activeCategory)?.label || "General"
          }
        });

        if (aiError || !evaluation) {
          console.error("AI Evaluation Failed:", aiError);
          toast.error("Could not generate AI score. Please try again.");
        }

        const finalScore = evaluation?.score || 0;

        const { data, error } = await supabase
          .from("interview_sessions")
          .insert({
            user_id: user.id,
            interview_type: activeCategory,
            status: "completed",
            job_profile_id: null,
          })
          .select()
          .single();

        if (error) {
          console.error("Supabase error:", error);
          toast.error(`Failed to save: ${error.message}`);
          setIsCompleting(false);
          setSessionActive(true);
          throw error;
        }

        trackEvent("interview_complete", "/interview/new", {
          session_id: data.id,
          score: finalScore,
          category: activeCategory
        });
        toast.success(`Session Completed! Score: ${finalScore}%`);
        
        navigate(`/interview/results/${data.id}`, {
          state: {
            score: finalScore,
            evaluation: evaluation
          }
        });
      }
    } catch (error: any) {
      console.error("Error saving session:", error);
      toast.error(error.message || "Could not save session");
      setSessionActive(true);
    } finally {
      setIsCompleting(false);
    }
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || !sessionActive || isCompleting) return;

    const userMsg: Message = { role: "user", content: content.trim() };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    await generateAIQuestion(updatedMessages, questionCount, totalQuestions);
  };

  const insertStarTemplate = () => {
    const template = `**Situation:** \n**Task:** \n**Action:** \n**Result:** `;
    setInput(prev => prev.trim() ? `${prev}\n\n${template}` : template);
    textareaRef.current?.focus();
    toast.info("STAR structure template inserted");
  };

  const toggleVoiceMode = () => {
    if (voiceMode) {
      stopListening();
      stopSpeaking();
      setVoiceMode(false);
    } else {
      setVoiceMode(true);
      toast.success("Voice mode active");
    }
  };

  const toggleFeedback = (index: number) => {
    setExpandedFeedback(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Derived state
  const turns = getInterviewTurns(messages);
  const currentQuestionIndex = turns.length;
  const progressPercent = Math.min(100, Math.round((currentQuestionIndex / totalQuestions) * 100));
  const activeTurn = turns.length > 0 ? turns[turns.length - 1] : null;
  const activeQuestion = activeTurn && !activeTurn.answer ? activeTurn.question : "";
  const completedTurns = turns.filter(t => t.answer);
  const wordCount = input.trim() ? input.trim().split(/\s+/).length : 0;

  return (
    <div className="w-screen h-screen flex flex-col bg-background text-foreground overflow-hidden font-sans">
      
      {/* 1. TOP GLOBAL NAVBAR (Clean, informative, no wasted space) */}
      <header className="h-14 border-b border-border/50 bg-card/70 backdrop-blur-xl px-4 md:px-6 flex items-center justify-between z-30 shrink-0">
        {/* Left: Brand & Topic */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-lg shrink-0"
            title="Back to Dashboard"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="flex items-center gap-2.5">
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-7 h-7 object-contain"
            />
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm tracking-tight text-foreground">Voke AI</span>
              <span className="hidden sm:inline-block text-border">/</span>
              <Badge className="hidden sm:flex bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[11px] py-0.5 px-2 font-medium hover:bg-blue-500/10">
                Mock Interview
              </Badge>
            </div>
          </div>
        </div>

        {/* Center: Live Status & Progress (Visible when active) */}
        {!isConfiguring && (
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/20 border border-border/40">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <span className="font-mono text-xs font-semibold text-emerald-400">
                {formatTime(elapsedTime)}
              </span>
            </div>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span>Question {Math.min(currentQuestionIndex, totalQuestions)} of {totalQuestions}</span>
              <div className="w-24 h-1.5 bg-secondary rounded-full overflow-hidden">
                <div 
                  className="h-full bg-blue-600 transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Right: Actions & Tools */}
        <div className="flex items-center gap-2">
          {!isConfiguring && (
            <>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowCoachPanel(!showCoachPanel)}
                className={`h-8 px-2.5 text-xs rounded-lg transition-colors gap-1.5 ${
                  showCoachPanel 
                    ? "bg-blue-500/10 text-blue-400 hover:bg-blue-500/20" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
                title="Toggle Live Interview Coach & STAR Guide"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span className="hidden lg:inline">STAR Guide</span>
              </Button>

              <Button
                variant="destructive"
                size="sm"
                onClick={completeSession}
                disabled={isCompleting}
                className="h-8 px-3 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-lg transition-all"
              >
                <StopCircle className="w-3.5 h-3.5 mr-1.5" />
                {isCompleting ? "Evaluating..." : "End Session"}
              </Button>
            </>
          )}

          <ThemeToggle />
        </div>
      </header>

      {/* 2. MAIN BODY VIEW */}
      <div className="flex-1 flex overflow-hidden relative">

        {/* SETUP SCREEN */}
        {isConfiguring ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8 overflow-y-auto">
            <motion.div
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="max-w-xl w-full p-6 md:p-8 rounded-2xl bg-card/60 border border-border/60 shadow-xl space-y-6 text-center sm:text-left backdrop-blur-xl"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-center sm:justify-start gap-2.5">
                  
                  <h3 className="text-xl font-bold text-foreground">AI Mock Text Interview</h3>
                </div>
                <p className="text-xs text-muted-foreground">
                  Simulate a realistic text-based technical & behavioral interview. Get dynamic follow-up questions and instant feedback on your answers.
                </p>
              </div>

              <div className="space-y-3 pt-1">
                <label className="text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground">
                  Select Interview Length
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { value: 3, label: "Express Mock", count: "3 Questions", duration: "~10 mins" },
                    { value: 5, label: "Standard Session", count: "5 Questions", duration: "~15 mins" },
                    { value: 15, label: "Deep Drill", count: "15 Questions", duration: "~45 mins" }
                  ].map((opt) => (
                    <div
                      key={opt.value}
                      onClick={() => setTotalQuestions(opt.value)}
                      className={`p-4 rounded-xl border text-center cursor-pointer transition-all duration-150 ${
                        totalQuestions === opt.value
                          ? "bg-blue-500/10 border-blue-500 text-foreground font-semibold shadow-sm"
                          : "bg-secondary/15 hover:bg-secondary/30 border-border/40 text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      <h4 className="font-bold text-sm text-foreground">{opt.label}</h4>
                      <p className="text-xs font-semibold mt-1 text-foreground/80">{opt.count}</p>
                      <p className="text-[10px] opacity-60 mt-0.5">{opt.duration}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4 border-t border-border/50 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-left text-xs text-muted-foreground">
                  Format: <span className="font-semibold text-foreground">Text Simulation with Feedback</span>
                </div>
                <Button
                  onClick={() => handleStartInterview(totalQuestions)}
                  className="w-full sm:w-auto px-6 h-10 font-semibold text-xs rounded-xl bg-blue-600 hover:bg-blue-500 text-white shadow-sm transition-colors"
                >
                  Start Practice Session
                  <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                </Button>
              </div>
            </motion.div>
          </div>
        ) : (
          /* ACTIVE INTERVIEW LAYOUT */
          <>
            {/* MAIN CHAT CONVERSATION STREAM */}
            <main className="flex-1 flex flex-col h-full overflow-hidden bg-background">
              
              {/* Scrollable Conversation History */}
              <div className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                <div className="max-w-3xl mx-auto space-y-6">
                  
                  {/* Welcoming Banner */}
                  <div className="p-4 rounded-xl bg-secondary/15 border border-border/40 flex items-start gap-3">
                    <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0 mt-0.5">
                      <Bot className="w-4 h-4" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground">Voke AI Interviewer</h4>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        I will ask you questions one at a time. Provide thoughtful, structured answers. Use the STAR guide on the right if you want quick advice!
                      </p>
                    </div>
                  </div>

                  {/* Completed Question & Answer Turns */}
                  {completedTurns.map((turn, index) => {
                    const isExpanded = !!expandedFeedback[index];

                    return (
                      <div key={index} className="space-y-4 pt-2">
                        {/* Interviewer Question */}
                        <div className="flex items-start gap-3">
                          <Avatar className="w-8 h-8 rounded-xl border border-blue-500/20 shrink-0">
                            <AvatarFallback className="bg-blue-500/10 text-blue-400 text-xs font-bold">
                              AI
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-foreground">Voke AI</span>
                              <Badge variant="outline" className="text-[10px] py-0 px-1.5 border-border/50 text-muted-foreground">
                                Question {index + 1}
                              </Badge>
                            </div>
                            <div className="p-4 rounded-2xl bg-card/60 border border-border/50 text-[14px] leading-relaxed text-foreground">
                              <ReactMarkdown>{turn.question}</ReactMarkdown>
                            </div>
                          </div>
                        </div>

                        {/* User Answer */}
                        {turn.answer && (
                          <div className="flex items-start gap-3 justify-end pl-10">
                            <div className="flex-1 max-w-2xl space-y-2 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <span className="text-[11px] text-muted-foreground font-medium">
                                  {turn.answer.trim().split(/\s+/).length} words
                                </span>
                                <span className="text-xs font-bold text-foreground">You</span>
                              </div>
                              <div className="p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-[14px] leading-relaxed text-foreground text-left whitespace-pre-line">
                                {turn.answer}
                              </div>
                            </div>
                            <Avatar className="w-8 h-8 rounded-xl border border-border/50 shrink-0">
                              <AvatarFallback className="bg-secondary text-foreground text-xs font-bold">
                                You
                              </AvatarFallback>
                            </Avatar>
                          </div>
                        )}

                        {/* Expandable Turn Feedback */}
                        {turn.feedback && (
                          <div className="ml-11 mr-11">
                            <button
                              onClick={() => toggleFeedback(index)}
                              className="w-full flex items-center justify-between p-3 rounded-xl bg-secondary/15 hover:bg-secondary/30 border border-border/40 text-xs font-semibold text-blue-400 transition-colors"
                            >
                              <span className="flex items-center gap-1.5">
                                Review Feedback for Question {index + 1}
                              </span>
                              {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                            </button>

                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  transition={{ duration: 0.2 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-2 p-4 rounded-xl bg-blue-500/5 border border-blue-500/15 text-xs text-foreground/90 leading-relaxed prose prose-sm prose-invert max-w-none">
                                    <ReactMarkdown>{turn.feedback}</ReactMarkdown>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        )}
                      </div>
                    );
                  })}

                  {/* ACTIVE QUESTION CARD */}
                  {activeQuestion && (
                    <div className="flex items-start gap-3 pt-2">
                      <Avatar className="w-8 h-8 rounded-xl border border-blue-500/20 shrink-0">
                        <AvatarFallback className="bg-blue-500/10 text-blue-400 text-xs font-bold">
                          AI
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-foreground">Voke AI</span>
                            
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowHint(!showHint)}
                            className="h-7 px-2 text-[11px] text-muted-foreground hover:text-blue-400 gap-1 rounded-md"
                          >
                            <Lightbulb className="w-3 h-3 text-amber-400" />
                            {showHint ? "Hide Hint" : "Need a Hint?"}
                          </Button>
                        </div>

                        <div className="p-5 rounded-2xl bg-card/80 border border-border/60 shadow-sm text-[15px] font-medium leading-relaxed text-foreground">
                          <ReactMarkdown>{activeQuestion}</ReactMarkdown>
                        </div>

                        {/* Optional Question Hint Box */}
                        {showHint && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="p-3.5 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-200/90 space-y-1.5"
                          >
                            <div className="font-bold flex items-center gap-1.5 text-amber-400 text-xs">
                              <Lightbulb className="w-3.5 h-3.5" />
                              Strategy Tip for This Question:
                            </div>
                            <p className="text-[11px] text-muted-foreground leading-relaxed">
                              Structure your answer using the <strong>STAR method</strong> (Situation, Task, Action, Result). Focus on what *you* personally designed, built, or decided, and include concrete technical details.
                            </p>
                          </motion.div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Reviewing Loader */}
                  {sending && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-6 rounded-2xl bg-card/40 border border-border/50 border-dashed flex items-center justify-center gap-3 text-center"
                    >
                      <Loader2 className="w-5 h-5 text-blue-500 animate-spin" />
                      <span className="text-xs font-semibold text-muted-foreground">
                        Voke AI is evaluating your response and preparing the next turn...
                      </span>
                    </motion.div>
                  )}

                  {/* Completion Card */}
                  {isFinished && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="p-6 rounded-2xl bg-card/80 border border-border/60 shadow-lg text-center space-y-4"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-400">
                        <CheckCircle2 className="w-6 h-6" />
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-base font-bold text-foreground">Interview Session Completed!</h3>
                        <p className="text-xs text-muted-foreground max-w-md mx-auto">
                          You answered all {totalQuestions} questions. Click below to generate your comprehensive scorecard and feedback analysis.
                        </p>
                      </div>
                      <Button
                        onClick={completeSession}
                        disabled={isCompleting}
                        className="px-6 h-11 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-sm rounded-xl transition-all gap-2"
                      >
                        {isCompleting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin text-white" />
                            Analyzing Final Scorecard...
                          </>
                        ) : (
                          <>
                            View Scorecard & Analytics
                            <Award className="w-4 h-4" />
                          </>
                        )}
                      </Button>
                    </motion.div>
                  )}

                  <div ref={chatScrollRef} />
                </div>
              </div>

              {/* 3. DOCKED ANSWER EDITOR (Super useful, intuitive text interface) */}
              {!isFinished && activeQuestion && (
                <div className="p-4 border-t border-border/50 bg-card/60 backdrop-blur-xl shrink-0">
                  <div className="max-w-3xl mx-auto space-y-3">
                    
                    {/* Quick Helper Tools Toolbar */}
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={insertStarTemplate}
                          className="h-7 px-2 text-[11px] border-border/50 text-muted-foreground hover:text-blue-400 hover:border-blue-500/30 gap-1 rounded-lg"
                          title="Insert Situation, Task, Action, Result framework"
                        >
                          <Layers className="w-3 h-3 text-blue-400" />
                          Insert STAR Template
                        </Button>

                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          disabled
                          className="h-7 px-2 text-[11px] rounded-lg gap-1 text-muted-foreground cursor-not-allowed opacity-50"
                          title="Speech-to-Text (Disabled for now)"
                        >
                          <Mic className="w-3 h-3" />
                          Speech-to-Text
                        </Button>
                      </div>

                      {/* Word count quality indicator */}
                      <div className="flex items-center gap-2 font-mono text-[11px]">
                        <span className={wordCount >= 50 ? "text-emerald-400" : "text-muted-foreground"}>
                          {wordCount} words
                        </span>
                        {wordCount > 0 && wordCount < 30 && (
                          <span className="text-[10px] text-muted-foreground">(aim for 50+ words)</span>
                        )}
                        {wordCount >= 50 && (
                          <span className="text-[10px] text-emerald-400 font-sans">✓ Good depth</span>
                        )}
                      </div>
                    </div>

                    {/* Textarea Input */}
                    <div className={`p-3 rounded-2xl bg-card border ${
                      isEditorFocused 
                        ? "border-blue-500/50 ring-1 ring-blue-500/20" 
                        : "border-border/60"
                    } transition-all duration-200 space-y-2`}>
                      <Textarea
                        ref={textareaRef}
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onFocus={() => setIsEditorFocused(true)}
                        onBlur={() => setIsEditorFocused(false)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendMessage(input);
                          }
                        }}
                        placeholder="Draft your detailed answer here... (Press Enter to submit, Shift+Enter for new line)"
                        className="min-h-[100px] max-h-[220px] py-1 px-1 border-0 focus-visible:ring-0 bg-transparent resize-none text-[14px] leading-relaxed text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                        disabled={sending || !sessionActive || isCompleting}
                      />

                      <div className="flex items-center justify-between pt-2 border-t border-border/40">
                        <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                          <Activity className="w-3 h-3 text-blue-400" />
                          Enter ↵ to submit answer
                        </span>

                        <Button
                          onClick={() => handleSendMessage(input)}
                          disabled={!input.trim() || sending || !sessionActive || isCompleting}
                          className={`h-8 px-4 font-semibold text-xs rounded-xl transition-all duration-200 ${
                            input.trim() && !sending && sessionActive && !isCompleting
                              ? "bg-blue-600 hover:bg-blue-500 text-white shadow-sm"
                              : "bg-secondary/30 text-muted-foreground/40 cursor-not-allowed border border-border/30"
                          }`}
                        >
                          {sending ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin text-white" />
                              Submitting...
                            </>
                          ) : (
                            <>
                              Submit Answer
                              <Send className="w-3.5 h-3.5 ml-1.5" />
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </main>

            {/* 4. RIGHT COACH & STAR FRAMEWORK PANEL (Super useful real-time assistant) */}
            {showCoachPanel && (
              <aside className="w-80 lg:w-88 border-l border-border/50 bg-card/40 backdrop-blur-xl shrink-0 h-full hidden md:flex flex-col relative z-20 overflow-hidden">
                <div className="p-4 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-1.5 rounded-lg bg-blue-500/10 text-blue-400">
                      <Target className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="font-bold text-xs text-foreground">Interview Coach</h3>
                      <p className="text-[10px] text-muted-foreground">Real-time Answering Guide</p>
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowCoachPanel(false)}
                    className="h-7 w-7 text-muted-foreground hover:text-foreground rounded-lg"
                    title="Hide Coach Panel"
                  >
                    <PanelRightClose className="w-4 h-4" />
                  </Button>
                </div>

                <ScrollArea className="flex-1 p-4 space-y-4">
                  <div className="space-y-4">
                    
                    {/* STAR Framework Card */}
                    <div className="p-4 rounded-xl bg-secondary/15 border border-border/50 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider">STAR Blueprint</span>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={insertStarTemplate}
                          className="h-6 px-2 text-[10px] text-blue-400 hover:bg-blue-500/10 rounded-md"
                        >
                          Use Template
                        </Button>
                      </div>

                      <div className="space-y-2.5 text-xs">
                        <div className="p-2 rounded-lg bg-card/60 border border-border/40">
                          <span className="font-bold text-blue-400 mr-1.5">S • Situation:</span>
                          <span className="text-muted-foreground text-[11px]">Set context, project background, or company scope.</span>
                        </div>
                        <div className="p-2 rounded-lg bg-card/60 border border-border/40">
                          <span className="font-bold text-blue-400 mr-1.5">T • Task:</span>
                          <span className="text-muted-foreground text-[11px]">Define the specific challenge, requirement, or obstacle.</span>
                        </div>
                        <div className="p-2 rounded-lg bg-card/60 border border-border/40">
                          <span className="font-bold text-blue-400 mr-1.5">A • Action:</span>
                          <span className="text-muted-foreground text-[11px]">Explain the exact technical steps & tools YOU implemented.</span>
                        </div>
                        <div className="p-2 rounded-lg bg-card/60 border border-border/40">
                          <span className="font-bold text-blue-400 mr-1.5">R • Result:</span>
                          <span className="text-muted-foreground text-[11px]">Quantify impact (e.g. 40% faster, 0 bugs, key learnings).</span>
                        </div>
                      </div>
                    </div>

                    {/* Live Answer Best Practices */}
                    <div className="p-4 rounded-xl bg-secondary/15 border border-border/50 space-y-2.5">
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                        High-Scoring Tactics
                      </span>
                      <ul className="space-y-2 text-[11px] text-muted-foreground leading-relaxed">
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Quantify Results:</strong> Include numbers, percentages, or scale.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Show Ownership:</strong> Use "I designed" or "I resolved" instead of passive voice.</span>
                        </li>
                        <li className="flex items-start gap-1.5">
                          <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                          <span><strong>Name Tech Stack:</strong> Mention specific libraries, DBs, and patterns.</span>
                        </li>
                      </ul>
                    </div>

                    {/* Candidate Profile Context Badge */}
                    {/* {profileContext?.targetRole && (
                      <div className="p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 space-y-1.5">
                        <span className="text-[10px] font-bold text-blue-400 uppercase tracking-wider flex items-center gap-1">
                          <User className="w-3 h-3" />
                          Target Profile
                        </span>
                        <p className="text-xs font-semibold text-foreground">
                          {profileContext.targetRole}
                        </p>
                        {profileContext.dreamCompany && (
                          <p className="text-[10px] text-muted-foreground">
                            Target Company: {profileContext.dreamCompany}
                          </p>
                        )}
                      </div>
                    )} */}

                  </div>
                </ScrollArea>
              </aside>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default InterviewNew;
