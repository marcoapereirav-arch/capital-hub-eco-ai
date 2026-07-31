-- Tutoriales: refuerzos del arbol (PRP-008 v2).
--
-- Salen de una revision de riesgos hecha antes de terminar la pantalla.
-- NOTA: la revision afirmaba ademas que `is_admin()` no reconocia a los
-- super_admin. Se comprobo contra la base viva y es FALSO: la funcion ya
-- incluye 'super_admin' y comprueba `active`. No se toca.

-- ------------------------------------------------- nombres con sentido

alter table public.tutorial_folders drop constraint if exists tutorial_folders_nombre_no_vacio;
alter table public.tutorial_folders
  add constraint tutorial_folders_nombre_no_vacio check (length(trim(nombre)) > 0);

alter table public.tutorials drop constraint if exists tutorials_titulo_no_vacio;
alter table public.tutorials
  add constraint tutorials_titulo_no_vacio check (length(trim(titulo)) > 0);

/* Dos carpetas con el mismo nombre en el mismo sitio no se distinguen.
 *
 * Hacen falta DOS indices y no uno: en Postgres dos NULL se consideran
 * distintos, asi que un unique (parent_id, nombre) dejaria pasar duplicados
 * justo en la raiz, que es donde mas se nota. */
create unique index if not exists tutorial_folders_nombre_raiz_uniq
  on public.tutorial_folders (lower(trim(nombre))) where parent_id is null;

create unique index if not exists tutorial_folders_nombre_hijo_uniq
  on public.tutorial_folders (parent_id, lower(trim(nombre))) where parent_id is not null;

-- --------------------------------------------- el orden al cambiar de sitio

/* Al mover algo de carpeta, va al final de su nuevo sitio.
 *
 * Sin esto conserva el numero de orden que traia y aterriza empatado con una
 * hermana. Postgres devuelve los empates en el orden que quiere, y ademas ese
 * orden CAMBIA al editar cualquier otra fila: las tarjetas se recolocan solas
 * sin que nadie haya tocado nada. */
create or replace function public.tutorial_orden_al_mover()
returns trigger language plpgsql as $$
declare siguiente int;
begin
  if tg_table_name = 'tutorial_folders' then
    -- `is not distinct from` y no `=`: con `=` la raiz (null) nunca coincide
    -- y el disparador no saltaria nunca al mover a la raiz.
    if new.parent_id is not distinct from old.parent_id then return new; end if;
    select coalesce(max(display_order), -1) + 1 into siguiente
      from public.tutorial_folders
     where parent_id is not distinct from new.parent_id and id <> new.id;
  else
    if new.folder_id is not distinct from old.folder_id then return new; end if;
    select coalesce(max(display_order), -1) + 1 into siguiente
      from public.tutorials
     where folder_id = new.folder_id and id <> new.id;
  end if;

  new.display_order := siguiente;
  return new;
end $$;

drop trigger if exists tutorial_folders_orden_trg on public.tutorial_folders;
create trigger tutorial_folders_orden_trg
  before update of parent_id on public.tutorial_folders
  for each row execute function public.tutorial_orden_al_mover();

drop trigger if exists tutorials_orden_trg on public.tutorials;
create trigger tutorials_orden_trg
  before update of folder_id on public.tutorials
  for each row execute function public.tutorial_orden_al_mover();

-- ------------------------------------- que hay dentro, hasta el fondo

/* Todos los videos que cuelgan de una carpeta, a cualquier profundidad.
 *
 * Sirve para que al borrar una carpeta se borren TAMBIEN sus videos en Bunny.
 * Sin esto, un borrado en la raiz deja decenas de archivos pagandose para
 * siempre y sin ninguna fila que los nombre para poder encontrarlos luego.
 *
 * `union` y no `union all`: descarta repetidos, asi que termina aunque los
 * datos tuvieran un anillo. El disparador ya lo impide, pero esto no depende
 * de que aquel siga estando.
 *
 * SECURITY INVOKER: se ejecuta con los permisos de quien llama, asi que la RLS
 * sigue mandando y por aqui no se puede leer nada que no se pudiera leer ya. */
create or replace function public.tutorial_subarbol(raiz uuid)
returns table (tutorial_id uuid, fuente text, bunny_video_id text)
language sql
stable
security invoker
set search_path to 'public'
as $$
  with recursive rama as (
    select f.id from public.tutorial_folders f where f.id = raiz
    union
    select h.id from public.tutorial_folders h join rama r on h.parent_id = r.id
  )
  select t.id, t.fuente, t.bunny_video_id
    from public.tutorials t
    join rama r on r.id = t.folder_id;
$$;
