alter table public.tasks add column if not exists is_in_progress boolean default false;
create index if not exists idx_tasks_in_progress on public.tasks(is_in_progress) where is_in_progress = true;
comment on column public.tasks.is_in_progress is 'Flag para marcar tasks que se estan trabajando AHORA. Se activa/desactiva manual o automaticamente desde el chat. Las que tengan true parpadean en el board.';
