-- Create Elite Prep Progress Table
CREATE TABLE IF NOT EXISTS public.elite_prep_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  type_id TEXT NOT NULL,
  company_id TEXT NOT NULL,
  role_id TEXT NOT NULL,
  progress_data JSONB NOT NULL DEFAULT '{}'::jsonb,
  selected_github_repo TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_user_role_progress UNIQUE (user_id, type_id, company_id, role_id)
);

-- Enable RLS
ALTER TABLE public.elite_prep_progress ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Users can view their own progress" ON public.elite_prep_progress;
CREATE POLICY "Users can view their own progress"
  ON public.elite_prep_progress FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own progress" ON public.elite_prep_progress;
CREATE POLICY "Users can insert their own progress"
  ON public.elite_prep_progress FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own progress" ON public.elite_prep_progress;
CREATE POLICY "Users can update their own progress"
  ON public.elite_prep_progress FOR UPDATE
  USING (auth.uid() = user_id);

-- Fallback trigger for updated_at if missing
CREATE OR REPLACE FUNCTION set_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_updated_at_elite_prep_progress ON public.elite_prep_progress;
CREATE TRIGGER set_updated_at_elite_prep_progress
BEFORE UPDATE ON public.elite_prep_progress
FOR EACH ROW
EXECUTE FUNCTION set_updated_at_column();
