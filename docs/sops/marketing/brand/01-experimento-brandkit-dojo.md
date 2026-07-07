---
title: Experimento — Brandkit v4 "El Dojo" (rama brandkit-dojo)
order: 2
---

# Experimento: Brandkit v4 "El Dojo"

> **Estado: EXPERIMENTAL — pendiente de decisión de Marco.**
> Vive solo en la rama `brandkit-dojo`. Preview en `localhost:3000/brandkit`.
> Si se aprueba, el rebrand se aplicará a TODO (ch. + os. + app.) en una fase posterior.
> Si se descarta, esta rama (y este SOP) se eliminan.

## Qué es

Rediseño del brandkit de Capital Hub con alma de **dojo de artes marciales**: se entra de blanco, se sube de nivel, los cinturones cambian de color con el progreso. El dojo se siente, pero sutil — "se nota, no grita". Nada de karateca literal.

## Los problemas que ataca

1. **Falta de contraste** — el brandkit v3 es 100% negro y plano: motifs gris-sobre-negro casi invisibles. Marco lo señaló como problema de raíz.
2. **Demasiado serio/corporativo** — el look "dashboard financiero frío" no transmite la energía del proyecto.

## Decisiones del experimento (dictadas por Marco)

### Tipografía — UNA SOLA: Inter Tight
- **Única tipografía de la marca: Inter Tight.** Nada de Inter ni JetBrains Mono.
- La jerarquía se crea con el **grosor** (Black 900 para impacto → 400 body), tamaño y color. No con fuentes distintas.
- **Tracking ancho SOLO para el wordmark "CAPITAL HUB"** (el logo es un logo, no texto). Todo lo demás, espaciado normal.

### Color
- Base monocromo se mantiene: `#0F0F12` carbón · `#2A2D34` grafito · `#F5F6F7` blanco roto.
- **Nuevo: Papel Hueso cálido `#F4F1E8`** (paneles claros, el "gi") + tinta `#141414`. El contraste negro↔papel es el corazón del rediseño.
- **Acento: SOLO el verde oficial** `#22C55E` / `#4ADE80`. El "acento que cambia de color según nivel" se DESCARTÓ (mucho para un MVP).
- Escalera de cinturones (lenguaje visual, versiones mate): blanco `#F5F6F7` → amarillo `#D9B14A` → naranja `#D08048` → **verde `#22C55E`** (centro) → azul `#4F7CC0` → marrón `#856046` → negro `#0F0F12`. Empieza en blanco y termina en negro: los polos de la marca.

### Cinturones — el lenguaje de progresión (mecánica = fase futura)
- **En el funnel:** cinturón blanco que gana **rayas** de color (mismos colores de la escalera, en orden). Registro = raya amarilla, siguiente paso = naranja, etc.
- **Dentro de la formación:** cinturón entero que sube de color al avanzar (definición precisa pendiente).
- La mecánica real (que el alumno suba de verdad) NO se construye ahora — solo el lenguaje visual.

### Motifs
- **El marcador (rotulador):** subrayado o círculo a mano alzada en verde sobre una palabra clave (origen: `.wb-money::after` del funnel webinar). **Es UN motif más, NO el sello de la marca.**
- Barra de cinturón + grados (rayas de progreso), etiqueta de rango (`CINTURÓN VERDE · NIVEL 03`), sello/estampa CH, tarjetas de alto contraste (papel/carbón), y los motifs estructurales v3 (bloques, líneas, bordes finos, iconos lineales) actualizados con contraste real.
- Prohibido fondo tipo rejilla (regla vigente de Marco).

## Archivos

- `src/app/brandkit/page.tsx` — el brandkit board v4 (preview autocontenida, no toca nada más).

## Cambios versionados

### 2026-07-07 — Creación
Experimento montado en rama `brandkit-dojo` con Fable 5 como diseñador. Preview verificada en localhost (0 errores consola, reveals por scroll funcionando, resto de la app intacta).
