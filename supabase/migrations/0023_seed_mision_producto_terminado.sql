-- 0023_seed_mision_producto_terminado.sql
-- Seed inicial del dashboard /mision: PARA project + 4 fases + ~66 tareas del brief.
-- Idempotente: ON CONFLICT DO NOTHING en todos los inserts.

-- PARA project
INSERT INTO public.para_items (id, name, type)
VALUES ('p_mision_producto_terminado', 'Misión Producto Terminado', 'project')
ON CONFLICT (id) DO NOTHING;

-- 4 fases del lanzamiento
INSERT INTO public.launch_phases (id, slug, name, description, "order", target_date) VALUES
  ('ph_1_infra', 'infraestructura', 'Infraestructura y contenido base', 'Plataforma técnica + bloques de bienvenida + descubrimiento de ruta grabados', 1, '2026-05-13'),
  ('ph_2_rutas', 'rutas', 'Contenido de las tres rutas', 'Comercial Digital, Media Buyer Digital, IA Integrator: estructura + rúbrica + grabación. Fundación mental.', 2, '2026-05-21'),
  ('ph_3_sistemas', 'sistemas', 'Sistemas técnicos', 'IA de evaluación, chatbot, desbloqueo, perfil alumno, certificados, bolsa, pago + trial', 3, '2026-05-21'),
  ('ph_4_softlaunch', 'soft-launch', 'Testeo y soft launch', 'Pruebas end-to-end + onboarding primeros beta + lanzamiento oficial', 4, '2026-05-31')
ON CONFLICT (id) DO NOTHING;

-- Tareas (ver dashboard /mision para la lista completa).
-- Este archivo se mantiene como referencia versionada.
-- Las inserciones se hicieron vía MCP Supabase el 2026-05-07 y son idempotentes.
-- En caso de re-aplicar el seed, copiar el bloque INSERT INTO public.tasks ... ON CONFLICT DO NOTHING
-- desde docs/sops/12-mision-producto-terminado.md (mantenido sincronizado).
