-- Limpieza. Dos cosas sueltas que salieron de la revision del 2026-08-18.

begin;

-- 1 · La ficha fantasma. `patriclhosta@gmail.com` es un error de tecleo de
--     `patrichlosta@gmail.com` (id 6, esa si tiene cuenta y funciona).
--     La fantasma no tiene cuenta detras y no cuelga NADA de ella
--     (comprobado contra las 17 tablas que apuntan a users.id: cero filas).
delete from public.users
where email = 'patriclhosta@gmail.com'
  and auth_user_id is null;

-- 2 · Las respuestas correctas de los examenes las podia leer cualquiera con
--     cuenta (`using (true)`). Hoy no hay ni una pregunta creada, asi que no se
--     ha escapado nada, pero la puerta se cierra ANTES de que se certifique a
--     nadie. Queda como el resto del contenido: solo el equipo.
drop policy if exists exam_questions_select_all on public.exam_questions;

create policy exam_questions_select_staff
  on public.exam_questions
  for select
  using (public.es_staff());

commit;
