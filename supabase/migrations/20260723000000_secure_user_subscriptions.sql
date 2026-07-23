-- Enable RLS on the user_subscriptions table
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view only their own subscription records
CREATE POLICY "Users can view their own subscriptions" 
ON public.user_subscriptions
FOR SELECT 
USING (auth.uid() = user_id);

-- No INSERT or UPDATE policies are created for public/authenticated users.
-- This ensures that only Service Role (Admin) requests, such as from the 
-- verify-razorpay-payment edge function, can modify subscriptions.
