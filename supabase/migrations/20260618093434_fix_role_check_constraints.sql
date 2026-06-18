-- Fix CHECK constraints de role: añadir 'marketing' y 'setter', quitar 'equipo' (nunca fue rol real).
-- Problema: invitar a alguien con rol marketing/setter desde /team fallaba porque la BD rechazaba el insert.

-- profiles.role
ALTER TABLE public.profiles
  DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles
  ADD CONSTRAINT profiles_role_check
  CHECK (role = ANY (ARRAY[
    'super_admin'::text,
    'admin'::text,
    'marketing'::text,
    'closer'::text,
    'setter'::text,
    'formador'::text
  ]));

-- team_invitations.role
ALTER TABLE public.team_invitations
  DROP CONSTRAINT IF EXISTS team_invitations_role_check;

ALTER TABLE public.team_invitations
  ADD CONSTRAINT team_invitations_role_check
  CHECK (role = ANY (ARRAY[
    'super_admin'::text,
    'admin'::text,
    'marketing'::text,
    'closer'::text,
    'setter'::text,
    'formador'::text
  ]));
