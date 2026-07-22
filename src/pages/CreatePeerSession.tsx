import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarIcon, Users, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useInterviewCredits } from "@/hooks/useInterviewCredits";
import { InterviewGate } from "@/components/InterviewGate";

const CreatePeerSession = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    topic: "",
    difficulty_level: "intermediate",
    duration_minutes: "30",
    scheduled_at: "",
    meeting_notes: "",
  });

  const { credits, hasGivenFeedback, isPremium, canTakeInterview, loading: creditsLoading, consumeCredit, refreshCredits, grantFeedbackCredits } = useInterviewCredits('elite');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const scheduledDate = new Date(formData.scheduled_at);
      if (scheduledDate <= new Date()) {
        toast.error("Please select a future date and time");
        setLoading(false);
        return;
      }

      const { error } = await supabase
        .from("peer_interview_sessions")
        .insert({
          host_user_id: user.id,
          topic: formData.topic,
          difficulty_level: formData.difficulty_level,
          duration_minutes: parseInt(formData.duration_minutes),
          scheduled_at: scheduledDate.toISOString(),
          meeting_notes: formData.meeting_notes || null,
          status: "scheduled",
        });

      if (error) throw error;
 
      toast.success("Session created successfully!");
      navigate("/peer-interviews");

      // Consume credit after initiating navigation to prevent showing the lock screen prematurely
      await consumeCredit();
    } catch (error) {
      console.error("Error creating session:", error);
      toast.error("Failed to create session");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Users className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">Create Peer Session</h1>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button variant="outline" onClick={() => navigate("/peer-interviews")}>
              Back
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {creditsLoading ? (
          <div className="flex items-center justify-center min-h-[200px]">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !canTakeInterview && !loading ? (
          <InterviewGate
            credits={credits}
            hasGivenFeedback={hasGivenFeedback}
            isPremium={isPremium}
            onFeedbackSuccess={refreshCredits}
            grantFeedbackCredits={grantFeedbackCredits}
          />
        ) : (
          <Card>
          <CardHeader>
            <CardTitle>New Mock Interview Session</CardTitle>
            <CardDescription>
              Create a session and wait for another user to join, or join an existing session
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="topic">Interview Topic *</Label>
                <Input
                  id="topic"
                  value={formData.topic}
                  onChange={(e) => setFormData({ ...formData, topic: e.target.value })}
                  placeholder="e.g., React Frontend Developer, System Design"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="difficulty_level">Difficulty Level *</Label>
                <Select
                  value={formData.difficulty_level}
                  onValueChange={(value) => setFormData({ ...formData, difficulty_level: value })}
                >
                  <SelectTrigger id="difficulty_level">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="duration_minutes">Duration (minutes) *</Label>
                <Select
                  value={formData.duration_minutes}
                  onValueChange={(value) => setFormData({ ...formData, duration_minutes: value })}
                >
                  <SelectTrigger id="duration_minutes">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="45">45 minutes</SelectItem>
                    <SelectItem value="60">60 minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="scheduled_at">Schedule Date & Time *</Label>
                <div className="relative">
                  <CalendarIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="scheduled_at"
                    type="datetime-local"
                    value={formData.scheduled_at}
                    onChange={(e) => setFormData({ ...formData, scheduled_at: e.target.value })}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="meeting_notes">Additional Notes (Optional)</Label>
                <Textarea
                  id="meeting_notes"
                  value={formData.meeting_notes}
                  onChange={(e) => setFormData({ ...formData, meeting_notes: e.target.value })}
                  placeholder="Any specific topics or requirements you want to cover..."
                  rows={4}
                />
              </div>

              <div className="flex gap-3">
                <Button type="submit" disabled={loading} className="flex-1">
                  {loading ? "Creating..." : "Create Session"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/peer-interviews")}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default CreatePeerSession;
