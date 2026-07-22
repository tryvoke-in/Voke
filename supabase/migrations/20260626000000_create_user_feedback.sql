-- Create user feedback table
CREATE TABLE IF NOT EXISTS public.user_feedback (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating INTEGER NOT NULL,
  liked TEXT,
  improvements TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_feedback ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can insert their own feedback" ON public.user_feedback;
CREATE POLICY "Users can insert their own feedback"
  ON public.user_feedback FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can view feedback" ON public.user_feedback;
CREATE POLICY "Admins can view feedback"
  ON public.user_feedback FOR SELECT
  USING ( auth.jwt() ->> 'email' = 'sharma.priyanshu3434@gmail.com' );
