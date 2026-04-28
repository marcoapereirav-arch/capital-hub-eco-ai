-- ============================================================================
-- Seed inicial del Brand Pack + Video Presets segun Playbook Adrian Villanueva
--
-- Aplicado tambien manualmente via Supabase MCP el 2026-04-28.
-- Reaplicable: usa upsert por slug.
-- ============================================================================

-- Brand Pack default (Capital Hub)
-- 2026-04-28: Tokens de subs ajustados a referencia Diego Garcia del Rio
-- (PDF docs/references/playbook-capturas-2026-04-28). Inter Medium 500,
-- tamaño medium (46px en code), sin fondo, stroke fino, posicion lower-third
-- con offsetY 0.28 (zona del pecho del sujeto, no pegado al borde).
insert into public.ci_brand_pack (
  slug,
  subtitle_font_family, subtitle_font_weight, subtitle_font_size_relative,
  subtitle_color, subtitle_emphasis_style, subtitle_position,
  subtitle_animation, subtitle_max_visible_words,
  cta_font_size_multiplier,
  variant2_bar_height_px, variant2_bar_color,
  variant2_headline_font_family, variant2_headline_color,
  variant3_keyword_size_multiplier,
  color_grade_lut, color_grade_intensity,
  aspect_ratio, resolution, fps,
  silence_threshold_ms, music_voice_db_offset,
  notes
) values (
  'default',
  'Inter', '500', 'medium',
  '#FFFFFF', 'bold-glow', 'lower-third',
  'word-by-word', 3,
  1.5,
  425, '#000000',
  'Inter', '#FFFFFF',
  2.5,
  'cinematic-warm', 0.7,
  '9:16', '1080', 30,
  400, -18,
  'Ajustado a referencia Diego Garcia del Rio (PDF 2026-04-28). Inter Medium 500, tamaño medio, sin fondo, stroke fino, sentence case. Posicion lower-third con offsetY 0.28 (mas alto que el borde absoluto).'
) on conflict (slug) do update set
  subtitle_font_family = excluded.subtitle_font_family,
  subtitle_font_weight = excluded.subtitle_font_weight,
  subtitle_font_size_relative = excluded.subtitle_font_size_relative,
  subtitle_position = excluded.subtitle_position,
  subtitle_animation = excluded.subtitle_animation,
  subtitle_max_visible_words = excluded.subtitle_max_visible_words,
  silence_threshold_ms = excluded.silence_threshold_ms,
  notes = excluded.notes;

-- Presets de las variantes del Playbook
insert into public.ci_video_presets (slug, display_name, description, expected_inputs, pipeline_config, recommended_piece_types, enabled, implementation_status, notes) values
(
  'vertical-clean',
  'Vertical Clean',
  'Reel 9:16 puro. Adrian habla a camara. Subtitulos palabra a palabra, silencios cortados, color cinematic warm. Formato base, mayor frecuencia.',
  '{"main_video": true, "broll_count_min": 0, "broll_count_max": 2, "headline_text": false, "music_required": false, "cta_word": "optional"}'::jsonb,
  '{"silence_trim": true, "subtitles": "word-by-word", "subtitle_position": "lower-third", "broll_strategy": "manual-optional", "transitions": "hard-cuts", "color_grade": "cinematic-warm", "music_strategy": "manual"}'::jsonb,
  array['A','C'],
  true,
  'wip',
  'Variante 1. En construccion: silence trim + word-by-word karaoke + lower third subs. Sin b-roll por defecto.'
),
(
  'horizontal-framed',
  'Horizontal Framed',
  'Reel 9:16 con video horizontal centrado y franjas negras arriba/abajo. Headline retentivo en la franja superior.',
  '{"main_video": true, "broll_count_min": 0, "broll_count_max": 2, "headline_text": true, "music_required": false, "cta_word": "optional"}'::jsonb,
  '{"silence_trim": true, "subtitles": "word-by-word", "subtitle_position": "lower-third-of-video-zone", "broll_strategy": "manual-optional", "transitions": "hard-cuts", "color_grade": "cinematic-warm", "music_strategy": "manual", "frame_layout": "horizontal-centered-with-bars"}'::jsonb,
  array['A','C','D'],
  false,
  'pending-references',
  'Descartada por usuario 2026-04-28: las referencias visuales (Diego Garcia del Rio) confirman que el formato 9:16 puro con cara a camara funciona sin franjas. Mantenida en BD por si se reactiva en el futuro.'
),
(
  'edit-dinamico',
  'Edit Enriquecido',
  'Mismo Vertical Clean + b-roll automatico de Pexels + motion graphics simples (palabras destacadas grandes con animacion + 2-3 transiciones marcadas). Para piezas Tipo D contrarian o Tipo B con CTA fuerte.',
  '{"main_video": true, "broll_count_min": 0, "broll_count_max": 5, "headline_text": false, "music_required": false, "cta_word": "optional", "auto_broll_from_pexels": true}'::jsonb,
  '{"silence_trim": true, "subtitles": "word-by-word", "subtitle_position": "lower-third", "broll_strategy": "ai-pexels", "transitions": "marked-light", "color_grade": "cinematic-warm", "music_strategy": "manual", "key_word_emphasis": true, "motion_graphics": "simple"}'::jsonb,
  array['B','D'],
  true,
  'pending-references',
  'Variante 2 final (renombrada). B-roll automatico via Pexels API + motion graphics simples (palabras destacadas con zoom, transiciones whoosh). Pendiente: integrar Pexels y construir el orquestador.'
),
(
  'podcast-clip',
  'Clip Podcast / Long-form',
  'Contenedor para clips extraidos de podcasts, entrevistas o long-form. Aplica las reglas de Variante 1, 2 o 3 segun el caso.',
  '{"main_video": true, "broll_count_min": 0, "broll_count_max": 8, "headline_text": false, "music_required": false, "cta_word": "optional", "trim_in_out": true}'::jsonb,
  '{"silence_trim": true, "subtitles": "word-by-word", "broll_strategy": "manual-optional", "transitions": "hard-cuts", "color_grade": "cinematic-warm", "music_strategy": "manual", "container_for_variant": true}'::jsonb,
  array['A','B','C','D'],
  true,
  'pending-references',
  'Variante 4 contenedor. Aplica reglas de la variante visual elegida.'
)
on conflict (slug) do update set
  display_name = excluded.display_name,
  description = excluded.description,
  expected_inputs = excluded.expected_inputs,
  pipeline_config = excluded.pipeline_config,
  recommended_piece_types = excluded.recommended_piece_types,
  enabled = excluded.enabled,
  notes = excluded.notes;
