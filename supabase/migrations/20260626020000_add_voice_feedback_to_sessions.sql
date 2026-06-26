-- Add voice feedback columns to public.interview_sessions table
ALTER TABLE public.interview_sessions
ADD COLUMN IF NOT EXISTS delivery_score INTEGER CHECK (delivery_score >= 0 AND delivery_score <= 100),
ADD COLUMN IF NOT EXISTS confidence_score INTEGER CHECK (confidence_score >= 0 AND confidence_score <= 100),
ADD COLUMN IF NOT EXISTS feedback_summary TEXT,
ADD COLUMN IF NOT EXISTS whats_good JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS whats_wrong JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS analysis_result JSONB;

COMMENT ON COLUMN public.interview_sessions.delivery_score IS 'Communication score for the session';
COMMENT ON COLUMN public.interview_sessions.confidence_score IS 'Confidence or problem solving score for the session';
COMMENT ON COLUMN public.interview_sessions.feedback_summary IS 'Key feedback summary text';
COMMENT ON COLUMN public.interview_sessions.whats_good IS 'Strengths identified during evaluation';
COMMENT ON COLUMN public.interview_sessions.whats_wrong IS 'Areas for improvement identified during evaluation';
COMMENT ON COLUMN public.interview_sessions.analysis_result IS 'Full AI evaluation results JSON';
