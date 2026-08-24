import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    ArrowLeft, Search, Filter, ExternalLink, Code2,
    Briefcase, CheckCircle2, Trophy,
    Check, ChevronsUpDown, Bookmark, BookmarkCheck,
    Hash, Play, Sparkles
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Navbar } from "@/components/Navbar";
import { toast } from "sonner";
import { Sidebar } from "@/components/Sidebar";
import { Progress } from "@/components/ui/progress";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";

import { QUESTIONS, COMPANIES, DIFFICULTIES } from "@/data/questions";

// Derive Topics
const TOPICS = ["All", ...Array.from(new Set(QUESTIONS.flatMap(q => q.tags))).sort()];

const QuestionPractice = () => {
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCompany, setSelectedCompany] = useState("All");
    const [selectedDifficulty, setSelectedDifficulty] = useState("All");
    const [selectedTopic, setSelectedTopic] = useState("All");
    const [openCompany, setOpenCompany] = useState(false);
    const [openTopic, setOpenTopic] = useState(false);

    // Loading state
    const [isLoading, setIsLoading] = useState(true);
    const [loadingPhase, setLoadingPhase] = useState(0);

    // Solved questions tracking
    const [solvedQuestionIds, setSolvedQuestionIds] = useState<Set<number>>(new Set());
    const [reviewedQuestionIds, setReviewedQuestionIds] = useState<Set<number>>(new Set());
    const [userId, setUserId] = useState<string | null>(null);

    // Fetch user and solved questions
    useEffect(() => {
        const fetchUserAndSolvedQuestions = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    setUserId(user.id);

                    // Fetch solved questions
                    const { data: solvedQuestions } = await supabase
                        .from('solved_questions' as any)
                        .select('question_id')
                        .eq('user_id', user.id);

                    if (solvedQuestions) {
                        setSolvedQuestionIds(new Set(solvedQuestions.map((q: any) => q.question_id)));
                    }

                    // Fetch reviewed questions
                    const { data: reviewedQuestions } = await supabase
                        .from('review_questions' as any)
                        .select('question_id')
                        .eq('user_id', user.id);

                    if (reviewedQuestions) {
                        setReviewedQuestionIds(new Set(reviewedQuestions.map((q: any) => q.question_id)));
                    }
                }
            } catch (err) {
                console.error("Failed to load user questions", err);
            } finally {
                setIsLoading(false);
            }
        };
        fetchUserAndSolvedQuestions();
    }, []);

    useEffect(() => {
        const interval = setInterval(() => {
            setLoadingPhase(p => p + 1);
        }, 400);

        const timer = setTimeout(() => {
            setIsLoading(false);
            clearInterval(interval);
        }, 1200);

        return () => {
            clearTimeout(timer);
            clearInterval(interval);
        };
    }, []);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 12;

    // List Filters
    const [showOnlyReviewed, setShowOnlyReviewed] = useState(false);

    const filteredQuestions = QUESTIONS.filter(q => {
        const matchesSearch = q.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            q.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));

        const matchesCompany = selectedCompany === "All" || q.companies.includes(selectedCompany);
        const matchesDifficulty = selectedDifficulty === "All" || q.difficulty === selectedDifficulty;
        const matchesTopic = selectedTopic === "All" || q.tags.includes(selectedTopic);
        const matchesReviewed = !showOnlyReviewed || reviewedQuestionIds.has(q.id);

        return matchesSearch && matchesCompany && matchesDifficulty && matchesTopic && matchesReviewed;
    });

    // Calculate pagination
    const totalPages = Math.ceil(filteredQuestions.length / itemsPerPage);
    const paginatedQuestions = filteredQuestions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    // Reset page when filters change
    if (currentPage > totalPages && totalPages > 0) {
        setCurrentPage(1);
    }

    const getDifficultyBadgeStyle = (diff: string) => {
        switch (diff) {
            case "Easy":
                return "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25 font-bold";
            case "Medium":
                return "bg-amber-500/10 text-amber-700 dark:text-amber-400 border border-amber-500/25 font-bold";
            case "Hard":
                return "bg-rose-500/10 text-rose-700 dark:text-rose-400 border border-rose-500/25 font-bold";
            default:
                return "bg-muted text-muted-foreground border border-border/50";
        }
    };

    const getDifficultyCardBorder = (diff: string, isSolved: boolean, isReviewed: boolean) => {
        if (isSolved) {
            return "border-emerald-500/40 bg-emerald-500/[0.03] dark:bg-emerald-950/20 ring-1 ring-emerald-500/20 shadow-emerald-500/5";
        }
        if (isReviewed) {
            return "border-amber-500/40 bg-amber-500/[0.02] dark:bg-amber-950/15 ring-1 ring-amber-500/20 shadow-amber-500/5";
        }
        switch (diff) {
            case "Easy":
                return "border-border/70 hover:border-emerald-500/50 hover:shadow-emerald-500/10";
            case "Medium":
                return "border-border/70 hover:border-amber-500/50 hover:shadow-amber-500/10";
            case "Hard":
                return "border-border/70 hover:border-rose-500/50 hover:shadow-rose-500/10";
            default:
                return "border-border/70 hover:border-border";
        }
    };

    // Toggle solved status
    const toggleSolvedStatus = async (questionId: number, title: string, difficulty: string, url?: string) => {
        if (!userId) {
            toast.error("Please login to track your progress");
            return;
        }

        const isCurrentlySolved = solvedQuestionIds.has(questionId);
        if (isCurrentlySolved) {
            setSolvedQuestionIds(prev => {
                const next = new Set(prev);
                next.delete(questionId);
                return next;
            });
            await supabase.from('solved_questions' as any).delete().eq('user_id', userId).eq('question_id', questionId);
            window.dispatchEvent(new Event("dsa_progress_updated"));
            toast.info("Problem marked as un-solved");
        } else {
            setSolvedQuestionIds(prev => new Set([...prev, questionId]));
            await supabase.from('solved_questions' as any).insert({
                user_id: userId,
                question_id: questionId,
                question_title: title,
                difficulty: difficulty,
                platform_url: url || `https://leetcode.com/problemset/all/?search=${encodeURIComponent(title)}`,
                solved_at: new Date().toISOString()
            });
            window.dispatchEvent(new Event("dsa_progress_updated"));
            toast.success("Problem marked as solved! 🎉");
        }
    };

    // Toggle review status
    const toggleReviewStatus = async (questionId: number) => {
        if (!userId) {
            toast.error("Please login to save for review");
            return;
        }

        const isCurrentlyReviewed = reviewedQuestionIds.has(questionId);

        if (isCurrentlyReviewed) {
            // Remove from review
            setReviewedQuestionIds(prev => {
                const next = new Set(prev);
                next.delete(questionId);
                return next;
            });

            await supabase
                .from('review_questions' as any)
                .delete()
                .eq('user_id', userId)
                .eq('question_id', questionId);
            toast.info("Removed from review list");
        } else {
            // Add to review
            setReviewedQuestionIds(prev => new Set([...prev, questionId]));

            await supabase
                .from('review_questions' as any)
                .insert({
                    user_id: userId,
                    question_id: questionId
                });
            toast.success("Added to review list ⭐");
        }
    };

    // Calculate solved stats
    const solvedStats = {
        easy: QUESTIONS.filter(q => solvedQuestionIds.has(q.id) && q.difficulty === 'Easy').length,
        medium: QUESTIONS.filter(q => solvedQuestionIds.has(q.id) && q.difficulty === 'Medium').length,
        hard: QUESTIONS.filter(q => solvedQuestionIds.has(q.id) && q.difficulty === 'Hard').length,
        total: solvedQuestionIds.size
    };

    const progressPercentage = Math.min(100, Math.round((solvedStats.total / QUESTIONS.length) * 100));

    if (isLoading) {
        const companies = [
            { name: "GOOGLE", color: "text-blue-500 dark:text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20", logo: "https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg" },
            { name: "AMAZON", color: "text-amber-500 dark:text-orange-400", bg: "bg-orange-500/10", border: "border-orange-500/20", logo: "https://upload.wikimedia.org/wikipedia/commons/4/4a/Amazon_icon.svg" },
            { name: "META", color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-600/10", border: "border-blue-600/20", logo: "https://upload.wikimedia.org/wikipedia/commons/a/ab/Meta-Logo.png" },
            { name: "APPLE", color: "text-foreground", bg: "bg-muted/40", border: "border-border/60", logo: "https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg" },
            { name: "NETFLIX", color: "text-red-500", bg: "bg-red-600/10", border: "border-red-600/20", logo: "https://upload.wikimedia.org/wikipedia/commons/7/75/Netflix_icon.svg" },
            { name: "MICROSOFT", color: "text-emerald-500 dark:text-emerald-400", bg: "bg-emerald-500/10", border: "border-emerald-500/20", logo: "https://upload.wikimedia.org/wikipedia/commons/4/44/Microsoft_logo.svg" },
        ];

        const currentCompany = companies[loadingPhase % companies.length];

        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center relative overflow-hidden font-sans">
                {/* Ambient glow */}
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-sky-500/10 rounded-full blur-[120px] pointer-events-none" />

                <div className="relative z-10 flex flex-col items-center">
                    <div className="relative mb-8">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={loadingPhase}
                                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 1.1, y: -10 }}
                                transition={{ duration: 0.35, ease: "easeOut" }}
                                className={cn(
                                    "w-56 h-56 rounded-3xl border flex flex-col items-center justify-center backdrop-blur-xl shadow-2xl gap-5 bg-card/80",
                                    currentCompany.border,
                                    currentCompany.bg
                                )}
                            >
                                <div className="w-20 h-20 relative flex items-center justify-center">
                                    <img
                                        src={currentCompany.logo}
                                        alt={currentCompany.name}
                                        className="w-full h-full object-contain filter drop-shadow-md"
                                    />
                                </div>
                                <h2 className={cn("text-xl font-extrabold tracking-widest", currentCompany.color)}>
                                    {currentCompany.name}
                                </h2>
                            </motion.div>
                        </AnimatePresence>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-muted-foreground font-semibold tracking-widest uppercase">
                        <span className="relative flex h-2.5 w-2.5">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-sky-500"></span>
                        </span>
                        Connecting to practice arena...
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans selection:bg-sky-500/30">
            <Navbar />

            {/* Sidebar + Main Content Layout */}
            <div className="flex-1 flex w-full min-w-0 relative">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0">
                    <main className="flex-1 pt-24 px-4 sm:px-6 lg:px-8 pb-16 container mx-auto max-w-7xl w-full">

                        {/* Top Hero & Stats Row */}
                        <div className="grid lg:grid-cols-3 gap-6 mb-8 items-stretch">
                            {/* Main Header Card */}
                            <motion.div
                                initial={{ opacity: 0, y: 15 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="lg:col-span-2 flex flex-col justify-center space-y-4 bg-gradient-to-br from-sky-500/5 via-indigo-500/5 to-transparent p-6 sm:p-8 rounded-3xl border border-border/70 shadow-xs backdrop-blur-xs relative overflow-hidden"
                            >
                                <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/10 rounded-full blur-[80px] pointer-events-none -translate-y-1/2 translate-x-1/3" />

                                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 text-sky-600 dark:text-sky-400 text-xs font-semibold border border-sky-500/20 w-fit">
                                    <Code2 className="w-3.5 h-3.5" />
                                    <span>Coding Arena • 1,800+ Problems</span>
                                </div>

                                <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-foreground leading-[1.15]">
                                    Master the Code. <br className="hidden sm:inline" />
                                    <span className="bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 dark:from-sky-400 dark:via-blue-400 dark:to-indigo-300 bg-clip-text text-transparent">
                                        Crack Your Interviews.
                                    </span>
                                </h1>

                                <p className="text-sm sm:text-base text-muted-foreground max-w-xl leading-relaxed">
                                    Curated technical challenges with multi-company tagging, verified test cases, and real-time execution in our playground.
                                </p>
                            </motion.div>

                            {/* Stats Card */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.15 }}
                            >
                                <Card className="h-full border border-border/70 bg-card text-card-foreground shadow-xs rounded-3xl p-6 flex flex-col justify-between space-y-5 relative overflow-hidden">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                                                <Trophy className="w-4 h-4" />
                                            </div>
                                            <span className="font-bold text-base text-foreground">Your Progress</span>
                                        </div>
                                        <span className="text-xs font-bold text-sky-600 dark:text-sky-400 bg-sky-500/10 px-2.5 py-0.5 rounded-full border border-sky-500/20">
                                            {progressPercentage}% Completed
                                        </span>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs font-medium">
                                            <span className="text-muted-foreground">Total Solved</span>
                                            <span className="font-bold text-foreground">{solvedStats.total} / {QUESTIONS.length}</span>
                                        </div>
                                        <Progress value={progressPercentage} className="h-2 bg-muted/60" />
                                    </div>

                                    {/* 3 Difficulty Metric Boxes */}
                                    <div className="grid grid-cols-3 gap-2.5">
                                        <div className="p-3 rounded-2xl bg-emerald-500/10 dark:bg-emerald-500/15 border border-emerald-500/25 text-center transition-transform hover:scale-[1.02]">
                                            <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400">{solvedStats.easy}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">Easy</div>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-amber-500/10 dark:bg-amber-500/15 border border-amber-500/25 text-center transition-transform hover:scale-[1.02]">
                                            <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400">{solvedStats.medium}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-amber-700/80 dark:text-amber-300/80 mt-0.5">Med</div>
                                        </div>
                                        <div className="p-3 rounded-2xl bg-rose-500/10 dark:bg-rose-500/15 border border-rose-500/25 text-center transition-transform hover:scale-[1.02]">
                                            <div className="text-xl sm:text-2xl font-black text-rose-600 dark:text-rose-400">{solvedStats.hard}</div>
                                            <div className="text-[10px] font-bold uppercase tracking-wider text-rose-700/80 dark:text-rose-300/80 mt-0.5">Hard</div>
                                        </div>
                                    </div>
                                </Card>
                            </motion.div>
                        </div>

                        {/* Search & Filtering Bar */}
                        <div className="mb-8">
                            <div className="bg-card border border-border/70 p-3 sm:p-4 rounded-2xl shadow-xs flex flex-col xl:flex-row gap-3 items-center justify-between">

                                {/* Search Input */}
                                <div className="relative w-full xl:max-w-sm group shrink-0">
                                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-sky-500 transition-colors" />
                                    <Input
                                        placeholder="Search by title, topic, or keywords..."
                                        className="pl-10 h-10 bg-muted/40 border-border/60 focus:border-sky-500 focus:bg-background rounded-xl text-xs sm:text-sm transition-all"
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
                                    />
                                </div>

                                {/* Filter Controls */}
                                <div className="flex items-center flex-wrap gap-2 w-full xl:w-auto overflow-x-auto no-scrollbar [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

                                    {/* Difficulty Toggle Pills */}
                                    <div className="bg-muted/70 dark:bg-muted/40 p-1 rounded-xl flex items-center gap-1 border border-border/40 shrink-0">
                                        {DIFFICULTIES.map(diff => {
                                            const isActive = selectedDifficulty === diff;
                                            return (
                                                <button
                                                    key={diff}
                                                    onClick={() => { setSelectedDifficulty(diff); setCurrentPage(1); }}
                                                    className={cn(
                                                        "px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer",
                                                        isActive
                                                            ? (diff === "Easy"
                                                                ? "bg-emerald-500 text-white shadow-xs"
                                                                : diff === "Medium"
                                                                    ? "bg-amber-500 text-white shadow-xs"
                                                                    : diff === "Hard"
                                                                        ? "bg-rose-500 text-white shadow-xs"
                                                                        : "bg-primary text-primary-foreground shadow-xs")
                                                            : "text-muted-foreground hover:text-foreground hover:bg-background/60"
                                                    )}
                                                >
                                                    {diff}
                                                </button>
                                            );
                                        })}
                                    </div>

                                    {/* Company Popover */}
                                    <Popover open={openCompany} onOpenChange={setOpenCompany}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openCompany}
                                                className="h-9 px-3 text-xs bg-background/80 hover:bg-background border-border/70 rounded-xl justify-between min-w-[160px] font-semibold"
                                            >
                                                {selectedCompany === "All" ? (
                                                    <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                                                        <Briefcase className="w-3.5 h-3.5 text-muted-foreground" /> Filter Company
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-foreground truncate">
                                                        <Briefcase className="w-3.5 h-3.5 text-sky-500" /> {selectedCompany}
                                                    </span>
                                                )}
                                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0 rounded-xl">
                                            <Command>
                                                <CommandInput placeholder="Search company..." />
                                                <CommandList>
                                                    <CommandEmpty>No company found.</CommandEmpty>
                                                    <CommandGroup>
                                                        <CommandItem
                                                            value="All"
                                                            onSelect={() => {
                                                                setSelectedCompany("All");
                                                                setOpenCompany(false);
                                                                setCurrentPage(1);
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    "mr-2 h-4 w-4",
                                                                    selectedCompany === "All" ? "opacity-100" : "opacity-0"
                                                                )}
                                                            />
                                                            All Companies
                                                        </CommandItem>
                                                        {COMPANIES.filter(c => c !== "All").map((company) => (
                                                            <CommandItem
                                                                key={company}
                                                                value={company}
                                                                onSelect={() => {
                                                                    setSelectedCompany(company);
                                                                    setOpenCompany(false);
                                                                    setCurrentPage(1);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedCompany === company ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {company}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {/* Topic Popover */}
                                    <Popover open={openTopic} onOpenChange={setOpenTopic}>
                                        <PopoverTrigger asChild>
                                            <Button
                                                variant="outline"
                                                role="combobox"
                                                aria-expanded={openTopic}
                                                className="h-9 px-3 text-xs bg-background/80 hover:bg-background border-border/70 rounded-xl justify-between min-w-[150px] font-semibold"
                                            >
                                                {selectedTopic === "All" ? (
                                                    <span className="flex items-center gap-1.5 text-muted-foreground truncate">
                                                        <Hash className="w-3.5 h-3.5 text-muted-foreground" /> Filter Topic
                                                    </span>
                                                ) : (
                                                    <span className="flex items-center gap-1.5 text-foreground truncate">
                                                        <Hash className="w-3.5 h-3.5 text-indigo-500" /> {selectedTopic}
                                                    </span>
                                                )}
                                                <ChevronsUpDown className="ml-2 h-3.5 w-3.5 shrink-0 opacity-50" />
                                            </Button>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-[200px] p-0 rounded-xl">
                                            <Command>
                                                <CommandInput placeholder="Search topic..." />
                                                <CommandList>
                                                    <CommandEmpty>No topic found.</CommandEmpty>
                                                    <CommandGroup>
                                                        {TOPICS.map((topic) => (
                                                            <CommandItem
                                                                key={topic}
                                                                value={topic}
                                                                onSelect={() => {
                                                                    setSelectedTopic(topic);
                                                                    setOpenTopic(false);
                                                                    setCurrentPage(1);
                                                                }}
                                                            >
                                                                <Check
                                                                    className={cn(
                                                                        "mr-2 h-4 w-4",
                                                                        selectedTopic === topic ? "opacity-100" : "opacity-0"
                                                                    )}
                                                                />
                                                                {topic === "All" ? "All Topics" : topic}
                                                            </CommandItem>
                                                        ))}
                                                    </CommandGroup>
                                                </CommandList>
                                            </Command>
                                        </PopoverContent>
                                    </Popover>

                                    {/* My List Bookmark Filter */}
                                    <Button
                                        variant={showOnlyReviewed ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => {
                                            setShowOnlyReviewed(!showOnlyReviewed);
                                            setCurrentPage(1);
                                        }}
                                        className={cn(
                                            "h-9 px-3.5 text-xs rounded-xl font-semibold gap-1.5 transition-all",
                                            showOnlyReviewed
                                                ? "bg-amber-500 hover:bg-amber-600 text-white border-amber-500 shadow-xs"
                                                : "border-border/70 hover:bg-amber-500/10 hover:text-amber-600 dark:hover:text-amber-400 hover:border-amber-500/30"
                                        )}
                                    >
                                        <Bookmark className={cn("w-3.5 h-3.5", showOnlyReviewed && "fill-current")} />
                                        <span>My List</span>
                                    </Button>

                                    {/* Clear Filters */}
                                    {(selectedCompany !== "All" || selectedDifficulty !== "All" || selectedTopic !== "All" || searchQuery || showOnlyReviewed) && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => {
                                                setSelectedCompany("All");
                                                setSelectedDifficulty("All");
                                                setSelectedTopic("All");
                                                setSearchQuery("");
                                                setShowOnlyReviewed(false);
                                                setCurrentPage(1);
                                            }}
                                            className="h-9 px-2 text-xs text-muted-foreground hover:text-destructive font-semibold"
                                            title="Clear all filters"
                                        >
                                            <Filter className="w-3.5 h-3.5 mr-1" />
                                            <span>Reset</span>
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Questions Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence mode="popLayout">
                                {paginatedQuestions.map((question) => {
                                    const isSolved = solvedQuestionIds.has(question.id);
                                    const isReviewed = reviewedQuestionIds.has(question.id);

                                    return (
                                        <motion.div
                                            key={question.id}
                                            layout
                                            initial={{ opacity: 0, scale: 0.96 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            exit={{ opacity: 0, scale: 0.96 }}
                                            transition={{ duration: 0.2 }}
                                        >
                                            <Card className={cn(
                                                "h-full transition-all duration-300 hover:-translate-y-1 hover:shadow-xl rounded-2xl p-5 flex flex-col justify-between group cursor-pointer border",
                                                getDifficultyCardBorder(question.difficulty, isSolved, isReviewed)
                                            )}>
                                                <div className="space-y-4">
                                                    {/* Top Row: Difficulty Pill + Bookmark + Solved Toggle */}
                                                    <div className="flex items-center justify-between gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <Badge variant="outline" className={cn("rounded-lg px-2.5 py-0.5", getDifficultyBadgeStyle(question.difficulty))}>
                                                                {question.difficulty}
                                                            </Badge>

                                                            <Button
                                                                variant="ghost"
                                                                size="icon"
                                                                className={cn(
                                                                    "w-7 h-7 rounded-lg transition-all",
                                                                    isReviewed
                                                                        ? "text-amber-500 bg-amber-500/10 hover:bg-amber-500/20"
                                                                        : "text-muted-foreground hover:text-amber-500 hover:bg-amber-500/10"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleReviewStatus(question.id);
                                                                }}
                                                                title={isReviewed ? "Remove from my list" : "Save to my list"}
                                                            >
                                                                {isReviewed ? (
                                                                    <BookmarkCheck className="w-4 h-4 fill-current" />
                                                                ) : (
                                                                    <Bookmark className="w-4 h-4" />
                                                                )}
                                                            </Button>
                                                        </div>

                                                        {/* Solved Toggle & Platform Badge */}
                                                        <div className="flex items-center gap-1.5">
                                                            <Button
                                                                variant={isSolved ? "default" : "outline"}
                                                                size="sm"
                                                                className={cn(
                                                                    "h-6.5 px-2 text-[11px] font-bold rounded-lg gap-1 transition-all",
                                                                    isSolved
                                                                        ? "bg-emerald-500 hover:bg-emerald-600 text-white border-0 shadow-xs"
                                                                        : "border-border/70 text-muted-foreground hover:text-emerald-600 dark:hover:text-emerald-400 hover:border-emerald-500/30"
                                                                )}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    toggleSolvedStatus(question.id, question.title, question.difficulty, question.url);
                                                                }}
                                                            >
                                                                <CheckCircle2 className={cn("w-3 h-3", isSolved ? "text-white" : "text-muted-foreground")} />
                                                                <span>{isSolved ? "Solved" : "Mark Solved"}</span>
                                                            </Button>

                                                            <div className="flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-md border border-border/50">
                                                                <img
                                                                    src={
                                                                        question.platform === "LeetCode"
                                                                            ? "https://upload.wikimedia.org/wikipedia/commons/1/19/LeetCode_logo_black.png"
                                                                            : question.platform === "Codeforces"
                                                                                ? "https://cdn.iconscout.com/icon/free/png-256/free-code-forces-3628695-3029920.png"
                                                                                : "/favicon.ico"
                                                                    }
                                                                    alt={question.platform}
                                                                    className="w-3 h-3 object-contain opacity-80"
                                                                />
                                                                <span>{question.platform}</span>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Title */}
                                                    <h3 className="text-base sm:text-lg font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors leading-snug line-clamp-2">
                                                        {question.title}
                                                    </h3>

                                                    {/* Companies */}
                                                    {question.companies.length > 0 && (
                                                        <div className="flex flex-wrap gap-1.5">
                                                            {question.companies.slice(0, 3).map(company => (
                                                                <span key={company} className="inline-flex items-center px-2 py-0.5 rounded-md text-[10.5px] font-semibold bg-muted/70 text-muted-foreground border border-border/40">
                                                                    {company}
                                                                </span>
                                                            ))}
                                                            {question.companies.length > 3 && (
                                                                <span className="inline-flex items-center px-1.5 py-0.5 rounded-md text-[10.5px] font-semibold bg-muted/70 text-muted-foreground border border-border/40">
                                                                    +{question.companies.length - 3}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {/* Tags */}
                                                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                                                        {question.tags.slice(0, 3).map(tag => (
                                                            <span key={tag} className="text-[10.5px] font-semibold px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-700 dark:text-sky-300 border border-sky-500/20">
                                                                {tag}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Action Buttons */}
                                                <div className="pt-5 space-y-2">
                                                    <Button
                                                        className={cn(
                                                            "w-full h-10 rounded-xl font-bold text-xs sm:text-sm flex items-center justify-center gap-1.5 transition-all shadow-sm",
                                                            isSolved
                                                                ? "bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/20"
                                                                : "bg-gradient-to-r from-sky-600 via-blue-600 to-indigo-600 hover:from-sky-500 hover:to-indigo-500 text-white shadow-sky-500/20 group/btn"
                                                        )}
                                                        onClick={() => navigate(
                                                            `/playground?title=${encodeURIComponent(question.title)}&difficulty=${question.difficulty}&questionId=${question.id}&mode=problem`
                                                        )}
                                                    >
                                                        {isSolved ? (
                                                            <>
                                                                <CheckCircle2 className="w-4 h-4" />
                                                                <span>Review in Playground</span>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Play className="w-4 h-4 fill-current" />
                                                                <span>Solve in Playground</span>
                                                                <ExternalLink className="w-3.5 h-3.5 opacity-80 group-hover/btn:translate-x-0.5 transition-transform" />
                                                            </>
                                                        )}
                                                    </Button>

                                                    {question.url && (
                                                        <Button
                                                            variant="ghost"
                                                            size="sm"
                                                            className="w-full h-8 text-[11px] font-semibold text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg gap-1"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                window.open(question.url, '_blank');
                                                            }}
                                                        >
                                                            <span>Open on {question.platform}</span>
                                                            <ExternalLink className="w-3 h-3 opacity-70" />
                                                        </Button>
                                                    )}
                                                </div>
                                            </Card>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>

                        {/* Pagination Controls */}
                        {filteredQuestions.length > 0 && (
                            <div className="flex justify-center items-center gap-4 mt-12">
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === 1}
                                    onClick={() => {
                                        setCurrentPage(p => Math.max(1, p - 1));
                                        window.scrollTo({ top: 250, behavior: 'smooth' });
                                    }}
                                    className="w-24 rounded-xl border-border/70 font-semibold"
                                >
                                    <ArrowLeft className="w-3.5 h-3.5 mr-1.5" /> Prev
                                </Button>
                                <span className="text-xs font-bold text-muted-foreground bg-muted/40 px-4 py-1.5 rounded-full border border-border/60">
                                    Page {currentPage} of {totalPages}
                                </span>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={currentPage === totalPages}
                                    onClick={() => {
                                        setCurrentPage(p => Math.min(totalPages, p + 1));
                                        window.scrollTo({ top: 250, behavior: 'smooth' });
                                    }}
                                    className="w-24 rounded-xl border-border/70 font-semibold"
                                >
                                    Next <ArrowLeft className="w-3.5 h-3.5 ml-1.5 rotate-180" />
                                </Button>
                            </div>
                        )}

                        {/* Empty State */}
                        {filteredQuestions.length === 0 && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="text-center py-20 bg-muted/20 rounded-3xl border border-dashed border-border/80 mt-6"
                            >
                                <div className="w-14 h-14 bg-muted/60 rounded-2xl flex items-center justify-center mx-auto mb-4 text-muted-foreground">
                                    <Search className="w-6 h-6" />
                                </div>
                                <h3 className="text-lg font-bold mb-1 text-foreground">No matching questions</h3>
                                <p className="text-xs text-muted-foreground mb-6">No questions found matching your filter criteria.</p>
                                <Button
                                    variant="outline"
                                    onClick={() => {
                                        setSelectedCompany("All");
                                        setSelectedDifficulty("All");
                                        setSelectedTopic("All");
                                        setSearchQuery("");
                                        setShowOnlyReviewed(false);
                                        setCurrentPage(1);
                                    }}
                                    className="px-6 rounded-xl font-semibold text-xs"
                                >
                                    Reset Filters
                                </Button>
                            </motion.div>
                        )}

                    </main>
                </div>
            </div>
        </div>
    );
};

export default QuestionPractice;
