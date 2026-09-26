# KidRight Academy — Supabase SQL Reference

This file is a consolidated copy of the Supabase SQL currently tracked in the repository.

> The executable source of truth remains the individual files under `supabase/schema.sql`, `supabase/migrations/`, and `supabase/sql/`.

## Current database notes

- Login credentials use `public.credentials` with bcrypt hashes generated through `extensions.crypt()`.
- `pgcrypto` is installed in the `extensions` schema.
- `staff.employment_type` uses the `public.employment_type` enum; `staff.teacher_employment` is a text field.
- Fees are one annual ledger. All payments count toward the learner's annual paid total regardless of the receipt's entered term. Excess is carried Term 1 → Term 2 → Term 3 → annual credit.
- Marks and payments are enabled for Supabase Realtime so student and parent portals can update when records change.
- Registration no longer signs the administrator into the newly-created account; the new account establishes/links its authentication session on its first login.

---

## `supabase/schema.sql`

```sql
-- KidRight Academy — Supabase schema
-- Run this in the Supabase SQL Editor (Dashboard → SQL → New query).
-- Creates tables, indexes, RLS policies, and a profile trigger for new auth users.

-- Extensions
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type public.app_role as enum ('admin', 'staff', 'student');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.student_status as enum ('Active', 'Transferred', 'Graduated', 'Suspended');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.staff_status as enum ('Active', 'On Leave', 'Terminated');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.gender as enum ('Male', 'Female');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.attendance_status as enum ('Present', 'Absent', 'Late');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.employment_type as enum ('Full-time', 'Part-time', 'Contract');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.staff_role as enum ('Teacher', 'Administrator', 'Accountant', 'Librarian', 'Support Staff');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leave_status as enum ('Pending', 'Approved', 'Rejected');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.leave_type as enum ('Annual', 'Sick', 'Compassionate', 'Study');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.payment_method as enum ('Cash', 'Bank', 'Mobile Money');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Profiles (1:1 with auth.users)
-- ---------------------------------------------------------------------------
create table if not exists public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role public.app_role not null default 'student',
  student_id uuid,
  staff_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- School settings (single row)
-- ---------------------------------------------------------------------------
create table if not exists public.school_settings (
  id int primary key default 1 check (id = 1),
  school_name text not null default 'KidRight Academy',
  motto text not null default 'Learn. Grow. Shine.',
  address text not null default '12 Riverside Lane, Nairobi',
  phone text not null default '+254 700 123 456',
  email text not null default 'office@kidright.ac.ke',
  academic_year text not null default '2026',
  current_term text not null default 'Term 3',
  currency text not null default 'KES',
  annual_leave_days int not null default 21,
  about text not null default 'KidRight Academy is a modern primary school committed to academic excellence, character formation, and holistic development of every learner.',
  vision text not null default 'To nurture confident, curious, and compassionate learners who shape a better Kenya.',
  mission text not null default 'Provide quality, inclusive education grounded in integrity, creativity, and community.',
  updated_at timestamptz not null default now()
);

insert into public.school_settings (id) values (1)
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Classes
-- ---------------------------------------------------------------------------
create table if not exists public.classes (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  stream text not null default 'Blue',
  teacher_id uuid,
  fee_per_term numeric(12, 2) not null default 0,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Staff
-- ---------------------------------------------------------------------------
create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(),
  staff_no text not null unique,
  full_name text not null,
  gender public.gender not null,
  dob date,
  national_id text,
  phone text,
  email text unique,
  address text,
  photo_url text,
  role public.staff_role not null default 'Teacher',
  department text not null default 'General',
  qualifications text,
  subjects text[] not null default '{}',
  employment_type public.employment_type not null default 'Full-time',
  date_joined date not null default current_date,
  salary numeric(12, 2) not null default 0,
  status public.staff_status not null default 'Active',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.classes
  drop constraint if exists classes_teacher_id_fkey;
alter table public.classes
  add constraint classes_teacher_id_fkey
  foreign key (teacher_id) references public.staff (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Students
-- ---------------------------------------------------------------------------
create table if not exists public.students (
  id uuid primary key default gen_random_uuid(),
  admission_no text not null unique,
  first_name text not null,
  last_name text not null,
  dob date,
  gender public.gender not null,
  class_id uuid references public.classes (id) on delete set null,
  photo_url text,
  guardian_name text,
  guardian_phone text,
  guardian_email text,
  address text,
  medical_notes text,
  emergency_contact text,
  admission_date date not null default current_date,
  status public.student_status not null default 'Active',
  archived boolean not null default false,
  created_at timestamptz not null default now()
);

alter table public.profiles
  drop constraint if exists profiles_student_id_fkey;
alter table public.profiles
  add constraint profiles_student_id_fkey
  foreign key (student_id) references public.students (id) on delete set null;

alter table public.profiles
  drop constraint if exists profiles_staff_id_fkey;
alter table public.profiles
  add constraint profiles_staff_id_fkey
  foreign key (staff_id) references public.staff (id) on delete set null;

-- ---------------------------------------------------------------------------
-- Attendance, grades, payments, leave, activity
-- ---------------------------------------------------------------------------
create table if not exists public.attendance (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  student_id uuid not null references public.students (id) on delete cascade,
  class_id uuid references public.classes (id) on delete set null,
  status public.attendance_status not null default 'Present',
  unique (date, student_id)
);

create table if not exists public.staff_attendance (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  staff_id uuid not null references public.staff (id) on delete cascade,
  status public.attendance_status not null default 'Present',
  unique (date, staff_id)
);

create table if not exists public.grades (
  id uuid primary key default gen_random_uuid(),
  student_id uuid not null references public.students (id) on delete cascade,
  term text not null,
  subject text not null,
  score numeric(5, 2) not null check (score >= 0 and score <= 100),
  unique (student_id, term, subject)
);

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  receipt_no text not null unique,
  student_id uuid not null references public.students (id) on delete cascade,
  term text not null,
  amount numeric(12, 2) not null check (amount >= 0),
  date date not null default current_date,
  method public.payment_method not null default 'Mobile Money',
  note text,
  created_at timestamptz not null default now()
);

create table if not exists public.leave_requests (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  type public.leave_type not null,
  date_from date not null,
  date_to date not null,
  days int not null,
  reason text not null,
  status public.leave_status not null default 'Pending',
  requested_at date not null default current_date
);

create table if not exists public.activity_log (
  id uuid primary key default gen_random_uuid(),
  at timestamptz not null default now(),
  actor text not null,
  message text not null
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------
create index if not exists idx_students_class on public.students (class_id);
create index if not exists idx_students_status on public.students (status);
create index if not exists idx_attendance_date on public.attendance (date);
create index if not exists idx_grades_student on public.grades (student_id);
create index if not exists idx_payments_student on public.payments (student_id);
create index if not exists idx_profiles_role on public.profiles (role);

-- ---------------------------------------------------------------------------
-- Auth helper: create profile row when a user signs up
-- ---------------------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    'student'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Role helpers for RLS
-- ---------------------------------------------------------------------------
create or replace function public.current_role()
returns public.app_role
language sql
stable
security definer
set search_path = public
as $$
  select role from public.profiles where id = auth.uid();
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role = 'admin'
  );
$$;

create or replace function public.is_staff()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles where id = auth.uid() and role in ('admin', 'staff')
  );
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.profiles enable row level security;
alter table public.school_settings enable row level security;
alter table public.classes enable row level security;
alter table public.staff enable row level security;
alter table public.students enable row level security;
alter table public.attendance enable row level security;
alter table public.staff_attendance enable row level security;
alter table public.grades enable row level security;
alter table public.payments enable row level security;
alter table public.leave_requests enable row level security;
alter table public.activity_log enable row level security;

-- Profiles
drop policy if exists "Users read own profile" on public.profiles;
create policy "Users read own profile" on public.profiles
  for select using (auth.uid() = id or public.is_admin());

drop policy if exists "Users update own profile" on public.profiles;
create policy "Users update own profile" on public.profiles
  for update using (auth.uid() = id or public.is_admin());

drop policy if exists "Admin insert profiles" on public.profiles;
create policy "Admin insert profiles" on public.profiles
  for insert with check (public.is_admin());

-- School settings: public read, admin write
drop policy if exists "Anyone can read school settings" on public.school_settings;
create policy "Anyone can read school settings" on public.school_settings
  for select using (true);

drop policy if exists "Admin update school settings" on public.school_settings;
create policy "Admin update school settings" on public.school_settings
  for update using (public.is_admin());

-- Classes: authenticated read, staff write
drop policy if exists "Auth read classes" on public.classes;
create policy "Auth read classes" on public.classes
  for select using ((select auth.uid()) is not null);

drop policy if exists "Staff write classes" on public.classes;
create policy "Staff write classes" on public.classes
  for all using (public.is_staff()) with check (public.is_staff());

-- Staff table
drop policy if exists "Auth read staff" on public.staff;
create policy "Auth read staff" on public.staff
  for select using (auth.role() = 'authenticated');

drop policy if exists "Admin write staff" on public.staff;
create policy "Admin write staff" on public.staff
  for all using (public.is_admin()) with check (public.is_admin());

-- Students
drop policy if exists "Students read self or staff" on public.students;
create policy "Students read self or staff" on public.students
  for select using (
    public.is_staff()
    or id = (select student_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Staff write students" on public.students;
create policy "Staff write students" on public.students
  for all using (public.is_staff());

-- Attendance
drop policy if exists "Read attendance" on public.attendance;
create policy "Read attendance" on public.attendance
  for select using (
    public.is_staff()
    or student_id = (select student_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Staff write attendance" on public.attendance;
create policy "Staff write attendance" on public.attendance
  for all using (public.is_staff());

-- Staff attendance
drop policy if exists "Staff read staff attendance" on public.staff_attendance;
create policy "Staff read staff attendance" on public.staff_attendance
  for select using (public.is_staff());

drop policy if exists "Admin write staff attendance" on public.staff_attendance;
create policy "Admin write staff attendance" on public.staff_attendance
  for all using (public.is_admin());

-- Grades
drop policy if exists "Read grades" on public.grades;
create policy "Read grades" on public.grades
  for select using (
    public.is_staff()
    or student_id = (select student_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Staff write grades" on public.grades;
create policy "Staff write grades" on public.grades
  for all using (public.is_staff());

-- Payments
drop policy if exists "Read payments" on public.payments;
create policy "Read payments" on public.payments
  for select using (
    public.is_staff()
    or student_id = (select student_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Staff write payments" on public.payments;
create policy "Staff write payments" on public.payments
  for all using (public.is_staff());

-- Leave
drop policy if exists "Read leave" on public.leave_requests;
create policy "Read leave" on public.leave_requests
  for select using (
    public.is_admin()
    or staff_id = (select staff_id from public.profiles where id = auth.uid())
  );

drop policy if exists "Staff insert leave" on public.leave_requests;
create policy "Staff insert leave" on public.leave_requests
  for insert with check (
    staff_id = (select staff_id from public.profiles where id = auth.uid())
    or public.is_admin()
  );

drop policy if exists "Admin manage leave" on public.leave_requests;
create policy "Admin manage leave" on public.leave_requests
  for update using (public.is_admin());

-- Activity log
drop policy if exists "Staff read activity" on public.activity_log;
create policy "Staff read activity" on public.activity_log
  for select using (public.is_staff());

drop policy if exists "Staff write activity" on public.activity_log;
create policy "Staff write activity" on public.activity_log
  for insert with check (public.is_staff());


-- Never expose role-management helpers to client roles.
revoke execute on function public.current_role() from public, anon, authenticated;
revoke execute on function public.is_admin() from public, anon, authenticated;
revoke execute on function public.is_staff() from public, anon, authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;

```

## `supabase/migrations/002_registration_parents_grades.sql`

```sql
-- Migration: registrar registration, 10-digit staff numbers, parents, teacher details
-- Run after schema.sql in Supabase SQL Editor.

-- Extend roles
do $$ begin
  alter type public.app_role add value if not exists 'registrar';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.app_role add value if not exists 'parent';
exception when duplicate_object then null; end $$;
do $$ begin
  alter type public.app_role add value if not exists 'teacher';
exception when duplicate_object then null; end $$;

-- Staff category & teacher employment
do $$ begin
  create type public.staff_category as enum ('Teacher', 'Support');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.teacher_employment as enum ('TSC', 'BOM', 'PTA');
exception when duplicate_object then null; end $$;

-- Support departments
do $$ begin
  create type public.support_department as enum (
    'Administration', 'Accounts', 'Library', 'Kitchen', 'Cleaning',
    'Transport', 'Security', 'Grounds', 'Clinic', 'Other'
  );
exception when duplicate_object then null; end $$;

-- Staff columns
alter table public.staff
  add column if not exists staff_category public.staff_category not null default 'Support',
  add column if not exists teacher_employment public.teacher_employment,
  add column if not exists tsc_registered boolean not null default false,
  add column if not exists tsc_number text,
  add column if not exists support_department public.support_department,
  add column if not exists login_email text unique;

-- Enforce 10-digit staff numbers for new rows
alter table public.staff drop constraint if exists staff_no_ten_digits;
alter table public.staff
  add constraint staff_no_ten_digits check (staff_no ~ '^[0-9]{10}$');

-- Unique TSC number when present
create unique index if not exists idx_staff_tsc_number
  on public.staff (tsc_number) where tsc_number is not null and tsc_number <> '';

-- Sequence helper for 10-digit staff numbers (starts at 1000000001)
create sequence if not exists public.staff_no_seq start 1000000001;

create or replace function public.next_staff_no()
returns text
language plpgsql
as $$
declare
  n bigint;
  candidate text;
begin
  loop
    n := nextval('public.staff_no_seq');
    if n > 9999999999 then
      raise exception 'Staff number space exhausted';
    end if;
    candidate := lpad(n::text, 10, '0');
    exit when not exists (select 1 from public.staff where staff_no = candidate);
  end loop;
  return candidate;
end;
$$;

-- Profiles: login identifier (staff_no or admission_no)
alter table public.profiles
  add column if not exists login_id text unique,
  add column if not exists parent_phone text;

-- Parent ↔ student links
create table if not exists public.parent_students (
  id uuid primary key default gen_random_uuid(),
  parent_profile_id uuid not null references public.profiles (id) on delete cascade,
  student_id uuid not null references public.students (id) on delete cascade,
  relationship text not null default 'Guardian',
  unique (parent_profile_id, student_id)
);

create index if not exists idx_parent_students_parent on public.parent_students (parent_profile_id);
create index if not exists idx_parent_students_student on public.parent_students (student_id);

alter table public.parent_students enable row level security;

drop policy if exists "Parents read own links" on public.parent_students;
create policy "Parents read own links" on public.parent_students
  for select using (
    parent_profile_id = auth.uid()
    or public.is_staff()
    or public.is_admin()
  );

drop policy if exists "Registrar manage parent links" on public.parent_students;
create policy "Registrar manage parent links" on public.parent_students
  for all using (
    public.is_admin()
    or exists (select 1 from public.profiles where id = auth.uid() and role in ('registrar', 'admin'))
  );

-- Helper: is registrar
create or replace function public.is_registrar()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'registrar')
  );
$$;

-- Allow parents to read linked students' grades, payments, attendance
drop policy if exists "Parents read linked students" on public.students;
create policy "Parents read linked students" on public.students
  for select using (
    public.is_staff()
    or id = (select student_id from public.profiles where id = auth.uid())
    or id in (select student_id from public.parent_students where parent_profile_id = auth.uid())
  );

drop policy if exists "Parents read linked grades" on public.grades;
create policy "Parents read linked grades" on public.grades
  for select using (
    public.is_staff()
    or student_id = (select student_id from public.profiles where id = auth.uid())
    or student_id in (select student_id from public.parent_students where parent_profile_id = auth.uid())
  );

drop policy if exists "Parents read linked payments" on public.payments;
create policy "Parents read linked payments" on public.payments
  for select using (
    public.is_staff()
    or student_id = (select student_id from public.profiles where id = auth.uid())
    or student_id in (select student_id from public.parent_students where parent_profile_id = auth.uid())
  );

drop policy if exists "Parents read linked attendance" on public.attendance;
create policy "Parents read linked attendance" on public.attendance
  for select using (
    public.is_staff()
    or student_id = (select student_id from public.profiles where id = auth.uid())
    or student_id in (select student_id from public.parent_students where parent_profile_id = auth.uid())
  );

-- Public RPC: resolve login id → email for auth (staff_no / admission_no)
create or replace function public.resolve_login_email(p_login_id text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  em text;
begin
  select email into em from public.profiles where login_id = p_login_id limit 1;
  if em is not null then return em; end if;

  -- Staff number
  select coalesce(login_email, email) into em
  from public.staff where staff_no = p_login_id limit 1;
  if em is not null then return em; end if;

  -- Admission number → synthetic student email stored on profile via login_id
  return null;
end;
$$;

grant execute on function public.resolve_login_email(text) to anon, authenticated;
grant execute on function public.next_staff_no() to authenticated;

```

## `supabase/migrations/003_signup_profile_trigger.sql`

```sql
-- Auto-create profile on Auth signup + allow users to upsert their own profile.
-- Run in Supabase SQL Editor (after enum values registrar/parent/teacher exist).

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  r text;
begin
  r := coalesce(new.raw_user_meta_data->>'role', 'parent');
  if r not in ('admin', 'registrar', 'teacher', 'staff', 'student', 'parent') then
    r := 'parent';
  end if;

  insert into public.profiles (id, email, full_name, role, login_id)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', new.email),
    r::public.app_role,
    coalesce(new.raw_user_meta_data->>'login_id', new.email)
  )
  on conflict (id) do update
  set
    email = excluded.email,
    full_name = coalesce(excluded.full_name, profiles.full_name),
    role = excluded.role,
    login_id = coalesce(excluded.login_id, profiles.login_id);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Users can insert/update their own profile row
drop policy if exists "Users upsert own profile" on public.profiles;
create policy "Users upsert own profile" on public.profiles
  for all
  using (id = auth.uid())
  with check (id = auth.uid());

```

## `supabase/migrations/004_login_id_auth.sql`

```sql
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

```

## `supabase/migrations/005_drop_profiles_auth_fk.sql`

```sql
-- profiles was tied to Supabase Auth users. Login-id auth uses its own UUIDs,
-- so remove the FK to auth.users.

alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Optional: ensure id has a default for other inserts
-- (register_account already supplies id explicitly)

```

## `supabase/migrations/20260925_register_account_with_email.sql`

```sql
-- Real email registration bridge for Supabase Auth.
-- Keeps the existing login_id/password model while storing the user's real email
-- so Supabase Auth can deliver confirmation and recovery messages.

create or replace function public.register_account_with_email(
  p_login_id text,
  p_password text,
  p_full_name text,
  p_role text,
  p_email text default null,
  p_parent_phone text default null
)
returns json
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  uid uuid := gen_random_uuid();
  lid text := lower(trim(p_login_id));
  em text := nullif(lower(trim(coalesce(p_email, ''))), '');
  r public.app_role;
begin
  if lid is null or lid = '' then
    raise exception 'Login ID is required';
  end if;

  if p_password is null or length(p_password) < 6 then
    raise exception 'Password must be at least 6 characters';
  end if;

  if p_full_name is null or trim(p_full_name) = '' then
    raise exception 'Full name is required';
  end if;

  if em is null or position('@' in em) = 0 then
    raise exception 'A valid email address is required';
  end if;

  begin
    r := p_role::public.app_role;
  exception when others then
    raise exception 'Invalid role: %', p_role;
  end;

  if r <> 'parent' and not public.is_admin() then
    raise exception 'Only an administrator or registrar can create school accounts';
  end if;

  if r = 'admin'
     and not exists (
       select 1
       from public.profiles
       where auth_user_id = auth.uid()
         and role = 'admin'
     )
  then
    raise exception 'Only an administrator can create an administrator account';
  end if;

  if exists (
    select 1 from public.credentials where lower(login_id) = lid
  ) then
    raise exception 'This login ID is already registered';
  end if;

  if exists (
    select 1 from public.profiles where lower(email) = em
  ) then
    raise exception 'This email address is already registered';
  end if;

  insert into public.profiles (
    id, email, full_name, role, login_id, parent_phone
  )
  values (
    uid, em, trim(p_full_name), r, lid, p_parent_phone
  );

  insert into public.credentials (
    user_id, login_id, password_hash
  )
  values (
    uid,
    lid,
    extensions.crypt(p_password, extensions.gen_salt('bf'))
  );

  return json_build_object(
    'id', uid,
    'email', em,
    'full_name', trim(p_full_name),
    'role', r,
    'student_id', null,
    'staff_id', null,
    'login_id', lid,
    'parent_phone', p_parent_phone
  );
end;
$$;

grant execute on function public.register_account_with_email(text, text, text, text, text, text)
  to anon, authenticated;

```

## `supabase/migrations/20260925_support_real_emails_for_account_registration.sql`

```sql
-- Allow parent/staff/student registrations to carry a real recovery email.
-- School-ID accounts continue to receive a valid synthetic auth email when no email is supplied.

create or replace function public.register_account_with_email(
  p_login_id text,
  p_password text,
  p_full_name text,
  p_role text,
  p_email text default null,
  p_parent_phone text default null
)
returns json
language plpgsql
security definer
set search_path = public
as $function$
declare
  uid uuid := gen_random_uuid();
  lid text := lower(trim(p_login_id));
  supplied_email text := lower(trim(coalesce(p_email, '')));
  auth_email text;
  r public.app_role;
begin
  if lid is null or lid = '' then raise exception 'Login ID is required'; end if;
  if p_password is null or length(p_password) < 6 then raise exception 'Password must be at least 6 characters'; end if;
  if p_full_name is null or trim(p_full_name) = '' then raise exception 'Full name is required'; end if;
  if supplied_email <> '' and position('@' in supplied_email) = 0 then raise exception 'Enter a valid email address'; end if;

  begin
    r := p_role::public.app_role;
  exception when others then
    raise exception 'Invalid role: %', p_role;
  end;

  if r <> 'parent' and not public.is_admin() then
    raise exception 'Only an administrator or registrar can create school accounts';
  end if;

  if r = 'admin' and not exists (
    select 1 from public.profiles
    where auth_user_id = auth.uid() and role = 'admin'
  ) then
    raise exception 'Only an administrator can create an administrator account';
  end if;

  if exists (select 1 from public.credentials where login_id = lid) then
    raise exception 'This login ID is already registered';
  end if;

  auth_email := case
    when supplied_email <> '' then supplied_email
    when lid like '%@%' then lid
    else regexp_replace(lid, '[^a-z0-9._-]', '-', 'g') || '@accounts.kidright.com'
  end;

  insert into public.profiles (id,email,full_name,role,login_id,parent_phone)
  values (uid,auth_email,trim(p_full_name),r,lid,p_parent_phone);

  insert into public.credentials (user_id,login_id,password_hash)
  values (uid,lid,extensions.crypt(p_password, extensions.gen_salt('bf')));

  return json_build_object(
    'id',uid,
    'email',auth_email,
    'full_name',trim(p_full_name),
    'role',r,
    'student_id',null,
    'staff_id',null,
    'login_id',lid,
    'parent_phone',p_parent_phone
  );
end;
$function$;

revoke all on function public.register_account_with_email(text,text,text,text,text,text) from public;
grant execute on function public.register_account_with_email(text,text,text,text,text,text) to anon, authenticated, service_role;

```

## `supabase/migrations/20260925_sync_auth_and_security.sql`

```sql
alter table public.profiles add column if not exists auth_user_id uuid;
create unique index if not exists profiles_auth_user_id_uidx on public.profiles(auth_user_id) where auth_user_id is not null;
create unique index if not exists profiles_login_id_uidx on public.profiles(lower(login_id)) where login_id is not null;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles where auth_user_id = auth.uid() and role in ('admin','registrar'));
$$;

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles where auth_user_id = auth.uid() and role in ('admin','registrar','staff','teacher'));
$$;

create or replace function public.is_parent() returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles where auth_user_id = auth.uid() and role = 'parent');
$$;

create or replace function public.register_account(p_login_id text,p_password text,p_full_name text,p_role text,p_parent_phone text default null)
returns json language plpgsql security definer set search_path=public as $$
declare uid uuid := gen_random_uuid(); lid text := lower(trim(p_login_id)); r public.app_role;
begin
 if lid is null or lid='' then raise exception 'Login ID is required'; end if;
 if p_password is null or length(p_password)<6 then raise exception 'Password must be at least 6 characters'; end if;
 if p_full_name is null or trim(p_full_name)='' then raise exception 'Full name is required'; end if;
 begin r:=p_role::public.app_role; exception when others then raise exception 'Invalid role: %',p_role; end;
 if r <> 'parent' and not public.is_admin() then raise exception 'Only an administrator or registrar can create school accounts'; end if;
 if r='admin' and not exists(select 1 from public.profiles where auth_user_id=auth.uid() and role='admin') then raise exception 'Only an administrator can create an administrator account'; end if;
 if exists(select 1 from public.credentials where login_id=lid) then raise exception 'This login ID is already registered'; end if;
 insert into public.profiles(id,email,full_name,role,login_id,parent_phone) values(uid,lid,trim(p_full_name),r,lid,p_parent_phone);
 insert into public.credentials(user_id,login_id,password_hash) values(uid,lid,extensions.crypt(p_password,extensions.gen_salt('bf')));
 return json_build_object('id',uid,'email',lid,'full_name',trim(p_full_name),'role',r,'student_id',null,'staff_id',null,'login_id',lid,'parent_phone',p_parent_phone);
end;
$$;

create or replace function public.link_auth_user(p_login_id text,p_password text,p_auth_user_id uuid)
returns json language plpgsql security definer set search_path=public as $$
declare lid text:=lower(trim(p_login_id)); cred public.credentials%rowtype; prof public.profiles%rowtype;
begin
 select * into cred from public.credentials where login_id=lid;
 if not found or cred.password_hash is distinct from extensions.crypt(p_password,cred.password_hash) then raise exception 'Invalid login credentials'; end if;
 select * into prof from public.profiles where id=cred.user_id;
 if not found then raise exception 'Profile missing'; end if;
 if prof.auth_user_id is not null and prof.auth_user_id<>p_auth_user_id then raise exception 'Account is already linked'; end if;
 update public.profiles set auth_user_id=p_auth_user_id,updated_at=now() where id=prof.id;
 return json_build_object('id',prof.id,'email',prof.email,'full_name',prof.full_name,'role',prof.role,'student_id',prof.student_id,'staff_id',prof.staff_id,'login_id',prof.login_id,'parent_phone',prof.parent_phone);
end;
$$;
```

## `supabase/migrations/20260926_bootstrap_registrar_and_fixes.sql`

```sql
-- Bootstrap the first registrar/admin account, and fix a leftover trigger
-- from migration 003 that conflicts with the current login_id/credentials
-- auth model.
--
-- IMPORTANT — do this first, in the Supabase Dashboard (not SQL):
--   Authentication -> Users -> Add user
--     Email:    jonathanmwaniki07@gmail.com
--     Password: 123456
--     Check "Auto Confirm User"
-- Then run this whole file once in the SQL Editor. It is safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Fix: migration 003's on_auth_user_created trigger auto-inserts a
--    *second* public.profiles row (id = auth.users.id) every time a new
--    Supabase Auth user is created. The app's current model
--    (register_account_with_email + link_auth_user) already manages
--    profiles/credentials itself and links auth_user_id after the fact, so
--    this trigger now only fights the app: it can throw a duplicate-login_id
--    error and break a staff/student's very first sign-in. Remove it.
-- ---------------------------------------------------------------------------
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.handle_new_user();

-- ---------------------------------------------------------------------------
-- 2. Bootstrap the registrar profile + credentials, linked to the Auth user
--    you created above. Re-runnable: updates in place if it already exists.
-- ---------------------------------------------------------------------------
do $$
declare
  bootstrap_email text := 'jonathanmwaniki07@gmail.com';
  bootstrap_password text := '123456';
  auth_id uuid;
  profile_id uuid;
begin
  select id into auth_id from auth.users where lower(email) = lower(bootstrap_email);

  if auth_id is null then
    raise exception
      'No Supabase Auth user found for %. Create it first in Dashboard -> Authentication -> Users -> Add user (with Auto Confirm User checked), then re-run this migration.',
      bootstrap_email;
  end if;

  select id into profile_id from public.profiles where auth_user_id = auth_id;

  if profile_id is null then
    insert into public.profiles (id, auth_user_id, email, full_name, role, login_id)
    values (gen_random_uuid(), auth_id, lower(bootstrap_email), 'School Registrar', 'registrar', lower(bootstrap_email))
    returning id into profile_id;
  else
    update public.profiles
    set email = lower(bootstrap_email), role = 'registrar', login_id = lower(bootstrap_email)
    where id = profile_id;
  end if;

  insert into public.credentials (user_id, login_id, password_hash)
  values (profile_id, lower(bootstrap_email), extensions.crypt(bootstrap_password, extensions.gen_salt('bf')))
  on conflict (user_id) do update
  set login_id = excluded.login_id, password_hash = excluded.password_hash;
end $$;

```

## `supabase/migrations/20260926_grant_role_helper_execute.sql`

```sql
-- Fix: schema.sql ends by revoking EXECUTE on is_admin()/is_staff() from
-- anon and authenticated. Those two functions are called directly inside
-- RLS policies on profiles, classes, students, staff, payments, leave,
-- activity_log, etc. RLS policies are evaluated as the querying role
-- (anon/authenticated via PostgREST) — `security definer` only changes
-- privileges *inside* the function body once it starts running, it does
-- not waive the caller's need for EXECUTE to invoke it in the first place.
-- With EXECUTE revoked, any query touching an RLS-protected table throws
-- "permission denied for function is_admin" / "...is_staff", for every
-- role, not just admins. Restore the grants.

grant execute on function public.is_admin() to anon, authenticated, service_role;
grant execute on function public.is_staff() to anon, authenticated, service_role;

-- is_parent() (added later, in 20260925_sync_auth_and_security.sql) isn't
-- referenced by any current policy, but grant it too so it's usable the
-- moment a policy needs it, without hitting this same bug again.
grant execute on function public.is_parent() to anon, authenticated, service_role;

```

## `supabase/migrations/20260926_fee_ledger_realtime_and_status_security.sql`

```sql
-- Annual fee ledger, live marks/payments, and secure learner-status guard.
-- Payments are pooled across the academic year regardless of the term selected
-- on the receipt. Excess is carried Term 1 -> Term 2 -> Term 3 -> annual credit.

create or replace function public.student_fee_ledger(p_student_id uuid)
returns table (
  term text,
  billed numeric,
  annual_paid numeric,
  allocated_paid numeric,
  arrears numeric,
  credit_after_term numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with base as (
    select
      s.id as student_id,
      coalesce(c.fee_per_term, 0)::numeric as per_term,
      coalesce(sum(p.amount), 0)::numeric as paid
    from public.students s
    left join public.classes c on c.id = s.class_id
    left join public.payments p on p.student_id = s.id
    where s.id = p_student_id
    group by s.id, c.fee_per_term
  ),
  terms as (
    select * from (values
      ('Term 1'::text, 1),
      ('Term 2'::text, 2),
      ('Term 3'::text, 3)
    ) v(term, term_no)
  )
  select
    t.term,
    b.per_term as billed,
    b.paid as annual_paid,
    least(greatest(b.paid - ((t.term_no - 1) * b.per_term), 0), b.per_term) as allocated_paid,
    greatest(
      b.per_term - least(greatest(b.paid - ((t.term_no - 1) * b.per_term), 0), b.per_term),
      0
    ) as arrears,
    greatest(b.paid - (t.term_no * b.per_term), 0) as credit_after_term
  from base b
  cross join terms t
  order by t.term_no;
$$;

grant execute on function public.student_fee_ledger(uuid) to authenticated;

-- Secure learner status changes: administrator only.
create or replace function public.guard_student_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    ) then
      raise exception 'Only an administrator can change a learner''s status';
    end if;
  end if;
  return new;
end;
$$;

-- Live portal updates for marks and payments.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'grades'
  ) then
    alter publication supabase_realtime add table public.grades;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table public.payments;
  end if;
end $$;

```

## `supabase/sql/006_staff_control_duty_status.sql`

```sql
-- 006: admin-only learner status, Expelled status, Casual workers,
-- duty rota and teaching assignments. Paste into the Supabase SQL Editor and run once.

do $$ begin
  alter type public.student_status add value if not exists 'Expelled';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.employment_type add value if not exists 'Casual';
exception when duplicate_object then null; end $$;

-- Only an administrator may change a learner's status.
create or replace function public.guard_student_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status then
    if not exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'admin') then
      raise exception 'Only an administrator can change a learner''s status';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists trg_guard_student_status on public.students;
create trigger trg_guard_student_status
  before update on public.students
  for each row execute function public.guard_student_status();

-- Weekly duty rota
create table if not exists public.duty_roster (
  id uuid primary key default gen_random_uuid(),
  week_start date not null,
  staff_id uuid not null references public.staff (id) on delete cascade,
  duty text not null default 'Teacher on duty',
  notes text,
  created_at timestamptz not null default now(),
  unique (week_start, staff_id, duty)
);
grant select, insert, update, delete on public.duty_roster to authenticated;
grant all on public.duty_roster to service_role;
alter table public.duty_roster enable row level security;
drop policy if exists "Staff read duty" on public.duty_roster;
create policy "Staff read duty" on public.duty_roster
  for select to authenticated using (public.is_staff() or public.is_admin());
drop policy if exists "Admin manage duty" on public.duty_roster;
create policy "Admin manage duty" on public.duty_roster
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

-- Teacher / class / subject assignments
create table if not exists public.teaching_assignments (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  class_id uuid not null references public.classes (id) on delete cascade,
  subject text not null,
  created_at timestamptz not null default now(),
  unique (class_id, subject)
);
grant select, insert, update, delete on public.teaching_assignments to authenticated;
grant all on public.teaching_assignments to service_role;
alter table public.teaching_assignments enable row level security;
drop policy if exists "Staff read assignments" on public.teaching_assignments;
create policy "Staff read assignments" on public.teaching_assignments
  for select to authenticated using (public.is_staff() or public.is_admin());
drop policy if exists "Admin manage assignments" on public.teaching_assignments;
create policy "Admin manage assignments" on public.teaching_assignments
  for all to authenticated using (public.is_admin()) with check (public.is_admin());

```

