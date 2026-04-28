-- ============================================================================
-- Migration 0015: Brand Pack + Video Presets
--
-- Codifica el playbook de edicion de Adrian Villanueva (Capital Hub):
--   - ci_brand_pack: 1 fila por marca con tokens visuales/sonoros
--   - ci_video_presets: N filas (una por variante visual del playbook)
--
-- Tambien anade columnas a ci_video_edits para soportar:
--   - preset_slug: que variante visual se uso
--   - headline_text: texto de la barra superior en Variante 2
--   - piece_type: A/B/C/D segun playbook
--   - cta_word: palabra a comentar (Tipo B)
-- ============================================================================

create table if not exists public.ci_brand_pack (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null default 'default',

  -- Subtitulos (estilo Capital Hub)
  subtitle_font_family text not null default 'SF Pro Display',
  subtitle_font_weight text not null default '700',
  subtitle_font_size_relative text not null default 'large',
  subtitle_color text not null default '#FFFFFF',
  subtitle_emphasis_style text not null default 'bold-glow',
  subtitle_emphasis_color text,
  subtitle_position text not null default 'lower-third',
  subtitle_animation text not null default 'word-by-word',
  subtitle_max_visible_words int not null default 3,
  subtitle_background_color text,
  subtitle_background_opacity numeric default 0,

  cta_font_size_multiplier numeric not null default 1.5,

  variant2_bar_height_px int not null default 425,
  variant2_bar_color text not null default '#000000',
  variant2_headline_font_family text not null default 'SF Pro Display',
  variant2_headline_color text not null default '#FFFFFF',

  variant3_keyword_size_multiplier numeric not null default 2.5,
  variant3_keyword_accent_color text,

  color_grade_lut text not null default 'cinematic-warm',
  color_grade_intensity numeric not null default 0.7,

  aspect_ratio text not null default '9:16',
  resolution text not null default '1080',
  fps int not null default 30,

  silence_threshold_ms int not null default 400,

  music_voice_db_offset numeric not null default -18,

  primary_color text,
  secondary_color text,
  watermark_path text,
  watermark_position text,

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.touch_ci_brand_pack_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_ci_brand_pack on public.ci_brand_pack;
create trigger trg_touch_ci_brand_pack before update on public.ci_brand_pack
  for each row execute function public.touch_ci_brand_pack_updated_at();

create table if not exists public.ci_video_presets (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  display_name text not null,
  description text,

  expected_inputs jsonb not null default '{}'::jsonb,
  pipeline_config jsonb not null default '{}'::jsonb,

  recommended_piece_types text[] not null default '{}',

  enabled boolean not null default true,
  implementation_status text not null default 'pending-references',

  notes text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create or replace function public.touch_ci_video_presets_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_touch_ci_video_presets on public.ci_video_presets;
create trigger trg_touch_ci_video_presets before update on public.ci_video_presets
  for each row execute function public.touch_ci_video_presets_updated_at();

alter table public.ci_video_edits
  add column if not exists preset_slug text,
  add column if not exists headline_text text,
  add column if not exists piece_type text,
  add column if not exists cta_word text;

alter table public.ci_video_edits drop constraint if exists ci_video_edits_piece_type_check;
alter table public.ci_video_edits add constraint ci_video_edits_piece_type_check
  check (piece_type is null or piece_type in ('A','B','C','D'));

create index if not exists idx_ci_video_edits_preset on public.ci_video_edits (preset_slug)
  where preset_slug is not null;
