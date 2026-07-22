import React, { useEffect, useRef, useState } from 'react';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { AudioVisualizerSimple } from '@/components/AudioVisualizerSimple';
import { LiveStatus, MessageLog } from '@/types/voice';
import { Mic, X, MessageSquare, Sparkles, AlertCircle, ArrowLeft, Code, Play, Send, Maximize2, Minimize2, FileText, LogOut, Video, VideoOff, Camera, User, Briefcase, Building, Layers, Award, Target, Settings, ChevronRight, Check } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import Editor from "@monaco-editor/react";
import { executeCode } from "@/utils/codeExecutor";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable";
import ReactMarkdown from 'react-markdown';
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { InterviewGate } from "@/components/InterviewGate";

const VoiceAssistant: React.FC = () => {
  const navigate = useNavigate();
  const {
    status,
    connect,
    disconnect,
    isUserSpeaking,
    isAiSpeaking,
    volume,
    logs,
    errorDetails,
    sendHiddenContext
  } = useGroqVoice();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { credits, hasGivenFeedback, isPremium, canTakeInterview, loading: creditsLoading, consumeCredit, refreshCredits, grantFeedbackCredits } = useInterviewCredits('voice');
  const [userContext, setUserContext] = useState<string>('');
  const [loadingContext, setLoadingContext] = useState(true);
  const [interviewMode, setInterviewMode] = useState<'voice' | 'coding'>('voice');

  // Pre-Interview Setup / Configuration State (Defaults to true for direct interview screen)
  const [isConfigured, setIsConfigured] = useState<boolean>(true);
  const [targetRole, setTargetRole] = useState<string>("Software Engineer");
  const [customRole, setCustomRole] = useState<string>("");
  const [selectedDomain, setSelectedDomain] = useState<string>("Full Stack & Web");
  const [interviewType, setInterviewType] = useState<string>("Full Mock Interview");
  const [targetCompany, setTargetCompany] = useState<string>("Top Tech Company");
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

  // Coding State
  const [code, setCode] = useState<string>("# Write your solution here\ndef solve():\n    pass");
  const [codeOutput, setCodeOutput] = useState<string>("");
  const [isRunning, setIsRunning] = useState(false);
  const [problemStatement, setProblemStatement] = useState<string>("Waiting for problem statement...");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
  }, [hasCameraPermission, interviewMode, status, isConfigured]);

  // Handle recording trigger on status change
  useEffect(() => {
    if (status === LiveStatus.CONNECTED) {
      startVideoRecording();
    } else if (status === LiveStatus.DISCONNECTED) {
      stopVideoRecording();
    }
  }, [status]);

  // Monitor logs for transition tokens and feedback
  useEffect(() => {
    if (logs.length > 0) {
      const lastMsg = logs[logs.length - 1];
      if (lastMsg.role === 'assistant') {

        // Handle START_CODING
        if (lastMsg.text.includes('[START_CODING]')) {
          if (interviewMode !== 'coding') {
            console.log("Transitioning to CODING mode");
            setInterviewMode('coding');

            const text = lastMsg.text.replace('[START_CODING]', '').trim();
            // Clean up other tokens just in case
            const cleanText = text.replace(/\[.*?\]/g, '').trim();
            setProblemStatement(cleanText || "Listen to the interviewer for the problem statement.");
            toast.info("Coding Phase Started!");
          }
        }

        // Handle END_CODING
        if (lastMsg.text.includes('[END_CODING]')) {
          if (interviewMode !== 'voice') {
            console.log("Transitioning back to VOICE mode");
            setInterviewMode('voice');
            toast.success("Coding phase completed. Switching back to voice.");
          }
        }

        // Handle DETAILED_FEEDBACK
        if (lastMsg.text.includes('[DETAILED_FEEDBACK]')) {
          const parts = lastMsg.text.split('[DETAILED_FEEDBACK]');
          if (parts.length > 1) {
            const feedbackContent = parts[1].trim();
            setFeedback(feedbackContent);
            toast("New feedback available!", {
              action: {
                label: "View",
                onClick: () => console.log("Feedback clicked")
              }
            });
          }
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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const loadUserContext = async () => {
    try {
      console.log('[VoiceAssistant] Starting loadUserContext...');
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        console.error('[VoiceAssistant] No user found, redirecting to auth');
        navigate('/auth');
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profile) {
        setCandidateProfileName(profile.full_name || 'Candidate');

        if (profile.github_url) {
          try {
            const githubToken = import.meta.env.VITE_GITHUB_TOKEN;
            const usernameMatch = profile.github_url.match(/github\.com\/([^\/]+)/);
            if (usernameMatch) {
              const username = usernameMatch[1];
              const headers: Record<string, string> = {
                'Accept': 'application/vnd.github.v3+json',
                'User-Agent': 'Voke-Interview-App'
              };

              let reposResponse = await fetch(
                `https://api.github.com/users/${username}/repos?sort=updated&per_page=3`,
                { headers }
              );

              if ((reposResponse.status === 401 || reposResponse.status === 403) && githubToken) {
                const authHeaders = { ...headers, 'Authorization': `token ${githubToken}` };
                reposResponse = await fetch(
                  `https://api.github.com/users/${username}/repos?sort=updated&per_page=3`,
                  { headers: authHeaders }
                );
              }

              if (reposResponse.ok) {
                const repos = await reposResponse.json();
                const projectSummaries = await Promise.all(
                  repos.map(async (repo: any) => {
                    return `Project: ${repo.name}\n- Description: ${repo.description || 'No description'}\n- Tech: ${repo.language || 'Not specified'}`;
                  })
                );
                setGithubProjectsText(`GITHUB PROJECTS:\n${projectSummaries.join('\n\n')}`);
              }
            }
          } catch (e) {
            console.error('GitHub fetch failed', e);
          }
        }
      }
    } catch (error) {
      console.error('[VoiceAssistant] Error loading context:', error);
      toast.error('Failed to load profile context');
    } finally {
      setLoadingContext(false);
    }
  };

  const handleStartConfiguredInterview = async () => {
    const activeRole = customRole.trim() || targetRole;
    const activeCompany = customCompany.trim() || targetCompany;

    let context = `Candidate Name: ${candidateProfileName}\n`;
    context += `TARGET JOB ROLE: ${activeRole}\n`;
    context += `DOMAIN/SPECIALIZATION: ${selectedDomain}\n`;
    context += `INTERVIEW FOCUS: ${interviewType}\n`;
    context += `TARGET COMPANY: ${activeCompany}\n`;
    context += `EXPERIENCE LEVEL: ${experienceLevel}\n`;

    if (githubProjectsText) {
      context += `\n${githubProjectsText}\n`;
    }

    context += `\nINSTRUCTION: You are an expert lead interviewer at ${activeCompany}. You are conducting a realistic ${interviewType} for a candidate applying as a ${experienceLevel} ${activeRole} specializing in ${selectedDomain}. Conduct a professional, realistic interview: start with warm introductions and 2-3 tailored behavioral/screening questions for this exact role and level. When you feel ready to test their coding skills, say "[START_CODING]" and present a coding challenge suitable for a ${activeRole}.`;

    setUserContext(context);
    setIsConfigured(true);

    if (!hasCameraPermission) {
      await startCamera();
    }
    connect(context);
  };

  const handleEndInterview = async () => {
    if (logs.length === 0) {
      toast.error("No conversation to analyze yet.");
      return;
    }

    disconnect();
    const videoBlob = stopVideoRecording();
    const toastId = toast.loading("Saving session...");
    setIsSaving(true);

    const activeRole = customRole.trim() || targetRole;
    const activeCompany = customCompany.trim() || targetCompany;

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

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

      toast.loading("Analyzing session performance...", { id: toastId });

      // Trigger analysis
      try {
        const userLogs = logs.filter(log => log.role === 'user');
        const userSpeechLength = userLogs.reduce((sum, log) => sum + (log.text || '').trim().length, 0);

        let evaluation;

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
            .eq('id', data.id);
        }
      } catch (evalError) {
        console.error("Evaluation trigger failed:", evalError);
      }

      toast.dismiss(toastId);
      toast.success("Pro Interview session saved successfully!");

      navigate(`/voice-interview/results/${data.id}`);
      await consumeCredit();

    } catch (error: any) {
      console.error("Error saving session:", error);
      toast.dismiss(toastId);
      toast.error(`Failed to save session: ${error.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRunCode = async () => {
    setIsRunning(true);
    setCodeOutput("Running...");
    try {
      await executeCode(code, 'python',
        (log) => setCodeOutput(prev => prev === "Running..." ? log : prev + log),
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
      const prompt = `USER SUBMITTED CODE:\n\`\`\`python\n${code}\n\`\`\`\n\nOUTPUT:\n${codeOutput}\n\nINSTRUCTION: Review this code. Do NOT simply accept it or say it's correct. Ask a SOCRATIC QUESTION about their implementation choices, efficiency, or potential bugs. engage in a discussion.`;
      await sendHiddenContext(prompt);
      toast.success("Code submitted for discussion!");
    } catch (e) {
      toast.error("Failed to submit code");
    } finally {
      setIsSubmitting(false);
    }
  };

  const isConnected = status === LiveStatus.CONNECTED;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">

      {/* Header / Nav */}
      <div className="absolute top-4 left-4 z-50 flex items-center gap-2">
        <Button variant="ghost" className="text-white hover:text-white/80 hover:bg-white/10" onClick={() => navigate('/dashboard')}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
      </div>

      {/* Background Decoration */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl mix-blend-screen animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="z-10 flex-1 flex flex-col">

        {creditsLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : !canTakeInterview && !isSaving ? (
          <div className="flex-1 flex items-center justify-center p-4 md:p-8">
            <InterviewGate
              credits={credits}
              hasGivenFeedback={hasGivenFeedback}
              isPremium={isPremium}
              onFeedbackSuccess={refreshCredits}
              grantFeedbackCredits={grantFeedbackCredits}
            />
          </div>
        ) : !isConfigured ? (
          // === PRE-INTERVIEW SETUP CONFIGURATION SCREEN ===
          <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-4xl mx-auto w-full my-10">
            <div className="w-full bg-card/60 backdrop-blur-xl border border-border/80 rounded-3xl p-6 md:p-10 shadow-2xl space-y-8 animate-in fade-in zoom-in-95">

              {/* Header */}
              <div className="text-center space-y-3">

                <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
                  Pro Interview
                </h1>
                <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
                  Click below to start your AI-powered Pro Interview session.
                </p>
              </div>

              {/* Action Submit Button */}
              <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-border/50">
                <div className="text-xs text-muted-foreground flex items-center gap-2">
                  <Video className="w-4 h-4 text-green-400" />
                  Webcam video and audio recording enabled.
                </div>
                <Button
                  onClick={handleStartConfiguredInterview}
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white font-bold text-sm px-8 py-3 rounded-2xl shadow-xl shadow-purple-500/25 transition-all hover:scale-105"
                >
                  <Play className="w-4 h-4 mr-2 fill-white" />
                  Start Pro Interview
                </Button>
              </div>

            </div>
          </div>
        ) : (
          <>
            {interviewMode === 'voice' ? (
              // === VOICE & VIDEO MODE LAYOUT ===
              <div className="flex-1 flex flex-col items-center justify-center p-4 md:p-8 max-w-6xl mx-auto w-full">
                <div className="w-full flex flex-col gap-6">
                  {/* Header Info */}
                  <div className="text-center space-y-2">
                    <div className="flex items-center justify-center gap-3">
                      {status === LiveStatus.CONNECTED && (
                        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-card border border-border text-xs font-medium text-muted-foreground font-mono shadow-sm">
                          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                          <span>REC {formatTime(duration)}</span>
                        </div>
                      )}
                    </div>
                    <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-400 via-purple-300 to-fuchsia-400 bg-clip-text text-transparent">
                      Pro Interview
                    </h1>
                    <p className="text-muted-foreground text-sm max-w-md mx-auto">
                      {customRole.trim() || targetRole} • {selectedDomain}
                    </p>
                  </div>

                  {/* 1-on-1 Video Call Container Grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-5xl mx-auto">

                    {/* Card 1: AI Interviewer */}
                    <div className="relative bg-card/60 border border-border/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col items-center justify-center min-h-[340px] p-6 border-violet-500/20 group hover:border-violet-500/40 transition-all duration-300">
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-white">
                        <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                        <span>AI Interviewer</span>
                      </div>

                      {status === LiveStatus.CONNECTING && (
                        <div className="absolute inset-0 flex items-center justify-center z-30 bg-background/80 backdrop-blur-sm">
                          <div className="flex flex-col items-center gap-3">
                            <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
                            <span className="text-sm font-medium text-muted-foreground">Connecting AI agent...</span>
                          </div>
                        </div>
                      )}

                      <AudioVisualizerSimple
                        isUserSpeaking={isUserSpeaking}
                        isAiSpeaking={isAiSpeaking}
                        volume={volume}
                      />

                      <div className="mt-4 text-xs text-muted-foreground font-medium flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-green-400 animate-ping' : 'bg-muted'}`} />
                        {isAiSpeaking ? "Interviewer Speaking..." : isUserSpeaking ? "Listening to you..." : "Ready"}
                      </div>
                    </div>

                    {/* Card 2: Candidate Video Feed (Webcam) */}
                    <div className="relative bg-card/60 border border-border/80 rounded-3xl overflow-hidden backdrop-blur-md shadow-2xl flex flex-col items-center justify-center min-h-[340px] border-fuchsia-500/20 group hover:border-fuchsia-500/40 transition-all duration-300">
                      <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-xs font-medium text-white">
                        <User className="w-3.5 h-3.5 text-fuchsia-400" />
                        <span>Candidate (You)</span>
                      </div>

                      {isConnected && (
                        <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-red-500/80 backdrop-blur-md px-2.5 py-1 rounded-full text-[10px] font-bold text-white uppercase tracking-wider animate-pulse">
                          REC
                        </div>
                      )}

                      {hasCameraPermission && isCameraOn ? (
                        <video
                          ref={videoRef}
                          autoPlay
                          playsInline
                          muted
                          className="w-full h-full object-cover min-h-[340px] rounded-3xl transform -scale-x-100"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-3 p-8 text-center min-h-[340px]">
                          <div className="w-16 h-16 rounded-full bg-muted/60 border border-border flex items-center justify-center text-muted-foreground">
                            <VideoOff className="w-8 h-8" />
                          </div>
                          <p className="text-sm font-medium text-muted-foreground">
                            Camera disabled or permission needed
                          </p>
                          <Button size="sm" variant="outline" onClick={startCamera} className="text-xs rounded-xl gap-2">
                            <Camera className="w-3.5 h-3.5" /> Enable Camera
                          </Button>
                        </div>
                      )}

                      {/* Video Controls Overlay */}
                      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-black/60 backdrop-blur-md p-1.5 rounded-full border border-white/10">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={toggleCamera}
                          className="h-8 w-8 rounded-full text-white hover:bg-white/20"
                          title={isCameraOn ? "Turn Camera Off" : "Turn Camera On"}
                        >
                          {isCameraOn ? <Video className="w-4 h-4 text-green-400" /> : <VideoOff className="w-4 h-4 text-red-400" />}
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-6 my-2">
                    {!isConnected ? (
                      <button
                        onClick={handleStartConfiguredInterview}
                        disabled={status === LiveStatus.CONNECTING || loadingContext}
                        className="group relative flex items-center justify-center w-20 h-20 bg-primary hover:bg-primary/90 rounded-full shadow-lg hover:shadow-primary/25 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <div className="absolute inset-0 rounded-full border-2 border-white/20 group-hover:scale-110 transition-transform duration-300"></div>
                        <Mic className="w-8 h-8 text-primary-foreground" />
                      </button>
                    ) : (
                      <div className="flex gap-4">
                        <button onClick={disconnect} className="group relative flex items-center justify-center w-16 h-16 bg-muted hover:bg-muted/80 rounded-full shadow-lg transition-all duration-300">
                          <X className="w-6 h-6 text-foreground" />
                        </button>
                        <button onClick={handleEndInterview} className="group relative flex items-center justify-center w-20 h-20 bg-destructive hover:bg-destructive/90 rounded-full shadow-lg hover:shadow-destructive/25 transition-all duration-300">
                          <MessageSquare className="w-8 h-8 text-destructive-foreground" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Transcript Display */}
                  <div className="w-full max-w-5xl mx-auto max-h-48 overflow-y-auto p-4 rounded-2xl bg-background/50 backdrop-blur border border-white/10 shadow-inner">
                    <div className="space-y-3">
                      {logs.map((log) => (
                        <div
                          key={log.id}
                          className={`flex ${log.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                          <div className={`
                                                max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm
                                                ${log.role === 'user'
                              ? 'bg-primary text-primary-foreground rounded-br-sm'
                              : 'bg-muted text-muted-foreground rounded-bl-sm'
                            }
                                            `}>
                            {log.text.replace('[START_CODING]', '').replace('[END_CODING]', '').split('[DETAILED_FEEDBACK]')[0]}
                          </div>
                        </div>
                      ))}
                      <div ref={messagesEndRef} />
                    </div>
                  </div>

                  {/* Feedback Display (Voice Mode) */}
                  {feedback && (
                    <div className="mt-4 w-full max-w-5xl mx-auto bg-card/80 border border-green-500/30 rounded-xl p-4 animate-in slide-in-from-bottom-5">
                      <h3 className="text-green-400 font-semibold mb-2 flex items-center gap-2">
                        <FileText className="w-4 h-4" /> Feedback from Last Challenge
                      </h3>
                      <ScrollArea className="h-32 rounded bg-black/20 p-2">
                        <div className="prose prose-invert prose-sm">
                          <ReactMarkdown>{feedback}</ReactMarkdown>
                        </div>
                      </ScrollArea>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // === CODING MODE LAYOUT ===
              <div className="flex-1 flex flex-col h-screen pt-16 px-4 pb-4 gap-4">
                <ResizablePanelGroup direction="horizontal" className="flex-1 rounded-xl border border-border bg-card/50 backdrop-blur-sm overflow-hidden">
                  {/* Left Panel: Problem & Candidate Video Preview & Chat */}
                  <ResizablePanel defaultSize={30} minSize={20} className="flex flex-col border-r border-border bg-[#1e1e1e]">
                    <div className="p-4 border-b border-border bg-[#252526] flex items-center justify-between">
                      <h2 className="font-semibold text-white flex items-center gap-2 text-sm">
                        <Code className="w-4 h-4 text-blue-400" />
                        Coding Challenge
                      </h2>
                    </div>

                    {/* Compact Candidate Video preview box in side panel */}
                    <div className="relative w-full h-36 bg-black border-b border-border overflow-hidden">
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
                      <div className="absolute top-2 left-2 bg-black/60 text-[10px] px-2 py-0.5 rounded text-white font-mono">
                        Candidate Cam
                      </div>
                    </div>

                    <div className="flex-1 overflow-auto p-4 text-sm text-gray-300 font-sans leading-relaxed">
                      <div className="space-y-4">
                        {!feedback ? (
                          <>
                            <div className="font-medium text-indigo-300">Problem Statement:</div>
                            <p className="whitespace-pre-wrap">{problemStatement}</p>
                          </>
                        ) : (
                          <div className="bg-green-900/10 border border-green-500/20 p-3 rounded">
                            <div className="font-medium text-green-400 mb-2">Previous Feedback:</div>
                            <div className="prose prose-invert prose-xs">
                              <ReactMarkdown>{feedback}</ReactMarkdown>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="mt-8 border-t border-white/10 pt-4">
                        <div className="font-medium text-indigo-300 mb-2">Transcript:</div>
                        <div className="flex flex-col gap-2 opacity-70">
                          {logs.slice(-5).map((msg) => (
                            <div key={msg.id} className={`text-xs p-2 rounded ${msg.role === 'user' ? 'bg-indigo-500/20 self-end' : 'bg-gray-700/50 self-start'}`}>
                              <span className="font-bold opacity-50 block mb-0.5">{msg.role === 'user' ? 'You' : 'Interviewer'}:</span>
                              {msg.text
                                .replace('[START_CODING]', '')
                                .replace('[END_CODING]', '')
                                .split('[DETAILED_FEEDBACK]')[0]
                              }
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ResizablePanel>

                  <ResizableHandle />

                  {/* Right Panel: Code Editor */}
                  <ResizablePanel defaultSize={70} className="flex flex-col bg-[#1e1e1e]">
                    <div className="h-10 bg-[#252526] flex items-center justify-between px-4 border-b border-border">
                      <span className="text-xs text-gray-400">main.py</span>
                      <div className="flex items-center gap-2">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 border-green-500/30 text-green-400 hover:text-green-300 hover:bg-green-500/10" onClick={handleRunCode} disabled={isRunning}>
                          <Play className="w-3 h-3" /> Run
                        </Button>
                        <Button size="sm" className="h-7 text-xs gap-1 bg-indigo-600 hover:bg-indigo-700 text-white border-none" onClick={handleSubmitCode} disabled={isSubmitting}>
                          <Send className="w-3 h-3" /> Submit & Discuss
                        </Button>
                      </div>
                    </div>
                    <div className="flex-1 relative">
                      <Editor
                        height="100%"
                        defaultLanguage="python"
                        theme="vs-dark"
                        value={code}
                        onChange={(val) => setCode(val || "")}
                        options={{
                          minimap: { enabled: false },
                          fontSize: 14,
                          padding: { top: 16 }
                        }}
                      />
                    </div>
                    {/* Terminal / Output */}
                    <div className="h-32 bg-[#0f0f0f] border-t border-[#333] flex flex-col">
                      <div className="px-4 py-1.5 text-xs text-gray-500 font-mono border-b border-[#333]">Output</div>
                      <ScrollArea className="flex-1 p-3 font-mono text-sm text-gray-300">
                        <pre>{codeOutput || "Run code to see output..."}</pre>
                      </ScrollArea>
                    </div>
                  </ResizablePanel>
                </ResizablePanelGroup>

                {/* Sticky Voice Control Bar (Mini) */}
                <div className="h-16 bg-card border border-border rounded-xl flex items-center px-4 justify-between shadow-lg">
                  <div className="flex items-center gap-4">
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                    <div className="text-sm font-medium">Live Interview & Cam</div>
                    <div className="text-xs text-muted-foreground font-mono">{formatTime(duration)}</div>
                  </div>

                  <div className="flex-1 max-w-xs mx-4 h-8 bg-black/20 rounded-lg overflow-hidden relative">
                    {/* Mini Visualizer */}
                    <div className="absolute inset-0 flex items-center justify-center gap-0.5">
                      {[...Array(10)].map((_, i) => (
                        <div
                          key={i}
                          className="w-1 bg-indigo-500/80 rounded"
                          style={{
                            height: Math.max(4, Math.random() * (volume * 100)) + 'px',
                            opacity: 0.5 + (volume * 0.5)
                          }}
                        />
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={handleEndInterview}
                      className="gap-2 px-4 shadow-md hover:shadow-red-500/20 transition-all hover:scale-105 font-semibold tracking-wide"
                    >
                      <LogOut className="w-4 h-4" />
                      End Interview
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default VoiceAssistant;
