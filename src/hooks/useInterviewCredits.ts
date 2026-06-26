import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

export type PrepType = 'elite' | 'voice' | 'video';

export interface InterviewCreditsState {
  credits: number;
  hasGivenFeedback: boolean;
  isPremium: boolean;
  loading: boolean;
  canTakeInterview: boolean;
  creditsElite: number;
  creditsVoice: number;
  creditsVideo: number;
}

export const useInterviewCredits = (type: PrepType = 'elite') => {
  const { toast } = useToast();
  const [state, setState] = useState<InterviewCreditsState>({
    credits: 1,
    hasGivenFeedback: false,
    isPremium: false,
    loading: true,
    canTakeInterview: true,
    creditsElite: 1,
    creditsVoice: 1,
    creditsVideo: 1,
  });

  const fetchCredits = async (passedSession?: any) => {
    try {
      let session = passedSession;
      if (!session) {
        const { data: { session: activeSession }, error } = await supabase.auth.getSession();
        if (error) throw error;
        session = activeSession;
      }
      const user = session?.user;
      if (!user) {
        setState((prev) => ({ ...prev, loading: false, canTakeInterview: false }));
        return;
      }

      const metadata = user.user_metadata || {};
      
      const isPremium = !!metadata.is_premium;
      const hasGivenFeedback = !!metadata.has_given_feedback;

      // Extract specific credits (or fallback to old general interview_credits / defaults)
      const creditsElite = metadata.credits_elite !== undefined 
        ? Number(metadata.credits_elite) 
        : (metadata.interview_credits !== undefined ? Number(metadata.interview_credits) : 1);
        
      const creditsVoice = metadata.credits_voice !== undefined 
        ? Number(metadata.credits_voice) 
        : 1;
        
      const creditsVideo = metadata.credits_video !== undefined 
        ? Number(metadata.credits_video) 
        : 1;

      // Determine credits for active type
      let currentCredits = 1;
      if (type === 'elite') {
        currentCredits = creditsElite;
      } else if (type === 'voice') {
        currentCredits = creditsVoice;
      } else if (type === 'video') {
        currentCredits = creditsVideo;
      }

      setState({
        credits: currentCredits,
        hasGivenFeedback,
        isPremium,
        loading: false,
        canTakeInterview: isPremium || currentCredits > 0,
        creditsElite,
        creditsVoice,
        creditsVideo,
      });
    } catch (err) {
      console.error("Error fetching interview credits:", err);
      setState((prev) => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchCredits();

    // Listen to auth state changes to dynamically update credits
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        await fetchCredits(session);
      } else {
        setState({
          credits: 0,
          hasGivenFeedback: false,
          isPremium: false,
          loading: false,
          canTakeInterview: false,
          creditsElite: 0,
          creditsVoice: 0,
          creditsVideo: 0,
        });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [type]); // Refetch if the type changes

  const consumeCredit = async () => {
    if (state.isPremium) return true;
    if (state.credits <= 0) {
      toast({
        title: "No credits remaining",
        description: `You have run out of free ${type} prep credits.`,
        variant: "destructive",
      });
      return false;
    }

    try {
      const newCredits = state.credits - 1;
      const updateData: any = {};

      if (type === 'elite') {
        updateData.credits_elite = newCredits;
        updateData.interview_credits = newCredits; // Sync with old field for safety
      } else if (type === 'voice') {
        updateData.credits_voice = newCredits;
      } else if (type === 'video') {
        updateData.credits_video = newCredits;
      }

      const { error } = await supabase.auth.updateUser({
        data: updateData
      });

      if (error) throw error;

      await supabase.auth.refreshSession();
      await fetchCredits();
      return true;
    } catch (err: any) {
      console.error("Error consuming credit:", err);
      toast({
        title: "Action Failed",
        description: "Could not update interview credits. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const grantFeedbackCredits = async () => {
    try {
      // Granting 2 credits to each type
      const newCreditsElite = state.creditsElite + 2;
      const newCreditsVoice = state.creditsVoice + 2;
      const newCreditsVideo = state.creditsVideo + 2;

      const { error } = await supabase.auth.updateUser({
        data: { 
          credits_elite: newCreditsElite,
          interview_credits: newCreditsElite,
          credits_voice: newCreditsVoice,
          credits_video: newCreditsVideo,
          has_given_feedback: true
        }
      });

      if (error) throw error;

      await supabase.auth.refreshSession();
      await fetchCredits();
      return true;
    } catch (err: any) {
      console.error("Error granting feedback credits:", err);
      toast({
        title: "Action Failed",
        description: "Could not grant bonus credits. Please contact support.",
        variant: "destructive",
      });
      return false;
    }
  };

  const resetCredits = async () => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          credits_elite: 1,
          credits_voice: 1,
          credits_video: 1,
          interview_credits: 1,
          has_given_feedback: false,
          is_premium: false
        }
      });

      if (error) throw error;

      await supabase.auth.refreshSession();
      await fetchCredits();
      toast({
        title: "Credits Reset",
        description: "Status reset: 1 credit for each type, feedback false, non-premium.",
      });
      return true;
    } catch (err: any) {
      console.error("Error resetting credits:", err);
      toast({
        title: "Reset Failed",
        description: err.message || "Could not reset credits.",
        variant: "destructive",
      });
      return false;
    }
  };

  const setCreditsForTesting = async (credits: number, hasFeedback: boolean, premium: boolean) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: {
          credits_elite: credits,
          credits_voice: credits,
          credits_video: credits,
          interview_credits: credits,
          has_given_feedback: hasFeedback,
          is_premium: premium
        }
      });

      if (error) throw error;

      await supabase.auth.refreshSession();
      await fetchCredits();
      toast({
        title: "Credits Updated",
        description: `Credits (all types): ${credits}, Feedback: ${hasFeedback}, Premium: ${premium}`,
      });
      return true;
    } catch (err: any) {
      console.error("Error setting testing credits:", err);
      toast({
        title: "Update Failed",
        description: err.message || "Could not update credits.",
        variant: "destructive",
      });
      return false;
    }
  };

  return {
    ...state,
    consumeCredit,
    grantFeedbackCredits,
    resetCredits,
    setCreditsForTesting,
    refreshCredits: fetchCredits,
  };
};
