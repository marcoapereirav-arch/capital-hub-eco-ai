-- ============================================================================
-- 0034: TAGS SYSTEM (estilo GoHighLevel) — Bloque A7
-- ============================================================================
-- Sistema de etiquetas libres para contactos:
--  · catalogo de tags reutilizable (con color y descripcion)
--  · M2M contacts ↔ tags
--  · base para filtros, segmentacion y automatizaciones futuras

-- ----------------------------------------------------------------------------
-- Tabla TAGS
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.tags (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL UNIQUE,
  color text NOT NULL DEFAULT '#71717a',
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS tags_name_lower_idx ON public.tags (lower(name));

-- ----------------------------------------------------------------------------
-- Tabla CONTACT_TAGS (M2M)
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.contact_tags (
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  tag_id uuid NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  assigned_at timestamptz NOT NULL DEFAULT now(),
  assigned_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  PRIMARY KEY (contact_id, tag_id)
);

CREATE INDEX IF NOT EXISTS contact_tags_tag_idx ON public.contact_tags (tag_id);
CREATE INDEX IF NOT EXISTS contact_tags_contact_idx ON public.contact_tags (contact_id);

-- ----------------------------------------------------------------------------
-- RLS
-- ----------------------------------------------------------------------------
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contact_tags ENABLE ROW LEVEL SECURITY;

-- TAGS: cualquier autenticado puede ver, crear y editar el catalogo
DROP POLICY IF EXISTS tags_select_authenticated ON public.tags;
CREATE POLICY tags_select_authenticated ON public.tags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS tags_insert_authenticated ON public.tags;
CREATE POLICY tags_insert_authenticated ON public.tags
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS tags_update_authenticated ON public.tags;
CREATE POLICY tags_update_authenticated ON public.tags
  FOR UPDATE TO authenticated USING (true);

-- Solo admin/super_admin pueden borrar tags (afecta a todos los contactos asignados)
DROP POLICY IF EXISTS tags_delete_admin ON public.tags;
CREATE POLICY tags_delete_admin ON public.tags
  FOR DELETE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('admin','super_admin')
    )
  );

-- CONTACT_TAGS: cualquier autenticado puede asignar/quitar tags a contactos
DROP POLICY IF EXISTS contact_tags_select ON public.contact_tags;
CREATE POLICY contact_tags_select ON public.contact_tags
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS contact_tags_insert ON public.contact_tags;
CREATE POLICY contact_tags_insert ON public.contact_tags
  FOR INSERT TO authenticated WITH CHECK (true);

DROP POLICY IF EXISTS contact_tags_delete ON public.contact_tags;
CREATE POLICY contact_tags_delete ON public.contact_tags
  FOR DELETE TO authenticated USING (true);
