---
title: Efecto de carga de marca (SIEMPRE)
order: 49
area: producto
---

# Efecto de carga de marca — úsalo SIEMPRE

> **Regla (Marco, 2026-06-26):** cada vez que algo carga (ruta, sección, vídeo, fetch) debe verse el **efecto de carga de marca**, nunca un spinner genérico ni una pantalla en blanco/gris/congelada. Siempre, siempre.

## El componente

`src/components/ui/loading-screen.tsx` → `<LoadingScreen />`. Brandkit: fondo `#0F0F12`, anillo monocromo girando + monograma **CH** pulsante. Respeta `prefers-reduced-motion`.

- `<LoadingScreen />` — pantalla completa (page/route loads).
- `<LoadingScreen fullscreen={false} className="absolute inset-0" />` — rellena una sección/contenedor (vídeo, card, etc.).

## De raíz (automático)

- `src/app/loading.tsx` → Next.js lo muestra **automáticamente** como fallback en CADA carga de ruta. No hay que añadirlo a mano por página.
- Suspense: usar `<LoadingScreen />` como `fallback`.
- Datos/iframe/vídeo: mostrar `<LoadingScreen fullscreen={false} />` mientras carga y desvanecerlo al terminar (ej. `/reservar/gracias` tapa el buffering del vídeo de Bunny).

## Reglas

- **Prohibido** `<Loader2 />` suelto, "Cargando…" en texto plano, o pantalla blanca/gris/congelada como estado de carga. Siempre `<LoadingScreen />`.
- Por qué un vídeo necesita loader: el navegador debe **descargar/bufferear** el primer trozo antes de poder reproducir (~1s); no se puede mostrar movimiento antes de que lleguen los datos. El loader cubre ese hueco con la animación de marca.

## Cambios versionados

### 2026-06-26 — Creación
El OS no tenía componente de carga propio (existía en el repo de la App). Creado `LoadingScreen` + `app/loading.tsx` (de raíz). Aplicado al vídeo post-agenda y al fallback de `/reservar`. Pendiente barrer los `Loader2`/"Cargando" sueltos restantes hacia `LoadingScreen`.
