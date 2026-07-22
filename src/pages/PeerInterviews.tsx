import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Calendar, Clock, Target, Plus, Loader2, Video, Search, Star, Zap, ArrowRight, UserPlus, BookOpen, CheckCircle2, XCircle, Trash2, Cpu, Activity, Globe, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion, AnimatePresence, Variants } from "motion/react";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { InterviewGate } from "@/components/InterviewGate";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useOnlinePresence } from "@/components/OnlinePresenceProvider";
import { PeerChat } from "@/components/PeerChat";

interface PeerSession {
  id: string;
  topic: string;
  difficulty_level: string;
  duration_minutes: number;
  scheduled_at: string;
  host_user_id: string;
  guest_user_id: string | null;
  status: string;
  host_profile?: {
    full_name: string | null;
    avatar_url?: string | null;
  };
  guest_profile?: {
    full_name: string | null;
    avatar_url?: string | null;
  };
}

const PeerInterviews = () => {
  const navigate = useNavigate();
  const { onlineUsers } = useOnlinePresence();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'browse' | 'upcoming' | 'requests'>('browse');
  const [searchQuery, setSearchQuery] = useState("");
  const [sessions, setSessions] = useState<PeerSession[]>([]);
  const [userSessions, setUserSessions] = useState<PeerSession[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const { credits, hasGivenFeedback, isPremium, canTakeInterview, loading: creditsLoading, refreshCredits, grantFeedbackCredits } = useInterviewCredits('elite');

  useEffect(() => {
    checkAuth();
    fetchSessions();
    
    const channel = supabase
      .channel('public:peer_interview_sessions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'peer_interview_sessions' }, () => {
        fetchSessions();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setCurrentUserId(user.id);
    }
  };

  const fetchSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
      
      const { data: allSessions, error } = await supabase
        .from('peer_interview_sessions')
        .select('*')
        .in('status', ['scheduled', 'pending'])
        .gt('scheduled_at', oneHourAgo)
        .order('scheduled_at', { ascending: true });

      if (error) throw error;

      const userIds = new Set<string>();
      allSessions?.forEach(s => {
        userIds.add(s.host_user_id);
        if (s.guest_user_id) userIds.add(s.guest_user_id);
      });
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id, full_name')
        .in('id', Array.from(userIds));

      const profileMap = new Map(profiles?.map(p => [p.id, p]));

      const formattedSessions: PeerSession[] = (allSessions || []).map(session => ({
        ...session,
        host_profile: profileMap.get(session.host_user_id) || { full_name: 'Unknown User' },
        guest_profile: session.guest_user_id ? profileMap.get(session.guest_user_id) : undefined
      }));

      if (user) {
        const browse = formattedSessions.filter(s => 
          s.host_user_id !== user.id && !s.guest_user_id && s.status === 'scheduled'
        );
        setSessions(browse);

        const upcoming = formattedSessions.filter(s => 
          s.host_user_id === user.id || s.guest_user_id === user.id
        );
        setUserSessions(upcoming);
      } else {
        setSessions(formattedSessions.filter(s => !s.guest_user_id && s.status === 'scheduled'));
        setUserSessions([]);
      }

    } catch (error) {
      console.error("Error fetching sessions:", error);
      toast.error("Failed to load sessions");
    } finally {
      setLoading(false);
    }
  };

  const handleRequestSession = async (sessionId: string) => {
    if (!currentUserId) {
      toast.error("Please login to request a session");
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .update({ 
          guest_user_id: currentUserId,
          status: 'pending'
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success("Request sent to host!");
      fetchSessions();
      setActiveTab('upcoming');
    } catch (error: any) {
      toast.error(`Failed to request session: ${error.message || 'Unknown error'}`);
    }
  };

  const handleApproveRequest = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .update({ status: 'scheduled' })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success("Session approved!");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to approve session");
    }
  };

  const handleDeclineRequest = async (sessionId: string) => {
    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .update({ 
          guest_user_id: null,
          status: 'scheduled'
        })
        .eq('id', sessionId);

      if (error) throw error;
      toast.success("Request declined.");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to decline session");
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
    if (!window.confirm("Are you sure you want to delete this session?")) return;
    try {
      const { error } = await supabase
        .from('peer_interview_sessions')
        .delete()
        .eq('id', sessionId);

      if (error) throw error;
      toast.success("Session deleted successfully");
      fetchSessions();
    } catch (error) {
      toast.error("Failed to delete session");
    }
  };

  const handleJoinSession = (sessionId: string) => {
    navigate(`/peer-interviews/session/${sessionId}`);
  };

  const getInitials = (name: string) => {
    return name?.split(' ').map(part => part[0]).join('').toUpperCase().slice(0, 2) || "??";
  };

  const filteredSessions = sessions.filter(session => 
    session.topic.toLowerCase().includes(searchQuery.toLowerCase()) ||
    session.difficulty_level.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: { 
      y: 0, 
      opacity: 1,
      transition: { type: "spring", stiffness: 300, damping: 25 }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="flex flex-col items-center gap-4">
          <div className="relative">
             <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
             <div className="absolute inset-0 flex items-center justify-center">
                <Globe className="h-6 w-6 text-violet-500 animate-pulse" />
             </div>
          </div>
          <p className="text-muted-foreground animate-pulse font-mono tracking-widest uppercase text-sm">Initializing Neural Link...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground font-sans selection:bg-violet-500/30">
        
       {/* Ambient Backlights */}
       <div className="fixed inset-0 pointer-events-none z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-fuchsia-600/10 blur-[120px]" />
          <div className="absolute top-[20%] right-[20%] w-[300px] h-[300px] rounded-full bg-cyan-600/5 blur-[80px]" />
          <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
       </div>

      {/* Header */}
      <header className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate("/dashboard")}>
             <div className="relative">
                <div className="absolute inset-0 bg-violet-500/20 rounded-lg blur opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 relative z-10">
                   <Users className="w-5 h-5 text-white" />
                </div>
             </div>
             <div className="flex flex-col">
                <span className="font-bold text-lg leading-tight tracking-tight">Peer<span className="text-violet-500">Sync</span></span>
                <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-medium">Neural Network</span>
             </div>
          </div>

          <div className="flex items-center gap-4">
             <div className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-secondary/30 border border-border/40 backdrop-blur-sm shadow-sm">
                <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-medium text-muted-foreground">{onlineUsers.size} Peers Online</span>
             </div>
             <ThemeToggle />
             <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="rounded-full hover:bg-secondary/80">
                <ArrowRight className="w-5 h-5" />
             </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-28 pb-12 relative z-10">
        {creditsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : !canTakeInterview ? (
          <div className="max-w-2xl mx-auto py-8">
            <InterviewGate
              credits={credits}
              hasGivenFeedback={hasGivenFeedback}
              isPremium={isPremium}
              onFeedbackSuccess={refreshCredits}
              grantFeedbackCredits={grantFeedbackCredits}
            />
          </div>
        ) : (
          <>
            <motion.div
               initial="hidden"
               animate="visible"
               variants={containerVariants}
               className="grid lg:grid-cols-12 gap-8 mb-12"
            >
           {/* Left Column: Hero & Search */}
           <motion.div variants={itemVariants} className="lg:col-span-8 flex flex-col justify-center">
              <Badge variant="outline" className="w-fit mb-4 border-violet-500/30 bg-violet-500/10 text-violet-500 hover:bg-violet-500/20 transition-colors uppercase tracking-widest text-[10px]">
                 <Sparkles className="w-3 h-3 mr-1.5" /> Beta 2.0
              </Badge>
              <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground via-foreground to-muted-foreground/50 leading-[1.1]">
                 Master the Art of <br />
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-violet-500 to-fuchsia-500">Technical Dialogue.</span>
              </h1>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed mb-8">
                 Connect with ambitious engineers from top companies. Simulate real interview pressure, swap feedback, and level up together.
              </p>

              <div className="flex flex-col sm:flex-row gap-4">
                 <div className="relative flex-1 max-w-md group">
                    <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-fuchsia-500/20 rounded-xl blur-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 -z-10" />
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-violet-500 transition-colors" />
                    <Input 
                      placeholder="Find practice session (e.g., System Design, React)..." 
                      className="pl-11 h-14 bg-background/50 backdrop-blur-md border-white/10 ring-offset-background focus-visible:ring-1 focus-visible:ring-violet-500/50 rounded-xl text-base transition-all shadow-sm group-hover:bg-background/80"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                 </div>
                 <Button 
                    size="lg" 
                    onClick={() => navigate("/peer-interviews/create")}
                    className="h-14 px-8 rounded-xl bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white shadow-lg shadow-violet-500/25 transition-all text-base font-medium"
                 >
                    <Plus className="w-5 h-5 mr-2" />
                    Start Session
                 </Button>
              </div>
           </motion.div>

           {/* Right Column: Stats Card */}
           <motion.div variants={itemVariants} className="lg:col-span-4">
              <div className="relative h-full min-h-[300px] rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-b from-white/5 to-transparent backdrop-blur-2xl shadow-2xl">
                 <div className="absolute inset-0 bg-noise opacity-30 mix-blend-overlay pointer-events-none" />
                 
                 <div className="p-8 relative z-10 flex flex-col justify-between h-full">
                    <div>
                       <div className="flex items-center justify-between mb-8">
                          <h3 className="font-semibold text-lg flex items-center gap-2">
                             <Activity className="w-5 h-5 text-emerald-500" />
                             Live Metrics
                          </h3>
                          <div className="flex gap-1">
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-[pulse_3s_infinite]" />
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/50 animate-[pulse_3s_infinite_0.5s]" />
                             <span className="w-1.5 h-1.5 rounded-full bg-emerald-500/20 animate-[pulse_3s_infinite_1s]" />
                          </div>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-6">
                           <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Global Sessions</p>
                              <p className="text-3xl font-mono font-bold tracking-tight">1,204</p>
                              <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                                 <div className="h-full bg-violet-500 w-[70%]" />
                              </div>
                           </div>
                           <div className="space-y-1">
                              <p className="text-sm text-muted-foreground">Match Rate</p>
                              <p className="text-3xl font-mono font-bold tracking-tight">94%</p>
                              <div className="h-1 w-full bg-secondary/50 rounded-full overflow-hidden">
                                 <div className="h-full bg-fuchsia-500 w-[94%]" />
                              </div>
                           </div>
                       </div>
                    </div>
                    
                    <div className="mt-8 pt-8 border-t border-white/5">
                        <div className="flex items-center gap-4">
                           <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400/20 to-orange-400/20 flex items-center justify-center border border-yellow-400/10">
                              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500/20" />
                           </div>
                           <div>
                              <p className="font-medium">Top Performer</p>
                              <p className="text-xs text-muted-foreground">Become a featured interviewer</p>
                           </div>
                        </div>
                    </div>
                 </div>
              </div>
           </motion.div>
        </motion.div>

        {/* Tabs Interface */}
        <Tabs defaultValue="browse" value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
           <motion.div 
             initial={{ opacity: 0, y: 10 }}
             animate={{ opacity: 1, y: 0 }}
             transition={{ delay: 0.2 }}
             className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-4"
           >
              <TabsList className="h-12 bg-secondary/30 backdrop-blur-sm p-1 rounded-full border border-border/40">
                 <TabsTrigger value="browse" className="rounded-full px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all">Browse</TabsTrigger>
                 <TabsTrigger value="upcoming" className="rounded-full px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all relative">
                    Upcoming
                    {userSessions.filter(s => !(s.host_user_id === currentUserId && s.status === 'pending')).length > 0 && (
                       <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-violet-500 text-[9px] flex items-center justify-center text-white font-bold border border-background">
                          {userSessions.filter(s => !(s.host_user_id === currentUserId && s.status === 'pending')).length}
                       </span>
                    )}
                 </TabsTrigger>
                 <TabsTrigger value="requests" className="rounded-full px-6 h-full data-[state=active]:bg-background data-[state=active]:shadow-sm transition-all relative">
                    Requests
                    {userSessions.filter(s => s.host_user_id === currentUserId && s.status === 'pending').length > 0 && (
                       <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-fuchsia-500 text-[9px] flex items-center justify-center text-white font-bold border border-background">
                          {userSessions.filter(s => s.host_user_id === currentUserId && s.status === 'pending').length}
                       </span>
                    )}
                 </TabsTrigger>
              </TabsList>
           </motion.div>

           <AnimatePresence mode="popLayout">
               {/* BROWSE TAB */}
               <TabsContent value="browse" className="mt-0">
                  {filteredSessions.length === 0 ? (
                      <EmptyState 
                         icon={Search} 
                         title="No sessions found" 
                         desc="Be the first to create a session in this category."
                         action={() => navigate("/peer-interviews/create")}
                         actionLabel="Create Session"
                      />
                  ) : (
                      <motion.div 
                         initial="hidden"
                         animate="visible"
                         variants={containerVariants}
                         className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                         {filteredSessions.map((session) => (
                            <SessionCard 
                               key={session.id} 
                               session={session} 
                               onlineUsers={onlineUsers} 
                               isHost={false}
                               action={
                                  <Button 
                                     className="w-full bg-secondary hover:bg-secondary/80 text-foreground transition-all" 
                                     onClick={() => handleRequestSession(session.id)}
                                  >
                                     Request to Join
                                  </Button>
                               }
                            />
                         ))}
                      </motion.div>
                  )}
               </TabsContent>

               {/* UPCOMING TAB */}
               <TabsContent value="upcoming" className="mt-0">
                  {userSessions.filter(s => !(s.host_user_id === currentUserId && s.status === 'pending')).length === 0 ? (
                      <EmptyState 
                         icon={Calendar} 
                         title="No upcoming sessions" 
                         desc="Your schedule is clear. Book a session to keep your streak alive."
                         action={() => navigate("/peer-interviews/create")}
                         actionLabel="Create Session"
                      />
                  ) : (
                      <motion.div 
                         initial="hidden"
                         animate="visible"
                         variants={containerVariants}
                         className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                         {userSessions
                            .filter(s => !(s.host_user_id === currentUserId && s.status === 'pending'))
                            .map((session) => (
                              <SessionCard 
                                 key={session.id}
                                 session={session}
                                 onlineUsers={onlineUsers}
                                 isHost={session.host_user_id === currentUserId}
                                 currentUserId={currentUserId}
                                 onDelete={session.host_user_id === currentUserId ? () => handleDeleteSession(session.id) : undefined}
                                 action={
                                    session.status === 'scheduled' ? (
                                       <div className="flex gap-2">
                                          <Button 
                                            className="flex-1 bg-violet-600 hover:bg-violet-700 text-white shadow-lg shadow-violet-500/20" 
                                            onClick={() => handleJoinSession(session.id)}
                                          >
                                            <Video className="w-4 h-4 mr-2" />
                                            Enter Room
                                          </Button>
                                          <PeerChat 
                                            sessionId={session.id}
                                            currentUserId={currentUserId!}
                                            otherUserName={session.host_user_id === currentUserId 
                                              ? (session.guest_profile?.full_name || "Guest") 
                                              : (session.host_profile?.full_name || "Host")}
                                          />
                                       </div>
                                    ) : (
                                       <Button className="w-full" variant="secondary" disabled>
                                          <Clock className="w-4 h-4 mr-2" />
                                          Pending Host Approval
                                       </Button>
                                    )
                                 }
                              />
                         ))}
                      </motion.div>
                  )}
               </TabsContent>

               {/* REQUESTS TAB */}
               <TabsContent value="requests" className="mt-0">
                    {userSessions.filter(s => s.host_user_id === currentUserId && s.status === 'pending').length === 0 ? (
                      <EmptyState 
                         icon={UserPlus} 
                         title="No pending requests" 
                         desc="Requests to join your sessions will appear here."
                      />
                  ) : (
                      <motion.div 
                         initial="hidden"
                         animate="visible"
                         variants={containerVariants}
                         className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                      >
                         {userSessions
                            .filter(s => s.host_user_id === currentUserId && s.status === 'pending')
                            .map((session) => (
                               <SessionCard 
                                 key={session.id}
                                 session={session}
                                 onlineUsers={onlineUsers}
                                 isHost={true}
                                 currentUserId={currentUserId}
                                 requestMode={true}
                                 action={
                                     <div className="flex gap-2">
                                        <Button 
                                          className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white"
                                          onClick={() => handleApproveRequest(session.id)}
                                        >
                                          <CheckCircle2 className="w-4 h-4 mr-2" />
                                          Accept
                                        </Button>
                                        <Button 
                                          variant="outline"
                                          className="flex-1 border-red-500/20 text-red-500 hover:bg-red-500/10"
                                          onClick={() => handleDeclineRequest(session.id)}
                                        >
                                          <XCircle className="w-4 h-4 mr-2" />
                                          Decline
                                        </Button>
                                     </div>
                                 }
                               />
                         ))}
                      </motion.div>
                  )}
               </TabsContent>
           </AnimatePresence>
        </Tabs>
          </>
        )}
      </main>
    </div>
  );
};

// Sub-components for cleaner code

const SessionCard = ({ 
   session, 
   onlineUsers, 
   isHost, 
   currentUserId, 
   action, 
   onDelete,
   requestMode = false
}: { 
   session: PeerSession; 
   onlineUsers: Set<string>; 
   isHost: boolean; 
   currentUserId?: string | null;
   action: React.ReactNode; 
   onDelete?: () => void;
   requestMode?: boolean
}) => {
   
   const getInitials = (name: string) => name?.split(' ').map(p => p[0]).join('').toUpperCase().slice(0, 2) || "??";
   
   // Determine who to show in the card avatar/info
   const displayProfile = requestMode 
      ? session.guest_profile 
      : (isHost ? session.host_profile : session.host_profile);
      
   const isOnline = onlineUsers.has(isHost ? session.guest_user_id || "" : session.host_user_id);

   return (
      <motion.div variants={{ hidden: { y: 20, opacity: 0 }, visible: { y: 0, opacity: 1 } }}>
         <Card className="h-full border-white/5 bg-card/40 backdrop-blur-md hover:bg-card/60 transition-all duration-300 group hover:shadow-xl hover:shadow-violet-500/5 hover:-translate-y-1 relative overflow-hidden">
            {/* Decoration gradient */}
            <div className={`absolute top-0 right-0 p-20 bg-gradient-to-br ${requestMode ? 'from-yellow-500/10' : 'from-violet-500/10'} to-transparent rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none group-hover:opacity-100 opacity-50 transition-opacity`} />
            
            <CardHeader className="pb-4 relative z-10">
               <div className="flex justify-between items-start mb-4">
                  <div className="flex flex-col gap-1">
                     <Badge 
                        variant={session.difficulty_level === 'advanced' ? 'destructive' : 'secondary'} 
                        className={`w-fit capitalize ${session.difficulty_level === 'intermediate' ? 'bg-blue-500/10 text-blue-500 hover:bg-blue-500/20' : ''}`}
                     >
                        {session.difficulty_level}
                     </Badge>
                     {requestMode && (
                        <Badge variant="outline" className="border-yellow-500/30 text-yellow-500 text-[10px] w-fit">Request Received</Badge>
                     )}
                  </div>
                  
                  <div className="flex items-center gap-2">
                     {onDelete && (
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground hover:text-red-500" onClick={onDelete}>
                           <Trash2 className="w-4 h-4" />
                        </Button>
                     )}
                     <div className="w-8 h-8 rounded-full bg-secondary/50 flex items-center justify-center">
                        <Cpu className="w-4 h-4 text-muted-foreground" />
                     </div>
                  </div>
               </div>
               
               <CardTitle className="text-xl font-bold line-clamp-1 mb-1 group-hover:text-primary transition-colors">
                  {session.topic}
               </CardTitle>
               
               <div className="flex items-center gap-2 mt-3 p-2 rounded-xl bg-secondary/30 w-fit">
                  <div className="relative">
                      <Avatar className="h-8 w-8 border border-white/10">
                         <AvatarImage src={displayProfile?.avatar_url || ''} />
                         <AvatarFallback>{getInitials(displayProfile?.full_name || 'User')}</AvatarFallback>
                      </Avatar>
                      {isOnline && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-background rounded-full" />}
                  </div>
                  <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground">{requestMode ? 'Requested by' : 'Hosted by'}</span>
                      <span className="text-sm font-medium leading-none">{displayProfile?.full_name || 'Anonymous'}</span>
                  </div>
               </div>
            </CardHeader>
            
            <CardContent className="relative z-10 space-y-6">
               <div className="grid grid-cols-2 gap-3 text-sm">
                   <div className="flex items-start gap-2 text-muted-foreground bg-background/30 p-2.5 rounded-lg border border-white/5">
                      <Calendar className="w-4 h-4 mt-0.5 text-violet-400" />
                      <div className="flex flex-col">
                         <span className="text-foreground font-medium">{new Date(session.scheduled_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                         <span className="text-xs">{new Date(session.scheduled_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                   </div>
                   <div className="flex items-start gap-2 text-muted-foreground bg-background/30 p-2.5 rounded-lg border border-white/5">
                      <Clock className="w-4 h-4 mt-0.5 text-violet-400" />
                      <div className="flex flex-col">
                         <span className="text-foreground font-medium">{session.duration_minutes} min</span>
                         <span className="text-xs">Duration</span>
                      </div>
                   </div>
               </div>
               
               <div className="pt-2">
                  {action}
               </div>
            </CardContent>
         </Card>
      </motion.div>
   );
};

const EmptyState = ({ icon: Icon, title, desc, action, actionLabel }: any) => (
   <motion.div 
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-20 text-center rounded-3xl border border-dashed border-border/50 bg-secondary/5"
   >
      <div className="w-20 h-20 rounded-full bg-secondary/50 flex items-center justify-center mb-6 ring-8 ring-secondary/20">
         <Icon className="w-10 h-10 text-muted-foreground" />
      </div>
      <h3 className="text-2xl font-bold mb-3">{title}</h3>
      <p className="text-muted-foreground max-w-sm mb-8 text-lg">
         {desc}
      </p>
      {action && (
         <Button onClick={action} size="lg" className="rounded-xl px-8">
            {actionLabel}
         </Button>
      )}
   </motion.div>
);

export default PeerInterviews;
