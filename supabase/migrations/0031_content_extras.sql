-- 0031_content_extras.sql
-- Anade campos para gestion de contenido del alumno desde el OS.

-- lessons: attachments (array de archivos descargables) + video_provider
alter table public.lessons
  add column if not exists attachments jsonb default '[]'::jsonb,
  add column if not exists video_provider text;

-- routes: slug + description (para mapear product -> route)
alter table public.routes
  add column if not exists slug text,
  add column if not exists description text,
  add column if not exists product_key text;  -- "ia_integrator" | "media_buyer_digital" | "comercial_closing"

create unique index if not exists uniq_routes_product_key on public.routes(product_key) where product_key is not null;
create unique index if not exists uniq_routes_slug on public.routes(slug) where slug is not null;

-- Seed 3 routes para los 3 productos high-ticket (idempotente)
insert into public.routes (name, slug, product_key, description, display_order, active)
values
  ('IA Integrator', 'ia-integrator', 'ia_integrator', 'Aprende a implementar IA en empresas como solucion de alto valor.', 1, true),
  ('Media Buyer Digital', 'media-buyer-digital', 'media_buyer_digital', 'Compra de medios y gestion de campanas profesionales.', 2, true),
  ('Comercial Closing', 'comercial-closing', 'comercial_closing', 'Cierre comercial de alta gama. De setter a closer.', 3, true)
on conflict (product_key) where product_key is not null do nothing;
