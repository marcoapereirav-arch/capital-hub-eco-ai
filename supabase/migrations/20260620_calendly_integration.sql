-- Integración Calendly API + Webhooks.
-- PAT del workspace Capital Hub (Adrián) en .env.local CALENDLY_PERSONAL_ACCESS_TOKEN.
-- El signing_key del webhook se obtiene al crearlo programáticamente y se guarda
-- en calendly_config (no hace falta env var manual).

create table if not exists public.calendly_config (
  id int primary key default 1 check (id = 1),
  organization_uri text not null,
  user_uri text,
  user_email text,
  user_name text,
  user_timezone text,
  scheduling_url text,
  webhook_uri text,
  webhook_signing_key text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.calendly_config enable row level security;
create policy "super_admin manage calendly_config"
  on public.calendly_config for all
  to authenticated
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'))
  with check (exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin'));

create table if not exists public.calendly_event_types (
  uri text primary key,
  name text not null,
  slug text,
  scheduling_url text,
  duration int,
  active boolean default true,
  color text,
  internal_note text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.calendly_event_types enable row level security;
create policy "authenticated read calendly_event_types"
  on public.calendly_event_types for select to authenticated using (true);

create table if not exists public.calendly_scheduled_events (
  uri text primary key,
  name text,
  start_time timestamptz,
  end_time timestamptz,
  status text,
  location_kind text,
  location_uri text,
  meeting_url text,
  event_type_uri text references public.calendly_event_types(uri) on delete set null,
  invitee_uri text,
  invitee_email text,
  invitee_name text,
  invitee_phone text,
  invitee_cancellation_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists idx_cal_events_start on public.calendly_scheduled_events(start_time desc);
create index if not exists idx_cal_events_email on public.calendly_scheduled_events(invitee_email);
alter table public.calendly_scheduled_events enable row level security;
create policy "authenticated read calendly_scheduled_events"
  on public.calendly_scheduled_events for select to authenticated using (true);
