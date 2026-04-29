-- ========================================================
-- Migration: 0006_meetings_segundo_cerebro
-- Fecha: 2026-04-19
-- PRP: PRP-003
-- Ajustes finales: matching por nombre (no email), aliases array,
--                  emails opcional, seed solo con nombres.
-- ========================================================

-- Extensiones
create extension if not exists pg_trgm;
create extension if not exists unaccent;

-- Wrapper IMMUTABLE de unaccent (requerido para indexar sobre unaccent)
-- Postgres: unaccent() es STABLE por defecto; los índices exigen IMMUTABLE.
create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
as $$
  select public.unaccent('public.unaccent', $1)
$$;

-- ========================================================
-- 1) team_members
-- ========================================================
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  aliases text[] not null default '{}',
  emails text[],
  role_label text,
  es_usuario_app boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create unique index team_members_full_name_unique_ci
  on public.team_members (lower(full_name));

create index team_members_name_trgm_idx
  on public.team_members using gin (public.immutable_unaccent(lower(full_name)) gin_trgm_ops);

alter table public.team_members enable row level security;

create policy "Admins manage team_members"
  on public.team_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed: solo nombres. Emails a enriquecer cuando el user los proporcione.
insert into public.team_members (full_name, aliases, role_label, es_usuario_app) values
  ('Marco',   '{}', 'Co-Founder',  true),
  ('Adrián',  '{}', 'Co-Founder',  true),
  ('JP',      '{}', 'Marketing',   false),
  ('Álex',    '{}', 'Operaciones', false),
  ('Patrick', '{}', 'Delivery',    false),
  ('Steven',  '{}', 'Delivery',    false);

-- ========================================================
-- 2) contacts (fichas externas)
-- ========================================================
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,
  phone text,
  company text,
  stage text check (stage in (
    'lead','prospect','discovery','proposal','client','churned','partner','other'
  )) default 'lead',
  origin text,
  tags text[] default '{}',
  notes text,
  slug text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index contacts_email_unique_ci
  on public.contacts (lower(email)) where email is not null;

create index contacts_name_trgm_idx
  on public.contacts using gin (public.immutable_unaccent(lower(full_name)) gin_trgm_ops);

alter table public.contacts enable row level security;

create policy "Admins manage contacts"
  on public.contacts for all
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================
-- 3) meetings (tabla central)
-- ========================================================
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  fathom_meeting_id text not null unique,
  title text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  fathom_share_url text,
  fathom_recording_url text,

  scope text not null check (scope in ('external','internal')),
  tipo text not null check (tipo in (
    'sales_discovery','sales_closing','client_onboarding','client_success',
    'team_daily','team_strategy','partner','delivery','otros'
  )),
  resultado text,
  funnel_stage text,

  resumen text,
  action_items jsonb default '[]'::jsonb,
  decisiones jsonb default '[]'::jsonb,

  transcript_raw text,
  transcript_language text default 'es',

  markdown_path text,

  status text not null default 'pending' check (status in (
    'pending','fetching','classifying','writing','processed','failed'
  )),
  processing_error text,
  retry_count integer not null default 0,
  processed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meetings_started_at_idx on public.meetings (started_at desc);
create index meetings_scope_tipo_idx on public.meetings (scope, tipo);
create index meetings_status_idx on public.meetings (status) where status <> 'processed';

alter table public.meetings enable row level security;

create policy "Admins manage meetings"
  on public.meetings for all
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================
-- 4) meeting_participants (M:N meetings ↔ contacts)
-- ========================================================
create table public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  match_status text not null default 'auto_email' check (match_status in (
    'auto_email','fuzzy_pending','confirmed','unmatched'
  )),
  match_score numeric(3,2),
  role text not null default 'participant' check (role in (
    'primary','participant','decision_maker','gatekeeper'
  )),
  raw_name text,
  raw_email text,
  created_at timestamptz not null default now()
);

-- UNIQUE tolerante a NULLs vía coalesce (Postgres estándar no deduplica NULLs)
create unique index meeting_participants_unique_idx
  on public.meeting_participants (
    meeting_id,
    coalesce(contact_id::text, ''),
    coalesce(raw_email, '')
  );

alter table public.meeting_participants enable row level security;

create policy "Admins manage meeting_participants"
  on public.meeting_participants for all
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================
-- 5) meeting_team_attendees (M:N meetings ↔ team_members)
-- ========================================================
create table public.meeting_team_attendees (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete restrict,
  role text default 'attendee',
  created_at timestamptz not null default now(),
  unique (meeting_id, team_member_id)
);

alter table public.meeting_team_attendees enable row level security;

create policy "Admins manage meeting_team_attendees"
  on public.meeting_team_attendees for all
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================
-- 6) meeting_insights (placeholder Fase 2 — tabla creada vacía)
-- ========================================================
create table public.meeting_insights (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  kind text not null check (kind in (
    'objecion','dolor','frase_textual','patron','cuello_botella','decision'
  )),
  content text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.meeting_insights enable row level security;

create policy "Admins manage meeting_insights"
  on public.meeting_insights for all
  using (public.is_admin())
  with check (public.is_admin());

-- ========================================================
-- Trigger de updated_at
-- ========================================================
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_meetings_touch before update on public.meetings
  for each row execute function public.touch_updated_at();

create trigger trg_contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();
