-- 0024_para_items_hierarchy_and_finanzas.sql
-- Jerarquía PARA: proyectos cuelgan de áreas via parent_id (self-FK).
-- Crea el área "Finanzas" que faltaba.
-- Limpia el área huérfana "API move pipeline oportunidad" (0 tasks, sin sentido).

-- 1. Self-referential parent_id (un proyecto puede tener un área como parent)
alter table public.para_items
  add column if not exists parent_id text references public.para_items(id) on delete set null;

create index if not exists idx_para_items_parent_id on public.para_items(parent_id);

-- 2. Crear área "Finanzas" (id determinista para que sea idempotente)
insert into public.para_items (id, name, type, status)
values ('area_finanzas', 'Finanzas', 'area', 'active')
on conflict (id) do update set name = excluded.name, type = excluded.type;

-- 3. Limpiar área obsoleta sin tasks (la borramos a Archivo en lugar de DELETE
--    para no perder histórico si alguien le había metido algo)
update public.para_items
set type = 'archive', status = 'completed'
where name = 'API move pipeline oportunidad'
  and not exists (select 1 from public.tasks where para_id = para_items.id);

-- 4. Comentarios para que quede claro el modelo
comment on column public.para_items.parent_id is
  'Padre PARA: un proyecto puede colgar de un área (area_marketing, area_producto, area_ventas, area_finanzas).';
