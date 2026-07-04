# CRM Build Spec — Manual de reconstrucción completo

> **Para quién es este documento:** eres una IA (otro chat, otro agente) que va a **reconstruir este CRM desde cero** dentro de otro proyecto (otro "ecosistema"). Este documento es autocontenido: trae el modelo de datos exacto (con DDL y RLS), la lógica de estados, todas las automatizaciones que mueven el CRM, los endpoints, las pantallas y el orden de construcción. Si lo sigues en orden, reconstruyes el mismo CRM.
>
> **Stack asumido del proyecto destino:** Next.js 16 (App Router) + React 19 + TypeScript + Tailwind, Supabase (Postgres + Auth + RLS), Zod para validación. Este es el stack donde vive el original; si el destino usa otro, traduce los endpoints pero conserva **el esquema, la lógica de estados y las automatizaciones tal cual**.
>
> **Prerrequisitos que el ecosistema destino ya debe tener:**
> 1. Supabase con Auth funcionando.
> 2. Tabla `profiles` con una columna `role` (valores tipo `super_admin` / `admin` / roles de equipo) y una función `is_admin()` (SECURITY DEFINER) que devuelve `true` si el usuario logueado es admin. Si no existe, la creas (ver Sección 9).
> 3. Un cliente admin de Supabase (service role) disponible en el backend para las escrituras de las automatizaciones (los webhooks corren sin sesión de usuario).
>
> **Nota de idioma/estilo:** todo el copy, nombres de stage y tags están en español. No se usa el guion largo em dash en ningún texto.

---

## 0. Índice

1. Qué es el CRM (la foto grande)
2. Modelo de datos (tablas + DDL + RLS)
3. Modelo de estados (pipelines, stages, la guarda de no retroceso)
4. Las 5 puertas de entrada de un contacto (automatizaciones)
5. Lógica interna clave (upsert, first touch, dedup, borrado en cascada)
6. Superficie de API (endpoints)
7. Pantallas / UI
8. Realtime
9. Seguridad (roles, RLS, service role, is_admin)
10. Reglas de oro y anti patrones (bugs ya resueltos, no repetir)
11. Checklist de construcción en orden
12. Apéndice: qué NO copiar (tablas legacy)

---

## 1. Qué es el CRM (la foto grande)

El CRM es el sistema que registra **cada persona que toca el negocio** (un "contacto") y **en qué punto del proceso de venta está** (su "stage" dentro de un "pipeline"). No es un CRM manual: casi todo se mueve **solo**, disparado por automatizaciones (un opt-in en una landing, una reserva de llamada, un webhook, un registro de venta).

El corazón son **6 tablas**:

| Tabla | Qué es |
|---|---|
| `contacts` | La ficha de cada persona (nombre, email, teléfono, stage, cifras, origen). |
| `pipelines` | Los embudos. Cada contacto pertenece a UNO. |
| `pipeline_stages` | Las columnas (estados) de cada embudo. |
| `contacts.stage` | El estado actual del contacto (una `text` con CHECK, ver más abajo). |
| `contact_tags` + `tags` | Etiquetas M2M para segmentar (origen, fuente, huellas visuales). |
| `contact_journey_events` | La línea de tiempo: cada cosa que le pasó al contacto (reservó, canceló, compró, cambió de stage). Fuente de verdad del historial. |

Alrededor del corazón hay **sistemas adyacentes** que ALIMENTAN el CRM pero no son el CRM (calendario, Calendly, ManyChat, widget de venta, invitaciones de alumno, notificaciones). Se describen en la Sección 4 porque sin ellos el CRM queda vacío: no entienden de dónde salen los contactos.

**Dos verdades operativas que mandan sobre todo lo demás:**

- **Regla de identidad:** el `email` (en minúsculas) es la llave. Si llega un evento (opt-in, reserva, venta) con un email que ya existe, se **actualiza** ese contacto, no se crea uno nuevo. Cuando no hay email todavía (leads de Instagram), la llave alternativa es `manychat_subscriber_id` o `instagram_username`.
- **Regla de no retroceso:** en movimientos **automáticos** el stage nunca baja, y un contacto que ya es `alumno` (venta cerrada) jamás se degrada. Solo un humano puede mover hacia atrás, arrastrando la tarjeta en el kanban.

---

## 2. Modelo de datos (tablas + DDL + RLS)

Copia este DDL tal cual (adaptando el esquema `public` si hace falta). Todos los `id` son `uuid`. Todo lleva RLS activada.

### 2.1 `pipelines` (los embudos)

```sql
create table public.pipelines (
  id            uuid primary key default gen_random_uuid(),
  name          text not null,
  slug          text not null unique,
  description   text,
  color         text not null default '#3b82f6',
  is_default    boolean not null default false,
  display_order integer not null default 0,
  created_at    timestamptz not null default now(),
  created_by    uuid references auth.users(id)
);
alter table public.pipelines enable row level security;

create policy pipelines_select_authenticated on public.pipelines
  for select to authenticated using (true);
create policy pipelines_insert_admin on public.pipelines
  for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','super_admin'])));
create policy pipelines_update_admin on public.pipelines
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','super_admin'])));
create policy pipelines_delete_admin on public.pipelines
  for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','super_admin'])));
```

**Semilla real (2 pipelines):**

| name | slug | color | is_default | display_order |
|---|---|---|---|---|
| General | `general` | `#06b6d4` | false | 0 |
| Funnel Test Personalidad | `test-personalidad` | `#3b82f6` | false | 1 |

> **Importante:** ninguno tiene `is_default = true`. La UI elige el primero por `display_order` (General) cuando no hay selección. El código busca los pipelines **por slug** (`general`, `test-personalidad`), no por el flag default. Mantén esos slugs.

### 2.2 `pipeline_stages` (las columnas de cada embudo)

```sql
create table public.pipeline_stages (
  id          uuid primary key default gen_random_uuid(),
  pipeline_id uuid not null references public.pipelines(id) on delete cascade,
  key         text not null,
  name        text not null,
  color       text not null default '#71717a',
  kind        text not null default 'active'
              check (kind in ('active','won','lost','branch')),
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  unique (pipeline_id, key)
);
alter table public.pipeline_stages enable row level security;

create policy pipeline_stages_select_authenticated on public.pipeline_stages
  for select to authenticated using (true);
create policy pipeline_stages_insert_admin on public.pipeline_stages
  for insert to authenticated
  with check (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','super_admin'])));
create policy pipeline_stages_update_admin on public.pipeline_stages
  for update to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','super_admin'])));
create policy pipeline_stages_delete_admin on public.pipeline_stages
  for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','super_admin'])));
```

**`kind` es el tipo semántico del stage** (define color/comportamiento visual y la lógica de la guarda):
- `active`: el contacto avanza por aquí (lead, agendado).
- `won`: éxito terminal (alumno). Nunca se degrada por automatización.
- `lost`: salida negativa (no_show, perdido).
- `branch`: rama recuperable (seguimiento): desde aquí se puede re enganchar hacia adelante.

**Semilla real de stages** (nota: los dos pipelines comparten el mismo vocabulario de stages, pero General no tiene `lead` porque a General se entra ya agendado):

Pipeline `general`:

| key | name | color | kind | sort_order |
|---|---|---|---|---|
| `agendado` | Agendado | `#f59e0b` | active | 1 |
| `seguimiento` | Seguimiento | `#8b5cf6` | branch | 2 |
| `alumno` | Alumno | `#10b981` | won | 3 |
| `no_show` | No show | `#f97316` | lost | 4 |
| `perdido` | Perdido | `#ef4444` | lost | 5 |

Pipeline `test-personalidad`:

| key | name | color | kind | sort_order |
|---|---|---|---|---|
| `lead` | Lead | `#06b6d4` | active | 1 |
| `agendado` | Agendado | `#f59e0b` | active | 2 |
| `seguimiento` | Seguimiento | `#8b5cf6` | branch | 3 |
| `alumno` | Alumno | `#10b981` | won | 4 |
| `no_show` | No show | `#f97316` | lost | 5 |
| `perdido` | Perdido | `#ef4444` | lost | 6 |

> El orden de columnas del kanban es por `sort_order`. `alumno` aparece antes que `no_show`/`perdido` a propósito: semánticamente es el éxito.

### 2.3 `contacts` (la ficha, corazón del CRM)

```sql
create table public.contacts (
  id                    uuid primary key default gen_random_uuid(),
  full_name             text not null,
  email                 text,
  phone                 text,
  company               text,
  stage                 text default 'lead'
                        check (stage in ('lead','agendado','alumno','seguimiento','no_show','perdido')),
  origin                text,           -- de dónde entró la primera vez (landing_test_personalidad, manychat, calendly_direct, agenda_publica, manual...)
  source                text,           -- canal/fuente operativa
  tags                  text[] not null default '{}',  -- (denormalizado legacy; las tags reales van por contact_tags)
  notes                 text,
  slug                  text not null unique,           -- identificador legible para URLs; se genera al crear
  products              text[] not null default '{}',   -- productos comprados
  total_revenue         numeric not null default 0,     -- facturación acumulada
  total_cash_collected  numeric not null default 0,     -- cash real cobrado
  last_call_at          timestamptz,
  owner_assignee        text,           -- quién gestiona el contacto (nombre del closer/owner)
  instagram_username    text,
  manychat_subscriber_id text,
  pipeline_id           uuid references public.pipelines(id) on delete set null,
  affiliate_slug        text,           -- atribución de fuente (first touch, no se sobreescribe)
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);
alter table public.contacts enable row level security;

-- Una sola policy: solo admins gestionan contactos (leen y escriben todo).
create policy "Admins manage contacts" on public.contacts
  for all to public using (is_admin()) with check (is_admin());

-- Índices y unicidad (críticos)
create unique index contacts_email_unique_ci on public.contacts (lower(email)) where email is not null;
create unique index uniq_contacts_manychat_subscriber on public.contacts (manychat_subscriber_id) where manychat_subscriber_id is not null;
create index idx_contacts_stage on public.contacts (stage);
create index idx_contacts_email_lower on public.contacts (lower(email));
create index idx_contacts_instagram_username on public.contacts (lower(instagram_username)) where instagram_username is not null;
create index idx_contacts_affiliate_slug on public.contacts (affiliate_slug);
create index contacts_pipeline_idx on public.contacts (pipeline_id, stage);
-- Búsqueda difusa por nombre (requiere extensiones pg_trgm + unaccent):
-- create index contacts_name_trgm_idx on public.contacts using gin (lower(unaccent(full_name)) gin_trgm_ops);
```

**Detalles que importan:**
- `email` es nullable (leads de Instagram entran sin email). Pero cuando existe, es **único case-insensitive** (`contacts_email_unique_ci`). Siempre guardar `email` en minúsculas y trim.
- `slug` es `NOT NULL` y único: hay que generarlo al crear (slugify del nombre + sufijo aleatorio). No tiene default en BD, así que TODO insert debe incluirlo.
- El CHECK de `stage` solo permite los 6 valores. (En el original el default histórico era `nuevo_seguidor`, que ya NO está permitido por el CHECK; por eso todo insert pasa `stage` explícito. En la reconstrucción usa `default 'lead'` como arriba, más limpio.)
- `manychat_subscriber_id` es único parcial: no puede haber dos contactos con el mismo subscriber de ManyChat.
- `tags text[]` es un array legacy denormalizado. **Las tags de verdad son la relación `contact_tags`.** Puedes omitir la columna array si empiezas de cero, pero varios endpoints antiguos aún la leen; si la mantienes, no la uses como fuente de verdad.

### 2.4 `tags` + `contact_tags` (etiquetas M2M)

```sql
create table public.tags (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  color       text not null default '#71717a',
  description text,
  created_at  timestamptz not null default now(),
  created_by  uuid references auth.users(id)
);
alter table public.tags enable row level security;
create policy tags_select_authenticated on public.tags for select to authenticated using (true);
create policy tags_insert_authenticated on public.tags for insert to authenticated with check (true);
create policy tags_update_authenticated on public.tags for update to authenticated using (true);
create policy tags_delete_admin on public.tags for delete to authenticated
  using (exists (select 1 from profiles where profiles.id = auth.uid() and profiles.role = any (array['admin','super_admin'])));

create table public.contact_tags (
  contact_id  uuid not null references public.contacts(id) on delete cascade,
  tag_id      uuid not null references public.tags(id) on delete cascade,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references auth.users(id) on delete set null,
  primary key (contact_id, tag_id)
);
alter table public.contact_tags enable row level security;
create policy contact_tags_select on public.contact_tags for select to authenticated using (true);
create policy contact_tags_insert on public.contact_tags for insert to authenticated with check (true);
create policy contact_tags_delete on public.contact_tags for delete to authenticated using (true);
create index contact_tags_contact_idx on public.contact_tags (contact_id);
create index contact_tags_tag_idx on public.contact_tags (tag_id);
```

**Convención de tags** (el nombre lleva prefijo con dos puntos):
- `origen:test_personalidad`, `origen:instagram_follow`: de qué funnel/canal vino.
- `fuente:<slug>`: qué afiliado/campaña lo trajo (del `utm_source`).
- Tags de huella visual aplicadas por webhooks: `agendado_calendly`, `cancelado_llamada`, `no_show`.

Las automatizaciones crean el tag si no existe (patrón `ensureTag`: busca por `name`, si no está lo inserta) y luego lo enlazan en `contact_tags`.

### 2.5 `contact_journey_events` (la línea de tiempo)

```sql
create table public.contact_journey_events (
  id                 uuid primary key default gen_random_uuid(),
  contact_id         uuid not null references public.contacts(id) on delete cascade,
  type               text not null,   -- ver catálogo abajo
  title              text not null,   -- texto legible para la timeline
  description        text,
  data               jsonb,           -- payload libre (revenue, booking_id, from/to stage, etc.)
  created_by_user_id uuid,            -- quién lo generó (null si fue una automatización)
  created_at         timestamptz not null default now()
);
alter table public.contact_journey_events enable row level security;
create policy auth_read_journey on public.contact_journey_events for select to authenticated using (true);
create policy auth_insert_journey on public.contact_journey_events for insert to authenticated with check (true);
create policy service_role_all_journey on public.contact_journey_events for all to service_role using (true) with check (true);
create index idx_journey_contact on public.contact_journey_events (contact_id, created_at desc);
```

**Catálogo de `type` (los que se usan hoy):**

| type | Cuándo se inserta |
|---|---|
| `optin_test_personalidad` | Lead rellena el opt-in de la landing del test. |
| `manychat_new_follower` | Nuevo seguidor de Instagram entra por ManyChat. |
| `manychat_user_reply` | El lead responde al welcome del bot. |
| `call_booked` | Reserva de llamada (agenda propia o Calendly). |
| `call_cancelled` | Canceló la llamada (Calendly). |
| `call_no_show` | No se presentó a la llamada. |
| `sale` | Venta registrada (lleva revenue, cash, productos, closer en `data`). |
| `stage_change` | Cambio manual de stage (from/to en `data`). |
| `pipeline_change` | Movido de pipeline (from/to pipeline en `data`). |

> **Regla:** cada mutación importante del contacto deja un evento aquí. La timeline es la fuente de verdad para depurar métricas ("¿por qué este contacto está en X?").

### 2.6 `student_invites` (puente venta -> plataforma del alumno)

No es "del CRM" pero está pegada al registro de venta (Sección 4.5), así que se incluye. Es la invitación que se genera al cerrar una venta.

```sql
create table public.student_invites (
  id              uuid primary key default gen_random_uuid(),
  contact_id      uuid references public.contacts(id) on delete set null,
  email           text not null,
  full_name       text not null,
  products        text[] not null default '{}',
  token           text not null unique,   -- magic link de activación
  expires_at      timestamptz not null default (now() + interval '7 days'),
  accepted_at     timestamptz,
  user_id         uuid,                   -- se rellena al activar la cuenta
  invited_by      uuid references public.profiles(id) on delete set null,
  invited_by_name text,
  metadata        jsonb,                  -- revenue, cash, payment_method, close_type
  created_at      timestamptz not null default now()
);
-- Unicidad crítica: solo UN invite pendiente por email a la vez.
create unique index uniq_student_invites_email_pending on public.student_invites (lower(email)) where accepted_at is null;
create index idx_student_invites_token on public.student_invites (token);
create index idx_student_invites_contact on public.student_invites (contact_id);
alter table public.student_invites enable row level security;
-- (RLS: gestionado por service role desde el backend; añade policy admin de lectura si lo muestras en el OS.)
```

### 2.7 Tablas adyacentes que el CRM lee/escribe (no se detallan aquí, pertenecen a otros subsistemas)

| Tabla | Sistema | El CRM la usa para... |
|---|---|---|
| `calendar_owners`, `calendar_bookings` | Calendario propio | Al reservar: crea booking y lo vincula al contacto (`calendar_bookings.contact_id`). |
| `calendly_config`, `calendly_scheduled_events` | Integración Calendly | Log de reservas Calendly + firma del webhook. |
| `manychat_events`, `manychat_subscribers_cache` | ManyChat | Log crudo de webhooks + cache de suscriptores. |
| `notifications` | Notificaciones in app | Avisar al equipo (reserva nueva, contacto recurrente, venta). |
| `profiles` | Equipo/roles | Fuente de "quién cerró", destinatarios de notificaciones, gate de RLS. |

`notifications` (mínimo necesario, porque varias automatizaciones escriben aquí):

```sql
create table public.notifications (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null,        -- a quién va dirigida
  type       text not null,
  title      text not null,
  body       text,
  data       jsonb default '{}',
  read       boolean default false,
  created_at timestamptz default now()
);
alter table public.notifications enable row level security;
-- policy: cada usuario lee las suyas (user_id = auth.uid()); service role inserta.
```

---

## 3. Modelo de estados (la guarda de no retroceso)

El campo `contacts.stage` guarda el estado. Los valores válidos (CHECK) son: `lead`, `agendado`, `alumno`, `seguimiento`, `no_show`, `perdido`.

**Camino feliz:** `lead` (dejó datos) -> `agendado` (reservó llamada) -> `alumno` (compró).

**Ramas/salidas:** `seguimiento` (habló pero no cerró, hay potencial), `no_show` (no apareció a la cita), `perdido` (descartado).

### La guarda `resolveAutoStage` (copiar tal cual)

Es la función que TODAS las automatizaciones usan antes de mover un stage. Implementa el no retroceso.

```ts
// lib/pipeline/stage-guard.ts
//
// Regla: en transiciones AUTOMÁTICAS el stage nunca retrocede, y NUNCA se degrada
// a un contacto que ya es 'alumno' (won).
// Ladder lineal de avance: lead(1) -> agendado(2) -> alumno(3).
// Las ramas (no_show, perdido, seguimiento) NO están en el ladder: desde ellas SÍ se
// puede re-enganchar hacia adelante (ej.: un 'perdido' que vuelve a agendar -> 'agendado').
// Esto NO aplica a movimientos MANUALES en el kanban (override humano deliberado).

const STAGE_RANK: Record<string, number> = { lead: 1, agendado: 2, alumno: 3 }
const WON_STAGES = new Set(["alumno"])

export function resolveAutoStage(
  current: string | null | undefined,
  proposed: string,
): string {
  if (!current) return proposed
  if (WON_STAGES.has(current)) return current            // nunca degradar a un alumno
  const rc = STAGE_RANK[current]
  const rp = STAGE_RANK[proposed]
  if (rc != null && rp != null) return rp >= rc ? proposed : current  // solo avanzar o mantener
  return proposed                                        // ramas/desconocidos: permitir re-enganche
}
```

**Cómo se usa:** cuando una automatización quiere mover a `agendado`, hace `stage = resolveAutoStage(contacto.stage, "agendado")`. Así, si el contacto ya era `alumno`, se queda `alumno`; si era `perdido`, sube a `agendado`; si era `lead`, sube a `agendado`.

**El kanban manual NO usa la guarda:** cuando un humano arrastra una tarjeta, se respeta su decisión (puede mover a cualquier columna). El endpoint de PATCH del contacto simplemente aplica el `stage` que llega.

### Reglas de asignación de pipeline (cableadas)

Cada contacto tiene **UN** `pipeline_id`. Refleja **por dónde entró**, no su estado. El stage cambia, el pipeline no (salvo mover manual).

- Entra por la landing del test -> `pipeline = test-personalidad`.
- Entra por agenda directa / Calendly directo / ManyChat sin contexto -> `pipeline = general`.
- **Si el contacto ya tenía `pipeline_id`, se PRESERVA.** Nunca lo sobreescribe una automatización. (El que lo trajo primero manda.)

---

## 4. Las 5 puertas de entrada (automatizaciones)

Aquí está "toda la película": cómo entra y se mueve un contacto sin que nadie lo toque. Cada puerta es un endpoint. Todas comparten el mismo patrón: **buscar por email (o mc_id), si existe actualizar, si no crear**, aplicar la guarda de stage, poner tags, y escribir un journey event.

### 4.1 Puerta A — Opt in de la landing del Test de Personalidad (canal principal)

`POST /api/optin/test-personalidad` (público, sin auth, usa service role).

Recibe `{ full_name, email, phone, utm_source? }` (Zod: email válido, teléfono con >=6 dígitos, obligatorio). Lógica:

1. Resuelve el pipeline `test-personalidad` (por slug).
2. `ensureTag("origen:test_personalidad", "#2A2D34", ...)`. Si viene `utm_source`, `ensureTag("fuente:<slug>", ...)`.
3. Busca contacto por `email` (case-insensitive):
   - **Existe:** actualiza `full_name`, `phone`. Solo pone `stage='lead'` si no tenía stage (no degrada uno avanzado). Solo asigna `pipeline_id` si era huérfano (preserva el que tenga). Solo pone `affiliate_slug` si no tenía (first touch). Si el contacto ya estaba más allá de `lead`, guarda `recurringFromStage` para avisar al equipo.
   - **No existe:** lo crea con `stage='lead'`, `pipeline_id = test-personalidad`, `origin='landing_test_personalidad'`, `source` y `affiliate_slug` del utm. Genera `slug` (slugify del nombre + sufijo aleatorio de 6 chars).
4. Enlaza los tags (origen + fuente) en `contact_tags` (ignora conflicto 23505 si ya estaba).
5. Inserta journey event `optin_test_personalidad`.
6. Si era un contacto recurrente ya avanzado: inserta una `notifications` para cada `super_admin` ("X que ya estaba en Y volvió a pasar por la landing; su stage NO se modificó"). Esto NO cambia su stage.
7. Devuelve `{ ok: true }` para que la landing redirija a la página de gracias.

**Atribución (first touch):** `affiliate_slug` = `utm_source` slugificado. Una vez puesto, no se sobreescribe. Cada afiliado reparte un link `?utm_source=<slug>` y así el revenue final se le atribuye (la venta vive en el mismo contacto).

### 4.2 Puerta B — Reserva en la agenda propia

`POST /api/calendar/book` (público, service role, con rate limit 5/60s por IP).

Recibe `{ owner_id, slot_start (ISO), attendee_name, attendee_email, attendee_phone?, notes? }`. Lógica:

1. Carga el owner (`calendar_owners`) para `slot_minutes` y `meeting_url`. Valida que el slot no haya pasado.
2. Inserta `calendar_bookings` con `status='booked'`. Un **índice único parcial** `(owner_id, start_at) where status='booked'` previene double booking a nivel BD (si choca, 23505 -> responde 409 "ese slot ya no está disponible").
3. Sincroniza el contacto (patrón GHL):
   - Busca por email. **No existe:** lo crea con `stage='agendado'`, `pipeline='general'`, `source='agenda_publica'`, y su slug.
   - **Existe:** `stage = resolveAutoStage(actual, "agendado")` (no retroceso) + `last_call_at = slot`.
4. Vincula `calendar_bookings.contact_id`.
5. Journey event `call_booked`.
6. Efectos laterales (no bloquean la respuesta al lead): email de confirmación al lead con `.ics`, crear evento en Google Calendar del owner, notificar al owner.

### 4.3 Puerta C — Webhook de Calendly

`POST /api/webhooks/calendly` (público, verifica firma HMAC con `calendly_config.webhook_signing_key`; si no hay key -> 503; si firma inválida -> 401).

Eventos: `invitee.created`, `invitee.canceled`, `invitee_no_show.created`. Lógica:

1. Verifica firma. Upsert en `calendly_scheduled_events` (log, `onConflict: uri`).
2. Mueve el contacto según el tipo (match por email):
   - **created:** si existe -> `stage = resolveAutoStage(actual, "agendado")` + `last_call_at`. Si NO existe -> lo **crea** con `stage='agendado'`, `pipeline='general'`, `origin='calendly_direct'`. Journey `call_booked`.
   - **canceled:** si estaba en `agendado` -> pasa a `seguimiento` (inmediato, no espera). Journey `call_cancelled`.
   - **no_show:** si no es `alumno` -> `stage='no_show'`. Journey `call_no_show`.
3. Aplica un **tag visual** según el tipo: created->`agendado_calendly`, canceled->`cancelado_llamada`, no_show->`no_show` (upsert en `contact_tags`).
4. Notifica al host: detecta el closer del meeting por `event_memberships[].user_email` haciendo match con `profiles.email` (roles closer/setter/marketing/formador), más los `super_admin` siempre. Inserta `notifications` in app + manda email. Deduplica si el closer también es super_admin.

### 4.4 Puerta D — Webhook de ManyChat (Instagram)

`POST /api/webhooks/manychat` (auth por `Authorization: Bearer <MANYCHAT_WEBHOOK_SECRET>`; si no coincide -> 401).

Recibe un `subscriber` de ManyChat + un `event_type`. Lógica:

1. Log crudo en `manychat_events`. Upsert en `manychat_subscribers_cache` (`onConflict: id`).
2. Busca el contacto por `manychat_subscriber_id`; si no, por `instagram_username` (y si lo encuentra por IG, vincula el `manychat_subscriber_id`).
3. Routing por `event_type`:
   - `new_subscriber` / `new_follower` / `subscribed`: si no existe el contacto, lo crea con `stage='lead'`, `pipeline='general'`, `origin='manychat'`, slug derivado del `ig_username`. Tag `origen:instagram_follow`. Journey `manychat_new_follower`.
   - `user_replied_to_welcome` / `user_replied`: si no existe, lo crea con `stage='conversacion'` (ver nota). Si existe y está en `lead`, sube a `conversacion`. Journey `manychat_user_reply`.

> **Nota de compatibilidad:** el código de ManyChat usa un stage `conversacion` que NO está en el CHECK actual de 6 valores (el CHECK se simplificó después). Si vas a activar ManyChat, o (a) añades `conversacion` al CHECK y como stage en el pipeline general, o (b) mapeas `user_replied` a `agendado`/mantener `lead`. Decide según tu funnel. En el proyecto original ManyChat está en estado "pending" (aún no configurado en el panel), por eso la incoherencia no ha explotado. **Corrígelo en la reconstrucción.**

### 4.5 Puerta E — Registro de venta (widget "Registrar venta")

`POST /api/admin/sales/register` (requiere sesión de usuario del OS; el resto usa service role). Es el corazón del cierre. Recibe `{ close_type, contact_id?, full_name, email, phone, source?, products[], revenue, cash_collected, payment_method, closer_user_id, closer_name, notes? }`. Hace **4 cosas en un submit**:

1. **Upsert contacto** (por `contact_id` si viene, si no por email): `stage='alumno'`, fusiona `products` (union sin duplicados), suma `total_revenue += revenue` y `total_cash_collected += cash_collected`, `owner_assignee = closer_name`, `last_call_at = now()`. Si no existe, lo crea con slug.
2. **Journey event** `sale` con `data = { revenue, cash_collected, payment_method, close_type, closer_name, products }` y `created_by_user_id`.
3. **student_invite:** genera `token` (32 bytes hex). **Antes de insertar, invalida los invites pendientes de ese email** (`update expires_at` a pasado where `accepted_at is null`) para no chocar con el índice único parcial. Luego inserta el nuevo. Si el insert falla, devuelve 500 (no manda email con token huérfano).
4. **Emails con `await` (Promise.allSettled):** email de bienvenida al alumno con el magic link (`https://app.<dominio>/accept-invite/<token>`) + notificación de compra al dueño. El `await` es obligatorio: sin él la función serverless termina antes de que Resend responda y el email se pierde.

`GET /api/admin/sales/register` devuelve el catálogo para el formulario: `closers` (todos los `profiles` activos, sin filtrar por rol), `products`, `payment_methods`.

### Tabla resumen de las 5 puertas

| Puerta | Endpoint | Auth | Crea con stage | Pipeline | Guarda no retroceso |
|---|---|---|---|---|---|
| A. Opt in test | `POST /api/optin/test-personalidad` | pública | `lead` | test-personalidad | preserva stage avanzado |
| B. Agenda propia | `POST /api/calendar/book` | pública (rate limit) | `agendado` | general | sí (`resolveAutoStage`) |
| C. Calendly | `POST /api/webhooks/calendly` | firma HMAC | `agendado` | general | sí |
| D. ManyChat | `POST /api/webhooks/manychat` | Bearer secret | `lead` | general | solo sube de lead |
| E. Venta | `POST /api/admin/sales/register` | sesión OS | `alumno` | (conserva) | fuerza `alumno` (won) |

---

## 5. Lógica interna clave (patrones que se repiten)

1. **Upsert por email (identidad):** siempre `lower(email).trim()`. Buscar con `.ilike(email)` o `.eq(lower)`. Si existe -> update; si no -> insert. Nunca duplicar por email.
2. **Generación de slug (obligatorio, NOT NULL):** `slugify(full_name)` (minúsculas, sin acentos con NFD, no alfanumérico -> `_` o `-`, recortar) + `"_" + random(6)`. Fallback `"alumno"`/`"lead"` si el nombre queda vacío.
3. **ensureTag (crear tag si no existe):** `select id from tags where name=?`; si no, insert; manejar `23505` (carrera) releyendo. Luego enlazar en `contact_tags` (ignorar conflicto de PK compuesta).
4. **First touch en atribución:** `affiliate_slug` y el pipeline solo se ponen si estaban vacíos. La primera fuente gana.
5. **Dedup de invites pendientes:** por el índice único parcial `lower(email) where accepted_at is null`, antes de crear un invite nuevo hay que invalidar (expirar) el pendiente. Si no, el insert falla en silencio y mandas un magic link con token que no existe. (Bug real ya resuelto, ver Sección 10.)
6. **Borrado en cascada controlado:** al borrar un contacto, el endpoint borra explícitamente `student_invites` de ese email (libera el índice único para futuras ventas) y `contact_journey_events` del contacto, más limpieza de Storage si el alumno tenía avatar. NO borra la cuenta `auth.users` del alumno (esa es una decisión separada). Las FKs con `on delete cascade`/`set null` cubren `contact_tags` y `calendar_bookings.contact_id`, pero el cleanup de invites es explícito a propósito.
7. **Cambio de pipeline seguro (PATCH):** si mueves un contacto a otro pipeline sin especificar stage, y su stage actual no existe en el pipeline destino, se resetea al primer stage del destino (por `sort_order`). Sin esto el contacto queda "huérfano" (con un stage que no es columna de ese kanban) y desaparece de la vista.
8. **Journey siempre:** cambio de stage manual -> event `stage_change`; cambio de pipeline -> event `pipeline_change`. Con `from`/`to` en `data`.

---

## 6. Superficie de API (endpoints)

Todos bajo `/api`. Los `/api/admin/*` requieren sesión de usuario del OS; los públicos usan service role internamente.

**Contactos**
| Método | Ruta | Qué hace |
|---|---|---|
| GET | `/api/admin/contacts?q=&stage=&limit=` | Lista contactos. Búsqueda `q` en nombre/email/teléfono/instagram (ilike OR). |
| POST | `/api/admin/contacts` | Crea contacto manual (Zod). |
| GET | `/api/admin/contacts/[id]` | Ficha completa: contacto + journey (100) + bookings (30). |
| PATCH | `/api/admin/contacts/[id]` | Actualiza campos; maneja cambio de pipeline (reset de stage) y escribe journey. |
| DELETE | `/api/admin/contacts/[id]` | Borrado en cascada controlado (ver 5.6). |
| GET/POST/PATCH/DELETE | `/api/admin/contacts/[id]/tags` (+ `/[tagId]`) | Enlazar/desenlazar tags del contacto. |
| GET | `/api/admin/contacts/[id]/journey` | Timeline del contacto. |
| POST | `/api/admin/contacts/[id]/resend-invite` | Reenvía el magic link de la App. |

**Pipelines y stages**
| Método | Ruta | Qué hace |
|---|---|---|
| GET/POST | `/api/admin/pipelines` | Lista / crea pipeline. |
| PATCH/DELETE | `/api/admin/pipelines/[id]` | Edita / borra pipeline. |
| GET/POST | `/api/admin/pipelines/[id]/stages` | Lista / añade stage. |
| PATCH/DELETE | `/api/admin/pipelines/[id]/stages/[stageId]` | Edita / borra stage. |
| POST | `/api/admin/pipelines/[id]/stages/reorder` | Reordena stages (array de ids). |

**Tags**
| Método | Ruta | Qué hace |
|---|---|---|
| GET/POST | `/api/admin/tags` | Lista / crea tag. |
| PATCH/DELETE | `/api/admin/tags/[id]` | Edita / borra tag. |

**Ventas y puertas de entrada** (ver Sección 4): `POST /api/optin/test-personalidad`, `POST /api/calendar/book`, `POST /api/webhooks/calendly`, `POST /api/webhooks/manychat`, `GET+POST /api/admin/sales/register`.

**Nota de lectura de datos:** el front lee muchos datos **directo de Supabase con el cliente del navegador** (no siempre por API), apoyándose en RLS. Ej.: `pipelinesService.list()` hace `supabase.from("pipelines").select("*")` + `pipeline_stages`. Los endpoints `/api/admin/*` existen para las **escrituras** y para operaciones que necesitan service role. Reproduce ambos patrones.

---

## 7. Pantallas / UI

Rutas (App Router) bajo un layout de CRM con pestañas. El layout pinta el título "CRM" y las sub pestañas; las páginas hijas NO repiten cabecera.

| Ruta | Pantalla |
|---|---|
| `/crm` | Redirige a `/crm/contactos`. |
| `/crm/contactos` | **Lista** estilo GoHighLevel: buscador + filtros (tags, pipeline, stage, origen, owner, producto, fecha, llamada) + botón Nuevo. Sin selector de pipeline (es un filtro más). |
| `/crm/pipeline` | **Kanban**: selector de pipeline arriba + columnas por stage (siempre todas, aunque estén vacías) + drag and drop entre columnas. |
| `/crm/tags` | Gestión de tags. |
| `/crm/contactos/[id]` | Ficha/drawer del contacto. |

**Componentes clave del original (referencia de nombres):**
- `src/features/contactos/components/pipelines-kanban.tsx`: el kanban. Agrupa contactos por `stage` dentro del pipeline seleccionado; drag and drop hace `PATCH /api/admin/contacts/[id] { stage }` (movimiento manual, sin guarda).
- `src/features/contactos/components/contact-drawer.tsx`: drawer con tabs (Datos / Productos+ventas / Journey / Notas), cambio rápido de stage, botones "Registrar venta" y "Reservar llamada", timeline de `contact_journey_events`.
- `src/features/pipelines/*`: manager de pipelines/stages (crear, renombrar, recolorear, reordenar).
- `src/features/tags/*`: gestión de tags, chips, filtro por tag, panel de tags del contacto.
- `src/features/sales/components/registrar-venta-modal.tsx` + `registrar-venta-widget.tsx`: el widget flotante verde "Registrar venta" (visible en todo el OS) que llama a `POST /api/admin/sales/register`.

**Reglas de UI heredadas** (respetarlas para que no se rompa visualmente):
- El kanban debe ser el ÚNICO elemento con scroll horizontal en su jerarquía (contenedor a ancho completo, no dentro de un `max-w` que genere doble scroll).
- El pipeline siempre muestra todas sus columnas aunque estén vacías (el funnel siempre visible).
- Contraste pleno: fichas/inputs con fondo y borde visibles (nada del mismo color que el fondo).

---

## 8. Realtime

Cualquier cambio en las tablas se ve en vivo, sin recargar. Patrón (cliente del navegador):

```ts
const channel = supabase
  .channel("contacts_realtime")
  .on("postgres_changes", { event: "*", schema: "public", table: "contacts" }, () => refetch())
  .subscribe()
// cleanup: supabase.removeChannel(channel)
```

Suscribir a `contacts` (y a `pipeline_stages` si permites editar columnas en vivo). En el proyecto destino hay que **habilitar Realtime** para esas tablas en Supabase (publicación `supabase_realtime`). Objetivo: el board y las listas se actualizan en <1s cuando otra sesión (o una automatización) cambia algo.

---

## 9. Seguridad

- **RLS en todo.** `contacts` solo la gestionan admins (`is_admin()`). El resto de tablas del CRM: lectura para `authenticated`, escritura de tags/journey abierta a `authenticated`, escritura de pipelines/stages solo admin.
- **Función `is_admin()`** (SECURITY DEFINER). Si el ecosistema destino no la tiene, créala. Acepta ambos roles admin y chequea `active`:

```sql
create or replace function public.is_admin() returns boolean
language sql security definer stable as $$
  select exists(
    select 1 from public.profiles
    where id = auth.uid()
      and role in ('super_admin','admin')
      and coalesce(active, true) = true
  );
$$;
```

- **Service role para automatizaciones:** los webhooks/opt in corren sin sesión de usuario. Usan el cliente admin (service role key) que **bypassa RLS**. NUNCA expongas esa key al cliente; vive solo en el backend (`SUPABASE_SERVICE_ROLE_KEY`).
- **Verificación de origen en webhooks:** Calendly con firma HMAC (`calendly_config.webhook_signing_key`), ManyChat con Bearer secret (`MANYCHAT_WEBHOOK_SECRET`). Sin verificación válida -> 401/503, nunca procesar.
- **REGLA DE ORO de roles:** si algún día renombras un valor de rol (`admin` -> otro), primero actualiza `is_admin()` y todas las policies que comparan el literal, o el CRM se queda "vacío" (RLS devuelve 0 filas sin error).

---

## 10. Reglas de oro y anti patrones (bugs ya resueltos, no repetir)

1. **Emails en endpoints serverless: SIEMPRE `await`.** Sin `await` (fire and forget) la función termina y el `fetch` a Resend se aborta ("The request could not be resolved"). El alumno nunca recibe el magic link aunque la UI diga "enviado". Usa `await Promise.allSettled([...])`.
2. **Invites con índice único parcial:** antes de insertar un `student_invite` nuevo, invalida (expira) el pendiente del mismo email. Si no, el insert falla en silencio y mandas un token huérfano -> el alumno ve "invitación no encontrada".
3. **DELETE explícito, no confiar solo en cascade:** al borrar un contacto, limpia `student_invites` de ese email (para poder revender) y `journey_events`, y hazlo con log. No borres `auth.users` del alumno activado.
4. **No degradar automáticamente:** toda automatización pasa por `resolveAutoStage`. Un `alumno` nunca vuelve atrás por un webhook. Solo el humano, arrastrando.
5. **Preservar contexto de funnel:** nunca sobreescribas `pipeline_id` ni `affiliate_slug` si ya tenían valor (first touch).
6. **Stage huérfano al cambiar de pipeline:** si mueves de pipeline y el stage actual no existe en el destino, resetea al primer stage del destino. Si no, el contacto desaparece del kanban.
7. **Escrituras que silencian errores = peligro:** todo insert/update desde un webhook debe chequear el `error` de Supabase y propagarlo (o loguearlo). Un webhook que responde 200 con el insert fallado pierde datos sin avisar.
8. **Pantalla de éxito antes que la de validación:** en el flujo de aceptar invitación, evalúa "éxito" antes que "token inválido", porque tras aceptar el token se invalida y la re validación daría falso negativo.

---

## 11. Checklist de construcción en orden

Construye en este orden (cada paso depende del anterior):

1. **Prerrequisitos:** confirma `profiles` con `role`, función `is_admin()`, y cliente admin (service role) en el backend.
2. **Tablas base + RLS:** `pipelines`, `pipeline_stages`, `contacts`, `tags`, `contact_tags`, `contact_journey_events`. Aplica índices y CHECKs (Sección 2).
3. **Semillas:** inserta los 2 pipelines (`general`, `test-personalidad`) y sus stages (Sección 2.1/2.2). Respeta slugs y keys.
4. **Guarda de estado:** crea `lib/pipeline/stage-guard.ts` (`resolveAutoStage`) (Sección 3).
5. **CRUD de contactos:** endpoints `GET/POST /api/admin/contacts`, `GET/PATCH/DELETE /api/admin/contacts/[id]`, y tags del contacto. Con journey en cambios de stage/pipeline.
6. **CRUD de pipelines/stages/tags:** endpoints admin (Sección 6).
7. **UI:** layout `/crm` con pestañas, lista de contactos (con filtros), kanban con drag and drop, drawer del contacto, gestor de pipelines, gestor de tags.
8. **Realtime:** habilita Realtime en `contacts` (+ `pipeline_stages`) y suscribe las vistas.
9. **Puerta A (opt in):** `POST /api/optin/test-personalidad` + su landing.
10. **Puerta B (agenda):** si tienes calendario propio, `POST /api/calendar/book` (necesita `calendar_owners`/`calendar_bookings`). Si no, salta.
11. **Puerta C (Calendly):** `POST /api/webhooks/calendly` + `calendly_config`/`calendly_scheduled_events` + verificación HMAC. Configura el webhook en Calendly.
12. **Puerta D (ManyChat):** `POST /api/webhooks/manychat` + `manychat_events`/`manychat_subscribers_cache`. **Resuelve el stage `conversacion`** (añádelo o mapea, ver 4.4).
13. **Puerta E (venta):** `student_invites` + `GET/POST /api/admin/sales/register` + widget "Registrar venta" + emails (bienvenida alumno + notif dueño). Requiere un proveedor de email (Resend u otro).
14. **Notificaciones:** tabla `notifications` + campana in app (para reservas, contactos recurrentes, ventas).
15. **QA end to end:** crea un lead por la landing, agéndalo, regístrale una venta, verifica que quedó `alumno`, que hay journey completo, que llegó el email, y que un webhook no lo degrada.

**Variables de entorno que necesitarás:**
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `MANYCHAT_WEBHOOK_SECRET`, (Calendly signing key vive en `calendly_config`), y las del proveedor de email (`RESEND_API_KEY`, `EMAIL_FROM`, etc.).

---

## 12. Apéndice — Qué NO copiar (tablas legacy)

En el proyecto original conviven restos de versiones viejas del CRM. **NO son el CRM vivo. Ignóralas.** No las repliques.

- `mifge_leads` + `src/features/crm/` (mifge-kanban, mifge-pipeline-service): el pipeline **MIFGE** viejo (funnel low ticket con 9 stages: lead, free_trial, agendados, no_show, no_agendados, won_ano, won_mes, pago_fallido, beta). Está pausado. El CRM vivo es el basado en `contacts` + `pipelines` + `pipeline_stages` descrito en este documento.
- `crm_pipelines`, `crm_stages`, `crm_opportunities`, `crm_types`: otro intento anterior, sin uso. Ignorar.
- `calls`, `calls_availability`: calendario viejo, compat legacy.
- La columna `contacts.tags text[]`: array denormalizado legacy. La fuente de verdad de tags es `contact_tags`.

Si construyes desde cero, quédate solo con el modelo de la Sección 2 y salta todo lo de este apéndice.

---

*Documento de reconstrucción del CRM. Generado el 2026-07-04 a partir del sistema vivo de Capital Hub OS (esquema Supabase real, RLS, y código de las automatizaciones). Autocontenido para entregar a otra IA.*
