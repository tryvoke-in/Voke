-- Consolidate loose SQL files into a single ordered migration

-- 1. Profiles (from add_avatar_url_column.sql, admin_security.sql, market_pulse.sql, road_to_offer.sql)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_role TEXT DEFAULT 'Full Stack Developer';
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS target_interview_date TIMESTAMP WITH TIME ZONE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS dream_company TEXT;

-- 2. Avatars Bucket (from create_avatars_bucket.sql)
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true) ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
CREATE POLICY "Avatar images are publicly accessible." ON storage.objects FOR SELECT USING ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;
CREATE POLICY "Anyone can upload an avatar." ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'avatars' );

DROP POLICY IF EXISTS "Anyone can update their own avatar." ON storage.objects;
CREATE POLICY "Anyone can update their own avatar." ON storage.objects FOR UPDATE USING ( bucket_id = 'avatars' );


-- 3. Peer Interview Sessions (from fix_permissions.sql, fix_rls.sql, fix_status_constraint.sql)
ALTER TABLE peer_interview_sessions DROP CONSTRAINT IF EXISTS peer_interview_sessions_status_check;
ALTER TABLE peer_interview_sessions ADD CONSTRAINT peer_interview_sessions_status_check CHECK (status in ('scheduled', 'completed', 'cancelled', 'pending'));

ALTER TABLE peer_interview_sessions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view scheduled sessions" ON peer_interview_sessions;
CREATE POLICY "Public can view scheduled sessions" ON peer_interview_sessions FOR SELECT USING ( status = 'scheduled' );

DROP POLICY IF EXISTS "Hosts can view own sessions" ON peer_interview_sessions;
CREATE POLICY "Hosts can view own sessions" ON peer_interview_sessions FOR SELECT USING ( auth.uid() = host_user_id );

DROP POLICY IF EXISTS "Guests can view joined sessions" ON peer_interview_sessions;
CREATE POLICY "Guests can view joined sessions" ON peer_interview_sessions FOR SELECT USING ( auth.uid() = guest_user_id );

DROP POLICY IF EXISTS "Guests can join sessions" ON peer_interview_sessions;
CREATE POLICY "Guests can join sessions" ON peer_interview_sessions FOR UPDATE USING ( status = 'scheduled' and guest_user_id is null ) WITH CHECK ( status = 'pending' and guest_user_id = auth.uid() );

DROP POLICY IF EXISTS "Hosts can update own sessions" ON peer_interview_sessions;
CREATE POLICY "Hosts can update own sessions" ON peer_interview_sessions FOR UPDATE USING ( auth.uid() = host_user_id );

DROP POLICY IF EXISTS "Users can create sessions" ON peer_interview_sessions;
CREATE POLICY "Users can create sessions" ON peer_interview_sessions FOR INSERT WITH CHECK ( auth.uid() = host_user_id );

DROP POLICY IF EXISTS "Hosts can delete own sessions" ON peer_interview_sessions;
CREATE POLICY "Hosts can delete own sessions" ON peer_interview_sessions FOR DELETE USING ( auth.uid() = host_user_id );

DROP POLICY IF EXISTS "Hosts can view their own sessions" ON peer_interview_sessions;
CREATE POLICY "Hosts can view their own sessions" ON peer_interview_sessions FOR SELECT USING ( auth.uid() = host_user_id );

DROP POLICY IF EXISTS "Guests can view their requested sessions" ON peer_interview_sessions;
CREATE POLICY "Guests can view their requested sessions" ON peer_interview_sessions FOR SELECT USING ( auth.uid() = guest_user_id );


-- 4. Notifications (from notifications.sql)
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications (mark as read)" ON public.notifications;
CREATE POLICY "Users can update their own notifications (mark as read)" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
-- Note: Intentionally omitting "Admins can insert notifications" because it was insecure and properly handled in a previous security migration.


-- 5. Premium Security (from secure_is_premium_metadata.sql)
CREATE OR REPLACE FUNCTION public.check_user_metadata_update()
RETURNS trigger AS $$
BEGIN
  IF auth.role() = 'authenticated' THEN
    IF NEW.raw_user_meta_data->>'is_premium' IS DISTINCT FROM OLD.raw_user_meta_data->>'is_premium' THEN
      RAISE EXCEPTION 'Security Policy Violation: You are not allowed to manually modify the is_premium field.';
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS enforce_premium_security ON auth.users;
CREATE TRIGGER enforce_premium_security
  BEFORE UPDATE ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.check_user_metadata_update();
