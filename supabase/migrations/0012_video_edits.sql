-- Migration 0012: Video edits — pipeline de edicion automatica de Reels
-- Fase 1 MVP: subir raw video -> transcribir (Whisper) -> cortar silencios -> subtitulos -> output

create table if not exists public.ci_video_edits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,

  -- Storage paths (en bucket 'video-edits')
  source_path text not null,        -- raw/{uuid}.mp4
  source_filename text,              -- nombre original que subio el usuario
  edited_path text,                  -- edited/{uuid}.mp4 (cuando termine)

  -- Estado del pipeline
  status text not null default 'pending'
    check (status in ('pending','uploading','transcribing','cutting','subtitling','done','error','cancelled')),
  error text,

  -- Resultado
  transcript jsonb,                  -- output completo de Whisper (palabras + timestamps)
  duration_seconds numeric,
  size_bytes bigint,

  -- Configuracion (extensible para fase 2: presets)
  preset text default 'default',
  custom_prompt text,                -- prompt opcional del usuario para futuras fases
  silence_threshold_ms int default 400,  -- silencios > esto se cortan

  -- Costes
  cost_usd numeric default 0,

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists idx_ci_video_edits_user on public.ci_video_edits (user_id, created_at desc);
create index if not exists idx_ci_video_edits_status on public.ci_video_edits (status) where status not in ('done','error','cancelled');

-- Trigger para updated_at
create or replace function public.touch_ci_video_edits_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_ci_video_edits on public.ci_video_edits;
create trigger trg_touch_ci_video_edits before update on public.ci_video_edits
for each row execute function public.touch_ci_video_edits_updated_at();

-- RLS
alter table public.ci_video_edits enable row level security;

drop policy if exists "admins manage all video_edits" on public.ci_video_edits;
create policy "admins manage all video_edits" on public.ci_video_edits
for all
using (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
)
with check (
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

-- Bucket de storage (creado via Storage API o este SQL si esta soportado)
-- Si falla por permisos, lo creamos desde el dashboard o admin client.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'video-edits',
  'video-edits',
  false,
  524288000, -- 500 MB
  array['video/mp4','video/quicktime','video/x-m4v']
)
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Storage policies para el bucket: solo admins
drop policy if exists "admins read video-edits" on storage.objects;
create policy "admins read video-edits" on storage.objects
for select
using (
  bucket_id = 'video-edits' and
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "admins write video-edits" on storage.objects;
create policy "admins write video-edits" on storage.objects
for insert
with check (
  bucket_id = 'video-edits' and
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "admins update video-edits" on storage.objects;
create policy "admins update video-edits" on storage.objects
for update
using (
  bucket_id = 'video-edits' and
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);

drop policy if exists "admins delete video-edits" on storage.objects;
create policy "admins delete video-edits" on storage.objects
for delete
using (
  bucket_id = 'video-edits' and
  exists (
    select 1 from public.profiles
    where profiles.id = auth.uid() and profiles.role = 'admin'
  )
);
