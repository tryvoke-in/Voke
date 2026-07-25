-- 1. Remove the dangerous global read policy
DROP POLICY IF EXISTS "Enable read access for all users" ON "public"."profiles";

-- 2. Allow users to read their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON "public"."profiles";
CREATE POLICY "Users can view own profile"
  ON "public"."profiles"
  FOR SELECT
  TO authenticated
  USING (auth.uid() = id);

-- 3. Allow admins to read all profiles
DROP POLICY IF EXISTS "Enable read access for admin users" ON "public"."profiles";
CREATE POLICY "Enable read access for admin users"
  ON "public"."profiles"
  FOR SELECT
  TO authenticated
  USING (
    (auth.jwt() ->> 'email') IN (
      'sharma.priyanshu3434@gmail.com',
      'nikhilbhor201@gmail.com'
    )
  );

-- 4. Create a public view for safe profile data (used for Peer Interviews)
DROP VIEW IF EXISTS "public"."public_profiles";
CREATE VIEW "public"."public_profiles" AS
  SELECT id, full_name, role, target_role, created_at
  FROM "public"."profiles";

-- 5. Grant access to the view
GRANT SELECT ON "public"."public_profiles" TO authenticated;
