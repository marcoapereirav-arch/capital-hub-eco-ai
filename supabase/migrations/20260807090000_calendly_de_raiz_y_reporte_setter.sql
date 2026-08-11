-- Calendly de raiz + reporte diario del setter
-- Origen: llamada Marco + Adrian del 2026-08-06.
--
-- Contexto del problema que arregla:
--   El receptor de Calendly devolvia 200 aunque no guardara nada. Calendly daba la
--   entrega por buena, no reintentaba, y no saltaba ninguna alarma. Del 2026-07-27 al
--   2026-08-07 se perdieron 5 reservas reales sin que nadie se enterara.
--
-- Aqui va SOLO el esquema. El codigo que lo usa va en el mismo bloque de trabajo.

-- ---------------------------------------------------------------------------
-- 1) Lo que Calendly manda y hoy se tira
-- ---------------------------------------------------------------------------
-- El telefono real NO viene en text_reminder_number (llega null): viene dentro de
-- questions_and_answers, junto al Instagram y a 7 respuestas mas del formulario.
ALTER TABLE public.calendly_scheduled_events
  ADD COLUMN IF NOT EXISTS host_email   text,
  ADD COLUMN IF NOT EXISTS answers      jsonb,
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content  text,
  ADD COLUMN IF NOT EXISTS contact_id   uuid REFERENCES public.contacts(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS synced_from  text NOT NULL DEFAULT 'webhook';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendly_scheduled_events_synced_from_check'
  ) THEN
    ALTER TABLE public.calendly_scheduled_events
      ADD CONSTRAINT calendly_scheduled_events_synced_from_check
      CHECK (synced_from IN ('webhook', 'backfill'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS calendly_scheduled_events_contact_idx
  ON public.calendly_scheduled_events (contact_id);
CREATE INDEX IF NOT EXISTS calendly_scheduled_events_start_idx
  ON public.calendly_scheduled_events (start_time DESC);

-- ---------------------------------------------------------------------------
-- 2) Para que serve cada agenda
-- ---------------------------------------------------------------------------
-- En la cuenta hay 3 agendas: la de venta, la de arranque de clientes (Kick Off) y
-- una personal de Adrian. Sin esto los numeros de venta las cuentan todas por igual.
-- Una agenda nueva entra como 'sin_clasificar' y NO cuenta hasta que se clasifique.
ALTER TABLE public.calendly_event_types
  ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'sin_clasificar';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendly_event_types_purpose_check'
  ) THEN
    ALTER TABLE public.calendly_event_types
      ADD CONSTRAINT calendly_event_types_purpose_check
      CHECK (purpose IN ('venta', 'onboarding', 'personal', 'sin_clasificar'));
  END IF;
END $$;

-- La agenda unica que usa el equipo hoy (funnel de reserva -> Calendly).
UPDATE public.calendly_event_types
   SET purpose = 'venta'
 WHERE name ILIKE '%orientaci%profesional%'
   AND purpose = 'sin_clasificar';

UPDATE public.calendly_event_types
   SET purpose = 'onboarding'
 WHERE name ILIKE '%kick off%'
   AND purpose = 'sin_clasificar';

-- ---------------------------------------------------------------------------
-- 3) Registro crudo de todo lo que entra por el webhook
-- ---------------------------------------------------------------------------
-- Sin esto se investiga a ciegas: fue exactamente lo que paso. Guarda TODO,
-- incluido lo que se rechaza por firma, para poder ver que llego de verdad.
CREATE TABLE IF NOT EXISTS public.calendly_webhook_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event        text,
  signature_ok boolean NOT NULL DEFAULT false,
  outcome      text    NOT NULL,
  reason       text,
  event_uri    text,
  invitee_email text,
  raw          jsonb,
  created_at   timestamptz NOT NULL DEFAULT now()
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'calendly_webhook_log_outcome_check'
  ) THEN
    ALTER TABLE public.calendly_webhook_log
      ADD CONSTRAINT calendly_webhook_log_outcome_check
      CHECK (outcome IN ('processed', 'ignored', 'rejected', 'error'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS calendly_webhook_log_created_idx
  ON public.calendly_webhook_log (created_at DESC);

ALTER TABLE public.calendly_webhook_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "calendly_webhook_log super_admin read" ON public.calendly_webhook_log;
CREATE POLICY "calendly_webhook_log super_admin read"
  ON public.calendly_webhook_log FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.profiles p
     WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.active
  ));
-- La escritura la hace el receptor con la llave de servicio, que se salta la RLS.

-- ---------------------------------------------------------------------------
-- 4) Reporte diario del setter
-- ---------------------------------------------------------------------------
-- UNA fila por persona y dia. El UNIQUE es lo que impide que salgan dos lineas
-- del mismo dia o que los numeros se sumen sin querer: al abrir el formulario se
-- busca la fila de hoy, sale rellenada y al guardar se actualiza esa misma.
CREATE TABLE IF NOT EXISTS public.setter_daily_reports (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id     uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date    date NOT NULL,
  conversaciones integer NOT NULL DEFAULT 0 CHECK (conversaciones >= 0),
  followups      integer NOT NULL DEFAULT 0 CHECK (followups      >= 0),
  ofertas        integer NOT NULL DEFAULT 0 CHECK (ofertas        >= 0),
  agendadas      integer NOT NULL DEFAULT 0 CHECK (agendadas      >= 0),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT setter_daily_reports_uniq UNIQUE (profile_id, report_date)
);

CREATE INDEX IF NOT EXISTS setter_daily_reports_date_idx
  ON public.setter_daily_reports (report_date DESC);

ALTER TABLE public.setter_daily_reports ENABLE ROW LEVEL SECURITY;

-- Cada quien ve y escribe SOLO lo suyo. Los super_admin lo ven todo.
DROP POLICY IF EXISTS "setter_daily_reports read" ON public.setter_daily_reports;
CREATE POLICY "setter_daily_reports read"
  ON public.setter_daily_reports FOR SELECT
  USING (
    profile_id = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.profiles p
       WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.active
    )
  );

DROP POLICY IF EXISTS "setter_daily_reports insert own" ON public.setter_daily_reports;
CREATE POLICY "setter_daily_reports insert own"
  ON public.setter_daily_reports FOR INSERT
  WITH CHECK (profile_id = auth.uid());

DROP POLICY IF EXISTS "setter_daily_reports update own" ON public.setter_daily_reports;
CREATE POLICY "setter_daily_reports update own"
  ON public.setter_daily_reports FOR UPDATE
  USING (profile_id = auth.uid())
  WITH CHECK (profile_id = auth.uid());
