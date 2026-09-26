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
