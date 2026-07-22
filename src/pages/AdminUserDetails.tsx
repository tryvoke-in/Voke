import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Users, LayoutDashboard, Settings, FileText, Code2, LogOut, 
  MessageSquare, ArrowLeft, Mail, Calendar, Shield, Activity,
  Trophy, Terminal, Clock, CheckCircle2, Ban, Lock, Edit, Trash2, Search, Bell, Globe
} from "lucide-react";
import { motion } from "framer-motion";
import { toast } from "sonner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ADMIN_EMAIL, isAdminEmail } from "@/config/admin";

const formatDuration = (totalSeconds: number) => {
  if (!totalSeconds || totalSeconds <= 0) return "0s";
  if (totalSeconds < 60) return `${totalSeconds}s`;
  const minutes = Math.floor(totalSeconds / 60);
  if (minutes < 60) {
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds}s`;
  }
  const hours = (totalSeconds / 3600).toFixed(1);
  return `${hours}h`;
};

const AdminUserDetails = () => {
  const [userActivities, setUserActivities] = useState<any[]>([]);
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users"); // To keep sidebar highlighted correctly
  const [permissions, setPermissions] = useState({
    canPost: true,
    canComment: true,
    isModerator: false,
    isBetaTester: false
  });
  
  const [isMessageDialogOpen, setIsMessageDialogOpen] = useState(false);
  const [notificationForm, setNotificationForm] = useState({ title: "", message: "" });
  const [sending, setSending] = useState(false);

  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUserLoading, setCurrentUserLoading] = useState(true);

  useEffect(() => {
    checkAdminRole();
    fetchUserDetails();
  }, [userId]);

  const checkAdminRole = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        
        if (isAdminEmail(user.email)) {
            setIsAdmin(true);
        }
    } catch (error) {
        console.error("Error checking admin role:", error);
    } finally {
        setCurrentUserLoading(false);
    }
  };

  const fetchUserDetails = async () => {
    if (!userId) return;
    setLoading(true);
    
    try {
      // Fetch user profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      
      if (profileError) throw profileError;

      // Fetch user activities (by user_id or email)
      const { data: activityData, error: activityError } = await supabase
        .from('user_activities')
        .select('*')
        .or(`user_id.eq.${userId},user_email.eq.${profile.email}`)
        .order('created_at', { ascending: false });

      if (activityError) throw activityError;

      // Fetch actual mock interviews from all 3 session tables to backfill timeline
      const { data: aiInterviews } = await supabase
        .from('interview_sessions')
        .select('id, role, created_at, status, overall_score, interview_type, total_duration_seconds')
        .eq('user_id', userId);

      const { data: videoInterviews } = await supabase
        .from('video_interview_sessions')
        .select('id, question, created_at, status, overall_score, duration_seconds')
        .eq('user_id', userId);

      const { data: peerInterviews } = await supabase
        .from('peer_interview_sessions')
        .select('id, topic, created_at, status, duration_minutes')
        .or(`host_user_id.eq.${userId},guest_user_id.eq.${userId}`);

      const mergedActivities: any[] = [...(activityData || [])];

      aiInterviews?.forEach(item => {
        mergedActivities.push({
          id: `ai-session-${item.id}`,
          event_type: "interview_complete",
          created_at: item.created_at || new Date().toISOString(),
          page_path: "/interview",
          action_details: {
            role: item.role,
            status: item.status,
            score: item.overall_score,
            interview_type: item.interview_type,
            duration_seconds: item.total_duration_seconds,
            type: "AI Interview"
          },
          session_id: item.id
        });
      });

      videoInterviews?.forEach(item => {
        mergedActivities.push({
          id: `video-session-${item.id}`,
          event_type: "video_interview",
          created_at: item.created_at || new Date().toISOString(),
          page_path: "/video-interview",
          action_details: {
            question: item.question,
            status: item.status,
            score: item.overall_score,
            duration_seconds: item.duration_seconds,
            type: "Video Interview"
          },
          session_id: item.id
        });
      });

      peerInterviews?.forEach(item => {
        mergedActivities.push({
          id: `peer-session-${item.id}`,
          event_type: "peer_interview",
          created_at: item.created_at || new Date().toISOString(),
          page_path: "/peer-interviews",
          action_details: {
            topic: item.topic,
            status: item.status,
            duration_minutes: item.duration_minutes,
            type: "Peer Interview"
          },
          session_id: item.id
        });
      });

      // Sort activities newest first
      mergedActivities.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      setUserActivities(mergedActivities);

      // Compute total active duration spent on pages
      let totalDurationSeconds = 0;
      mergedActivities.forEach(a => {
        if (a.event_type === "page_leave" && a.action_details) {
          const details = a.action_details as any;
          if (details.duration_seconds) {
            totalDurationSeconds += details.duration_seconds;
          }
        }
      });

      // Fetch AI interviews count
      const { count: aiCount, error: aiCountError } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (aiCountError) throw aiCountError;

      // Fetch video interviews count
      const { count: videoCount, error: videoCountError } = await supabase
        .from('video_interview_sessions')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);

      if (videoCountError) throw videoCountError;

      // Fetch peer interviews count
      const { count: peerCount, error: peerCountError } = await supabase
        .from('peer_interview_sessions')
        .select('*', { count: 'exact', head: true })
        .or(`host_user_id.eq.${userId},guest_user_id.eq.${userId}`);

      if (peerCountError) throw peerCountError;

      const totalInterviews = (aiCount || 0) + (videoCount || 0) + (peerCount || 0);

      if (profile) {
        setUser({
          id: profile.id,
          full_name: profile.full_name || "Unknown User",
          email: profile.email || "No email",
          role: "User",
          status: "Active",
          joined_at: profile.created_at,
          last_active: profile.updated_at,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${profile.email || userId}`,
          bio: "No bio available",
          location: "Unknown",
          github: profile.github_url || "Not linked",
          website: profile.linkedin_url || "Not linked",
          stats: {
             problems_solved: totalInterviews,
             total_duration_seconds: totalDurationSeconds
          }
        });
      }
    } catch (error: any) {
      console.error("Error fetching user details:", error);
      toast.error("Failed to fetch user details");
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (action: string) => {
    if (action === 'Message') {
      setIsMessageDialogOpen(true);
    } else {
      toast.info(`${action} action triggered for user ${userId}`);
    }
  };

  const sendNotification = async () => {
    if (!notificationForm.title || !notificationForm.message) {
      toast.error("Please fill in both title and message");
      return;
    }
    setSending(true);
    try {
      const { error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title: notificationForm.title,
          message: notificationForm.message,
        });

      if (error) throw error;
      
      toast.success("Notification sent successfully");
      setIsMessageDialogOpen(false);
      setNotificationForm({ title: "", message: "" });
    } catch (error) {
      console.error("Error sending notification:", error);
      toast.error("Failed to send notification");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-violet-500"></div>
      </div>
    );
  }

  // Sidebar Items (reused for visual consistency)
  const sidebarItems = [
    { id: "overview", label: "Overview", icon: LayoutDashboard, path: "/admin" },
    { id: "users", label: "User Management", icon: Users, path: "/admin" },
    { id: "community", label: "Community", icon: MessageSquare, path: "/admin" },
    { id: "challenges", label: "Daily Challenges", icon: Code2, path: "/admin" },
    { id: "settings", label: "System Settings", icon: Settings, path: "/admin" },
  ];

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-violet-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-0 right-0 w-[50%] h-[50%] bg-violet-900/10 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[50%] bg-blue-900/10 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex-col relative z-20 hidden lg:flex"
      >
        <div className="p-8 flex items-center gap-3 cursor-pointer" onClick={() => navigate('/admin')}>
          <img 
            src="/images/voke_logo.png" 
            alt="Voke Logo" 
            className="w-10 h-10 object-contain"
          />
          <div>
            <span className="text-xl font-bold block leading-none">Voke</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {sidebarItems.map((item) => (
            <button
              key={item.id}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                activeTab === item.id 
                  ? "bg-violet-600 text-white shadow-lg shadow-violet-600/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className="w-5 h-5" />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
           <Button 
            variant="ghost" 
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-red-500/10"
            onClick={() => navigate('/')}
          >
            <LogOut className="w-5 h-5 mr-3" />
            Logout
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-30 bg-black/50 backdrop-blur-md border-b border-white/5">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="hover:bg-white/10" onClick={() => navigate('/admin')}>
                <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h2 className="text-xl font-bold">User Details</h2>
              <p className="text-xs text-gray-500">Manage user profile and permissions</p>
            </div>
          </div>
        </header>

        <div className="p-8 max-w-7xl mx-auto space-y-8">
            {/* User Profile Card */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
            >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Left Column: Identify */}
                    <Card className="lg:col-span-1 bg-white/5 border-white/10 backdrop-blur-sm h-full">
                        <CardContent className="p-8 flex flex-col items-center text-center">
                             <div className="relative mb-6">
                                <Avatar className="h-32 w-32 border-4 border-violet-500/20 shadow-2xl">
                                    <AvatarImage src={user.avatar_url} />
                                    <AvatarFallback className="text-4xl bg-violet-600">{user.full_name[0]}</AvatarFallback>
                                </Avatar>
                                <Badge className="absolute -bottom-2 -right-2 bg-emerald-500 hover:bg-emerald-600 border-4 border-black px-3 py-1">
                                    {user.status}
                                </Badge>
                             </div>
                             <h2 className="text-2xl font-bold text-white mb-1">{user.full_name}</h2>
                             <p className="text-gray-400 mb-6 flex items-center gap-2">
                                <Mail className="w-4 h-4" /> {user.email}
                             </p>
                             
                             <div className="w-full grid grid-cols-2 gap-4 mb-8">
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Role</p>
                                    <p className="font-semibold text-white">{user.role}</p>
                                </div>
                                <div className="p-3 rounded-xl bg-white/5 border border-white/5">
                                    <p className="text-xs text-gray-500 uppercase font-bold mb-1">Joined</p>
                                    <p className="font-semibold text-white">{new Date(user.joined_at).toLocaleDateString()}</p>
                                </div>
                             </div>

                             <div className="w-full space-y-3">
                                <Button 
                                    className="w-full bg-violet-600 hover:bg-violet-700" 
                                    onClick={() => handleAction('Message')}
                                    disabled={!isAdmin && !currentUserLoading}
                                >
                                    <MessageSquare className="w-4 h-4 mr-2" /> 
                                    {isAdmin ? "Send Notification" : "Admin Only"}
                                </Button>
                                <Button variant="outline" className="w-full border-white/10 hover:bg-white/5 hover:text-white" onClick={() => handleAction('Reset Password')}>
                                    <Lock className="w-4 h-4 mr-2" /> Reset Password
                                </Button>
                                <Button variant="destructive" className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20" onClick={() => handleAction('Ban')}>
                                    <Ban className="w-4 h-4 mr-2" /> Ban User
                                </Button>
                             </div>
                        </CardContent>
                    </Card>

                    {/* Right Column: Stats & Activity */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Stats Grid */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                            {[
                                { label: "XP Earned", value: "0", icon: Trophy, color: "text-amber-400", bg: "bg-amber-500/10" },
                                { label: "Interviews", value: user.stats?.problems_solved || "0", icon: Terminal, color: "text-blue-400", bg: "bg-blue-500/10" },
                                { label: "Streak", value: "0 Days", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10" },
                                { label: "Time Spent", value: formatDuration(user.stats?.total_duration_seconds || 0), icon: Clock, color: "text-purple-400", bg: "bg-purple-500/10" },
                            ].map((stat, i) => (
                                <Card key={i} className="bg-white/5 border-white/10 backdrop-blur-sm">
                                    <CardContent className="p-6">
                                        <div className={`w-10 h-10 rounded-lg ${stat.bg} ${stat.color} flex items-center justify-center mb-3`}>
                                            <stat.icon className="w-5 h-5" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-white mb-1">{stat.value}</h3>
                                        <p className="text-xs text-gray-400 font-medium uppercase">{stat.label}</p>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>

                        {/* Page Visit Breakdown */}
                        <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                    <Clock className="w-5 h-5 text-purple-400" />
                                    Time Spent Per Page
                                </CardTitle>
                                <CardDescription className="text-gray-400 text-xs">
                                    Aggregated view of time spent across different sections of the website (highest first)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="space-y-4">
                                    {(() => {
                                        const pageBreakdown: Record<string, { path: string; totalSeconds: number; visitCount: number }> = {};
                                        
                                        userActivities.forEach(a => {
                                            if (a.event_type === "page_view") {
                                                const path = a.page_path;
                                                if (!pageBreakdown[path]) {
                                                    pageBreakdown[path] = { path, totalSeconds: 0, visitCount: 0 };
                                                }
                                                pageBreakdown[path].visitCount += 1;
                                            } else if (a.event_type === "page_leave") {
                                                const path = a.page_path;
                                                if (!pageBreakdown[path]) {
                                                    pageBreakdown[path] = { path, totalSeconds: 0, visitCount: 0 };
                                                }
                                                const details = a.action_details as any;
                                                if (details?.duration_seconds) {
                                                    pageBreakdown[path].totalSeconds += details.duration_seconds;
                                                }
                                            }
                                        });

                                        const sortedPages = Object.values(pageBreakdown)
                                            .sort((a, b) => b.totalSeconds - a.totalSeconds);

                                        if (sortedPages.length === 0) {
                                            return <p className="text-sm text-gray-500 py-4 text-center">No page visits recorded yet</p>;
                                        }

                                        const maxDuration = Math.max(...sortedPages.map(p => p.totalSeconds), 1);

                                        return (
                                            <div className="space-y-4">
                                                {sortedPages.map((page, index) => (
                                                    <div key={index} className="space-y-2">
                                                        <div className="flex justify-between text-sm items-center">
                                                            <span className="font-mono text-gray-300 truncate max-w-[65%] text-xs" title={page.path}>
                                                                {page.path}
                                                            </span>
                                                            <div className="text-right text-xs">
                                                                <span className="font-bold text-purple-400 mr-2">
                                                                    {formatDuration(page.totalSeconds)}
                                                                </span>
                                                                <span className="text-gray-500">
                                                                    ({page.visitCount} visits)
                                                                </span>
                                                            </div>
                                                        </div>
                                                        <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                                            <div 
                                                                className="bg-purple-600 h-full rounded-full transition-all duration-500" 
                                                                style={{ width: `${(page.totalSeconds / maxDuration) * 100}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        );
                                    })()}
                                </div>
                            </CardContent>
                        </Card>

                        {/* Interviews Taken */}
                        <Card className="bg-white/5 border-white/10 backdrop-blur-sm shadow-xl">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-lg font-bold">
                                    <Terminal className="w-5 h-5 text-blue-400" />
                                    Interviews Taken
                                </CardTitle>
                                <CardDescription className="text-gray-400 text-xs">
                                    Clear, simplified history of mock interviews completed by this user
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(() => {
                                    const interviewEvents = userActivities.filter(a => {
                                        if (a.event_type !== "interview_complete" && a.event_type !== "video_interview" && a.event_type !== "peer_interview") {
                                            return false;
                                        }
                                        const details = a.action_details as any;
                                        // Only show completed/given interviews, filter out future scheduled peer/standard sessions
                                        if (details?.status === "scheduled") {
                                            return false;
                                        }
                                        return true;
                                    });

                                    if (interviewEvents.length === 0) {
                                        return (
                                            <div className="text-center py-8 text-gray-500 text-sm">
                                                No completed interviews recorded for this user yet.
                                            </div>
                                        );
                                    }

                                    return (
                                        <div className="space-y-4">
                                            {interviewEvents.map((session) => {
                                                const details = session.action_details as any;
                                                
                                                let interviewTypeLabel = "AI Interview";
                                                let subtitle = "";
                                                let scoreText = "N/A";
                                                let badgeColor = "bg-blue-500/10 text-blue-400";
                                                let durationText = "";

                                                if (session.event_type === "interview_complete") {
                                                    const isVoice = details?.interview_type === "voice";
                                                    interviewTypeLabel = isVoice ? "AI Voice Interview" : "AI Text Interview";
                                                    subtitle = `Role: ${details?.role || "General"}`;
                                                    scoreText = details?.score ? `${details.score}%` : "No Score";
                                                    badgeColor = isVoice ? "bg-purple-500/10 text-purple-400" : "bg-blue-500/10 text-blue-400";
                                                    
                                                    const secs = details?.duration_seconds || 0;
                                                    if (secs > 0) {
                                                        durationText = `Duration: ${formatDuration(secs)}`;
                                                    }
                                                } else if (session.event_type === "video_interview") {
                                                    interviewTypeLabel = "Video Interview";
                                                    subtitle = `Question: "${details?.question || ""}"`;
                                                    scoreText = details?.score ? `${details.score}%` : "No Score";
                                                    badgeColor = "bg-amber-500/10 text-amber-400";

                                                    const secs = details?.duration_seconds || 0;
                                                    if (secs > 0) {
                                                        durationText = `Duration: ${formatDuration(secs)}`;
                                                    }
                                                } else if (session.event_type === "peer_interview") {
                                                    interviewTypeLabel = "Peer Interview";
                                                    subtitle = `Topic: ${details?.topic || "General Practice"}`;
                                                    scoreText = details?.status || "Completed";
                                                    badgeColor = "bg-emerald-500/10 text-emerald-400";

                                                    const mins = details?.duration_minutes || 0;
                                                    if (mins > 0) {
                                                        durationText = `Duration: ${mins}m`;
                                                    }
                                                }

                                                const timeStr = new Date(session.created_at).toLocaleString('en-GB', {
                                                    day: '2-digit',
                                                    month: '2-digit',
                                                    year: 'numeric',
                                                    hour: '2-digit',
                                                    minute: '2-digit'
                                                });

                                                return (
                                                    <div 
                                                        key={session.id} 
                                                        className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-200"
                                                    >
                                                        <div className="space-y-1 text-left max-w-[70%]">
                                                            <div className="flex items-center gap-2 flex-wrap">
                                                                <Badge className={`${badgeColor} border-0 capitalize font-semibold text-xs`}>
                                                                    {interviewTypeLabel}
                                                                </Badge>
                                                                <span className="text-gray-500 text-[10px] font-mono">{timeStr}</span>
                                                                {durationText && (
                                                                    <span className="text-purple-400 text-[10px] font-semibold bg-purple-500/10 px-2 py-0.5 rounded-full">
                                                                        {durationText}
                                                                    </span>
                                                                )}
                                                            </div>
                                                            <h4 className="text-sm font-semibold text-gray-200 truncate">{subtitle}</h4>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="text-xs text-gray-500 uppercase font-bold">Score</p>
                                                            <p className="text-lg font-black text-violet-400">{scoreText}</p>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    );
                                })()}
                            </CardContent>
                        </Card>

                        {/* Permissions Control */}
                        <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2">
                                    <Shield className="w-5 h-5 text-red-400" />
                                    Permissions & Roles
                                </CardTitle>
                                <CardDescription>Manage user access and feature availability</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-gray-200">Posting Privileges</Label>
                                        <p className="text-xs text-gray-500">Allow user to create community posts</p>
                                    </div>
                                    <Switch 
                                        checked={permissions.canPost}
                                        onCheckedChange={(c) => setPermissions({...permissions, canPost: c})}
                                    />
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-gray-200">Comment Access</Label>
                                        <p className="text-xs text-gray-500">Allow user to comment on discussions</p>
                                    </div>
                                    <Switch 
                                        checked={permissions.canComment}
                                        onCheckedChange={(c) => setPermissions({...permissions, canComment: c})}
                                    />
                                </div>
                                <Separator className="bg-white/5" />
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label className="text-base text-gray-200">Moderator Status</Label>
                                        <p className="text-xs text-gray-500">Grant admin-lite privileges</p>
                                    </div>
                                    <Switch 
                                        checked={permissions.isModerator}
                                        onCheckedChange={(c) => setPermissions({...permissions, isModerator: c})}
                                        className="data-[state=checked]:bg-violet-600"
                                    />
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </div>
            </motion.div>
        </div>

        {/* Send Message Dialog */}
        <Dialog open={isMessageDialogOpen} onOpenChange={setIsMessageDialogOpen}>
          <DialogContent className="bg-[#0f1117] border-white/10 text-white sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Send Notification</DialogTitle>
              <DialogDescription className="text-gray-400">
                Send a direct notification to {user?.full_name}. This will appear in their dashboard.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  placeholder="Notification Title"
                  className="bg-white/5 border-white/10"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({ ...notificationForm, title: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  placeholder="Type your message here..."
                  className="bg-white/5 border-white/10"
                  rows={4}
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({ ...notificationForm, message: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMessageDialogOpen(false)} className="border-white/10 hover:bg-white/5 text-gray-300">
                Cancel
              </Button>
              <Button onClick={sendNotification} disabled={sending} className="bg-violet-600 hover:bg-violet-700 text-white">
                {sending ? "Sending..." : "Send Notification"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  );
};

export default AdminUserDetails;
