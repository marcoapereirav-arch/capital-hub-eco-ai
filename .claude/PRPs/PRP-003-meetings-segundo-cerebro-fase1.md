# PRP-003: Módulo Meetings — Segundo Cerebro (Fase 1, Core MVP sin UI)

> **Estado**: IMPLEMENTADO — pendiente test con call real de Fathom
> **Fecha**: 2026-04-19
> **Proyecto**: Capital Hub OS
> **Alcance de este PRP**: SOLO Fase 1 del roadmap (ingest + clasificación + storage + escritura de Markdown). Sin UI. Sin insights estructurados. Sin avatar refinement. Sin búsqueda semántica.

---

## AJUSTES FINALES APROBADOS 2026-04-19

Estos ajustes sobreescriben cualquier dato en conflicto del resto del PRP.

1. **Modelo LLM**: `anthropic/claude-haiku-4.5` vía OpenRouter (NO sonnet). Temperatura 0.1. Coste objetivo ≈ $0.005–0.01/call.

2. **Timezone**: `Europe/Madrid` en todos los frontmatter YAML, en los nombres de archivo (fecha YYYY-MM-DD) y en el campo `time:` de los .md. Fathom envía UTC → convertir en el writer.

3. **Matching de team members por NOMBRE, no por email**:
   - Schema ajustado: `team_members.emails` es `text[] NULL DEFAULT NULL` (opcional). Se añade columna `aliases text[] NOT NULL DEFAULT '{}'`.
   - Detección: fuzzy contra nombre canónico + aliases, tanto sobre attendees de Fathom (campo `name`) como sobre menciones directas en la transcripción.
   - Si el nombre matchea a algún `team_member` (trigram similarity ≥0.80 sobre unaccent+lower del canonical_name o cualquier alias) → attendee interno.
   - Si no matchea → externo → ficha en `contacts` (match por email exacto si existe; si no, fuzzy por nombre).
   - Las 3 pruebas sintéticas del criterio de éxito siguen válidas pero se evalúan con nombre en vez de email.

4. **Auto-commit tras cada call procesada (Opción A)**:
   - Este punto SOBREESCRIBE los anti-patrones y gotchas que decían "no commitear desde el servidor". Ahora SÍ se commitea.
   - Tras escribir todos los .md (call, ficha, log, INDEX), el pipeline ejecuta:
     ```
     git add docs/
     git commit -m "meetings: {fathom_id_short} {titulo_slug}"
     ```
   - Sin `--no-verify`. Sin cambios a config de git (autor/firma tal cual está en el repo local).
   - Si `git commit` retorna "nothing to commit" → loguear y continuar, NO es error fatal.
   - Si `git` falla por otra razón (lock, repo corrupto) → log de error + `meetings.processing_error = 'git_commit_failed'`, pero el row queda como `processed` (la verdad cruda ya está en Supabase).
   - Cada call = 1 commit. Historial con ruido aceptado por el user.
   - En Vercel (prod) el filesystem es read-only fuera de `/tmp`, así que el auto-commit **solo opera en dev local / self-hosted**. En prod se guarda todo en Supabase y Fase 2/3 decide estrategia de sync.

5. **SEED de `team_members` (user no tiene emails a mano)**:
   - 6 registros con solo el nombre + `aliases=[]` + `emails=NULL`.
   - `es_usuario_app = true` solo para Marco y Adrián.
   - Nombres canónicos: `Marco`, `Adrián`, `JP`, `Álex`, `Patrick`, `Steven`.
   - Los emails se enriquecen después sin re-migración.

---

## Objetivo

Ingestar automáticamente TODAS las calls de Fathom (webhook `meeting_ended`), clasificarlas por contenido con LLM en un solo paso, persistir la verdad cruda en Supabase y generar un Markdown curado en `docs/` (git-versioned), de modo que Claude pueda responder en futuras sesiones a preguntas tipo "qué objeciones aparecieron este mes" o "qué cuellos de botella se repiten en los dailies" leyendo directamente el repo. Sin UI en esta fase.

## Por Qué

| Problema | Solución |
|----------|----------|
| Todas las calls viven en Fathom sin estructura consultable | Webhook + pipeline que estructura cada call en Supabase y Markdown |
| No hay forma de agrupar calls por contacto externo ni de separar calls internas del equipo | Dominio dual (commercial / operational) clasificado por contenido, no por participantes |
| Claude no puede "leer" lo que pasó en llamadas pasadas | `docs/contacts/`, `docs/meetings/team/` e `insights/*-log.md` quedan en git → contexto perpetuo |
| Integraciones tipo Zapier/Make fragmentan el stack | Todo nativo en el repo: un endpoint Next.js y el cliente de Fathom |

**Valor de negocio**: El equipo deja de perder memoria organizacional. Cada call suma señal estructurada al segundo cerebro. A partir de 10-20 calls, Claude responde con frases textuales de clientes reales, objeciones top, cuellos de botella repetidos, y decisiones ya tomadas en dailies.

---

## Qué

### Criterios de Éxito (testeables)

- [ ] Webhook `POST /api/webhooks/fathom` responde `200` en ≤3s devolviendo `{ ok: true }` y encolando el procesamiento en background (no bloquea Fathom).
- [ ] Firma HMAC del webhook se valida con `FATHOM_WEBHOOK_SECRET`. Firma inválida → `401`.
- [ ] Idempotencia: si llega el mismo `fathom_meeting_id` dos veces, no se duplica ni el row en `meetings` ni el Markdown. Segundo evento → `200` con `{ ok: true, duplicate: true }`.
- [ ] Fathom API devuelve transcript + metadata; el sistema maneja fallo con backoff exponencial (3 reintentos: 2s, 8s, 30s) antes de marcar la meeting como `failed`.
- [ ] LLM clasifica en UN solo call (single prompt) con salida estructurada Zod y devuelve: `scope`, `tipo`, `resultado`, `resumen`, `action_items[]`, `decisiones[]`, `participants[]` (con email + rol inferido), `funnel_stage` si aplica.
- [ ] Clasificación `scope` (`external` vs `internal`) se decide por CONTENIDO, no por ratio de asistentes. Se verifica con 3 casos sintéticos en tests: (a) 2 team + 1 externo hablando venta → `external/sales_*`, (b) 4 team discutiendo operaciones → `internal/team_daily`, (c) 2 team + 1 partner técnico → `external/partner`.
- [ ] Asistente con email en `team_members` NO crea row en `contacts`. Asistente con email fuera de esa lista, O sin email pero con nombre + indicio de contacto externo, SÍ entra a `contacts`.
- [ ] Matching de contactos: email exacto (case-insensitive, normalizado) → vínculo automático. Sin email pero nombre con similitud ≥0.85 (trigram) a un contacto existente → fila en `meeting_participants` con `match_status = 'fuzzy_pending'` en vez de link confirmado.
- [ ] Upsert a Supabase transaccional: o se crea la meeting con todos sus vínculos o se rollbackea.
- [ ] `scope = external` → Markdown en `docs/contacts/{slug-contacto-principal}/calls/YYYY-MM-DD-{slug-titulo}.md` + update de `docs/contacts/{slug}/ficha.md` (índice de calls) + append a `docs/insights/commercial-log.md`.
- [ ] `scope = internal` → Markdown en `docs/meetings/team/YYYY-MM-DD-{slug-titulo}.md` + append a `docs/insights/operational-log.md`.
- [ ] `docs/INDEX.md` se regenera automáticamente tras cada escritura (listado jerárquico actualizado).
- [ ] Los Markdowns incluyen frontmatter YAML válido con los campos definidos en "Formato Markdown" más abajo.
- [ ] `docs/Manual_Proyecto_Capital_Hub.md` NO se toca jamás por este pipeline (assertion explícito en código: cualquier escritura a ese path lanza `Error`).
- [ ] Los 6 `team_members` (Marco, Adrián, JP, Álex, Patrick, Steven) están seeded con `es_usuario_app` flag correcto (solo Marco y Adrián = true).
- [ ] Script `scripts/test-fathom-webhook.ts` simula un webhook con payload de ejemplo y verifica end-to-end que se crean row en Supabase + archivo .md + entrada en log.
- [ ] `npm run build` pasa sin errores. `npm run lint` pasa.

### Comportamiento Esperado (Happy Path)

1. Fathom termina una llamada y dispara `POST {APP_URL}/api/webhooks/fathom` con header `X-Fathom-Signature` y body JSON que incluye `meeting_id`, `recording_url`, `transcript_url`, `participants`, `duration`, `started_at`, `ended_at`, `title`.
2. Endpoint valida firma HMAC-SHA256. Si válida → responde `200 { ok: true, queued: true }` inmediatamente y arranca procesamiento async (usando `waitUntil()` de Next.js / edge-compatible o enqueue a un worker ligero).
3. Worker hace fetch a Fathom API con `FATHOM_API_KEY` para obtener transcript completo + metadata enriquecida. Retry 3x con backoff si falla.
4. Normaliza asistentes: separa `team_attendees` (emails que matchean `team_members`) de `external_attendees` (el resto).
5. Ejecuta un único call al LLM (Vercel AI SDK + OpenRouter, modelo `openai/gpt-4.1` o `anthropic/claude-sonnet-4.5` vía OpenRouter) con el prompt de clasificación (abajo) y schema Zod → recibe objeto estructurado `ClassificationResult`.
6. Para cada `external_attendee`: upsert en `contacts` (por email exacto normalizado). Si no hay email, busca fuzzy; si similitud ≥0.85 y `match_status = 'fuzzy_pending'`, si <0.85 crea contacto nuevo.
7. Transacción Supabase: inserta `meetings`, inserta N `meeting_participants`, inserta N `meeting_team_attendees`. `ON CONFLICT (fathom_meeting_id) DO NOTHING` para idempotencia.
8. Determina contacto principal: el `contact` con rol `primary` (ej. lead/cliente), fallback al primer participant externo.
9. Renderiza Markdown con frontmatter YAML + cuerpo (resumen, action items, decisiones, transcript collapsed con `<details>`).
10. Escribe archivo en la ruta correspondiente según `scope`. Si `external`, actualiza también `ficha.md` del contacto principal (append a sección "Calls").
11. Append a `insights/commercial-log.md` o `insights/operational-log.md` según scope (una entrada concisa con fecha + título + link al md + resumen 1-2 líneas).
12. Regenera `docs/INDEX.md` recorriendo `docs/contacts/*` y `docs/meetings/team/*`.
13. Marca `meetings.status = 'processed'` y `meetings.processed_at = now()`.

---

## Contexto

### Referencias

- `src/features/integrations/adapters/ghl.ts` — patrón de adapter que llama API externa con credentials desde Supabase.
- `src/features/integrations/services/` — patrón de services que encapsulan lógica de upsert a Supabase.
- `supabase/migrations/0005_shared_admin_access.sql` — patrón de RLS compartido entre admins vía función `is_admin()`.
- `docs/meetings/daily/2026-04-13.md` — ejemplo existente de daily. El nuevo formato NO lo rompe (sigue coexistiendo en `docs/meetings/daily/` manual; `docs/meetings/team/` es el output del pipeline).
- `docs/Brandkit_Capital_Hub.html` — solo relevante cuando llegue la UI (Fase 3).
- `docs/Manual_Proyecto_Capital_Hub.md` — INMUTABLE desde este pipeline.
- [Fathom Public API docs](https://docs.fathom.ai/api-reference) — endpoints de meetings + transcripts.
- [Fathom Webhooks](https://docs.fathom.ai/webhooks) — firma HMAC y payload.
- [Vercel AI SDK v5 — generateObject](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — salida estructurada con Zod.

### Arquitectura Propuesta (Feature-First)

```
src/
├── app/
│   └── api/
│       └── webhooks/
│           └── fathom/
│               └── route.ts              # POST handler + firma + waitUntil
└── features/
    └── meetings/
        ├── services/
        │   ├── fathom-client.ts          # fetch transcript + metadata, retry/backoff
        │   ├── classifier.ts             # llamada LLM con Zod schema
        │   ├── contacts-matcher.ts       # email exacto + fuzzy (pg_trgm)
        │   ├── meetings-repo.ts          # upsert transaccional en Supabase
        │   ├── markdown-writer.ts        # render + write de .md (ficha + call)
        │   ├── insights-logger.ts        # append a commercial-log / operational-log
        │   └── index-generator.ts        # regenera docs/INDEX.md
        ├── types/
        │   ├── fathom.ts                 # tipos del payload webhook + API
        │   ├── classification.ts         # Zod schema de ClassificationResult
        │   └── meeting.ts                # tipos de dominio (Meeting, Contact, Participant)
        ├── prompts/
        │   └── classify.ts               # prompt system + few-shot (archivo largo)
        └── constants.ts                  # team members seed, tipos enum, paths docs/

scripts/
└── test-fathom-webhook.ts                # simulador E2E (dev only)
```

### Modelo de Datos (Supabase)

```sql
-- =====================================================
-- Migration: 0006_meetings_segundo_cerebro.sql
-- =====================================================

-- Extensiones necesarias
create extension if not exists pg_trgm;     -- fuzzy matching de nombres
create extension if not exists unaccent;    -- normalización acentos

-- Reusa la función is_admin() de migration 0005.

-- 1) team_members (fija, seedeable)
create table public.team_members (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text not null unique,
  role_label text,                            -- "CEO", "Media Buyer", "Closer", etc
  es_usuario_app boolean not null default false,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.team_members enable row level security;

create policy "Admins manage team_members"
  on public.team_members for all
  using (public.is_admin())
  with check (public.is_admin());

-- Seed: solo Marco y Adrián son usuarios del app.
-- (Emails reales a completar al aplicar la migración; placeholders aquí.)
insert into public.team_members (full_name, email, role_label, es_usuario_app) values
  ('Marco Antonio', 'marco@capitalhub.tld', 'Co-Founder', true),
  ('Adrián Villanueva', 'adrianvillanuevarios@gmail.com', 'Co-Founder', true),
  ('JP', 'jp@capitalhub.tld', 'Marketing', false),
  ('Álex', 'alex@capitalhub.tld', 'Operaciones', false),
  ('Patrick', 'patrick@capitalhub.tld', 'Delivery', false),
  ('Steven', 'steven@capitalhub.tld', 'Delivery', false);

-- 2) contacts (fichas externas)
create table public.contacts (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  email text,                                  -- puede ser null (match por nombre)
  phone text,
  company text,
  stage text check (stage in (
    'lead','prospect','discovery','proposal','client','churned','partner','other'
  )) default 'lead',
  origin text,                                 -- 'ads','organic','referral','cold_outbound','partner'
  tags text[] default '{}',
  notes text,
  slug text not null unique,                   -- slugify(full_name + suffix si colisiona)
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create unique index contacts_email_unique_ci
  on public.contacts (lower(email)) where email is not null;

create index contacts_name_trgm_idx
  on public.contacts using gin (unaccent(lower(full_name)) gin_trgm_ops);

alter table public.contacts enable row level security;

create policy "Admins manage contacts"
  on public.contacts for all
  using (public.is_admin())
  with check (public.is_admin());

-- 3) meetings (tabla central)
create table public.meetings (
  id uuid primary key default gen_random_uuid(),
  fathom_meeting_id text not null unique,      -- idempotencia
  title text not null,
  started_at timestamptz not null,
  ended_at timestamptz,
  duration_seconds integer,
  fathom_share_url text,
  fathom_recording_url text,

  -- Clasificación
  scope text not null check (scope in ('external','internal')),
  tipo text not null check (tipo in (
    'sales_discovery','sales_closing','client_onboarding','client_success',
    'team_daily','team_strategy','partner','delivery','otros'
  )),
  resultado text,                              -- 'won','lost','follow_up','info','na'
  funnel_stage text,                           -- opcional, solo si scope=external y tipo=sales_*

  resumen text,                                -- resumen ejecutivo (<1000 chars)
  action_items jsonb default '[]',             -- [{texto, due_date?, owner_email?}]
  decisiones jsonb default '[]',               -- [{texto}]

  transcript_raw text,                         -- transcript completo, crudo
  transcript_language text default 'es',

  -- Ruta del markdown generado (para auditoría y linkback desde la UI futura)
  markdown_path text,

  -- Estado del pipeline
  status text not null default 'pending' check (status in (
    'pending','fetching','classifying','writing','processed','failed'
  )),
  processing_error text,
  retry_count integer not null default 0,
  processed_at timestamptz,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index meetings_started_at_idx on public.meetings (started_at desc);
create index meetings_scope_tipo_idx on public.meetings (scope, tipo);
create index meetings_status_idx on public.meetings (status) where status <> 'processed';

alter table public.meetings enable row level security;

create policy "Admins manage meetings"
  on public.meetings for all
  using (public.is_admin())
  with check (public.is_admin());

-- 4) meeting_participants (M:N meetings ↔ contacts)
create table public.meeting_participants (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,

  -- Si match_status = 'fuzzy_pending', contact_id es el candidato pero necesita confirmación humana.
  -- Si 'confirmed' o 'auto_email', el link está firme.
  -- Si 'unmatched', el asistente externo no pudo matchearse y se guarda solo el raw.
  match_status text not null default 'auto_email' check (match_status in (
    'auto_email','fuzzy_pending','confirmed','unmatched'
  )),
  match_score numeric(3,2),                    -- 0.00–1.00 para fuzzy

  role text not null default 'participant' check (role in (
    'primary','participant','decision_maker','gatekeeper'
  )),

  raw_name text,                               -- nombre tal como vino de Fathom
  raw_email text,

  created_at timestamptz not null default now(),
  unique (meeting_id, contact_id, raw_email)
);

alter table public.meeting_participants enable row level security;

create policy "Admins manage meeting_participants"
  on public.meeting_participants for all
  using (public.is_admin())
  with check (public.is_admin());

-- 5) meeting_team_attendees (M:N meetings ↔ team_members)
create table public.meeting_team_attendees (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  team_member_id uuid not null references public.team_members(id) on delete restrict,
  role text default 'attendee',                -- 'host','attendee','note_taker'
  created_at timestamptz not null default now(),
  unique (meeting_id, team_member_id)
);

alter table public.meeting_team_attendees enable row level security;

create policy "Admins manage meeting_team_attendees"
  on public.meeting_team_attendees for all
  using (public.is_admin())
  with check (public.is_admin());

-- 6) meeting_insights (placeholder para Fase 2; se crea la tabla vacía ya)
-- En Fase 1 NO se escribe aquí, pero dejamos la estructura para no hacer otra migración.
create table public.meeting_insights (
  id uuid primary key default gen_random_uuid(),
  meeting_id uuid not null references public.meetings(id) on delete cascade,
  contact_id uuid references public.contacts(id) on delete set null,
  kind text not null check (kind in (
    'objecion','dolor','frase_textual','patron','cuello_botella','decision'
  )),
  content text not null,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

alter table public.meeting_insights enable row level security;

create policy "Admins manage meeting_insights"
  on public.meeting_insights for all
  using (public.is_admin())
  with check (public.is_admin());

-- Trigger de updated_at para meetings y contacts
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger trg_meetings_touch before update on public.meetings
  for each row execute function public.touch_updated_at();
create trigger trg_contacts_touch before update on public.contacts
  for each row execute function public.touch_updated_at();
```

### Prompt de Clasificación (single-call)

**System prompt**:

```
Eres el clasificador de llamadas de Capital Hub. Recibes metadatos + transcript de una llamada grabada en Fathom y devuelves UN objeto JSON estructurado que cumple el schema dado.

REGLAS DURAS:
1. `scope`: decide por el CONTENIDO de la conversación, no por el conteo de asistentes.
   - `external` si el objetivo de la call es hablar CON alguien de fuera del equipo (ventas, onboarding, soporte a cliente, reunión con partner). Incluso si la mayoría son del team.
   - `internal` si todos los asistentes humanos (o todos los relevantes) son del team y discuten operaciones, estrategia, delivery, retro.
2. `tipo`: elige EXACTAMENTE uno:
   - `sales_discovery` — primer call de ventas, descubrimiento de necesidad.
   - `sales_closing` — segunda+ llamada, propuesta, cierre, negociación.
   - `client_onboarding` — cliente recién cerrado, arranque del servicio.
   - `client_success` — cliente activo, check-in, seguimiento, soporte.
   - `team_daily` — daily standup / sync corto del equipo (<45 min).
   - `team_strategy` — reunión estratégica larga, planificación, offsite.
   - `partner` — reunión con partner/proveedor (herramienta, consultor externo, agencia).
   - `delivery` — reunión interna sobre entrega operativa de un cliente concreto.
   - `otros` — no encaja.
3. `resultado`: `won` | `lost` | `follow_up` | `info` | `na`.
4. `funnel_stage`: solo si `scope=external` y `tipo` empieza por `sales_`. Valores: `lead` | `discovery` | `proposal` | `negotiation` | `closed_won` | `closed_lost`.
5. `participants`: incluye TODOS los humanos detectados en la transcripción. Para cada uno:
   - `name` (obligatorio, extrae el mejor nombre posible)
   - `email` (si aparece en metadata o transcript, si no null)
   - `is_team_member` (true si el email está en la lista TEAM_EMAILS que te paso; si no hay email, infiere por nombre + contexto)
   - `role` (`primary` | `participant` | `decision_maker` | `gatekeeper`)
   - `stage_inferred` (si `is_team_member=false`, infiere: `lead`, `prospect`, `client`, `partner`, `other`)
6. `resumen`: 3-6 frases, ejecutivo, en español, tono directo. Sin relleno.
7. `action_items`: array, cada uno `{ texto, owner_email?, due_date? ISO8601 }`. Solo items accionables claros.
8. `decisiones`: array, cada una `{ texto }`. Decisiones firmes tomadas en la call.
9. Si la transcript está vacía o corrupta, devuelve `tipo=otros`, `scope=internal`, `resumen="Transcript no disponible"`, y arrays vacíos.

NUNCA inventes datos. Si no hay evidencia clara en el transcript para un campo, usa null o el fallback permitido.
```

**Few-shot examples** (se incluyen 3 dentro del prompt, resumidos):

- **Ejemplo 1 (sales_discovery)**: 2 del team + 1 externo (Ricky Gómez). Ricky habla de "llevo 6 meses con cursos de trading pero no he facturado nada" → `scope=external`, `tipo=sales_discovery`, `resultado=follow_up`, `funnel_stage=discovery`, primary=Ricky.
- **Ejemplo 2 (team_daily)**: 4 del team (Marco, Adrián, JP, Álex) 30 min hablando de VSL retention y adspend → `scope=internal`, `tipo=team_daily`, `resultado=na`. Decisión: regrabar VSL a 3-4 min.
- **Ejemplo 3 (partner)**: Adrián + Marco + 1 rep de agencia de vídeo → `scope=external`, `tipo=partner`, `resultado=info`.

**User input**: JSON con `{ meeting_metadata, team_emails[], external_attendees_metadata[], transcript }`.

**Schema Zod** (TypeScript):

```ts
import { z } from 'zod';

export const ClassificationSchema = z.object({
  scope: z.enum(['external', 'internal']),
  tipo: z.enum([
    'sales_discovery','sales_closing','client_onboarding','client_success',
    'team_daily','team_strategy','partner','delivery','otros'
  ]),
  resultado: z.enum(['won','lost','follow_up','info','na']),
  funnel_stage: z.enum([
    'lead','discovery','proposal','negotiation','closed_won','closed_lost'
  ]).nullable(),
  resumen: z.string().min(20).max(1200),
  action_items: z.array(z.object({
    texto: z.string().min(3),
    owner_email: z.string().email().nullable().optional(),
    due_date: z.string().nullable().optional(), // ISO8601
  })),
  decisiones: z.array(z.object({ texto: z.string().min(3) })),
  participants: z.array(z.object({
    name: z.string().min(1),
    email: z.string().email().nullable(),
    is_team_member: z.boolean(),
    role: z.enum(['primary','participant','decision_maker','gatekeeper']),
    stage_inferred: z.enum(['lead','prospect','client','partner','other']).nullable(),
  })).min(1),
});

export type ClassificationResult = z.infer<typeof ClassificationSchema>;
```

Llamada con Vercel AI SDK:

```ts
import { generateObject } from 'ai';
import { createOpenRouter } from '@openrouter/ai-sdk-provider';

const openrouter = createOpenRouter({ apiKey: process.env.OPENROUTER_API_KEY! });
const model = openrouter('anthropic/claude-sonnet-4.5'); // o gpt-4.1 como fallback

const { object } = await generateObject({
  model,
  schema: ClassificationSchema,
  system: SYSTEM_PROMPT,
  prompt: buildUserPrompt({ meta, teamEmails, transcript }),
  temperature: 0.1,
});
```

### Formato Markdown Generado

**A) Call externa** → `docs/contacts/{slug}/calls/YYYY-MM-DD-{slug-titulo}.md`

```markdown
---
kind: call
fathom_id: fth_abc123
date: 2026-04-19
time: "16:30"
duration_min: 42
scope: external
tipo: sales_discovery
resultado: follow_up
funnel_stage: discovery
contact_slug: ricky-gomez
contact_name: Ricky Gómez
team_attendees:
  - adrian@capitalhub.tld
  - marco@capitalhub.tld
fathom_url: https://fathom.video/share/xxx
---

# Ricky Gómez — Sales Discovery — 2026-04-19

## Resumen
{resumen ejecutivo}

## Action Items
- [ ] {texto} — @{owner_email} — vence {due_date}

## Decisiones
- {texto}

## Participantes
- **Ricky Gómez** (lead, primary) — ricky@example.com
- Adrián Villanueva (team)
- Marco Antonio (team)

## Transcript
<details>
<summary>Ver transcript completo</summary>

{transcript_raw}

</details>
```

**B) Call interna** → `docs/meetings/team/YYYY-MM-DD-{slug-titulo}.md`

```markdown
---
kind: team_meeting
fathom_id: fth_xyz456
date: 2026-04-19
time: "10:00"
duration_min: 28
scope: internal
tipo: team_daily
resultado: na
team_attendees:
  - adrian@capitalhub.tld
  - marco@capitalhub.tld
  - jp@capitalhub.tld
fathom_url: https://fathom.video/share/yyy
---

# Daily — 2026-04-19

## Resumen
{resumen}

## Decisiones
- {texto}

## Action Items
- [ ] {texto} — @{owner_email}

## Transcript
<details>...</details>
```

**C) Ficha de contacto** → `docs/contacts/{slug}/ficha.md` (se actualiza en cada call)

```markdown
---
kind: contact_profile
slug: ricky-gomez
name: Ricky Gómez
email: ricky@example.com
phone: null
company: null
stage: prospect
origin: ads
tags: [trading, emprendedor-frustrado]
created_at: 2026-04-12
updated_at: 2026-04-19
---

# Ricky Gómez

## Perfil
{notas libres, pueden editarse manualmente}

## Historial de Calls
- [2026-04-19 — Sales Discovery](./calls/2026-04-19-sales-discovery.md) — `follow_up`
- [2026-04-12 — First Contact](./calls/2026-04-12-first-contact.md) — `info`
```

**D) Logs append-only**:

`docs/insights/commercial-log.md`:
```markdown
## 2026-04-19 · Ricky Gómez · sales_discovery · follow_up
[Link](../contacts/ricky-gomez/calls/2026-04-19-sales-discovery.md)
{primera oración del resumen}
```

`docs/insights/operational-log.md`:
```markdown
## 2026-04-19 · Daily · team_daily
[Link](../meetings/team/2026-04-19-daily.md)
{primera oración del resumen}
```

**E) `docs/INDEX.md`**: regenerado recorriendo `docs/contacts/*/ficha.md` y `docs/meetings/team/*.md`. Estructura:

```markdown
# Índice del Segundo Cerebro

## Contactos (N)
- [Ricky Gómez](./contacts/ricky-gomez/ficha.md) — prospect — 2 calls
- ...

## Meetings de Equipo (N)
- 2026-04-19 — [Daily](./meetings/team/2026-04-19-daily.md)
- ...

## Logs
- [Commercial Log](./insights/commercial-log.md)
- [Operational Log](./insights/operational-log.md)

_Último update: 2026-04-19T16:32:00Z_
```

### Endpoint del Webhook

`src/app/api/webhooks/fathom/route.ts`:

```ts
import { NextRequest } from 'next/server';
import { after } from 'next/server';   // Next.js 15+ API, disponible en Next 16.
import crypto from 'node:crypto';
import { processFathomWebhook } from '@/features/meetings/services/pipeline';

export const runtime = 'nodejs';         // necesitamos crypto + fs
export const maxDuration = 10;           // la respuesta es <3s; el worker corre después con `after()`

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get('x-fathom-signature') ?? '';
  const secret = process.env.FATHOM_WEBHOOK_SECRET!;

  const expected = crypto
    .createHmac('sha256', secret)
    .update(rawBody)
    .digest('hex');

  // timing-safe compare
  const sigBuf = Buffer.from(signature, 'hex');
  const expBuf = Buffer.from(expected, 'hex');
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return Response.json({ ok: false, error: 'invalid_signature' }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const event = payload.event ?? payload.type;
  if (event !== 'meeting_ended' && event !== 'meeting.ended') {
    return Response.json({ ok: true, ignored: true });
  }

  // Fire-and-forget con after() para no bloquear Fathom.
  after(async () => {
    try {
      await processFathomWebhook(payload);
    } catch (err) {
      console.error('[fathom-webhook]', err);
    }
  });

  return Response.json({ ok: true, queued: true });
}
```

### Manejo de Errores y Reintentos

| Fallo | Acción |
|-------|--------|
| Firma inválida | `401` inmediato, no se procesa. |
| Fathom API 5xx o timeout al obtener transcript | Retry 3x con backoff exponencial (2s, 8s, 30s). Tras el 3º, `meetings.status='failed'`, `processing_error` se guarda, `retry_count=3`. |
| Fathom API 4xx (meeting no existe, auth error) | No reintentar, `status='failed'` inmediato. |
| LLM devuelve output que falla `ClassificationSchema.parse` | 1 reintento con prompt reforzado ("Tu respuesta anterior no validó el schema. Asegúrate de devolver exactamente el JSON pedido."). Si falla de nuevo, `status='failed'`, `processing_error='schema_validation'`. |
| Supabase transaction falla | Rollback completo. `meetings` NO se inserta. Se reintenta 1x tras 5s. Si vuelve a fallar, `status='failed'` en una entrada de log separado (no en meetings, porque no existe row aún). |
| Escritura de Markdown falla (fs error) | El row de Supabase ya existe → `status='failed'`, `processing_error='markdown_write'`. Se expone endpoint `POST /api/meetings/{id}/reprocess-markdown` (admin only) para reintentar solo el paso de writing (Fase 2). |
| Contact matching ambiguo (fuzzy) | NO bloquea. Se inserta `meeting_participants.match_status='fuzzy_pending'` y se sigue. Pendiente de confirmación en UI (Fase 3). |

Job de reconciliación: cron diario (Fase 2+) que busca `meetings.status='failed'` con `retry_count<5` y los reintenta. Fase 1 solo logs + endpoint manual.

### Variables de Entorno Necesarias

```bash
# Fathom
FATHOM_API_KEY=                 # Bearer token de Fathom Team plan
FATHOM_WEBHOOK_SECRET=          # shared secret para HMAC

# OpenRouter (ya existe en el proyecto para otros usos; validar)
OPENROUTER_API_KEY=

# Supabase (ya existen)
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=      # necesario: el webhook no tiene sesión de usuario

# Repo writing
DOCS_ROOT=./docs                # por defecto; override en dev si hace falta
NEXT_PUBLIC_APP_URL=            # para logs/links en markdown
```

Añadir a `.env.example` también.

### Libs a Instalar

```bash
npm install ai zod @openrouter/ai-sdk-provider gray-matter slugify fast-glob
```

- `ai` — Vercel AI SDK v5.
- `zod` — schema validation.
- `@openrouter/ai-sdk-provider` — provider de OpenRouter para AI SDK.
- `gray-matter` — parse/serialize de frontmatter YAML.
- `slugify` — genera slugs ASCII-safe para nombres de contacto con acentos.
- `fast-glob` — recorre `docs/contacts/*/ficha.md` para regenerar `INDEX.md`.

No hace falta pgvector en esta fase.

---

## Blueprint (Assembly Line)

> Solo fases. Subtareas se generan al entrar a cada fase con bucle-agentico.

### Fase 1: Fundación de datos + seed
**Objetivo**: Migración `0006_meetings_segundo_cerebro.sql` aplicada en Supabase con RLS habilitado, extensiones `pg_trgm` y `unaccent` activas, tabla `team_members` seedeada con los 6 registros reales, y las 5 tablas restantes listas.
**Validación**:
- [ ] `mcp__supabase__list_tables` muestra las 6 tablas nuevas.
- [ ] `mcp__supabase__get_advisors` sin warnings de RLS.
- [ ] `select count(*) from team_members` = 6, con `es_usuario_app=true` solo en Marco y Adrián.
- [ ] `select * from pg_extension where extname in ('pg_trgm','unaccent')` devuelve ambas.

### Fase 2: Cliente Fathom + servicio de clasificación LLM
**Objetivo**: Poder, desde un script local, pasar un `fathom_meeting_id` → obtener transcript + metadata → clasificar con el LLM → obtener `ClassificationResult` válido contra Zod. Aislado del webhook.
**Validación**:
- [ ] `scripts/test-classifier.ts <fathom_id>` imprime JSON estructurado válido.
- [ ] Los 3 casos sintéticos del criterio de éxito de clasificación pasan.
- [ ] Retry/backoff documentado con logs verificables.

### Fase 3: Repositorio Supabase transaccional + matching de contactos
**Objetivo**: Dado un `ClassificationResult` + metadata, persistir atómicamente `meetings` + `meeting_participants` + `meeting_team_attendees`, haciendo upsert a `contacts` con matching email-exacto y fuzzy (pg_trgm).
**Validación**:
- [ ] `scripts/test-repo.ts` toma un fixture y crea todo el grafo.
- [ ] Re-ejecutarlo con el mismo `fathom_meeting_id` no duplica nada (idempotencia).
- [ ] Un contact con mismo email normalizado se reutiliza.
- [ ] Un contact con nombre similar (≥0.85) crea `match_status='fuzzy_pending'`.

### Fase 4: Writer de Markdown + INDEX generator
**Objetivo**: Dado un `meeting` persistido, generar el .md en la ruta correcta (según scope), actualizar `ficha.md` del contacto principal, appendear al log, y regenerar `INDEX.md`. Con guard absoluto: nunca tocar `docs/Manual_Proyecto_Capital_Hub.md`.
**Validación**:
- [ ] `scripts/test-writer.ts` genera archivos esperados en las rutas correctas.
- [ ] Frontmatter parsea con `gray-matter` sin errores.
- [ ] Test unitario: si writer recibe un path que resuelve a `Manual_Proyecto_Capital_Hub.md`, lanza `Error`.
- [ ] `INDEX.md` lista todos los contactos y meetings encontrados.

### Fase 5: Endpoint webhook + orquestador del pipeline
**Objetivo**: `POST /api/webhooks/fathom` valida firma, responde `200` en <3s, y ejecuta en background la cadena completa: fetch → classify → persist → write → log → index.
**Validación**:
- [ ] Firma válida → `200`. Firma inválida → `401`.
- [ ] `scripts/test-fathom-webhook.ts` simula POST con payload firmado y al terminar el background: Supabase tiene la meeting, el .md existe, el INDEX está actualizado, el log tiene la entrada.
- [ ] Reenviar el mismo payload devuelve `200 { duplicate: true }` y no duplica nada.

### Fase 6: Validación end-to-end con una call real
**Objetivo**: Grabar una call de prueba en Fathom (15 min, interna + externa sintética), dejar que el webhook real dispare, verificar que toda la cadena funciona en Vercel preview / staging.
**Validación**:
- [ ] Una call interna de prueba aparece en `docs/meetings/team/` con frontmatter correcto.
- [ ] Una call externa de prueba aparece en `docs/contacts/{slug}/calls/` y actualiza la ficha.
- [ ] `npm run build` pasa. `npm run lint` pasa.
- [ ] Vercel logs no muestran errores tras 24h.
- [ ] Claude, en una sesión nueva, puede responder "dime el resumen de la última call" leyendo solo el repo.

---

## Gotchas

- [ ] **Next 16 `after()` vs `waitUntil()`**: Next 16 expone `after()` desde `next/server`. Verificar que está disponible en App Router routes con `runtime='nodejs'`. Si no, usar `queueMicrotask` + fire-and-forget con try/catch global (aceptable para <30s de work).
- [ ] **Fathom API rate limits**: Team plan suele ser generoso, pero medir. El webhook no debe esperar al fetch del transcript para responder 200.
- [ ] **Service role key en edge**: el endpoint corre en `runtime='nodejs'`, no edge. El `SUPABASE_SERVICE_ROLE_KEY` solo se usa server-side; nunca expuesto.
- [ ] **Idempotencia en Markdown**: si el archivo .md ya existe, sobrescribir solo si el contenido cambia. Comparar hash del cuerpo. Evita churn de git.
- [ ] **Slugs colisionantes**: "María García" y "Maria Garcia" generan el mismo slug si no se normaliza. Usar `slugify(name, { lower: true, strict: true })` + sufijo `-2`, `-3` si colisiona con otro contact_id distinto.
- [ ] **Emails team con alias**: `marco+notes@capitalhub.tld` debe matchear `marco@capitalhub.tld`. Normalizar strippeando `+...`.
- [ ] **Transcripts largos**: >200k tokens no cabe en context. Si transcript_raw > 150k chars, truncar preservando inicio + final y marcar en metadata. Para Fase 1 poco probable (calls ~30-60 min).
- [ ] **LLM halucinando participants**: el prompt exige "NUNCA inventes". Si un email no aparece en metadata ni transcript, `email=null` y se queda como `unmatched` hasta revisión.
- [ ] **Fechas con timezone**: Fathom envía UTC. Los .md deben mostrar fecha en la zona del equipo (Europa/Madrid). Convertir en el writer.
- [ ] **Git state**: los .md generados se commitean a `main` **vía el repo local en dev** por ahora (el pipeline solo escribe archivos). En Fase 2/3 se evalúa bot-commit. Advertir al user: los .md generados aparecen como untracked y los commitea él.
- [ ] **Manual del proyecto INMUTABLE**: hard-coded path blacklist en writer. Cualquier bug que intente escribir ahí lanza y se loguea con alta prioridad.
- [ ] **Seed team_members con emails reales**: los placeholders `@capitalhub.tld` no son reales. Antes de aplicar la migración, preguntar al user los 6 emails exactos. Sin emails correctos, la clasificación `team vs external` degrada.
- [ ] **AI SDK no está instalado aún**: `npm install ai zod @openrouter/ai-sdk-provider` antes de Fase 2.

---

## Riesgos Identificados y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Fathom cambia firma del webhook o payload | Media | Alto | Versionar el handler, parsear defensivamente con Zod también el payload entrante, alertar en log si aparecen campos nuevos. |
| LLM clasifica mal scope sistemáticamente | Media | Medio | Pipeline de revisión manual (Fase 3) para confirmar/corregir; las correcciones retroalimentan few-shots del prompt. |
| Costes de OpenRouter por call larga | Baja | Bajo | Claude Sonnet 4.5 a ~$3/$15 por 1M tokens → 60 min transcript ≈ 15k tokens input ≈ $0.05/call. Presupuesto marginal. |
| Muchas calls en paralelo saturan el worker | Baja | Medio | `after()` es async; Fathom rara vez dispara >1/min. Si pasa a ser problema, migrar a cola (Inngest/Qstash) en Fase 2. |
| Escritura concurrente de `INDEX.md` o logs | Baja | Medio | Lock file simple (`docs/.index-lock`) con timestamp; si otro proceso está escribiendo hace <30s, esperar. |
| `docs/Manual_Proyecto_Capital_Hub.md` tocado por accidente | Muy baja | Muy alto | Guard explícito: `if (targetPath.endsWith('Manual_Proyecto_Capital_Hub.md')) throw new Error(...)`. Test unitario dedicado. |
| Contacto duplicado por variantes de nombre | Media | Bajo | Fuzzy matching pg_trgm + `match_status='fuzzy_pending'` en vez de crear siempre. Inbox de confirmación humano (Fase 3). |
| Transcript en idioma mixto (ES/EN) | Media | Bajo | Prompt en español, pero el modelo tolera; `transcript_language` se detecta y se guarda para downstream. |
| Fuga de datos personales en los .md committeados | Media | Medio | Los docs están en repo privado GitHub. Advertir al user. Opción futura: enmascarar emails en logs públicos. |
| Fathom deprecación de API Key en favor de OAuth | Baja | Medio | Ya pasó con GHL (v1→v2). Abstraer cliente Fathom detrás de una interfaz para futuro swap (patrón igual al de `/features/integrations/adapters/`). |

---

## 🧠 Aprendizajes (Self-Annealing)

> Esta sección crece durante la implementación.

### 2026-04-19 — unaccent() + índice GIN exige wrapper IMMUTABLE
- **Error**: `ERROR: 42P17: functions in index expression must be marked IMMUTABLE` al intentar `create index ... using gin (unaccent(lower(full_name)) gin_trgm_ops)`.
- **Causa**: `unaccent(text)` es STABLE, no IMMUTABLE, porque depende del diccionario en search_path. Los índices exigen IMMUTABLE.
- **Fix**: crear wrapper `public.immutable_unaccent(text)` `language sql immutable parallel safe strict` que llame `unaccent('public.unaccent', $1)` con diccionario explícito. Usarla en TODOS los índices que necesiten unaccent.
- **Aplicar en**: cualquier migración futura que mezcle `unaccent()` con índices (contacts, team_members, futuros módulos con búsqueda acento-insensible).

### 2026-04-19 — Toda función pública requiere `set search_path` explícito
- **Error**: Supabase advisor `function_search_path_mutable` (WARN) contra `immutable_unaccent` tras aplicar.
- **Fix**: añadir `set search_path = public, pg_temp` a la firma de la función. Aplicar también al resto (`touch_updated_at`, `is_admin` ya lo tenían).
- **Aplicar en**: toda nueva función SQL/PLPGSQL de este proyecto. Patrón obligatorio.

### 2026-04-19 — `similarity()` trigram es débil con nombres asimétricos
- **Observación**: `similarity('Marco', 'Marcos Antonio') = 0.31`. Un threshold de 0.80 sería demasiado estricto para matching de attendees de Fathom cuyos nombres suelen ser más largos que los canónicos del team.
- **Decisión para Fase 3**: el matcher usará `word_similarity()` o combinará con chequeo de substring (`public.immutable_unaccent(lower(attendee_name)) ILIKE '%' || canonical || '%'`). El threshold práctico será ≥0.60 para `word_similarity`, o substring-match directo para nombres cortos del team.
- **Verificación**: `similarity('Álex', 'Alex') = 1.00` — unaccent funciona; el problema es solo la asimetría de longitud, no la normalización.

### 2026-04-19 — plpgsql: record + scalar en SELECT INTO no se pueden mezclar
- **Error**: `42601: record variable cannot be part of multiple-item INTO list` al hacer `select c.*, word_similarity(...) into hit, sim`.
- **Fix**: usar solo scalares. `select id, word_similarity(...) into v_contact_id, v_score from contacts ...`. Los record types hay que llenarlos con `SELECT * INTO hit` aislado.
- **Aplicar en**: cualquier función plpgsql futura que combine lookup + score.

### 2026-04-19 — UNIQUE con columnas nullable requiere coalesce
- **Contexto**: `meeting_participants.unique (meeting_id, contact_id, raw_email)` no deduplica cuando `contact_id` o `raw_email` es NULL (Postgres trata NULL como distinto).
- **Fix**: `create unique index ... on (meeting_id, coalesce(contact_id::text, ''), coalesce(raw_email, ''))`. Así dos filas con mismos valores no-null + nulls idénticos colisionan como se espera.
- **Aplicar en**: cualquier tabla M:N con foreign keys nullables donde quieras deduplicación real.

---

## Anti-Patrones

- NO mover esta lógica a Zapier/Make/n8n. Todo vive en el repo.
- NO tocar `docs/Manual_Proyecto_Capital_Hub.md` bajo ninguna circunstancia desde este pipeline.
- NO clasificar por ratio de participantes. La clasificación es por contenido.
- NO crear contactos para emails del team.
- NO backfillear calls históricas automáticamente.
- NO commitear los .md generados desde el servidor en Fase 1 (solo escribir a disco; el commit lo hace el humano hasta Fase 2+).
- NO hacer polling a Fathom. Solo webhook-driven.
- NO bloquear la respuesta del webhook con el pipeline completo. `after()` + 200 rápido.
- NO exponer el service role key al cliente. Nunca sale de `route.ts` + services server-side.
- NO guardar credenciales de Fathom en Supabase (como sí hicimos con GHL). Es secret de infra, va en env vars del proyecto.
- NO implementar insights estructurados ni UI en esta fase. Ese es Fase 2/3.

---

*PRP pendiente de aprobación. No se ha modificado código ni BD.*
