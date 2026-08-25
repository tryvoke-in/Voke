import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  MapPin, TrendingUp, RefreshCw,
  ExternalLink, CheckCircle2, Briefcase, Search, X,
  Target, Bookmark, Clock, ArrowRight, Globe,
  Building2, HelpCircle, ChevronRight, Loader2, Sparkles,
  Check, Filter, ArrowUpRight, DollarSign, Layers,
  Compass, Zap, Award
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { CreatingPlanLoader } from "@/components/ui/CreatingPlanLoader";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

function decode(s: unknown): string {
  if (!s) return "";
  const str = typeof s === "string" ? s : String(s);
  return str.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function timeAgo(d?: string) {
  if (!d) return "Today";
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 36e5);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "1d ago";
  if (days < 7) return `${days}d ago`;
  return `${Math.floor(days / 7)}w ago`;
}

function getCompanyDomain(companyName: string): string {
  const name = (companyName || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const known: Record<string, string> = {
    google: "google.com",
    microsoft: "microsoft.com",
    shopify: "shopify.com",
    amazon: "amazon.com",
    meta: "meta.com",
    apple: "apple.com",
    netflix: "netflix.com",
    uber: "uber.com",
    stripe: "stripe.com",
    elevenlabs: "elevenlabs.io",
    binance: "binance.com",
    lemonio: "lemon.io",
    forward: "forward.com",
    forwardtelecom: "forward.com",
  };
  return known[name] || `${name}.com`;
}

// Reliable clean Company Logo component
function CompanyLogo({ company, size = "md" }: { company: string; size?: "sm" | "md" | "lg" }) {
  const name = decode(company || "Company");
  const initial = name.charAt(0).toUpperCase();
  const domain = getCompanyDomain(name);
  const [imgIndex, setImgIndex] = useState(0);

  const sources = [
    `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6BeA&size=128&format=png`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  const dims = size === "lg" 
    ? "w-12 h-12 text-base rounded-xl" 
    : size === "md" 
      ? "w-10 h-10 text-sm rounded-lg" 
      : "w-8 h-8 text-xs rounded-md";

  if (imgIndex >= sources.length) {
    return (
      <div className={cn("flex items-center justify-center font-bold shrink-0 bg-muted text-foreground border border-border/80 shadow-2xs", dims)}>
        {initial}
      </div>
    );
  }

  return (
    <div className={cn("bg-card p-1.5 border border-border/80 flex items-center justify-center overflow-hidden shrink-0 shadow-2xs", dims)}>
      <img
        src={sources[imgIndex]}
        onError={() => setImgIndex((prev) => prev + 1)}
        alt={name}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

// Minimal Clean Radial Score Gauge
function MatchRing({ score, size = 52 }: { score: number; size?: number }) {
  const strokeWidth = 3.5;
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const isHigh = score >= 80;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute w-full h-full -rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          className="text-muted/30"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke="currentColor"
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className={cn(
            "transition-all duration-700 ease-out",
            isHigh ? "text-emerald-500" : "text-primary"
          )}
        />
      </svg>
      <span className={cn("text-xs font-bold font-mono", isHigh ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
        {score}%
      </span>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function JobRecommendations() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [creatingPlan, setCreatingPlan] = useState(false);
  const [recommendations, setRecommendations] = useState<JobRecommendation[]>([]);
  const [hasResume, setHasResume] = useState(false);
  const [profile, setProfile] = useState<any>(null);
  const [resumeAnalysis, setResumeAnalysis] = useState<any>(null);

  // Selected job for detail modal
  const [selectedRec, setSelectedRec] = useState<JobRecommendation | null>(null);
  const [howItWorksOpen, setHowItWorksOpen] = useState(false);

  // Filters & State
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "high" | "remote" | "saved">("all");
  const [filterLocation, setFilterLocation] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [sortBy, setSortBy] = useState("match");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/auth"); return; }

      const { data: p } = await supabase.from("profiles").select("*").eq("id", user.id).maybeSingle();
      if (p) setProfile(p);

      const { data: ra } = await supabase
        .from("resume_analyses")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (ra && ra.length > 0) {
        setResumeAnalysis(ra[0]);
      }

      if (p?.resume_url || (ra && ra.length > 0)) {
        setHasResume(true);
      }

      const { data: recs, error } = await supabase
        .from("job_recommendations")
        .select("*, job_postings (*)")
        .eq("user_id", user.id)
        .order("match_score", { ascending: false });

      if (error) throw error;

      const items = (recs as any) || [];
      setRecommendations(items);

      if (items.length < 100) {
        generateRecommendations(user.id, false);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load job recommendations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (overrideUserId?: string, forceRefresh: boolean = false) => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUid = overrideUserId || user?.id;
      if (!targetUid) return;

      const { data, error } = await supabase.functions.invoke("generate-job-recommendations", {
        body: { userId: targetUid, forceRefresh },
      });
      if (error) throw error;
      if (data?.crashError) {
        console.error("EDGE FUNCTION CRASH DETAILS:", data.crashError, data.details);
        throw new Error("Backend crashed: " + data.crashError);
      }

      toast({ title: "Scouting Complete", description: `Found ${data?.count || 0} live role matches.` });
      
      const { data: freshRecs } = await supabase
        .from("job_recommendations")
        .select("*, job_postings (*)")
        .eq("user_id", targetUid)
        .order("match_score", { ascending: false });

      if (freshRecs) {
        setRecommendations(freshRecs as any);
      }
    } catch (e: any) {
      console.error("Scouting error:", e);
      toast({ title: "Notice", description: e.message || "Failed to generate recommendations", variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  const updateStatus = async (recId: string, status: string) => {
    try {
      const { error } = await supabase.from("job_recommendations").update({ status }).eq("id", recId);
      if (error) throw error;
      setRecommendations((p) => p.map((r) => (r.id === recId ? { ...r, status } : r)));
      if (selectedRec?.id === recId) setSelectedRec((p) => p ? { ...p, status } : null);
      toast({ title: "Updated", description: status === "saved" ? "Saved to your list" : "Job status updated" });
    } catch {}
  };

  const createCareerPlan = async (rec: JobRecommendation) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setCreatingPlan(true);
      const { data, error } = await supabase.functions.invoke("create-career-plan", {
        body: { userId: user.id, targetRole: rec.job_postings.title, jobRecommendationId: rec.id },
      });
      if (error) throw error;
      navigate(`/career-plan/${data.plan.id}`);
    } catch (e: any) {
      toast({ title: "Error", description: e.message || "Failed to create career plan", variant: "destructive" });
      setCreatingPlan(false);
    }
  };

  // Dynamic Derived Metrics
  const dynamicMatchScore = useMemo(() => {
    if (recommendations.length > 0) {
      const active = recommendations.filter((r) => r.status !== "rejected");
      if (active.length > 0) {
        return Math.round(active.reduce((acc, r) => acc + r.match_score, 0) / active.length);
      }
    }
    if (resumeAnalysis?.ats_score) return resumeAnalysis.ats_score;
    return 75;
  }, [recommendations, resumeAnalysis]);

  const dynamicTopSkills = useMemo(() => {
    const resResult = resumeAnalysis?.analysis_result;
    if (resResult?.skills && Array.isArray(resResult.skills) && resResult.skills.length > 0) {
      return resResult.skills.slice(0, 6);
    }
    const skillCounts: Record<string, number> = {};
    recommendations.forEach((r) => {
      r.job_postings?.skills_required?.forEach((s) => {
        const decoded = decode(s);
        if (decoded) skillCounts[decoded] = (skillCounts[decoded] || 0) + 1;
      });
    });
    const sorted = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]);
    if (sorted.length > 0) return sorted.slice(0, 6);
    return ["React", "TypeScript", "Node.js", "System Design", "SQL", "Next.js"];
  }, [recommendations, resumeAnalysis]);

  const dynamicSkillGaps = useMemo(() => {
    const gapsMap: Record<string, number> = {};
    recommendations.forEach((r) => {
      r.skill_gaps?.forEach((g) => {
        const skill = decode(g.skill);
        if (skill) gapsMap[skill] = (gapsMap[skill] || 0) + 1;
      });
    });
    const sorted = Object.keys(gapsMap).sort((a, b) => gapsMap[b] - gapsMap[a]);
    if (sorted.length > 0) return sorted.slice(0, 5);
    return ["Next.js", "AWS", "GraphQL", "Docker", "PostgreSQL"];
  }, [recommendations]);

  const counts = useMemo(() => {
    const active = recommendations.filter((r) => r.status !== "rejected");
    return {
      all: active.length,
      high: active.filter((r) => r.match_score >= 80).length,
      remote: active.filter((r) => r.job_postings?.remote_ok).length,
      saved: recommendations.filter((r) => r.status === "saved").length,
    };
  }, [recommendations]);

  const targetRoleTitle = useMemo(() => {
    return profile?.target_role || resumeAnalysis?.analysis_result?.target_role || "Engineering & Tech";
  }, [profile, resumeAnalysis]);

  const dynamicSavedSearches = useMemo(() => {
    const role = targetRoleTitle;
    const topSkill = dynamicTopSkills[0] || "Frontend";
    return [
      { query: `${role} Roles`, tag: role },
      { query: `Remote ${topSkill} Engineer`, tag: `Remote ${topSkill}` },
      { query: `Senior Full Stack`, tag: `Full Stack` },
      { query: `High Match (80%+)`, tab: "high" as const },
    ];
  }, [targetRoleTitle, dynamicTopSkills]);

  const filteredRecs = useMemo(() => {
    let list = recommendations.filter((r) => r.status !== "rejected");

    if (activeTab === "high") list = list.filter((r) => r.match_score >= 80);
    else if (activeTab === "saved") list = list.filter((r) => r.status === "saved");
    else if (activeTab === "remote") list = list.filter((r) => r.job_postings?.remote_ok);

    if (search) {
      const q = search.toLowerCase();
      list = list.filter((r) =>
        r.job_postings?.title?.toLowerCase().includes(q) ||
        r.job_postings?.company?.toLowerCase().includes(q) ||
        r.job_postings?.skills_required?.some((s) => s.toLowerCase().includes(q))
      );
    }

    if (filterLocation === "remote") list = list.filter((r) => r.job_postings?.remote_ok);
    if (filterLevel !== "all") list = list.filter((r) => r.job_postings?.experience_level === filterLevel);

    list.sort((a, b) => {
      if (sortBy === "match") return b.match_score - a.match_score;
      if (sortBy === "newest") return new Date(b.job_postings?.posted_date || 0).getTime() - new Date(a.job_postings?.posted_date || 0).getTime();
      return (a.job_postings?.company || "").localeCompare(b.job_postings?.company || "");
    });

    return list;
  }, [recommendations, activeTab, search, filterLocation, filterLevel, filterType, sortBy]);

  const hasActiveFilters = search || filterLocation !== "all" || filterLevel !== "all" || activeTab !== "all";

  const clearAllFilters = () => {
    setSearch("");
    setFilterLocation("all");
    setFilterLevel("all");
    setFilterType("all");
    setActiveTab("all");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-7 h-7 text-primary animate-spin" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
          Loading vetted opportunities...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {creatingPlan && <CreatingPlanLoader />}
      <Navbar />

      <div className="flex-1 flex w-full min-w-0 relative">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="container mx-auto px-4 sm:px-6 pt-20 pb-16 max-w-7xl">

            {/* ══════════════════════════════════════════════════════════════════
                1. TOP HEADER & PRIMARY ACTIONS
            ══════════════════════════════════════════════════════════════════ */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6 pb-6 border-b border-border/60">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Job Recommendations
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1 max-w-2xl">
                  Real-time opportunities filtered and ranked by your verified skills and target role criteria.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHowItWorksOpen(true)}
                  className="rounded-xl text-xs font-semibold h-9 px-3.5 gap-1.5 border-border/80 bg-card hover:bg-muted shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  How it works
                </Button>

                <Button
                  onClick={() => generateRecommendations(undefined, true)}
                  disabled={generating}
                  size="sm"
                  className="rounded-xl text-xs font-semibold h-9 px-4 bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition-all border-0"
                >
                  {generating ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                      Scouting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
                      Fetch Live Jobs
                    </>
                  )}
                </Button>
              </div>
            </div>

            {/* ══════════════════════════════════════════════════════════════════
                2. COMPACT STATS & INTELLIGENCE SUMMARY BAR (4 Cards)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
              
              {/* Stat 1: Match Score */}
              <div className="bg-card border border-border/80 rounded-2xl p-4 shadow-xs flex items-center justify-between gap-3 transition-transform hover:scale-[1.01]">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block truncate">
                      Average Fit
                    </span>
                  </div>
                  <div className="text-2xl font-black text-foreground">
                    {dynamicMatchScore}%
                  </div>
                  <span className="text-[11px] font-medium text-sky-600 dark:text-sky-400 truncate block mt-0.5">
                    {dynamicMatchScore >= 80 ? "Strong alignment" : "Moderate alignment"}
                  </span>
                </div>
                <div className="p-1 rounded-xl bg-sky-500/10 border border-sky-500/20 shrink-0">
                  <MatchRing score={dynamicMatchScore} size={44} />
                </div>
              </div>

              {/* Stat 2: Total Opportunities */}
              <div 
                onClick={() => setActiveTab("all")}
                className={cn(
                  "bg-card border border-border/80 rounded-2xl p-4 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:border-blue-500/40",
                  activeTab === "all" && "border-blue-500/60 ring-2 ring-blue-500/15"
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Total Scouted
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-blue-500/10 text-blue-600 dark:text-blue-400 flex items-center justify-center border border-blue-500/20">
                    <Briefcase className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-foreground">
                  {counts.all}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground block mt-0.5">
                  Active role matches
                </span>
              </div>

              {/* Stat 3: High Fit (80%+) */}
              <div 
                onClick={() => setActiveTab("high")}
                className={cn(
                  "bg-card border border-border/80 rounded-2xl p-4 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:border-emerald-500/40",
                  activeTab === "high" && "border-emerald-500/60 ring-2 ring-emerald-500/15"
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      High Fit (80%+)
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 flex items-center justify-center border border-emerald-500/20">
                    <Award className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400">
                  {counts.high}
                </div>
                <span className="text-[11px] font-medium text-emerald-700/80 dark:text-emerald-300/80 block mt-0.5">
                  Top resume matches
                </span>
              </div>

              {/* Stat 4: Remote Openings */}
              <div 
                onClick={() => setActiveTab("remote")}
                className={cn(
                  "bg-card border border-border/80 rounded-2xl p-4 shadow-xs cursor-pointer transition-all hover:scale-[1.01] hover:border-purple-500/40",
                  activeTab === "remote" && "border-purple-500/60 ring-2 ring-purple-500/15"
                )}
              >
                <div className="flex items-center justify-between mb-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-purple-500 shrink-0" />
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider block">
                      Remote Openings
                    </span>
                  </div>
                  <div className="w-7 h-7 rounded-lg bg-purple-500/10 text-purple-600 dark:text-purple-400 flex items-center justify-center border border-purple-500/20">
                    <Globe className="w-3.5 h-3.5" />
                  </div>
                </div>
                <div className="text-2xl font-black text-foreground">
                  {counts.remote}
                </div>
                <span className="text-[11px] font-medium text-muted-foreground block mt-0.5">
                  Flexible work location
                </span>
              </div>

            </div>

            {/* ══════════════════════════════════════════════════════════════════
                3. INTEGRATED SEARCH & SMART FILTER TOOLBAR
            ══════════════════════════════════════════════════════════════════ */}
            <div className="bg-card border border-border/80 rounded-2xl p-3 sm:p-3.5 shadow-xs mb-6 space-y-3">
              
              {/* Row 1: Search Box & Dropdown Selects */}
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-2.5">
                
                {/* Search Input */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by job title, company name, or technology..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 pr-8 h-9 border-border/70 bg-muted/40 text-xs sm:text-sm rounded-xl focus:border-sky-500 focus:bg-background focus:ring-2 focus:ring-sky-500/15 transition-all font-medium placeholder:text-muted-foreground/70"
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded-md"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Filter Dropdowns */}
                <div className="flex items-center gap-2 shrink-0 flex-wrap">
                  
                  {/* Location Filter */}
                  <Select value={filterLocation} onValueChange={setFilterLocation}>
                    <SelectTrigger className="h-9 w-[125px] text-xs font-semibold rounded-xl bg-muted/40 border-border/70 hover:bg-muted/70 transition-colors">
                      <MapPin className="w-3 h-3 text-sky-500 mr-1" />
                      <SelectValue placeholder="Location" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Locations</SelectItem>
                      <SelectItem value="remote">Remote Only</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Experience Level Filter */}
                  <Select value={filterLevel} onValueChange={setFilterLevel}>
                    <SelectTrigger className="h-9 w-[130px] text-xs font-semibold rounded-xl bg-muted/40 border-border/70 hover:bg-muted/70 transition-colors">
                      <Layers className="w-3 h-3 text-indigo-500 mr-1" />
                      <SelectValue placeholder="Experience" />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="entry">Entry Level</SelectItem>
                      <SelectItem value="mid">Mid Level</SelectItem>
                      <SelectItem value="senior">Senior Level</SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Sort By Select */}
                  <Select value={sortBy} onValueChange={setSortBy}>
                    <SelectTrigger className="h-9 w-[130px] text-xs font-semibold rounded-xl bg-muted/40 border-border/70 hover:bg-muted/70 transition-colors">
                      <span className="text-muted-foreground mr-1">Sort:</span>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl">
                      <SelectItem value="match">Best Match</SelectItem>
                      <SelectItem value="newest">Newest Roles</SelectItem>
                      <SelectItem value="company">Company A-Z</SelectItem>
                    </SelectContent>
                  </Select>

                  {hasActiveFilters && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={clearAllFilters}
                      className="h-9 px-2.5 text-xs text-muted-foreground hover:text-foreground font-semibold rounded-xl"
                    >
                      Reset
                    </Button>
                  )}
                </div>

              </div>

              {/* Row 2: Segmented Tabs Filter */}
              <div className="flex items-center justify-between gap-2 pt-2 border-t border-border/50 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5">
                  {[
                    { id: "all" as const, label: "All Opportunities", count: counts.all, color: "sky" },
                    { id: "high" as const, label: "High Fit (80%+)", count: counts.high, color: "emerald" },
                    { id: "remote" as const, label: "Remote Only", count: counts.remote, color: "purple" },
                    { id: "saved" as const, label: "Saved Roles", count: counts.saved, color: "amber" },
                  ].map((tab) => {
                    const isActive = activeTab === tab.id;
                    return (
                      <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={cn(
                          "px-3 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap flex items-center gap-1.5 cursor-pointer border",
                          isActive
                            ? tab.color === "emerald"
                              ? "bg-emerald-600 text-white border-emerald-600 shadow-xs"
                              : tab.color === "purple"
                                ? "bg-purple-600 text-white border-purple-600 shadow-xs"
                                : tab.color === "amber"
                                  ? "bg-amber-600 text-white border-amber-600 shadow-xs"
                                  : "bg-sky-600 text-white border-sky-600 shadow-xs"
                            : "bg-muted/40 text-muted-foreground border-border/60 hover:text-foreground hover:bg-muted/80"
                        )}
                      >
                        <span>{tab.label}</span>
                        <span className={cn(
                          "text-[10px] px-1.5 py-0.2 rounded-md font-mono font-bold",
                          isActive
                            ? "bg-white/20 text-white"
                            : "bg-muted text-muted-foreground"
                        )}>
                          {tab.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <div className="text-[11px] text-muted-foreground font-medium shrink-0 hidden sm:block pr-1">
                  Showing <span className="font-bold text-foreground">{filteredRecs.length}</span> positions
                </div>
              </div>

            </div>

            {/* ══════════════════════════════════════════════════════════════════
                4. MAIN 2-COLUMN WORKSPACE (8 cols Left / 4 cols Right)
            ══════════════════════════════════════════════════════════════════ */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">

              {/* ──────────────────────────────────────────────────────────────
                  LEFT COLUMN: JOB POSTINGS LIST (8 Cols)
              ────────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-8 space-y-3.5">

                {/* Empty State */}
                {filteredRecs.length === 0 && (
                  <div className="bg-card border border-border/80 rounded-2xl p-12 text-center shadow-xs">
                    <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3 border border-border/60">
                      {generating ? (
                        <Loader2 className="w-6 h-6 text-sky-600 animate-spin" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">
                      {generating ? "Scouting Matches in Background..." : "No Opportunities Match Your Filter"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed">
                      {generating
                        ? "Scanning partner databases against your skills and resume graph..."
                        : "Try adjusting your search query, location filter, or click below to scout fresh openings."}
                    </p>
                    <div className="flex items-center justify-center gap-2">
                      {hasActiveFilters && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={clearAllFilters}
                          className="rounded-xl text-xs font-semibold h-9 px-4 border-border/80"
                        >
                          Clear Filters
                        </Button>
                      )}
                      <Button
                        onClick={() => generateRecommendations(undefined, true)}
                        disabled={generating}
                        size="sm"
                        className="rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs h-9 px-4"
                      >
                        {generating ? "Scouting..." : "Fetch Live Jobs"}
                      </Button>
                    </div>
                  </div>
                )}

                {/* Job Cards */}
                <div className="space-y-3.5">
                  <AnimatePresence mode="popLayout">
                    {filteredRecs.map((rec, i) => {
                      const job = rec.job_postings;
                      const company = decode(job?.company || "");
                      const title = decode(job?.title || "");
                      const isHighFit = rec.match_score >= 80;
                      const isSaved = rec.status === "saved";

                      return (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: Math.min(i * 0.02, 0.2) }}
                          layout
                        >
                          <Card className="group bg-card hover:bg-card/90 border border-border/80 hover:border-sky-500/40 transition-all duration-150 rounded-2xl shadow-xs hover:shadow-md overflow-hidden">
                            <CardContent className="p-4 sm:p-5 space-y-3.5">
                              
                              {/* Card Header Row: Logo, Title, Meta, Match Badge & Bookmark */}
                              <div className="flex items-start justify-between gap-3">
                                
                                <div className="flex items-start gap-3.5 min-w-0">
                                  <CompanyLogo company={company} size="md" />

                                  <div className="min-w-0">
                                    <h3
                                      onClick={() => setSelectedRec(rec)}
                                      className="text-sm sm:text-base font-bold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors cursor-pointer leading-snug truncate"
                                      title={title}
                                    >
                                      {title}
                                    </h3>

                                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1 flex-wrap font-medium">
                                      <span className="font-bold text-foreground">{company}</span>
                                      <span>•</span>
                                      <span className="flex items-center gap-1">
                                        <MapPin className="w-3 h-3 text-sky-500 shrink-0" />
                                        {job?.location || "Remote"}
                                      </span>
                                      {job?.experience_level && (
                                        <>
                                          <span>•</span>
                                          <span className="capitalize font-semibold text-foreground/80">{job.experience_level}</span>
                                        </>
                                      )}
                                      <span>•</span>
                                      <span className="text-[11px] text-muted-foreground">{timeAgo(job?.posted_date)}</span>
                                    </div>
                                  </div>
                                </div>

                                {/* Match Score Badge & Bookmark */}
                                <div className="flex items-center gap-2 shrink-0">
                                  <span
                                    className={cn(
                                      "px-2.5 py-1 rounded-xl text-xs font-bold border flex items-center gap-1 shadow-2xs",
                                      isHighFit
                                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                                        : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30"
                                    )}
                                  >
                                    <Zap className={cn("w-3.5 h-3.5", isHighFit ? "text-emerald-600 dark:text-emerald-400" : "text-sky-600 dark:text-sky-400")} />
                                    {rec.match_score}% Match
                                  </span>

                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateStatus(rec.id, isSaved ? "active" : "saved")}
                                    className={cn(
                                      "w-8 h-8 rounded-xl border border-border/70 hover:bg-muted text-muted-foreground transition-colors",
                                      isSaved && "text-amber-500 bg-amber-500/10 border-amber-500/20"
                                    )}
                                    title={isSaved ? "Remove from saved" : "Save for later"}
                                  >
                                    <Bookmark className={cn("w-3.5 h-3.5", isSaved && "fill-current")} />
                                  </Button>
                                </div>

                              </div>

                              {/* Skills Badges Row */}
                              {job?.skills_required && job.skills_required.length > 0 && (
                                <div className="flex flex-wrap items-center gap-1.5">
                                  {job.skills_required.slice(0, 6).map((s, idx) => {
                                    const skillName = decode(s);
                                    const isUserSkill = dynamicTopSkills.includes(skillName);
                                    return (
                                      <span
                                        key={idx}
                                        onClick={() => setSearch(skillName)}
                                        className={cn(
                                          "px-2.5 py-0.5 rounded-lg text-[11px] font-semibold border transition-all cursor-pointer",
                                          isUserSkill
                                            ? "bg-sky-500/10 text-sky-700 dark:text-sky-300 border-sky-500/25 hover:bg-sky-500/20"
                                            : "bg-muted/60 text-muted-foreground border-border/60 hover:bg-muted hover:text-foreground"
                                        )}
                                        title={`Filter by ${skillName}`}
                                      >
                                        {skillName}
                                      </span>
                                    );
                                  })}
                                  {job.skills_required.length > 6 && (
                                    <span 
                                      onClick={() => setSelectedRec(rec)}
                                      className="text-[11px] text-muted-foreground font-semibold cursor-pointer hover:text-foreground pl-1"
                                    >
                                      +{job.skills_required.length - 6} more
                                    </span>
                                  )}
                                </div>
                              )}

                              {/* AI Match Rationale Strip */}
                              {rec.match_reasons && rec.match_reasons.length > 0 && (
                                <div className="p-2.5 rounded-xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 flex items-start gap-2 text-xs text-muted-foreground">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                                  <span className="line-clamp-1">
                                    <strong className="text-emerald-900 dark:text-emerald-300 font-bold">Match Rationale:</strong> {decode(rec.match_reasons[0])}
                                  </span>
                                </div>
                              )}

                              {/* Card Action Controls Footer */}
                              <div className="pt-2 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5">
                                
                                <div className="flex items-center gap-2">
                                  {/* Generate 30-Day Career Path */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => createCareerPlan(rec)}
                                    className="rounded-xl text-xs font-bold h-8 px-3 border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20 gap-1.5"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5 text-sky-600 dark:text-sky-400" />
                                    30-Day Prep Roadmap
                                  </Button>

                                  {/* Direct Apply Button */}
                                  {job?.application_url && (
                                    <Button
                                      size="sm"
                                      asChild
                                      className="rounded-xl text-xs font-bold h-8 px-3.5 bg-sky-600 hover:bg-sky-700 text-white gap-1.5 shadow-2xs"
                                    >
                                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                                        Apply <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>

                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setSelectedRec(rec)}
                                  className="rounded-xl text-xs font-semibold h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1"
                                >
                                  View Details <ArrowRight className="w-3.5 h-3.5" />
                                </Button>

                              </div>

                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>

              </div>

              {/* ──────────────────────────────────────────────────────────────
                  RIGHT COLUMN: STICKY INTELLIGENCE SIDEBAR (4 Cols)
              ────────────────────────────────────────────────────────────── */}
              <div className="lg:col-span-4 space-y-4 sticky top-24">

                {/* Widget 1: Your Target Skill Graph */}
                <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-bold flex items-center justify-between text-foreground">
                      <span className="flex items-center gap-2">
                        <Target className="w-4 h-4 text-sky-500" />
                        Target Role Profile
                      </span>
                      <button
                        onClick={() => navigate("/profile")}
                        className="text-[11px] font-bold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        Edit
                      </button>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    <div className="p-3 rounded-xl bg-sky-500/5 dark:bg-sky-950/20 border border-sky-500/20">
                      <span className="text-[10px] uppercase font-bold text-sky-700/80 dark:text-sky-400/80 tracking-wider block">Target Role</span>
                      <p className="text-xs font-black text-foreground mt-0.5 truncate">{targetRoleTitle}</p>
                    </div>

                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2">
                        Your Parsed Key Skills
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {dynamicTopSkills.map((sk, i) => (
                          <span
                            key={i}
                            onClick={() => setSearch(sk)}
                            className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20 hover:bg-sky-500/20 transition-colors cursor-pointer"
                            title={`Filter roles by ${sk}`}
                          >
                            {sk}
                          </span>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Widget 2: High Demand Skill Gaps */}
                <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                      <TrendingUp className="w-4 h-4 text-emerald-500" />
                      In-Demand Market Skills
                    </CardTitle>
                    <CardDescription className="text-muted-foreground text-[11px]">
                      Frequently required by recruiters for {targetRoleTitle}.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    <div className="flex flex-wrap gap-1.5">
                      {dynamicSkillGaps.map((sk, i) => (
                        <span
                          key={i}
                          onClick={() => setSearch(sk)}
                          className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-emerald-500/10 text-emerald-800 dark:text-emerald-300 border border-emerald-500/20 hover:bg-emerald-500/20 transition-colors cursor-pointer"
                          title={`Click to filter jobs for ${sk}`}
                        >
                          + {sk}
                        </span>
                      ))}
                    </div>
                    <p className="text-[11px] text-muted-foreground leading-relaxed">
                      Adding these skills to your resume or projects can increase your match score up to <strong className="text-emerald-600 dark:text-emerald-400">+25%</strong>.
                    </p>
                  </CardContent>
                </Card>

                {/* Widget 3: Quick Filter Presets */}
                <Card className="bg-card border border-border/80 shadow-xs rounded-2xl overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                      <Bookmark className="w-4 h-4 text-indigo-500" />
                      Quick Role Presets
                    </CardTitle>
                    {hasActiveFilters && (
                      <button onClick={clearAllFilters} className="text-xs text-sky-600 dark:text-sky-400 hover:underline font-bold">
                        Clear
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-2">
                    {dynamicSavedSearches.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => {
                          if (s.tab) setActiveTab(s.tab);
                          else if (s.tag) setSearch(s.tag);
                        }}
                        className="p-2.5 rounded-xl border border-border/60 hover:border-sky-500/40 hover:bg-muted/40 transition-all flex items-center justify-between cursor-pointer group"
                      >
                        <p className="text-xs font-semibold text-foreground group-hover:text-sky-600 dark:group-hover:text-sky-400 transition-colors truncate">
                          {s.query}
                        </p>
                        <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-foreground transition-colors shrink-0" />
                      </div>
                    ))}
                  </CardContent>
                </Card>

                {/* Widget 4: Career Plan Promo Card */}
                <div className="p-4 rounded-2xl bg-indigo-500/5 dark:bg-indigo-950/20 border border-indigo-500/20 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 dark:text-indigo-200">
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    Interview Roadmap Generator
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Click <strong className="text-foreground">30-Day Prep Roadmap</strong> on any role to generate personalized DSA, System Design, and behavioral study milestones.
                  </p>
                </div>

              </div>

            </div>

          </main>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          5. JOB DETAIL DIALOG MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={!!selectedRec} onOpenChange={(open) => !open && setSelectedRec(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6 bg-card border border-border shadow-xl">
          {selectedRec && (() => {
            const job = selectedRec.job_postings;
            const company = decode(job?.company || "");
            const title = decode(job?.title || "");
            const isHighFit = selectedRec.match_score >= 80;

            return (
              <div className="space-y-5">
                
                {/* Modal Header */}
                <DialogHeader>
                  <div className="flex items-start justify-between gap-4 pr-6">
                    <div className="flex items-start gap-3.5 min-w-0">
                      <CompanyLogo company={company} size="lg" />
                      <div className="min-w-0">
                        <DialogTitle className="text-lg sm:text-xl font-bold text-foreground leading-snug">
                          {title}
                        </DialogTitle>
                        <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-foreground">{company}</span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-sky-500" />
                            {job?.location || "Remote"}
                          </span>
                          <span>•</span>
                          <span>{timeAgo(job?.posted_date)}</span>
                        </DialogDescription>
                      </div>
                    </div>

                    <div className={cn(
                      "px-3 py-1 rounded-xl text-xs font-bold border shrink-0 shadow-2xs",
                      isHighFit
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30"
                        : "bg-sky-500/10 text-sky-700 dark:text-sky-400 border-sky-500/30"
                    )}>
                      {selectedRec.match_score}% Fit
                    </div>
                  </div>
                </DialogHeader>

                {/* Match Rationale Breakdown */}
                {selectedRec.match_reasons && selectedRec.match_reasons.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-500/5 dark:bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" /> 
                      AI Match Assessment
                    </h4>
                    <ul className="space-y-1.5 pl-5 list-disc text-xs text-muted-foreground">
                      {selectedRec.match_reasons.map((r, idx) => (
                        <li key={idx} className="leading-relaxed">{decode(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Required Skills Cloud */}
                {job?.skills_required && job.skills_required.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                      Required Skills & Technologies
                    </h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills_required.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-sky-500/10 text-sky-800 dark:text-sky-300 border border-sky-500/20">
                          {decode(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Job Description Container */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">
                    Role Description
                  </h4>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs leading-relaxed text-muted-foreground whitespace-pre-line max-h-60 overflow-y-auto custom-scrollbar font-normal">
                    {decode(job?.description || "Full job description available on the application page.")}
                  </div>
                </div>

                {/* Modal Footer Actions */}
                <div className="flex items-center gap-2.5 pt-3 border-t border-border/60">
                  <Button
                    onClick={() => createCareerPlan(selectedRec)}
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-bold h-9 gap-1.5 border-sky-500/30 text-sky-700 dark:text-sky-300 bg-sky-500/10 hover:bg-sky-500/20"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-sky-600" />
                    Generate 30-Day Roadmap
                  </Button>

                  {job?.application_url && (
                    <Button asChild className="flex-1 rounded-xl text-xs font-bold h-9 bg-sky-600 hover:bg-sky-700 text-white gap-1.5 shadow-xs border-0">
                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                        Apply on Partner Portal <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    </Button>
                  )}
                </div>

              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ══════════════════════════════════════════════════════════════════
          6. HOW IT WORKS MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6 bg-card border border-border shadow-xl">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              How Job Recommendations Work
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed pt-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-sky-500/10 text-sky-700 dark:text-sky-400 font-bold flex items-center justify-center shrink-0 text-xs border border-sky-500/20">
                1
              </div>
              <div>
                <p className="font-bold text-foreground mb-0.5">Resume & Profile Parsing</p>
                We continuously parse your uploaded resume, target role, and technical practice history to create your live skill graph.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 font-bold flex items-center justify-center shrink-0 text-xs border border-emerald-500/20">
                2
              </div>
              <div>
                <p className="font-bold text-foreground mb-0.5">Live Job Scouting</p>
                Our system aggregates active openings from vetted global providers, filtering out duplicates and expired roles.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-lg bg-purple-500/10 text-purple-700 dark:text-purple-400 font-bold flex items-center justify-center shrink-0 text-xs border border-purple-500/20">
                3
              </div>
              <div>
                <p className="font-bold text-foreground mb-0.5">Match Scoring & Prep Roadmaps</p>
                Every opportunity receives an AI match score and lets you generate an instant 30-day interview prep plan with DSA & system design milestones.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
