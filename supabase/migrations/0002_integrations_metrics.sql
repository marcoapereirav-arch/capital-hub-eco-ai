-- API connections (una por usuario+plataforma)
create table public.api_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  platform text not null check (platform in ('ghl', 'meta_ads', 'youtube', 'instagram')),
  status text not null default 'disconnected' check (status in ('connected', 'disconnected', 'error')),
  credentials jsonb,
  last_sync_at timestamptz,
  last_error text,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null,
  unique (user_id, platform)
);

alter table public.api_connections enable row level security;

create policy "Users manage own connections"
  on public.api_connections for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Cache de metricas actuales (una fila por user+platform+metric_key)
create table public.metrics_cache (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  platform text not null check (platform in ('ghl', 'meta_ads', 'youtube', 'instagram')),
  metric_key text not null,
  value numeric,
  value_text text,
  metadata jsonb default '{}'::jsonb,
  fetched_at timestamptz default now() not null,
  unique (user_id, platform, metric_key)
);

alter table public.metrics_cache enable row level security;

create policy "Users read own metrics"
  on public.metrics_cache for select
  using (auth.uid() = user_id);

create policy "Users write own metrics"
  on public.metrics_cache for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Historico diario
create table public.metrics_snapshots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  platform text not null,
  metric_key text not null,
  value numeric,
  snapshot_date date not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now() not null,
  unique (user_id, platform, metric_key, snapshot_date)
);

create index idx_metrics_snapshots_user_platform_date
  on public.metrics_snapshots (user_id, platform, snapshot_date desc);

alter table public.metrics_snapshots enable row level security;

create policy "Users read own snapshots"
  on public.metrics_snapshots for select
  using (auth.uid() = user_id);

create policy "Users write own snapshots"
  on public.metrics_snapshots for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
