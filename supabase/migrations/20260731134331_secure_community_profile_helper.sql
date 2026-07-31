-- Keep the narrowly scoped author projection out of the exposed public schema.
create schema if not exists private;
revoke all on schema private from public;
grant usage on schema private to anon, authenticated;

create or replace function private.community_profile_summary()
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

revoke all on function private.community_profile_summary() from public;
grant execute on function private.community_profile_summary() to anon, authenticated;

create or replace view public.community_profiles
with (security_invoker = true)
as
select * from private.community_profile_summary();

revoke all on function public.community_profile_summary() from public;
drop function public.community_profile_summary();
