-- Run this whole file in Supabase SQL Editor before using the app.
create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text unique,
  full_name text,
  role text not null default 'partner' check (role in ('admin','partner')),
  created_at timestamptz not null default now()
);

create table if not exists public.link_exchanges (
  id uuid primary key default gen_random_uuid(),
  partner_user_id uuid not null references public.profiles(id) on delete cascade,
  submitted_by uuid not null references auth.users(id) on delete cascade,
  url text not null check (url ~* '^https?://'),
  direction text not null check (direction in ('sent_to_partner','received_from_partner')),
  status text not null default 'pending' check (status in ('pending','live','rejected')),
  notes text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
alter table public.link_exchanges enable row level security;

-- A user can read their own profile. Admins can read all profiles.
create policy "profiles_select_own_or_admin" on public.profiles
for select to authenticated
using (id = auth.uid() or exists (
  select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin'
));

-- Profiles are created/edited by the project owner in Supabase dashboard only.
-- Do not give users direct insert/update permissions on profiles.

create policy "links_select_admin_or_own_partner" on public.link_exchanges
for select to authenticated
using (
  exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
  or partner_user_id = auth.uid()
);

create policy "links_insert_admin_or_own_partner" on public.link_exchanges
for insert to authenticated
with check (
  submitted_by = auth.uid()
  and (
    exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin')
    or (partner_user_id = auth.uid() and status = 'pending')
  )
);

create policy "links_update_admin_only" on public.link_exchanges
for update to authenticated
using (exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin'))
with check (exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin'));

create policy "links_delete_admin_only" on public.link_exchanges
for delete to authenticated
using (exists (select 1 from public.profiles me where me.id = auth.uid() and me.role = 'admin'));

-- After inviting a user in Supabase Authentication, add their profile manually:
-- insert into public.profiles (id,email,full_name,role)
-- values ('AUTH_USER_UUID','person@example.com','Partner name','partner');
-- For your own user, set role='admin' in this table using the SQL editor.
-- Never expose the Supabase service_role key in the browser or in Vercel NEXT_PUBLIC_* variables.
