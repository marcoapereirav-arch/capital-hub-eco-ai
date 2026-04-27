-- Modulo Webs + CRM (Fase 0 — Fundacion).
-- Webs: funnels, lead magnets y futuras "presentaciones, etc." centralizadas en el OS.
-- CRM: pipeline kanban de opportunities (de funnels propios + ghl_opportunities_cache).
-- RLS: admin full read+write via is_admin() (0005). Lectura publica solo para webs publicadas y sus steps (sirven landings publicas).

-- =========================================
-- WEBS (funnels, lead magnets, etc.)
-- =========================================
create table if not exists public.webs (
  id text primary key default gen_random_uuid()::text,
  type text not null check (type in ('funnel', 'lead_magnet', 'presentation', 'other')),
  slug text not null unique,
  name text not null,
  description text default '',
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_webs_type on public.webs(type);
create index if not exists idx_webs_status on public.webs(status);
create index if not exists idx_webs_slug on public.webs(slug);

alter table public.webs enable row level security;

drop policy if exists "Admins manage webs" on public.webs;
create policy "Admins manage webs" on public.webs
  for all using (public.is_admin()) with check (public.is_admin());

-- Lectura publica solo para webs publicadas (necesario para servir las landings)
drop policy if exists "Public read published webs" on public.webs;
create policy "Public read published webs" on public.webs
  for select using (status = 'published');

-- =========================================
-- WEB STEPS (cada step de un funnel: landing, checkout, thank-you...)
-- =========================================
create table if not exists public.web_steps (
  id text primary key default gen_random_uuid()::text,
  web_id text not null references public.webs(id) on delete cascade,
  slug text not null,
  name text not null,
  position integer not null default 0,
  is_entry boolean not null default false,
  description text default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (web_id, slug)
);

create index if not exists idx_web_steps_web on public.web_steps(web_id, position);

alter table public.web_steps enable row level security;

drop policy if exists "Admins manage web_steps" on public.web_steps;
create policy "Admins manage web_steps" on public.web_steps
  for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "Public read web_steps of published webs" on public.web_steps;
create policy "Public read web_steps of published webs" on public.web_steps
  for select using (
    exists (
      select 1 from public.webs
      where webs.id = web_steps.web_id and webs.status = 'published'
    )
  );

-- =========================================
-- WEB EVENTS (analytics propias: visit, click_cta, form_submit, lead, purchase, custom)
-- =========================================
create table if not exists public.web_events (
  id bigserial primary key,
  web_id text references public.webs(id) on delete cascade,
  step_id text references public.web_steps(id) on delete set null,
  event_type text not null,
  visitor_id text,
  session_id text,
  utm_source text,
  utm_medium text,
  utm_campaign text,
  utm_content text,
  utm_term text,
  referrer text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists idx_web_events_web_created on public.web_events(web_id, created_at desc);
create index if not exists idx_web_events_step on public.web_events(step_id);
create index if not exists idx_web_events_type on public.web_events(event_type);
create index if not exists idx_web_events_visitor on public.web_events(visitor_id);

alter table public.web_events enable row level security;

drop policy if exists "Admins read web_events" on public.web_events;
create policy "Admins read web_events" on public.web_events
  for select using (public.is_admin());

-- INSERT publico: el tracker JS desde landings publicas necesita poder escribir.
-- Validacion adicional la hara el endpoint /api/webs/event (rate limit, sanitize).
drop policy if exists "Public insert web_events" on public.web_events;
create policy "Public insert web_events" on public.web_events
  for insert with check (true);

-- =========================================
-- META PIXEL CONFIG (un pixel por web, opcionalmente)
-- =========================================
create table if not exists public.meta_pixel_config (
  id text primary key default gen_random_uuid()::text,
  web_id text not null unique references public.webs(id) on delete cascade,
  pixel_id text not null,
  capi_access_token text,
  test_event_code text,
  events_mapping jsonb default '{}'::jsonb,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.meta_pixel_config enable row level security;

drop policy if exists "Admins manage meta_pixel_config" on public.meta_pixel_config;
create policy "Admins manage meta_pixel_config" on public.meta_pixel_config
  for all using (public.is_admin()) with check (public.is_admin());

-- Lectura publica del pixel_id (lo necesita el navegador) pero no del access_token.
-- El access_token solo se usa server-side desde /api/meta/capi.
drop policy if exists "Public read pixel_id of published webs" on public.meta_pixel_config;
create policy "Public read pixel_id of published webs" on public.meta_pixel_config
  for select using (
    enabled = true
    and exists (
      select 1 from public.webs
      where webs.id = meta_pixel_config.web_id and webs.status = 'published'
    )
  );

-- =========================================
-- CRM PIPELINES (varios pipelines posibles: ventas, partners, etc.)
-- =========================================
create table if not exists public.crm_pipelines (
  id text primary key default gen_random_uuid()::text,
  name text not null,
  description text default '',
  position integer not null default 0,
  is_default boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.crm_pipelines enable row level security;

drop policy if exists "Admins manage crm_pipelines" on public.crm_pipelines;
create policy "Admins manage crm_pipelines" on public.crm_pipelines
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================
-- CRM STAGES (columnas del kanban por pipeline)
-- =========================================
create table if not exists public.crm_stages (
  id text primary key default gen_random_uuid()::text,
  pipeline_id text not null references public.crm_pipelines(id) on delete cascade,
  name text not null,
  position integer not null default 0,
  color text default '#94a3b8',
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crm_stages_pipeline on public.crm_stages(pipeline_id, position);

alter table public.crm_stages enable row level security;

drop policy if exists "Admins manage crm_stages" on public.crm_stages;
create policy "Admins manage crm_stages" on public.crm_stages
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================
-- CRM OPPORTUNITIES (cards del kanban — vienen de funnels propios o GHL)
-- =========================================
create table if not exists public.crm_opportunities (
  id text primary key default gen_random_uuid()::text,
  pipeline_id text not null references public.crm_pipelines(id) on delete cascade,
  stage_id text not null references public.crm_stages(id) on delete restrict,
  position integer not null default 0,
  name text not null,
  value numeric default 0,
  currency text default 'EUR',
  contact_name text,
  contact_email text,
  contact_phone text,
  source_type text not null default 'manual' check (source_type in ('manual', 'funnel', 'ghl', 'import')),
  source_id text,
  owner_id uuid references auth.users(id) on delete set null,
  notes text default '',
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  closed_at timestamptz
);

create index if not exists idx_crm_opps_pipeline_stage on public.crm_opportunities(pipeline_id, stage_id, position);
create index if not exists idx_crm_opps_source on public.crm_opportunities(source_type, source_id);
create index if not exists idx_crm_opps_owner on public.crm_opportunities(owner_id);

alter table public.crm_opportunities enable row level security;

drop policy if exists "Admins manage crm_opportunities" on public.crm_opportunities;
create policy "Admins manage crm_opportunities" on public.crm_opportunities
  for all using (public.is_admin()) with check (public.is_admin());

-- =========================================
-- updated_at triggers (reusan tasks_set_updated_at — funcion generica)
-- =========================================
drop trigger if exists webs_set_updated_at on public.webs;
create trigger webs_set_updated_at before update on public.webs
  for each row execute function public.tasks_set_updated_at();

drop trigger if exists web_steps_set_updated_at on public.web_steps;
create trigger web_steps_set_updated_at before update on public.web_steps
  for each row execute function public.tasks_set_updated_at();

drop trigger if exists meta_pixel_config_set_updated_at on public.meta_pixel_config;
create trigger meta_pixel_config_set_updated_at before update on public.meta_pixel_config
  for each row execute function public.tasks_set_updated_at();

drop trigger if exists crm_pipelines_set_updated_at on public.crm_pipelines;
create trigger crm_pipelines_set_updated_at before update on public.crm_pipelines
  for each row execute function public.tasks_set_updated_at();

drop trigger if exists crm_stages_set_updated_at on public.crm_stages;
create trigger crm_stages_set_updated_at before update on public.crm_stages
  for each row execute function public.tasks_set_updated_at();

drop trigger if exists crm_opportunities_set_updated_at on public.crm_opportunities;
create trigger crm_opportunities_set_updated_at before update on public.crm_opportunities
  for each row execute function public.tasks_set_updated_at();

-- =========================================
-- REALTIME (idempotente) — solo tablas que cambian con frecuencia en uso interactivo
-- =========================================
do $$
begin
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='webs') then
    alter publication supabase_realtime add table public.webs;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='web_steps') then
    alter publication supabase_realtime add table public.web_steps;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='crm_opportunities') then
    alter publication supabase_realtime add table public.crm_opportunities;
  end if;
  if not exists (select 1 from pg_publication_tables where pubname='supabase_realtime' and schemaname='public' and tablename='crm_stages') then
    alter publication supabase_realtime add table public.crm_stages;
  end if;
end $$;

-- =========================================
-- SEED minimo: pipeline default "Ventas"
-- =========================================
insert into public.crm_pipelines (id, name, description, position, is_default)
values ('pip_ventas', 'Ventas', 'Pipeline principal de ventas', 0, true)
on conflict (id) do nothing;

insert into public.crm_stages (id, pipeline_id, name, position, color, is_won, is_lost) values
  ('stg_lead',        'pip_ventas', 'Lead',          0, '#94a3b8', false, false),
  ('stg_qualified',   'pip_ventas', 'Cualificado',   1, '#60a5fa', false, false),
  ('stg_call_booked', 'pip_ventas', 'Llamada agendada', 2, '#a78bfa', false, false),
  ('stg_proposal',    'pip_ventas', 'Propuesta',     3, '#facc15', false, false),
  ('stg_won',         'pip_ventas', 'Ganado',        4, '#22c55e', true,  false),
  ('stg_lost',        'pip_ventas', 'Perdido',       5, '#ef4444', false, true)
on conflict (id) do nothing;
