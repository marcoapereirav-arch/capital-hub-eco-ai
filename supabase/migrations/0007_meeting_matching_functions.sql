-- ========================================================
-- Migration: 0007_meeting_matching_functions
-- Fecha: 2026-04-19
-- PRP: PRP-003, Fase 3
-- ========================================================

-- Función: match_team_member_by_name
-- Estrategia en orden de prioridad:
--   1. Match exacto case-insensitive sobre full_name o cualquier alias
--   2. Substring match: el canonical está contenido en el nombre del attendee
--      (ej: "Marco" dentro de "Marco Antonio Ruiz") — solo si length(canonical) >= 3
--      para evitar falsos positivos con JP/2 letras
--   3. word_similarity >= 0.6
-- Devuelve 0 o 1 row.
create or replace function public.match_team_member_by_name(attendee_name text)
returns setof public.team_members
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  with input as (
    select public.immutable_unaccent(lower(coalesce(attendee_name, ''))) as norm
  ),
  candidates as (
    select tm,
           case
             -- match exacto (full_name)
             when public.immutable_unaccent(lower(tm.full_name)) = input.norm then 0
             -- match exacto (alias)
             when exists (
               select 1 from unnest(tm.aliases) a
               where public.immutable_unaccent(lower(a)) = input.norm
             ) then 0
             -- substring: canonical/alias dentro del attendee (length >= 3)
             when length(tm.full_name) >= 3
                  and input.norm like '%' || public.immutable_unaccent(lower(tm.full_name)) || '%' then 1
             when exists (
               select 1 from unnest(tm.aliases) a
               where length(a) >= 3
                 and input.norm like '%' || public.immutable_unaccent(lower(a)) || '%'
             ) then 1
             -- fuzzy
             when word_similarity(
               public.immutable_unaccent(lower(tm.full_name)),
               input.norm
             ) >= 0.6 then 2
             else 99
           end as rank
    from public.team_members tm, input
    where tm.active = true
  )
  select (tm).*
  from candidates
  where rank < 99
  order by rank asc, length(((tm)).full_name) desc
  limit 1;
$$;

-- Función: find_contact_match
-- Devuelve jsonb con: { contact_id uuid|null, match_method text, score numeric|null }
-- match_method ∈ {'email_exact','fuzzy','none'}
-- fuzzy = word_similarity >= 0.85
create or replace function public.find_contact_match(p_email text, p_name text)
returns jsonb
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $$
declare
  hit public.contacts;
  sim numeric;
begin
  -- 1. Email exacto
  if p_email is not null and length(trim(p_email)) > 0 then
    select * into hit from public.contacts
    where lower(email) = lower(trim(p_email))
    limit 1;
    if found then
      return jsonb_build_object(
        'contact_id', hit.id,
        'match_method', 'email_exact',
        'score', 1.0
      );
    end if;
  end if;

  -- 2. Fuzzy por nombre
  if p_name is not null and length(trim(p_name)) >= 3 then
    select c.*, word_similarity(
      public.immutable_unaccent(lower(c.full_name)),
      public.immutable_unaccent(lower(p_name))
    ) as s
    into hit, sim
    from public.contacts c
    where word_similarity(
      public.immutable_unaccent(lower(c.full_name)),
      public.immutable_unaccent(lower(p_name))
    ) >= 0.85
    order by word_similarity(
      public.immutable_unaccent(lower(c.full_name)),
      public.immutable_unaccent(lower(p_name))
    ) desc
    limit 1;
    if found then
      return jsonb_build_object(
        'contact_id', hit.id,
        'match_method', 'fuzzy',
        'score', round(sim::numeric, 3)
      );
    end if;
  end if;

  return jsonb_build_object(
    'contact_id', null,
    'match_method', 'none',
    'score', null
  );
end;
$$;

grant execute on function public.match_team_member_by_name(text) to authenticated, service_role;
grant execute on function public.find_contact_match(text, text) to authenticated, service_role;
