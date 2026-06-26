---
title: Diseño dinámico y efecto WOW (regla de diseño)
order: 48
area: producto
---

# Diseño dinámico y efecto WOW

> **Regla principal de diseño del proyecto (Marco, 2026-06-22).** Cada funnel, landing page, y cualquier proceso/pantalla que podamos hacer dinámico debe buscar el **efecto WOW**: movimiento, interacción, transiciones, experiencias que no parezcan "la típica página web estática". Es objetivo prioritario, no un extra.

## Qué significa en la práctica

- **No páginas planas/estáticas.** Si una pantalla puede tener motion, scroll-driven reveal, micro-interacciones, estados animados, transiciones entre secciones — se hace.
- **Construir la experiencia, no maquetar.** La página se va "armando" ante el usuario (reveals, parallax, count-ups, hover/tap states, secuencias). El contenido aparece con intención.
- **Distintivo, no plantilla.** Evitar el look genérico de IA / template. Cada funnel debe sentirse propio de Capital Hub.

## Innegociable: alineado al brandkit

El WOW NUNCA rompe el branding. Todo el movimiento y los efectos viven dentro del [brandkit oficial](../marketing/brand/):
- Paleta monocromática: `#0F0F12` · `#2A2D34` · `#F5F6F7` · `#FFFFFF` + grises. **Prohibido** neón (violet/cyan/emerald) aunque sea para "destacar" un efecto.
- Tipografía: Inter Tight (display) · Inter (UI) · JetBrains Mono (labels/datos).
- Estética IDE / dashboard financiero: orden, rejilla, mate. El motion es elegante y contenido, no circense.

## Reglas técnicas

- Mobile-first SIEMPRE (ver [03-mobile-first-os](03-mobile-first-os.md)) y respeta contraste/legibilidad (ver [47-reglas-ui-contraste-legibilidad](47-reglas-ui-contraste-legibilidad.md)). El WOW no puede sacrificar legibilidad ni performance en móvil.
- Respetar `prefers-reduced-motion` (accesibilidad) — degradar a estático cuando el usuario lo pide.
- Performance: el efecto no puede tumbar el LCP ni bloquear el opt-in. Animaciones GPU-friendly, lazy donde toque.
- Herramientas disponibles para esto: skill `frontend-design` (UI distintiva) y skill `website-3d` (scroll-driven, cinematográfico Apple-style).

## Orden de trabajo acordado

1. Primero: que TODAS las automatizaciones del funnel estén hechas y verificadas (CRM, stage no-backward, tagging, atribución).
2. Después: pasada de **diseño dinámico/WOW** sobre el funnel, alineada al brandkit.

## Cambios versionados

### 2026-06-22 — Creación
Marco fija el diseño dinámico/WOW como regla principal para todos los funnels y landings, aprovechando que la base de copy + automatizaciones del funnel Test de Personalidad queda lista. El efecto WOW siempre dentro del brandkit.

## Color de acento: VERDE (Marco, 2026-06-26)

Se levanta el veto al verde. El **verde es el color de acento oficial** de Capital Hub (ya estaba en iconos/estados del OS). La base sigue siendo monocromo b&w; el verde es para detalles, estados, acciones y reproductores.

- `#22C55E` (`green-500`) — verde sólido/acento principal (badges, bordes, **controles de reproductores de vídeo**).
- `#4ADE80` (`green-400`) — verde claro para iconos/texto sobre fondo oscuro.
- **TODOS los reproductores de vídeo (Bunny) van en verde**, en OS y App.
- Cómo se aplica al player de Bunny: Account API `PlayerKeyColor` → requiere `BUNNY_ACCOUNT_API_KEY` en `.env.local` (la stream key da 401). Es un setting por library; aplicar a todas las libraries en uso (OS + App).
- Otros neones (violet/cyan/ámbar fluor) siguen prohibidos. Ver [[feedback-brandkit-absoluto]].

## Logo vs copy — el logo SÍ va espaciado (Marco, 2026-06-26)

- **Logo / wordmark "Capital Hub"** = tratamiento de marca: Inter Tight, **MAYÚSCULAS**, `tracking-[0.15em]`, semibold (igual que el logo de la esquina del OS, `app-sidebar.tsx`). Esto es CORRECTO y se mantiene.
- **Copy normal** (frases, footers `© Capital Hub`, labels, body) = tipografía NORMAL Inter, sin tracking ancho ni mayúsculas espaciadas.
- Regla mental: **el logo es un logo, no es texto.** Solo el logo lleva ese tratamiento. Ver [[feedback-tipografia-normal-legible]].
