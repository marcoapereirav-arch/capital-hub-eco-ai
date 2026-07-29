---
title: Sistema visual — hub de sistemas y workflows
order: 56
---

# Sistema visual (hub)

**Sección propia del OS** (menú Marketing) donde vive el paso a paso visual de cada sistema,
estrategia o workflow que montamos. No es una sola página con un diagrama: es un **hub** con
tarjetas; cada tarjeta abre su sistema por dentro, como un tablero.

Decidido con Marco (2026-07-29): "Sistema visual no es una página donde solo está el sistema
visual, sino un hub donde van a estar todos los sistemas y estrategias que vayamos creando; le
clicas y ahí se abre el sistema visual". El board de cada sistema debe verse **como un Miro**:
cajas conectadas con flechas, detallado, que se vea qué pasa en la landing, a dónde va y cómo se
conecta con el correo.

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
| `/sistemas/<slug>` | Board visual de ese sistema. |
| `/sistemas/webinar` | **Board del Funnel del Webinar** (estilo Miro, detallado). |

- Registro de sistemas: `src/features/sistemas/lib/systems.ts` (`SISTEMAS`, `getSistema`).
- Hub: `src/features/sistemas/components/sistemas-hub.tsx`.
- Board del webinar: `src/features/sistemas/components/webinar-workflow.tsx`.
- Rutas: `src/app/(main)/sistemas/page.tsx` + `src/app/(main)/sistemas/[slug]/page.tsx`.

> El sistema "end-to-end" antiguo (`src/features/sistema/`) se **eliminó** (Marco, 2026-07-29:
> "en el hub solo debe haber uno, el último; el antiguo fuera"). Si hace falta otra vez, se
> reconstruye como un board más dentro del hub.

## Cómo añadir un sistema nuevo

1. Añadir una entrada en `SISTEMAS` (`systems.ts`): `slug`, `title`, `tagline`, `meta`, `status`, `icon`, `accent`.
2. Crear su board y enchufarlo en `src/app/(main)/sistemas/[slug]/page.tsx` (map por slug).

Nada más: la tarjeta aparece sola en el hub.

## El board del Funnel del Webinar (destacado)

`/sistemas/webinar` es un **tablero estilo Miro**: cajas conectadas con flechas y etiquetas que
muestran, al detalle, el flujo completo:

`Tráfico → Landing (titular + mini-VSL + formulario) → {Página de gracias  ·  Correo de
confirmación en paralelo} → Escribe por WhatsApp (punto de éxito) → Se nutre en el chat →
Webinar en directo`.

- Muestra **quién hace qué** (sistema automático · equipo · Adrián) con una leyenda.
- La **fecha, el tag y los ajustes salen de los datos REALES del funnel** (`getWebinarSettings()`
  → `webinarTagName()`, `whatsappMessage`, `emailWhatsappEnabled`), así lo que se ve coincide
  siempre con lo que pasa de verdad (misma fecha, mismo tag `whatsapp-webinar-DD_MM_YYYY`,
  correo con/sin WhatsApp según el interruptor).
- El punto de éxito (escribir por WhatsApp) va marcado; después, se nutre a la persona **dentro
  del chat** (nada de grupo/sorteo). Detalle del funnel: SOP `marketing/08`.

## Diseño

Brandkit Capital Hub: base monocromo + verde de acento (`#22C55E`), animaciones de entrada,
respeta `prefers-reduced-motion`. Mobile-first (el board se desplaza/pan en pantallas estrechas,
como Miro). Sigue la regla de diseño dinámico/WOW (SOP producto/48) y el patrón de página del OS
(ShellHeader no-op + PageContainer).
