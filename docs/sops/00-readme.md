---
title: Knowledge — Capital Hub OS
order: 0
---

# Knowledge — Capital Hub OS

Esta carpeta es la **fuente única de verdad operativa** del proyecto. Cada decisión arquitectónica, estratégica, de copy, de pricing, de pipeline — se versiona aquí.

Si una decisión no está aquí, **no existe**. Si está aquí, es la versión vigente.

## Reglas

- Todos los `.md` en este directorio se renderizan en `/knowledge` del OS (la ruta actualmente se llama `/sops` y será renombrada a `/knowledge` por consistencia).
- Cada archivo tiene frontmatter con `title` y `order` (orden de aparición en el sidebar).
- Las decisiones se versionan al final de cada archivo en sección "Cambios versionados" con fecha.
- Las versiones antiguas se conservan, no se reescriben — el histórico importa.

## Índice

| # | Documento | Qué contiene |
|---|---|---|
| 01 | [Board y sistema de tareas](01-board-y-sistema-tareas.md) | Cómo funciona el sistema GTD+PARA, el board, los stages, la regla auto-sync |
| 02 | [Pipeline MIFGE](02-pipeline-mifge.md) | Los 8 stages + 2 badges del CRM del funnel MIFGE |
| 03 | [Emails MIFGE](03-emails-mifge.md) | Los 13 emails transaccionales (5 MVP + 8 iterativos) con sus triggers |
| 04 | [Checkout y Whop](04-checkout-y-whop.md) | Reglas de Whop como gateway (NO portal) + 3 productos + flujo |
| 05 | [Arquitectura OS vs App](05-arquitectura-os-app.md) | Capital Hub OS (admin) vs Capital Hub App (portal cliente) — proyectos separados |
| 06 | [Estrategia + KPIs MIFGE](06-estrategia-kpis-mifge.md) | Misión 1.000€/día + 5 KPIs (proyección/objetivo) + pricing |
| 07 | [Tracking Meta](07-tracking-meta.md) | Pixel + CAPI server-side + 7 eventos + Ads Insights API |

## Cómo se actualiza

Sin pedir permiso. Cada vez que se toma una decisión importante en chat, el documento se actualiza ese mismo turno. Regla principal del proyecto.
