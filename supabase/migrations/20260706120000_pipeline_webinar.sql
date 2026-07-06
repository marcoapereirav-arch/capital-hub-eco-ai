-- 20260706120000_pipeline_webinar.sql
-- Pipeline dedicado del Funnel Webinar semanal (Opt-in -> WhatsApp -> Agendar -> Alumno).
-- Espejo del pipeline 'test-personalidad': mismos stages canonicos (lead -> agendado ->
-- seguimiento -> alumno -> no_show -> perdido) para que el webhook de Calendly
-- (moveContactForCalendly + resolveAutoStage) funcione sin cambios.
-- Idempotente: si ya existe el pipeline 'webinar' no duplica stages.

do $$
declare
  v_pipeline_id uuid;
begin
  select id into v_pipeline_id from public.pipelines where slug = 'webinar';

  if v_pipeline_id is null then
    insert into public.pipelines (name, slug, description, color, is_default, display_order)
    values (
      'Funnel Webinar',
      'webinar',
      'Leads que entran por el webinar semanal (opt-in -> WhatsApp -> agenda -> alumno).',
      '#22C55E',
      false,
      (select coalesce(max(display_order), 0) + 1 from public.pipelines)
    )
    returning id into v_pipeline_id;

    insert into public.pipeline_stages (pipeline_id, key, name, color, kind, sort_order) values
      (v_pipeline_id, 'lead',        'Lead',        '#3F3F46', 'active', 1),
      (v_pipeline_id, 'agendado',    'Agendado',    '#3B82F6', 'active', 2),
      (v_pipeline_id, 'seguimiento', 'Seguimiento', '#F59E0B', 'branch', 3),
      (v_pipeline_id, 'alumno',      'Alumno',      '#22C55E', 'won',    4),
      (v_pipeline_id, 'no_show',     'No show',     '#71717A', 'lost',   5),
      (v_pipeline_id, 'perdido',     'Perdido',     '#6B7280', 'lost',   6);
  end if;
end $$;
