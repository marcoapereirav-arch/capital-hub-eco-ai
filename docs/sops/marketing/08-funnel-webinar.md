---
title: Funnel Webinar semanal (opt-in → WhatsApp → agenda)
order: 8
---

# Funnel Webinar semanal

Canal de captación por **webinar en directo**. Decidido en la reunión Marco/Adrián del 6-jul-2026. Primer directo de prueba **viernes 10 jul**; después, **recurrente los miércoles**.

Es una estrategia estándar de webinar (la usan cientos de negocios), no una copia de nadie.

## El flujo end-to-end

```
Landing OPT-IN  →  Página de GRACIAS  →  Grupo WhatsApp  →  Webinar (Zoom)  →  Agenda llamada  →  Venta → Alumno
   /webinar          /webinar/gracias      (link editable)     (link en el grupo)   /reservar (Calendly)
```

1. El lead llega a **`/webinar`** (hostname `ch` → `ch.capitalhubapp.com/webinar`).
2. Opt-in: **nombre + email + teléfono** (los 3 obligatorios) → `POST /api/optin/webinar`.
3. Redirige a **`/webinar/gracias`** con botón grande **"Entrar al grupo de WhatsApp"**.
4. En el grupo se suelta el **link del Zoom** del directo y los avisos (acción manual).
5. En el webinar, el CTA lleva al **funnel de agendar** (`/reservar`, con el Calendly embebido).
6. Al agendar → el webhook de Calendly mueve el contacto a **Agendado**. Al pagar → registro de venta lo mueve a **Alumno** + acceso.

## Qué hace el opt-in (`/api/optin/webinar`)

Clon del de `test-personalidad` (ver SOP 07), cambiando el contexto al webinar:

- Upsert de contacto por email → `stage='lead'` si es nuevo; **no degrada** si ya estaba avanzado (avisa al equipo).
- Pipeline contextual **`webinar`** (slug). Se **preserva** el `pipeline_id` si el contacto ya tenía uno.
- Tags `origen:webinar` + `fuente:<utm_source>` (atribución **first-touch**).
- `contact_journey_events` tipo `optin_webinar`.
- **Email de confirmación** con el link del grupo de WhatsApp (template `optin_webinar`, editable/pausable en `/email-marketing`). Solo se envía si el grupo está configurado.
- Meta Pixel + CAPI: evento `webinar_lead` + estándar `Lead`.

## Pipeline

Pipeline `webinar` (migración `20260706120000_pipeline_webinar.sql`), espejo de `test-personalidad`:
`lead → agendado → seguimiento → alumno → no_show → perdido`. Así el webhook de Calendly y `resolveAutoStage` (guarda no-retroceso) funcionan sin cambios.

## Config editable (sin deploy)

Desde el **⚙️ de `/webs`** (funnel "Funnel Webinar semanal"), key `app_settings → funnel:webinar`:

| Campo | Qué es |
|---|---|
| `whatsapp_group` | **Link del grupo de WhatsApp** (chat.whatsapp.com/...). Es el botón de la gracias. Vacío = "el grupo se abre en breve". |
| `date_label` | Fecha/hora que se muestra en la landing. Ej: "Viernes 10 de julio · 19:00h". |
| `reservar_url` | A dónde lleva el CTA de agendar. Por defecto `/reservar`. |
| `instagram` | Usuario IG de Adrián (pie/soporte). |

Defaults en `src/features/funnel-webinar/config.ts`. Resolución server-only en `get-settings.ts` (nunca rompe: si la BD falla, usa defaults).

## Acción humana pendiente (bloqueante para el email + botón)

- **Crear el grupo de WhatsApp** y pegar su link en el ⚙️ de `/webs` (Adrián). Hasta entonces la gracias muestra "el grupo se abre en breve" y el email no se envía.
- Escribir a **Mark Boy** para recuperar el grupo de WhatsApp de ~400 personas (lanzamiento "Reto mil euros").
- Escribir el **guion del webinar**.

## Copy aprobado (no inventar)

- Promesa hero: *"Cómo dejar tu trabajo y vivir de internet ganando entre 2.000 € y 4.000 € al mes en menos de 90 días."*
- Sección **bolsa de trabajo garantizada por contrato** (empresas nos contactan cada semana buscando perfiles).
- Sección **"La habilidad que me dio la libertad"** = historia real de Adrián, como sección abierta con scroll (reutilizada del `BioModal` del LT8, no como pop-up).

## Archivos

- Feature: `src/features/funnel-webinar/` (config, get-settings, components/landing, components/thank-you).
- Rutas: `src/app/(public)/webinar/page.tsx` + `webinar/gracias/page.tsx`.
- Endpoint: `src/app/api/optin/webinar/route.ts`.
- Meta: `webinar_lead` en `capi-client.ts` (CapiEventName), `api/meta/capi/track` (ALLOWED_EVENTS), `ads-events-service.ts` (KNOWN_EVENTS + label).
- Manifest editable: `src/features/webs/lib/funnel-settings-manifest.ts` (`webinar`).
- Panel: automatización `webinar_optin` en `api/admin/automations/route.ts` (SOP producto/21).

## Cambios versionados

- **2026-07-06**: creación del funnel webinar (reunión Marco/Adrián). Pipeline `webinar`, landing+gracias, opt-in con email, Meta `webinar_lead`, registro en `/webs` y en el panel de automatizaciones.
