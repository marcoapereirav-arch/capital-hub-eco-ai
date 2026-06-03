-- 0027_outreach_ig.sql
-- Sistema de cold outreach Instagram: closer junior tiene su propia bandeja
-- con leads a contactar. Cada lead pasa por estados: to_contact → messaged →
-- replied → phone_got → handed_off → discarded.

create table if not exists public.outreach_ig_leads (
  id uuid primary key default gen_random_uuid(),
  ig_username text not null,
  ig_url text,
  full_name text,
  profile_pic_url text,
  notes_assigned text,        -- por qué se asignó (engaged en post X, perfil bio, etc)
  closer_assigned text,       -- a qué closer junior se asignó
  status text not null default 'to_contact' check (status in ('to_contact','messaged','replied','phone_got','handed_off','discarded')),
  phone text,
  message_template_used text,
  reply_text text,
  reply_at timestamptz,
  messaged_at timestamptz,
  handed_off_at timestamptz,
  handed_off_to_contact_id uuid references public.contacts(id) on delete set null,
  contact_attempts int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index if not exists uniq_outreach_ig_username on public.outreach_ig_leads(lower(ig_username));
create index if not exists idx_outreach_status on public.outreach_ig_leads(status, created_at desc);
create index if not exists idx_outreach_closer on public.outreach_ig_leads(closer_assigned);

alter table public.outreach_ig_leads enable row level security;
drop policy if exists "service_role_all_outreach" on public.outreach_ig_leads;
create policy "service_role_all_outreach" on public.outreach_ig_leads for all to service_role using (true) with check (true);
drop policy if exists "auth_all_outreach" on public.outreach_ig_leads;
create policy "auth_all_outreach" on public.outreach_ig_leads for all to authenticated using (true) with check (true);
