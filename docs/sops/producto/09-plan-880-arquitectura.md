---
title: Plan 8/8/2026 - Arquitectura OS + App
order: 9
---

# Plan 8/8/2026 — Arquitectura OS + App

> **Foco principal:** webinar en directo el **8 de agosto de 2026** (8/8/8).
> Decisiones tomadas en llamada 3 jun 2026 entre Marco + Adrián + JP.

## Cambios de fondo vs etapa anterior

| Antes | Ahora |
|---|---|
| MIFGE funnel low-ticket (97€/mes con trial 14d) | **High ticket ~2.990€** sin trial, sin landing pública |
| Checkout público + upsells embedded | Cierre 100% por llamada con closer humano |
| Pipeline MIFGE 8 stages enfocado al trial | **Pipelines** (estados conciencia): new → contacted → booked → attended → no_show → won → lost |
| App de alumno: pendiente | **App de alumno = MVP estilo Skool** (login, catálogo por producto, módulos, comunidad, chats) |
| Calendly externo | **Calendario propio** integrado en el OS |

## Modelo de venta nuevo

```
Adquisición (orgánico IG + follow-me ads + cold outreach)
   ↓
Closer junior pide teléfono al lead caliente por DM
   ↓
Lead reserva slot en /agenda (calendario propio)
   ↓
Llamada de cierre con Adrián / equipo Nagai
   ↓
Si cierra → closer rellena Formulario Venta en el OS
   ↓
Este formulario hace 3 cosas en 1 acción:
  - Crea/actualiza ficha del contacto (CRM)
  - Vuelca datos al KPI dashboard
  - Envía email con acceso a la App al alumno
```

## Arquitectura OS (este repo)

| Sección | Ruta | Qué |
|---------|------|-----|
| Dashboard | `/overview` (dentro de Operaciones) | Foco 8/8, barra progreso tiempo + tareas, métricas plan |
| Dashboard general | `/dashboard` | Pendiente rediseño — métricas reales (revenue, cash collected, conversion) |
| **Operaciones** | `/dashboard`, `/areas`, `/projects`, `/tasks`, `/board` | Sistema productividad PARA + GTD |
| **Contactos** | `/contactos` | Ficha estilo GHL: lista + drawer + tabs (Datos / Productos+ventas / Journey / Notas). Vista Lista o Pipelines kanban (drag-and-drop entre estados) |
| **Calendario** | `/calendario` (admin) y `/agenda` (público) | Sustituye Calendly. Owner config + horarios recurrentes + bookings |
| Ventas (Formulario KPI) | `/ventas` o sub de Contactos | Pendiente — esperando captura form de Jesús |

## Arquitectura App alumno (decisión pendiente Marco)

3 opciones evaluadas:
- (A) Repo `capital-hub-app` ya existente (transferido a Adrián)
- (B) Repo Next.js nuevo
- (C) **Sub-ruta `/app/...` dentro de este OS** (recomendación Wave 1)

Recomendación (C): ahorra setup, deploy único, comparte BD. Auth de alumno con tabla `students` separada de `profiles` admin.

Features App:
- Login alumno (email magic link)
- Onboarding: nombre, apellido, foto, profesión, bio
- Catálogo de formación con bloqueo por producto (`students.products[]` decide)
- Módulos + lecciones con bloqueo progresivo (lección N+1 solo si N marcada done)
- Perfil público del alumno
- Comunidad estilo Skool (feed + posts con título/desc/adjunto, categorías wins/soporte/general)
- Chats privados 1-a-1 entre alumnos
- Comunidades SEPARADAS por producto al principio (IA / Marketing / Comercial herméticas)

## Pagos

| Procesador | Estado | Notas |
|---|---|---|
| Stripe | activo | Marco wire |
| Hotmart | activo | Límite financiación 5K |
| SeQura | activo | Hasta 6K financiación |
| Transferencia | activo | Manual |
| Whop | pendiente | No urgente |

**Cada venta el closer registra qué procesador usó + facturación (revenue) + cash collected (lo que llega real).**

## Productos

3 productos disponibles, **el alumno compra 1 (no objeto-brillante):**
- IA Integrator — Marco enseña
- Media Buyer Digital — JP enseña
- Comercial Closing — Nagai enseña (confirmado 3 jun)

Excepción: empresa que quiera formar a su equipo en varios → puede comprar varios. La BD permite multi-producto pero por defecto se selecciona 1.

## Calendario propio — modelo de datos

```
calendar_owners        (id, display_name, slot_minutes, buffer_minutes, meeting_url, google_oauth_*)
  └─ calendar_availability_rules  (weekday + start_time + end_time recurrente)
  └─ calendar_blocked_slots       (bloqueos puntuales por fechas)
  └─ calendar_bookings            (reservas reales con public_token para cancel/reschedule)
```

Función `getAvailableSlots(ownerId, rangeStart, rangeEnd)`:
1. Lee rules del owner → ventanas por weekday
2. Trocea en slots de slot_minutes con buffer entre cada uno
3. Quita los que solapan con blocked + bookings.status='booked'
4. Solo devuelve futuros

Anti double-booking: unique index parcial `(owner_id, start_at) WHERE status='booked'` — race-safe a nivel BD.

## Contactos — modelo de datos

```
contacts (existente, extendida en migration 0026):
  - full_name, email, phone, company
  - stage (pipelines)
  - products text[] — productos comprados
  - total_revenue, total_cash_collected — cifras
  - source — origen del lead
  - last_call_at — última llamada
  - owner_assignee — quién lleva el contacto
  - tags[], notes

contact_journey_events:
  - type: call_booked / call_attended / sale / note / stage_change / email_sent
  - title + description + data jsonb
  - created_at + created_by_user_id
```

Cambios stage se loguean automáticamente en journey. Notas rápidas también.

## Áreas de negocio

4 cuadrantes raíz: Marketing, Producto, Ventas, Finanzas.

| Área | Proyectos activos del plan 8/8 |
|---|---|
| Marketing | Adquisición orgánica + cold outreach IG |
| Producto | OS Dashboard, Sistema venta+KPI, Contactos (Pipelines), Calendario propio, App alumnos, Formación IA Integrator, Formación MBD |
| Ventas | Pipeline closing high ticket (Nagai + scripts + procesadores) |
| Finanzas | (sin proyecto aún) |

## Roles + bandwidth semanal

| Quién | Foco principal | Estimado semanal |
|---|---|---|
| Marco | OS + App + Formación IA | 30-40h |
| Adrián | Cierre + Adquisición + Webinar 8/8 | 25-30h |
| JP | Formación MBD + Q&A | 20-30h |
| Nagai | Closing equipo + scripts | iterativo |

## Reglas operativas

1. **Simpleza siempre.** Si una decisión añade complejidad sin retorno claro, descartar.
2. **MVP primero.** Subir prototipo a producción aunque sea feo y pulir con feedback de los primeros alumnos.
3. **Cuello de botella > redundancia.** Cada uno debe estar atacando lo que más mueve el business, no tareas redundantes.
4. **Comunidades separadas al principio**, unificar solo si feedback lo pide.
5. **Un alumno compra 1 producto por defecto.** Multi-producto es excepción.
6. **No landing pública, no funnel de compra abierto.** Cierre 100% por llamada.
