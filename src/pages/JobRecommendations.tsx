import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription
} from "@/components/ui/dialog";
import {
  MapPin, DollarSign, TrendingUp, Sparkles, RefreshCw,
  ExternalLink, CheckCircle2, Briefcase, Search, X,
  Target, Star, Bookmark, Clock, ArrowRight, Globe,
  Building2, HelpCircle, ChevronRight, Zap
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

function decode(s: string) {
  if (!s) return "";
  return s.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function timeAgo(d?: string) {
  if (!d) return "Today";
  const h = Math.floor((Date.now() - new Date(d).getTime()) / 36e5);
  if (h < 1) return "Just now";
  if (h < 24) return `${h}h ago`;
  const days = Math.floor(h / 24);
  if (days === 1) return "1 day ago";
  if (days < 7) return `${days} days ago`;
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

// Reliable multi-tier Company Logo component
function CompanyLogo({ company, size = "md" }: { company: string; size?: "sm" | "md" | "lg" }) {
  const name = decode(company || "Company");
  const initial = name.charAt(0).toUpperCase();
  const domain = getCompanyDomain(name);
  const [imgIndex, setImgIndex] = useState(0);

  const sources = [
    `https://logo.clearbit.com/${domain}`,
    `https://unavatar.io/${domain}?fallback=false`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  const bgColors: Record<string, string> = {
    G: "bg-red-500 text-white",
    M: "bg-blue-600 text-white",
    S: "bg-emerald-600 text-white",
    A: "bg-amber-500 text-white",
    F: "bg-violet-600 text-white",
    N: "bg-rose-600 text-white",
    L: "bg-indigo-600 text-white",
    B: "bg-yellow-500 text-black",
  };
  const fallbackBg = bgColors[initial] || "bg-gradient-to-br from-violet-600 to-indigo-600 text-white";
  const dims = size === "lg" ? "w-14 h-14 text-xl rounded-2xl" : size === "md" ? "w-12 h-12 text-lg rounded-xl" : "w-10 h-10 text-sm rounded-lg";

  if (imgIndex >= sources.length) {
    return (
      <div className={cn("flex items-center justify-center font-bold shrink-0 shadow-sm", fallbackBg, dims)}>
        {initial}
      </div>
    );
  }

  return (
    <div className={cn("bg-white dark:bg-card p-2 border border-border/80 flex items-center justify-center overflow-hidden shrink-0 shadow-sm", dims)}>
      <img
        src={sources[imgIndex]}
        onError={() => setImgIndex((prev) => prev + 1)}
        alt={name}
        className="w-full h-full object-contain"
      />
    </div>
  );
}

// Radial Score Gauge
function MatchRing({ score, size = 68 }: { score: number; size?: number }) {
  const r = (size - 8) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;

  return (
    <div className="relative flex items-center justify-center shrink-0" style={{ width: size, height: size }}>
      <svg className="absolute w-full h-full -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={r} stroke="currentColor" strokeWidth="4" fill="transparent" className="text-violet-500/10 dark:text-violet-500/20" />
        <circle cx={size / 2} cy={size / 2} r={r} stroke="#8B5CF6" strokeWidth="4.5" fill="transparent"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <span className="text-sm font-extrabold text-violet-600 dark:text-violet-400">{score}%</span>
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
        generateRecommendations(user.id);
      }
    } catch (e) {
      console.error(e);
      toast({ title: "Error", description: "Failed to load job recommendations", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const generateRecommendations = async (overrideUserId?: string) => {
    setGenerating(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const targetUid = overrideUserId || user?.id;
      if (!targetUid) return;

      const { data, error } = await supabase.functions.invoke("generate-job-recommendations", {
        body: { userId: targetUid, forceRefresh: true },
      });
      if (error) throw error;
      if (data?.crashError) {
        console.error("EDGE FUNCTION CRASH DETAILS:", data.crashError, data.details);
        throw new Error("Backend crashed: " + data.crashError);
      }

      toast({ title: "Scouting Complete!", description: `Found ${data?.count || 0} live role matches.` });
      
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
      return resResult.skills.slice(0, 5);
    }
    const skillCounts: Record<string, number> = {};
    recommendations.forEach((r) => {
      r.job_postings?.skills_required?.forEach((s) => {
        const decoded = decode(s);
        if (decoded) skillCounts[decoded] = (skillCounts[decoded] || 0) + 1;
      });
    });
    const sorted = Object.keys(skillCounts).sort((a, b) => skillCounts[b] - skillCounts[a]);
    if (sorted.length > 0) return sorted.slice(0, 5);
    return ["React", "TypeScript", "Node.js", "System Design", "SQL"];
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
    if (sorted.length > 0) return sorted.slice(0, 4);
    return ["Next.js", "AWS", "TypeScript", "Docker"];
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
      { query: `${role} Roles`, count: `${counts.all} matched jobs` },
      { query: `Remote ${topSkill} Engineer`, count: `${counts.remote} remote jobs` },
    ];
  }, [targetRoleTitle, dynamicTopSkills, counts]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4">
        <div className="relative w-14 h-14">
          <div className="absolute inset-0 border-t-2 border-violet-600 rounded-full animate-spin" />
          <div className="absolute inset-2 border-t-2 border-purple-500 rounded-full animate-[spin_1.5s_linear_infinite_reverse]" />
        </div>
        <p className="text-xs uppercase tracking-widest text-muted-foreground font-medium animate-pulse">
          Syncing career recommendations...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/20 dark:bg-background flex flex-col font-sans">
      {creatingPlan && <CreatingPlanLoader />}
      <Navbar />

      <div className="flex-1 flex w-full min-w-0 relative">
        <Sidebar />

        <div className="flex-1 flex flex-col min-w-0">
          <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12 max-w-7xl">

            {/* ──── Header ──── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-3xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                  Job Recommendations
                  <Sparkles className="w-6 h-6 text-violet-500" />
                </h1>
                <p className="text-muted-foreground text-sm mt-1">
                  AI finds the best opportunities for you based on your profile and goals.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-3 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHowItWorksOpen(true)}
                  className="rounded-full text-xs font-semibold h-9 px-4 gap-1.5 border-border/80 bg-card hover:bg-muted shadow-sm"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-violet-500" />
                  How it works
                </Button>

                <Button
                  onClick={() => generateRecommendations()}
                  disabled={generating}
                  size="sm"
                  className="rounded-full text-xs font-bold h-9 px-5 bg-violet-600 hover:bg-violet-700 text-white shadow-sm"
                >
                  {generating ? <RefreshCw className="w-3.5 h-3.5 mr-1.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5 mr-1.5" />}
                  {generating ? "Scouting..." : "Fetch Live Jobs"}
                </Button>
              </div>
            </div>

            {/* ──── Search & Filter Bar (Single Compact Horizontal Row) ──── */}
            <div className="bg-card border border-border/80 rounded-2xl px-4 py-2.5 shadow-sm mb-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-3">
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles, companies or skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9 pr-8 h-9 border-0 bg-transparent text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="h-6 w-px bg-border hidden md:block" />

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="h-8 w-[110px] text-xs font-medium rounded-lg bg-muted/40 border-border/60">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="remote">Remote Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="h-8 w-[110px] text-xs font-medium rounded-lg bg-muted/40 border-border/60">
                    <SelectValue placeholder="Experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Any Experience</SelectItem>
                    <SelectItem value="entry">Entry Level</SelectItem>
                    <SelectItem value="mid">Mid Level</SelectItem>
                    <SelectItem value="senior">Senior Level</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-8 w-[100px] text-xs font-medium rounded-lg bg-muted/40 border-border/60">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fulltime">Full-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-5 w-px bg-border hidden sm:block mx-0.5" />

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-[120px] text-xs font-medium rounded-lg bg-muted/40 border-border/60">
                    <span className="text-muted-foreground mr-1">Sort:</span>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="match">Best Match</SelectItem>
                    <SelectItem value="newest">Newest</SelectItem>
                    <SelectItem value="company">Company A-Z</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* ──── Match & Overview Banner Card (Sleek Gradient Hero) ──── */}
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600/15 via-purple-600/10 to-indigo-600/15 dark:from-violet-950/40 dark:via-purple-950/20 dark:to-indigo-950/40 border border-violet-500/30 p-6 mb-8 shadow-sm">
              <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden md:flex items-center justify-center pointer-events-none opacity-90">
                <div className="relative w-28 h-28 flex items-center justify-center">
                  <div className="absolute inset-0 rounded-full bg-violet-500/10 animate-pulse" />
                  <div className="w-16 h-16 rounded-full bg-violet-500/15 flex items-center justify-center border border-violet-500/20 shadow-inner">
                    <Target className="w-8 h-8 text-violet-500 stroke-[1.75]" />
                  </div>
                </div>
              </div>

              <div className="flex flex-col lg:flex-row lg:items-center gap-6 relative z-10">
                {/* Dynamic Score Ring & Label */}
                <div className="flex items-center gap-5 lg:pr-8 lg:border-r border-violet-500/20">
                  <MatchRing score={dynamicMatchScore} size={72} />
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block">
                      Your Match Score
                    </span>
                    <p className="text-base font-extrabold text-foreground mt-0.5">
                      {dynamicMatchScore >= 80 ? "Great Match! Keep applying 🚀" : "Good Fit! Keep honing skills 🎯"}
                    </p>
                    <button
                      onClick={() => navigate("/profile")}
                      className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline mt-1 inline-flex items-center gap-1"
                    >
                      Improve your score →
                    </button>
                  </div>
                </div>

                {/* Top Matched Skills */}
                <div className="flex-1 lg:pl-2">
                  <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground block mb-2.5">
                    Top Skills Matched
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {dynamicTopSkills.map((skill, i) => {
                      const colors = [
                        "bg-violet-500/10 text-violet-600 dark:text-violet-300 border-violet-500/20",
                        "bg-blue-500/10 text-blue-600 dark:text-blue-300 border-blue-500/20",
                        "bg-emerald-500/10 text-emerald-600 dark:text-emerald-300 border-emerald-500/20",
                        "bg-amber-500/10 text-amber-600 dark:text-amber-300 border-amber-500/20",
                        "bg-purple-500/10 text-purple-600 dark:text-purple-300 border-purple-500/20",
                      ];
                      return (
                        <span
                          key={i}
                          className={cn("px-3.5 py-1 rounded-full text-xs font-semibold border shadow-2xs", colors[i % colors.length])}
                        >
                          {skill}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {/* ──── Main Grid Layout (8 cols left, 4 cols right) ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

              {/* ──── Left Column: Job Cards List (8 cols) ──── */}
              <div className="lg:col-span-8 space-y-6">

                {/* Underlined Filter Tabs */}
                <div className="flex items-center gap-6 border-b border-border/80 pb-1 overflow-x-auto no-scrollbar">
                  {[
                    { id: "all" as const, label: `All Matches (${counts.all})` },
                    { id: "high" as const, label: `High Match (${counts.high})` },
                    { id: "remote" as const, label: `Remote (${counts.remote})` },
                    { id: "saved" as const, label: `Saved Jobs (${counts.saved})` },
                  ].map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={cn(
                        "text-sm font-semibold pb-3 transition-all relative whitespace-nowrap",
                        activeTab === tab.id
                          ? "text-violet-600 dark:text-violet-400"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-violet-600 dark:bg-violet-400 rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Empty State */}
                {filteredRecs.length === 0 && (
                  <div className="bg-card border border-border/80 rounded-3xl p-12 text-center shadow-sm">
                    <div className="w-16 h-16 rounded-2xl bg-violet-500/10 flex items-center justify-center mx-auto mb-4">
                      {generating ? <RefreshCw className="w-8 h-8 text-violet-500 animate-spin" /> : <Briefcase className="w-8 h-8 text-violet-500" />}
                    </div>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {generating ? "Scouting Live Opportunities..." : "No Jobs Found"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-6">
                      {generating
                        ? "AI is analyzing live tech postings against your resume profile..."
                        : "Click 'Fetch Live Jobs' to discover real-time tailored role recommendations."}
                    </p>
                    <Button onClick={() => generateRecommendations()} disabled={generating} className="rounded-full bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs px-6">
                      <Sparkles className="w-3.5 h-3.5 mr-1.5" />
                      {generating ? "Scouting..." : "Fetch Live Jobs"}
                    </Button>
                  </div>
                )}

                {/* Job Cards List */}
                <div className="space-y-4">
                  <AnimatePresence mode="popLayout">
                    {filteredRecs.map((rec, i) => {
                      const job = rec.job_postings;
                      const company = decode(job?.company || "");
                      const title = decode(job?.title || "");

                      return (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: i * 0.03 }}
                          layout
                        >
                          <Card className="group bg-card hover:bg-card/90 border border-border/80 hover:border-violet-500/30 transition-all duration-200 rounded-2xl shadow-sm hover:shadow-md">
                            <CardContent className="p-6">
                              {/* Top Bar: Match Badge & Date */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                                  {rec.match_score}% Match
                                </span>
                                <div className="flex items-center gap-2">
                                  {i === 0 && (
                                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20 uppercase tracking-wider">
                                      Featured
                                    </span>
                                  )}
                                  <span className="text-xs text-muted-foreground font-medium">
                                    {timeAgo(job?.posted_date)}
                                  </span>
                                </div>
                              </div>

                              {/* Card Body: Multi-source Logo + Title + Details */}
                              <div className="flex items-start gap-4">
                                <CompanyLogo company={company} size="md" />

                                <div className="flex-1 min-w-0">
                                  <h3
                                    onClick={() => setSelectedRec(rec)}
                                    className="text-base font-bold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors cursor-pointer leading-tight truncate"
                                  >
                                    {title}
                                  </h3>

                                  <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-semibold text-foreground">{company}</span>
                                    <span>•</span>
                                    <span>{job?.location || "Remote"}</span>
                                    <span>•</span>
                                    <span className="capitalize">{job?.experience_level || "Full-time"}</span>
                                  </p>

                                  {/* Skill Pills */}
                                  {job?.skills_required && job.skills_required.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-3">
                                      {job.skills_required.slice(0, 5).map((s, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2.5 py-0.5 rounded-md text-[11px] font-medium bg-muted/60 text-muted-foreground border border-border/50"
                                        >
                                          {decode(s)}
                                        </span>
                                      ))}
                                      {job.skills_required.length > 5 && (
                                        <span className="text-[11px] text-muted-foreground font-medium self-center">
                                          +{job.skills_required.length - 5}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* AI Match Spark Banner */}
                              {rec.match_reasons && rec.match_reasons.length > 0 && (
                                <div className="mt-4 pt-3 border-t border-border/50">
                                  <div className="flex items-center gap-2 text-xs text-violet-600 dark:text-violet-300 font-medium mb-3">
                                    <Sparkles className="w-3.5 h-3.5 shrink-0 text-violet-500" />
                                    <span className="line-clamp-1">
                                      Why this match? {decode(rec.match_reasons[0])}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons Row */}
                              <div className="pt-3 border-t border-border/50 flex flex-wrap items-center justify-between gap-3">
                                <div className="flex items-center gap-2 flex-1">
                                  {/* Career Path Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => createCareerPlan(rec)}
                                    className="rounded-xl text-xs font-semibold h-9 px-4 border-violet-500/30 hover:bg-violet-500/10 hover:text-violet-600 gap-1.5"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5 text-violet-500" />
                                    Career Path
                                  </Button>

                                  {/* Direct Apply Button */}
                                  {job?.application_url && (
                                    <Button
                                      size="sm"
                                      asChild
                                      className="rounded-xl text-xs font-bold h-9 px-4 bg-violet-600 hover:bg-violet-700 text-white gap-1.5 shadow-sm"
                                    >
                                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                                        Apply <ExternalLink className="w-3.5 h-3.5" />
                                      </a>
                                    </Button>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateStatus(rec.id, rec.status === "saved" ? "active" : "saved")}
                                    className={cn("w-9 h-9 rounded-xl border border-border/80", rec.status === "saved" && "text-amber-500 bg-amber-500/10")}
                                  >
                                    <Bookmark className={cn("w-4 h-4", rec.status === "saved" && "fill-current")} />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedRec(rec)}
                                    className="rounded-xl text-xs font-semibold h-9 px-3 text-muted-foreground hover:text-foreground gap-1"
                                  >
                                    View Details <ArrowRight className="w-3.5 h-3.5" />
                                  </Button>
                                </div>
                              </div>

                            </CardContent>
                          </Card>
                        </motion.div>
                      );
                    })}
                  </AnimatePresence>
                </div>
              </div>

              {/* ──── Right Column: Sidebar Widgets (4 cols) ──── */}
              <div className="lg:col-span-4 space-y-6">

                {/* Widget 1: Career Insights */}
                <Card className="bg-card border border-border/80 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <TrendingUp className="w-4 h-4 text-violet-500" />
                      Career Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {targetRoleTitle} roles are in active demand. Found {counts.all} matches tailored for you.
                    </p>

                    <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400 block">
                          +{counts.all > 0 ? Math.round((counts.high / counts.all) * 100) : 28}% High Fit
                        </span>
                        <span className="text-[10px] text-muted-foreground">matching your resume profile</span>
                      </div>

                      <svg className="w-16 h-8 text-emerald-500" viewBox="0 0 60 30" fill="none">
                        <path d="M2 24 Q 15 22, 25 15 T 45 10 T 58 4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </CardContent>
                </Card>

                {/* Widget 2: Improve Your Match */}
                <Card className="bg-card border border-border/80 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <Target className="w-4 h-4 text-violet-500" />
                      Improve Your Match
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-4">
                      <div className="relative flex items-center justify-center w-14 h-14 shrink-0">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle cx="28" cy="28" r="22" stroke="currentColor" strokeWidth="4" fill="transparent" className="text-muted/30" />
                          <circle cx="28" cy="28" r="22" stroke="#8B5CF6" strokeWidth="4" fill="transparent" strokeDasharray="138" strokeDashoffset={138 - (dynamicMatchScore / 100) * 138} strokeLinecap="round" />
                        </svg>
                        <span className="absolute text-xs font-extrabold text-violet-600 dark:text-violet-400">{dynamicMatchScore}%</span>
                      </div>
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">
                          Acquire these skills from job postings to unlock higher match scores:
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {dynamicSkillGaps.map((sk, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-xs font-semibold bg-violet-500/10 text-violet-600 dark:text-violet-400 border border-violet-500/20">
                          {sk}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate("/profile")}
                      className="text-xs font-bold text-violet-600 dark:text-violet-400 hover:underline flex items-center gap-1 pt-1"
                    >
                      Update Skills →
                    </button>
                  </CardContent>
                </Card>

                {/* Widget 3: Saved Searches */}
                <Card className="bg-card border border-border/80 shadow-sm rounded-2xl overflow-hidden">
                  <CardHeader className="pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-sm font-bold flex items-center gap-2 text-foreground">
                      <Bookmark className="w-4 h-4 text-violet-500" />
                      Suggested Searches
                    </CardTitle>
                    <button onClick={() => setSearch("")} className="text-xs text-muted-foreground hover:text-foreground">
                      Reset
                    </button>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {dynamicSavedSearches.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => setSearch(s.query.split(" ")[0])}
                        className="p-2.5 rounded-xl border border-border/50 hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <div>
                          <p className="text-xs font-semibold text-foreground group-hover:text-violet-600 dark:group-hover:text-violet-400 transition-colors">
                            {s.query}
                          </p>
                        </div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          {s.count}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>

              </div>

            </div>

          </main>
        </div>
      </div>

      {/* ──── Job Detail Dialog Modal ──── */}
      <Dialog open={!!selectedRec} onOpenChange={(open) => !open && setSelectedRec(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-3xl p-6">
          {selectedRec && (() => {
            const job = selectedRec.job_postings;
            return (
              <div className="space-y-6">
                <DialogHeader>
                  <div className="flex items-start gap-4 pr-6">
                    <CompanyLogo company={job?.company} size="lg" />
                    <div>
                      <DialogTitle className="text-xl font-extrabold text-foreground">
                        {decode(job?.title || "")}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-2">
                        <span className="font-semibold text-foreground">{decode(job?.company || "")}</span>
                        <span>•</span>
                        <span>{job?.location || "Remote"}</span>
                        <span>•</span>
                        <span>{timeAgo(job?.posted_date)}</span>
                      </DialogDescription>
                    </div>
                  </div>
                </DialogHeader>

                {/* Match reasons */}
                {selectedRec.match_reasons && selectedRec.match_reasons.length > 0 && (
                  <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 space-y-2">
                    <h4 className="text-xs font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4" /> Why You Match ({selectedRec.match_score}%)
                    </h4>
                    <ul className="space-y-1 pl-5 list-disc text-xs text-foreground/80">
                      {selectedRec.match_reasons.map((r, idx) => (
                        <li key={idx}>{decode(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills required */}
                {job?.skills_required && job.skills_required.length > 0 && (
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills_required.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-muted-foreground border border-border/60">
                          {decode(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Job Description</h4>
                  <div className="p-4 rounded-2xl bg-muted/30 border border-border/60 text-xs leading-relaxed text-muted-foreground whitespace-pre-line max-h-60 overflow-y-auto">
                    {decode(job?.description || "Full job description available on the application page.")}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-2">
                  <Button
                    onClick={() => createCareerPlan(selectedRec)}
                    variant="outline"
                    className="flex-1 rounded-xl text-xs font-bold h-10 gap-1.5 border-violet-500/30 text-violet-600 hover:bg-violet-500/10"
                  >
                    <TrendingUp className="w-4 h-4 text-violet-500" />
                    Generate Career Path
                  </Button>
                  {job?.application_url && (
                    <Button asChild className="flex-1 rounded-xl text-xs font-bold h-10 bg-violet-600 hover:bg-violet-700 text-white gap-1.5">
                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                        Apply Directly <ExternalLink className="w-4 h-4" />
                      </a>
                    </Button>
                  )}
                </div>
              </div>
            );
          })()}
        </DialogContent>
      </Dialog>

      {/* ──── How It Works Dialog Modal ──── */}
      <Dialog open={howItWorksOpen} onOpenChange={setHowItWorksOpen}>
        <DialogContent className="max-w-md rounded-3xl p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-bold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-violet-500" /> How Job Recommendations Work
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">1</div>
              <div>
                <p className="font-bold text-foreground mb-0.5">Resume & Skill Parsing</p>
                We analyze your uploaded resume and interview performance across Voke to build your real-time skill graph.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">2</div>
              <div>
                <p className="font-bold text-foreground mb-0.5">Daily Job Scouting</p>
                Our automated engine aggregates live job openings daily from verified tech role providers.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-full bg-violet-500/10 text-violet-600 dark:text-violet-400 font-bold flex items-center justify-center shrink-0">3</div>
              <div>
                <p className="font-bold text-foreground mb-0.5">Match Scoring & Career Paths</p>
                Every role receives a match score along with actionable Career Path generation to prepare for interviews.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
