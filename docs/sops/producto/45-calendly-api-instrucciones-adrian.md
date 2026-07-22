---
title: Calendly API — instrucciones para Adrián
order: 45
area: producto
---

# Calendly API — integración temporal urgente

Mientras se termina el calendario propio (proyecto pausado `proj_880_calendario_propio`), integramos Calendly API directamente. **Sin agenda no hay venta → sin venta no hay alumno → sin alumno no hay producto que probar**. Prioridad máxima.

## Lo que necesito de Adrián (todo en .env.local, JAMÁS por chat)

### 1. Plan Calendly correcto
- Calendly **Standard** o superior (mínimo para API + Webhooks)
- Verificar en https://calendly.com/app/admin/billing
- Si tiene plan free → upgrade a Standard ($12/mes)

### 2. Personal Access Token de Calendly
- Login en https://calendly.com
- Ir a **Account → Integrations & Apps → API & Webhooks**
- En la sección "Personal Access Tokens" → **Create New Token**
- Nombre: "Capital Hub OS"
- Copy del token (`eyJ...` formato JWT)
- **Añadir a `.env.local`** como:
  ```
  CALENDLY_ACCESS_TOKEN=eyJ...
  ```

### 3. Identificar Event Types relevantes
- Listar todos los event types activos en `https://calendly.com/event_types/user/me`
- Marcar cuáles son los que vamos a sincronizar al CRM (típicamente "Sales Call 30min")
- Compartir las URLs públicas (ej. `https://calendly.com/adrianvilla/sales-call-30min`)

### 4. Verificar conexión Google Calendar
- En Calendly: **Integrations → Google Calendar** debe estar conectado
- Eso asegura que cuando alguien agende, el evento aparece en su Google Calendar (con Meet link generado por Google)
- Sin esto el booking llega al CRM pero no hay reunión real

### 5. Datos del booking
Confirmar qué campos se piden al lead al agendar:
- Nombre ✅ obligatorio
- Email ✅ obligatorio
- Teléfono ← debe añadir como pregunta custom required
- Instagram handle ← útil para vincular con ManyChat
- Cualquier otra pregunta clave para el CRM

## Lo que yo (Marco / Claude) hago después

### Backend
- `POST /api/webhooks/calendly` — escucha 3 eventos:
  - `invitee.created` → crea/actualiza `contacts` (stage `booked`) + `calendar_bookings` + `contact_journey_events` tipo `call_booked`
  - `invitee.canceled` → marca booking canceled + notifica
  - `invitee.no_show` → marca contact stage `no_show` + email retargeting
- Verificación de firma con `CALENDLY_WEBHOOK_SIGNING_KEY`
- `GET /api/calendly/event-types` — lista cached para configurar
- `GET /api/calendly/sync` — sync inicial de bookings existentes

### Frontend
- Sección `/calendario` en el OS muestra bookings reales sincronizados
- Link público de Calendly embebido o redirección desde `/agenda?source=ig&mc_id=<id>`
- Tracking UTM mantenido via query params

### BD
- Reutilizamos `calendar_bookings` (ya existe) con columna nueva `source = 'calendly'` y `external_id` para idempotencia

## Configurar webhook en Calendly

Una vez tengamos el endpoint deployado:
1. Adrián entra a https://calendly.com/app/admin/integrations/api_webhooks
2. **Create Webhook Subscription**
3. URL: `https://os.capitalhubapp.com/api/webhooks/calendly`
4. Events: `invitee.created`, `invitee.canceled`, `invitee.no_show_marked`
5. Copy del **Signing Key** generado
6. Añadir a `.env.local` como:
   ```
   CALENDLY_WEBHOOK_SIGNING_KEY=...
   ```

## Variables de entorno final

```
CALENDLY_ACCESS_TOKEN=eyJ...
CALENDLY_WEBHOOK_SIGNING_KEY=...
CALENDLY_USER_URI=https://api.calendly.com/users/...     # se obtiene una vez con el token
```

## Plan de migración futuro

Calendly API es **temporal**. El plan a largo plazo es:
1. Tener Calendly API funcionando AHORA (próxima semana)
2. Terminar el `proj_880_calendario_propio` (calendario propio) cuando haya bandwidth
3. Migrar usuarios al calendario propio sin downtime cuando esté listo
4. Cancelar suscripción Calendly

## Checklist Adrián (resumen TL;DR)

- [ ] Plan Calendly Standard activo
- [ ] Personal Access Token generado y pegado en .env.local
- [ ] Event Types activos + URL pública identificados
- [ ] Google Calendar conectado en Calendly
- [ ] Pregunta custom "Teléfono" añadida como required al booking form
- [ ] Pregunta custom "Instagram handle" añadida (opcional)
- [ ] Webhook subscription creada (cuando endpoint deployado) + signing key en .env.local

## Decisiones tomadas

- **2026-06-17:** Marco re-prioriza Calendly arriba del todo, pausa calendario propio, deja Calendly como integración temporal urgente.
- **2026-06-17:** Pausado `proj_880_calendario_propio` con `status='paused'`. Se reactivará cuando bandwidth lo permita.

## 2026-06-26 — Embed del funnel /reservar: rendimiento, scroll y marca

Mejoras aplicadas en `booking-embed.tsx` + `reservar/page.tsx`:

- **Carga más rápida:** en el `<head>` de `/reservar` → `preconnect` a `assets.calendly.com` y `calendly.com` + `preload` del `widget.js`. El navegador conecta y baja el script de Calendly cuanto antes.
- **Sin scroll interno en móvil (fix del scroll atrapado):** escuchamos el `postMessage` `calendly.page_height` (Calendly manda la altura real del contenido, p.ej. `1083px`) y ajustamos el alto de la tarjeta a esa altura. Así el iframe NO necesita scroll propio → la página baja de corrido. Verificado: `holder=iframe=1083px`, página scrollea entera.
- **Loader de marca** (`<LoadingScreen/>`) mientras carga, en vez del spinner genérico. Se quita al recibir el primer `page_height`.
- **Diseño** alineado al funnel Test: logo de marca (mayúsculas espaciadas como el OS), copy en Inter normal, verde de acento.

### Pendiente de Adrián — quitar "Desarrollado por Calendly"
El banner "Desarrollado por Calendly" va DENTRO del iframe de Calendly; no se puede quitar desde nuestro código (cross-origin). Adrián lo desactiva desde su cuenta:
**Calendly → Account / Admin Management → Settings → "Remove Calendly branding"** (o en el evento: Share → Add to website → opción de quitar branding). Requiere plan de pago (Standard/Teams). Una vez activado, el banner desaparece en el embed sin tocar nada más.
