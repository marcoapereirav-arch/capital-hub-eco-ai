# PRP-004: Content Intel — Análisis IG + Generador de Guiones Virales (MVP)

> **Estado**: PENDIENTE
> **Fecha**: 2026-04-22
> **Proyecto**: Capital Hub OS
> **Alcance**: MVP Instagram-only. YouTube/TikTok quedan fuera pero la arquitectura los contempla (adapter pattern por plataforma).

---

## Objetivo

Construir una feature interna en el dashboard de Capital Hub (`/content-intel`) que permita a Adrián: (1) mantener un pool editable de cuentas IG semilla, (2) bajar metadata de sus videos vía Apify y transcribir los top performers vía Gemini 2.5, (3) hacer consultas cruzadas on-demand en lenguaje natural sobre el corpus, y (4) generar guiones nuevos firmados Adrián apoyados en brand playbook + avatar + patrones detectados + referencias ad-hoc — todo desde UI, cero terminal.

## Por Qué

| Problema | Solución |
|----------|----------|
| Adrián compite por la misma audiencia que 7+ creadores (avatar Andrés), pero no tiene forma sistemática de estudiar qué les funciona | Pool de cuentas semilla + scrape periódico (manual) + métricas ordenables |
| Mirar videos uno por uno no escala y se queda en intuición | Transcripciones top-X + consultas LLM cruzadas ("patrón común", "CTAs", "hooks") |
| Generar guiones desde cero cada día consume mucho tiempo creativo y pierde consistencia de marca | Generador que consume brand playbook + avatar + patrones + referencias, sale en tono Adrián |
| Brand playbook y avatar son documentos vivos — un generador hardcoded los desactualiza rápido | Lectura fresca desde `docs/` en cada generación (nunca copias embebidas) |
| Futuro: YouTube y TikTok van a entrar al pool | Adapter pattern por plataforma desde el primer día (storage normalizado, scraper pluggable) |

**Valor de negocio**: Adrián 10x la velocidad de producción de contenido IG sin perder identidad. Multiplica la señal competitiva sin contratar equipo de research. Una vez probado en IG, abrir YouTube/TikTok es incremental (nuevo adapter), no refactor. Directamente conectado al Desired Outcome del brand playbook: escalar Capital Hub a 200k/mes apoyándose en la marca personal.

---

## Qué

### Criterios de Éxito (testeables)

- [ ] CRUD de seed accounts funciona desde UI: añadir `@handle`, listar, pausar, borrar. Handles normalizados (lowercase, sin `@`, sin URL). Unicidad por `(platform, handle)`.
- [ ] Botón "Sincronizar cuenta" dispara un job que llama Apify Instagram scraper y persiste los videos públicos en Supabase (metadata: `shortcode`, `url`, `caption`, `posted_at`, `views`, `likes`, `comments`, `duration_s`, `video_url`, `thumbnail_url`, `is_reel`).
- [ ] Job respeta rate limiting de Apify y rellena `last_synced_at` + `sync_status` por cuenta (`idle | running | ok | error`). Errores quedan logueados con mensaje legible en UI.
- [ ] Tabla de videos es ordenable por: views, likes, comments, engagement_rate calculado (`(likes+comments)/views`), `posted_at`. Filtrable por cuenta y rango de fechas.
- [ ] Botón "Transcribir top X" por cuenta (default X=20, configurable) ordena por views desc y encola la transcripción de los que aún no tienen. Los que ya tienen transcript se saltan (idempotente).
- [ ] Transcripción usa Gemini 2.5 con input `video_url` de Apify. Persiste `transcript`, `transcript_language`, `transcript_model`, `transcript_cost_usd`, `transcribed_at`. Si falla → `transcript_status = 'error'` con mensaje.
- [ ] Detalle de video muestra: thumbnail + metadata + caption + transcript (colapsable) + análisis (hook, tipo de CTA, pilares de contenido inferidos). El análisis se computa on-demand y se cachea en la row.
- [ ] Vista "Consulta cruzada": input de texto libre + selector multi de cuentas + filtros (min views, rango fechas) → ejecuta un prompt LLM (Claude via OpenRouter) sobre el subconjunto de videos con transcript. Respuesta markdown se persiste en tabla `content_queries` (histórico consultable).
- [ ] Generador de guiones: formulario con `brief` (libre, ej: "guion sobre disciplina aplicada al cuerpo"), `plataforma objetivo`, `duración objetivo`, `pilar de contenido` (selector de los 3 del playbook), `referencias ad-hoc` (multiselect de videos del corpus). Antes de ejecutar, el sistema LEE FRESCO `docs/brand-playbook.md` y `docs/avatar-andres.md` y los mete en el contexto del prompt.
- [ ] Guion generado incluye: título, hook (2-3 variantes), cuerpo con marcas de beats, CTA, notas de producción (tono, ritmo, props si aplica), referencias usadas (links a videos del corpus). Se persiste en `generated_scripts` con `status = 'draft'`.
- [ ] Histórico de guiones: lista paginada editable. Cada guion tiene versión editada por el user guardada separada del output original del LLM. Estados: `draft | ready | published | archived`.
- [ ] Arquitectura platform-agnostic verificable: `platform` es columna en `seed_accounts` y `videos` con CHECK in (`instagram`,`youtube`,`tiktok`). Scraper se elige vía factory `getScraper(platform)`. Adapter de IG es la única implementación; los stubs de YT/TT lanzan `NotImplementedError` explícito.
- [ ] Ninguna clave API aparece en cliente. Todo Apify/Gemini/OpenRouter se llama desde route handlers/server actions con keys leídas de `process.env`.
- [ ] RLS activo en todas las tablas nuevas. Acceso limitado a admins (reutiliza `is_admin()` de `0005_shared_admin_access.sql`).
- [ ] UI respeta `docs/Brandkit_Capital_Hub.html` (colores, tipografía, espaciado, componentes). Cero colores default genéricos.
- [ ] `npm run build` pasa sin errores. Tipado estricto: cero `any`, Zod valida todos los inputs del user y todos los payloads de APIs externas.
- [ ] Feature visible en sidebar con icono propio, ruta `/content-intel`, protegida por admin.

### Comportamiento Esperado (Happy Path)

1. Adrián abre `/content-intel`. Ve 3 tabs: **Cuentas**, **Videos**, **Consultas & Guiones**.
2. Tab **Cuentas**: listado de las 7 cuentas seed ya pre-cargadas desde `docs/content-intel-seed-accounts.md` (migration o seed script). Puede añadir/pausar/borrar. Click "Sync" en una cuenta → toast "Sincronizando… (puede tardar 1-3 min)". Al terminar, `last_synced_at` se actualiza y el contador de videos refresca.
3. Tab **Videos**: tabla global con videos de todas las cuentas activas. Por defecto ordenada por `views desc`. Filtros laterales: cuenta, rango fechas, `has_transcript` sí/no, min views. Por cuenta hay botón "Transcribir top 20 sin transcript".
4. Click en una row → drawer con detalle: thumbnail, métricas, caption, transcript (si existe), botón "Analizar" (hook + CTA + pilares) que guarda el output cacheado.
5. Tab **Consultas & Guiones** dividido en dos sub-tabs:
   - **Consulta**: textarea + selector de cuentas + filtros. Submit → loader → respuesta markdown con citas a videos concretos. La consulta queda en histórico (lista lateral).
   - **Generar Guion**: formulario (brief, plataforma, duración, pilar, referencias). Submit → el server lee `docs/brand-playbook.md` + `docs/avatar-andres.md` del filesystem del repo, arma el contexto, llama Claude. Response renderizada en editor simple (textarea enriquecida). User puede guardar como `draft`, editar, marcar `ready` o `published`.
6. Todo persiste entre sesiones. El histórico de guiones y consultas es navegable.

---

## Contexto

### Referencias

- `src/features/meetings/services/pipeline.ts` — patrón de pipeline server-side con persistencia + artefactos + estados.
- `src/features/meetings/services/classifier.ts` — patrón de call a LLM estructurado con Vercel AI SDK + OpenRouter + Zod + retry.
- `src/features/meetings/services/fathom-client.ts` — patrón de cliente de API externa (equivalente directo al que tocará construir para Apify).
- `src/features/integrations/adapters/` — patrón de adapter por proveedor externo (replica para `adapters/instagram.ts`, futuros `youtube.ts`, `tiktok.ts`).
- `src/features/tasks/` — patrón de feature con store Zustand + components + services para UI CRUD.
- `src/features/shell/components/nav-config.ts` — añadir entrada de sidebar.
- `src/app/(main)/dashboard/page.tsx` — patrón de ruta protegida del main app.
- `src/lib/supabase/admin.ts` — cliente admin server-side para escrituras con service role.
- `supabase/migrations/0005_shared_admin_access.sql` — función `is_admin()` para políticas RLS.
- `supabase/migrations/0006_meetings_segundo_cerebro.sql` — patrón de migración completa (tables + RLS + seeds + indexes).
- `docs/Manual_Proyecto_Capital_Hub.md` — INMUTABLE (no lo toca este pipeline).
- `docs/brand-playbook.md` — LECTURA FRESCA en cada generación de guion.
- `docs/avatar-andres.md` — LECTURA FRESCA en cada generación de guion.
- `docs/content-intel-seed-accounts.md` — fuente canónica del seed inicial (7 cuentas).
- `docs/Brandkit_Capital_Hub.html` — ley de diseño de TODA la UI.
- [Apify Instagram Scraper](https://apify.com/apify/instagram-scraper) — actor oficial, endpoint `/v2/acts/apify~instagram-scraper/run-sync-get-dataset-items`.
- [Gemini API — video input](https://ai.google.dev/gemini-api/docs/video-understanding) — pasar video por URL o file upload, pedir transcript.
- [Vercel AI SDK v5 generateObject](https://ai-sdk.dev/docs/ai-sdk-core/generating-structured-data) — salida estructurada para análisis de video y generación de guion.

### Arquitectura Propuesta (Feature-First, platform-agnostic)

```
src/features/content-intel/
├── components/
│   ├── seed-accounts-table.tsx
│   ├── add-account-dialog.tsx
│   ├── videos-table.tsx
│   ├── video-detail-drawer.tsx
│   ├── cross-query-panel.tsx
│   ├── script-generator-form.tsx
│   ├── scripts-history-list.tsx
│   └── script-editor.tsx
├── hooks/
│   ├── use-seed-accounts.ts
│   ├── use-videos.ts
│   ├── use-queries.ts
│   └── use-scripts.ts
├── services/
│   ├── scrapers/
│   │   ├── index.ts              # factory getScraper(platform)
│   │   ├── instagram.ts          # adapter Apify IG
│   │   ├── youtube.stub.ts       # NotImplementedError
│   │   └── tiktok.stub.ts        # NotImplementedError
│   ├── transcriber.ts            # Gemini 2.5 wrapper (video URL → transcript)
│   ├── analyzer.ts               # Claude → hook/CTA/pilares (structured)
│   ├── cross-query.ts            # Claude → respuesta markdown sobre corpus
│   ├── script-generator.ts       # Claude → guion (lee docs/ fresco)
│   ├── content-intel-repo.ts     # upserts Supabase
│   └── brand-context.ts          # fs.readFile de brand-playbook + avatar
├── prompts/
│   ├── analyze-video.ts
│   ├── cross-query.ts
│   └── generate-script.ts
├── store/
│   └── content-intel-store.ts    # Zustand: filtros UI + selección actual
├── types/
│   ├── platform.ts               # type Platform = 'instagram'|'youtube'|'tiktok'
│   ├── video.ts
│   ├── account.ts
│   ├── query.ts
│   └── script.ts
└── constants.ts                  # modelos LLM, top_x default, etc.

src/app/(main)/content-intel/
└── page.tsx                      # tabs + layout

src/app/api/content-intel/
├── accounts/route.ts             # CRUD
├── sync/route.ts                 # POST → dispara scrape
├── transcribe/route.ts           # POST → encola transcripción top-X
├── analyze/route.ts              # POST → analiza video individual
├── query/route.ts                # POST → consulta cruzada
└── scripts/route.ts              # CRUD guiones + POST generate
```

### Modelo de Datos (Supabase, migración `0008_content_intel.sql`)

```sql
-- Platforms soportadas (MVP: solo instagram)
-- Nota: CHECK constraint permite ampliar sin re-migración.

create table public.ci_seed_accounts (
  id uuid primary key default gen_random_uuid(),
  platform text not null check (platform in ('instagram','youtube','tiktok')),
  handle text not null,            -- sin @, lowercase
  display_name text,
  notes text,
  is_active boolean not null default true,
  last_synced_at timestamptz,
  sync_status text not null default 'idle' check (sync_status in ('idle','running','ok','error')),
  sync_error text,
  video_count int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, handle)
);

create table public.ci_videos (
  id uuid primary key default gen_random_uuid(),
  account_id uuid not null references public.ci_seed_accounts(id) on delete cascade,
  platform text not null check (platform in ('instagram','youtube','tiktok')),
  external_id text not null,       -- shortcode IG, videoId YT, id TT
  url text not null,
  caption text,
  posted_at timestamptz,
  duration_s int,
  views bigint,
  likes bigint,
  comments bigint,
  engagement_rate numeric generated always as (
    case when coalesce(views,0) > 0
      then (coalesce(likes,0) + coalesce(comments,0))::numeric / views
      else null end
  ) stored,
  is_reel boolean,
  video_url text,                  -- para transcribir
  thumbnail_url text,
  raw jsonb,                       -- payload crudo del scraper
  transcript text,
  transcript_language text,
  transcript_model text,
  transcript_cost_usd numeric,
  transcript_status text not null default 'pending' check (transcript_status in ('pending','running','ok','error','skipped')),
  transcript_error text,
  transcribed_at timestamptz,
  analysis jsonb,                  -- { hook, cta_type, pillars[], virality_hypothesis }
  analyzed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (platform, external_id)
);

create index ci_videos_account_idx on public.ci_videos(account_id);
create index ci_videos_views_idx on public.ci_videos(views desc nulls last);
create index ci_videos_posted_idx on public.ci_videos(posted_at desc nulls last);
create index ci_videos_engagement_idx on public.ci_videos(engagement_rate desc nulls last);

create table public.ci_queries (
  id uuid primary key default gen_random_uuid(),
  prompt text not null,
  account_ids uuid[] not null default '{}',
  filters jsonb not null default '{}'::jsonb,     -- { min_views, from, to, platform }
  videos_used uuid[] not null default '{}',      -- ids de videos referenciados en la respuesta
  response_markdown text,
  model text,
  tokens_used int,
  cost_usd numeric,
  status text not null default 'running' check (status in ('running','ok','error')),
  error text,
  created_at timestamptz not null default now()
);

create table public.ci_scripts (
  id uuid primary key default gen_random_uuid(),
  brief text not null,
  platform text not null check (platform in ('instagram','youtube','tiktok')),
  duration_target_s int,
  content_pillar text,              -- mentalidad | humano | transurfing (o libre)
  reference_video_ids uuid[] not null default '{}',
  -- fuentes "frescas" capturadas en el momento de la generación (snapshot para reproducibilidad)
  playbook_snapshot_hash text,
  avatar_snapshot_hash text,
  llm_output jsonb,                 -- { title, hook_variants[], body, cta, production_notes }
  llm_output_markdown text,         -- versión plana para render rápido
  user_edited_markdown text,        -- lo que Adrián deja editable
  status text not null default 'draft' check (status in ('draft','ready','published','archived')),
  model text,
  cost_usd numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- RLS: solo admins acceden a la feature
alter table public.ci_seed_accounts enable row level security;
alter table public.ci_videos enable row level security;
alter table public.ci_queries enable row level security;
alter table public.ci_scripts enable row level security;

create policy "Admins manage ci_seed_accounts"
  on public.ci_seed_accounts for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage ci_videos"
  on public.ci_videos for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage ci_queries"
  on public.ci_queries for all
  using (public.is_admin()) with check (public.is_admin());

create policy "Admins manage ci_scripts"
  on public.ci_scripts for all
  using (public.is_admin()) with check (public.is_admin());

-- Seed: 7 cuentas iniciales de docs/content-intel-seed-accounts.md
insert into public.ci_seed_accounts (platform, handle) values
  ('instagram','pedrobuerbaum'),
  ('instagram','enrique.vv'),
  ('instagram','jaimehigueraes'),
  ('instagram','carlos_esparraga4'),
  ('instagram','dollardoradoyt'),
  ('instagram','giuliano.c'),
  ('instagram','ramiro.cubria');
```

### Variables de entorno (añadir a `.env.local.example`)

```
# Content Intel
APIFY_TOKEN=
GEMINI_API_KEY=
# OPENROUTER_API_KEY ya existe (reuso)
```

### Decisiones de diseño clave

1. **Platform-agnostic desde el esquema**: `platform` es columna en accounts y videos. Factory `getScraper(platform)` selecciona adapter. MVP solo entrega `instagram.ts`; stubs de YT/TT ya existen con `throw new NotImplementedError('youtube scraper coming in V2')` para que la extensión futura sea "añadir adapter" no "refactorizar tablas".
2. **Brand context fresco, no embebido**: `services/brand-context.ts` hace `fs.readFile` de `docs/brand-playbook.md` y `docs/avatar-andres.md` en CADA generación. Se guarda un `sha256` del contenido en `ci_scripts.playbook_snapshot_hash` para trazabilidad, pero la fuente de verdad es el archivo. Cuando Adrián edite el playbook, el próximo guion usa la nueva versión sin deploy.
3. **Métricas sin saves/shares**: el scraper pide solo `views/likes/comments`. Engagement rate se calcula como `(likes+comments)/views` (generated column). Cualquier análisis que pida "dinero generado" responde explícitamente "no medible desde fuera" y pivota a proxies (CTA presente + tipo + volumen de comentarios de intención).
4. **Query on-demand vs batch**: nada se analiza automáticamente al scrapear. Metadata sí se baja. Transcripción y análisis se disparan explícitamente desde UI (ahorro de coste Gemini + control).
5. **Reuso de stack existente**: Vercel AI SDK + OpenRouter (ya instalado, patrón en `meetings/classifier.ts`). Zod para TODO input/output. Zustand para filtros de UI. Supabase admin client server-side para escrituras privilegiadas.
6. **Persistencia 100% Supabase**: los guiones viven en Supabase, no en `docs/`. A diferencia de meetings, este módulo no escribe al repo (content-intel es efímero/iterativo, no memoria organizacional canónica).
7. **Rate limiting y coste bajo control**: transcripción gated por botón explícito + top-X (default 20). Cross-query y generate tienen confirmación antes de correr con >40 videos en contexto. Cada operación LLM persiste `cost_usd` estimado.
8. **Cero terminal para el user**: toda interacción es UI. Los jobs tardan — se muestran con spinner + estado en la row (`sync_status`, `transcript_status`). No hay CLIs para Adrián.

---

## Blueprint (Assembly Line)

> Solo FASES. Las subtareas se mapean al entrar a cada fase vía `/bucle-agentico`.

### Fase 1: Schema + seed + infra base
**Objetivo**: Migración `0008_content_intel.sql` aplicada, 7 cuentas seed presentes, RLS verificado, tipos generados, `.env.local.example` actualizado, `NotImplementedError` class disponible.
**Validación**:
- `list_tables` muestra `ci_seed_accounts`, `ci_videos`, `ci_queries`, `ci_scripts`.
- `select count(*) from ci_seed_accounts where platform='instagram'` = 7.
- `get_advisors` sin warnings de RLS.
- Tipos TS regenerados, compilan.

### Fase 2: Adapter IG + pipeline de sync de metadata
**Objetivo**: `services/scrapers/instagram.ts` llama Apify, normaliza al schema `ci_videos`, upsert idempotente por `(platform, external_id)`. Factory `getScraper()` funcionando con stubs de YT/TT lanzando `NotImplementedError`. Route handler `POST /api/content-intel/sync` dispara el job y actualiza `sync_status`.
**Validación**:
- Con una cuenta de prueba, curl al endpoint devuelve 200 y al poco `ci_videos` tiene rows.
- Re-ejecutar no duplica.
- Cuenta con handle inválido → `sync_status='error'` + mensaje legible.

### Fase 3: Transcripción Gemini + análisis de video
**Objetivo**: `services/transcriber.ts` toma video_url y devuelve `transcript + language + cost`. Route `POST /api/content-intel/transcribe` recibe `{ account_id, top_x }`, selecciona top-X por views sin transcript, encola, actualiza estado. `services/analyzer.ts` con Claude devuelve `{ hook, cta_type, pillars[], virality_hypothesis }` estructurado.
**Validación**:
- Un video conocido → transcript razonable persistido.
- Re-transcribir mismo video → `skipped`.
- Fallo de Gemini → estado `error` con mensaje.
- Analizador sobre un transcript retorna objeto válido según Zod schema.

### Fase 4: UI — pestaña Cuentas + Videos
**Objetivo**: Página `/content-intel` con tabs, tabla de cuentas (CRUD + sync), tabla de videos (sort, filter, drawer de detalle con transcript + botón Analizar). Respeta brandkit. Sidebar actualizado.
**Validación**:
- Playwright: navegar a `/content-intel`, añadir cuenta, ver que aparece, click sync, ver estado cambiar.
- Tabla de videos muestra data real de Supabase, ordena por views desc por default.
- Drawer de detalle renderiza transcript y permite disparar análisis.
- `npm run build` pasa.

### Fase 5: Consultas cruzadas on-demand
**Objetivo**: `services/cross-query.ts` construye contexto (videos del subset con transcript), llama Claude con prompt que cita videos, persiste en `ci_queries` y devuelve markdown. UI sub-tab con input + selector + filtros + histórico lateral.
**Validación**:
- Consulta "top 20 videos con más views de estas 7 cuentas, patrón común de hooks" devuelve markdown con referencias.
- Row en `ci_queries` con `videos_used[]`, `cost_usd`, `model`.
- Histórico navegable, reabrir consulta re-renderiza respuesta.

### Fase 6: Generador de guiones con brand context fresco
**Objetivo**: `services/brand-context.ts` lee `docs/brand-playbook.md` + `docs/avatar-andres.md`, calcula hashes. `services/script-generator.ts` arma prompt con brand + avatar + referencias + brief + patrón, llama Claude estructurado, persiste en `ci_scripts`. UI: formulario + editor + botón Guardar + estados.
**Validación**:
- Modificar `docs/brand-playbook.md`, generar nuevo guion → el output refleja el cambio (verificable con un marker único en el playbook).
- `playbook_snapshot_hash` cambia entre runs si el archivo cambió.
- Editar guion y guardar → `user_edited_markdown` se persiste, `llm_output_markdown` queda intacto.
- Cambio de `status` refleja en histórico.

### Fase 7: Validación end-to-end + hardening
**Objetivo**: Flujo completo Adrián (real): añadir cuenta nueva → sync → transcribir top 10 → consulta → generar guion → editar → marcar ready. Revisión de costes, rate limits, errores UX.
**Validación**:
- [ ] `npm run typecheck` pasa (cero `any`).
- [ ] `npm run build` exitoso.
- [ ] Playwright screenshot de cada tab renderiza sin errores.
- [ ] Todos los inputs de user validados con Zod.
- [ ] RLS probado con user no-admin → 403 / vacío.
- [ ] Criterios de éxito del bloque `Qué` cumplidos 1:1.
- [ ] Apify/Gemini/OpenRouter no aparecen en bundle cliente (verificar con búsqueda en `.next/static`).

---

## Aprendizajes (Self-Annealing)

> Se llena durante la implementación.

---

## Gotchas

- [ ] **Apify Instagram scraper devuelve views como `videoPlayCount` o `videoViewCount` según tipo de post** — normalizar en adapter.
- [ ] **Reels vs feed videos tienen campos distintos** — `is_reel` se infiere del tipo y algunos fields viven en paths diferentes del JSON. Guardar payload crudo en `raw jsonb` siempre para forense.
- [ ] **Apify run-sync endpoint puede tardar 60-180s** para cuentas grandes. Usar `waitUntil()` / background task y no bloquear la request UI.
- [ ] **Gemini 2.5 con video por URL**: algunos videos de IG requieren auth y el URL expira en horas. Si Gemini rechaza la URL, caer a flujo "descarga → file upload → transcript → borrar tmp" (usar `/tmp` en Vercel).
- [ ] **Costes Gemini video crecen rápido**: siempre gated por "top X" explícito. Nunca transcribir "todo". Logear `cost_usd` por transcript.
- [ ] **Claude (OpenRouter) tiene límites de contexto**: si cross-query selecciona >30 videos con transcript largo, truncar transcript a primeras N palabras y avisar en UI. Alternativa: embeddings + retrieval (V2).
- [ ] **Brand playbook es markdown largo**: no meterlo entero si supera 8k tokens. Extraer secciones clave (pilares, tono, manifiesto, pipeline). Dejar configurable qué secciones incluir.
- [ ] **RLS con tabla `ci_` y admins**: probar con usuario no-admin que NO ve nada. `is_admin()` ya existe en `0005_shared_admin_access.sql`, no reinventar.
- [ ] **Handle normalization**: strip `@`, strip URL, lowercase. Crear helper `normalizeHandle(input)` y usarlo siempre antes de DB.
- [ ] **IG puede bloquear scraping**: Apify rota IPs pero cuentas privadas o con flags antibot devuelven vacío. Tratar "0 videos retornados" como warning, no error si el handle existe.
- [ ] **fs.readFile en Vercel**: `docs/` se empaqueta con el deploy. Usar `path.join(process.cwd(), 'docs', '...')`. Verificar que `next.config` no excluya `docs/` del bundle server.
- [ ] **No commitear APIFY_TOKEN ni GEMINI_API_KEY**: ya están en `.env.local` (no versionado). Añadirlos al `.env.local.example` vacíos.
- [ ] **Brandkit es ley**: antes de cualquier JSX leer `docs/Brandkit_Capital_Hub.html`. Cero colores Tailwind defaults genéricos.
- [ ] **CHECK constraint en `platform`** debe listar las 3 plataformas desde día 1, aunque solo IG se implemente. Evita re-migración cuando entre YT/TT.
- [ ] **updated_at triggers**: añadir trigger o actualizar manualmente en cada update para no depender de clientes.

## Anti-Patrones

- NO embeber `brand-playbook` ni `avatar-andres` como constantes en código. SIEMPRE leer fresco de `docs/`.
- NO llamar Apify/Gemini/OpenRouter desde componentes cliente. Todo server.
- NO ejecutar transcripciones masivas automáticas. Solo on-demand gated por botón.
- NO intentar medir "dinero generado" — el sistema lo trata como no medible y pivota a proxies.
- NO hardcodear `platform='instagram'` en queries ni en componentes. Usar constantes / params.
- NO exponer `APIFY_TOKEN`, `GEMINI_API_KEY`, `OPENROUTER_API_KEY`, `SUPABASE_SERVICE_KEY` al cliente.
- NO saltar RLS con service role en endpoints públicos sin verificar `is_admin()`.
- NO escribir archivos al repo desde este pipeline (diferencia con meetings: aquí todo va a Supabase).
- NO hacer copy/paste del avatar o playbook dentro de prompts hardcoded — usar `brand-context.ts`.
- NO usar `any` en tipados de respuestas de Apify/Gemini. Zod valida, tipo deriva.
- NO mostrar handles con `@` ni URLs en la DB; normalizar en la entrada.
- NO pedirle al user que use terminal. Todo UI.

---

*PRP pendiente aprobación. No se ha modificado código.*
