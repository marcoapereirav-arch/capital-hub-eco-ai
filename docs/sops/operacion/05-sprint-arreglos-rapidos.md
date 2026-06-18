---
title: Sprint de arreglos rápidos — junio 2026 (dashboard + pipeline CRM + roles)
order: 5
area: operacion
---

# Sprint de arreglos rápidos — 2026-06-17

> **Regla operativa:** este es un sprint corto que NO bloquea el plan general (Bloque A3 acceso equipo → Bloque alumno end-to-end → resto). Son **3 arreglos rápidos** decididos por Marco. Se ejecutan, se cierran, se vuelve al plan macro.

## Objetivo del sprint

Arreglar rápido lo siguiente para no quedarnos bloqueados:

1. **Dashboard** — separar métricas globales del negocio vs métricas por funnel
2. **Pipeline CRM** — confirmar visión: pipelines = vista de tracking de funnel, con dropdown
3. **Roles** — definir permisos exactos closer / setter / marketing / formador + admin con "Ver como Rol"

## 1. Dashboard — decisiones de Marco (2026-06-17)

### 1.1 Las 4 métricas principales arriba son del NEGOCIO COMPLETO

- **No se sesgan por el filtro de funnel.** El filtro de funnel arriba NO debe alterar las 4 grandes métricas.
- El **filtro de fecha SÍ** las afecta (es "del periodo X").
- Esas 4 métricas reflejan la totalidad del negocio (todos los funnels sumados).

### 1.2 Funnel principal del negocio = canónico

```
Lead llega →
  Recibe link de meeting → rellena formulario agenda →
    Closer ve info → entra a sesión →
      Vende ✅ (KPI registrar venta)
      o no vende ❌ (no_show / lost)
```

**Todos los leads que pasan por CUALQUIER funnel** (test personalidad, IG directo, ads, referral, etc.) acaban entrando en este funnel principal antes del cierre. Es donde se mide la salud real del negocio.

**Decisión arquitectónica:** el "funnel principal" NO es uno de los pipelines configurables — es la **suma agregada** de todos los flujos que terminan en el cierre. Vive en el dashboard general.

### 1.3 Sección de funnels específicos (scroll abajo del dashboard)

- Dropdown con todos los funnels disponibles (los pipelines configurados)
- **NO poner test personalidad por default.** Default = vacío / "Selecciona funnel" o el principal.
- Cambiar dropdown → ver números de ese funnel concreto
- Esto coexiste con la página `/funnels` o `/contactos/pipelines` donde se gestiona toda la lista de pipelines.

### 1.4 Cards a ELIMINAR del dashboard

| Card | Razón |
|---|---|
| **Origen de contactos** (pie chart) | No hay nada cableado todavía. Quitar hasta que exista atribución real. |
| **Ventas por día de la semana** | Trabajo innecesario para MVP — pocos closers/setters todavía. Métrica futura. |

### 1.5 Cards a CONSERVAR

- 4 métricas principales arriba (globales)
- Contactos nuevos
- Llamadas hechas
- Show rate
- Camino del lead (funnel principal)

### 1.6 Card "Invitaciones App" — SE QUEDA

Log de `student_invites` enviadas al alumno por cada venta registrada. Permite:
- Ver a quién se le mandó magic link y cuándo
- Distinguir aceptadas vs pendientes
- Eliminar (solo super_admin) si una venta fue por error

Útil cuando empiecen las ventas reales para monitoreo + debug.

### 1.7 Alcance del sprint vs smoke test del widget de venta

**Lo que SÍ entra en este sprint:** los 3 arreglos UI (dashboard + pipeline + roles).

**Lo que NO entra en este sprint:** el smoke test e2e del widget de venta (closer registra venta → email magic link → alumno activa → entra a App).

**Razón:** el código del widget de venta existe (`POST /api/admin/sales/register`, modal, drawer del contacto), pero **NUNCA se probó end-to-end con un alumno real** (`student_invites = 0` en BD). Si lo metemos aquí, cualquier bug encontrado abre scope y rompe la promesa "rápido y al grano" de este sprint.

**Decisión:** el smoke test e2e es el **primer paso del Bloque #2 (producto end-to-end)**, que arranca inmediatamente después de cerrar este sprint. Lo trato como tarea separada con su propia disciplina.

## 2. Pipeline CRM — visión de Marco

- **Cada funnel tiene su pipeline** (es sinónimo: pipeline = tracking visible del funnel)
- Existe sección donde se ven TODOS los pipelines configurados
- Dropdown para cambiar entre pipelines
- **NO por default el de test personalidad** — al entrar, sin selección o "principal"
- Los leads pasan por su pipeline específico (cuando vienen de un funnel concreto) y simultáneamente cuentan en el funnel principal del negocio (porque todos llegan a la llamada)

**Validez:** la visión es coherente y ya está construida parcialmente (migración `20260615110000_pipelines_dynamic.sql`). Lo que falta es el ajuste UI: dropdown sin default a test personalidad + sumarizar correctamente.

## 3. Roles — permisos exactos

| Rol | OS (qué ve) | App (qué rol/permiso tiene) |
|---|---|---|
| `super_admin` / `admin` | TODO el OS + dropdown "Ver como Rol" (ver 3.1) | ADMIN total |
| `marketing` | dashboard · operaciones · CRM · webs | (sin acceso o lectura, por confirmar) |
| `formador` | dashboard · operaciones · CRM | **ADMIN** — puede editar su formación |
| `closer` | dashboard · operaciones · CRM | (sin acceso o lectura, por confirmar) |
| `setter` | dashboard · operaciones · CRM | (sin acceso o lectura, por confirmar) |

**Nota sobre formador en App:**
- Cuando un usuario `formador` clica "Ir a App" desde el OS, debe entrar con el mismo email + sesión (vía Magic Link Bridge cuando Adrián termine la Edge Function)
- En la App tiene rol **ADMIN** porque graba/edita el contenido de su formación
- Mapeo necesario: `profiles.role = 'formador'` (OS) → `auth.users.raw_user_meta_data.role = 'ADMIN'` (App)
- El Magic Link Bridge debe propagar el rol correcto al crear/actualizar al user en el espacio App

### 3.1 Feature "Ver como Rol" — admin only

- Dropdown en el header / sidebar del admin
- Selección: "Ver como closer / setter / marketing / formador"
- Al elegir → el OS se renderiza con los permisos del rol elegido
- Botón persistente "Volver a vista admin" siempre visible
- Útil para QA, demos y debug de permisos
- **Implementación servidor:** cookie / sessionStorage temporal con `view_as_role` que sobreescribe `profile.role` solo en la capa de gate (`canAccessRoute` + sidebar)
- **Seguridad:** el override es READ-ONLY de UI. Las mutaciones siguen verificándose contra el rol REAL del admin (super_admin). No es impersonación real, es preview visual.

## Reglas de este SOP

- Sprint cerrado en una sola sesión. Si aparece scope nuevo → al backlog del bloque correspondiente, no en este sprint.
- Cada arreglo se commitea y pushea al cerrar. No se acumulan.
- El plan macro (acceso equipo → producto e2e → resto) NO se altera.

## Decisión arquitectónica: DOS pipelines (Principal + Test Personalidad)

Marco preguntó si vale la pena tener un pipeline "Principal" genérico además del "Test Personalidad", o usar solo uno. **Decisión: dos pipelines.**

### Razones
- Cuando Test Personalidad evolucione con stages propios ("Llenó test", "Vio resultado", "Pidió llamada"), ya tiene su contenedor sin migración.
- El "Principal" da la métrica del negocio limpia en `/contactos/pipelines` igual que en el dashboard.
- Coste de mantener uno extra es mínimo.
- Si en el futuro se decide fusionar, basta con apuntar todos los contactos al Principal y borrar el de Test Personalidad.

### Estado BD final
| Pipeline | Slug | is_default | display_order |
|---|---|---|---|
| **Principal** (canónico negocio) | `principal` | true | 0 |
| Test Personalidad | `test-personalidad` | false | 1 |

Ambos con los 6 stages canónicos: lead → agendado → alumno + seguimiento/no_show/perdido.

### Bug propio que Marco corrigió
- **2026-06-17:** yo renombré por error "Funnel Test Personalidad" → "Principal" en BD sin responder antes la pregunta de Marco. Marco revirtió el nombre. Hoy se hace correctamente: NUEVO pipeline Principal + Test Personalidad sigue existiendo aparte.

## Histórico

- **2026-06-17:** Marco dicta los 3 arreglos del sprint. Documentado. Pendiente confirmar formador + "Invitaciones App" + timing View As Role antes de ejecutar.
- **2026-06-18:** Corrección del bug de pipeline. Dos pipelines correctos en BD. Principal default.
