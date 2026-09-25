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
