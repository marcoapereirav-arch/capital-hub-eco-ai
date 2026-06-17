---
title: Flow de invitación al equipo (auth interno OS)
order: 42
area: producto
---

# Cómo se invita a un miembro al OS

## Resumen en 1 párrafo

Marco (super_admin) entra a `/team` → click "Invitar miembro" → modal con email + nombre + rol. El sistema crea user en Supabase Auth (sin password aún), genera token único de invitación, envía email vía Resend con link `/accept-invite/<token>`. El invitado clica → pone su contraseña 2 veces → entra al OS con sesión y rol asignado.

## Flujo paso a paso

```
1. /team → "Invitar miembro"
   POST /api/admin/team
   - Valida que el caller es super_admin
   - Verifica que el email no exista ya en profiles
   - admin.auth.admin.createUser({ email, email_confirm: true })
     ⚠️ email_confirm=true para que Supabase NO mande email
   - UPDATE profiles SET role, full_name, invited_by, invited_at, active=false
   - Genera token 32-byte hex
   - INSERT team_invitations (token, expires_at +7d)
   - sendTeamInvite() via Resend con acceptUrl = baseUrl/accept-invite/<token>

2. Invitado recibe email
   From: adrian@mail.capitalhubapp.com
   Subject: "Te invitaron a Capital Hub OS" (template TeamInvite)
   CTA: botón "Aceptar invitación" → /accept-invite/<token>

3. /accept-invite/<token> público
   - Página AcceptInvitePage muestra: nombre + rol asignado + form contraseña
   - Form pide contraseña dos veces (validación cliente)
   - POST /api/auth/accept-invite { token, password }
     - Busca team_invitation por token
     - Valida no aceptada, no caducada, user_id existe
     - admin.auth.admin.updateUserById(user_id, { password })
     - UPDATE profiles SET active=true
     - UPDATE team_invitations SET accepted_at=now()

4. Redirect a /welcome (confetti)
   /welcome es pública, muestra "Bienvenido a Capital Hub OS"
   Botón "Entrar al dashboard" → /login

5. /login con email + password recién creada
   - Server action login() valida → sesión Supabase activa
   - Layout principal lee profile.role
   - Sidebar y proxy aplican gate de roles (ver SOP 41)
```

## Componentes implicados

### Backend
- `POST /api/admin/team` — crea invitación
- `POST /api/auth/accept-invite` — acepta y activa cuenta
- `GET /api/admin/team` — lista miembros + pendientes

### Frontend
- `src/features/team/components/team-page.tsx` — listado + modal invitar
- `src/features/team/components/accept-invite-page.tsx` — form contraseña

### Email
- `src/lib/email/senders.tsx` → `sendTeamInvite()`
- `src/lib/email/templates/team-invite.tsx` — template Resend

### BD
- `team_invitations` — token + expires_at + accepted_at
- `profiles` — role + active + invited_by

## 🚨 Reglas críticas

1. **Solo super_admin puede invitar.** Cualquier otro rol → 403.
2. **El email NO lo manda Supabase.** Siempre vía Resend (cuando se migre a Custom SMTP toda la auth lo hará así también).
3. **Sin invitación no hay cuenta.** `/signup` está eliminado del OS. Comprobar que NO se reintroduzca.
4. **Magic link caduca a 7d.** Si caduca, super_admin debe re-invitar.

## Mismas credenciales en OS y App — qué falta

Hoy, la cuenta creada en OS solo funciona en OS. Para que sirva también en `app.capitalhubapp.com` se necesita el sistema "Magic Link Bridge" (Edge Function en la App que provisione el user al recibir email + secret). Documentado en `30-automatizaciones-estado.md` y en una tarea urgent en BD asignada a Adrián.

## Bugs conocidos / casos edge

- **Reenviar invitación:** ahora mismo solo hay endpoint `/api/admin/invites/[id]/resend` para invitaciones de alumno (App), NO para invitaciones de equipo. Si Marco lo necesita, crear endpoint análogo `/api/admin/team/[id]/resend`.
- **Cambiar rol post-invitación:** sí se puede vía UI `/team` con el dropdown. UPDATE en `profiles.role` directo.
- **Borrar miembro:** botón papelera en `/team`. Borra `profiles` row (auth.users sigue existiendo, hay que limpiar manualmente si se quiere borrar la cuenta auth también).

## Decisiones tomadas

- **2026-06-15:** Email del invitado vía Resend, no Supabase SMTP propio (escalabilidad).
- **2026-06-16:** Eliminado `/signup`. Solo invitación.
- **2026-06-17:** UpdatePassword pide contraseña 2 veces con validación cliente.
- **2026-06-17:** Tras aceptar invitación → redirect a `/welcome` (confetti), no directo al login.
