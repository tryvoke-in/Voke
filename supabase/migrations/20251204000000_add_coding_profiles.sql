-- Add coding profile columns to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS codeforces_id TEXT,
ADD COLUMN IF NOT EXISTS leetcode_id TEXT,
ADD COLUMN IF NOT EXISTS coding_stats JSONB DEFAULT '{}'::jsonb;

-- We are NOT dropping linkedin_url immediately to prevent data loss, 
-- but it will be removed from the UI.
-- ALTER TABLE public.profiles DROP COLUMN IF EXISTS linkedin_url;
