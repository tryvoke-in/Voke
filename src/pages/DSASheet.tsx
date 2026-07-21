import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    CheckCircle2, Code2, Calendar, Trophy, Flame, Hash, Bookmark, BookmarkCheck, Play
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import { DSA_QUESTIONS, DSAQuestion } from "@/data/dsaQuestions";
import { toast } from "sonner";

const PLANS = {
    "2_months": { label: "2 Months Plan", days: 60, questionsPerDay: Math.ceil(375 / 60) },
    "2.5_months": { label: "2.5 Months Plan", days: 75, questionsPerDay: 5 },
    "3_months": { label: "3 Months Plan", days: 90, questionsPerDay: Math.ceil(375 / 90) },
    "4_months": { label: "4 Months Plan", days: 120, questionsPerDay: Math.ceil(375 / 120) },
    "6_months": { label: "6 Months Plan", days: 180, questionsPerDay: Math.ceil(375 / 180) },
};

const TOPICS = Array.from(new Set(DSA_QUESTIONS.map(q => q.topic)));

const DSASheet = () => {
    const navigate = useNavigate();
    const [selectedPlan, setSelectedPlan] = useState<keyof typeof PLANS>("2.5_months");
    const [viewMode, setViewMode] = useState<"daily" | "topic">("daily");
    const [currentDay, setCurrentDay] = useState(1);
    const [selectedTopic, setSelectedTopic] = useState<string>(TOPICS[0]);
    const [solvedIds, setSolvedIds] = useState<Set<number>>(new Set());
    const [reviewedIds, setReviewedIds] = useState<Set<number>>(new Set());
    const [userId, setUserId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const loadUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (user) {
                setUserId(user.id);
                const { data: solved } = await supabase
                    .from('solved_questions' as any)
                    .select('question_id')
                    .eq('user_id', user.id);
                if (solved) setSolvedIds(new Set(solved.map((q: any) => q.question_id)));

                const { data: reviewed } = await supabase
                    .from('review_questions' as any)
                    .select('question_id')
                    .eq('user_id', user.id);
                if (reviewed) setReviewedIds(new Set(reviewed.map((q: any) => q.question_id)));
            }
            setIsLoading(false);
        };
        loadUserData();
    }, []);

    const toggleReviewStatus = async (questionId: number) => {
        if (!userId) {
            toast.error("Please login to save for review");
            return;
        }

        const isCurrentlyReviewed = reviewedIds.has(questionId);
        if (isCurrentlyReviewed) {
            setReviewedIds(prev => {
                const next = new Set(prev);
                next.delete(questionId);
                return next;
            });
            await supabase.from('review_questions' as any).delete().eq('user_id', userId).eq('question_id', questionId);
        } else {
            setReviewedIds(prev => new Set([...prev, questionId]));
            await supabase.from('review_questions' as any).insert({ user_id: userId, question_id: questionId });
        }
    };

    const markQuestionAsSolved = async (questionId: number, title: string, difficulty: string, url: string) => {
        if (!userId) return;

        // Optimistically update UI
        setSolvedIds(prev => new Set([...prev, questionId]));

        // Save to database
        await supabase
            .from('solved_questions' as any)
            .insert({
                user_id: userId,
                question_id: questionId,
                question_title: title,
                difficulty: difficulty,
                platform_url: url
            })
            .select();
    };

    const getDifficultyColor = (diff: string) => {
        switch (diff) {
            case "Easy": return "text-emerald-500 bg-emerald-500/10 border-emerald-500/20";
            case "Medium": return "text-amber-500 bg-amber-500/10 border-amber-500/20";
            case "Hard": return "text-red-500 bg-red-500/10 border-red-500/20";
            default: return "text-gray-500";
        }
    };

    const planData = PLANS[selectedPlan];
    
    // Calculate questions based on view mode
    let displayedQuestions: DSAQuestion[] = [];
    if (viewMode === "daily") {
        const startIdx = (currentDay - 1) * planData.questionsPerDay;
        const endIdx = startIdx + planData.questionsPerDay;
        displayedQuestions = DSA_QUESTIONS.slice(startIdx, endIdx);
    } else {
        displayedQuestions = DSA_QUESTIONS.filter(q => q.topic === selectedTopic);
    }

    const totalSolved = solvedIds.size;
    const progressPercentage = (totalSolved / DSA_QUESTIONS.length) * 100;

    if (isLoading) {
        return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-violet-500/30">
            <Navbar />
            <div className="flex-1 flex w-full min-w-0 relative">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <main className="flex-1 pt-24 px-4 pb-12 container mx-auto max-w-7xl w-full">
                        
                        {/* Header */}
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-fuchsia-500/10 text-fuchsia-500 text-sm font-medium border border-fuchsia-500/20 mb-4">
                                    <Code2 className="w-4 h-4" />
                                    Shradha Ma'am's Sheet
                                </div>
                                <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-to-r from-violet-600 via-fuchsia-600 to-indigo-600 bg-clip-text text-transparent">
                                    Ultimate DSA Preparation
                                </h1>
                                <p className="text-muted-foreground mt-2 text-lg">
                                    Master Data Structures and Algorithms with a structured daily plan tailored for you.
                                </p>
                            </div>

                            <Card className="w-full md:w-auto bg-card/50 backdrop-blur-sm border-primary/10 min-w-[300px]">
                                <CardContent className="p-4">
                                    <div className="flex justify-between items-center mb-2">
                                        <span className="text-sm font-medium text-muted-foreground">Overall Progress</span>
                                        <span className="text-sm font-bold text-primary">{Math.round(progressPercentage)}%</span>
                                    </div>
                                    <Progress value={progressPercentage} className="h-2 mb-2" />
                                    <div className="flex justify-between text-xs text-muted-foreground">
                                        <span>{totalSolved} Solved</span>
                                        <span>{DSA_QUESTIONS.length} Total</span>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Controls */}
                        <div className="sticky top-20 z-30 mb-8 bg-card/80 backdrop-blur-md border border-border/50 p-4 rounded-xl shadow-lg flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="flex items-center gap-4 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                                <Select value={selectedPlan} onValueChange={(val: any) => { setSelectedPlan(val); setCurrentDay(1); }}>
                                    <SelectTrigger className="w-[180px] bg-background">
                                        <Calendar className="w-4 h-4 mr-2 text-violet-500" />
                                        <SelectValue placeholder="Select Plan" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {Object.entries(PLANS).map(([key, plan]) => (
                                            <SelectItem key={key} value={key}>{plan.label} ({plan.questionsPerDay} Q/day)</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="flex bg-background/50 rounded-lg p-1 border">
                                    <button 
                                        className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", viewMode === 'daily' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground')}
                                        onClick={() => setViewMode('daily')}
                                    >
                                        Daily Plan
                                    </button>
                                    <button 
                                        className={cn("px-4 py-1.5 text-sm font-medium rounded-md transition-all", viewMode === 'topic' ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground hover:text-foreground')}
                                        onClick={() => setViewMode('topic')}
                                    >
                                        Topic Wise
                                    </button>
                                </div>
                            </div>

                            {viewMode === "topic" && (
                                <Select value={selectedTopic} onValueChange={setSelectedTopic}>
                                    <SelectTrigger className="w-[200px] bg-background">
                                        <Hash className="w-4 h-4 mr-2 text-fuchsia-500" />
                                        <SelectValue placeholder="Select Topic" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {TOPICS.map((topic) => (
                                            <SelectItem key={topic} value={topic}>{topic}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            )}
                        </div>

                        {/* Pagination for Daily Mode */}
                        {viewMode === "daily" && (
                            <div className="flex items-center justify-between mb-6 bg-card/30 p-2 rounded-xl border border-border/50">
                                <Button 
                                    variant="ghost" 
                                    disabled={currentDay === 1}
                                    onClick={() => setCurrentDay(d => Math.max(1, d - 1))}
                                >
                                    Previous Day
                                </Button>
                                <div className="flex items-center gap-2 font-medium">
                                    <div className="w-8 h-8 rounded-full bg-violet-500/10 text-violet-500 flex items-center justify-center border border-violet-500/20">
                                        {currentDay}
                                    </div>
                                    <span className="text-muted-foreground">of {planData.days} Days</span>
                                </div>
                                <Button 
                                    variant="ghost" 
                                    disabled={currentDay === planData.days}
                                    onClick={() => setCurrentDay(d => Math.min(planData.days, d + 1))}
                                >
                                    Next Day
                                </Button>
                            </div>
                        )}

                        {/* Questions List */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {displayedQuestions.map((question) => {
                                    const isSolved = solvedIds.has(question.id);
                                    const isReviewed = reviewedIds.has(question.id);
                                    
                                    return (
                                        <motion.div
                                            key={question.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.95 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Card className={cn(
                                                "h-full hover:shadow-xl transition-all duration-300 hover:-translate-y-1 group cursor-pointer border-l-4 border-y border-r border-border/60 backdrop-blur-sm overflow-hidden flex flex-col",
                                                isSolved ? "bg-emerald-50/50 dark:bg-emerald-950/10 border-l-emerald-500 ring-1 ring-emerald-500/20" : "bg-card/50 border-l-violet-500"
                                            )}>
                                                <CardHeader className="pb-3 relative flex-none">
                                                    <div className="flex justify-between items-start mb-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={cn("rounded-md border-0 px-2.5 py-0.5 font-semibold", getDifficultyColor(question.difficulty))}>
                                                                {question.difficulty}
                                                            </Badge>
                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn("w-8 h-8 rounded-full", isReviewed ? "text-amber-500 bg-amber-500/10" : "text-muted-foreground")}
                                                                onClick={(e) => { e.stopPropagation(); toggleReviewStatus(question.id); }}
                                                            >
                                                                {isReviewed ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                                                            </Button>
                                                        </div>
                                                        {isSolved && (
                                                            <Badge className="bg-emerald-500 text-white border-0">
                                                                <CheckCircle2 className="w-3 h-3 mr-1" /> Solved
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <CardTitle className="text-lg font-bold leading-tight group-hover:text-violet-500 transition-colors">
                                                        {question.title}
                                                    </CardTitle>
                                                    {viewMode === 'daily' && (
                                                        <CardDescription className="text-xs text-muted-foreground mt-1">
                                                            Topic: {question.topic}
                                                        </CardDescription>
                                                    )}
                                                </CardHeader>
                                                
                                                <CardContent className="space-y-4 flex-1">
                                                    {question.companies && question.companies.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {question.companies.slice(0, 3).map(company => (
                                                                <span key={company} className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                                                    {company}
                                                                </span>
                                                            ))}
                                                            {question.companies.length > 3 && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-muted text-muted-foreground">
                                                                    +{question.companies.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </CardContent>

                                                <CardFooter className="pt-0 flex-none">
                                                    <Button
                                                        className={cn(
                                                            "w-full shadow-none font-semibold",
                                                            isSolved
                                                                ? "bg-emerald-500 hover:bg-emerald-600 text-white"
                                                                : "bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-lg shadow-indigo-500/20"
                                                        )}
                                                        onClick={() => navigate(
                                                            `/playground?title=${encodeURIComponent(question.title)}&difficulty=${question.difficulty}&questionId=${question.id}&from=dsa-sheet`
                                                        )}
                                                    >
                                                        {isSolved ? (
                                                            <><CheckCircle2 className="w-4 h-4 mr-2" /> Review in Playground</>
                                                        ) : (
                                                            <><Play className="w-4 h-4 mr-2 fill-current" /> Solve in Playground</>
                                                        )}
                                                    </Button>
                                                </CardFooter>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                        
                        {displayedQuestions.length === 0 && (
                            <div className="text-center py-12 text-muted-foreground bg-card/30 rounded-xl border border-dashed">
                                No questions found for the selected criteria.
                            </div>
                        )}
                        
                    </main>
                </div>
            </div>
        </div>
    );
};

export default DSASheet;
