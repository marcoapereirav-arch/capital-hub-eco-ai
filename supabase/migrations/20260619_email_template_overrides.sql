-- Editor de emails: permite a super_admin sobreescribir el subject + html_body
-- de cualquier template del sistema sin tocar código.
--
-- El sender (sendEmailWithOverride) busca primero por template_key. Si hay row,
-- usa subject_override + html_body con placeholder substitution ({{firstName}},
-- {{fullName}}, {{email}}, {{product}}, {{inviteUrl}}, {{appName}}).
-- Si NO hay row → usa el template React hardcoded (welcome-alumno-ht.tsx, etc).
--
-- Decisión Marco 2026-06-19: "quiero editar los emails hazlo ahora".

create table if not exists public.email_template_overrides (
  template_key text primary key,
  subject text not null,
  html_body text not null,
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null
);

alter table public.email_template_overrides enable row level security;

create policy "admins can manage email overrides"
  on public.email_template_overrides for all
  to authenticated
  using (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  )
  with check (
    exists (
      select 1 from public.profiles p
      where p.id = auth.uid() and p.role = 'super_admin'
    )
  );
