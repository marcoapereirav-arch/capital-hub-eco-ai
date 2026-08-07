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

Primero el filtro, después los gráficos y al final la tabla. **Lo visual manda**: al entrar
se ve el embudo y la evolución, no una rejilla de cifras.

| | |
|---|---|
| **El filtro de fechas** | El del OS, el mismo del dashboard principal. Manda sobre todo lo de abajo |
| **El selector de métricas** | Eliges cuáles ves. Se guarda para la próxima vez |
| **Los números grandes** | Las seis primeras que elijas, con la flecha de cuánto cambió |
| **El embudo** | De la impresión al lead, con el porcentaje de caída entre pasos |
| **El gasto día a día** | Barras. Se toca una y se fija su dato debajo |
| **En qué se va el dinero** | Comparativa entre campañas, de mayor a menor |
| **Tus campañas** | La lista, ordenable y con buscador |

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

### 2026-08-07: creación
Sustituida la pantalla anterior, que tenía cuatro números de la cuenta entera, sus propios
botones de periodo y un ROAS fijo escrito en el código. Ahora: filtro del OS, selector de 48
métricas verificadas, tres gráficos y la lista de campañas. Verificado en el navegador a
375px y a 1280px, sin desplazamiento lateral y con las zonas táctiles a 44 puntos.
