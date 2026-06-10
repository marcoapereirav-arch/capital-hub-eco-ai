---
title: Campo Instagram + ManyChat subscriber en contactos
order: 22
area: producto
---

# instagram_username + manychat_subscriber_id en contacts

## Por qué
Los leads que llegan via ManyChat empiezan con SOLO su nickname de Instagram. No tenemos email ni teléfono inicialmente. Necesitamos:
1. Almacenar su `@username` para identificarlos en CRM antes de tener otros datos
2. Almacenar el `subscriber_id` interno de ManyChat para vincular eventos futuros (cuando agendan, cuando dan email)
3. Evitar duplicados — si la persona aparece en CRM por IG y luego agenda con email distinto, no crear ficha nueva

## Migration 0033

```sql
alter table public.contacts
  add column if not exists instagram_username text,
  add column if not exists manychat_subscriber_id text;
```

Más índices:
- `idx_contacts_instagram_username` (lower) — búsqueda case-insensitive
- `idx_contacts_manychat_subscriber_id` — lookup rápido por webhook
- `uniq_contacts_manychat_subscriber` — UNIQUE constraint: no dos contactos con mismo subscriber_id

## Reglas de vinculación

### Cuando ManyChat dispara webhook `new_subscriber`
1. Webhook trae `subscriber_id`, `ig_username`, `first_name`
2. OS busca por `manychat_subscriber_id = subscriber_id`
3. Si EXISTE → actualiza datos
4. Si NO existe → crea contacto:
   - `instagram_username = ig_username`
   - `manychat_subscriber_id = subscriber_id`
   - `full_name = first_name` (provisional, sin apellido)
   - `stage = 'nuevo_seguidor'`
   - `source = 'manychat'`

### Cuando alguien clica `/agenda?mc_id=<subscriber_id>`
1. /agenda parsea el `mc_id` del query string
2. OS busca por `manychat_subscriber_id = mc_id`
3. Si EXISTE → al rellenar el form, UPDATE el contacto existente con:
   - `email` (el que rellenó)
   - `phone` (el que rellenó)
   - `full_name` (el que rellenó, sobrescribe el provisional)
   - `stage = 'agendado'`
4. Si NO existe → fallback a busqueda por email/teléfono, o crea uno nuevo

### Cuando alguien NO usa link con mc_id pero ya teníamos su IG
1. Form de /agenda llega con email + teléfono
2. OS busca: ¿hay contacto con `email = X` OR `phone = Y` OR `instagram_username = Z`?
3. Si match → UPDATE
4. Si NO → crea nuevo con `source = 'agenda_directo'`

## UI

### En `/crm/contactos` (lista)
- Campo `instagram_username` se muestra en cada row si existe (al lado de email/teléfono)
- Búsqueda inteligente: el input busca también en `instagram_username`

### En la ficha del contacto (drawer)
- Tab "Datos" → campo editable "Instagram (@usuario)" — se guarda sin el `@` inicial
- Tab "Datos" → si tiene `manychat_subscriber_id` se muestra como read-only abajo

## Endpoint API
- `GET /api/admin/contacts` ahora incluye `instagram_username` en SELECT
- `GET /api/admin/contacts?q=Z` busca también en `instagram_username`
- `PATCH /api/admin/contacts/[id]` acepta `instagram_username` (nullable)

## SOP relacionado
- `13-contactos-pipeline.md` — CRM general
- `20-manychat-crm.md` — flow completo ManyChat → CRM con `mc_id`
