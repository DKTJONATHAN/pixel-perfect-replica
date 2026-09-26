-- 006: admin-only learner status, Expelled status, Casual workers,
-- duty rota and teaching assignments. Paste into the Supabase SQL Editor and run once.

do $$ begin
  alter type public.student_status add value if not exists 'Expelled';
exception when duplicate_object then null; end $$;

do $$ begin
  alter type public.teacher_employment add value if not exists 'Casual';
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
