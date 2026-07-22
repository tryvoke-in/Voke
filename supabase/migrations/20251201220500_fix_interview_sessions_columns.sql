-- Fix: Add missing columns to existing interview_sessions table
-- The previous migration skipped because the table already existed

ALTER TABLE public.interview_sessions
ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'General',
ADD COLUMN IF NOT EXISTS time_limit_minutes INTEGER,
ADD COLUMN IF NOT EXISTS total_duration_seconds INTEGER,
ADD COLUMN IF NOT EXISTS body_language_summary TEXT,
ADD COLUMN IF NOT EXISTS eye_contact_summary TEXT,
ADD COLUMN IF NOT EXISTS confidence_summary TEXT,
ADD COLUMN IF NOT EXISTS overall_score INTEGER,
ADD COLUMN IF NOT EXISTS completed_at TIMESTAMP WITH TIME ZONE;
