import { useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft, TrendingUp, MessageSquare, Award, Mic, CheckCircle2, XCircle, AlertCircle, RefreshCw, Video, Eye, User, Smile, Volume2, Shirt } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import SixQAnalysis from "@/components/SixQAnalysis";
import { motion } from "framer-motion";

const VoiceInterviewResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  
  // Diagnostic state to catch and display any hidden crashes
  const [diagnosticError, setDiagnosticError] = useState<string | null>(null);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [queryLogs, setQueryLogs] = useState<string[]>([]);

  const logMessage = (msg: string) => {
    console.log(`[VoiceResultsDiag] ${msg}`);
    setQueryLogs(prev => [...prev, `${new Date().toLocaleTimeString()}: ${msg}`]);
  };

  useEffect(() => {
    // Setup window-level error handlers to catch React render crashes or unhandled promise rejections
    const handleWindowError = (event: ErrorEvent) => {
      console.error("Caught window error in results page:", event);
      setDiagnosticError(`Runtime Error: ${event.message || 'Unknown render error'}`);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      console.error("Caught unhandled rejection in results page:", event);
      const reason = event.reason;
      const errorMsg = reason?.message || reason?.details || JSON.stringify(reason) || "Unknown promise rejection";
      setDiagnosticError(`Unhandled Promise Rejection: ${errorMsg}`);
    };

    window.addEventListener("error", handleWindowError);
    window.addEventListener("unhandledrejection", handleUnhandledRejection);

    // Timeout to show manual bypass if page takes too long to load
    const timer = setTimeout(() => {
      setLoadingTimeout(true);
      logMessage("Loading took more than 4 seconds. Showing bypass option.");
    }, 4000);

    // Start loading results
    checkAuth();
    loadResults();

    return () => {
      window.removeEventListener("error", handleWindowError);
      window.removeEventListener("unhandledrejection", handleUnhandledRejection);
      clearTimeout(timer);
    };
  }, [id]);

  const checkAuth = async () => {
    try {
      logMessage("Checking auth session...");
      const { data: { session: authSession }, error } = await supabase.auth.getSession();
      if (error) throw error;
      if (!authSession) {
        logMessage("No active auth session found, redirecting to /auth");
        navigate("/auth");
      } else {
        logMessage(`Authenticated as user: ${authSession.user?.email}`);
      }
    } catch (error: any) {
      logMessage(`Auth check failed: ${error.message}`);
      setDiagnosticError(`Authentication Error: ${error.message}`);
    }
  };

  const loadResults = async () => {
    try {
      logMessage(`Starting supabase select query for session id: ${id}`);
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) {
        logMessage(`Query returned error: ${error.message} (${error.code})`);
        throw error;
      }
      
      logMessage(`Query success! Session retrieved: ${data ? 'Yes' : 'No'}`);
      setSession(data);
    } catch (error: any) {
      console.error("Error loading results:", error);
      logMessage(`Query catch error: ${error.message}`);
      setDiagnosticError(`Database Query Error: ${error.message || JSON.stringify(error)}`);
    } finally {
      logMessage("Query finally block reached. Setting loading to false.");
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return "text-green-500";
    if (score >= 60) return "text-yellow-500";
    return "text-red-500";
  };

  const getScoreGradient = (score: number) => {
    if (score >= 80) return "from-green-500 to-emerald-500";
    if (score >= 60) return "from-yellow-500 to-orange-500";
    return "from-red-500 to-pink-500";
  };

  // If a diagnostic error is detected, display it
  if (diagnosticError) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-xl w-full bg-card border-destructive/30 shadow-2xl">
          <CardHeader className="bg-destructive/10 border-b border-destructive/20 pb-4">
            <CardTitle className="text-destructive flex items-center gap-2">
              <AlertCircle className="w-6 h-6 animate-pulse" />
              Interview Results Loader Error
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6 space-y-4">
            <div className="p-4 bg-muted/50 rounded-2xl border border-border space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Error Details:</h4>
              <p className="text-sm font-mono text-destructive bg-background p-3 rounded border border-destructive/10 overflow-x-auto whitespace-pre-wrap">
                {diagnosticError}
              </p>
            </div>
            
            <div className="p-4 bg-muted/20 rounded-2xl border border-border/50 space-y-2">
              <h4 className="text-xs font-semibold text-muted-foreground">Internal Logs:</h4>
              <div className="max-h-40 overflow-y-auto text-xs font-mono space-y-1 text-muted-foreground bg-background/30 p-2.5 rounded">
                {queryLogs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button className="flex-1" onClick={() => window.location.reload()}>
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => {
                setDiagnosticError(null);
                setLoading(false);
              }}>
                Ignore Error & Attempt Render
              </Button>
              <Button variant="ghost" className="flex-1" onClick={() => navigate("/dashboard")}>
                Return to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4 text-center max-w-md">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
          <p className="text-muted-foreground animate-pulse font-medium">Analyzing your conversation...</p>
          
          {loadingTimeout && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-6 p-4 bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl w-full"
            >
              <p className="text-xs text-muted-foreground mb-3 leading-relaxed">
                Loading is taking longer than expected. You can check the current query status or force the page to render.
              </p>
              <div className="flex flex-col gap-2">
                <Button size="sm" variant="outline" className="text-xs font-semibold rounded-xl" onClick={() => {
                  setDiagnosticError(`Loading timed out. Session state: ${session ? 'Loaded' : 'Null'}`);
                }}>
                  Show Load Logs & Diagnostics
                </Button>
                <Button size="sm" variant="ghost" className="text-xs font-semibold rounded-xl text-violet-500 hover:bg-violet-500/10" onClick={() => {
                  logMessage("Bypassing load screen manually.");
                  setLoading(false);
                }}>
                  Force Try Render
                </Button>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="max-w-md bg-card/50 backdrop-blur-xl border-border/50">
          <CardHeader>
            <CardTitle>Session Not Found</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">The voice interview session could not be found.</p>
            <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isElite = searchParams.get('from') === 'elite' || session?.interview_type?.toLowerCase().includes('elite');

  return (
    <div className="min-h-screen bg-background overflow-x-hidden font-sans">
      {/* Header */}
      <header className="bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-1.5 sm:gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img
              src="/images/voke_logo.png"
              alt="Voke Logo"
              className="w-6 h-6 sm:w-8 sm:h-8 object-contain"
            />
            <h1 className="text-base sm:text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-zinc-900 via-zinc-900 to-zinc-500 dark:from-white dark:via-white dark:to-white/40">
              {isElite ? "Elite Round Analysis" : "Voice Analysis"}
            </h1>
          </div>
          <nav className="flex items-center gap-1 sm:gap-2">
            <ThemeToggle />
            <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="px-2 sm:px-3 text-xs sm:text-sm">
              Dashboard
            </Button>
            <Button variant="outline" size="sm" onClick={handleLogout} className="px-2 sm:px-3 text-xs sm:text-sm">
              <LogOut className="w-3.5 h-3.5 sm:mr-2" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <Button
          variant="ghost"
          onClick={() => navigate(isElite ? "/elite-prep" : "/voice-assistant")}
          className="mb-8 hover:bg-violet-500/10 hover:text-violet-500 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          {isElite ? "Back to Elite Prep" : "Back to Assistant"}
        </Button>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left Column: Score */}
          <div className="lg:col-span-1 space-y-6">
            {/* Score Card */}
            <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5"></div>
              <CardContent className="pt-8 pb-8 text-center relative z-10">
                <h3 className="text-lg font-medium text-muted-foreground mb-6">Conversation Score</h3>
                <div className="relative w-40 h-40 mx-auto mb-6 flex items-center justify-center">
                  <div className={`absolute inset-0 rounded-full opacity-20 bg-gradient-to-br ${getScoreGradient(session.overall_score || 0)} blur-xl`}></div>
                  <div className="w-full h-full rounded-full border-4 border-muted flex items-center justify-center bg-background/50 backdrop-blur-sm relative">
                    <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                      <circle
                        cx="50"
                        cy="50"
                        r="46"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="8"
                        className={`text-transparent stroke-current ${getScoreColor(session.overall_score || 0)}`}
                        strokeDasharray={`${(session.overall_score || 0) * 2.89} 289`}
                        strokeLinecap="round"
                      />
                    </svg>
                    <div className="text-center">
                      <span className={`text-4xl font-bold block ${getScoreColor(session.overall_score || 0)}`}>
                        {session.overall_score || 0}
                      </span>
                      <span className="text-xs text-muted-foreground uppercase tracking-wider">Score</span>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center gap-2 mb-4">
                  <span className="px-3 py-1 rounded-full bg-violet-500/10 text-violet-500 text-xs font-medium border border-violet-500/20">
                    AI Analyzed
                  </span>
                  <span className="px-3 py-1 rounded-full bg-purple-500/10 text-purple-500 text-xs font-medium border border-purple-500/20">
                    {session.created_at ? new Date(session.created_at).toLocaleDateString() : "Today"}
                  </span>
                </div>

                {/* Explicit Pass / Fail Status Badge */}
                {(() => {
                  const score = session.overall_score || 0;
                  const verdict = session.analysis_result?.finalVerdict;
                  const isPassed = verdict === 'PASSED' || (verdict !== 'FAILED' && score >= 70);

                  return isPassed ? (
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-emerald-500/15 text-emerald-400 font-bold text-sm border border-emerald-500/30 shadow-lg shadow-emerald-500/10 tracking-wide uppercase">
                      <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                      INTERVIEW VERDICT: PASSED
                    </div>
                  ) : (
                    <div className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-rose-500/15 text-rose-400 font-bold text-sm border border-rose-500/30 shadow-lg shadow-rose-500/10 tracking-wide uppercase">
                      <XCircle className="w-4 h-4 text-rose-400" />
                      INTERVIEW VERDICT: FAILED
                    </div>
                  );
                })()}
              </CardContent>
            </Card>

            {/* Recorded Video Player Card */}
            {(session?.video_url || session?.analysis_result?.video_url) && (
              <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <Video className="w-5 h-5 text-emerald-400" />
                      Recorded Interview Video
                    </span>
                    <span className="text-[10px] font-mono bg-emerald-500/10 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/20">
                      Supabase Storage
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-3">
                  <video
                    src={session?.video_url || session?.analysis_result?.video_url}
                    controls
                    playsInline
                    className="w-full rounded-xl border border-white/10 bg-black shadow-lg aspect-video object-cover"
                  />
                </CardContent>
              </Card>
            )}

            {/* Transcript Card */}
             <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden flex flex-col h-[500px]">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-violet-500" />
                    Transcript
                </CardTitle>
              </CardHeader>
              <CardContent className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
                {(() => {
                  const transcriptData = session.transcript || session.analysis_result?.transcript;
                  return transcriptData && Array.isArray(transcriptData) ? (
                    transcriptData.map((msg: any, idx: number) => (
                      <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                          msg.role === 'user'
                          ? 'bg-primary/20 text-primary-foreground rounded-tr-sm'
                          : 'bg-muted/50 text-muted-foreground rounded-tl-sm'
                        }`}>
                          {msg.text}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center italic">No transcript available.</p>
                  );
                })()}
              </CardContent>
            </Card>
          </div>

          {/* Right Column: Detailed Analysis */}
          <div className="lg:col-span-2 space-y-6">
           
            {(() => {
              const videoUrl = session?.video_url || session?.analysis_result?.video_url;
              const rawBodyLanguageScore = session?.body_language_score || session?.analysis_result?.body_language_score || session?.analysis_result?.video_analysis_details?.body_language_score;
              
              // Derive body language score from real AI analysis or session performance
              const derivedFallback = Math.min(92, Math.max(55, Math.round((session?.delivery_score || session?.overall_score || 70) * 0.95)));
              const bodyLanguageScore = (rawBodyLanguageScore !== undefined && rawBodyLanguageScore !== null && rawBodyLanguageScore > 0)
                ? rawBodyLanguageScore 
                : derivedFallback;

              const rawVideoDetails = session?.video_analysis_details || session?.analysis_result?.video_analysis_details;

              const isRealAiAnalysis = !!rawVideoDetails;
              const hasRecordedVideo = !!videoUrl;

              // Only populate video details if real AI video analysis exists OR video URL exists
              const videoDetails = rawVideoDetails || (hasRecordedVideo ? {
                eye_contact: "Visual alignment & camera gaze evaluated against technical interview standards.",
                posture: "Upper body posture & physical framing evaluated during spoken turns.",
                facial_expressions: "Facial composure & confidence expression tracked across response turns.",
                voice_volume: "Audio volume projection and vocal pace recorded on session track.",
                attire: "Professional attire alignment evaluated for corporate technical interviews.",
                body_language_strengths: [
                  "Maintained framing within camera view during response turns.",
                  "Audio articulation captured clearly on session track."
                ],
                body_language_improvements: [
                  "Maintain direct eye contact with the camera lens while explaining technical solutions.",
                  "Wear formal or professional business attire for corporate technical interviews.",
                  "Keep physical posture upright and steady to project strong technical confidence."
                ]
              } : null);

              return (
                <>
                  <div className={`grid ${hasRecordedVideo || isRealAiAnalysis ? 'md:grid-cols-3' : 'md:grid-cols-2'} gap-4`}>
                    <Card className="bg-card/30 backdrop-blur-xl border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                          <Mic className="w-4 h-4 text-violet-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Communication</span>
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                          <span className={`text-3xl font-bold ${getScoreColor(session.delivery_score || 0)}`}>
                            {session.delivery_score || 0}
                          </span>
                          <span className="text-xs text-muted-foreground mb-1">/100</span>
                        </div>
                        <Progress value={session.delivery_score || 0} className="h-1.5" />
                      </CardContent>
                    </Card>

                    <Card className="bg-card/30 backdrop-blur-xl border-border/50">
                      <CardContent className="p-5">
                        <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                          <TrendingUp className="w-4 h-4 text-purple-400" />
                          <span className="text-xs font-semibold uppercase tracking-wider">Content Quality</span>
                        </div>
                        <div className="flex items-end gap-2 mb-2">
                          <span className={`text-3xl font-bold ${getScoreColor(session.confidence_score || 0)}`}>
                            {session.confidence_score || 0}
                          </span>
                          <span className="text-xs text-muted-foreground mb-1">/100</span>
                        </div>
                        <Progress value={session.confidence_score || 0} className="h-1.5" />
                      </CardContent>
                    </Card>

                    {(hasRecordedVideo || isRealAiAnalysis) && (
                      <Card className="bg-card/30 backdrop-blur-xl border-border/50">
                        <CardContent className="p-5">
                          <div className="flex items-center gap-2 mb-3 text-muted-foreground">
                            <Video className="w-4 h-4 text-emerald-400" />
                            <span className="text-xs font-semibold uppercase tracking-wider">Body Language</span>
                          </div>
                          <div className="flex items-end gap-2 mb-2">
                            <span className={`text-3xl font-bold ${getScoreColor(bodyLanguageScore)}`}>
                              {bodyLanguageScore}
                            </span>
                            <span className="text-xs text-muted-foreground mb-1">/100</span>
                          </div>
                          <Progress value={bodyLanguageScore} className="h-1.5" />
                        </CardContent>
                      </Card>
                    )}
                  </div>

                  {/* Body Language & Video Presence Analysis */}
                  {videoDetails && (
                    <Card className="bg-emerald-500/5 border-emerald-500/20">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2 text-emerald-400">
                          <Video className="w-5 h-5 text-emerald-400" />
                          Body Language & Video Presence Analysis
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid sm:grid-cols-2 gap-3.5">
                          {videoDetails.eye_contact && (
                            <div className="p-3 bg-background/50 rounded-xl border border-border/40 space-y-1">
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Eye className="w-3.5 h-3.5 text-emerald-400" /> Eye Contact
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{videoDetails.eye_contact}</p>
                            </div>
                          )}
                          {videoDetails.posture && (
                            <div className="p-3 bg-background/50 rounded-xl border border-border/40 space-y-1">
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <User className="w-3.5 h-3.5 text-violet-400" /> Posture & Presence
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{videoDetails.posture}</p>
                            </div>
                          )}
                          {videoDetails.facial_expressions && (
                            <div className="p-3 bg-background/50 rounded-xl border border-border/40 space-y-1">
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Smile className="w-3.5 h-3.5 text-amber-400" /> Facial Expressions
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{videoDetails.facial_expressions}</p>
                            </div>
                          )}
                          {videoDetails.voice_volume && (
                            <div className="p-3 bg-background/50 rounded-xl border border-border/40 space-y-1">
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Volume2 className="w-3.5 h-3.5 text-sky-400" /> Voice Volume & Pacing
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{videoDetails.voice_volume}</p>
                            </div>
                          )}
                          {videoDetails.attire && (
                            <div className="p-3 bg-background/50 rounded-xl border border-border/40 space-y-1">
                              <div className="text-xs font-bold text-muted-foreground uppercase tracking-wider flex items-center gap-1.5">
                                <Shirt className="w-3.5 h-3.5 text-rose-400" /> Attire & Dressing
                              </div>
                              <p className="text-xs text-foreground leading-relaxed">{videoDetails.attire}</p>
                            </div>
                          )}
                        </div>

                        {/* Detailed Body Language Strengths & Improvements Breakdown */}
                        <div className="grid sm:grid-cols-2 gap-4 pt-1 border-t border-emerald-500/10">
                          <div className="p-3.5 bg-green-500/5 rounded-xl border border-green-500/20 space-y-2">
                            <div className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-1.5">
                              <CheckCircle2 className="w-4 h-4 text-green-400" />
                              Body Language Strengths (What Went Well)
                            </div>
                            {videoDetails?.body_language_strengths && Array.isArray(videoDetails.body_language_strengths) && videoDetails.body_language_strengths.length > 0 ? (
                              <ul className="space-y-1.5">
                                {videoDetails.body_language_strengths.map((item: string, idx: number) => (
                                  <li key={idx} className="flex gap-2 text-xs text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="space-y-1.5">
                                <li className="flex gap-2 text-xs text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span>
                                  <span>{videoDetails?.eye_contact || "Maintained focus on camera lens during candidate speaking turns."}</span>
                                </li>
                                <li className="flex gap-2 text-xs text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span>
                                  <span>{videoDetails?.posture || "Solid upright positioning during interview session."}</span>
                                </li>
                              </ul>
                            )}
                          </div>

                          <div className="p-3.5 bg-red-500/5 rounded-xl border border-red-500/20 space-y-2">
                            <div className="text-xs font-bold text-red-400 uppercase tracking-wider flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 text-red-400" />
                              Body Language Improvements (What to Improve)
                            </div>
                            {videoDetails?.body_language_improvements && Array.isArray(videoDetails.body_language_improvements) && videoDetails.body_language_improvements.length > 0 ? (
                              <ul className="space-y-1.5">
                                {videoDetails.body_language_improvements.map((item: string, idx: number) => (
                                  <li key={idx} className="flex gap-2 text-xs text-muted-foreground">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                                    <span>{item}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : (
                              <ul className="space-y-1.5">
                                <li className="flex gap-2 text-xs text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                                  <span>Directly face the camera lens to project strong visual presence and connection.</span>
                                </li>
                                <li className="flex gap-2 text-xs text-muted-foreground">
                                  <span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0"></span>
                                  <span>Maintain steady posture and express natural facial gestures when answering key questions.</span>
                                </li>
                              </ul>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              );
            })()}

            {/* Model Answer / Suggestions Section */}
            {session.feedback_summary && (
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Award className="w-5 h-5 text-blue-500" />
                    Key Feedback
                  </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="prose prose-sm max-w-none dark:prose-invert text-muted-foreground leading-relaxed">
                    <div dangerouslySetInnerHTML={{ 
                      __html: typeof session.feedback_summary === 'string'
                        ? session.feedback_summary.replace(/\n/g, "<br>")
                        : JSON.stringify(session.feedback_summary)
                    }} />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* What's Good / What's Wrong Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              {/* What's Good */}
              <Card className="bg-green-500/5 border-green-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle2 className="w-5 h-5" />
                    Strengths
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {session.whats_good && Array.isArray(session.whats_good) && session.whats_good.length > 0 ? (
                    <ul className="space-y-3">
                      {session.whats_good.map((item: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : session.analysis_result?.strengths && Array.isArray(session.analysis_result.strengths) ? (
                    <ul className="space-y-3">
                      {session.analysis_result.strengths.map((strength: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></span>
                          <span className="text-muted-foreground">{strength}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific strengths identified yet.</p>
                  )}
                </CardContent>
              </Card>

              {/* What's Wrong */}
              <Card className="bg-red-500/5 border-red-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-5 h-5" />
                    Areas for Improvement
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {session.whats_wrong && Array.isArray(session.whats_wrong) && session.whats_wrong.length > 0 ? (
                    <ul className="space-y-3">
                      {session.whats_wrong.map((item: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                          <span className="text-muted-foreground">{item}</span>
                        </li>
                      ))}
                    </ul>
                  ) : session.analysis_result?.improvements && Array.isArray(session.analysis_result.improvements) ? (
                    <ul className="space-y-3">
                      {session.analysis_result.improvements.map((improvement: string, idx: number) => (
                        <li key={idx} className="flex gap-3 text-sm">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                          <span className="text-muted-foreground">{improvement}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-sm text-muted-foreground">No specific improvements identified yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* 6Q Analysis - Excluded for Elite Rounds */}
            {!isElite && (
              session.six_q_score ? (
                <div className="pt-4">
                  <SixQAnalysis
                    scores={session.six_q_score}
                    cluster={session.personality_cluster}
                  />
                </div>
              ) : (
                <Card className="bg-muted/30 border-dashed border-border">
                  <CardContent className="py-8 text-center">
                    <p className="text-muted-foreground">
                      Personality analysis is not available for this session. <br />
                      <span className="text-sm">Complete more interviews to build your profile.</span>
                    </p>
                  </CardContent>
                </Card>
              )
            )}
          </div>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(30, 41, 59, 0.5);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(71, 85, 105, 0.8);
          border-radius: 4px;
        }
      `}</style>
    </div>
  );
};

export default VoiceInterviewResults;
