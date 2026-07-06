import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
    Briefcase, MapPin, DollarSign, TrendingUp, Sparkles, RefreshCw,
    ArrowLeft, ExternalLink, BookmarkPlus, X, CheckCircle2, Building2,
    Zap, Clock, Target, Search, Filter, BriefcaseBusiness
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

    const getMatchColor = (score: number) => {
        if (score >= 90) return "text-emerald-400 bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_15px_rgba(16,185,129,0.3)]";
        if (score >= 75) return "text-cyan-400 bg-cyan-500/10 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.3)]";
        if (score >= 60) return "text-amber-400 bg-amber-500/10 border-amber-500/50 shadow-[0_0_15px_rgba(245,158,11,0.3)]";
        return "text-rose-400 bg-rose-500/10 border-rose-500/50 shadow-[0_0_15px_rgba(244,63,94,0.3)]";
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
            <div className="min-h-screen bg-black flex items-center justify-center">
                <motion.div
                    animate={{ rotate: 360, scale: [1, 1.2, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="relative"
                >
                    <div className="absolute inset-0 blur-xl bg-violet-500/30 rounded-full" />
                    <RefreshCw className="h-16 w-16 text-violet-500 relative z-10" />
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-black text-white selection:bg-violet-500/30 flex flex-col">
            {creatingPlan && <CreatingPlanLoader />}
            
            {/* Background Effects */}
            <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-violet-900/20 rounded-full blur-[120px]" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-fuchsia-900/20 rounded-full blur-[120px]" />
                <div className="absolute top-[20%] right-[20%] w-[20%] h-[20%] bg-cyan-900/10 rounded-full blur-[100px]" />
            </div>

            {/* Header */}
            <motion.header
                initial={{ y: -100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="fixed top-0 left-0 right-0 z-50 border-b border-white/5 bg-black/60 backdrop-blur-2xl supports-[backdrop-filter]:bg-black/30"
            >
                <div className="container mx-auto px-4 h-20 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => navigate("/dashboard")}
                            className="rounded-full hover:bg-white/10 text-zinc-400 hover:text-white transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div>
                            <h1 className="text-xl font-bold bg-gradient-to-r from-white via-white to-zinc-500 bg-clip-text text-transparent">
                                Job Market
                            </h1>
                            <p className="text-xs text-zinc-500 font-medium tracking-wide uppercase">
                                Recommended Opportunities
                            </p>
                        </div>
                    </div>

                    <Button 
                        onClick={generateRecommendations} 
                        disabled={generating}
                        className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 border-0 shadow-[0_0_20px_rgba(124,58,237,0.3)] transition-all duration-300 transform hover:scale-105"
                    >
                        <Sparkles className={`h-4 w-4 mr-2 ${generating ? "animate-spin" : ""}`} />
                        {generating ? "AI Scouting..." : "Refresh Matches"}
                    </Button>
                </div>
            </motion.header>

            {/* Sidebar + Main Content Layout */}
            <div className="flex-1 flex w-full min-w-0 relative">
                <Sidebar />
                <div className="flex-1 flex flex-col min-w-0 relative z-10">
                    {/* Main Content */}
                    <main className="container mx-auto px-4 pt-32 pb-20 max-w-7xl w-full">
                
                {/* Hero / Stats Area */}
                <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="mb-10 p-1"
                >
                    <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-zinc-900/50 backdrop-blur-sm">
                        <div className="absolute top-0 right-0 p-32 bg-violet-500/20 blur-[100px] rounded-full pointer-events-none" />
                        
                        <div className="p-8 md:p-10 flex flex-col md:flex-row items-center justify-between gap-8 relative z-10">
                            <div>
                                <h2 className="text-3xl md:text-4xl font-bold mb-4">
                                    <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                                        Your Personalized Market
                                    </span>
                                </h2>
                                <p className="text-zinc-400 max-w-xl text-lg leading-relaxed">
                                    Our AI has analyzed your interview performance and skills to find roles where you specifically stand out.
                                </p>
                            </div>
                            <div className="flex gap-4">
                                <div className="text-center px-6 py-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
                                    <div className="text-3xl font-bold text-white mb-1">{recommendations.length}</div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Matches</div>
                                </div>
                                <div className="text-center px-6 py-4 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-md">
                                    <div className="text-3xl font-bold text-emerald-400 mb-1">
                                        {recommendations.filter(r => r.match_score > 80).length}
                                    </div>
                                    <div className="text-xs text-zinc-500 uppercase tracking-wider">Top Picks</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

                {recommendations.length === 0 ? (
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="min-h-[400px] flex flex-col items-center justify-center p-8 rounded-3xl border border-white/5 bg-zinc-900/30 backdrop-blur-sm text-center"
                    >
                        <div className="w-24 h-24 mb-6 rounded-full bg-zinc-900/80 border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(124,58,237,0.15)]">
                            <BriefcaseBusiness className="h-10 w-10 text-violet-400" />
                        </div>
                        <h3 className="text-2xl font-bold mb-3 text-white">Market Analysis Empty</h3>
                        <p className="text-zinc-400 mb-8 max-w-md mx-auto leading-relaxed">
                            We need more data to find your perfect fit. Complete a few interview sessions to help our AI understand your unique strengths.
                        </p>
                        <Button 
                            onClick={generateRecommendations} 
                            disabled={generating} 
                            size="lg"
                            className="bg-white text-black hover:bg-zinc-200 transition-colors rounded-full px-8 text-base font-medium"
                        >
                            <Sparkles className="h-5 w-5 mr-2" />
                            Start Analysis
                        </Button>
                    </motion.div>
                ) : (
                    <>
                        {/* Filters & Search */}
                        <div className="sticky top-20 z-40 mb-8">
                             <motion.div 
                                initial={{ opacity: 0, y: -10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="p-2 rounded-2xl bg-zinc-900/80 backdrop-blur-xl border border-white/10 shadow-2xl flex flex-col md:flex-row gap-2"
                            >
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-zinc-500" />
                                    <input 
                                        type="text" 
                                        placeholder="Search roles, companies, or skills..." 
                                        className="w-full bg-black/40 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-sm text-white focus:outline-none focus:ring-1 focus:ring-violet-500/50 transition-all placeholder:text-zinc-600"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className="flex gap-2 overflow-x-auto pb-1 md:pb-0 no-scrollbar">
                                    <Select value={filterLevel} onValueChange={setFilterLevel}>
                                        <SelectTrigger className="w-[160px] bg-black/40 border-white/5 text-zinc-300 focus:ring-violet-500/50">
                                            <Filter className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                            <SelectValue placeholder="Experience" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                                            <SelectItem value="all">Any Level</SelectItem>
                                            <SelectItem value="entry">Entry Level</SelectItem>
                                            <SelectItem value="mid">Mid Level</SelectItem>
                                            <SelectItem value="senior">Senior Level</SelectItem>
                                        </SelectContent>
                                    </Select>

                                    <Select value={filterRemote} onValueChange={setFilterRemote}>
                                        <SelectTrigger className="w-[160px] bg-black/40 border-white/5 text-zinc-300 focus:ring-violet-500/50">
                                            <MapPin className="h-3.5 w-3.5 mr-2 text-zinc-500" />
                                            <SelectValue placeholder="Location" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300">
                                            <SelectItem value="all">Any Location</SelectItem>
                                            <SelectItem value="remote">Remote Only</SelectItem>
                                            <SelectItem value="onsite">On-site Only</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    
                                    <div className="flex items-center px-4 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-medium whitespace-nowrap ml-auto md:ml-0">
                                        <Target className="h-3.5 w-3.5 mr-2" />
                                        {filteredRecs.length} Matches
                                    </div>
                                </div>
                            </motion.div>
                        </div>

                        {/* Job Cards Grid */}
                        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                            <AnimatePresence mode="popLayout">
                                {filteredRecs.map((rec, index) => (
                                    <motion.div
                                        key={rec.id}
                                        initial={{ opacity: 0, y: 30 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.95 }}
                                        transition={{ delay: index * 0.05, duration: 0.4 }}
                                        layout
                                    >
                                        <Card className="group h-full flex flex-col relative overflow-hidden bg-zinc-900/40 hover:bg-zinc-900/60 border-white/5 hover:border-violet-500/30 transition-all duration-500">
                                            {/* Glow Effect on Hover */}
                                            <div className="absolute inset-0 bg-gradient-to-br from-violet-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
                                            
                                            <CardHeader className="relative z-10 pb-0">
                                                <div className="flex justify-between items-start gap-4">
                                                    <div className="flex gap-4">
                                                        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-zinc-800 to-black border border-white/10 flex items-center justify-center text-2xl font-bold text-white shadow-lg group-hover:scale-105 transition-transform duration-500">
                                                            {rec.job_postings.company.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <CardTitle className="text-xl md:text-2xl font-bold text-white mb-2 group-hover:text-violet-400 transition-colors">
                                                                {rec.job_postings.title}
                                                            </CardTitle>
                                                            <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                                                <Building2 className="h-4 w-4" />
                                                                <span className="font-medium text-zinc-300">{rec.job_postings.company}</span>
                                                                <span className="text-zinc-600">•</span>
                                                                <span className="capitalize">{rec.job_postings.experience_level}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl border backdrop-blur-md transition-all duration-300 ${getMatchColor(rec.match_score)}`}>
                                                        <span className="text-xl font-bold">{rec.match_score}%</span>
                                                        <span className="text-[10px] font-semibold uppercase tracking-widest opacity-70">Fit</span>
                                                    </div>
                                                </div>

                                                <div className="flex flex-wrap gap-2 mt-6">
                                                    <Badge variant="outline" className="bg-white/5 border-white/10 hover:border-white/20 text-zinc-300 transition-colors py-1.5">
                                                        <MapPin className="h-3 w-3 mr-1.5 text-zinc-500" />
                                                        {rec.job_postings.location}
                                                    </Badge>
                                                    {rec.job_postings.salary_range && (
                                                        <Badge variant="outline" className="bg-white/5 border-white/10 hover:border-white/20 text-emerald-400 transition-colors py-1.5">
                                                            <DollarSign className="h-3 w-3 mr-1" />
                                                            {rec.job_postings.salary_range}
                                                        </Badge>
                                                    )}
                                                    {rec.job_postings.remote_ok && (
                                                        <Badge className="bg-violet-500/10 text-violet-300 hover:bg-violet-500/20 border-violet-500/20 py-1.5">
                                                            Remote
                                                        </Badge>
                                                    )}
                                                </div>
                                            </CardHeader>

                                            <CardContent className="relative z-10 flex-1 flex flex-col pt-6 gap-6">
                                                {/* Match Analysis */}
                                                <div className="space-y-4">
                                                    <div className="p-4 rounded-xl bg-gradient-to-r from-emerald-900/10 to-transparent border-l-2 border-emerald-500/30">
                                                        <h4 className="text-sm font-semibold text-emerald-400 mb-3 flex items-center gap-2">
                                                            <CheckCircle2 className="h-4 w-4" />
                                                            Why You Match
                                                        </h4>
                                                        <div className="space-y-2">
                                                            {rec.match_reasons.slice(0, 3).map((reason, idx) => (
                                                                <div key={idx} className="flex items-start gap-2.5 text-sm text-zinc-300">
                                                                    <div className="min-w-[4px] h-[4px] mt-2 rounded-full bg-emerald-500/50" />
                                                                    <span className="leading-snug">{reason}</span>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {rec.skill_gaps && rec.skill_gaps.length > 0 && (
                                                        <div className="p-4 rounded-xl bg-gradient-to-r from-amber-900/10 to-transparent border-l-2 border-amber-500/30">
                                                            <h4 className="text-sm font-semibold text-amber-400 mb-3 flex items-center gap-2">
                                                                <TrendingUp className="h-4 w-4" />
                                                                Growth Areas
                                                            </h4>
                                                            <div className="flex flex-wrap gap-2">
                                                                {rec.skill_gaps.slice(0, 3).map((gap, idx) => (
                                                                    <Badge key={idx} variant="secondary" className="bg-amber-500/10 text-amber-300 hover:bg-amber-500/20 border-0">
                                                                        {gap.skill}
                                                                        <span className="ml-1.5 opacity-50 text-[10px]">
                                                                             • {gap.estimated_time}
                                                                        </span>
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>

                                                <div className="mt-auto pt-6 flex flex-wrap gap-3 border-t border-white/5">
                                                    <Button 
                                                        onClick={() => createCareerPlan(rec)} 
                                                        className="flex-1 bg-white text-black hover:bg-zinc-200"
                                                    >
                                                        <TrendingUp className="h-4 w-4 mr-2" />
                                                        Career Plan
                                                    </Button>
                                                    {rec.job_postings.application_url && (
                                                        <Button variant="outline" asChild className="flex-1 border-white/10 hover:bg-white/5 text-white">
                                                            <a href={rec.job_postings.application_url} target="_blank" rel="noopener noreferrer">
                                                                <ExternalLink className="h-4 w-4 mr-2" />
                                                                Apply
                                                            </a>
                                                        </Button>
                                                    )}
                                                    <div className="flex gap-2">
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => updateStatus(rec.id, "saved")}
                                                            className={`border-white/10 hover:bg-white/5 ${rec.status === 'saved' ? 'text-violet-400 border-violet-500/30 bg-violet-500/10' : 'text-zinc-400'}`}
                                                        >
                                                            <BookmarkPlus className="h-4 w-4" />
                                                        </Button>
                                                        <Button
                                                            variant="outline"
                                                            size="icon"
                                                            onClick={() => updateStatus(rec.id, "rejected")}
                                                            className="border-white/10 hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/30 text-zinc-400"
                                                        >
                                                            <X className="h-4 w-4" />
                                                        </Button>
                                                    </div>
                                                </div>
                                            </CardContent>
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
