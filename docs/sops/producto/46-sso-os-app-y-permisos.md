---
title: SSO OS↔App + permisos por rol en la App
order: 46
area: producto
---

# SSO OS↔App + permisos por rol en la App

> Decisión arquitectónica Marco 2026-06-18. Implementado y verificado.

## Visión global

OS y App comparten la **misma instancia Supabase Auth** (`auth.users`). Un user con cuenta del OS tiene la misma sesión activa cuando navega a `app.capitalhubapp.com` (basta con clicar "Ir a la App" desde el sidebar del OS).

## Mapeo de roles OS → App

| Rol OS | Rol App (`auth.users.user_metadata.role` + `public.users.role`) | Qué puede hacer en la App |
|---|---|---|
| `super_admin` / `admin` | `ADMIN` sin `formacion_asignada` | Edita TODO el catálogo + comunidades + Q&A + alumnos |
| `formador` | `ADMIN` con `formacion_asignada` ∈ {`ia-integrator`, `media-buyer-digital`, `comercial-closing`} | Edita SOLO la ruta asignada + ve todo lo demás |
| `marketing` | `USER` | Ve todo (catálogo, comunidades, alumnos) en read-only |
| `closer` | `USER` | Ve todo en read-only |
| `setter` | `USER` | Ve todo en read-only |

**Alumnos** (no equipo): role `REP` o `COMPANY` según producto. Visibilidad bloqueada por su producto comprado.

## Cómo se propaga el rol

Cuando el OS crea un miembro de equipo (`POST /api/admin/team`):

1. `supabase.auth.admin.createUser` con `user_metadata: { role: appRole, full_name }` — esto siembra el rol App
2. UPSERT en `public.profiles` (tabla OS) con `role` original + `formacion_asignada`
3. Trigger BD `handle_new_auth_user` crea row en `public.users` con `role` del metadata
4. Si es formador, UPDATE explícito `public.users.formacion_asignada` (porque el trigger no lo conoce)

Defensa en profundidad: `POST /api/auth/accept-invite` también propaga el `user_metadata.role` por si el primer paso falló por race conditions.

## Cómo la App lee y aplica el rol

### Session
`web/src/utils/session.ts` → `userToSession()`
- Lee `user_metadata.role` (fallback `app_metadata.role`, fallback `'USER'`)
- Lee `user_metadata.formacion_asignada` (puede ser null)

### Rutas
`web/src/routes.tsx` + `web/src/components/ProtectedRoute.tsx`
- `USER` está incluido en `allowedRoles` de: `/home`, `/skool`, `/training`, `/community`, `/marketplace`, `/onboarding`, `/upgrade`, `/perfil/:id`
- `/admin/*` y `/admin/formaciones/*` restringidos a `ADMIN` únicamente
- `isStaff = role === 'ADMIN' || role === 'USER'` bypasa tier check (USER no necesita comprar nada)

### Componentes que editan
`web/src/hooks/useCanEdit.ts` (NUEVO)
- `canEdit` (global) = `ADMIN` sin `formacion_asignada` (= super_admin)
- `canEditFormacion(slug)` = `ADMIN` sin restricción, O `ADMIN` cuya `formacion_asignada === slug`
- `isReadOnly` = `role === 'USER'` (equipo OS)

Los componentes admin deben usar este hook para esconder botones edit cuando el caller es `USER` o cuando el formador intenta editar una ruta que no le toca.

## Tablas BD relevantes

| Tabla | Columna nueva | Uso |
|---|---|---|
| `public.profiles` (OS) | `formacion_asignada text` | Constraint check {ia-integrator, media-buyer-digital, comercial-closing, NULL} |
| `public.users` (App) | `formacion_asignada text` | Mismo constraint; replicado por endpoint /team |
| `public.users` (App) | `profession text` | Onboarding del alumno |

Migraciones:
- `20260618110000_formacion_asignada.sql`
- `20260618130000_users_profession.sql`

## Reglas operativas críticas

1. **Cambiar rol en `/team` cambia AMBOS lados.** El endpoint PATCH `/api/admin/team/[id]` solo actualiza `profiles.role` (OS). Para sincronizar el rol App hay que tocar también `auth.users.user_metadata.role` y `public.users.role`. **PENDIENTE:** ampliar el PATCH para hacer la propagación. Por ahora solo el invite inicial lo hace.

2. **Cambiar `formacion_asignada` requiere doble UPDATE.** No basta con `profiles`, también `users`.

3. **Para reactivar al staff que se ha cambiado de rol**, lo más seguro es revocar la sesión: `supabase.auth.admin.signOut(user_id)` para que recargue el JWT con el nuevo metadata.

## Histórico

- **2026-06-18 08:00:** Marco reporta que él entra a la App pero Patric (marketing) no. Diagnóstico: el endpoint /team no seteaba user_metadata.role.
- **2026-06-18 08:15:** Migración `formacion_asignada` aplicada en BD.
- **2026-06-18 08:30:** Endpoint /team POST refactorizado con mapeo OS→App + UPSERT profile + UPDATE users.formacion_asignada.
- **2026-06-18 08:35:** Endpoint accept-invite con defensa en profundidad.
- **2026-06-18 08:40:** App routes/ProtectedRoute/useCanEdit con USER bypass tier + lista expandida de allowedRoles.
- **2026-06-18 08:55:** Patric fix manual via Admin API (user_metadata.role=USER) para desbloquearlo en producción mientras se deployaba el fix permanente.
- **2026-06-20 — ⚠️ CORRECCIÓN AL PREMISA DE ESTE SOP:** la afirmación "OS y App comparten la misma instancia Supabase Auth" (sección Visión global) **NO se cumple en la realidad**. Verificado empíricamente: **son dos proyectos Supabase DISTINTOS** → OS `aglyoyqtzozdnusltjxe`, App `xkuhkkjeuzxutggbnwed`. Tienen `auth.users` separados. Por tanto un usuario creado en el OS **NO existe automáticamente en la App**. Adrián (super_admin del OS) **no existía** en la Supabase de la App → no podía iniciar sesión ni resetear contraseña (no había usuario que resetear). **Acción:** provisionado a mano vía Admin API de la App (`admin.createUser`, email confirmado, `app_metadata.role=ADMIN`, contraseña temporal). Login verificado OK. **Pendiente real para cumplir "mismo usuario exacto":** o (a) bridge magic-link OS→App (Edge Function `magic-link-for-staff`, bloqueada en Adrián), o (b) que `/api/admin/team` provisione SIEMPRE en la Supabase de la App (verificar si hoy lo hace — el trigger `handle_new_auth_user` vive en el proyecto App, no puede dispararse desde el proyecto OS). La App **no** tiene tabla `public.profiles` (usa metadata + `public.users`).
- **2026-06-20 — Bugs de "olvidé contraseña" en la App** (repo `capital-hub-app`, commit `7e9abfb`): (1) botón sin `onClick` → muerto; (2) rutas `/forgot-password` y `/reset-password` no existían en el router; (3) `ResetPasswordPage` exigía `?token=` pero Supabase usa hash de recovery. Los 3 arreglados. **Requiere deploy de la App** para quedar vivo (el login con contraseña ya funciona sin deploy).
