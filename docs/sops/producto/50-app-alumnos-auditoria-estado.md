---
title: Capital Hub App (alumnos) — Auditoría de estado
order: 50
---

# Capital Hub App (alumnos) — Auditoría de estado

> SOP de contexto cruzado OS↔App. La App (portal del alumno) es un proyecto **separado**
> (`Marco-Codes/App Capital Hub`, repo `marcoapereirav-arch/capital-hub-app`, Supabase propio,
> Vercel propio). Ver [02-arquitectura-os-app.md](02-arquitectura-os-app.md). Este SOP existe
> porque **todo lo que se toca en la App se refleja en el Knowledge del OS** para mantener el
> contexto unificado.

## ✅ Verificación EN VIVO (2026-06-26) — esto MANDA sobre la auditoría de código de abajo

Se entró a la app de producción (`app.capitalhubapp.com`) con la cuenta `test-agent` y se probó cada flujo
de verdad con Playwright (capturas reales, no lectura de código):

- **Funciona:** login · Home · Comunidad (ver, **publicar**, **like**, **comentar**) · Mensajes 1-a-1
  (enviar/recibir) · Formación (abrir clase, **marcar completada → progreso 100%**) · Perfil (editar + guardar
  bio) · Miembros (lista real, 12 personas).
- **En construcción (placeholders, futuro):** Calendario · Leaderboards · Marketplace.
- **No probado:** reproducción de video — todavía no hay ninguna formación con video subido (las lecciones de
  prueba no tienen video).
- **Bug real:** en cada página la llamada a `api/feedback/status` falla por CORS (el preflight OPTIONS no
  devuelve HTTP ok). No rompe la UI pero está roto por detrás. Menor: el contador de comentarios no se
  actualiza en vivo (el comentario sí persiste, se ve al recargar).

### Corrección importante de arquitectura (verificada en vivo)

La app de **producción usa la MISMA Supabase que el OS** (`aglyoyqtzozdnusltjxe`): tanto el login (`auth/v1`)
como la edge function `api` apuntan ahí (visto en las llamadas de red). El `web/.env` local apunta a otro
proyecto (`xkuhkkjeuzxutggbnwed`) que **NO es producción**. Implicación: **las migraciones del repo de la App
(`supabase/migrations`) son legacy (del port capitalhub2.0) y NO son el esquema desplegado.** Por eso los
hallazgos de RLS/seguridad de la auditoría de código de abajo (paywall "burlable", `lessons USING(true)`,
`exam_questions`, etc.) salen de ese esquema legacy y **NO están confirmados en producción** — no asustarse
con ellos. Para evaluar la seguridad real hay que mirar las políticas de la BD del OS (`aglyoyqtzozdnusltjxe`),
no estas migraciones. **SOP 17 (la App comparte Supabase con el OS) es el correcto; SOP 02 queda corregido.**

## Metadatos de la auditoría

- **Fecha:** 2026-06-26
- **Método:** build/typecheck reales (`npm run build` = `tsc -b && vite build`) + 6 auditorías de
  lectura de código en paralelo (auth, formación, marketplace, suscripción/billing, backend/RLS/seguridad, comunidad/admin/wiring).
- **Stack real verificado:** front **Vite + React 19 SPA** (`web/`, React Router 7, framer-motion,
  hls.js, tus-js-client) + backend **una sola Supabase Edge Function `api`** (`supabase/functions/api/` con
  `index.ts` + `handlers/*.ts`) + `_shared/` (auth/router/cors). DB = 5 migraciones.
- **Build:** ✅ compila limpio (1822 módulos, exit 0). Solo warning de tamaño de bundle (perf, no bug).
- **⚠️ CAVEAT CRÍTICO — schema drift:** las **migraciones del repo NO reflejan la BD viva**. Tablas y
  columnas que la app usa de verdad (`student_invites`, `community_posts`, `community_post_reactions`,
  `community_post_comments`, `direct_messages`, `routes.product_key`, `lessons.bunny_video_id`,
  `lessons.bunny_status`, `users.avatar_url/bio/profession`) **no están en ninguna migración** — la BD
  de producción fue parchada a mano. Por eso los hallazgos de RLS/seguridad de abajo son **riesgos a
  verificar contra la BD viva** (con `pg_policies` + `get_advisors`), no hechos confirmados.

## Veredicto general

La App **compila y la mayoría del recorrido del alumno funciona** (auth, navegación de formación,
reproducción HLS, progreso, comunidad/Skool, DMs en realtime). Pero tiene **3 problemas estructurales
graves** que un usuario o el negocio sí sienten: (1) el **paywall de contenido depende solo del
frontend** (RLS posiblemente permisiva → contenido premium burlable), (2) **no hay puente de pago→acceso**
(ni webhook Stripe, ni `provision-user` desde el OS/Whop) y el front **fuerza tier T1 a todos**, y (3)
**schema drift**: el modelo real solo vive en la BD de producción, no en migraciones.

## Estado por módulo

| Módulo | Estado | Resumen |
|---|---|---|
| Build / typecheck | ✅ | Compila limpio. |
| Auth (login/logout/reset) | ⚠️ | Login/logout OK. Reset/confirm dependen de SMTP no configurado (`site_url=localhost`). |
| Onboarding / enrutado por rol | ⚠️ | Funciona para ADMIN/USER; self-signup REP queda en limbo (rol en `user_metadata`, backend lee `app_metadata`). |
| Provisión OS→App (alumno que pagó) | ❌ | `provision-user`/`revoke-access` **no existen**. Único puente: `AcceptInvitePage` → endpoint del OS `student-invite-accept` (no verificable desde este repo). |
| Formación: navegación rutas→formación→módulo→lección | ✅ | Datos reales (Supabase directo). |
| Formación: progreso | ✅ | `user_progress` upsert + RLS owner-only. |
| Formación: vídeo HLS (LessonViewer) | ✅ | hls.js + fallback Safari nativo, cleanup correcto. |
| Formación: subida TUS a Bunny (admin) | ⚠️ | TUS bien; depende de endpoint del OS `bunny-create-video` (POST sin auth del lado cliente — verificar server). |
| Formación: comentarios | ⚠️ | Funcionan (RLS); bug de UI en botón borrar. Handler backend huérfano. |
| Formación: Q&A | ⚠️ | Funciona pero **inalcanzable por navegación** (sin link, solo URL). |
| Formación: AI chat | ❌ | `ChatBubble` **nunca se monta**. UI muerta. Modelo Claude inválido si se montara. |
| Marketplace / bolsa de empleo | ❌ (front) / ✅ (backend) | Front = "Panel en construcción". Backend ~80% (handlers + tablas) pero sin UI. `/rep/*` y `/company/*` redirigen a `/home`. |
| Suscripción / tier gating | ❌ | Front **fuerza `tier='T1'` + `fullFormationAccess:true`** → gating cosmético. Front y backend usan lógicas divergentes (el endpoint `/v1/user/access` está muerto). |
| Pago → activación de tier | ❌ | No hay webhook Stripe (no existe la función). El botón "Suscribirme 44€" crea checkout Stripe real pero **nadie procesa el pago** → cobra sin dar acceso. Whop/OS tampoco escribe tier aquí. |
| Cancelación / revocación | ✅ | `/auth/cancel-subscription` pone tier=null. |
| Comunidad (Skool): feed/posts/comentarios | ✅/⚠️ | Funciona (Supabase directo). Botón borrar fantasma en todos los posts (`isOwn` roto: email vs UUID). |
| Comunidad: DMs | ✅ | **Realtime** (no poll); depende de `direct_messages` en publicación `supabase_realtime` (no versionado). |
| Comunidad: tabs Calendario / Leaderboards | ❌ | "Próximamente" — placeholders sin backend. |
| Admin: editor `/admin/formaciones` | ✅ | Único editor que **persiste** (escribe directo a Supabase, snake_case correcto). Es el que la UI usa. |
| Admin: panel legacy `/admin/routes…` | ❌ | Roto (mismatch camelCase↔snake_case pierde datos en silencio) **pero huérfano** de la UI (solo por URL directa). |
| Wiring / rutas | ✅ | `routes.tsx` coherente, lazy + ErrorBoundary. Bastante **código muerto** (App.tsx, Sidebar, Topbar, TrainingLayout, common/HomePage). |

## Hallazgos P0 (graves) — la mayoría requieren verificar la BD viva

1. **Paywall de contenido posiblemente burlable.** El front lee `lessons`/`modules` **directo** con el
   anon key (`web/src/api/training.ts:305-322`, `select('*')` incluye `video_url`). Según las migraciones,
   `lessons_select_all`/`modules_select_all` usan `USING(true)` (`20260430000004_rls_policies.sql:149-150`)
   → cualquier autenticado podría sacar todos los `video_url` del catálogo desde la consola. El gating real
   (`student_invites.products` / `user_formation_unlocks`) está solo en JS. **Verificar la RLS real de
   `lessons`/`modules` en la BD viva antes de afirmar la fuga.**
2. **Respuestas de examen expuestas.** `exam_questions.correct_answer` con policy `USING(true)`
   (`20260430000004:203`) → cualquier autenticado leería las respuestas de la certificación. Verificar en BD viva.
3. **Hueco de activación de pago.** `billing.ts` crea checkout Stripe pero **no existe `stripe-webhook`**
   (la doc miente). El botón "Suscribirme 44€" (`UpgradePage.tsx:176`) cobra y `SuccessPage` dice "activada",
   pero `subscription_tier` nunca sube. Cobro sin acceso. (Atenuante: el negocio cobra por Whop en el OS, no
   por Stripe; pero el botón sigue vivo y cobrable.)
4. **Front concede T1 a todos.** `web/src/api/subscription.ts:79,84` (`tier ?? 'T1'`, `fullFormationAccess:true`
   hardcodeado). El gating de tier en el front es nulo; el contenido solo está protegido si la RLS del backend
   lo está (ver P0 #1).
5. **Schema drift.** El modelo real (comunidad, `student_invites`, columnas Bunny) **no está en migraciones**.
   Un `db reset` o entorno nuevo rompe la app entera. RLS de esas tablas no auditable desde el repo.

## Hallazgos P1 (serios)

- **Rol en `user_metadata` vs `app_metadata`.** `web/src/api/auth.ts:80-100` mete el rol en `user_metadata`;
  el backend (`_shared/auth.ts` `requireRole`) lee `app_metadata.role`. Self-signups y accept-invite (si el OS
  no setea `app_metadata`) quedan como `USER` para el backend.
- **Provisión OS→App no construida.** `provision-user`/`revoke-access` no existen; `OS_PROVISION_SECRET` está
  preparado en `functions/.env` (gitignored, no fugado) pero ninguna función lo consume.
- **SMTP / `site_url` de producción sin configurar.** `config.toml:45` `site_url=localhost:5173` +
  `additional_redirect_urls=*.vercel.app` (wildcard de redirect = vector de robo de token). Reset/confirm de
  email poco fiables o rotos en el dominio real.
- ~~**Gating de edición de admin solo en UI.**~~ **CERRADO 2026-07-29**: `requireSuperAdmin` para usuarios y
  rutas, `assertAlcance()` por `formacion_asignada` en formaciones/módulos/lecciones, y RLS con alcance real en
  la base (que es lo que de verdad protege, porque el editor escribe directo a Supabase). Ver SOP
  [`producto/55`](55-formador-vs-admin.md).
- **Panel admin legacy rompe creación de contenido** (mismatch camelCase↔snake_case en `admin.ts`, pierde
  `video_url/module_id/...`). Huérfano de la UI pero alcanzable por URL.
- **Marketplace:** falta `UNIQUE(job_offer_id, rep_id)` (aplicaciones duplicadas) y la RPC
  `increment_applicants_count` (referenciada, **no definida** → `applicants_count` siempre 0). Sin gating T1 real
  (`requireMarketplace` nunca se cablea). Hoy mitigado porque la UI es "Coming Soon".

## Hallazgos P2 / deuda / "próximamente"

- AI chat: `ChatBubble` nunca montado + modelo `claude-sonnet-4-6` inválido. Q&A inalcanzable por nav.
- Vídeo recién subido puede no reproducir (no se consulta `bunny_status`). `getCoinBalance` hardcodeado a 999.
- Botón borrar fantasma en posts (`isOwn` compara email vs UUID). Borrar comentario hijo = no-op; anidación a 2 niveles.
- Storage: buckets `formations`/`general`/`avatars` public-read y escritura poco restringida (PDFs premium expuestos por URL).
- CORS `*` (mitigado por `verify_jwt=true`). Errores tragados en pantallas admin (`catch{console.error}`).
- Código muerto: `App.tsx`, `layouts/Sidebar.tsx`, `layouts/Topbar.tsx`, `layouts/TrainingLayout.tsx`, `pages/common/HomePage.tsx`.
- Tabs Skool Calendario y Leaderboards = placeholders "Próximamente". "Cambiar contraseña" en Perfil = stub.

## Qué verificar en la BD viva antes de actuar (sin tocar nada)

Contra el Supabase **de la App** (proyecto propio, no el del OS):
- `SELECT tablename, policyname, qual FROM pg_policies WHERE tablename IN ('lessons','modules','exam_questions','student_invites','routes','community_posts','direct_messages');`
- `get_advisors` (security) para confirmar RLS real vs migraciones.
- Confirmar si `direct_messages` está en la publicación `supabase_realtime`.
- Confirmar si las columnas/ tablas drift existen en todos los entornos.

## Próximos pasos sugeridos (priorizados)

1. **Verificar la RLS viva** de `lessons`/`modules`/`exam_questions` (P0 #1, #2). Si es `USING(true)`, cerrar el
   paywall (policy que joinee acceso, o que el front deje de leer `lessons` directo).
2. **Decidir el modelo de pago→acceso** (P0 #3, #4): el negocio es Whop por el OS → construir el puente
   `provision-user` (App) + rellenar el `// TODO` del webhook Whop (OS), y **quitar el botón Stripe / el T1
   hardcodeado** del front.
3. **Versionar el schema real** en migraciones (P0 #5): dump de la BD viva → migraciones idempotentes, incluida la RLS.
4. P1: unificar fuente de rol (`app_metadata`), SMTP/`site_url` de prod, gating server-side por `formacion_asignada`.
5. Limpieza P2: borrar código muerto, arreglar `isOwn`, montar o borrar `ChatBubble`, enlazar Q&A.

## Notas para cuando se construya (recordatorios de Marco, 2026-06-26)

- **Modelo de negocio HOY:** solo **high ticket**, para generar cash flow hasta el lanzamiento. Las
  suscripciones (mensual/anual) + más llegan en el **futuro**, cuando se active el webinar. NO construir
  suscripciones ahora. (El checkout Stripe del código es legacy, no es el proceso real.)
- **Video de formaciones (Bunny):** hoy NO hay ninguna formación subida. Cuando se empiecen a subir, el
  reproductor de Bunny debe quedar configurado **exactamente igual que el del funnel** (color verde + los
  mismos ajustes). Misma regla en los dos lados — coincide con el brandkit ("reproductores siempre verdes").

## Cambios versionados

- **2026-07-29 (v8):** Tanda de arreglos de raíz sobre la formación y los roles. Todo verificado en producción.
  1. **Nadie podía crear ni guardar una formación, y la pantalla no lo decía.** Cuatro fallos encadenados:
     (a) `requireRole` leía el rol de `app_metadata.role` del JWT y **ningún usuario tiene ese campo**, así que
     TODO `/admin/*` devolvía 403 a todo el mundo (comprobado con `test-agent`, que es ADMIN en BD);
     (b) el CRUD genérico filtraba el body solo por nombres snake_case mientras el panel manda camelCase, así
     que en un alta se caía `route_id` (NOT NULL) y en una edición se perdían campos en silencio;
     (c) las 7 mutaciones del editor hacían `await supabase...()` **sin mirar el error ni las filas afectadas**
     (con RLS, Postgres devuelve 0 filas y `error = null`); (d) `routes` solo tenía policy de SELECT.
     Arreglado: rol desde `public.users`, normalización camelCase, helper `mustWrite` + aviso visible en
     pantalla, y policies de escritura en `routes`.
  2. **Subir vídeo fallaba siempre.** La App llamaba al OS por `ecoai.capitalhubapp.com` (dominio legacy) y ese
     host responde 308. El navegador **no sigue redirecciones en un preflight CORS**, así que la llamada moría
     antes de salir. Centralizado en `lib/os.ts` contra `os.capitalhubapp.com`. Afectaba también a aceptar
     invitación de alumno.
  3. **Formadores tratados como super admin.** Ver SOP [`producto/55`](55-formador-vs-admin.md).
  4. **Suscripción falsa eliminada.** El botón "Suscribirme 44€" creaba una sesión de pago real de Stripe y no
     daba acceso. Era código muerto del port, contradecía el modelo (solo high ticket) y seguía clicable.
     Borrado entero: páginas `/upgrade` y `/subscription/success`, handler de billing, checkout del front y
     catálogo de precios inventado. Los niveles de acceso siguen, que es lo que provisiona el OS tras la venta.
  **Pendiente de esta tanda:** el front fuerza `tier ?? 'T1'` (`api/subscription.ts`) — se dejó como estaba a
  propósito para no dejar sin acceso a alumnos cuyo tier no esté puesto; decidir con Marco.

- **2026-06-26 (v1):** Auditoría inicial completa de la App (build + 6 auditorías de código). Se establece la
  regla de que el estado de la App se refleja en el Knowledge del OS. Caveat de schema drift documentado: los
  hallazgos de RLS/seguridad son riesgos a confirmar contra la BD viva de la App.
- **2026-06-26 (v2):** Aclaraciones de Marco. (a) Modelo HOY = solo high ticket (suscripciones = futuro, con
  webinar) → no construir suscripciones ahora. (b) Regla: las formaciones se suben con la misma config verde de
  Bunny que el funnel. (c) Marketplace, AI chat, Calendario y Leaderboards = futuro, no tocar hasta aviso.
- **2026-06-26 (v3):** Verificación EN VIVO con Playwright + cuenta `test-agent` (sección al inicio del SOP).
  Confirmado que el recorrido del alumno funciona (comunidad, mensajes, formación, perfil, miembros). Bug real:
  `feedback/status` falla por CORS en cada página. Corrección de arquitectura: producción usa la Supabase del
  OS (`aglyoyqtzozdnusltjxe`); las migraciones del repo App son legacy → los hallazgos de seguridad de la
  auditoría de código NO están confirmados en prod. SOP 17 correcto, SOP 02 corregido.
- **2026-06-26 (v4):** Tres bugs de formación arreglados de raíz (reportados por Marco: "el formador no puede
  subir vídeos, no se guarda nada"). **Confirmado en vivo (bundle de `app.capitalhubapp.com`): la App usa
  `aglyoyqtzozdnusltjxe` (Supabase del OS)** — refuerza v3.
  1. **Subida de vídeo (Bunny):** la App sube llamando al endpoint del OS (`POST ecoai…/api/admin/lessons/bunny-create-video`).
     Faltaban `BUNNY_STREAM_API_KEY/LIBRARY_ID/CDN_HOSTNAME` en **Vercel del OS** (estaban solo en `.env.local`).
     Añadidas a Vercel prod + redeploy. Verificado: el endpoint devuelve `videoId` + firma TUS. Regla: toda var de
     `.env.local` debe estar también en Vercel o la feature falla SOLO en prod.
  2. **No se guardaba nada (títulos/descripciones/lecciones/vídeo):** `formations/modules/lessons` solo tenían RLS
     de SELECT. El editor de la App escribe directo con `supabase.from().update()` → RLS lo bloqueaba EN SILENCIO.
     Fix: policies INSERT/UPDATE/DELETE para ADMIN/PROFESSOR (migración `20260626140000_app_content_rls_admin_write.sql`),
     aplicadas en vivo a `aglyoyqtzozdnusltjxe` + verificadas por impersonación (admin escribe, no-admin bloqueado).
  3. **Comentarios de alumno:** ya funcionaban (`lesson_comments_insert_self` existe). Confirmado.
- **2026-06-26 (v5):** Más fixes (sesión paralela a la v4 — otra ventana de Marco). Verificados en prod con Playwright + `test-agent`.
  1. **"Completar lección" no se notaba / no se guardaba bien:** `completeLesson` (App `web/src/api/training.ts`)
     guardaba `completed_at` pero nunca `completed=true` y **se tragaba el error** del upsert → al recargar volvía a 0.
     Los checks/barras eran blancos (tailwind App `accent:#FFFFFF`, sin verde). Fix: `completed=true` + lanzar el
     error; checks, etiqueta "Completada" y barras de progreso en **VERDE** (`#22C55E`/`green-400`) en LessonViewer,
     FormationDetailPage y tarjetas (SkoolClassroomTab). Backfill de filas viejas. Commit App `adba166`.
  2. **Círculo decorativo confuso** a la derecha de cada lección (siempre vacío, contradecía al check verde) → eliminado. Commit `466ccef`.
  3. **Comunidad por formación (seguridad — "extremadamente importante" para Marco):** RLS de aislamiento. Función
     `public.user_can_see_community(c_id)` (admin=todas; alumno=las de sus `student_invites.products`, mapeo
     `product_key = lower(replace(producto,' ','_'))`). `community_posts/reactions/comments` SELECT solo de comunidades
     propias; `posts INSERT` exige comunidad propia. Aplicado en vivo a `aglyoyqtzozdnusltjxe` y **verificado por
     simulación** (REP solo ve su comunidad; post de prueba en otra comunidad NO lo ve; admin ve todas). Front: el
     selector muestra solo las comunidades propias (commit App `d040449`). Antes el filtro era solo cliente (bypasseable).
  **Coordinación:** dos sesiones de Marco editando el mismo repo App + este Knowledge a la vez (v4 y v5). Sin choque de
  git por ahora; cuidado con migraciones RLS concurrentes sobre la misma BD.
  **Pendiente de esta tanda:** notificación al formador al comentar (con /add-mobile) + bug `feedback/status` (CORS en cada página).
- **2026-06-26 (v6):** Notificación al formador cuando comentan — **parte 1/2 (el corazón, hecha y verificada)**.
  Mapeo formador↔formación: `users.formacion_asignada` guarda el **slug de la comunidad** (ej. `"media-buyer-digital"`),
  que equivale a `replace(route.product_key,'_','-')` y a `communities.slug`. Dos triggers `AFTER INSERT`
  (`notify_formador_on_community_comment` sobre `community_post_comments`; `notify_formador_on_lesson_comment` sobre
  `lesson_comments`) insertan una fila en `notifications` para el/los formador(es) de esa comunidad/formación (no
  auto-notifican si el propio formador comenta). Aplicados en vivo a `aglyoyqtzozdnusltjxe` + **verificado** (comentario
  de prueba en lección 2 → notificación creada para Juan Pablo, formador de Media Buyer; limpiado). Hoy hay formador solo
  para Media Buyer (Juan Pablo) y Comercial Closing (nagaigobantesq); IA Integrator no tiene formador asignado (nadie recibe).
  **Parte 2/2 pendiente:** entrega push al dispositivo (PWA service worker en la App + subscribe + envío web-push). La App
  aún NO tiene service worker (solo manifest+iconos). `push_subscriptions`/`notifications` y las VAPID keys YA existen (OS).
  El `/add-mobile` es plantilla Next.js → hay que adaptarlo a Vite + edge functions (Deno) o reusar el sender del OS.
- **2026-07-02 (v7):** Arreglado el bug `feedback/status` (CORS en cada página) — y de paso un bug MAYOR: **toda la
  edge function `api` daba 404**. Dos causas que se tapaban mutuamente:
  1. `[functions.api] verify_jwt = true` → el gateway de Supabase rechazaba el preflight OPTIONS (que el navegador
     manda SIN Authorization) con 401 → CORS fallaba cross-origin. Fix: `verify_jwt = false`. La auth NO se pierde:
     cada handler llama `requireUser`/`requireRole` (verificado: sin token = 401).
  2. `stripPrefix: '/functions/v1/api'` pero Supabase entrega a la función la ruta como `/api/...` → no recortaba →
     TODAS las rutas 404 (lo tapaba el CORS del punto 1). Fix: `stripPrefix: '/api'`. Verificado: `/feedback/status`
     autenticado = 200, sin token = 401. Commit App `55fe029`. **Redeploy de la edge `api` a `aglyoyqtzozdnusltjxe`
     vía `supabase functions deploy` (las edge functions NO se despliegan por Vercel; requieren el CLI + access token).**
     Efecto: ahora TODA la API de la App (feedback, qa, chat, billing, etc.) es alcanzable. El popup de feedback ahora
     funciona (aparece si `required=true`) — si no se quiere, es decisión de producto aparte.
  **⚠️ Concurrencia confirmada (2026-07-02):** dos sesiones de Marco trabajando en el repo App a la vez. La otra sesión
  tenía WIP **sin commitear** (feature "resources": `web/src/api/resources.ts`, `web/src/features/`, migración
  `20260702120000_resources.sql`, `AdminFormacionDetailPage.tsx` modificado). Yo commiteo solo por archivo (`git add`
  específico), nunca `-A`, para no barrer su trabajo. **Regla:** con dos sesiones en el mismo repo, `git add` específico
  + `pull --rebase` antes de push, y evitar tocar los mismos archivos.
  **Pendiente:** notif push al dispositivo (parte 2/2) — pausada a propósito para no colisionar con el WIP de la otra sesión.
