-- 0032_pipeline_stages_espanol.sql
-- Renombra los stages del pipeline al funnel real de Capital Hub en español.
--
-- Mapeo viejo → nuevo:
--   new       → nuevo_seguidor   (ManyChat detecta nuevo follower)
--   contacted → contactado       (Setter envió DM)
--   booked    → agendado         (Reservó llamada)
--   attended  → atendio          (Entró a la videollamada)
--   (nuevo)   → seguimiento      (Post-llamada, en negociación)
--   won       → cliente          (Compró)
--   no_show   → no_show          (sin cambio)
--   lost      → perdido          (Descartado)

-- contacts.stage
update public.contacts set stage = 'nuevo_seguidor' where stage = 'new';
update public.contacts set stage = 'contactado'     where stage = 'contacted';
update public.contacts set stage = 'agendado'       where stage = 'booked';
update public.contacts set stage = 'atendio'        where stage = 'attended';
update public.contacts set stage = 'cliente'        where stage = 'won';
update public.contacts set stage = 'perdido'        where stage = 'lost';
-- no_show queda igual

-- contact_journey_events.data->>stage_from / stage_to (si existen)
-- (sin migrar: histórico mantiene los stage names viejos como contexto histórico)

-- Drop constraint vieja si existe y poner nueva
alter table public.contacts drop constraint if exists contacts_stage_check;
alter table public.contacts add constraint contacts_stage_check check (
  stage in ('nuevo_seguidor', 'contactado', 'agendado', 'atendio', 'seguimiento', 'cliente', 'no_show', 'perdido')
);

-- Default para nuevos contactos
alter table public.contacts alter column stage set default 'nuevo_seguidor';
