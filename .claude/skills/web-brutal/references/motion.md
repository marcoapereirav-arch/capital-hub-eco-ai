# motion.md: el movimiento como concepto

El movimiento es la ÚLTIMA capa de la idea, no la primera. Si el concepto no está, ninguna animación lo salva: un gesto brillante sobre una composición genérica sigue siendo genérico, solo que ahora se mueve. Si el concepto sí está, **un solo gesto lo remata**. Por eso el motion se decide DESPUÉS de fijar concepto, tipografía y composición. Nunca antes.

## El motion sirve a la idea, no decora

Antes de animar cualquier cosa, escribir en UNA frase qué idea del tema encarna el movimiento (la idea, no el efecto). Test de una frase: *"este gesto encarna [la idea del tema] porque ___"*. Si el hueco no se llena, el gesto se borra. "Hago un split-text porque toca" no llena el hueco. "La columna se vacía porque ES un bloque de foco ocurriendo" sí. El gesto es la cuarta palanca que la **ley de coherencia** rastrea: tiene que dramatizar la MISMA ancla física que la tipografía, la composición y la textura, y apuntar a un elemento concreto.

## Un momento orquestado gana a los efectos dispersos

Diez `fade-in-up` en cascada al hacer scroll son ruido, y son además la firma exacta del "hecho por IA": cada sección entrando igual, sin que ninguna entrada signifique nada. En su lugar: UN momento fuerte, atado al concepto, con todo lo demás en **silencio absoluto** (quieto de verdad, no "quieto con un brillito"). La proporción manda: alrededor del **80% de la página no se mueve nunca**. El movimiento senior pregunta dónde QUITAR, no dónde añadir (cortar ~30% al terminar).

**Contención: una sola apuesta por página.** Dos momentos compiten por el ojo y lo parten; tres se leen como amateur. Se elige un gesto, se domina, y ese mismo gesto (o su lenguaje) puede firmar el resto de micro-detalles. El gesto nace del concepto, no de un catálogo de efectos: primero la idea del tema, luego el gesto que la dramatiza, nunca al revés.

## Las 4 palancas del motion

- **Easing:** `ease-out` para entradas (natural), `ease-in` para salidas. Evitar `linear` salvo spinners y barras de progreso. Curva snap moderna: `cubic-bezier(0.32, 0.72, 0, 1)`.
- **Duración:** micro-interacción 100-200ms · transición de UI 200-400ms · reveal de página 600-1200ms · momento cinematográfico 1.5-4s.
- **Stagger:** los elementos llegan en secuencia, no a la vez. Guía el ojo. (Un stagger uniforme sobre todas las cards al scroll NO es esto: es el cliché en cascada.)
- **Purpose:** el trabajo que hace la animación (Status, Continuity, Hierarchy, Personality). Si no se puede nombrar en una frase, se quita.

## La escalera de motion (subir solo lo necesario)

Elegir la herramienta por la restricción más dura del proyecto, no por comodidad. Subir de peldaño solo cuando el anterior no llega. La regla de "un solo momento" hace esto fácil: un gesto bien elegido casi nunca necesita más que CSS.

1. **CSS** transiciones, keyframes, `transform` y `opacity`. Cubre la mayoría. GPU = 60fps.
2. **Librerías JS:**
   - **GSAP** (+ ScrollTrigger): timelines cinematográficos y scroll. Sitios de marketing.
   - **Framer Motion:** UI en React, gestos, drag, layout animation.
   - **Anime.js:** paths SVG, morphing, demos sin React.
   - **Motion One:** wrapper mínimo (~4KB) sobre Web Animations API, vanilla.
3. **Scroll:**
   - **Lenis:** smooth scroll (suaviza el input; no anima por sí solo).
   - **ScrollTrigger:** pin de secciones, scrubbing, snap, parallax.
   - **Intersection Observer:** reveal-on-view simple, más ligero que ScrollTrigger.
   - Puente Lenis + ScrollTrigger (evita el jitter):
     ```
     lenis.on('scroll', ScrollTrigger.update)
     gsap.ticker.add((time) => lenis.raf(time * 1000))
     gsap.ticker.lagSmoothing(0)
     ```
4. **3D:**
   - **Three.js** (motor) · **React Three Fiber** (Three como componentes React) · **Drei** (helpers) · **Spline** (editor no-code).
   - Solo **una escena hero**. Comprimir el modelo GLB **<1MB** (gltf-transform o gltfpack). Budget **2MB por página**. Benchmark real: teléfono Android de gama media. Fallback estático con `<Suspense>`, lazy-load bajo el fold.
   - Saltar 3D si no hay un objeto real o el tono de marca no encaja.
5. **SVG / Lottie / partículas / shaders (los flourishes):**
   - **SVG:** draw-on-load con `stroke-dashoffset`. Pocos KB, nítido a cualquier tamaño.
   - **Lottie:** motion de diseñador (JSON de After Effects), se suelta como una imagen.
   - **Partículas:** tsparticles, 30-60 como capa de fondo sutil.
   - **Shaders GLSL:** la curva más empinada. Pedir GLSL comentado e iterar visualmente.

**Contexto de ejecución (real vs artifact).** En una web real, escalar al mínimo que logra el efecto (CSS primero). En un artifact hay una CSP que **bloquea recursos externos**: cualquier librería cargada desde un CDN y cualquier fuente remota NO cargan. Ahí el único momento se resuelve con animaciones CSS o Web Animations API (que no piden nada externo) y las fuentes van embebidas como data URI. Si una librería es imprescindible, se inlinea; si no se puede inlinear, se rediseña el gesto en CSS.

## Signature moves (elegir 1-2 y dominarlos), con su aviso de cliché

Custom cursor · split-text reveal · page transitions (fade/slide entre rutas) · scroll-linked hero. Un movimiento que se estampa en todo hace el trabajo reconocible.

**Aviso de ciclo:** varios de estos ya están gastados como default de IA: **fade-in-up en cascada, split-text/mask reveal, count-up, cursor magnético, scroll-scrub**. Alcanzarlos "porque quedan bien" es el mismo error que la fuente de moda. Un signature move solo entra si dramatiza el ancla del concepto (test de una frase) y pasa el test del logo intercambiable. Si tu gesto está tal cual en esta lista sin salir del concepto, todavía no distinguiste.

## Patrón de integración (meter 3D/Lottie/etc.)

**Export → Bridge → Consume.** La herramienta A produce algo universal (`.glb`, `.riv`, Lottie `.json`, una URL pública, un componente). Se lleva a B (upload/embed/paste/script). B lo renderiza con su runtime (`react-spline`, `rive-react`, `lottie-react`). Pregunta clave que define toda la cadena: **¿cuál es el formato de export?**

## Accesibilidad (no opcional)

- El momento debe tener un **estado de reposo** que entregue la misma composición y el mismo significado sin moverse. La columna que se vacía, en reposo, aparece ya en su forma final (o congelada a medio camino), no desaparece ni salta. Si al quitar el movimiento la página pierde sentido, el movimiento estaba cargando trabajo que le tocaba a la composición.
- Envolver todo lo que se mueve en `@media (prefers-reduced-motion: no-preference)` con ese reposo como base.
- Fallback también para gama baja (ej. `navigator.hardwareConcurrency < 4`): servir el estado estático.
- `aria-hidden` en elementos decorativos.

## Cierre del momento (antes de darlo por hecho)

Medir en navegador con reduced-motion en on y en off: 60fps, sin desplazamiento de layout (CLS), sin desborde horizontal en 375 ni 1280. Animar solo `transform` y `opacity`, nunca `width/height/top/left/margin`. `will-change` solo justo antes de animar, quitarlo al terminar. Y no se publica por iniciativa propia: solo con la orden del dueño.

### Prohibido (salvo que el concepto lo pida, con las tres condiciones de la lista negra)

- Animar cada card al entrar (el fade-in-up en cascada es el cliché número uno).
- Dos o más momentos compitiendo en la misma página.
- Un contador que sube "porque queda bien", sin relación con la idea.
- Un fallback de reduced-motion pobre (el elemento desaparece, salta, o pierde significado).
- Animar `width/height/top/left/margin`.
