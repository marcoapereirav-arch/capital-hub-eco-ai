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

---

## 2026-08-07 · Diez días perdiendo llamadas en silencio

### Qué pasó

Del **27 de julio al 7 de agosto no entró ni una reserva al OS**. En Calendly había 12 (luego 14); en el OS, 5. Faltaban 7 personas reales, con llamadas ese mismo día y el siguiente. Nadie recibió aviso y en Calendly la conexión seguía marcada como sana.

### La causa raíz

`src/app/api/webhooks/calendly/route.ts` **devolvía 200 aunque no hubiera guardado nada**:

- si el mensaje no traía `scheduled_event`, hacía `return { ok: true, skipped: true }`
- el `catch` final devolvía 200 con el error dentro

Calendly daba la entrega por buena, **no reintentaba**, y no saltaba ninguna alarma. Un fallo mudo.

### Lo que se arregló

- **`scripts/calendly-backfill.mjs`**: trae de Calendly todo el histórico. **No manda ni un correo ni una notificación** (decisión de Marco: las llamadas ya estaban agendadas, avisar era ruido). Solo la agenda de venta toca el CRM, y solo si la llamada sigue viva (30 días).
- **Se guardan las 9 respuestas del formulario.** El teléfono **no** viene en `text_reminder_number` (llega null): está en `questions_and_answers`, en la pregunta "Teléfono (con prefijo de tu país)". El Instagram, en "@ de instagram". Se buscan por texto con tolerancia, nunca por posición.
- **`calendly_event_types.purpose`** (`venta` / `onboarding` / `personal` / `sin_clasificar`): en la cuenta hay tres agendas y solo la de venta cuenta en los números. Una agenda nueva entra sin contar hasta clasificarla.
- **`calendly_webhook_log`**: registro crudo de todo lo que entra, incluido lo rechazado por firma.

### Datos verificados de la cuenta

| | |
|---|---|
| Zona horaria de la cuenta de Adrián | **Asia/Dubái** (no España) |
| Asientos de Calendly | 1 |
| Agenda de venta | "Sesión de orientación profesional" |
| Suscripción webhook | activa, ámbito organización, 3 eventos |

**Ojo con la zona:** la cuenta va en Dubái y el negocio en Madrid. Toda hora que se enseñe se convierte antes (REGLA #23 del protocolo del agente).

### Pendiente

Endurecer el receptor para que **deje de devolver 200 cuando falla**: registrar el fallo, contestar 500 para que Calendly reintente (lo hace 24 h) y avisar al equipo.

### 2026-08-08 · El receptor deja de mentir (arreglo de raíz)

`src/app/api/webhooks/calendly/route.ts` reescrito. Las tres reglas que ahora cumple:

1. **Todo lo que entra queda registrado** en `calendly_webhook_log` antes de procesarse, incluido lo rechazado por firma. Sin registro se investiga a ciegas, que es lo que pasó.
2. **Si algo falla al guardar, responde 500.** Calendly reintenta durante 24 horas y salta un aviso al equipo (como mucho uno por hora, para no hacer ruido). **Nunca se responde 200 sin haber guardado.**
3. **Lo que legítimamente no interesa responde 200 con `ignored`.** Esa distinción evita una tormenta de reintentos por algo que da igual.

Además: guarda las 9 respuestas del formulario, rellena teléfono e Instagram del contacto **solo si están vacíos**, y **solo la agenda de venta toca el CRM**. Los avisos y el correo van después de guardar y en su propio `try`: si falla un correo, la reserva ya está guardada y Calendly no debe reintentarla.

**Regla derivada:** un `catch` que devuelve 200 es un fallo mudo. En cualquier receptor de webhooks, un fallo se responde con error.

---

## 2026-08-08 · El parte diario

Tabla `setter_daily_reports`, **una fila por persona y día** (lo garantiza el `UNIQUE (profile_id, report_date)`, no la pantalla).

- Se rellena desde el **botón verde** del OS, que ahora abre un menú: **Registrar venta** o **Parte del día**. Cada rol ve lo suyo: super_admin las dos, closer solo la venta, setter solo el parte.
- Cuatro números: conversaciones nuevas abiertas, follow-ups nuevos, ofertas de llamada tiradas y llamadas agendadas.
- Si se vuelve a abrir el mismo día, **los números salen ya escritos** y se corrigen encima. La pantalla lo dice.
- El día es el de **Europe/Madrid**, no el de UTC: si no, a partir de las 22:00 el parte se iría al día siguiente.
- **Sin avisos al móvil** (Marco los quitó expresamente).
- `profile_id` sale **siempre de la sesión**, nunca del cuerpo de la petición. Si no se puede comprobar el permiso, es un NO.

Endpoint: `src/app/api/setter/report/route.ts`. Pantalla: `src/features/setter/components/parte-diario-modal.tsx`.
