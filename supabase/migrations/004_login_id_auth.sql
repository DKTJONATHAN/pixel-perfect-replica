-- Password auth by login_id (staff no / admission no / phone / email) — NO Supabase Auth emails.
-- Run this in Supabase SQL Editor once.

create extension if not exists pgcrypto;

-- Allow registrar on enum if missing (run alone if needed, then re-run rest)
do $$ begin
  alter type public.app_role add value if not exists 'registrar';
exception when others then null;
end $$;

do $$ begin
  alter type public.app_role add value if not exists 'parent';
exception when others then null;
end $$;

do $$ begin
  alter type public.app_role add value if not exists 'teacher';
exception when others then null;
end $$;

create table if not exists public.credentials (
  user_id uuid primary key references public.profiles(id) on delete cascade,
  login_id text not null unique,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create index if not exists credentials_login_id_idx on public.credentials (login_id);

alter table public.credentials enable row level security;

-- No direct client access to password hashes
drop policy if exists "No direct credentials access" on public.credentials;
create policy "No direct credentials access" on public.credentials
  for all using (false) with check (false);

-- Loosen profiles enough for app without Supabase Auth sessions
alter table public.profiles enable row level security;

drop policy if exists "Profiles readable" on public.profiles;
create policy "Profiles readable" on public.profiles
  for select using (true);

drop policy if exists "Profiles insert via rpc only" on public.profiles;
-- inserts done by security definer functions

create or replace function public.register_account(
  p_login_id text,
  p_password text,
  p_full_name text,
  p_role text,
  p_parent_phone text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid uuid := gen_random_uuid();
  lid text := lower(trim(p_login_id));
  r public.app_role;
begin
  if lid is null or lid = '' then
    raise exception 'Login ID is required';
  end if;
  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;
  if exists (select 1 from public.credentials where login_id = lid) then
    raise exception 'This login ID is already registered';
  end if;

  begin
    r := p_role::public.app_role;
  exception when others then
    raise exception 'Invalid role';
  end;

  insert into public.profiles (id, email, full_name, role, login_id, parent_phone)
  values (
    uid,
    lid, -- placeholder; not used for Auth
    trim(p_full_name),
    r,
    lid,
    p_parent_phone
  );

  insert into public.credentials (user_id, login_id, password_hash)
  values (uid, lid, crypt(p_password, gen_salt('bf')));

  return json_build_object(
    'id', uid,
    'login_id', lid,
    'full_name', trim(p_full_name),
    'role', p_role,
    'email', lid,
    'student_id', null,
    'staff_id', null,
    'parent_phone', p_parent_phone
  );
end;
$$;

create or replace function public.login_account(
  p_login_id text,
  p_password text
)
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  lid text := lower(trim(p_login_id));
  cred public.credentials%rowtype;
  prof public.profiles%rowtype;
begin
  select * into cred from public.credentials where login_id = lid;
  if not found then
    raise exception 'Invalid login credentials';
  end if;
  if cred.password_hash is distinct from crypt(p_password, cred.password_hash) then
    raise exception 'Invalid login credentials';
  end if;

  select * into prof from public.profiles where id = cred.user_id;
  if not found then
    raise exception 'Profile missing';
  end if;

  return json_build_object(
    'id', prof.id,
    'email', prof.email,
    'full_name', prof.full_name,
    'role', prof.role,
    'student_id', prof.student_id,
    'staff_id', prof.staff_id,
    'login_id', prof.login_id,
    'parent_phone', prof.parent_phone,
    'created_at', prof.created_at,
    'updated_at', prof.updated_at
  );
end;
$$;

grant execute on function public.register_account(text, text, text, text, text) to anon, authenticated;
grant execute on function public.login_account(text, text) to anon, authenticated;

-- Helpful: allow anon to read school data needed by portals (tighten later with real policies)
do $$ begin
  execute 'grant usage on schema public to anon, authenticated';
exception when others then null;
end $$;
