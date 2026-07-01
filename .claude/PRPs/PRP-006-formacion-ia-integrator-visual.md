# PRP-006 — Formación IA Integrator: manuales en versión visual (web scroll)

> Fecha: 2026-07-01 · Estado: aprobado por Marco (diseño) · Ejecutor: IA
> Origen: los 3 manuales de texto viven en `docs/sops/producto/ia-integrator/`. Este PRP los convierte en presentación visual.

## 1. Objetivo

Convertir los 3 manuales de la formación **IA Integrator** en una **presentación web pública, animada al scroll**, dentro del brandkit de Capital Hub. Un link que Marco/Adrián proyectan en clase y comparten con alumnos.

## 2. Alcance y fases

**Contenido (verbatim de los manuales ya adaptados):** no se reescribe el mensaje, se hace visual.

| Fase | Qué | Slug |
|---|---|---|
| **A (pilar)** | Portada de la formación + **manual "Vibe Coding al grano"** completo y animado | `/formacion/ia-integrator` + `/formacion/ia-integrator/vibe-coding` |
| B | Manual "Vibe Coding — método completo" reusando las piezas de la Fase A | `.../vibe-coding-completo` |
| C | Manual "Git explicado" | `.../git` |

**Se construye la Fase A primero, se verifica en producción y Marco aprueba el estilo.** Solo entonces B y C (rápidas, mismo sistema). Así el riesgo de "el look no me gusta" se acota a un manual, no tres.

## 3. Ubicación / arquitectura

- **Ruta pública** en el OS (patrón `src/app/(public)/…`, sin login). NO toca la App del alumno, NO toca lógica de negocio, NO añade tablas.
- Rutas:
  - `src/app/(public)/formacion/ia-integrator/page.tsx` → **portada**: 3 tarjetas (una por manual; B y C en "próximamente" hasta construirse).
  - `src/app/(public)/formacion/ia-integrator/vibe-coding/page.tsx` → **página-scroll del pilar**.
- **Feature folder** `src/features/formacion-ia-integrator/`:
  - `components/` → secciones reutilizables (Hero, RevealSection, diagramas animados, VocabularioStrip, ReglasSection, Portada).
  - `content/` → el copy de cada manual como datos tipados (TS), para separar contenido de presentación y reusar componentes entre manuales.
  - `styles.css` → `@keyframes` del feature (patrón `funnel-lt8/styles.css`).
  - `hooks/use-reveal.ts` → `IntersectionObserver` sobre `[data-reveal]` (patrón `funnel-test-personalidad`).

## 4. Diseño (brandkit — es ley)

- Fondo `#0F0F12`, tarjetas `#141418`, bordes `#2A2D34`, texto `#F5F6F7`/blanco, muted `#9CA3AF`/`#7B818C`.
- **Acento verde** `#22C55E` (iconos/detalles `#4ADE80`). Prohibido otros neones.
- Fuentes: **Inter Tight** (títulos), **Inter** (cuerpo), **JetBrains Mono** (código/labels tipo `/primer`, `main`).
- Tipografía normal y legible (sin letter-spacing ancho raro).
- **Efecto de carga de marca** al abrir (`<LoadingScreen/>` / patrón existente).
- Respetar márgenes; nada pegado al borde.

## 5. WOW / animaciones (sin dependencias nuevas)

Mecánica: `IntersectionObserver` + `@keyframes` CSS + SVG `stroke-dashoffset`. Igual que los funnels actuales.

- **Reveals** al entrar en viewport (fade + subida), con delays escalonados.
- **Diagramas vivos** (los conceptos, no como texto):
  1. **"El viaje de un cambio"** — tubería `localhost → rama → main → producción`; la línea SVG se dibuja (stroke) y los nodos se encienden al entrar en viewport.
  2. **main vs rama** — carretera con desvío que se separa y se reincorpora (merge).
  3. **commit / push / merge** — metáfora *sobre → buzón* animada.
- **Hero**: "Tú diriges, la IA teclea" con entrada animada (patrón `tp-load`/`tp-line`).
- Opcional sutil: glow verde / spotlight de cursor (ya usado en test-personalidad).

## 6. Secciones del pilar ("Vibe Coding al grano")

Derivadas 1:1 de `docs/sops/producto/ia-integrator/01-vibecoding-al-grano.md`:
1. Hero.
2. Qué es esto (tú no programas; dices qué quieres y apruebas).
3. Por dónde empiezas (`/primer`).
4. **Los 4 lugares** (diagrama tubería).
5. El flujo de una sesión (7 pasos).
6. **¿Directo o rama?** (diagrama desvío).
7. **Guardar y publicar** (commit/push/merge, sobre→buzón).
8. Tu vocabulario (strip de comandos).
9. Las 3 reglas.
10. Cierre.

## 7. Fuera de alcance (YAGNI)

- Nada en la App del alumno (otro repo). Se puede portar después.
- Sin librería de animación nueva (framer-motion/gsap): se usa CSS + IO.
- Sin CMS/edición visual: el copy vive en `content/` (TS); si cambia, se edita ahí.
- Sin analítica/tracking en esta fase.

## 8. Verificación

- `npx tsc --noEmit` + `npm run build` verdes antes de push.
- Tras deploy: **1 verificación en producción con Playwright** (viewport desktop + móvil 390×844) de `/formacion/ia-integrator` y `/formacion/ia-integrator/vibe-coding`. Screenshot.
- Auto-blindaje: si algo del brandkit/scroll falla, se arregla en el mismo bloque.

## 9. Git / board

- Commits por bloque (`feat(formacion): …`), push a `main` (REGLA #3).
- Board: tarea `t_ia_integrator_manuales_visual` (ya existe, `next`) → in_progress → done al cerrar el pilar; subtareas B y C si aplica.
