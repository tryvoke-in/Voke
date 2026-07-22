import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Brain, Target, Sparkles, Clock, ArrowRight, Mic, Video, Settings, PlayCircle, BookOpen, AlertCircle } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { ThemeToggle } from "@/components/ThemeToggle";
import { motion } from "motion/react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { InterviewGate } from "@/components/InterviewGate";
import { Loader2 } from "lucide-react";

// Mock Data for Recommendations
const RECOMMENDED_SESSIONS = [
  {
    id: "rec1",
    title: "React Hooks Deep Dive",
    type: "Technical",
    difficulty: "Intermediate",
    duration: "15 min",
    reason: "Based on your recent project activity",
    icon: Brain
  },
  {
    id: "rec2",
    title: "System Design: Scalability",
    type: "System Design",
    difficulty: "Advanced",
    duration: "30 min",
    reason: "Recommended for Senior Developer role",
    icon: Target
  },
  {
    id: "rec3",
    title: "Behavioral: Leadership",
    type: "Behavioral",
    difficulty: "Beginner",
    duration: "20 min",
    reason: "Essential for career growth",
    icon: Sparkles
  }
];

export default function AdaptiveInterview() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [starting, setStarting] = useState(false);
  const [config, setConfig] = useState({
    topic: "Frontend Development",
    difficulty: "Intermediate",
    duration: "15",
    mode: "voice"
  });

  const { credits, hasGivenFeedback, isPremium, canTakeInterview, loading: creditsLoading, refreshCredits, grantFeedbackCredits } = useInterviewCredits('elite');

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      // navigate("/auth"); // Commented out for demo purposes
    }
    setLoading(false);
  };

  const startSession = async (presetConfig?: any) => {
    setStarting(true);
    const sessionConfig = presetConfig || config;

    try {
      // In a real app, we would create a session in Supabase here
      // const { data, error } = await supabase.from('interview_sessions').insert({...}).select();
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // For now, we'll generate a random ID or use a mock ID
      const mockSessionId = "mock-session-" + Date.now();
      
      toast({
        title: "Session Created",
        description: "Entering interview environment...",
      });

      // Navigate to the active session page
      // We pass the config via state or URL params in a real app, 
      // but here we'll just navigate to the ID.
      navigate(`/interview/${mockSessionId}`, { state: { config: sessionConfig } });

    } catch (error) {
      console.error("Error starting session:", error);
      toast({
        title: "Error",
        description: "Failed to start interview session",
        variant: "destructive",
      });
      setStarting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate("/dashboard")}>
              <img 
                src="/images/voke_logo.png" 
                alt="Voke Logo" 
                className="w-10 h-10 object-contain"
              />
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Adaptive Interview</h1>
                <p className="text-xs text-muted-foreground">AI-Powered Practice</p>
              </div>
            </div>

            <div className="flex gap-2 items-center">
              <ThemeToggle />
              <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
                <ArrowRight className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 pt-32 pb-16 max-w-6xl flex-1 flex items-center justify-center">
        {creditsLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <Loader2 className="w-12 h-12 animate-spin text-violet-500" />
          </div>
        ) : !canTakeInterview ? (
          <InterviewGate
            credits={credits}
            hasGivenFeedback={hasGivenFeedback}
            isPremium={isPremium}
            onFeedbackSuccess={refreshCredits}
            grantFeedbackCredits={grantFeedbackCredits}
          />
        ) : (
          <div className="grid lg:grid-cols-12 gap-8 w-full">
          
          {/* Left Column: Hero & Quick Start */}
          <div className="lg:col-span-7 space-y-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <h2 className="text-4xl md:text-5xl font-bold tracking-tight">
                Master your next <br />
                <span className="bg-gradient-to-r from-violet-600 to-fuchsia-600 bg-clip-text text-transparent">Technical Interview</span>
              </h2>
              <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
                Practice with our AI interviewer that adapts to your responses in real-time. Get instant feedback on your technical accuracy, communication style, and problem-solving approach.
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Custom Session Setup
                  </CardTitle>
                  <CardDescription>Configure your interview parameters</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 relative z-10">
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Topic</Label>
                      <Select 
                        value={config.topic} 
                        onValueChange={(v) => setConfig({...config, topic: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select topic" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Frontend Development">Frontend Development</SelectItem>
                          <SelectItem value="Backend Architecture">Backend Architecture</SelectItem>
                          <SelectItem value="System Design">System Design</SelectItem>
                          <SelectItem value="Data Structures & Algo">DSA</SelectItem>
                          <SelectItem value="Behavioral">Behavioral</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Difficulty</Label>
                      <Select 
                        value={config.difficulty} 
                        onValueChange={(v) => setConfig({...config, difficulty: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select difficulty" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Beginner">Beginner</SelectItem>
                          <SelectItem value="Intermediate">Intermediate</SelectItem>
                          <SelectItem value="Advanced">Advanced</SelectItem>
                          <SelectItem value="Expert">Expert</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Duration</Label>
                      <Select 
                        value={config.duration} 
                        onValueChange={(v) => setConfig({...config, duration: v})}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15">15 Minutes</SelectItem>
                          <SelectItem value="30">30 Minutes</SelectItem>
                          <SelectItem value="45">45 Minutes</SelectItem>
                          <SelectItem value="60">60 Minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Interaction Mode</Label>
                      <div className="flex items-center justify-between p-3 rounded-lg border border-input bg-background">
                        <div className="flex items-center gap-2">
                          {config.mode === 'voice' ? <Mic className="h-4 w-4 text-primary" /> : <BookOpen className="h-4 w-4 text-primary" />}
                          <span className="text-sm font-medium capitalize">{config.mode} Mode</span>
                        </div>
                        <Switch 
                          checked={config.mode === 'voice'}
                          onCheckedChange={(c) => setConfig({...config, mode: c ? 'voice' : 'text'})}
                        />
                      </div>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 text-white shadow-lg shadow-violet-500/25 transition-all hover:scale-[1.02]"
                    onClick={() => startSession()}
                    disabled={starting}
                  >
                    {starting ? (
                      <>
                        <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                        Initializing Environment...
                      </>
                    ) : (
                      <>
                        <PlayCircle className="h-5 w-5 mr-2" />
                        Start Interview Session
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          </div>

          {/* Right Column: Recommendations & Tips */}
          <div className="lg:col-span-5 space-y-6">
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
            >
              <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-amber-500" />
                Recommended for You
              </h3>
              <div className="space-y-4">
                {RECOMMENDED_SESSIONS.map((session, idx) => (
                  <Card 
                    key={session.id}
                    className="group hover:border-primary/50 transition-all cursor-pointer hover:shadow-md bg-card/50 backdrop-blur-sm"
                    onClick={() => startSession({
                      topic: session.title,
                      difficulty: session.difficulty,
                      duration: session.duration.split(' ')[0],
                      mode: 'voice'
                    })}
                  >
                    <CardContent className="p-4 flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                        <session.icon className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-semibold group-hover:text-primary transition-colors">{session.title}</h4>
                          <Badge variant="secondary" className="text-xs">{session.difficulty}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{session.reason}</p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" /> {session.duration}
                          </span>
                          <span className="flex items-center gap-1">
                            <Video className="h-3 w-3" /> Voice Enabled
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
            >
              <Card className="bg-blue-500/5 border-blue-500/20">
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex items-center gap-2 text-blue-600 dark:text-blue-400">
                    <AlertCircle className="h-4 w-4" />
                    Pro Tips
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm text-muted-foreground space-y-2">
                  <p>• Speak clearly and at a moderate pace for the best AI transcription.</p>
                  <p>• Treat this like a real interview - structure your answers using the STAR method.</p>
                  <p>• You can ask the AI for hints if you get stuck on a technical problem.</p>
                </CardContent>
              </Card>
            </motion.div>
          </div>
          </div>
        )}
      </main>
    </div>
  );
}
