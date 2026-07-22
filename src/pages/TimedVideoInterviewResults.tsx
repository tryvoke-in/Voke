import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { LogOut, ArrowLeft, Clock, Award, CheckCircle2, AlertCircle, Play } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Badge } from "@/components/ui/badge";

interface InterviewSession {
    id: string;
    role: string;
    time_limit_minutes: number;
    overall_score: number;
    status: string;
    created_at: string;
}

interface InterviewAnswer {
    id: string;
    question_number: number;
    question: string;
    video_url: string;
    transcript: string;
    model_answer: string;
    whats_good: any; // JSONB from database
    whats_wrong: any; // JSONB from database
    delivery_score: number;
    body_language_score: number;
    confidence_score: number;
    duration_seconds: number;
}

const TimedVideoInterviewResults = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<InterviewSession | null>(null);
    const [answers, setAnswers] = useState<InterviewAnswer[]>([]);

    useEffect(() => {
        checkAuth();
        loadResults();
    }, [id]);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
        }
    };

    const loadResults = async () => {
        try {
            // Load session
            const { data: sessionData, error: sessionError } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("id", id)
                .single();

            if (sessionError) throw sessionError;
            setSession(sessionData);

            // Load all answers for this session
            const { data: answersData, error: answersError } = await supabase
                .from("interview_answers")
                .select("*")
                .eq("session_id", id)
                .order("question_number", { ascending: true });

            if (answersError) throw answersError;
            setAnswers(answersData || []);
        } catch (error) {
            console.error("Error loading results:", error);
        } finally {
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

    const calculateAverageScore = () => {
        if (answers.length === 0) return 0;
        const total = answers.reduce((sum, answer) => {
            const avg = ((answer.delivery_score || 0) + (answer.body_language_score || 0) + (answer.confidence_score || 0)) / 3;
            return sum + avg;
        }, 0);
        return Math.round(total / answers.length);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-500"></div>
                    <p className="text-muted-foreground animate-pulse">Loading your results...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="max-w-md bg-card/50 backdrop-blur-xl border-border/50">
                    <CardHeader>
                        <CardTitle>Session Not Found</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <p className="text-muted-foreground mb-4">The interview session could not be found.</p>
                        <Button onClick={() => navigate("/dashboard")}>Return to Dashboard</Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const avgScore = session.overall_score || calculateAverageScore();

    return (
        <div className="min-h-screen bg-background overflow-x-hidden">
            {/* Header */}
            <header className="bg-background/80 backdrop-blur-md border-b border-border/40 sticky top-0 z-50">
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
                        <img src="/images/voke_logo.png" alt="Voke Logo" className="w-8 h-8 object-contain" />
                        <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">
                            Interview Results
                        </h1>
                    </div>
                    <nav className="flex items-center gap-2">
                        <ThemeToggle />
                        <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")}>
                            Dashboard
                        </Button>
                        <Button variant="outline" size="sm" onClick={handleLogout}>
                            <LogOut className="w-4 h-4 mr-2" />
                            Logout
                        </Button>
                    </nav>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-5xl">
                <Button variant="ghost" onClick={() => navigate("/video-interview")} className="mb-8 hover:bg-violet-500/10 hover:text-violet-500 transition-colors">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Practice
                </Button>

                {/* Overall Score Card */}
                <Card className="bg-card/30 backdrop-blur-xl border-border/50 overflow-hidden relative mb-8">
                    <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-purple-500/5"></div>
                    <CardContent className="pt-8 pb-8 relative z-10">
                        <div className="grid md:grid-cols-3 gap-8">
                            {/* Score Circle */}
                            <div className="flex flex-col items-center justify-center">
                                <h3 className="text-lg font-medium text-muted-foreground mb-4">Overall Performance</h3>
                                <div className="relative w-32 h-32 flex items-center justify-center">
                                    <div className={`absolute inset-0 rounded-full opacity-20 bg-gradient-to-br ${getScoreGradient(avgScore)} blur-xl`}></div>
                                    <div className="w-full h-full rounded-full border-4 border-muted flex items-center justify-center bg-background/50 backdrop-blur-sm relative">
                                        <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
                                            <circle
                                                cx="50"
                                                cy="50"
                                                r="46"
                                                fill="none"
                                                stroke="currentColor"
                                                strokeWidth="8"
                                                className={`text-transparent stroke-current ${getScoreColor(avgScore)}`}
                                                strokeDasharray={`${avgScore * 2.89} 289`}
                                                strokeLinecap="round"
                                            />
                                        </svg>
                                        <div className="text-center">
                                            <span className={`text-4xl font-bold block ${getScoreColor(avgScore)}`}>
                                                {avgScore}
                                            </span>
                                            <span className="text-xs text-muted-foreground uppercase tracking-wider">Score</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Stats */}
                            <div className="md:col-span-2 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <Award className="w-4 h-4" />
                                            <span className="text-sm font-medium">Role</span>
                                        </div>
                                        <p className="text-lg font-semibold">{session.role}</p>
                                    </div>
                                    <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                                        <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                            <Clock className="w-4 h-4" />
                                            <span className="text-sm font-medium">Time Limit</span>
                                        </div>
                                        <p className="text-lg font-semibold">{session.time_limit_minutes} minutes</p>
                                    </div>
                                </div>
                                <div className="p-4 rounded-xl bg-background/50 border border-border/50">
                                    <div className="flex items-center gap-2 text-muted-foreground mb-2">
                                        <CheckCircle2 className="w-4 h-4" />
                                        <span className="text-sm font-medium">Questions Answered</span>
                                    </div>
                                    <p className="text-lg font-semibold">{answers.length} questions</p>
                                </div>
                                <div className="flex gap-2">
                                    <Badge variant="outline" className="border-violet-500/30 text-violet-500 bg-violet-500/5">
                                        AI Analyzed
                                    </Badge>
                                    <Badge variant="outline" className="border-purple-500/30 text-purple-500 bg-purple-500/5">
                                        {new Date(session.created_at).toLocaleDateString()}
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Questions Accordion */}
                <Card className="bg-card/30 backdrop-blur-xl border-border/50">
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Play className="w-5 h-5 text-violet-500" />
                            Interview Questions & Feedback
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Accordion type="single" collapsible className="w-full">
                            {answers.map((answer, index) => {
                                const questionScore = Math.round(
                                    ((answer.delivery_score || 0) + (answer.body_language_score || 0) + (answer.confidence_score || 0)) / 3
                                );

                                return (
                                    <AccordionItem key={answer.id} value={`question-${index}`}>
                                        <AccordionTrigger className="hover:no-underline">
                                            <div className="flex items-center justify-between w-full pr-4">
                                                <div className="flex items-center gap-3">
                                                    <Badge variant="outline" className="shrink-0">Q{answer.question_number}</Badge>
                                                    <span className="text-left font-medium">{answer.question}</span>
                                                </div>
                                                <span className={`text-sm font-semibold ${getScoreColor(questionScore)}`}>
                                                    {questionScore}/100
                                                </span>
                                            </div>
                                        </AccordionTrigger>
                                        <AccordionContent>
                                            <div className="space-y-6 pt-4">
                                                {/* Video Player */}
                                                {answer.video_url && (
                                                    <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                                        <video src={answer.video_url} controls className="w-full h-full object-cover" />
                                                    </div>
                                                )}

                                                {/* Scores */}
                                                <div className="grid md:grid-cols-3 gap-4">
                                                    <Card className="bg-background/50">
                                                        <CardContent className="p-4">
                                                            <div className="text-sm text-muted-foreground mb-2">Delivery</div>
                                                            <div className="flex items-end gap-2 mb-2">
                                                                <span className={`text-2xl font-bold ${getScoreColor(answer.delivery_score || 0)}`}>
                                                                    {answer.delivery_score || 0}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground mb-1">/100</span>
                                                            </div>
                                                            <Progress value={answer.delivery_score || 0} className="h-1.5" />
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="bg-background/50">
                                                        <CardContent className="p-4">
                                                            <div className="text-sm text-muted-foreground mb-2">Body Language</div>
                                                            <div className="flex items-end gap-2 mb-2">
                                                                <span className={`text-2xl font-bold ${getScoreColor(answer.body_language_score || 0)}`}>
                                                                    {answer.body_language_score || 0}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground mb-1">/100</span>
                                                            </div>
                                                            <Progress value={answer.body_language_score || 0} className="h-1.5" />
                                                        </CardContent>
                                                    </Card>
                                                    <Card className="bg-background/50">
                                                        <CardContent className="p-4">
                                                            <div className="text-sm text-muted-foreground mb-2">Confidence</div>
                                                            <div className="flex items-end gap-2 mb-2">
                                                                <span className={`text-2xl font-bold ${getScoreColor(answer.confidence_score || 0)}`}>
                                                                    {answer.confidence_score || 0}
                                                                </span>
                                                                <span className="text-sm text-muted-foreground mb-1">/100</span>
                                                            </div>
                                                            <Progress value={answer.confidence_score || 0} className="h-1.5" />
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                {/* Feedback */}
                                                <div className="grid md:grid-cols-2 gap-4">
                                                    <Card className="bg-green-500/5 border-green-500/20">
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm flex items-center gap-2 text-green-600 dark:text-green-400">
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                What's Good
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {answer.whats_good && answer.whats_good.length > 0 ? (
                                                                <ul className="space-y-2">
                                                                    {answer.whats_good.map((item, idx) => (
                                                                        <li key={idx} className="flex gap-2 text-sm">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-1.5 shrink-0"></span>
                                                                            <span className="text-muted-foreground">{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No specific strengths identified.</p>
                                                            )}
                                                        </CardContent>
                                                    </Card>

                                                    <Card className="bg-red-500/5 border-red-500/20">
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                                                                <AlertCircle className="w-4 h-4" />
                                                                What's Wrong
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            {answer.whats_wrong && answer.whats_wrong.length > 0 ? (
                                                                <ul className="space-y-2">
                                                                    {answer.whats_wrong.map((item, idx) => (
                                                                        <li key={idx} className="flex gap-2 text-sm">
                                                                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-1.5 shrink-0"></span>
                                                                            <span className="text-muted-foreground">{item}</span>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            ) : (
                                                                <p className="text-sm text-muted-foreground">No specific issues identified.</p>
                                                            )}
                                                        </CardContent>
                                                    </Card>
                                                </div>

                                                {/* Model Answer */}
                                                {answer.model_answer && (
                                                    <Card className="bg-blue-500/5 border-blue-500/20">
                                                        <CardHeader className="pb-3">
                                                            <CardTitle className="text-sm flex items-center gap-2 text-blue-600 dark:text-blue-400">
                                                                <Award className="w-4 h-4" />
                                                                Model Answer
                                                            </CardTitle>
                                                        </CardHeader>
                                                        <CardContent>
                                                            <p className="text-sm text-muted-foreground leading-relaxed">
                                                                {answer.model_answer}
                                                            </p>
                                                        </CardContent>
                                                    </Card>
                                                )}
                                            </div>
                                        </AccordionContent>
                                    </AccordionItem>
                                );
                            })}
                        </Accordion>
                    </CardContent>
                </Card>

                {/* Action Buttons */}
                <div className="flex gap-4 mt-8">
                    <Button variant="outline" onClick={() => navigate("/dashboard")} className="flex-1">
                        Back to Dashboard
                    </Button>
                    <Button onClick={() => navigate("/video-interview")} className="flex-1 bg-gradient-to-r from-violet-600 to-purple-600 text-white">
                        Practice Again
                    </Button>
                </div>
            </main>
        </div>
    );
};

export default TimedVideoInterviewResults;
