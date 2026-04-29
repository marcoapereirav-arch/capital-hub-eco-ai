-- ============================================================================
-- Migration 0018: LLM-edit (cortes semánticos por Claude)
--
-- Tras silence-trim (gaps > 400ms), un LLM analiza el transcript y devuelve
-- tramos adicionales a cortar: muletillas, repeticiones, falsos arranques.
-- Esos cortes se persisten en llm_cuts JSON y se aplican al render.
-- ============================================================================

alter table public.ci_video_edits
  add column if not exists llm_edit_mode text not null default 'aggressive',
  add column if not exists llm_cuts jsonb not null default '[]'::jsonb,
  add column if not exists llm_seconds_removed numeric default 0;

alter table public.ci_video_edits drop constraint if exists ci_video_edits_llm_mode_check;
alter table public.ci_video_edits add constraint ci_video_edits_llm_mode_check
  check (llm_edit_mode in ('aggressive','soft','off'));
