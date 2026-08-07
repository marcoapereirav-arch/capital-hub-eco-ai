-- Afiliados: el sistema completo.
--
-- Marco (2026-08-07): "el link no puede ir solo a test de personalidad... yo lo quiero
-- crear directamente con cualquier funnel que yo quiera... tienes que crear este sistema".
--
-- Que anade:
--   1. contacts.funnel_slug  · por que funnel entro el contacto (para cruzar afiliado x funnel)
--   2. affiliate_links       · los links que se crean, uno por afiliado y funnel
--   3. affiliate_visits      · las visitas de cada link (el traqueo, funnel a funnel)
--   4. La etiqueta fuente:<afiliado> para los afiliados que ya existen, y puesta hacia atras
--      en los contactos que ya tenian fuente guardada pero se quedaron sin etiqueta.
--
-- Es ADITIVA: no borra ni una fila. Lo unico que toca de lo que ya existe es rellenar la
-- columna nueva `funnel_slug` (que nace vacia) y poner etiquetas que faltaban.

begin;

-- =========================================================
-- 1 · De que funnel vino el contacto
--     Hoy solo se sabe por `origin`, que es texto libre y distinto en cada funnel.
--     `funnel_slug` guarda el slug canonico del catalogo (webinar, test-personalidad...).
-- =========================================================
alter table public.contacts add column if not exists funnel_slug text;
create index if not exists idx_contacts_funnel_slug on public.contacts(funnel_slug);

-- Relleno hacia atras desde el `origin` que ya se venia guardando.
update public.contacts set funnel_slug = 'webinar'
  where funnel_slug is null and origin = 'landing_webinar';
update public.contacts set funnel_slug = 'test-personalidad'
  where funnel_slug is null and origin = 'landing_test_personalidad';
update public.contacts set funnel_slug = 'reservar'
  where funnel_slug is null and origin in ('calendly_direct', 'calendly');

-- =========================================================
-- 2 · Los links de afiliado
--     Un link = un afiliado + un funnel. El destino ya NO esta escrito a fuego en el
--     codigo: se elige aqui. La lista de funnels sale del catalogo unico del OS.
-- =========================================================
create table if not exists public.affiliate_links (
  id uuid primary key default gen_random_uuid(),
  affiliate_slug text not null references public.affiliates(slug) on delete cascade,
  funnel_slug text not null,
  active boolean not null default true,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  unique (affiliate_slug, funnel_slug)
);
create index if not exists idx_affiliate_links_affiliate on public.affiliate_links(affiliate_slug);

alter table public.affiliate_links enable row level security;
-- Lectura para cualquier usuario del OS. Escritura solo por la API admin (service role).
drop policy if exists "affiliate_links_select_authenticated" on public.affiliate_links;
create policy "affiliate_links_select_authenticated" on public.affiliate_links
  for select to authenticated using (true);

-- =========================================================
-- 3 · Las visitas de cada link (el traqueo)
--     Un lead solo aparece si la persona rellena un formulario. La visita se registra
--     SIEMPRE, aunque el funnel no capture nada (LT8, MIFGE). Es lo que permite decir
--     "este link se uso 40 veces y no trajo ni un lead" en vez de no saber nada.
-- =========================================================
create table if not exists public.affiliate_visits (
  id uuid primary key default gen_random_uuid(),
  affiliate_slug text not null,
  funnel_slug text,
  path text,
  -- Clave de navegador, para no contar diez veces a la misma persona navegando.
  visitor_key text,
  created_at timestamptz not null default now(),
  -- El dia se guarda aparte a proposito: Postgres no deja usar `created_at::date` dentro
  -- de un indice unico (el resultado depende de la zona horaria y no es inmutable).
  visit_day date not null default (now() at time zone 'utc')::date
);
create index if not exists idx_affiliate_visits_slug_fecha
  on public.affiliate_visits(affiliate_slug, created_at desc);
create index if not exists idx_affiliate_visits_funnel on public.affiliate_visits(funnel_slug);
-- Una visita por navegador, funnel y dia: lo que interesa es cuanta gente distinta entro,
-- no cuantas veces recargo la pagina.
create unique index if not exists uq_affiliate_visits_dia
  on public.affiliate_visits(affiliate_slug, funnel_slug, visitor_key, visit_day)
  where visitor_key is not null;

alter table public.affiliate_visits enable row level security;
drop policy if exists "affiliate_visits_select_authenticated" on public.affiliate_visits;
create policy "affiliate_visits_select_authenticated" on public.affiliate_visits
  for select to authenticated using (true);
-- Sin policy de insert a proposito: la visita entra por la API con service role, que es
-- quien valida que el afiliado existe. Asi nadie puede inflar los numeros desde fuera.

-- =========================================================
-- 4 · La etiqueta de quien lo trajo, para los afiliados que ya existen
--     Antes la etiqueta nacia con el primer lead. Si nadie entraba, no existia, y no se
--     podia filtrar por ella en el CRM.
-- =========================================================
insert into public.tags (name, color, description)
select 'fuente:' || a.slug, '#3F3F46', 'Lead traido por el afiliado ' || a.name
from public.affiliates a
where not exists (select 1 from public.tags t where t.name = 'fuente:' || a.slug);

-- Y puesta hacia atras en los contactos que ya tenian fuente guardada sin etiqueta.
insert into public.contact_tags (contact_id, tag_id)
select c.id, t.id
from public.contacts c
join public.tags t on t.name = 'fuente:' || c.affiliate_slug
where c.affiliate_slug is not null
  and not exists (
    select 1 from public.contact_tags ct where ct.contact_id = c.id and ct.tag_id = t.id
  );

commit;
