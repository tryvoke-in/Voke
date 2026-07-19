import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import {
  MessageSquare,
  Send, User, Mic, MicOff, LogOut,
  Settings, Menu, X, Clock, History, Sparkles,
  ArrowLeft, Activity, Loader2, Check, ChevronDown,
  ChevronUp, Award, CheckCircle2, StopCircle, ArrowRight,
  AlertTriangle, RotateCcw
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
  { id: 'general', label: 'General Interview', icon: MessageSquare, color: 'text-violet-500', bg: 'bg-violet-500/10' },
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
      // Check if this message content is feedback or a question
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
  const [sidebarOpen, setSidebarOpen] = useState(true); // Default open on desktop
  const [questionCount, setQuestionCount] = useState(0); // Track number of questions asked
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [sessionActive, setSessionActive] = useState(true);
  const [isFinished, setIsFinished] = useState(false);
  const [codingStats, setCodingStats] = useState<any>(null);
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  const [totalQuestions, setTotalQuestions] = useState(5);
  const [isConfiguring, setIsConfiguring] = useState(true);
  
  // Navigation tabs for mobile viewports
  const [activeTab, setActiveTab] = useState<'arena' | 'history' | 'timeline'>('arena');
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { loading: creditsLoading } = useInterviewCredits('elite');
  const sessionInitializedRef = useRef(false);

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
    loadPastSessions();
  }, []);

  useEffect(() => {
    // Do not auto-initialize session; let user pick the number of questions on the configuration screen first
    setSessionActive(false);
    setMessages([]);
    setQuestionCount(0);
    setIsFinished(false);
  }, [activeCategory]);

  useEffect(() => {
    const timer = setInterval(() => {
      if (sessionActive && !isFinished) {
        setElapsedTime(Math.round((Date.now() - startTime) / 1000));
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [startTime, sessionActive, isFinished]);

  useEffect(() => {
    if (!sending && !isConfiguring && !isFinished) {
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [sending, isConfiguring, isFinished]);

  const loadPastSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pastData } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .not("interview_type", "in", '("voice","timed_video")')
        .order("created_at", { ascending: false });
      if (pastData) {
        setPastSessions(pastData);
      }
    } catch (err) {
      console.error("Error loading past sessions:", err);
    }
  };

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

        // If there's feedback, add it as a separate message before the question
        if (data.feedback) {
          const feedbackContent = `### ✅ What Went Well
${data.feedback.what_went_well?.map((point: string) => `- ${point}`).join('\n') || '- Good effort'}

### ⚠️ What Needs Improvement
${data.feedback.what_needs_improvement?.map((point: string) => `- ${point}`).join('\n') || '- Keep practicing'}

### 📝 Model Answer
${data.feedback.model_answer || 'N/A'}

${data.feedback.verification_note ? `### 🔍 Verification Note\n${data.feedback.verification_note}` : ''}`;

          const feedbackMsg: Message = { role: "assistant", content: feedbackContent };
          setMessages(prev => [...prev, feedbackMsg]);
        }

        // Then add the next question
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

    // Generate opening question
    generateAIQuestion([], 0, numQuestions);
  };

  const handleStartInterview = (numQuestions: number) => {
    setTotalQuestions(numQuestions);
    setIsConfiguring(false);
    startSession(activeCategory, numQuestions);
  };

  const [isCompleting, setIsCompleting] = useState(false);

  const completeSession = async () => {
    if (isCompleting) return;
    setIsCompleting(true);
    setSessionActive(false);

    const duration = Math.round((Date.now() - startTime) / 1000 / 60); // in minutes

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Call AI to evaluate the interview
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

        console.log("AI Evaluation Result:", evaluation);
        const finalScore = evaluation?.score || 0;

        const { data, error } = await supabase
          .from("interview_sessions")
          .insert({
            user_id: user.id,
            interview_type: activeCategory, // Use the ID (lowercase) instead of Label
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
            evaluation: evaluation // Pass full evaluation object
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

    const userMsg: Message = { role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");

    // Generate next question based on updated history
    await generateAIQuestion(updatedMessages, questionCount, totalQuestions);
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
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
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return "N/A";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return "N/A";
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  // Parsing variables
  const turns = getInterviewTurns(messages);
  const currentQuestionIndex = turns.length;
  const progressPercent = Math.min(100, Math.round((currentQuestionIndex / totalQuestions) * 100));

  // Extract active question and feedback
  const activeTurn = turns[turns.length - 1];
  const activeQuestion = activeTurn && !activeTurn.answer ? activeTurn.question : "";
  const completedTurns = turns.filter(t => t.answer);

  return (
    <div className="w-screen h-screen flex bg-[#0c0d14] text-foreground overflow-hidden relative font-sans">
      {/* Background Glowing Mesh Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      {/* 1. LEFT SIDEBAR (Config details & Session list) */}
      <aside className={`
        w-full md:w-80 border-r border-white/5 bg-[#0e1017]/40 backdrop-blur-xl shrink-0 h-full relative z-20 flex-col
        ${activeTab === 'history' ? 'flex' : 'hidden md:flex'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="font-bold text-lg tracking-tight bg-gradient-to-r from-violet-200 to-white bg-clip-text text-transparent">Voke AI</h1>
              <p className="text-[10px] text-violet-400/60 font-semibold uppercase tracking-wider">Interview Suite</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-violet-200/60 hover:text-white hover:bg-white/5 rounded-lg shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Active Session Status Card */}
        <div className="p-6 border-b border-white/5 space-y-5">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-violet-400/60 uppercase tracking-wider">Active Session</h2>
            <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/5 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-violet-200/50 font-medium">Focus Topic</span>
                <Badge className="bg-violet-500/10 text-violet-300 border-0 text-[10px] py-0.5 px-2 hover:bg-violet-500/10">
                  {CATEGORIES.find(c => c.id === activeCategory)?.label || "General"}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-violet-200/50 font-medium font-sans">Timer</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-400">{formatTime(elapsedTime)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-white/5">
                <div className="flex justify-between text-[11px] font-semibold text-violet-200/60">
                  <span>Questions Progress</span>
                  <span>{progressPercent}% ({currentQuestionIndex}/{totalQuestions})</span>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-white/5 [&>div]:bg-gradient-to-r [&>div]:from-violet-500 [&>div]:to-fuchsia-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Past Sessions List */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 min-h-0">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-3.5 h-3.5 text-violet-400/60" />
            <h2 className="text-xs font-bold text-violet-400/60 uppercase tracking-wider">Past Sessions</h2>
          </div>
          
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2.5 pb-4">
              {pastSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-violet-200/30">
                  No past sessions found.
                </div>
              ) : (
                pastSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/interview/results/${session.id}`)}
                    className="p-3.5 rounded-xl bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-violet-500/20 transition-all duration-300 cursor-pointer group flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-violet-100 group-hover:text-violet-400 transition-colors capitalize truncate max-w-[140px]">
                        {session.interview_type || "General"}
                      </h4>
                      <p className="text-[10px] text-violet-200/40 font-medium">
                        {formatDate(session.created_at)}
                      </p>
                    </div>
                    <div>
                      {session.overall_score !== null ? (
                        <div className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/10">
                          {session.overall_score}%
                        </div>
                      ) : (
                        <div className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-white/5 text-violet-200/40">
                          Done
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Sidebar Footer Controls */}
        <div className="p-6 border-t border-white/5 space-y-3 bg-[#0c0e14]/50">
          <ThemeToggle />
          <Button 
            onClick={completeSession} 
            variant="destructive" 
            className="w-full text-xs justify-start h-10 px-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/10 rounded-xl"
            disabled={isCompleting}
          >
            <StopCircle className="w-4 h-4 mr-2" />
            {isCompleting ? "Evaluating..." : "Finish & Evaluate"}
          </Button>
        </div>
      </aside>

      {/* 2. CENTER PANEL (Active Interview Arena) */}
      <main className={`
        flex-1 h-full flex flex-col relative min-w-0
        ${activeTab === 'arena' ? 'flex' : 'hidden md:flex'}
      `}>
        {/* Mobile Header / Navigation Tabs */}
        <header className="md:hidden border-b border-white/5 bg-[#0e1017]/40 backdrop-blur-xl p-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-sm tracking-tight text-white md:hidden">Voke AI Arena</span>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-violet-400 font-semibold uppercase tracking-wider">Practice Arena</span>
              <span className="h-1 w-1 bg-white/20 rounded-full" />
              <span className="text-xs text-violet-200/40">Text Simulation</span>
            </div>
          </div>

          {/* Mobile Viewport Navigation Selector */}
          <div className="flex md:hidden items-center gap-1.5 p-1 rounded-xl bg-white/5 border border-white/5">
            <Button
              size="sm"
              variant={activeTab === 'history' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('history')}
              className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${activeTab === 'history' ? 'bg-violet-600 text-white hover:bg-violet-600' : 'text-violet-200/60 hover:text-white'}`}
            >
              History
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'arena' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('arena')}
              className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${activeTab === 'arena' ? 'bg-violet-600 text-white hover:bg-violet-600' : 'text-violet-200/60 hover:text-white'}`}
            >
              Arena
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'timeline' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('timeline')}
              className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${activeTab === 'timeline' ? 'bg-violet-600 text-white hover:bg-violet-600' : 'text-violet-200/60 hover:text-white'}`}
            >
              Timeline
            </Button>
          </div>
          
          <div className="md:hidden flex items-center">
            <Button size="icon" variant="ghost" className="text-violet-200/60 hover:text-white h-8 w-8" onClick={completeSession}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>


        {/* Center Workspace Scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full space-y-6 py-6">
            
            {isConfiguring ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl relative overflow-hidden space-y-6 text-center sm:text-left"
              >
                {/* Glowing banner decoration */}
                <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />
                
                <div className="space-y-2">
                  <div className="flex items-center justify-center sm:justify-start gap-2.5">
                    <div className="p-2 bg-violet-500/10 rounded-xl">
                      <Sparkles className="w-5 h-5 text-violet-400" />
                    </div>
                    <h3 className="text-xl font-bold text-violet-100">Setup AI Mock Interview</h3>
                  </div>
                  <p className="text-xs text-violet-200/50">
                    Configure your session length. A custom question set will be calibrated dynamically.
                  </p>
                </div>

                <div className="space-y-4 pt-2">
                  <label className="text-[10px] font-extrabold uppercase tracking-wider text-violet-300/40">Select Interview Length</label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {[
                      {value: 3, label: "Express Mock", count: "3 Questions", duration: "~10 mins" },
                      {value: 5, label: "Standard Session", count: "5 Questions", duration: "~15 mins" },
                      {value: 15, label: "Deep Drill", count: "15 Questions", duration: "~45 mins" }
                    ].map((opt) => (
                      <div
                        key={opt.value}
                        onClick={() => setTotalQuestions(opt.value)}
                        className={`p-4 rounded-2xl border text-center cursor-pointer transition-all duration-200 ${
                          totalQuestions === opt.value
                            ? "bg-violet-500/10 border-violet-500 shadow-md shadow-violet-500/5 text-violet-100 font-bold"
                            : "bg-white/[0.01] hover:bg-white/[0.03] border-white/5 text-violet-200/60"
                        }`}
                      >
                        <h4 className="font-bold text-sm">{opt.label}</h4>
                        <p className="text-xs font-semibold mt-1">{opt.count}</p>
                        <p className="text-[10px] opacity-60 mt-0.5">{opt.duration}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                  <div className="text-left text-xs text-violet-200/30">
                    Category: <span className="font-bold text-violet-300 capitalize">{CATEGORIES.find(c => c.id === activeCategory)?.label || "General"}</span>
                  </div>
                  <Button
                    onClick={() => handleStartInterview(totalQuestions)}
                    className="w-full sm:w-auto px-6 h-10 font-bold text-xs rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/15"
                  >
                    Start Practice Session
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <>
                {/* The Active Question Card */}
                <AnimatePresence mode="wait">
                  {activeQuestion ? (
                    <motion.div
                      key={currentQuestionIndex}
                      initial={{ opacity: 0, y: 15 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -15 }}
                      transition={{ duration: 0.4 }}
                      className="relative p-6 md:p-8 rounded-3xl bg-white/[0.02] border border-white/5 shadow-2xl overflow-hidden"
                    >
                      {/* Decorative glowing gradient border on top */}
                      <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />
                      
                      <div className="flex items-center justify-between mb-4">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider text-violet-400/70 bg-violet-500/5 px-2.5 py-1 rounded-md border border-violet-500/10">
                          Question {currentQuestionIndex} of {totalQuestions}
                        </span>
                      </div>

                      <div className="prose prose-invert max-w-none text-violet-100/90 text-[15px] font-sans md:text-base leading-relaxed tracking-wide font-medium">
                        <ReactMarkdown>{activeQuestion}</ReactMarkdown>
                      </div>
                    </motion.div>
                  ) : sending ? (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="p-8 rounded-3xl bg-white/[0.01] border border-white/5 border-dashed flex flex-col items-center justify-center py-16 gap-4 text-center"
                    >
                      <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-violet-200">Voke is reviewing...</h4>
                        <p className="text-xs text-violet-200/40">Evaluating answer depth and aligning skill metrics.</p>
                      </div>
                    </motion.div>
                  ) : (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="p-8 rounded-3xl bg-red-500/5 border border-red-500/10 flex flex-col items-center justify-center text-center space-y-4"
                    >
                      <AlertTriangle className="w-10 h-10 text-red-400 animate-pulse" />
                      <div className="space-y-1">
                        <h4 className="text-sm font-bold text-red-200">Connection Failed</h4>
                        <p className="text-xs text-red-200/50">Voke encountered a temporary network or rate-limiting issue. Please retry to load your next question.</p>
                      </div>
                      <Button
                        onClick={() => generateAIQuestion(messages, questionCount, totalQuestions)}
                        className="h-9 px-5 font-bold text-xs rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/10 transition-all flex items-center gap-1.5 mx-auto"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        Retry Generating Question
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Answer Workspace Editor */}
                {isFinished ? (
                  <Button
                    onClick={completeSession}
                    className="w-full h-12 bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white font-bold text-sm shadow-lg shadow-violet-500/10 rounded-2xl transition-all duration-300 hover:scale-[1.01]"
                    disabled={isCompleting}
                  >
                    {isCompleting ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin text-white" />
                        Generating Scorecard...
                      </>
                    ) : (
                      <>
                        Complete Interview & View Results
                        <Award className="w-4 h-4 ml-2" />
                      </>
                    )}
                  </Button>
                ) : (
                  activeQuestion && (
                    <div className={`p-4 rounded-3xl bg-[#0e1017]/40 border ${
                      isEditorFocused 
                        ? 'border-violet-500/30 shadow-[0_0_25px_rgba(139,92,246,0.05)]' 
                        : 'border-white/5'
                    } transition-all duration-300 space-y-4`}>
                    <div className="flex justify-between items-center text-[10px] text-violet-300/40 font-bold uppercase tracking-wider px-1">
                      <span>Your Response Area</span>
                      <span className="flex items-center gap-1">
                        <Activity className="w-3 h-3 text-violet-400" />
                        Press Enter to submit
                      </span>
                    </div>

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
                      placeholder={voiceMode ? "Listening... Speak your answer now." : "Draft your detailed answer here... Connect your experience and use structural models like STAR where possible."}
                      className="min-h-[140px] max-h-[220px] py-2 px-1 border-0 focus-visible:ring-0 bg-transparent resize-none text-[14px] leading-relaxed text-violet-100/90 focus:outline-none placeholder-violet-200/20"
                      disabled={sending || !sessionActive || isCompleting}
                    />

                    <div className="flex items-center justify-between border-t border-white/5 pt-3.5 mt-2">
                      <div className="flex items-center gap-2">
                        <Button
                          size="icon"
                          variant="ghost"
                          className={`rounded-xl h-9 w-9 shrink-0 transition-all ${
                            voiceMode 
                              ? 'text-red-400 bg-red-500/10 border border-red-500/20' 
                              : 'text-violet-300/40 bg-white/5 hover:bg-white/10 hover:text-white border border-white/5'
                          }`}
                          onClick={toggleVoiceMode}
                        >
                          {voiceMode ? <Mic className="w-4.5 h-4.5 animate-pulse" /> : <Mic className="w-4.5 h-4.5" />}
                        </Button>
                        <div className="flex items-center gap-2 text-[11px] text-violet-200/40 font-medium">
                          <span className="bg-white/5 px-2.5 py-0.5 rounded-md">
                            Words: {input.trim() ? input.trim().split(/\s+/).length : 0}
                          </span>
                          <span className="bg-white/5 px-2.5 py-0.5 rounded-md">
                            Chars: {input.length}
                          </span>
                        </div>
                      </div>

                      <Button
                        onClick={() => handleSendMessage(input)}
                        disabled={!input.trim() || sending || !sessionActive || isCompleting}
                        className={`h-9 px-5 font-bold text-xs rounded-xl transition-all duration-300 ${
                          input.trim() && !sending && sessionActive && !isCompleting
                            ? 'bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/10 hover:scale-[1.02]'
                            : 'bg-white/5 text-violet-200/20 cursor-not-allowed border border-white/5'
                        }`}
                      >
                        {sending ? (
                          <>
                            <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-violet-300" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            Submit Answer
                            <Send className="w-3.5 h-3.5 ml-2" />
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                )
                )}
              </>
            )}

          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR (Conversation Transcript Timeline) */}
      <aside className={`
        w-full lg:w-96 border-l border-white/5 bg-[#0e1017]/30 backdrop-blur-xl shrink-0 h-full relative z-20 flex-col
        ${activeTab === 'timeline' ? 'flex' : 'hidden lg:flex'}
      `}>
        {/* Title Header */}
        <div className="p-6 border-b border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-violet-400" />
            <h2 className="font-bold text-sm tracking-tight text-white">Interview Timeline</h2>
          </div>
          <span className="text-[10px] font-bold text-violet-400 bg-violet-500/5 px-2 py-0.5 rounded-md border border-violet-500/10">
            {completedTurns.length} Completed
          </span>
        </div>

        {/* Scrollable Timeline Stream */}
        <ScrollArea className="flex-1 p-6">
          {completedTurns.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-3">
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center border border-white/5">
                <Activity className="w-4 h-4 text-violet-200/30" />
              </div>
              <p className="text-xs text-violet-200/30 max-w-[180px]">
                Previous responses and AI evaluations will construct here as the session flows.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6">
              {/* Vertical Dotted Timeline Track Line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-dashed border-l border-dashed border-white/10" />

              {completedTurns.map((turn, index) => {
                const isExpanded = !!expandedFeedback[index];
                
                return (
                  <div key={index} className="relative space-y-3">
                    {/* Node Dot Indicator */}
                    <div className="absolute -left-[24px] top-1.5 w-4 h-4 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-400/20">
                      <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                    </div>

                    {/* Question summary badge */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-violet-400/60 uppercase tracking-wider">
                      <span>Question {index + 1}</span>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/[0.01] hover:bg-white/[0.02] border border-white/5 space-y-3 transition-colors duration-300">
                      {/* Display Question Summary */}
                      <p className="text-xs text-violet-100/70 leading-relaxed italic line-clamp-2">
                        "{turn.question}"
                      </p>

                      {/* Display Answer Details */}
                      {turn.answer && (
                        <div className="p-3 rounded-xl bg-white/[0.02] border border-white/5 mt-2">
                          <p className="text-[11px] text-violet-200/40 font-bold uppercase tracking-wider mb-1">Your Response</p>
                          <p className="text-xs text-violet-200/80 leading-relaxed font-mono whitespace-pre-line">
                            {turn.answer}
                          </p>
                        </div>
                      )}

                      {/* Collapse AI Evaluation Accordion */}
                      {turn.feedback && (
                        <div className="mt-2.5 pt-2.5 border-t border-white/5">
                          <button
                            onClick={() => toggleFeedback(index)}
                            className="w-full flex items-center justify-between text-[11px] text-violet-300 font-bold hover:text-violet-100 transition-colors"
                          >
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-violet-400" />
                              AI Feedback Summary
                            </span>
                            {isExpanded ? (
                              <ChevronUp className="w-3.5 h-3.5" />
                            ) : (
                              <ChevronDown className="w-3.5 h-3.5" />
                            )}
                          </button>

                          <AnimatePresence>
                            {isExpanded && (
                              <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: "auto", opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ duration: 0.3 }}
                                className="overflow-hidden"
                              >
                                <div className="mt-3 p-3.5 rounded-xl bg-violet-600/[0.03] border border-violet-500/10 text-[11px] text-violet-200/70 leading-relaxed prose prose-sm prose-invert max-w-none">
                                  <ReactMarkdown>{turn.feedback}</ReactMarkdown>
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
      </aside>
    </div>
  );
};

export default InterviewNew;
