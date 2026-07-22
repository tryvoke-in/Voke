-- Create storage bucket for video interviews
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('video-interviews', 'video-interviews', false, 524288000, ARRAY['video/webm', 'video/mp4', 'video/quicktime'])
ON CONFLICT (id) DO NOTHING;

-- Storage policies for video interviews
CREATE POLICY "Users can upload own video interviews"
  ON storage.objects FOR INSERT
  WITH CHECK (
    bucket_id = 'video-interviews' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own video interviews"
  ON storage.objects FOR SELECT
  USING (
    bucket_id = 'video-interviews' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can delete own video interviews"
  ON storage.objects FOR DELETE
  USING (
    bucket_id = 'video-interviews' AND
    auth.uid()::text = (storage.foldername(name))[1]
  );

-- Create video_interview_sessions table
CREATE TABLE IF NOT EXISTS public.video_interview_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  question TEXT NOT NULL,
  video_url TEXT,
  duration_seconds INTEGER,
  analysis_result JSONB,
  feedback_summary TEXT,
  delivery_score INTEGER CHECK (delivery_score >= 0 AND delivery_score <= 100),
  body_language_score INTEGER CHECK (body_language_score >= 0 AND body_language_score <= 100),
  confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
  overall_score INTEGER CHECK (overall_score >= 0 AND overall_score <= 100),
  status TEXT DEFAULT 'recording',
  created_at TIMESTAMPTZ DEFAULT now(),
  analyzed_at TIMESTAMPTZ
);

-- Enable RLS
ALTER TABLE public.video_interview_sessions ENABLE ROW LEVEL SECURITY;

-- RLS policies for video_interview_sessions
CREATE POLICY "Users can view own video sessions"
  ON public.video_interview_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own video sessions"
  ON public.video_interview_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own video sessions"
  ON public.video_interview_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own video sessions"
  ON public.video_interview_sessions FOR DELETE
  USING (auth.uid() = user_id);