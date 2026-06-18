-- Permite a todos los usuarios autenticados (alumnos App + equipo OS) ver
-- los profiles del equipo OS (super_admin, closer, setter, marketing, formador).
-- Sin esto, un alumno autenticado solo veía su propio profile y no podía cargar
-- la pestaña Miembros con el equipo visible.
--
-- IMPORTANTE: esta policy expone email + full_name + avatar_url + role.
-- No expone phone, settings ni nada sensible. Si en el futuro añadimos columnas
-- privadas a profiles, hay que crear una view pública con whitelist.

create policy "Authenticated can view team profiles"
  on public.profiles for select
  to authenticated
  using (
    role in ('super_admin', 'closer', 'setter', 'marketing', 'formador')
  );
