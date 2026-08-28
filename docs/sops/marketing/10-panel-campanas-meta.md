---
title: Panel de Campañas de Meta
order: 10
---

# Panel de Campañas de Meta

La pestaña **Campañas** de Ads. Lo que se gasta en Facebook Ads y lo que produce, en vivo.

Complementa a [`09-eventos-meta-catalogo`](09-eventos-meta-catalogo.md), que explica qué
MEDIMOS. Este explica qué VEMOS.

---

## Qué hay, y en qué orden

Va en **rejilla**, no en columna, con un elemento héroe grande arriba. Primero el filtro,
después los gráficos y al final la tabla. **Lo visual manda**: al entrar se ven dibujos, no
una hoja de cálculo.

| | Forma | Qué contesta |
|---|---|---|
| **El filtro de fechas** | — | El del OS. Manda sobre todo lo de abajo |
| **El selector de métricas** | — | Eliges cuáles ves. Se guarda para la próxima vez |
| **Los números grandes** | Cifra + mini línea + cambio | Cómo va lo que te importa |
| **Gasto y leads, día a día** | Área verde + columnas, con ficha flotante | Cuándo se gastó y cuándo entraron |
| **En qué se va el dinero** | Rosco grueso + leyenda con % e importe | Qué campaña se lleva el presupuesto |
| **Embudo** | Barras finas de progreso | Dónde se cae la gente |
| **Cuánto cuesta un lead** | Medidor de aguja con marca del periodo anterior | Si está caro o barato respecto a antes |
| **Dónde se muestra** | Tres anillos de progreso | Instagram o Facebook, y cuál sale mejor |
| **Qué día deja sus datos la gente** | Barras en cápsula, número encima | Qué día de la semana convierte |
| **Qué edad responde** | Barras horizontales | Qué tramo de edad sale más barato |
| **Tus campañas** | Tabla | La cifra exacta, ordenable y con buscador |

---

## El lenguaje visual de los gráficos

Sacado de una referencia de trece paneles profesionales que trajo Marco el 2026-08-11. Es
**ley para cualquier gráfico nuevo del OS**, no solo para Ads.

| Regla | Por qué |
|---|---|
| **Cero rejilla y cero líneas de eje** | En la referencia, nueve de cada diez gráficos no las tienen. El eje es texto gris flotando, sin raya. La rejilla convierte el gráfico en una hoja de cálculo |
| **El número va ENCIMA de la barra**, no en un eje vertical | Hace de eje y se lee de un vistazo. Cumple igual la regla de "cada dato con su número" |
| **Degradado dentro del propio trazo**, nunca color plano | El relleno se apaga hacia abajo hasta desaparecer. Solo verde sobre verde: el brandkit prohíbe degradados de varios colores |
| **Ficha flotante siempre a la vista** | Tarjeta con la fecha y la cifra, unida al dato por una vertical de puntos y un punto gordo sobre la curva. Es el detalle que más separa un panel profesional de una gráfica de manual |
| **Un solo elemento saturado por bloque** | El resto en gris. Verde = lo mejor o lo activo, no adorno |
| **Rampa monocroma para repartos** | Verde a distintas opacidades. Nunca varios colores para distinguir porciones |
| **Barras en cápsula con carril fantasma** | El carril marca el máximo, la cápsula lo alcanzado |

### Y seis más, de la revisión visual del panel ya terminado

Todas eran defectos medibles sobre el píxel, no opiniones:

| Regla | El fallo que la genera |
|---|---|
| **Las escalas se redondean** (1-2-5 x 10ⁿ) | El eje decía "54,58 € / 36,02 € / 18,01 €". Se rotula 60 / 40 / 20 / 0. Y los cortes van en **tercios exactos**, no en 0,66 y 0,33, o vuelve a salir "39,60 €" |
| **Una barra ocupa el 60-80% de su banda** | Salían de 10 puntos en bandas de 88: hilos. Y a ese ancho, fuera el carril fantasma |
| **Un embudo ESTRECHA** | Cuatro barras del mismo ancho apiladas son una lista, no un embudo |
| **Todas las tarjetas de una fila llevan el mismo adorno** | La mini línea estaba en 1 de 5 y las otras cuatro dejaban un hueco |
| **Un dibujo codifica UNA cosa** | El aro decía "cuánto se lleva" y el color "qué lead sale más barato": Instagram con el 68% salía más apagado que Facebook con el 32% |
| **En una leyenda se enseña lo que DIFERENCIA** | Tres campañas con el mismo prefijo se cortaban justo después de él y se leían iguales. `loQueLasDiferencia()` quita lo repetido |

Más: **una cifra dentro de un aro necesita hueco.** El número del rosco medía 106 puntos
dentro de un agujero de 117. El aro se adelgaza hasta que quepa con aire y la cifra vive en
una caja del 70% del diámetro interior. Y **sin dato no es un error**: "sin leads" iba en
rojo y parecía una avería; es gris.

### Y una que ya estaba, reforzada

**El tamaño lo decide el CSS y se lee de vuelta.** El lienzo se mide con `ResizeObserver` en
píxeles reales (`useCaja`), nunca se estira con `preserveAspectRatio="none"`. Eso permite que
el alto del gráfico sea `h-[176px] md:h-[236px]`: en un teléfono, 236 puntos de gráfico se
comen media pantalla. El candado del brandkit lo caza si un gráfico no tiene ni una
instrucción de teléfono.

---

## Qué se ve, y a qué altura

El panel tiene **tres niveles**, y se eligen a mano con pestañas encima de la tabla:
**Campañas**, **Conjuntos** y **Anuncios**. Mandan sobre la tabla y sobre el rosco del reparto.

Antes esto no se elegía: el panel lo deducía solo (si había una campaña marcada, bajaba a
conjuntos) y los anuncios no existían en ninguna parte del código. Marco, 2026-08-28: *"esta
es una campaña, pero dentro hay dos conjuntos... quiero también seleccionar los conjuntos que
quiero ver internamente con estas métricas"*.

El selector de arriba (**Viendo**) marca con casillas a los tres niveles, cada uno en **su
propia pestaña**. Reglas de cómo se comportan entre ellos:

- Las campañas se ofrecen siempre todas.
- Los conjuntos se acotan a las campañas marcadas; **si no hay ninguna marcada, salen todos**.
  Antes había que marcar la campaña primero, o sea adivinar de quién colgaba el conjunto.
- Los anuncios se acotan a los conjuntos marcados, y si no los hay, a las campañas marcadas.
- Al desmarcar una campaña se **sueltan sus conjuntos y sus anuncios**. Si no, quedarían
  filtrando por algo que ya no está marcado y los números no cuadrarían con la etiqueta.
- La lista de cada nivel se pide **sin filtrar por sí misma**: si los anuncios se filtraran
  por los anuncios marcados, al marcar uno desaparecerían los demás y no habría forma de
  desmarcarlo.

### Una lista cada vez, de 20 en 20

Los tres niveles empezaron apilados en el mismo desplegable y se convirtió en un scroll sin
fin: la cuenta tiene más de cien anuncios y para llegar a ellos había que pasar por encima de
todo lo demás. Ahora hay una pestaña por nivel, con su número al lado (los marcados en verde,
o el total si no hay ninguno), y dentro se pintan 20 con un botón que suma las siguientes.

**La regla de las 20 filas vale también dentro de un desplegable.** No es solo para las
tablas de una página.

"Toda la cuenta" y las pestañas van **fijas**, fuera del scroll: el reset se perdía al bajar.

---

## El selector de métricas

**53 métricas verificadas contra la cuenta real**, no sacadas de la documentación: se le
preguntó a Meta campo por campo qué acepta y qué devuelve con datos.

Van **agrupadas por familia de variantes**, porque Meta ofrece varias versiones de la misma
idea y no lo dice: nueve CTR distintos, ocho de vídeo, siete formas de contar clics.

Cada una con su explicación en lenguaje normal. Las que Meta acepta pero hoy vienen vacías
(ROAS, valor de compra, recuerdo del anuncio) salen marcadas **"hoy sin datos"**, para que
nadie las elija y luego vea una columna en blanco.

### REGLA DURA: los nombres son los de Facebook, literales

**No se traducen, no se acortan y no se mejoran.**

Marco, 2026-08-28: *"tienen que estar exactamente todas las métricas que están en Facebook
Ads con el mismo nombre y todas exactas que están ahí. No te lo voy a volver a repetir."*

El motivo no es estético: si el panel dice "CTR por persona" y Facebook dice "CTR único
(todos)", **nadie puede comparar las dos pantallas** y el panel deja de servir para lo único
que existe. Lo que explica qué mide cada métrica va en su descripción, nunca en el nombre.

Lo que había antes y por qué estaba mal:

| Decía el panel | Se llama en Facebook |
|---|---|
| Gasto | Importe gastado |
| Personas que hicieron clic | Clics únicos (todos) |
| CTR por persona | CTR único (todos) |
| Coste por persona que hace clic | CPC único (todos) |
| Llegaron a la mitad | Reproducciones de vídeo hasta el 50% |
| Reproducciones completas | ThruPlays |
| Calidad del anuncio | Clasificación de calidad |

La regla llega también al **embudo** y al **medidor**, que decían "Cargaron la página" y
"Leads": ahora dicen "Visitas a la página de destino" y "Clientes potenciales".

### Y NUNCA una etiqueta que diga quién pidió la métrica

Tres métricas llevaban colgado un cartel que decía **"la que pediste"**. Marco, 2026-08-28:
*"¿Para qué cojones pones eso? Esto es un dashboard."*

Fuera de la interfaz **y fuera del modelo de datos**: se borró también el campo que lo
alimentaba. Una métrica se justifica por lo que mide, no por quién la pidió.

## Cosas que se aprendieron construyéndolo

### Meta rechaza campos que su propia documentación lista

`total_unique_actions` está documentado y la API lo rechaza. Por eso existe
`comprobarCampos()` en `lib/meta/insights.ts`: pide todos los candidatos, y si Meta rechaza
uno, lo aparta y reintenta con el resto.

**Gotcha dentro del gotcha:** al buscar qué campo culpa Meta en su mensaje de error, hay que
buscarlo **como palabra completa**. `actions` es subcadena de `total_unique_actions`, así que
una búsqueda simple acusa al inocente y descarta una métrica que funciona perfectamente. Se
busca con límites de palabra y, si encajan varios, gana el más largo.

### Hay métricas que NO son campos: viven dentro de `actions`

"Visitas a la página de destino" y "Clientes potenciales" salen en el administrador de
anuncios como una métrica más, así que lo natural es pedírselas a la API por su nombre.

**No existen como campo.** Y no fallan solas: meter una sola de ellas en `fields` hace que
Meta **rechace la petición entera**, así que el panel completo se queda en blanco, no la
métrica que falta.

Viven dentro del bloque `actions` (y su coste dentro de `cost_per_action_type`), que sí son
campos. En el catálogo van marcadas con `fuente: "accion"` y se calculan después. Los campos
que se le piden a Meta salen de `camposPedibles()`, que las excluye a propósito.

Afecta a cuatro: `landing_page_views`, `cost_per_landing_page_view`, `leads` y
`cost_per_lead`.

### Un número que la pantalla calcula pero no deja elegir es un número invisible

El panel ya calculaba leads, coste por lead y visitas a la web para el embudo y el medidor,
pero **no estaban en el catálogo de métricas**, así que no se podían poner en la fila de
números grandes ni en las columnas de la tabla. Marco los buscó y no los encontró.

Si un dato ya se está calculando, tiene que poder elegirse. Y sale del **mismo sitio** que la
métrica del catálogo (`out.visitasWeb = out.landing_page_views`), no de un cálculo paralelo:
dos caminos hasta el mismo número acaban discrepando.

### Un recorte silencioso en la pantalla es una mentira

La fila de números grandes tenía un `.slice(0, 5)`. El selector decía "(9)" y la pantalla
enseñaba cinco. Nada avisaba.

**Si algo no cabe, se pagina o se avisa; no se corta por detrás.**

### El nombre de una persona no se pasa por un traductor de códigos

La segunda línea de cada fila mostraba el objetivo de Meta, que viene en MAYÚSCULAS y en
inglés (`OUTCOME_LEADS`), y se traducía a minúsculas. Al reutilizar esa fila para conjuntos y
anuncios, el nombre del padre pasaba por el mismo traductor: `B02 | ESP | Giorgia Test` salía
como `b02 | esp | giorgia test` y dejaba de coincidir con Facebook.

Ahora solo se traduce lo que **parece** un código de Meta (`/^[A-Z0-9_]+$/`). Cualquier cosa
con espacios, barras o minúsculas es un nombre puesto por una persona y se deja tal cual.

### Un paso del embudo puede pasar del 100%

"Salieron hacia la web" cuenta **personas** y "cargaron la página" cuenta **visitas**. Quien
entra dos veces suma dos visitas pero una persona, así que el segundo paso puede salir por
encima del primero. Decir entonces "se pierden -16%" es un sinsentido: la pantalla lo dice
con palabras en vez de enseñar un número imposible.

### Sumar nombres de Meta que se solapan triplica el resultado

**El fallo más grave de todos, y salió a la vista solo cuando el panel enseñó dos números del
mismo hecho a la vez.** El embudo decía **75 leads** y el medidor **11,28 € por lead** con
282,02 € de gasto, que son 25 leads. Y las páginas cargadas (1144) salían por encima de los
clics (1011): más llegadas que salidas.

Causa: Meta devuelve el mismo hecho con varios nombres, y **unos contienen a otros**.

| Concepto | Nombres que devuelve Meta | Cuál vale |
|---|---|---|
| Lead | `lead`, `onsite_web_lead`, `offsite_conversion.fb_pixel_lead` | `lead`: ya incluye a los otros dos |
| Visita a la página | `landing_page_view`, `omni_landing_page_view` | `landing_page_view` para web |
| Compra | `purchase`, `offsite_conversion.fb_pixel_purchase` | `purchase` |

El código los **sumaba**, así que cada lead se contaba tres veces. Ahora se coge **el primero
de la lista que exista** (`valorDeAccion` en `src/lib/meta/panel.ts`), y el orden de
`ACCIONES` es la prioridad.

**Regla derivada: sumar cosas que se solapan no da un total, da el mismo hecho repetido.**
Antes de sumar una lista de acciones de Meta hay que saber si un nombre engloba a otro.

**Y una lección de método:** el fallo llevaba días ahí y nadie lo vio. Apareció al poner el
medidor de coste por lead al lado del embudo, porque los dos números se contradecían en la
misma pantalla. **Enseñar el mismo dato de dos formas distintas es un detector de errores.**

### Los promedios no se suman

En la fila de totales de la lista de campañas, el CTR, los costes medios y la frecuencia
salen como "promedio" en vez de un número: sumar el CTR de cinco campañas no significa nada.

### El token de color existía y valía blanco

`--primary` en oscuro vale **blanco**, no el verde del brandkit, así que las barras salían
blancas. Cambiar `--primary` repinta el OS entero y es otro trabajo, así que se añadió un
token nuevo `--brand` (verde `#22C55E`) solo para lo que se dibuja. Nadie lo usaba antes:
añadirlo no cambió ni un píxel de lo existente.

**Y un aviso para el próximo:** dentro de `@theme inline` un color escrito literalmente se
reescribe a canales sueltos (`34 197 94`), que como valor de `background-color` **no es un
color válido y sale transparente**. Se declara `--color-brand: var(--brand)` y el valor real
va en `:root` y en `.dark`, igual que el resto de tokens del proyecto.

---

## Lo que NO hace

- **No toca nada en Meta.** Solo lee. No se crean, pausan ni editan campañas desde el OS.
- **No entra dentro de las campañas** todavía: se ven las campañas, no sus conjuntos ni sus
  anuncios con miniatura. Es lo siguiente.
- **No cruza con el CRM.** Atribución por creativo y coste real por alumno es otro trabajo.
- **No guarda histórico propio.** Se lee de Meta en vivo, sin tabla nueva.

---

## Cambios versionados

### 2026-08-28: tres niveles, y las métricas con el nombre de Facebook

Cinco fallos que encontró Marco de una sentada:

1. **No se podía bajar de nivel.** El panel deducía solo si enseñar campañas o conjuntos, y
   los anuncios no existían. Ahora hay pestañas Campañas / Conjuntos / Anuncios, y el
   selector marca a los tres niveles, cada uno en su propia pestaña.
2. **Los nombres estaban traducidos a mano.** Las 53 métricas pasan a llamarse exactamente
   como en Facebook. Ver la regla dura de arriba.
3. **El cartel "la que pediste"**, fuera de la interfaz y del modelo de datos.
4. **Faltaban métricas.** Añadidas "Visitas a la página de destino", su coste, "Clientes
   potenciales" y su coste, como derivadas de `actions`.
5. **Elegías nueve métricas y veías cinco.** Había un recorte escondido.

Y el filtro, que en la primera versión apilaba los tres niveles en el mismo desplegable y se
volvía un scroll sin fin, pasó a una pestaña por nivel con 20 filas por tanda.

### 2026-08-11: rediseño de los gráficos y arreglo del conteo de leads
Marco rechazó tres versiones seguidas ("horrible, básico, no me estás diseñando el gráfico
que busco") y pasó una referencia con trece paneles profesionales. De ahí sale la sección
**El lenguaje visual de los gráficos** de arriba, que es lo que faltaba: fuera la rejilla y
los ejes, degradado dentro del trazo, ficha flotante, rampa monocroma y el número encima de
la barra.

Cuatro gráficos nuevos: el **rosco** del reparto del gasto, el **medidor de aguja** del coste
por lead, los **anillos** por plataforma y las **barras por día de la semana**. La evolución
pasó de polilínea estirada a curva medida en píxeles con ficha flotante. El panel va en
rejilla, con la evolución como héroe a dos tercios.

Y con el medidor al lado del embudo salió el fallo de los leads triplicados, descrito arriba.
Los números pasaron de 75 leads (imposibles) a 25 (reales, y cuadran con el coste por lead).

### 2026-08-07: creación
Sustituida la pantalla anterior, que tenía cuatro números de la cuenta entera, sus propios
botones de periodo y un ROAS fijo escrito en el código. Ahora: filtro del OS, selector de 48
métricas verificadas, tres gráficos y la lista de campañas. Verificado en el navegador a
375px y a 1280px, sin desplazamiento lateral y con las zonas táctiles a 44 puntos.
