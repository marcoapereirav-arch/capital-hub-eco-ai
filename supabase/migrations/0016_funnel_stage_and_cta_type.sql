-- ============================================================================
-- Migration 0016: Framework TOFU/MOFU/BOFU
--
-- Reemplaza piece_type (A/B/C/D del playbook anterior) por funnel_stage
-- (tofu/mofu/bofu) — toda pieza cae en una posicion del embudo, lo que
-- determina goal + CTA + profundidad de contenido.
--
-- Mapeo de migracion:
--   A (conexion personal)             → mofu
--   B (CTA conversion)                → bofu
--   C (valor/ensenanza)               → bofu
--   D (declaracion fuerte/contrarian) → tofu
--
-- Ademas anade cta_type (follow/freebie/paid_offer) para trackear el tipo
-- de llamada a la accion de cada video.
-- ============================================================================

alter table public.ci_video_edits drop constraint if exists ci_video_edits_piece_type_check;

alter table public.ci_video_edits rename column piece_type to funnel_stage;

update public.ci_video_edits
set funnel_stage = case funnel_stage
  when 'A' then 'mofu'
  when 'B' then 'bofu'
  when 'C' then 'bofu'
  when 'D' then 'tofu'
  else null
end
where funnel_stage in ('A','B','C','D');

alter table public.ci_video_edits add constraint ci_video_edits_funnel_stage_check
  check (funnel_stage is null or funnel_stage in ('tofu','mofu','bofu'));

alter table public.ci_video_edits
  add column if not exists cta_type text;

alter table public.ci_video_edits drop constraint if exists ci_video_edits_cta_type_check;
alter table public.ci_video_edits add constraint ci_video_edits_cta_type_check
  check (cta_type is null or cta_type in ('follow','freebie','paid_offer'));

alter table public.ci_video_presets rename column recommended_piece_types to recommended_funnel_stages;

update public.ci_video_presets
set recommended_funnel_stages = (
  select array_agg(distinct case x
    when 'A' then 'mofu'
    when 'B' then 'bofu'
    when 'C' then 'bofu'
    when 'D' then 'tofu'
    else null
  end)
  from unnest(recommended_funnel_stages) as x
  where x in ('A','B','C','D')
)
where recommended_funnel_stages && array['A','B','C','D'];

update public.ci_video_presets set recommended_funnel_stages = array['tofu','mofu','bofu']
where recommended_funnel_stages is null;
