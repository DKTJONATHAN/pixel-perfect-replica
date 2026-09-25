# KidRight Academy

Production school platform: public site + Student, Staff/Teacher, Parent, and Admin/Registrar portals on **Supabase**.

## Portals & login

| Portal | Path | Sign-in ID |
|--------|------|------------|
| Student | `/login/student` → `/student` | **Admission number** + password |
| Staff / Teacher | `/login/staff` → `/staff` | **10-digit staff number** + password |
| Parent | `/login/parent` → `/parent` | Phone or email + password |
| Admin / Registrar | `/login/admin` → `/admin` | Email + password |

Accounts are **created by the registrar** after employment or admission (not self-serve public sign-up).

## Registrar registration (`/admin/register`)

- **Teacher** — subject combination, TSC yes/no (TSC number or BOM/PTA), auto **10-digit unique staff number**
- **Support staff** — department (Kitchen, Cleaning, Transport, Security, …), job title, staff number
- **Student** — admission number, class/stream, guardian, password
- **Parent** — phone/email, password, link to one or more students

## Teacher marks (`/staff/marks`)

Enter scores per subject/class/term. The system calculates **totals, averages, letter grades** live. Students and parents see the same numbers in real time after save.

## Parent portal

- Subject breakdown, term total/average, class position
- Fees paid vs arrears
- **Export to Excel (CSV)** for performance and fee history

## Supabase setup

1. Run [`supabase/schema.sql`](supabase/schema.sql)
2. Run [`supabase/migrations/002_registration_parents_grades.sql`](supabase/migrations/002_registration_parents_grades.sql)
3. Copy `.env.example` → `.env.local` with `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
4. Create an initial **admin/registrar** user in Supabase Auth, then:

```sql
update public.profiles
set role = 'registrar', full_name = 'School Registrar'
where email = 'registrar@yourschool.ac.ke';
```

5. Disable public sign-up in Supabase Auth settings if you only want registrar-created accounts (or keep sign-up restricted).

### Auth email note

Staff numbers and admission numbers map to internal emails (`{staffNo}@staff.kidright.internal`, etc.) so Supabase Auth can store passwords. Users only ever type their **staff number** or **admission number** on the login form.

## Local run

```bash
bun install
bun run dev
```

## Deploy

```bash
bun run build
bun run deploy
```

Set the same `VITE_SUPABASE_*` variables in Cloudflare.
