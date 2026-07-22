-- Alter user_feedback table to add columns for extended questions
ALTER TABLE public.user_feedback 
  ADD COLUMN IF NOT EXISTS modes_practiced TEXT[],
  ADD COLUMN IF NOT EXISTS technical_performance TEXT,
  ADD COLUMN IF NOT EXISTS difficulty_level TEXT,
  ADD COLUMN IF NOT EXISTS feedback_helpfulness TEXT,
  ADD COLUMN IF NOT EXISTS valuable_feedback_part TEXT,
  ADD COLUMN IF NOT EXISTS input_issues TEXT,
  ADD COLUMN IF NOT EXISTS recommended TEXT,
  ADD COLUMN IF NOT EXISTS bugs_faced TEXT;
