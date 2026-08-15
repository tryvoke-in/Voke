-- Migration: 20260815000000_job_locations_system.sql
-- Description: Create monitored_locations table and add location to profiles

-- 1. Create monitored_locations table
CREATE TABLE IF NOT EXISTS public.monitored_locations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    location_name TEXT UNIQUE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Add location column to profiles table
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS location TEXT;

-- 3. Enable RLS on monitored_locations
ALTER TABLE public.monitored_locations ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for monitored_locations
-- Everyone can read monitored locations
CREATE POLICY "Anyone can view monitored_locations" 
    ON public.monitored_locations FOR SELECT 
    USING (true);

-- Only admins can insert/update/delete monitored locations
CREATE POLICY "Admins can insert monitored_locations" 
    ON public.monitored_locations FOR INSERT 
    WITH CHECK (
        (auth.jwt() ->> 'email') IN (
            'sharma.priyanshu3434@gmail.com',
            'nikhilbhor201@gmail.com'
        )
    );

CREATE POLICY "Admins can update monitored_locations" 
    ON public.monitored_locations FOR UPDATE 
    USING (
        (auth.jwt() ->> 'email') IN (
            'sharma.priyanshu3434@gmail.com',
            'nikhilbhor201@gmail.com'
        )
    );

CREATE POLICY "Admins can delete monitored_locations" 
    ON public.monitored_locations FOR DELETE 
    USING (
        (auth.jwt() ->> 'email') IN (
            'sharma.priyanshu3434@gmail.com',
            'nikhilbhor201@gmail.com'
        )
    );

-- Seed an initial location if empty
INSERT INTO public.monitored_locations (location_name, is_active)
VALUES ('India', true)
ON CONFLICT (location_name) DO NOTHING;
