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
