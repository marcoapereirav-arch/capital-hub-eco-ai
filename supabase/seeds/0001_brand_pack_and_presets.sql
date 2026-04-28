-- ============================================================================
-- Seed inicial del Brand Pack + Video Presets segun Playbook Adrian Villanueva
--
-- Aplicado tambien manualmente via Supabase MCP el 2026-04-28.
-- Reaplicable: usa upsert por slug.
-- ============================================================================

-- Brand Pack default (Capital Hub)
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
  'SF Pro Display', '700', 'large',
  '#FFFFFF', 'bold-glow', 'lower-third',
  'word-by-word', 3,
  1.5,
  425, '#000000',
  'SF Pro Display', '#FFFFFF',
  2.5,
  'cinematic-warm', 0.7,
  '9:16', '1080', 30,
  400, -18,
  'Seed inicial desde Playbook Adrian Villanueva. Tipografia exacta y color de acento (variant3) pendientes de confirmar con capturas.'
) on conflict (slug) do update set
  subtitle_font_family = excluded.subtitle_font_family,
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
  'Reel 9:16 con video horizontal centrado y franjas negras arriba/abajo. Headline retentivo en la franja superior. Mismo contenido base que Variante 1.',
  '{"main_video": true, "broll_count_min": 0, "broll_count_max": 2, "headline_text": true, "music_required": false, "cta_word": "optional"}'::jsonb,
  '{"silence_trim": true, "subtitles": "word-by-word", "subtitle_position": "lower-third-of-video-zone", "broll_strategy": "manual-optional", "transitions": "hard-cuts", "color_grade": "cinematic-warm", "music_strategy": "manual", "frame_layout": "horizontal-centered-with-bars"}'::jsonb,
  array['A','C','D'],
  true,
  'pending-references',
  'Variante 2. Espera capturas para confirmar altura exacta de las franjas y tipografia del headline.'
),
(
  'edit-dinamico',
  'Edit Dinamico',
  'Mayor produccion. Talking head + 4-5 b-rolls + palabras destacadas grandes en hook/punchlines/cierre + transiciones marcadas. Premium para piezas de alto impacto, contrarian o CTA fuerte.',
  '{"main_video": true, "broll_count_min": 4, "broll_count_max": 8, "headline_text": false, "music_required": false, "cta_word": "optional"}'::jsonb,
  '{"silence_trim": true, "subtitles": "word-by-word", "subtitle_position": "dynamic", "broll_strategy": "ai-suggested", "transitions": "mixed", "color_grade": "cinematic-warm", "music_strategy": "manual", "key_word_emphasis": true, "hook_visual_options": ["A","B","C"]}'::jsonb,
  array['B','D'],
  true,
  'pending-references',
  'Variante 3. Espera capturas para confirmar tipografia de palabras grandes, color de acento, estilo de transiciones.'
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
  notes = excluded.notes;
