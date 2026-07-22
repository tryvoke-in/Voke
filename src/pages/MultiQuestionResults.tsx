import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, ArrowLeft, Eye, Mic, TrendingUp, Award, CheckCircle2, AlertCircle, ChevronDown, ChevronUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { ThemeToggle } from "@/components/ThemeToggle";
import SixQAnalysis from "@/components/SixQAnalysis";

const MultiQuestionResults = () => {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [answers, setAnswers] = useState<any[]>([]);
    const [expandedAnswers, setExpandedAnswers] = useState<Set<string>>(new Set());

    useEffect(() => {
        checkAuth();
        loadResults();
    }, [sessionId]);

    const checkAuth = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
        }
    };

    const loadResults = async () => {
        try {
            const { data: sessionData, error: sessionError } = await supabase
                .from("interview_sessions")
                .select("*")
                .eq("id", sessionId)
                .single();

            if (sessionError) throw sessionError;

            const { data: answersData, error: answersError } = await supabase
                .from("interview_answers")
                .select("*")
                .eq("session_id", sessionId)
                .order("question_number");

            if (answersError) throw answersError;

            setSession(sessionData);
            setAnswers(answersData);
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

    const toggleAnswer = (answerId: string) => {
        setExpandedAnswers(prev => {
            const newSet = new Set(prev);
            if (newSet.has(answerId)) {
                newSet.delete(answerId);
            } else {
                newSet.add(answerId);
            }
            return newSet;
        });
    };

    const getScoreColor = (score: number) => {
        if (score >= 80) return "text-green-500";
        if (score >= 60) return "text-yellow-500";
        return "text-red-500";
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
                <Card className="max-w-md">
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

    return (
        <div className="min-h-screen bg-background">
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

            <main className="container mx-auto px-4 py-8 max-w-6xl">
                <Button variant="ghost" onClick={() => navigate("/video-interview")} className="mb-8">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    New Interview
                </Button>

                {/* Overall Score Card */}
                <Card className="bg-card/30 backdrop-blur-xl border-border/50 mb-8">
                    <CardContent className="p-8">
                        <div className="grid md:grid-cols-4 gap-6">
                            <div className="text-center">
                                <div className="text-5xl font-bold text-violet-500 mb-2">
                                    {session.overall_score || "N/A"}
                                </div>
                                <div className="text-sm text-muted-foreground">Overall Score</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-2">{session.role}</div>
                                <div className="text-sm text-muted-foreground">Role</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-2">{answers.length}</div>
                                <div className="text-sm text-muted-foreground">Questions Answered</div>
                            </div>
                            <div className="text-center">
                                <div className="text-2xl font-semibold mb-2">{session.time_limit_minutes} min</div>
                                <div className="text-sm text-muted-foreground">Time Limit</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Overall Summary */}
                <div className="grid md:grid-cols-3 gap-6 mb-8">
                    <Card className="bg-purple-500/5 border-purple-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Eye className="w-5 h-5 text-purple-500" />
                                Eye Contact
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {session.eye_contact_summary || "Analysis in progress..."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-blue-500/5 border-blue-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <TrendingUp className="w-5 h-5 text-blue-500" />
                                Body Language
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {session.body_language_summary || "Analysis in progress..."}
                            </p>
                        </CardContent>
                    </Card>

                    <Card className="bg-green-500/5 border-green-500/20">
                        <CardHeader className="pb-3">
                            <CardTitle className="text-base flex items-center gap-2">
                                <Mic className="w-5 h-5 text-green-500" />
                                Confidence
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-sm text-muted-foreground">
                                {session.confidence_summary || "Analysis in progress..."}
                            </p>
                        </CardContent>
                    </Card>
                </div>

                {/* 6Q Analysis */}
                {session.six_q_score && (
                    <div className="mb-8">
                        <SixQAnalysis
                            scores={session.six_q_score}
                            cluster={session.personality_cluster}
                        />
                    </div>
                )}

                {/* Individual Answers */}
                <div className="space-y-4">
                    <h2 className="text-2xl font-bold mb-4">Your Answers</h2>
                    {answers.map((answer, index) => (
                        <Card key={answer.id} className="bg-card/30 backdrop-blur-xl border-border/50">
                            <CardHeader className="cursor-pointer" onClick={() => toggleAnswer(answer.id)}>
                                <div className="flex items-center justify-between">
                                    <div className="flex-1">
                                        <div className="text-sm text-violet-500 font-semibold mb-1">
                                            Question {answer.question_number}
                                        </div>
                                        <div className="font-medium">{answer.question}</div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {answer.delivery_score && (
                                            <div className="text-center">
                                                <div className={`text-2xl font-bold ${getScoreColor(answer.delivery_score)}`}>
                                                    {answer.delivery_score}
                                                </div>
                                                <div className="text-xs text-muted-foreground">Score</div>
                                            </div>
                                        )}
                                        {expandedAnswers.has(answer.id) ? (
                                            <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                        )}
                                    </div>
                                </div>
                            </CardHeader>

                            {expandedAnswers.has(answer.id) && (
                                <CardContent className="space-y-6 pt-0">
                                    {/* Video */}
                                    {answer.video_url && (
                                        <div className="aspect-video bg-black rounded-lg overflow-hidden">
                                            <video src={answer.video_url} controls className="w-full h-full object-cover" />
                                        </div>
                                    )}

                                    {/* Scores */}
                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="text-center p-4 rounded-lg bg-background/50">
                                            <div className={`text-2xl font-bold ${getScoreColor(answer.delivery_score || 0)}`}>
                                                {answer.delivery_score || "N/A"}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">Delivery</div>
                                        </div>
                                        <div className="text-center p-4 rounded-lg bg-background/50">
                                            <div className={`text-2xl font-bold ${getScoreColor(answer.body_language_score || 0)}`}>
                                                {answer.body_language_score || "N/A"}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">Body Language</div>
                                        </div>
                                        <div className="text-center p-4 rounded-lg bg-background/50">
                                            <div className={`text-2xl font-bold ${getScoreColor(answer.confidence_score || 0)}`}>
                                                {answer.confidence_score || "N/A"}
                                            </div>
                                            <div className="text-xs text-muted-foreground mt-1">Confidence</div>
                                        </div>
                                    </div>

                                    {/* Model Answer */}
                                    {answer.model_answer && (
                                        <Card className="bg-blue-500/5 border-blue-500/20">
                                            <CardHeader className="pb-2">
                                                <CardTitle className="text-sm flex items-center gap-2">
                                                    <Award className="w-4 h-4 text-blue-500" />
                                                    Model Answer
                                                </CardTitle>
                                            </CardHeader>
                                            <CardContent>
                                                <p className="text-sm text-muted-foreground">{answer.model_answer}</p>
                                            </CardContent>
                                        </Card>
                                    )}

                                    {/* What's Good / What's Wrong */}
                                    <div className="grid md:grid-cols-2 gap-4">
                                        {answer.whats_good && answer.whats_good.length > 0 && (
                                            <Card className="bg-green-500/5 border-green-500/20">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm flex items-center gap-2 text-green-600 dark:text-green-400">
                                                        <CheckCircle2 className="w-4 h-4" />
                                                        What's Good
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {answer.whats_good.map((item: string, idx: number) => (
                                                            <li key={idx} className="flex gap-2 text-sm">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-green-500 mt-2 shrink-0"></span>
                                                                <span className="text-muted-foreground">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}

                                        {answer.whats_wrong && answer.whats_wrong.length > 0 && (
                                            <Card className="bg-red-500/5 border-red-500/20">
                                                <CardHeader className="pb-2">
                                                    <CardTitle className="text-sm flex items-center gap-2 text-red-600 dark:text-red-400">
                                                        <AlertCircle className="w-4 h-4" />
                                                        What's Wrong
                                                    </CardTitle>
                                                </CardHeader>
                                                <CardContent>
                                                    <ul className="space-y-2">
                                                        {answer.whats_wrong.map((item: string, idx: number) => (
                                                            <li key={idx} className="flex gap-2 text-sm">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-red-500 mt-2 shrink-0"></span>
                                                                <span className="text-muted-foreground">{item}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </CardContent>
                                            </Card>
                                        )}
                                    </div>
                                </CardContent>
                            )}
                        </Card>
                    ))}
                </div>
            </main>
        </div>
    );
};

export default MultiQuestionResults;
