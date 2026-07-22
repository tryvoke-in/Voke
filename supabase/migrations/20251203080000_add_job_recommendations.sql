-- Create job_postings table
CREATE TABLE IF NOT EXISTS job_postings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  salary_range TEXT,
  location TEXT,
  remote_ok BOOLEAN DEFAULT false,
  experience_level TEXT CHECK (experience_level IN ('entry', 'mid', 'senior', 'lead', 'executive')),
  skills_required JSONB DEFAULT '[]'::jsonb,
  posted_date TIMESTAMPTZ DEFAULT now(),
  application_url TEXT,
  source TEXT DEFAULT 'ai-generated' CHECK (source IN ('ai-generated', 'indeed', 'linkedin', 'manual')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Create job_recommendations table
CREATE TABLE IF NOT EXISTS job_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_posting_id UUID NOT NULL REFERENCES job_postings(id) ON DELETE CASCADE,
  match_score INTEGER NOT NULL CHECK (match_score >= 0 AND match_score <= 100),
  match_reasons JSONB DEFAULT '[]'::jsonb,
  skill_gaps JSONB DEFAULT '[]'::jsonb,
  interview_session_ids JSONB DEFAULT '[]'::jsonb,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'viewed', 'applied', 'rejected', 'saved')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, job_posting_id)
);

-- Create user_career_plans table
CREATE TABLE IF NOT EXISTS user_career_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_role TEXT NOT NULL,
  current_skill_level TEXT,
  month_1_goals JSONB DEFAULT '{}'::jsonb,
  month_2_goals JSONB DEFAULT '{}'::jsonb,
  month_3_goals JSONB DEFAULT '{}'::jsonb,
  weekly_tasks JSONB DEFAULT '[]'::jsonb,
  resources JSONB DEFAULT '[]'::jsonb,
  milestones JSONB DEFAULT '[]'::jsonb,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  job_recommendation_id UUID REFERENCES job_recommendations(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_job_postings_experience_level ON job_postings(experience_level);
CREATE INDEX IF NOT EXISTS idx_job_postings_remote_ok ON job_postings(remote_ok);
CREATE INDEX IF NOT EXISTS idx_job_postings_source ON job_postings(source);
CREATE INDEX IF NOT EXISTS idx_job_postings_posted_date ON job_postings(posted_date DESC);

CREATE INDEX IF NOT EXISTS idx_job_recommendations_user_id ON job_recommendations(user_id);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_match_score ON job_recommendations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_status ON job_recommendations(status);
CREATE INDEX IF NOT EXISTS idx_job_recommendations_created_at ON job_recommendations(created_at DESC);

CREATE INDEX IF NOT EXISTS idx_user_career_plans_user_id ON user_career_plans(user_id);
CREATE INDEX IF NOT EXISTS idx_user_career_plans_progress ON user_career_plans(progress_percentage);

-- Enable Row Level Security
ALTER TABLE job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_career_plans ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job_postings (public read, admin write)
DROP POLICY IF EXISTS "Anyone can view job postings" ON job_postings;
CREATE POLICY "Anyone can view job postings"
  ON job_postings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert job postings" ON job_postings;
CREATE POLICY "Authenticated users can insert job postings"
  ON job_postings FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS Policies for job_recommendations (users can only see their own)
DROP POLICY IF EXISTS "Users can view their own job recommendations" ON job_recommendations;
CREATE POLICY "Users can view their own job recommendations"
  ON job_recommendations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own job recommendations" ON job_recommendations;
CREATE POLICY "Users can insert their own job recommendations"
  ON job_recommendations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own job recommendations" ON job_recommendations;
CREATE POLICY "Users can update their own job recommendations"
  ON job_recommendations FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own job recommendations" ON job_recommendations;
CREATE POLICY "Users can delete their own job recommendations"
  ON job_recommendations FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS Policies for user_career_plans (users can only see their own)
DROP POLICY IF EXISTS "Users can view their own career plans" ON user_career_plans;
CREATE POLICY "Users can view their own career plans"
  ON user_career_plans FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own career plans" ON user_career_plans;
CREATE POLICY "Users can insert their own career plans"
  ON user_career_plans FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own career plans" ON user_career_plans;
CREATE POLICY "Users can update their own career plans"
  ON user_career_plans FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own career plans" ON user_career_plans;
CREATE POLICY "Users can delete their own career plans"
  ON user_career_plans FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_job_postings_updated_at ON job_postings;
CREATE TRIGGER update_job_postings_updated_at
  BEFORE UPDATE ON job_postings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_job_recommendations_updated_at ON job_recommendations;
CREATE TRIGGER update_job_recommendations_updated_at
  BEFORE UPDATE ON job_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_career_plans_updated_at ON user_career_plans;
CREATE TRIGGER update_user_career_plans_updated_at
  BEFORE UPDATE ON user_career_plans
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
