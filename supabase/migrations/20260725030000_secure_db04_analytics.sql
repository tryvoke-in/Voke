-- 1. Drop the permissive insert policy to force analytics through the backend Edge Function
DROP POLICY IF EXISTS "Anyone can insert activities" ON "public"."user_activities";

-- 2. Define a retention rule (delete activities older than 90 days)
CREATE OR REPLACE FUNCTION delete_old_user_activities()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM "public"."user_activities"
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$;

-- Note: In a production Supabase environment, you would schedule this function using pg_cron:
-- select cron.schedule('cleanup-activities', '0 0 * * *', 'SELECT delete_old_user_activities()');
