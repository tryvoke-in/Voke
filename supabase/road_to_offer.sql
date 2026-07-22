-- Add columns for Road to Offer feature
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS target_interview_date TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS dream_company TEXT;

-- Verify columns exist (optional, for safety)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'target_interview_date') THEN
        RAISE EXCEPTION 'Column target_interview_date was not created';
    END IF;
END $$;
