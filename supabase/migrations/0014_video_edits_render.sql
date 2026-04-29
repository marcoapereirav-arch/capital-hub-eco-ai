-- Migration 0014: añadir columnas para integración con Shotstack (motor de render)
-- Estados ampliados: rendering = video en cola en Shotstack o renderizando

alter table public.ci_video_edits
  add column if not exists shotstack_render_id text,
  add column if not exists output_url text,
  add column if not exists render_started_at timestamptz,
  add column if not exists render_completed_at timestamptz;

-- Permitir el nuevo estado 'rendering' en el check constraint
alter table public.ci_video_edits drop constraint if exists ci_video_edits_status_check;
alter table public.ci_video_edits add constraint ci_video_edits_status_check
  check (status in ('pending','uploading','transcribing','cutting','subtitling','rendering','done','error','cancelled'));

create index if not exists idx_ci_video_edits_render on public.ci_video_edits (shotstack_render_id) where shotstack_render_id is not null;
