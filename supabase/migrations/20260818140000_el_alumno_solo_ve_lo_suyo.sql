-- EL ALUMNO SOLO VE LO SUYO. Nada del negocio.
--
-- COMO SALIO (2026-08-18): se creo un alumno de prueba de cada producto, se
-- entro de verdad con su usuario y contraseña, y se pidieron todas las tablas
-- una por una. Las lecciones, los modulos y los posts SI estaban bien cerrados.
-- Lo que estaba abierto de par en par era el negocio entero:
--
--   email_logs                86 filas · TODOS los correos enviados, con destinatario y asunto
--   team_invitations           7 filas · incluido el TOKEN de invitacion al equipo
--   contact_journey_events   173 filas · el historial de cada lead del CRM
--   contact_tags             128 filas
--   meta_events_log          200 filas · eventos de publicidad
--   profiles                   9 filas · el equipo al completo, con nombres y correos
--   affiliates                 4 filas
--   mifge_leads / calendly_scheduled_events / tags / pipelines / role_permissions
--
-- Lo del token era lo peor: con una invitacion al equipo pendiente, un alumno
-- podia aceptarla y entrar al OS como equipo. Comprobado que no habia ninguna
-- viva en ese momento (0), asi que no se exploto.
--
-- Todas estas tablas tenian `using (true)`, que es "que lo lea cualquiera que
-- haya iniciado sesion". Y desde que la App y el OS comparten la misma base,
-- "cualquiera que haya iniciado sesion" INCLUYE a los alumnos.

begin;

-- 1 · Las tablas del negocio: solo el equipo del OS.
do $$
declare t text;
begin
  foreach t in array array[
    'email_logs','email_messages','email_events','email_suppressions',
    'team_invitations','affiliates','mifge_leads',
    'contact_journey_events','contact_tags','meta_events_log',
    'calendly_scheduled_events','tags','pipelines','pipeline_stages',
    'role_permissions'
  ]
  loop
    if to_regclass('public.'||t) is null then continue; end if;
    execute format('drop policy if exists %I on public.%I', t||'_select_all', t);
    execute format('drop policy if exists %I on public.%I', 'Authenticated can view '||t, t);
    -- se retiran TODAS las de lectura y se pone una sola, clara
    execute (
      select coalesce(string_agg(format('drop policy if exists %I on public.%I;', policyname, t), ' '), '')
      from pg_policies where schemaname='public' and tablename=t and cmd='SELECT'
    );
    execute format(
      'create policy %I on public.%I for select using (public.is_os_user())',
      t||'_select_equipo', t);
  end loop;
end $$;

-- 2 · El equipo (profiles): cada uno se ve a si mismo; la lista completa, solo
--     quien es del equipo. Antes la veia cualquiera con cuenta.
drop policy if exists "Authenticated can view team profiles" on public.profiles;
drop policy if exists profiles_select_equipo on public.profiles;
create policy profiles_select_equipo
  on public.profiles for select
  using (public.is_os_user() or auth.uid() = id);

-- 3 · El catalogo: el alumno ve SOLO la formacion que compro.
--     Antes veia los nombres de las tres.
drop policy if exists routes_select_all on public.routes;
create policy routes_select_all
  on public.routes for select
  using (
    public.es_staff()
    or public.is_os_user()
    or (active = true and product_key = any (public.mis_product_keys()))
  );

drop policy if exists formations_select_all on public.formations;
create policy formations_select_all
  on public.formations for select
  using (
    public.es_staff()
    or public.is_os_user()
    or (active = true and public.puede_ver_formacion(id))
  );

-- 4 · Las comunidades: igual. Solo la suya.
drop policy if exists communities_select_all on public.communities;
create policy communities_select_all
  on public.communities for select
  using (public.user_can_see_community(id));

commit;
