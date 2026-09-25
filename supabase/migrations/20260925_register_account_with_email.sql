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
