-- ============================================================
-- Migration: 0008_content_intel
-- PRP: PRP-004
-- Feature: Content Intel (análisis IG + generación de guiones).
-- Platform-agnostic desde día 1 (instagram + youtube + tiktok).
-- Sistema semántico completo con pgvector + Gemini embeddings (768d).
-- ============================================================

create extension if not exists vector;

-- ============================================================
-- 1) ci_seed_accounts
-- ============================================================
create table public.ci_seed_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram','youtube','tiktok')),
  handle text not null,
  display_name text,
  notes text,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  sync_status text not null default 'idle' check (sync_status in ('idle','running','ok','error')),
  sync_error text,
  video_count integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, handle)
);

create index ci_seed_accounts_platform_active_idx on public.ci_seed_accounts (platform, is_active);

alter table public.ci_seed_accounts enable row level security;

create policy "Admins manage ci_seed_accounts"
  on public.ci_seed_accounts for all
  using (public.is_admin()) with check (public.is_admin());

insert into public.ci_seed_accounts (platform, handle) values
  ('instagram','pedrobuerbaum'),
  ('instagram','enrique.vv'),
  ('instagram','jaimehigueraes'),
  ('instagram','carlos_esparraga4'),
  ('instagram','dollardoradoyt'),
  ('instagram','giuliano.c'),
  ('instagram','ramiro.cubria');

-- ============================================================
-- 2) ci_videos
-- ============================================================
create table public.ci_videos (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ci_seed_accounts(id) on delete cascade,
  platform text not null check (platform in ('instagram','youtube','tiktok')),
  external_id text not null,
  url text not null,
  caption text,
  posted_at timestamptz,
  duration_s integer,
  views bigint,
  likes bigint,
  comments bigint,
  engagement_rate numeric generated always as (
    case when coalesce(views, 0) > 0
      then (coalesce(likes, 0) + coalesce(comments, 0))::numeric / views
      else null
    end
  ) stored,
  is_reel boolean,
  video_url text,
  thumbnail_url text,
  raw jsonb,
  transcript text,
  transcript_language text,
  transcript_model text,
  transcript_cost_usd numeric,
  transcript_status text not null default 'pending' check (transcript_status in ('pending','running','ok','error','skipped')),
  transcript_error text,
  transcribed_at timestamptz,
  analysis jsonb,
  analyzed_at timestamptz,
  embedding vector(768),
  embedded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_id)
);

create index ci_videos_account_idx on public.ci_videos (account_id);
create index ci_videos_views_idx on public.ci_videos (views desc nulls last);
create index ci_videos_posted_idx on public.ci_videos (posted_at desc nulls last);
create index ci_videos_engagement_idx on public.ci_videos (engagement_rate desc nulls last);
create index ci_videos_transcript_status_idx on public.ci_videos (transcript_status);
create index ci_videos_embedding_idx on public.ci_videos using ivfflat (embedding vector_cosine_ops) with (lists = 100);

alter table public.ci_videos enable row level security;

create policy "Admins manage ci_videos"
  on public.ci_videos for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 3) ci_queries
-- ============================================================
create table public.ci_queries (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  account_ids uuid[] not null default '{}',
  filters jsonb not null default '{}'::jsonb,
  videos_used uuid[] not null default '{}',
  response_markdown text,
  model text,
  tokens_used integer,
  cost_usd numeric,
  status text not null default 'running' check (status in ('running','ok','error')),
  error text,
  created_at timestamptz not null default now()
);

create index ci_queries_created_idx on public.ci_queries (created_at desc);
create index ci_queries_status_idx on public.ci_queries (status) where status <> 'ok';

alter table public.ci_queries enable row level security;

create policy "Admins manage ci_queries"
  on public.ci_queries for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 4) ci_scripts — snapshot completo de playbook+avatar para reproducibilidad
-- ============================================================
create table public.ci_scripts (
  id uuid primary key default gen_random_uuid(),
  brief text not null,
  platform text not null check (platform in ('instagram','youtube','tiktok')),
  duration_target_s integer,
  content_pillar text,
  reference_video_ids uuid[] not null default '{}',
  playbook_snapshot_text text,
  playbook_snapshot_hash text,
  avatar_snapshot_text text,
  avatar_snapshot_hash text,
  prompt_used text,
  llm_output jsonb,
  llm_output_markdown text,
  user_edited_markdown text,
  status text not null default 'draft' check (status in ('draft','ready','published','archived')),
  model text,
  tokens_used integer,
  cost_usd numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index ci_scripts_status_idx on public.ci_scripts (status);
create index ci_scripts_created_idx on public.ci_scripts (created_at desc);

alter table public.ci_scripts enable row level security;

create policy "Admins manage ci_scripts"
  on public.ci_scripts for all
  using (public.is_admin()) with check (public.is_admin());

-- ============================================================
-- 5) match_videos — semantic retrieval sobre ci_videos
-- security invoker: RLS de ci_videos aplica, solo admins reciben resultados.
-- ============================================================
create or replace function public.match_videos(
  query_embedding vector(768),
  match_threshold float default 0.5,
  match_count integer default 20,
  filter_account_ids uuid[] default null,
  filter_platform text default null,
  filter_min_views bigint default null
)
returns table (
  id uuid,
  account_id uuid,
  platform text,
  external_id text,
  url text,
  caption text,
  views bigint,
  likes bigint,
  comments bigint,
  transcript text,
  similarity float
)
language sql
stable
security invoker
set search_path = public, pg_temp
as $$
  select
    v.id, v.account_id, v.platform, v.external_id, v.url, v.caption,
    v.views, v.likes, v.comments, v.transcript,
    1 - (v.embedding <=> query_embedding) as similarity
  from public.ci_videos v
  where v.embedding is not null
    and v.transcript is not null
    and 1 - (v.embedding <=> query_embedding) >= match_threshold
    and (filter_account_ids is null or v.account_id = any(filter_account_ids))
    and (filter_platform is null or v.platform = filter_platform)
    and (filter_min_views is null or coalesce(v.views, 0) >= filter_min_views)
  order by v.embedding <=> query_embedding
  limit match_count
$$;

-- ============================================================
-- 6) Triggers updated_at (reutiliza touch_updated_at de 0006)
-- ============================================================
create trigger trg_ci_seed_accounts_touch before update on public.ci_seed_accounts
  for each row execute function public.touch_updated_at();

create trigger trg_ci_videos_touch before update on public.ci_videos
  for each row execute function public.touch_updated_at();

create trigger trg_ci_scripts_touch before update on public.ci_scripts
  for each row execute function public.touch_updated_at();
