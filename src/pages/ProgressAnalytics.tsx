import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";
import { ArrowLeft, TrendingUp, Video, Award } from "lucide-react";
import { format } from "date-fns";

export default function ProgressAnalytics() {
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
        .eq("status", "completed")
        .order("created_at", { ascending: true });

      if (error) throw error;
      setSessions(data || []);
    } catch (error) {
      console.error("Error loading sessions:", error);
    } finally {
      setLoading(false);
    }
  };

  const chartData = sessions.map((session, index) => ({
    session: `Session ${index + 1}`,
    date: format(new Date(session.created_at), "MMM dd"),
    overall: session.overall_score || 0,
    delivery: session.delivery_score || 0,
    bodyLanguage: session.body_language_score || 0,
    confidence: session.confidence_score || 0,
  }));

  const averageScores = {
    overall: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.overall_score || 0), 0) / sessions.length) : 0,
    delivery: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.delivery_score || 0), 0) / sessions.length) : 0,
    bodyLanguage: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.body_language_score || 0), 0) / sessions.length) : 0,
    confidence: sessions.length > 0 ? Math.round(sessions.reduce((sum, s) => sum + (s.confidence_score || 0), 0) / sessions.length) : 0,
  };

  const improvement = sessions.length >= 2
    ? (sessions[sessions.length - 1].overall_score || 0) - (sessions[0].overall_score || 0)
    : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" onClick={() => navigate("/video-practice")}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <h1 className="text-2xl font-bold text-foreground">Progress Analytics</h1>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {sessions.length === 0 ? (
          <Card className="p-12 text-center">
            <Video className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <h2 className="text-2xl font-bold mb-2">No Data Yet</h2>
            <p className="text-muted-foreground mb-6">
              Complete video interviews to see your progress analytics
            </p>
            <Button onClick={() => navigate("/video-interview")}>
              Start First Interview
            </Button>
          </Card>
        ) : (
          <div className="space-y-8">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Video className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">Total Sessions</h3>
                </div>
                <p className="text-3xl font-bold">{sessions.length}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">Avg Overall</h3>
                </div>
                <p className="text-3xl font-bold">{averageScores.overall}</p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">Improvement</h3>
                </div>
                <p className={`text-3xl font-bold ${improvement >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {improvement > 0 ? '+' : ''}{improvement}
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-3 mb-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h3 className="font-semibold text-muted-foreground">Best Score</h3>
                </div>
                <p className="text-3xl font-bold">
                  {Math.max(...sessions.map(s => s.overall_score || 0))}
                </p>
              </Card>
            </div>

            {/* Overall Progress Chart */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Overall Score Trend</h2>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="overall" stroke="hsl(var(--primary))" strokeWidth={3} name="Overall Score" />
                </LineChart>
              </ResponsiveContainer>
            </Card>

            {/* Detailed Scores Chart */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Score Breakdown</h2>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="session" />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="delivery" fill="hsl(var(--chart-1))" name="Delivery" />
                  <Bar dataKey="bodyLanguage" fill="hsl(var(--chart-2))" name="Body Language" />
                  <Bar dataKey="confidence" fill="hsl(var(--chart-3))" name="Confidence" />
                </BarChart>
              </ResponsiveContainer>
            </Card>

            {/* Average Scores Comparison */}
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Average Scores</h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <h3 className="text-muted-foreground mb-2">Delivery</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div 
                        className="bg-chart-1 h-3 rounded-full transition-all"
                        style={{ width: `${averageScores.delivery}%` }}
                      />
                    </div>
                    <span className="font-bold text-lg">{averageScores.delivery}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-muted-foreground mb-2">Body Language</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div 
                        className="bg-chart-2 h-3 rounded-full transition-all"
                        style={{ width: `${averageScores.bodyLanguage}%` }}
                      />
                    </div>
                    <span className="font-bold text-lg">{averageScores.bodyLanguage}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-muted-foreground mb-2">Confidence</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex-1 bg-muted rounded-full h-3">
                      <div 
                        className="bg-chart-3 h-3 rounded-full transition-all"
                        style={{ width: `${averageScores.confidence}%` }}
                      />
                    </div>
                    <span className="font-bold text-lg">{averageScores.confidence}</span>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
}
