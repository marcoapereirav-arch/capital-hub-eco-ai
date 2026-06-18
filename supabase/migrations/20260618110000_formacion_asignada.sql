-- Añadir columna formacion_asignada para formadores
-- Permite que un formador edite SOLO su ruta (IA / Media Buyer / Comercial)
-- Las 3 rutas canónicas: 'ia-integrator', 'media-buyer-digital', 'comercial-closing'
-- NULL = no aplica (super_admin, marketing, closer, setter, etc.)

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS formacion_asignada text;

COMMENT ON COLUMN public.profiles.formacion_asignada IS
  'Slug de la ruta que un formador puede editar. Valores: ia-integrator, media-buyer-digital, comercial-closing, NULL';

ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_formacion_asignada_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_formacion_asignada_check
  CHECK (formacion_asignada IS NULL OR formacion_asignada = ANY (ARRAY[
    'ia-integrator'::text,
    'media-buyer-digital'::text,
    'comercial-closing'::text
  ]));

-- También en public.users (tabla de la App) para que la App lo lea sin JOIN
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS formacion_asignada text;

COMMENT ON COLUMN public.users.formacion_asignada IS
  'Mismo valor que profiles.formacion_asignada. Propagado por endpoint /team del OS.';

ALTER TABLE public.users
  DROP CONSTRAINT IF EXISTS users_formacion_asignada_check;

ALTER TABLE public.users
  ADD CONSTRAINT users_formacion_asignada_check
  CHECK (formacion_asignada IS NULL OR formacion_asignada = ANY (ARRAY[
    'ia-integrator'::text,
    'media-buyer-digital'::text,
    'comercial-closing'::text
  ]));
