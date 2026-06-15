-- ============================================================================
-- PIPELINES DINAMICOS — Bloque A8
-- ============================================================================
-- Sistema multi-pipeline estilo GoHighLevel:
--  · El usuario crea N pipelines (CRM principal, Webinar, Eventos, etc.)
--  · Cada pipeline tiene sus propios stages con orden, color y tipo
--  · contacts.pipeline_id apunta al pipeline activo del contacto
--  · contacts.stage sigue siendo string = key del stage dentro de ese pipeline

-- ----------------------------------------------------------------------------
-- Tabla PIPELINES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pipelines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  description text,
  color text NOT NULL DEFAULT '#3b82f6',
  is_default boolean NOT NULL DEFAULT false,
  display_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Solo un pipeline puede ser default a la vez
CREATE UNIQUE INDEX IF NOT EXISTS pipelines_only_one_default
  ON public.pipelines (is_default) WHERE is_default = true;

-- ----------------------------------------------------------------------------
-- Tabla PIPELINE_STAGES
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.pipeline_stages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pipeline_id uuid NOT NULL REFERENCES public.pipelines(id) ON DELETE CASCADE,
  key text NOT NULL,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#71717a',
  -- kind: 'active' (camino feliz) | 'won' (cierre exitoso) | 'lost' (perdido) | 'branch' (rama lateral)
  kind text NOT NULL DEFAULT 'active' CHECK (kind IN ('active','won','lost','branch')),
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (pipeline_id, key)
);

CREATE INDEX IF NOT EXISTS pipeline_stages_pipeline_idx
  ON public.pipeline_stages (pipeline_id, sort_order);

-- ----------------------------------------------------------------------------
-- contacts.pipeline_id (nuevo campo, nullable durante transicion)
-- ----------------------------------------------------------------------------
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS pipeline_id uuid REFERENCES public.pipelines(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS contacts_pipeline_idx
  ON public.contacts (pipeline_id, stage);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.pipelines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pipeline_stages ENABLE ROW LEVEL SECURITY;

-- Pipelines: cualquier autenticado lee; admin gestiona
DROP POLICY IF EXISTS pipelines_select_authenticated ON public.pipelines;
CREATE POLICY pipelines_select_authenticated ON public.pipelines
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS pipelines_insert_admin ON public.pipelines;
CREATE POLICY pipelines_insert_admin ON public.pipelines
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin')
    )
  );

DROP POLICY IF EXISTS pipelines_update_admin ON public.pipelines;
CREATE POLICY pipelines_update_admin ON public.pipelines
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin')
    )
  );

DROP POLICY IF EXISTS pipelines_delete_admin ON public.pipelines;
CREATE POLICY pipelines_delete_admin ON public.pipelines
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin')
    )
  );

-- Pipeline_stages: mismo patron
DROP POLICY IF EXISTS pipeline_stages_select_authenticated ON public.pipeline_stages;
CREATE POLICY pipeline_stages_select_authenticated ON public.pipeline_stages
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS pipeline_stages_insert_admin ON public.pipeline_stages;
CREATE POLICY pipeline_stages_insert_admin ON public.pipeline_stages
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin')
    )
  );

DROP POLICY IF EXISTS pipeline_stages_update_admin ON public.pipeline_stages;
CREATE POLICY pipeline_stages_update_admin ON public.pipeline_stages
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin')
    )
  );

DROP POLICY IF EXISTS pipeline_stages_delete_admin ON public.pipeline_stages;
CREATE POLICY pipeline_stages_delete_admin ON public.pipeline_stages
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin')
    )
  );
