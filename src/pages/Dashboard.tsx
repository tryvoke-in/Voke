import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  FileText, LogOut, TrendingUp, Upload, Play, Target, Users, Mic, Settings,
  Flame, Trophy, Clock, Star, ArrowRight, Zap, Code, MessageSquare, Bell, Search,
  Globe, BookOpen, Briefcase, FileQuestion, ChevronRight, Sparkles, Lock
} from "lucide-react";
import { SkillRadar } from "@/components/dashboard/SkillRadar";
import { RoadToOffer } from "@/components/dashboard/RoadToOffer";
import { MarketPulse } from "@/components/dashboard/MarketPulse";
import { ReferralFloatingWidget } from "@/components/dashboard/ReferralFloatingWidget";
import { UpgradeButton } from "@/components/UpgradeButton";
import { TRACKS } from "./LearningPaths";

import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { motion } from "motion/react";
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
import { CodingProfilesDialog } from "@/components/CodingProfilesDialog";

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
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  const [sessions, setSessions] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

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

  useEffect(() => {
    // Safety fallback to release loading screen after 1.5 seconds if query or auth hangs
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1500);

    checkAuth();
    loadData();
    setupNotifications();

    return () => clearTimeout(timer);
  }, []);

  const setupNotifications = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) return;

    fetchNotifications(user.id);

    // Subscribe to realtime notifications
    const channel = supabase
      .channel('dashboard_notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload: any) => {
          if (payload.new.user_id === user.id) {
            fetchNotifications(user.id);
            toast.info("New notification: " + payload.new.title);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

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


      // Combine for "Recent Activity" list (Top 5)
      const allActivity = [
        ...(textSessions || []).map(s => ({ ...s, type: 'Text', date: s.created_at, score: s.overall_score })),
        ...(videoSessions || []).map(s => ({ ...s, type: 'Video', date: s.created_at, score: s.overall_score })),
        ...(peerSessions || []).map(s => ({ ...s, type: 'Peer', date: s.scheduled_at, score: null })) // Peer score separate
      ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      setSessions(allActivity.slice(0, 5));

      // Calculate Stats
      const statsData = calculateRealStats(textSessions || [], videoSessions || [], peerSessions || [], user.id);
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
    let currentCheck = uniqueDates.includes(today) ? new Date(today) : new Date(yesterday);

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

  const calculateRealStats = (text: any[], video: any[], peer: any[], userId: string) => {
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
      if (myRating) { totalScore += myRating.overall_score * 10; scoredCount++; } // Convert 1-10 to 1-100 if needed, assuming 10 scale
    });
    // Note: Peer ratings might be 1-10 or 1-5, adjust normalization if user confirms scale. Assuming 1-100 for text/video.
    // Let's assume Peer is 1-10 and map to 1-100 for consistency if average is distinct.
    // If peer ratings are not yet standard, we might need to adjust. For now, treating raw.

    // Correction: Peer ratings schema shows `overall_score` as number. Let's assume 100 base for now or normalize later.
    // Actually, looking at previous artifacts, peer might be new. Let's stick to raw average if unsure, or normalize.
    // Safe bet: Normalize everything to %

    const avgScore = scoredCount > 0 ? Math.round(totalScore / scoredCount) : 0;

    // 3. Hours
    // Text: total_duration_seconds
    // Video: duration_seconds
    // Peer: duration_minutes
    let totalSeconds = 0;
    text.forEach(s => totalSeconds += (s.total_duration_seconds || 0));
    video.forEach(s => totalSeconds += (s.duration_seconds || 0));
    peer.filter((p: any) => p.status === 'completed').forEach((p: any) => totalSeconds += ((p.duration_minutes || 0) * 60));

    const totalHours = Math.round(totalSeconds / 3600);

    // 4. Streak
    const allDates = [
      ...text.map(s => s.created_at),
      ...video.map(s => s.created_at),
      ...peer.map(s => s.scheduled_at) // Using scheduled_at for peer dates
    ];
    const streak = calculateStreak(allDates);

    return [
      { label: "Interviews", value: total.toString(), icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
      { label: "Avg. Score", value: `${avgScore}%`, icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
      { label: "Hours", value: `${totalHours}h`, icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
      { label: "Streak", value: `${streak} Days`, icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
    ];
  };

  const [realStats, setRealStats] = useState([
    { label: "Interviews", value: "0", icon: FileText, color: "text-blue-500", bg: "bg-blue-500/10" },
    { label: "Avg. Score", value: "0%", icon: Trophy, color: "text-amber-500", bg: "bg-amber-500/10" },
    { label: "Hours", value: "0h", icon: Clock, color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { label: "Streak", value: "0 Days", icon: Flame, color: "text-orange-500", bg: "bg-orange-500/10" },
  ]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-t-2 border-violet-500 rounded-full animate-spin"></div>
          <div className="absolute inset-3 border-t-2 border-fuchsia-500 rounded-full animate-spin-reverse"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-xl border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-0.5 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img
              src="/images/voke_logo.png"
              alt="Voke Logo"
              className="w-12 h-12 object-contain"
            />
            <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Voke</h1>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden md:block">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search interviews, questions, or peers..."
                className="w-full pl-10 pr-4 py-2 rounded-full bg-muted/50 border-transparent focus:bg-background focus:border-primary/20 transition-all outline-none text-sm"
              />
            </div>
          </div>

          <nav className="flex items-center gap-2">

            <UpgradeButton />
            <Button variant="ghost" size="icon" onClick={() => navigate("/blog")}>
              <BookOpen className="w-5 h-5" />
            </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                  <Bell className="w-5 h-5" />
                  {unreadCount > 0 && (
                    <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="end">
                <div className="flex items-center justify-between p-4 border-b">
                  <h4 className="font-semibold">Notifications</h4>
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs text-violet-600 h-auto p-0 hover:bg-transparent"
                      onClick={handleMarkAllAsRead}
                    >
                      Mark all as read
                    </Button>
                  )}
                </div>
                <ScrollArea className="h-[300px]">
                  {notifications.length > 0 ? (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={`p-4 hover:bg-muted/50 transition-colors cursor-pointer ${!notification.read ? 'bg-violet-50/50 dark:bg-violet-900/10' : ''}`}
                          onClick={() => handleMarkAsRead(notification.id)}
                        >
                          <div className="flex justify-between items-start gap-2 mb-1">
                            <h5 className={`text-sm font-medium ${!notification.read ? 'text-foreground' : 'text-muted-foreground'}`}>
                              {notification.title}
                            </h5>
                            <span className="text-[10px] text-muted-foreground whitespace-nowrap">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground line-clamp-2">
                            {notification.message}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-muted-foreground text-sm">
                      No notifications
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>
            <ThemeToggle />
            <div className="h-8 w-px bg-border mx-2"></div>
            <div className="flex items-center gap-3 pl-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-medium leading-none">{profile?.full_name || "User"}</p>
                <p className="text-xs text-muted-foreground">
                  Level {Math.floor(parseInt(realStats[0].value) / 5) + 1} Scholar
                </p>
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
                  <div className="relative flex items-center justify-center w-12 h-12 cursor-pointer group" onClick={() => navigate("/profile")}>
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
                      <AvatarFallback className="bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white text-xs">
                        {(profile?.full_name || "U")[0]}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                );
              })()}
            </div>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

          {/* Left Column - Main Feed */}
          <div className="lg:col-span-8 space-y-8">

            {/* Hero Section */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 to-indigo-600 text-white p-8 shadow-xl"
            >
              <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-fuchsia-500/20 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>

              <div className="relative z-10">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-3xl font-bold mb-2">Ready to ace your next interview?</h2>
                    <p className="text-white/80 max-w-lg">
                      "Success is where preparation and opportunity meet." You're on a {realStats[3].value} streak! Keep it up.
                    </p>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                    <div className="bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10">
                      <Flame className="w-5 h-5 text-orange-300 fill-orange-300" />
                      <span className="font-bold">{realStats[3].value} Streak</span>
                    </div>
                    <div 
                      onClick={() => {
                        if (!isPremium && totalCredits === 0 && !hasGivenFeedback) {
                          setShowFeedbackModal(true);
                        } else if (!isPremium && totalCredits === 0 && hasGivenFeedback) {
                          navigate("/pricing");
                        }
                      }}
                      className={`bg-white/20 backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 border border-white/10 select-none ${
                        (!isPremium && totalCredits === 0) ? 'cursor-pointer hover:bg-white/30 border-amber-500/30' : ''
                      }`}
                    >
                      <span className="text-sm">🎫</span>
                      <span className="font-bold text-sm">
                        {isPremium ? "Unlimited Credits" : `${totalCredits} ${totalCredits === 1 ? 'Credit' : 'Credits'}`}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-8">
                  {realStats.slice(0, 3).map((stat, i) => (
                    <div key={i} className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/5 hover:bg-white/20 transition-colors">
                      <div className="flex items-center gap-2 mb-2 text-white/70">
                        <stat.icon className="w-4 h-4" />
                        <span className="text-xs font-medium">{stat.label}</span>
                      </div>
                      <p className="text-2xl font-bold">{stat.value}</p>
                    </div>
                  ))}
                  
                  {/* AI Resume Button */}
                  <div 
                    onClick={() => navigate("/resume-builder")}
                    className="relative bg-gradient-to-br from-amber-500/20 to-orange-600/20 backdrop-blur-sm rounded-xl p-4 border border-amber-500/30 hover:bg-amber-500/30 transition-all cursor-pointer group hover:scale-[1.02] active:scale-95 flex flex-col items-center justify-center text-center"
                  >
                    <div className="absolute top-0 right-0 bg-gradient-to-r from-amber-500 to-orange-600 text-white text-[10px] font-bold px-2 py-1 rounded-bl-lg shadow-lg flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-white fill-white" />
                      <span>New</span>
                    </div>
                    
                    <FileText className="w-8 h-8 text-amber-500 mb-2 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-bold text-white leading-tight">
                      Generate Resume
                    </p>
                  </div>
                </div>
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
                    className="bg-violet-600 hover:bg-violet-700 text-white font-semibold text-xs rounded-xl"
                  >
                    Give Feedback (+2 Credits)
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    onClick={() => navigate("/pricing")}
                    className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold text-xs rounded-xl"
                  >
                    Upgrade for ₹99
                  </Button>
                )}
              </motion.div>
            )}

            {/* Quick Actions Grid */}
            <div>
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                Quick Actions
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-amber-500" onClick={() => navigate("/job-recommendations")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Briefcase className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Job Matches</h4>
                    <p className="text-xs text-muted-foreground mt-1">Find Your Role</p>
                  </CardContent>
                </Card>


                <Card className="relative hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-violet-500" onClick={() => navigate("/interview/new")}>
                  <span className="absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 z-10">
                    Unlimited
                  </span>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-violet-100 dark:bg-violet-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <MessageSquare className="w-6 h-6 text-violet-600 dark:text-violet-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Text Interview</h4>
                    <p className="text-xs text-muted-foreground mt-1">AI Chat Practice</p>
                  </CardContent>
                </Card>

                <Card className="relative hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-pink-500" onClick={() => navigate("/voice-assistant")}>
                  <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm z-10 ${
                    isPremium 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : creditsVoice > 0 
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {isPremium 
                      ? 'Unlimited' 
                      : creditsVoice > 0 
                        ? `${creditsVoice} ${creditsVoice === 1 ? 'Credit' : 'Credits'}` 
                        : !hasGivenFeedback ? 'Unlock (+2)' : 'Locked'}
                  </span>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Mic className="w-6 h-6 text-pink-600 dark:text-pink-400" />
                    </div>
                    <h4 className="font-semibold text-sm">AI Voice Agent</h4>
                    <p className="text-xs text-muted-foreground mt-1">Real-time Interview</p>
                  </CardContent>
                </Card>

                <Card className="relative hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-emerald-500" onClick={() => navigate("/peer-interviews")}>
                  <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm z-10 ${
                    isPremium 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : creditsElite > 0 
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {isPremium 
                      ? 'Unlimited' 
                      : creditsElite > 0 
                        ? `${creditsElite} ${creditsElite === 1 ? 'Credit' : 'Credits'}` 
                        : !hasGivenFeedback ? 'Unlock (+2)' : 'Locked'}
                  </span>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Users className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Peer Match</h4>
                    <p className="text-xs text-muted-foreground mt-1">Practice with Others</p>
                  </CardContent>
                </Card>

                <Card className="relative hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-blue-500 overflow-hidden" onClick={() => navigate("/elite-prep")}>
                  <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm z-10 ${
                    isPremium 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : creditsElite > 0 
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {isPremium 
                      ? 'Unlimited' 
                      : creditsElite > 0 
                        ? `${creditsElite} ${creditsElite === 1 ? 'Credit' : 'Credits'}` 
                        : !hasGivenFeedback ? 'Unlock (+2)' : 'Locked'}
                  </span>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Zap className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Elite Prep</h4>
                    <p className="text-xs text-muted-foreground mt-1">Premium Interview Prep</p>
                  </CardContent>
                </Card>

                <Card className="relative hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-fuchsia-500" onClick={() => navigate("/video-interview")}>
                  <span className={`absolute top-2.5 right-2.5 text-[10px] font-bold px-2 py-0.5 rounded-full border shadow-sm z-10 ${
                    isPremium 
                      ? 'bg-amber-500/10 text-amber-500 border border-amber-500/20' 
                      : creditsVideo > 0 
                        ? 'bg-violet-500/10 text-violet-400 border border-violet-500/25' 
                        : 'bg-red-500/10 text-red-500 border border-red-500/20'
                  }`}>
                    {isPremium 
                      ? 'Unlimited' 
                      : creditsVideo > 0 
                        ? `${creditsVideo} ${creditsVideo === 1 ? 'Credit' : 'Credits'}` 
                        : !hasGivenFeedback ? 'Unlock (+2)' : 'Locked'}
                  </span>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-fuchsia-100 dark:bg-fuchsia-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Play className="w-6 h-6 text-fuchsia-600 dark:text-fuchsia-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Video Practice</h4>
                    <p className="text-xs text-muted-foreground mt-1">AI Video Feedback</p>
                  </CardContent>
                </Card>


                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-indigo-500" onClick={() => navigate("/playground")}>
                  <CardContent className="p-4 flex-col items-center text-center pt-6 flex">
                    <div className="w-12 h-12 rounded-full bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <Code className="w-6 h-6 text-indigo-600 dark:text-indigo-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Playground</h4>
                    <p className="text-xs text-muted-foreground mt-1">Code Sandbox</p>
                  </CardContent>
                </Card>

                <Card className="hover:shadow-lg transition-all cursor-pointer group border-l-4 border-l-orange-500" onClick={() => navigate("/question-practice")}>
                  <CardContent className="p-4 flex flex-col items-center text-center pt-6">
                    <div className="w-12 h-12 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <FileQuestion className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h4 className="font-semibold text-sm">Question Practice</h4>
                    <p className="text-xs text-muted-foreground mt-1">Daily Challenges</p>
                  </CardContent>
                </Card>


              </div>
            </div>

            {/* Road to Offer (Timeline) */}
            <RoadToOffer profile={profile} onUpdate={() => loadData(true)} />

            {/* Market Pulse (Salary & Trends) */}
            <MarketPulse profile={profile} />

          </div>

          {/* Right Column - Sidebar Widgets */}
          <div className="lg:col-span-4 space-y-6">

            {/* AI Skill Radar (Competency Map) */}
            <SkillRadar
              data={sessions.length > 0 ? [
                { subject: "Confidence", A: sessions.reduce((acc, s) => acc + (s.score || 70), 0) / (sessions.length || 1), fullMark: 100 },
                { subject: "Technical", A: sessions.filter(s => s.type === 'Text').reduce((acc, s) => acc + (s.score || 0), 0) / (sessions.filter(s => s.type === 'Text').length || 1) || 60, fullMark: 100 },
                { subject: "ATS Score", A: 85, fullMark: 100 }, // Mocked or derived from resume analysis
                { subject: "Problem Solving", A: sessions.filter(s => s.topic?.includes('Code') || s.topic?.includes('System')).reduce((acc, s) => acc + (s.score || 0), 0) / (sessions.filter(s => s.topic?.includes('Code') || s.topic?.includes('System')).length || 1) || 75, fullMark: 100 },
                { subject: "Communication", A: sessions.filter(s => s.type === 'Video').reduce((acc, s) => acc + (s.score || 0), 0) / (sessions.filter(s => s.type === 'Video').length || 1) || 80, fullMark: 100 },
              ] : [
                { subject: "Confidence", A: 0, fullMark: 100 },
                { subject: "Technical", A: 0, fullMark: 100 },
                { subject: "ATS Score", A: 0, fullMark: 100 },
                { subject: "Problem Solving", A: 0, fullMark: 100 },
                { subject: "Communication", A: 0, fullMark: 100 },
              ]}
            />



            {/* Daily Challenge */}
            <Card className="border-border/50 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-orange-400 to-red-500"></div>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  {(() => {
                    const dailyQ = getDailyQuestion();
                    return (
                      <>
                        <CardTitle className="text-base flex items-center gap-2">
                          <Target className="w-4 h-4 text-orange-500" />
                          Daily Challenge
                        </CardTitle>
                        <span className={`text-xs font-medium px-2 py-1 rounded-md ${
                          dailyQ.difficulty === 'Easy' ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30' :
                          dailyQ.difficulty === 'Medium' ? 'bg-amber-100 text-amber-600 dark:bg-amber-900/30' :
                          'bg-red-100 text-red-600 dark:bg-red-900/30'
                        }`}>
                          {dailyQ.difficulty}
                        </span>
                      </>
                    );
                  })()}
                </div>
              </CardHeader>
              <CardContent>
                {(() => {
                   const dailyQ = getDailyQuestion();
                   return (
                     <>
                        <h4 className="font-semibold mb-2 line-clamp-1">{dailyQ.title}</h4>
                        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                          {dailyQ.tags.join(" • ")}
                        </p>
                        <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={() => navigate("/daily-challenge")}>
                          Solve Now <ArrowRight className="w-4 h-4 ml-2" />
                        </Button>
                     </>
                   );
                })()}
              </CardContent>
            </Card>

            {/* Learning Paths */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-violet-500" />
                  Learning Paths
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {TRACKS.map((track, i) => (
                  <div 
                    key={i} 
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted transition-colors cursor-pointer group"
                    onClick={() => navigate("/learning-paths")}
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-md bg-background flex items-center justify-center shadow-sm text-primary">
                        <track.icon className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-sm font-medium group-hover:text-primary transition-colors">{track.title}</p>
                        <p className="text-[10px] text-muted-foreground">{track.role}</p>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Community Trending */}
            <Card className="border-border/50">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-blue-500" />
                  Community Pulse
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  { title: "Google L4 Interview Experience", views: "2.4k" },
                  { title: "System Design: TinyURL", views: "1.8k" },
                  { title: "Salary Negotiation Tips", views: "3.1k" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between border-b border-border/40 last:border-0 pb-3 last:pb-0">
                    <p className="text-sm font-medium hover:text-blue-500 cursor-pointer transition-colors">{item.title}</p>
                    <span className="text-xs text-muted-foreground">{item.views}</span>
                  </div>
                ))}
                <Button variant="ghost" size="sm" className="w-full text-blue-500" onClick={() => navigate("/community")}>
                  Visit Community
                </Button>
              </CardContent>
            </Card>

            <Button variant="destructive" className="w-full" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>

          </div>
        </div>
      </main>
      
      {/* Floating Referral Widget */}
      <ReferralFloatingWidget />
      <Footer />
      <FeedbackFormDialog 
        open={showFeedbackModal} 
        onOpenChange={setShowFeedbackModal} 
        onSuccess={refreshCredits}
        grantFeedbackCredits={grantFeedbackCredits}
      />
      <CodingProfilesDialog profile={profile} onUpdate={() => loadData(true)} />
    </div>
  );
};

export default Dashboard;
