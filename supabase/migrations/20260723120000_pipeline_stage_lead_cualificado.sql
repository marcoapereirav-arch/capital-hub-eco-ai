-- Stage 'lead_cualificado' en el pipeline Test Personalidad (PRP-007, funnel v2).
--
-- Qué es: el lead que pulsó el botón del email y llegó a la landing del test.
-- Ha demostrado intención real, pero todavía no ha agendado. Permite al setter
-- priorizar a quién escribe primero, y a Meta optimizar por calidad y no por volumen.
-- Decidido en la reunión del 18-jul-2026 (idea de JP, "lead válido").
--
-- Solo se añade al pipeline 'test-personalidad'. El pipeline 'webinar' no tiene la
-- señal del clic del email, así que una columna vacía ahí sería ruido.
--
-- Idempotente. Mismo patrón que 20260708_pipeline_stage_dm.sql.

-- 1. Ampliar el CHECK de contacts.stage (sin quitar valores existentes).
--    CRÍTICO: si se inserta el stage sin ampliar el CHECK, los UPDATE fallan
--    en SILENCIO y la ficha nunca sube de columna (ver 20260615150000).
alter table public.contacts drop constraint if exists contacts_stage_check;
alter table public.contacts add constraint contacts_stage_check
  check (stage = any (array[
    'dm','lead','lead_cualificado','agendado','alumno','seguimiento','no_show','perdido'
  ]::text[]));

-- 2. Hacer hueco: correr un puesto todo lo que hoy va de 'agendado' en adelante
--    dentro del pipeline test-personalidad (agendado 2->3, seguimiento 3->4,
--    alumno 4->5, no_show 5->6, perdido 6->7).
update public.pipeline_stages s
set sort_order = s.sort_order + 1
from public.pipelines p
where p.id = s.pipeline_id
  and p.slug = 'test-personalidad'
  and s.sort_order >= 2
  and s.key <> 'lead_cualificado'
  and not exists (
    select 1 from public.pipeline_stages x
    where x.pipeline_id = p.id and x.key = 'lead_cualificado'
  );

-- 3. Insertar la columna nueva en el puesto 2, justo detrás de 'lead'.
--    Color: verde claro oficial del brandkit (#4ADE80). Progresión visual hacia
--    el verde de 'alumno', sin inventar neones fuera de paleta.
insert into public.pipeline_stages (pipeline_id, key, name, color, kind, sort_order)
select p.id, 'lead_cualificado', 'Lead cualificado', '#4ADE80', 'active', 2
from public.pipelines p
where p.slug = 'test-personalidad'
  and not exists (
    select 1 from public.pipeline_stages s
    where s.pipeline_id = p.id and s.key = 'lead_cualificado'
  );
