-- Create tables for multi-question interview sessions

-- Parent interview session table
CREATE TABLE IF NOT EXISTS public.interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role TEXT NOT NULL DEFAULT 'General',
  time_limit_minutes INTEGER NOT NULL,
  total_duration_seconds INTEGER,
  status TEXT NOT NULL DEFAULT 'in_progress',
  overall_score INTEGER,
  body_language_summary TEXT,
  eye_contact_summary TEXT,
  confidence_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Individual answers within a session
CREATE TABLE IF NOT EXISTS public.interview_answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID REFERENCES public.interview_sessions(id) ON DELETE CASCADE NOT NULL,
  question_number INTEGER NOT NULL,
  question TEXT NOT NULL,
  video_url TEXT,
  transcript TEXT,
  duration_seconds INTEGER,
  model_answer TEXT,
  whats_good JSONB,
  whats_wrong JSONB,
  delivery_score INTEGER,
  body_language_score INTEGER,
  confidence_score INTEGER,
  analyzed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.interview_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;

-- RLS Policies for interview_sessions
CREATE POLICY "Users can view their own interview sessions"
  ON public.interview_sessions
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own interview sessions"
  ON public.interview_sessions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own interview sessions"
  ON public.interview_sessions
  FOR UPDATE
  USING (auth.uid() = user_id);

-- RLS Policies for interview_answers
CREATE POLICY "Users can view their own interview answers"
  ON public.interview_answers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE interview_sessions.id = interview_answers.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert their own interview answers"
  ON public.interview_answers
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE interview_sessions.id = interview_answers.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update their own interview answers"
  ON public.interview_answers
  FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.interview_sessions
      WHERE interview_sessions.id = interview_answers.session_id
      AND interview_sessions.user_id = auth.uid()
    )
  );

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_interview_sessions_user_id ON public.interview_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_interview_sessions_created_at ON public.interview_sessions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_interview_answers_session_id ON public.interview_answers(session_id);
CREATE INDEX IF NOT EXISTS idx_interview_answers_question_number ON public.interview_answers(session_id, question_number);
