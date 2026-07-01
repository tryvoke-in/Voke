-- ============================================================
-- Referral Program: create referrals table
-- Each row = one referred user signup attributed to a referrer.
-- Credits are stored on Supabase auth user_metadata (same
-- pattern as the existing credits_elite / credits_voice / credits_video).
-- ============================================================

CREATE TABLE IF NOT EXISTS public.referrals (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id   UUID NOT NULL,        -- user who shared the link
  referred_id   UUID NOT NULL,        -- new user who signed up via link
  status        TEXT NOT NULL DEFAULT 'pending',  -- 'pending' | 'credited'
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  credited_at   TIMESTAMPTZ
);

-- Prevent the same pair being inserted twice
CREATE UNIQUE INDEX IF NOT EXISTS referrals_pair_unique
  ON public.referrals (referrer_id, referred_id);

-- Row Level Security
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;

-- A user can see referrals where they are the referrer
CREATE POLICY "referrer_select" ON public.referrals
  FOR SELECT USING (auth.uid() = referrer_id);

-- A user can insert a referral row where they are the referred user
-- (called client-side right after signup)
CREATE POLICY "referred_insert" ON public.referrals
  FOR INSERT WITH CHECK (auth.uid() = referred_id);

-- A user can update their own referral row (for status change)
CREATE POLICY "referred_update" ON public.referrals
  FOR UPDATE USING (auth.uid() = referred_id);
