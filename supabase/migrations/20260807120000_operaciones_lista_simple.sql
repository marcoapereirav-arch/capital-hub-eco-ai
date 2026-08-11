-- Operaciones deja de ser un sistema y pasa a ser UNA lista de tareas.
--
-- Marco (2026-08-07): "nuestro sistema de tareas lo vamos a eliminar: el board, las
-- tareas, los proyectos, las areas, todo. Lo vamos a organizar solo en un nivel de
-- tareas. Sera una lista de todo".
--
-- La tarea queda con: titulo, descripcion, prioridad P1/P2/P3, responsable (una persona
-- real del OS) y estado pendiente/hecha/archivada. Nada mas.
--
-- Copia de seguridad previa de las 510 tareas, 39 proyectos/areas, 1 foco y 4 fases de
-- mision en archivo/backup-operaciones-2026-08-07.json (fuera de git, es un artefacto).

begin;

-- =========================================================
-- 1 · Fuera lo que no se queda
--     · todo lo que no estaba hecho (247 tareas)
--     · todo lo de Mision, que se borra de raiz (67 tareas)
-- =========================================================
delete from public.tasks
where status <> 'done'
   or para_id = 'p_mision_producto_terminado';

-- =========================================================
-- 2 · Prioridad: P1 / P2 / P3
--     urgente y alta -> P1 · normal -> P2 · baja -> P3
-- =========================================================
alter table public.tasks drop constraint if exists tasks_priority_check;

update public.tasks
   set priority = case
     when priority in ('urgent', 'high') then 'P1'
     when priority = 'low' then 'P3'
     else 'P2'
   end;

alter table public.tasks alter column priority set default 'P2';
alter table public.tasks
  add constraint tasks_priority_check check (priority in ('P1', 'P2', 'P3'));

-- =========================================================
-- 3 · Estado: pendiente / hecha / archivada
--     Lo que sobrevive al paso 1 estaba hecho.
-- =========================================================
alter table public.tasks drop constraint if exists tasks_status_check;

update public.tasks set status = 'hecha';

alter table public.tasks alter column status set default 'pendiente';
alter table public.tasks
  add constraint tasks_status_check check (status in ('pendiente', 'hecha', 'archivada'));

-- =========================================================
-- 4 · Responsable: una persona REAL del OS, no un texto a mano
--     Los nombres viejos que si son personas del OS se enganchan a su perfil.
--     'ai', 'equipo', 'jp' y 'steven' no lo son: se quedan sin responsable.
-- =========================================================
alter table public.tasks
  add column if not exists assignee_id uuid references public.profiles(id) on delete set null;

update public.tasks t
   set assignee_id = p.id
  from public.profiles p
 where p.email = case t.assignee
   when 'marco'  then 'marcoapereirav@gmail.com'
   when 'adrian' then 'adrianvillanuevarios@gmail.com'
   when 'paolo'  then 'paolo@sales-capital.com'
   else null
 end;

alter table public.tasks drop column if exists assignee;

-- =========================================================
-- 5 · Fuera todo lo que ya no existe
-- =========================================================
alter table public.tasks drop column if exists para_id;
alter table public.tasks drop column if exists due_date;
alter table public.tasks drop column if exists depends_on;
alter table public.tasks drop column if exists is_in_progress;
alter table public.tasks drop column if exists launch_phase_id;
alter table public.tasks drop column if exists launch_block;

drop table if exists public.para_items cascade;
drop table if exists public.focuses cascade;
drop table if exists public.launch_phases cascade;

-- =========================================================
-- 6 · Indices al dia
-- =========================================================
drop index if exists public.idx_tasks_para;
drop index if exists public.idx_tasks_assignee;
drop index if exists public.idx_tasks_depends_on;
drop index if exists public.idx_tasks_in_progress;

create index if not exists idx_tasks_assignee_id on public.tasks(assignee_id);
create index if not exists idx_tasks_priority on public.tasks(priority);
create index if not exists idx_tasks_status_new on public.tasks(status);

-- =========================================================
-- 7 · Quien puede verla
--
-- Hasta hoy la politica era is_admin(), o sea SOLO super_admin. Pero ahora la tarea
-- lleva responsable, y el responsable puede ser cualquier persona del OS (marketing,
-- setter, closer, formador). Una tarea asignada a alguien que no puede abrirla no
-- sirve de nada, y todos esos roles YA tienen permiso de ruta sobre /operaciones
-- (src/lib/auth/role-access.ts).
--
-- La lista es del equipo: la ve y la gestiona cualquier usuario ACTIVO del OS.
-- Sigue habiendo RLS: quien no tenga perfil activo no lee ni escribe nada.
-- =========================================================
create or replace function public.is_os_user()
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and coalesce(active, true) = true
  );
$$;

drop policy if exists "Admins manage tasks" on public.tasks;
drop policy if exists "OS users manage tasks" on public.tasks;
create policy "OS users manage tasks" on public.tasks
  for all
  using (public.is_os_user())
  with check (public.is_os_user());

commit;
