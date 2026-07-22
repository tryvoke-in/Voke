import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Flame, Trophy, Timer, ArrowRight, Star, Target, Users, Sparkles, ChevronLeft, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { getDailyQuestion, QUESTIONS } from "@/data/questions";
import { format, subDays } from "date-fns";

// Reusing streak logic from Dashboard (simplified adaption)
const calculateStreak = (dates: string[]) => {
  if (dates.length === 0) return 0;
  
  // Unique sorted dates YYYY-MM-DD (filtering out any invalid/null dates to prevent RangeErrors)
  const validDates = dates.filter(Boolean).map(d => {
    const date = new Date(d);
    return !isNaN(date.getTime()) ? date.toISOString().split('T')[0] : null;
  }).filter(Boolean) as string[];

  const uniqueDates = Array.from(new Set(validDates))
    .sort((a, b) => new Date(b).getTime() - new Date(a).getTime()); 

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

  if (!uniqueDates.includes(today) && !uniqueDates.includes(yesterday)) {
    return 0;
  }

  let streak = 0;
  let currentCheck = uniqueDates.includes(today) ? new Date(today) : new Date(yesterday);

  for (const dateStr of uniqueDates) {
    const date = new Date(dateStr);
    const d1 = new Date(currentCheck).setHours(12, 0, 0, 0);
    const d2 = new Date(date).setHours(12, 0, 0, 0);

    if (d1 === d2) {
      streak++;
      currentCheck.setDate(currentCheck.getDate() - 1);
    } else {
      break; 
    }
  }
  return streak;
};

const DailyChallengeLanding = () => {
  const navigate = useNavigate();
  const dailyQuestion = getDailyQuestion();
  const [streak, setStreak] = useState(0);
  const [timeLeft, setTimeLeft] = useState("");
  const [loading, setLoading] = useState(true);

  // Get previous 5 questions (excluding current daily one if possible, just slicing for now)
  // In a real app, this would be based on date. Here we simulate it.
  const previousQuestions = QUESTIONS
      .filter(q => q.id !== dailyQuestion.id)
      .slice(0, 5)
      .map((q, i) => ({
          ...q,
          date: subDays(new Date(), i + 1)
      }));

  // Mock Leaderboard Data
  const leaderboard = [
    { name: "Sarah Chen", score: 98, time: "15m 30s", avatar: "SC" },
    { name: "Michael Park", score: 95, time: "18m 45s", avatar: "MP" },
    { name: "Jessica Doe", score: 92, time: "22m 10s", avatar: "JD" },
    { name: "David Kim", score: 90, time: "25m 00s", avatar: "DK" },
    { name: "Emily White", score: 88, time: "28m 15s", avatar: "EW" },
  ];

  useEffect(() => {
    fetchUserData();
    const interval = setInterval(updateTimeLeft, 1000);
    return () => clearInterval(interval);
  }, []);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      const user = session?.user;
      if (!user) {
        setLoading(false);
        return;
      }

      // Fetch all user activity for streak calculation
      const { data: textSessions } = await supabase.from("interview_sessions").select("created_at").eq("user_id", user.id);
      const { data: videoSessions } = await supabase.from("video_interview_sessions").select("created_at").eq("user_id", user.id);
      const { data: peerSessions } = await supabase.from("peer_interview_sessions").select("scheduled_at").eq("host_user_id", user.id); // Simplified for host

      const allDates = [
        ...(textSessions || []).map(s => s.created_at),
        ...(videoSessions || []).map(s => s.created_at),
        ...(peerSessions || []).map(s => s.scheduled_at)
      ];
      
      setStreak(calculateStreak(allDates));
    } catch (error) {
      console.error("Error fetching user data", error);
    } finally {
      setLoading(false);
    }
  };

  const updateTimeLeft = () => {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setHours(24, 0, 0, 0);
    const diff = tomorrow.getTime() - now.getTime();
    
    const h = Math.floor(diff / (1000 * 60 * 60));
    const m = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const s = Math.floor((diff % (1000 * 60)) / 1000);
    
    setTimeLeft(`${h}h ${m}m ${s}s`);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-t-2 border-primary rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
        {/* Header */}
        <header className="border-b border-border bg-card/50 backdrop-blur-xl sticky top-0 z-50">
            <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                <Button variant="ghost" className="gap-2" onClick={() => navigate("/dashboard")}>
                    <ChevronLeft className="w-4 h-4" /> Back to Dashboard
                </Button>
                <div className="flex items-center gap-2 font-semibold">
                    <Target className="w-5 h-5 text-primary" />
                    Daily Challenge
                </div>
                <div className="w-24"></div> {/* Spacer for center alignment */}
            </div>
        </header>

        <main className="container mx-auto px-4 py-8 max-w-6xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* Left Column: Hero & Problem */}
                <div className="lg:col-span-8 space-y-8">
                    {/* Hero Section */}
                    <motion.div 
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-violet-600 to-indigo-600 text-white p-8 shadow-2xl"
                    >
                         <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                         <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
                            <div>
                                <h1 className="text-3xl font-bold mb-2">Keep the streak alive!</h1>
                                <p className="text-white/80 text-lg">Consistency is the key to mastery. You're doing great.</p>
                            </div>
                            <div className="flex items-center gap-4 bg-white/20 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/10">
                                <div className="p-3 bg-orange-500/20 rounded-full">
                                    <Flame className="w-8 h-8 text-orange-300 fill-orange-300" />
                                </div>
                                <div>
                                    <p className="text-3xl font-bold">{streak}</p>
                                    <p className="text-sm text-white/70 uppercase tracking-widest font-medium">Day Streak</p>
                                </div>
                            </div>
                         </div>
                    </motion.div>

                    {/* Problem Card */}
                    <Card className="border-border/50 shadow-lg overflow-hidden">
                        <div className="h-2 bg-gradient-to-r from-primary to-purple-600"></div>
                        <CardHeader>
                            <div className="flex justify-between items-start">
                                <div>
                                    <div className="flex items-center gap-3 mb-2">
                                        <Badge className={`${
                                            dailyQuestion.difficulty === 'Easy' ? 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20' :
                                            dailyQuestion.difficulty === 'Medium' ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20' :
                                            'bg-red-500/10 text-red-600 hover:bg-red-500/20'
                                        } border-0 px-3 py-1`}>
                                            {dailyQuestion.difficulty}
                                        </Badge>
                                        <span className="text-muted-foreground text-sm flex items-center gap-1">
                                            <Timer className="w-3 h-3" /> {timeLeft} remaining
                                        </span>
                                    </div>
                                    <CardTitle className="text-2xl mb-2">{dailyQuestion.title}</CardTitle>
                                    <CardDescription className="text-base line-clamp-2">
                                        Master this problem to improve your {dailyQuestion.tags[0]} skills. 
                                        Practicing this helps with problem identification and algorithmic thinking.
                                    </CardDescription>
                                </div>
                                <Button 
                                    size="lg" 
                                    className="hidden md:flex gap-2 bg-primary hover:bg-primary/90 shadow-lg shadow-primary/20"
                                    onClick={() => navigate("/daily-challenge/solve")}
                                >
                                    Solve Challenge <ArrowRight className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <div className="flex flex-wrap gap-2 mb-6">
                                {dailyQuestion.tags.map(tag => (
                                    <Badge key={tag} variant="secondary" className="px-3 py-1 bg-secondary/50">
                                        {tag}
                                    </Badge>
                                ))}
                            </div>
                            
                            <div className="bg-muted/30 rounded-xl p-4 border border-border/50">
                                <h4 className="font-semibold mb-3 flex items-center gap-2 text-sm uppercase tracking-wide text-muted-foreground">
                                    <Users className="w-4 h-4" /> Companies asking this
                                </h4>
                                <div className="flex flex-wrap gap-2">
                                    {dailyQuestion.companies.map(company => (
                                        <div key={company} className="flex items-center gap-2 px-3 py-1.5 bg-background rounded-lg border border-border shadow-sm text-sm font-medium">
                                            {company}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <Button 
                                className="w-full md:hidden mt-6 gap-2" 
                                size="lg"
                                onClick={() => navigate("/daily-challenge/solve")}
                            >
                                Solve Challenge <ArrowRight className="w-4 h-4" />
                            </Button>
                        </CardContent>
                    </Card>

                    {/* Previous Days Questions */}
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="text-lg font-semibold flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-muted-foreground" />
                                Previous Days
                            </h3>
                            <Button variant="ghost" size="sm" className="text-sm">View Archive</Button>
                        </div>
                        
                        <div className="grid gap-3">
                            {previousQuestions.map((q) => (
                                <div 
                                    key={q.id} 
                                    className="group flex items-center justify-between p-4 bg-card border border-border/50 rounded-xl hover:border-primary/30 hover:bg-muted/30 transition-all cursor-pointer"
                                    onClick={() => {/* Navigate to past question if supported, or solve */ navigate("/daily-challenge/solve")}}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="flex flex-col items-center justify-center w-12 h-12 bg-muted rounded-lg border border-border/50">
                                            <span className="text-xs font-bold uppercase text-muted-foreground">{format(q.date, 'MMM')}</span>
                                            <span className="text-lg font-bold text-foreground">{format(q.date, 'd')}</span>
                                        </div>
                                        <div>
                                            <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">{q.title}</h4>
                                            <div className="flex items-center gap-2 mt-1">
                                                <Badge variant="outline" className={`text-[10px] h-5 ${
                                                    q.difficulty === 'Easy' ? 'border-emerald-500/30 text-emerald-500' :
                                                    q.difficulty === 'Medium' ? 'border-amber-500/30 text-amber-500' :
                                                    'border-red-500/30 text-red-500'
                                                }`}>
                                                    {q.difficulty}
                                                </Badge>
                                                <span className="text-xs text-muted-foreground">• {q.tags[0]}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                                        <ArrowRight className="w-4 h-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Stats & Leaderboard */}
                <div className="lg:col-span-4 space-y-6">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-4">
                        <Card className="bg-primary/5 border-primary/10">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Star className="w-6 h-6 text-primary mb-2" />
                                <div className="text-2xl font-bold">Top 5%</div>
                                <div className="text-xs text-muted-foreground">Your Rank</div>
                            </CardContent>
                        </Card>
                        <Card className="bg-purple-500/5 border-purple-500/10">
                            <CardContent className="p-4 flex flex-col items-center justify-center text-center">
                                <Trophy className="w-6 h-6 text-purple-500 mb-2" />
                                <div className="text-2xl font-bold">12</div>
                                <div className="text-xs text-muted-foreground">Solved Total</div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Daily Leaderboard */}
                    <Card>
                        <CardHeader className="pb-3">
                            <CardTitle className="flex items-center gap-2 text-base">
                                <Trophy className="w-4 h-4 text-yellow-500" />
                                Daily Leaderboard
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-0">
                            <div className="divide-y divide-border/50">
                                {leaderboard.map((user, i) => (
                                    <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/50 transition-colors">
                                        <div className="flex items-center gap-3">
                                            <div className={`w-6 text-center font-bold ${
                                                i === 0 ? 'text-yellow-500' : 
                                                i === 1 ? 'text-gray-400' : 
                                                i === 2 ? 'text-amber-600' : 'text-muted-foreground'
                                            }`}>
                                                #{i + 1}
                                            </div>
                                            <Avatar className="w-8 h-8 border border-border">
                                                <AvatarFallback className="text-xs">{user.avatar}</AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="text-sm font-medium leading-none">{user.name}</p>
                                                <p className="text-xs text-muted-foreground mt-1">{user.time}</p>
                                            </div>
                                        </div>
                                        <div className="font-bold text-sm text-primary">
                                            {user.score}/100
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="p-4 border-t border-border/50">
                                <Button variant="outline" className="w-full text-xs h-8">View Full Leaderboard</Button>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Motivation */}
                    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
                        <CardContent className="p-4 flex gap-3">
                            <Sparkles className="w-10 h-10 text-indigo-500 shrink-0" />
                            <div>
                                <h4 className="font-semibold text-sm mb-1 text-indigo-600 dark:text-indigo-400">Did you know?</h4>
                                <p className="text-xs text-muted-foreground">
                                    Solving one problem a day increases your interview success rate by 40% over 3 months.
                                </p>
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </main>
    </div>
  );
};

export default DailyChallengeLanding;
