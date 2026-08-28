-- Historial diario de la actividad del setter
--
-- Origen: Marco, 2026-08-28. "Necesito tener un registro diario (historial) de las veces
-- que se registra actividad del setter, para saber exactamente lo que ha sucedido de
-- forma diaria, que ahi se pueda editar y se pueda ver quien registra y quien edito ya,
-- que hora y TODO lo necesario para tener claridad."
--
-- El problema que arregla (medido en la base el 2026-08-28, con 4 partes reales dentro):
--   1. El parte se guardaba PISANDO la linea anterior. El valor viejo desaparecia para
--      siempre: no habia forma de saber que decia antes ni que numero cambio.
--   2. No se guardaba QUIEN lo escribio (solo de quien era) ni QUIEN lo corrigio.
--   3. Nadie podia corregir el parte de otro, ni siendo administrador.
--
-- El rastro lo escribe LA BASE con un disparador, no la pantalla. Asi es imposible
-- guardar sin dejar huella, venga del boton, de la API o de una consulta a mano.

-- ---------------------------------------------------------------------------
-- 1) El parte firma quien lo creo y quien lo toco por ultima vez
-- ---------------------------------------------------------------------------
ALTER TABLE public.setter_daily_reports
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL;

-- ---------------------------------------------------------------------------
-- 2) El historial: UNA linea por cada guardado
-- ---------------------------------------------------------------------------
-- `report_id` puede quedarse en nulo a proposito: si algun dia se borrara un parte, su
-- rastro NO se borra con el. Un historial que desaparece con lo que documenta no sirve.
CREATE TABLE IF NOT EXISTS public.setter_report_events (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  report_id   uuid REFERENCES public.setter_daily_reports(id) ON DELETE SET NULL,
  profile_id  uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  report_date date NOT NULL,
  actor_id    uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  accion      text NOT NULL,
  antes       jsonb,
  despues     jsonb NOT NULL,
  cambios     text[] NOT NULL DEFAULT '{}',
  created_at  timestamptz NOT NULL DEFAULT now()
);

COMMENT ON TABLE  public.setter_report_events IS 'Una linea por cada guardado del parte diario. Solo lo escribe el disparador; nadie lo edita ni lo borra.';
COMMENT ON COLUMN public.setter_report_events.profile_id IS 'De quien es el parte.';
COMMENT ON COLUMN public.setter_report_events.actor_id   IS 'Quien firmo ESE guardado. Puede no ser el dueño del parte: un administrador puede corregirlo.';
COMMENT ON COLUMN public.setter_report_events.accion     IS 'creado | editado | reconstruido (reconstruido = linea rellenada hacia atras, sin datos del antes).';

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'setter_report_events_accion_check') THEN
    ALTER TABLE public.setter_report_events
      ADD CONSTRAINT setter_report_events_accion_check
      CHECK (accion IN ('creado', 'editado', 'reconstruido'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS setter_report_events_persona_dia_idx
  ON public.setter_report_events (profile_id, report_date DESC);
CREATE INDEX IF NOT EXISTS setter_report_events_created_idx
  ON public.setter_report_events (created_at DESC);

ALTER TABLE public.setter_report_events ENABLE ROW LEVEL SECURITY;

-- Cada quien ve su propio rastro. El administrador lo ve todo.
DROP POLICY IF EXISTS "setter_report_events read" ON public.setter_report_events;
CREATE POLICY "setter_report_events read"
  ON public.setter_report_events FOR SELECT
  USING (profile_id = auth.uid() OR public.is_admin());

-- A PROPOSITO no hay politica de INSERT, UPDATE ni DELETE: por la API no escribe nadie,
-- ni un administrador. La unica via de entrada es el disparador de mas abajo.

-- ---------------------------------------------------------------------------
-- 3) Relleno hacia atras de los partes que ya existen
-- ---------------------------------------------------------------------------
-- Hasta hoy la base SOLO dejaba escribir el parte propio, asi que en estas filas el
-- dueño del parte ES quien lo escribio. No es una suposicion, es lo unico que era
-- posible. Se hace ANTES de crear los disparadores para que no genere lineas falsas.
UPDATE public.setter_daily_reports
   SET created_by = COALESCE(created_by, profile_id),
       updated_by = COALESCE(updated_by, profile_id)
 WHERE created_by IS NULL OR updated_by IS NULL;

-- El alta de cada parte que ya existia.
INSERT INTO public.setter_report_events
  (report_id, profile_id, report_date, actor_id, accion, antes, despues, cambios, created_at)
SELECT r.id, r.profile_id, r.report_date, r.created_by, 'reconstruido', NULL,
       jsonb_build_object(
         'conversaciones', r.conversaciones,
         'followups',      r.followups,
         'ofertas',        r.ofertas,
         'agendadas',      r.agendadas
       ),
       ARRAY['conversaciones','followups','ofertas','agendadas'],
       r.created_at
  FROM public.setter_daily_reports r
 WHERE NOT EXISTS (
   SELECT 1 FROM public.setter_report_events e WHERE e.report_id = r.id
 );

-- Y la correccion, en los partes que se tocaron despues de crearse. Del "antes" no
-- queda nada guardado, asi que se escribe como reconstruido y sin cambios: se dice que
-- hubo una correccion y cuando, no se inventa que cambio.
INSERT INTO public.setter_report_events
  (report_id, profile_id, report_date, actor_id, accion, antes, despues, cambios, created_at)
SELECT r.id, r.profile_id, r.report_date, r.updated_by, 'reconstruido', NULL,
       jsonb_build_object(
         'conversaciones', r.conversaciones,
         'followups',      r.followups,
         'ofertas',        r.ofertas,
         'agendadas',      r.agendadas
       ),
       '{}'::text[],
       r.updated_at
  FROM public.setter_daily_reports r
 WHERE r.updated_at > r.created_at + interval '2 seconds'
   AND NOT EXISTS (
     SELECT 1 FROM public.setter_report_events e
      WHERE e.report_id = r.id AND e.created_at = r.updated_at
   );

-- ---------------------------------------------------------------------------
-- 4) La firma: quien creo no cambia nunca, quien edito se sella en cada guardado
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setter_report_firma()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    NEW.created_by := COALESCE(NEW.created_by, NEW.updated_by, auth.uid());
    NEW.updated_by := COALESCE(NEW.updated_by, NEW.created_by);
    NEW.updated_at := now();
  ELSE
    /* Quien lo creo y cuando NO se pueden reescribir: son historia, no estado. */
    NEW.created_by := OLD.created_by;
    NEW.created_at := OLD.created_at;
    NEW.updated_by := COALESCE(NEW.updated_by, auth.uid(), OLD.updated_by);
    NEW.updated_at := now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS setter_report_firma_trg ON public.setter_daily_reports;
CREATE TRIGGER setter_report_firma_trg
  BEFORE INSERT OR UPDATE ON public.setter_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.setter_report_firma();

-- ---------------------------------------------------------------------------
-- 5) El rastro: una linea por guardado, con el antes y el despues
-- ---------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.setter_report_rastro()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_antes   jsonb;
  v_despues jsonb;
  v_cambios text[] := '{}';
  v_campo   text;
BEGIN
  v_despues := jsonb_build_object(
    'conversaciones', NEW.conversaciones,
    'followups',      NEW.followups,
    'ofertas',        NEW.ofertas,
    'agendadas',      NEW.agendadas
  );

  IF TG_OP = 'UPDATE' THEN
    v_antes := jsonb_build_object(
      'conversaciones', OLD.conversaciones,
      'followups',      OLD.followups,
      'ofertas',        OLD.ofertas,
      'agendadas',      OLD.agendadas
    );
    FOREACH v_campo IN ARRAY ARRAY['conversaciones','followups','ofertas','agendadas'] LOOP
      IF (v_antes -> v_campo) IS DISTINCT FROM (v_despues -> v_campo) THEN
        v_cambios := array_append(v_cambios, v_campo);
      END IF;
    END LOOP;

    /* Guardar sin cambiar ningun numero NO ensucia el historial: abrir el parte y
       darle a guardar tal cual no es una correccion. */
    IF array_length(v_cambios, 1) IS NULL THEN
      RETURN NULL;
    END IF;
  ELSE
    v_cambios := ARRAY['conversaciones','followups','ofertas','agendadas'];
  END IF;

  INSERT INTO public.setter_report_events
    (report_id, profile_id, report_date, actor_id, accion, antes, despues, cambios)
  VALUES
    (NEW.id, NEW.profile_id, NEW.report_date,
     CASE WHEN TG_OP = 'INSERT' THEN NEW.created_by ELSE NEW.updated_by END,
     CASE WHEN TG_OP = 'INSERT' THEN 'creado' ELSE 'editado' END,
     v_antes, v_despues, v_cambios);

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS setter_report_rastro_trg ON public.setter_daily_reports;
CREATE TRIGGER setter_report_rastro_trg
  AFTER INSERT OR UPDATE ON public.setter_daily_reports
  FOR EACH ROW EXECUTE FUNCTION public.setter_report_rastro();

-- ---------------------------------------------------------------------------
-- 6) El administrador puede registrar y corregir el parte de otro
-- ---------------------------------------------------------------------------
-- Antes solo se podia escribir el parte propio: si un setter se equivocaba en un
-- numero, NADIE mas podia arreglarlo. Quien lo corrige queda firmado en el historial,
-- asi que abrir esto no pierde trazabilidad: la crea.
DROP POLICY IF EXISTS "setter_daily_reports read"       ON public.setter_daily_reports;
DROP POLICY IF EXISTS "setter_daily_reports insert own" ON public.setter_daily_reports;
DROP POLICY IF EXISTS "setter_daily_reports update own" ON public.setter_daily_reports;

CREATE POLICY "setter_daily_reports read"
  ON public.setter_daily_reports FOR SELECT
  USING (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY "setter_daily_reports insert"
  ON public.setter_daily_reports FOR INSERT
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());

CREATE POLICY "setter_daily_reports update"
  ON public.setter_daily_reports FOR UPDATE
  USING (profile_id = auth.uid() OR public.is_admin())
  WITH CHECK (profile_id = auth.uid() OR public.is_admin());
