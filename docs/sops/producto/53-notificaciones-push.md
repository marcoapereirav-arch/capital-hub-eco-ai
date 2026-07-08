---
title: Notificaciones al equipo (in-app + push)
order: 53
---

# Notificaciones al equipo: in-app + PUSH

Pedido por Marco (2026-07-07): "que lleguen notificaciones push cada vez que entra un lead, agendan o hay venta". Antes cada endpoint hacía lo suyo (unos in-app, otros email, **ninguno push**), así que a Marco no le llegaba nada al móvil.

## Regla de raíz

**Todo evento importante avisa al equipo con UN solo helper.** Nada de que cada endpoint reinvente la notificación. El helper vive en `src/lib/notifications/notify-admins.ts`:

- `notifyAdmins(admin, { title, body, type, url?, data? })` → crea la notificación **in-app** (campana del OS) para todos los super_admins activos (excepto el bot de tests) **Y** manda **web-push** a todos sus dispositivos suscritos.
- `pushToUsers(admin, userIds, payload)` → solo push (para sitios que ya insertan su in-app, p.ej. el webhook de Calendly).
- Nunca lanza: si falla (VAPID, subs muertas) lo loguea pero no bloquea el flujo.
- **AWAIT obligatorio**: en funciones serverless (Vercel), sin `await` la función se congela antes de que el web-push salga. Igual que con Resend.

## Eventos cableados

| Evento | Endpoint | Notifica |
|---|---|---|
| **Lead** (webinar) | `POST /api/optin/webinar` | Nuevo lead creado → in-app + push |
| **Lead** (test personalidad) | `POST /api/optin/test-personalidad` | Nuevo lead creado → in-app + push |
| **Agenda** (Calendly) | `POST /api/webhooks/calendly` | `invitee.created/canceled/no_show` → in-app + email + push |
| **Agenda** (calendario propio) | `POST /api/calendar/book` | Reserva → email + in-app + push |
| **Venta** | `POST /api/admin/sales/register` | Venta registrada → email + in-app + push |

## Cómo funciona el push (infra ya existente)

- `push_subscriptions` (una fila por dispositivo suscrito, migración `0006_push_notifications`).
- `web-push` + VAPID (`NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`).
- Service worker `public/sw.js` muestra `{ title, body, data:{url}, tag }`; al pulsar navega a `data.url` (por defecto `/crm/pipeline`).
- Para RECIBIR push hay que haber aceptado el permiso en el dispositivo (prompt PWA o interruptor en `/perfil`).
- **Estado real de suscripciones (verificado en BD 2026-07-08)**: Marco tiene 6 dispositivos suscritos y funcionando. **Adrián tiene CERO** (la suscripción Win32 que se creía suya es de Juan Pablo, formador). Adrián tiene que entrar a `/perfil` → Notificaciones → Activar, en cada dispositivo donde quiera recibir push.
- **Regla de limpieza de suscripciones**: una suscripción SOLO se borra de BD si el push service responde 404/410 (ya no existe). Un fallo de red o un 400/401/403 (config VAPID) NO borra: antes se borraban suscripciones válidas en silencio y el usuario dejaba de recibir push para siempre.

## UI

- **Campana** (`NotificationsPanel.tsx`, montada en TopBar y MobileHeader): cada notificación es clicable → se marca leída y navega a `data.url`. Iconos por tipo (lead/venta/agenda en verde de marca, cancelaciones/no-show/alertas en rojo). Poll cada 30s + refresh al volver el foco + al abrir el panel. Tiempos relativos ("hace 5 min").
- **API**: `GET /api/admin/notifications` (lista, `?unread=true`), `PATCH` sin body = todas leídas, `PATCH { id }` = solo esa.
- **Interruptor push en `/perfil`** (`PushSettings.tsx`): activar/desactivar push del dispositivo actual, con estados para navegador sin soporte y permiso bloqueado. Es la vía visible si se cerró el prompt automático.
- **Prompt automático** (`PushNotificationPrompt.tsx`): "Ahora no" lo pausa 7 días (antes lo mataba para siempre y no había NINGUNA otra vía en la UI).
- **SIN emojis en las notificaciones** (títulos y cuerpos). REGLA #8 del SOP 04: prohibido añadir emojis sin consentimiento de Marco. La categoría visual la dan los iconos de la campana, no el texto.

## Destino del click (regla de Marco 2026-07-08)

**Al pulsar una notificación se va AL LUGAR donde ocurrió el evento**, no a un sitio genérico. `data.url` obligatorio en toda notificación in-app:

| Tipo | Destino |
|---|---|
| `lead` (opt-ins) y recurrentes | Ficha del contacto `/crm/contactos/{id}` |
| `venta` | Ficha del contacto `/crm/contactos/{id}` |
| `agenda` (calendario propio) y `calendly_*` | `/calendario` (ahí viven reservas y eventos Calendly) |
| `manual_stage_change` | Ficha del contacto `/crm/contactos/{id}` |
| `gcal_disconnected` | `/calendario` (ahí se reconecta Google Calendar) |
| Fallback si no hay contacto | `/crm/pipeline` |

## Preferencias por usuario (qué avisos llegan)

Cada usuario controla desde `/perfil` → Notificaciones qué GRUPOS de aviso recibe. Apagar un grupo lo apaga **en campana Y push, en todos sus dispositivos** (es preferencia de cuenta).

- Tabla `notification_preferences (user_id, pref, enabled)` con RLS (cada uno las suyas). **Sin fila = activado** (default ON); solo se guardan los cambios explícitos. Migración `20260708130000_notification_preferences`.
- Catálogo y mapeo tipo→grupo en `src/lib/notifications/prefs-catalog.ts`. Grupos: `lead`, `agenda`, `venta`, `crm_manual`, `sistema`.
- El server filtra destinatarios con `filterByNotificationPref(admin, userIds, type)` (en `notify-admins.ts`). `notifyAdmins` lo aplica solo; los inserts propios (Calendly, movimientos manuales, gcal, recurrentes) lo llaman antes de insertar/pushear.
- Un tipo NO mapeado en el catálogo se entrega SIEMPRE (mejor un aviso de más que perder uno). Al crear un tipo nuevo: mapearlo en el catálogo.
- API del usuario: `GET/PATCH /api/me/notification-prefs`.

## Para añadir un evento nuevo

1. `import { notifyAdmins } from "@/lib/notifications/notify-admins"`.
2. `await notifyAdmins(admin, { title, body, type, url })` en el punto del flujo (con AWAIT).
3. `url` = el LUGAR donde ocurrió el evento (ver tabla de destinos). Título SIN emojis.
4. Mapear el `type` nuevo a su grupo de preferencia en `prefs-catalog.ts`.
5. Registrar el evento en `/automatizaciones` (SOP 21) si es una automatización nueva.

## Requisitos para RECIBIR el push (importante)

- **`last_used_at` actualizado tras enviar = el push service (FCM/Apple) lo ACEPTÓ.** No garantiza que se muestre en pantalla; eso depende del dispositivo.
- **iPhone/iOS**: el push web SOLO funciona si la app está **añadida a la pantalla de inicio** (PWA instalada, iOS 16.4+) y con notificaciones permitidas. Abierta en Safari suelto NO llega, aunque el servidor la mande. Si Marco dice "no me llega en el iPhone", primero verificar que la tiene instalada en la pantalla de inicio.
- Cada dispositivo/navegador es una fila distinta en `push_subscriptions`. Un usuario puede tener varias; el envío va a todas. Una suscripción recién creada NO recibe pushes enviados ANTES de existir.

## Aprendizajes (no repetir)

- **Verificar lo que VE el usuario, no solo el lado del envío.** Que el push salga (`sent>0`) o que la fila in-app exista NO es lo mismo que Marco lo vea. La campana (`/api/admin/notifications`) filtra por `user_id`; si no hay filas para ese user, muestra "Sin notificaciones".
- **NO borrar la prueba que el usuario necesita ver.** Al verificar notificaciones se borraron las de prueba "para no ensuciar" → el panel de Marco quedó vacío y parecía roto. Si el usuario va a mirar el resultado, dejar una notificación real persistente o no borrarla hasta que la confirme. Los contactos/leads de test sí se limpian; las notificaciones que el usuario quiere ver, no.

## Cambios versionados

- **2026-07-07**: creación del helper central `notifyAdmins`/`pushToUsers`. Cableado en lead (2 opt-ins), agenda (Calendly + calendario propio) y venta. Antes no salía ningún push.
- **2026-07-08**: documentado requisito iOS (PWA instalada) + aprendizaje "verificar lo que ve el usuario / no borrar la notificación de prueba". Verificado en vivo: push entregado a los 6 dispositivos de Marco.
- **2026-07-08 (2ª pasada, endurecimiento + UI)**: (1) `pushToUsers` ya solo borra suscripciones en 404/410 y loguea el resto de fallos; antes un fallo de red borraba suscripciones válidas. (2) `notifyAdmins` loguea errores del insert in-app (antes se tragaban en silencio). (3) Notifs de Calendly y movimientos manuales llevan `data.url`. (4) Campana: items clicables (marcan leída + navegan), iconos por tipo, poll 30s, `PATCH { id }` para marcar una sola. (5) Sección Notificaciones en `/perfil` con interruptor push por dispositivo. (6) Prompt "Ahora no" pausa 7 días en vez de para siempre. (7) Eliminada ruta muerta `/api/notifications/send` (sin callers). (8) Corregido dato del SOP: Adrián NO estaba suscrito (la sub Win32 era de Juan Pablo, formador).
- **2026-07-08 (3ª pasada, feedback Marco)**: (1) SIN emojis en ninguna notificación (nueva REGLA #8 en SOP 04); barrido en los 8 puntos de emisión. (2) El click lleva AL LUGAR del evento (tabla de destinos): lead/venta/movimiento manual a la ficha del contacto, agenda/Calendly/gcal a `/calendario`. (3) Preferencias por usuario: tabla `notification_preferences` + toggles en `/perfil` por grupo (lead, agenda, venta, crm_manual, sistema); el server filtra destinatarios en campana Y push; sin fila = activado.
