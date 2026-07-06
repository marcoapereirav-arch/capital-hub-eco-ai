-- 20260706120500_webs_webinar.sql
-- Alta del funnel Webinar en el panel /webs (tablas webs + web_steps).
-- IMPORTANTE (anti-404): web_steps.slug es el PATH ABSOLUTO desde la raíz del dominio
-- ('webinar', 'webinar/gracias'), NO 'landing'/'thanks'. Ver SOP producto/40.
-- Idempotente. Se aplicó también vía Management API el 2026-07-06; esto es el histórico.
--
-- LECCIÓN (auto-blindaje): registrar un funnel en /webs (BD) sin desplegar sus rutas
-- hace que la tarjeta aparezca "Published" pero los links den 404. Regla: el alta en
-- webs/web_steps viaja en el MISMO deploy que las páginas, y solo se marca published
-- cuando las rutas están verificadas en producción.

insert into public.webs (id, type, slug, name, description, status, hostname)
values (
  'web_funnel_webinar', 'funnel', 'webinar', 'Funnel Webinar semanal',
  'Opt-in del webinar en directo -> grupo de WhatsApp -> agenda. Leads al pipeline webinar.',
  'published', 'ch'
)
on conflict (id) do update set
  name = excluded.name, description = excluded.description,
  status = excluded.status, hostname = excluded.hostname, type = excluded.type;

insert into public.web_steps (id, web_id, slug, name, position, is_entry, description)
values
  ('webstep_webinar_landing', 'web_funnel_webinar', 'webinar', 'Landing opt-in', 1, true, 'Reserva de plaza (nombre+email+telefono).'),
  ('webstep_webinar_gracias', 'web_funnel_webinar', 'webinar/gracias', 'Thank you', 2, false, 'Boton grande al grupo de WhatsApp.')
on conflict (id) do update set
  slug = excluded.slug, name = excluded.name, position = excluded.position,
  is_entry = excluded.is_entry, description = excluded.description;
