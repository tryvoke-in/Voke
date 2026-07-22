-- Create user activities table
CREATE TABLE IF NOT EXISTS public.user_activities (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_email TEXT,
  session_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  page_path TEXT NOT NULL,
  action_details JSONB,
  user_agent TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_activities ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Anyone can insert activities" ON public.user_activities;
CREATE POLICY "Anyone can insert activities"
  ON public.user_activities FOR INSERT
  WITH CHECK (
    (user_id IS NULL) OR (auth.uid() = user_id)
  );

DROP POLICY IF EXISTS "Admins can view activities" ON public.user_activities;
CREATE POLICY "Admins can view activities"
  ON public.user_activities FOR SELECT
  USING (
    (auth.jwt() ->> 'email' IN ('sharma.priyanshu3434@gmail.com', 'nikhilbhor201@gmail.com')) OR
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
