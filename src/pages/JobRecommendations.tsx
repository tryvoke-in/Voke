import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    MapPin, DollarSign, TrendingUp, Sparkles, RefreshCw,
    ArrowLeft, ExternalLink, BookmarkPlus, X, CheckCircle2, Building2,
    Target, Search, Filter, BriefcaseBusiness, AlertTriangle
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CreatingPlanLoader } from "@/components/ui/CreatingPlanLoader";
import { Sidebar } from "@/components/Sidebar";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogAction
} from "@/components/ui/alert-dialog";

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
    const [sortBy, setSortBy] = useState<string>("match_score");
    const [searchQuery, setSearchQuery] = useState("");
    const [showBetaAlert, setShowBetaAlert] = useState(true);

    useEffect(() => {
        loadRecommendations();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [recommendations, filterLevel, filterRemote, sortBy, searchQuery]);

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
                title: "Success!",
                description: `Generated ${data.count} job recommendations`,
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
                rec.job_postings.title.toLowerCase().includes(query) ||
                rec.job_postings.company.toLowerCase().includes(query) ||
                rec.job_postings.skills_required.some(skill => skill.toLowerCase().includes(query))
            );
        }

        // Filter by experience level
        if (filterLevel !== "all") {
            filtered = filtered.filter(
                (rec) => rec.job_postings.experience_level === filterLevel
            );
        }

        // Filter by remote
        if (filterRemote === "remote") {
            filtered = filtered.filter((rec) => rec.job_postings.remote_ok);
        } else if (filterRemote === "onsite") {
            filtered = filtered.filter((rec) => !rec.job_postings.remote_ok);
        }

        // Sort
        filtered.sort((a, b) => {
            if (sortBy === "match_score") {
                return b.match_score - a.match_score;
            }
            return 0;
        });

        setFilteredRecs(filtered);
    };

    const getMatchStyle = (score: number) => {
        if (score >= 90) return "text-emerald-500 bg-emerald-500/10 border border-emerald-500/20";
        if (score >= 75) return "text-cyan-500 bg-cyan-500/10 border border-cyan-500/20";
        if (score >= 60) return "text-amber-500 bg-amber-500/10 border border-amber-500/20";
        return "text-rose-500 bg-rose-500/10 border border-rose-500/20";
    };

    const getDotColor = (score: number) => {
        if (score >= 90) return "bg-emerald-500";
        if (score >= 75) return "bg-cyan-500";
        if (score >= 60) return "bg-amber-500";
        return "bg-rose-500";
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
                    Curating Matches
                </motion.span>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-muted/30 text-foreground selection:bg-violet-500/30 flex flex-col">
            {creatingPlan && <CreatingPlanLoader />}
            
            <AlertDialog open={showBetaAlert} onOpenChange={setShowBetaAlert}>
                <AlertDialogContent className="bg-card border border-border text-foreground max-w-sm rounded-3xl p-6 shadow-2xl backdrop-blur-md">
                    <AlertDialogHeader className="flex flex-col items-center text-center">
                        <div className="w-10 h-10 rounded-full bg-amber-500/5 border border-amber-500/10 flex items-center justify-center mb-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500" />
                        </div>
                        <AlertDialogTitle className="text-base font-semibold">
                            Experimental Feature
                        </AlertDialogTitle>
                        <AlertDialogDescription className="text-muted-foreground text-xs leading-relaxed mt-2">
                            Matching recommendations are currently experimental and being actively calibrated. Some results might be inaccurate.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter className="sm:justify-center mt-5">
                        <AlertDialogAction 
                            onClick={() => setShowBetaAlert(false)}
                            className="bg-muted hover:bg-muted/80 border border-border text-foreground font-medium rounded-full text-xs px-6 py-2 transition-all w-full sm:w-auto"
                        >
                            Acknowledge
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

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
                                Market Scout
                            </h1>
                            <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">
                                Matched Openings
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
                        {generating ? "Scouting..." : "Rescout Roles"}
                    </Button>
                </div>
            </motion.header>

            {/* Sidebar + Main Content Layout */}
            <div className="flex-1 flex w-full min-w-0 relative">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 relative z-10">
                    {/* Main Content */}
                    <main className="max-w-7xl mx-auto px-6 pt-24 pb-20 w-full">
                
                        {/* Hero / Stats Area */}
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-8 border-b border-border/60">
                            <div>
                                <h2 className="text-2xl md:text-3xl font-light tracking-tight text-foreground mb-2">
                                    Curated <span className="font-semibold bg-gradient-to-r from-violet-500 to-indigo-500 bg-clip-text text-transparent">Recommendations</span>
                                </h2>
                                <p className="text-xs md:text-sm text-muted-foreground max-w-xl leading-relaxed">
                                    Openings matched with your core strengths and interview signals. Keep your resume updated for better scouting.
                                </p>
                            </div>
                            <div className="flex gap-6 items-center">
                                <div className="flex flex-col items-start">
                                    <span className="text-xl md:text-2xl font-semibold text-foreground">{recommendations.length}</span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Matched Roles</span>
                                </div>
                                <div className="h-8 w-px bg-border/65" />
                                <div className="flex flex-col items-start">
                                    <span className="text-xl md:text-2xl font-semibold text-emerald-500">
                                        {recommendations.filter(r => r.match_score > 80).length}
                                    </span>
                                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">Strong Fits</span>
                                </div>
                            </div>
                        </div>

                        {recommendations.length === 0 ? (
                            <motion.div 
                                initial={{ opacity: 0, scale: 0.98 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-3xl border border-border bg-card/40 text-center"
                            >
                                <div className="w-16 h-16 mb-4 rounded-full bg-muted/50 border border-border flex items-center justify-center">
                                    <BriefcaseBusiness className="h-6 w-6 text-muted-foreground" />
                                </div>
                                <h3 className="text-base font-semibold text-foreground mb-2">No recommendations ready</h3>
                                <p className="text-muted-foreground text-xs mb-6 max-w-xs mx-auto leading-relaxed">
                                    Complete more interview practices so our algorithm can map your specific profiles and skills.
                                </p>
                                <Button 
                                    onClick={generateRecommendations} 
                                    disabled={generating} 
                                    size="sm"
                                    className="bg-primary text-primary-foreground hover:bg-primary/95 transition-colors rounded-full px-6 text-xs font-semibold"
                                >
                                    <Sparkles className="h-3.5 w-3.5 mr-1.5" />
                                    Scout Market
                                </Button>
                            </motion.div>
                        ) : (
                            <>
                                {/* Filters & Search */}
                                <div className="py-4 mb-8">
                                    <div className="flex flex-col md:flex-row gap-3 items-center justify-between">
                                        <div className="relative w-full md:max-w-md">
                                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                                            <input 
                                                type="text" 
                                                placeholder="Search titles, companies, skills..." 
                                                className="w-full bg-muted/40 hover:bg-muted/65 focus:bg-background border border-border/60 focus:border-primary/20 rounded-full py-2 pl-10 pr-4 text-xs text-foreground focus:outline-none transition-all placeholder:text-muted-foreground/60"
                                                value={searchQuery}
                                                onChange={(e) => setSearchQuery(e.target.value)}
                                            />
                                        </div>
                                        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto no-scrollbar">
                                            <Select value={filterLevel} onValueChange={setFilterLevel}>
                                                <SelectTrigger className="h-8 w-[130px] rounded-full bg-muted/40 border-border/60 hover:bg-muted/60 text-muted-foreground text-xs font-medium focus:ring-0 focus:ring-offset-0">
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

                                            <Select value={filterRemote} onValueChange={setFilterRemote}>
                                                <SelectTrigger className="h-8 w-[130px] rounded-full bg-muted/40 border-border/60 hover:bg-muted/60 text-muted-foreground text-xs font-medium focus:ring-0 focus:ring-offset-0">
                                                    <MapPin className="h-3 w-3 mr-1.5 text-muted-foreground" />
                                                    <SelectValue placeholder="Location" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-card border-border text-foreground">
                                                    <SelectItem value="all" className="text-xs">Any Location</SelectItem>
                                                    <SelectItem value="remote" className="text-xs">Remote Only</SelectItem>
                                                    <SelectItem value="onsite" className="text-xs">On-site Only</SelectItem>
                                                </SelectContent>
                                            </Select>
                                            
                                            <div className="text-[10px] uppercase font-semibold tracking-wider text-muted-foreground bg-muted/40 border border-border/60 px-3 py-1.5 rounded-full whitespace-nowrap ml-auto">
                                                {filteredRecs.length} Matches
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Job Cards Grid */}
                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                    <AnimatePresence mode="popLayout">
                                        {filteredRecs.map((rec, index) => (
                                            <motion.div
                                                key={rec.id}
                                                initial={{ opacity: 0, y: 15 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                exit={{ opacity: 0, scale: 0.98 }}
                                                transition={{ delay: index * 0.03, duration: 0.35 }}
                                                layout
                                            >
                                                <Card className="group h-full flex flex-col bg-card/60 hover:bg-card border border-border/50 hover:border-border transition-all duration-300 rounded-2xl p-5 shadow-sm">
                                                    
                                                    {/* Card Header */}
                                                    <div className="flex justify-between items-start gap-4">
                                                        <div className="flex gap-3">
                                                            <div className="w-10 h-10 rounded-xl bg-muted/60 border border-border/60 flex items-center justify-center text-sm font-semibold text-foreground font-mono select-none shrink-0">
                                                                {rec.job_postings.company.charAt(0)}
                                                            </div>
                                                            <div>
                                                                <h3 className="text-sm font-semibold text-foreground group-hover:text-violet-500 transition-colors">
                                                                    {rec.job_postings.title}
                                                                </h3>
                                                                <div className="flex items-center gap-1.5 mt-0.5 text-[11px] text-muted-foreground">
                                                                    <Building2 className="h-3 w-3 text-muted-foreground" />
                                                                    <span className="font-medium text-muted-foreground">{rec.job_postings.company}</span>
                                                                    <span>•</span>
                                                                    <span className="capitalize">{rec.job_postings.experience_level}</span>
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
                                                            {rec.job_postings.location}
                                                        </span>
                                                        {rec.job_postings.salary_range && (
                                                            <>
                                                                <span className="text-muted-foreground/40">•</span>
                                                                <span className="flex items-center gap-1 text-emerald-500 font-medium">
                                                                    <DollarSign className="h-3 w-3" />
                                                                    {rec.job_postings.salary_range}
                                                                </span>
                                                            </>
                                                        )}
                                                        {rec.job_postings.remote_ok && (
                                                            <>
                                                                <span className="text-muted-foreground/40">•</span>
                                                                <span className="px-1.5 py-0.5 rounded bg-violet-500/10 text-violet-500 dark:text-violet-400 border border-violet-500/20 font-medium">
                                                                    Remote
                                                                </span>
                                                            </>
                                                        )}
                                                    </div>

                                                    {/* Details / Gaps Analysis */}
                                                    <div className="space-y-4 py-4 border-t border-border/50 mt-4 flex-1">
                                                        {/* Why Match */}
                                                        <div className="space-y-2">
                                                            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
                                                                <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                                                                Match Analysis
                                                            </span>
                                                            <div className="space-y-1.5 pl-5">
                                                                {rec.match_reasons.slice(0, 2).map((reason, idx) => (
                                                                    <div key={idx} className="flex items-start gap-2 text-xs text-foreground/80 leading-relaxed">
                                                                        <div className="w-1 h-1 rounded-full bg-border mt-1.5 shrink-0" />
                                                                        <span>{reason}</span>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Growth Areas */}
                                                        {rec.skill_gaps && rec.skill_gaps.length > 0 && (
                                                            <div className="space-y-2 pt-2 border-t border-border/30">
                                                                <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5 select-none">
                                                                    <Target className="h-3 w-3 text-amber-500" />
                                                                    Growth Signals
                                                                </span>
                                                                <div className="flex flex-wrap gap-1.5 pl-5">
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
                                                    <div className="pt-4 border-t border-border/50 flex gap-2 items-center">
                                                        <Button 
                                                            onClick={() => createCareerPlan(rec)} 
                                                            variant="outline"
                                                            className="flex-1 h-9 rounded-lg border-border/80 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all bg-card/40"
                                                        >
                                                            <TrendingUp className="h-3.5 w-3.5 mr-1.5 text-violet-500" />
                                                            Career Path
                                                        </Button>
                                                        {rec.job_postings.application_url && (
                                                            <Button 
                                                                variant="outline" 
                                                                asChild 
                                                                className="flex-1 h-9 rounded-lg border-border/80 hover:bg-muted text-xs font-semibold text-muted-foreground hover:text-foreground transition-all bg-card/40"
                                                            >
                                                                <a href={rec.job_postings.application_url} target="_blank" rel="noopener noreferrer">
                                                                    <ExternalLink className="h-3.5 w-3.5 mr-1.5 text-muted-foreground" />
                                                                    Apply
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
                                        ))}
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
