import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LayoutDashboard, Users, Settings, LogOut, Activity, 
  Shield, AlertTriangle, Search, Bell, Database, TrendingUp,
  MoreVertical, CheckCircle2, XCircle, Clock, FileText, Plus, Image as ImageIcon, Trash2, Edit, MessageSquare, Flag, Ban, Code2, Mail, MapPin,
  GraduationCap, Building2, ExternalLink, ShieldCheck
} from "lucide-react";
import { collegeService, College } from "@/services/collegeService";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ADMIN_EMAIL, isAdminEmail } from "@/config/admin";
import { motion, AnimatePresence } from "framer-motion";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { TractionChartWidget } from "@/components/admin/TractionChartWidget";

const formatDate = (dateString: string) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString);
  const day = d.getDate().toString().padStart(2, '0');
  const month = (d.getMonth() + 1).toString().padStart(2, '0');
  const year = d.getFullYear();
  return `${day}/${month}/${year}`;
};

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

const formatRelativeTime = (dateString?: string | null) => {
  if (!dateString) return "Never";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  
  if (isNaN(date.getTime())) return "Never";
  if (diffMs < 0 || diffMs < 45000) return "Just now";
  
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);

  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHour < 24) return `${diffHour}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  if (diffDay < 30) return `${Math.floor(diffDay / 7)}w ago`;
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [checking, setChecking] = useState(true);
  const [settings, setSettings] = useState({
    siteName: "Voke AI",
    maintenanceMode: false,
    allowRegistrations: true,
    emailNotifications: true,
    systemAnnouncements: "",
    sessionTimeout: [30],
    enforce2FA: false
  });
  const [blogs, setBlogs] = useState<any[]>([]);
  const [newBlog, setNewBlog] = useState({ title: "", image: "", content: "", category: "General" });
  const [newChallenge, setNewChallenge] = useState({ 
    title: "", 
    difficulty: "Easy", 
    description: "", 
    testCases: '[\n  { "input": "[1,2,3]", "output": "[3,2,1]" }\n]', 
    starterCode: "// Write your solution here..." 
  });
  const [users, setUsers] = useState<any[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [locations, setLocations] = useState<any[]>([]);
  const [newLocationName, setNewLocationName] = useState("");
  const [isLoadingLocations, setIsLoadingLocations] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const [waitlist, setWaitlist] = useState<any[]>([]);
  const [isLoadingWaitlist, setIsLoadingWaitlist] = useState(false);
  const [waitlistSearchQuery, setWaitlistSearchQuery] = useState("");
  const [totalSessions, setTotalSessions] = useState(0);
  const [activities, setActivities] = useState<any[]>([]);
  const [isLoadingAnalytics, setIsLoadingAnalytics] = useState(false);
  const [newUsersOnly, setNewUsersOnly] = useState(false);

  // Partner Colleges State
  const [colleges, setColleges] = useState<College[]>([]);
  const [isLoadingColleges, setIsLoadingColleges] = useState(false);
  const [collegeSearchQuery, setCollegeSearchQuery] = useState("");
  const [deletingCollegeId, setDeletingCollegeId] = useState<string | null>(null);
  const [collegeToDelete, setCollegeToDelete] = useState<College | null>(null);

  const getUserActivitySummary = (user: any) => {
    const userActs = activities.filter(a => a.user_id === user.id || (user.email && a.user_email === user.email));
    const sessionIds = new Set(userActs.map(a => a.session_id).filter(Boolean));
    const latestActivity = userActs[0];
    const lastSeenDate = latestActivity?.created_at || user.updated_at || user.created_at;
    const hasRevisited = sessionIds.size > 1;
    const isOnlineNow = latestActivity?.created_at && (Date.now() - new Date(latestActivity.created_at).getTime() < 5 * 60 * 1000);

    return {
      lastSeenDate,
      sessionsCount: sessionIds.size || 1,
      pageViews: userActs.length || 0,
      hasRevisited,
      isOnlineNow,
      location: latestActivity?.action_details?.ip_city 
        ? `${latestActivity.action_details.ip_city}, ${latestActivity.action_details.ip_country || ''}`
        : (user.college_name || "Unknown")
    };
  };

  const isNewUser = (userEmail?: string | null, userId?: string | null) => {
    if (!userEmail && !userId) return false;
    const foundUser = users.find(u => 
      (userId && u.id === userId) || 
      (userEmail && u.email === userEmail)
    );
    if (!foundUser) return false;
    const joinedDate = new Date(foundUser.created_at);
    const diffTime = Math.abs(Date.now() - joinedDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 7;
  };
  const [analyticsSearchQuery, setAnalyticsSearchQuery] = useState("");
  const [analyticsFilterEvent, setAnalyticsFilterEvent] = useState("all");
  const [expandedActivityId, setExpandedActivityId] = useState<string | null>(null);

  const filteredUsers = users.filter(user => {
    const searchLower = searchQuery.toLowerCase();
    const nameMatch = (user.full_name || "").toLowerCase().includes(searchLower);
    const emailMatch = (user.email || "").toLowerCase().includes(searchLower);
    const dateMatch = formatDate(user.created_at).toLowerCase().includes(searchLower);
    return nameMatch || emailMatch || dateMatch;
  });

  const filteredWaitlist = waitlist.filter(item => {
    const searchLower = waitlistSearchQuery.toLowerCase();
    const emailMatch = (item.email || "").toLowerCase().includes(searchLower);
    const collegeMatch = (item.college_name || "").toLowerCase().includes(searchLower);
    const phoneMatch = (item.phone_number || "").toLowerCase().includes(searchLower);
    const dateMatch = formatDate(item.created_at).toLowerCase().includes(searchLower);
    return emailMatch || collegeMatch || phoneMatch || dateMatch;
  });

  const filteredColleges = colleges.filter(item => {
    const query = collegeSearchQuery.trim() || searchQuery.trim();
    if (!query) return true;
    const searchLower = query.toLowerCase();
    const nameMatch = (item.name || "").toLowerCase().includes(searchLower);
    const shortMatch = (item.shortName || "").toLowerCase().includes(searchLower);
    const emailMatch = (item.adminEmail || "").toLowerCase().includes(searchLower);
    const domainMatch = (item.domains || []).some(d => d.toLowerCase().includes(searchLower));
    const locationMatch = (item.location || "").toLowerCase().includes(searchLower);
    return nameMatch || shortMatch || emailMatch || domainMatch || locationMatch;
  });

  const sortedUsers = [...filteredUsers].sort((a, b) => {
    if (!sortConfig) return 0;
    
    let aVal = a[sortConfig.key];
    let bVal = b[sortConfig.key];
    
    if (sortConfig.key === 'created_at') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
    } else {
        aVal = (aVal || '').toLowerCase();
        bVal = (bVal || '').toLowerCase();
    }

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  useEffect(() => {
    fetchUsers();
    fetchBlogs();
    fetchWaitlist();
    fetchSessionStats();
    fetchAnalytics();
    fetchLocations();
    fetchColleges();

    // Subscribe to new users in real-time
    const channel = supabase
      .channel('public:profiles')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'profiles' }, payload => {
        setUsers(current => [payload.new, ...current]);
        toast.info(`New user registered: ${payload.new.full_name || payload.new.email || 'Unknown'}`);
      })
      .subscribe();

    // Subscribe to new waitlist entries in real-time
    const waitlistChannel = supabase
      .channel('public:waitlist')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'waitlist' }, payload => {
        setWaitlist(current => [payload.new, ...current]);
        toast.info(`New waitlist sign-up: ${payload.new.email}`);
      })
      .subscribe();

    // Subscribe to new activities in real-time
    const activitiesChannel = supabase
      .channel('public:user_activities')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'user_activities' }, payload => {
        setActivities(current => [payload.new, ...current]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(waitlistChannel);
      supabase.removeChannel(activitiesChannel);
    };
  }, []);

  const fetchBlogs = async () => {
    try {
      const { data, error } = await supabase
        .from('blogs')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
      toast.error("Failed to fetch blogs");
    }
  };

  
  const fetchLocations = async () => {
    setIsLoadingLocations(true);
    try {
      const { data, error } = await supabase
        .from('monitored_locations')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setLocations(data || []);
    } catch (error) {
      console.error('Error fetching locations:', error);
      toast.error("Failed to fetch locations");
    } finally {
      setIsLoadingLocations(false);
    }
  };

  const handleAddLocation = async () => {
    if (!newLocationName.trim()) return;
    try {
      const { error } = await supabase
        .from('monitored_locations')
        .insert([{ location_name: newLocationName.trim() }]);
      if (error) throw error;
      toast.success("Location added");
      setNewLocationName("");
      fetchLocations();
    } catch (err: any) {
      toast.error("Failed to add location: " + err.message);
    }
  };

  const handleToggleLocation = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('monitored_locations')
        .update({ is_active: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      toast.success("Location status updated");
      fetchLocations();
    } catch (err: any) {
      toast.error("Failed to update location");
    }
  };

  const handleDeleteLocation = async (id: string) => {
    try {
      const { error } = await supabase
        .from('monitored_locations')
        .delete()
        .eq('id', id);
      if (error) throw error;
      toast.success("Location deleted");
      fetchLocations();
    } catch (err: any) {
      toast.error("Failed to delete location");
    }
  };

  const fetchUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*');
      
      if (error) throw error;
      setUsers(data || []);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error("Failed to fetch users");
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const fetchWaitlist = async () => {
    setIsLoadingWaitlist(true);
    try {
      const { data, error } = await supabase
        .from('waitlist')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setWaitlist(data || []);
    } catch (error) {
      console.error('Error fetching waitlist:', error);
      toast.error("Failed to fetch waitlist entries");
    } finally {
      setIsLoadingWaitlist(false);
    }
  };

  const fetchColleges = async () => {
    setIsLoadingColleges(true);
    try {
      const list = await collegeService.getCollegesAsync();
      setColleges(list);
    } catch (error) {
      console.error('Error fetching colleges:', error);
      toast.error("Failed to fetch partner colleges");
    } finally {
      setIsLoadingColleges(false);
    }
  };

  const handleDeleteCollege = async (college: College) => {
    setDeletingCollegeId(college.id);
    try {
      const success = await collegeService.deleteCollegeAsync(college.id);
      if (success) {
        toast.success(`Removed ${college.name} successfully.`);
        setColleges(prev => prev.filter(c => c.id !== college.id && c.slug !== college.slug));
        setCollegeToDelete(null);
      } else {
        toast.error(`Failed to remove ${college.name}.`);
      }
    } catch (err: any) {
      console.error('Error deleting college:', err);
      toast.error(err.message || "Failed to delete college.");
    } finally {
      setDeletingCollegeId(null);
    }
  };

  const fetchSessionStats = async () => {
    try {
      const { count: aiCount } = await supabase
        .from('interview_sessions')
        .select('*', { count: 'exact', head: true });

      const { count: peerCount } = await supabase
        .from('peer_interview_sessions')
        .select('*', { count: 'exact', head: true });

      const { count: videoCount } = await supabase
        .from('video_interview_sessions')
        .select('*', { count: 'exact', head: true });

      const total = (aiCount || 0) + (peerCount || 0) + (videoCount || 0);
      setTotalSessions(total);
    } catch (err) {
      console.error('Error fetching session stats:', err);
    }
  };

  const fetchAnalytics = async () => {
    setIsLoadingAnalytics(true);
    try {
      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(10000);
      
      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error fetching analytics:', error);
      toast.error("Failed to fetch analytics logs");
    } finally {
      setIsLoadingAnalytics(false);
    }
  };

  const handleDeleteWaitlist = async (id: string) => {
    try {
      const { error } = await supabase
        .from('waitlist')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Waitlist entry deleted successfully");
      fetchWaitlist();
    } catch (error) {
      console.error('Error deleting waitlist entry:', error);
      toast.error("Failed to delete waitlist entry");
    }
  };

  const handlePublishBlog = async () => {
    if (!newBlog.title || !newBlog.content) {
      toast.error("Please fill in all fields");
      return;
    }
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      const blog = {
        title: newBlog.title,
        content: newBlog.content,
        image_url: newBlog.image,
        category: newBlog.category,
        author: user?.email || "Admin",
        status: "Published",
        published_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('blogs')
        .insert([blog]);

      if (error) throw error;
      
      toast.success("Blog published successfully!");
      setNewBlog({ title: "", image: "", content: "", category: "General" });
      fetchBlogs();
    } catch (error: any) {
      console.error('Error publishing blog:', error);
      toast.error(`Failed to publish blog: ${error.message || error.error_description || "Unknown error"}`);
    }
  };

  const handleDeleteBlog = async (id: number) => {
    try {
      const { error } = await supabase
        .from('blogs')
        .delete()
        .eq('id', id);

      if (error) throw error;
      
      toast.success("Blog deleted");
      fetchBlogs();
    } catch (error) {
      console.error('Error deleting blog:', error);
      toast.error("Failed to delete blog");
    }
  };

  const handleSaveSettings = () => {
    // In a real app, this would make an API call
    setTimeout(() => {
      toast.success("System settings saved successfully");
    }, 500);
  };

  const handlePublishChallenge = () => {
    if (!newChallenge.title || !newChallenge.description) {
      toast.error("Please fill in the required fields");
      return;
    }
    // Simulate API call
    setTimeout(() => {
      toast.success("Challenge published successfully!");
      setNewChallenge({ 
        title: "", 
        difficulty: "Easy", 
        description: "", 
        testCases: '[\n  { "input": "[1,2,3]", "output": "[3,2,1]" }\n]', 
        starterCode: "// Write your solution here..." 
      });
    }, 500);
  };

  useEffect(() => {
    checkAdminAuth();
  }, []);

  const checkAdminAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
      return;
    }
    
    if (!isAdminEmail(session.user.email)) {
      setIsAuthorized(false);
    } else {
      setIsAuthorized(true);
    }
    setChecking(false);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const stats = [
    { title: "Total Users", value: users.length.toString(), change: `Registered`, icon: Users, color: "text-blue-400", bg: "bg-blue-500/10", data: [40, 30, 45, 50, 65, 60, 70] },
    { title: "Partner Colleges", value: colleges.length.toString(), change: "Active", icon: GraduationCap, color: "text-indigo-400", bg: "bg-indigo-500/10", data: [2, 3, 4, 6, 8, 10, colleges.length] },
    { title: "Interviews Conducted", value: totalSessions.toString(), change: "Active", icon: Activity, color: "text-emerald-400", bg: "bg-emerald-500/10", data: [20, 40, 35, 50, 45, 60, 55] },
    { title: "System Health", value: "99.9%", change: "Stable", icon: Database, color: "text-sky-400", bg: "bg-sky-500/10", data: [80, 85, 82, 90, 88, 95, 99] },
  ];

  const getChartData = () => {
    const data = [];
    const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    // Calculate initial running counts before the last 7 days window
    let runningUsers = users.filter(user => {
      if (!user.created_at) return false;
      const userDate = new Date(user.created_at);
      return userDate.getTime() < sevenDaysAgo.getTime();
    }).length;

    let runningWaitlist = waitlist.filter(item => {
      if (!item.created_at) return false;
      const itemDate = new Date(item.created_at);
      return itemDate.getTime() < sevenDaysAgo.getTime();
    }).length;

    // Build day-by-day counts
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];

      const userCountToday = users.filter(user => {
        if (!user.created_at) return false;
        const userDate = new Date(user.created_at);
        return userDate.toDateString() === d.toDateString();
      }).length;

      const waitlistCountToday = waitlist.filter(item => {
        if (!item.created_at) return false;
        const itemDate = new Date(item.created_at);
        return itemDate.toDateString() === d.toDateString();
      }).length;

      runningUsers += userCountToday;
      runningWaitlist += waitlistCountToday;

      data.push({
        name: dayName,
        users: runningUsers,
        waitlist: runningWaitlist
      });
    }

    return data;
  };

  const chartData = getChartData();



  if (checking) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-sky-500"></div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-black flex flex-col items-center justify-center text-white p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(124,58,237,0.1),transparent_70%)]" />
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative z-10 flex flex-col items-center text-center max-w-md p-8 rounded-3xl bg-white/5 border border-white/10 backdrop-blur-xl"
        >
          <div className="w-20 h-20 rounded-full bg-red-500/10 flex items-center justify-center mb-6">
            <Shield className="w-10 h-10 text-red-500" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-gray-400 mb-8">
            You do not have permission to access the Admin Portal. 
            This area is restricted to administrators only.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <button className="flex-1 border border-white/10 hover:bg-white/5 text-white hover:text-white rounded-xl h-10 font-medium text-sm transition-colors flex items-center justify-center" onClick={() => navigate("/dashboard")}>
              Go to Dashboard
            </button>
            <Button className="flex-1 bg-red-600 hover:bg-red-700" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white flex overflow-hidden font-sans selection:bg-sky-500/30">
      {/* Dynamic Background */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-sky-900/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900/20 rounded-full blur-[120px]" />
      </div>

      {/* Sidebar */}
      <motion.aside 
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        className="w-72 bg-white/5 backdrop-blur-xl border-r border-white/10 flex flex-col relative z-20"
      >
        <div className="p-8 flex items-center gap-3">
          <img 
            src="/images/voke_logo.png" 
            alt="Voke Logo" 
            className="w-10 h-10 object-contain shadow-lg shadow-sky-500/20"
          />
          <div>
            <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/40 block leading-none">Voke</span>
            <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">Admin Portal</span>
          </div>
        </div>

        <nav className="flex-1 px-4 space-y-2">
          {[
            { id: "overview", label: "Overview", icon: LayoutDashboard },
            { id: "colleges", label: "Partner Colleges", icon: GraduationCap },
            { id: "analytics", label: "Analytics", icon: TrendingUp },
            { id: "users", label: "User Management", icon: Users },
            { id: "community", label: "Community", icon: MessageSquare },
            { id: "challenges", label: "Daily Challenges", icon: Code2 },
            { id: "locations", label: "Job Locations", icon: MapPin },
            { id: "settings", label: "System Settings", icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group relative overflow-hidden ${
                activeTab === item.id 
                  ? "bg-sky-600 text-white shadow-lg shadow-sky-600/20" 
                  : "text-gray-400 hover:text-white hover:bg-white/5"
              }`}
            >
              <item.icon className={`w-5 h-5 ${activeTab === item.id ? "animate-pulse" : ""}`} />
              <span className="font-medium">{item.label}</span>
              {activeTab === item.id && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-white/10 mix-blend-overlay"
                  initial={false}
                  transition={{ type: "spring", stiffness: 500, damping: 30 }}
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-6 border-t border-white/10">
          <div className="flex items-center gap-3 mb-6 px-2">
            <Avatar className="h-10 w-10 border-2 border-sky-500/30">
              <AvatarImage src="https://github.com/shadcn.png" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">Admin User</p>
              <p className="text-xs text-gray-500 truncate">{ADMIN_EMAIL}</p>
            </div>
          </div>
          <Button 
            variant="destructive" 
            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20" 
            onClick={handleLogout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Logout
          </Button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto relative z-10">
        {/* Header */}
        <header className="h-20 flex items-center justify-between px-8 sticky top-0 z-30 bg-black/50 backdrop-blur-md border-b border-white/5">
          <div>
            <h2 className="text-2xl font-bold capitalize tracking-tight">{activeTab}</h2>
            <p className="text-sm text-gray-500">Welcome back, here's what's happening today.</p>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <Input 
                placeholder={
                  activeTab === "colleges"
                    ? "Search colleges, domains, admins..."
                    : activeTab === "analytics"
                      ? "Search activities..."
                      : "Search by name, email..."
                } 
                value={
                  activeTab === "colleges"
                    ? collegeSearchQuery
                    : activeTab === "analytics"
                      ? analyticsSearchQuery
                      : searchQuery
                }
                onChange={(e) => {
                  if (activeTab === "colleges") {
                    setCollegeSearchQuery(e.target.value);
                  } else if (activeTab === "analytics") {
                    setAnalyticsSearchQuery(e.target.value);
                  } else {
                    setSearchQuery(e.target.value);
                  }
                }}
                className="pl-10 bg-white/5 border-white/10 text-sm w-64 rounded-full focus:bg-white/10 transition-all"
              />
            </div>
            <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10 relative">
              <Bell className="h-5 w-5 text-gray-400" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            </Button>
          </div>
        </header>

        <div className="p-8 space-y-8">
          <AnimatePresence mode="wait">
            {activeTab === "overview" && (
              <motion.div
                key="overview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {stats.map((stat, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.1 }}
                      className="group relative overflow-hidden rounded-3xl bg-white/5 border border-white/10 p-6 hover:bg-white/10 transition-all duration-300"
                    >
                      <div className="flex justify-between items-start mb-4">
                        <div className={`p-3 rounded-2xl ${stat.bg}`}>
                          <stat.icon className={`w-6 h-6 ${stat.color}`} />
                        </div>
                        <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                          stat.change.startsWith('+') || stat.change === 'Stable' || stat.change === 'Active' || stat.change === 'Registered'
                            ? 'bg-green-500/10 text-green-400' 
                            : 'bg-red-500/10 text-red-400'
                        }`}>
                          {stat.change}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-3xl font-bold">{stat.value}</h3>
                        <p className="text-sm text-gray-400">{stat.title}</p>
                      </div>
                      {/* Mini Sparkline */}
                      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20 group-hover:opacity-30 transition-opacity">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stat.data.map((val, i) => ({ value: val }))}>
                            <Area 
                              type="monotone" 
                              dataKey="value" 
                              stroke="currentColor" 
                              fill="currentColor" 
                              className={stat.color} 
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Charts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2">
                    <TractionChartWidget 
                      users={users} 
                      waitlist={waitlist} 
                      totalSessions={totalSessions} 
                      activities={activities} 
                    />
                  </div>

                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle>System Logs</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {[
                          { time: "10:42", msg: "Server started", type: "success" },
                          { time: "10:45", msg: "High memory usage", type: "warning" },
                          { time: "10:48", msg: "User #12345 reset password", type: "info" },
                          { time: "10:55", msg: "DB Connection timeout", type: "error" },
                          { time: "10:55", msg: "DB Connection restored", type: "success" },
                        ].map((log, i) => (
                          <div key={i} className="flex gap-3 items-start text-sm group">
                            <span className="text-gray-500 font-mono text-xs mt-0.5">{log.time}</span>
                            <div className="flex-1">
                              <p className={`font-medium ${
                                log.type === 'success' ? 'text-green-400' :
                                log.type === 'warning' ? 'text-yellow-400' :
                                log.type === 'error' ? 'text-red-400' : 'text-blue-400'
                              }`}>
                                {log.type.toUpperCase()}
                              </p>
                              <p className="text-gray-400 text-xs group-hover:text-gray-300 transition-colors">{log.msg}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent Users Table */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle>Recent Registrations</CardTitle>
                    <Button variant="ghost" size="sm" className="text-sky-400 hover:text-sky-300">View All</Button>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-gray-400">User</TableHead>
                          <TableHead className="text-gray-400">Status</TableHead>
                          <TableHead className="text-gray-400">Last Seen / Revisits</TableHead>
                          <TableHead className="text-gray-400">Location</TableHead>
                          <TableHead className="text-gray-400">Joined</TableHead>
                          <TableHead className="text-right text-gray-400">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoadingUsers ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-400">Loading...</TableCell>
                          </TableRow>
                        ) : users.length === 0 ? (
                          <TableRow>
                            <TableCell colSpan={6} className="text-center py-8 text-gray-400">No recent registrations</TableCell>
                          </TableRow>
                        ) : (
                          users.slice(0, 5).map((user) => {
                            const summary = getUserActivitySummary(user);
                            return (
                              <TableRow 
                                key={user.id} 
                                className="border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                                onClick={() => navigate(`/admin/users/${user.id}`)}
                              >
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <Avatar className="h-8 w-8 border border-white/10">
                                      <AvatarFallback className="bg-sky-500/20 text-sky-300">{(user.full_name || "U")[0]}</AvatarFallback>
                                    </Avatar>
                                    <div>
                                      <p className="font-medium text-gray-200">{user.full_name || "Unknown User"}</p>
                                      <p className="text-xs text-gray-500">{user.email}</p>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge 
                                    variant="outline" 
                                    className="bg-green-500/10 text-green-400 border-0"
                                  >
                                    <CheckCircle2 className="w-3 h-3 mr-1" />
                                    Active
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                                      <span className={`w-2 h-2 rounded-full ${summary.isOnlineNow ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                                      <span>{formatRelativeTime(summary.lastSeenDate)}</span>
                                    </div>
                                    <div className="text-[10px] text-gray-400">
                                      {summary.hasRevisited ? (
                                        <span className="text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                          Revisited ({summary.sessionsCount} visits)
                                        </span>
                                      ) : (
                                        <span className="text-gray-500">1 visit</span>
                                      )}
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-400">
                                  {summary.location}
                                </TableCell>
                                <TableCell className="text-gray-400">{formatDate(user.created_at)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-gray-400 hover:text-white hover:bg-white/10">
                                    <MoreVertical className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "colleges" && (
              <motion.div
                key="colleges"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                {/* Stats Summary Strip */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      <GraduationCap className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Registered Colleges</p>
                      <h3 className="text-2xl font-bold text-white mt-0.5">{colleges.length} Institutions</h3>
                      <p className="text-[11px] text-blue-400/80 mt-0.5">Active Campus Partnerships</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <ShieldCheck className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Mapped Student Domains</p>
                      <h3 className="text-2xl font-bold text-white mt-0.5">
                        {colleges.reduce((acc, c) => acc + (c.domains?.length || 0), 0)} Domains
                      </h3>
                      <p className="text-[11px] text-emerald-400/80 mt-0.5">Auto-roster domain verification</p>
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/5 border border-white/10 p-5 flex items-center gap-4">
                    <div className="p-3.5 rounded-xl bg-violet-500/10 text-violet-400 border border-violet-500/20">
                      <Users className="w-6 h-6" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Total Student Capacity</p>
                      <h3 className="text-2xl font-bold text-white mt-0.5">
                        {colleges.reduce((acc, c) => acc + (c.totalStudentSlots || 500), 0).toLocaleString()} Slots
                      </h3>
                      <p className="text-[11px] text-violet-400/80 mt-0.5">AI assessment drive quota</p>
                    </div>
                  </div>
                </div>

                {/* College Directory Card */}
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm overflow-hidden">
                  <CardHeader className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Building2 className="w-5 h-5 text-blue-400" />
                        Partner Colleges & Universities
                        <span className="ml-2 px-2.5 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-xs text-blue-400 font-medium">
                          {colleges.length} Total
                        </span>
                      </CardTitle>
                      <p className="text-xs text-gray-400 mt-1">
                        View registered institutions, verified email domains, admin login accounts, and manage campus access.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={fetchColleges}
                        className="border border-white/10 hover:bg-white/5 text-gray-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer"
                      >
                        Refresh
                      </button>
                      <Button
                        onClick={() => window.open("/college/auth?mode=register", "_blank")}
                        className="bg-blue-600 hover:bg-blue-500 text-white text-xs px-3.5 py-1.5 h-auto rounded-lg shadow-lg shadow-blue-600/20 cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5 mr-1" />
                        Onboard New College
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-xl border border-white/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-300">College / University</TableHead>
                            <TableHead className="text-gray-300">Official Email Domains</TableHead>
                            <TableHead className="text-gray-300">Admin Account</TableHead>
                            <TableHead className="text-gray-300">Location & Scale</TableHead>
                            <TableHead className="text-gray-300">Partnership Tier</TableHead>
                            <TableHead className="text-right text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingColleges ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <GraduationCap className="w-6 h-6 animate-pulse text-blue-400" />
                                  <p className="text-sm">Loading partner colleges...</p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : filteredColleges.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={6} className="text-center py-12 text-gray-400">
                                <div className="flex flex-col items-center justify-center gap-2">
                                  <Building2 className="w-8 h-8 text-gray-600" />
                                  <p className="text-sm font-medium">No matching colleges found</p>
                                  <p className="text-xs text-gray-500">
                                    {collegeSearchQuery ? "Try a different search query." : "No partner colleges registered yet."}
                                  </p>
                                </div>
                              </TableCell>
                            </TableRow>
                          ) : (
                            filteredColleges.map((college) => (
                              <TableRow
                                key={college.id}
                                className="border-white/10 hover:bg-white/5 transition-colors group"
                              >
                                <TableCell className="font-medium text-gray-200">
                                  <div className="flex items-center gap-3">
                                    <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-blue-500/20 to-indigo-500/20 border border-blue-500/30 flex items-center justify-center text-blue-300 font-bold text-xs shrink-0">
                                      {college.shortName ? college.shortName.slice(0, 3) : "COL"}
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-2">
                                        <span className="font-semibold text-white truncate">{college.name}</span>
                                        {college.shortName && (
                                          <Badge variant="outline" className="bg-white/5 border-white/10 text-[10px] text-gray-300 py-0 px-1.5">
                                            {college.shortName}
                                          </Badge>
                                        )}
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-gray-400 mt-0.5">
                                        <span className="font-mono text-[11px] text-gray-500">slug: {college.slug}</span>
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div className="flex flex-wrap gap-1 max-w-[200px]">
                                    {college.domains && college.domains.length > 0 ? (
                                      college.domains.map((d, i) => (
                                        <Badge
                                          key={i}
                                          variant="secondary"
                                          className="bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[10px] py-0 px-1.5 font-mono"
                                        >
                                          @{d}
                                        </Badge>
                                      ))
                                    ) : (
                                      <span className="text-xs text-gray-500">No domains</span>
                                    )}
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div>
                                    <p className="text-xs font-medium text-gray-200">{college.adminName || "Placement Coordinator"}</p>
                                    <p className="text-xs text-gray-400 font-mono mt-0.5">{college.adminEmail}</p>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-300">
                                      <Users className="w-3.5 h-3.5 text-gray-500" />
                                      <span>{(college.totalStudentSlots || 500).toLocaleString()} Slots</span>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-xs text-gray-400 mt-0.5">
                                      <MapPin className="w-3.5 h-3.5 text-gray-500" />
                                      <span className="truncate max-w-[140px]">{college.location || "India"}</span>
                                    </div>
                                  </div>
                                </TableCell>

                                <TableCell>
                                  <div>
                                    <Badge className="bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 text-[11px] font-normal">
                                      {college.tier || "Enterprise Campus Partner"}
                                    </Badge>
                                    <p className="text-[10px] text-gray-500 mt-1">
                                      {college.contractPeriod || "2025 - 2026 Academic Year"}
                                    </p>
                                  </div>
                                </TableCell>

                                <TableCell className="text-right">
                                  <div className="flex items-center justify-end gap-1.5">
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 px-2.5 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 text-xs cursor-pointer"
                                      onClick={() => {
                                        collegeService.setCollegeSession(college);
                                        window.open(`/college/dashboard?college=${college.id}`, "_blank");
                                      }}
                                      title="Open College Dashboard"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5 mr-1" />
                                      Portal
                                    </Button>

                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                                      onClick={() => setCollegeToDelete(college)}
                                      disabled={deletingCollegeId === college.id}
                                      title="Delete College"
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Delete College Confirmation Modal */}
                {collegeToDelete && (
                  <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-zinc-900 border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="p-3 rounded-full bg-red-500/10 text-red-400 border border-red-500/20">
                          <Trash2 className="w-6 h-6" />
                        </div>
                        <div>
                          <h3 className="text-lg font-bold text-white">Delete Registered College?</h3>
                          <p className="text-xs text-gray-400">This action cannot be undone.</p>
                        </div>
                      </div>

                      <div className="bg-white/5 border border-white/10 rounded-xl p-4 space-y-2 text-sm text-gray-300">
                        <p>
                          You are about to remove <strong className="text-white">{collegeToDelete.name}</strong> ({collegeToDelete.shortName || collegeToDelete.slug}) from the Voke University Network.
                        </p>
                        <ul className="text-xs text-gray-400 space-y-1 list-disc list-inside">
                          <li>Admin account: <code className="text-gray-300 font-mono">{collegeToDelete.adminEmail}</code></li>
                          <li>Domains: <code className="text-gray-300 font-mono">@{collegeToDelete.domains?.join(", @")}</code></li>
                          <li>Students from this domain will no longer be auto-rostered to this college.</li>
                        </ul>
                      </div>

                      <div className="flex items-center justify-end gap-3 pt-2">
                        <Button
                          variant="ghost"
                          onClick={() => setCollegeToDelete(null)}
                          disabled={deletingCollegeId === collegeToDelete.id}
                          className="hover:bg-white/5 text-gray-300 hover:text-white text-xs cursor-pointer"
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="destructive"
                          onClick={() => handleDeleteCollege(collegeToDelete)}
                          disabled={deletingCollegeId === collegeToDelete.id}
                          className="bg-red-600 hover:bg-red-500 text-white text-xs font-semibold px-4 cursor-pointer"
                        >
                          {deletingCollegeId === collegeToDelete.id ? "Deleting Institution..." : "Confirm & Delete College"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {activeTab === "analytics" && ((allActivities) => {
              const activities = allActivities.filter(activity => {
                if (!newUsersOnly) return true;
                return isNewUser(activity.user_email, activity.user_id);
              });

              return (
                <motion.div
                  key="analytics"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-8 animate-in fade-in duration-300"
                >
                  {/* Analytics Control Bar */}
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white/5 border border-white/10 p-4 rounded-2xl">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-200">Analytics Scope</h3>
                      <p className="text-xs text-gray-400">Toggle whether to show overall system activity or new signups only</p>
                    </div>
                    <div className="flex items-center gap-3 bg-black/30 px-4 py-2 rounded-xl border border-white/5">
                      <Label htmlFor="new-users-toggle" className="text-xs font-semibold text-gray-300 cursor-pointer">
                        New Users Only (Registered ≤ 7 Days)
                      </Label>
                      <Switch
                        id="new-users-toggle"
                        checked={newUsersOnly}
                        onCheckedChange={setNewUsersOnly}
                        className="data-[state=checked]:bg-sky-600"
                      />
                    </div>
                  </div>
                {/* Metrics Summary Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {[
                    {
                      title: "Total Page Views",
                      value: activities.filter(a => a.event_type === 'page_view').length,
                      desc: "Accumulated page views",
                      icon: Activity,
                      color: "text-sky-400",
                      bg: "bg-sky-500/10"
                    },
                    {
                      title: "Total Visits",
                      value: new Set(activities.map(a => a.session_id)).size,
                      desc: "Unique browsing sessions",
                      icon: Database,
                      color: "text-blue-400",
                      bg: "bg-blue-500/10"
                    },
                    {
                      title: "Unique Users",
                      value: (() => {
                        const set = new Set();
                        activities.forEach(a => {
                          if (a.user_email) set.add(a.user_email);
                          else if (a.user_id) set.add(a.user_id);
                        });
                        return set.size;
                      })(),
                      desc: "Identified distinct users",
                      icon: Users,
                      color: "text-emerald-400",
                      bg: "bg-emerald-500/10"
                    }
                  ].map((card, i) => (
                    <Card key={i} className="bg-white/5 border-white/10 shadow-xl overflow-hidden group hover:bg-white/10 transition-all duration-300">
                      <CardContent className="p-6 relative">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-400">{card.title}</p>
                            <h3 className="text-3xl font-extrabold mt-2 tracking-tight">{card.value}</h3>
                          </div>
                          <div className={`p-3 rounded-2xl ${card.color} ${card.bg} group-hover:scale-110 transition-transform duration-300`}>
                            <card.icon className="w-6 h-6" />
                          </div>
                        </div>
                        <p className="text-xs text-gray-500 mt-4">{card.desc}</p>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Main Activity Chart */}
                <Card className="bg-white/5 border-white/10 shadow-xl">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-sky-400 animate-pulse" />
                      Web Activity Trends
                    </CardTitle>
                    <p className="text-xs text-gray-400">Daily breakdown of unique visits and page views</p>
                  </CardHeader>
                  <CardContent className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={(() => {
                        const last7Days: Record<string, { dateStr: string; visits: Set<string>; pageViews: number }> = {};
                        for (let i = 6; i >= 0; i--) {
                          const d = new Date();
                          d.setDate(d.getDate() - i);
                          const dateStr = d.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' });
                          const isoDate = d.toISOString().split('T')[0];
                          last7Days[isoDate] = { dateStr, visits: new Set(), pageViews: 0 };
                        }
                        activities.forEach(a => {
                          const dKey = new Date(a.created_at).toISOString().split('T')[0];
                          if (last7Days[dKey]) {
                            last7Days[dKey].visits.add(a.session_id);
                            if (a.event_type === 'page_view') last7Days[dKey].pageViews += 1;
                          }
                        });
                        return Object.values(last7Days).map(day => ({
                          date: day.dateStr,
                          "Page Views": day.pageViews,
                          "Unique Visits": day.visits.size
                        }));
                      })()}>
                        <defs>
                          <linearGradient id="colorPageViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorVisits" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                        <XAxis dataKey="date" stroke="#6b7280" fontSize={11} tickLine={false} />
                        <YAxis stroke="#6b7280" fontSize={11} tickLine={false} />
                        <Tooltip contentStyle={{ backgroundColor: '#09090b', borderColor: 'rgba(255,255,255,0.1)', color: '#fff', borderRadius: '12px' }} />
                        <Area type="monotone" dataKey="Page Views" stroke="#8b5cf6" fillOpacity={1} fill="url(#colorPageViews)" strokeWidth={2} />
                        <Area type="monotone" dataKey="Unique Visits" stroke="#3b82f6" fillOpacity={1} fill="url(#colorVisits)" strokeWidth={2} />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Popular Breakdown Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Top Pages */}
                  <Card className="bg-white/5 border-white/10 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">Top Pages Visited</CardTitle>
                      <p className="text-xs text-gray-400">Routes with highest hit rates</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        {(() => {
                          const counts: Record<string, number> = {};
                          activities.forEach(a => {
                            if (a.event_type === 'page_view') {
                              counts[a.page_path] = (counts[a.page_path] || 0) + 1;
                            }
                          });
                          const sorted = Object.entries(counts)
                            .map(([path, count]) => ({ path, count }))
                            .sort((a, b) => b.count - a.count)
                            .slice(0, 5);
                          
                          const maxCount = sorted[0]?.count || 1;

                          if (sorted.length === 0) {
                            return <p className="text-sm text-gray-500 py-4 text-center">No page views recorded yet</p>;
                          }

                          return sorted.map((page, index) => (
                            <div key={index} className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="font-mono text-gray-300 truncate max-w-[80%]">{page.path}</span>
                                <span className="font-bold text-sky-400">{page.count} hits</span>
                              </div>
                              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-sky-600 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${(page.count / maxCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>

                  {/* User Locations Analysis */}
                  <Card className="bg-white/5 border-white/10 shadow-xl">
                    <CardHeader>
                      <CardTitle className="text-lg font-bold">User Demographics (Locations)</CardTitle>
                      <p className="text-xs text-gray-400">Total users grouped by country and city</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4 max-h-[250px] overflow-y-auto pr-2 custom-scrollbar">
                        {(() => {
                          const locationCounts: Record<string, number> = {};
                          const uniqueUsersTracked = new Set<string>();

                          activities.forEach(a => {
                            const identifier = a.user_email || a.user_id || a.session_id;
                            if (identifier && !uniqueUsersTracked.has(identifier)) {
                               const city = a.action_details?.ip_city;
                               const country = a.action_details?.ip_country;
                               if (city && country) {
                                  const locKey = `${city}, ${country}`;
                                  locationCounts[locKey] = (locationCounts[locKey] || 0) + 1;
                                  uniqueUsersTracked.add(identifier);
                               }
                            }
                          });

                          const sorted = Object.entries(locationCounts)
                            .map(([loc, count]) => ({ loc, count }))
                            .sort((a, b) => b.count - a.count);
                          
                          const maxCount = sorted[0]?.count || 1;

                          if (sorted.length === 0) {
                            return <p className="text-sm text-gray-500 py-4 text-center">No location data recorded yet</p>;
                          }

                          return sorted.map((item, index) => (
                            <div key={index} className="space-y-1.5">
                              <div className="flex justify-between text-sm">
                                <span className="font-medium text-gray-300 truncate max-w-[80%]">{item.loc}</span>
                                <span className="font-bold text-emerald-400">{item.count} user{item.count > 1 ? 's' : ''}</span>
                              </div>
                              <div className="w-full bg-white/5 h-2 rounded-full overflow-hidden">
                                <div 
                                  className="bg-emerald-600 h-full rounded-full transition-all duration-500" 
                                  style={{ width: `${(item.count / maxCount) * 100}%` }}
                                />
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* User Engagement Summary (Visits Breakdown) */}
                <Card className="bg-white/5 border-white/10 shadow-xl">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold flex items-center gap-2">
                        <Users className="w-5 h-5 text-emerald-400" />
                        User Engagement Summary
                      </CardTitle>
                      <p className="text-xs text-gray-400">Complete list of registered users and visitors, total visits (sessions), page views/actions, and last active time</p>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-400">User / Visitor</TableHead>
                            <TableHead className="text-gray-400">Total Visits (Sessions)</TableHead>
                            <TableHead className="text-gray-400">Total Page Views</TableHead>
                            <TableHead className="text-gray-400">Location</TableHead>
                            <TableHead className="text-gray-400">Total Time Spent</TableHead>
                            <TableHead className="text-gray-400">Last Active</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {(() => {
                            const breakdown = (() => {
                              const userStats: Record<string, { 
                                name: string | null;
                                email: string; 
                                userId: string | null; 
                                sessions: Set<string>; 
                                pageViews: number; 
                                totalDuration: number; 
                                lastActive: string; 
                                location: string | null;
                                isRegistered: boolean;
                              }> = {};

                              // 1. Seed all registered users from profiles table
                              users.forEach(u => {
                                const email = u.email || `User #${u.id.slice(0, 6)}`;
                                userStats[email] = {
                                  name: u.full_name || null,
                                  email: email,
                                  userId: u.id,
                                  sessions: new Set<string>(),
                                  pageViews: 0,
                                  totalDuration: 0,
                                  lastActive: u.updated_at || u.created_at || new Date().toISOString(),
                                  location: u.college_name || null,
                                  isRegistered: true
                                };
                              });

                              // 2. Process all activities and merge into userStats
                              activities.forEach(activity => {
                                let targetKey: string | null = null;

                                if (activity.user_id) {
                                  const matchingUser = users.find(u => u.id === activity.user_id);
                                  if (matchingUser?.email && userStats[matchingUser.email]) {
                                    targetKey = matchingUser.email;
                                  }
                                }

                                if (!targetKey && activity.user_email && userStats[activity.user_email]) {
                                  targetKey = activity.user_email;
                                }

                                const identifier = targetKey || activity.user_email || "Guest (Anonymous)";
                                if (!userStats[identifier]) {
                                  userStats[identifier] = {
                                    name: null,
                                    email: identifier,
                                    userId: activity.user_id || null,
                                    sessions: new Set<string>(),
                                    pageViews: 0,
                                    totalDuration: 0,
                                    lastActive: activity.created_at,
                                    location: null,
                                    isRegistered: Boolean(activity.user_id)
                                  };
                                }

                                if (activity.user_id && !userStats[identifier].userId) {
                                  userStats[identifier].userId = activity.user_id;
                                }
                                
                                if (activity.action_details?.ip_city && activity.action_details?.ip_country) {
                                  userStats[identifier].location = `${activity.action_details.ip_city}, ${activity.action_details.ip_country}`;
                                }

                                if (activity.session_id) {
                                  userStats[identifier].sessions.add(activity.session_id);
                                }
                                userStats[identifier].pageViews += 1;
                                
                                if (activity.event_type === "page_leave" && activity.action_details) {
                                  const details = activity.action_details as any;
                                  if (details.duration_seconds) {
                                    userStats[identifier].totalDuration += details.duration_seconds;
                                  }
                                }

                                if (new Date(activity.created_at) > new Date(userStats[identifier].lastActive)) {
                                  userStats[identifier].lastActive = activity.created_at;
                                }
                              });

                              let list = Object.values(userStats).map(stat => ({
                                name: stat.name,
                                email: stat.email,
                                userId: stat.userId,
                                visitCount: stat.sessions.size > 0 ? stat.sessions.size : (stat.isRegistered ? 1 : 0),
                                pageViews: stat.pageViews > 0 ? stat.pageViews : (stat.isRegistered ? 1 : 0),
                                totalDuration: stat.totalDuration,
                                lastActive: stat.lastActive,
                                location: stat.location,
                                isRegistered: stat.isRegistered
                              }));

                              if (analyticsSearchQuery.trim()) {
                                const q = analyticsSearchQuery.toLowerCase();
                                list = list.filter(u => 
                                  u.email.toLowerCase().includes(q) ||
                                  (u.name && u.name.toLowerCase().includes(q)) ||
                                  (u.location && u.location.toLowerCase().includes(q))
                                );
                              }

                              return list.sort((a, b) => {
                                if (b.visitCount !== a.visitCount) {
                                  return b.visitCount - a.visitCount;
                                }
                                return new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime();
                              });
                            })();

                            if (breakdown.length === 0) {
                              return (
                                <TableRow>
                                  <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                                    No users found
                                  </TableCell>
                                </TableRow>
                              );
                            }

                            return breakdown.map((userBreakdown, index) => (
                              <TableRow key={index} className="border-white/10 hover:bg-white/5">
                                <TableCell className="font-medium text-gray-300">
                                  {userBreakdown.userId ? (() => {
                                    const profile = users.find(u => u.id === userBreakdown.userId);
                                    const displayName = profile?.full_name 
                                      ? `${profile.full_name} (${userBreakdown.email})` 
                                      : (userBreakdown.name ? `${userBreakdown.name} (${userBreakdown.email})` : userBreakdown.email);
                                    return (
                                      <button
                                        onClick={() => navigate(`/admin/users/${userBreakdown.userId}`)}
                                        className="text-sky-400 hover:text-sky-300 hover:underline font-semibold text-left transition-colors cursor-pointer"
                                      >
                                        {displayName}
                                      </button>
                                    );
                                  })() : (
                                    <span className="text-gray-500 italic">{userBreakdown.email}</span>
                                  )}
                                </TableCell>
                                <TableCell className="font-bold text-sky-400">
                                  <div className="space-y-0.5">
                                    <div className="text-sky-300 font-bold">{userBreakdown.visitCount} visits</div>
                                    {userBreakdown.visitCount > 1 && (
                                      <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 text-[10px] border-0 py-0 px-1.5 font-medium">
                                        Revisited
                                      </Badge>
                                    )}
                                  </div>
                                </TableCell>
                                <TableCell className="text-gray-300 text-sm">
                                  {userBreakdown.pageViews} hits
                                </TableCell>
                                <TableCell className="text-gray-300 text-sm">
                                  {userBreakdown.location || 'Unknown'}
                                </TableCell>
                                <TableCell className="text-gray-300 font-mono text-sm">
                                  {formatDuration(userBreakdown.totalDuration)}
                                </TableCell>
                                <TableCell className="text-gray-400 text-sm">
                                  <div className="space-y-0.5">
                                    <div className="flex items-center gap-1.5 font-medium">
                                      <span className={`w-2 h-2 rounded-full ${
                                        Date.now() - new Date(userBreakdown.lastActive).getTime() < 5 * 60 * 1000 
                                          ? "bg-emerald-400 animate-pulse" 
                                          : "bg-gray-500"
                                      }`} />
                                      <span className="text-gray-200">{formatRelativeTime(userBreakdown.lastActive)}</span>
                                    </div>
                                    <div className="text-[11px] text-gray-500 font-mono">
                                      {new Date(userBreakdown.lastActive).toLocaleString('en-GB')}
                                    </div>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ));
                          })()}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>

                {/* Live Activity Log Table */}
                <Card className="bg-white/5 border-white/10 shadow-xl">
                  <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg font-bold">Activity Logs</CardTitle>
                      <p className="text-xs text-gray-400">Granular view of user activities on the website</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-400 mr-1">Filter Type:</span>
                      <Select value={analyticsFilterEvent} onValueChange={setAnalyticsFilterEvent}>
                        <SelectTrigger className="w-[180px] bg-white/5 border-white/10 text-gray-300 rounded-xl">
                          <SelectValue placeholder="Event Type" />
                        </SelectTrigger>
                        <SelectContent className="bg-zinc-950 border-white/10 text-white rounded-xl">
                          <SelectItem value="all">All Events</SelectItem>
                          <SelectItem value="page_view">Page Views</SelectItem>
                          <SelectItem value="auth_login">Logins</SelectItem>
                          <SelectItem value="user_signup">Registrations</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {isLoadingAnalytics ? (
                      <div className="py-20 text-center text-gray-400">Loading activity logs...</div>
                    ) : (() => {
                      const filtered = activities.filter(activity => {
                        if (analyticsFilterEvent !== "all") {
                          if (analyticsFilterEvent === "custom_actions" && activity.event_type === "page_view") {
                            return false;
                          } else if (analyticsFilterEvent !== "custom_actions" && activity.event_type !== analyticsFilterEvent) {
                            return false;
                          }
                        }

                        if (!analyticsSearchQuery) return true;
                        const searchLower = analyticsSearchQuery.toLowerCase();
                        const emailMatch = (activity.user_email || "guest").toLowerCase().includes(searchLower);
                        const pathMatch = activity.page_path.toLowerCase().includes(searchLower);
                        const typeMatch = activity.event_type.toLowerCase().includes(searchLower);
                        const detailsMatch = JSON.stringify(activity.action_details || {}).toLowerCase().includes(searchLower);

                        return emailMatch || pathMatch || typeMatch || detailsMatch;
                      });

                      if (filtered.length === 0) {
                        return <div className="py-20 text-center text-gray-500">No matching activities found</div>;
                      }

                      return (
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow className="border-white/10 hover:bg-white/5">
                                <TableHead className="text-gray-400 w-[240px]">User</TableHead>
                                <TableHead className="text-gray-400">Event</TableHead>
                                <TableHead className="text-gray-400">Path</TableHead>
                                <TableHead className="text-gray-400">Time</TableHead>
                                <TableHead className="text-right text-gray-400 w-[120px]">Actions</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {filtered.map((activity) => {
                                const isExpanded = expandedActivityId === activity.id;
                                const isGuest = !activity.user_email;
                                
                                let badgeColor = "bg-gray-500/10 text-gray-400";
                                if (activity.event_type === "waitlist_signup") badgeColor = "bg-green-500/10 text-green-400";
                                else if (activity.event_type === "auth_login" || activity.event_type === "user_signup") badgeColor = "bg-blue-500/10 text-blue-400";
                                else if (activity.event_type === "pricing_upgrade_success") badgeColor = "bg-yellow-500/10 text-yellow-400";
                                else if (activity.event_type === "pricing_upgrade_click") badgeColor = "bg-amber-500/10 text-amber-400";
                                else if (activity.event_type === "interview_start" || activity.event_type === "interview_complete") badgeColor = "bg-blue-500/10 text-blue-400";

                                return (
                                  <>
                                    <TableRow 
                                      key={activity.id} 
                                      className="border-white/10 hover:bg-white/5 transition-colors"
                                    >
                                      <TableCell className="font-medium text-gray-300">
                                        {isGuest ? (
                                          <span className="text-gray-500 italic">Guest User</span>
                                        ) : (
                                          <div className="truncate max-w-[220px]" title={activity.user_email}>
                                            {activity.user_email}
                                          </div>
                                        )}
                                      </TableCell>
                                      <TableCell>
                                        <Badge variant="outline" className={`${badgeColor} border-0 capitalize font-medium`}>
                                          {activity.event_type.replace(/_/g, ' ')}
                                        </Badge>
                                      </TableCell>
                                      <TableCell className="font-mono text-xs text-gray-400">
                                        {activity.page_path}
                                      </TableCell>
                                      <TableCell className="text-gray-400 text-sm">
                                        {new Date(activity.created_at).toLocaleString('en-GB')}
                                      </TableCell>
                                      <TableCell className="text-right">
                                        <Button 
                                          variant="ghost" 
                                          size="sm" 
                                          onClick={() => setExpandedActivityId(isExpanded ? null : activity.id)}
                                          className="text-sky-400 hover:text-white hover:bg-sky-600/20 rounded-lg text-xs"
                                        >
                                          {isExpanded ? "Hide Details" : "View Details"}
                                        </Button>
                                      </TableCell>
                                    </TableRow>
                                    {isExpanded && (
                                      <TableRow className="bg-white/[0.01] hover:bg-white/[0.01]">
                                        <TableCell colSpan={5} className="py-4 px-6 border-white/5">
                                          <div className="bg-black/50 p-4 rounded-xl border border-white/5 space-y-3 font-sans text-xs text-left">
                                            <div>
                                              <span className="font-semibold text-gray-400 block mb-1">User Agent (Browser & Device)</span>
                                              <p className="text-gray-300 bg-white/5 p-2 rounded-lg font-mono truncate">{activity.user_agent || "Unknown"}</p>
                                            </div>
                                            <div>
                                              <span className="font-semibold text-gray-400 block mb-1">Payload Details (action_details)</span>
                                              <pre className="text-emerald-400 bg-white/5 p-3 rounded-lg overflow-x-auto font-mono text-[11px] leading-relaxed">
                                                {JSON.stringify(activity.action_details || {}, null, 2)}
                                              </pre>
                                            </div>
                                          </div>
                                        </TableCell>
                                      </TableRow>
                                    )}
                                  </>
                                );
                              })}
                            </TableBody>
                          </Table>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              </motion.div>
            );
          })(activities)}

            {activeTab === "users" && (
              <motion.div
                key="users"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-blue-400" />
                      User Management
                      <span className="ml-2 px-2.5 py-0.5 rounded-full bg-white/10 text-xs text-gray-400 font-normal">
                        {users.length}
                      </span>
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <Select 
                        value={sortConfig ? `${sortConfig.key}-${sortConfig.direction}` : "none"}
                        onValueChange={(val) => {
                          if (val === "none") setSortConfig(null);
                          else {
                            const [key, direction] = val.split('-');
                            setSortConfig({ key, direction: direction as 'asc' | 'desc' });
                          }
                        }}
                      >
                        <SelectTrigger className="w-[160px] bg-white/5 border-white/10 text-white h-9 text-xs">
                          <SelectValue placeholder="Sort By..." />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Default</SelectItem>
                          <SelectItem value="full_name-asc">Name (A-Z)</SelectItem>
                          <SelectItem value="full_name-desc">Name (Z-A)</SelectItem>
                          <SelectItem value="created_at-desc">Newest First</SelectItem>
                          <SelectItem value="created_at-asc">Oldest First</SelectItem>
                        </SelectContent>
                      </Select>
                      <button onClick={fetchUsers} className="border border-white/10 hover:bg-white/5 text-gray-200 hover:text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-colors">
                        Refresh List
                      </button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="rounded-md border border-white/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/10 hover:bg-white/5">
                            <TableHead className="text-gray-300 cursor-pointer hover:text-white" onClick={() => requestSort('full_name')}>
                              Name {sortConfig?.key === 'full_name' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </TableHead>
                            <TableHead className="text-gray-300 cursor-pointer hover:text-white" onClick={() => requestSort('email')}>
                              Email {sortConfig?.key === 'email' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </TableHead>
                            <TableHead className="text-gray-300 cursor-pointer hover:text-white" onClick={() => requestSort('created_at')}>
                              Joined Date {sortConfig?.key === 'created_at' ? (sortConfig.direction === 'asc' ? '↑' : '↓') : '↕'}
                            </TableHead>
                            <TableHead className="text-gray-300">Last Seen & Retention</TableHead>
                            <TableHead className="text-gray-300">Location</TableHead>
                            <TableHead className="text-gray-300">Status</TableHead>
                            <TableHead className="text-right text-gray-300">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingUsers ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                Loading users...
                              </TableCell>
                            </TableRow>
                          ) : sortedUsers.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={7} className="text-center py-8 text-gray-400">
                                {searchQuery ? "No matching users found" : "No users found"}
                              </TableCell>
                            </TableRow>
                          ) : (
                            sortedUsers.map((user) => {
                              const summary = getUserActivitySummary(user);
                              return (
                                <TableRow 
                                  key={user.id} 
                                  className="border-white/10 hover:bg-white/5 cursor-pointer transition-colors"
                                  onClick={() => navigate(`/admin/users/${user.id}`)}
                                >
                                  <TableCell className="font-medium text-gray-200">
                                    {user.full_name || "N/A"}
                                  </TableCell>
                                  <TableCell className="text-gray-400">{user.email || "N/A"}</TableCell>
                                  <TableCell className="text-gray-400">
                                    {formatDate(user.created_at)}
                                  </TableCell>
                                  <TableCell>
                                    <div className="space-y-0.5">
                                      <div className="flex items-center gap-1.5 text-xs font-semibold text-gray-200">
                                        <span className={`w-2 h-2 rounded-full ${summary.isOnlineNow ? "bg-emerald-400 animate-pulse" : "bg-gray-500"}`} />
                                        <span>{formatRelativeTime(summary.lastSeenDate)}</span>
                                      </div>
                                      <div className="text-[10px] text-gray-400">
                                        {summary.hasRevisited ? (
                                          <span className="text-emerald-400 font-medium bg-emerald-500/10 px-1.5 py-0.5 rounded">
                                            Revisited ({summary.sessionsCount} visits)
                                          </span>
                                        ) : (
                                          <span className="text-gray-500">1 visit</span>
                                        )}
                                      </div>
                                    </div>
                                  </TableCell>
                                  <TableCell className="text-gray-400">
                                    {summary.location}
                                  </TableCell>
                                  <TableCell>
                                    <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-0">
                                      Active
                                    </Badge>
                                  </TableCell>
                                  <TableCell className="text-right">
                                    <Button variant="ghost" size="icon" className="h-8 w-8 hover:text-red-400">
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </TableCell>
                                </TableRow>
                              );
                            })
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "community" && (
              <motion.div
                key="community"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                        <MessageSquare className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Total Posts</p>
                        <h3 className="text-2xl font-bold">1,234</h3>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-red-500/10 text-red-400">
                        <Flag className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Reported Content</p>
                        <h3 className="text-2xl font-bold">15</h3>
                      </div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                        <Activity className="w-6 h-6" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Active Users</p>
                        <h3 className="text-2xl font-bold">423</h3>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Flag className="w-5 h-5 text-red-400" />
                      Moderation Queue
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/10 hover:bg-white/5">
                          <TableHead className="text-gray-300">Author</TableHead>
                          <TableHead className="text-gray-300">Content</TableHead>
                          <TableHead className="text-gray-300">Reason</TableHead>
                          <TableHead className="text-gray-300">Time</TableHead>
                          <TableHead className="text-right text-gray-300">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {[
                          { id: 1, author: "SpamBot9000", content: "Buy cheap crypto now!!!", reason: "Spam", time: "10m ago" },
                          { id: 2, author: "AngryUser", content: "This platform sucks...", reason: "Harassment", time: "1h ago" },
                        ].map((item) => (
                          <TableRow key={item.id} className="border-white/10 hover:bg-white/5">
                            <TableCell className="font-medium text-gray-200">{item.author}</TableCell>
                            <TableCell className="text-gray-400 max-w-xs truncate">{item.content}</TableCell>
                            <TableCell>
                              <Badge variant="outline" className="bg-red-500/10 text-red-400 border-0">
                                {item.reason}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-gray-400">{item.time}</TableCell>
                            <TableCell className="text-right">
                              <div className="flex justify-end gap-2">
                                <Button variant="ghost" size="sm" className="text-green-400 hover:bg-green-500/10">
                                  <CheckCircle2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-red-400 hover:bg-red-500/10">
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                                <Button variant="ghost" size="sm" className="text-gray-400 hover:bg-white/10">
                                  <Ban className="w-4 h-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {activeTab === "blogs" && (
              <motion.div
                key="blogs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  {/* Create Blog Form */}
                  <div className="lg:col-span-2 space-y-6">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Plus className="w-5 h-5 text-sky-400" />
                          Create New Blog
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Blog Title</Label>
                          <Input 
                            placeholder="Enter blog title..." 
                            value={newBlog.title}
                            onChange={(e) => setNewBlog({...newBlog, title: e.target.value})}
                            className="bg-black/20 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Cover Image URL</Label>
                          <div className="flex gap-2">
                            <Input 
                              placeholder="https://..." 
                              value={newBlog.image}
                              onChange={(e) => setNewBlog({...newBlog, image: e.target.value})}
                              className="bg-black/20 border-white/10 text-white"
                            />
                            <button type="button" className="border border-white/10 hover:bg-white/5 text-gray-200 hover:text-white h-10 w-10 flex items-center justify-center rounded-lg transition-colors">
                              <ImageIcon className="w-4 h-4 text-gray-400" />
                            </button>
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Category</Label>
                          <Select 
                            value={newBlog.category} 
                            onValueChange={(value) => setNewBlog({...newBlog, category: value})}
                          >
                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                              <SelectValue placeholder="Select category" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="General">General</SelectItem>
                              <SelectItem value="AI & Tech">AI & Tech</SelectItem>
                              <SelectItem value="Career Advice">Career Advice</SelectItem>
                              <SelectItem value="Soft Skills">Soft Skills</SelectItem>
                              <SelectItem value="Interview Tips">Interview Tips</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Content</Label>
                          <Textarea 
                            placeholder="Write your blog content here..." 
                            value={newBlog.content}
                            onChange={(e) => setNewBlog({...newBlog, content: e.target.value})}
                            className="bg-black/20 border-white/10 text-white min-h-[300px]"
                          />
                        </div>
                        <div className="flex justify-end">
                          <Button onClick={handlePublishBlog} className="bg-sky-600 hover:bg-sky-700">
                            Publish Blog
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Existing Blogs List */}
                  <div className="space-y-6">
                    <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <FileText className="w-5 h-5 text-emerald-400" />
                          Recent Blogs
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {blogs.map((blog) => (
                          <div key={blog.id} className="p-4 rounded-lg bg-black/20 border border-white/5 group hover:border-white/10 transition-all">
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-medium text-gray-200 line-clamp-1">{blog.title}</h4>
                              <Badge variant="outline" className={`border-0 ${blog.status === 'Published' ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'}`}>
                                {blog.status}
                              </Badge>
                            </div>
                            <div className="flex justify-between items-center text-xs text-gray-500 mt-2">
                              <div className="flex gap-3">
                                <span>{new Date(blog.created_at).toLocaleDateString()}</span>
                                <span>{blog.views || 0} views</span>
                              </div>
                              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-blue-400">
                                  <Edit className="w-3 h-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 hover:text-red-400" onClick={() => handleDeleteBlog(blog.id)}>
                                  <Trash2 className="w-3 h-3" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === "challenges" && (
              <motion.div
                key="challenges"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                 <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Code2 className="w-5 h-5 text-orange-400" />
                        Create Daily Challenge
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                          <Label className="text-gray-300">Challenge Title</Label>
                          <Input 
                            placeholder="e.g. Reverse Linked List" 
                            value={newChallenge.title}
                            onChange={(e) => setNewChallenge({...newChallenge, title: e.target.value})}
                            className="bg-black/20 border-white/10 text-white"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-gray-300">Difficulty</Label>
                          <Select 
                            value={newChallenge.difficulty} 
                            onValueChange={(value) => setNewChallenge({...newChallenge, difficulty: value})}
                          >
                            <SelectTrigger className="bg-black/20 border-white/10 text-white">
                              <SelectValue placeholder="Select difficulty" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Easy">Easy</SelectItem>
                              <SelectItem value="Medium">Medium</SelectItem>
                              <SelectItem value="Hard">Hard</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label className="text-gray-300">Problem Description (Markdown supported)</Label>
                        <Textarea 
                          placeholder="Describe the problem..." 
                          value={newChallenge.description}
                          onChange={(e) => setNewChallenge({...newChallenge, description: e.target.value})}
                          className="bg-black/20 border-white/10 text-white min-h-[150px]"
                        />
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="space-y-2">
                           <Label className="text-gray-300">Test Cases (JSON format)</Label>
                           <Textarea 
                              value={newChallenge.testCases}
                              onChange={(e) => setNewChallenge({...newChallenge, testCases: e.target.value})}
                              className="bg-black/20 border-white/10 text-white font-mono text-xs min-h-[200px]"
                           />
                        </div>
                        <div className="space-y-2">
                           <Label className="text-gray-300">Starter Code (Template)</Label>
                           <Textarea 
                              value={newChallenge.starterCode}
                              onChange={(e) => setNewChallenge({...newChallenge, starterCode: e.target.value})}
                              className="bg-black/20 border-white/10 text-white font-mono text-xs min-h-[200px]"
                           />
                        </div>
                      </div>

                      <div className="flex justify-end pt-4 border-t border-white/10">
                        <Button 
                          onClick={handlePublishChallenge} 
                          className="bg-orange-600 hover:bg-orange-700 text-white"
                        >
                          <Code2 className="mr-2 h-4 w-4" />
                          Publish Challenge
                        </Button>
                      </div>
                    </CardContent>
                 </Card>
              </motion.div>
            )}
            {activeTab === "settings" && (
              <motion.div
                key="settings"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="relative pb-24"
              >
                <div className="mb-8">
                  <h3 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-sky-400 to-blue-400">
                    System Control Center
                  </h3>
                  <p className="text-gray-400 mt-2">Manage global configurations and security policies.</p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
                  {/* Platform Settings Card */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.1 }}
                  >
                    <Card className="h-full bg-black/40 border-white/10 backdrop-blur-xl hover:border-sky-500/30 transition-all duration-500 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-sky-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-2 rounded-lg bg-sky-500/10 text-sky-400 group-hover:text-sky-300 transition-colors">
                            <Settings className="w-6 h-6" />
                          </div>
                          Platform
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8 relative">
                        <div className="space-y-3">
                          <Label htmlFor="siteName" className="text-gray-300 font-medium">Site Name</Label>
                          <Input 
                            id="siteName" 
                            value={settings.siteName} 
                            onChange={(e) => setSettings({...settings, siteName: e.target.value})}
                            className="bg-white/5 border-white/10 text-white focus:border-sky-500/50 focus:ring-sky-500/20 transition-all h-11"
                          />
                        </div>
                        
                        <div className="space-y-6">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="space-y-1">
                              <Label className="text-base text-gray-200 font-medium">Maintenance Mode</Label>
                              <p className="text-xs text-gray-500">Disable user access</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium ${settings.maintenanceMode ? 'text-sky-400' : 'text-gray-600'}`}>
                                {settings.maintenanceMode ? 'ON' : 'OFF'}
                              </span>
                              <Switch 
                                checked={settings.maintenanceMode}
                                onCheckedChange={(checked) => setSettings({...settings, maintenanceMode: checked})}
                                className="data-[state=checked]:bg-sky-600"
                              />
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                            <div className="space-y-1">
                              <Label className="text-base text-gray-200 font-medium">Registrations</Label>
                              <p className="text-xs text-gray-500">Allow new sign-ups</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs font-medium ${settings.allowRegistrations ? 'text-emerald-400' : 'text-gray-600'}`}>
                                {settings.allowRegistrations ? 'OPEN' : 'CLOSED'}
                              </span>
                              <Switch 
                                checked={settings.allowRegistrations}
                                onCheckedChange={(checked) => setSettings({...settings, allowRegistrations: checked})}
                                className="data-[state=checked]:bg-emerald-500"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Security Policy Card */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                  >
                    <Card className="h-full bg-black/40 border-white/10 backdrop-blur-xl hover:border-emerald-500/30 transition-all duration-500 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 group-hover:text-emerald-300 transition-colors">
                            <Shield className="w-6 h-6" />
                          </div>
                          Security
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8 relative">
                        <div className="space-y-6">
                          <div className="space-y-4">
                            <div className="flex justify-between items-end">
                              <Label className="text-gray-300 font-medium">Session Timeout</Label>
                              <div className="px-2 py-1 rounded bg-emerald-500/10 text-emerald-400 text-xs font-mono border border-emerald-500/20">
                                {settings.sessionTimeout[0]} min
                              </div>
                            </div>
                            <Slider 
                              value={settings.sessionTimeout} 
                              onValueChange={(val) => setSettings({...settings, sessionTimeout: val})}
                              max={120} 
                              step={5}
                              className="py-2 [&>.relative>.absolute]:bg-emerald-500"
                            />
                            <div className="flex justify-between text-xs text-gray-600 font-mono">
                              <span>5m</span>
                              <span>120m</span>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="space-y-1">
                            <Label className="text-base text-gray-200 font-medium">Enforce 2FA</Label>
                            <p className="text-xs text-gray-500">Mandatory for admins</p>
                          </div>
                          <Switch 
                            checked={settings.enforce2FA}
                            onCheckedChange={(checked) => setSettings({...settings, enforce2FA: checked})}
                            className="data-[state=checked]:bg-emerald-500"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>

                  {/* Notifications Card */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3 }}
                    className="lg:col-span-2 xl:col-span-1"
                  >
                    <Card className="h-full bg-black/40 border-white/10 backdrop-blur-xl hover:border-orange-500/30 transition-all duration-500 group overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-orange-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      <CardHeader>
                        <CardTitle className="flex items-center gap-3 text-xl">
                          <div className="p-2 rounded-lg bg-orange-500/10 text-orange-400 group-hover:text-orange-300 transition-colors">
                            <Bell className="w-6 h-6" />
                          </div>
                          Notifications
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-8 relative">
                        <div className="flex items-center justify-between p-4 rounded-xl bg-white/5 border border-white/5 hover:border-white/10 transition-colors">
                          <div className="space-y-1">
                            <Label className="text-base text-gray-200 font-medium">Email Alerts</Label>
                            <p className="text-xs text-gray-500">Daily system reports</p>
                          </div>
                          <Switch 
                            checked={settings.emailNotifications}
                            onCheckedChange={(checked) => setSettings({...settings, emailNotifications: checked})}
                            className="data-[state=checked]:bg-orange-500"
                          />
                        </div>

                        <div className="space-y-3">
                          <Label className="text-gray-300 font-medium">System Announcement</Label>
                          <Textarea 
                            placeholder="Broadcast message to all users..." 
                            value={settings.systemAnnouncements}
                            onChange={(e) => setSettings({...settings, systemAnnouncements: e.target.value})}
                            className="bg-white/5 border-white/10 text-white min-h-[120px] focus:border-orange-500/50 focus:ring-orange-500/20 transition-all resize-none"
                          />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>

                {/* Floating Action Bar */}
                <motion.div 
                  initial={{ y: 100 }}
                  animate={{ y: 0 }}
                  className="fixed bottom-8 right-8 left-8 md:left-80 z-40"
                >
                  <div className="bg-gray-900/80 backdrop-blur-xl border border-white/10 p-4 rounded-2xl shadow-2xl flex items-center justify-between max-w-4xl mx-auto">
                    <div className="flex items-center gap-3 text-sm text-gray-400 px-2">
                      <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                      All systems operational
                    </div>
                    <div className="flex gap-4">
                      <Button 
                        variant="ghost" 
                        className="text-gray-400 hover:text-white hover:bg-white/10"
                        onClick={() => setSettings({
                          siteName: "Voke AI",
                          maintenanceMode: false,
                          allowRegistrations: true,
                          emailNotifications: true,
                          systemAnnouncements: "",
                          sessionTimeout: [30],
                          enforce2FA: false
                        })}
                      >
                        Reset Defaults
                      </Button>
                      <Button 
                        onClick={handleSaveSettings} 
                        className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white shadow-lg shadow-sky-500/25"
                      >
                        <CheckCircle2 className="w-4 h-4 mr-2" />
                        Save Changes
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {activeTab === "locations" && (
              <motion.div
                key="locations"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.3 }}
                className="space-y-6"
              >
                <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-sky-400" />
                      Manage Monitored Locations
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="flex gap-4">
                      <Input 
                        placeholder="E.g., Pune, Mumbai, London" 
                        value={newLocationName}
                        onChange={(e) => setNewLocationName(e.target.value)}
                        className="bg-black/50 border-white/10 text-white flex-1"
                      />
                      <Button onClick={handleAddLocation} className="bg-sky-600 hover:bg-sky-700 text-white">
                        <Plus className="w-4 h-4 mr-2" /> Add Location
                      </Button>
                    </div>

                    <div className="rounded-xl border border-white/10 overflow-hidden">
                      <Table>
                        <TableHeader className="bg-white/5">
                          <TableRow className="border-white/10">
                            <TableHead className="text-gray-400">Location Name</TableHead>
                            <TableHead className="text-gray-400">Status</TableHead>
                            <TableHead className="text-gray-400">Added On</TableHead>
                            <TableHead className="text-right text-gray-400">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {isLoadingLocations ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">Loading locations...</TableCell>
                            </TableRow>
                          ) : locations.length === 0 ? (
                            <TableRow>
                              <TableCell colSpan={4} className="text-center py-8 text-gray-500">No locations tracked yet.</TableCell>
                            </TableRow>
                          ) : (
                            locations.map(loc => (
                              <TableRow key={loc.id} className="border-white/10 hover:bg-white/5">
                                <TableCell className="font-medium text-gray-200">{loc.location_name}</TableCell>
                                <TableCell>
                                  <Switch 
                                    checked={loc.is_active}
                                    onCheckedChange={() => handleToggleLocation(loc.id, loc.is_active)}
                                    className="data-[state=checked]:bg-emerald-500"
                                  />
                                </TableCell>
                                <TableCell className="text-gray-400">{formatDate(loc.created_at)}</TableCell>
                                <TableCell className="text-right">
                                  <Button variant="ghost" size="icon" onClick={() => handleDeleteLocation(loc.id)} className="text-red-400 hover:text-red-300 hover:bg-red-400/10">
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            ))
                          )}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
