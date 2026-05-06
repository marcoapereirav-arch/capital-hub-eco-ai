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

## Reglas

- Todos los `.md` de las subcarpetas se renderizan en `/knowledge` del OS, agrupados por cuadrante.
- Cada archivo tiene frontmatter con `title` y `order` (orden de aparición dentro de su cuadrante).
- Las decisiones se versionan al final de cada archivo en sección "Cambios versionados" con fecha.
- Las versiones antiguas se conservan, no se reescriben — el histórico importa.
- El archivo `00-readme.md` de cada cuadrante NO se renderiza como SOP, es solo índice de la carpeta.

## Cómo se actualiza

Sin pedir permiso. Cada vez que se toma una decisión importante en chat, el documento se actualiza ese mismo turno. Regla principal del proyecto.

## Histórico

- **2026-05-06**: Reorganización completa. Knowledge plano (12 SOPs sueltos) → 4 cuadrantes (Marketing, Producto, Ventas, Finanzas). Renumeración dentro de cada carpeta. `knowledge-service.ts` y `knowledge-page.tsx` actualizados para leer recursivamente. Sidebar del OS también reagrupado por cuadrante.
