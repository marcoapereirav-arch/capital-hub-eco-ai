-- Patch: fijar search_path en immutable_unaccent
-- Razón: Supabase security advisor flag "function_search_path_mutable".
-- Sin search_path explícito, una función (especialmente con security definer)
-- puede ser redireccionada a schemas maliciosos vía manipulación de search_path.

create or replace function public.immutable_unaccent(text)
returns text
language sql
immutable
parallel safe
strict
set search_path = public, pg_temp
as $$
  select public.unaccent('public.unaccent', $1)
$$;
