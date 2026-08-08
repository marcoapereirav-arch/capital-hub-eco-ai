---
title: Dashboard OS · operaciones + foco
order: 19
area: producto
---

# Dashboard operaciones — vista panorámica del negocio

## URL
`https://os.capitalhubapp.com/` (raíz del OS)

## Para qué sirve
Pantalla principal del OS. Es lo primero que ve un admin al entrar. Muestra el estado del negocio en una sola vista.

## Dos modos

### General (default)
Muestra **TODOS los proyectos activos + pausados + completados**. Vista panorámica de TODO el negocio. Y TODAS las tareas (incluido someday e inbox).

### Foco webinar 8/8
Muestra solo proyectos `status=active` con `focus_id=focus_webinar_880`. Vista de ejecución pura del plan webinar.

Toggle arriba a la derecha cambia entre los dos.

## Hero

### En modo General
- "X proyectos activos · Y pausados · Z completados · W tareas totales"
- Barra de progreso global

### En modo Foco
- Countdown gigante: "Quedan X semanas Y días" al webinar 8/8
- Barra de tiempo transcurrido
- Barra de tareas del foco completadas

## Stats cards

4 cards clicables que llevan a `/tasks` con filtros pre-aplicados (ahora cambian a vista list):

1. **Total tareas** → lista todas
2. **Pendientes** → status=next
3. **Vencidas** → dueRange=overdue (solo si hay vencidas)
4. **Esta semana** → dueRange=week

## Secciones

### Acciones humanas pendientes (top 10)
Lista de tareas más urgentes (por prioridad + due_date). Click en una → drawer con detalle + acciones rápidas.

### Próximos deadlines
Tareas con due_date cercano. Visual de timeline.

### Carga por persona
Cada admin/colaborador con su contador de tareas abiertas. Click → /tasks filtrado por assignee.

### Proyectos con progreso
Lista de proyectos con barra de progreso visual. Click → /projects/{id}. Badges:
- "pausado" amber
- "completado" green

### Áreas (Marketing, Producto, Ventas, Finanzas)
Bloques con resumen de tareas pendientes por área PARA.

## Filtros aplicados al hacer click en card

Cuando haces click en una stats card, el sistema:
1. Resetea filtros previos
2. Aplica el filtro específico (status / dueRange / assignee)
3. **Cambia viewMode a "list"** (no board, para que veas claramente las filtradas)
4. Navega a `/tasks`

Si en `/tasks` quieres volver al kanban general → cambia viewMode con el toggle de la toolbar.

## Tasks dentro de cada Proyecto

Click en un proyecto → `/projects/{id}`. Verás:
- Header con progreso del proyecto
- Toolbar con toggle **Pendientes (N)** / **Todas (M)** (por default solo pendientes)
- Lista de tareas filtrada
- Click en tarea → drawer con detalle

## Tabla BD
- `tasks` (todas las tareas con paraId, assignee, status, priority, due_date)
- `para_items` (proyectos + áreas + recursos + archivo)
- `focuses` (el foco webinar 8/8 vive aquí)

## Reglas operativas
- **General incluye tareas Someday e Inbox.** Foco las excluye para mantener limpieza.
- **Project detail oculta done por default.** Hay toggle para verlas si quieres revisar el histórico.
- **Si una task no tiene paraId, va a Inbox** (vista alternativa, no por defecto en Dashboard).
- **El countdown del foco usa endDate 2026-08-08.** Sólo cambiable editando el row de `focuses` en BD.

## Real-time
El store de tasks tiene Supabase Realtime. Cuando alguien actualiza una task en otra sesión, se refleja en vivo en el dashboard.

## Quick Capture
Caja flotante en la esquina (o atajo de teclado). Crea task en Inbox con assignee = usuario actual logueado (mapping email → assignee). No por defecto Marco como antes.

## Verificación
- Carga `/` → debe mostrar estado actual sin errores
- Toggle General ↔ Foco debe filtrar correctamente
- Click "Vencidas" → debe ir a `/tasks` viendo solo las vencidas en lista, NO el board completo
- Click en proyecto → `/projects/{id}` debe ocultar tareas done por default

## Cambios versionados

### 2026-07-27 · `/dashboard` = Centro de mando sobre metricas reales (piel minimalista)
El dashboard de proyectos/tareas descrito arriba fue SUSTITUIDO en `/dashboard` por una cara nueva ("Centro de mando") montada sobre las **metricas reales** del negocio, NO sobre tareas. Componente: `src/features/dashboard/components/main-dashboard.tsx`. Datos reales (queries a `contacts`, `student_invites`, `calendar_bookings`): facturacion del periodo, cash collected, ventas, ticket medio, embudo del pipeline activo, actividad reciente, 8 KPIs, ingresos 30 dias, ventas por completar, invitaciones App. Filtro de periodo (`PeriodFilter`) arriba a la derecha.

**Diseno (decidido por Marco, iterado):** minimalista y sobrio. Fondo carbon parejo, tarjetas limpias (borde 1px, radio suave), mucho aire, Inter Tight, verde SOLO como acento minimo. Se descartaron versiones recargadas (orbe HUD, y el "papel hueso / sello CH / cinturones" que se probo): no eran minimalistas. El brandkit es la referencia pero aplicado con contencion.

**Dos cambios de componentes en el mismo bloque:**
- `PeriodFilter` (`src/components/ui/period-filter.tsx`) rediseñado: de mono + mayusculas espaciadas a Inter Tight limpio (chip + dropdown sobrios, acento verde). Afecta a las 4 pantallas que lo usan (calendario, manychat, email-marketing, dashboard).
- En la card del embudo se usa un `select` nativo limpio para SOLO cambiar de embudo. Se quito el `PipelineSelector` (con su boton "Configurar" que abria el gestor de pipelines viejo dentro del dashboard). Ese gestor sigue existiendo en el CRM (vista kanban de contactos), que es su sitio.

> Pendiente: reescribir el cuerpo de este SOP (arriba describe el dashboard viejo de tareas/foco). Se conserva por historico hasta la reescritura.

---

## 2026-08-08 · El dashboard reconstruido: 3 gráficos, no 7

Origen: llamada Marco + Adrián del 6 de agosto, y la revisión de Marco del 7 y 8.

### Qué había roto

1. **Las 8 métricas se habían borrado.** El barrido de móvil del 7 de agosto (`6416d1b`) dejó `main-dashboard.tsx` de 1047 a 595 líneas y quitó la fila de tarjetas. Los números se seguían calculando y no se pintaban.
2. **El dinero se escondía solo.** `revenue` y `cash collected` estaban dentro de `if (kpis.revenue <= 0) return null`. Sin ventas en el periodo, la pantalla no enseñaba nada de dinero.
3. **Las llamadas se contaban en una tabla vacía.** Se leía `calendar_bookings` (el calendario propio, 0 filas, nadie lo usa) y se filtraba por `status === "completed"`, un valor que no existe en su CHECK. Llamadas hechas, show rate, no-shows y conversión salían siempre en cero.
4. **Siete gráficos, ninguno legible.** Cada uno con su propio dibujo.

### Cómo quedó

**Orden de la pantalla:** mosaico de métricas · separador · los 4 números de prospección (sin título) · el embudo · cómo va el mes · ventas por completar · actividad.

**Los 3 gráficos y qué contesta cada uno:**

| Gráfico | Pregunta |
|---|---|
| Facturación en el tiempo (dentro de la pieza grande) | ¿Cuánto dinero y cómo voy? |
| **El embudo** (con desplegable) | ¿Dónde se me cae la gente? |
| **Cómo va el mes** | ¿Entra gente, se agenda, se cierra? |

**Borrados por decir lo mismo desde seis sitios:** `dashboard-chain`, `dashboard-pulse`, `dashboard-funnel`, y los tres de día a día. También se recortó `dashboard-lecturas.ts` (`construirCadena` y `construirPulso` ya no existen).

### Definiciones cerradas de las métricas de llamadas

Salen de `calendly_scheduled_events`, filtrando **solo las agendas con `purpose = 'venta'`** en `calendly_event_types`.

| Métrica | Cómo se cuenta |
|---|---|
| Llamadas agendadas | reservas de venta del periodo, en cualquier estado, **incluidas las que aún no han ocurrido** |
| Canceladas | `status = 'canceled'` |
| No shows | `status = 'no_show'` |
| Llamadas hechas | ya pasó su hora, y no está cancelada ni marcada no show |
| Show rate | hechas / (hechas + no shows). Sin base: **guion** |
| Conversión llamada a venta | ventas / hechas. Sin base: **guion** |
| Ticket medio | revenue / ventas. Sin ventas: **guion** |

**Por qué "agendadas" incluye las futuras:** si solo contara las pasadas sería idéntico a "hechas", el primer salto del embudo saldría siempre 100% y Adrián vería 3 aquí y 8 en Calendly.

### Reglas que nacen de aquí

Están en [`producto/04`](04-protocolo-trabajo-agente.md): **REGLA #23** (horas reales), **REGLA #24** (todas las métricas siempre, guion nunca cero) y **REGLA #25** (un gráfico que no se explica solo, no sube).

### Archivos

- `src/features/dashboard/components/main-dashboard.tsx` (compone y calcula)
- `dashboard-metricas.tsx` (el mosaico: pieza grande, anillos, piezas)
- `dashboard-embudo.tsx` (el embudo + su desplegable)
- `dashboard-como-va.tsx` (el gráfico de tiempo, con las barras abribles)
- `dashboard-kpis.tsx` (los 4 números de prospección)
