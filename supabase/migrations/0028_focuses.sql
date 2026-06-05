-- 0028_focuses.sql
-- Sistema de "Focos" (sprints): agrupa proyectos transversalmente bajo un
-- objetivo temporal concreto (ej: "Webinar 8/8/2026").
-- Un foco agrupa N proyectos. Un proyecto puede pertenecer a 0 o 1 foco.

create table if not exists public.focuses (
  id text primary key,
  name text not null,
  description text,
  start_date date,
  end_date date,
  color text not null default 'amber',
  active boolean not null default true,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_focuses_active on public.focuses(active, sort_order);

alter table public.para_items
  add column if not exists focus_id text references public.focuses(id) on delete set null;
create index if not exists idx_para_items_focus on public.para_items(focus_id);

-- RLS
alter table public.focuses enable row level security;
drop policy if exists "service_role_all_focuses" on public.focuses;
create policy "service_role_all_focuses" on public.focuses for all to service_role using (true) with check (true);
drop policy if exists "auth_all_focuses" on public.focuses;
create policy "auth_all_focuses" on public.focuses for all to authenticated using (true) with check (true);

-- Seed: foco principal "Webinar 8/8/2026"
insert into public.focuses (id, name, description, start_date, end_date, color, sort_order)
values (
  'focus_webinar_880',
  'Webinar en directo 8/8/2026',
  'Foco principal del negocio. Lanzamiento high-ticket via webinar live el 8 ago 2026. Incluye App alumnos, Sistema venta+KPI, Calendario propio, Pipeline closing, Adquisicion organica + cold outreach IG, Formaciones IA/MBD.',
  '2026-06-03',
  '2026-08-08',
  'amber',
  1
)
on conflict (id) do update set name = excluded.name, description = excluded.description,
  start_date = excluded.start_date, end_date = excluded.end_date,
  color = excluded.color, updated_at = now();

-- Asignar todos los proyectos plan 8/8 a este foco
update public.para_items
set focus_id = 'focus_webinar_880'
where id like 'proj_880_%';
