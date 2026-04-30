---
title: Emails transaccionales del funnel MIFGE
order: 3
---

# Emails MIFGE — qué se manda, cuándo, por qué

Sistema de emails transaccionales que dispara el funnel automáticamente. Provider: **Resend** (cuenta de Adrián). Templates en **React Email**. Triggers: webhooks Whop + APIs internas + cron jobs.

**Cero envíos manuales.** Todo automático.

## Los 13 emails

| # | Trigger automático | Asunto sugerido | Tipo | Notas |
|---|---|---|---|---|
| 1 | Webhook Whop `membership_activated` MES | 🎉 Tu prueba gratuita está activa | Crítico | Incluye acceso a App Capital Hub + CTA agendar llamada |
| 2 | Webhook Whop bonus product | ✓ Bonus Bundle Express activado | Operativo | Solo si compró el order bump |
| 3 | Webhook Whop `membership_activated` AÑO | 🎉 Bienvenido al plan anual | Crítico | Distinto de #1: agradecimiento + privilegios anuales |
| 4 | POST `/api/mifge/calls/book` | ✓ Tu llamada con Adrián está confirmada | Crítico | Fecha/hora + cómo prepararse + .ics |
| 5 | Cron 24h antes del slot | Mañana hablamos — preparación | Crítico | Recordatorio + link al meet |
| 6 | Cron 1h antes del slot | En 1h tu llamada | Operativo | Reminder corto + link directo |
| 7 | Cron día +5 si NO agendó | Te quedan 9 días — ¿agendamos? | Crítico | CTA agendar + valor de la sesión |
| 8 | Cron día +12 (2 días antes cobro) | Tu trial termina en 48h | Crítico | Avisar de cobro + opción cancelar |
| 9 | Webhook Whop `invoice_paid` recurrente MES | ✓ Acceso completo activado | Operativo | Confirmación de cobro 97€ |
| 10 | Webhook Whop `membership_deactivated` | La puerta queda abierta | Retargeting | Mensaje breve + tracking para retargeting Meta |
| 11 | Webhook Whop `invoice_past_due` | Problema con tu pago — actualiza | Crítico | Link para actualizar tarjeta, urgencia |
| 12 | Cron 1h post-slot sin Fathom | No te vimos hoy — reagendemos | Operativo | Solo si no-show, link reagendar |
| 13 | Auto al detectar Fathom + cliente activo | Resumen de tu plan personalizado | Crítico | Post-llamada follow-up con upsell anual |

## MVP mínimo viable (5 emails)

Si vamos extremadamente rápidos, los 5 imprescindibles para lanzar:

1. **#1 Bienvenida activación trial** — sin esto el cliente no sabe que tiene acceso
2. **#4 Confirmación llamada agendada** — confianza/UX básica
3. **#5 Recordatorio 24h pre-call** — show-rate
4. **#8 Trial termina en 48h** — transparencia legal sobre el cobro
5. **#11 Pago fallido** — recuperación de revenue

Los 8 restantes se añaden iterando sin bloquear el lanzamiento.

## Reglas

- Todos los emails se envían desde el dominio verificado en Resend (pendiente: confirmar `from` con Adrián, propuesta `hola@capitalhub.com`).
- Todos llevan link de baja en footer (RGPD).
- Templates en React Email para que sean responsive y se rendericen bien en Gmail/Outlook/Apple Mail.
- El `lead_id` se incluye en query de cada CTA para tracking interno.

## Cambios versionados

- **2026-04-30** (v1): definidos 13 emails + MVP de 5. Pendiente: copy específico de cada uno.
