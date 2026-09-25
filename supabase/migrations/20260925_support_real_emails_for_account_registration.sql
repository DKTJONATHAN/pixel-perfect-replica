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
