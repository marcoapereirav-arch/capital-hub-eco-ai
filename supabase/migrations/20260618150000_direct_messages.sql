-- Chat 1-a-1 entre miembros de la comunidad
-- Decisión Marco 2026-06-18: cualquiera puede iniciar chat con cualquier otro miembro.
-- Realtime via postgres_changes (Supabase Realtime).

create table if not exists public.direct_messages (
  id uuid primary key default gen_random_uuid(),
  sender_id uuid not null references auth.users(id) on delete cascade,
  recipient_id uuid not null references auth.users(id) on delete cascade,
  body text not null,
  read_at timestamptz,
  created_at timestamptz not null default now(),
  constraint dm_not_self check (sender_id <> recipient_id)
);

-- Índice por par de users (ordenado para uniqueness del par sin importar dirección)
create index if not exists dm_pair_idx on public.direct_messages
  (least(sender_id, recipient_id), greatest(sender_id, recipient_id), created_at desc);
create index if not exists dm_recipient_idx on public.direct_messages(recipient_id, read_at);
create index if not exists dm_sender_idx on public.direct_messages(sender_id, created_at desc);

-- Habilitar realtime
alter publication supabase_realtime add table public.direct_messages;

-- RLS
alter table public.direct_messages enable row level security;

-- Read: solo los 2 participantes pueden ver sus mensajes
drop policy if exists "dm read own" on public.direct_messages;
create policy "dm read own" on public.direct_messages
  for select to authenticated using (
    sender_id = auth.uid() or recipient_id = auth.uid()
  );

-- Insert: solo si soy el sender (no puedo mandar mensajes en nombre de otro)
drop policy if exists "dm insert own" on public.direct_messages;
create policy "dm insert own" on public.direct_messages
  for insert to authenticated with check (sender_id = auth.uid());

-- Update: solo el recipient puede marcar read_at
drop policy if exists "dm update read by recipient" on public.direct_messages;
create policy "dm update read by recipient" on public.direct_messages
  for update to authenticated using (recipient_id = auth.uid())
  with check (recipient_id = auth.uid());

-- Delete: solo el sender puede borrar SU mensaje
drop policy if exists "dm delete sender" on public.direct_messages;
create policy "dm delete sender" on public.direct_messages
  for delete to authenticated using (sender_id = auth.uid());
