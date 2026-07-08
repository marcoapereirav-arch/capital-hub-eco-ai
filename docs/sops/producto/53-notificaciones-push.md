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
