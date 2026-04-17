# PRP-002: Sistema de Tareas GTD + PARA

> **Estado**: PENDIENTE
> **Fecha**: 2026-04-10
> **Proyecto**: Capital Hub OS

---

## Objetivo

Un modulo de tareas completo que integra GTD (flujo de ejecucion) y PARA (estructura organizativa) en una sola interfaz. Asignable a Marco Antonio y Adrian. Simple de usar, visualmente completo, todo mock por ahora.

## Por Que

| Problema | Solucion |
|----------|----------|
| Las tareas del equipo estan dispersas (notas, WhatsApp, mental) | Un sistema central donde todo se captura, organiza y ejecuta |
| No hay visibilidad de quien tiene que y en que estado | Asignacion clara + estados GTD visibles |
| Las tareas no tienen contexto (a que proyecto o area pertenecen) | Estructura PARA da contexto a cada tarea |

**Valor de negocio**: Equipo core (Marco + Adrian) opera desde un solo sistema. Nada se pierde. Todo tiene dueno y estado.

---

## Diseno: Como GTD + PARA Conviven

### Modelo Mental

```
PARA = DONDE vive la tarea (estructura)
GTD  = EN QUE ESTADO esta la tarea (flujo)
```

Cada tarea tiene:
- Un **contexto PARA** (a que Proyecto, Area, Recurso pertenece)
- Un **estado GTD** (donde esta en el flujo de ejecucion)
- Un **asignado** (Marco Antonio o Adrian)

### Estados GTD (el flujo)

| Estado | Descripcion | Icono |
|--------|------------|-------|
| `inbox` | Recien capturada, sin procesar | Inbox |
| `next` | Proxima accion concreta a ejecutar | Zap |
| `waiting` | Esperando respuesta/dependencia de alguien | Clock |
| `someday` | Algun dia / quizas — no urgente | Bookmark |
| `done` | Completada | Check |

### Categorias PARA (la estructura)

| Categoria | Descripcion | Ejemplos Capital Hub |
|-----------|------------|---------------------|
| **Projects** | Tienen fecha limite o entregable concreto | "Lanzar funnel LT8", "Integrar Meta Ads API" |
| **Areas** | Responsabilidades continuas sin fecha fin | "Marketing", "Ventas", "Producto", "Operaciones" |
| **Resources** | Referencia / material de consulta | "Brandkit", "SOPs", "Templates" |
| **Archive** | Proyectos completados o pausados | Proyectos terminados se mueven aqui |

---

## Arquitectura Visual

### Layout Principal (3 zonas)

```
+------------------------------------------------------------------+
|  HEADER: Tareas + filtros rapidos + boton "Nueva Tarea"          |
+------------------------------------------------------------------+
|                    |                                              |
|  SIDEBAR PARA     |  CONTENIDO PRINCIPAL                        |
|  (navegacion)     |                                              |
|                   |  Vista activa:                               |
|  > Inbox (5)      |  - Board (columnas GTD)                     |
|  ─────────────    |  - Lista (tabla filtrable)                   |
|  PROJECTS         |  - Proyecto (detalle de un proyecto)         |
|   > Funnel LT8    |                                              |
|   > Meta Ads API  |                                              |
|  AREAS            |                                              |
|   > Marketing     |                                              |
|   > Ventas        |                                              |
|   > Producto      |                                              |
|  RESOURCES        |                                              |
|   > Brandkit      |                                              |
|  ARCHIVE          |                                              |
|   > (collapsed)   |                                              |
+------------------------------------------------------------------+
```

### Vista Board (Kanban GTD)
Columnas = estados GTD. Cada card muestra: titulo, asignado, contexto PARA, prioridad.
```
| INBOX      | NEXT ACTION | WAITING FOR | SOMEDAY    |
|------------|-------------|-------------|------------|
| [tarea]    | [tarea]     | [tarea]     | [tarea]    |
| [tarea]    | [tarea]     |             |            |
```

### Vista Lista (Tabla completa)
Todas las tareas en tabla con columnas: Estado, Titulo, Proyecto/Area, Asignado, Prioridad, Fecha.
Filtrable por: estado GTD, categoria PARA, asignado, prioridad.

### Panel de Detalle (Sheet lateral)
Click en cualquier tarea abre un panel lateral con:
- Titulo editable
- Estado GTD (selector)
- Contexto PARA (proyecto/area)
- Asignado (Marco / Adrian)
- Prioridad (Urgente, Alta, Normal, Baja)
- Notas / descripcion
- Fecha limite (opcional)

### Quick Capture
Input siempre visible en el header. Escribes, Enter, va a Inbox automaticamente.
Procesar = moverla del Inbox a Next/Waiting/Someday y asignarle contexto PARA.

---

## Que

### Criterios de Exito
- [ ] Puedo capturar una tarea en 2 segundos (quick capture → inbox)
- [ ] Puedo ver todas mis tareas por estado GTD (board view)
- [ ] Puedo ver todas las tareas filtradas por proyecto/area PARA (sidebar)
- [ ] Puedo cambiar estado de una tarea con un click (drag or dropdown)
- [ ] Puedo ver tareas de Marco y de Adrian por separado o juntas
- [ ] El sistema se siente rapido y simple, no abrumador
- [ ] 100% alineado al brandkit monocromatico

### Comportamiento Esperado (Happy Path)
1. Marco entra a Tareas → ve su Board con columnas GTD
2. Escribe "Revisar copy del funnel LT8" en quick capture → va a Inbox
3. Procesa la tarea: la mueve a "Next", la asigna a Adrian, contexto = Project "Funnel LT8"
4. Adrian entra → ve la tarea en su columna "Next"
5. Adrian la completa → la mueve a "Done"
6. Marco puede filtrar por Proyecto "Funnel LT8" para ver todo lo relacionado

---

## Contexto

### Arquitectura Propuesta (Feature-First)
```
src/features/tasks/
├── components/
│   ├── task-page.tsx          # Layout principal con sidebar PARA + contenido
│   ├── task-sidebar.tsx       # Navegacion PARA (projects, areas, resources, archive)
│   ├── task-board.tsx         # Vista board (columnas GTD)
│   ├── task-list.tsx          # Vista lista (tabla filtrable)
│   ├── task-card.tsx          # Card de tarea (para board y lista)
│   ├── task-detail.tsx        # Panel lateral de detalle (Sheet)
│   ├── task-quick-capture.tsx # Input de captura rapida
│   ├── task-filters.tsx       # Barra de filtros
│   └── task-empty-state.tsx   # Estado vacio
├── hooks/
│   └── use-tasks.ts           # Estado local con Zustand (mock)
├── services/
│   └── mock-tasks.ts          # Datos mock iniciales
├── store/
│   └── task-store.ts          # Zustand store
└── types/
    └── task.ts                # Tipos: Task, GTDStatus, PARACategory, etc.
```

### Modelo de Datos (mock, Supabase despues)
```typescript
type GTDStatus = "inbox" | "next" | "waiting" | "someday" | "done"
type Priority = "urgent" | "high" | "normal" | "low"
type ParaType = "project" | "area" | "resource" | "archive"

type ParaItem = {
  id: string
  name: string
  type: ParaType
  color?: string // solo para visual
}

type Task = {
  id: string
  title: string
  description: string
  status: GTDStatus
  priority: Priority
  assignee: "marco" | "adrian"
  paraId: string | null     // a que proyecto/area pertenece
  dueDate: string | null
  createdAt: string
  completedAt: string | null
}
```

---

## Blueprint (Assembly Line)

### Fase 1: Tipos, Store y Mock Data
**Objetivo**: Modelo de datos definido, Zustand store funcional con CRUD, datos mock cargados.
**Validacion**: Puedo crear, leer, actualizar y eliminar tareas desde el store.

### Fase 2: Layout y Sidebar PARA
**Objetivo**: Pagina de tareas con sidebar PARA (Projects, Areas, Resources, Archive) + header con quick capture.
**Validacion**: Puedo navegar entre categorias PARA y la captura rapida funciona.

### Fase 3: Board View (Kanban GTD)
**Objetivo**: Vista de columnas GTD con cards de tareas. Cambio de estado via dropdown (drag & drop es bonus).
**Validacion**: Puedo ver tareas por columna GTD y mover tareas entre estados.

### Fase 4: Lista View + Filtros
**Objetivo**: Vista de tabla completa con filtros por estado, proyecto/area, asignado, prioridad.
**Validacion**: Puedo filtrar y ordenar tareas con cualquier combinacion de filtros.

### Fase 5: Task Detail (Panel Lateral)
**Objetivo**: Sheet lateral con todos los campos editables de una tarea.
**Validacion**: Puedo editar cualquier campo de una tarea desde el panel.

### Fase 6: Validacion Visual
**Objetivo**: Todo alineado al brandkit, responsive, flujo completo funcionando.
**Validacion**:
- [ ] `npm run build` exitoso
- [ ] Screenshot confirma estetica brandkit
- [ ] Flujo GTD completo: capture → process → execute → complete
- [ ] Estructura PARA navegable y funcional

---

## Gotchas

- [ ] Zustand store debe ser "use client" — separar logica de server components
- [ ] Board view necesita layout horizontal scrollable en mobile
- [ ] Quick capture debe funcionar con Enter key, no solo boton
- [ ] Filtros deben persistir al cambiar de vista (board ↔ lista)
- [ ] El sidebar PARA de tareas es DISTINTO al sidebar del shell — es interno al modulo

## Anti-Patrones

- NO crear un Kanban generico — esto es GTD + PARA especifico
- NO meter drag & drop complejo en la primera version (dropdown para mover es suficiente)
- NO perder la simplicidad visual por querer meter todo — priorizar claridad
- NO hardcodear nombres de proyectos/areas — deben ser creables

---

*PRP pendiente aprobacion. No se ha modificado codigo.*
