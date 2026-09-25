-- profiles was tied to Supabase Auth users. Login-id auth uses its own UUIDs,
-- so remove the FK to auth.users.

alter table public.profiles drop constraint if exists profiles_id_fkey;

-- Optional: ensure id has a default for other inserts
-- (register_account already supplies id explicitly)
