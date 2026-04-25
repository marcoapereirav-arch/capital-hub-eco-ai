-- Sistema de tareas compartido entre admins (GTD + PARA).
-- Reemplaza el mock anterior de src/features/tasks/services/mock-tasks.ts.
-- Multi-admin (Marco + Adrian) via la funcion is_admin() ya existente (0005).

-- =========================================
-- PARA ITEMS (Projects, Areas, Resources, Archive)
-- =========================================
create table if not exists public.para_items (
  id text primary key,
  name text not null,
  type text not null check (type in ('project', 'area', 'resource', 'archive')),
  created_at timestamptz not null default now()
);

alter table public.para_items enable row level security;

drop policy if exists "Admins manage para_items" on public.para_items;
create policy "Admins manage para_items" on public.para_items
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- =========================================
-- TASKS
-- =========================================
create table if not exists public.tasks (
  id text primary key default gen_random_uuid()::text,
  title text not null,
  description text not null default '',
  status text not null default 'inbox' check (status in ('inbox', 'next', 'waiting', 'someday', 'done')),
  priority text not null default 'normal' check (priority in ('urgent', 'high', 'normal', 'low')),
  assignee text not null default 'equipo' check (assignee in ('marco', 'adrian', 'equipo')),
  para_id text references public.para_items(id) on delete set null,
  due_date date,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  completed_at timestamptz
);

create index if not exists idx_tasks_status on public.tasks(status);
create index if not exists idx_tasks_para on public.tasks(para_id);
create index if not exists idx_tasks_assignee on public.tasks(assignee);
create index if not exists idx_tasks_created on public.tasks(created_at desc);

alter table public.tasks enable row level security;

drop policy if exists "Admins manage tasks" on public.tasks;
create policy "Admins manage tasks" on public.tasks
  for all
  using (public.is_admin())
  with check (public.is_admin());

-- updated_at trigger
create or replace function public.tasks_set_updated_at()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists tasks_set_updated_at_trigger on public.tasks;
create trigger tasks_set_updated_at_trigger
  before update on public.tasks
  for each row
  execute function public.tasks_set_updated_at();

-- =========================================
-- REALTIME (idempotente)
-- =========================================
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'tasks'
  ) then
    alter publication supabase_realtime add table public.tasks;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'para_items'
  ) then
    alter publication supabase_realtime add table public.para_items;
  end if;
end $$;

-- =========================================
-- SEED — PARA ITEMS
-- =========================================
insert into public.para_items (id, name, type) values
  ('p1', 'Funnel LT8', 'project'),
  ('p2', 'Funnel Hub + Newsletter', 'project'),
  ('p3', 'VSL', 'project'),
  ('a1', 'Marketing', 'area'),
  ('a2', 'Ventas', 'area'),
  ('a3', 'Producto', 'area'),
  ('a4', 'Operaciones', 'area'),
  ('r1', 'Brandkit', 'resource'),
  ('r2', 'SOPs', 'resource')
on conflict (id) do nothing;

-- =========================================
-- SEED — TASKS (14 tareas migradas desde mock-tasks.ts)
-- =========================================
insert into public.tasks (id, title, description, status, priority, assignee, para_id, due_date, created_at, completed_at) values
  ('t1', 'Anadir seccion de claridad en la landing (que la persona entienda el flow completo)', 'Que el visitante entienda claramente el flujo completo del producto.', 'done', 'urgent', 'marco', 'p1', '2026-04-10', '2026-04-10T08:00:00Z', '2026-04-11T10:00:00Z'),
  ('t2', 'Anadir seccion de cinturones/niveles (estilo teaser, que genere curiosidad)', 'Seccion visual tipo gamificacion con niveles/cinturones para generar curiosidad.', 'done', 'urgent', 'marco', 'p1', '2026-04-10', '2026-04-10T08:05:00Z', '2026-04-11T10:00:00Z'),
  ('t3', 'Esperar 3 dias para metricas solidas de la VSL en PandaVideo', 'Esperar a tener datos suficientes antes de tomar decisiones sobre la VSL.', 'waiting', 'high', 'equipo', 'p3', '2026-04-13', '2026-04-10T08:10:00Z', null),
  ('t4', 'Montar Funnel Hub + Newsletter', 'Crear el funnel de captacion con hub de contenido y sistema de newsletter.', 'done', 'high', 'marco', 'p2', '2026-04-13', '2026-04-10T08:15:00Z', '2026-04-11T10:00:00Z'),
  ('t5', 'Nuevos anuncios con el enfoque de JP (analisis + formacion + empleo)', 'Crear nuevas creatividades publicitarias con el angulo de analisis + formacion + empleo.', 'next', 'normal', 'marco', 'a1', '2026-04-17', '2026-04-10T08:20:00Z', null),
  ('t6', 'Si VSL no cumple KPIs -> grabar nueva VSL de 3-4 min', 'Contingencia: si las metricas de la VSL actual no cumplen, grabar una nueva version mas corta.', 'someday', 'normal', 'equipo', 'p3', null, '2026-04-10T08:25:00Z', null),
  ('t7', 'Crear pagina de gracias del Funnel Hub (post-registro formulario)', 'Cuando alguien se registra en el formulario del Funnel Hub, redirigir a una pagina de gracias.', 'done', 'high', 'marco', 'p2', null, '2026-04-11T10:00:00Z', '2026-04-11T12:00:00Z'),
  ('t8', 'Crear formulario de Busco Talento Digital', 'Formulario para empresas que buscan contratar talento digital certificado por Capital Hub.', 'next', 'high', 'marco', 'p2', null, '2026-04-11T10:05:00Z', null),
  ('t9', 'Anadir link en seccion Quiero una Carrera Digital — Empezar hoy', 'Conectar el CTA de la seccion con el destino correcto.', 'next', 'normal', 'marco', 'p2', null, '2026-04-11T10:10:00Z', null),
  ('t10', 'Anadir links en footer: terminos, privacidad y login', 'Conectar los links del footer a las paginas correspondientes de terminos de uso, politica de privacidad y login.', 'next', 'normal', 'marco', 'p2', null, '2026-04-11T10:15:00Z', null),
  ('t11', 'Anadir API de conversion al formulario de Funnel Hub y a la automatizacion', 'Integrar la API de conversion (CAPI) tanto en el formulario del Funnel Hub como en la automatizacion asociada.', 'next', 'high', 'marco', 'p2', null, '2026-04-11T12:00:00Z', null),
  ('t12', 'Cambiar dominio con Adrian', 'Coordinar con Adrian el cambio de dominio.', 'next', 'high', 'equipo', 'p2', null, '2026-04-11T12:05:00Z', null),
  ('t_ghl_oauth_v2', 'Integrar GHL API v2 (OAuth 2.0) para control total de GoHighLevel', E'Sustituir la conexion actual de GHL por API Key (v1) por un flujo OAuth 2.0 con v2 para tener acceso total a todos los recursos de GHL (read+write en contactos, pipelines, conversaciones, calendarios, campanas, workflows, tags, custom fields, payments, invoices, productos, funnels y multi-location).\n\nPasos:\n1. Crear cuenta developer en https://marketplace.gohighlevel.com/ (o iniciar sesion si ya existe).\n2. En Developer Portal -> My Apps -> Create App. Datos: APP Name ''Capital Hub OS'', Target User ''Sub-account'', Distribution ''Both Agency & Sub-account''.\n3. En Advanced Settings -> Auth configurar:\n   - Redirect URI: https://ecoai.capitalhubapp.com/api/auth/ghl/callback (+ http://localhost:3000/api/auth/ghl/callback para desarrollo local).\n   - Scopes: TODOS los disponibles para tener control total (contacts.*, conversations.*, opportunities.*, calendars.*, campaigns.*, workflows.*, locations.*, users.*, custom-fields.*, tags.*, notes.*, tasks.*, payments.*, invoices.*, products.*, funnels.*, medias.*, forms.*, surveys.*).\n4. Guardar Client ID y Client Secret en Vercel (envs: GHL_CLIENT_ID, GHL_CLIENT_SECRET) y en .env.local.\n5. En codigo:\n   - Nueva server action: iniciar flujo OAuth (redirige a https://marketplace.gohighlevel.com/oauth/chooselocation con params).\n   - Nueva route handler: /api/auth/ghl/callback que intercambia code por access_token + refresh_token, guarda en api_connections con credentials jsonb.\n   - Migrar ghl-adapter: quitar API Key v1, usar access_token con auto-refresh (Bearer Authorization). Endpoints base: https://services.leadconnectorhq.com/.\n   - Reemplazar el formulario manual de Connect GHL en /integrations por boton ''Conectar con GHL'' que dispara el OAuth.\n6. Validar con Playwright: login, conectar GHL, ver metricas reales en dashboard (CRM tab).\n\nDocs oficiales:\n- Getting started: https://help.gohighlevel.com/support/solutions/articles/155000000136\n- Create app: https://marketplace.gohighlevel.com/docs/oauth/CreateMarketplaceApp\n- OAuth 2.0: https://marketplace.gohighlevel.com/docs/Authorization/OAuth2.0/index.html\n- API Reference: https://marketplace.gohighlevel.com/docs/', 'someday', 'normal', 'equipo', 'a4', null, '2026-04-18T08:50:00Z', null),
  ('t_pwa_push_migration', 'Aplicar migracion 0006_push_notifications en Supabase de Capital Hub', E'La migracion de push notifications ya esta en supabase/migrations/0006_push_notifications.sql pero aun NO se aplico al proyecto Supabase real de Capital Hub (por error se aplico en otro proyecto; ya revisado). Hay que aplicarla en el Supabase correcto + anadir las VAPID keys en Vercel.\n\nPasos:\n1. Abrir el proyecto Supabase de Capital Hub (cuenta de Adrian u org compartida — NO nvision-saas).\n2. Dashboard > SQL Editor > pegar el contenido de supabase/migrations/0006_push_notifications.sql y ejecutar. Crea tablas push_subscriptions y notifications + RLS.\n3. Verificar en Table Editor que aparecen push_subscriptions (0 rows) y notifications (0 rows) con RLS habilitado.\n4. Anadir 4 env vars en Vercel (Production, Preview, Development):\n   - NEXT_PUBLIC_VAPID_PUBLIC_KEY: BBSaiwqrgZl-LoEC1pjf3Zg1xOWmdXcDRS1xJIN6yN8awAzUh2PEULkPKGhjY9PvUctfz_ifwUWqThSXNDhXxJg\n   - VAPID_PRIVATE_KEY: V_WRmvFs5caKX-VTAIgVPmamOiDEvirDu6khAnou5NM\n   - VAPID_SUBJECT: mailto:marcoapereirav@gmail.com\n   - SUPABASE_SERVICE_ROLE_KEY: copiarla del dashboard Supabase de Capital Hub > Settings > API > service_role (secret).\n5. Redeploy en Vercel (Deployments > ultimo deploy > Redeploy, desmarcar Use existing Build Cache).\n6. Probar: entrar a ecoai.capitalhubapp.com logueado, aparece el prompt ''Activar notificaciones?'' a los 3s, aceptar, verificar en Supabase > push_subscriptions que aparece 1 row con el endpoint.\n7. Instalar PWA: en Chrome desktop, barra URL > icono ''Instalar app''. En iPhone Safari, Compartir > Anadir a pantalla de inicio. Verificar que el icono CH monogram aparece correcto.\n\nNotas:\n- Logo CH monogram + favicons + manifest + service worker ya estan commiteados (commit 078ed71).\n- API routes /api/notifications/subscribe y /api/notifications/send ya existen.\n- Para enviar una notificacion manualmente: POST a /api/notifications/send con header Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY> y body { userId, notification: { title, body, data: { url } } }.', 'next', 'high', 'marco', 'a4', null, '2026-04-11T13:00:00Z', null)
on conflict (id) do nothing;
