---
title: Perfil de usuario + cambio de email seguro
order: 49
area: producto
---

# Perfil de usuario + edición de equipo + cambio de email seguro

Pantalla de configuración personal y edición de miembros del equipo. Lo clave: el **cambio de email** es un flujo de confirmación seguro que **no toca el esquema de BD**.

## Pantalla de Perfil — `/perfil`

- Ruta: `src/app/(main)/perfil/page.tsx` (server) → `src/features/profile/components/profile-page.tsx` (cliente).
- 3 bloques: **Nombre**, **Email**, **Contraseña**. (Foto: fuera por ahora — decisión de Marco 2026-06-26, no se toca Supabase Storage.)
- Acceso: el item **"Perfil"** del menú de usuario (sidebar, abajo-izquierda) y el **avatar del header móvil** llevan a `/perfil`. Antes "Perfil" no navegaba a nada.
- Endpoints propios:
  - `PATCH /api/me` → cambia el `full_name` propio (profiles + `user_metadata.full_name`).
  - `POST /api/me/password` → `supabase.auth.updateUser({ password })` + aviso por Resend (`sendPasswordChanged`).
  - `POST /api/auth/change-email/request` → inicia el cambio de email (ver abajo).

## Editar miembros del equipo — `/team`

- Botón ✏️ por miembro → modal `EditMemberModal`:
  - **Nombre** → `PATCH /api/admin/team/[id] { full_name }` (directo, ya existía).
  - **Email** → `POST /api/admin/team/[id]/email { newEmail }` → mismo flujo seguro (confirmación al email nuevo). Solo `super_admin`.
- Esto arregla los nombres derivados del email (p.ej. `Marcoapereirav`, `Adrianvillanuevarios`) cuando el perfil no tenía `full_name`.

## 🔐 Cambio de email — JWT firmado, SIN cambios de esquema

**Por qué así:** `auth_tokens.type` tiene un CHECK `in ('password_reset','email_confirmation','invitation','magic_link')` — no incluye `email_change` — y la BD vive en la cuenta de Adrián. **No** añadimos un tipo ni una tabla. El token es un **JWT HS256** firmado con `SUPABASE_SERVICE_ROLE_KEY` (server-only):

- Firmado → no se puede falsificar.
- `exp` 24h → caduca solo.
- Lleva `oldEmail` → si el email actual ya cambió, el enlace deja de valer (anti-replay sin persistencia).
- La confirmación llega **siempre al email NUEVO** (prueba de que el dueño lo controla).

**Flujo:**
1. `requestEmailChange(userId, oldEmail, newEmail)` (`src/features/auth/services/email-change.ts`): valida, comprueba que el email no esté en uso, firma el JWT, envía el correo (`renderEmailChangeEmail` + Resend) a `newEmail` con link a `/auth/confirm-email-change?token=...`.
2. El usuario abre el link → `src/app/auth/confirm-email-change/page.tsx` hace `POST /api/auth/change-email/confirm { token }`.
3. `confirmEmailChange(token)`: verifica el JWT, comprueba que el email actual sigue siendo `oldEmail`, y aplica `admin.updateUserById(userId, { email, email_confirm: true })` + mirrors `profiles.email` y `users.email` (App).

**Regla:** ningún email de auth sale por Supabase SMTP (BYOE) — todo por Resend. El cambio de email no es excepción.

## Cambios versionados

- **2026-06-26** (v1): creado. Pantalla `/perfil` (nombre/email/contraseña), edición de miembros en `/team` (nombre + email), y cambio de email seguro vía JWT firmado sin alterar el esquema de `auth_tokens`. Disparador: Marco — el menú "Perfil" no llevaba a nada y los nombres de Marco/Adrián salían derivados del email por falta de `full_name`. Foto de perfil pospuesta (sin tocar Storage).
