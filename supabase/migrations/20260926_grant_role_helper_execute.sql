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
