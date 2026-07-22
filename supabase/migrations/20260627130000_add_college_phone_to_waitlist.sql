-- Add college_name and phone_number columns to waitlist table
ALTER TABLE public.waitlist 
ADD COLUMN IF NOT EXISTS college_name TEXT,
ADD COLUMN IF NOT EXISTS phone_number TEXT;
