---
name: web-brutal
description: >-
  Método completo para diseñar y construir CUALQUIER interfaz web de cero (o rediseñarla):
  landing, página de venta, funnel, sitio de marketing, página de producto, portfolio, dashboard
  o cualquier UI web. Se activa cuando el usuario pide "una landing", "una web", "una página",
  "un funnel", "diseña un sitio", "hazme la home", "build a landing/page/site", aunque no diga
  la palabra exacta. Entrega el proceso de punta a punta (dirección de arte, brief, referencias,
  construcción sección por sección, movimiento con contención, QA medido en navegador y publicación)
  para lograr un resultado DISTINTIVO, on-brand y rápido, construido directo en código.
scope: nvision-only
---

# web-brutal

Sistema para llevar cualquier web de idea a producción: **distintiva, on-brand y rápida**, construida directa en código. No usa generadores tipo plantilla: el andamiaje se escribe a mano para tener control total y salir con la marca del proyecto desde la primera línea.

**El fallo que esta skill existe para matar:** la web genérica que todos reconocen como "hecha por IA". Todo centrado, fondo oscuro con un acento, tres tarjetas, tres tiers de precio, esquinas redondeadas, fuente de sistema, la pareja serif+mono de manual. Competente y muerta. Se evita con UNA cosa que esta skill vuelve obligatoria, no opcional: **dirección de arte con una idea propia del tema, y esa idea atravesando la tipografía, la composición, la textura y un solo momento de movimiento.**

Este archivo es el mapa. El detalle vive en `references/` y se carga según la fase.

## Las 6 reglas duras (innegociables)

1. **Concepto antes que código.** No se escribe una línea hasta tener un concepto (una idea propia sacada del mundo físico del tema) y un riesgo estético declarado por escrito. Sin eso, el resultado será el promedio. Es el PASO 1 del pipeline, y tiene su propia puerta. → `references/direccion-de-arte.md`
2. **Brandkit desde la línea 1.** Todo color, tipografía, radio y superficie sale de los tokens del **brandkit del proyecto**. Cero valores inventados, cero cara de plantilla. Si el proyecto no tiene brandkit, se define uno mínimo (3 colores + 2 fuentes + 1 radio + 1 superficie) ANTES de construir. Si el brandkit es genérico, se **tensa dentro de sus tokens** (escala extrema, contraste de peso/ancho, emparejamiento inesperado de los colores permitidos, textura); rendirse al brandkit genérico no es una excusa válida.
3. **Lo visual se mide en navegador, no se razona.** Antes de dar algo por terminado: medir en **375 y 1280** (`getBoundingClientRect`, `scrollWidth` vs `clientWidth`), **0 desbordes horizontales**, y **Lighthouse 90+ desktop / 80+ mobile**. Y **mirar la captura**: el número puede cuadrar y verse mal igual.
4. **Contención en el movimiento.** ~80% de la página quieta de verdad. **Un solo momento fuerte por página**, atado al concepto. Una animación que no comunica algo concreto se corta. "Silencio" no significa minimalismo vacío: el resto puede ser denso, editorial, con textura; solo no compite.
5. **Márgenes y contraste.** Nada pegado a los bordes (padding interno ≥20px mobile / 24px desktop). Contraste alto sobre fondos oscuros con escala sólida (nunca opacidad de texto suelta). Superficies elevadas visibles (que la card nunca se confunda con el fondo).
6. **Ship-first, publica solo el dueño.** Primero en localhost, se revisa en vivo. **Se publica SOLO con la orden explícita del dueño.** Nunca `git push` por iniciativa.

## La puerta de distinción (gate innegociable, ANTES de construir y ANTES de cerrar)

Estas comprobaciones **no se auto-aprueban con prosa bonita**: son objetivas o apuntan a un elemento concreto del DOM. Si una falla, se rediseña; no se construye ni se cierra. Detalle completo y cómo pasarlas en `references/direccion-de-arte.md`.

1. **Test del logo intercambiable (primario).** Cambia mentalmente el logo por el de un competidor real. Si nadie notaría la diferencia, la web es genérica. Se rediseña.
2. **Test de las 2 referencias reales.** Nombra 2 sitios o productos reales y concretos a los que se parece. Si puedes nombrarlos, estás sobre una plantilla. Se rehace.
3. **Ley de coherencia.** La misma ancla física del concepto se ve en al menos **3 de 4 palancas** (tipografía, composición, textura/color, motion), y **cada rastro apunta a un elemento o selector concreto** que la renderiza. Si el concepto solo vive en un adorno de fondo, falla.
4. **Test de estructura.** El concepto cambió al menos **una decisión de layout o jerarquía**, no solo el color, la textura o la fuente. Si solo cambió la piel, es decoración: no pasa.
5. **Escaneo de micro-defaults.** Ninguno de los "tells" de IA (glass card + borde tenue + sombra suave + blur, glow radial tras el hero, blob 3D de gradiente, iconos de línea uniformes como marcadores, fade-in-up en cascada) aparece "porque quedaba bien". Lista completa en referencia.
6. **Diversidad interna.** No hay dos secciones resueltas con el mismo tratamiento repetido.

## El pipeline (siempre en este orden)

**1. DIRECCIÓN DE ARTE** (antes de tocar código, antes incluso de reunir referencias). Producir por escrito y dejarlo a la vista todo el build:
- El **concepto**: una idea propia del mundo físico del tema, en una frase que nombre algo tangible ("Esta web es [ancla del tema] convertida en interfaz").
- El **riesgo**: una sola audacia estética de verdad, concentrada en un sitio, con todo lo demás en silencio ("La audacia va solo en [un sitio]").
- La derivación (vaciar 10-15 sustantivos tangibles del tema, elegir un ancla física, traducirla a tokens del brandkit) va ANTES de la puerta de distinción. No se pasa la puerta sin haber derivado. → `references/direccion-de-arte.md`

**2. BRIEF.** Rellenar en una pantalla:
- **WHO** para quién es, una línea.
- **WHAT** qué es y qué hace, una línea.
- **WHY DIFFERENT** la razón para elegir esto y no otra cosa.
- **FEEL** 3 palabras + 1 referencia de estructura.
- **SECTIONS** el esqueleto de CONTENIDO (ver abajo): qué información aparece y en qué orden de persuasión.

Regla: 15 minutos de plan son la velocidad más barata que se puede comprar.

**3. REFERENCIAS + TOKENS.** Reunir 5-10 referencias, **de fuentes diversas** (no tres shots del mismo estilo de plantilla, que lavan lo genérico y entra por la puerta legítima). **Robar ESTRUCTURA** (orden de secciones, jerarquía de tipo, ritmo de espaciado), **nunca estilo** (colores, fuentes, fotos). Fijar tipo/color/grid desde el brandkit del proyecto. → `references/direccion-de-arte.md`

**4. SCAFFOLD + BUILD sección por sección.** Levantar el esqueleto completo en localhost con TODAS las secciones de pie. Luego refinar **una sección a la vez** con cambios pequeños y acotados, empezando por el **HERO**. Cada sección elige su composición a conciencia (no deja caer el contenido al centro por inercia). Nunca perfeccionar una sección antes de tener todas montadas.

**5. MOTION.** Elegir **UN momento fuerte** atado al concepto + escalar la técnica al mínimo que logra el efecto. Todo lo demás en silencio. → `references/motion.md`

**6. MEDIR + PULIR.** Pasar la puerta de distinción, el checklist de polish y de performance, y medir en navegador (regla 3). → `references/build-and-ship.md`

**7. SHIP.** Publicar solo con la orden del dueño. Tras publicar, verificar que producción sirve el código nuevo.

## El esqueleto es de CONTENIDO, nunca un layout

Una landing de venta suele ordenar la información así: Hero (gancho) → Problema (el dolor a evitar) → Cómo funciona → Prueba (social/resultados) → Oferta/Precios → FAQ (objeciones) → CTA final. **Eso es una secuencia de contenido: dice QUÉ información aparece y en qué orden, nunca qué FORMA tiene cada bloque en pantalla.**

Convertir ese esqueleto en su forma cliché (hero centrado, luego tres tarjetas, luego tres tiers, luego un acordeón) es exactamente el error a matar. El esqueleto entrega el QUÉ; la composición la eliges bloque por bloque con los sistemas editoriales de la referencia, y su forma SIEMPRE se rompe. Si una sección terminada se describe con "hero + 3 tarjetas + 3 tiers", no está terminada: está sin componer. La tabla QUÉ-vs-FORMA y las estructuras alternativas están en `references/direccion-de-arte.md`.

Además: cada sección del esqueleto tiene que ganarse su sitio. Si no sabes por qué existe ni qué objeción resuelve, se corta.

## Archivos de referencia (cargar según la fase)

- **`references/direccion-de-arte.md`** el motor de distinción: mandato de concepto, cómo derivarlo del tema, lista negra de clichés POR PATRÓN, la puerta de distinción, tipografía con carácter (elección por rasgo formal + embebido de fuentes vía data URI + sourcing en contexto restringido), composición que rompe la retícula con estructuras alternativas, ley de coherencia, fundamentos que no cambian (color HSL, grid, mobile) y el ejemplo genérico->distintivo.
- **`references/motion.md`** motion como concepto (un momento orquestado atado a la idea), la escalera de motion (CSS → librerías JS → scroll → 3D → SVG/Lottie/shaders), easing/duración/stagger, signature moves con su aviso de cliché, y accesibilidad (reduced-motion con estado de reposo con significado + fallback de gama baja).
- **`references/build-and-ship.md`** matriz de decisión de backend, performance (Core Web Vitals), checklist de polish (los 10 detalles caros), QA pre-lanzamiento (incluida la puerta de distinción) y playbooks de prompts para construir en código.

## Anti-patrones (si aparecen, está mal)

- **Cara de plantilla:** colores/tipos genéricos que no salen del brandkit, o el brandkit genérico usado sin tensarlo.
- **Concepto de adorno:** el concepto solo existe como una textura de fondo y no cambió ninguna decisión de layout, tipografía ni motion.
- **Cliché por vecindad:** esquivar el hex o el nombre exacto de un cliché y repetir el mismo PATRÓN con otro tono, otra fuente de moda u otra caja (ver lista negra por patrón).
- **Auto-aprobación con prosa:** escribir párrafos bonitos en las puertas y dejar la web genérica por debajo. Las puertas apuntan a elementos reales del DOM, no a afirmaciones.
- **Esqueleto como layout:** montar "hero + 3 tarjetas + 3 tiers + FAQ" como forma por defecto.
- **Efecto apilado:** dos o más momentos de motion compitiendo en una misma página.
- **"Se ve bien en mi pantalla":** no medido en 375 y 1280.
- **Animar layout:** mover `width/height/top/left/margin` en vez de `transform`/`opacity`.
- **Perfeccionismo prematuro:** pulir el 5% antes de tener el 100% de pie.
- **CTA o texto pegado al borde**, sobre todo el botón del final de la página.
- **Publicar por iniciativa propia.**
