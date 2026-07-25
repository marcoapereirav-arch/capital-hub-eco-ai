-- Knowledge en BD (base) — contrato de new-ecoai, adaptado a Capital Hub.
-- ADITIVO: crea SOLO la tabla nueva 'knowledges'. No toca ninguna tabla existente.
-- Seguridad a la medida de Capital Hub: admin = profiles.role='super_admin'.
--   super_admin: acceso total.  equipo (profiles.active): solo lectura.
--   alumnos (viven en 'users', no en 'profiles'): CERO acceso.
CREATE TABLE IF NOT EXISTS public.knowledges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  description text DEFAULT '',
  content_md text NOT NULL DEFAULT '',
  quadrant text NOT NULL,
  subfolder text,
  position integer DEFAULT 0,
  active boolean DEFAULT true,
  archived_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_knowledges_quadrant ON public.knowledges(quadrant);

CREATE OR REPLACE FUNCTION public.knowledges_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at := now(); RETURN NEW; END; $$;
DROP TRIGGER IF EXISTS trg_knowledges_touch ON public.knowledges;
CREATE TRIGGER trg_knowledges_touch BEFORE UPDATE ON public.knowledges
FOR EACH ROW EXECUTE FUNCTION public.knowledges_touch_updated_at();

ALTER TABLE public.knowledges ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "kn_admin_all" ON public.knowledges;
CREATE POLICY "kn_admin_all" ON public.knowledges FOR ALL TO public
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.active))
WITH CHECK (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.role = 'super_admin' AND p.active));
DROP POLICY IF EXISTS "kn_team_read" ON public.knowledges;
CREATE POLICY "kn_team_read" ON public.knowledges FOR SELECT TO authenticated
USING (EXISTS (SELECT 1 FROM public.profiles p WHERE p.id = auth.uid() AND p.active));
