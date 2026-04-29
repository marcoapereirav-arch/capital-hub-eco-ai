-- Anadir campo depends_on a tasks para construir el grafo del Board.
-- Cada task puede depender de N otras tasks (array de ids).
-- Si depends_on contiene 't_X', significa "esta task no se puede empezar hasta que t_X este 'done'".

alter table public.tasks add column if not exists depends_on text[] default '{}'::text[];

create index if not exists idx_tasks_depends_on on public.tasks using gin(depends_on);

comment on column public.tasks.depends_on is
  'Array de task ids de los que depende esta task. Usado por el Board grafico para dibujar aristas.';
