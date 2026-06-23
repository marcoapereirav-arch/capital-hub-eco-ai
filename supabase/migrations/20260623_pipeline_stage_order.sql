-- Orden de columnas del pipeline (Marco 2026-06-23):
-- lead → agendado → seguimiento → no_show → alumno → perdido
-- (alumno = won, sigue protegido por la guarda no-retroceso; el orden es de display).

update public.pipeline_stages set sort_order = 1 where key = 'lead';
update public.pipeline_stages set sort_order = 2 where key = 'agendado';
update public.pipeline_stages set sort_order = 3 where key = 'seguimiento';
update public.pipeline_stages set sort_order = 4 where key = 'no_show';
update public.pipeline_stages set sort_order = 5 where key = 'alumno';
update public.pipeline_stages set sort_order = 6 where key = 'perdido';
