-- Create job market trends table
CREATE TABLE public.job_market_trends (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  trending_skills JSONB DEFAULT '[]'::jsonb,
  salary_range TEXT,
  demand_level TEXT NOT NULL, -- high, medium, low
  growth_rate TEXT,
  key_companies JSONB DEFAULT '[]'::jsonb,
  preparation_tips JSONB DEFAULT '[]'::jsonb,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create personalized recommendations table
CREATE TABLE public.user_career_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  recommended_roles JSONB DEFAULT '[]'::jsonb,
  skill_gaps JSONB DEFAULT '[]'::jsonb,
  learning_priorities JSONB DEFAULT '[]'::jsonb,
  preparation_roadmap TEXT,
  market_insights TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.job_market_trends ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_career_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS Policies for job market trends (public read access)
CREATE POLICY "Anyone can view job market trends"
  ON public.job_market_trends
  FOR SELECT
  USING (true);

-- RLS Policies for user recommendations (user-specific)
CREATE POLICY "Users can view own recommendations"
  ON public.user_career_recommendations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own recommendations"
  ON public.user_career_recommendations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own recommendations"
  ON public.user_career_recommendations
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Create index for faster queries
CREATE INDEX idx_trends_category ON public.job_market_trends(category);
CREATE INDEX idx_trends_updated ON public.job_market_trends(last_updated DESC);
CREATE INDEX idx_user_recommendations_user ON public.user_career_recommendations(user_id);

-- Create trigger to update updated_at timestamp
CREATE TRIGGER update_user_recommendations_updated_at
  BEFORE UPDATE ON public.user_career_recommendations
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();