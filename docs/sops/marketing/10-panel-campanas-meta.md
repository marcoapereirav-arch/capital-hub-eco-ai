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

### Y una que ya estaba, reforzada

**El tamaño lo decide el CSS y se lee de vuelta.** El lienzo se mide con `ResizeObserver` en
píxeles reales (`useCaja`), nunca se estira con `preserveAspectRatio="none"`. Eso permite que
el alto del gráfico sea `h-[176px] md:h-[236px]`: en un teléfono, 236 puntos de gráfico se
comen media pantalla. El candado del brandkit lo caza si un gráfico no tiene ni una
instrucción de teléfono.

---

## El selector de métricas

**48 métricas verificadas contra la cuenta real**, no sacadas de la documentación: se le
preguntó a Meta campo por campo qué acepta y qué devuelve con datos.

Van **agrupadas por familia de variantes**, porque Meta ofrece varias versiones de la misma
idea y no lo dice:

| Familia | Versiones |
|---|---|
| CTR | 8 |
| Vídeo | 8 |
| Resultados | 7 |
| Clics | 6 |
| Coste por clic | 6 |
| Calidad | 5 |
| Alcance | 5 |
| Gasto | 4 |

Cada una con su explicación en lenguaje normal. Las que Meta acepta pero hoy vienen vacías
(ROAS, valor de compra, recuerdo del anuncio) salen marcadas **"hoy sin datos"**, para que
nadie las elija y luego vea una columna en blanco.

### Las que Marco pidió expresamente

Van las primeras y marcadas. Son las que cuentan **personas y no clics**:

| Métrica | Qué mide |
|---|---|
| `unique_outbound_clicks_ctr` | CTR saliente único |
| `unique_outbound_clicks` | Clics salientes únicos |
| `cost_per_unique_outbound_click` | Coste por clic saliente único |

**Por qué importan:** el CTR normal cuenta todos los clics, incluidos los que no llevan a
ninguna parte (me gusta, comentar, ver más). El saliente único cuenta **personas distintas
que llegaron a nuestra web**. En la cuenta de Capital Hub, el mismo periodo daba 1,65% de
CTR normal y 2,26% de CTR saliente único: no son el mismo número ni miden lo mismo.

---

## Cosas que se aprendieron construyéndolo

### Meta rechaza campos que su propia documentación lista

`total_unique_actions` está documentado y la API lo rechaza. Por eso existe
`comprobarCampos()` en `lib/meta/insights.ts`: pide todos los candidatos, y si Meta rechaza
uno, lo aparta y reintenta con el resto.

**Gotcha dentro del gotcha:** al buscar qué campo culpa Meta en su mensaje de error, hay que
buscarlo **como palabra completa**. `actions` es subcadena de `total_unique_actions`, así que
una búsqueda simple acusa al inocente y descarta una métrica que funciona perfectamente. Se
busca con límites de palabra y, si encajan varios, gana el más largo.

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
