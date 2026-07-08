---
title: ManyChat → CRM · automatización entrada de leads desde Instagram
order: 20
area: producto
---

# ManyChat → CRM (automatización entrada de leads)

## Qué es esto en una frase
Cuando alguien interactúa con el Instagram de Adrián, **ManyChat** detecta automáticamente al usuario y **dispara un webhook a nuestro OS** que crea/actualiza la oportunidad en el CRM. **Sin que nadie tenga que escribir nada a mano**.

## Por qué necesitamos esto
Hoy el setter (Nagai/quien sea) tendría que escribir manualmente CADA nombre de Instagram que llegue al perfil. Eso es:
- Lento
- Se pierden leads
- No se trackea bien

ManyChat ya recibe esos eventos automáticamente porque Adrián tiene su Instagram conectado a ManyChat. Solo falta que ManyChat **avise** al OS.

## Cómo funciona el flujo completo

```
1. Persona sigue a @adrian en Instagram
        ↓
2. ManyChat detecta "new follower" (ya configurado en su panel)
        ↓
3. ManyChat dispara un External Request HTTP POST hacia:
   https://ecoai.capitalhubapp.com/api/webhooks/manychat
        ↓
4. El OS recibe el webhook, verifica firma (header Authorization:
   Bearer <MANYCHAT_WEBHOOK_SECRET>)
        ↓
5. OS busca si ya existe oportunidad con ese ig_username
        ↓
6. Si NO existe → crea contacto con stage='nuevo_seguidor'
   Si YA existe  → actualiza last_interaction_at + datos nuevos
        ↓
7. La nueva oportunidad aparece en /crm/pipeline columna "Nuevo seguidor"
   sin que nadie haga nada
```

## Eventos que ManyChat puede disparar (no solo "new follower")

| Evento ManyChat | Acción OS |
|-----------------|-----------|
| `new_subscriber` (alguien empieza chat) | Crea contacto stage `nuevo_seguidor` |
| `clicked_link` (clicó link en DM) | Añade event en journey + nota |
| `provided_email` (rellenó email en flow) | Actualiza contact.email |
| `provided_phone` (rellenó tel) | Actualiza contact.phone |
| `tagged_<custom>` | Mueve stage según tag (ej: tag "interesado_ia" → products incluye IA Integrator) |
| `unsubscribed` | No mueve nada, deja journey event |

## Si la persona agenda llamada desde el DM
Cuando alguien dentro del DM clica el link y va a `/agenda`, ya estamos cubiertos:
- ManyChat NO crea otra oportunidad
- `/agenda` busca por email/teléfono y ENCUENTRA la oportunidad existente (creada antes por ManyChat)
- Actualiza esa oportunidad: stage → `agendado`, añade booking
- Una sola oportunidad por persona, no se duplica

## Lo que SÍ está construido hoy
- ✅ Endpoint `/api/webhooks/manychat` (verificación firma, parsing)
- ✅ Tabla `manychat_events` (log de eventos recibidos)
- ✅ Tabla `manychat_subscribers_cache` (sync de subscribers ManyChat)
- ✅ Tabla `manychat_custom_fields_cache`
- ✅ Tabla `manychat_tags_cache`
- ✅ Variables ENV: `MANYCHAT_API_KEY`, `MANYCHAT_WEBHOOK_SECRET`

## Lo que FALTA construir
- 🟡 **Mapeo evento ManyChat → acción CRM**: ahora el endpoint guarda los eventos pero NO los traduce a operaciones en `contacts`. Necesita la lógica de "si new_subscriber → crear contacto stage `nuevo_seguidor`".
- 🟡 **Setup en panel ManyChat**: hay que ir al Flow Builder de ManyChat y añadir el step "External Request" apuntando al webhook.
- 🟡 **UI en /crm para mostrar fuente** (badge "from: Instagram" / "from: ManyChat") en las cards.

## Si esto NO se construye
Si decidimos NO conectarlo:
- Hay que eliminar la sección `/outreach-ig` del OS (no sirve para nada porque no captura nada)
- El setter tendría que entrar a Instagram nativo, ver seguidores, y manualmente añadir cada uno en `/crm/contactos` (lentísimo)

## Si esto SÍ se construye
- ManyChat hace el trabajo de captación
- El OS muestra TODO en `/crm/pipeline` columna "Nuevo seguidor"
- El setter solo tiene que mirar esa columna, hablarles, y mover stages
- 0 trabajo manual de "añadir leads"

## Limitación importante
Meta NO permite a apps externas leer/responder DMs de Instagram cuentas business sin permisos especiales (proceso largo de review). ManyChat SÍ puede porque tiene partnership oficial con Meta. Por eso lo necesitamos como intermediario — no podemos conectarnos directo a Instagram.

## Decisión tomada (hoy)
- `/outreach-ig` eliminado del OS por ser sección manual sin valor.
- ManyChat → CRM se va a construir (ManyChat ya está pagado).

---

# Realidad del chat con Instagram

## ¿Se puede conversar con seguidores desde el panel del OS?
**NO directamente.** Razones técnicas verificadas:

1. **Instagram Messaging API requiere Meta Business Verification + App Review** (proceso de 4-8 semanas, no siempre se aprueba).
2. **Solo apps con partnership oficial con Meta** pueden leer/enviar DMs (ManyChat tiene ese partnership; nosotros NO).
3. Construir esto desde 0 implica gastar semanas en burocracia que ManyChat ya ha resuelto.

## Cómo se conversa entonces
- **El setter usa el inbox de ManyChat** (`manychat.com/inbox`).
- El OS muestra un **botón "Abrir chat en ManyChat"** en cada card del CRM (columna nuevo_seguidor / contactado). Click → abre el inbox de ManyChat con esa conversación activa en pestaña nueva.
- Es 1 click extra pero NO requiere construir infraestructura imposible.

---

# Cómo se vincula que el chat de IG agendó

Esta es la parte CRÍTICA. El problema: si solo tenemos su Instagram username, ¿cómo sabemos que la persona que agendó es esa misma?

## Mecanismo: parámetro de tracking en el link

Cuando ManyChat detecta nuevo seguidor genera un **link único de agenda** con un identificador del subscriber:

```
https://ecoai.capitalhubapp.com/agenda?mc_id=<subscriber_id>
```

Donde `subscriber_id` es el ID interno de ManyChat para esa persona.

## Flow paso a paso

```
1. Persona sigue a @adrian en IG
        ↓
2. ManyChat detecta el evento, le crea subscriber_id = 12345 internamente
        ↓
3. ManyChat dispara webhook al OS:
   POST /api/webhooks/manychat
   { event: "new_subscriber", subscriber_id: 12345, ig_username: "@juan_lopez", first_name: "Juan" }
        ↓
4. El OS crea contacto:
   contacts {
     id: <uuid>,
     full_name: "Juan",
     stage: "nuevo_seguidor",
     metadata: { manychat_subscriber_id: 12345, ig_username: "@juan_lopez" }
   }
        ↓
5. Setter ve la card en /crm/pipeline columna "Nuevo seguidor"
   Click "Abrir chat en ManyChat" → entra al inbox de ManyChat de Juan
        ↓
6. Setter le escribe en ManyChat: "Hola Juan, ¿quieres saber más?
   Reserva un slot aquí: https://ecoai.capitalhubapp.com/agenda?mc_id=12345"
   (ManyChat reemplaza automáticamente {{user_id}} con 12345)
        ↓
7. Juan clica el link, llega a /agenda?mc_id=12345
        ↓
8. /agenda parsea el parámetro mc_id=12345
   Busca contacts WHERE metadata->>'manychat_subscriber_id' = '12345'
   ENCUENTRA el contacto que ya existe.
        ↓
9. Juan rellena nombre/email/teléfono y reserva slot.
   El OS ACTUALIZA el contacto existente:
   - email: <el que puso>
   - phone: <el que puso>
   - stage: "agendado"
   - last_call_at: <fecha del slot>
   NO crea contacto nuevo. Es el mismo Juan.
```

## Notificación al gestor
Cuando un nuevo seguidor entra al CRM (paso 4), el sistema:
- Envía email al setter asignado a "nuevo_seguidor" (`owner_assignee`)
- Crea push notification en el panel del OS (badge rojo arriba)
- Si tiene ManyChat custom field "interes" → lo añade a metadata para contexto

## Limitación importante
Si la persona NO clica el link `?mc_id=12345` y va directo a `/agenda` (porque te dio el teléfono a parte, o lo encontró por Google), el OS NO sabe que es la misma persona. Hace match por email/teléfono después. **Solución:** ManyChat se configura para SIEMPRE generar links con `mc_id`, así casi todos los agenda traen el parámetro.

---

# Lo que falta construir (orden de prioridad)

1. **Webhook handler completo** `/api/webhooks/manychat` — recibe eventos y traduce a operaciones CRM
2. **Lookup por mc_id** en `/agenda` — al recibir reserva con `mc_id`, vincular al contacto existente
3. **Botón "Abrir chat en ManyChat"** en cards del CRM
4. **Custom field mapping** ManyChat → CRM (tags, interes, etc)
5. **Setup en panel ManyChat** — Adrián añade External Request en su Flow Builder apuntando a nuestro webhook

Los puntos 1-3 son código del OS. El 5 requiere acción en panel ManyChat por Adrián.

---

# Router del Webinar (reel → CRM → venta) · construido 2026-07-07

Automatización de **palabra clave en un reel** para el funnel del webinar. Marco creó en ManyChat la automatización "Quick Automation ES" (tipo `feed_comment_trigger`) + el flow "Auto-DM de links desde comentarios". Verificado en vivo por la API de ManyChat (getGrowthTools).

## Realidad de la API de ManyChat (verificado)
- La API **sí** deja leer (getInfo, getGrowthTools, getFlows, getTags, getCustomFields) y enviar.
- La API **NO** deja crear el disparador de comentario (growth tool): eso es UI-only en ManyChat. Lo crea Adrián/Marco a mano en el panel. No hay endpoint para ello ni para el admin.

## Qué se construyó en el OS (todo listo, plug-and-play)

| Pieza | Archivo | Qué hace |
|---|---|---|
| **Router del webinar** | `src/app/api/manychat/webinar-router/route.ts` | Recibe el comentario (External Request), lo **loguea** (`manychat_events`, para el conteo "comentaron"), **cachea** el suscriptor y **devuelve el link del webinar con `mc_id`** para el DM. **Comentar NO crea lead** (es solo una interacción): el contacto entra al pipeline **Webinar** como `lead` únicamente al rellenar el opt-in, vinculado por `mc_id`. Auth `Bearer MANYCHAT_WEBHOOK_SECRET`. |
| **mc_id en el opt-in** | `src/app/api/optin/webinar/route.ts` + `funnel-webinar/components/landing.tsx` | El link del DM lleva `?mc_id=<subscriber_id>`. El opt-in busca primero por `manychat_subscriber_id` → **no duplica** el contacto creado en el comentario; lo completa con email/teléfono. |
| **Sync cron** | `src/app/api/cron/manychat-sync/route.ts` + `vercel.json` (`23 */6 * * *`) | Cada 6h trae tags + custom fields de ManyChat a la caché y actualiza `api_connections.last_sync_at` (el dashboard deja de estar en cero). |
| **Panel "Del reel a la venta"** | `manychat/services/webinar-funnel.ts` + `components/webinar-funnel-panel.tsx` (en `/manychat` → Overview) | Embudo de la cohorte ManyChat del pipeline Webinar: Comentaron → Reservaron → Agendaron → **Alumnos** + facturado. |
| **Registro** | `api/admin/automations` | Entradas `manychat_webinar_router` + `manychat_sync` en el panel `/automatizaciones`. |

El recorrido: **comentar** = interacción rastreada (evento, conteo "comentaron"). El contacto entra al pipeline como `lead` **al rellenar el opt-in** (vinculado por `mc_id`), y de ahí sigue el recorrido que ya existía: `agendado` (webhook Calendly / form) → `alumno` (registro de venta) sobre el mismo `contacts`. Un comentario **nunca** es un lead.

## Estado de la conexión (2026-07-07, verificado)

Verificado en producción: **cero eventos reales han llegado nunca de ManyChat** (el único evento en `manychat_events` es un test del 5-may). ManyChat detecta el comentario y manda el auto-DM, pero **no avisa al OS**: falta añadir un paso **External Request** dentro del flow del reel que haga `POST` a `/api/manychat/webinar-router`. Sin ese paso, nada del router/dashboard recibe datos.

Esto es una **acción operativa pendiente**, no contenido de Knowledge: vive como **tarea en Operaciones** (el que tenga acceso al panel de ManyChat la ejecuta una vez). Aquí solo se documenta que la integración existe y cómo funciona; los pasos accionables no van en el Knowledge (REGLA: tareas → Operaciones, no `/docs`).

Mientras no se conecte, el reel funciona con el **link simple** en el DM (`https://ch.capitalhubapp.com/webinar?utm_source=instagram&utm_medium=manychat&utm_campaign=reel_webinar`): el lead entra al CRM al rellenar el formulario. Con el External Request, entra ya **desde el comentario** y se trackea el embudo completo.

## Cambios versionados
- **2026-07-07**: creado el router del webinar + mc_id dedup + sync cron + panel "Del reel a la venta" + registro en automatizaciones. Pendiente: Adrián añade el External Request en el flow del reel (pasos arriba).
