-- Onboarding alumno: campo profession (simple text, opcional)
-- Decisión Marco 2026-06-18: onboarding mínimo = foto + nombre + profesión actual (con default) + bio.
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS profession text;

COMMENT ON COLUMN public.users.profession IS
  'Profesión actual del alumno (texto libre). Default UI: "Estudiante en Capital Hub". Opcional.';
