-- Custom token-based auth flow: Supabase no envia emails, los manda Resend.

-- Nucleo: tokens propios para reset/confirmacion/invitacion/magic-link.
create table if not exists public.auth_tokens (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  email text not null,
  user_id uuid references auth.users(id) on delete cascade,
  type text not null check (type in ('password_reset','email_confirmation','invitation','magic_link')),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists auth_tokens_token_idx on public.auth_tokens(token);
create index if not exists auth_tokens_email_type_idx on public.auth_tokens(email, type, created_at);
alter table public.auth_tokens enable row level security;
-- Sin policies a proposito: solo el service role (que bypassa RLS) opera estas tablas.

-- Tracking de cada envio.
create table if not exists public.email_messages (
  id uuid primary key default gen_random_uuid(),
  resend_id text,
  to_email text not null,
  from_email text,
  subject text,
  tag text,
  template_name text,
  status text not null default 'sent' check (status in ('sent','failed','delivered','bounced','complained')),
  error_message text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists email_messages_resend_idx on public.email_messages(resend_id);
alter table public.email_messages enable row level security;

-- Historial de eventos del webhook de Resend (delivered/opened/clicked/bounced/complained).
create table if not exists public.email_events (
  id uuid primary key default gen_random_uuid(),
  resend_id text,
  type text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
alter table public.email_events enable row level security;

-- Bloqueados/bajas. sendEmail() consulta esto antes de enviar; el webhook la rellena con bounces/complaints.
create table if not exists public.email_suppressions (
  email text primary key,
  reason text,
  created_at timestamptz not null default now()
);
alter table public.email_suppressions enable row level security;
