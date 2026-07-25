-- Drop the permissive client insert policy on notifications table
DROP POLICY IF EXISTS "Admins can insert notifications" ON "public"."notifications";
