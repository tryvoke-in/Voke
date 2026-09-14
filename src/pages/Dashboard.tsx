import { useEffect, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText, LogOut, TrendingUp, Upload, Play, Target, Users, Mic, Settings,
  Flame, Trophy, Clock, Star, ArrowRight, Zap, Code, MessageSquare, Bell, Search, X,
  Globe, Briefcase, FileQuestion, ChevronRight, ChevronDown, ChevronUp, Sparkles, Lock, LayoutDashboard,
  Bot, Video, Compass, Crown, Terminal, Brain, GraduationCap, Award, CalendarDays
} from "lucide-react";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";
import { ProgressPanel } from "@/components/dashboard/ProgressPanel";
import { DSAPreparationBanner } from "@/components/dashboard/DSAPreparationBanner";
import { RoadToOffer } from "@/components/dashboard/RoadToOffer";
import { CareerJourneyMap } from "@/components/dashboard/CareerJourneyMap";
import { ReferralButton } from "@/components/dashboard/ReferralButton";
import { UpgradeButton } from "@/components/UpgradeButton";
import { Sidebar } from "@/components/Sidebar";
import { DailyQuestionWidget } from "@/components/dashboard/DailyQuestionWidget";
import { WeeklyGoals } from "@/components/dashboard/WeeklyGoals";
import { InterviewCalendarWidget } from "@/components/dashboard/InterviewCalendarWidget";
import { CompactAICoach } from "@/components/dashboard/CompactAICoach";
import { collegeService } from "@/services/collegeService";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Footer } from "@/components/Footer";
import { getDailyQuestion } from "@/data/questions";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { FeedbackFormDialog } from "@/components/FeedbackFormDialog";
import { DashboardSearchBar } from "@/components/dashboard/DashboardSearchBar";
import { CodingProfilesDialog } from "@/components/CodingProfilesDialog";
import { InteractiveTour } from "@/components/dashboard/InteractiveTour";

interface Notification {
  id: string;
  title: string;
  message: string;
  time: string;
  read: boolean;
  type: 'info' | 'success' | 'warning';
}

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [allSessions, setAllSessions] = useState<any[]>([]);
  const [communityPulsePosts, setCommunityPulsePosts] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [userStreak, setUserStreak] = useState(0);
  const [questionStreak, setQuestionStreak] = useState(0);

  const {
    isPremium,
    refreshCredits,
    grantFeedbackCredits,
    creditsElite,
    creditsVoice,
    creditsVideo,
    hasGivenFeedback
  } = useInterviewCredits();
  const totalCredits = creditsElite + creditsVoice + creditsVideo;
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [userId, setUserId] = useState<string>("");
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [showMoreActions, setShowMoreActions] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const isUnlimited = isPremium || creditsElite >= 999;
    const creditsValue = isUnlimited ? "Unlimited" : `${creditsVoice + creditsVideo}`;
    setRealStats(prev => prev.map(stat =>
      stat.label === "Credits"
        ? { ...stat, value: creditsValue }
        : stat
    ));
  }, [isPremium, creditsElite, creditsVoice, creditsVideo]);

  useEffect(() => {
    let active = true;
    let channel: any = null;

    // Safety fallback to release loading screen after 1.5 seconds if query or auth hangs
    const timer = setTimeout(() => {
      if (active) setLoading(false);
    }, 1500);

    const initDashboard = async () => {
      await checkAuth();
      await loadData();
      
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user || !active) return;

      fetchNotifications(user.id);

      // Subscribe to realtime notifications
      channel = supabase
        .channel('dashboard_notifications')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications' },
          (payload: any) => {
            if (payload.new.user_id === user.id && active) {
              fetchNotifications(user.id);
              toast.info("New notification: " + payload.new.title);
            }
          }
        )
        .subscribe();
    };

    initDashboard();

    return () => {
      active = false;
      clearTimeout(timer);
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, []);

  const fetchNotifications = async (userId: string) => {
    const { data } = await supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      const notifs = data as any as Notification[];
      setNotifications(notifs);
      setUnreadCount(notifs.filter(n => !n.read).length);
    }
  };

  const handleMarkAllAsRead = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    await supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('user_id', user.id);

    setNotifications(notifications.map(n => ({ ...n, read: true })));
    setUnreadCount(0);
    toast.success("All notifications marked as read");
  };

  const handleMarkAsRead = async (id: string) => {
    await supabase
      .from('notifications' as any)
      .update({ read: true })
      .eq('id', id);

    setNotifications(notifications.map(n =>
      n.id === id ? { ...n, read: true } : n
    ));
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  /* -------------------------------------------------------------------------- */
  /*                             Data Fetching & Logic                          */
  /* -------------------------------------------------------------------------- */

  const loadData = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }
      setUserId(user.id);

      // Check onboarding tour seen status
      const tourSeen = localStorage.getItem(`voke_tour_seen_${user.id}`);
      if (!tourSeen) {
        setIsTourOpen(true);
      }

      // 1. Fetch Profile
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData) {
        const profile = { ...profileData } as any;
        const userMetadata = user.user_metadata || {};
        if (!profile.avatar_url && userMetadata?.avatar_url) {
          profile.avatar_url = userMetadata.avatar_url;
        }
        if (
          (!profile.full_name || profile.full_name === "Anonymous User") &&
          (userMetadata?.full_name || userMetadata?.name)
        ) {
          profile.full_name = userMetadata.full_name || userMetadata.name;
        }
        if (!profile.full_name || profile.full_name === "Anonymous User") {
          profile.full_name = user.email?.split('@')[0] || "Anonymous User";
        }
        setProfile(profile);
      } else {
        const userMetadata = user.user_metadata || {};
        setProfile({
          full_name: userMetadata.full_name || userMetadata.name || user.email?.split('@')[0] || "Anonymous User",
          avatar_url: userMetadata.avatar_url || null
        });
      }

      // Sync student with their college
      if (user.email) {
        collegeService.recordStudentRegistration({
          email: user.email,
          fullName: user.user_metadata?.full_name || user.email.split('@')[0],
          targetRole: "Full Stack Developer",
          branch: "Computer Science & AI",
          batch: "2025"
        });
      }

      // 2. Fetch Text Interviews
      const { data: textSessions } = await supabase
        .from("interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // 3. Fetch Video Interviews
      const { data: videoSessions } = await supabase
        .from("video_interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      // 4. Fetch Peer Interviews (Host or Guest)
      const { data: peerSessions } = await supabase
        .from("peer_interview_sessions")
        .select("*, peer_interview_ratings(*)")
        .or(`host_user_id.eq.${user.id},guest_user_id.eq.${user.id}`)
        .order("scheduled_at", { ascending: false });

      // 5. Fetch Solved Questions
      const { data: solvedQuestions } = await supabase
        .from("solved_questions" as any)
        .select("*")
        .eq("user_id", user.id)
        .order("solved_at", { ascending: false });

      // 6. Fetch Community Pulse Posts
      const { data: postsData } = await supabase
        .from("community_feed" as any)
        .select("id, title, like_count, comment_count, created_at")
        .order("created_at", { ascending: false })
        .limit(3);

      if (postsData && postsData.length > 0) {
        setCommunityPulsePosts(postsData);
      }

      // Combine for "Recent Activity" list (Top 5) & ProgressPanel allSessions
      const allActivity = [
        ...(textSessions || []).map(s => ({ ...s, type: 'Text', date: s.created_at, score: s.overall_score })),
        ...(videoSessions || []).map(s => ({ ...s, type: 'Video', date: s.created_at, score: s.overall_score })),
        ...(peerSessions || []).map(s => {
          const myRating = s.peer_interview_ratings?.find((r: any) => r.rated_user_id === user.id);
          const ratingScore = myRating?.overall_score ? myRating.overall_score * 20 : null;
          return {
            ...s,
            type: 'Peer',
            date: s.scheduled_at || s.created_at,
            score: ratingScore,
            overall_score: ratingScore,
            confidence_score: myRating?.technical_score ? myRating.technical_score * 20 : null,
            delivery_score: myRating?.communication_score ? myRating.communication_score * 20 : null,
            body_language_score: myRating?.problem_solving_score ? myRating.problem_solving_score * 20 : null
          };
        }),
        ...(solvedQuestions || []).map((sq: any) => ({
          ...sq,
          id: sq.id || `sq-${sq.question_id}`,
          type: 'Coding Practice',
          date: sq.created_at || sq.solved_at || new Date().toISOString(),
          score: typeof sq.score === 'number' && sq.score > 0 ? sq.score : 85,
          overall_score: typeof sq.score === 'number' && sq.score > 0 ? sq.score : 85,
          confidence_score: 85,
          delivery_score: 80,
          total_duration_seconds: 600
        }))
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSessions(allActivity.slice(0, 5));
      setAllSessions(allActivity);

      // Calculate Question Solving Streak specifically
      const questionDates = (solvedQuestions || []).map((sq: any) => sq.solved_at || sq.created_at);
      const qStreak = calculateStreak(questionDates);
      setQuestionStreak(qStreak);

      // Calculate Stats (includes all activity for overall platform streak)
      const statsData = calculateRealStats(textSessions || [], videoSessions || [], peerSessions || [], user.id, solvedQuestions || []);
      setRealStats(statsData);

    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const calculateStreak = (dates: string[]) => {
    if (dates.length === 0) return 0;

    // Unique sorted dates YYYY-MM-DD (filtering out any invalid/null dates to prevent RangeErrors)
    const validDates = dates.filter(Boolean).map(d => {
      const date = new Date(d);
      return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
    }).filter(Boolean) as string[];

    const uniqueDates = Array.from(new Set(validDates))
      .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); // Descending

    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // If no activity today or yesterday, streak is broken
    if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
      return 0;
    }

    let streak = 0;
    const currentCheck = uniqueDates.includes(today) ? new Date(today) : new Date(yesterday);

    for (const dateStr of uniqueDates) {
      const date = new Date(dateStr);
      // Compare time values normalized to noon to avoid timezone issues with exact midnight
      const d1 = new Date(currentCheck).setHours(12, 0, 0, 0);
      const d2 = new Date(date).setHours(12, 0, 0, 0);

      if (d1 === d2) {
        streak++;
        currentCheck.setDate(currentCheck.getDate() - 1);
      } else {
        break; // Gap found
      }
    }
    return streak;
  };

  const calculateRealStats = (text: any[], video: any[], peer: any[], userId: string, solved: any[] = []) => {
    // 1. Total Count
    const total = text.length + video.length + peer.filter((p: any) => p.status === 'completed').length;

    // 2. Average Score
    let totalScore = 0;
    let scoredCount = 0;

    // Text
    text.forEach(s => {
      if (s.overall_score) { totalScore += s.overall_score; scoredCount++; }
    });
    // Video
    video.forEach(s => {
      if (s.overall_score) { totalScore += s.overall_score; scoredCount++; }
    });
    // Peer (Fetch ratings where user was rated)
    peer.forEach((p: any) => {
      const myRating = p.peer_interview_ratings?.find((r: any) => r.rated_user_id === userId);
      if (myRating && myRating.overall_score) { totalScore += myRating.overall_score * 20; scoredCount++; } // 1-5 scale mapped to percentage
    });

    const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

    // 3. Hours & Practice Time
    let totalSeconds = 0;
    text.forEach(s => {
      if (s.total_duration_seconds) totalSeconds += Number(s.total_duration_seconds);
      else if (s.duration_seconds) totalSeconds += Number(s.duration_seconds);
      else if (s.completed_at && s.created_at) {
        const diff = (new Date(s.completed_at).getTime() - new Date(s.created_at).getTime()) / 1000;
        if (diff > 0 && diff < 14400) totalSeconds += diff;
      }
    });
    video.forEach(s => {
      if (s.duration_seconds) totalSeconds += Number(s.duration_seconds);
      else if (s.total_duration_seconds) totalSeconds += Number(s.total_duration_seconds);
      else if (s.completed_at && s.created_at) {
        const diff = (new Date(s.completed_at).getTime() - new Date(s.created_at).getTime()) / 1000;
        if (diff > 0 && diff < 14400) totalSeconds += diff;
      }
    });
    peer.filter((p: any) => p.status === 'completed').forEach((p: any) => {
      if (p.duration_minutes) totalSeconds += Number(p.duration_minutes) * 60;
      else if (p.duration_seconds) totalSeconds += Number(p.duration_seconds);
    });

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const hoursDisplay = hours > 0 ? (minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`) : `${minutes}m`;

    // 4. Overall Platform Streak (all platform features)
    const allDates = [
      ...text.map(s => s.created_at),
      ...video.map(s => s.created_at),
      ...peer.map(s => s.scheduled_at || s.created_at),
      ...solved.map((sq: any) => sq.solved_at || sq.created_at)
    ];
    const streak = calculateStreak(allDates);
    setUserStreak(streak);

    const isUnlimited = isPremium || creditsElite >= 999;
    const creditsValue = isUnlimited ? "Unlimited" : `${creditsVoice + creditsVideo}`;

    return [
      { label: "Interviews", value: total.toString(), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Avg. Score", value: `${avgScore}%`, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Time", value: hoursDisplay, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: "Credits", value: creditsValue, icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
    ];
  };

  const [realStats, setRealStats] = useState([
    { label: "Interviews", value: "0", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Avg. Score", value: "0%", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Time", value: "0h", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Credits", value: "Unlimited", icon: Star, color: "text-amber-400", bg: "bg-amber-500/10" },
  ]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const sidebarItems = [
    {
      id: "dashboard",
      label: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
      color: "text-sky-500",
      hoverBg: "hover:bg-sky-500/10 hover:text-sky-500",
    },
    {
      id: "job-recommendations",
      label: "Job Matches",
      icon: Briefcase,
      path: "/job-recommendations",
      color: "text-amber-500",
      hoverBg: "hover:bg-amber-500/10 hover:text-amber-500",
    },
    {
      id: "interview-new",
      label: "Text Interview",
      icon: MessageSquare,
      path: "/interview/new",
      color: "text-sky-500",
      hoverBg: "hover:bg-sky-500/10 hover:text-sky-500",
    },
    {
      id: "voice-assistant",
      label: "AI Voice Agent",
      icon: Mic,
      path: "/voice-assistant",
      color: "text-pink-500",
      hoverBg: "hover:bg-pink-500/10 hover:text-pink-500",
    },
    {
      id: "resume-builder",
      label: "Resume Builder",
      icon: FileText,
      path: "/resume-builder",
      color: "text-emerald-500",
      hoverBg: "hover:bg-emerald-500/10 hover:text-emerald-500",
    },
    {
      id: "elite-prep",
      label: "Elite Prep",
      icon: Zap,
      path: "/elite-prep",
      color: "text-blue-500",
      hoverBg: "hover:bg-blue-500/10 hover:text-blue-500",
    },
    {
      id: "video-interview",
      label: "Video Practice",
      icon: Play,
      path: "/video-interview",
      color: "text-blue-500",
      hoverBg: "hover:bg-blue-500/10 hover:text-blue-500",
    },
    {
      id: "playground",
      label: "Playground",
      icon: Code,
      path: "/playground",
      color: "text-indigo-500",
      hoverBg: "hover:bg-indigo-500/10 hover:text-indigo-500",
    },
    {
      id: "question-practice",
      label: "Question Practice",
      icon: FileQuestion,
      path: "/question-practice",
      color: "text-orange-500",
      hoverBg: "hover:bg-orange-500/10 hover:text-orange-500",
    },
    {
      id: "dsa-sheet",
      label: "DSA Sheet",
      icon: Code,
      path: "/dsa-sheet",
      color: "text-blue-500",
      hoverBg: "hover:bg-blue-500/10 hover:text-blue-500",
    },
    {
      id: "community",
      label: "Community",
      icon: Users,
      path: "/community",
      color: "text-pink-500",
      hoverBg: "hover:bg-pink-500/10 hover:text-pink-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-t-2 border-sky-500 rounded-full animate-spin"></div>
          <div className="absolute inset-3 border-t-2 border-blue-500 rounded-full animate-spin-reverse"></div>
        </div>
      </div>
    );
  }

  const scoredSessions = (allSessions || [])
    .filter((s: any) => typeof s.score === "number" && !isNaN(s.score))
    .sort((a: any, b: any) => new Date(a.date || a.created_at).getTime() - new Date(b.date || b.created_at).getTime());

  const currentOverallScore = scoredSessions.length > 0 
    ? scoredSessions[scoredSessions.length - 1].score 
    : 10;

  const startingScore = scoredSessions.length > 0 ? scoredSessions[0].score : 0;
  const scoreDifference = scoredSessions.length >= 2 
    ? currentOverallScore - startingScore 
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-x-hidden">
      {/* Subtle Ambient Background Effects */}
      <div className="fixed inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-10%,rgba(120,119,198,0.04),transparent)] dark:bg-[radial-gradient(ellipse_70%_40%_at_50%_-10%,rgba(255,255,255,0.015),transparent)] pointer-events-none z-0" />

      {/* Header */}
      <header className={`fixed z-[100] backdrop-blur-xl transition-all duration-500 ${isScrolled ? "top-1 left-4 right-4 md:left-8 md:right-8 bg-white/70 dark:bg-background/85 border border-gray-200/50 dark:border-border/60 rounded-full shadow-lg shadow-black/5 dark:shadow-black/20" : "top-0 left-0 right-0 bg-white/50 dark:bg-background/85 border-b border-gray-200/50 dark:border-border/60"}`}>
        <div className={`container mx-auto px-4 flex items-center justify-between transition-all duration-500 ${isScrolled ? "py-1" : "py-2"}`}>
          <div className="flex items-center gap-0.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img
              src="/images/voke_logo.png"
              alt="Voke Logo"
              className="w-14 h-14 object-contain"
            />
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Voke</h1>
          </div>

          <div className="flex-1 max-w-md ml-3 mr-9 hidden md:flex items-center gap-3">
            <DashboardSearchBar className="flex-1" />
            <ReferralButton />
          </div>

          <nav className="flex items-center gap-3.5">
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden text-muted-foreground hover:text-foreground"
              onClick={() => setMobileSearchOpen((prev) => !prev)}
            >
              {mobileSearchOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
            </Button>
            <div className="md:hidden">
              <ReferralButton iconOnly />
            </div>
            <UpgradeButton />
            <ThemeToggle />

            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                {/* <p className="text-xs text-muted-foreground">
                  Level {Math.floor(parseInt(realStats[0].value) / 5) + 1} Scholar
                </p> */}
              </div>

              {/* Profile Strength Ring */}
              {(() => {
                const score = (() => {
                  if (!profile) return 0;
                  let s = 0;
                  const fields = ['full_name', 'linkedin_url', 'github_url', 'resume_url'];
                  fields.forEach(k => { if (profile[k]) s += 25; });
                  return s;
                })();
                const strokeColor = score === 100 ? "#10b981" : score >= 50 ? "#eab308" : "#ef4444";
                const radius = 20;
                const circumference = 2 * Math.PI * radius;
                const offset = circumference - (score / 100) * circumference;

                return (
                  <div id="tour-profile" className="relative flex items-center justify-center w-12 h-12 cursor-pointer group" onClick={() => navigate("/profile")}>
                    {/* Tooltip */}
                    <div className="absolute top-14 right-0 w-max px-3 py-1.5 bg-popover border border-border text-xs font-medium rounded-md shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50">
                      Profile Strength: <span style={{ color: strokeColor }}>{score}%</span>
                    </div>

                    <svg className="absolute w-full h-full transform -rotate-90">
                      <circle cx="24" cy="24" r={radius} stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-muted/20" />
                      <circle cx="24" cy="24" r={radius} stroke={strokeColor} strokeWidth="2.5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={offset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
                    </svg>

                    <Avatar className="w-8 h-8">
                      <AvatarImage src={profile?.avatar_url} />
                      <AvatarFallback className="bg-gradient-to-br from-sky-500 to-blue-500 text-white text-xs">
                        {(profile?.full_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                );
              })()}
            </div>

            {/* <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              className="text-red-500 hover:bg-red-500/10 hover:text-red-600 h-9 w-9 rounded-full transition-colors flex items-center justify-center ml-1"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </Button> */}
          </nav>
        </div>

        {/* Mobile Search Bar Dropdown Expansion */}
        {mobileSearchOpen && (
          <div className="md:hidden px-4 pb-3 pt-1 border-t border-border/40 bg-background/95 backdrop-blur-md">
            <DashboardSearchBar isMobile onCloseMobile={() => setMobileSearchOpen(false)} />
          </div>
        )}
      </header>

      {/* Main Layout Container */}
      <div className="flex-1 flex w-full min-w-0 relative pt-[72px]">
        {/* Sidebar */}
        <Sidebar />

        {/* Main App Container */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Main Content */}
          <main className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

              {/* Left Column - Main Feed */}
              <div className="lg:col-span-8 space-y-8">
                <CodingProfilesDialog profile={profile} onUpdate={() => loadData(true)} />

                {/* Hero Section */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="relative overflow-hidden rounded-3xl bg-[#5E37E8] text-white px-6 sm:px-8 py-5 shadow-xl flex flex-col justify-center min-h-[210px] sm:h-[222px]"
                >
                  <div className="relative z-10 max-w-[480px]">
                    {/* Top Pill Badge: GOOD AFTERNOON, PRIYANSHU 👏 */}
                    <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 backdrop-blur-xs text-white text-[10.5px] font-semibold tracking-wider uppercase mb-2">
                      <span>GOOD AFTERNOON, {profile?.full_name?.split(' ')[0]?.toUpperCase() || "PRIYANSHU"}</span>
                      <span>👏</span>
                    </div>

                    {/* Main Heading */}
                    <h2 className="text-2xl sm:text-[28px] font-extrabold text-white tracking-tight leading-tight mb-1">
                      Ready to ace your next interview?
                    </h2>

                    {/* Subheadline */}
                    <p className="text-white/90 text-xs sm:text-[13px] font-normal mb-4">
                      Practice with AI. Get real feedback. Build your confidence.
                    </p>

                    {/* Two Action Buttons */}
                    <div className="flex items-center gap-3">
                      <button
                        onClick={() => navigate("/interview/new")}
                        className="bg-white hover:bg-slate-50 text-slate-900 font-bold px-4 sm:px-5 py-2 rounded-xl shadow-xs text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Play className="w-3.5 h-3.5 fill-slate-900 text-slate-900" />
                        <span>Start an Interview</span>
                      </button>
                      <button
                        onClick={() => navigate("/job-recommendations")}
                        className="bg-white/10 hover:bg-white/20 text-white border border-white/35 font-medium px-4 sm:px-5 py-2 rounded-xl text-xs sm:text-sm flex items-center gap-2 transition-all cursor-pointer"
                      >
                        <Compass className="w-4 h-4 text-white" />
                        <span>Explore Roles</span>
                      </button>
                    </div>
                  </div>

                  {/* Right Side Complete Artwork from Reference Image */}
                  <div className="hidden sm:block absolute right-0 top-0 bottom-0 h-full w-[48%] max-w-[490px] pointer-events-none select-none">
                    <img
                      src="/images/hero_illustration_purple.png?v=1"
                      alt="AI Interview Prep"
                      className="h-full w-full object-cover object-right"
                      style={{
                        maskImage: "linear-gradient(to right, transparent 0%, black 30px)",
                        WebkitMaskImage: "linear-gradient(to right, transparent 0%, black 30px)"
                      }}
                    />
                  </div>
                </motion.div>



                {!isPremium && totalCredits === 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-3xl bg-card border border-amber-500/30 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left shadow-lg"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500 shrink-0">
                        <Lock className="w-5 h-5 text-amber-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-foreground">Mock Interviews Locked</h4>
                        <p className="text-xs text-muted-foreground">
                          {!hasGivenFeedback
                            ? "Give feedback to unlock 2 more free mock interviews."
                            : "Upgrade to Voke Elite for unlimited premium practice."}
                        </p>
                      </div>
                    </div>
                    {!hasGivenFeedback ? (
                      <Button
                        size="sm"
                        onClick={() => setShowFeedbackModal(true)}
                        className="bg-sky-600 hover:bg-sky-700 text-white font-semibold text-xs rounded-xl"
                      >
                        Give Feedback (+2 Credits)
                      </Button>
                    ) : (
                      <Button
                        size="sm"
                        onClick={() => navigate("/pricing")}
                        className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl"
                      >
                        Upgrade for ₹399
                      </Button>
                    )}
                  </motion.div>
                )}

                {/* Quick Actions Header & Grid */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <div className="flex items-center gap-2 flex-wrap">
                      <Zap className="w-5 h-5 text-amber-500 fill-amber-500 shrink-0" />
                      <h3 className="text-base sm:text-lg font-bold text-foreground">
                        Quick Actions
                      </h3>
                      <span className="text-xs sm:text-sm text-muted-foreground font-normal ml-1">
                        Jump into practice or explore popular options.
                      </span>
                    </div>

                    {/* Compact Mascot Dock & More Actions Toggle */}
                    <div className="flex items-center gap-3">
                      <CompactAICoach 
                        userStreak={userStreak} 
                        score={currentOverallScore} 
                        scoreChange={scoreDifference}
                        totalInterviews={allSessions?.length || 0}
                        hasGivenInterview={(allSessions?.length || 0) > 0}
                        userName={profile?.full_name?.split(' ')[0] || "Anurag"}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowMoreActions(prev => !prev)}
                        className="text-xs font-semibold h-8 px-3 rounded-xl border-border/60 hover:bg-muted/80 flex items-center gap-1.5 transition-all text-muted-foreground hover:text-foreground shadow-xs shrink-0"
                      >
                        <span>{showMoreActions ? "Show Less" : "More Actions"}</span>
                        <motion.div
                          animate={{ rotate: showMoreActions ? 180 : 0 }}
                          transition={{ duration: 0.2 }}
                        >
                          <ChevronDown className="w-3.5 h-3.5" />
                        </motion.div>
                      </Button>
                    </div>
                  </div>

                  {/* Top 4 Core Actions (Always Visible) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                      id="tour-text-interview"
                      onClick={() => navigate("/interview/new")}
                      className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                    >
                      <div className="w-11 h-11 rounded-full bg-blue-50 dark:bg-blue-500/15 dark:border dark:border-blue-400/30 flex items-center justify-center text-blue-600 dark:text-blue-300 group-hover:scale-105 transition-transform mb-4">
                        <Briefcase className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Text Interview</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">AI Chat Practice</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>

                    <div
                      id="tour-pro-interview"
                      onClick={() => navigate("/voice-assistant")}
                      className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                    >
                      <div className="w-11 h-11 rounded-full bg-rose-50 dark:bg-rose-500/15 dark:border dark:border-rose-400/30 flex items-center justify-center text-rose-500 dark:text-rose-300 group-hover:scale-105 transition-transform mb-4">
                        <Video className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Pro Interview</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Voice & Video AI</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>

                    <div
                      id="tour-job-matches"
                      onClick={() => navigate("/job-recommendations")}
                      className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                    >
                      <div className="w-11 h-11 rounded-full bg-purple-50 dark:bg-purple-500/15 dark:border dark:border-purple-400/30 flex items-center justify-center text-purple-600 dark:text-purple-300 group-hover:scale-105 transition-transform mb-4">
                        <CalendarDays className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Job Matches</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Find Your Role</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>

                    <div
                      id="tour-elite-prep"
                      onClick={() => navigate("/elite-prep")}
                      className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                    >
                      <div className="w-11 h-11 rounded-full bg-amber-50 dark:bg-amber-500/15 dark:border dark:border-amber-400/30 flex items-center justify-center text-amber-600 dark:text-amber-300 group-hover:scale-105 transition-transform mb-4">
                        <Crown className="w-5 h-5" />
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <div>
                          <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Elite Prep</h4>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Premium Interview Prep</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                      </div>
                    </div>
                  </div>

                  {/* Bottom 4 Actions (Smooth Expand/Collapse) */}
                  <AnimatePresence>
                    {showMoreActions && (
                      <motion.div
                        initial={{ opacity: 0, height: 0, marginTop: 0 }}
                        animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                        exit={{ opacity: 0, height: 0, marginTop: 0 }}
                        transition={{ duration: 0.3, ease: "easeInOut" }}
                        className="overflow-hidden"
                      >
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                          <div
                            id="tour-resume-builder"
                            onClick={() => navigate("/resume-builder")}
                            className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                          >
                            <div className="w-11 h-11 rounded-full bg-emerald-50 dark:bg-emerald-500/15 dark:border dark:border-emerald-400/30 flex items-center justify-center text-emerald-600 dark:text-emerald-300 group-hover:scale-105 transition-transform mb-4">
                              <FileText className="w-5 h-5" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Resume Builder</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">ATS-Ready Resume</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          </div>

                          <div
                            id="tour-playground"
                            onClick={() => navigate("/playground")}
                            className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                          >
                            <div className="w-11 h-11 rounded-full bg-indigo-50 dark:bg-indigo-500/15 dark:border dark:border-indigo-400/30 flex items-center justify-center text-indigo-600 dark:text-indigo-300 group-hover:scale-105 transition-transform mb-4">
                              <Terminal className="w-5 h-5" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Playground</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Code Sandbox</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          </div>

                          <div
                            id="tour-question-practice"
                            onClick={() => navigate("/question-practice")}
                            className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                          >
                            <div className="w-11 h-11 rounded-full bg-orange-50 dark:bg-orange-500/15 dark:border dark:border-orange-400/30 flex items-center justify-center text-orange-600 dark:text-orange-300 group-hover:scale-105 transition-transform mb-4">
                              <Brain className="w-5 h-5" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Question Practice</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Daily Challenges</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          </div>

                          <div
                            id="tour-community"
                            onClick={() => navigate("/community")}
                            className="rounded-2xl border border-slate-200/80 dark:border-border/90 bg-white dark:bg-card p-4 sm:p-5 flex flex-col justify-between hover:shadow-md hover:border-slate-300 dark:hover:border-slate-500/60 dark:hover:bg-muted/30 transition-all cursor-pointer group dark:shadow-md"
                          >
                            <div className="w-11 h-11 rounded-full bg-pink-50 dark:bg-pink-500/15 dark:border dark:border-pink-400/30 flex items-center justify-center text-pink-600 dark:text-pink-300 group-hover:scale-105 transition-transform mb-4">
                              <Users className="w-5 h-5" />
                            </div>
                            <div className="flex items-center justify-between gap-2">
                              <div>
                                <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100 group-hover:text-primary transition-colors">Community</h4>
                                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">Connect & Discuss</p>
                              </div>
                              <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-700 dark:group-hover:text-slate-200 group-hover:translate-x-0.5 transition-all shrink-0" />
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* 2 Core Track Cards in Left Column: Data Structures & Algorithms & Road to Google */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <DSAPreparationBanner />
                  <RoadToOffer profile={profile} onUpdate={() => loadData(true)} />
                </div>
              </div>

              {/* Right Column - Sidebar Widgets */}
              <div className="lg:col-span-4 space-y-8">
                {/* Progress Panel Widget */}
                <ProgressPanel allSessions={allSessions} />

                {/* Daily Practice Card (Lives directly beneath ProgressPanel, moves down smoothly when View Details expands without creating empty gaps below feature cards!) */}
                <motion.div
                  layout
                  transition={{ duration: 0.35, ease: "easeInOut" }}
                >
                  <DailyQuestionWidget questionStreak={questionStreak} userStreak={userStreak} />
                </motion.div>
              </div>
            </div>

            {/* Gamified Animated Career Journey */}
            <div className="mt-8">
              <CareerJourneyMap
                profile={profile}
                userStreak={userStreak}
                allSessions={allSessions}
              />
            </div>

            {/* Upcoming Interview Schedule & Events */}
            <div className="mt-8">
              <InterviewCalendarWidget userEmail={profile?.email} />
            </div>
          </main>

          <Footer />
        </div>
      </div>

      <FeedbackFormDialog
        open={showFeedbackModal}
        onOpenChange={setShowFeedbackModal}
        onSuccess={refreshCredits}
        grantFeedbackCredits={grantFeedbackCredits}
      />
      {userId && (
        <InteractiveTour
          userId={userId}
          isOpen={isTourOpen}
          onClose={() => setIsTourOpen(false)}
          userName={profile?.full_name}
          onTrackSelected={() => loadData(true)}
        />
      )}
    </div>
  );
};

export default Dashboard;
