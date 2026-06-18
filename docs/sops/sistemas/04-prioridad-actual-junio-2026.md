---
title: Prioridad actual — junio 2026
order: 4
area: sistemas
---

# Prioridad actual del proyecto — junio 2026

> Este SOP captura el **orden estratégico vigente** que dicta Marco. Cuando una decisión nueva del usuario cambia el orden, se actualiza este archivo en el mismo commit.

## ⏸ Bloqueado por Adrián — Calendly API (instrucciones cargadas)

Calendly API se integra YA porque sin agenda no hay venta, pero está bloqueado a que Adrián complete su parte. Las instrucciones están en [`producto/45-calendly-api-instrucciones-adrian.md`](../producto/45-calendly-api-instrucciones-adrian.md) y las tareas en BD bajo `proj_calendly_api`:

1. ADRIÁN: generar Personal Access Token + verificar plan Standard
2. Marco: construir endpoints webhook + sync + UI
3. ADRIÁN: crear webhook subscription + signing key

El calendario propio (`proj_880_calendario_propio`) queda PAUSADO hasta tener bandwidth.

## 🎯 Bloque #1 — ACCESO AL EQUIPO (en marcha ahora)

**Objetivo:** marketing, formador, closer, setter entran al OS con sus credenciales y ven exactamente lo que les toca.

### Sub-bloques

1. ✅ **Aplicar permisos exactos** en `role-access.ts` (SOP 41)
2. ✅ **Limpiar dashboard** (4 KPIs globales, quitar cards no aportan, Vista por funnel)
3. ✅ **Pipelines** (General default, Test Personalidad sin default, regla sólida documentada SOP 12)
4. ✅ **Filtros completos** en `/crm/contactos` (Tags · Pipeline · Stage · Origen · Owner · Producto · Fecha · Llamada)
5. 🔄 **View as Role**: dropdown admin para impersonar rol y ver lo que ven
6. 🔄 **Crear 4 usuarios test** (marketing/formador/closer/setter) vía `/team`
7. 🔄 **Verificar e2e** que cada uno solo ve lo suyo
8. 🔄 **Endpoint reenviar invitación equipo** (`/api/admin/team/[id]/resend`)

## 🎯 Bloque #2 — PRODUCTO end-to-end (después del Bloque #1)

**Objetivo:** Cualquier alumno puede pagar, entrar a la App y consumir su producto SIN fricciones.

El flow canónico está en [`producto/12-sistema-end-to-end.md`](../producto/12-sistema-end-to-end.md): closer apunta venta → magic link → alumno activa → entra a la App → ve su contenido → consume → comunidad.

### Sub-bloques

1. **Smoke test e2e** flow venta → alumno activado (nunca corrió real, `student_invites=0`)
2. **Catálogo App**: bloqueo por producto cableado
3. **Onboarding alumno SIMPLE**: foto + nombre + profesión (default) + bio. SIN intereses, SIN video.
4. **Perfil público del alumno** (`/perfil/[id]`) clicable
5. **Comunidades Skool reales** separadas por producto (IA / MBD / CC)
6. **Posts Skool**: BD `community_posts` + reacciones + comentarios anidados
7. **Q&A por formación**
8. **Reenviar magic link** desde drawer del contacto
9. **Chat 1-a-1 alumno ↔ alumno** (posible postergación si MVP)

## ⏸ Bloqueado por Adrián (no toco)

| Item | Bloqueo |
|---|---|
| Calendly API | Adrián completar PAT + webhook |
| Instagram metrics reales | Token Meta (checkpoint Facebook) |
| Meta Ads dashboard | Mismo token |
| SSO OS↔App (Magic Link Bridge) | Adrián crear Edge Function `magic-link-for-staff` en repo App |
| Webinar 8/8/2026 — formato | Decisión Adrián |
| Scripts cierre high-ticket 2990€ | Adrián |
| Contenido formativo grabado (3 rutas) | Adrián / JP / Paolo |

## 🕓 DESPUÉS del Bloque #1 y #2

- ManyChat flows (DM bot automation del orgánico)
- Funnel `/test-personalidad` placeholders + integración test externo
- IG dashboard (cuando llegue token)
- Meta Ads dashboard
- Tracker Ads completo
- Bolsa de trabajo (BD + criterios "alumno listo")
- Email Marketing (dashboard métricas + templates)
- Whop integration (webhook + provision-user)
- Calendario propio (cuando Calendly API esté estable y haya bandwidth)

## Reglas de este SOP

- Si Marco re-prioriza, este archivo cambia **en el mismo commit** que la primera acción del bloque nuevo
- Lo que está en "Bloqueado por Adrián" NO se intenta empujar yo desde aquí
- Lo que está en "Bloque #1" tiene prioridad sobre cualquier otra tarea urgent en BD que no sea de este bloque
- Cualquier scope nuevo descubierto durante la ejecución → al backlog del bloque correspondiente

## Histórico

- **2026-06-17 13:30:** Marco dicta orden inicial. Producto end-to-end primero, equipo después.
- **2026-06-17 16:00:** Marco re-prioriza. Acceso al equipo PRIMERO ("que entren y vean"), producto e2e después.
- **2026-06-17 17:30:** Marco mueve Calendly arriba del todo ("sin agenda no hay venta"). Yo lo había puesto al final. Corregido.
- **2026-06-17 18:00:** Calendly queda en pausa (depende de Adrián). Instrucciones cargadas en SOP 45. Arranca Bloque #1 acceso equipo.
- **2026-06-18:** Sprint corto de arreglos rápidos (dashboard + pipelines + roles + filtros) hecho dentro del Bloque #1. Estado tracking en BD (proj_blockA1_dashboard completed, proj_blockA3_roles en marcha).
