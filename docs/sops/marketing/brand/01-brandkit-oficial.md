---
title: Brandkit, guía y reglas
order: 2
---

# Brandkit, guía y reglas

> **Estado: OFICIAL (elegido por Marco, 2026-07-08).** Este es el brandkit vigente de Capital Hub y **sustituye al board anterior** (`Brandkit_Capital_Hub.html`, retirado).
> Se ve en vivo en la página **`/brandkit`** del OS. Aplica a TODO: ch. + os. + app.
> El rebrand del SaaS (aplicar este brandkit a todas las pantallas) se hace por fases; ver plan aparte. La lógica de progresión de cinturones quedó como tarea someday (`t_brand_01_logica_cinturones`).

## Qué es

Rediseño del brandkit de Capital Hub con alma de **dojo de artes marciales**: se entra de blanco, se sube de nivel, los cinturones cambian de color con el progreso. El dojo se siente, pero sutil. Nada de karateca literal.

## Página de comparación (pestañas)

`localhost:3000/brandkit` es una página de trabajo con **pestañas** para comparar versiones y elegir. Cada versión es un componente autocontenido; solo se monta la activa.

- `src/app/brandkit/page.tsx`: el shell con las pestañas.
- `src/app/brandkit/version-one.tsx`: **V1** (primer rumbo). Se conserva intacta como referencia.
- `src/app/brandkit/version-two.tsx`: **V2** (luxury + dojo). La lista de arreglos vive abajo.

Las versiones nuevas se añaden como pestañas nuevas, sin borrar las anteriores, hasta que Marco escoja.

## Los problemas que ataca

1. **Falta de contraste**: el brandkit v3 es 100% negro y plano; motifs gris sobre negro casi invisibles. Marco lo señaló como problema de raíz.
2. **Demasiado serio y corporativo**: el look "dashboard financiero frío" no transmite la energía del proyecto.

## Reglas del brandkit (dictadas por Marco)

### Tipografía: UNA SOLA, Inter Tight
- **Única tipografía de la marca: Inter Tight.** Nada de Inter ni JetBrains Mono.
- La jerarquía se crea con el **grosor** (Black 900 para impacto, hasta 400 body), tamaño y color. No con fuentes distintas.
- **Tracking ancho SOLO para el wordmark "CAPITAL HUB".** Todo lo demás con espaciado normal.

### Copy: brandkit OFICIAL, directo
- Es un brandkit oficial, no una narrativa. Copy directo que dice lo que las cosas SON, cero paja.
- **Prohibido** copy que hable de los cambios o del rediseño (nada de "v3 vs v4", "el doble de contraste", "rompe").
- **Prohibido** el tono comunicacional o de marketing (titulares ingeniosos). Etiquetas funcionales de brandkit.
- Tono alineado a Capital Hub: claro, profesional, autoridad tranquila.
- No etiquetar ningún cinturón como "el oficial". El verde es el color de acento; los cinturones son lenguaje visual.

### Color
- **REGLA #1 DE DISEÑO (Marco, 2026-07-30): el brandkit manda por encima de lo que se pida en el chat.** Si una petición choca con el brandkit (por ejemplo "ponlo lila"), **se avisa ANTES de tocar una sola línea** y por defecto se hace con el brandkit. Nunca se implementa primero y se pregunta después. Detonante: se rediseñó la landing de la clase en directo en morado porque así se pidió en el chat; palabras de Marco: *"¿por qué carajos lo pones morado? Tenemos un fucking brandkit... Tu regla obligatoria número 1 es siempre diseñar con el puto brandkit."* Se revirtió al verde oficial. La energía visual se consigue con **peso tipográfico, tamaño, contraste, movimiento y glows del verde de marca**, jamás inventando un color nuevo.
- Base monocromo se mantiene: `#0F0F12` carbón, `#2A2D34` grafito, `#F5F6F7` blanco roto.
- **Papel Hueso cálido `#F4F1E8`** (paneles claros, el "gi") + tinta `#141414`. El contraste negro contra papel es el corazón del rediseño.
- **Acento: SOLO el verde oficial** `#22C55E` / `#4ADE80`. El "acento que cambia de color según nivel" se DESCARTÓ (mucho para un MVP).
- Escalera de cinturones (Marco, 2026-07-08, escala jiu-jitsu, versiones mate): blanco `#F5F6F7`, azul `#4F7CC0`, púrpura `#7B5BA6`, marrón `#856046`, negro `#0F0F12`. Numerados 00 a 04.

### Cinturones (lenguaje de progresión; mecánica = fase futura)
- Escala de **jiu-jitsu**: blanco, azul, púrpura, marrón, negro.
- **Las rayas son cintas horizontales que recorren TODO el cinturón** (no marcas en la punta). Se marcan en verde `#22C55E`.
- **La lógica de progresión está PENDIENTE de definir** (qué desbloquea cada cinturón, cuándo se asciende, cómo aplica al funnel). La escalera se mantiene de forma visual en el brandkit como referencia permanente del sistema.
- Los cinturones deben **verse** como cinturones (iconos reconocibles), no como cuadrados de color.
- La mecánica real (que el alumno suba de verdad) NO se construye ahora, solo el lenguaje visual.

### Dónde se muestra cada cosa (contextos, Marco 2026-07-08)
- **Las rayas son EXCLUSIVAS de la cinta blanca.** Los cinturones de color NUNCA llevan rayas: van limpios, en su color real de la escalera (corrección de Marco, 2026-07-08).
- **Landings / funnels:** cinturón **BLANCO** con **rayas horizontales** en formato **barra** (la "barra de cinturón"). Es SOLO para la cinta blanca y SOLO se muestra aquí. Representa la progresión del funnel (el blanco gana rayas).
- **App, perfil del alumno:** se ve el **cinturón real dibujado, limpio, en su color** (sin rayas), no la barra abstracta. Aquí es donde se ve "qué cinturón es" el alumno.
- **Implicación en el brandkit:** en la sección Aplicación, la ficha del alumno muestra el **cinturón dibujado (BeltIcon) en su color, sin rayas**. La barra (BeltBar) queda etiquetada como recurso de landings/funnels y en blanco.

### Logo e isotipo
- **Fuera el sello CH** (doble anillo tipo estampa): descartado por Marco (2026-07-08).
- **El logo oficial es el isotipo CH** (Marco, 2026-07-08): el monograma CH como icono en contenedor redondeado. Ya NO está pendiente de diseño; ese mismo CH es el oficial. Se puede afinar/brandear en el futuro, pero ahora no es prioridad.
- El wordmark ("CAPITAL HUB") es la firma tipográfica; el isotipo CH es la marca gráfica (icono de app, favicon, avatar, firma).

### Motifs
- **El marcador (rotulador):** subrayado o círculo a mano alzada en verde sobre una palabra clave (origen: `.wb-money::after` del funnel webinar). **Es UN motif más, NO el sello de la marca.**
- Los motifs de la V1 se fusionan en la V2 sin repetirse y sin el sello: 15 motifs (marcador, cinturón en barra, etiqueta de nivel, contraste de materiales, numeración, línea fina, iconos lineales, bloques rectangulares, indicadores de estado, capas de fondo, énfasis tipográfico, highlight puntual, fondos planos, alineación a grid, espaciado limpio).
- Prohibido fondo tipo rejilla (regla vigente de Marco).

### Guion largo prohibido
- Cero guion largo (em dash) en ningún archivo de este experimento (copy, comentarios). Ver REGLA #7 en [producto/04](../../producto/04-protocolo-trabajo-agente.md).

## Dirección de la V2

Sube el nivel a **luxury + dojo**: sensación premium (materiales caros, papel, laca negra mate, textura de cinturón), mucho aire, sobriedad, artesanía. Aplica todos los arreglos de arriba (copy oficial, cinturones visibles con ejemplo de rayas, cero guion largo).

## Cómo se ve en el OS

La pantalla **Knowledge > Brand > "Brandkit Capital Hub"** del OS embebe el brandkit en un iframe. Apunta a la **página viva `/brandkit`** (`src/features/knowledge/components/knowledge-page.tsx`), no a un HTML estático. Antes apuntaba a `public/brandkit.html` (el board viejo), ya retirado. Así el Knowledge siempre muestra el brandkit vigente sin regenerar nada.

## Proceso para actualizar el brandkit (a prueba de errores)

**Regla de oro: el brandkit vive en UN SOLO sitio.** La página `/brandkit` (`src/app/brandkit/version-two.tsx`). Todo lo demás la consume desde ahí, no hay copias:

- El **Knowledge del OS** (Brand > Brandkit Capital Hub) la embebe en vivo por iframe (`src="/brandkit"`).
- **NO existen archivos estáticos del brandkit** (`public/brandkit.html` retirado). Prohibido volver a crear una copia estática: sería una segunda fuente que se desincroniza (fue justo el bug del 2026-07-08).

**Para actualizar el brandkit:** se edita `src/app/brandkit/version-two.tsx` y ya. Se ve en `/brandkit` y en el Knowledge automáticamente. Nunca hay que tocar el `public/`, ni el iframe, ni un HTML aparte.

**Al publicar:** los cambios del brandkit van a `main` en **un solo PR** (no varios seguidos), para que salgan en un único deploy y no haya confusión de "qué versión está publicada". Tras el merge, el sitio se re-despliega solo; refrescar la página (recarga forzada) para ver el cambio.

**Checklist al actualizar el brandkit:**
- [ ] Edité SOLO `src/app/brandkit/version-two.tsx` (o piezas que use).
- [ ] Verifiqué en `/brandkit` (localhost del rango 3100).
- [ ] No creé ningún archivo estático ni copia del brandkit.
- [ ] Un solo PR a `main`. Tras el deploy, recarga forzada para confirmar.

## Cambios versionados

### 2026-07-31 (v11, el OS ya usa el brandkit de verdad)
Hasta hoy el brandkit vivía en la página `/brandkit` pero **el resto del OS no lo usaba**:
sus tokens decían otra cosa. `accent` valía gris grafito `#2A2D34` (así que escribir
`bg-accent` creyendo poner la marca pintaba gris) y la fuente empezaba por `-apple-system`,
así que en un Mac todo el OS renderizaba con la fuente de Apple y nunca llegaba a Inter
Tight, pese a estar cargada. Corregido: `accent` y `primary` al verde `#22C55E` con tinta
`#08130C` encima, foco y menú lateral al verde, y las dos familias tipográficas apuntando a
Inter Tight de verdad. Detalle técnico, alcance medido y lo que queda pendiente en
[`producto/47`](../../producto/47-reglas-ui-contraste-legibilidad.md).

**Regla que sale de aquí:** el brandkit no está aplicado por estar escrito. Está aplicado
cuando los tokens del producto valen lo que dice el brandkit. Antes de dar por buena
cualquier regla de color o tipografía, se abre el archivo de tokens y se comprueba el
valor: el nombre de un token no garantiza su valor.

### 2026-07-08 (v10, una sola carpeta Brand, sin duplicado)
El Knowledge del OS mostraba el brandkit duplicado: una carpeta "Brand" hardcodeada (solo el brandkit visual) y otra carpeta que salía del markdown de `marketing/brand/` (los documentos). Fusionadas en UNA sola carpeta **Brand** (`knowledge-page.tsx`): brandkit visual + Brand Playbook + esta guía. Además este documento se renombró a "Brandkit, guía y reglas" para no confundirse con el item visual "Brandkit Capital Hub". Detonante: Marco vio el brandkit repetido en dos carpetas.

### 2026-07-08 (v9, el OS Knowledge muestra el brandkit nuevo)
El board viejo se seguía viendo en el OS porque la pantalla de Knowledge embebía `public/brandkit.html` (estático) vía iframe, no el markdown. Corregido: el iframe ahora apunta a `/brandkit` (la página viva nueva) y se retiró `public/brandkit.html`. Detonante: Marco no veía el cambio en el Knowledge del SaaS.

### 2026-07-08 (v8, V2 elegida como oficial)
Marco aprueba los 3 pasos (fijar V2 oficial, llevar a main + regla nueva, rebrand del SaaS por fases). Aplicado: (1) el **logo oficial es el isotipo CH** (ya no "pendiente de diseño"; afinable a futuro). (2) **`/brandkit` consolidado**: retirado el comparador de pestañas y la V1; la página renderiza la V2 directa como brandkit oficial (V1 conservada en el historial git). (3) La **lógica de progresión de cinturones** se envió a Operaciones como tarea **someday** `t_brand_01_logica_cinturones` (área Producto, asignada a Marco). Pendiente en esta rama: merge a main + escribir la regla de branding oficial (retirando el board HTML viejo) + plan por fases del rebrand del SaaS.

### 2026-07-08 (v7, auditoría multi-agente + fixes)
Auditoría de cumplimiento con 25 agentes (3 revisores por dimensión: reglas de marca, copy y código; cada hallazgo verificado adversarialmente): 22 hallazgos brutos, 16 refutados, 6 confirmados y corregidos. (1) "Exclusivo del logo" pasa a "Exclusivo del wordmark" (el tracking amplio es solo del wordmark, no del isotipo). (2) Fuera el símil "como un metal precioso" del lead de Color (copy oficial, cero adorno). (3) Ratios de contraste reales por par: carbón/blanco 17.7:1 y papel/tinta 16.3:1 (el chip decía 16.9:1, que no correspondía a ninguno; queda "AAA"). (4) "Container" pasa a "Contenedor". (5) Botón copiar hex: solo confirma "Copiado" si la copia ocurrió de verdad. (6) Anillo de foco de teclado en currentColor (el verde era invisible sobre las placas verdes).

### 2026-07-08 (v6, corrección de Marco)
**Las rayas NO van en los cinturones de color.** Son exclusivas de la cinta blanca (progresión del funnel). El cinturón de color se muestra siempre limpio, en su color real de la escalera. Aplicado: ficha del alumno ahora muestra el cinturón azul sin rayas (caption "Cinturón azul"), lead de la sección Rayas y nota de contextos reescritos.

### 2026-07-08 (v5, aplicado en código)
Las decisiones de v4 quedan aplicadas en la V2 del brandkit: (1) tarjeta **Isotipo** en la sección Logo con el componente `ChIcon` (monograma CH en contenedor redondeado, variantes papel/carbón/verde, tamaños 48/32/24, mínimo 24 px); (2) el motif "Cinturón en barra" ahora es **solo cinta blanca** y su copy lo limita a landings/funnels; (3) la ficha del alumno en Aplicación muestra el **cinturón dibujado (BeltIcon) azul con 2 rayas** en vez de la barra, con el isotipo CH como avatar y subtítulo "Perfil del alumno · App". Verificado en localhost (TypeScript limpio, 0 errores de consola, 0 guiones largos).

### 2026-07-08 (v4, decisiones; código pendiente de OK)
Marco fija tres cosas (registradas antes de tocar código): (1) **Isotipo CH**: añadir el CH como icono/marca gráfica limpia (no el sello), importante. (2) **Barra de cinturón con rayas horizontales = SOLO cinta blanca y SOLO en landings/funnels**. (3) En la **App, perfil/ficha del alumno**, se muestra el **cinturón real dibujado con su cinta** (BeltIcon), no la barra abstracta. Recordatorio del propio Marco: TODO se registra en el Knowledge, nada se queda "en la cabeza" del agente (refuerza REGLA #2 de producto/04).

### 2026-07-08 (v3)
Pasada de arreglos de Marco sobre la V2: fuera la frase "Disciplina, oficio, progreso.", fuera el sello CH (logo real pendiente de diseño), cinturones a escala jiu-jitsu (blanco, azul `#4F7CC0`, púrpura `#7B5BA6`, marrón `#856046`, negro), rayas ahora horizontales recorriendo todo el cinturón, lógica de progresión marcada como pendiente (se mantiene visual), y motifs de la V1 fusionados en la V2 (15 motifs, sin duplicados, sin sello). Plan acordado: al recibir OK de Marco, esto va a main y sustituye el brandkit del Knowledge; después se fija la regla de branding y se aplica a todo el SaaS (OS + App).

### 2026-07-07 (v2)
Página convertida a comparador con pestañas. V1 extraída a `version-one.tsx` (intacta, guiones largos limpiados). Añadido shell `page.tsx` + `version-two.tsx`. Fijadas las reglas de copy oficial, cinturones visibles y la prohibición del guion largo. V2 (luxury + dojo) en construcción con Fable.

### 2026-07-07 (v1)
Experimento montado en rama `brandkit-dojo` con Fable 5 como diseñador. Preview verificada en localhost (0 errores de consola, reveals por scroll funcionando, resto de la app intacta).
