-- 0025_calendario_propio.sql
-- Calendario propio (replicar Calendly minimal) para Adrián y futuros closers.
--
-- Modelo:
-- - calendar_owners: cada persona que tiene calendario público (por ahora solo Adrián)
-- - calendar_availability_rules: horarios recurrentes (lun-vie 10-14, etc.)
-- - calendar_blocked_slots: bloqueos puntuales (vacaciones, no disponibles)
-- - calendar_bookings: reservas reales de leads

create table if not exists public.calendar_owners (
  id text primary key,
  display_name text not null,
  email text not null,
  timezone text not null default 'Europe/Madrid',
  slot_minutes int not null default 30,
  buffer_minutes int not null default 10,
  meeting_url text,
  google_calendar_id text default 'primary',
  google_oauth_email text,
  google_oauth_refresh_token text,
  google_oauth_access_token text,
  google_oauth_expires_at timestamptz,
  google_oauth_connected_at timestamptz,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.calendar_availability_rules (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.calendar_owners(id) on delete cascade,
  weekday smallint not null check (weekday between 0 and 6), -- 0=domingo, 6=sábado
  start_time time not null,
  end_time time not null,
  created_at timestamptz not null default now()
);
create index if not exists idx_avail_rules_owner on public.calendar_availability_rules(owner_id);

create table if not exists public.calendar_blocked_slots (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.calendar_owners(id) on delete cascade,
  start_at timestamptz not null,
  end_at timestamptz not null,
  reason text,
  created_at timestamptz not null default now()
);
create index if not exists idx_blocked_owner_start on public.calendar_blocked_slots(owner_id, start_at);

create table if not exists public.calendar_bookings (
  id uuid primary key default gen_random_uuid(),
  owner_id text not null references public.calendar_owners(id) on delete cascade,
  public_token text not null default replace(gen_random_uuid()::text, '-', ''),
  start_at timestamptz not null,
  end_at timestamptz not null,
  attendee_name text not null,
  attendee_email text not null,
  attendee_phone text,
  notes text,
  meeting_url text,
  gcal_event_id text,
  status text not null default 'booked' check (status in ('booked','attended','no_show','cancelled','rescheduled')),
  source text default 'public_form',
  contact_id uuid,
  cancelled_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists idx_bookings_public_token on public.calendar_bookings(public_token);
create index if not exists idx_bookings_owner_start on public.calendar_bookings(owner_id, start_at);
-- Anti-double-booking: no puede haber dos bookings activos en el mismo slot exacto
create unique index if not exists uniq_booking_owner_slot
  on public.calendar_bookings(owner_id, start_at)
  where status = 'booked';

-- RLS: service_role full, authenticated read (admin panel)
alter table public.calendar_owners enable row level security;
alter table public.calendar_availability_rules enable row level security;
alter table public.calendar_blocked_slots enable row level security;
alter table public.calendar_bookings enable row level security;

drop policy if exists "service_role_all_owners" on public.calendar_owners;
create policy "service_role_all_owners" on public.calendar_owners for all to service_role using (true) with check (true);
drop policy if exists "auth_read_owners" on public.calendar_owners;
create policy "auth_read_owners" on public.calendar_owners for select to authenticated using (true);

drop policy if exists "service_role_all_rules" on public.calendar_availability_rules;
create policy "service_role_all_rules" on public.calendar_availability_rules for all to service_role using (true) with check (true);
drop policy if exists "auth_read_rules" on public.calendar_availability_rules;
create policy "auth_read_rules" on public.calendar_availability_rules for select to authenticated using (true);

drop policy if exists "service_role_all_blocked" on public.calendar_blocked_slots;
create policy "service_role_all_blocked" on public.calendar_blocked_slots for all to service_role using (true) with check (true);
drop policy if exists "auth_read_blocked" on public.calendar_blocked_slots;
create policy "auth_read_blocked" on public.calendar_blocked_slots for select to authenticated using (true);

drop policy if exists "service_role_all_bookings" on public.calendar_bookings;
create policy "service_role_all_bookings" on public.calendar_bookings for all to service_role using (true) with check (true);
drop policy if exists "auth_read_bookings" on public.calendar_bookings;
create policy "auth_read_bookings" on public.calendar_bookings for select to authenticated using (true);

-- Seed: owner Adrián (mismo de calls_availability viejo, ahora ya parte del calendario propio)
insert into public.calendar_owners (id, display_name, email, timezone, slot_minutes, buffer_minutes, meeting_url)
values ('adrian', 'Adrián Villanueva', 'adrianvillanuevarios@gmail.com', 'Europe/Madrid', 30, 10, 'https://us06web.zoom.us/j/6812281370')
on conflict (id) do nothing;

-- Seed: regla por defecto lun-vie 10-14 + 16-20
insert into public.calendar_availability_rules (owner_id, weekday, start_time, end_time)
select 'adrian', d, '10:00', '14:00' from generate_series(1, 5) as d
where not exists (select 1 from public.calendar_availability_rules where owner_id='adrian');
insert into public.calendar_availability_rules (owner_id, weekday, start_time, end_time)
select 'adrian', d, '16:00', '20:00' from generate_series(1, 5) as d
where not exists (
  select 1 from public.calendar_availability_rules
  where owner_id='adrian' and weekday=d and start_time='16:00'
);
