---
title: CRM · contactos + pipeline end-to-end
order: 13
area: producto
---

# CRM — Contactos + Pipeline (2 sub-pestañas)

## Para qué sirve
Sección `/crm` del OS. Es el CRM completo del negocio con 2 vistas separadas:
- **Contactos** (lista estilo GoHighLevel): /crm/contactos
- **Pipeline** (kanban con stages): /crm/pipeline

Las 2 vistas comparten data pero tienen URLs propias y propósito distinto.

## URLs
- `https://os.capitalhubapp.com/crm` → redirige a `/crm/contactos`
- `https://os.capitalhubapp.com/crm/contactos` (lista)
- `https://os.capitalhubapp.com/crm/pipeline` (kanban)
- `https://os.capitalhubapp.com/contactos` → redirige a `/crm/contactos` (legacy compat)

## Funnel en español (stages CANONICOS — NO inventar nuevos)

**Decisiones de Marco 2026-06-15:**
- La llamada NO es stage (es evento).
- "Nuevo seguidor" → renombrado a `lead` porque Meta NO permite detectar followers pasivos. Un lead es lead porque deja sus datos (opt-in en landing, o interacciona y entra). Esa es la regla.

```
Camino feliz:
  lead → lead_cualificado → agendado → alumno

Salidas (estados terminales o ramas):
  seguimiento · no_show · perdido
```

| value (BD) | label UI | Cuándo aplica |
|------------|----------|---------------|
| `dm` | DM | Comentó el reel del webinar, aún sin dejar datos. **Solo en el pipeline `webinar`** |
| `lead` | Lead | Dejó sus datos (opt-in landing /test-personalidad, futuras integraciones ManyChat) |
| `lead_cualificado` | Lead cualificado | Pulsó el botón del email y abrió su acceso al test. Intención real, todavía sin agendar. **Solo en el pipeline `test-personalidad`** (ver SOP marketing/07) |
| `agendado` | Agendado | Lead reservó llamada en /agenda |
| `alumno` | Alumno | Compró (widget Registrar venta dispara esto) |
| `seguimiento` | Seguimiento | Tras llamada sin cierre, hay potencial |
| `no_show` | No show | Tenía llamada agendada y no asistió |
| `perdido` | Perdido | Descartado / no quiere comprar |

**Escalera del no retroceso** (`src/lib/pipeline/stage-guard.ts`): `dm(0) → lead(1) → lead_cualificado(2) → agendado(3) → alumno(4)`. Las automatizaciones nunca bajan a un contacto de escalón, y nunca degradan a un `alumno`. Los movimientos manuales en el kanban sí pueden ir en cualquier dirección: son decisión humana deliberada.

**Un stage puede existir solo en algunos pipelines.** El CHECK de `contacts.stage` acepta todos los valores canónicos, pero cada pipeline muestra únicamente las columnas que tenga en `pipeline_stages`. `dm` es del webinar; `lead_cualificado` es del test. Si un pipeline gana la señal que lo justifica, se replica ahí con una migración.

**Al añadir un stage nuevo hay que tocar, en el mismo commit:**
1. El CHECK `contacts_stage_check` (si no, los UPDATE fallan **en silencio**).
2. `pipeline_stages` del pipeline que lo usa, con su `sort_order` y corriendo los siguientes.
3. `STAGE_RANK` en `stage-guard.ts` (si no, cae por la rama de "stage desconocido" y permite degradar).
4. El mapa `STAGE_LABELS` de `/api/admin/contacts/[id]` (notificaciones de movimiento manual).
5. `STAGE_TONE` **y** `STAGE_ORDER` en `src/features/crm/lib/brand.ts` (cómo se pinta el chip y en qué sitio del funnel se ordena). Antes esto vivía suelto en `contactos-page.tsx`.
6. Este SOP.

**Decisión Marco 2026-06-15 (revisión):** se eliminan `conversacion` y `comento_no_follow` porque:
- `conversacion` no se podía mover automáticamente (el setter habla en IG nativo, invisible)
- `comento_no_follow` no aporta al funnel real, queda como tag si hace falta

Default al crear contacto: `lead`.

**Stages eliminados / históricos** (no usar):
- ~~`contactado`~~ → renombrado a `conversacion` el 2026-06-15
- ~~`atendio` (Atendió llamada)~~ → eliminado el 2026-06-15. La asistencia a la llamada es un EVENTO que se trackea en `contact_journey_events`, no un stage. Si atendió y compró → `alumno`. Si atendió y no compró → `seguimiento` o `perdido`.
- ~~`cliente`~~ → renombrado a `alumno` el 2026-06-15.
- ~~`nuevo_seguidor`~~ → renombrado a `lead` el 2026-06-15. Razón: Meta no expone el evento "alguien me siguió" a apps externas. Solo entran al CRM leads que dejan datos o interactúan explícitamente. Un lead es lead porque deja datos.

## Canales reales de entrada de leads (2026-06-15)

1. **Landing /test-personalidad** (PRINCIPAL): opt-in nombre+email → contacto `lead` + tag `origen:test_personalidad`
2. **Anuncio Follow Me Ads**: el lead llega a la landing, mismo flujo
3. **Reel orgánico con CTA**: lead llega a landing, mismo flujo
4. **Story con CTA**: lead llega a landing, mismo flujo
5. **(FUTURO con ManyChat)**: comentario+keyword, story reply, DM keyword → webhook → `lead` + tag origen

El setter habla con los leads desde Instagram nativo (no toca el OS para mover stage).
El OS recoge transiciones automáticas: `lead` → `agendado` (al reservar) y `agendado` → `alumno` (al registrar venta) o `no_show` (cron).

## Reglas de UX del CRM
- **No hay ShellHeader en ninguna pantalla del CRM** — el título lo pinta la barra superior global (`<TopBar>`, SOP [47](47-reglas-ui-contraste-legibilidad.md)) y el layout del CRM pinta las 3 sub-pestañas
- **No hay toggle list/kanban interno** — cada sub-tab es su propia URL
- **El pipeline SIEMPRE muestra todas las columnas** aunque no haya contactos en ellas (el funnel siempre visible)
- **Layout/ancho fijo** con `<PageContainer>` para evitar shift entre sub-tabs
- **El scroll del CRM vive en UN solo sitio**: el hueco de contenido de `src/app/(main)/crm/layout.tsx`. Las páginas hijas no crean su propio scroll vertical ni recortan
- **Diseño: brandkit oficial**, con los valores explícitos de `src/features/crm/lib/brand.ts` (los tokens del OS no son el brandkit, ver SOP 47)

## Paginación de la lista: 20 por página (Marco, 2026-08-06)

La vista **Contactos** enseña **20 contactos por página**. Se pasa de página con Anterior / Siguiente o con el número.

- Se pagina sobre el resultado **ya filtrado**, así que los filtros y el buscador mandan sobre la paginación, no al revés.
- **Cualquier cambio de filtro o de búsqueda devuelve a la página 1.** Quedarse en la 3 después de filtrar desconcierta.
- El número de página se recorta al pintar (`paginaSegura`), no se guarda recortado: si un filtro deja menos páginas de las que había, **nunca se ve una página en blanco**, se cae sola a la última que existe.
- Con una sola página el paginador **no se pinta**: sobra.
- El pie dice siempre "Viendo X a Y de Z", para que el contador de arriba y lo que hay en pantalla no puedan parecer contradictorios.
- Con muchas páginas los números se resumen (`1 ... 12 13 14 ... 25`). En móvil se sustituyen por "2 de 25": no caben.
- La lista trae de la base **hasta 500 contactos** (el tope del endpoint). Si algún día se llega a ese tope, la pantalla **lo dice**: un tope invisible convertiría el contador y el paginador en una mentira.
- El **kanban NO se pagina**: sus columnas ya scrollean por dentro y partir un funnel en páginas no significa nada.

## La lista y el kanban NO manejan la misma lista de stages

Es la trampa que más veces ha roto esta pantalla, y por eso está aparte:

| Vista | Qué stages usa | Por qué |
|---|---|---|
| **Pipeline** (kanban) | los del pipeline ACTIVO | son literalmente sus columnas |
| **Contactos** (lista) | la UNIÓN de los de TODOS los pipelines, ordenada por `STAGE_ORDER` | la lista mezcla contactos de todos los pipelines a la vez |

Usar los del pipeline activo también en la lista deja la pantalla coja de dos maneras a la vez, y ninguna avisa: el desplegable de Stage no ofrece stages que sí existen en la lista, y los contactos de esos stages salen **sin etiqueta**, porque el nombre del stage se busca en una lista donde no está.

## Cómo llega alguien a /contactos
Hay 5 fuentes por las que un contacto aparece:

1. **Reserva en `/agenda`** → sistema crea contacto con stage `booked`, source `agenda_calendar`
2. **ManyChat detecta nuevo follower de IG** y dispara webhook → crea contacto stage `nuevo_seguidor` automático
3. **Compra directa via widget "Registrar venta"** → si email no existe se crea con stage `won`
4. **Webhook ManyChat** (cuando lead acepta DM y entra al flujo de bot)
5. **Webhook Whop** (compras MIFGE legacy — sigue funcionando)

## Datos que guarda cada contacto

| Campo | Para qué |
|-------|----------|
| email | Llave principal de identidad (puede ser null inicialmente si viene de IG) |
| full_name | Nombre real |
| phone | Para llamadas + WhatsApp |
| instagram_username | @usuario de IG (sin `@`). Útil para leads de ManyChat antes de tener email. Búsqueda case-insensitive |
| manychat_subscriber_id | ID interno de ManyChat. UNIQUE. Permite vinculación automática cuando agendan con `?mc_id=` |
| stage | `nuevo_seguidor` → `contactado` → `agendado` → `atendio` → `seguimiento` / `cliente` / `no_show` / `perdido` |
| products[] | Array de productos comprados (IA, MBD, CC) |
| total_revenue | Suma de revenue de todas las ventas |
| total_cash_collected | Suma de cash collected |
| source | De dónde vino (agenda_calendar, manychat, sales_call_close, etc) |
| owner_assignee | Quién lo gestiona (marco, adrian, nagai, etc) |
| last_call_at | Última llamada con él |
| created_at | Cuándo entró al sistema |

## Pipeline visual

```
Sin tocar   →   Contactado   →   Reservó   →   Asistió   →   Cierre
new             contacted        booked         attended      won
                                                              
                                                no_show / lost
```

Cada columna se ve con su count + valor total revenue. Drag and drop entre columnas mueve el stage.

## Drawer detalle del contacto

Click en una card abre drawer derecho con:
- Datos básicos (nombre, email, tel, owner)
- Stage actual + cambio rápido
- Botones: "Registrar venta" / "Reservar llamada" / "Marcar no-show"
- **Journey timeline**: TODOS los eventos del contacto cronológicos
  (booking, llamada, sale, email enviado, email abierto, pago fallido)
- Notas internas del equipo

## Tabla en BD
`public.contacts` (UUID id, RLS habilitada, solo super_admins leen)

## Tablas relacionadas
- `contact_journey_events` (timeline del contacto)
- `calendar_bookings` (sus reservas)
- `student_invites` (sus invitaciones a la App tras venta)
- `email_logs` (emails enviados con tracking aperturas/clicks)
- `meta_events_log` (eventos enviados a Meta CAPI)

## Reglas operativas
- **Nunca borrar contactos.** Marcar como `lost` si abandonan.
- **Email es la clave de identidad.** Si llega un evento (booking, venta) con email existente, se actualiza el contacto, no se crea uno nuevo.
- **El stage solo sube** en el pipeline (excepto `no_show`/`lost`). Si vuelve a reservar tras `lost`, se respeta su stage anterior.
- **owner_assignee determina quién recibe notificaciones** sobre ese contacto.

## Integraciones automáticas
- Cada cambio de stage dispara `contact_journey_events`
- Cada venta dispara email magic link al alumno + notif a Marco
- Cada booking dispara crear evento en Google Calendar de Adrián
- Cada cambio de email crea entrada en `email_logs` con tracking

## Métricas que se calculan en vivo
- Total revenue por mes / por producto / por closer
- Conversion rate por stage (booked → attended → won)
- Tiempo medio en cada stage
- LTV por contacto

## Orden de columnas del pipeline (Marco 2026-06-23)

```
lead → agendado → seguimiento → no_show → alumno → perdido
```

(`sort_order` 1..6 en `pipeline_stages`, ambos pipelines.) `alumno` es el estado WON; aparece tras `no_show` solo por orden de display — semánticamente es el éxito y está protegido por la guarda.

## Lógica de movimiento automático (aplicado en código — 2026-06-23)

La regla "no perder un alumno" está **cableada**. Helper `resolveAutoStage()` en `src/lib/pipeline/stage-guard.ts`:

- **Nunca degrada a un `alumno`** (won) en transiciones automáticas. Es la única regla dura.
- `seguimiento`, `no_show`, `perdido` son **ramas**: desde ellas se puede re-enganchar hacia adelante (ej.: `seguimiento` re-agenda → `agendado`).
- Aplicado en:
  - `/api/calendar/book` (agendar): pasa a `agendado` salvo que ya sea `alumno`. Un alumno que reagenda sigue alumno; un `seguimiento`/`no_show`/`perdido` que reagenda vuelve a `agendado`.
  - `/api/calendar/cancel` (cancelar): si estaba en `agendado` pasa a **`seguimiento`** (para decidir: re-agendar o perdido). Nunca toca a un alumno. (Se eliminó el degradado al stage muerto `contacted`.)
  - `/api/webhooks/calendly` (Calendly online-coffee, 2026-06-25): `invitee.created` → `agendado` (crea el contacto si no existe); `invitee.canceled` → `seguimiento`; `invitee_no_show.created` → `no_show` (salvo alumno). Misma guarda.
- **NO aplica a movimientos manuales** en el kanban (override humano deliberado).

## Reportar bugs
Si una métrica no cuadra: revisar `contact_journey_events` para ese contacto. La timeline es la fuente de verdad.

## Bugs evitados (histórico)
- **Título "CRM" + "Contactos" duplicados en la cabecera**: causaba que se vieran 2 botones de toggle sidebar + título repetido. Fix: quitar `<ShellHeader>` de los componentes hijos cuando viven dentro del layout `/crm`. El layout es la única fuente del título.
- **Toggle Lista/Kanban interno duplicaba navegación**: las URLs `/crm/contactos` y `/crm/pipeline` ya son la fuente de verdad. El toggle interno se eliminó.
- **Pipeline mostraba "Sin contactos" cuando estaba vacío**: ahora SIEMPRE renderiza las columnas del funnel (vacías o llenas). El kanban es navegación, no contenido.
- **Doble scroll horizontal en /crm/pipeline**: el kanban tiene 8 columnas de 288px = 2400px. Si el padre `<PageContainer>` está en `max-w-7xl` (1280px), el navegador genera scroll horizontal DEL CONTAINER + el propio kanban con `overflow-x-auto` = 2 scrolls. **Fix**: en vista kanban usar `<PageContainer wide>` (max-w-full) y quitar el truco `-mx-4 px-4` del kanban. Regla: el componente con `overflow-x-auto` debe ser el ÚNICO con scroll horizontal en su jerarquía.
- **La pantalla se quedaba pegada: no se podía bajar en /crm/contactos (2026-08-06)**. Lo reportó Marco: *"la pantalla se queda pegada, no puedo hacer scroll"*. El hueco de contenido de `src/app/(main)/crm/layout.tsx` llevaba `overflow-hidden`. Con 30 contactos la lista mide 2307px y la ventana daba 799px: **1508px de contactos recortados y sin barra de scroll**. El contenedor de fuera (el de `(main)/layout.tsx`) sí tiene `overflow-y-auto`, pero nunca llegaba a desbordar porque el de dentro ya había cortado el contenido, así que tampoco aparecía ahí. **Fix**: ese hueco pasa a `overflow-y-auto` y es el ÚNICO scroll vertical del CRM. El kanban, que sí necesita ocupar el alto exacto, pide `h-full` en vez de recortar desde arriba (además se le quitó el `h-[calc(100vh-9rem)]`, una altura adivinada a ojo que no cuadraba con el hueco real). **Regla dura: la caja que RECORTA y la caja que DEJA BAJAR no pueden ser la misma.** Si una pantalla necesita altura fija, se la pide al hueco; no se recorta el hueco.
- **El filtro "Owner" no filtraba nada nunca (2026-08-06)**. El desplegable saca sus opciones de `contacts[].owner_assignee`, pero el `select` del `GET /api/admin/contacts` no devolvía esa columna. Resultado: el desplegable salía siempre con una sola opción ("todos") y el filtro no podía coincidir con nada. **Es exactamente el mismo fallo que `pipeline_id` el 2026-07-07**, en el mismo endpoint, un mes después: la regla estaba escrita y aun así se repitió. **Fix**: `owner_assignee` añadido al `select`. Refuerzo de la regla: *si el front filtra u ordena por un campo, el endpoint DEBE devolverlo*, y al añadir un filtro nuevo se comprueba abriendo el desplegable, no leyendo el código.
- **"Nuevo contacto" fallaba siempre (2026-08-06)**. El `POST /api/admin/contacts` creaba con `stage: "new"` cuando no se mandaba stage, y `new` **no está** en `contacts_stage_check`, así que la base rechazaba el alta entera. El valor venía de la época inglesa del pipeline y sobrevivió a los tres renombrados. **Fix**: el default pasa a `lead`, que es el que dice este SOP. **Regla derivada: un valor por defecto de un campo con CHECK se comprueba contra el CHECK vigente, no contra lo que ponía antes.**
- **Contactos sin etiqueta de stage y filtro incompleto (2026-08-06)**: ver la sección "La lista y el kanban NO manejan la misma lista de stages" más arriba.
- **Kanban SIEMPRE vacío en cualquier pipeline (2026-07-07)**: la vista pipeline filtra los contactos por `pipeline_id === activePipelineId`, pero el `GET /api/admin/contacts` NO devolvía `pipeline_id` en su `select`. Resultado: `c.pipeline_id` llegaba `undefined`, el filtro descartaba a TODOS los contactos y el kanban salía "0 contactos / VACÍO" aunque en BD estuvieran bien asignados (la vista LISTA sí los mostraba porque no filtra por pipeline). Lo detectó Marco: un lead del webinar (Vanessa) estaba en el pipeline `webinar` en BD pero no aparecía en el kanban. **Fix**: añadir `pipeline_id` al `select` del GET (`src/app/api/admin/contacts/route.ts`). Regla dura: si el front filtra por un campo, el endpoint DEBE devolver ese campo.

## Cambios versionados

### 2026-08-06: pantalla del CRM arreglada y rehecha con el brandkit
Marco: *"la pantalla se queda pegada, no puedo hacer scroll... y quiero que todo esté funcional y con el diseño nuevo de branding"*.

**Cuatro fallos, los cuatro mudos** (ni error de consola, ni fallo de tipos, ni build roto), documentados arriba en "Bugs evitados": el scroll recortado, el filtro Owner que no podía filtrar, "Nuevo contacto" que la base rechazaba siempre, y la lista usando los stages de un solo pipeline.

**Reglas nuevas que dejan:**
- La caja que recorta y la caja que deja bajar no pueden ser la misma (detalle en SOP [47](47-reglas-ui-contraste-legibilidad.md)).
- La lista usa la unión de stages de TODOS los pipelines; el kanban, los del suyo.
- Un valor por defecto de un campo con CHECK se comprueba contra el CHECK vigente.
- Al añadir un filtro, se comprueba abriendo el desplegable, no leyendo el código.

**Diseño:** las 3 pestañas, la ficha del contacto y el alta pasan al brandkit oficial, con los valores en `src/features/crm/lib/brand.ts`. El color de los stages deja de ser un neón por columna y pasa a significar algo (gris que avanza, verde en la venta, ámbar en el aviso, apagado en perdido).

### 2026-08-06: paginación de la lista de contactos
Marco: *"en contactos no puede pasar de una lista de más de 20 contactos, cuando pasa tienes que pasar de página"*.

Vista Contactos paginada de 20 en 20 (detalle en la sección "Paginación de la lista"). El kanban queda igual: sus columnas ya scrollean por dentro.

Bug encontrado y arreglado en el mismo bloque: el paginador quedaba **debajo del botón flotante de Registrar venta** y no se podía pulsar. Regla nueva en el SOP [47](47-reglas-ui-contraste-legibilidad.md), porque afecta al pie de cualquier pantalla del OS, no solo a esta.
