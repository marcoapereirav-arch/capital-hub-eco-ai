-- Acceso compartido para admins: conexiones y metricas las ven todos los admins

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

-- api_connections
drop policy if exists "Users manage own connections" on public.api_connections;

alter table public.api_connections drop constraint if exists api_connections_user_id_platform_key;
delete from public.api_connections a
  using public.api_connections b
  where a.platform = b.platform
    and a.updated_at < b.updated_at;
alter table public.api_connections add constraint api_connections_platform_key unique (platform);

create policy "Admins manage all connections"
  on public.api_connections for all
  using (public.is_admin())
  with check (public.is_admin());

-- metrics_cache
drop policy if exists "Users read own metrics" on public.metrics_cache;
drop policy if exists "Users write own metrics" on public.metrics_cache;

alter table public.metrics_cache drop constraint if exists metrics_cache_user_id_platform_metric_key_key;
delete from public.metrics_cache a
  using public.metrics_cache b
  where a.platform = b.platform
    and a.metric_key = b.metric_key
    and a.fetched_at < b.fetched_at;
alter table public.metrics_cache add constraint metrics_cache_platform_metric_key_key unique (platform, metric_key);

create policy "Admins manage all metrics"
  on public.metrics_cache for all
  using (public.is_admin())
  with check (public.is_admin());

-- metrics_snapshots
drop policy if exists "Users read own snapshots" on public.metrics_snapshots;
drop policy if exists "Users write own snapshots" on public.metrics_snapshots;

alter table public.metrics_snapshots drop constraint if exists metrics_snapshots_user_id_platform_metric_key_snapshot_date_key;
delete from public.metrics_snapshots a
  using public.metrics_snapshots b
  where a.platform = b.platform
    and a.metric_key = b.metric_key
    and a.snapshot_date = b.snapshot_date
    and a.created_at < b.created_at;
alter table public.metrics_snapshots
  add constraint metrics_snapshots_platform_metric_key_date_key
  unique (platform, metric_key, snapshot_date);

create policy "Admins manage all snapshots"
  on public.metrics_snapshots for all
  using (public.is_admin())
  with check (public.is_admin());
