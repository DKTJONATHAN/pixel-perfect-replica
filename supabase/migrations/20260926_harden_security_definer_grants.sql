-- Harden API grants for SECURITY DEFINER helpers.
-- Login remains public because unauthenticated users must be able to sign in.
-- Account creation and account-linking are admin/authenticated operations.

revoke execute on function public.guard_student_status() from public, anon, authenticated;

revoke execute on function public.register_account(text, text, text, text, text) from public, anon;
grant execute on function public.register_account(text, text, text, text, text) to authenticated, service_role;

revoke execute on function public.register_account_with_email(text, text, text, text, text, text) from public, anon;
grant execute on function public.register_account_with_email(text, text, text, text, text, text) to authenticated, service_role;

revoke execute on function public.link_auth_user(text, text, uuid) from public, anon;
grant execute on function public.link_auth_user(text, text, uuid) to authenticated, service_role;

revoke execute on function public.is_admin() from public, anon;
revoke execute on function public.is_staff() from public, anon;
revoke execute on function public.is_parent() from public, anon;

grant execute on function public.is_admin() to authenticated, service_role;
grant execute on function public.is_staff() to authenticated, service_role;
grant execute on function public.is_parent() to authenticated, service_role;
