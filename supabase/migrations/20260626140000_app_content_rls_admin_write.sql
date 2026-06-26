-- App (formación): permitir escritura de contenido a ADMIN/PROFESSOR.
--
-- IMPORTANTE: la App alumno (app.capitalhubapp.com) usa ESTA Supabase del OS
-- (aglyoyqtzozdnusltjxe), no el proyecto legacy del repo App. Sus tablas de
-- contenido (formations/modules/lessons/lesson_comments/users) viven aquí.
--
-- Bug raíz (2026-06-26): formations/modules/lessons SOLO tenían policy de SELECT.
-- El editor de formación de la App (AdminFormacionDetailPage) guarda con
-- `supabase.from(...).update()` DIRECTO desde el browser (anon key + JWT), y sin
-- policy de UPDATE/INSERT/DELETE el RLS lo bloqueaba EN SILENCIO → no se guardaban
-- títulos, descripciones, lecciones ni el `bunny_video_id` del vídeo subido.
-- (lesson_comments SÍ tenía INSERT policy → por eso los comentarios sí guardan.)
--
-- Fix: INSERT/UPDATE/DELETE para ADMIN/PROFESSOR (mismo patrón que lesson_comments,
-- current_app_role()). Idempotente. El OS escribe estas tablas vía service-role
-- (bypassa RLS), así que no le afecta; solo desbloquea las escrituras directas de
-- la App. Aplicado en vivo vía Management API el 2026-06-26 + verificado por
-- impersonación (admin escribe, no-admin bloqueado).

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['formations','modules','lessons'] LOOP
    EXECUTE format('DROP POLICY IF EXISTS %1$s_insert_admin ON public.%1$s', t);
    EXECUTE format($f$CREATE POLICY %1$s_insert_admin ON public.%1$s FOR INSERT TO authenticated WITH CHECK (public.current_app_role() IN ('ADMIN','PROFESSOR'))$f$, t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_update_admin ON public.%1$s', t);
    EXECUTE format($f$CREATE POLICY %1$s_update_admin ON public.%1$s FOR UPDATE TO authenticated USING (public.current_app_role() IN ('ADMIN','PROFESSOR')) WITH CHECK (public.current_app_role() IN ('ADMIN','PROFESSOR'))$f$, t);
    EXECUTE format('DROP POLICY IF EXISTS %1$s_delete_admin ON public.%1$s', t);
    EXECUTE format($f$CREATE POLICY %1$s_delete_admin ON public.%1$s FOR DELETE TO authenticated USING (public.current_app_role() IN ('ADMIN','PROFESSOR'))$f$, t);
  END LOOP;
END $$;
