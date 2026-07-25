-- This trigger function ensures that clients cannot manually edit the "is_premium" flag
-- in their user_metadata. Only service_role (e.g., Edge Functions) can bypass this.

CREATE OR REPLACE FUNCTION public.check_user_metadata_update()
RETURNS trigger AS $$
BEGIN
  -- Check if the update is coming from a normal authenticated user
  IF auth.role() = 'authenticated' THEN
    -- Check if the "is_premium" key is being changed
    IF NEW.raw_user_meta_data->>'is_premium' IS DISTINCT FROM OLD.raw_user_meta_data->>'is_premium' THEN
      RAISE EXCEPTION 'Security Policy Violation: You are not allowed to manually modify the is_premium field.';
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to allow safe re-runs
DROP TRIGGER IF EXISTS enforce_premium_security ON auth.users;

-- Attach the trigger to the auth.users table
CREATE TRIGGER enforce_premium_security
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_metadata_update();
