-- Add 6Q columns to interview_sessions
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS six_q_score JSONB,
ADD COLUMN IF NOT EXISTS personality_cluster TEXT;

-- Add 6Q columns to video_interview_sessions
ALTER TABLE public.video_interview_sessions 
ADD COLUMN IF NOT EXISTS six_q_score JSONB,
ADD COLUMN IF NOT EXISTS personality_cluster TEXT;
