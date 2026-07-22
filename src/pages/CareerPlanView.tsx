import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    ArrowLeft, Calendar, CheckCircle2, Circle, Download, ExternalLink,
    Target, TrendingUp, BookOpen, Sparkles, Trophy, Zap, Clock, Shield, Star, Crown
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { motion, AnimatePresence } from "motion/react";

interface WeeklyTask {
    month: number;
    week: number;
    tasks: string[];
    completed: boolean;
}

interface Resource {
    title: string;
    type: string;
    url: string;
    cost: string;
    priority: string;
}

interface Milestone {
    month: number;
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
}

export default function CareerPlanView() {
    const { planId } = useParams();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [plan, setPlan] = useState<CareerPlan | null>(null);
    const [selectedMonth, setSelectedMonth] = useState(1);
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        loadCareerPlan();
        
        const handleScroll = () => {
           setScrolled(window.scrollY > 20);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, [planId]);

    const loadCareerPlan = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
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
            // Cast the Supabase response to the local CareerPlan type
            setPlan(data as unknown as CareerPlan);
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

    const toggleTaskCompletion = async (taskIndex: number) => {
        if (!plan) return;

        const updatedTasks = [...plan.weekly_tasks];
        updatedTasks[taskIndex].completed = !updatedTasks[taskIndex].completed;

        // Calculate new progress
        const completedTasks = updatedTasks.filter(t => t.completed).length;
        const totalTasks = updatedTasks.length;
        const newProgress = Math.round((completedTasks / totalTasks) * 100);

        try {
            const { error } = await supabase
                .from("user_career_plans")
                .update({
                    weekly_tasks: updatedTasks as unknown as [], // Cast to satisfy Json type compatibility
                    progress_percentage: newProgress,
                })
                .eq("id", plan.id);

            if (error) throw error;

            setPlan({
                ...plan,
                weekly_tasks: updatedTasks,
                progress_percentage: newProgress,
            });

            if (newProgress === 100) {
                toast({
                    title: "🎉 Congratulations!",
                    description: "You've completed your 3-month career plan!",
                });
            }
        } catch (error) {
            console.error("Error updating task:", error);
        }
    };

    const getMonthTasks = (month: number) => {
        return plan?.weekly_tasks.filter(t => t.month === month) || [];
    };

    const getMonthResources = (month: number) => {
        return plan?.resources.filter(r => {
            if (month === 1) return r.priority === "high";
            if (month === 2) return r.priority === "medium";
            return r.priority === "low";
        }) || [];
    };

    const getMonthMilestone = (month: number) => {
        return plan?.milestones.find(m => m.month === month);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="relative">
                     <div className="h-16 w-16 rounded-full border-4 border-violet-500/20 border-t-violet-500 animate-spin" />
                     <div className="absolute inset-0 flex items-center justify-center">
                        <Sparkles className="h-6 w-6 text-violet-500 animate-pulse" />
                     </div>
                  </div>
                  <p className="text-muted-foreground animate-pulse font-mono tracking-widest uppercase text-sm">Loading Neural Map...</p>
                </div>
            </div>
        );
    }

    if (!plan) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center">
                <Card className="p-8 text-center border-white/10 bg-card/30 backdrop-blur-xl">
                    <p className="text-muted-foreground mb-4">Career plan not found</p>
                    <Button onClick={() => navigate("/job-recommendations")}>
                        Back to Job Recommendations
                    </Button>
                </Card>
            </div>
        );
    }

    const monthGoals = [plan.month_1_goals, plan.month_2_goals, plan.month_3_goals];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-violet-500/30 overflow-hidden relative">
            
            {/* Ambient Backlights */}
            <div className="fixed inset-0 pointer-events-none z-0">
               <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] rounded-full bg-violet-600/10 blur-[120px]" />
               <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] rounded-full bg-blue-600/10 blur-[120px]" />
               <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-[0.03] dark:opacity-[0.05]" />
            </div>

            {/* Header */}
            <motion.header
                initial={{ y: -20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'bg-background/80 backdrop-blur-xl border-b border-white/5 shadow-lg shadow-violet-500/5' : 'bg-transparent'}`}
            >
                <div className="container mx-auto px-4 h-16 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button 
                           variant="ghost" 
                           size="icon" 
                           onClick={() => navigate("/job-recommendations")}
                           className="rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex flex-col">
                            <h1 className="text-lg font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-500 to-fuchsia-500 leading-tight">
                                Neural Career Path
                            </h1>
                            <span className="text-[10px] uppercase tracking-widest text-muted-foreground font-medium flex items-center gap-1">
                               <Target className="w-3 h-3" />
                               {plan.target_role}
                            </span>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="outline" size="sm" className="hidden sm:flex border-violet-500/20 hover:bg-violet-500/10 text-violet-500 rounded-full text-xs h-8">
                            <Download className="h-3 w-3 mr-2" />
                            Export PDF
                        </Button>
                        <div className="h-8 w-8 rounded-full bg-gradient-to-br from-violet-600 to-fuchsia-600 flex items-center justify-center shadow-lg shadow-violet-500/20 text-white font-bold text-xs ring-2 ring-white/10">
                           {plan.progress_percentage}%
                        </div>
                    </div>
                </div>
            </motion.header>

            {/* Main Content */}
            <main className="container mx-auto px-4 pt-24 pb-16 max-w-6xl relative z-10">
                
                {/* Hero / Progress Section */}
                <div className="grid lg:grid-cols-3 gap-6 mb-12">
                   <motion.div 
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="lg:col-span-2 relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-card/50 to-background/50 backdrop-blur-md p-8 shadow-2xl"
                   >
                      <div className="absolute top-0 right-0 w-64 h-64 bg-violet-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                      
                      <div className="relative z-10">
                         <div className="flex items-center justify-between mb-6">
                            <div>
                               <h2 className="text-2xl font-bold mb-1">Trajectory Status</h2>
                               <p className="text-muted-foreground text-sm">Review your personalized growth roadmap.</p>
                            </div>
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-500 bg-emerald-500/5 px-3 py-1 rounded-full uppercase text-[10px] tracking-widest">
                               <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse mr-2" />
                               Active
                            </Badge>
                         </div>

                         <div className="space-y-4">
                            <div className="flex justify-between text-sm font-medium mb-1">
                               <span>Overall Completion</span>
                               <span className="text-violet-500">{plan.progress_percentage}%</span>
                            </div>
                            <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                               <motion.div 
                                  initial={{ width: 0 }}
                                  animate={{ width: `${plan.progress_percentage}%` }}
                                  transition={{ duration: 1, ease: "easeOut" }}
                                  className="h-full bg-gradient-to-r from-violet-600 to-fuchsia-600" 
                               />
                            </div>
                            
                            <div className="grid grid-cols-3 gap-4 mt-6">
                               <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/20 border border-white/5">
                                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Level</span>
                                  <span className="font-bold flex items-center gap-1.5 capitalize">
                                     <Crown className="w-3.5 h-3.5 text-yellow-500" />
                                     {plan.current_skill_level}
                                  </span>
                               </div>
                               <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/20 border border-white/5">
                                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Tasks</span>
                                  <span className="font-bold flex items-center gap-1.5">
                                     <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                     {plan.weekly_tasks.filter(t => t.completed).length}/{plan.weekly_tasks.length}
                                  </span>
                               </div>
                               <div className="flex flex-col gap-1 p-3 rounded-2xl bg-secondary/20 border border-white/5">
                                  <span className="text-xs text-muted-foreground uppercase tracking-widest">Timeline</span>
                                  <span className="font-bold flex items-center gap-1.5">
                                     <Clock className="w-3.5 h-3.5 text-blue-500" />
                                     3 Months
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
                      className="lg:col-span-1 rounded-3xl border border-white/10 bg-card/30 backdrop-blur-md p-6 flex flex-col justify-center relative shadow-lg"
                   >
                       <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-violet-500 to-transparent opacity-50" />
                       <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                          <Zap className="w-4 h-4 text-yellow-500" />
                          Current Focus
                       </h3>
                       <div className="space-y-3">
                          {monthGoals[selectedMonth - 1]?.focus_areas?.slice(0, 3).map((area: string, idx: number) => (
                             <div key={idx} className="flex items-center gap-3 p-3 rounded-xl bg-secondary/40 border border-white/5">
                                <span className="flex-shrink-0 w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-500">
                                   {idx + 1}
                                </span>
                                <span className="text-sm font-medium">{area}</span>
                             </div>
                          ))}
                       </div>
                   </motion.div>
                </div>

                {/* Main Interaction Area */}
                <Tabs value={selectedMonth.toString()} onValueChange={(v) => setSelectedMonth(parseInt(v))}>
                    <div className="flex justify-center mb-8">
                       <TabsList className="h-auto p-1.5 bg-secondary/30 backdrop-blur-md border border-white/10 rounded-full">
                           {[1, 2, 3].map((month) => (
                               <TabsTrigger 
                                 key={month} 
                                 value={month.toString()} 
                                 className="rounded-full px-6 py-2.5 data-[state=active]:bg-violet-600 data-[state=active]:text-white transition-all duration-300"
                               >
                                   <span className="flex items-center gap-2">
                                       <Calendar className="h-3.5 w-3.5" />
                                       Month {month}
                                   </span>
                               </TabsTrigger>
                           ))}
                       </TabsList>
                    </div>

                    <AnimatePresence mode="wait">
                    {[1, 2, 3].map((month) => (
                        <TabsContent key={month} value={month.toString()} className="space-y-8 mt-0 focus-visible:outline-none">
                            <motion.div
                               initial={{ opacity: 0, y: 20 }}
                               animate={{ opacity: 1, y: 0 }}
                               exit={{ opacity: 0, y: -20 }}
                               transition={{ duration: 0.3 }}
                            >
                                <div className="grid lg:grid-cols-12 gap-8">
                                    {/* Left Content: Tasks */}
                                    <div className="lg:col-span-8 space-y-6">
                                       
                                       {/* Weekly Tasks Module */}
                                       <div className="space-y-6">
                                            {getMonthTasks(month).map((weekData, weekIdx) => (
                                                <div key={weekIdx} className="bg-card/20 backdrop-blur-sm border border-white/5 rounded-2xl p-6 hover:bg-card/30 transition-colors duration-300">
                                                    <h4 className="font-bold flex items-center gap-2.5 mb-4 text-violet-400">
                                                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center border border-violet-500/20">
                                                           <span className="text-sm">{weekData.week}</span>
                                                        </div>
                                                        Week {weekData.week}
                                                    </h4>
                                                    <div className="space-y-2.5">
                                                        {weekData.tasks.map((task, taskIdx) => {
                                                            const globalTaskIndex = plan.weekly_tasks.findIndex(
                                                                t => t.month === month && t.week === weekData.week
                                                            );
                                                            return (
                                                                <div 
                                                                   key={taskIdx} 
                                                                   className={`group flex items-start gap-3 p-3.5 rounded-xl transition-all duration-200 border border-transparent ${weekData.completed ? 'bg-emerald-500/5' : 'bg-secondary/40 hover:bg-secondary/60 hover:border-violet-500/20'}`}
                                                                >
                                                                    <Checkbox
                                                                        checked={weekData.completed}
                                                                        onCheckedChange={() => toggleTaskCompletion(globalTaskIndex)}
                                                                        className={`mt-1 transition-all duration-300 ${weekData.completed ? 'data-[state=checked]:bg-emerald-500 data-[state=checked]:border-emerald-500' : 'border-white/20'}`}
                                                                    />
                                                                    <span className={`text-sm leading-relaxed transition-all duration-300 ${weekData.completed ? 'line-through text-muted-foreground/60' : 'text-foreground group-hover:text-primary'}`}>
                                                                        {task}
                                                                    </span>
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Right Content: Stats & Milestone */}
                                    <div className="lg:col-span-4 space-y-6">
                                        {/* Milestone Card */}
                                        {getMonthMilestone(month) && (
                                            <div className="rounded-3xl p-6 border border-amber-500/20 bg-gradient-to-b from-amber-500/10 to-transparent relative overflow-hidden group">
                                               <div className="absolute top-0 right-0 p-16 bg-amber-500/10 blur-3xl rounded-full -mr-10 -mt-10" />
                                                
                                                <div className="flex items-center gap-3 mb-4 text-amber-500">
                                                    <Trophy className="h-5 w-5" />
                                                    <span className="font-bold tracking-widest text-xs uppercase">Milestone Objective</span>
                                                </div>
                                                
                                                <h4 className="font-bold text-lg mb-2 relative z-10">
                                                    {getMonthMilestone(month)?.title}
                                                </h4>
                                                <p className="text-sm text-muted-foreground mb-6 relative z-10 leading-relaxed">
                                                    {getMonthMilestone(month)?.description}
                                                </p>
                                                
                                                {getMonthMilestone(month)?.achieved ? (
                                                    <Badge className="bg-emerald-500 hover:bg-emerald-600 text-white border-0 px-4 py-1.5 h-auto text-xs font-semibold shadow-lg shadow-emerald-500/20">
                                                        <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
                                                        Goal Achieved
                                                    </Badge>
                                                ) : (
                                                   <div className="h-1.5 w-full bg-amber-500/20 rounded-full overflow-hidden">
                                                      <div className="h-full bg-amber-500 w-[60%] rounded-full opacity-50" />
                                                   </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Resources Card */}
                                        <div className="rounded-3xl border border-white/10 bg-card/30 backdrop-blur-md p-6">
                                            <h3 className="font-semibold text-lg mb-4 flex items-center gap-2">
                                                <BookOpen className="h-4 w-4 text-blue-500" />
                                                Recommended Resources
                                            </h3>
                                            <div className="space-y-3">
                                                {getMonthResources(month).map((resource, idx) => (
                                                    <a 
                                                       key={idx} 
                                                       href={resource.url} 
                                                       target="_blank" 
                                                       rel="noopener noreferrer"
                                                       className="flex items-center justify-between p-3 rounded-xl bg-secondary/30 hover:bg-secondary/50 border border-white/5 hover:border-violet-500/30 transition-all group"
                                                    >
                                                        <div className="flex flex-col gap-1 overflow-hidden">
                                                           <span className="font-medium text-sm truncate pr-2 group-hover:text-violet-400 transition-colors">{resource.title}</span>
                                                           <div className="flex gap-2">
                                                               <Badge variant="outline" className="text-[10px] h-5 px-1.5 border-white/10">{resource.type}</Badge>
                                                               <span className={`text-[10px] flex items-center ${resource.cost === 'free' ? 'text-emerald-500' : 'text-amber-500'}`}>
                                                                  {resource.cost}
                                                               </span>
                                                           </div>
                                                        </div>
                                                        <ExternalLink className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground shrink-0" />
                                                    </a>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </motion.div>
                        </TabsContent>
                    ))}
                    </AnimatePresence>
                </Tabs>
            </main>
        </div>
    );
}
