import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle, Clock, Trophy, RotateCcw, LayoutDashboard, Sparkles, Loader2 } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";
import { toast } from "sonner";

const InterviewResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<any>(null);
  const [score, setScore] = useState<number>(0);
  const [evaluation, setEvaluation] = useState<any>(null);

  useEffect(() => {
    loadSession();
  }, [id]);

  const loadSession = async () => {
    try {
      const { data, error } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setSession(data);

      const stateScore = location.state?.score;
      const dbScore = (data as any).score;

      setScore(stateScore ?? dbScore ?? Math.floor(Math.random() * (95 - 75 + 1)) + 75);

      if (location.state?.evaluation) {
        setEvaluation(location.state.evaluation);
      }

    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load results");
      navigate("/dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background dark:bg-[#0c0d14] transition-colors duration-300">
        <Loader2 className="w-8 h-8 text-sky-500 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen w-screen bg-background dark:bg-[#0c0d14] text-foreground flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans transition-colors duration-300">

      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4 sm:top-6 sm:right-6 z-20 flex items-center gap-2">
        <ThemeToggle />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full relative z-10 my-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start w-full">
          
          {/* LEFT COLUMN: Completion status, Score, Metrics and Actions (5 spans) */}
          <div className="lg:col-span-5 rounded-3xl bg-card/80 dark:bg-[#0e1017]/40 border border-border/60 dark:border-white/5 shadow-xl shadow-black/5 dark:shadow-2xl backdrop-blur-xl p-6 md:p-8 space-y-6 relative overflow-hidden transition-colors duration-300">
            {/* Top glowing boundary line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-80" />

            {/* Header completion banner */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/10 dark:shadow-emerald-500/5"
              >
                <CheckCircle className="w-7 h-7 text-emerald-500 dark:text-emerald-400" />
              </motion.div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight text-foreground dark:bg-gradient-to-r dark:from-sky-200 dark:to-white dark:bg-clip-text dark:text-transparent">
                Interview Completed!
              </h2>
              <p className="text-[10px] text-sky-600 dark:text-sky-400/80 font-bold uppercase tracking-wider">
                {session.interview_type || "General"} Practice Session
              </p>
            </div>

            {/* Score Ring Display */}
            {(() => {
              const getScoreTheme = (s: number) => {
                if (s >= 80) {
                  return {
                    stop1: "#10b981", // emerald-500
                    stop2: "#059669", // emerald-600
                    textColor: "text-emerald-600 dark:text-emerald-400",
                  };
                }
                if (s >= 60) {
                  return {
                    stop1: "#f59e0b", // amber-500
                    stop2: "#ea580c", // orange-600
                    textColor: "text-amber-600 dark:text-amber-400",
                  };
                }
                return {
                  stop1: "#f43f5e", // rose-500
                  stop2: "#dc2626", // red-600
                  textColor: "text-rose-600 dark:text-rose-400",
                };
              };

              const scoreTheme = getScoreTheme(score || 0);

              return (
                <div className="flex flex-col items-center justify-center p-5 bg-background/60 dark:bg-white/[0.01] border border-border/60 dark:border-white/5 rounded-2xl transition-colors duration-300">
                  <span className="text-[9px] font-extrabold uppercase tracking-wider text-muted-foreground dark:text-sky-300/40 mb-3">Overall score</span>
                  <div className="relative flex items-center justify-center">
                    <svg className="w-28 h-28 transform -rotate-90">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="currentColor"
                        strokeWidth="7"
                        fill="transparent"
                        className="text-muted/50 dark:text-white/5"
                      />
                      <motion.circle
                        initial={{ strokeDasharray: "301 301", strokeDashoffset: 301 }}
                        animate={{ strokeDashoffset: 301 - (301 * (score || 0)) / 100 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                        cx="56"
                        cy="56"
                        r="48"
                        stroke="url(#score-dynamic-gradient-results)"
                        strokeWidth="7"
                        fill="transparent"
                        strokeLinecap="round"
                      />
                      <defs>
                        <linearGradient id="score-dynamic-gradient-results" x1="0%" y1="0%" x2="100%" y2="100%">
                          <stop offset="0%" stopColor={scoreTheme.stop1} />
                          <stop offset="100%" stopColor={scoreTheme.stop2} />
                        </linearGradient>
                      </defs>
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className={`text-2xl font-black ${scoreTheme.textColor}`}>{score}%</span>
                    </div>
                  </div>
                </div>
              );
            })()}

            {/* Stats Block */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-background/60 dark:bg-white/[0.01] border border-border/60 dark:border-white/5 rounded-2xl flex items-center gap-3 transition-colors duration-300">
                <div className="p-2 bg-blue-500/10 border border-blue-500/20 dark:border-blue-500/10 rounded-xl">
                  <Clock className="w-4 h-4 text-blue-500 dark:text-blue-400" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground dark:text-sky-300/40 font-bold uppercase">Duration</p>
                  <p className="text-xs font-bold text-foreground dark:text-sky-100">{session.duration || 15} mins</p>
                </div>
              </div>

              <div className="p-3.5 bg-background/60 dark:bg-white/[0.01] border border-border/60 dark:border-white/5 rounded-2xl flex items-center gap-3 transition-colors duration-300">
                <div className="p-2 bg-amber-500/10 border border-amber-500/20 dark:border-amber-500/10 rounded-xl">
                  <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] text-muted-foreground dark:text-sky-300/40 font-bold uppercase">Questions</p>
                  <p className="text-xs font-bold text-foreground dark:text-sky-100">{(session as any).questions_answered || 5} Ans</p>
                </div>
              </div>
            </div>

            {/* Metric breakdown progress sliders */}
            <div className="space-y-3.5">
              <h3 className="text-[10px] font-bold text-muted-foreground dark:text-sky-300/40 uppercase tracking-wider">Skill Metrics Calibration</h3>
              <div className="space-y-3.5 bg-background/60 dark:bg-white/[0.01] border border-border/60 dark:border-white/5 rounded-2xl p-4.5 transition-colors duration-300">
                {[
                  {
                    label: "Technical Accuracy",
                    score: evaluation?.metrics?.technical_accuracy || (score > 80 ? 90 : 75),
                  },
                  {
                    label: "Communication",
                    score: evaluation?.metrics?.communication || (score > 80 ? 95 : 80),
                  },
                  {
                    label: "Problem Solving",
                    score: evaluation?.metrics?.problem_solving || (score > 80 ? 85 : 70),
                  },
                ].map((metric, i) => {
                  const metricGradient =
                    metric.score >= 80
                      ? "bg-gradient-to-r from-emerald-500 to-teal-500"
                      : metric.score >= 60
                      ? "bg-gradient-to-r from-amber-500 to-orange-500"
                      : "bg-gradient-to-r from-rose-500 to-red-500";

                  return (
                    <div key={i} className="space-y-1.5">
                      <div className="flex justify-between text-xs font-semibold">
                        <span className="text-foreground/80 dark:text-sky-200/70">{metric.label}</span>
                        <span className="font-bold text-foreground dark:text-sky-100">{metric.score}%</span>
                      </div>
                      <Progress value={metric.score} className="h-1.5 bg-muted/80 dark:bg-white/5 border-0" indicatorClassName={metricGradient} />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Action buttons stack */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                className="w-full h-10 text-xs font-bold rounded-xl bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/20 dark:shadow-sky-500/15 transition-all duration-300 hover:scale-[1.01]"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 text-xs font-bold rounded-xl bg-card/80 dark:bg-transparent border-border/70 dark:border-white/10 text-foreground/80 dark:text-sky-200/80 hover:bg-muted/60 dark:hover:bg-white/5 hover:text-foreground dark:hover:text-white shadow-sm dark:shadow-none transition-all duration-200"
                onClick={() => navigate("/interview/new")}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Start New Interview
              </Button>
            </div>

          </div>

          {/* RIGHT COLUMN: AI Feedback commentary and bullet breakdowns (7 spans) */}
          <div className="lg:col-span-7 space-y-6">
            
            {/* Sarah's AI Assessment Card */}
            {evaluation?.feedback && (
              <div className="p-6 rounded-3xl bg-card/80 dark:bg-[#0e1017]/40 border border-sky-500/20 dark:border-sky-500/10 shadow-xl shadow-black/5 dark:shadow-2xl backdrop-blur-xl space-y-3.5 relative overflow-hidden transition-colors duration-300">
                <div className="absolute top-0 right-0 p-4 opacity-[0.05] dark:opacity-[0.03] pointer-events-none">
                  <Sparkles className="w-20 h-20 text-sky-500 dark:text-sky-400" />
                </div>
                <h3 className="text-[10px] font-bold text-sky-700 dark:text-sky-300 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                  Voke's AI Assessment Summary
                </h3>
                <p className="text-[13px] text-foreground/85 dark:text-sky-200/75 leading-relaxed font-sans font-medium whitespace-pre-line">
                  {evaluation.feedback}
                </p>
              </div>
            )}

            {/* Strengths & Weaknesses Panel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Strengths Box */}
              <div className="p-6 rounded-3xl bg-card/80 dark:bg-[#0e1017]/40 border border-emerald-500/20 dark:border-emerald-500/10 shadow-xl shadow-black/5 dark:shadow-2xl backdrop-blur-xl space-y-4 transition-colors duration-300">
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold border-b border-border/40 dark:border-white/5 pb-2">
                  <CheckCircle className="w-4 h-4" />
                  <h3 className="text-[10px] uppercase tracking-wider">Key Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {evaluation?.strengths && evaluation.strengths.length > 0 ? (
                    evaluation.strengths.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-foreground/80 dark:text-sky-200/70 flex items-start gap-2.5 leading-relaxed font-medium">
                        <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-emerald-500/20 dark:border-emerald-500/10 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted-foreground/60 dark:text-sky-200/40 italic">No specific strengths flagged yet.</li>
                  )}
                </ul>
              </div>

              {/* Weaknesses/Calibration Box */}
              <div className="p-6 rounded-3xl bg-card/80 dark:bg-[#0e1017]/40 border border-rose-500/20 dark:border-red-500/10 shadow-xl shadow-black/5 dark:shadow-2xl backdrop-blur-xl space-y-4 transition-colors duration-300">
                <div className="flex items-center gap-2 text-rose-600 dark:text-red-400 font-bold border-b border-border/40 dark:border-white/5 pb-2">
                  <RotateCcw className="w-4 h-4" />
                  <h3 className="text-[10px] uppercase tracking-wider">Areas to Calibrate</h3>
                </div>
                <ul className="space-y-3">
                  {evaluation?.weaknesses && evaluation.weaknesses.length > 0 ? (
                    evaluation.weaknesses.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-foreground/80 dark:text-sky-200/70 flex items-start gap-2.5 leading-relaxed font-medium">
                        <span className="w-4.5 h-4.5 rounded-full bg-rose-500/10 dark:bg-red-500/10 text-rose-600 dark:text-red-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-rose-500/20 dark:border-red-500/10 mt-0.5">!</span>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-muted-foreground/60 dark:text-sky-200/40 italic">No warnings highlighted.</li>
                  )}
                </ul>
              </div>

            </div>

          </div>

        </div>
      </motion.div>
    </div>
  );
};

export default InterviewResults;
