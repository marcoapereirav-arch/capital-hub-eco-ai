-- Preferencias de notificaciones por usuario (Marco 2026-07-08):
-- cada usuario decide qué tipos de aviso recibe (campana + push).
-- Sin fila = activado (default ON). Solo se guardan los apagados/encendidos explícitos.

create table if not exists public.notification_preferences (
  user_id uuid not null references auth.users(id) on delete cascade,
  pref text not null,
  enabled boolean not null default true,
  updated_at timestamptz not null default now(),
  primary key (user_id, pref)
);

alter table public.notification_preferences enable row level security;

drop policy if exists "notification_prefs_select_own" on public.notification_preferences;
create policy "notification_prefs_select_own"
  on public.notification_preferences for select
  using (auth.uid() = user_id);

drop policy if exists "notification_prefs_insert_own" on public.notification_preferences;
create policy "notification_prefs_insert_own"
  on public.notification_preferences for insert
  with check (auth.uid() = user_id);

drop policy if exists "notification_prefs_update_own" on public.notification_preferences;
create policy "notification_prefs_update_own"
  on public.notification_preferences for update
  using (auth.uid() = user_id);
