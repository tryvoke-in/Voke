-- Create peer interview sessions table
CREATE TABLE public.peer_interview_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  host_user_id UUID NOT NULL,
  guest_user_id UUID,
  scheduled_at TIMESTAMP WITH TIME ZONE NOT NULL,
  duration_minutes INTEGER NOT NULL DEFAULT 30,
  topic TEXT NOT NULL,
  difficulty_level TEXT NOT NULL CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled')),
  meeting_notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create peer interview ratings table
CREATE TABLE public.peer_interview_ratings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID NOT NULL REFERENCES public.peer_interview_sessions(id) ON DELETE CASCADE,
  rater_user_id UUID NOT NULL,
  rated_user_id UUID NOT NULL,
  communication_score INTEGER NOT NULL CHECK (communication_score >= 1 AND communication_score <= 5),
  technical_score INTEGER NOT NULL CHECK (technical_score >= 1 AND technical_score <= 5),
  problem_solving_score INTEGER NOT NULL CHECK (problem_solving_score >= 1 AND problem_solving_score <= 5),
  overall_score INTEGER NOT NULL CHECK (overall_score >= 1 AND overall_score <= 5),
  feedback_text TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.peer_interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.peer_interview_ratings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for peer_interview_sessions
CREATE POLICY "Users can view sessions they're part of"
ON public.peer_interview_sessions
FOR SELECT
USING (auth.uid() = host_user_id OR auth.uid() = guest_user_id);

CREATE POLICY "Users can view available sessions"
ON public.peer_interview_sessions
FOR SELECT
USING (status = 'scheduled' AND guest_user_id IS NULL);

CREATE POLICY "Users can create their own sessions"
ON public.peer_interview_sessions
FOR INSERT
WITH CHECK (auth.uid() = host_user_id);

CREATE POLICY "Users can update sessions they're part of"
ON public.peer_interview_sessions
FOR UPDATE
USING (auth.uid() = host_user_id OR auth.uid() = guest_user_id);

CREATE POLICY "Users can delete their own sessions"
ON public.peer_interview_sessions
FOR DELETE
USING (auth.uid() = host_user_id);

-- RLS Policies for peer_interview_ratings
CREATE POLICY "Users can view ratings for their sessions"
ON public.peer_interview_ratings
FOR SELECT
USING (
  auth.uid() = rater_user_id OR 
  auth.uid() = rated_user_id OR
  EXISTS (
    SELECT 1 FROM public.peer_interview_sessions 
    WHERE id = peer_interview_ratings.session_id 
    AND (host_user_id = auth.uid() OR guest_user_id = auth.uid())
  )
);

CREATE POLICY "Users can create ratings for sessions they participated in"
ON public.peer_interview_ratings
FOR INSERT
WITH CHECK (
  auth.uid() = rater_user_id AND
  EXISTS (
    SELECT 1 FROM public.peer_interview_sessions 
    WHERE id = session_id 
    AND status = 'completed'
    AND (host_user_id = auth.uid() OR guest_user_id = auth.uid())
  )
);

-- Create trigger for updated_at
CREATE TRIGGER update_peer_interview_sessions_updated_at
BEFORE UPDATE ON public.peer_interview_sessions
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- Create indexes
CREATE INDEX idx_peer_sessions_host ON public.peer_interview_sessions(host_user_id);
CREATE INDEX idx_peer_sessions_guest ON public.peer_interview_sessions(guest_user_id);
CREATE INDEX idx_peer_sessions_status ON public.peer_interview_sessions(status);
CREATE INDEX idx_peer_sessions_scheduled ON public.peer_interview_sessions(scheduled_at);
CREATE INDEX idx_peer_ratings_session ON public.peer_interview_ratings(session_id);