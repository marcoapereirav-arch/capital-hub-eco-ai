-- Funnel: atribución por fuente (afiliados) + ajustes editables (Test/Live, CTA links)
-- Ver SOPs: marketing/07-funnel-test-personalidad, producto/48 (diseño)

-- 1) Afiliados / fuentes de tráfico (Paolo, JP, futuros)
create table if not exists public.affiliates (
  slug text primary key,
  name text not null,
  active boolean not null default true,
  created_at timestamptz not null default now()
);
alter table public.affiliates enable row level security;
-- Lectura para usuarios autenticados del OS; escritura solo vía service role (API admin).
drop policy if exists "affiliates_select_authenticated" on public.affiliates;
create policy "affiliates_select_authenticated" on public.affiliates
  for select to authenticated using (true);

-- 2) Atribución en el contacto: de qué afiliado/fuente vino (= utm_source)
alter table public.contacts add column if not exists affiliate_slug text;
create index if not exists idx_contacts_affiliate_slug on public.contacts(affiliate_slug);

-- 3) Ajustes editables key→jsonb (modo Meta Test/Live, links de CTA por funnel, etc.)
create table if not exists public.app_settings (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
alter table public.app_settings enable row level security;
-- Solo service role (API admin) lee/escribe; sin policy pública.

-- Seed afiliados iniciales
insert into public.affiliates (slug, name) values
  ('paolo', 'Paolo'),
  ('jp', 'JP (Juan Pablo)')
on conflict (slug) do nothing;

-- Seed modo Meta CAPI = test (hoy producción manda test). Toggle en /ads lo cambia.
insert into public.app_settings (key, value) values
  ('meta_capi_mode', '{"mode":"test"}'::jsonb)
on conflict (key) do nothing;
