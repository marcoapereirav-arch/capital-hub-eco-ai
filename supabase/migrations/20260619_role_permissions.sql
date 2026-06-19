-- Matriz de permisos por rol del OS.
-- Cada row = ese role puede acceder a esa route_href del nav.
-- super_admin tiene acceso a TODO sin entry en esta tabla (gate en código).
--
-- Decisión Marco 2026-06-19: convertir el array hardcoded ROLE_ROUTES en
-- supabase/lib/auth/role-access.ts a tabla BD para que pueda editar la matriz
-- con checkboxes desde /team sin redeploy.

create table if not exists public.role_permissions (
  role text not null,
  route_href text not null,
  primary key (role, route_href)
);

alter table public.role_permissions enable row level security;

-- Cualquier authenticated puede leer (necesario para que la App/Sidebar resuelva
-- los permisos del rol del usuario logueado).
create policy "authenticated read role_permissions"
  on public.role_permissions for select
  to authenticated
  using (true);

-- Solo super_admin puede modificar.
create policy "super_admin manage role_permissions"
  on public.role_permissions for all
  to authenticated
  using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  )
  with check (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.role = 'super_admin')
  );

-- Seed inicial con los valores que tenía ROLE_ROUTES hardcoded.
insert into public.role_permissions (role, route_href) values
  ('marketing', '/dashboard'),
  ('marketing', '/overview'),
  ('marketing', '/operaciones'),
  ('marketing', '/crm'),
  ('marketing', '/contactos'),
  ('marketing', '/webs'),
  ('marketing', '/webs/lead-magnets'),
  ('formador', '/dashboard'),
  ('formador', '/overview'),
  ('formador', '/operaciones'),
  ('formador', '/crm'),
  ('formador', '/contactos'),
  ('closer', '/dashboard'),
  ('closer', '/overview'),
  ('closer', '/operaciones'),
  ('closer', '/crm'),
  ('closer', '/contactos'),
  ('setter', '/dashboard'),
  ('setter', '/overview'),
  ('setter', '/operaciones'),
  ('setter', '/crm'),
  ('setter', '/contactos')
on conflict do nothing;
