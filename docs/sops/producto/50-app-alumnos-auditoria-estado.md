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
- **Gating de edición de admin solo en UI.** `handlers/admin.ts` solo hace `requireRole(['ADMIN'])`, no respeta
  `formacion_asignada` → un formador podría editar rutas ajenas por API. El scoping vive solo en la UI.
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

- **2026-06-26 (v1):** Auditoría inicial completa de la App (build + 6 auditorías de código). Se establece la
  regla de que el estado de la App se refleja en el Knowledge del OS. Caveat de schema drift documentado: los
  hallazgos de RLS/seguridad son riesgos a confirmar contra la BD viva de la App.
- **2026-06-26 (v2):** Aclaraciones de Marco. (a) Modelo HOY = solo high ticket (suscripciones = futuro, con
  webinar) → no construir suscripciones ahora. (b) Regla: las formaciones se suben con la misma config verde de
  Bunny que el funnel. (c) Marketplace, AI chat, Calendario y Leaderboards = futuro, no tocar hasta aviso.
