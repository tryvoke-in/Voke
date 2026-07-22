-- Allow hosts to view their own sessions regardless of status
create policy "Hosts can view their own sessions"
on peer_interview_sessions for select
using ( auth.uid() = host_user_id );

-- Allow guests to view sessions they have requested
create policy "Guests can view their requested sessions"
on peer_interview_sessions for select
using ( auth.uid() = guest_user_id );

-- Ensure public can view scheduled sessions (existing policy might cover this, but good to ensure)
-- create policy "Public can view scheduled sessions"
-- on peer_interview_sessions for select
-- using ( status = 'scheduled' );
