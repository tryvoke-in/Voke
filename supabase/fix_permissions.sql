-- Reset policies to ensure clean slate (optional, but recommended if conflicts exist)
-- drop policy if exists "Public can view scheduled sessions" on peer_interview_sessions;
-- drop policy if exists "Hosts can view own sessions" on peer_interview_sessions;
-- drop policy if exists "Guests can view joined sessions" on peer_interview_sessions;
-- drop policy if exists "Guests can join sessions" on peer_interview_sessions;
-- drop policy if exists "Hosts can update own sessions" on peer_interview_sessions;
-- drop policy if exists "Users can create sessions" on peer_interview_sessions;
-- drop policy if exists "Hosts can delete own sessions" on peer_interview_sessions;

-- Enable RLS
alter table peer_interview_sessions enable row level security;

-- 1. VIEW (SELECT)
-- Everyone can view scheduled sessions (for browsing)
create policy "Public can view scheduled sessions"
on peer_interview_sessions for select
using ( status = 'scheduled' );

-- Hosts can view their own sessions (any status)
create policy "Hosts can view own sessions"
on peer_interview_sessions for select
using ( auth.uid() = host_user_id );

-- Guests can view sessions they are part of
create policy "Guests can view joined sessions"
on peer_interview_sessions for select
using ( auth.uid() = guest_user_id );

-- 2. UPDATE
-- Guests can update a session to join it (set guest_user_id and status)
create policy "Guests can join sessions"
on peer_interview_sessions for update
using ( status = 'scheduled' and guest_user_id is null )
with check ( status = 'pending' and guest_user_id = auth.uid() );

-- Hosts can update their own sessions (approve/reject)
create policy "Hosts can update own sessions"
on peer_interview_sessions for update
using ( auth.uid() = host_user_id );

-- 3. INSERT
-- Authenticated users can create sessions
create policy "Users can create sessions"
on peer_interview_sessions for insert
with check ( auth.uid() = host_user_id );

-- 4. DELETE
-- Hosts can delete their own sessions
create policy "Hosts can delete own sessions"
on peer_interview_sessions for delete
using ( auth.uid() = host_user_id );
