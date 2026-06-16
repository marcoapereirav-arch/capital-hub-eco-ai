# Templates SQL · Skill sprint

> Templates listos para copiar/pegar al ejecutar la fase 3 (REGISTRAR) y fase 5 (ACCIONAR) del framework. Sustituir `:placeholders` con los valores reales del sprint.

---

## 1 · Crear el sprint (entidad raíz)

```sql
INSERT INTO sprints (
  workspace_id,
  name,
  slug,
  status,
  description,
  start_date,
  deadline,
  created_by
) VALUES (
  :workspace_id,                  -- a21ba195-... (NVISION) o ee9c96a7-... (Second Brain)
  'Sprint · :nombre',
  ':slug-kebab-case-unico',       -- ej. 'sprint-vida', 'sprint-tracker'
  'active',                        -- siempre active al crear (regla #5-bis)
  ':descripcion-objetivo-corta',
  CURRENT_DATE,
  :deadline_or_null,               -- '2026-06-15' o NULL si Marco no la indica
  'd2e8df9b-2bd0-40ee-b56a-f4e7b7e3c1f0'
)
RETURNING id, slug;
```

---

## 2 · Crear projects (fases del sprint)

```sql
-- Devuelve el sprint_id de arriba
INSERT INTO projects (
  workspace_id,
  name,
  status,
  description,
  sprint_id
) VALUES
  (:ws, '[CÓDIGO] · Fase A · <descripción>', 'in_progress', ':desc-A', :sprint_id),
  (:ws, '[CÓDIGO] · Fase B · <descripción>', 'not_started', ':desc-B', :sprint_id),
  (:ws, '[CÓDIGO] · Fase C · <descripción>', 'not_started', ':desc-C', :sprint_id)
RETURNING id, name;
```

**REGLA crítica**: el proyecto que se va a EJECUTAR YA = `in_progress`. Los siguientes = `not_started`. Al empezar uno nuevo → `UPDATE projects SET status='in_progress'`.

---

## 3 · Crear tasks (con TODO seteado)

```sql
INSERT INTO tasks (
  workspace_id,
  project_id,
  area_id,                        -- OBLIGATORIO · qué dominio toca
  title,                           -- '[CÓDIGO]-A1 · verbo imperativo'
  status,                          -- 'next_action' si IA · 'waiting' si Marco
  executor,                        -- 'ia' o 'marco'
  priority,                        -- 1-5 OBLIGATORIO (regla SOP)
  duration_minutes,                -- estimación si IA puede saberla
  created_by,
  position
) VALUES
  (:ws, :proj_A_id, :area_id, '[CÓDIGO]-A1 · Crear tabla X con RLS',         'next_action', 'ia',    1, 60,  :marco, 1),
  (:ws, :proj_A_id, :area_id, '[CÓDIGO]-A2 · Marco · Pasar credenciales API', 'waiting',     'marco', 1, 15,  :marco, 2),
  (:ws, :proj_A_id, :area_id, '[CÓDIGO]-A3 · Refactor servicio Y',           'next_action', 'ia',    2, 90,  :marco, 3)
RETURNING id, title;
```

### Cheatsheet de status × executor

| Quien | Status default |
|---|---|
| `executor='ia'` | `next_action` (lista para arrancar) |
| `executor='marco'` | `waiting` (regla #-3.6 · espera input/decisión) |

### Cheatsheet de priority

| Nivel | Cuándo asignarlo |
|---|---|
| **1** | URGENTE BLOQUEANTE · sin esto el sprint no avanza |
| **2** | IMPORTANTE CORE · parte del entregable principal |
| **3** | IMPORTANTE NO BLOQUEANTE · puede esperar P1+P2 |
| **4** | POST-ENCENDIDO · útil después de arrancar |
| **5** | BACKLOG · ideas que igual no entran a este sprint |

---

## 4 · Vincular tasks a goals (M2M opcional)

```sql
-- Una task puede contribuir a 1+ goals
INSERT INTO goal_tasks (goal_id, task_id)
VALUES
  (:goal_id_1, :task_id),
  (:goal_id_2, :task_id);
```

---

## 5 · Vincular projects a goals (M2M opcional)

```sql
INSERT INTO goal_projects (goal_id, project_id)
VALUES
  (:goal_id, :project_id);
```

---

## 6 · Verificar visibilidad UI (fase 4)

Simular la query del sidebar `/tasks/sprints/`:
```sql
SELECT slug, name, status FROM sprints
WHERE archived_at IS NULL AND slug = :nuevo_slug;
```

Simular la query del dashboard del sprint:
```sql
SELECT p.name, p.status, COUNT(t.id) AS tasks_visibles
FROM projects p
LEFT JOIN tasks t ON t.project_id = p.id
  AND t.archived_at IS NULL AND t.status != 'delete'
WHERE p.sprint_id = :sprint_id AND p.archived_at IS NULL
GROUP BY p.name, p.status
ORDER BY p.position NULLS LAST;
```

Si `tasks_visibles` por proyecto != lo metido → bug, arreglar.

---

## 7 · Calendar event al ARRANCAR una task IA (fase 5)

```sql
INSERT INTO calendar_events (
  source,
  source_id,
  title,
  start_at,
  all_day,
  busy,
  color,
  google_color_id,
  created_by
) VALUES (
  'task',
  :task_id,
  '[IA] [CÓDIGO]-A1 · <título de la task>',
  NOW(),
  false,
  false,
  '#039BE5',                     -- Peacock · color oficial tasks IA
  7,
  'd2e8df9b-2bd0-40ee-b56a-f4e7b7e3c1f0'
)
RETURNING id;
```

---

## 8 · Cerrar task IA (al terminar)

```sql
-- Cierre del calendar_event
UPDATE calendar_events SET end_at = NOW() WHERE id = :calendar_event_id;

-- Cierre de la task
UPDATE tasks SET status = 'complete', completed_at = NOW()
WHERE id = :task_id;
```

---

## 9 · Cerrar proyecto al cerrar última task

```sql
UPDATE projects
SET status = 'completed', completed_at = NOW()
WHERE id = :project_id;
```

---

## 10 · Cerrar sprint al cerrar todos los proyectos

```sql
UPDATE sprints
SET status = 'completed', completed_at = NOW()
WHERE id = :sprint_id;

-- (Opcional) confirmar que todos los projects están completed
SELECT status, COUNT(*) FROM projects WHERE sprint_id = :sprint_id GROUP BY status;
```

---

## 11 · Re-priorización dinámica (al final de cada turno)

```sql
-- Al completar una task P1, subir las dependientes
UPDATE tasks
SET priority = priority - 1
WHERE id IN (:lista_dependientes) AND priority > 1;

-- Detectar bloqueo nuevo → marcar P1
UPDATE tasks SET priority = 1 WHERE id = :task_que_resuelve_bloqueo;
```

---

## 12 · IDs útiles · cache

```
Marco user_id:              d2e8df9b-2bd0-40ee-b56a-f4e7b7e3c1f0
Workspace NVISION®:         a21ba195-228e-4408-9729-0e9dde75cc1c
Workspace Second Brain:     ee9c96a7-a2df-49c7-a339-cbf5e4a3d284
Area Sistema/Desarrollo:    362de4e6-2ab2-4103-b2b7-38a60d84b2cf
Area Lanzamiento Evergreen: dee455b9-f303-4f35-b393-1bfed734f4e4
```

Para nuevos workspaces/áreas, hacer:
```sql
SELECT id, name FROM workspaces;
SELECT id, name, workspace_id FROM areas WHERE archived_at IS NULL;
```
