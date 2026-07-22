-- Add target_role column to profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'Full Stack Developer';

-- Verify column exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'target_role') THEN
        RAISE EXCEPTION 'Column target_role was not created';
    END IF;
END $$;
