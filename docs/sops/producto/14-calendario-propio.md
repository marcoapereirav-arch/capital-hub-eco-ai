---
title: Calendario propio · agenda pública + admin
order: 14
area: producto
---

# Calendario propio — agenda pública + admin

Reemplazo de Calendly. Sistema interno donde Adrián publica disponibilidad y los leads reservan llamadas Zoom.

## Dos lados

### 1. Pública `/agenda`
URL: `https://ecoai.capitalhubapp.com/agenda`

Para el lead. Muestra los slots disponibles que tiene Adrián las próximas 2 semanas.

Flujo del lead:
1. Entra a `/agenda` (no requiere login)
2. Ve calendario con días disponibles (verde) y no disponibles (gris)
3. Click un día → ve los huecos de 30 min disponibles
4. Click un hueco → formulario corto:
   - Nombre completo
   - Email
   - Teléfono
   - Notas (qué te interesa, dónde estás, etc)
5. Submit → confirmación inmediata + email + .ics descargable + link Zoom

### 2. Admin `/calendario`
URL: `https://ecoai.capitalhubapp.com/calendario`

Para Adrián / equipo. 3 tabs:

- **Bookings** — lista de reservas próximas y pasadas. Click en una → drawer con detalle del lead, link al contacto, botón cancelar, botón marcar como attended/no_show.

- **Disponibilidad** — Adrián define qué horas trabaja cada día de la semana. Ej: L-V 10:00-14:00 y 16:00-19:00. Excepciones puntuales (vacaciones, días bloqueados) con `calendar_blocked_slots`.

- **Configuración** — duración slot (30 min default), buffer entre llamadas, URL Zoom personal, **conexión Google Calendar** (botón Conectar/Desconectar).

## Cómo se calcula disponibilidad pública

Para cada hueco potencial el sistema verifica:
1. ¿Está dentro de las horas definidas en `calendar_availability_rules`?
2. ¿NO está en `calendar_blocked_slots` ese día/hora?
3. ¿NO hay ya un booking activo en `calendar_bookings` con ese slot?
4. ¿Respeta el buffer mínimo (15 min default) con bookings adyacentes?

Si todas las respuestas son sí → hueco visible al lead.

## Integración Google Calendar de Adrián

Cuando Adrián conecta su Google vía OAuth (one-click), el sistema guarda:
- `google_oauth_refresh_token` (indefinido si app Google Cloud está In production)
- `google_oauth_access_token` (renovado cada hora)
- `google_oauth_email` (su email)

Después, cada vez que un lead reserva:
1. Se crea booking en BD
2. Sistema usa el refresh_token para obtener access_token fresh
3. Llama Google Calendar API → crea evento en su calendar
4. El evento incluye: título, descripción con datos del lead, lugar (Zoom URL), email Adrián como organizer

Si Adrián cancela en su Google Calendar, el sistema NO lo detecta (no hay sync entrante). Lo correcto es cancelar desde `/calendario`.

## Cron de salud

`gcal_health_check` corre cada hora. Si el refresh_token deja de funcionar (revocado, caducado, etc):
- Marca como desconectado en BD
- Envía email a Marco y Adrián
- Crea push notification en el OS (badge rojo)

## Emails automáticos al lead

1. **Inmediato tras reserva:** confirmación + .ics + link Zoom
2. **24h antes:** recordatorio
3. **Si no asiste:** email de retargeting + nuevo link a /agenda
4. **Tras llamada (vendió):** email magic link a la App

## Tablas BD
- `calendar_bookings` — reservas activas y pasadas
- `calendar_availability_rules` — horario semanal de Adrián
- `calendar_blocked_slots` — excepciones puntuales
- `calendar_owners` — Adrián con sus OAuth tokens (NUEVA, fuente verdad)
- `calls_availability` — legacy MIFGE, sincronizada por compat

## Configuración OAuth Google Cloud
- Proyecto: "Capital Hub Productions" en Google Cloud Console
- Cuenta dueña: adrianvillanuevarios@gmail.com
- Status: **In production** (refresh tokens indefinidos)
- Scopes: calendar.events + userinfo.email + openid
- Redirect URI: https://ecoai.capitalhubapp.com/api/admin/google-calendar/callback
- Client ID + Secret: en Vercel envvars (GOOGLE_OAUTH_CLIENT_ID, GOOGLE_OAUTH_CLIENT_SECRET)

## Variables que pueden romperlo
- Adrián revoca permisos en myaccount.google.com/permissions → cron detecta + alerta
- App Google Cloud pasa a Testing mode → refresh tokens caducan 7 días
- Cuenta personal eliminada/suspendida
- Cambio password Google a veces invalida (raro)

## Verificación rápida
- `/calendario` > Configuración → debe poner "Conectado (adrianvillanuevarios@gmail.com)" en verde
- Cron jobid 5 en pg_cron está activo
- `select * from calendar_owners where id='adrian'` debe tener `google_oauth_refresh_token IS NOT NULL`
