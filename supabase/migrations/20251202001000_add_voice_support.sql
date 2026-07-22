-- Add transcript and interview_mode to interview_sessions
ALTER TABLE public.interview_sessions 
ADD COLUMN IF NOT EXISTS transcript JSONB,
ADD COLUMN IF NOT EXISTS interview_mode TEXT DEFAULT 'text';
