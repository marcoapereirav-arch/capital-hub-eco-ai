---
title: Misión Producto Terminado — dashboard /mision
order: 7
---

# Misión Producto Terminado — dashboard `/mision`

Dashboard interno del equipo Capital Hub para llegar al **31 de mayo de 2026** con producto on point: las 3 formaciones grabadas, sistema de certificación con IA, chatbot de soporte, plataforma con perfil/certificados/bolsa, comunidad operativa, sistema de pago + trial, y app móvil.

Es la **fuente única de verdad operativa** del lanzamiento entre Adrián, Marco, JP, Paolo y Steven.

## Decisión de arquitectura

**No hay sistema paralelo de tareas.** Reutilizamos `public.tasks` y `public.para_items` (ver SOP 01). El dashboard es una vista filtrada por `para_id = 'p_mision_producto_terminado'` y enriquecida con dos columnas:

- `launch_phase_id` → vínculo a `public.launch_phases` (4 fases del lanzamiento)
- `launch_block` → bloque del brief (A, B, C, D, F, G, IA, FUNNEL, DEC, LLAM, RETO, SOFT)

El check de `assignee` se amplió: ahora acepta `marco | adrian | equipo | ai | jp | paolo | steven`.

Migración: `supabase/migrations/0022_launch_phases_and_mision.sql`.
Seed: `supabase/migrations/0023_seed_mision_producto_terminado.sql` (referencia; los datos se cargaron vía MCP el 2026-05-07).

## Acceso

- Ruta: `/mision`
- Permiso: `profiles.role = 'admin'`. Cualquier user no-admin recibe 404.
- Mapeo email → assignee (`src/app/(main)/mision/page.tsx`):
  - `adrianvillanuevarios@gmail.com` → `adrian`
  - Marco / JP / Paolo / Steven: pendiente de añadir cuando tengan profile + email confirmado

## Las 4 fases

| # | Slug | Nombre | Fecha objetivo |
|---|---|---|---|
| 1 | `infraestructura` | Infraestructura y contenido base | 2026-05-13 |
| 2 | `rutas` | Contenido de las tres rutas | 2026-05-21 |
| 3 | `sistemas` | Sistemas técnicos | 2026-05-21 |
| 4 | `soft-launch` | Testeo y soft launch | 2026-05-31 |

Las fases 2 y 3 corren en paralelo. La fecha final del lanzamiento es **2026-05-31**.

## Vistas en el dashboard

1. **Header misión + countdown**: días restantes, % global, tareas atrasadas, barra de progreso.
2. **4 cards de fase** con barra de progreso, tareas done/total, bloqueadas y atrasadas.
3. **Lo crítico hoy**: priority `urgent` o due_date ≤ hoy+2 días. Máximo 8.
4. **Mi checklist**: tareas del usuario actual (mapeadas por email → assignee), ordenadas por prioridad y due_date.
5. **Bloqueos activos**: tareas con `status = 'waiting'`.
6. **Sheet de detalle por tarea**: cambiar estado (En curso / Bloquear / Completar / Pendiente), ver dependencias entrantes y salientes.

## Bloques del brief → tareas

| Bloque | Responsable | Contenido |
|---|---|---|
| A | Adrián | Bienvenida (vídeos 1-3 + doc compromiso) |
| B | Adrián, Marco, JP, Paolo | Descubrimiento de ruta (vídeos 4-9 + ejercicios) |
| C | Adrián | Fundación mental (5 sesiones viernes) |
| D | Adrián, JP, Marco, Paolo | Formación 3 rutas: estructura + rúbrica + grabación + proyecto cumbre |
| F | Steven, Adrián | Empleabilidad (vídeos F1-F4 + bolsa + SLA + criterios) |
| G | Adrián | Comunidad (vídeo G + reglas + Discord) |
| IA | Marco | Sistema certificación con IA + chatbot soporte |
| FUNNEL | Marco | Funnel post-VSL + progresión + tracking + perfil + bolsa + ads |
| DEC | Adrián | Decisiones estratégicas (pricing, matrícula, compromiso, garantía) |
| LLAM | Adrián | Llamadas de diagnóstico (calendario + estructura + feedback) |
| RETO | Adrián | Reto 120 días (futuro) |
| SOFT | Adrián | Soft launch (pruebas e2e + beta + lanzamiento oficial) |

## Dependencias críticas precableadas

- `t_mision_ia_evaluacion_sistema` depende de las 3 rúbricas (`t_mision_d_*_rubrica`)
- `t_mision_softlaunch_pruebas` depende de Comercial grabado + funnel + IA + chatbot
- `t_mision_softlaunch_beta` depende de pruebas e2e
- `t_mision_softlaunch_oficial` depende del beta
- `t_mision_funnel_ads` depende del lanzamiento oficial
- `t_mision_a4_doc_compromiso` depende de `t_mision_dec_compromiso_alumno`

## Realtime

El dashboard se suscribe a `postgres_changes` filtrados por `para_id = 'p_mision_producto_terminado'`. Cualquier cambio en una tarea (estado, asignación, dependencia) se ve en todas las pantallas abiertas en <1s.

## Cambios versionados

### 2026-05-07 — Creación
Brief recibido de Adrián. Implementación Fase 1 (MVP): 4 fases + 66 tareas seedeadas + page `/mision` mobile-first + Sheet de detalle de tarea. Pendiente Fase 2 (notificaciones email Resend, vista de dependencias visual) y Fase 3 (métricas + docs + polish).
