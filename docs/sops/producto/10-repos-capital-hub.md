---
title: Repos Capital Hub - OS vs App
order: 10
---

# Los DOS repos de Capital Hub — REGLA DE ORO

> **NUNCA confundir entre los dos repos. Si hay duda, preguntar al humano.**

Capital Hub está compuesto por **dos productos software separados** con dos repos, dos despliegues, dos roles distintos.

---

## Repo 1: Capital Hub OS (este repo)

| Campo | Valor |
|---|---|
| Carpeta local | `/Users/marcoantonio/Marco-Codes/Capital Hub/` |
| GitHub | `marcoapereirav-arch/capital-hub-eco-ai` |
| Vercel project | `capital-hub-eco-ai` (team `adrianvillanuevarios-cmds-projects`) |
| Dominio | `os.capitalhubapp.com` |
| Stack | Next.js 16 + React 19 + Supabase + Resend |
| Para quién | **Equipo interno** (Marco, Adrián, closers, formadores) |

**Qué contiene (sistema operativo del negocio):**
- Dashboard de operaciones (foco 8/8 + general)
- Contactos (CRM estilo GoHighLevel) + Pipelines kanban
- Calendario propio (reemplaza Calendly)

- Webs + Lead Magnets + Ads + Content Intel + Instagram + ManyChat
- Tareas + Proyectos + Áreas + Foco + Board (sistema PARA + GTD)
- Email Marketing (templates, broadcasts, logs, métricas)
- Equipo (auth, invitaciones, roles, jerarquía)
- Knowledge (SOPs)
- Misión + métricas + KPIs

---

## Repo 2: Capital Hub App (el otro repo)

| Campo | Valor |
|---|---|
| Carpeta local | `/Users/marcoantonio/Marco-Codes/App Capital Hub/` **(con espacios, NO con guiones)** |
| GitHub | `marcoapereirav-arch/capital-hub-app` |
| Vercel project | `capital-hub-app` (team `adrianvillanuevarios-cmds-projects` = `team_RgIpGFtQApuwauxv803z6z4t`) |
| Project ID Vercel | `prj_7pyN453GlwDuxvEqWiVHKLrQ0NMn` |
| Dominio | `app.capitalhubapp.com` (planificado, pendiente DNS) |
| Stack | React 19 + Vite + Supabase + Resend (Tauri/Capacitor REMOVED) |
| Para quién | **Alumno que compró** |

**Qué contiene (plataforma de aprendizaje):**
- Login alumno (BYOE pattern via Resend, sin emails de Supabase)
- Onboarding del alumno (foto, nombre, profesión, bio)
- Catálogo de formación (con bloqueo por producto comprado)
- Módulos + lecciones (vídeos con bloqueo progresivo)
- Perfil público del alumno
- Comunidad estilo Skool (feed + chats privados 1-a-1)
- Bolsa de trabajo + tracking aplicaciones
- Certificaciones + progreso

**Envvars actuales en Vercel (estado 2026-06-03):**
- `VITE_SUPABASE_URL` ✓
- `VITE_SUPABASE_ANON_KEY` ✓
- **Pendientes:** `VITE_RESEND_API_KEY` (o un backend que use Resend) + `INVITE_TOKEN_SECRET` cuando arranquemos BYOE auth.

---

## ⚖️ REGLA DE ORO — quién hace qué

| Si te piden algo sobre… | Repo |
|---|---|
| Funnel de venta, CRM, ficha contacto, pipelines | **OS** |
| Calendario, agenda, slots, bookings | **OS** |
| ManyChat → CRM auto (sin UI propia, vive en pipeline) | **OS** |
| Dashboards internos, métricas, KPIs | **OS** |
| Sistema tareas/proyectos/áreas/focos | **OS** |
| Ads, Meta Pixel, lead magnets, webs | **OS** |
| Email marketing (templates, broadcasts, logs) | **OS** |
| Equipo (invitar miembro, roles, permisos) | **OS** |
| Login alumno, contraseña, sesión alumno | **App** |
| Catálogo de cursos del alumno | **App** |
| Vídeos, módulos, lecciones, bloqueo progresivo | **App** |
| Comunidad (feed posts, chats entre alumnos) | **App** |
| Bolsa de trabajo, tracking aplicaciones | **App** |
| Perfil público del alumno | **App** |

Si **se cruzan** (ej: closer crea alumno → debe enviar acceso a la App):
- Backend del OS crea registro en BD compartida
- Backend del OS dispara email Resend con link a `app.capitalhubapp.com/accept/[token]`
- App recibe el token y deja al alumno poner contraseña + entrar

## Reglas para el agente

1. **Antes de tocar código**, identificar a qué repo pertenece la feature. Si no es obvio, preguntar.
2. **Si la feature es del OS:** trabajar en `/Users/marcoantonio/Marco-Codes/Capital Hub/` (este chat).
3. **Si la feature es de la App:** notificar al humano que esa parte conviene moverla a una ventana nueva de Antigravity en el repo `/Users/marcoantonio/Marco-Codes/App Capital Hub/`, o que el humano lo confirme para trabajar aquí.
4. **El agente puede trabajar en AMBOS repos desde la misma máquina** (tiene acceso a las dos carpetas). El criterio es organizativo (contexto del chat), no técnico.
5. **Comparten la misma instancia de Supabase** (`aglyoyqtzozdnusltjxe`). Las tablas con prefijo `students_*` son del lado App. El resto es del OS.
6. **Comparten el mismo dominio raíz** `capitalhubapp.com` con sub-dominios distintos.

## Subdominios (estado actual)

| Subdominio | Apuntado a | Estado |
|---|---|---|
| `os.capitalhubapp.com` | OS (Vercel `capital-hub-eco-ai`) | LIVE |
| `ecoai.capitalhubapp.com` | OS (legacy) | REDIRECT 308 → `os.` No usar en enlaces nuevos |
| `app.capitalhubapp.com` | App (Vercel `capital-hub-app`) | DNS pendiente |
| `capitalhubapp.com` (apex) | (reservado) | NO asignar todavía |

## Aprendizaje (2026-06-03)

El agente confundió y mencionó tres "opciones" A/B/C para la "arquitectura App" cuando en realidad la decisión ya estaba tomada: hay dos repos separados, **no hace falta debatir nada**. La carpeta local con guiones (`/app-capital-hub/`) era basura sin repo git y se eliminó.

**Regla derivada:** antes de proponer arquitecturas o opciones, leer este SOP. Si la respuesta está aquí, no inventar opciones.
