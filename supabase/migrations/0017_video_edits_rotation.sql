-- ============================================================================
-- Migration 0017: rotation_degrees en ci_video_edits
--
-- iPhone graba portrait con rotation metadata (90°) que Shotstack ignora.
-- Sin esto, los videos del iPhone se renderizan horizontales/torcidos.
-- Adrian setea 0/90/180/270 segun la orientacion real de su grabacion.
-- ============================================================================

alter table public.ci_video_edits
  add column if not exists rotation_degrees int not null default 0;

alter table public.ci_video_edits drop constraint if exists ci_video_edits_rotation_check;
alter table public.ci_video_edits add constraint ci_video_edits_rotation_check
  check (rotation_degrees in (0, 90, 180, 270));
