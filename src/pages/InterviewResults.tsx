import { useEffect, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { ArrowRight, CheckCircle, Clock, Trophy, RotateCcw, LayoutDashboard, Sparkles, Loader2 } from "lucide-react";
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
      <div className="min-h-screen flex items-center justify-center bg-[#0c0d14]">
        <Loader2 className="w-8 h-8 text-violet-500 animate-spin" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="min-h-screen w-screen bg-[#0c0d14] text-foreground flex items-center justify-center p-4 md:p-8 relative overflow-hidden font-sans">
      {/* Glow Mesh Gradients */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-600/5 rounded-full blur-[130px] pointer-events-none z-0" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-600/5 rounded-full blur-[130px] pointer-events-none z-0" />

      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-6xl w-full relative z-10 my-6"
      >
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 md:gap-8 items-start w-full">
          
          {/* LEFT COLUMN: Completion status, Score, Metrics and Actions (5 spans) */}
          <div className="lg:col-span-5 rounded-3xl bg-[#0e1017]/40 border border-white/5 shadow-2xl backdrop-blur-xl p-6 md:p-8 space-y-6 relative overflow-hidden">
            {/* Top glowing boundary line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-80" />

            {/* Header completion banner */}
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-14 h-14 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl flex items-center justify-center mx-auto mb-2 shadow-lg shadow-emerald-500/5"
              >
                <CheckCircle className="w-7 h-7 text-emerald-400" />
              </motion.div>
              <h2 className="text-xl md:text-2xl font-extrabold tracking-tight bg-gradient-to-r from-violet-200 to-white bg-clip-text text-transparent">
                Interview Completed!
              </h2>
              <p className="text-[10px] text-violet-400/80 font-bold uppercase tracking-wider">
                {session.interview_type || "General"} Practice Session
              </p>
            </div>

            {/* Score Ring Display */}
            <div className="flex flex-col items-center justify-center p-5 bg-white/[0.01] border border-white/5 rounded-2xl">
              <span className="text-[9px] font-extrabold uppercase tracking-wider text-violet-300/40 mb-3">Overall score</span>
              <div className="relative flex items-center justify-center">
                <svg className="w-28 h-28 transform -rotate-90">
                  <circle
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="currentColor"
                    strokeWidth="7"
                    fill="transparent"
                    className="text-white/5"
                  />
                  <motion.circle
                    initial={{ strokeDasharray: "301 301", strokeDashoffset: 301 }}
                    animate={{ strokeDashoffset: 301 - (301 * (score || 0)) / 100 }}
                    transition={{ duration: 1.5, ease: "easeOut" }}
                    cx="56"
                    cy="56"
                    r="48"
                    stroke="url(#score-glow-gradient-results)"
                    strokeWidth="7"
                    fill="transparent"
                    strokeLinecap="round"
                  />
                  <defs>
                    <linearGradient id="score-glow-gradient-results" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#8b5cf6" />
                      <stop offset="100%" stopColor="#d946ef" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-black bg-gradient-to-r from-violet-200 to-white bg-clip-text text-transparent">{score}%</span>
                </div>
              </div>
            </div>

            {/* Stats Block */}
            <div className="grid grid-cols-2 gap-3.5">
              <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-blue-500/10 border border-blue-500/10 rounded-xl">
                  <Clock className="w-4 h-4 text-blue-400" />
                </div>
                <div>
                  <p className="text-[9px] text-violet-300/40 font-bold uppercase">Duration</p>
                  <p className="text-xs font-bold text-violet-100">{session.duration || 15} mins</p>
                </div>
              </div>

              <div className="p-3.5 bg-white/[0.01] border border-white/5 rounded-2xl flex items-center gap-3">
                <div className="p-2 bg-amber-500/10 border border-amber-500/10 rounded-xl">
                  <Trophy className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <p className="text-[9px] text-violet-300/40 font-bold uppercase">Questions</p>
                  <p className="text-xs font-bold text-violet-100">{(session as any).questions_answered || 5} Ans</p>
                </div>
              </div>
            </div>

            {/* Metric breakdown progress sliders */}
            <div className="space-y-3.5">
              <h3 className="text-[10px] font-bold text-violet-300/40 uppercase tracking-wider">Skill Metrics Calibration</h3>
              <div className="space-y-3.5 bg-white/[0.01] border border-white/5 rounded-2xl p-4.5">
                {[
                  {
                    label: "Technical Accuracy",
                    score: evaluation?.metrics?.technical_accuracy || (score > 80 ? 90 : 75),
                    gradient: "bg-gradient-to-r from-violet-500 to-indigo-500"
                  },
                  {
                    label: "Communication",
                    score: evaluation?.metrics?.communication || (score > 80 ? 95 : 80),
                    gradient: "bg-gradient-to-r from-blue-500 to-teal-500"
                  },
                  {
                    label: "Problem Solving",
                    score: evaluation?.metrics?.problem_solving || (score > 80 ? 85 : 70),
                    gradient: "bg-gradient-to-r from-pink-500 to-fuchsia-500"
                  },
                ].map((metric, i) => (
                  <div key={i} className="space-y-1.5">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-violet-200/70">{metric.label}</span>
                      <span className="font-bold text-violet-100">{metric.score}%</span>
                    </div>
                    <Progress value={metric.score} className="h-1.5 bg-white/5" indicatorClassName={metric.gradient} />
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons stack */}
            <div className="flex flex-col gap-2.5 pt-2">
              <Button
                className="w-full h-10 text-xs font-bold rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/15 transition-all duration-300 hover:scale-[1.01]"
                onClick={() => navigate("/dashboard")}
              >
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Go to Dashboard
                <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
              </Button>
              <Button
                variant="outline"
                className="w-full h-10 text-xs font-bold rounded-xl bg-transparent border-white/10 text-violet-200/80 hover:bg-white/5 hover:text-white"
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
              <div className="p-6 rounded-3xl bg-[#0e1017]/40 border border-violet-500/10 shadow-2xl backdrop-blur-xl space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-4 opacity-[0.03] pointer-events-none">
                  <Sparkles className="w-20 h-20 text-violet-400" />
                </div>
                <h3 className="text-[10px] font-bold text-violet-300 flex items-center gap-2 uppercase tracking-wider">
                  <Sparkles className="w-3.5 h-3.5 text-violet-400" />
                  Voke's AI Assessment Summary
                </h3>
                <p className="text-[13px] text-violet-200/75 leading-relaxed font-sans font-medium whitespace-pre-line">
                  {evaluation.feedback}
                </p>
              </div>
            )}

            {/* Strengths & Weaknesses Panel Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              {/* Strengths Box */}
              <div className="p-6 rounded-3xl bg-[#0e1017]/40 border border-emerald-500/10 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center gap-2 text-emerald-400 font-bold border-b border-white/5 pb-2">
                  <CheckCircle className="w-4 h-4" />
                  <h3 className="text-[10px] uppercase tracking-wider">Key Strengths</h3>
                </div>
                <ul className="space-y-3">
                  {evaluation?.strengths && evaluation.strengths.length > 0 ? (
                    evaluation.strengths.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-violet-200/70 flex items-start gap-2.5 leading-relaxed font-medium">
                        <span className="w-4.5 h-4.5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-emerald-500/10 mt-0.5">✓</span>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-violet-200/40 italic">No specific strengths flagged yet.</li>
                  )}
                </ul>
              </div>

              {/* Weaknesses/Calibration Box */}
              <div className="p-6 rounded-3xl bg-[#0e1017]/40 border border-red-500/10 shadow-2xl backdrop-blur-xl space-y-4">
                <div className="flex items-center gap-2 text-red-400 font-bold border-b border-white/5 pb-2">
                  <RotateCcw className="w-4 h-4" />
                  <h3 className="text-[10px] uppercase tracking-wider">Areas to Calibrate</h3>
                </div>
                <ul className="space-y-3">
                  {evaluation?.weaknesses && evaluation.weaknesses.length > 0 ? (
                    evaluation.weaknesses.map((item: string, i: number) => (
                      <li key={i} className="text-xs text-violet-200/70 flex items-start gap-2.5 leading-relaxed font-medium">
                        <span className="w-4.5 h-4.5 rounded-full bg-red-500/10 text-red-400 flex items-center justify-center text-[9px] shrink-0 font-bold border border-red-500/10 mt-0.5">!</span>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="text-xs text-violet-200/40 italic">No warnings highlighted.</li>
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
