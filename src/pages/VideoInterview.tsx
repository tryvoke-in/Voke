import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LogOut, Video, StopCircle, Camera, Clock, Loader2, Play, Mic, Monitor, BrainCircuit, Sparkles, ChevronRight, Activity, Zap } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { QuickFeedback } from "@/components/QuickFeedback";
import Groq from 'groq-sdk';
import { motion, AnimatePresence } from "motion/react";
import {
  TIME_LIMITS,
  calculateQuestionCount,
  getQuestionsForSession,
  formatTimeRemaining,
  InterviewState,
} from "@/utils/interviewHelpers";
import { loadUserProfileContext, ProfileContext } from "@/utils/profileContext";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { InterviewGate } from "@/components/InterviewGate";

const getGroqClient = () => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    console.warn("VITE_GROQ_API_KEY is missing.");
    return null;
  }
  return new Groq({ apiKey, dangerouslyAllowBrowser: true });
};

const groq = getGroqClient();

const ROLE_SPECIFIC_QUESTIONS = {
  "General": [
    "Tell me about yourself.",
    "Why do you want to work for our company?",
    "What are your greatest strengths and weaknesses?",
    "Where do you see yourself in five years?",
    "Tell me about a time you worked in a team.",
    "How do you handle stress and pressure?",
    "Describe a time you failed and what you learned.",
    "What motivates you in your work?",
  ],
  "Software Engineer": [
    "Tell me about yourself and your technical background.",
    "Describe a challenging technical problem you solved recently.",
    "How do you approach debugging a complex issue?",
    "Explain a technical concept to a non-technical person.",
    "Tell me about your experience with system design.",
    "How do you stay updated with new technologies?",
    "Describe a time when you had to optimize code for performance.",
    "What's your approach to code reviews?",
  ],
  "Product Manager": [
    "Tell me about yourself and your product management experience.",
    "How do you prioritize features in a product roadmap?",
    "Describe a time you had to make a difficult product decision.",
    "How do you gather and incorporate user feedback?",
    "Tell me about a product you launched from start to finish.",
    "How do you work with engineering and design teams?",
    "Describe your approach to defining product metrics.",
    "How do you handle conflicting stakeholder requirements?",
  ],
  "Data Scientist": [
    "Tell me about yourself and your data science background.",
    "Describe a machine learning project you're proud of.",
    "How do you approach feature engineering?",
    "Explain how you would validate a model's performance.",
    "Tell me about a time you derived insights from complex data.",
    "How do you communicate technical findings to non-technical stakeholders?",
    "Describe your experience with A/B testing.",
    "What's your approach to handling imbalanced datasets?",
  ],
  "Marketing Manager": [
    "Tell me about yourself and your marketing experience.",
    "Describe a successful marketing campaign you led.",
    "How do you measure marketing ROI?",
    "Tell me about a time you had to pivot a marketing strategy.",
    "How do you approach customer segmentation?",
    "Describe your experience with digital marketing channels.",
    "How do you stay current with marketing trends?",
    "Tell me about a time you worked with a limited budget.",
  ],
};

const TimedVideoInterview = () => {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Interview setup state
  const [selectedRole, setSelectedRole] = useState<string>("General");
  const [timeLimit, setTimeLimit] = useState<number>(10);
  const [interviewState, setInterviewState] = useState<InterviewState>(InterviewState.SETUP);

  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);

  const { credits, hasGivenFeedback, isPremium, canTakeInterview, loading: creditsLoading, consumeCredit, refreshCredits, grantFeedbackCredits } = useInterviewCredits('video');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(0);

  // Recording state
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);

  // Analysis state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [currentFeedback, setCurrentFeedback] = useState<any>(null);
  const [currentAnswerId, setCurrentAnswerId] = useState<string | null>(null);

  // Context state
  const [codingStats, setCodingStats] = useState<any>(null);
  const [profileContext, setProfileContext] = useState<ProfileContext | null>(null);

  // Loading state
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate system initialization
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    checkAuth();
    loadCodingStats();
    loadContext();
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

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

  const loadContext = async () => {
    try {
      const context = await loadUserProfileContext();
      setProfileContext(context);
    } catch (error) {
      console.error("Error loading profile context:", error);
    }
  };

  useEffect(() => {
    if (stream && videoRef.current && !videoRef.current.srcObject) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const startInterview = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Start with ONLY the introduction question
      setQuestions(["Tell me about yourself."]);


      // Create interview session
      // TODO: Switch back to video_interview_sessions after migration deploys
      const { data: session, error } = await supabase
        .from("interview_sessions")
        .insert({
          user_id: user.id,
          role: selectedRole,
          time_limit_minutes: timeLimit,
          status: "in_progress",
          interview_type: "timed_video",
        })
        .select()
        .single();

      if (error) throw error;

      setSessionId(session.id);
      setTimeRemaining(timeLimit * 60);
      setCurrentQuestionIndex(0);
      setInterviewState(InterviewState.QUESTION);

      // Start overall timer
      timerIntervalRef.current = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            endInterview();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Enable camera
      await startCamera();
    } catch (error) {
      console.error("Error starting interview:", error);
      toast.error("Failed to start interview");
    }
  };

  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true,
      });
      setStream(mediaStream);
      setIsPreviewing(true);
    } catch (error) {
      console.error("Error accessing camera:", error);
      toast.error("Failed to access camera and microphone");
    }
  };

  const startRecording = () => {
    if (!stream) return;

    chunksRef.current = [];
    const mediaRecorder = new MediaRecorder(stream, {
      mimeType: 'video/webm;codecs=vp8,opus'
    });

    mediaRecorder.ondataavailable = (event) => {
      if (event.data.size > 0) {
        chunksRef.current.push(event.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: 'video/webm' });
      setRecordedBlob(blob);
      handleUpload(blob);
    };

    mediaRecorder.start(1000);
    mediaRecorderRef.current = mediaRecorder;
    setIsRecording(true);
    setRecordingTime(0);

    const recordingInterval = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);

    mediaRecorderRef.current.addEventListener('stop', () => {
      clearInterval(recordingInterval);
    });
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      // State will be updated in handleUpload called by onstop
    }
  };

  const handleUpload = async (blob: Blob) => {
    if (!sessionId) return;

    setInterviewState(InterviewState.ANALYZING);
    setIsAnalyzing(true);

    // Safety timeout: if upload takes too long, move on anyway
    const safetyTimeout = setTimeout(() => {
      if (isAnalyzing) {
        console.warn("Upload timed out, forcing next question");
        toast.error("Upload taking too long, moving to next question");
        handleNextQuestion();
        setIsAnalyzing(false);
      }
    }, 15000); // 15 seconds timeout

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Transcribe audio
      let transcribedText = "";
      try {
        if (groq) {
          const audioFile = new File([blob], 'answer.webm', { type: 'audio/webm' });
          const transcription = await groq.audio.transcriptions.create({
            file: audioFile,
            model: 'whisper-large-v3',
            language: 'en',
            response_format: 'json',
          });
          transcribedText = transcription.text;
        }
      } catch (error) {
        console.error("Transcription error:", error);
      }

      // Upload video
      // Storage policy requires path to start with user_id
      const fileName = `${user.id}/${sessionId}/${currentQuestionIndex}_${Date.now()}.webm`;
      const { error: uploadError } = await supabase.storage
        .from("video-interviews")
        .upload(fileName, blob, {
          contentType: 'video/webm',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("video-interviews")
        .getPublicUrl(fileName);

      // Create answer record
      const { data: answer, error: answerError } = await supabase
        .from("interview_answers")
        .insert({
          session_id: sessionId,
          question_number: currentQuestionIndex + 1,
          question: questions[currentQuestionIndex],
          video_url: publicUrl,
          transcript: transcribedText,
          duration_seconds: recordingTime,
        })
        .select()
        .single();

      if (answerError) throw answerError;

      setCurrentAnswerId(answer.id);

      // Move to next question immediately - don't wait for analysis
      clearTimeout(safetyTimeout);
      toast.success("Answer saved! Moving to next question...");
      handleNextQuestion();
      setIsAnalyzing(false);

      // Run analysis in background
      supabase.functions.invoke(
        "quick-analyze-answer",
        {
          body: {
            answerId: answer.id,
            question: questions[currentQuestionIndex],
            transcript: transcribedText,
            role: selectedRole,
            coding_stats: codingStats,
            profile_context: profileContext?.context
          }
        }
      ).then(({ error }) => {
        if (error) console.error("Background analysis error:", error);
      }).catch(err => {
        console.error("Background analysis failed:", err);
      });

    } catch (error: any) {
      console.error("Error uploading:", error);
      clearTimeout(safetyTimeout);
      toast.error(`Failed to save answer: ${error.message || error.error_description || "Unknown error"}`);
      setInterviewState(InterviewState.QUESTION);
      setIsAnalyzing(false);
    }
  };

  const generateNewQuestion = async () => {
    if (!groq) {
      // Fallback: use generic questions
      const genericQuestions = ROLE_SPECIFIC_QUESTIONS[selectedRole as keyof typeof ROLE_SPECIFIC_QUESTIONS] || ROLE_SPECIFIC_QUESTIONS.General;
      const unusedQuestions = genericQuestions.filter(q => !questions.includes(q));
      if (unusedQuestions.length > 0) {
        const randomQuestion = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
        setQuestions(prev => [...prev, randomQuestion]);
        setCurrentQuestionIndex(questions.length);
      }
      return;
    }

    try {
      setIsAnalyzing(true);

      // Randomly decide if this should be a resume/GitHub-based question (40%) or creative (60%)
      const isPersonalized = Math.random() < 0.4;

      let prompt = '';

      if (isPersonalized && (profileContext?.context || codingStats)) {
        // Generate a personalized question based on resume/GitHub
        prompt = `You are an expert interviewer for a ${selectedRole} position.

CANDIDATE'S PROFILE:
${profileContext?.context || 'No resume/GitHub data available'}

${codingStats ? `CODING STATS:
- LeetCode: ${codingStats.leetcode?.submitStats?.find((s: any) => s.difficulty === "All")?.count || 0} problems solved
- Codeforces Rating: ${codingStats.codeforces?.rating || 'N/A'}` : ''}

ALREADY ASKED QUESTIONS:
${questions.join('\n')}

Generate ONE new interview question that:
- Is based on their resume, GitHub projects, or coding profile
- Asks about specific projects, technologies, or experiences mentioned in their profile
- Tests their actual knowledge and experience
- Is different from all previously asked questions
- Is professional and relevant to ${selectedRole} role

Respond with ONLY the question text, nothing else.`;
      } else {
        // Generate a creative generic question
        prompt = `You are an expert interviewer for a ${selectedRole} position.

ALREADY ASKED QUESTIONS:
${questions.join('\n')}

Generate ONE new, creative interview question that:
- Is a standard professional interview question for ${selectedRole}
- Tests important skills, problem-solving, or behavioral competencies
- Is engaging and thought-provoking
- Is different from all previously asked questions
- Is NOT based on resume or GitHub (keep it generic)

Respond with ONLY the question text, nothing else.`;
      }

      const completion = await groq.chat.completions.create({
        messages: [{ role: 'user', content: prompt }],
        model: 'llama-3.3-70b-versatile',
        temperature: 0.9,
        max_tokens: 150,
      });

      const newQuestion = completion.choices[0]?.message?.content?.trim();

      if (newQuestion) {
        // Add the new question to the list
        setQuestions(prev => [...prev, newQuestion]);
        setCurrentQuestionIndex(questions.length);
      } else {
        // Fallback to generic questions
        const genericQuestions = ROLE_SPECIFIC_QUESTIONS[selectedRole as keyof typeof ROLE_SPECIFIC_QUESTIONS] || ROLE_SPECIFIC_QUESTIONS.General;
        const unusedQuestions = genericQuestions.filter(q => !questions.includes(q));
        if (unusedQuestions.length > 0) {
          const randomQuestion = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
          setQuestions(prev => [...prev, randomQuestion]);
          setCurrentQuestionIndex(questions.length);
        }
      }
    } catch (error) {
      console.error('Error generating new question:', error);
      // Fallback to generic questions
      const genericQuestions = ROLE_SPECIFIC_QUESTIONS[selectedRole as keyof typeof ROLE_SPECIFIC_QUESTIONS] || ROLE_SPECIFIC_QUESTIONS.General;
      const unusedQuestions = genericQuestions.filter(q => !questions.includes(q));
      if (unusedQuestions.length > 0) {
        const randomQuestion = unusedQuestions[Math.floor(Math.random() * unusedQuestions.length)];
        setQuestions(prev => [...prev, randomQuestion]);
        setCurrentQuestionIndex(questions.length);
      }
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleNextQuestion = () => {
    // Check if time has run out
    if (timeRemaining <= 0) {
      endInterview();
      return;
    }

    // Continue to next question
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentFeedback(null);
      setInterviewState(InterviewState.QUESTION);
    } else {
      // Generate a new creative question instead of repeating
      generateNewQuestion();
      setCurrentFeedback(null);
      setInterviewState(InterviewState.QUESTION);
    }
  };

  const endInterview = async () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
    }

    if (stream) {
      stream.getTracks().forEach(track => track.stop());
    }

    setInterviewState(InterviewState.COMPLETED);

    // Generate overall feedback
    if (sessionId) {
      try {
        await supabase.functions.invoke("generate-overall-feedback", {
          body: { sessionId }
        });

        // Consume credit
        await consumeCredit();

        // Navigate to results
        navigate(`/timed-interview/results/${sessionId}`);
      } catch (error) {
        console.error("Error generating overall feedback:", error);
        toast.error("Failed to generate overall feedback");
      }
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 pointer-events-none">
           <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
           <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-fuchsia-900/10 rounded-full blur-[120px]" />
        </div>

        <div className="relative z-10 flex flex-col items-center">
          <div className="w-24 h-24 mb-8 relative">
            <motion.div 
               animate={{ rotate: 360 }}
               transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
               className="absolute inset-0 rounded-full border-t-2 border-l-2 border-violet-500/50"
            />
            <motion.div 
               animate={{ rotate: -360 }}
               transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
               className="absolute inset-2 rounded-full border-b-2 border-r-2 border-cyan-500/50"
            />
             <div className="absolute inset-0 flex items-center justify-center">
                <BrainCircuit className="w-8 h-8 text-white animate-pulse" />
             </div>
          </div>
          
          <h2 className="text-2xl font-bold bg-gradient-to-r from-white via-zinc-200 to-zinc-500 bg-clip-text text-transparent mb-2">
            VOKE INTELLIGENCE
          </h2>
          
          <div className="flex flex-col items-center gap-1">
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.5 }}
                className="text-sm font-mono text-cyan-500"
             >
                INITIALIZING_SECURE_ENVIRONMENT...
             </motion.div>
             <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.8, duration: 0.5 }}
                className="text-xs font-mono text-zinc-600"
             >
                CALIBRATING_SENSORS... [OK]
             </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white selection:bg-violet-500/30">
      {/* Background Effects */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-900/20 rounded-full blur-[120px]" />
        <div className="absolute top-[30%] left-[30%] w-[30%] h-[30%] bg-cyan-900/10 rounded-full blur-[100px]" />
      </div>

      {interviewState === InterviewState.SETUP ? (
        <>
          <motion.header 
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/50 backdrop-blur-xl"
          >
            <div className="container mx-auto px-4 h-20 flex items-center justify-between">
              <div 
                className="flex items-center gap-3 cursor-pointer group" 
                onClick={() => navigate("/dashboard")}
              >
                <div className="p-2 rounded-xl bg-white/5 border border-white/10 group-hover:bg-white/10 transition-colors">
                  <Play className="w-5 h-5 text-violet-400 fill-violet-400" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
                  Video Interview
                </h1>
              </div>
              <nav className="flex items-center gap-4">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleLogout}
                    className="text-zinc-400 hover:text-white hover:bg-white/5"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  Exit
                </Button>
              </nav>
            </div>
          </motion.header>

          <main className="relative z-10 container mx-auto px-4 pt-32 pb-20 max-w-5xl">
            {creditsLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
              </div>
            ) : !canTakeInterview ? (
              <InterviewGate
                credits={credits}
                hasGivenFeedback={hasGivenFeedback}
                isPremium={isPremium}
                onFeedbackSuccess={refreshCredits}
                grantFeedbackCredits={grantFeedbackCredits}
              />
            ) : (
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 }}
                >
                    <h1 className="text-5xl md:text-6xl font-bold mb-6 leading-tight">
                        Master Your <br />
                        <span className="bg-gradient-to-r from-violet-400 via-purple-400 to-fuchsia-400 bg-clip-text text-transparent">
                            Interview Skills
                        </span>
                    </h1>
                    <p className="text-lg text-zinc-400 mb-8 leading-relaxed max-w-lg">
                        Practice with our AI-powered simulator. Get real-time feedback on your answers, body language, and speaking confidence.
                    </p>

                    <div className="space-y-4 mb-8">
                        {[
                            { icon: BrainCircuit, title: "Smart Questions", desc: "Adaptive to your role & resume" },
                            { icon: Activity, title: "Real-time Feedback", desc: "Instant analysis of your performance" },
                            { icon: Monitor, title: "Realistic Environment", desc: "Simulates actual interview pressure" }
                        ].map((item, i) => (
                            <motion.div 
                                key={i}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.3 + (i * 0.1) }}
                                className="flex items-center gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="p-3 rounded-xl bg-violet-500/20 text-violet-300">
                                    <item.icon className="w-5 h-5" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">{item.title}</h3>
                                    <p className="text-sm text-zinc-500">{item.desc}</p>
                                </div>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <Card className="bg-zinc-900/50 backdrop-blur-xl border-white/10 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-violet-500 via-fuchsia-500 to-cyan-500" />
                        
                        <CardContent className="p-8 space-y-8">
                        <div>
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 block">
                                Target Role
                            </label>
                            <Select value={selectedRole} onValueChange={setSelectedRole}>
                                <SelectTrigger className="w-full bg-black/40 border-white/10 focus:ring-violet-500/50 h-12 text-lg">
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                    {Object.keys(ROLE_SPECIFIC_QUESTIONS).map((role) => (
                                        <SelectItem key={role} value={role} className="focus:bg-violet-600/20 focus:text-violet-300">
                                            {role}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-400 uppercase tracking-widest mb-3 block">
                                Duration
                            </label>
                            <div className="grid grid-cols-3 gap-3">
                                {TIME_LIMITS.map(limit => (
                                    <button
                                        key={limit.value}
                                        onClick={() => setTimeLimit(limit.value)}
                                        className={`p-3 rounded-xl border text-sm font-medium transition-all duration-300 ${
                                            timeLimit === limit.value 
                                            ? 'bg-violet-600 border-violet-500 text-white shadow-[0_0_20px_rgba(124,58,237,0.3)]' 
                                            : 'bg-black/40 border-white/10 text-zinc-400 hover:bg-white/5 hover:border-white/20'
                                        }`}
                                    >
                                        {limit.label}
                                    </button>
                                ))}
                            </div>
                        </div>

                        <div className="pt-4">
                            <Button
                                onClick={startInterview}
                                size="lg"
                                className="w-full h-14 bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 text-white text-lg font-medium shadow-xl shadow-violet-500/20 rounded-xl transition-all hover:scale-[1.02] active:scale-[0.98]"
                            >
                                <Sparkles className="w-5 h-5 mr-2" />
                                Begin Session
                            </Button>
                            <p className="text-center text-xs text-zinc-500 mt-4">
                                Camera and microphone access required
                            </p>
                        </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
            )}
          </main>
        </>
      ) : (
        <div className="relative z-10 min-h-screen flex flex-col">
            <header className="fixed top-0 left-0 right-0 z-50 bg-black/60 backdrop-blur-xl border-b border-white/5">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center">
                         <Video className="w-4 h-4 text-white" />
                    </div>
                    <div>
                        <h1 className="text-sm font-bold text-white">Live Interview</h1>
                        <div className="flex items-center gap-2 text-xs text-violet-400">
                             <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                             {interviewState === InterviewState.COMPLETED ? "Completed" : "In Progress"}
                        </div>
                    </div>
                </div>
                
                <div className="flex items-center gap-4">
                     <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
                        <Clock className="w-3.5 h-3.5 text-zinc-400" />
                        <span className="font-mono font-medium text-sm text-white">{formatTimeRemaining(timeRemaining)}</span>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={endInterview}
                        className="bg-red-500/20 hover:bg-red-500/30 text-red-500 border border-red-500/20"
                    >
                        <StopCircle className="w-4 h-4 mr-2" />
                        End Session
                    </Button>
                </div>
                </div>
            </header>

            <main className="flex-1 container mx-auto px-4 pt-24 pb-12 max-w-6xl">
                <div className="grid lg:grid-cols-2 gap-8 h-[calc(100vh-140px)]">
                {/* Left: Video */}
                <div className="space-y-6 flex flex-col">
                    <Card className="flex-1 bg-zinc-900/50 backdrop-blur-xl border-white/10 overflow-hidden relative group">
                        <div className="absolute inset-0 bg-black">
                            {!isPreviewing ? (
                                <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500">
                                    <div className="relative">
                                        <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full" />
                                        <Camera className="w-12 h-12 mb-4 relative z-10" />
                                    </div>
                                    <h3 className="text-sm font-medium">Initializing Camera...</h3>
                                </div>
                            ) : (
                                <video
                                    ref={videoRef}
                                    autoPlay
                                    playsInline
                                    muted={isRecording || isPreviewing}
                                    controls={!!recordedBlob && !isRecording}
                                    className="w-full h-full object-cover transform scale-x-[-1]"
                                />
                            )}
                        </div>

                        {/* Recording Indicator */}
                        {isRecording && (
                            <div className="absolute top-4 right-4 flex items-center gap-2 bg-red-500/90 backdrop-blur-md text-white px-3 py-1.5 rounded-full text-xs font-mono font-medium shadow-lg animate-pulse">
                                <div className="w-2 h-2 bg-white rounded-full"></div>
                                {formatTime(recordingTime)}
                            </div>
                        )}
                        
                        {/* Stream Controls Overlay */}
                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                             <div className="flex items-center justify-between">
                                 <div className="flex gap-2">
                                     <div className="p-2 rounded-full bg-white/10 backdrop-blur-md">
                                         <Mic className="w-4 h-4 text-white" />
                                     </div>
                                     <div className="p-2 rounded-full bg-white/10 backdrop-blur-md">
                                         <Video className="w-4 h-4 text-white" />
                                     </div>
                                 </div>
                             </div>
                        </div>
                    </Card>

                    <div className="h-20">
                        {interviewState === InterviewState.QUESTION && !isRecording && (
                            <Button
                                onClick={startRecording}
                                size="lg"
                                className="w-full h-14 bg-red-600 hover:bg-red-700 text-white rounded-xl shadow-lg shadow-red-600/20 transition-all hover:scale-[1.02]"
                            >
                                <div className="w-3 h-3 rounded-full bg-white mr-2.5 animate-pulse"></div>
                                Start Recording Answer
                            </Button>
                        )}

                        {isRecording && (
                            <Button
                                onClick={stopRecording}
                                size="lg"
                                className="w-full h-14 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-white/10"
                            >
                                <div className="w-3 h-3 rounded-sm bg-red-500 mr-2.5"></div>
                                Stop Recording
                            </Button>
                        )}
                    </div>
                </div>

                {/* Right: Content */}
                <div className="space-y-6 flex flex-col">
                    <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
                        <AnimatePresence mode="wait">
                            {interviewState === InterviewState.QUESTION && (
                                <motion.div
                                    key="question"
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -10 }}
                                >
                                    <div className="mb-4 flex items-center gap-2 text-sm text-zinc-500 uppercase tracking-widest font-semibold">
                                         <span className="w-8 h-[1px] bg-violet-500" />
                                         Question {currentQuestionIndex + 1}
                                    </div>
                                    <h2 className="text-3xl font-medium leading-tight text-white mb-8">
                                        {questions[currentQuestionIndex]}
                                    </h2>
                                    
                                    <div className="p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-sm flex gap-3">
                                         <Zap className="w-5 h-5 flex-shrink-0 text-blue-400" />
                                         <p>Take a moment to structure your answer. Focus on the STAR method (Situation, Task, Action, Result) for behavioral questions.</p>
                                    </div>
                                </motion.div>
                            )}

                            {interviewState === InterviewState.ANALYZING && (
                                <motion.div
                                    key="analyzing"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center p-8 text-center"
                                >
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-violet-500/20 blur-xl rounded-full" />
                                        <Loader2 className="w-16 h-16 animate-spin text-violet-500 relative z-10" />
                                    </div>
                                    <h3 className="text-2xl font-bold text-white mb-2">Analyzing Response</h3>
                                    <p className="text-zinc-400">Our AI is evaluating your delivery and content...</p>
                                </motion.div>
                            )}
                            
                            {interviewState === InterviewState.FEEDBACK && currentFeedback && (
                                <motion.div
                                    key="feedback"
                                    initial={{ opacity: 0, x: 20 }}
                                    animate={{ opacity: 1, x: 0 }}
                                >
                                    <QuickFeedback
                                        modelAnswer={currentFeedback.model_answer}
                                        whatsGood={currentFeedback.whats_good}
                                        whatsWrong={currentFeedback.whats_wrong}
                                        deliveryScore={currentFeedback.delivery_score}
                                        bodyLanguageScore={currentFeedback.body_language_score}
                                        confidenceScore={currentFeedback.confidence_score}
                                        onNext={handleNextQuestion}
                                        isLastQuestion={currentQuestionIndex === questions.length - 1}
                                    />
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
                </div>
            </main>
        </div>
      )}
    </div>
  );
};

export default TimedVideoInterview;
