---
name: sprint
description: "Skill canónica del SaaS NVISION® para crear y gestionar sprints siguiendo el framework completo (sprint = entidad BD con projects + tasks vinculados, code prefix, priority P1-P5, executor IA/Marco, áreas transversales, vinculación a goals). Se activa cuando Marco menciona crear/arrancar un sprint nuevo, o invoca /sprint explícito. Aplica reglas del Knowledge en cadena y evita anti-patrones (sin OK, sin prefijo, sin priority, sin area, status incorrecto, lenguaje propio en lugar de status enum)."
---

# Skill · Sprint

> Aplica el framework completo de sprints del SaaS NVISION® al crear, ejecutar o cerrar uno.
> Esta skill se activa SOLA cuando Marco menciona arrancar un sprint nuevo. No hay que pedirla.

---

## Cuándo se activa

Triggers de Marco (lenguaje natural):
- "vamos a hacer un sprint de X"
- "crear sprint Y"
- "arrancar foco en Z"
- "necesito un sprint para …"
- "/sprint"

NO se activa cuando habla de un sprint que ya existe (para eso usa el dashboard del sprint en `/tasks/sprints/<slug>` directamente).

---

## Framework canónico (5 fases · orden ESTRICTO)

### Fase 1 · PRESENTAR plan textual (sin tocar BD)

Construir y mostrar a Marco:

- **Nombre completo** del sprint (`Sprint · <Nombre>`)
- **Código** corto en MAYÚSCULAS 3-8 chars (ej. `VIDA`, `EVERGREEN`, `M1`)
- **Workspace**: NVISION® (id `a21ba195-228e-4408-9729-0e9dde75cc1c`) o Second Brain (id `ee9c96a7-a2df-49c7-a339-cbf5e4a3d284`)
- **Deadline opcional** (sin fecha si Marco no la indica)
- **Descripción / objetivo** (1-2 líneas)
- **Lista de proyectos/fases**: `[CÓDIGO] · Fase A · <descripción>`, `[CÓDIGO] · Fase B · ...`
- **Lista de tasks por proyecto** con:
  - Título: `[CÓDIGO]-A1 · <verbo imperativo + objeto>`
  - `executor`: `ia` o `marco` sugerido por la lógica de la task
  - `priority` sugerido P1-P5 según niveles canónicos
  - `area_id` correcto del workspace (ver áreas en BD)
  - `goals` con los que se vincula (si aplica) vía `goal_tasks`

### Fase 2 · PREGUNTAR

```
"¿Aceptas este sprint? Si sí, registro todo con código [X]."
```

Esperar OK explícito ("sí", "ARRANCA", "lo acepto"). Sin OK no se toca BD.

Si Marco dice "ajusta X" → reformular el plan textual y volver a preguntar.

### Fase 3 · REGISTRAR en BD (solo si Marco aceptó)

INSERT en este orden:

```sql
-- 1. Sprint
INSERT INTO sprints (workspace_id, name, slug, status, start_date, deadline, description, created_by)
VALUES (:ws, :name, :slug, 'active', CURRENT_DATE, :deadline_or_null, :description, :marco_user_id);

-- 2. Projects con sprint_id Y status 'in_progress' (si arranca ya · regla #5-bis)
INSERT INTO projects (workspace_id, name, status, description, sprint_id)
VALUES (:ws, '[CÓDIGO] · Fase A · ...', 'in_progress', :desc, :sprint_id), ...;

-- 3. Tasks con TODO seteado · priority OBLIGATORIO
INSERT INTO tasks (workspace_id, project_id, area_id, title, status, executor, priority, created_by, position)
VALUES (...);
-- executor='ia' → status='next_action'
-- executor='marco' → status='waiting' (regla #-3.6)
-- priority 1-5 SIEMPRE seteado

-- 4. Vincular a goals si aplica (M2M existente)
INSERT INTO goal_tasks (goal_id, task_id) VALUES ...;
```

### Fase 4 · VERIFICAR VISIBILIDAD UI

Simular la query EXACTA del sidebar `/tasks/sprints/`:
```sql
SELECT slug, name, status FROM sprints
WHERE archived_at IS NULL AND slug = :nuevo_slug;
```
Y la query del dashboard del sprint:
```sql
SELECT p.name, COUNT(t.id) AS tasks
FROM projects p LEFT JOIN tasks t ON t.project_id = p.id AND t.status != 'delete'
WHERE p.sprint_id = :sprint_id AND p.archived_at IS NULL
GROUP BY p.name;
```

Si count != lo metido → corregir antes de declarar el sprint creado.

### Fase 5 · ACCIONAR primera task IA (si aplica)

Si la primera task del sprint es ejecutable por la IA inmediatamente:

```sql
INSERT INTO calendar_events (source, source_id, title, start_at, all_day, busy, color, google_color_id, created_by)
VALUES ('task', :first_ia_task_id, '[IA] [CÓDIGO]-A1 · ...', NOW(), false, false, '#039BE5', 7, :marco_user_id);
```

Y ejecutar la lógica de la task hasta cerrarla con `end_at = NOW()` y `tasks.status = 'complete'`.

---

## Reglas Knowledge que esta skill obedece

La skill **no duplica** estas reglas, las **cita** desde Knowledge (`assistant_sops`):

| Slug Knowledge | Qué aporta |
|---|---|
| `ia-flujo-plan-presentar-preguntar-registrar` | Fases 1-2-3 obligatorias |
| `ia-nomenclatura-codigo-sprint` | Código + prefijo en projects y tasks |
| `ia-estado-productividad-refleja-ejecucion-viva` | Status del proyecto refleja realidad (in_progress al INSERT si arranca ya) |
| `ia-verificar-visibilidad-ui-tras-insert-productividad` | Fase 4 obligatoria |
| `ia-sprint-tasks-priority-niveles-dinamicos` | Priority P1-P5 OBLIGATORIO + re-priorización dinámica |
| `ia-documentar-tareas-en-vivo-hora-exacta` | Fase 5 calendar_event al ejecutar IA |
| `ia-lenguaje-decir-la-ia-no-claude` | Lenguaje en redacción |
| `ia-leer-todos-los-knowledge-siempre` | Antes de crear, leer Knowledge relevante |
| `productividad-gtd-para` (sección 3) | Status enum real (`next_action`, `waiting`, `someday`, `inbox`, `complete`, `delete`) — NUNCA inventar términos como "atacable" |

---

## Anti-patrones que la skill bloquea automáticamente

| Anti-patrón | Cómo lo detecta y bloquea |
|---|---|
| Crear sprint sin OK | Fase 2 obligatoria. No INSERT si Marco no aceptó |
| Tasks sin priority Y sin due_at | Pre-INSERT valida (al menos uno de los dos) en cada row |
| Tasks con priority Y due_at simultáneamente | La fecha vence el priority. Pre-UPDATE pone priority=NULL si se asigna due_at |
| Tasks sin area_id | Pre-INSERT valida area_id (usar areas reales del workspace) |
| Status `not_started` en projects que arrancan ya | Default `in_progress` cuando se ejecuta inmediato |
| Task IA con status `waiting` | Solo Marco usa `waiting` por defecto (regla #-3.6) |
| **Lenguaje propio en UI** ("atacable", "Tasks hechas", "Diferida") | **NUNCA inventar labels**. La UI siempre usa el enum literal en minúsculas: `next_action` / `inbox` / `waiting` / `someday` / `complete` / `delete`. Auditar `DashboardInteractive.tsx` + cualquier renderer de status |
| Sin código de sprint en nombre | Validar `name` contiene `[CÓDIGO] · Fase X` |
| Mezclar sprint con area | Sprint es contenedor temporal · area es esfera continua · son ortogonales |
| Pre-registrar antes de presentar | Fase 1 textual primero, BD solo después de OK |
| Tasks `someday` no editables desde la cola | Toda task pendiente (incluyendo `someday`) debe abrir `TaskDetailDrawer` al click · permitir cambiar `status`, `priority`, `due_at`, `executor`, **título y descripción** sin salir de la cola. Título editable contentEditable + descripción textarea inline. Save al blur o Enter |
| **Task sin Definition of Done** | Toda task NUEVA debe tener en su `description` una sección `**Definition of Done:**` con 1-3 bullets que indiquen claramente CUÁNDO está terminada. Sin esto, Marco no sabe si dar check. Origen: Marco 2026-06-09 *"esta tarea se acaba en el momento en que esto suceda"* |
| Tasks post-encendido en sprint pre-encendido | Si Marco define un sprint con deadline X y todas las tasks deben entrar ANTES de X, las P4-P5 sobran → mover a `someday` o archivar |
| **Tasks con `position=0` masivo + Position por código en vez de ejecución** | `position` representa el **ORDEN DE EJECUCIÓN REAL**, no el número del código. Cuando aparece una task nueva prioritaria (ej. `B11.A` que es lo siguiente a hacer), se inserta arriba con `position=1` y las demás se desplazan. Usar saltos (1-5, 10-20, 99) para tener espacio entre bloques sin reordenar todo cuando se mete una nueva. Origen: Marco 2026-06-09 *"si son prioridad, ¿por qué no están más arriba? Soy muy visual"* |
| **UI muestra códigos ISO en bruto** ("ES", "lk", "AD") | Antes de insertar contactos importados, garantizar helper de render: `Intl.DisplayNames("es-ES",{type:"region"})` para país + `capitalize()` para ciudad. NUNCA mostrar "ES" pelado al usuario |
| **Pipeline default sin lógica** | Si Marco crea un sprint que involucra migración de contactos, no usar el pipeline auto-generado. PEDIR a Marco los pipelines reales (Comunidad / Low Ticket / Mentorías / etc.) con sus stages antes de importar nada |
| **Sistema de tags inexistente o roto** | Antes de migrar contactos con tags, validar que existe `/admin/tags` para gestionar + filtro por tag en CRM. Sin esto, los tags importados se vuelven basura inmanejable |
| **Project schedule sin rollback en fallos** | `scheduleProject` debe: 1) anti-duplicados guard al inicio (borra events source='project' con mismo título sin link), 2) rollback si falla el link project↔event (DELETE del event recién creado). Sin esto, un error a mitad de transacción deja events huérfanos visibles en el calendar |
| **Calendar event source='project' sin source_id** | Al INSERTAR calendar_event para un proyecto, SIEMPRE poblar `source_id = projectId`. Permite navegar al proyecto desde el panel de evento sin queries extra |
| **Click en evento de proyecto navega directo** | NO redirigir al proyecto. Abrir EventDetailPanel lateral (igual que todos los eventos) con botón "Ir al proyecto" dentro. Marco quiere ver detalles primero, no ser teletransportado |
| **Tasks de proyecto sin badge TÚ/IA visible** | En CADA renderer de tasks (cola, cards de proyecto, drawer, etc.) mostrar pill TÚ (dorado) si executor='marco' o IA (azul) si executor='ia'. No solo en la cola de pendientes |
| **profiles ↔ crm_contacts no-sync** | Trigger BD obligatorio: `trg_profiles_sync_crm_contact` AFTER UPDATE en profiles propaga cambios a crm_contacts (full_name/email/phone/country/city/province/timezone/avatar_url). Sin esto, editar la ficha del miembro no actualiza la tabla CRM |
| **Server Component importa de archivo `'use client'`** | NUNCA importar funciones síncronas de archivos marcados `'use client'` desde Server Components. Crear archivo separado server-safe (sin directiva) y re-exportar. Ej. `useBackHref.ts` (client) re-exporta `resolveBackHref` desde `resolveBackHref.ts` (server-safe) |

---

## Integración con otras entidades

### Goals (vinculación opcional)
Una task puede vincularse a 1+ goals vía `goal_tasks (goal_id, task_id)`. Cuando presento el plan textual y una task del sprint contribuye a un goal existente, sugiero el vínculo y al registrar hago el INSERT en `goal_tasks`.

### Areas (obligatorio · transversal)
Toda task debe tener `area_id` apuntando a un área **real del workspace destino**. Las áreas son **esferas de responsabilidad continua** (no temporales). Sprint y area son ortogonales: un sprint atraviesa varias áreas.

Áreas vivas NVISION®: `⚙️ Sistema / Desarrollo` · `📢 Marketing` · `💸 Ventas` · `🎯 Producto` · `📊 Finanzas`.
Áreas vivas Second Brain: `📝 Journal` · `🌙 Sueños` · `💪 Entrenamiento` · `🍽️ Nutrición` (más se crearán cuando Marco lo decida).

Si no encuentro área natural para una task → DETENGO la fase 1 y pregunto a Marco antes de seguir.

### Notas (vinculación futura)
Cuando arranque el Sprint NOTAS, las tasks podrán vincularse a notas vía `note_links` polimórficos. De momento no hago nada con notas.

### Calendario
Tareas IA al ejecutar generan `calendar_event '[IA] CODE-XN · ...' start_at=NOW()` (regla anclada). Tareas Marco con `due_at` aparecen en el calendar admin.

---

## Re-priorización en vivo (al final de cada turno donde toco un sprint vivo)

Después de cualquier UPDATE de tasks del sprint, hago una pasada:

1. **¿Alguna P1 se completó?** → buscar tasks dependientes (mismo proyecto o vinculadas) y subirlas de nivel si procede.
2. **¿Marco mencionó un bloqueo nuevo en este turno?** → identificar la task que lo resuelve y marcarla `priority = 1` con UPDATE inmediato.
3. **¿Surgió contexto que cambia el orden lógico?** → re-evaluar y UPDATE el resto.

UPDATE en silencio (sin notificar a Marco a cada cambio · solo si el cambio es grande, le aviso en el siguiente mensaje).

---

## Ciclo del sprint · lifecycle

| Estado | Cuándo |
|---|---|
| `active` | Mientras Marco trabaja en él · visible en sidebar Sprints activos |
| `paused` | Marco lo pausa · visible en grupo Pausados |
| `completed` | Todas las fases cerradas · visible en Cerrados (colapsado por default) |

Cerrar un sprint = `UPDATE sprints SET status='completed', completed_at=NOW()` Y `UPDATE projects SET status='completed' WHERE sprint_id=:sprint_id`. Las tasks `complete` se quedan donde están.

---

## Comandos rápidos · referencia para la IA

Ver areas vivas del workspace:
```sql
SELECT id, name FROM areas WHERE workspace_id = :ws AND archived_at IS NULL;
```

Ver goals activos:
```sql
SELECT id, title FROM goals WHERE status = 'active' AND archived_at IS NULL;
```

Ver Marco user_id:
```sql
SELECT id FROM auth.users WHERE email = 'marcoapereirav@gmail.com';
-- Cached: d2e8df9b-2bd0-40ee-b56a-f4e7b7e3c1f0
```

---

## Origen

Marco 2026-06-09 · *"Crea la skill de los sprint para que siempre se haga de forma correcta con todo el framework que hemos creado"*.

La skill consolida el framework construido durante los sprints VIDA, TRACKER y SYSDASH. No inventa nada nuevo: cita las reglas ya ancladas en Knowledge y orquesta su aplicación en orden estricto.
