-- 0026_contacts_ghl_extension.sql
-- Extiende contacts para que sea la "ficha de alumno/contacto" estilo GHL:
-- productos comprados, revenue/cash collected, last_call_at, owner asignado.
-- Crea tabla contact_journey_events para el timeline.

alter table public.contacts
  add column if not exists products text[] not null default '{}',
  add column if not exists total_revenue numeric(10,2) not null default 0,
  add column if not exists total_cash_collected numeric(10,2) not null default 0,
  add column if not exists last_call_at timestamptz,
  add column if not exists owner_assignee text,
  add column if not exists source text;

create index if not exists idx_contacts_stage on public.contacts(stage);
create index if not exists idx_contacts_email_lower on public.contacts(lower(email));

create table if not exists public.contact_journey_events (
  id uuid primary key default gen_random_uuid(),
  contact_id uuid not null references public.contacts(id) on delete cascade,
  type text not null,  -- 'call_booked', 'call_attended', 'sale', 'note', 'stage_change', 'email_sent'
  title text not null,
  description text,
  data jsonb,
  created_by_user_id uuid,
  created_at timestamptz not null default now()
);
create index if not exists idx_journey_contact_created on public.contact_journey_events(contact_id, created_at desc);

-- RLS
alter table public.contact_journey_events enable row level security;
drop policy if exists "service_role_all_journey" on public.contact_journey_events;
create policy "service_role_all_journey" on public.contact_journey_events for all to service_role using (true) with check (true);
drop policy if exists "auth_read_journey" on public.contact_journey_events;
create policy "auth_read_journey" on public.contact_journey_events for select to authenticated using (true);
drop policy if exists "auth_insert_journey" on public.contact_journey_events;
create policy "auth_insert_journey" on public.contact_journey_events for insert to authenticated with check (true);
