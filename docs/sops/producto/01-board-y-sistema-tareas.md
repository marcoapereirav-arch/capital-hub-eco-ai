---
title: Board visual y sistema de tareas (GTD + PARA)
order: 1
---

# Board visual + Sistema de tareas (GTD + PARA)

## Para qué sirve

Tenemos **dos vistas** de las mismas tareas:

| Vista | URL | Cuándo la uso |
|---|---|---|
| **Lista** | `/tasks` | Crear, editar, marcar como done. Operativa diaria. |
| **Board** | `/board` | Ver el flow completo, dependencias, qué proyecto va más activo, qué espera. Estratégica. |

Ambas son la misma data — sincronizada en realtime.

## Filosofía: GTD + PARA

Aplicamos **GTD** (Getting Things Done) para los **status** de cada task:

| Status | Cuándo usar |
|---|---|
| **Inbox** | Acaba de entrar, sin clasificar |
| **Next** | Lista para accionar AHORA. Tiene contexto y herramientas. |
| **Waiting** | Bloqueada esperando algo (otra task, persona, fecha) |
| **Someday** | Backlog. Idea válida pero no priorizada |
| **Done** | Completada |

Aplicamos **PARA** (Projects, Areas, Resources, Archive) para **categorizar** tasks:

- **Project**: trabajo con un fin específico y deadline (ej: "Funnel LT8", "Webs+CRM en el OS")
- **Area**: responsabilidad continua (ej: "Marketing", "Ventas", "Operaciones")
- **Resource**: material de referencia (ej: "Brandkit", "SOPs")
- **Archive**: items de proyectos terminados

## Cómo se ve el Board

### Centro
Un nodo **MISIÓN** dorado con los 5 KPIs y el goal de 1.000€/día. Todo orbita a su alrededor porque todo lo que hacemos sirve para llegar a esa misión.

### Proyectos (pelotas grandes)
Cada proyecto activo es un sol con resplandor de su color. Los proyectos sin tasks no se muestran.

### Tasks (nodos pequeños orbitando proyectos)

| Indicador | Significado |
|---|---|
| **Color del fondo** | Status (verde done, azul next, amarillo waiting, gris someday/inbox) |
| **Color del borde** | Proyecto al que pertenece |
| **Tamaño** | Prioridad (urgent grande, low pequeño) |
| **🔥 llama** | Urgent |
| **📅 calendar badge** | Tiene fecha límite |
| **MA / AV / EQ** | Assignee (Marco / Adrián / Equipo) |
| **⚡ Zap cyan + parpadeo** | Se está trabajando AHORA AHORA |

### Done atenuado por antigüedad
- Done de hoy → 90% opacidad
- ~7 días → 70%
- ~30 días → 50%
- 90+ días → 25% (mínimo, queda como historial)

### Edges (líneas)

| Línea | Significa |
|---|---|
| Sutil del color del proyecto | Task pertenece a ese proyecto |
| Naranja DASHED ANIMADA "depende" | La task de origen DEPENDE de la otra. Se vuelve gris cuando ambas están done. |
| Dorada sutil hacia MISIÓN | El proyecto contribuye al goal central |

## Reglas operativas

### 1. Cada task pertenece a UN proyecto/area (PARA)
No hay tasks huérfanas (si las hay, aparecen en cluster aparte abajo).

### 2. Las dependencias se mapean cuando son lógicas
Si la task A no se puede terminar sin la task B → A depende de B.
Yo (el agente) las mapeo automáticamente cuando se crean tasks nuevas según el contexto.

### 3. El flag "in_progress AHORA" es para lo que se está trabajando EN VIVO
- Yo lo activo automáticamente cuando empezamos a trabajar una task aquí en el chat
- Lo desactivo al terminar
- Tú puedes overridear desde el drawer de la task
- Si una task `next` está siendo trabajada → parpadea cyan en el board

### 4. Done queda visible
No se borran del board. Se atenúan con el tiempo. Esto da contexto histórico de qué se ha logrado.

### 5. Prioridades reales
- **urgent**: necesario en las próximas 24h
- **high**: esta semana
- **normal**: próximas 2-3 semanas
- **low**: cuando haya tiempo

### 6. Filtros multi-select
En la top bar del Board puedes filtrar por status, assignee, prioridad, proyecto, in_progress, con fecha. Los filtros son acumulativos.

## Realtime

Cualquier cambio en cualquier task (creada, editada, completada, movida de status) se ve en TODAS las pantallas abiertas en menos de 1 segundo. No hay que refrescar.

## Mi compromiso

Yo (el agente IA) mantengo este sistema vivo:
- Cada vez que cerramos una conversación que resuelve algo → marco la task como done
- Cuando creamos algo nuevo → inserto la task con sus dependencias inferidas
- Si detecto dependencias no obvias → las añado
- Si el alcance de una task cambia significativamente → actualizo su descripción

**Trato el sistema de tareas como código: limpio, actualizado, sin tareas zombi.**
