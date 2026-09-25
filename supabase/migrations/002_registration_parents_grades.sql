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
