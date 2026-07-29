import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    MapPin, DollarSign, TrendingUp, Sparkles, RefreshCw,
    ArrowLeft, ExternalLink, BookmarkPlus, X, CheckCircle2, Building2,
    Target, Search, Filter, BriefcaseBusiness, Calendar, FileText, Globe
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CreatingPlanLoader } from "@/components/ui/CreatingPlanLoader";
import { Sidebar } from "@/components/Sidebar";

interface JobPosting {
    id: string;
    title: string;
    company: string;
    description: string;
    salary_range: string | null;
    location: string;
    remote_ok: boolean;
    experience_level: string;
    skills_required: string[];
    application_url: string | null;
    source?: string;
    posted_date?: string;
}

interface JobRecommendation {
    id: string;
    job_posting_id: string;
    match_score: number;
    match_reasons: string[];
    skill_gaps: Array<{ skill: string; priority: string; estimated_time: string }>;
    status: string;
    job_postings: JobPosting;
}

export default function JobRecommendations() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [generating, setGenerating] = useState(false);
    const [creatingPlan, setCreatingPlan] = useState(false);
    const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
    const [filteredRecs, setFilteredRecs] = useState<JobRecommendation[]>([]);
    const [filterLevel, setFilterLevel] = useState<string>("all");
    const [filterRemote, setFilterRemote] = useState<string>("all");
    const [filterSource, setFilterSource] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("match_score");
    const [searchQuery, setSearchQuery] = useState("");
    const [hasResume, setHasResume] = useState(false);

    useEffect(() => {
        loadRecommendations();
        checkUserResume();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [recommendations, filterLevel, filterRemote, filterSource, sortBy, searchQuery]);

    const checkUserResume = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data: profile } = await supabase
                .from("profiles")
                .select("resume_url")
                .eq("id", user.id)
                .single();

            const { data: analyses } = await supabase
                .from("resume_analyses")
                .select("id")
                .eq("user_id", user.id)
                .limit(1);

            if (profile?.resume_url || (analyses && analyses.length > 0)) {
                setHasResume(true);
            }
        } catch (e) {
            console.error("Error checking user resume:", e);
        }
    };

    const loadRecommendations = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                navigate("/auth");
                return;
            }

            const { data, error } = await supabase
                .from("job_recommendations")
                .select(`
                  *,
                  job_postings (*)
                `)
                .eq("user_id", user.id)
                .order("match_score", { ascending: false });

            if (error) throw error;

            setRecommendations((data as any) || []);
        } catch (error) {
            console.error("Error loading recommendations:", error);
            toast({
                title: "Error",
                description: "Failed to load job recommendations",
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const generateRecommendations = async () => {
        setGenerating(true);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase.functions.invoke("generate-job-recommendations", {
                body: { userId: user.id, forceRefresh: true },
            });

            if (error) throw error;

            toast({
                title: "Live Jobs Scouting Complete!",
                description: `Fetched & matched ${data?.count || 0} job recommendations tailored to your resume`,
            });

            await loadRecommendations();
        } catch (error: any) {
            console.error("Error generating recommendations:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to generate recommendations",
                variant: "destructive",
            });
        } finally {
            setGenerating(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...recommendations];

        // Search Query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(rec => 
                rec.job_postings?.title?.toLowerCase().includes(query) ||
                rec.job_postings?.company?.toLowerCase().includes(query) ||
                (rec.job_postings?.skills_required && rec.job_postings.skills_required.some((skill: string) => skill.toLowerCase().includes(query)))
            );
        }

        // Filter by experience level
        if (filterLevel !== "all") {
            filtered = filtered.filter(
                (rec) => rec.job_postings?.experience_level === filterLevel
            );
        }

        // Filter by remote
        if (filterRemote === "remote") {
            filtered = filtered.filter((rec) => rec.job_postings?.remote_ok);
        } else if (filterRemote === "onsite") {
            filtered = filtered.filter((rec) => !rec.job_postings?.remote_ok);
        }

        // Filter by source
        if (filterSource !== "all") {
            filtered = filtered.filter(
                (rec) => rec.job_postings?.source?.toLowerCase() === filterSource.toLowerCase()
            );
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === "match_score") {
                return b.match_score - a.match_score;
            }
            if (sortBy === "newest") {
                const dateA = new Date(a.job_postings?.posted_date || 0).getTime();
                const dateB = new Date(b.job_postings?.posted_date || 0).getTime();
                return dateB - dateA;
            }
            return 0;
        });

        setFilteredRecs(filtered);
    };

    const getMatchStyle = (score: number) => {
        if (score >= 85) return "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20";
        if (score >= 70) return "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20";
        if (score >= 55) return "text-amber-500 bg-amber-500/10 border border-amber-500/20";
        return "text-rose-500 bg-rose-500/10 border border-rose-500/20";
    };

    const getDotColor = (score: number) => {
        if (score >= 85) return "bg-emerald-500";
        if (score >= 70) return "bg-cyan-500";
        if (score >= 55) return "bg-amber-500";
        return "bg-rose-500";
    };

    const formatSourceBadge = (source?: string) => {
        switch (source?.toLowerCase()) {
            case "adzuna":
                return { label: "Adzuna", bg: "bg-teal-500/10 text-teal-500 border-teal-500/20" };
            case "findwork":
                return { label: "Findwork", bg: "bg-orange-500/10 text-orange-500 border-orange-500/20" };
            case "remoteok":
                return { label: "RemoteOK", bg: "bg-red-500/10 text-red-500 border-red-500/20" };
            case "jobicy":
                return { label: "Jobicy", bg: "bg-blue-500/10 text-blue-500 border-blue-500/20" };
            case "arbeitnow":
                return { label: "Arbeitnow", bg: "bg-purple-500/10 text-purple-500 border-purple-500/20" };
            case "remotive":
                return { label: "Remotive", bg: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20" };
            case "google_jobs":
                return { label: "Google Jobs", bg: "bg-amber-500/10 text-amber-500 border-amber-500/20" };
            case "themuse":
                return { label: "The Muse", bg: "bg-pink-500/10 text-pink-500 border-pink-500/20" };
            default:
                return { label: source || "Free API", bg: "bg-violet-500/10 text-violet-500 border-violet-500/20" };
        }
    };

    const formatTimeAgo = (postedDate?: string) => {
        if (!postedDate) return "Live Today";
        const date = new Date(postedDate);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
        const diffDays = Math.floor(diffHours / 24);

        if (diffHours < 1) return "Just Now";
        if (diffHours < 24) return `${diffHours}h ago`;
        if (diffDays === 1) return "Yesterday";
        if (diffDays < 7) return `${diffDays}d ago`;
        return `${Math.floor(diffDays / 7)}w ago`;
    };

    const updateStatus = async (recId: string, status: string) => {
        try {
            const { error } = await supabase
                .from("job_recommendations")
                .update({ status })
                .eq("id", recId);

            if (error) throw error;

            setRecommendations((prev) =>
                prev.map((rec) => (rec.id === recId ? { ...rec, status } : rec))
            );

            toast({
                title: "Updated",
                description: `Job marked as ${status}`,
            });
        } catch (error) {
            console.error("Error updating status:", error);
        }
    };

    const createCareerPlan = async (rec: JobRecommendation) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            setCreatingPlan(true);

            const { data, error } = await supabase.functions.invoke("create-career-plan", {
                body: {
                    userId: user.id,
                    targetRole: rec.job_postings.title,
                    jobRecommendationId: rec.id,
                },
            });

            if (error) throw error;

            navigate(`/career-plan/${data.plan.id}`);
        } catch (error: any) {
            console.error("Error creating career plan:", error);
            toast({
                title: "Error",
                description: error.message || "Failed to create career plan",
                variant: "destructive",
            });
            setCreatingPlan(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
                <div className="relative w-16 h-16 flex items-center justify-center">
                    <motion.div
                        animate={{ scale: [0.8, 1.2, 0.8], opacity: [0.3, 0.7, 0.3] }}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className="absolute inset-0 bg-violet-500/10 rounded-full blur-xl"
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        className="w-8 h-8 border-2 border-violet-500/20 border-t-violet-500 rounded-full"
                    />
                </div>
                <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: [0.4, 0.8, 0.4] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground font-semibold"
                >
                    Scouting Everyday Jobs
                </motion.span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 text-foreground selection:bg-violet-500/30 flex flex-col">
            {creatingPlan && <CreatingPlanLoader />}

            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ backgroundColor: 'rgba(124, 58, 237, 0.04)' }} />
                <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] rounded-full blur-[140px]" style={{ backgroundColor: 'rgba(99, 102, 241, 0.03)' }} />
            </div>

            {/* Header */}
            <motion.header
                initial={{ y: -50, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-border/50 bg-card/60 backdrop-blur-md"
            >
                <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate("/dashboard")}
                            className="rounded-full w-8 h-8 border border-border hover:bg-muted text-muted-foreground hover:text-foreground transition-all duration-300"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-sm font-semibold tracking-wide text-foreground">
                                Free Job Radar & Resume Matcher
                            </h1>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                Multi-API Live Openings
                            </span>
                        </div>
                    </div>

                    <Button 
                        onClick={generateRecommendations} 
                        disabled={generating}
                        variant="outline"
                        className="h-8 rounded-full border-border hover:bg-muted text-xs font-medium tracking-wide text-muted-foreground hover:text-foreground transition-all duration-300 bg-transparent px-4"
                    >
                        {generating ? (
                            <RefreshCw className="h-3 w-3 mr-2 animate-spin text-violet-500" />
                        ) : (
                            <Sparkles className="h-3.5 w-3.5 mr-2 text-violet-500" />
                        )}
                        {generating ? "Scouting Live Jobs..." : "Fetch Everyday Jobs"}
                    </Button>
                </div>
            </motion.header>

            {/* Sidebar + Main Content Layout */}
            <div className="flex-1 flex w-full min-w-0 relative">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 relative z-10">
                    <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 w-full">
                
                        {/* Hero / Stats Area */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-8 pb-6 border-b border-border/60">
                            <div>
                                <div className="flex items-center gap-2 mb-2">
                                    <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground">
                                        Live <span className="font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">Job Matches</span>
                                    </h2>
                                    {hasResume ? (
                                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 px-2.5 py-0.5 rounded-full">
                                            <FileText className="h-3 w-3" />
                                            Resume Sync Active
                                        </span>
                                    ) : (
                                        <span 
                                            onClick={() => navigate("/profile")}
                                            className="cursor-pointer inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2.5 py-0.5 rounded-full hover:bg-amber-500/20 transition-all"
                                        >
                                            <FileText className="h-3 w-3" />
                                            Upload Resume to Improve Fit
                                        </span>
                                    )}
                                </div>
                                <p className="text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
                                    Aggregated every day from 100% free job APIs (RemoteOK, Jobicy, Arbeitnow, Remotive, Google Jobs, The Muse) and matched against your resume & interview scores.
                                </p>
                            </div>
                            <div className="flex gap-6 items-center">
                                <div className="flex flex-col items-start">
                                    <span className="text-xl md:text-2xl font-semibold text-foreground">{recommendations.length}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Active Jobs</span>
                                </div>
                                <div className="h-8 w-px bg-border/65" />
                                <div className="flex flex-col items-start">
                                    <span className="text-xl md:text-2xl font-semibold text-emerald-500">
                                        {recommendations.filter(r => r.match_score >= 75).length}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">High Fit</span>
                                </div>
                            </div>
                        </div>

                        {recommendations.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="min-h-[380px] flex flex-col items-center justify-center p-8 rounded-3xl border border-border bg-card/40 text-center"
                            >
                                <div className="w-16 h-16 mb-4 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center">
                                    <BriefcaseBusiness className="h-6 w-6 text-violet-500" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground mb-2">No Live Jobs Loaded Yet</h3>
                                <p className="text-muted-foreground text-xs mb-6 max-w-xs mx-auto leading-relaxed">
                                    Click below to scout everyday live job openings from all free job APIs tailored to your resume.
                                </p>
                                <Button 
                                    onClick={generateRecommendations} 
                                    disabled={generating} 
                                    size="sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/95 transition-colors rounded-full px-6 text-xs font-semibold"
                                >
                                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                    Scout Everyday Jobs
                                </Button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Filters & Search */}
                                <div className="py-4 mb-6">
                                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                                        <div className="relative w-full md:max-w-md">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <input 
                                                type="text" 
                                                placeholder="Search titles, skills, companies..." 
                                                className="w-full bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/60 focus:border-primary/20 rounded-full py-2 pl-10 pr-4 text-xs text-foreground focus:outline-none transition-all placeholder:text-muted-foreground/60"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                            {/* Source Filter */}
                                            <Select value={filterSource} onValueChange={setFilterSource}>
                                                <SelectTrigger className="h-8 w-[130px] rounded-full bg-muted/40 border-border/60 hover:bg-muted/60 text-muted-foreground text-xs font-medium focus:ring-0 focus:ring-offset-0">
                                                    <Globe className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                                    <SelectValue placeholder="Source" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border text-foreground">
                                                    <SelectItem value="all" className="text-xs">All Sources</SelectItem>
                                                    <SelectItem value="adzuna" className="text-xs">Adzuna (India)</SelectItem>
                                                    <SelectItem value="findwork" className="text-xs">Findwork</SelectItem>
                                                    <SelectItem value="remoteok" className="text-xs">RemoteOK</SelectItem>
                                                    <SelectItem value="jobicy" className="text-xs">Jobicy</SelectItem>
                                                    <SelectItem value="arbeitnow" className="text-xs">Arbeitnow</SelectItem>
                                                    <SelectItem value="remotive" className="text-xs">Remotive</SelectItem>
                                                    <SelectItem value="google_jobs" className="text-xs">Google Jobs</SelectItem>
                                                    <SelectItem value="themuse" className="text-xs">The Muse</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {/* Experience Filter */}
                                            <Select value={filterLevel} onValueChange={setFilterLevel}>
                                                <SelectTrigger className="h-8 w-[120px] rounded-full bg-muted/40 border-border/60 hover:bg-muted/60 text-muted-foreground text-xs font-medium focus:ring-0 focus:ring-offset-0">
                                                    <Filter className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                                    <SelectValue placeholder="Experience" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border text-foreground">
                                                    <SelectItem value="all" className="text-xs">Any Level</SelectItem>
                                                    <SelectItem value="entry" className="text-xs">Entry Level</SelectItem>
                                                    <SelectItem value="mid" className="text-xs">Mid Level</SelectItem>
                                                    <SelectItem value="senior" className="text-xs">Senior Level</SelectItem>
                                                </SelectContent>
                                            </Select>

                                            {/* Sort Filter */}
                                            <Select value={sortBy} onValueChange={setSortBy}>
                                                <SelectTrigger className="h-8 w-[120px] rounded-full bg-muted/40 border-border/60 hover:bg-muted/60 text-muted-foreground text-xs font-medium focus:ring-0 focus:ring-offset-0">
                                                    <SelectValue placeholder="Sort By" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border text-foreground">
                                                    <SelectItem value="match_score" className="text-xs">Highest Fit</SelectItem>
                                                    <SelectItem value="newest" className="text-xs">Newest First</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            
                                            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground bg-muted/40 border border-border/60 px-3 py-1.5 rounded-full whitespace-nowrap ml-auto">
                                                {filteredRecs.length} Roles
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Cards Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <AnimatePresence mode="popLayout">
                                        {filteredRecs.map((rec, index) => {
                                            const sourceInfo = formatSourceBadge(rec.job_postings?.source);
                                            const timeAgo = formatTimeAgo(rec.job_postings?.posted_date);

                                            return (
                                                <motion.div
                                                    key={rec.id}
                                                    initial={{ opacity: 0, y: 15 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    exit={{ opacity: 0, scale: 0.98 }}
                                                    transition={{ delay: index * 0.03, duration: 0.3 }}
                                                    layout
                                                >
                                                    <Card className="group h-full flex flex-col bg-card/60 hover:bg-card border border-border/50 hover:border-border transition-all duration-300 rounded-2xl p-5 shadow-sm">
                                                        
                                                        {/* Card Header */}
                                                        <div className="flex justify-between items-start gap-4">
                                                            <div className="flex gap-3">
                                                                <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-sm font-semibold text-foreground font-mono select-none shrink-0">
                                                                    {rec.job_postings?.company?.charAt(0) || "J"}
                                                                </div>
                                                                <div>
                                                                    <div className="flex flex-wrap items-center gap-2 mb-1">
                                                                        <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-500 transition-colors">
                                                                            {rec.job_postings?.title}
                                                                        </h3>
                                                                    </div>
                                                                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                                                                        <span className="flex items-center gap-1 font-medium text-foreground">
                                                                            <Building2 className="h-3 w-3 text-muted-foreground" />
                                                                            {rec.job_postings?.company}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${sourceInfo.bg}`}>
                                                                            {sourceInfo.label}
                                                                        </span>
                                                                        <span>•</span>
                                                                        <span className="flex items-center gap-1 text-muted-foreground">
                                                                            <Calendar className="h-3 w-3" />
                                                                            {timeAgo}
                                                                        </span>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                            
                                                            {/* Fit Badge */}
                                                            <div className={`flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold tracking-wide shrink-0 ${getMatchStyle(rec.match_score)}`}>
                                                                <span className="relative flex h-1.5 w-1.5">
                                                                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${getDotColor(rec.match_score)}`}></span>
                                                                    <span className={`relative inline-flex rounded-full h-1.5 w-1.5 ${getDotColor(rec.match_score)}`}></span>
                                                                </span>
                                                                <span>{rec.match_score}% Fit</span>
                                                            </div>
                                                        </div>

                                                        {/* Details Metadata */}
                                                        <div className="flex flex-wrap gap-x-3 gap-y-1.5 items-center mt-3 text-[11px] text-muted-foreground">
                                                            <span className="flex items-center gap-1">
                                                                <MapPin className="h-3 w-3 text-muted-foreground" />
                                                                {rec.job_postings?.location || "Remote"}
                                                            </span>
                                                            {rec.job_postings?.salary_range && (
                                                                <>
                                                                    <span className="text-muted-foreground/40">•</span>
                                                                    <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                                                        <DollarSign className="h-3 w-3" />
                                                                        {rec.job_postings.salary_range}
                                                                    </span>
                                                                </>
                                                            )}
                                                            {rec.job_postings?.remote_ok && (
                                                                <>
                                                                    <span className="text-muted-foreground/40">•</span>
                                                                    <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20 font-medium">
                                                                        Remote
                                                                    </span>
                                                                </>
                                                            )}
                                                            <span className="text-muted-foreground/40">•</span>
                                                            <span className="capitalize">{rec.job_postings?.experience_level || "mid"}</span>
                                                        </div>

                                                        {/* Skills Required */}
                                                        {rec.job_postings?.skills_required && rec.job_postings.skills_required.length > 0 && (
                                                            <div className="flex flex-wrap gap-1.5 mt-3">
                                                                {rec.job_postings.skills_required.slice(0, 5).map((skill: string, idx: number) => (
                                                                    <span 
                                                                        key={idx} 
                                                                        className="text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/50 px-2 py-0.5 rounded-md"
                                                                    >
                                                                        {skill}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {/* Match Analysis */}
                                                        <div className="space-y-3 py-3 border-t border-border/50 mt-4 flex-1">
                                                            <div className="space-y-1.5">
                                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
                                                                    <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                    Resume & Fit Analysis
                                                                </span>
                                                                <div className="space-y-1.5 pl-4">
                                                                    {rec.match_reasons?.slice(0, 2).map((reason, idx) => (
                                                                        <div key={idx} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                                                                            <div className="w-1 h-1 rounded-full bg-emerald-500 mt-1.5 shrink-0" />
                                                                            <span>{reason}</span>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>

                                                            {/* Growth Signals */}
                                                            {rec.skill_gaps && rec.skill_gaps.length > 0 && (
                                                                <div className="space-y-1.5 pt-2 border-t border-border/30">
                                                                    <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
                                                                        <Target className="h-3 w-3 text-amber-500" />
                                                                        Growth Areas
                                                                    </span>
                                                                    <div className="flex flex-wrap gap-1.5 pl-4">
                                                                        {rec.skill_gaps.slice(0, 3).map((gap, idx) => (
                                                                            <span 
                                                                                key={idx} 
                                                                                className="inline-flex items-center gap-1 text-[10px] text-foreground/85 bg-muted/40 border border-border/60 px-2 py-0.5 rounded-md"
                                                                            >
                                                                                {gap.skill}
                                                                                <span className="text-[9px] text-muted-foreground/60">({gap.estimated_time})</span>
                                                                            </span>
                                                                        ))}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Actions Block */}
                                                        <div className="pt-3 border-t border-border/50 flex gap-2 items-center">
                                                            <Button 
                                                                onClick={() => createCareerPlan(rec)} 
                                                                variant="outline"
                                                                className="flex-1 h-9 rounded-lg border-border/80 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all bg-card/40"
                                                            >
                                                                <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-violet-500" />
                                                                Career Path
                                                            </Button>
                                                            {rec.job_postings?.application_url && (
                                                                <Button 
                                                                    variant="outline" 
                                                                    asChild 
                                                                    className="flex-1 h-9 rounded-lg border-border/80 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all bg-card/40"
                                                                >
                                                                    <a href={rec.job_postings.application_url} target="_blank" rel="noopener noreferrer">
                                                                        <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                        Apply Directly
                                                                    </a>
                                                                </Button>
                                                            )}
                                                            <div className="flex items-center gap-1.5 ml-1 shrink-0">
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => updateStatus(rec.id, "saved")}
                                                                    className={`w-9 h-9 rounded-lg border border-border/80 hover:bg-muted hover:text-foreground ${rec.status === 'saved' ? 'text-violet-500 border-violet-500/20 bg-violet-500/5' : 'text-muted-foreground'}`}
                                                                >
                                                                    <BookmarkPlus className="h-3.5 w-3.5" />
                                                                </Button>
                                                                <Button
                                                                    variant="ghost"
                                                                    size="icon"
                                                                    onClick={() => updateStatus(rec.id, "rejected")}
                                                                    className="w-9 h-9 rounded-lg border border-border/80 hover:bg-red-500/5 hover:text-red-500 hover:border-red-500/10 text-muted-foreground transition-colors"
                                                                >
                                                                    <X className="h-3.5 w-3.5" />
                                                                </Button>
                                                            </div>
                                                        </div>

                                                    </Card>
                                                </motion.div>
                                            );
                                        })}
                                    </AnimatePresence>
                                </div>
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
}
