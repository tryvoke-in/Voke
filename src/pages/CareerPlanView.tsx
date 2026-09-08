import { useState, useEffect, useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ArrowLeft,
  Calendar,
  CheckCircle2,
  Circle,
  Download,
  ExternalLink,
  Target,
  TrendingUp,
  BookOpen,
  Sparkles,
  Trophy,
  Zap,
  Clock,
  Shield,
  Star,
  Crown,
  Video,
  Code,
  GraduationCap,
  Layers,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "framer-motion";
import { RoadmapCustomizeModal } from "@/components/career/RoadmapCustomizeModal";
import {
  createAndPersistCareerPlan,
  CreatePlanOptions,
  Resource,
  WeeklyTask,
  TaskItem,
  getCuratedRoleCourses,
} from "@/services/careerPlanService";
import { cn } from "@/lib/utils";

interface Milestone {
  month: number;
  week?: number;
  title: string;
  description: string;
  achieved: boolean;
}

interface CareerPlan {
  id: string;
  target_role: string;
  current_skill_level: string;
  month_1_goals: any;
  month_2_goals: any;
  month_3_goals: any;
  weekly_tasks: WeeklyTask[];
  resources: Resource[];
  milestones: Milestone[];
  progress_percentage: number;
  created_at: string;
  job_recommendation_id?: string | null;
}

export default function CareerPlanView() {
  const { planId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [plan, setPlan] = useState<CareerPlan | null>(null);
  const [selectedTab, setSelectedTab] = useState<string>("1");
  const [scrolled, setScrolled] = useState(false);
  const [customizeModalOpen, setCustomizeModalOpen] = useState(false);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [resourceCategory, setResourceCategory] = useState<string>("all");

  useEffect(() => {
    loadCareerPlan();

    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [planId]);

  const normalizeWeeklyTasks = (rawTasks: any[]): WeeklyTask[] => {
    if (!Array.isArray(rawTasks)) return [];
    return rawTasks.map((w, wIdx) => {
      const weekNum = w.week || wIdx + 1;
      const tasksArray = Array.isArray(w.tasks) ? w.tasks : [];

      // Ensure task_items structure exists for granular tracking
      let taskItems: TaskItem[] = [];
      if (Array.isArray(w.task_items) && w.task_items.length > 0) {
        taskItems = w.task_items;
      } else {
        taskItems = tasksArray.map((t: string | any, tIdx: number) => ({
          id: `w${weekNum}_t${tIdx}`,
          text: typeof t === "string" ? t : t?.text || `Task ${tIdx + 1}`,
          completed: typeof t === "object" && t?.completed !== undefined ? t.completed : Boolean(w.completed),
        }));
      }

      return {
        month: w.month || Math.ceil(weekNum / 4) || 1,
        week: weekNum,
        title: w.title || `Week ${weekNum}: Actionable Sprints`,
        focus: w.focus || "Core Engineering & Interview Prep",
        tasks: tasksArray.map((t: any) => (typeof t === "string" ? t : t.text)),
        task_items: taskItems,
        completed: taskItems.length > 0 && taskItems.every((item) => item.completed),
      };
    });
  };

  const loadCareerPlan = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("user_career_plans")
        .select("*")
        .eq("id", planId)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;

      const loadedPlan = data as unknown as CareerPlan;
      // Normalize weekly tasks
      loadedPlan.weekly_tasks = normalizeWeeklyTasks(loadedPlan.weekly_tasks);

      // Ensure rich course resources exist
      if (!loadedPlan.resources || loadedPlan.resources.length < 5) {
        loadedPlan.resources = getCuratedRoleCourses(loadedPlan.target_role || "Software Engineer");
      }

      setPlan(loadedPlan);
    } catch (error) {
      console.error("Error loading career plan:", error);
      toast({
        title: "Error",
        description: "Failed to load career plan",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // ─── Derived Metrics & Metadata ──────────────────────────────────────────────

  const totalWeeks = plan?.weekly_tasks?.length || 4;

  const durationInfo = useMemo(() => {
    if (!plan) return { label: "4 Weeks (1 Month)", weeks: 4, isSprint: false };
    const wCount = plan.weekly_tasks?.length || 4;
    const metaLabel = plan.month_1_goals?.meta?.duration_label;
    if (metaLabel) {
      return { label: metaLabel, weeks: wCount, isSprint: wCount <= 2 };
    }
    if (wCount <= 2) return { label: "2 Weeks (Sprint)", weeks: 2, isSprint: true };
    if (wCount <= 4) return { label: "4 Weeks (1 Month)", weeks: 4, isSprint: false };
    if (wCount <= 8) return { label: "8 Weeks (2 Months)", weeks: 8, isSprint: false };
    return { label: "12 Weeks (3 Months)", weeks: 12, isSprint: false };
  }, [plan]);

  const taskStats = useMemo(() => {
    if (!plan?.weekly_tasks) return { total: 0, completed: 0, percent: 0 };
    let total = 0;
    let completed = 0;
    plan.weekly_tasks.forEach((w) => {
      const items = w.task_items || [];
      total += items.length;
      completed += items.filter((t) => t.completed).length;
    });
    const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percent };
  }, [plan]);

  const experienceLevel = useMemo(() => {
    if (!plan) return "mid";
    if (plan.current_skill_level) return plan.current_skill_level;
    const r = (plan.target_role || "").toLowerCase();
    if (r.includes("senior") || r.includes("staff") || r.includes("lead") || r.includes("principal")) return "senior";
    if (r.includes("junior") || r.includes("entry") || r.includes("intern")) return "entry";
    return "mid";
  }, [plan]);

  // ─── Granular Task Checkbox Toggle ──────────────────────────────────────────

  const toggleTaskItem = async (weekIdx: number, taskIdx: number) => {
    if (!plan) return;

    const updatedWeekly = [...plan.weekly_tasks];
    const targetWeek = { ...updatedWeekly[weekIdx] };
    const items = [...(targetWeek.task_items || [])];

    if (!items[taskIdx]) return;
    items[taskIdx] = { ...items[taskIdx], completed: !items[taskIdx].completed };

    targetWeek.task_items = items;
    targetWeek.completed = items.every((i) => i.completed);
    updatedWeekly[weekIdx] = targetWeek;

    // Recalculate total progress percentage
    let total = 0;
    let completed = 0;
    updatedWeekly.forEach((w) => {
      (w.task_items || []).forEach((t) => {
        total += 1;
        if (t.completed) completed += 1;
      });
    });
    const newProgress = total > 0 ? Math.round((completed / total) * 100) : 0;

    try {
      const { error } = await supabase
        .from("user_career_plans")
        .update({
          weekly_tasks: updatedWeekly as any,
          progress_percentage: newProgress,
        })
        .eq("id", plan.id);

      if (error) throw error;

      setPlan({
        ...plan,
        weekly_tasks: updatedWeekly,
        progress_percentage: newProgress,
      });

      if (newProgress === 100) {
        toast({
          title: "🎉 Full Roadmap Completed!",
          description: "Outstanding job! You've checked off every single milestone in your prep path.",
        });
      }
    } catch (err) {
      console.error("Failed to update task completion:", err);
      toast({
        title: "Update failed",
        description: "Could not save task state. Please try again.",
        variant: "destructive",
      });
    }
  };

  // ─── In-View Regeneration ───────────────────────────────────────────────────

  const handleRegenerateFromView = async (options: CreatePlanOptions) => {
    if (!plan) return;
    setIsRegenerating(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const newPlan = await createAndPersistCareerPlan(
        user.id,
        plan.target_role,
        { id: plan.job_recommendation_id || undefined },
        options
      );

      setCustomizeModalOpen(false);
      toast({
        title: "Roadmap Updated",
        description: `Successfully regenerated ${options.durationWeeks || 4}-Week roadmap for ${plan.target_role}.`,
      });

      // Load new plan
      navigate(`/career-plan/${newPlan.id}`);
    } catch (err: any) {
      console.error("Failed to regenerate plan:", err);
      toast({
        title: "Regeneration error",
        description: err.message || "Failed to update roadmap duration.",
        variant: "destructive",
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  // ─── Filtered Resources ─────────────────────────────────────────────────────

  const filteredResources = useMemo(() => {
    if (!plan?.resources) return [];
    if (resourceCategory === "all") return plan.resources;
    if (resourceCategory === "course") {
      return plan.resources.filter((r) => r.type === "course" || r.platform === "Udemy" || r.platform === "Coursera");
    }
    if (resourceCategory === "practice") {
      return plan.resources.filter(
        (r) => r.type === "practice" || r.platform === "NeetCode" || r.platform === "Voke AI" || r.platform === "GreatFrontend"
      );
    }
    if (resourceCategory === "book") {
      return plan.resources.filter((r) => r.type === "book" || r.type === "documentation");
    }
    if (resourceCategory === "free") {
      return plan.resources.filter((r) => r.cost === "free");
    }
    return plan.resources;
  }, [plan, resourceCategory]);

  // ─── Loading & Empty States ──────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-full border-4 border-sky-500/20 border-t-sky-500 animate-spin" />
            <div className="absolute inset-0 flex items-center justify-center">
              <Sparkles className="h-6 w-6 text-sky-500 animate-pulse" />
            </div>
          </div>
          <p className="text-muted-foreground animate-pulse font-mono tracking-widest uppercase text-xs">
            Loading Tailored Neural Roadmap...
          </p>
        </div>
      </div>
    );
  }

  if (!plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 text-center border-white/10 bg-card/30 backdrop-blur-xl max-w-md w-full rounded-3xl">
          <Target className="w-12 h-12 text-sky-400 mx-auto mb-4 opacity-80" />
          <h2 className="text-xl font-bold mb-2">Roadmap Not Found</h2>
          <p className="text-muted-foreground text-sm mb-6 leading-relaxed">
            The requested career roadmap could not be loaded or has been archived.
          </p>
          <Button
            onClick={() => navigate("/job-recommendations")}
            className="rounded-full bg-sky-600 hover:bg-sky-700 text-white font-semibold"
          >
            Back to Job Matches
          </Button>
        </Card>
      </div>
    );
  }

  // Determine Tab Configuration (Weekly vs Monthly based on duration)
  const isMonthView = totalWeeks > 4;
  const tabKeys = isMonthView
    ? Array.from({ length: Math.ceil(totalWeeks / 4) }, (_, i) => (i + 1).toString())
    : plan.weekly_tasks.map((w) => w.week.toString());

  const getWeeksForTab = (tabVal: string): WeeklyTask[] => {
    if (tabVal === "all") return plan.weekly_tasks;
    if (isMonthView) {
      const mNum = parseInt(tabVal);
      return plan.weekly_tasks.filter((w) => w.month === mNum);
    }
    const wNum = parseInt(tabVal);
    return plan.weekly_tasks.filter((w) => w.week === wNum);
  };

  const getMilestoneForTab = (tabVal: string): Milestone | undefined => {
    if (!plan.milestones || plan.milestones.length === 0) return undefined;
    if (isMonthView) {
      const mNum = parseInt(tabVal);
      return plan.milestones.find((m) => m.month === mNum) || plan.milestones[mNum - 1];
    }
    const wNum = parseInt(tabVal);
    return plan.milestones.find((m) => m.week === wNum) || plan.milestones[0];
  };

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-sky-500/30 overflow-x-hidden relative">
      {/* Ambient Moody Backlights */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-8%] left-[-8%] w-[520px] h-[520px] rounded-full bg-sky-600/8 blur-[140px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[520px] h-[520px] rounded-full bg-blue-600/8 blur-[140px]" />
        <div className="absolute inset-0 bg-[radial-gradient(#ffffff0a_1px,transparent_1px)] [background-size:28px_28px] opacity-40 pointer-events-none" />
      </div>

      {/* Sticky Header */}
      <motion.header
        initial={{ y: -20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? "bg-background/85 backdrop-blur-xl border-b border-white/5 shadow-xl shadow-black/20"
            : "bg-transparent"
        }`}
      >
        <div className="container mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/job-recommendations")}
              className="rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
              title="Back to Job Recommendations"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col">
              <h1 className="text-base sm:text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-500 leading-tight">
                Neural Prep Roadmap
              </h1>
              <span className="text-[11px] text-muted-foreground font-semibold flex items-center gap-1.5 truncate max-w-[220px] sm:max-w-md">
                <Target className="w-3 h-3 text-sky-400 shrink-0" />
                {plan.target_role}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Customize / Change Duration Modal Trigger */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCustomizeModalOpen(true)}
              className="border-sky-500/30 hover:bg-sky-500/10 text-sky-400 rounded-full text-xs h-8 px-3.5 gap-1.5 shadow-2xs font-semibold"
            >
              <SlidersHorizontal className="h-3.5 w-3.5 text-sky-400" />
              <span className="hidden sm:inline">Customize Duration</span>
              <span className="sm:hidden">Change</span>
            </Button>

            {/* Export PDF Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={() => window.print()}
              className="hidden md:flex border-white/10 hover:bg-secondary text-muted-foreground hover:text-foreground rounded-full text-xs h-8 px-3 gap-1.5"
            >
              <Download className="h-3.5 w-3.5" />
              Export PDF
            </Button>

            {/* Progress Circular Badge */}
            <div className="h-8.5 w-8.5 rounded-full bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20 text-white font-extrabold text-xs ring-2 ring-white/10">
              {taskStats.percent}%
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Container */}
      <main className="container mx-auto px-4 pt-24 pb-20 max-w-6xl relative z-10">
        {/* ══════════════════════════════════════════════════════════════════
            1. TRAJECTORY STATUS HERO BANNER
        ══════════════════════════════════════════════════════════════════ */}
        <div className="grid lg:grid-cols-12 gap-6 mb-10">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-8 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/60 via-card/30 to-background/50 backdrop-blur-xl p-6 sm:p-8 shadow-2xl"
          >
            <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 pointer-events-none" />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="text-xs uppercase font-mono tracking-widest text-sky-400 font-bold">
                      Personalized Roadmap
                    </span>
                    <Badge className="bg-sky-500/15 text-sky-400 border-sky-500/30 text-[10px] px-2 py-0.5">
                      {durationInfo.label}
                    </Badge>
                  </div>
                  <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
                    {plan.target_role}
                  </h2>
                </div>

                <Badge
                  variant="outline"
                  className="border-emerald-500/30 text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-full uppercase text-[10px] tracking-widest font-bold"
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse mr-2" />
                  Active Curriculum
                </Badge>
              </div>

              {/* Progress Bar & Metric Numbers */}
              <div className="space-y-4">
                <div className="flex justify-between items-center text-xs font-semibold text-zinc-300">
                  <span>Curriculum Completion</span>
                  <span className="text-sky-400 font-bold">{taskStats.percent}% Complete</span>
                </div>
                <div className="h-2.5 w-full bg-secondary/60 rounded-full overflow-hidden p-0.5 border border-white/5">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${taskStats.percent}%` }}
                    transition={{ duration: 0.8, ease: "easeOut" }}
                    className="h-full bg-gradient-to-r from-sky-500 via-cyan-400 to-blue-600 rounded-full shadow-sm"
                  />
                </div>

                {/* 3 Status Cards */}
                <div className="grid grid-cols-3 gap-3 pt-3">
                  {/* Experience Level */}
                  <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/30 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                      Level
                    </span>
                    <span className="font-bold text-sm text-white flex items-center gap-1.5 capitalize">
                      <Crown className="w-3.5 h-3.5 text-yellow-400 shrink-0" />
                      {experienceLevel}
                    </span>
                  </div>

                  {/* Tasks Counter */}
                  <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/30 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                      Tasks
                    </span>
                    <span className="font-bold text-sm text-white flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      {taskStats.completed}/{taskStats.total}
                    </span>
                  </div>

                  {/* Duration Label */}
                  <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/30 border border-white/5">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">
                      Duration
                    </span>
                    <span className="font-bold text-sm text-white flex items-center gap-1.5 truncate">
                      <Clock className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                      {totalWeeks} {totalWeeks === 1 ? "Week" : "Weeks"}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Current Focus Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="lg:col-span-4 rounded-3xl border border-white/10 bg-card/40 backdrop-blur-xl p-6 flex flex-col justify-between relative shadow-xl overflow-hidden"
          >
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-sky-500 to-transparent opacity-70" />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-base flex items-center gap-2 text-white">
                  <Zap className="w-4 h-4 text-yellow-400" />
                  Primary Focus Areas
                </h3>
                <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400">
                  Sprint Target
                </Badge>
              </div>

              <div className="space-y-2.5">
                {(
                  plan.month_1_goals?.focus_areas || [
                    "High-Frequency Algorithmic Patterns",
                    "System Architecture & Data Flow",
                    "Technical Mock Interview Drills",
                  ]
                )
                  .slice(0, 3)
                  .map((area: string, idx: number) => (
                    <div
                      key={idx}
                      className="flex items-start gap-3 p-3 rounded-xl bg-secondary/40 border border-white/5"
                    >
                      <span className="flex-shrink-0 w-6 h-6 rounded-lg bg-sky-500/15 flex items-center justify-center text-xs font-bold text-sky-400 border border-sky-500/25">
                        {idx + 1}
                      </span>
                      <span className="text-xs font-medium text-zinc-200 leading-snug pt-0.5">{area}</span>
                    </div>
                  ))}
              </div>
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCustomizeModalOpen(true)}
              className="mt-5 w-full rounded-xl border-sky-500/30 text-sky-400 hover:bg-sky-500/10 text-xs font-semibold h-9"
            >
              Reconfigure Duration or Goals
            </Button>
          </motion.div>
        </div>

        {/* ══════════════════════════════════════════════════════════════════
            2. INTERACTIVE TIMELINE & WEEK-BY-WEEK MODULES
        ══════════════════════════════════════════════════════════════════ */}
        <section className="mb-16">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <h3 className="text-xl font-bold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-sky-400" />
                Week-by-Week Curriculum
              </h3>
              <p className="text-muted-foreground text-xs mt-0.5">
                Check off tasks as you complete them to automatically advance your readiness score.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedTab(selectedTab === "all" ? "1" : "all")}
                className={cn(
                  "rounded-full text-xs h-8 px-3.5 border-white/10 font-semibold transition-all",
                  selectedTab === "all"
                    ? "bg-sky-600 text-white border-sky-500"
                    : "text-zinc-300 hover:text-white hover:bg-white/5"
                )}
              >
                {selectedTab === "all" ? "Showing All Weeks" : "View All Weeks"}
              </Button>
            </div>
          </div>

          {/* Tabs Navigation */}
          {selectedTab !== "all" && (
            <div className="flex justify-start sm:justify-center overflow-x-auto pb-3 mb-6 no-scrollbar">
              <div role="tablist" className="h-auto p-1.5 bg-zinc-900/80 backdrop-blur-md border border-white/10 rounded-full flex gap-1">
                {tabKeys.map((key) => {
                  const isActive = selectedTab === key;
                  return (
                    <button
                      key={key}
                      onClick={() => setSelectedTab(key)}
                      className={cn(
                        "rounded-full px-5 py-2 text-xs font-bold transition-all duration-200 flex items-center gap-1.5 whitespace-nowrap select-none",
                        isActive
                          ? "bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/25"
                          : "text-zinc-400 hover:text-white hover:bg-white/5"
                      )}
                    >
                      <Calendar className="h-3.5 w-3.5" />
                      {isMonthView ? `Month ${key}` : `Week ${key}`}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Weekly Tasks Grid & Milestones */}
          <div className="grid lg:grid-cols-12 gap-8">
            {/* Left Column: Weekly Tasks */}
            <div className="lg:col-span-8 space-y-6">
              {getWeeksForTab(selectedTab).map((weekData) => {
                const weekIndex = plan.weekly_tasks.findIndex((w) => w.week === weekData.week);
                const items = weekData.task_items || [];
                const completedInWeek = items.filter((t) => t.completed).length;

                return (
                  <motion.div
                    key={weekData.week}
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="bg-card/40 backdrop-blur-md border border-white/10 rounded-3xl p-6 sm:p-7 shadow-xl hover:border-white/15 transition-all"
                  >
                    {/* Week Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3 pb-4 mb-5 border-b border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center font-bold text-sky-400 text-sm">
                          {weekData.week}
                        </div>
                        <div>
                          <h4 className="font-bold text-base text-white leading-tight">
                            {weekData.title || `Week ${weekData.week}`}
                          </h4>
                          {weekData.focus && (
                            <span className="text-xs text-sky-400/90 font-medium block mt-0.5">
                              {weekData.focus}
                            </span>
                          )}
                        </div>
                      </div>

                      <Badge
                        variant="outline"
                        className={cn(
                          "text-xs px-2.5 py-0.5 font-bold transition-all",
                          weekData.completed
                            ? "border-emerald-500/40 text-emerald-400 bg-emerald-500/10"
                            : "border-white/10 text-zinc-400"
                        )}
                      >
                        {completedInWeek}/{items.length} Completed
                      </Badge>
                    </div>

                    {/* Task Checkbox List */}
                    <div className="space-y-3">
                      {items.map((taskItem, tIdx) => {
                        return (
                          <div
                            key={taskItem.id || tIdx}
                            onClick={() => toggleTaskItem(weekIndex, tIdx)}
                            className={cn(
                              "group flex items-start gap-3.5 p-3.5 rounded-2xl border transition-all cursor-pointer select-none",
                              taskItem.completed
                                ? "bg-emerald-500/5 border-emerald-500/20 text-zinc-400"
                                : "bg-secondary/30 hover:bg-secondary/50 border-white/5 hover:border-sky-500/30 text-zinc-200 hover:text-white"
                            )}
                          >
                            <Checkbox
                              checked={taskItem.completed}
                              onCheckedChange={() => toggleTaskItem(weekIndex, tIdx)}
                              className={cn(
                                "mt-0.5 transition-all",
                                taskItem.completed
                                  ? "data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500"
                                  : "border-zinc-500"
                              )}
                            />
                            <span
                              className={cn(
                                "text-xs sm:text-sm leading-relaxed transition-all",
                                taskItem.completed && "line-through text-zinc-500"
                              )}
                            >
                              {taskItem.text}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                );
              })}
            </div>

            {/* Right Column: Milestone Objective Card */}
            <div className="lg:col-span-4 space-y-6">
              {getMilestoneForTab(selectedTab) && (
                <div className="rounded-3xl p-6 border border-amber-500/30 bg-gradient-to-b from-amber-500/10 via-amber-500/5 to-transparent relative overflow-hidden shadow-xl">
                  <div className="absolute top-0 right-0 p-16 bg-amber-500/10 blur-3xl rounded-full -mr-10 -mt-10 pointer-events-none" />

                  <div className="flex items-center gap-2 mb-3 text-amber-400">
                    <Trophy className="h-5 w-5" />
                    <span className="font-extrabold tracking-widest text-[11px] uppercase">
                      Milestone Objective
                    </span>
                  </div>

                  <h4 className="font-bold text-lg text-white mb-2 relative z-10">
                    {getMilestoneForTab(selectedTab)?.title}
                  </h4>
                  <p className="text-xs text-zinc-300 leading-relaxed mb-5 relative z-10">
                    {getMilestoneForTab(selectedTab)?.description}
                  </p>

                  <div className="p-3 rounded-2xl bg-zinc-950/60 border border-amber-500/20 flex items-center justify-between">
                    <span className="text-xs text-zinc-400 font-medium">Sprint Goal Target</span>
                    <Badge className="bg-amber-500/20 text-amber-300 border-amber-500/30 text-[10px] font-bold">
                      VERIFIED TARGET
                    </Badge>
                  </div>
                </div>
              )}

              {/* Quick AI Mock Drill Card */}
              <div className="rounded-3xl border border-sky-500/25 bg-gradient-to-br from-sky-500/10 to-blue-600/5 p-6 backdrop-blur-xl">
                <div className="flex items-center gap-2 text-sky-400 mb-2">
                  <Video className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">Interactive Drill</span>
                </div>
                <h4 className="font-bold text-base text-white mb-1.5">
                  Test This Week's Skills with AI
                </h4>
                <p className="text-xs text-zinc-400 leading-relaxed mb-4">
                  Run a simulated 20-minute technical audio-video mock round on Voke to benchmark delivery and confidence.
                </p>
                <Button
                  onClick={() => navigate("/interview")}
                  className="w-full rounded-xl bg-sky-600 hover:bg-sky-700 text-white font-bold text-xs h-9 shadow-lg shadow-sky-500/20 gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Launch Voke AI Mock Round
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ══════════════════════════════════════════════════════════════════
            3. COMPREHENSIVE COURSE & LEARNING RESOURCE LIBRARY
        ══════════════════════════════════════════════════════════════════ */}
        <section className="pt-8 border-t border-white/10">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Badge className="bg-blue-500/15 text-blue-400 border-blue-500/30 text-[10px] font-bold uppercase">
                  Curated Catalog
                </Badge>
                <span className="text-xs text-zinc-400">
                  {filteredResources.length} Verified Recommendations
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-sky-400" />
                Recommended Courses & Learning Paths
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Top online video courses, practice platforms, and architectural books mapped directly to your target role.
              </p>
            </div>

            {/* Resource Category Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar">
              {[
                { key: "all", label: "All" },
                { key: "course", label: "Video Courses" },
                { key: "practice", label: "Practice Sandboxes" },
                { key: "book", label: "Books & Guides" },
                { key: "free", label: "Free Only" },
              ].map((cat) => (
                <button
                  key={cat.key}
                  onClick={() => setResourceCategory(cat.key)}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap",
                    resourceCategory === cat.key
                      ? "bg-sky-600 text-white border-sky-500 shadow-xs"
                      : "bg-secondary/40 border-white/5 text-zinc-400 hover:text-white hover:bg-secondary"
                  )}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Resources Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredResources.map((resource, idx) => (
              <a
                key={idx}
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="group p-5 rounded-3xl bg-card/40 hover:bg-card/70 border border-white/10 hover:border-sky-500/40 transition-all flex flex-col justify-between shadow-lg relative overflow-hidden select-none"
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-2.5">
                    <div className="flex items-center gap-2">
                      <Badge className="bg-sky-500/10 text-sky-400 border-sky-500/25 text-[10px] font-bold uppercase">
                        {resource.platform || "Online Course"}
                      </Badge>
                      <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400 capitalize">
                        {resource.type}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {resource.rating && (
                        <span className="text-[11px] font-bold text-amber-400 flex items-center gap-0.5">
                          {resource.rating}
                        </span>
                      )}
                      <span
                        className={cn(
                          "text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full border",
                          resource.cost === "free"
                            ? "border-emerald-500/30 text-emerald-400 bg-emerald-500/10"
                            : "border-amber-500/30 text-amber-400 bg-amber-500/10"
                        )}
                      >
                        {resource.cost}
                      </span>
                    </div>
                  </div>

                  <h4 className="font-bold text-sm sm:text-base text-white group-hover:text-sky-300 transition-colors line-clamp-2 mb-2">
                    {resource.title}
                  </h4>

                  <p className="text-xs text-zinc-400 leading-relaxed line-clamp-3 mb-4">
                    {resource.description}
                  </p>
                </div>

                <div className="pt-3 border-t border-white/5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 text-zinc-400 text-[11px]">
                    {resource.duration && (
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3 text-zinc-500" />
                        {resource.duration}
                      </span>
                    )}
                  </div>

                  <span className="font-bold text-sky-400 flex items-center gap-1 group-hover:translate-x-0.5 transition-transform text-xs">
                    Start Learning
                    <ExternalLink className="w-3 h-3 ml-0.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </section>
      </main>

      {/* ══════════════════════════════════════════════════════════════════
          4. IN-VIEW CUSTOMIZE ROADMAP MODAL
      ══════════════════════════════════════════════════════════════════ */}
      <RoadmapCustomizeModal
        isOpen={customizeModalOpen}
        onClose={() => setCustomizeModalOpen(false)}
        targetRole={plan.target_role}
        initialDuration={totalWeeks}
        initialLevel={experienceLevel}
        onGenerate={handleRegenerateFromView}
        isLoading={isRegenerating}
      />
    </div>
  );
}
