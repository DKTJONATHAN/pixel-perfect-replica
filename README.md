# KidRight Academy

Production school management platform for **KidRight Academy** — public website plus Student, Staff, and Admin portals backed by **Supabase**.

## Features

- Public landing page (about, programs, contact, portal links)
- **Student portal** — profile, grades, attendance, fee balance
- **Staff portal** — classes, students, attendance, grades
- **Admin portal** — full school ops (students, staff, fees, leave, payroll, settings)
- Real authentication via Supabase Auth
- Row Level Security on all tables

## Setup

### 1. Supabase project

1. Create a project at [supabase.com](https://supabase.com)
2. Open **SQL Editor** and run the full script in [`supabase/schema.sql`](supabase/schema.sql)
3. Under **Authentication → Providers**, ensure Email is enabled
4. Copy **Project URL** and **anon public** key from **Project Settings → API**

### 2. Environment

```bash
cp .env.example .env.local
```

Fill in:

```
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

Never commit `.env.local` or the **service_role** key.

### 3. Create users

In Supabase **Authentication → Users**, create users (or use sign-up). Then set their role in `profiles`:

```sql
-- After the user exists in auth.users / profiles:
update public.profiles
set role = 'admin', full_name = 'Robert Kimani'
where email = 'admin@kidright.ac.ke';

update public.profiles
set role = 'staff', full_name = 'Grace Wanjiku'
where email = 'teacher@kidright.ac.ke';

update public.profiles
set role = 'student', full_name = 'Amina Otieno'
where email = 'student@kidright.ac.ke';
```

Link staff/student rows when ready:

```sql
update public.profiles
set staff_id = (select id from public.staff where email = 'teacher@kidright.ac.ke' limit 1)
where email = 'teacher@kidright.ac.ke';

update public.profiles
set student_id = (select id from public.students where admission_no = 'KRA/2026/0001' limit 1)
where email = 'student@kidright.ac.ke';
```

### 4. Run locally

```bash
bun install   # or npm install
bun run dev   # or npm run dev
```

### 5. Deploy (Cloudflare)

```bash
bun run build
bun run deploy
```

Set the same `VITE_SUPABASE_*` variables in your Cloudflare project environment.

## Routes

| Path | Description |
|------|-------------|
| `/` | Public landing |
| `/login` | Portal picker |
| `/login/student` | Student sign-in |
| `/login/staff` | Staff sign-in |
| `/login/admin` | Admin sign-in |
| `/student` | Student dashboard |
| `/staff` | Staff dashboard |
| `/admin` | Admin dashboard |
| `/admin/students` etc. | Admin management sections |

## Stack

- TanStack Start + React 19 + Vite 8
- Tailwind CSS 4
- Supabase (Auth + Postgres + RLS)
- Cloudflare Workers (Nitro `cloudflare_module`)
