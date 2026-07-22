-- Add missing fields to video_interview_sessions for multi-question timed interviews
ALTER TABLE public.video_interview_sessions
ADD COLUMN IF NOT EXISTS role TEXT,
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS interview_type TEXT DEFAULT 'timed_video';

-- Update the question column to be nullable since multi-question interviews don't have a single question
ALTER TABLE public.video_interview_sessions
ALTER COLUMN question DROP NOT NULL;

COMMENT ON COLUMN public.video_interview_sessions.role IS 'The role/position being interviewed for (e.g., Software Engineer, Product Manager)';
COMMENT ON COLUMN public.video_interview_sessions.time_limit_minutes IS 'Total time limit for the interview in minutes';
COMMENT ON COLUMN public.video_interview_sessions.interview_type IS 'Type of video interview (e.g., timed_video, single_question)';
