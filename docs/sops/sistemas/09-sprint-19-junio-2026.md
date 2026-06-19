# SOP 09 — Sprint 19 junio 2026

Documento canónico del trabajo completado el 18-19 junio 2026 antes de dar acceso al equipo y empezar a meter ventas reales.

## Lo que ahora SÍ funciona en producción

### 🎬 Bunny Stream — vídeos sin límite de tamaño
- Endpoint OS `/api/admin/lessons/bunny-create-video` crea entry en Bunny library + firma TUS SHA256(libraryId + apiKey + expirationTime + videoId) con vencimiento 24h.
- App usa `tus-js-client` (dynamic import ~30kb gzip) para subir directo del browser al CDN `vz-6b29b2f5-059.b-cdn.net`.
- Chunks de 50MB con 6 reintentos exponenciales (0/3/5/10/20/60s) y reanudación automática si se corta la conexión.
- Límite real = límite de Bunny (50 GB por vídeo).
- Drag&drop en `AdminFormacionDetailPage` → "Editar lección" + `AdminLessonsPage` legacy.
- Reproductor `HlsPlayer` en `LessonViewer.tsx` con `hls.js` (Safari usa HLS nativo, resto via JS).
- Lecciones con `bunny_video_id` se reproducen sin marca terceros.
- Fallback `videoUrl` sigue funcionando para YouTube/Vimeo/Loom/Drive (formaciones legacy).

### ✉️ Editor visual de emails — sin texto hardcoded
- Tab Plantillas en `/email-marketing` con los 21 templates del sistema.
- Editor: iframe con `body.contentEditable=true` sobre el HTML rendered del template React.
- Click directo sobre cualquier texto del email → escribes → guardar → próximo email enviado usa tu copy.
- Sin redeploy: el override vive en tabla `email_template_overrides` (RLS solo super_admin).
- Toolbar B/I/U + chips clickables de variables que insertan en la posición del cursor.
- `sendEmail()` chequea override por `template_key` y sustituye placeholders con las vars del sender.
- "Volver al original" borra el override y vuelve al HTML del .tsx (fallback).

### 🛡️ Matriz de permisos por rol — editable desde /team
- Tabla BD `role_permissions(role, route_href)` con RLS authenticated SELECT + super_admin ALL.
- Seed con valores de `ROLE_ROUTES` hardcoded como base.
- Endpoint `/api/admin/role-permissions` GET (catálogo + estado actual) y PUT (toggle individual).
- UI matriz en `/team` agrupada por Operaciones / Marketing / Producto, filas = secciones del nav, columnas = roles.
- Click checkbox → optimistic update + PUT inmediato + rollback si la API falla.
- `role-access.ts` con cache module-level `cachedRolePerms` hidratado en cada request del layout server component + middleware proxy.
- Si BD falla → fallback automático a `ROLE_ROUTES` hardcoded (sistema nunca queda bloqueado).
- super_admin no aparece en la matriz (siempre acceso total).

### 🐛 4 bugs raíz del flow venta-activación
Documentados en detalle en `docs/sops/ventas/03-flow-venta-invitacion-activacion-bugs.md`.

1. Emails no llegaban: race condition serverless. Fix `await Promise.allSettled([sendWelcome, notifyMarco])` + devolver `email_sent` en la respuesta.
2. "Invitación no encontrada" tras delete+readd: unique index bloqueaba el segundo INSERT silencioso. Fix: INVALIDAR pendientes antes del INSERT + chequear `inviteInsertError` explícito.
3. DELETE contacto no era cascade: cleanup explícito → student_invites + journey_events + Storage avatars.
4. "Ya fue usada" tras activar OK: `AcceptInvitePage.tsx` evaluaba `!info.valid` antes que `success`. Fix: orden de `if`.

### 🎨 Diseño y operación
- LoadingScreen brandkit (anillo monochrome + monogram CH pulsante) reemplazó `<Loader2 spin />` + textos "Cargando..." en ProtectedRoute, RootRedirect, Onboarding, Skool*, LessonViewer, FormationDetail, PerfilPublico + 7 páginas admin.
- Logo CH rounded sincronizado entre OS y App (icon.svg con rx=120). 9 PNGs regenerados con `sharp` para PWA install. Apple-touch + favicons rounded.
- PWA App completa (manifest.json + meta tags + apple-mobile-web-app-title). El OS ya tenía PWA.
- 404 brandkit dark (#0F0F12) con wordmark fino + 2 botones.
- HomePage menú "Mi perfil" ahora navega a `/skool` con `state.goToTab="profile"` (antes daba 404).
- Skool Comunidad con pills filtros: Ver todo / General / Wins / Preguntas.
- Skool Miembros ahora hace `Promise.all(users + profiles)` y dedupa por email — los alumnos ven al equipo OS.
- Onboarding sin campo "Profesión actual" — solo avatar + nombre + bio.

### 🧹 Coherencia BD
- Dashboard `main-dashboard.tsx` filtra `.not("contact_id", "is", null)` en ambas queries student_invites del periodo.
- RLS policy "Authenticated can view team profiles" en `public.profiles` (rol del equipo OS).
- DELETE contacto ahora hace cascade explícito: student_invites + journey_events + avatars/{auth_user_id}/.
- BD limpia: borré 1 student_invite huérfano del smoke test antiguo.

### 📧 Notif venta
- `notifyMarcoPurchase()` ahora `Promise.allSettled([sendEmail(...marco), sendEmail(...adrian)])`. Templates con tag `_marco`/`_adrian` en email_logs para trazabilidad.

## Lo que falta antes de meter ventas reales

Estas tareas viven en la tabla `tasks` del OS, status='next':

- 🧪 Probar flow venta REAL con Gmail/Outlook personal — Playwright headless NO testea deliverability.
- ✍️ Welcome alumno email copy v2 — Marco/Adrián abren `/email-marketing` → Plantillas → editan.
- 🔁 Tests Playwright e2e nocturnos del flow venta — previene los 4 bugs raíz de hoy.
- 📷 Compresión imágenes al subir avatar — `someday`, no bloquea ventas.

## Stack y dependencias añadidas este sprint
- `hls.js` (App) — reproductor Bunny HLS.
- `tus-js-client` (App) — upload directo a Bunny.
- `sharp` (OS, devDep temporal) — regeneración PNG iconos rounded.
- Tabla `email_template_overrides`.
- Tabla `role_permissions`.

---

Documento generado al cerrar el sprint del 19-jun-2026.
