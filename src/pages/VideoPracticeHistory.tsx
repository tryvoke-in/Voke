import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LogOut, Video, Play, TrendingUp, Mic, Settings } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";

const VideoPracticeHistory = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [sessions, setSessions] = useState<any[]>([]);

  useEffect(() => {
    checkAuth();
    loadSessions();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const loadSessions = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("video_interview_sessions")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      completed: "default",
      analyzing: "secondary",
      recording: "secondary",
    };
    return <Badge variant={variants[status] || "secondary"}>{status}</Badge>;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10 shadow-soft">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/dashboard")}>
            <img 
              src="/images/voke_logo.png" 
              alt="Voke Logo" 
              className="w-8 h-8 object-contain" 
            />
            <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 via-purple-600 to-fuchsia-600 bg-clip-text text-transparent">Voke</h1>
          </div>
          <nav className="flex items-center gap-4">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              Dashboard
            </Button>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => navigate("/profile")}>
              <Settings className="w-5 h-5" />
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" />
              Logout
            </Button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">Video Practice History</h2>
            <p className="text-muted-foreground">Review your past video interview sessions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/progress-analytics")}>
              <TrendingUp className="w-4 h-4 mr-2" />
              View Analytics
            </Button>
            <Button onClick={() => navigate("/video-interview")}>
              <Video className="w-4 h-4 mr-2" />
              New Practice Session
            </Button>
          </div>
        </div>

        {sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-2xl font-semibold mb-2">No Sessions Yet</h3>
            <p className="text-muted-foreground mb-6">Start your first video interview practice!</p>
            <Button onClick={() => navigate("/video-interview")}>
              <Play className="w-4 h-4 mr-2" />
              Start First Session
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <Card key={session.id} className="hover:shadow-medium transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Video className="w-5 h-5 text-primary" />
                        <h3 className="font-semibold text-lg line-clamp-1">{session.question}</h3>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <span>{new Date(session.created_at).toLocaleDateString()}</span>
                        <span>•</span>
                        <span>{session.duration_seconds}s</span>
                        {session.overall_score && (
                          <>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <TrendingUp className="w-4 h-4" />
                              Score: {session.overall_score}/100
                            </span>
                          </>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {getStatusBadge(session.status)}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {session.status === "completed" && (
                        <Button
                          variant="outline"
                          onClick={() => navigate(`/video-interview/${session.id}/results`)}
                        >
                          View Results
                        </Button>
                      )}
                      {session.status === "analyzing" && (
                        <Button variant="secondary" disabled>
                          Analyzing...
                        </Button>
                      )}
                    </div>
                  </div>

                  {session.overall_score && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-2xl font-bold text-primary">{session.delivery_score}</div>
                          <div className="text-xs text-muted-foreground">Delivery</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-secondary">{session.body_language_score}</div>
                          <div className="text-xs text-muted-foreground">Body Language</div>
                        </div>
                        <div>
                          <div className="text-2xl font-bold text-accent">{session.confidence_score}</div>
                          <div className="text-xs text-muted-foreground">Confidence</div>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default VideoPracticeHistory;
