---
title: Knowledge — Capital Hub OS
order: 0
---

# Knowledge — Capital Hub OS

Esta carpeta es la **fuente única de verdad operativa** del proyecto. Cada decisión arquitectónica, estratégica, de copy, de pricing, de pipeline — se versiona aquí.

Si una decisión no está aquí, **no existe**. Si está aquí, es la versión vigente.

## Estructura por cuadrantes del negocio

El Knowledge se organiza en los 4 cuadrantes del negocio. Cada SOP vive en su cuadrante.

| Cuadrante | Carpeta | Qué contiene |
|---|---|---|
| **Marketing** | [`marketing/`](marketing/) | Captación, contenido, ads, funnel hasta checkout, lead magnets |
| **Producto** | [`producto/`](producto/) | Cómo se construye y opera el OS, arquitectura, deploys, protocolo del agente |
| **Ventas** | [`ventas/`](ventas/) | Proceso de cierre, llamadas, follow-up *(pendiente de contenido)* |
| **Finanzas** | [`finanzas/`](finanzas/) | Pricing, comisiones, modelo de negocio, P&L *(pendiente de contenido)* |
| **Sistemas** | [`sistemas/`](sistemas/) | Runbooks y protocolos internos: entorno de trabajo, test-agent, cache PWA, sprints |

## Reglas

- Todos los `.md` de las subcarpetas se renderizan en `/knowledge` del OS, agrupados por cuadrante.
- Cada archivo tiene frontmatter con `title` y `order` (orden de aparición dentro de su cuadrante).
- Las decisiones se versionan al final de cada archivo en sección "Cambios versionados" con fecha.
- Las versiones antiguas se conservan, no se reescriben — el histórico importa.
- El archivo `00-readme.md` de cada cuadrante NO se renderiza como SOP, es solo índice de la carpeta.

## Cómo se actualiza

Sin pedir permiso. Cada vez que se toma una decisión importante en chat, el documento se actualiza ese mismo turno. Regla principal del proyecto.

## Histórico

- **2026-07-23**: Funnel del Test de Personalidad **v2** (reunión del 18-jul-2026). La página de gracias pasa a ser página de venta (VSL + Calendly embebido), el test se entrega por email a los 7 minutos, se añade la landing `/test-personalidad/test` y el stage **Lead cualificado**. Actualizados [`marketing/07`](marketing/07-funnel-test-personalidad.md) (reescrito a v2, v1 conservada como histórico), [`producto/13`](producto/13-contactos-pipeline.md) (stages canónicos + checklist para añadir stages), [`producto/18`](producto/18-email-marketing.md) (envío programado con `scheduledAt` + bug del CHECK de `email_logs.status`), [`producto/30`](producto/30-automatizaciones-estado.md) (2 automatizaciones nuevas) y [`producto/12`](producto/12-sistema-end-to-end.md) (pipelines y puntero a los stages canónicos).
- **2026-07-22**: Pasada de coherencia. Los repos salieron de iCloud (`Desktop/Marco-Codes/` → `Marco-Codes/`): 4 SOPs apuntaban a la ruta muerta. Dominio del OS unificado a `os.capitalhubapp.com` en 24 ficheros (`ecoai.` queda documentado como legacy con 308). Corregido el Team ID de Vercel en `producto/06`. Nuevo SOP [`sistemas/10-repos-fuera-de-icloud.md`](sistemas/10-repos-fuera-de-icloud.md). Añadido el cuadrante Sistemas a este índice (el código ya lo servía, faltaba aquí).
- **2026-05-06**: Reorganización completa. Knowledge plano (12 SOPs sueltos) → 4 cuadrantes (Marketing, Producto, Ventas, Finanzas). Renumeración dentro de cada carpeta. `knowledge-service.ts` y `knowledge-page.tsx` actualizados para leer recursivamente. Sidebar del OS también reagrupado por cuadrante.
