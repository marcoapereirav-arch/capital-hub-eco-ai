-- Stage 'dm' (comentó el reel, aún sin datos) como PRIMERA columna del pipeline webinar.
-- Ver SOP producto/20. La ficha entra en 'dm' al comentar (router ManyChat) y pasa a
-- 'lead' en el opt-in (misma ficha, se completa). Idempotente.
-- Aplicada en producción vía Management API el 2026-07-08; este archivo la versiona.

-- 1. Ampliar el CHECK de contacts.stage con 'dm' (sin quitar valores existentes).
alter table public.contacts drop constraint if exists contacts_stage_check;
alter table public.contacts add constraint contacts_stage_check
  check (stage = any (array['dm','lead','agendado','alumno','seguimiento','no_show','perdido']::text[]));

-- 2. Insertar el stage 'dm' en el pipeline webinar (primera columna, sort_order 0).
insert into public.pipeline_stages (pipeline_id, key, name, color, kind, sort_order)
select p.id, 'dm', 'DM', '#52525B', 'active', 0
from public.pipelines p
where p.slug = 'webinar'
  and not exists (
    select 1 from public.pipeline_stages s where s.pipeline_id = p.id and s.key = 'dm'
  );
