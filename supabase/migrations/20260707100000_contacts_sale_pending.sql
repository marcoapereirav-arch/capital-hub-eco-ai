-- 20260707100000_contacts_sale_pending.sql
-- "Venta por completar": cuando se mueve un contacto a Alumno a mano y se elige
-- "rellenar la venta más tarde", queda marcado como pendiente. El dashboard lista
-- estos pendientes ("Ventas por completar") y desde la ficha se completan.
-- Aditiva e idempotente. No toca nada existente.

alter table public.contacts
  add column if not exists sale_pending boolean not null default false;

alter table public.contacts
  add column if not exists sale_pending_since timestamptz;

comment on column public.contacts.sale_pending is
  'true = movido a Alumno pero la venta (acceso + datos) todavia no se registro. Lo limpia /api/admin/sales/register al completar.';

create index if not exists idx_contacts_sale_pending
  on public.contacts (sale_pending) where sale_pending = true;
