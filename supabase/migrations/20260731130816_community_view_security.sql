-- Keep public community identity deliberately small while ensuring views obey
-- the permissions of the person reading them.
create or replace function public.community_profile_summary()
returns table (
  id uuid,
  display_name text,
  avatar_url text,
  target_role text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public
as $$
  select
    p.id,
    coalesce(nullif(btrim(p.full_name), ''), 'Voke Member') as display_name,
    p.avatar_url,
    nullif(btrim(p.target_role), '') as target_role,
    p.created_at
  from public.profiles p;
$$;

revoke all on function public.community_profile_summary() from public;
grant execute on function public.community_profile_summary() to anon, authenticated;

create or replace view public.community_profiles
with (security_invoker = true)
as
select *
from public.community_profile_summary();

create or replace view public.community_feed
with (security_invoker = true)
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
