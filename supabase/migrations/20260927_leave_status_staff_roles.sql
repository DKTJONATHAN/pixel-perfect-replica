-- Adds:
--   1. Admin-only enforcement on student status changes (Active/Suspended/
--      Expelled cannot be set by regular staff, only admin/registrar) —
--      belt-and-braces alongside the UI restriction.
--   2. 'Casual' as a pay-group option, and widens teacher_employment so any
--      staff member (not just teachers) can be tagged TSC/BOM/PTA/Casual —
--      this funds salary reporting for BOM, PTA and casual workers.
--   3. class_teachers: optional, many-to-many teacher <-> class assignments,
--      separate from the single required "class teacher" on classes.teacher_id.
--   4. duty_roles: rotating role assignments (e.g. "Teacher on duty") for a
--      given week, assignable by admin only.

-- ---------------------------------------------------------------------------
-- 1. Student status is admin/registrar-controlled only
-- ---------------------------------------------------------------------------
create or replace function public.enforce_student_status_admin_only()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (tg_op = 'UPDATE') and (new.status is distinct from old.status) and not public.is_admin() then
    raise exception 'Only an administrator or registrar can change a student''s status.';
  end if;
  return new;
end;
$$;

drop trigger if exists trg_student_status_admin_only on public.students;
create trigger trg_student_status_admin_only
  before update on public.students
  for each row execute function public.enforce_student_status_admin_only();

-- ---------------------------------------------------------------------------
-- 2. Pay groups: add Casual; the column already applies at the database
--    level to any staff row, we're just extending the allowed values and
--    dropping the "teachers only" framing in the UI layer.
-- ---------------------------------------------------------------------------
do $$ begin
  alter type public.teacher_employment add value if not exists 'Casual';
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- 3. Optional multi-class teacher assignments (subject teachers, co-teachers)
-- ---------------------------------------------------------------------------
create table if not exists public.class_teachers (
  id uuid primary key default gen_random_uuid(),
  class_id uuid not null references public.classes (id) on delete cascade,
  staff_id uuid not null references public.staff (id) on delete cascade,
  note text,
  created_at timestamptz not null default now(),
  unique (class_id, staff_id)
);

alter table public.class_teachers enable row level security;

drop policy if exists "Read class teachers" on public.class_teachers;
create policy "Read class teachers" on public.class_teachers
  for select using (auth.role() = 'authenticated');

drop policy if exists "Admin manage class teachers" on public.class_teachers;
create policy "Admin manage class teachers" on public.class_teachers
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.class_teachers to authenticated;
grant insert, update, delete on public.class_teachers to authenticated;

-- ---------------------------------------------------------------------------
-- 4. Rotating duty roles (e.g. "Teacher on duty") for a given week
-- ---------------------------------------------------------------------------
create table if not exists public.duty_roles (
  id uuid primary key default gen_random_uuid(),
  staff_id uuid not null references public.staff (id) on delete cascade,
  role_name text not null,
  week_start date not null,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.duty_roles enable row level security;

drop policy if exists "Read duty roles" on public.duty_roles;
create policy "Read duty roles" on public.duty_roles
  for select using (auth.role() = 'authenticated');

drop policy if exists "Admin manage duty roles" on public.duty_roles;
create policy "Admin manage duty roles" on public.duty_roles
  for all using (public.is_admin()) with check (public.is_admin());

grant select on public.duty_roles to authenticated;
grant insert, update, delete on public.duty_roles to authenticated;
