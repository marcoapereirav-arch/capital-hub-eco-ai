---
title: Sistema visual — hub de sistemas y workflows
order: 55
---

# Sistema visual (hub)

**Sección propia del OS** (menú Marketing) donde vive el paso a paso visual de cada sistema,
estrategia o workflow que montamos. No es una sola página con un diagrama: es un **hub** con
tarjetas; cada tarjeta abre su sistema por dentro.

Decidido con Marco (2026-07-29): "Sistema visual no es una página donde solo está el sistema
visual, sino un hub donde van a estar todos los sistemas y estrategias que vayamos creando; le
clicas y ahí se abre el sistema visual".

## Por qué se movió a `/sistemas`

Antes vivía en **`/webs/sistema`**. Como la URL empezaba por `/webs`, el OS lo agrupaba bajo
"Webs" (el título de la barra superior y el activo del sidebar lo marcaban como Webs). Al ser
su **propia ruta `/sistemas`**, esa relación desaparece de raíz.

- `/webs/sistema` → **redirige** a `/sistemas` (no rompe enlaces antiguos).
- Nav (`nav-config.ts`), permisos (`role-access.ts`, `api/admin/role-permissions`) apuntan a `/sistemas`.

## Rutas y archivos

| Ruta | Qué es |
|---|---|
| `/sistemas` | Hub: portada con una tarjeta por sistema. |
| `/sistemas/<slug>` | Vista visual de ese sistema. |
| `/sistemas/webinar-08` | **Workflow del funnel del webinar del 8** (paso a paso, muy visual). |
| `/sistemas/end-to-end` | Sistema end-to-end del negocio (captación → cierre → alumno). |

- Registro de sistemas: `src/features/sistemas/lib/systems.ts` (`SISTEMAS`, `getSistema`).
- Hub: `src/features/sistemas/components/sistemas-hub.tsx`.
- Workflow webinar: `src/features/sistemas/components/webinar-workflow.tsx`.
- Rutas: `src/app/(main)/sistemas/page.tsx` + `src/app/(main)/sistemas/[slug]/page.tsx`.
- End-to-end (reutilizado): `src/features/sistema/components/sistema-page.tsx`.

## Cómo añadir un sistema nuevo

1. Añadir una entrada en `SISTEMAS` (`systems.ts`): `slug`, `title`, `tagline`, `meta`, `status`, `icon`, `accent`.
2. Crear su componente visual y enchufarlo en `src/app/(main)/sistemas/[slug]/page.tsx` (map por slug).

Nada más: la tarjeta aparece sola en el hub.

## El workflow del webinar (destacado)

`/sistemas/webinar-08` muestra CADA punto del funnel del 8 y **quién lo hace** (sistema
automático vs. equipo vs. Adrián). La **fecha y el tag salen de los ajustes REALES del funnel**
(`getWebinarSettings()` → `webinarTagName()`), así lo que se ve coincide siempre con lo que pasa
de verdad (misma fecha, mismo tag `whatsapp-webinar-DD_MM_YYYY`). El punto de éxito (tocar
WhatsApp) va marcado; después, se nutre a la persona **dentro del chat** (nada de grupo/sorteo).
Detalle del funnel: SOP `marketing/08`.

## Diseño

Brandkit Capital Hub: base monocromo + verde de acento (`#22C55E`), animaciones de entrada,
hover con elevación, respeta `prefers-reduced-motion`. Mobile-first. Sigue la regla de diseño
dinámico/WOW (SOP producto/48) y el patrón de página del OS (ShellHeader no-op + PageContainer).
