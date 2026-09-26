-- Annual fee ledger, live marks/payments, and secure learner-status guard.
-- Payments are pooled across the academic year regardless of the term selected
-- on the receipt. Excess is carried Term 1 -> Term 2 -> Term 3 -> annual credit.

create or replace function public.student_fee_ledger(p_student_id uuid)
returns table (
  term text,
  billed numeric,
  annual_paid numeric,
  allocated_paid numeric,
  arrears numeric,
  credit_after_term numeric
)
language sql
stable
security invoker
set search_path = ''
as $$
  with base as (
    select
      s.id as student_id,
      coalesce(c.fee_per_term, 0)::numeric as per_term,
      coalesce(sum(p.amount), 0)::numeric as paid
    from public.students s
    left join public.classes c on c.id = s.class_id
    left join public.payments p on p.student_id = s.id
    where s.id = p_student_id
    group by s.id, c.fee_per_term
  ),
  terms as (
    select * from (values
      ('Term 1'::text, 1),
      ('Term 2'::text, 2),
      ('Term 3'::text, 3)
    ) v(term, term_no)
  )
  select
    t.term,
    b.per_term as billed,
    b.paid as annual_paid,
    least(greatest(b.paid - ((t.term_no - 1) * b.per_term), 0), b.per_term) as allocated_paid,
    greatest(
      b.per_term - least(greatest(b.paid - ((t.term_no - 1) * b.per_term), 0), b.per_term),
      0
    ) as arrears,
    greatest(b.paid - (t.term_no * b.per_term), 0) as credit_after_term
  from base b
  cross join terms t
  order by t.term_no;
$$;

grant execute on function public.student_fee_ledger(uuid) to authenticated;

-- Secure learner status changes: administrator only.
create or replace function public.guard_student_status()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.status is distinct from old.status then
    if not exists (
      select 1
      from public.profiles p
      where p.id = (select auth.uid())
        and p.role = 'admin'
    ) then
      raise exception 'Only an administrator can change a learner''s status';
    end if;
  end if;
  return new;
end;
$$;

-- Live portal updates for marks and payments.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'grades'
  ) then
    alter publication supabase_realtime add table public.grades;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime'
      and schemaname = 'public'
      and tablename = 'payments'
  ) then
    alter publication supabase_realtime add table public.payments;
  end if;
end $$;
