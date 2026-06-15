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
- `https://ecoai.capitalhubapp.com/crm` → redirige a `/crm/contactos`
- `https://ecoai.capitalhubapp.com/crm/contactos` (lista)
- `https://ecoai.capitalhubapp.com/crm/pipeline` (kanban)
- `https://ecoai.capitalhubapp.com/contactos` → redirige a `/crm/contactos` (legacy compat)

## Funnel en español (stages CANONICOS — NO inventar nuevos)

**Decision de Marco 2026-06-15:** la llamada NO es stage (es evento).
El pipeline tiene 4 stages en camino feliz y 4 salidas. Total 8 stages.

```
Camino feliz:
  nuevo_seguidor → conversacion → agendado → alumno

Salidas (estados terminales o ramas):
  seguimiento · no_show · perdido · comento_no_follow
```

| value (BD) | label UI | Cuándo aplica |
|------------|----------|---------------|
| `nuevo_seguidor` | Nuevo seguidor | ManyChat detecta nuevo follower en IG |
| `conversacion` | Conversación | Setter / ManyChat inicia DM (= contactado) |
| `agendado` | Agendado | Lead reservó llamada en /agenda |
| `alumno` | Alumno | Compró (widget Registrar venta dispara esto) |
| `seguimiento` | Seguimiento | Tras llamada o conversacion sin cierre — hay potencial |
| `no_show` | No show | Tenía llamada agendada y no asistió |
| `perdido` | Perdido | Descartado / no quiere comprar |
| `comento_no_follow` | Comentó · no follow | Comentó en un reel pero no nos sigue ni respondió |

Default al crear contacto: `nuevo_seguidor`.

**Stages eliminados / históricos** (no usar):
- ~~`contactado`~~ → renombrado a `conversacion` el 2026-06-15
- ~~`atendio` (Atendió llamada)~~ → eliminado el 2026-06-15. La asistencia a la llamada es un EVENTO que se trackea en `contact_journey_events`, no un stage. Si atendió y compró → `alumno`. Si atendió y no compró → `seguimiento` o `perdido`.
- ~~`cliente`~~ → renombrado a `alumno` el 2026-06-15.

## Reglas de UX del CRM
- **No hay ShellHeader en /crm/contactos ni /crm/pipeline** — el layout del CRM ya pinta el título "CRM" + las 2 sub-pestañas
- **No hay toggle list/kanban interno** — cada sub-tab es su propia URL
- **El pipeline SIEMPRE muestra todas las columnas** aunque no haya contactos en ellas (el funnel siempre visible)
- **Layout/ancho fijo** con `<PageContainer>` para evitar shift entre sub-tabs

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

## Reportar bugs
Si una métrica no cuadra: revisar `contact_journey_events` para ese contacto. La timeline es la fuente de verdad.

## Bugs evitados (histórico)
- **Título "CRM" + "Contactos" duplicados en la cabecera**: causaba que se vieran 2 botones de toggle sidebar + título repetido. Fix: quitar `<ShellHeader>` de los componentes hijos cuando viven dentro del layout `/crm`. El layout es la única fuente del título.
- **Toggle Lista/Kanban interno duplicaba navegación**: las URLs `/crm/contactos` y `/crm/pipeline` ya son la fuente de verdad. El toggle interno se eliminó.
- **Pipeline mostraba "Sin contactos" cuando estaba vacío**: ahora SIEMPRE renderiza las columnas del funnel (vacías o llenas). El kanban es navegación, no contenido.
- **Doble scroll horizontal en /crm/pipeline**: el kanban tiene 8 columnas de 288px = 2400px. Si el padre `<PageContainer>` está en `max-w-7xl` (1280px), el navegador genera scroll horizontal DEL CONTAINER + el propio kanban con `overflow-x-auto` = 2 scrolls. **Fix**: en vista kanban usar `<PageContainer wide>` (max-w-full) y quitar el truco `-mx-4 px-4` del kanban. Regla: el componente con `overflow-x-auto` debe ser el ÚNICO con scroll horizontal en su jerarquía.
