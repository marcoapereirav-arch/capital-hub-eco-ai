# direccion-de-arte.md: el motor de distinción

Esto es lo único que separa un 9-10 de un 5. Sin ello el resultado será competente y muerto: la web genérica que cualquiera reconoce como "hecha por IA". **Corre ANTES de reunir referencias, ANTES de elegir un layout y ANTES de escribir la primera línea.** Ninguna sección se construye hasta que la puerta de distinción esté superada por escrito, y contra elementos reales, no contra prosa.

El orden de este documento ES el orden de trabajo:
1. Mandato del concepto.
2. Derivar el concepto del tema (los sustantivos).
3. Lista negra de clichés por patrón.
4. Tipografía con carácter.
5. Composición que rompe la retícula.
6. Ley de coherencia.
7. La puerta de distinción.
8. Fundamentos que no cambian.
9. Ejemplo genérico contra distintivo.

---

## 1. Mandato: primero el concepto, después el código

**No se construye NADA sin un concepto.** Un concepto no es un mood ("moderno, limpio, premium") ni una paleta. Es **una idea propia sacada del mundo físico del tema**: sus materiales, su vocabulario, sus instrumentos, su atmósfera. La web debe parecer que solo pudo salir de ESE tema y de ningún otro.

- El brandkit del proyecto pone el color, la tipografía y el radio. El concepto pone **la idea de dirección de arte** que ordena cómo se usan esos tokens, qué se rompe y dónde va la audacia. Si el brandkit es genérico, el concepto decide cómo tensarlo dentro de sus tokens.
- Si no puedes describir el concepto en una frase que nombre algo físico del tema, **no hay concepto todavía**. Vuelve a los sustantivos y no toques código.
- Prohibido empezar por "un hero centrado y tres tarjetas". Esa no es una decisión de diseño, es la ausencia de una.

### Un solo riesgo, todo lo demás en silencio

**Obligatorio tomar UN riesgo estético de verdad.** No tres tímidos: uno grande, concentrado en un solo sitio, con todo lo demás disciplinado. La fuerza nace del contraste entre un momento que grita y una página que calla.

- Elige **dónde vive el riesgo** (uno solo): la tipografía, una textura o tratamiento gráfico propio, una ruptura de la retícula, un color inesperado, una escala brutal, o un movimiento firma. Uno.
- Riesgo real significa que **podría salir mal**. Si tu "riesgo" es algo que haría cualquier web del sector sin pensarlo (escala grande, oscuro con acento, bento), no es un riesgo: es el promedio con otro nombre. El riesgo y el concepto **no pueden ser el mismo movimiento seguro y de moda**.
- "Silencio" no es minimalismo vacío. El resto de la página puede ser denso, editorial, con textura y estructura. Solo tiene que no competir con el momento fuerte. La "web con un titular enorme, mucho aire y un reveal" es ella misma la plantilla dominante de hoy: la contención no significa vaciar, significa no repartir el grito.

---

## 2. Cómo derivar el concepto del tema

Este paso es obligatorio y va ANTES de la puerta. Cuatro movimientos concretos:

**Vaciar el mundo del tema.** Escribe 10-15 **sustantivos tangibles** del universo del tema: materiales, herramientas, lugares, texturas, jerga del oficio, gestos, sonidos. Sustantivos concretos, no adjetivos de mood. (Ejemplo, taller de relojería mecánica: engranaje, rubí, muelle, micra, lupa, latón, aceite, escape, tic, banco de ajuste.)

**Elegir un ancla física.** De esa lista escoge **una o dos** que se puedan traducir a algo visible o audible en pantalla: un material se vuelve textura o color, un instrumento se vuelve forma o retícula, un gesto o sonido se vuelve movimiento. (Ejemplo: "micra/tolerancia" + "el tic del escape".)

**Traducir el ancla a decisiones de diseño**, apoyándote en el brandkit:
- una **idea tipográfica** con carácter, elegida por un rasgo formal concreto (no por género);
- un **tratamiento de superficie o textura** propio (grano, registro, material), no un fondo plano por defecto;
- una **estructura de retícula** que exprese el ancla en vez de la cuadrícula obvia;
- un **color inesperado** dentro de la lógica del brandkit, no el obvio del sector;
- un **movimiento firma**, uno solo.
(Ejemplo: numerales monoespaciados con cifras tabulares para las "micras", marcas de registro tenues como base de la retícula, paleta latón sobre grafito, y un único tic escalonado, no suave, en un elemento.)

**Fijarlo en dos frases** y dejarlas a la vista todo el build:
- **Concepto:** "Esta web es [ancla del tema] convertida en interfaz."
- **Riesgo:** "La audacia va solo en [un sitio]; todo lo demás se mantiene en silencio."

El ancla que elijas aquí es la que la **ley de coherencia** (sección 6) va a rastrear en la tipografía, la composición, la textura y el motion. Si no tienes un ancla física clara, no puedes pasar la puerta.

---

## 3. Lista negra: clichés de IA prohibidos (POR PATRÓN, no por instancia)

Estos son los defaults que delatan una web "generada". El truco fácil es esquivar el hex o el nombre exacto y repetir el MISMO patrón con otro tono o la fuente de moda del año. Por eso aquí se prohíbe el **patrón abstracto**, con instancias solo como ejemplo (rotan cada temporada).

**Patrones de color/superficie prohibidos:**
- **Un neutro oscuro + un único acento saturado.** Da igual el hue: casi-negro con verde ácido, navy con azul eléctrico, grafito con ámbar, es el mismo patrón.
- **Crema cálida con serif de contraste + acento terracota.** Cualquier crema (#F4F1EA, #EFEAE0, #F2EEE6) con ese emparejamiento.
- **Degradado de dos tonos vecinos sobre claro** (morado-a-azul, teal-a-lima, lo que sea).
- **Glass card semitransparente + borde tenue (~white/10) + sombra suave + blur.** El tell número uno de superficie.
- **Radio uniforme aplicado a todo por inercia** (rounded-lg, rounded-2xl o radio 0, cualquiera aplicado a todo sin jerarquía). La uniformidad ciega es el cliché, no un valor concreto.
- **Barra o riel de acento pegado al borde de una card redondeada.**

**Patrones tipográficos prohibidos:** (detalle en sección 4)
- **Fuente de sistema como cara definitiva** (`system-ui`, `-apple-system`, Segoe, Roboto, Arial).
- **La grotesca de display "de moda del año" como cara principal.** Cambiar Inter o Space Grotesk por el variable sobreexpuesto del momento (Geist, Satoshi, General Sans, Clash, Cabinet, Switzer, Author) es el mismo error con otra cara.
- **La pareja serif + mono "de manual"** como emparejamiento automático.
- **Display gigante + label diminuto como ÚNICO gesto tipográfico**, sin nada más que lo sostenga.

**Patrones de composición prohibidos:** (detalle en sección 5)
- **Todo centrado y apilado.**
- **El patrón "hero + 3 tarjetas + 3 tiers + FAQ"** como estructura por defecto (y su disfraz: 4 cards y 2 tiers es el mismo patrón).
- **Columna izquierda + gran margen vacío a la derecha** como único recurso de asimetría.
- **Bento uniforme o timeline zig-zag** alcanzados como default (son clichés de IA recientes; no son antídotos automáticos).

**Patrones de adorno prohibidos:**
- **Glow radial detrás del hero.**
- **Blob 3D de gradiente flotando.**
- **Iconos de línea uniformes como marcadores de sección** (el emoji como marcador está igual de prohibido: cambiar el emoji por un icono de línea es el mismo cliché).

**Patrones de motion prohibidos:** (detalle en `motion.md`)
- **fade-in-up en cascada** al hacer scroll (el cliché de motion número uno).
- **split-text reveal, count-up, cursor magnético, scroll-scrub** alcanzados por defecto.

### La única salida, con las tres condiciones (no basta una frase)

Un patrón de esta lista se usa **solo si se cumplen las tres** a la vez:
1. Un **sustantivo concreto de tu vaciado** (sección 2) lo exige, y lo nombras explícitamente.
2. Se **rediseña para que NO se lea como el cliché**, y escribes qué cambiaste para lograrlo.
3. Pasa igual el **test del logo intercambiable** (sección 7).

Una justificación en prosa ("el casi-negro con verde encarna la terminal") **no basta**: eso es la puerta trasera que desarma la lista entera. Sin las tres condiciones, el patrón está prohibido.

### Los menús de este documento son el suelo, no el techo

Las alternativas que ofrecen las secciones 4 y 5 (Didone, condensada pesada, bento, timeline, testimonio monumento) son **puntos de partida a superar**, no un catálogo del que elegir. Si tu solución está tal cual en una de esas listas, todavía no distinguiste: la lista es el suelo. Si todos elegimos del mismo menú aprobado, el menú es el nuevo template.

---

## 4. Tipografía con carácter

La tipografía es el primer delator. Antes de leer una palabra, la elección de la cara ya dice si esto lo diseñó alguien con criterio o lo escupió una plantilla. Es la palanca del 80%: cambia la fuente y cambia la sensación entera. Por eso NO se resuelve con la opción segura, ni con la fuente de moda. Se resuelve con una cara que solo tiene sentido para ESTE concepto.

**Regla dura:** si la fuente elegida quedaría bien en cualquier proyecto, es demasiado neutra. La cara correcta se vería **incómoda** en un concepto distinto. Esa incomodidad es la señal de que tiene carácter. **La fuente se elige por un rasgo formal concreto** (el contraste de sus astas, un ink trap, una terminación rara, el ancho de sus contornos), nunca por género ("una sans limpia") ni por estar de moda.

### Elegir la cara por lo que dice

La fuente sale del brandkit. Si el proyecto aún no tiene brandkit, al definir el mínimo se elige la cara con la misma exigencia: que encarne el concepto. Nombra la personalidad del tema en una palabra y busca la cara que la lleve escrita en su forma:

- **Editorial o literario:** un serif con contraste real y un rasgo raro, no el serif de libro anodino. (Aviso de ciclo: el Didone de alto contraste ya es el serif "elegante" sobreexpuesto; si lo usas, que sea por un rasgo concreto, no por defecto.)
- **Técnico o de ingeniería:** una grotesca con actitud o un monospace usado como cara principal y estructural, no la "sans limpia" de siempre.
- **Lujo o autoridad:** una transicional elegante o un display de alto contraste, tracking apretado, mucho aire.
- **Crudo, directo, brutalista:** una grotesca condensada muy pesada, o un mono llevado al extremo como voz única. (Aviso de ciclo: la condensada pesada de plantilla es su propio cliché; motívala por rasgo.)
- **Cercano o expresivo:** una cara con terminaciones inusuales, un display con temperamento propio.

Dos familias como máximo, y solo si hacen trabajos distintos (una display que grita, una de texto que desaparece). Muchas veces **una sola familia con varios pesos y anchos** carga toda la identidad y se ve más deliberada que dos fuentes sueltas.

### Embeber una fuente real (@font-face + data URI bajo CSP)

Contexto de ejecución: en artifacts la CSP **bloquea todo recurso externo** (Google Fonts, CDNs, hojas remotas). Una fuente enlazada por URL no carga y la página cae al sistema, es decir, al cliché. La única forma de tener una cara con carácter en un artifact es **embeberla dentro del propio HTML** como data URI.

Mecánica:
1. Partir de un `.woff2` cuya **licencia permita webfont embedding** (open source tipo OFL/Apache; nunca una licencia de foundry sin derechos de web).
2. **Subsetear** para que pese poco. Solo los glifos que se usan:
   ```
   pyftsubset Face.ttf --unicodes="U+0000-00FF,U+2010-2027" \
     --flavor=woff2 --output-file=Face.subset.woff2
   ```
   Para un titular fijo que nunca cambia (type-as-hero), subsetear a las letras exactas con `--text="LAS PALABRAS DEL TITULAR"`: el archivo baja a unos pocos KB.
3. Convertir a base64 e incrustarlo:
   ```css
   @font-face {
     font-family: "DisplayFace";
     src: url("data:font/woff2;base64,d09GMgAB...") format("woff2");
     font-weight: 400 800;   /* variable: un solo archivo, todos los pesos */
     font-stretch: 75% 125%; /* variable: eje de ancho, condensada a extendida */
     font-display: swap;
   }
   ```
   Ventaja: al viajar dentro del CSS la fuente está lista al parsear. **No hay FOUT** (no hay parpadeo del sistema antes de la cara buena).

### De dónde sale el binario (el hueco que hace caer el carril a fuente de sistema)

El error más peligroso es asumir que hay un `.woff2` a mano y, al no tenerlo, caer en silencio a `system-ui`, que es exactamente el fallo original. Resolver el sourcing SIEMPRE, según el contexto:
- **Web real en código:** descargar la fuente OFL en build y auto-hospedarla. Los paquetes de fuentes open source suelen traer los `.woff2` listos para subsetear y pasar a base64; también valen las descargas oficiales de la foundry open source. Auto-hospedar con `preload` + `font-display: swap`.
- **Artifact sin red:** embeber una cara real que puedas producir como base64. Si de verdad no puedes obtener un binario, el carácter sale de las palancas que SÍ controlas (los ejes de peso y ancho de una variable que sí tengas embebida, el tracking, la escala, las mayúsculas) y de un stack de sistema **elegido a conciencia por su carácter** (un serif o un mono concretos), nunca la sans por defecto pelada. Declara esa restricción; no la escondas.

Después de embeber, **verificar en navegador que la cara buena renderizó y no cayó al sistema**: `document.fonts.check("1em DisplayFace")` o comprobando el `font-family` computado del titular. Una fuente embebida que no se aplica es peor que ninguna: pesa y no se ve.

Presupuesto: base64 infla el binario ~1.33x y el peso cuenta para Lighthouse. Apuntar a subsets `.woff2` por debajo de ~30 KB. Un solo **variable font** suele ser lo más eficiente y encima habilita el contraste de peso/ancho de abajo. Nunca incrustar la fuente entera con sus 5-7 pesos.

### Tipografía como PROTAGONISTA

Con la cara elegida, el diseño se construye con el tipo al frente, no como relleno. Cinco palancas:
- **Contraste de escala brutal.** No una escala tímida 16/20/24/32. Saltos violentos: un display de 96-160px pegado a una etiqueta de 12-13px, sin peldaños intermedios en la misma zona. Line-height del display muy ceñido (0.9-1.02).
- **Tracking intencional.** Display grande apretada (-0.02 a -0.05em): a ese tamaño el espacio por defecto se ve suelto y amateur. Etiquetas en mayúsculas abiertas (+0.1 a +0.25em). Un titular de 100px con tracking normal delata que nadie lo tocó.
- **Mezcla de pesos y anchos DENTRO de una familia** antes de meter otra fuente: un Black contra un Light, una condensada contra una extendida (ejes `font-weight` y `font-stretch` de una variable). Contraste intencional a coste de un solo archivo.
- **Type-as-hero.** En muchos conceptos el titular enorme ES la imagen. Antes de buscar un visual, probar si el tipo solo ya carga la sección.
- **`text-wrap`.** `text-wrap: balance` en titulares, `text-wrap: pretty` en párrafos. Detalle barato que separa lo pulido de lo descuidado.

---

## 5. Composición: romper la retícula

La retícula predecible es la firma que delata una web "hecha por IA": todo centrado, un bloque debajo de otro, tres cajas iguales, tres columnas de precio iguales. Cada sección se compone **eligiendo una estructura a conciencia**, nunca dejando caer el contenido al centro por inercia.

### "Todo centrado" está prohibido por defecto

El centrado no se hereda: se justifica caso por caso. La alineación por defecto de un bloque de texto es al borde de su columna (izquierda en lectura occidental), no al eje central de la pantalla. El centrado solo se gana en:
- una sola frase manifiesto que ES la sección (un hero de una línea, un cierre);
- un dato o número único que funciona como monumento;
- un cuerpo de lectura larga y estrecha (60-75 caracteres) donde centrar el bloque (no el texto) ayuda al foco.

Regla dura: en toda la página, **como máximo una o dos secciones centradas**, y solo las que se ganaron el centrado. El resto vive fuera del eje.

### Los sistemas editoriales (la caja de herramientas)

Cada sección elige uno según lo que tiene que hacer, y **entre secciones se alternan** para dar ritmo (nunca dos seguidas iguales). Recuerda: estos son el suelo, no el techo, y **cuál elige cada sección debe expresar el ancla del concepto**, no elegirse por variedad mecánica.

- **Asimetría.** El peso no se reparte 50/50. Título grande a un lado, apoyo al otro con otra proporción (5/7 o 4/8 de 12). El vacío es composición, no error.
- **Retícula real de 12 columnas** cruzada de forma desigual: un elemento en 1-7, el siguiente en 8-12, el de abajo arranca en la 3. La retícula existe para romperla con criterio, no para partir todo en tercios iguales.
- **Solapes (overlap).** Elementos que se pisan: una imagen bajo un titular, una card mordiendo un bloque de color, un número enorme detrás del texto. Da profundidad y quita el aire de cajas apiladas.
- **Full-bleed.** Una franja al 100% del ancho de viewport que rompe el contenedor centrado. Para el momento fuerte, no para todo.
- **Off-center / ancla desplazada.** El foco no vive en el centro geométrico; se desplaza a un tercio y el resto orbita. Rompe la simetría de espejo que hace que todo parezca el mismo template.
- **Un ancla visual grande.** La sección tiene UN elemento dominante (un titular gigante, una imagen a sangre, un número, un objeto) y todo lo demás baja de tamaño y de voz para servirlo.

### El esqueleto de contenido no dicta la forma

El orden de secciones responde a una pregunta: **qué información aparece y en qué orden de persuasión**. Es una secuencia de contenido. No dice, y nunca debe dictar, qué forma tiene cada bloque. Convertir ese esqueleto en su forma cliché es el error a matar.

| Bloque del esqueleto (el QUÉ) | Forma por defecto prohibida | Se resuelve eligiendo |
|---|---|---|
| Apertura / hero | Eyebrow + título + botón, centrado y apilado | Asimetría u off-center con un ancla grande |
| Tres capacidades o beneficios | Tres tarjetas iguales en fila | Retícula desigual, bento con jerarquía, o una heroe + lista |
| Cómo funciona en N pasos | N tarjetas iguales | Línea de tiempo, números gigantes, o sticky de dos zonas |
| Planes o precio | Tres columnas iguales, destacar la del medio | Tabla, plan ancla, precio único full-bleed |
| Prueba / testimonios | Tres citas en tres tarjetas | Un testimonio monumento o un muro asimétrico |

Si una sección terminada se describe con "hero + 3 tarjetas + 3 tiers", no está terminada: está sin componer.

### Estructuras alternativas para el mismo contenido

Antes de construir una sección, elegir a conciencia una de estas (o una equivalente que exprese mejor el concepto):

**Precios (sin tres cards iguales):** tabla comparativa real (prestaciones en filas, planes en columnas, se lee como documento) · plan ancla dominante (el que quieres vender ocupa el peso, los demás son lista secundaria) · precio único full-bleed (número gigante a sangre + detalle en dos columnas) · escalonado (planes en escalera, tamaños que crecen con el valor).

**Pasos / cómo funciona (sin tres tarjetas):** línea de tiempo vertical con contenido alternando de lado y aire desigual · números tipográficos gigantes (01, 02, 03) como ancla de cada paso · sticky de dos zonas (el número se fija a un lado, el contenido del otro cambia con el scroll) · franjas full-bleed alternas cambiando color entre pasos.

**Beneficios o capacidades (sin la fila de tres):** bento asimétrico con jerarquía visible (la celda importante ocupa el doble) · una heroe + lista (un beneficio con demostración visual grande, el resto en lista de texto limpia) · lista editorial numerada sin tarjetas, separada por aire y no por bordes.

**Prueba social (sin tres citas iguales):** testimonio monumento (una cita enorme a pantalla, atribución pequeña) · muro asimétrico (mosaico irregular o marquee contenido) · dato de resultado como ancla (una métrica gigante sostiene la sección, una o dos citas la apoyan desplazadas).

Regla general: la forma sale de la jerarquía del contenido y del concepto, no de un default. Si de verdad hay pocos elementos de igual peso, una fila simétrica puede justificarse, pero es una decisión consciente que se argumenta, no la salida automática.

---

## 6. Ley de coherencia (lo que ata el concepto al DOM)

Una piel temática sobre un layout arbitrario es "distinto-ish", no un 9. La singularidad es lo que separa el 9 del 7, y nace de **una sola idea atravesando todo**.

**Regla dura:** el ancla física del concepto (sección 2) tiene que verse en al menos **3 de las 4 palancas**: tipografía, composición, textura/color, motion. Y **cada rastro apunta a un elemento o selector concreto** que lo renderiza, no a una afirmación en prosa. Escríbelo así:

- Tipografía: el ancla vive en `[qué elemento]` porque `[qué decisión formal]`.
- Composición: el ancla vive en `[qué sección/estructura]` porque `[qué decisión de layout]`.
- Textura/color: el ancla vive en `[qué superficie/token]` porque `[qué material del tema]`.
- Motion: el ancla vive en `[qué gesto]` porque `[qué idea del tema dramatiza]`.

Si cada palanca grita una idea DISTINTA, falla por ruido: no es singularidad, es un collage. Si el ancla solo aparece en una palanca (o solo como adorno de fondo), falla por decoración. El **test de estructura** es parte de esta ley: el concepto tiene que haber cambiado al menos una decisión de layout o jerarquía, no solo la piel.

---

## 7. La puerta de distinción (auto-chequeo objetivo antes de construir Y antes de cerrar)

No se pasa con prosa. Cada punto es objetivo o apunta a un elemento real. Si uno falla, se rediseña.

1. **Test del logo intercambiable (primario).** Cambia el logo por el de un competidor real. Si nadie notaría la diferencia, es genérica. Se rediseña. No pasa si podrías intercambiar el logo y nadie lo notaría.
2. **Test de las 2 referencias reales.** Nombra 2 sitios o productos reales y concretos a los que se parece. Si puedes nombrarlos, copiaste una plantilla: se rehace.
3. **Nombre del ancla.** Di en una palabra física qué ancla del tema gobierna la página. Si solo puedes decir "se ve limpia y moderna", no hay concepto: vuelve a la sección 2.
4. **Ley de coherencia (sección 6).** El ancla se rastrea a un elemento concreto en 3 de 4 palancas. Si no, falla.
5. **Test de estructura.** El concepto cambió al menos una decisión de layout o jerarquía. Si solo cambió color/textura/fuente, es decoración: no pasa.
6. **Escaneo de micro-defaults.** Ninguno aparece "porque quedaba bien": glass card + borde tenue + sombra suave + blur · glow radial tras el hero · blob 3D de gradiente · iconos de línea uniformes como marcadores · fade-in-up en cascada · degradado de dos tonos vecinos · radio uniforme sin jerarquía. Si aparece uno, tiene que pasar las tres condiciones de la sección 3 o se quita.
7. **Diversidad interna.** No hay dos secciones con el mismo tratamiento repetido; el copy no es de plantilla ("Construye más rápido, envía más inteligente" es humo).
8. **Overflow y contención (comparte con la regla de medición).** Las técnicas de composición que más desbordan (full-bleed 100vw, solapes, off-center, spans asimétricos) se miden en 375 y 1280: 0 desbordes horizontales, y el layout mobile rehecho, no solo encogido.

Si el "riesgo" resultó ser en realidad un default de la lista negra, o no sabes de qué material o instrumento del tema salió la idea, no pasa la puerta.

---

## 8. Fundamentos que no cambian

Distinción no es descuido. Estos sistemas se aplican siempre, por debajo del concepto.

**Color (HSL, 3 roles).** Pensar en HSL (Hue, Saturation, Lightness) facilita variar sin romper la armonía. Tres roles: **Primary** (la marca), **Accent** (CTAs y highlights), **Neutral** (texto, fondos, bordes). Contraste: cuerpo mínimo 4.5:1, display/botones mínimo 3:1. Casi-negro sobre casi-blanco (~18:1) en vez de negro puro para evitar el brillo duro. Sobre fondo oscuro, colorear con una **escala sólida**, nunca opacidad de texto suelta. El hue va con el mood, pero recuerda: "oscuro + un acento" es un patrón prohibido si es todo lo que hay.

**Grid y jerarquía.** Grid de 12 columnas (divide en 1, 2, 3, 4, 6). Espaciado de 8 puntos (todo múltiplo de 8): la alineación es la forma más barata de parecer deliberado. Jerarquía de 5 niveles: Anchor → Support → Context → Meta → Background. Whitespace: si algo se siente apretado, doblar el padding antes de reducir contenido. Padding de sección 96-160px, título-a-cuerpo 24-48px, elemento-a-elemento 16-32px.

**Escala tipográfica de referencia** (punto de partida, el concepto la tensa): Display 80-160px solo el hero · H1 48-72px · H2 32-40px · Body 16-18px (line-height 1.5-1.65) · Small 12-14px en mayúsculas con tracking 0.1-0.2em.

**Mobile (siempre verificado).** Apilar vertical, reducir el tipo 25-35% respecto a desktop, escalar el display con `clamp()` para que no desborde, touch targets ≥44px, convertir hover en tap. **Rehacer** el layout mobile, no solo encogerlo. Medir a 375, 0 desbordes.

---

## 9. Ejemplo: de genérico a distintivo (copia el MÉTODO, no el gesto)

Este es el mismo brief resuelto dos veces. **Copia la derivación (los cuatro ejes atravesados por una idea), nunca el gesto concreto:** reciclar "la columna que se vacía" para cualquier app es fabricar un nuevo genérico.

**El brief:** landing para una app de trabajo profundo. Un temporizador que silencia notificaciones y hace trabajar en bloques de foco. Público: gente saturada que no consigue concentrarse.

### Versión GENÉRICA (la que sale por defecto, a evitar)

- **Concepto:** ninguno. "SaaS moderno", podría vender cualquier cosa.
- **Tipografía:** una sola sans segura en todo, un peso alto para titulares. Sin carácter.
- **Composición:** todo centrado. Hero (título + subtítulo + dos botones), tres cards de features con iconito, tres tiers en tres cajas, FAQ. Fondo casi-negro con un acento verde ácido. Todas las esquinas redondeadas. Cards flotando.
- **Motion:** fade-in-up en cada card al scroll, más un contador que sube. Movimiento en todas partes, significado en ninguna.

Resultado: competente y muerto. Clonado de otras mil. Pasaría los gates de ejecución (rápido, sin overflow, accesible) y aun así es genérico: por eso la puerta de distinción existe aparte.

### Versión REDIRECCIONADA (distintiva)

- **Ancla del concepto:** *el foco es sustracción, una sola cosa a la vez*. La página ENCARNA el producto: en vez de amontonar bloques, muestra poco y hace del tiempo el protagonista físico.
- **Tipografía (palanca 1):** display en una grotesca condensada industrial de peso alto (embebida como data URI, no de sistema), tensa como un cronómetro de taller. El contador va en una mono humanista con dígitos tabulares: aquí la mono NO es la pareja de manual, ES el reloj, carga significado. Rastro concreto: el `h1` del hero y el `[data-timer]`.
- **Composición (palanca 2):** rompe la retícula centrada. Columna única alineada a la izquierda contra un margen ancho de silencio a la derecha (la sustracción hecha layout). Un número gigante desplazado del centro marca el bloque de foco. Los tres tiers colapsan a UNA sola oferta, coherente con "una sola cosa a la vez", presentada como fila y no como tres cajas que compiten. Radio mínimo, superficie de tinta sobre papel en vez de card flotante. Rastro: la sección `.pricing` de una sola oferta.
- **Textura/color (palanca 3):** el fondo no es el casi-negro de catálogo; tinta profunda cálida o piedra según el brandkit, con un grano tenue de papel de taller. Rastro: el token de superficie del `body`.
- **El único momento de motion (palanca 4):** al cargar el hero, una sola columna vertical (un hairline con masa) se vacía de lleno a cero una vez, en ~2.5s con `ease-out`. Es un bloque de foco ocurriendo ante los ojos. Nada más se mueve. En `prefers-reduced-motion`, la columna se muestra congelada a medio vaciar, misma composición y mismo significado, sin salto. Rastro: `[data-focus-bar]`.

**Por qué funciona:** es el mismo esqueleto de negocio que la versión genérica (gancho, promesa, prueba, oferta), pero el ancla ("sustracción") se rastrea en las cuatro palancas hasta un elemento concreto, y el único gesto ES la promesa, no un adorno pegado encima. Ahí está la diferencia entre un 5 y un 9: no más efectos, sino una idea propia del tema atravesando tipografía, composición, textura y un solo momento de movimiento. Un segundo brief (una app de meditación, un banco, una imprenta) tiene que salir de SU propio vaciado de sustantivos: si reaparece "la columna que se vacía", copiaste el gesto en vez del método.
