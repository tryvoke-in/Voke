import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Star, Loader2, Users } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";

const RatePeerSession = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [session, setSession] = useState<any>(null);
  const [userId, setUserId] = useState<string>("");
  const [partnerId, setPartnerId] = useState<string>("");
  const [partnerName, setPartnerName] = useState<string>("");
  const [alreadyRated, setAlreadyRated] = useState(false);

  const [ratings, setRatings] = useState({
    communication_score: 3,
    technical_score: 3,
    problem_solving_score: 3,
    overall_score: 3,
    feedback_text: "",
  });

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }
    setUserId(user.id);
    await loadSession(user.id);
  };

  const loadSession = async (uid: string) => {
    try {
      const { data, error } = await supabase
        .from("peer_interview_sessions")
        .select("*")
        .eq("id", sessionId)
        .single();

      if (error) throw error;

      if (data.host_user_id !== uid && data.guest_user_id !== uid) {
        toast.error("You are not a participant of this session");
        navigate("/peer-interviews");
        return;
      }

      setSession(data);

      // Determine partner
      const isHost = data.host_user_id === uid;
      const pId = isHost ? data.guest_user_id : data.host_user_id;

      // Fetch partner profile
      const { data: partnerProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", pId)
        .single();

      const pName = partnerProfile?.full_name || (isHost ? "Guest" : "Host");

      setPartnerId(pId);
      setPartnerName(pName);

      // Check if already rated
      const { data: existingRating } = await supabase
        .from("peer_interview_ratings")
        .select("*")
        .eq("session_id", sessionId)
        .eq("rater_user_id", uid)
        .eq("rated_user_id", pId)
        .single();

      if (existingRating) {
        setAlreadyRated(true);
        toast.info("You have already rated this session");
      }
    } catch (error) {
      console.error("Error loading session:", error);
      toast.error("Failed to load session");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (alreadyRated) {
      navigate("/peer-interviews");
      return;
    }

    setSubmitting(true);

    try {
      const { error } = await supabase.from("peer_interview_ratings").insert({
        session_id: sessionId,
        rater_user_id: userId,
        rated_user_id: partnerId,
        communication_score: ratings.communication_score,
        technical_score: ratings.technical_score,
        problem_solving_score: ratings.problem_solving_score,
        overall_score: ratings.overall_score,
        feedback_text: ratings.feedback_text || null,
      });

      if (error) throw error;

      toast.success("Rating submitted successfully!");
      navigate("/peer-interviews");
    } catch (error) {
      console.error("Error submitting rating:", error);
      toast.error("Failed to submit rating");
    } finally {
      setSubmitting(false);
    }
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
            <Star className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Rate Your Partner</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/peer-interviews")}>
              Skip
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Card>
          <CardHeader>
            <CardTitle>Rate {partnerName}</CardTitle>
            <CardDescription>
              Help improve the community by providing honest feedback about your peer interview experience
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Communication Score */}
              <div className="space-y-3">
                <Label className="text-base">Communication Skills</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[ratings.communication_score]}
                    onValueChange={(value) =>
                      setRatings({ ...ratings, communication_score: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                    disabled={alreadyRated}
                  />
                  <div className="flex items-center gap-1 min-w-[60px]">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{ratings.communication_score}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  How well did they communicate their ideas?
                </p>
              </div>

              {/* Technical Score */}
              <div className="space-y-3">
                <Label className="text-base">Technical Knowledge</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[ratings.technical_score]}
                    onValueChange={(value) =>
                      setRatings({ ...ratings, technical_score: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                    disabled={alreadyRated}
                  />
                  <div className="flex items-center gap-1 min-w-[60px]">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{ratings.technical_score}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  How strong was their technical understanding?
                </p>
              </div>

              {/* Problem Solving Score */}
              <div className="space-y-3">
                <Label className="text-base">Problem Solving</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[ratings.problem_solving_score]}
                    onValueChange={(value) =>
                      setRatings({ ...ratings, problem_solving_score: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                    disabled={alreadyRated}
                  />
                  <div className="flex items-center gap-1 min-w-[60px]">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{ratings.problem_solving_score}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  How effectively did they approach problems?
                </p>
              </div>

              {/* Overall Score */}
              <div className="space-y-3">
                <Label className="text-base">Overall Performance</Label>
                <div className="flex items-center gap-4">
                  <Slider
                    value={[ratings.overall_score]}
                    onValueChange={(value) =>
                      setRatings({ ...ratings, overall_score: value[0] })
                    }
                    min={1}
                    max={5}
                    step={1}
                    className="flex-1"
                    disabled={alreadyRated}
                  />
                  <div className="flex items-center gap-1 min-w-[60px]">
                    <Star className="h-4 w-4 fill-primary text-primary" />
                    <span className="font-semibold">{ratings.overall_score}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground">
                  Your overall impression of their interview performance
                </p>
              </div>

              {/* Feedback */}
              <div className="space-y-3">
                <Label htmlFor="feedback">Additional Feedback (Optional)</Label>
                <Textarea
                  id="feedback"
                  value={ratings.feedback_text}
                  onChange={(e) =>
                    setRatings({ ...ratings, feedback_text: e.target.value })
                  }
                  placeholder="Share specific examples or suggestions for improvement..."
                  rows={4}
                  disabled={alreadyRated}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button type="submit" disabled={submitting || alreadyRated} className="flex-1">
                  {submitting ? "Submitting..." : alreadyRated ? "Already Rated" : "Submit Rating"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/peer-interviews")}
                >
                  {alreadyRated ? "Back" : "Skip"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default RatePeerSession;
