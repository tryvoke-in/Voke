-- Voke Pulse redesign: persistent saves, peer mock rooms and personal plans.
-- All user-owned data has RLS enabled and is scoped to auth.uid().

create table public.community_saved_posts (
  user_id uuid not null references auth.users(id) on delete cascade,
  post_id uuid not null references public.posts(id) on delete cascade,
  created_at timestamptz not null default timezone('utc', now()),
  primary key (user_id, post_id)
);

create index community_saved_posts_user_created_at_idx
  on public.community_saved_posts (user_id, created_at desc);

alter table public.community_saved_posts enable row level security;
grant select, insert, delete on public.community_saved_posts to authenticated;

create policy "Members manage their saved community posts"
  on public.community_saved_posts
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create table public.community_mock_rooms (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references auth.users(id) on delete cascade,
  title text not null check (char_length(title) between 3 and 120),
  skill text not null check (skill in ('mock_interview', 'dsa', 'system_design', 'behavioral')),
  description text,
  scheduled_at timestamptz not null default timezone('utc', now()),
  duration_minutes integer not null default 45 check (duration_minutes between 15 and 180),
  capacity integer not null default 4 check (capacity between 2 and 8),
  status text not null default 'open' check (status in ('open', 'in_progress', 'closed', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index community_mock_rooms_open_scheduled_idx
  on public.community_mock_rooms (scheduled_at asc)
  where status = 'open';

alter table public.community_mock_rooms enable row level security;
grant select, insert, update, delete on public.community_mock_rooms to authenticated;

create policy "Authenticated members can view mock rooms"
  on public.community_mock_rooms
  for select
  to authenticated
  using (true);

create policy "Members create rooms they host"
  on public.community_mock_rooms
  for insert
  to authenticated
  with check ((select auth.uid()) = host_id);

create policy "Hosts update their mock rooms"
  on public.community_mock_rooms
  for update
  to authenticated
  using ((select auth.uid()) = host_id)
  with check ((select auth.uid()) = host_id);

create policy "Hosts delete their mock rooms"
  on public.community_mock_rooms
  for delete
  to authenticated
  using ((select auth.uid()) = host_id);

create table public.community_mock_room_members (
  room_id uuid not null references public.community_mock_rooms(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  joined_at timestamptz not null default timezone('utc', now()),
  primary key (room_id, user_id)
);

create index community_mock_room_members_user_idx
  on public.community_mock_room_members (user_id, joined_at desc);

alter table public.community_mock_room_members enable row level security;
grant select, insert, delete on public.community_mock_room_members to authenticated;

create policy "Authenticated members can see room rosters"
  on public.community_mock_room_members
  for select
  to authenticated
  using (true);

create policy "Members join rooms as themselves"
  on public.community_mock_room_members
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Members leave rooms themselves"
  on public.community_mock_room_members
  for delete
  to authenticated
  using ((select auth.uid()) = user_id);

create table public.community_daily_plan_items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan_date date not null default current_date,
  task_type text not null check (task_type in ('mock_interview', 'dsa', 'system_design', 'behavioral', 'resume')),
  title text not null check (char_length(title) between 3 and 140),
  duration_minutes integer not null default 30 check (duration_minutes between 5 and 240),
  completed boolean not null default false,
  sort_order smallint not null default 0,
  destination text,
  created_at timestamptz not null default timezone('utc', now()),
  updated_at timestamptz not null default timezone('utc', now())
);

create index community_daily_plan_items_user_date_idx
  on public.community_daily_plan_items (user_id, plan_date, sort_order);

alter table public.community_daily_plan_items enable row level security;
grant select, insert, update, delete on public.community_daily_plan_items to authenticated;

create policy "Members manage their own daily plan"
  on public.community_daily_plan_items
  for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create or replace view public.community_mock_room_feed
with (security_invoker = true)
as
select
  r.id,
  r.host_id,
  r.title,
  r.skill,
  r.description,
  r.scheduled_at,
  r.duration_minutes,
  r.capacity,
  r.status,
  r.created_at,
  count(m.user_id)::integer as member_count
from public.community_mock_rooms r
left join public.community_mock_room_members m on m.room_id = r.id
where r.status = 'open'
group by r.id;

revoke all on public.community_mock_room_feed from public;
grant select on public.community_mock_room_feed to authenticated;
