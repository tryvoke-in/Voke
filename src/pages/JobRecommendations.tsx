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
  MapPin, TrendingUp, RefreshCw,
  ExternalLink, CheckCircle2, Briefcase, Search, X,
  Target, Bookmark, Clock, ArrowRight, Globe,
  Building2, HelpCircle, ChevronRight, Loader2, Sparkles
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

// Reliable clean multi-tier Company Logo component
function CompanyLogo({ company, size = "md" }: { company: string; size?: "sm" | "md" | "lg" }) {
  const name = decode(company || "Company");
  const initial = name.charAt(0).toUpperCase();
  const domain = getCompanyDomain(name);
  const [imgIndex, setImgIndex] = useState(0);

  const sources = [
    `https://img.logo.dev/${domain}?token=pk_X-1ZO13GSgeOoUrIuJ6BeA&size=128&format=png`,
    `https://www.google.com/s2/favicons?domain=${domain}&sz=128`,
  ];

  const dims = size === "lg" ? "w-14 h-14 text-lg rounded-xl" : size === "md" ? "w-11 h-11 text-base rounded-lg" : "w-9 h-9 text-xs rounded-md";

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
function MatchRing({ score, size = 64 }: { score: number; size?: number }) {
  const strokeWidth = 4;
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
      <span className={cn("text-xs font-bold", isHigh ? "text-emerald-600 dark:text-emerald-400" : "text-foreground")}>
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
      { query: `${role} Roles`, count: `${counts.all} jobs` },
      { query: `Remote ${topSkill} Engineer`, count: `${counts.remote} jobs` },
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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
        <p className="text-xs uppercase tracking-wider text-muted-foreground font-medium">
          Loading recommendations...
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
          <main className="container mx-auto px-4 sm:px-6 pt-24 pb-12 max-w-7xl">

            {/* ──── Header ──── */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div>
                <h1 className="text-2xl sm:text-3xl font-bold text-foreground tracking-tight">
                  Job Recommendations
                </h1>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">
                  Role matches and hiring opportunities based on your skills and profile.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2.5 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setHowItWorksOpen(true)}
                  className="rounded-lg text-xs font-medium h-9 px-3.5 gap-1.5 border-border/80 bg-card hover:bg-muted shadow-2xs"
                >
                  <HelpCircle className="w-3.5 h-3.5 text-muted-foreground" />
                  How it works
                </Button>

                <Button
                  onClick={() => generateRecommendations(undefined, true)}
                  disabled={generating}
                  size="sm"
                  className="rounded-lg text-xs font-medium h-9 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-2xs"
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

            {/* ──── Search & Filter Bar (Minimal Clean Horizontal Toolbar) ──── */}
            <div className="bg-card border border-border/80 rounded-xl px-3.5 py-2 shadow-2xs mb-6 flex flex-wrap md:flex-nowrap items-center justify-between gap-2.5">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search roles, companies or skills..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 pr-7 h-8 border-0 bg-transparent text-xs sm:text-sm focus-visible:ring-0 focus-visible:ring-offset-0 placeholder:text-muted-foreground/60"
                />
                {search && (
                  <button onClick={() => setSearch("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="h-5 w-px bg-border/80 hidden md:block" />

              <div className="flex items-center gap-2 shrink-0 flex-wrap">
                <Select value={filterLocation} onValueChange={setFilterLocation}>
                  <SelectTrigger className="h-8 w-[115px] text-xs font-medium rounded-md bg-muted/40 border-border/70 hover:bg-muted/70 transition-colors">
                    <SelectValue placeholder="Location" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Locations</SelectItem>
                    <SelectItem value="remote">Remote Only</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterLevel} onValueChange={setFilterLevel}>
                  <SelectTrigger className="h-8 w-[120px] text-xs font-medium rounded-md bg-muted/40 border-border/70 hover:bg-muted/70 transition-colors">
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
                  <SelectTrigger className="h-8 w-[105px] text-xs font-medium rounded-md bg-muted/40 border-border/70 hover:bg-muted/70 transition-colors">
                    <SelectValue placeholder="Job Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="fulltime">Full-time</SelectItem>
                    <SelectItem value="contract">Contract</SelectItem>
                  </SelectContent>
                </Select>

                <div className="h-4 w-px bg-border hidden sm:block mx-0.5" />

                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="h-8 w-[120px] text-xs font-medium rounded-md bg-muted/40 border-border/70 hover:bg-muted/70 transition-colors">
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

            {/* ──── Match & Overview Card (Clean Minimal No-Gradient Look) ──── */}
            <div className="rounded-xl bg-card border border-border/80 p-5 mb-6 shadow-2xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
                
                {/* Score Ring & Metric */}
                <div className="flex items-center gap-4 lg:pr-6 lg:border-r border-border/70 shrink-0">
                  <MatchRing score={dynamicMatchScore} size={64} />
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block">
                      Profile Match Score
                    </span>
                    <p className="text-sm font-bold text-foreground mt-0.5">
                      {dynamicMatchScore >= 80 ? "Strong profile alignment" : "Moderate profile alignment"}
                    </p>
                    <button
                      onClick={() => navigate("/profile")}
                      className="text-xs font-medium text-primary hover:underline mt-0.5 inline-flex items-center gap-1"
                    >
                      Update profile skills <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>

                {/* Top Matched Skills */}
                <div className="flex-1 min-w-0">
                  <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground block mb-2">
                    Top Matched Skills
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {dynamicTopSkills.map((skill, i) => (
                      <span
                        key={i}
                        className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 text-foreground border border-border/60"
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Quick Summary Counts */}
                <div className="hidden sm:flex items-center gap-6 lg:pl-6 lg:border-l border-border/70 shrink-0">
                  <div>
                    <span className="text-xs text-muted-foreground block">Total Matches</span>
                    <span className="text-lg font-bold text-foreground">{counts.all}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">High Fit</span>
                    <span className="text-lg font-bold text-emerald-600 dark:text-emerald-400">{counts.high}</span>
                  </div>
                  <div>
                    <span className="text-xs text-muted-foreground block">Remote</span>
                    <span className="text-lg font-bold text-foreground">{counts.remote}</span>
                  </div>
                </div>

              </div>
            </div>

            {/* ──── Main Grid Layout (8 cols left, 4 cols right) ──── */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

              {/* ──── Left Column: Job Cards List (8 cols) ──── */}
              <div className="lg:col-span-8 space-y-4">

                {/* Filter Tabs */}
                <div className="flex items-center gap-6 border-b border-border/80 pb-0.5 overflow-x-auto no-scrollbar">
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
                        "text-xs sm:text-sm font-medium pb-2.5 transition-all relative whitespace-nowrap",
                        activeTab === tab.id
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground hover:text-foreground"
                      )}
                    >
                      {tab.label}
                      {activeTab === tab.id && (
                        <motion.div
                          layoutId="activeTabUnderline"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>

                {/* Empty State */}
                {filteredRecs.length === 0 && (
                  <div className="bg-card border border-border/80 rounded-xl p-10 text-center shadow-2xs">
                    <div className="w-12 h-12 rounded-xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                      {generating ? (
                        <Loader2 className="w-6 h-6 text-primary animate-spin" />
                      ) : (
                        <Briefcase className="w-6 h-6 text-muted-foreground" />
                      )}
                    </div>
                    <h3 className="text-base font-bold text-foreground mb-1">
                      {generating ? "Scouting Opportunities..." : "No Jobs Found"}
                    </h3>
                    <p className="text-xs text-muted-foreground max-w-sm mx-auto mb-5 leading-relaxed">
                      {generating
                        ? "Analyzing verified job postings against your skill profile..."
                        : "Click 'Fetch Live Jobs' to discover real-time tailored role recommendations."}
                    </p>
                    <Button
                      onClick={() => generateRecommendations(undefined, true)}
                      disabled={generating}
                      size="sm"
                      className="rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground font-medium text-xs px-5"
                    >
                      {generating ? "Scouting..." : "Fetch Live Jobs"}
                    </Button>
                  </div>
                )}

                {/* Job Cards List */}
                <div className="space-y-3">
                  <AnimatePresence mode="popLayout">
                    {filteredRecs.map((rec, i) => {
                      const job = rec.job_postings;
                      const company = decode(job?.company || "");
                      const title = decode(job?.title || "");
                      const isHighFit = rec.match_score >= 80;

                      return (
                        <motion.div
                          key={rec.id}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, scale: 0.98 }}
                          transition={{ delay: i * 0.02 }}
                          layout
                        >
                          <Card className="group bg-card hover:bg-card/90 border border-border/80 hover:border-border transition-all duration-150 rounded-xl shadow-2xs">
                            <CardContent className="p-4 sm:p-5">
                              {/* Top Bar: Match Badge & Meta */}
                              <div className="flex items-center justify-between gap-2 mb-3">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={cn(
                                      "px-2.5 py-0.5 rounded-md text-[11px] font-semibold border",
                                      isHighFit
                                        ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20"
                                        : "bg-muted/70 text-muted-foreground border-border/60"
                                    )}
                                  >
                                    {rec.match_score}% Match
                                  </span>

                                  {job?.remote_ok && (
                                    <span className="px-2 py-0.5 rounded-md text-[10px] font-medium bg-muted/60 text-muted-foreground border border-border/50">
                                      Remote
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] text-muted-foreground font-medium">
                                    {timeAgo(job?.posted_date)}
                                  </span>
                                </div>
                              </div>

                              {/* Card Body: Logo + Title + Details */}
                              <div className="flex items-start gap-3.5">
                                <CompanyLogo company={company} size="md" />

                                <div className="flex-1 min-w-0">
                                  <h3
                                    onClick={() => setSelectedRec(rec)}
                                    className="text-sm sm:text-base font-bold text-foreground group-hover:text-primary transition-colors cursor-pointer leading-snug truncate"
                                  >
                                    {title}
                                  </h3>

                                  <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1.5 flex-wrap">
                                    <span className="font-medium text-foreground">{company}</span>
                                    <span>•</span>
                                    <span>{job?.location || "Remote"}</span>
                                    <span>•</span>
                                    <span className="capitalize">{job?.experience_level || "Full-time"}</span>
                                  </p>

                                  {/* Skill Pills */}
                                  {job?.skills_required && job.skills_required.length > 0 && (
                                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                                      {job.skills_required.slice(0, 5).map((s, idx) => (
                                        <span
                                          key={idx}
                                          className="px-2 py-0.5 rounded text-[11px] font-medium bg-muted/50 text-muted-foreground border border-border/40"
                                        >
                                          {decode(s)}
                                        </span>
                                      ))}
                                      {job.skills_required.length > 5 && (
                                        <span className="text-[11px] text-muted-foreground font-medium self-center pl-0.5">
                                          +{job.skills_required.length - 5}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              {/* Match Rationale Callout */}
                              {rec.match_reasons && rec.match_reasons.length > 0 && (
                                <div className="mt-3.5 pt-3 border-t border-border/50">
                                  <div className="flex items-start gap-2 text-xs text-muted-foreground bg-muted/25 rounded-lg p-2.5 border border-border/40">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                                    <span className="line-clamp-1">
                                      <strong className="text-foreground font-medium">Match reason:</strong> {decode(rec.match_reasons[0])}
                                    </span>
                                  </div>
                                </div>
                              )}

                              {/* Action Buttons Row */}
                              <div className="pt-3.5 mt-3.5 border-t border-border/50 flex flex-wrap items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2 flex-1">
                                  {/* Career Path Button */}
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => createCareerPlan(rec)}
                                    className="rounded-lg text-xs font-medium h-8 px-3 border-border/80 hover:bg-muted gap-1.5"
                                  >
                                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                                    Career Path
                                  </Button>

                                  {/* Direct Apply Button */}
                                  {job?.application_url && (
                                    <Button
                                      size="sm"
                                      asChild
                                      className="rounded-lg text-xs font-medium h-8 px-3 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-2xs"
                                    >
                                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                                        Apply <ExternalLink className="w-3 h-3" />
                                      </a>
                                    </Button>
                                  )}
                                </div>

                                <div className="flex items-center gap-1.5 shrink-0">
                                  <Button
                                    size="icon"
                                    variant="ghost"
                                    onClick={() => updateStatus(rec.id, rec.status === "saved" ? "active" : "saved")}
                                    className={cn("w-8 h-8 rounded-lg border border-border/70", rec.status === "saved" && "text-amber-500 bg-amber-500/10 border-amber-500/20")}
                                  >
                                    <Bookmark className={cn("w-3.5 h-3.5", rec.status === "saved" && "fill-current")} />
                                  </Button>

                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setSelectedRec(rec)}
                                    className="rounded-lg text-xs font-medium h-8 px-2.5 text-muted-foreground hover:text-foreground gap-1"
                                  >
                                    Details <ArrowRight className="w-3.5 h-3.5" />
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
              <div className="lg:col-span-4 space-y-4">

                {/* Widget 1: Career Insights */}
                <Card className="bg-card border border-border/80 shadow-2xs rounded-xl overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      Role Alignment Insights
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {targetRoleTitle} opportunities analyzed from verified job providers.
                    </p>

                    <div className="p-3 rounded-lg bg-muted/40 border border-border/60 flex items-center justify-between">
                      <div>
                        <span className="text-xs font-bold text-foreground block">
                          {counts.all > 0 ? Math.round((counts.high / counts.all) * 100) : 0}% High Fit Rate
                        </span>
                        <span className="text-[11px] text-muted-foreground">matching your current skills</span>
                      </div>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
                        {counts.high} roles
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Widget 2: Skill Gaps & Optimization */}
                <Card className="bg-card border border-border/80 shadow-2xs rounded-xl overflow-hidden">
                  <CardHeader className="p-4 pb-2">
                    <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                      <Target className="w-4 h-4 text-primary" />
                      Skills in Demand
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-3">
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      Frequently requested in role descriptions that can boost your match score:
                    </p>

                    <div className="flex flex-wrap gap-1.5">
                      {dynamicSkillGaps.map((sk, i) => (
                        <span key={i} className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted/60 text-foreground border border-border/60">
                          {sk}
                        </span>
                      ))}
                    </div>

                    <button
                      onClick={() => navigate("/profile")}
                      className="text-xs font-medium text-primary hover:underline flex items-center gap-1 pt-1"
                    >
                      Update Profile Skills <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </CardContent>
                </Card>

                {/* Widget 3: Suggested Searches */}
                <Card className="bg-card border border-border/80 shadow-2xs rounded-xl overflow-hidden">
                  <CardHeader className="p-4 pb-2 flex flex-row items-center justify-between">
                    <CardTitle className="text-xs sm:text-sm font-bold flex items-center gap-2 text-foreground">
                      <Bookmark className="w-4 h-4 text-primary" />
                      Suggested Searches
                    </CardTitle>
                    {search && (
                      <button onClick={() => setSearch("")} className="text-xs text-muted-foreground hover:text-foreground">
                        Clear
                      </button>
                    )}
                  </CardHeader>
                  <CardContent className="p-4 pt-1 space-y-2">
                    {dynamicSavedSearches.map((s, i) => (
                      <div
                        key={i}
                        onClick={() => setSearch(s.query.split(" ")[0])}
                        className="p-2.5 rounded-lg border border-border/50 hover:bg-muted/40 transition-colors flex items-center justify-between cursor-pointer group"
                      >
                        <p className="text-xs font-medium text-foreground group-hover:text-primary transition-colors truncate">
                          {s.query}
                        </p>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted/60 px-2 py-0.5 rounded border border-border/50 shrink-0 ml-2">
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
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 bg-card border border-border shadow-md">
          {selectedRec && (() => {
            const job = selectedRec.job_postings;
            return (
              <div className="space-y-5">
                <DialogHeader>
                  <div className="flex items-start gap-3.5 pr-6">
                    <CompanyLogo company={job?.company} size="lg" />
                    <div>
                      <DialogTitle className="text-lg font-bold text-foreground">
                        {decode(job?.title || "")}
                      </DialogTitle>
                      <DialogDescription className="text-xs text-muted-foreground mt-1 flex items-center gap-1.5 flex-wrap">
                        <span className="font-medium text-foreground">{decode(job?.company || "")}</span>
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
                  <div className="p-3.5 rounded-xl bg-muted/40 border border-border/60 space-y-2">
                    <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Match Rationale ({selectedRec.match_score}%)
                    </h4>
                    <ul className="space-y-1 pl-5 list-disc text-xs text-muted-foreground">
                      {selectedRec.match_reasons.map((r, idx) => (
                        <li key={idx}>{decode(r)}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Skills required */}
                {job?.skills_required && job.skills_required.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Required Skills</h4>
                    <div className="flex flex-wrap gap-1.5">
                      {job.skills_required.map((s, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md text-xs font-medium bg-muted text-foreground border border-border/60">
                          {decode(s)}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Description */}
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Job Description</h4>
                  <div className="p-3.5 rounded-xl bg-muted/20 border border-border/50 text-xs leading-relaxed text-muted-foreground whitespace-pre-line max-h-56 overflow-y-auto">
                    {decode(job?.description || "Full job description available on the application page.")}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2.5 pt-2 border-t border-border/60">
                  <Button
                    onClick={() => createCareerPlan(selectedRec)}
                    variant="outline"
                    className="flex-1 rounded-lg text-xs font-medium h-9 gap-1.5 border-border/80 hover:bg-muted"
                  >
                    <TrendingUp className="w-3.5 h-3.5 text-muted-foreground" />
                    Generate Career Path
                  </Button>
                  {job?.application_url && (
                    <Button asChild className="flex-1 rounded-lg text-xs font-medium h-9 bg-primary hover:bg-primary/90 text-primary-foreground gap-1.5 shadow-2xs">
                      <a href={job.application_url} target="_blank" rel="noopener noreferrer">
                        Apply Directly <ExternalLink className="w-3.5 h-3.5" />
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
        <DialogContent className="max-w-md rounded-2xl p-6 bg-card border border-border shadow-md">
          <DialogHeader>
            <DialogTitle className="text-base font-bold text-foreground">
              How Job Recommendations Work
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 text-xs text-muted-foreground leading-relaxed pt-2">
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-muted text-foreground font-semibold flex items-center justify-center shrink-0 text-xs border border-border/60">1</div>
              <div>
                <p className="font-semibold text-foreground mb-0.5">Resume & Skill Parsing</p>
                We analyze your uploaded resume and interview performance across Voke to build your real-time skill graph.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-muted text-foreground font-semibold flex items-center justify-center shrink-0 text-xs border border-border/60">2</div>
              <div>
                <p className="font-semibold text-foreground mb-0.5">Daily Job Scouting</p>
                Our engine aggregates live openings from verified tech role providers and matches them with your target profile.
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="w-6 h-6 rounded-md bg-muted text-foreground font-semibold flex items-center justify-center shrink-0 text-xs border border-border/60">3</div>
              <div>
                <p className="font-semibold text-foreground mb-0.5">Match Scoring & Career Plans</p>
                Each role receives a match score and offers 1-click tailored Career Path generation to prepare for technical interviews.
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

    </div>
  );
}
