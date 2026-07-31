-- Tutoriales: carpetas dentro de carpetas, tipo Google Drive (PRP-008 v2).
--
-- Marco (2026-07-31): "quiero que la parte de los tutoriales sea como si fuese un
-- Google Drive. Tenemos carpetas que vemos y, dentro de carpetas, podemos crear
-- carpetas, y dentro de carpetas lecciones, y asi sucesivamente".
--
-- Raiz = parent_id is null. Sin limite de niveles.

alter table public.tutorial_folders
  add column if not exists parent_id uuid references public.tutorial_folders(id) on delete cascade;

create index if not exists tutorial_folders_parent_idx
  on public.tutorial_folders (parent_id, display_order);

-- Portada del video. Bunny la genera sola; en Loom la da su oEmbed al pegar el link.
alter table public.tutorials
  add column if not exists miniatura text;

-- ------------------------------------------------------- sin bucles

/* Una carpeta no puede ser su propia antepasada.
 *
 * Sin esto, mover A dentro de B cuando B ya cuelga de A crea un anillo: esas
 * carpetas desaparecen de la raiz (ya no cuelgan de ella), no hay forma de
 * llegar a ellas desde la pantalla, y cualquier recorrido del arbol se queda
 * dando vueltas para siempre. No se puede reparar desde la interfaz porque
 * la interfaz ya no las muestra.
 *
 * Se comprueba en la propia base y no solo en la pantalla: la regla tiene que
 * valer tambien para lo que entre por la API. */
create or replace function public.tutorial_folders_sin_bucles()
returns trigger
language plpgsql
as $$
declare
  actual uuid := new.parent_id;
  saltos int := 0;
begin
  if new.parent_id is null then
    return new;
  end if;

  if new.parent_id = new.id then
    raise exception 'Una carpeta no puede estar dentro de si misma.';
  end if;

  -- Se sube por los padres. Si aparece la propia carpeta, seria un anillo.
  while actual is not null loop
    if actual = new.id then
      raise exception 'No se puede mover una carpeta dentro de una de sus subcarpetas.';
    end if;

    saltos := saltos + 1;
    -- Cinturon por si ya hubiera un anillo de antes: nunca un bucle infinito.
    if saltos > 100 then
      raise exception 'El arbol de carpetas es demasiado profundo o esta corrupto.';
    end if;

    select parent_id into actual from public.tutorial_folders where id = actual;
  end loop;

  return new;
end $$;

drop trigger if exists tutorial_folders_sin_bucles_trg on public.tutorial_folders;
create trigger tutorial_folders_sin_bucles_trg
  before insert or update of parent_id on public.tutorial_folders
  for each row execute function public.tutorial_folders_sin_bucles();

-- --------------------------------------------- el arbol de una sentada

/* La ruta de una carpeta hasta la raiz, para las migas de pan.
 *
 * SECURITY INVOKER a proposito: se ejecuta con los permisos de quien llama, asi
 * que la RLS de tutorial_folders sigue aplicando y nadie puede leer por aqui lo
 * que no podria leer por la tabla. */
create or replace function public.tutorial_folder_ruta(destino uuid)
returns table (id uuid, nombre text, nivel int)
language sql
stable
security invoker
set search_path to 'public'
as $$
  with recursive subida as (
    select f.id, f.nombre, f.parent_id, 0 as nivel
      from public.tutorial_folders f
     where f.id = destino
    union all
    select p.id, p.nombre, p.parent_id, s.nivel + 1
      from public.tutorial_folders p
      join subida s on p.id = s.parent_id
     where s.nivel < 100
  )
  select subida.id, subida.nombre, subida.nivel
    from subida
   order by nivel desc;
$$;
