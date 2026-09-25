alter table public.profiles add column if not exists auth_user_id uuid;
create unique index if not exists profiles_auth_user_id_uidx on public.profiles(auth_user_id) where auth_user_id is not null;
create unique index if not exists profiles_login_id_uidx on public.profiles(lower(login_id)) where login_id is not null;

create or replace function public.is_admin() returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles where auth_user_id = auth.uid() and role in ('admin','registrar'));
$$;

create or replace function public.is_staff() returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles where auth_user_id = auth.uid() and role in ('admin','registrar','staff','teacher'));
$$;

create or replace function public.is_parent() returns boolean language sql stable security definer set search_path=public as $$
  select exists (select 1 from public.profiles where auth_user_id = auth.uid() and role = 'parent');
$$;

create or replace function public.register_account(p_login_id text,p_password text,p_full_name text,p_role text,p_parent_phone text default null)
returns json language plpgsql security definer set search_path=public as $$
declare uid uuid := gen_random_uuid(); lid text := lower(trim(p_login_id)); r public.app_role;
begin
 if lid is null or lid='' then raise exception 'Login ID is required'; end if;
 if p_password is null or length(p_password)<6 then raise exception 'Password must be at least 6 characters'; end if;
 if p_full_name is null or trim(p_full_name)='' then raise exception 'Full name is required'; end if;
 begin r:=p_role::public.app_role; exception when others then raise exception 'Invalid role: %',p_role; end;
 if r <> 'parent' and not public.is_admin() then raise exception 'Only an administrator or registrar can create school accounts'; end if;
 if r='admin' and not exists(select 1 from public.profiles where auth_user_id=auth.uid() and role='admin') then raise exception 'Only an administrator can create an administrator account'; end if;
 if exists(select 1 from public.credentials where login_id=lid) then raise exception 'This login ID is already registered'; end if;
 insert into public.profiles(id,email,full_name,role,login_id,parent_phone) values(uid,lid,trim(p_full_name),r,lid,p_parent_phone);
 insert into public.credentials(user_id,login_id,password_hash) values(uid,lid,extensions.crypt(p_password,extensions.gen_salt('bf')));
 return json_build_object('id',uid,'email',lid,'full_name',trim(p_full_name),'role',r,'student_id',null,'staff_id',null,'login_id',lid,'parent_phone',p_parent_phone);
end;
$$;

create or replace function public.link_auth_user(p_login_id text,p_password text,p_auth_user_id uuid)
returns json language plpgsql security definer set search_path=public as $$
declare lid text:=lower(trim(p_login_id)); cred public.credentials%rowtype; prof public.profiles%rowtype;
begin
 select * into cred from public.credentials where login_id=lid;
 if not found or cred.password_hash is distinct from extensions.crypt(p_password,cred.password_hash) then raise exception 'Invalid login credentials'; end if;
 select * into prof from public.profiles where id=cred.user_id;
 if not found then raise exception 'Profile missing'; end if;
 if prof.auth_user_id is not null and prof.auth_user_id<>p_auth_user_id then raise exception 'Account is already linked'; end if;
 update public.profiles set auth_user_id=p_auth_user_id,updated_at=now() where id=prof.id;
 return json_build_object('id',prof.id,'email',prof.email,'full_name',prof.full_name,'role',prof.role,'student_id',prof.student_id,'staff_id',prof.staff_id,'login_id',prof.login_id,'parent_phone',prof.parent_phone);
end;
$$;