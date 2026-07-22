-- Create protected user_subscriptions table for server-granted entitlement tracking
CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  is_premium BOOLEAN NOT NULL DEFAULT FALSE,
  payment_id TEXT,
  order_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to SELECT (read) their own subscription status
DROP POLICY IF EXISTS "Users can view their own subscription" ON public.user_subscriptions;
CREATE POLICY "Users can view their own subscription"
  ON public.user_subscriptions FOR SELECT
  USING (auth.uid() = user_id);

-- DO NOT CREATE INSERT, UPDATE, OR DELETE POLICIES FOR AUTHENTICATED USERS.
-- This ensures ONLY the Supabase Service Role (used by our server Edge Function) can modify entitlement records!
