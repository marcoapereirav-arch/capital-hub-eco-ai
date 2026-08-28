-- El acceso del alumno deja de calcularse con matematica de texto y pasa a
-- resolverse SIEMPRE contra el catalogo real (routes). Y deja de depender del
-- correo: se ata a la persona.
--
-- POR QUE: el widget de venta ofrecia "Media Buyer Digital", que ya no existe
-- (lo sustituyo Clipper el 2026-07-30). Quien lo comprara activaba su cuenta y
-- veia la formacion VACIA, sin ningun error: `lower(replace(prod,' ','_'))`
-- daba `media_buyer_digital` y ninguna ruta tiene esa clave. Fallo mudo.

begin;

-- 1 · Traductor unico: cualquier texto de producto se resuelve contra el
--     catalogo. Si no existe alli, devuelve NULL (no se inventa una clave).
create or replace function public.clave_producto(texto text)
returns text
language sql
stable
security definer
set search_path to 'public'
as $$
  select r.product_key
  from public.routes r
  where lower(btrim(texto)) in (
          lower(r.product_key),
          lower(r.name),
          lower(replace(r.name, ' ', '_'))
        )
     or lower(replace(btrim(texto), ' ', '_')) = lower(r.product_key)
  limit 1;
$$;

comment on function public.clave_producto(text) is
  'Traduce el texto de un producto vendido a la clave real del catalogo. NULL si no existe.';

-- 2 · Poder retirar el acceso sin tocar la base a mano.
alter table public.student_invites
  add column if not exists revoked_at timestamptz,
  add column if not exists revoked_by uuid;

comment on column public.student_invites.revoked_at is
  'Cuando se le retiro el acceso al alumno (devolucion, impago). Con valor, deja de ver su formacion.';

-- 3 · Lo que ve un alumno: por PERSONA (no por correo) y resuelto contra el
--     catalogo. El correo se mantiene como respaldo para invitaciones viejas
--     que se aceptaron antes de que se guardara el user_id.
create or replace function public.mis_product_keys()
returns text[]
language sql
stable
security definer
set search_path to 'public'
as $$
  select coalesce(array_agg(distinct k), array[]::text[])
  from (
    select public.clave_producto(prod) as k
    from public.student_invites si
    cross join lateral unnest(si.products) prod
    where si.accepted_at is not null
      and si.revoked_at is null
      and (
        si.user_id = auth.uid()
        or (
          si.user_id is null
          and lower(si.email) = lower((select u.email from auth.users u where u.id = auth.uid()))
        )
      )
  ) t
  where k is not null;
$$;

-- 4 · La comunidad usa el mismo traductor y el mismo criterio de persona.
create or replace function public.user_can_see_community(c_id bigint)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select
    coalesce(public.current_app_role(), '') = 'ADMIN'
    or exists (select 1 from public.profiles p where p.id = auth.uid() and p.role in ('super_admin','admin'))
    or exists (
      select 1
      from public.communities c
      where c.id = c_id
        and c.product_key = any (public.mis_product_keys())
    );
$$;

commit;
