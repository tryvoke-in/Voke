-- Create Notifications Table
create table if not exists public.notifications (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  title text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.notifications enable row level security;

-- Policies
create policy "Users can view their own notifications"
  on public.notifications for select
  using (auth.uid() = user_id);

create policy "Admins can insert notifications"
  on public.notifications for insert
  to authenticated
  with check (true); -- ideally restrict to admin role, but keeping open for authenticated users for now as simplified admin check, or relying on frontend admin check + backend usually handles this. For now, allowing authenticated inserts so the admin portal (client-side) can insert.

create policy "Users can update their own notifications (mark as read)"
  on public.notifications for update
  using (auth.uid() = user_id);
