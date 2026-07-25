-- ============================================================================
-- Knowledge — settings editables desde la UI
-- ============================================================================
-- Aplica esta migración DESPUÉS de 0001_knowledge_hierarchical_folders.sql.
-- Crea una tabla singleton para que el admin pueda configurar desde el
-- propio panel del Knowledge:
--   - Nombre del proyecto (lo que aparece en la bola central del 3D).
--   - Color del núcleo central.
--   - Para cada cuadrante: label, descripción y color (override de los
--     defaults hardcoded en services/quadrants.ts).
--
-- Sin esta fila, el código usa los defaults. Las RLS permiten que el admin
-- modifique y los autenticados lean.
-- ============================================================================

CREATE TABLE IF NOT EXISTS knowledge_settings (
  id text PRIMARY KEY DEFAULT 'singleton'
    CHECK (id = 'singleton'),
  project_name text,
  core_color text,
  quadrants jsonb,  -- [{key, label, blurb, color}, ...]
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE knowledge_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "admin_all_knowledge_settings" ON knowledge_settings;
DROP POLICY IF EXISTS "auth_read_knowledge_settings" ON knowledge_settings;
DROP POLICY IF EXISTS "ks_admin_all" ON knowledge_settings;
CREATE POLICY "ks_admin_all" ON knowledge_settings FOR ALL TO public
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.active))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.active));
DROP POLICY IF EXISTS "ks_team_read" ON knowledge_settings;
CREATE POLICY "ks_team_read" ON knowledge_settings FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.active));

-- Insertar fila inicial. Cambia 'TuProyecto' por el nombre real de tu app.
INSERT INTO knowledge_settings (id, project_name)
VALUES ('singleton', 'Capital Hub')
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE knowledge_settings IS
'Configuración del Knowledge editable desde la UI. Fila única "singleton".';
