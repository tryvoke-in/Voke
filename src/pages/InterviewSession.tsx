import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  LogOut,
  Send,
  Clock,
  User,
  Bot,
  StopCircle,
  Award,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  Sparkles,
  History,
  ArrowLeft,
  MessageSquare,
  Activity,
  Loader2,
  Check
} from "lucide-react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import { motion, AnimatePresence } from "motion/react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { loadUserProfileContext } from "@/utils/profileContext";

// Basic message shape for the text interview
interface Message {
  role: "assistant" | "user";
  content: string;
}

interface InterviewTurn {
  question: string;
  answer?: string;
  feedback?: string;
}

// Fallback first question if the AI backend is unavailable
const INITIAL_QUESTION: Message = {
  role: "assistant",
  content:
    "Welcome! Let's begin with a classic interview question: Tell me about yourself.",
};

// Separator parser for AI response
const parseAIResponse = (content: string) => {
  const markers = [
    "### ❓ Next Question",
    "### Next Question",
    "## ❓ Next Question",
    "## Next Question",
    "❓ Next Question:",
    "Next Question:",
    "### ❓ Next question",
    "### Next question"
  ];
  
  for (const marker of markers) {
    const index = content.indexOf(marker);
    if (index !== -1) {
      const feedback = content.slice(0, index).trim();
      const nextQuestion = content.slice(index + marker.length).trim();
      return { feedback, nextQuestion };
    }
  }
  
  return { feedback: "", nextQuestion: content };
};

const getInterviewTurns = (msgs: Message[]) => {
  const turns: InterviewTurn[] = [];
  
  for (let i = 0; i < msgs.length; i++) {
    const msg = msgs[i];
    
    if (msg.role === "assistant") {
      if (i === 0) {
        turns.push({ question: msg.content });
      } else {
        const parsed = parseAIResponse(msg.content);
        if (turns.length > 0) {
          turns[turns.length - 1].feedback = parsed.feedback;
        }
        turns.push({ question: parsed.nextQuestion });
      }
    } else if (msg.role === "user") {
      if (turns.length > 0) {
        turns[turns.length - 1].answer = msg.content;
      }
    }
  }
  
  return turns;
};

export default function InterviewSession() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userContext, setUserContext] = useState("");
  const [pastSessions, setPastSessions] = useState<any[]>([]);
  
  // Navigation tab for mobile viewports
  const [activeTab, setActiveTab] = useState<'arena' | 'history' | 'timeline'>('arena');
  const [isEditorFocused, setIsEditorFocused] = useState(false);
  const [expandedFeedback, setExpandedFeedback] = useState<Record<number, boolean>>({});

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [config, setConfig] = useState(location.state?.config || {
    topic: "General",
    difficulty: "Intermediate",
    mode: "text",
  });

  const turns = getInterviewTurns(messages);
  const currentQuestionIndex = turns.length;
  const totalQuestions = 5;
  const progressPercent = Math.min(100, Math.round((currentQuestionIndex / totalQuestions) * 100));

  // Extract active question and feedback
  const activeTurn = turns[turns.length - 1];
  const activeQuestion = activeTurn && !activeTurn.answer ? activeTurn.question : "";

  useEffect(() => {
    const init = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          navigate("/auth");
          return;
        }

        setUserId(user.id);
        setLoading(false);
        setSending(true);

        // Load profile context and fetch past sessions in parallel
        let currentContext = "";
        try {
          const profileContext = await loadUserProfileContext();
          currentContext = profileContext.context;
          setUserContext(currentContext);
        } catch (error) {
          console.error('[InterviewSession] Error loading profile context:', error);
        }

        try {
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

        // Ask the AI to start the interview and pose the first question
        const { data, error } = await supabase.functions.invoke("adaptive-interview-chat", {
          body: {
            userId: user.id,
            userContext: currentContext,
            messages: [
              {
                role: "user",
                content: "Start the interview and ask me the first question.",
              },
            ],
          },
        });

        if (error) {
          console.error("Error starting adaptive interview:", error);
          toast.error("AI interviewer is unavailable, starting with a default question.");
          setMessages([INITIAL_QUESTION]);
        } else if (data?.content) {
          setMessages([{ role: "assistant", content: data.content }]);
        } else {
          setMessages([INITIAL_QUESTION]);
        }
      } finally {
        setSending(false);
      }
    };

    init();

    const timer = setInterval(() => setElapsedTime((p) => p + 1), 1000);
    return () => clearInterval(timer);
  }, [navigate]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const toggleFeedback = (index: number) => {
    setExpandedFeedback(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Fallback formatter used if the AI backend is unavailable
  const buildFallbackFeedback = (question: string | null, answer: string): string => {
    const safeQuestion = question || "the interview question";

    return `### ✅ What You Did Well
- You provided a thoughtful answer in your own words.
- You attempted to connect your experience to the question.

### ⚠️ Areas to Improve
- Be more specific and concrete; include technologies, numbers, or clear outcomes.
- Use a clear structure like STAR (Situation, Task, Action, Result).
- Explicitly call out what *you* did versus what the team did.

### 📝 Model Answer
Here is an example of a strong answer to "${safeQuestion}":

I recently worked on a challenging project where [...brief context]. The main challenge was [...key problem]. My responsibility was to [...your role]. To solve this, I first [...step 1], then [...step 2], and finally [...step 3]. As a result, we achieved [...measurable result such as performance improvement, revenue impact, or user metric].

Notice how this answer clearly explains the context, your specific actions, and a concrete result.

### 🎯 Skill Gap Analysis
- Storytelling and structuring answers
- Highlighting measurable impact
- Communicating your individual contribution

### ❓ Next Question
Tell me about a time you had to learn something quickly in order to deliver on a tight deadline. What did you do and what was the outcome?`;
  };

  const handleSendMessage = async (content: string) => {
    if (!content.trim() || sending || !userId) return;

    const userMsg: Message = { role: "user", content };
    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput("");
    setSending(true);

    const lastAssistant = [...updatedMessages].reverse().find(m => m.role === "assistant") || null;
    const lastQuestion = lastAssistant?.content ?? null;

    try {
      const { data, error } = await supabase.functions.invoke("adaptive-interview-chat", {
        body: {
          userId,
          userContext,
          messages: updatedMessages,
        },
      });

      if (error) {
        console.error("Error contacting AI interviewer:", error);
        toast.error("AI feedback is temporarily unavailable. Showing a generic review instead.");
        const fallbackContent = buildFallbackFeedback(lastQuestion, content);
        const aiMsg: Message = { role: "assistant", content: fallbackContent };
        setMessages(prev => [...prev, aiMsg]);
        return;
      }

      if (data?.content) {
        const aiMsg: Message = { role: "assistant", content: data.content };
        setMessages(prev => [...prev, aiMsg]);
      } else {
        const fallbackContent = buildFallbackFeedback(lastQuestion, content);
        const aiMsg: Message = { role: "assistant", content: fallbackContent };
        setMessages(prev => [...prev, aiMsg]);
      }
    } finally {
      setSending(false);
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center relative overflow-hidden">
        <div className="flex flex-col items-center gap-4 relative z-10">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500"></div>
            <Bot className="w-8 h-8 text-blue-500 absolute inset-0 m-auto animate-pulse" />
          </div>
          <p className="text-muted-foreground font-medium tracking-wide animate-pulse">Initializing AI Interview Studio...</p>
        </div>
      </div>
    );
  }

  // UI calculations
  const completedTurns = turns.filter(t => t.answer);

  return (
    <div className="w-screen h-screen flex bg-background text-foreground overflow-hidden relative font-sans">
      {/* 1. LEFT SIDEBAR (Past Sessions & Active Controls) */}
      <aside className={`
        w-full md:w-80 border-r border-border/50 bg-card/60 backdrop-blur-xl shrink-0 h-full relative z-20 flex-col
        ${activeTab === 'history' ? 'flex' : 'hidden md:flex'}
      `}>
        {/* Brand Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-8 h-8 object-contain"
            />
            <div>
              <h1 className="font-bold text-lg tracking-tight text-foreground">Voke AI</h1>
              <p className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Interview Suite</p>
            </div>
          </div>
          <Button
            onClick={() => navigate("/dashboard")}
            variant="ghost"
            size="icon"
            className="h-8 w-8 text-muted-foreground hover:text-foreground hover:bg-secondary/40 rounded-lg shrink-0"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* Active Session Status */}
        <div className="p-6 border-b border-border/50 space-y-5">
          <div className="space-y-3">
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Active Session</h2>
            <div className="p-4 rounded-2xl bg-secondary/15 border border-border/50 space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium">Focus Topic</span>
                <Badge className="bg-blue-500/10 text-blue-400 border border-blue-500/20 text-[10px] py-0.5 px-2 hover:bg-blue-500/10">
                  {config.topic}
                </Badge>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-xs text-muted-foreground font-medium font-sans">Timer</span>
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  <span className="font-mono text-sm font-bold text-emerald-400">{formatTime(elapsedTime)}</span>
                </div>
              </div>

              <div className="space-y-2 pt-2 border-t border-border/40">
                <div className="flex justify-between text-[11px] font-semibold text-muted-foreground">
                  <span>Questions Progress</span>
                  <span>{progressPercent}% ({currentQuestionIndex}/{totalQuestions})</span>
                </div>
                <Progress value={progressPercent} className="h-1.5 bg-secondary [&>div]:bg-blue-600" />
              </div>
            </div>
          </div>
        </div>

        {/* Past Sessions List */}
        <div className="flex-1 overflow-hidden flex flex-col p-6 min-h-0">
          <div className="flex items-center gap-2 mb-4">
            <History className="w-3.5 h-3.5 text-blue-400" />
            <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Past Sessions</h2>
          </div>
          
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="space-y-2.5 pb-4">
              {pastSessions.length === 0 ? (
                <div className="text-center py-8 text-xs text-muted-foreground">
                  No past sessions found.
                </div>
              ) : (
                pastSessions.map((session) => (
                  <div
                    key={session.id}
                    onClick={() => navigate(`/interview/results/${session.id}`)}
                    className="p-3.5 rounded-xl bg-secondary/15 hover:bg-secondary/35 border border-border/50 hover:border-blue-500/30 transition-all duration-200 cursor-pointer group flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-bold text-foreground group-hover:text-blue-400 transition-colors capitalize truncate max-w-[140px]">
                        {session.interview_type || "General"}
                      </h4>
                      <p className="text-[10px] text-muted-foreground font-medium">
                        {formatDate(session.created_at)}
                      </p>
                    </div>
                    <div>
                      {session.overall_score !== null ? (
                        <div className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {session.overall_score}%
                        </div>
                      ) : (
                        <div className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-secondary text-muted-foreground">
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
          <Button 
            onClick={() => setShowResults(true)} 
            variant="destructive" 
            className="w-full text-xs justify-start h-10 px-4 bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/20 rounded-xl"
          >
            <StopCircle className="w-4 h-4 mr-2" />
            Finish & Evaluate
          </Button>
        </div>
      </aside>

      {/* 2. CENTER PANEL (Active Interview Arena) */}
      <main className={`
        flex-1 h-full flex flex-col relative min-w-0
        ${activeTab === 'arena' ? 'flex' : 'hidden md:flex'}
      `}>
        {/* Mobile Header / Navigation Tabs */}
        <header className="md:hidden border-b border-border/50 bg-card/60 backdrop-blur-xl p-4 flex items-center justify-between z-30 shrink-0">
          <div className="flex items-center gap-3">
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-7 h-7 object-contain"
            />
            <span className="font-bold text-sm tracking-tight text-foreground md:hidden">Voke AI Arena</span>
            <div className="hidden md:flex items-center gap-2">
              <span className="text-xs text-blue-400 font-semibold uppercase tracking-wider">Practice Arena</span>
              <span className="h-1 w-1 bg-border rounded-full" />
              <span className="text-xs text-muted-foreground">Text Simulation</span>
            </div>
          </div>

          {/* Mobile Tab Toggles */}
          <div className="flex md:hidden items-center gap-1.5 p-1 rounded-xl bg-secondary/30 border border-border/40">
            <Button
              size="sm"
              variant={activeTab === 'history' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('history')}
              className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${activeTab === 'history' ? 'bg-blue-600 text-white hover:bg-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              History
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'arena' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('arena')}
              className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${activeTab === 'arena' ? 'bg-blue-600 text-white hover:bg-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Arena
            </Button>
            <Button
              size="sm"
              variant={activeTab === 'timeline' ? 'secondary' : 'ghost'}
              onClick={() => setActiveTab('timeline')}
              className={`h-7 px-2.5 text-[11px] rounded-lg transition-all ${activeTab === 'timeline' ? 'bg-blue-600 text-white hover:bg-blue-600' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Timeline
            </Button>
          </div>
          
          <div className="md:hidden flex items-center">
            <Button size="icon" variant="ghost" className="text-muted-foreground hover:text-foreground h-8 w-8" onClick={() => setShowResults(true)}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </header>

        {/* Center Workspace Scroll */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 flex items-center justify-center">
          <div className="max-w-2xl w-full space-y-6 py-6">
            
            {/* The Active Question Card */}
            <AnimatePresence mode="wait">
              {activeQuestion ? (
                <motion.div
                  key={currentQuestionIndex}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.3 }}
                  className="relative p-6 md:p-8 rounded-2xl bg-card/60 border border-border/60 shadow-xl backdrop-blur-xl"
                >
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-[10px] font-extrabold uppercase tracking-wider text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-md border border-blue-500/20">
                      Question {currentQuestionIndex} of {totalQuestions}
                    </span>
                  </div>

                  <div className="prose prose-invert max-w-none text-foreground text-[15px] font-sans md:text-base leading-relaxed tracking-wide font-medium">
                    <ReactMarkdown>{activeQuestion}</ReactMarkdown>
                  </div>
                </motion.div>
              ) : (
                sending && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="p-8 rounded-2xl bg-card/40 border border-border/50 border-dashed flex flex-col items-center justify-center py-16 gap-4 text-center"
                  >
                    <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-bold text-foreground">Voke is reviewing...</h4>
                      <p className="text-xs text-muted-foreground">Evaluating answer depth and aligning skill metrics.</p>
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>

            {/* Answer Workspace Editor */}
            <div className={`p-4 rounded-2xl bg-card/60 border ${
              isEditorFocused 
                ? 'border-blue-500/40 shadow-sm' 
                : 'border-border/60'
            } transition-all duration-200 space-y-4`}>
              <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold uppercase tracking-wider px-1">
                <span>Your Response Area</span>
                <span className="flex items-center gap-1">
                  <Activity className="w-3 h-3 text-blue-400" />
                  Press Enter to submit
                </span>
              </div>

              <Textarea
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
                placeholder="Draft your detailed answer here... Connect your experience and use structural models like STAR where possible."
                className="min-h-[140px] max-h-[220px] py-2 px-1 border-0 focus-visible:ring-0 bg-transparent resize-none text-[14px] leading-relaxed text-foreground focus:outline-none placeholder:text-muted-foreground/40"
                disabled={sending}
              />

              <div className="flex items-center justify-between border-t border-border/50 pt-3.5 mt-2">
                <div className="flex items-center gap-3 text-[11px] text-muted-foreground font-medium">
                  <span className="bg-secondary/30 px-2.5 py-0.5 rounded-md border border-border/30">
                    Words: {input.trim() ? input.trim().split(/\s+/).length : 0}
                  </span>
                  <span className="bg-secondary/30 px-2.5 py-0.5 rounded-md border border-border/30">
                    Chars: {input.length}
                  </span>
                </div>

                <Button
                  onClick={() => handleSendMessage(input)}
                  disabled={!input.trim() || sending}
                  className={`h-9 px-5 font-semibold text-xs rounded-xl transition-all duration-200 ${
                    input.trim() && !sending
                      ? 'bg-blue-600 hover:bg-blue-500 text-white shadow-sm'
                      : 'bg-secondary/30 text-muted-foreground/40 cursor-not-allowed border border-border/30'
                  }`}
                >
                  {sending ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-2 animate-spin text-white" />
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

          </div>
        </div>
      </main>

      {/* 3. RIGHT SIDEBAR (Conversation Transcript Timeline) */}
      <aside className={`
        w-full lg:w-96 border-l border-border/50 bg-card/40 backdrop-blur-xl shrink-0 h-full relative z-20 flex-col
        ${activeTab === 'timeline' ? 'flex' : 'hidden lg:flex'}
      `}>
        {/* Title Header */}
        <div className="p-6 border-b border-border/50 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-blue-400" />
            <h2 className="font-bold text-sm tracking-tight text-foreground">Interview Timeline</h2>
          </div>
          <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-500/20">
            {completedTurns.length} Completed
          </span>
        </div>

        {/* Scrollable Timeline Stream */}
        <ScrollArea className="flex-1 p-6">
          {completedTurns.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-center py-20 gap-3">
              <div className="w-10 h-10 rounded-full bg-secondary/30 flex items-center justify-center border border-border/40">
                <Activity className="w-4 h-4 text-blue-400/60" />
              </div>
              <p className="text-xs text-muted-foreground max-w-[180px]">
                Previous responses and AI evaluations will construct here as the session flows.
              </p>
            </div>
          ) : (
            <div className="relative pl-6 space-y-6">
              {/* Vertical Dotted Timeline Track Line */}
              <div className="absolute left-[7px] top-2 bottom-2 w-[1px] bg-dashed border-l border-dashed border-border/60" />

              {completedTurns.map((turn, index) => {
                const isExpanded = !!expandedFeedback[index];
                
                return (
                  <div key={index} className="relative space-y-3">
                    {/* Node Dot Indicator */}
                    <div className="absolute -left-[24px] top-1.5 w-4 h-4 rounded-full bg-emerald-500/10 border-2 border-emerald-400 flex items-center justify-center shadow-sm">
                      <Check className="w-2.5 h-2.5 text-emerald-400 stroke-[3]" />
                    </div>

                    {/* Question summary badge */}
                    <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                      <span>Question {index + 1}</span>
                    </div>

                    <div className="p-4 rounded-xl bg-secondary/15 hover:bg-secondary/30 border border-border/50 space-y-3 transition-colors duration-200">
                      {/* Display Question Summary */}
                      <p className="text-xs text-foreground/80 leading-relaxed italic line-clamp-2">
                        "{turn.question}"
                      </p>

                      {/* Display Answer Details */}
                      {turn.answer && (
                        <div className="p-3 rounded-xl bg-card/60 border border-border/40 mt-2">
                          <p className="text-[11px] text-muted-foreground font-bold uppercase tracking-wider mb-1">Your Response</p>
                          <p className="text-xs text-foreground/80 leading-relaxed font-mono whitespace-pre-line">
                            {turn.answer}
                          </p>
                        </div>
                      )}

                      {/* Collapse AI Evaluation Accordion */}
                      {turn.feedback && (
                        <div className="mt-2.5 pt-2.5 border-t border-border/40">
                          <button
                            onClick={() => toggleFeedback(index)}
                            className="w-full flex items-center justify-between text-[11px] text-blue-400 font-bold hover:text-blue-300 transition-colors"
                          >
                            <span className="flex items-center gap-1">
                              <Sparkles className="w-3 h-3 text-blue-400" />
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
                                <div className="mt-3 p-3.5 rounded-xl bg-blue-500/5 border border-blue-500/15 text-[11px] text-foreground/80 leading-relaxed prose prose-sm prose-invert max-w-none">
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

      {/* 4. RESULTS EVALUATION MODAL */}
      <Dialog open={showResults} onOpenChange={setShowResults}>
        <DialogContent className="sm:max-w-lg bg-card border border-border/60 text-foreground rounded-2xl p-6 shadow-2xl relative overflow-hidden">
          <DialogHeader className="pt-2">
            <DialogTitle className="text-xl font-bold flex items-center gap-2.5 text-foreground">
              <Award className="h-5.5 w-5.5 text-amber-400" />
              Complete Evaluation Session
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-xs">
              Finish the current text interview session to record progress and generate scorecards.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 py-4">
            <div className="flex items-center justify-between p-4 bg-secondary/15 border border-border/50 rounded-xl">
              <div className="space-y-0.5">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Estimated Score</span>
                <p className="text-2xl font-extrabold text-blue-400">
                  Evaluating...
                </p>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-wider">Turns Completed</span>
                <p className="text-xl font-bold text-foreground">{completedTurns.length} / 5</p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-secondary/10 border border-border/40 space-y-3">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400" />
                What's Analyzed:
              </h4>
              <ul className="text-xs text-muted-foreground space-y-1.5 pl-5 list-disc font-medium leading-relaxed">
                <li>Completeness of structured STAR responses.</li>
                <li>Clarity of individual context and outcomes.</li>
                <li>Alignment of technical terminology to the topic.</li>
              </ul>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2.5">
            <Button
              variant="outline"
              onClick={() => navigate("/dashboard")}
              className="border-border/50 bg-secondary/20 text-foreground hover:bg-secondary/40 rounded-xl text-xs h-10 flex-1 order-2 sm:order-1"
            >
              Back to Dashboard
            </Button>
            <Button
              onClick={() => {
                toast.success("Interview completed! Generating scorecard...");
                setShowResults(false);
                navigate("/dashboard");
              }}
              className="bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold h-10 flex-1 order-1 sm:order-2 shadow-sm"
            >
              Confirm and Exit
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
