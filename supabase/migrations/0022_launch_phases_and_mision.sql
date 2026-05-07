-- 0022_launch_phases_and_mision.sql
-- Misión Producto Terminado: estructura para el dashboard /mision.
-- Reutiliza public.tasks + public.para_items y añade:
--   1) tabla launch_phases (las 4 fases del lanzamiento)
--   2) columnas tasks.launch_phase_id + tasks.launch_block
--   3) ampliación del check de assignee con jp, paolo, steven

-- 1. Tabla de fases del lanzamiento
CREATE TABLE IF NOT EXISTS public.launch_phases (
  id text PRIMARY KEY,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  "order" int NOT NULL,
  target_date date NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.launch_phases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage launch_phases" ON public.launch_phases;
CREATE POLICY "Admins manage launch_phases" ON public.launch_phases
  FOR ALL TO public USING (is_admin()) WITH CHECK (is_admin());

-- 2. Extender tasks
ALTER TABLE public.tasks
  ADD COLUMN IF NOT EXISTS launch_phase_id text REFERENCES public.launch_phases(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS launch_block text;

CREATE INDEX IF NOT EXISTS idx_tasks_launch_phase_id ON public.tasks(launch_phase_id);

-- 3. Ampliar enum assignee
ALTER TABLE public.tasks DROP CONSTRAINT IF EXISTS tasks_assignee_check;
ALTER TABLE public.tasks ADD CONSTRAINT tasks_assignee_check
  CHECK (assignee = ANY (ARRAY['marco','adrian','equipo','ai','jp','paolo','steven']));
