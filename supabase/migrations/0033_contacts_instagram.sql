-- 0033_contacts_instagram.sql
-- Anade el campo de Instagram al CRM para vincular leads que llegan via ManyChat
-- y poder identificar a la persona aunque solo tengamos su @ de IG (no email aun).
--
-- Tambien anadimos manychat_subscriber_id como columna directa (extraida desde
-- metadata) para indexar y hacer lookup rapido cuando llegan webhooks o el
-- agenda recibe ?mc_id=xxx.

alter table public.contacts
  add column if not exists instagram_username text,
  add column if not exists manychat_subscriber_id text;

create index if not exists idx_contacts_instagram_username on public.contacts(lower(instagram_username)) where instagram_username is not null;
create index if not exists idx_contacts_manychat_subscriber_id on public.contacts(manychat_subscriber_id) where manychat_subscriber_id is not null;

-- Constraint: si dos contactos tienen el mismo manychat_subscriber_id es bug -> uniq
create unique index if not exists uniq_contacts_manychat_subscriber on public.contacts(manychat_subscriber_id) where manychat_subscriber_id is not null;
