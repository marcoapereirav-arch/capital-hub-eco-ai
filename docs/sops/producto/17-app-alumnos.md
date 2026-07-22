---
title: App alumnos · plataforma de aprendizaje
order: 17
area: producto
---

# App alumnos — la plataforma que ve el alumno tras comprar

## URL
`https://app.capitalhubapp.com`

## Stack
React + Vite (separado del OS Next.js). Vive en repo `App Capital Hub/web/`.

## Auth — comparten Supabase con el OS

Misma base de datos `auth.users`. Eso permite:
- Marco y Adrián entran a la App con sus credenciales del OS
- Cuando un alumno activa su cuenta tras compra, queda en la MISMA `auth.users` que toda la organización
- Los emails son únicos cross-app

### Roles
- `ADMIN` — Marco y Adrián (acceso total a todo en la App)
- `REP` — alumnos comprados via student_invites (acceso a su formación + comunidad)
- `COMPANY`, `PROFESSOR`, `USER` — legacy, sin uso activo

El rol se guarda en `auth.users.raw_user_meta_data.role`. El front lo lee al login.

## Flujo del alumno desde cero

### 1. Compra registrada en OS
Closer rellena widget "Registrar venta" → sistema genera token + email magic link.

### 2. Email magic link
Llega al alumno con asunto brandeado y botón "Activar mi acceso". URL del botón:
```
https://app.capitalhubapp.com/accept-invite/<token>
```

### 3. Aterriza en `/accept-invite/<token>`
La página llama al endpoint del OS para validar token. Si OK, muestra:
- Su email
- Su nombre
- Su producto comprado (badge verde)
- Form para definir password (mín 8 chars)

### 4. Submit form
- Llama POST al OS endpoint
- OS crea usuario en `auth.users` con email + password + role REP
- OS crea row en `public.users` (perfil App) con first_name + last_name + contact_id (link al CRM)
- OS marca invitación como aceptada
- App hace auto-login con email + password
- Redirige a `/onboarding`

### 5. Onboarding (estructura existente, contenido base)
Pantallas:
- Sube foto perfil
- Confirma nombre + cuenta una bio
- (Futuro) elige avatar de la comunidad

### 6. Llega al Home (`/home`)
Panel principal con 3 grandes cards:
- **Gestionar Formaciones** (solo si ADMIN)
- **Marketplace** (bolsa de trabajo — pendiente activar)
- **Formación** → catálogo de su producto

## Catálogo / Training

Estructura jerárquica (igual que en `/contenido` del OS, leen las mismas tablas):
```
Routes → Formations → Modules → Lessons
```

El alumno solo ve las routes de productos que compró. Eso se controla via `user_formation_unlocks` o filtrando por `routes.product_key` matcheando `student_invites.products`.

Cada lección reproduce:
- Vídeo embebido según provider (Loom, YouTube, Drive, Mux, etc)
- Descripción markdown
- Lista de adjuntos descargables

### Bloqueo progresivo
La lección N+1 se desbloquea SOLO si el alumno marca N como completada. Tracking en `public.user_progress`.

### Q&A por formación
Cada formación tiene su tab de preguntas. Alumno postea pregunta → otros alumnos o profe responden. Tabla `formation_questions` + `formation_question_replies`.

## Comunidad estilo Skool

Tabla `communities` + `community_messages`.

- 1 comunidad por producto (IA, MBD, CC)
- Alumno solo ve la comunidad de SU producto
- Feed con posts: título + descripción + adjunto opcional
- Categorías: wins / soporte / general
- (Pendiente UI) reacciones + comentarios anidados

## Chat directo 1-a-1 (pendiente)
Estructura BD existe parcial. UI no construida aún. Idea: alumno puede iniciar chat directo con otro alumno del mismo producto.

## Bolsa de trabajo / Marketplace
- Empresas crean ofertas (`job_offers`)
- Alumnos aplican (`job_applications`)
- Cada alumno con perfil REP profesional (`rep_profiles`)
- No es MVP webinar 8/8 pero el código está

## Admin panel (`/admin`)
Solo role ADMIN. Permite:
- CRUD de usuarios
- CRUD de training (alternativo al gestor OS, hace lo mismo)
- Gestión de empresas / ofertas
- Métricas

## Tablas BD que usa
- `auth.users` (sistema, compartido con OS)
- `public.users` (perfil alumno: first/last_name, role, contact_id, coin_balance, subscription_tier)
- `routes`, `formations`, `modules`, `lessons` (catálogo, leídas también del OS)
- `user_progress` (qué lecciones completó cada alumno)
- `user_formation_unlocks` (qué formaciones tiene desbloqueadas)
- `user_certifications` (certificados conseguidos)
- `user_streaks` (racha de días seguidos consumiendo)
- `communities`, `community_messages` (feed)
- `formation_questions`, `formation_question_replies` (Q&A)
- `companies`, `job_offers`, `job_applications`, `rep_profiles` (marketplace)
- `student_invites` (validación token de activación)

## Endpoints externos
- POST/GET `https://os.capitalhubapp.com/api/auth/student-invite-accept` (validación + activación)
- (Pendiente) endpoint del catálogo filtrado por unlocks

## Variables de entorno (Vercel)
- `VITE_SUPABASE_URL` (apunta a OS BD: aglyoyqtzozdnusltjxe)
- `VITE_SUPABASE_ANON_KEY`

## Vercel project
- Nombre: `capital-hub-app`
- Team: adrianvillanuevarios-cmds-projects
- Dominio: `app.capitalhubapp.com` (DNS configurado y verificado)
- Framework: Vite

## Reglas operativas
- **NO modificar `auth.users.raw_user_meta_data` directamente sin actualizar también el rol en `public.users`.** Pueden quedar desincronizados.
- **El token de student_invites es de un solo uso.** Tras activación, intentar reusarlo devuelve 409.
- **Cache del navegador del alumno puede mostrar versión vieja.** Tras un deploy, advertir hard refresh.
- **Endpoint backend Java legacy ya no existe.** Cualquier llamada a `/api/v1/...` fallará. Solo se usan endpoints Supabase y endpoints del OS.

## Estado actual
- ✅ Login operativo
- ✅ HomePage renderiza para ADMIN
- ✅ AcceptInvite page operativa
- ✅ SPA routing configurado (vercel.json rewrites)
- 🟡 Catálogo: estructura existe, lógica de bloqueo por producto pendiente
- 🟡 Comunidad: estructura existe, UI básica
- 🔴 Chat 1-a-1: pendiente

## Verificación
- `https://app.capitalhubapp.com` debe abrir login
- Login con email + password debe ir a `/home`
- HomePage debe mostrar "Bienvenido, {email}" + badge según rol
