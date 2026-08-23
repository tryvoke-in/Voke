-- Fix RLS policies for cross-device college sync
-- Problem: upsert needs UPDATE policy, and college portals need anonymous SELECT

-- Allow anyone to read waitlist (needed for cross-device college/drive discovery)
DROP POLICY IF EXISTS "Admins can view waitlist" ON public.waitlist;
CREATE POLICY "Anyone can view waitlist"
  ON public.waitlist FOR SELECT
  USING (true);

-- Allow anyone to update waitlist rows (needed for upsert to work)
DROP POLICY IF EXISTS "Anyone can update waitlist" ON public.waitlist;
CREATE POLICY "Anyone can update waitlist"
  ON public.waitlist FOR UPDATE
  USING (true)
  WITH CHECK (true);

-- Allow anyone to delete from waitlist (cleanup)
DROP POLICY IF EXISTS "Anyone can delete from waitlist" ON public.waitlist;
CREATE POLICY "Anyone can delete from waitlist"
  ON public.waitlist FOR DELETE
  USING (true);
