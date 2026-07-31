-- Tutoriales: formacion interna del equipo (PRP-008).
--
-- Dos tablas: carpetas y tutoriales. Un tutorial trae su video de una de dos
-- fuentes, a eleccion de quien lo sube: archivo subido a Bunny, o link de Loom.
--
-- Candados: se copia el patron ya probado de `knowledges` (SOP producto/54).
--   · Lee: cualquiera con fila activa en `profiles` (= equipo interno del OS).
--     Los alumnos viven en `users`, NO en `profiles`, asi que quedan fuera solos.
--   · Escribe: solo super_admin / admin, via el helper `is_admin()` que ya existe.

create table if not exists public.tutorial_folders (
  id            uuid primary key default gen_random_uuid(),
  nombre        text not null,
  descripcion   text,
  display_order int  not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.tutorials (
  id             uuid primary key default gen_random_uuid(),
  folder_id      uuid not null references public.tutorial_folders(id) on delete cascade,
  titulo         text not null,
  descripcion    text,

  -- De donde sale el video.
  fuente         text not null default 'bunny' check (fuente in ('bunny','loom')),
  bunny_video_id text,
  loom_url       text,

  duracion_seg   int,
  status         text not null default 'draft' check (status in ('draft','published')),
  display_order  int  not null default 0,
  created_by     uuid references auth.users(id) on delete set null,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),

  -- Cada fuente exige su propio dato y solo el suyo. Evita fichas a medias
  -- que en pantalla se ven como un reproductor roto.
  constraint tutorials_fuente_coherente check (
    (fuente = 'bunny' and loom_url is null)
    or (fuente = 'loom' and loom_url is not null and bunny_video_id is null)
  ),

  -- Publicar exige tener video. Un borrador puede estar vacio; lo publicado no.
  constraint tutorials_publicado_con_video check (
    status = 'draft'
    or (fuente = 'bunny' and bunny_video_id is not null)
    or (fuente = 'loom'  and loom_url is not null)
  )
);

create index if not exists tutorials_folder_idx on public.tutorials (folder_id, display_order);

-- updated_at al vuelo
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists tutorial_folders_touch on public.tutorial_folders;
create trigger tutorial_folders_touch before update on public.tutorial_folders
  for each row execute function public.touch_updated_at();

drop trigger if exists tutorials_touch on public.tutorials;
create trigger tutorials_touch before update on public.tutorials
  for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------- candados

alter table public.tutorial_folders enable row level security;
alter table public.tutorials        enable row level security;

drop policy if exists tf_team_read  on public.tutorial_folders;
drop policy if exists tf_admin_all  on public.tutorial_folders;
drop policy if exists tut_team_read on public.tutorials;
drop policy if exists tut_admin_all on public.tutorials;

-- Las carpetas las ve el equipo interno entero.
create policy tf_team_read on public.tutorial_folders
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
  );

create policy tf_admin_all on public.tutorial_folders
  for all using (public.is_admin()) with check (public.is_admin());

-- El equipo ve lo publicado. Los borradores solo los ve quien administra.
create policy tut_team_read on public.tutorials
  for select using (
    exists (select 1 from public.profiles p where p.id = auth.uid() and p.active)
    and (status = 'published' or public.is_admin())
  );

create policy tut_admin_all on public.tutorials
  for all using (public.is_admin()) with check (public.is_admin());

-- ------------------------------------------------- quien ve la seccion
-- Marco decidio (2026-07-31): todo el equipo interno, no solo formadores.
insert into public.role_permissions (role, route_href) values
  ('marketing','/tutoriales'),
  ('formador','/tutoriales'),
  ('closer','/tutoriales'),
  ('setter','/tutoriales')
on conflict do nothing;
