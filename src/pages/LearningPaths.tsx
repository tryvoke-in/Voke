import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  LogOut, CheckCircle2, ChevronRight, BookOpen, 
  Code2, Layout, Server, Brain, PlayCircle, 
  FileText, Briefcase, Zap, Target, LineChart, 
  ArrowUpRight, Clock
} from "lucide-react";
import { UpgradeButton } from "@/components/UpgradeButton";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell
} from "recharts";

// --- Types ---

export interface Resource {
  id: string;
  title: string;
  type: 'video' | 'article' | 'practice';
  link: string;
  duration?: string;
}

export interface Module {
  id: string;
  title: string;
  description: string;
  status: 'completed' | 'in-progress' | 'locked';
  resumeImpact: string; // "Adds 'React' to your resume"
  resources: Resource[];
}

export interface Track {
  id: string;
  title: string;
  role: string;
  description: string;
  icon: any;
  modules: Module[];
}

// --- Mock Data ---

export const TRACKS: Track[] = [
  {
    id: "frontend",
    title: "Frontend Engineering",
    role: "Frontend Developer",
    description: "Master modern web development with React ecosystem.",
    icon: Layout,
    modules: [
      {
        id: "fe-1",
        title: "Modern HTML & CSS Architecture",
        description: "Semantic HTML5, CSS Grid/Flexbox, and BEM/Utility methodologies.",
        status: "completed",
        resumeImpact: "Responsive Design & Semantic HTML",
        resources: [
          { id: "r1", title: "Advanced CSS Layouts", type: "video", link: "https://www.youtube.com/watch?v=qm0IfG1GyZU", duration: "15m" },
          { id: "r2", title: "Semantic HTML Guide", type: "article", link: "https://developer.mozilla.org/en-US/docs/Glossary/Semantics", duration: "10m" },
          { id: "r3", title: "Build a Landing Page", type: "practice", link: "/playground", duration: "45m" }
        ]
      },
      {
        id: "fe-2",
        title: "JavaScript Fundamentals & ES6+",
        description: "Closures, extensive DOM manipulation, and Async/Await patterns.",
        status: "in-progress",
        resumeImpact: "JavaScript (ES6+)",
        resources: [
          { id: "r4", title: "The Event Loop", type: "video", link: "https://www.youtube.com/watch?v=8aGhZQkoFbQ", duration: "25m" },
          { id: "r5", title: "Async/Await Patterns", type: "article", link: "https://javascript.info/async-await", duration: "15m" },
          { id: "r6", title: "Fix the Memory Leak", type: "practice", link: "/playground", duration: "30m" }
        ]
      },
      {
        id: "fe-3",
        title: "React Component Patterns",
        description: "Higher Order Components, Custom Hooks, and Compound Components.",
        status: "locked",
        resumeImpact: "React.js & Hooks",
        resources: []
      },
      {
        id: "fe-4",
        title: "State Management at Scale",
        description: "Redux Toolkit, Context API, and Zustand.",
        status: "locked",
        resumeImpact: "Redux / State Management",
        resources: []
      }
    ]
  },
  {
    id: "backend",
    title: "Backend Architecture",
    role: "Backend Engineer",
    description: "Design scalable systems and secure APIs.",
    icon: Server,
    modules: [
      {
        id: "be-1",
        title: "Node.js Runtimes",
        description: "Event loop, streams, and buffer manipulation.",
        status: "completed",
        resumeImpact: "Node.js Core",
        resources: []
      },
      {
        id: "be-2",
        title: "API Design Standards",
        description: "RESTful principles, GraphQL, and gRPC basics.",
        status: "in-progress",
        resumeImpact: "REST & GraphQL APIs",
        resources: [
             { id: "be-r1", title: "Designing REST APIs", type: "article", link: "#", duration: "20m" },
             { id: "be-r2", title: "Build an API endpoint", type: "practice", link: "/playground", duration: "40m" }
        ]
      }
    ]
  },
  {
    id: "system",
    title: "System Design",
    role: "Software Architect",
    description: "Scalability, reliability, and distributed systems.",
    icon: Brain,
    modules: [
        {
            id: "sd-1",
            title: "Load Balancing & Caching",
            description: "Strategies for high availability.",
            status: "locked",
            resumeImpact: "Distributed Systems",
            resources: []
        }
    ]
  }
];

const ACTIVITY_DATA = [
  { day: "M", hours: 1.5 },
  { day: "T", hours: 2.2 },
  { day: "W", hours: 0.8 },
  { day: "T", hours: 3.5 },
  { day: "F", hours: 1.2 },
  { day: "S", hours: 4.0 },
  { day: "S", hours: 2.0 },
];

const LearningPaths = () => {
  const navigate = useNavigate();
  const [selectedTrack, setSelectedTrack] = useState(TRACKS[0]);
  const [completedResources, setCompletedResources] = useState<string[]>([]);
  const [weeklyGoals, setWeeklyGoals] = useState([
      { id: 'g1', text: "Complete 'Async/Await'", done: false },
      { id: 'g2', text: "Solve 2 Practice Questions", done: true },
      { id: 'g3', text: "Read System Design Intro", done: false },
  ]);
  const [expandedModule, setExpandedModule] = useState<string | null>(selectedTrack.modules.find(m => m.status === 'in-progress')?.id || null);

  useEffect(() => {
    // Load persisted data
    const savedRes = localStorage.getItem("voke_completed_resources");
    if (savedRes) setCompletedResources(JSON.parse(savedRes));
  }, []);

  const toggleResource = (id: string) => {
    const next = completedResources.includes(id) 
        ? completedResources.filter(x => x !== id)
        : [...completedResources, id];
    setCompletedResources(next);
    localStorage.setItem("voke_completed_resources", JSON.stringify(next));

    if (!completedResources.includes(id)) {
        toast.success("Progress Saved", { description: "Resource marked as complete." });
    }
  };

  const toggleGoal = (id: string) => {
      setWeeklyGoals(weeklyGoals.map(g => g.id === id ? { ...g, done: !g.done } : g));
  };

  const calculateProgress = (track: Track) => {
      // Simplified: items completed / total items
      // Real app would count resources
      const totalModules = track.modules.length;
      const completedModules = track.modules.filter(m => m.status === 'completed').length;
      return Math.round((completedModules / totalModules) * 100);
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col font-['Inter',sans-serif]">
      {/* Navbar */}
      <header className="h-14 border-b border-border bg-background/50 backdrop-blur-md sticky top-0 z-50 px-4 flex items-center justify-between">
            <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/dashboard')}>
                 <div className="bg-primary/10 p-1.5 rounded-md">
                    <Code2 className="w-5 h-5 text-primary" />
                 </div>
                 <span className="font-semibold text-sm">Voke Learning</span>
                 <span className="text-muted-foreground mx-2">/</span>
                 <span className="text-sm font-medium">{selectedTrack.role}</span>
            </div>
            <div className="flex items-center gap-4">
                <UpgradeButton />
                <Button variant="ghost" size="sm" onClick={() => navigate('/dashboard')}>
                    <LogOut className="w-4 h-4 mr-2" /> Exit
                </Button>
                <ThemeToggle />
            </div>
      </header>

      <div className="flex-1 max-w-[1600px] mx-auto w-full grid grid-cols-1 lg:grid-cols-[260px_1fr_320px] divide-x divide-border">
          
          {/* LEFT SIDEBAR: TRACK SELECTION */}
          <aside className="hidden lg:flex flex-col bg-muted/10">
              <div className="p-4">
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Career Tracks</h3>
                  <div className="space-y-1">
                      {TRACKS.map(track => (
                          <button
                            key={track.id}
                            onClick={() => setSelectedTrack(track)}
                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                            ${selectedTrack.id === track.id 
                                ? 'bg-primary/10 text-primary' 
                                : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}
                          >
                              <track.icon className="w-4 h-4" />
                              <span className="truncate">{track.title}</span>
                          </button>
                      ))}
                  </div>
              </div>
              
              <div className="mt-auto p-4 border-t border-border">
                  <div className="bg-gradient-to-br from-violet-500/10 to-fuchsia-500/10 border border-violet-500/20 rounded-xl p-4">
                      <div className="flex gap-2 mb-2">
                          <Zap className="w-4 h-4 text-violet-500" />
                          <span className="text-xs font-bold text-violet-600 dark:text-violet-400">Pro Feature</span>
                      </div>
                      <p className="text-xs text-muted-foreground leading-relaxed">
                          Upgrade to unlock AI-Mock Interviews specific to these tracks.
                      </p>
                      <Button size="sm" className="w-full mt-3 h-7 text-xs bg-violet-600 hover:bg-violet-700 text-white border-0">
                          Upgrade Plan
                      </Button>
                  </div>
              </div>
          </aside>

          {/* CENTER: TIMELINE / CONTENT */}
          <main className="bg-background relative">
              <ScrollArea className="h-[calc(100vh-3.5rem)]">
                  <div className="p-6 md:p-8 max-w-3xl mx-auto space-y-8">
                      {/* Hero */}
                      <div className="space-y-4">
                          <Badge variant="outline" className="w-fit text-primary border-primary/20 bg-primary/5">
                              {selectedTrack.role} Path
                          </Badge>
                          <div className="flex justify-between items-start gap-4">
                              <div>
                                  <h1 className="text-3xl font-bold tracking-tight mb-2">{selectedTrack.title}</h1>
                                  <p className="text-muted-foreground text-lg leading-relaxed">{selectedTrack.description}</p>
                              </div>
                              <div className="text-right shrink-0 hidden sm:block">
                                   <div className="text-2xl font-bold">{calculateProgress(selectedTrack)}%</div>
                                   <div className="text-xs text-muted-foreground">Complete</div>
                              </div>
                          </div>
                      </div>

                      <Separator />

                      {/* Modules list */}
                      <div className="space-y-6">
                            {selectedTrack.modules.map((module, index) => {
                                const isOpen = expandedModule === module.id;
                                const isLocked = module.status === 'locked';
                                const isCompleted = module.status === 'completed';

                                return (
                                    <div key={module.id} className="group relative pl-8">
                                        {/* Timeline Line */}
                                        <div className="absolute left-[11px] top-8 bottom-[-24px] w-px bg-border group-last:bottom-auto group-last:h-full" />
                                        
                                        {/* Status Dot */}
                                        <div className={`absolute left-0 top-1.5 w-6 h-6 rounded-full border-2 flex items-center justify-center z-10 bg-background transition-colors
                                            ${isCompleted ? 'border-primary text-primary' : 
                                              isLocked ? 'border-muted text-muted-foreground' : 'border-primary text-primary shadow-[0_0_0_4px_rgba(var(--primary),0.1)]'}`}>
                                            {isCompleted ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                                             !isLocked && <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />}
                                        </div>

                                        <div 
                                            className={`rounded-xl border transition-all duration-200 overflow-hidden
                                            ${isOpen ? 'bg-card ring-1 ring-primary/20 shadow-lg' : 'bg-card/40 hover:bg-card hover:shadow-sm border-border'}
                                            ${isLocked ? 'opacity-60 grayscale' : ''}`}
                                        >
                                            <div 
                                                className="p-5 cursor-pointer flex items-start gap-4"
                                                onClick={() => !isLocked && setExpandedModule(isOpen ? null : module.id)}
                                            >
                                                <div className="flex-1 space-y-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-base">{module.title}</h3>
                                                        {module.status === 'in-progress' && <Badge variant="secondary" className="px-1.5 py-0 text-[10px] h-5 rounded-md">In Progress</Badge>}
                                                    </div>
                                                    <p className="text-sm text-muted-foreground leading-relaxed">{module.description}</p>
                                                    
                                                    {!isOpen && (
                                                        <div className="flex items-center gap-3 mt-3 text-xs text-muted-foreground">
                                                            <div className="flex items-center gap-1.5">
                                                                <Briefcase className="w-3.5 h-3.5" />
                                                                <span>Adds: <span className="text-foreground font-medium">{module.resumeImpact}</span></span>
                                                            </div>
                                                            <span>•</span>
                                                            <span>{module.resources.length} Lessons</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <Button variant="ghost" size="icon" className="shrink-0 text-muted-foreground">
                                                    <ChevronRight className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-90' : ''}`} />
                                                </Button>
                                            </div>

                                            {/* Expanded Content */}
                                            <AnimatePresence>
                                                {isOpen && (
                                                    <motion.div
                                                        initial={{ height: 0 }}
                                                        animate={{ height: "auto" }}
                                                        exit={{ height: 0 }}
                                                        className="overflow-hidden"
                                                    >
                                                        <div className="px-5 pb-5 pt-0">
                                                            <Separator className="mb-4" />
                                                            
                                                            <div className="flex items-center gap-2 mb-4">
                                                                <Briefcase className="w-4 h-4 text-primary" />
                                                                <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Resume Impact</span>
                                                                <Badge variant="outline" className="ml-auto bg-green-500/5 text-green-600 border-green-200 dark:border-green-900 dark:text-green-400">
                                                                    + {module.resumeImpact}
                                                                </Badge>
                                                            </div>

                                                            <div className="space-y-2">
                                                                {module.resources.map(res => {
                                                                    const isDone = completedResources.includes(res.id);
                                                                    return (
                                                                        <div 
                                                                            key={res.id}
                                                                            onClick={() => toggleResource(res.id)}
                                                                            className={`group/res flex items-center gap-3 p-3 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors
                                                                            ${isDone ? 'bg-muted/30 border-transparent' : 'bg-background border-border'}`}
                                                                        >
                                                                            <div className={`w-5 h-5 rounded border flex items-center justify-center transition-colors ${isDone ? 'bg-primary border-primary text-primary-foreground' : 'border-muted-foreground/30 group-hover/res:border-primary'}`}>
                                                                                {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                                                                            </div>
                                                                            
                                                                            <div className="flex-1 min-w-0">
                                                                                <div className="flex items-center justify-between">
                                                                                    <span className={`text-sm font-medium ${isDone ? 'text-muted-foreground line-through decoration-border' : 'text-foreground'}`}>
                                                                                        {res.title}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                                                                    <div className="flex items-center gap-1">
                                                                                        {res.type === 'video' ? <PlayCircle className="w-3 h-3" /> :
                                                                                         res.type === 'practice' ? <Code2 className="w-3 h-3" /> :
                                                                                         <FileText className="w-3 h-3" />}
                                                                                        <span className="capitalize">{res.type}</span>
                                                                                    </div>
                                                                                    {res.duration && (
                                                                                        <div className="flex items-center gap-1">
                                                                                            <Clock className="w-3 h-3" />
                                                                                            <span>{res.duration}</span>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            </div>

                                                                            <Button 
                                                                                size="sm" 
                                                                                variant="ghost" 
                                                                                className="h-8 w-8 p-0 ml-auto opacity-0 group-hover/res:opacity-100"
                                                                                onClick={(e) => {
                                                                                    e.stopPropagation();
                                                                                    window.open(res.link, '_blank');
                                                                                }}
                                                                            >
                                                                                <ArrowUpRight className="w-4 h-4 text-muted-foreground" />
                                                                            </Button>
                                                                        </div>
                                                                    );
                                                                })}
                                                            </div>

                                                            <div className="mt-5 flex justify-end">
                                                                <Button size="sm" onClick={() => navigate('/playground')}>
                                                                    Open Playground
                                                                </Button>
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    </div>
                                );
                            })}
                      </div>
                  </div>
              </ScrollArea>
          </main>

          {/* RIGHT SIDEBAR: RETENTION & ANALYTICS */}
          <aside className="hidden xl:block bg-card border-l border-border p-6 space-y-8">
               
               {/* Weekly Goals Widget */}
               <div>
                   <div className="flex items-center justify-between mb-4">
                       <h3 className="font-semibold text-sm">Weekly Goals</h3>
                       <Badge variant="secondary" className="text-[10px] h-5 rounded-md">Week 42</Badge>
                   </div>
                   <Card className="shadow-sm border-border/60">
                       <CardContent className="p-0">
                           {weeklyGoals.map((goal, i) => (
                               <div key={goal.id} className={`flex items-start gap-3 p-3 transition-colors ${i !== weeklyGoals.length - 1 ? 'border-b border-border/50' : ''}`}>
                                   <Checkbox 
                                        id={goal.id} 
                                        checked={goal.done} 
                                        onCheckedChange={() => toggleGoal(goal.id)}
                                   />
                                   <label 
                                        htmlFor={goal.id}
                                        className={`text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer pt-0.5 ${goal.done ? 'text-muted-foreground line-through' : ''}`}
                                   >
                                       {goal.text}
                                   </label>
                               </div>
                           ))}
                       </CardContent>
                   </Card>
                   <p className="text-xs text-muted-foreground mt-2 text-center">
                       {weeklyGoals.filter(g => g.done).length}/{weeklyGoals.length} completed. Keep pushing!
                   </p>
               </div>

               {/* Activity Chart */}
               <div>
                   <h3 className="font-semibold text-sm mb-4">Learning Activity</h3>
                   <div className="h-40 w-full">
                       <ResponsiveContainer width="100%" height="100%">
                           <BarChart data={ACTIVITY_DATA}>
                               <XAxis 
                                    dataKey="day" 
                                    axisLine={false} 
                                    tickLine={false} 
                                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                                    dy={10}
                               />
                               <Tooltip 
                                    cursor={{ fill: 'hsl(var(--muted))' }}
                                    content={({ active, payload }) => {
                                        if (active && payload && payload.length) {
                                        return (
                                            <div className="rounded-lg border bg-background p-2 shadow-sm">
                                            <div className="flex flex-col gap-0.5">
                                                <span className="text-[0.70rem] uppercase text-muted-foreground">
                                                Study Time
                                                </span>
                                                <span className="font-bold text-muted-foreground">
                                                {payload[0].value} hrs
                                                </span>
                                            </div>
                                            </div>
                                        )
                                        }
                                        return null
                                    }}
                               />
                               <Bar 
                                    dataKey="hours" 
                                    fill="hsl(var(--primary))" 
                                    radius={[4, 4, 0, 0]} 
                                    barSize={20}
                               >
                                    {ACTIVITY_DATA.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.hours > 3 ? 'hsl(var(--primary))' : 'hsl(var(--primary) / 0.3)'} />
                                    ))}
                               </Bar>
                           </BarChart>
                       </ResponsiveContainer>
                   </div>
               </div>
               
               {/* Streak Widget */}
               <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 rounded-xl p-4 border border-orange-500/20 flex items-center justify-between">
                   <div>
                       <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">12 Days</div>
                       <div className="text-xs font-medium text-orange-600/80 dark:text-orange-400/80">Current Streak</div>
                   </div>
                   <div className="h-10 w-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                       <Target className="w-5 h-5 text-orange-600 dark:text-orange-400" />
                   </div>
               </div>

          </aside>
      </div>
    </div>
  );
};

export default LearningPaths;
