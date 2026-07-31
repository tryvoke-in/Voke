-- Voke Pulse: safe foundation for a scalable community feed.
-- This migration only adds fields, indexes and read-only views. It deliberately
-- preserves every existing post, comment and like.

alter table public.posts
  add column if not exists title text,
  add column if not exists post_type text not null default 'discussion',
  add column if not exists status text not null default 'active',
  add column if not exists metadata jsonb not null default '{}'::jsonb,
  add column if not exists pinned_at timestamptz,
  add column if not exists edited_at timestamptz;

-- The existing dataset is retained as active discussions. Constraints are added
-- as NOT VALID first so production data is never rejected during this rollout.
alter table public.posts
  add constraint posts_post_type_check
  check (post_type in (
    'discussion',
    'question',
    'interview_experience',
    'mock_request',
    'feedback_request',
    'win',
    'resource'
  )) not valid;

alter table public.posts
  add constraint posts_status_check
  check (status in ('active', 'pending_review', 'removed')) not valid;

-- These indexes match the feed, author history, tag filters and comment drawer.
create index if not exists posts_active_pinned_created_at_idx
  on public.posts (pinned_at desc nulls last, created_at desc)
  where status = 'active';

create index if not exists posts_user_created_at_idx
  on public.posts (user_id, created_at desc);

create index if not exists posts_tags_gin_idx
  on public.posts using gin (tags);

create index if not exists comments_post_created_at_idx
  on public.comments (post_id, created_at asc);

create index if not exists comments_user_created_at_idx
  on public.comments (user_id, created_at desc);

create index if not exists likes_user_post_idx
  on public.likes (user_id, post_id);

-- Community authors must never be read from profiles directly: that table holds
-- email, links and resume data. This deliberately narrow, read-only projection
-- is the only profile surface required by a public post feed.
create or replace view public.community_profiles
with (security_invoker = false)
as
select
  p.id,
  coalesce(nullif(btrim(p.full_name), ''), 'Voke Member') as display_name,
  p.avatar_url,
  nullif(btrim(p.target_role), '') as target_role,
  p.created_at
from public.profiles p;

revoke all on public.community_profiles from public;
grant select on public.community_profiles to anon, authenticated;

-- Feed projection with server-side counts. The frontend can fetch one page
-- instead of loading every like and comment and counting them in the browser.
-- Only active posts are exposed through this view; raw tables stay untouched
-- until the moderation UI and policies are rolled out together.
create or replace view public.community_feed
with (security_invoker = false)
as
select
  p.id,
  p.user_id,
  p.title,
  p.content,
  p.image_url,
  p.tags,
  p.post_type,
  p.metadata,
  p.pinned_at,
  p.created_at,
  p.updated_at,
  p.edited_at,
  coalesce(l.like_count, 0)::integer as like_count,
  coalesce(c.comment_count, 0)::integer as comment_count
from public.posts p
left join lateral (
  select count(*) as like_count
  from public.likes l
  where l.post_id = p.id
) l on true
left join lateral (
  select count(*) as comment_count
  from public.comments c
  where c.post_id = p.id
) c on true
where p.status = 'active';

revoke all on public.community_feed from public;
grant select on public.community_feed to anon, authenticated;
