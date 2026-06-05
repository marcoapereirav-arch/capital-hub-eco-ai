-- 0029_team_invitations.sql
-- Sistema BYOE (Bring Your Own Email Provider) para invitar miembros al equipo.
-- En lugar de usar emails de Supabase (4/hora en Free), generamos token nosotros
-- y enviamos email con Resend.

-- Extender profiles con campos de invitación + estado
alter table public.profiles
  add column if not exists invited_by uuid,
  add column if not exists invited_at timestamptz,
  add column if not exists active boolean not null default true;

-- Migrar roles existentes a la nueva taxonomía
-- admin → super_admin (mantienen todos los permisos)
update public.profiles set role = 'super_admin' where role = 'admin';

-- Constraint de roles permitidos
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_role_check') then
    alter table public.profiles add constraint profiles_role_check
      check (role in ('super_admin', 'closer', 'formador', 'equipo'));
  end if;
end$$;

-- Tabla de invitaciones pendientes
create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  full_name text not null,
  role text not null check (role in ('super_admin', 'closer', 'formador', 'equipo')),
  token text not null unique,
  invited_by uuid references public.profiles(id) on delete set null,
  invited_by_name text,
  expires_at timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  user_id uuid,  -- se rellena al aceptar (apunta a auth.users.id)
  created_at timestamptz not null default now()
);
create unique index if not exists uniq_team_invitations_email_pending
  on public.team_invitations(lower(email))
  where accepted_at is null;
create index if not exists idx_team_invitations_token on public.team_invitations(token);

-- RLS
alter table public.team_invitations enable row level security;
drop policy if exists "service_role_all_invitations" on public.team_invitations;
create policy "service_role_all_invitations" on public.team_invitations for all to service_role using (true) with check (true);
drop policy if exists "auth_read_invitations" on public.team_invitations;
create policy "auth_read_invitations" on public.team_invitations for select to authenticated using (true);

-- Función helper: comprobar si un user es super_admin
create or replace function public.is_super_admin(uid uuid) returns boolean
language sql security definer stable as $$
  select exists(select 1 from public.profiles where id = uid and role = 'super_admin' and active = true)
$$;
