-- Interruptor de medición por funnel (Marco, 2026-07-31).
--
-- Hasta ahora, si un funnel estaba publicado se asumía que debía mandar eventos a Meta.
-- Eso es falso: "Acceso al OS" está publicado y es la pantalla de login, no un funnel de
-- anuncios. Publicar y medir son dos cosas distintas y ahora se controlan por separado.
--
--   publicado + medición ON   → se ve y mide
--   publicado + medición OFF  → se ve, no mide
--   borrador                  → ni se ve (404) ni mide
--
-- Los funnels nuevos nacen con la medición APAGADA para que nada empiece a mandar datos
-- a Meta por accidente. Ver SOP marketing/09-eventos-meta-catalogo.

alter table public.webs
  add column if not exists tracking_enabled boolean not null default false;

comment on column public.webs.tracking_enabled is
  'Interruptor de medición Meta (pixel + CAPI) de este funnel. Independiente de status. Nace apagado.';

-- Se enciende en los funnels que HOY están publicados y captando leads de verdad.
-- "login" queda apagado a propósito: es la entrada al OS, no capta nada.
update public.webs
   set tracking_enabled = true
 where slug in ('webinar', 'reservar', 'test-personalidad');

-- meta_events_log necesita poder registrar los eventos que NO se mandaron y por qué.
-- Sin esto, un funnel con la medición apagada quedaría en silencio absoluto y sería
-- imposible distinguirlo de "no ha entrado nadie".
alter table public.meta_events_log
  drop constraint if exists meta_events_log_status_check;

alter table public.meta_events_log
  add constraint meta_events_log_status_check
  check (status = any (array['pending'::text, 'sent'::text, 'failed'::text, 'dedup'::text, 'skipped'::text]));
