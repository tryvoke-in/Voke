import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Brain, Trophy, Medal, Star, TrendingUp, Users, Award, Crown, LogOut, Settings, Loader2 } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

interface LeaderboardUser {
  user_id: string;
  full_name: string;
  average_rating: number;
  total_ratings: number;
  total_sessions: number;
}

const Leaderboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [topRated, setTopRated] = useState<LeaderboardUser[]>([]);
  const [mostActive, setMostActive] = useState<LeaderboardUser[]>([]);

  useEffect(() => {
    checkAuth();
    loadLeaderboard();
  }, []);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      navigate("/auth");
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to log out.");
      console.error("Logout error:", error);
    } else {
      navigate("/auth");
    }
  };

  const loadLeaderboard = async () => {
    try {
      // Get top-rated users
      const { data: ratingsData, error: ratingsError } = await supabase
        .from("peer_interview_ratings")
        .select(`
rated_user_id,
  overall_score
    `);

      if (ratingsError) throw ratingsError;

      // Aggregate ratings by user
      const userRatings = new Map<string, { scores: number[]; count: number }>();

      ratingsData?.forEach((rating) => {
        const userId = rating.rated_user_id;
        if (!userRatings.has(userId)) {
          userRatings.set(userId, { scores: [], count: 0 });
        }
        const userData = userRatings.get(userId)!;
        userData.scores.push(rating.overall_score);
        userData.count++;
      });

      // Get session counts
      const { data: sessionsData, error: sessionsError } = await supabase
        .from("peer_interview_sessions")
        .select("host_user_id, guest_user_id, status");

      if (sessionsError) throw sessionsError;

      const userSessions = new Map<string, number>();

      sessionsData?.forEach((session) => {
        if (session.status === "completed") {
          userSessions.set(
            session.host_user_id,
            (userSessions.get(session.host_user_id) || 0) + 1
          );
          if (session.guest_user_id) {
            userSessions.set(
              session.guest_user_id,
              (userSessions.get(session.guest_user_id) || 0) + 1
            );
          }
        }
      });

      // Get all unique user IDs
      const allUserIds = new Set([
        ...Array.from(userRatings.keys()),
        ...Array.from(userSessions.keys()),
      ]);

      // Fetch user profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", Array.from(allUserIds));

      if (profilesError) throw profilesError;

      const profileMap = new Map(
        profiles?.map((p) => [p.id, p.full_name || "Anonymous"]) || []
      );

      // Build leaderboard data
      const leaderboardData: LeaderboardUser[] = [];

      allUserIds.forEach((userId) => {
        const ratings = userRatings.get(userId);
        const sessions = userSessions.get(userId) || 0;
        const avgRating = ratings
          ? ratings.scores.reduce((a, b) => a + b, 0) / ratings.scores.length
          : 0;

        if (ratings || sessions > 0) {
          leaderboardData.push({
            user_id: userId,
            full_name: profileMap.get(userId) || "Anonymous",
            average_rating: avgRating,
            total_ratings: ratings?.count || 0,
            total_sessions: sessions,
          });
        }
      });

      // Sort by rating (descending) and filter users with at least 3 ratings
      const topRatedUsers = leaderboardData
        .filter((u) => u.total_ratings >= 3)
        .sort((a, b) => b.average_rating - a.average_rating)
        .slice(0, 10);

      // Sort by sessions (descending)
      const mostActiveUsers = leaderboardData
        .sort((a, b) => b.total_sessions - a.total_sessions)
        .slice(0, 10);

      setTopRated(topRatedUsers);
      setMostActive(mostActiveUsers);
    } catch (error) {
      console.error("Error loading leaderboard:", error);
      toast.error("Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (index === 1) return <Medal className="h-5 w-5 text-gray-400" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-muted-foreground font-bold">#{index + 1}</span>;
  };

  const getRankBadge = (index: number) => {
    if (index === 0) return "default";
    if (index === 1) return "secondary";
    if (index === 2) return "outline";
    return "outline";
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Trophy className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Leaderboard</h1>
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

      <div className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <h2 className="text-3xl font-bold mb-2">Top Performers</h2>
          <p className="text-muted-foreground">
            Recognize the best interviewers and most active community members
          </p>
        </div>

        <Tabs defaultValue="top-rated" className="space-y-6">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="top-rated" className="gap-2">
              <Star className="h-4 w-4" />
              Top Rated
            </TabsTrigger>
            <TabsTrigger value="most-active" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Most Active
            </TabsTrigger>
          </TabsList>

          <TabsContent value="top-rated" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-primary" />
                  Highest Rated Interviewers
                </CardTitle>
                <CardDescription>
                  Based on average ratings from peer interview sessions (minimum 3 ratings)
                </CardDescription>
              </CardHeader>
              <CardContent>
                {topRated.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No ratings yet. Complete peer interviews to appear on the leaderboard!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topRated.map((user, index) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10">
                            {getRankIcon(index)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {user.full_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {user.total_ratings} rating{user.total_ratings !== 1 ? "s" : ""} •{" "}
                              {user.total_sessions} session{user.total_sessions !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getRankBadge(index)} className="gap-1">
                            <Star className="h-3 w-3 fill-current" />
                            {user.average_rating.toFixed(1)}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="most-active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Most Active Community Members
                </CardTitle>
                <CardDescription>
                  Users with the most completed peer interview sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                {mostActive.length === 0 ? (
                  <div className="text-center py-12">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">
                      No completed sessions yet. Start practicing to appear on the leaderboard!
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mostActive.map((user, index) => (
                      <div
                        key={user.user_id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center gap-4">
                          <div className="flex items-center justify-center w-10">
                            {getRankIcon(index)}
                          </div>
                          <div>
                            <h4 className="font-semibold text-foreground">
                              {user.full_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {user.total_ratings > 0 && (
                                <>
                                  Avg rating: {user.average_rating.toFixed(1)} •{" "}
                                </>
                              )}
                              {user.total_ratings} rating{user.total_ratings !== 1 ? "s" : ""}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge variant={getRankBadge(index)} className="gap-1">
                            <Users className="h-3 w-3" />
                            {user.total_sessions} sessions
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <Card className="mt-6 bg-gradient-to-r from-primary/10 to-accent/10 border-primary/20">
          <CardContent className="py-6">
            <div className="flex items-center gap-4">
              <Trophy className="h-12 w-12 text-primary" />
              <div>
                <h3 className="font-semibold text-lg mb-1">Want to climb the ranks?</h3>
                <p className="text-muted-foreground">
                  Complete more peer interview sessions and provide valuable feedback to improve your rating!
                </p>
                <Button
                  className="mt-3"
                  onClick={() => navigate("/peer-interviews")}
                >
                  Join a Session
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Leaderboard;
