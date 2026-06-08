-- 0030_student_invites.sql
-- Sistema BYOE para invitar alumnos a la App tras compra.
-- El OS genera el token y envia magic link via Resend. La App
-- (app.capitalhubapp.com/accept-invite/[token]) valida el token y deja al
-- alumno configurar contrasena.

create table if not exists public.student_invites (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid references public.contacts(id) on delete set null,
  email text not null,
  full_name text not null,
  products text[] not null default '{}',  -- a que formaciones tiene acceso
  token text not null unique,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  user_id uuid,  -- se rellena al aceptar (apunta a auth.users.id de la App)
  invited_by uuid references public.profiles(id) on delete set null,
  invited_by_name text,
  metadata jsonb,  -- ej { revenue, cash_collected, payment_method }
  created_at timestamptz not null default now()
);

create unique index if not exists uniq_student_invites_email_pending
  on public.student_invites(lower(email))
  where accepted_at is null;
create index if not exists idx_student_invites_token on public.student_invites(token);
create index if not exists idx_student_invites_contact on public.student_invites(contact_id);

alter table public.student_invites enable row level security;
drop policy if exists "service_role_all_student_invites" on public.student_invites;
create policy "service_role_all_student_invites" on public.student_invites for all to service_role using (true) with check (true);
drop policy if exists "auth_read_student_invites" on public.student_invites;
create policy "auth_read_student_invites" on public.student_invites for select to authenticated using (true);
