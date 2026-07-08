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
- Para RECIBIR push hay que haber aceptado el permiso en el dispositivo (prompt PWA). Marco y Adrián ya están suscritos.

## Para añadir un evento nuevo

1. `import { notifyAdmins } from "@/lib/notifications/notify-admins"`.
2. `await notifyAdmins(admin, { title, body, type, url })` en el punto del flujo (con AWAIT).
3. Registrar el evento en `/automatizaciones` (SOP 21) si es una automatización nueva.

## Cambios versionados

- **2026-07-07**: creación del helper central `notifyAdmins`/`pushToUsers`. Cableado en lead (2 opt-ins), agenda (Calendly + calendario propio) y venta. Antes no salía ningún push.
