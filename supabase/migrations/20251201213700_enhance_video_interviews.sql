-- Add new columns to video_interview_sessions for enhanced feedback
ALTER TABLE public.video_interview_sessions
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS model_answer TEXT,
ADD COLUMN IF NOT EXISTS whats_good JSONB,
ADD COLUMN IF NOT EXISTS whats_wrong JSONB,
ADD COLUMN IF NOT EXISTS video_analysis_details JSONB;
