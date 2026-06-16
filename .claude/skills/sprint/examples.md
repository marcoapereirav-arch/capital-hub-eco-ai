# Ejemplos · Skill sprint

> Tres ejemplos reales de sprints creados con el framework. Sirven como referencia visual para futuros sprints. Los slugs y los IDs son reales en BD.

---

## Ejemplo 1 · Sprint VIDA (cerrado · referencia más completa)

**Trigger de Marco**: *"Quiero crear el sistema operativo de vida 2026 con goals + hábitos + tracker"*.

**Datos finales**:
- `slug`: `sprint-vida`
- `name`: `Sprint · VIDA`
- `code`: `VIDA`
- `workspace`: NVISION® · area `⚙️ Sistema / Desarrollo`
- `deadline`: NULL (sin fecha · ritmo libre)
- `description`: `Sistema operativo de vida 2026 · BD + tracker hábitos + Panel de Vida + integración Calendar`

**Fases (7 proyectos)**:
1. `VIDA · Fase A · Cimentación BD hábitos + goals`
2. `VIDA · Fase B · Tracker hábitos /community`
3. `VIDA · Fase B-bis · Wrapper /admin/habits`
4. `VIDA · Fase C · Goals UI autosuficiente`
5. `VIDA · Fase D · Panel de Vida /admin/vida`
6. `VIDA · Fase E · Integración Calendar`
7. `VIDA · Fase F · Cierre + sync`
8. `VIDA · Fase G · Ajustes UX post-cierre`
9. `VIDA · Fase H · Refactor /admin sidebar + tabs instant`

**Total tasks: 45** (todas ejecutadas)

**Patrón de tasks**:
- `VIDA-A1 · Crear tabla goal_habits con RLS` · ia · P1 · area=Sistema
- `VIDA-A2 · Sembrar 31 goals con 7 ligas como tags` · ia · P1 · area=Sistema
- `VIDA-H1 · AdminHomeSidebar con lista sprints + layout.tsx` · ia · P2 · area=Sistema

**Vinculación a goals**: tasks A1-A5 vinculadas a goals personales tipo "Hábitos sistemáticos" vía `goal_tasks`.

**Lección clave**: cuando los proyectos B-bis o G salen porque Marco amplía mid-flight, se añaden con `position` incremental y `status='in_progress'` al activarse.

---

## Ejemplo 2 · Sprint SYSDASH (activo · framework primer uso)

**Trigger de Marco**: *"Vamos a definir el sistema de dashboards"*.

**Datos**:
- `slug`: `sprint-sysdash`
- `name`: `Sprint · SYSDASH (sistema de dashboards)`
- `code`: `SYSDASH`
- `workspace`: NVISION® · area `⚙️ Sistema / Desarrollo`
- `deadline`: NULL
- `description`: `Sistema unificado de dashboards · framework + plantilla madre + sprints como entidad BD`

**Fases (4 proyectos)**:
1. `SYSDASH · Fase A · Barrido (auditoría del flow actual)` (cerrado)
2. `SYSDASH · Fase B · Definición del framework` (in_progress)
3. `SYSDASH · Fase C · Implementación (plantilla técnica)` (not_started)
4. `SYSDASH · Fase D · Cierre y sync` (not_started)

**Tasks tipo**:
- `SYSDASH-A1 · Mapear jerarquía productividad BD + rutas UI` · ia · P1 · area=Sistema
- `SYSDASH-A4 · Output mapa textual .md con todo + entrega a Marco` · ia · P1 · area=Sistema
- `SYSDASH-B1 · Definir qué es SPRINT vs proyecto vs área conceptualmente` · marco · P1 · area=Sistema

**Lección clave**: las tasks de Fase B son `executor='marco'` con `status='waiting'` porque dependen de decisiones suyas (regla #-3.6).

---

## Ejemplo 3 · Sprint TRACKER (placeholder activo)

**Trigger de Marco**: *"Crea un sprint para arreglar el tracker de hábitos, lo arrancamos después"*.

**Datos**:
- `slug`: `sprint-tracker`
- `name`: `Sprint · Tracker hábitos`
- `code`: `TRACKER`
- `workspace`: NVISION® · area `⚙️ Sistema / Desarrollo`
- `deadline`: NULL
- `description`: `Auditoría + mejoras del tracker /community/habits · NO arrancar hasta cerrar VIDA + SYSDASH`

**Fases (1 proyecto inicial · ampliable)**:
1. `TRACKER · Fase 1 · Auditar + arreglar tracker hábitos` (in_progress)

**Tasks (6 placeholder)**:
- `TRACKER-1 · Marco revisa /community/habits y lista qué se ve mal / falta` · marco · P1
- `TRACKER-2 · Auditoría visual mobile + desktop (Playwright 375×812 + 1280×800)` · ia · P2
- `TRACKER-3 · Auditoría lógica · hábitos sin hora, edición, comunidad, stats` · ia · P2
- `TRACKER-4 · Definir lista priorizada de mejoras` · marco+ia · P2
- `TRACKER-5 · Ejecutar mejoras una a una con estado en vivo` · ia · P3
- `TRACKER-6 · Push + verificar prod + cerrar sprint` · ia · P3

**Lección clave**: un sprint puede ser "creado pero no arrancado" · sigue como `status='active'` pero sus tasks ejecutables esperan al momento.

---

## Patrón compartido por los 3

1. Code prefix corto en MAYÚSCULAS (VIDA · SYSDASH · TRACKER · EVERGREEN · M1)
2. Proyectos por FASES (`Fase A`, `Fase B`, `Fase B-bis` si se amplía)
3. Tasks con nomenclatura `[CODE]-<Fase><Index>` (VIDA-A1, SYSDASH-B2, TRACKER-3)
4. Cada task tiene `executor`, `priority`, `area_id`
5. Status del proyecto refleja realidad (`in_progress` al arrancar · `not_started` si es siguiente)
6. Marco-tasks → `status='waiting'` por default · IA-tasks → `status='next_action'`
7. Verificar visibilidad en `/tasks/sprints/<slug>` tras INSERT antes de cerrar el turno

---

## Origen

Estos 3 ejemplos consolidan la práctica real de los sprints creados durante 2026-06-04 a 2026-06-09.
