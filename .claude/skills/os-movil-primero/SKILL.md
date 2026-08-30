---
name: os-movil-primero
description: "COMO SE CONSTRUYE cualquier pantalla del OS de Capital Hub. Se activa SIEMPRE que se toca algo dentro de src/app/(main), src/features o src/components/ui: una pantalla, una pestana, un panel, una tabla, un formulario, un modal, un grafico, un boton, un estado vacio. Tambien cuando Marco dice que algo se ve mal en el telefono, que no encaja, que se sale, que no se puede tocar, o pide redisenar, actualizar o arreglar una seccion del SaaS. Dice como se retira el diseno VIEJO que hay dentro (color a mano, fuente mono, mayusculas espaciadas, letra de 10px, botones blancos) y como se rehace la pantalla para el telefono primero y el ordenador despues. Se usa JUNTO con brandkit-capital-hub, nunca en su lugar."
---

# OS movil primero

Esta skill manda cada vez que se toca **cualquier pantalla de `src/app/(main)`**, sus
componentes en `src/features/*` o el kit de `src/components/ui`. Son 35 pantallas y ninguna
queda fuera.

Se usa **junto con `brandkit-capital-hub`**, no en su lugar:

- El brandkit dice **de que color y de que forma** es cada cosa.
- Esta skill dice **como se construye para que funcione en un telefono** y como se retira el
  diseno viejo que hay dentro.

> Marco, 2026-08-02: *"que se deje de disenar con el brandkit VIEJO, que NUNCA mas se vuelva
> a usar el diseno antiguo, y que TODO el saas se adapte al movil porque en el telefono esta
> TODO roto, no encaja nada. SIEMPRE mobile first y que quede bien encajado todo, y luego
> ordenador. Tiene que ser una app nativa."*

Hay un candado que lo hace cumplir: `scripts/check-brandkit.mjs`. Corre al guardar
(`.githooks/pre-commit`), al arrancar el servidor y al construir. Lo que aqui se explica es
lo que ese candado exige.

---

## 0. Antes de escribir una linea: los nombres que SI existen

Este es el fallo mas caro que se puede cometer, y la ley de diseno escrita empuja a el.

La tabla de color de `brandkit-capital-hub` nombra clases como `bg-carbon`, `bg-panel`,
`text-offwhite`, `border-line`, `rounded-card`, `rounded-panel`, `bg-paper`, `text-greenink`
y `text-warn`. **Ninguna de esas clases existe en este proyecto.** Comprobado en el bloque
`@theme inline` de `src/app/globals.css` (linea 12) y en `tailwind.config.ts`, cuyo `extend`
esta vacio. Uso real hoy: `bg-carbon` 0 veces, `bg-panel` 0, `rounded-card` 0, `text-warn` 0.

Si escribes esos nombres, la pantalla sale **sin fondo, sin borde y sin verde**. Se ve
transparente y parece que no hiciste nada.

Los nombres reales son los del tema, y valen lo que dice el brandkit desde el 31 de julio de
2026:

| Lo que quieres | La clase real | Valor |
|---|---|---|
| Fondo de pagina | `bg-background` | `#0F0F12` |
| Superficie de tarjeta o caja | `bg-card` | un punto por encima del fondo |
| Superficie de menu, hoja o emergente | `bg-popover` | un punto por encima de la tarjeta |
| Superficie gris suave (relleno, hover) | `bg-muted` o `bg-secondary` | grafito |
| Borde de caja, campo y separador | `border-border` | visible, no se diluye |
| Texto principal | `text-foreground` | `#F5F6F7` |
| Texto secundario | `text-muted-foreground` | legible de verdad |
| **Accion principal** | `bg-primary text-primary-foreground` | verde `#22C55E` + tinta `#08130C` |
| Acento de marca | `bg-accent text-accent-foreground` | el mismo verde + tinta |
| Foco de teclado | `ring-ring` | verde |
| Error | `text-destructive` / `bg-destructive/10` | rojo del tema |

**La tinta sobre el verde no es decorativa.** Texto blanco sobre `#22C55E` da 2.11 de
contraste y falla; la tinta `#08130C` da 8.31. Nunca `text-white` ni `text-black` encima del
verde: siempre `text-primary-foreground`.

**Aviso en ambar: hoy no existe.** El brandkit dice `#E5B567`, pero no hay token. Si de
verdad hace falta un aviso, se anade **primero** `--color-warn: #E5B567` al bloque `@theme`
de `globals.css` y despues se usa `text-warn`. El candado lee `globals.css` al vuelo: en
cuanto el token existe, la clase pasa a ser legal sola. Lo que no se hace nunca es pintar
`text-amber-400` a mano.

**Trampa de shadcn:** en las plantillas de shadcn, `accent` es el gris suave del hover. Aqui
`accent` **es la marca**. Al copiar cualquier componente nuevo de shadcn hay que cambiar sus
`accent` por `muted`, o cada opcion de menu saldra verde entera. Ya paso.

**Esquinas:** `--radius` vale `0.25rem` (`globals.css` linea 59), asi que la escala ya esta
calibrada y solo se usan dos radios:

```
rounded-lg   = 4px   tarjeta, boton, campo, ficha
rounded-xl   = 6px   panel grande, hoja inferior, modal
rounded-full         SOLO avatares y puntos de estado
```

`rounded-2xl` (16px) y `rounded-3xl` (24px) **no estan redefinidos en el tema**: se quedan en
el valor de fabrica y se ven como una burbuja. Prohibidos. `rounded-none` tambien.

---

## 1. La regla

**Se disena a 375 puntos de ancho y despues se ensancha. Nunca al reves.**

1. Escribes las clases **sin prefijo** pensando en el telefono.
2. Anades `md:` para lo que cambia en el ordenador (768px es el unico corte del proyecto;
   un iPad usa el diseno de ordenador).
3. Si en el telefono el bloque no cabe, **no se encoge: se rehace**. Una tabla no se hace
   pequena, se convierte en lista. Un tablero no se estrecha, se convierte en una columna a
   la vez.
4. Se mira en el navegador a **375** y a **1280**. Las dos, siempre.

Por que insistir: **68 archivos de interfaz del OS no tienen ni una sola instruccion de
telefono** (`sm:`, `md:`, `lg:`). Se dibujan identicos en un movil de 375 y en un monitor de
1920. Esa es la causa madre de que no encaje nada, y todo lo demas es sintoma. El candado la
caza con la senal `pantalla-solo-para-monitor`.

---

## 2. Los seis numeros que no se negocian

| Numero | Que es | Como se escribe |
|---|---|---|
| **44px** | Lo que un dedo acierta. Todo lo que se toca | `h-11` (o la clase `tap-target`) |
| **16px** | Tamano de letra dentro de un campo. Por debajo, iOS se acerca solo | `text-base` (nunca `text-sm` en un campo) |
| **15px** | Cuerpo de texto. Minimo absoluto 14px (`text-sm`) | `text-[15px]` |
| **375px** | El ancho al que se disena y se prueba | |
| **0** | Deslizamiento lateral de la pagina | |
| **2** | Acciones visibles como maximo en una barra de movil | |
| **20** | Elementos por pagina. En TODA lista del OS, sin excepcion | `<ListaPaginada>` |
| **10** | Elementos de una lista dentro de un panel, antes del boton "ver todo" | |

Sobre el minimo de letra: **el zoom con los dedos esta desactivado en la app**
(`userScalable: false` en `src/app/layout.tsx`, linea 49). Si escribes texto de 10px, el
usuario **no tiene forma de agrandarlo**. Por eso el minimo es ley y no opinion.

Sobre los 16px del campo: `globals.css` (lineas 238 a 242) ya fuerza 16px en `input`,
`textarea` y `select` por debajo de 768px. **Pero esa regla vive en la capa base y cualquier
clase de Tailwind la pisa.** Si escribes `text-sm` en un campo, vuelves a encender el zoom
de iOS.

---

## 2 bis. NINGUNA LISTA SE PINTA ENTERA. MAXIMO 20 POR PAGINA

> Marco, 2026-08-07: *"siempre, siempre que vayas a hacer una lista, tiene que haber
> maximo 20. Esto lo tienes que crear en un skill o en algo para que siempre se cumpla"*.

**Se aplica a TODA lista del OS**, sin excepcion: contactos, tareas, invitaciones,
etiquetas, videos, actividad, resultados de una busqueda, filas de una tabla. Da igual que
hoy tenga 8 elementos: manana tendra 800 y nadie va a volver a mirarlo.

### Como se cumple

Se usa **`<ListaPaginada>`** (`src/components/ui/lista-paginada.tsx`). El tamano de pagina
NO se pasa por parametro: es una constante del propio archivo. Asi el dia que cambie,
cambia en todo el OS a la vez, que es exactamente lo que se pidio.

```tsx
import { ListaPaginada } from "@/components/ui/lista-paginada"

<ListaPaginada items={contactos} claveDeFiltros={firmaDeFiltros}>
  {(pagina) => pagina.map((c) => <FichaDeContacto key={c.id} contacto={c} />)}
</ListaPaginada>
```

Ya trae resuelto lo que siempre se olvida:

- vuelve arriba al cambiar de pagina (si no, cambias de pagina y sigues a mitad de lista)
- si un filtro deja menos paginas de las que habia, se cae sola a la ultima en vez de
  ensenar una pagina en blanco
- dice en que punto estas ("Viendo 21 a 40 de 132"), porque si no el usuario no sabe si le
  faltan dos o doscientos
- los dos botones a 44 puntos, y en telefono se reparten el ancho

### El patron de "los ultimos N + ver todo"

Cuando la lista vive **dentro de un panel** (el dashboard, una ficha, una tarjeta), no se
pagina ahi dentro: se ensenan **los ultimos 10** y un boton que abre una ventana con el
historial completo, y **esa ventana si va de 20 en 20** con `<ListaPaginada>`.

Asi esta hecha "Lo que va pasando" del dashboard
(`src/features/dashboard/components/dashboard-activity.tsx`): 10 en el panel, ventana con
todo de 20 en 20.

### Una carta con 20 filas se desplaza POR DENTRO

> Marco, 2026-08-29: *"si hay una lista de mas de 20 filas, tiene que haber un boton de
> siguiente. Haz que la carta no sea un scroll largo, sino que sea un scroll interno."*

Veinte filas alargan tanto la carta que **el boton de pasar de pagina queda fuera de la
vista**, y un boton que hay que ir a buscar no existe. Se le da su propio desplazamiento a
la lista, con dos condiciones:

```tsx
<ListaPaginada items={dias} claveDeFiltros={firma} nombreSingular="día" nombrePlural="días">
  {(pagina) => (
    // 1. Tope de alto: la carta ENTERA (cabecera + lista + Siguiente) cabe en un telefono.
    // 2. `max-h` y NUNCA `overscroll-contain`: con `contain`, una pagina con pocas filas
    //    no tendria nada que desplazar y se tragaria el gesto (seccion 2 ter).
    <div className="max-h-[52dvh] overflow-y-auto md:max-h-[30rem]">
      <ul className="divide-y divide-border">{pagina.map(...)}</ul>
    </div>
  )}
</ListaPaginada>
```

Nota: **no se usa `propioScroll`**, que trae `no-overscroll` incluido. Ahi la caja va por
fuera, dentro del `children`, para que el contador y los botones queden **debajo** del
desplazamiento y siempre a la vista.

Medido: la carta queda en 546 puntos en un telefono de 667 y en 622 en uno de 812.

**Se comprueba con el puntero, no con una captura:** rodar encima de la lista con sitio
dentro (se mueve la lista), llevarla a su final y volver a rodar (se mueve la pagina).

### Lo que NO vale

- `items.map(...)` sobre la lista entera. Es lo que hay que dejar de hacer.
- `items.slice(0, 50)` y ya. Eso no es paginar: es esconder, y el resto no se alcanza nunca.
- Un scroll infinito. En un panel de trabajo no se sabe nunca cuanto queda ni se puede
  volver a un sitio concreto.
- Subir el limite "porque en esta pantalla caben mas". El limite es del OS, no de la
  pantalla.

---

## 2 bis bis. NADA QUEDA DEBAJO DEL BOTON FLOTANTE. En telefono Y en ordenador

> Marco, 2026-08-07: *"el widget de registrar venta no deja darle a crear el link. Esto
> siempre lo debes tener en cuenta en TODAS las pantallas... no es la primera vez que sucede"*.

El flotante "Registrar venta" vive fijo en la esquina de abajo a la derecha, en las 35
pantallas. Lo que cae justo debajo **se ve pero no se puede pulsar**: el clic se lo lleva el
flotante. Y el que siempre cae debajo es **el ultimo boton de la pantalla**, porque ya no
queda contenido para apartarlo desplazando.

**La reserva de sitio va en `PageContainer`, una vez, y vale para las 35.** En telefono ya
estaba; **en ordenador faltaba** (`md:pb-6`), y por eso volvia a pasar:

```
pb-[calc(7rem+var(--sab)+1rem)]  md:pb-24
```

Reglas:

- **Ninguna pantalla pone su accion principal en la esquina de abajo a la derecha.** Ese sitio
  ya esta ocupado.
- **Toda pantalla va dentro de `<PageContainer>`**, que es quien reserva el hueco. Una
  pantalla que se lo salta se lo come.
- **Se comprueba con la pagina AL FINAL**, no al principio: es ahi donde aparece.

`npm run check:movil` lo mide: "Botones que el flotante deja sin pulsar". Un solo boton ahi
cuenta como pantalla rota.

---

## 2 ter. UN SOLO DESPLAZAMIENTO POR PANTALLA. El fallo que congela la app

> Marco, 2026-08-07: *"Esta rota la pantalla, no puedo hacer scroll... arreglalo de raiz, que
> no es la primera vez que sucede"*.

**El desplazamiento de una pantalla lo hace el marco de la app, uno solo.** Ningun bloque
dentro de una pantalla normal tiene desplazamiento propio.

### El fallo, exactamente

Una caja con `overflow-y-auto` **y** `no-overscroll` (`overscroll-behavior: contain`) que **no
tiene nada que desplazar por dentro** no se queda quieta: **bloquea a la pagina**. `contain`
corta el paso del gesto hacia arriba, asi que el dedo o la rueda encima de esa caja no mueven
nada. Y como esa caja suele ocupar casi toda la pantalla (una lista, una tabla), la app
parece congelada.

```
overflow-y-auto  +  no-overscroll  +  contenido que SI cabe   =   pantalla congelada
```

### Por que se cuela una y otra vez

Es un fallo **MUDO**. No hay error en consola, `tsc` y `build` en verde, nada se sale, nada
se recorta, ninguna zona tactil es pequena. **Y la captura de pantalla completa se ve
perfecta**, porque `fullPage` fotografia el documento entero sin desplazar nada.

Solo aparece poniendo el puntero ENCIMA del contenido e intentando desplazar. Si no se hace
esa prueba, no se ve.

### Las tres reglas al escribir

1. **`overflow-y-auto` dentro de una pantalla es sospechoso.** Antes de escribirlo: ¿esta caja
   tiene alto fijo? Si no lo tiene, no lo lleva.
2. **Alto fijo y desplazamiento van juntos.** Alto fijo sin desplazamiento recorta;
   desplazamiento sin alto fijo atrapa. Los dos o ninguno.
3. **`no-overscroll` solo acompana a algo que de verdad se desplaza.**

En `<ListaPaginada>` esto ya esta resuelto: **no crea cajon propio por defecto**. Si la lista
vive dentro de una ventana o una hoja de alto fijo, se pide a la vista con `propioScroll`.

### La comprobacion que faltaba

`npm run check:movil` mide los cajones que atrapan el gesto y marca la pantalla como **rota**,
no como fea. Y a mano, con el puntero encima del contenido:

```js
// Poner el raton en medio del contenido, rodar, y ver si algo se movio.
// Si da 0 y la pantalla NO cabe entera, esta atrapada.
;(() => { let m = 0
  for (const el of document.querySelectorAll('*'))
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) m = Math.max(m, el.scrollTop)
  return Math.max(m, window.scrollY || 0) })()
```

Detalle completo en `docs/sops/producto/62-un-solo-scroll-por-pantalla.md`.

---

## 3. EL MARCO COMUN SE ARREGLA PRIMERO

Antes de tocar ninguna pantalla suelta. Estas piezas salen en **las 35 pantallas a la vez**:
arreglarlas una vez vale por 35, y arreglar una pantalla sin haberlas arreglado es trabajar
encima de algo torcido.

Ninguna de las siete es opinable: las siete estan medidas en el codigo actual.

### 3.1. La barra de arriba se aplasta contra el notch

`src/features/shell/components/mobile-header.tsx` linea 33: el encabezado lleva **altura
fija `h-14` (56 puntos) Y ADEMAS `pt-safe`**. El relleno va por dentro de la altura, asi que
en un iPhone con notch (la franja de arriba mide entre 47 y 59) al titulo y al avatar les
quedan 9 puntos o menos: se desbordan por debajo de la linea y pisan la pagina. Solo se ve
con la app instalada en la pantalla de inicio o girada, porque `src/app/layout.tsx` linea 51
declara `viewportFit: 'cover'`.

```
h-14 pt-safe   ->   h-[calc(3.5rem+env(safe-area-inset-top))] pt-safe
```

Con eso, `h-mobile-content` de `globals.css` (linea 286) pasa a estar bien sin tocarlo.

### 3.2. Con el teclado abierto no se llega al campo ni al boton

Dos causas juntas:

1. `src/app/layout.tsx` no declara `interactiveWidget` en su `export const viewport`. El
   valor de fabrica hace que al abrir el teclado **el alto de la pagina no se encoja**, asi
   que todo lo anclado abajo queda tapado. Se anade:

   ```ts
   export const viewport: Viewport = {
     // ...lo que ya hay...
     interactiveWidget: 'resizes-content',
   }
   ```

2. El desplazamiento de verdad no lo hace la pagina, lo hace un div interno de
   `src/app/(main)/layout.tsx` (linea 75), metido dentro de un envoltorio de altura fija con
   recorte (`src/components/ui/sidebar.tsx` linea 145: `h-svh overflow-hidden`). El iPhone no
   sube el contenido de ese div al enfocar un campo. Por eso las barras de accion y las hojas
   usan **`sticky bottom-0` dentro del contenedor que se desplaza**, no `fixed`.

### 3.3. La hoja inferior no tiene tope de alto

`src/components/ui/sheet.tsx` linea 65: el lado inferior es `data-[side=bottom]:h-auto`, sin
alto maximo y sin desplazamiento propio. Cuando el contenido es largo, **se corta por arriba
y no hay forma de alcanzarlo**. Se ve hoy en el menu "Mas" de la barra inferior: 17 accesos
en dos columnas mas el bloque del usuario mas dos botones, en un telefono de 667 puntos de
alto.

Se arregla en el componente base, no en cada uso:

```
data-[side=bottom]:max-h-[85dvh]
data-[side=bottom]:overflow-y-auto
data-[side=bottom]:pb-safe
```

Y el boton de cerrar de la hoja usa `size="icon-sm"`, que son 28 puntos: a 44 en telefono.

### 3.4. Los tres flotantes viven en el mismo punto, dentro de la barra inferior

Los tres se montan en `src/app/(main)/layout.tsx`:

| Archivo | Donde esta hoy |
|---|---|
| `src/features/sales/components/registrar-venta-widget.tsx` linea 21 | `fixed bottom-4 right-4 z-40` |
| `src/components/UpdateNotifier.tsx` linea 82 | `fixed bottom-4 right-4 z-[100]`, 360px de ancho |
| `src/features/notifications/components/PushNotificationPrompt.tsx` linea 48 | `fixed bottom-4 right-4 z-50` |

La barra inferior mide 56 puntos mas la franja de gestos (34 en un iPhone moderno), o sea 90.
Los tres flotan **dentro** de ella. Cuando aparece el aviso de actualizacion, tapa la barra
de navegacion entera y el usuario se queda sin menu.

Los tres, en el mismo bloque, con la misma cuenta y apilados en orden (no en el mismo punto):

```
className="fixed right-4 z-40 bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6 md:right-6"
```

Y el ancho de un aviso anclado: `w-[min(360px,calc(100vw-2rem))]`.

### 3.5. La ultima fila queda debajo de la barra

`src/components/ui/page-container.tsx` linea 30 pone `px-4 py-4 md:px-6 md:py-6` y nada mas,
y el div que se desplaza tampoco reserva sitio. Resultado: en la mayoria de pantallas, la
ultima tarjeta o el ultimo boton quedan tapados por la barra inferior y no se pueden tocar.
Hoy `pb-mobile-nav` esta escrito a mano en 12 sitios de todo el repo, y hay 35 pantallas.

Se mete **dentro de `PageContainer`**, en esa linea. Es un cambio de una linea que cae en las
35 pantallas a la vez. Despues se quitan los `pb-mobile-nav` sueltos que queden duplicados.

### 3.6. Las tres raices de las zonas tactiles

| Archivo | Que tiene | Que debe tener |
|---|---|---|
| `src/components/ui/button.tsx` | sus ocho medidas van de 24 a 36 puntos | `h-11 md:h-8` en la medida normal, y lo mismo en las demas |
| `src/components/ui/input.tsx` linea 11 | `h-8` (32 puntos) | `h-11 md:h-8` |
| `src/components/ui/textarea.tsx` linea 10 | `text-sm` fijo, sin version de ordenador | `text-base md:text-sm` |

`input.tsx` ya tiene bien la letra (`text-base md:text-sm`), lo cual da la falsa sensacion de
que los campos estan resueltos. **`textarea.tsx` no**, y eso hace que toda nota, descripcion o
mensaje del OS dispare el acercamiento automatico del iPhone.

Arreglar estos tres corrige cientos de sitios de golpe.

### 3.7. La barra de abajo esta descuadrada

`src/features/shell/components/mobile-bottom-nav.tsx` linea 65: la lista es `grid-cols-5`,
pero en `nav-config.ts` solo tres entradas llevan `mobilePrimary: true` (Dashboard,
Operaciones, Knowledge). Con el boton "Mas" suman cuatro, en cinco columnas: se ve corrida a
la izquierda con un hueco vacio a la derecha. Y si el rol del usuario no llega a alguna,
quedan tres en cinco columnas.

No se sale de la pantalla ni recorta nada, asi que **ningun comprobador lo ve**: solo se ve
mirando la foto. Se arregla contando los que de verdad se pintan:

```tsx
const visibles = navPrimary.filter((i) => canAccessRoute(userRole, i.href))
const columnas = visibles.length + 1 // + el boton "Mas"

<ul className="grid" style={{ gridTemplateColumns: `repeat(${columnas},minmax(0,1fr))` }}>
```

O mas simple: `flex` con `flex-1` en cada boton.

---

## 4. Tabla de sustitucion: patron viejo, con que se cambia

Todo lo de la columna izquierda esta medido en este repo (medicion del 02-ago-2026, 5347
senales en 219 archivos). Cuando lo encuentres, se cambia.

### Color

| Lo que hay hoy | Con que se sustituye |
|---|---|
| Cualquier `#RRGGBB` escrito en una pantalla (1155 casos) | El token: `bg-background`, `bg-card`, `text-foreground`, `text-muted-foreground`, `border-border`, `bg-primary` |
| `#37CA37`, el verde viejo (58 casos) | `bg-primary`. Son dos verdes de marca conviviendo |
| `rgb(...)`, `hsl(...)`, `oklch(...)` a mano (119 casos) | El token. `rgb(55,202,55)` es el verde viejo escrito en decimal |
| `bg-white text-[#0F0F12]` (el boton primario viejo) | `bg-primary text-primary-foreground` |
| `text-black` o `text-white` encima del verde | `text-primary-foreground` |
| `bg-gradient-to-br from-green-500 to-green-600` (56 degradados) | `bg-primary` plano. Los degradados de color estan prohibidos |
| `bg-violet-*`, `cyan`, `orange`, `blue`, `purple`, `pink`, `emerald`, `yellow`, `amber` | El token que corresponda |
| `green-*`, `red-*`, `gray-*`, `zinc-*`, `slate-*` de Tailwind (863 casos con todas las familias) | `text-primary`, `text-destructive`, `text-muted-foreground`, `bg-muted`, `border-border` |
| `text-muted-foreground/40`, `text-foreground/60` (119 casos) | El token entero, sin rebajar (SOP 47) |

Hay **1155 colores escritos a mano**. Esta es la razon exacta de que arreglar los tokens el
31 de julio casi no se notara: las pantallas no preguntan por el token, llevan el color
grabado.

**Excepcion, y solo esta:** en `src/lib/email/**`, `src/remotion/**` y las imagenes de
previsualizacion NO existen los tokens (Gmail y Outlook borran las variables CSS, y un video
es un lienzo fijo). Ahi se escribe el hexadecimal, y tiene que ser uno de la paleta oficial.

**Segunda excepcion:** los colores que elige el **usuario** para sus etiquetas, sus etapas de
pipeline o sus nodos son datos de producto, no diseno. Viven en `**/types/*.ts` y
`**/services/*.ts` y el candado no los toca.

### Letra

| Lo que hay hoy | Con que se sustituye |
|---|---|
| `font-mono` (737 casos, 128 archivos) | Nada. Se borra. Inter Tight es la unica familia |
| `font-mono` puesto para alinear cifras | `tabular-nums` (mismo ancho de digito, con la fuente de marca) |
| `uppercase` con `tracking-wider` o `tracking-widest` (429 casos) | Texto normal con `font-semibold`. El tracking ancho es SOLO del wordmark CAPITAL HUB |
| `text-xs`, `text-[10px]`, `text-[11px]`, `text-[0.8rem]` (1404 casos) | `text-sm` (14px) como suelo. Si de verdad sobra sitio en el ordenador: `text-sm md:text-[13px]` |
| `font-mono text-[10px] uppercase tracking-wider` (el trio del diseno viejo) | `text-sm font-semibold text-muted-foreground` |
| `-apple-system`, `Segoe`, `Helvetica`, `SF Pro` (28 casos) | Inter Tight, ya cargada |

El tracking **negativo** (`tracking-tight`, `tracking-[-0.02em]`) aprieta las letras y **si se
usa**: es el idioma natural de Inter Tight en titulares. Ni se toca ni el candado lo marca.

### Forma

| Lo que hay hoy | Con que se sustituye |
|---|---|
| `rounded-none` (8 casos) | `rounded-lg` |
| `rounded-2xl` / `rounded-3xl` (18 casos) | `rounded-xl` |
| `rounded-full` con relleno lateral (boton o ficha en forma de capsula) | `rounded-lg` para boton, `rounded-sm` para ficha |
| `Sparkles` de lucide (29 casos) | Un icono que signifique algo, o ninguno |
| Fondo de rejilla | Prohibido |

### Estructura, que es lo que rompe el telefono

| Lo que hay hoy | Con que se sustituye |
|---|---|
| `grid-cols-3` o mas, sin prefijo (27 casos) | `grid-cols-1 md:grid-cols-3`, `grid-cols-2 md:grid-cols-4` |
| `grid-cols-[1fr_120px_100px_100px_80px]` | Lista de tarjetas en movil, rejilla en `md:` (receta 1) |
| `w-[420px]`, `min-w-[280px]` (16 casos por encima del umbral) | `w-full md:w-[420px]`, `min-w-0 md:min-w-[280px]` |
| `h-8` en botones y campos (62 controles por debajo de 44px) | `h-11 md:h-8` |
| `shrink-0` sobre texto | `flex flex-wrap` + `min-w-0 truncate` en el texto |
| `min-h-screen`, `h-screen`, `100vh` (35 casos) | `min-h-dvh`, `h-dvh`, `100dvh` |
| `fixed inset-0 items-center` como modal (29 casos) | `<Sheet side="bottom">` (receta 5) |
| `opacity-0 group-hover:opacity-100` (11 casos) | Visible en movil (receta 11) |
| `fixed bottom-4` sin zona segura | El calculo de la seccion 3.4 |
| `text-sm` dentro de un campo (33 casos) | `text-base md:text-sm` |

`grid-cols-2` a secas **si se permite**: dos columnas caben en un telefono, y es la forma
correcta de empezar una fila de numeros.

---

## 5. Recetas. Que se REHACE en movil, no que se encoge

### Receta 1. Tabla

**Hoy:** `src/features/tasks/components/task-list.tsx` linea 55 pinta
`grid-cols-[1fr_120px_100px_100px_80px]`. Con huecos y margenes necesita unos 464px, y su
contenedor (linea 53) lleva `overflow-hidden`. En un telefono de 375px, Prioridad y Asignado
**no se pierden de vista: desaparecen**, y no hay forma de llegar a ellas.

**En movil:** una tarjeta por fila. La cabecera de columnas se quita (nadie lee la cabecera
de una tarjeta). Se eligen **tres datos**: el que identifica, el estado y uno mas. El resto
se ve al abrir el detalle.

```tsx
{/* MOVIL: lista de tarjetas */}
<ul className="divide-y divide-border md:hidden">
  {tareas.map((t) => (
    <li key={t.id}>
      <button
        onClick={() => abrir(t.id)}
        className="flex min-h-[56px] w-full flex-col gap-1 px-4 py-3 text-left active:bg-muted"
      >
        <span className="line-clamp-2 text-[15px] font-medium text-foreground">
          {t.titulo}
        </span>
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <EstadoChip estado={t.estado} />
          <span className="truncate">{t.proyecto}</span>
          <span className="tabular-nums">{t.fecha}</span>
        </span>
      </button>
    </li>
  ))}
</ul>

{/* ESCRITORIO: la rejilla de columnas, intacta */}
<div className="hidden md:block">
  ...
</div>
```

**Nunca** se resuelve una tabla en movil con deslizamiento lateral.

### Receta 2. Tablero (kanban)

**Hoy:** `src/features/tasks/components/task-board.tsx` linea 66 pone las columnas en fila
con `w-[280px] shrink-0`. En 375px se ve una columna y media y el resto se arrastra de lado.

**En movil:** una columna a la vez.

- Arriba, una tira con el nombre de cada columna y su numero, deslizable de lado. Este es el
  **unico deslizamiento lateral permitido**, y va dentro de su propia caja, nunca arrastra la
  pagina entera.
- Debajo, la columna elegida a ancho completo, con desplazamiento vertical.
- **Mover una tarjeta no se hace arrastrando.** Arrastrar pelea con el dedo que hace scroll.
  Cada tarjeta abre una hoja inferior con "Mover a" y la lista de columnas.

```tsx
const [columnaActiva, setColumnaActiva] = useState(columnas[0].id)

{/* MOVIL */}
<div className="md:hidden">
  <div className="-mx-4 flex snap-x gap-1 overflow-x-auto px-4 pb-2">
    {columnas.map((c) => (
      <button
        key={c.id}
        onClick={() => setColumnaActiva(c.id)}
        className={cn(
          "h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] whitespace-nowrap",
          columnaActiva === c.id
            ? "bg-primary text-primary-foreground font-semibold"
            : "bg-card text-muted-foreground"
        )}
      >
        {c.nombre} <span className="tabular-nums">{c.tareas.length}</span>
      </button>
    ))}
  </div>
  <div className="space-y-2">
    {tareasDe(columnaActiva).map((t) => <TarjetaTarea key={t.id} tarea={t} />)}
  </div>
</div>

{/* ESCRITORIO: el tablero en fila, intacto */}
<div className="hidden md:flex gap-4">...</div>
```

### Receta 3. Barra de pestanas

**En movil:**

- Hasta 5 pestanas: tira deslizable a ancho de pantalla completa. Se saca del margen con
  `-mx-4 px-4` para que la primera y la ultima toquen el borde y se entienda que hay mas.
  Cada pestana mide 44px de alto.
- Mas de 5: **no** una tira larguisima. Un boton con el nombre de la pestana actual que abre
  una hoja inferior con la lista completa.

```tsx
<div className="-mx-4 flex snap-x gap-1 overflow-x-auto px-4 md:mx-0 md:overflow-visible md:px-0">
  {pestanas.map((p) => (
    <button
      key={p.id}
      onClick={() => setActiva(p.id)}
      className={cn(
        "h-11 shrink-0 snap-start whitespace-nowrap border-b-2 px-3 text-[15px] transition-colors md:h-9 md:text-sm",
        activa === p.id
          ? "border-primary text-foreground font-semibold"
          : "border-transparent text-muted-foreground"
      )}
    >
      {p.nombre}
    </button>
  ))}
</div>
```

Regla: **una tira deslizable nunca puede parecer completa.** Si la ultima pestana termina
justo en el borde, nadie sabra que hay mas. Se deja media pestana asomando.

### Receta 4. Formulario

**En movil:**

- Una sola columna siempre: `grid-cols-1 md:grid-cols-2`.
- Etiqueta encima del campo, nunca al lado.
- Campo a ancho completo, `h-11`, `text-base`. **Jamas `text-sm` en un campo.**
- Se le dice al telefono que teclado sacar: `inputMode`, `autoComplete`, `enterKeyHint`.
- Un desplegable a mano se cambia por `<select>` nativo (el sistema lo pinta como rueda y se
  acierta con el dedo) o por hoja inferior.
- La accion principal va abajo **con `sticky`, no con `fixed`**: el desplazamiento real lo
  hace un div interno (seccion 3.2), y `fixed` se queda pegado a la ventana, que es justo lo
  que el teclado tapa.

```tsx
<form className="grid grid-cols-1 gap-4 md:grid-cols-2">
  <label className="flex flex-col gap-1.5">
    <span className="text-sm font-medium text-muted-foreground">Correo</span>
    <input
      type="email"
      inputMode="email"
      autoComplete="email"
      enterKeyHint="next"
      className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
    />
  </label>

  <div className="sticky bottom-0 z-30 -mx-4 mt-2 border-t border-border bg-background px-4 pt-3 pb-safe-4 md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:col-span-2">
    <button className="h-11 w-full rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-9 md:w-auto md:px-4">
      Guardar cambios
    </button>
  </div>
</form>
```

**Se comprueba con el teclado abierto**, no solo cerrado: se toca el ultimo campo y tiene que
verse el campo Y el boton de guardar. Ningun comprobador automatico hace esto.

### Receta 5. Ventana emergente

**Hoy:** 29 emergentes hechos a mano con `fixed inset-0` centrados, y **cero** `Dialog` del
sistema. Un ejemplo: `src/features/team/components/team-page.tsx` linea 244. Una ventana
centrada en un telefono la tapa el teclado al escribir, y si el contenido es largo no se
llega al boton de guardar.

**En movil: hoja inferior.** Se usa `<Sheet>` del kit, que ademas portalea a `body` y con eso
cierra el bug de overlays atrapados documentado en el SOP 47.

**El lado NO se decide con JavaScript.** `useIsMobile()` devuelve `false` hasta que monta
(`src/hooks/use-mobile.ts` linea 22: *"Before mount, always return false"*), asi que
`side={esMovil ? "bottom" : "right"}` pinta en la primera pasada un cajon lateral de tres
cuartos de pantalla y luego salta abajo. Se deja `side="bottom"` fijo y el escritorio se
ajusta con clases:

```tsx
<Sheet open={abierto} onOpenChange={setAbierto}>
  <SheetContent
    side="bottom"
    className={cn(
      // MOVIL: hoja inferior
      "max-h-[85dvh] w-full overflow-y-auto rounded-t-xl pb-safe-4",
      // ESCRITORIO: cajon por la derecha, con las mismas clases y cero JavaScript
      "md:inset-y-0 md:right-0 md:left-auto md:h-full md:max-h-none md:w-[420px] md:max-w-[420px] md:rounded-none md:border-l md:pb-0"
    )}
  >
    <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
    <SheetHeader className="px-4">
      <SheetTitle className="text-[17px] font-semibold">Detalle</SheetTitle>
    </SheetHeader>
    ...
  </SheetContent>
</Sheet>
```

Detalles que importan:

- `max-h-[85dvh] overflow-y-auto`: la hoja nunca tapa la pantalla entera y su contenido se
  desliza dentro. Mientras no este puesto en `sheet.tsx` (seccion 3.3), va en cada uso.
- `pb-safe-4`: el ultimo boton no queda debajo de la franja de gestos del iPhone.
- La agarradera de 40x4 arriba es lo que hace que se lea como hoja y no como error.
- El boton de cerrar mide 44px.
- Nunca `w-[420px]` a secas (asi esta hoy `task-detail.tsx` linea 111, mas ancho que
  cualquier telefono): siempre `w-full md:w-[420px]`.

### Receta 6. Menu desplegable

**Hoy:** `src/components/ui/dropdown-menu.tsx` linea 46 ata el ancho del menu al ancho del
boton que lo abre, con un suelo de 128 puntos y recorte lateral. Cuando el disparador es un
icono (los tres puntitos de una tarjeta, que es el patron mas repetido del OS), el menu sale
a 128 puntos y una opcion como "Mover a En progreso" **se corta a la mitad** sin poder
arrastrarla.

Dos pasos, en este orden:

1. En el componente base, quitar el ancho atado al disparador salvo en los desplegables de
   formulario, y poner `min-w-[min(16rem,calc(100vw-2rem))]`.
2. En movil, un menu de acciones **no es un desplegable flotante**: es una hoja inferior. Se
   pinta el mismo contenido dos veces y se elige con clases, no con JavaScript:

```tsx
{/* MOVIL */}
<div className="md:hidden">
  <button onClick={() => setAbierto(true)} className="tap-target ..."><MoreHorizontal /></button>
  <Sheet open={abierto} onOpenChange={setAbierto}>
    <SheetContent side="bottom" className="max-h-[85dvh] overflow-y-auto rounded-t-xl pb-safe-4">
      {acciones.map((a) => (
        <button key={a.id} onClick={a.hacer} className="flex h-12 w-full items-center px-4 text-[15px] text-foreground active:bg-muted">
          {a.nombre}
        </button>
      ))}
    </SheetContent>
  </Sheet>
</div>

{/* ESCRITORIO */}
<div className="hidden md:block">
  <DropdownMenu>...</DropdownMenu>
</div>
```

### Receta 7. Grafico

**En movil se rehace el grafico, no se estrecha.**

- **Barras horizontales**, no verticales: en 375px las etiquetas del eje de abajo no caben y
  salen cortadas o giradas. Con barras horizontales el nombre va a la izquierda y la barra
  crece a la derecha.
- **Maximo 6 o 7 puntos.** Lo demas se agrupa en "Otros". Un grafico de 30 barras en un
  telefono no es un grafico, es una raya.
- **El numero va escrito al final de cada barra, siempre visible.** En el telefono no hay
  cursor: no puede haber un dato que solo se vea al pasar el raton. El toque fija la
  etiqueta.
- Alto minimo 200px. Leyenda debajo, en dos columnas, con texto de 14px.
- Los dos ejes rotulados y el titulo sin jerga (regla del brandkit, seccion de graficos).
- Se mide el hueco real con `ResizeObserver` y se dibuja en pixeles, con el `viewBox` igual
  al tamano real. **Nunca `preserveAspectRatio="none"` con lineas**: ya rompio una vez y
  faltaban tramos de la curva.

Nota: `recharts` esta instalado pero **no lo usa ni un archivo del OS**; todos los graficos
estan dibujados a mano en SVG. Si haces uno nuevo, mide el hueco antes de dibujar.

### Receta 8. Barra de herramientas con muchos botones

**En movil, dos cosas visibles como maximo:**

1. La accion principal, en verde, con verbo, 44px de alto.
2. Un boton "Mas" que abre una hoja inferior con el resto.

Ademas:

- Todos los filtros se juntan en **un solo boton "Filtros"** que lleva el numero de filtros
  activos y abre una hoja inferior. Nunca una fila con seis desplegables.
- La busqueda ocupa **su propia linea**, a ancho completo.
- Nunca seis iconos de 28px en fila: no se acierta ninguno.

```tsx
{/* MOVIL */}
<div className="flex flex-col gap-2 md:hidden">
  <input
    placeholder="Buscar"
    className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base"
  />
  <div className="flex gap-2">
    <button className="h-11 flex-1 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground">
      Nueva tarea
    </button>
    <button
      onClick={() => setFiltrosAbiertos(true)}
      className="h-11 shrink-0 rounded-lg border border-border px-4 text-[15px] text-foreground"
    >
      Filtros {activos > 0 && <span className="tabular-nums">({activos})</span>}
    </button>
  </div>
</div>

{/* ESCRITORIO: la barra en una fila */}
<div className="hidden md:flex md:items-center md:gap-2">...</div>
```

### Receta 9. Fila de numeros (KPIs)

`grid-cols-2 md:grid-cols-4`, nunca `grid-cols-4` fijo. Si el numero es largo (dinero con
separadores), **una sola columna** en movil. El numero en `text-2xl tabular-nums`, la
etiqueta debajo en `text-sm text-muted-foreground`. Hoy hay rejillas de 12 columnas fijas
(`ads-tracker-panel.tsx` linea 254): doce columnas en 375px salen a 31px cada una, donde no
cabe ni una palabra.

### Receta 10. Cabeceras y filas que se salen

El patron mas repetido del OS: piezas marcadas como no encogibles (`shrink-0`) en filas que
no pueden bajar de linea. En el monitor sobra sitio y se ve limpio; en el telefono la fila se
estira mas alla de la pantalla y lo de la derecha se pierde.

```tsx
<div className="flex flex-wrap items-center gap-2">
  <h2 className="min-w-0 flex-1 truncate text-[17px] font-semibold text-foreground">
    {titulo}
  </h2>
  <button className="h-11 shrink-0 rounded-lg px-3">...</button>
</div>
```

Regla: en una fila manda **una sola pieza**, la del texto, con `min-w-0 truncate`. `shrink-0`
solo para iconos y botones. Nunca para texto.

### Receta 11. Acciones escondidas hasta pasar el raton

En un telefono no hay raton, asi que una accion con `opacity-0 group-hover:opacity-100`
**no existe**: no se puede borrar la tarea ni editar la etiqueta. No es que se vea mal, es
funcionalidad perdida. Hay 11 casos, empezando por
`src/features/tasks/components/task-card.tsx` linea 80.

```tsx
className="opacity-100 md:opacity-0 md:group-hover:opacity-100"
```

Mejor todavia: en movil, las acciones de una ficha viven dentro de su detalle o en una hoja
inferior, no como iconos diminutos encima de la tarjeta.

### Receta 12. Estado vacio

Es lo que mas se ve en un OS recien puesto en marcha, y hoy parece una pantalla rota. Ejemplo
real: `src/features/tasks/components/task-list.tsx` linea 47 pinta "Sin tareas" con
`text-muted-foreground/40`, o sea el gris secundario rebajado al 40 por ciento sobre fondo
carbon. En un telefono a plena luz eso no se lee: se ve una caja gris grande y vacia y el
usuario no sabe si esta cargando, si fallo o si de verdad no hay nada.

```tsx
<div className="flex min-h-[200px] flex-col items-center justify-center gap-3 px-6 py-10 text-center">
  <h3 className="text-[17px] font-semibold text-foreground">Todavia no hay tareas</h3>
  <p className="max-w-[38ch] text-[15px] text-muted-foreground">
    Las tareas que crees aparecen aqui, ordenadas por prioridad.
  </p>
  <button className="h-11 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground">
    Crear la primera tarea
  </button>
</div>
```

Reglas: titulo en `text-foreground`; explicacion en `text-muted-foreground` **sin rebajar**;
el boton que lo resuelve, ahi mismo, a 44 puntos; alto minimo, nunca `h-64` fijo.

---

## 6. Que hace que se sienta una app nativa y no una web

- **Se toca, no se apunta.** Todo lo interactivo, 44px (`h-11`). El arreglo de raiz son los
  tres archivos de la seccion 3.6; mientras no este hecho, cada pantalla pone la altura a
  mano.
- **Respuesta al pulsar, no al pasar por encima.** En movil el `hover:` se queda pegado
  despues de tocar. Se usa `active:` (`active:bg-muted`, `active:opacity-90`) y, si acaso,
  `active:scale-[0.98]`. El `hover:` se deja detras de `md:`.
- **Zonas seguras: arriba, abajo Y LOS DOS LADOS.** Las utilidades ya existen en
  `globals.css` (lineas 250 a 291) y casi nadie las usa: `pt-safe`, `pb-safe`, `px-safe`,
  `pl-safe`, `pr-safe`, `pb-safe-4`, `pb-safe-6`, `mt-safe`, `mb-safe`. En todo `src` hay
  **solo 4 usos de los laterales**, y con el telefono girado el hueco prohibido del lado mide
  unos 47 puntos: el titulo y los iconos del encabezado se meten debajo del notch. Llevan
  `px-safe` el encabezado movil, la barra inferior, `PageContainer` y toda pieza anclada.
- **Si la pieza tiene altura fija, el `pt-safe` la aplasta.** Ver seccion 3.1. Se suma el
  `env()` dentro del `calc()` de la altura, o se usa `min-h-` en vez de `h-`.
- **Hueco para la barra inferior.** Se reserva una vez en `PageContainer` (seccion 3.5).
- **Altura con `dvh`, nunca `vh`.** En el iPhone la barra del navegador aparece y desaparece;
  con la unidad vieja el ultimo boton queda debajo de ella y no se puede tocar. Se usa
  `min-h-dvh`, `h-dvh`, y para el area util del movil ya existen `h-mobile-content` y
  `min-h-mobile-content`.
- **Sin rebote.** `no-overscroll` va SOLO encima de una caja que de verdad se desplaza (alto
  fijo y contenido que no cabe). Encima de una caja que no se desplaza **congela la pantalla
  entera**: ver la seccion 2 ter.
- **Cero desplazamiento lateral de la pagina.** El marco de la app
  (`src/app/(main)/layout.tsx` linea 75) recorta lo que se sale, y **eso se queda asi**: es lo
  que impide que la app entera baile. La consecuencia es que cada pieza ancha (tira de
  pestanas, tabla de escritorio, tablero) **debe llevar su propio `overflow-x-auto`**, o su
  contenido desaparece por el borde sin aviso.
- **Carga siempre con la marca.** `<LoadingScreen />`. A pantalla completa para rutas; dentro
  de una seccion, `fullscreen={false}` mas `absolute inset-0`. Prohibida la pantalla en
  blanco y el circulito generico.
- **Siempre hay salida.** Boton de volver visible, con texto, arriba a la izquierda. Nunca se
  depende del boton atras del navegador.
- **Margenes del shell.** Toda pantalla de `(main)` va dentro de `<PageContainer>`
  (`px-4 md:px-6`). Nada pegado al borde. Hay un candado que lo comprueba antes de arrancar y
  antes de publicar.

---

## 7. Procedimiento: arreglar UNA pantalla

Antes de la primera pantalla, **el marco comun** (seccion 3). Despues, pantalla por pantalla,
entera, verificando antes de pasar a la siguiente. Nunca se apilan varias sin mirar.

### Paso 1. Mirarla antes de tocarla

Arrancar el servidor en un puerto libre del rango 3100 a 3200 (nunca el 3000) y sacar las
**tres** fotos:

```bash
npx playwright screenshot --device="iPhone 13" http://localhost:3101/tasks antes-movil.png
npx playwright screenshot --viewport-size=812,375 http://localhost:3101/tasks antes-girado.png
npx playwright screenshot --viewport-size=1280,800 http://localhost:3101/tasks antes-escritorio.png
```

### Paso 2. Pasar el detector sobre los archivos de esa pantalla

```bash
RUTA="src/features/tasks"

rg -n -i '#[0-9a-f]{6}\b' $RUTA                                  # colores a mano
rg -n 'rgb\(|hsl\(|oklch\(' $RUTA                                # colores en decimal
rg -n 'font-mono' $RUTA                                          # fuente vieja
rg -n 'text-\[(8|9|10|11|12|13)px\]|\btext-xs\b|text-\[0\.[0-8]' $RUTA   # letra pequena
rg -n 'uppercase' $RUTA                                          # mayusculas (mirar el tracking al lado)
rg -n '\b(bg|text|border|from|to|via|ring)-(violet|cyan|orange|blue|purple|pink|emerald|yellow|amber|green|red|gray|zinc|slate)-[0-9]{2,3}\b' $RUTA
rg -n 'rounded-none|rounded-[23]xl|\bSparkles\b|bg-white|gradient' $RUTA
rg -n 'foreground/[0-9]' $RUTA                                   # tokens rebajados
rg -n --pcre2 '(?<![-:\w])grid-cols-([3-9]|1[0-2]|\[)' $RUTA     # rejillas sin movil
rg -n '(?:^|[^-\w])(?:min-)?w-\[[0-9]+px\]' $RUTA | grep -v 'max-w-'   # anchos clavados
rg -n --pcre2 '(?<![-:\w])(h|size)-([6-9]|10)\b' $RUTA           # controles pequenos
rg -n 'min-h-screen|100vh|[^-\w]h-screen\b' $RUTA
rg -n 'fixed inset-0' $RUTA                                      # emergentes a mano
rg -n 'group-hover:(opacity-100|visible|flex|block)' $RUTA
```

Si el archivo **no tiene ni un `md:`**, esta escrito solo para monitor y hay que rehacerlo,
no parchearlo.

O de una vez, sobre todo el repo: `npm run check:brandkit`.

### Paso 3. Color a tokens

Sustituir con la tabla de la seccion 4. Ni un hexadecimal nuevo. Si un color no tiene token,
es que ese color no deberia existir. Si de verdad hace falta uno (el ambar de aviso), se
anade **al tema** en `globals.css`, no a la pantalla.

### Paso 4. Letra

Fuera `font-mono`. Fuera `uppercase` con `tracking` ancho. Nada por debajo de 14px. Cifras
con `tabular-nums`.

### Paso 5. Estructura

Rejillas con version de movil. Tablas a lista de tarjetas. Anchos fijos a `w-full` con tope.
Filas con `flex-wrap` y `truncate`. Alturas a `dvh`.

### Paso 6. Tacto y campos

Todo lo tocable a `h-11 md:h-8`. Campos con `text-base md:text-sm` y su `inputMode`. Botones
con etiqueta corta.

### Paso 7. Menus y ventanas

Todo lo que se abre encima, a hoja inferior en movil (`side="bottom"` fijo, sin JavaScript).
Los desplegables de acciones tambien.

### Paso 8. Anclados

Zona segura arriba, abajo y a los lados. Los flotantes por encima de la barra inferior. El
hueco de abajo ya lo pone `PageContainer`.

### Paso 9. Comprobar en el navegador de verdad

TypeScript limpio no significa nada aqui. Se abre la pantalla y se mide.

```bash
npm run check:movil -- --solo /tasks
npx playwright screenshot --device="iPhone 13" http://localhost:3101/tasks despues-movil.png
```

Y las cuatro comprobaciones automaticas, en la consola del navegador o con `browser_evaluate`:

```js
// 0. LA PANTALLA SE DESPLAZA CON EL PUNTERO ENCIMA DEL CONTENIDO?
//    Se pone el raton en medio del contenido, se rueda, y se mira si algo se movio.
//    Si da 0 y la pantalla no cabe entera, esta ATRAPADA (seccion 2 ter).
;(() => { let m = 0
  for (const el of document.querySelectorAll('*'))
    if (/(auto|scroll)/.test(getComputedStyle(el).overflowY)) m = Math.max(m, el.scrollTop)
  return Math.max(m, window.scrollY || 0) })()

// 1. Se sale algo de lado?  Tiene que dar false
document.documentElement.scrollWidth > document.documentElement.clientWidth

// 2. Quien se sale (los 10 primeros culpables)
[...document.querySelectorAll('*')]
  .filter(e => e.getBoundingClientRect().right > innerWidth + 1)
  .slice(0, 10)
  .map(e => e.tagName + '.' + e.className)

// 3. Cuantas cosas tocables miden menos de 44px.  Tiene que dar 0
[...document.querySelectorAll('button,a,[role=button],input,select,textarea')]
  .filter(e => { const r = e.getBoundingClientRect(); return r.height > 0 && r.height < 44 })
  .length

// 4. Que queda debajo de la barra inferior. Tiene que dar 0
;(() => {
  const barra = [...document.querySelectorAll('*')].find(e => {
    const s = getComputedStyle(e), r = e.getBoundingClientRect()
    return s.position === 'fixed' && r.height > 30 && r.width > innerWidth * 0.8 &&
           Math.abs(r.bottom - innerHeight) < 2
  })
  if (!barra) return 0
  const top = barra.getBoundingClientRect().top
  return [...document.querySelectorAll('button,a,input,li,p,h1,h2,h3')]
    .filter(e => getComputedStyle(e).position === 'static')
    .filter(e => { const r = e.getBoundingClientRect(); return r.top < innerHeight && r.bottom > top + 2 })
    .length
})()
```

**Y despues, lo que ninguna maquina ve.** Estas tres cosas no se pueden medir en un navegador
sin cabeza, porque ahi la franja del notch vale cero y no existe el teclado. Se comprueban en
el simulador de iPhone o en el telefono de Marco:

- [ ] El titulo del encabezado no queda aplastado contra el notch.
- [ ] Con el teclado abierto se ven el ultimo campo Y el boton de guardar.
- [ ] Con el telefono girado, nada se mete debajo del notch lateral.
- [ ] En la foto de 375: la barra de abajo tiene todos sus botones repartidos, sin huecos.

### Paso 10. Cerrar

- Si la pantalla mejoro, el candado **aprieta la deuda solo** y reescribe
  `.brandkit-debt.json`. Se guarda ese archivo en el mismo commit.
- Si partiste o renombraste un archivo, `npm run check:brandkit -- --rebase`.
- Se anota en el Knowledge lo que se aprendio, en el mismo bloque de trabajo.
- Se entrega a Marco el enlace exacto de local (por ejemplo `http://localhost:3101/tasks`)
  con el servidor encendido.

---

## 8. El candado, y como no pelearse con el

`scripts/check-brandkit.mjs`. Corre al **guardar** (sobre tus archivos, en menos de un
segundo), al **arrancar el servidor** y al **construir**. En el servidor que publica la web
no corre a proposito: el 31 de julio un candado enganchado a `prebuild` tumbo dos despliegues
seguidos.

```bash
npm run check:brandkit              # revisa todo
npm run check:brandkit -- --rebase  # al partir o renombrar un archivo
```

**La deuda vive en `.brandkit-debt.json`**, versionada y a la vista. No es un numero: es la
huella exacta de cada archivo (que regla, que texto, cuantas veces). Consecuencias practicas:

- Un archivo que ya tenia diseno viejo **no es zona franca**. Si le metes diseno viejo
  distinto, aunque el total no suba, salta.
- Cuando limpias un archivo, el candado **baja el numero solo**. No quedan huecos libres.
- Si partes `pantalla.tsx` en `pantalla-movil.tsx` y `pantalla-escritorio.tsx`, el candado
  vera dos archivos nuevos llenos de senales. Eso no es diseno nuevo, es el mismo cambiado de
  sitio: `--rebase` lo recoloca. Solo lo permite si el total del repo no sube.

`npm run check:movil` es otra cosa: **mide, no bloquea**. Necesita el servidor encendido y
Playwright instalado (`npm i -D playwright && npx playwright install chromium`). Da numeros
por pantalla: que se sale, que se recorta, que queda tapado por la barra, que no se puede
tocar, que letra es ilegible. Empezar siempre por su seccion "lo que se repite en casi todas
las pantallas": eso es el marco comun.

---

## 9. Prohibido

- Copiar el estilo de una pantalla existente. La mayor parte del OS lleva diseno viejo:
  copiar de ahi es reintroducirlo.
- Escribir clases que no existen (`bg-carbon`, `bg-panel`, `rounded-card`, `border-line`,
  `text-greenink`, `text-warn` sin haber anadido el token). La pantalla sale transparente.
- Encoger en vez de rehacer. Una tabla pequena sigue siendo una tabla rota.
- Resolver el movil con deslizamiento lateral.
- Texto blanco encima del verde.
- Quitar el `overflow-x-hidden` del marco de la app para que "quepa" algo.
- Anadir una pantalla nueva sin `<PageContainer>`.
- Dejar una accion que solo aparece al pasar el raton.
- Un desplegable flotante en movil en vez de hoja inferior.
- Decidir el lado de una hoja con JavaScript (`useIsMobile`).
- Rebajar un token de texto con `/40` o `/60`.
- **Poner `overflow-y-auto` a una caja que no tiene alto fijo.** Si ademas lleva
  `no-overscroll`, la pantalla se queda congelada y ninguna medida lo delata (seccion 2 ter).
- **Dar una pantalla por hecha sin haber desplazado con el puntero ENCIMA del contenido.**
  Una captura de pagina completa no prueba que se pueda desplazar.
- Dar una pantalla por hecha porque `check:movil` salio verde: ese comprobador no ve el
  notch ni el teclado.
- Redisenar de paso algo que nadie pidio. Se toca la pantalla encargada, entera, y nada mas.

---

## 10. Antes de dar una pantalla por hecha

- [ ] Cero colores a mano. Todo por token.
- [ ] Cero `font-mono`, cero mayusculas con espaciado ancho.
- [ ] Nada por debajo de 14px. Cuerpo a 15px.
- [ ] Radios 4px y 6px. Cero `rounded-none`, cero `rounded-2xl`.
- [ ] Cero `Sparkles`, cero emojis, cero guion largo, espanol neutro.
- [ ] Probada a 375, a 812x375 (girada) y a 1280, con foto de las tres.
- [ ] **La pantalla se desplaza con el puntero ENCIMA del contenido**, no solo por el borde.
- [ ] Cero desplazamiento lateral de la pagina (comprobacion 1 del paso 9).
- [ ] Cero controles por debajo de 44px (comprobacion 3).
- [ ] Cero cosas tapadas por la barra inferior (comprobacion 4).
- [ ] Campos con `text-base md:text-sm` y teclado correcto.
- [ ] Zonas seguras arriba, abajo y a los dos lados.
- [ ] Ventanas y menus como hoja inferior en movil, con el lado fijo.
- [ ] Estado vacio con titulo, explicacion legible y el boton que lo resuelve.
- [ ] Boton de volver visible.
- [ ] La carga usa `<LoadingScreen />`.
- [ ] En el simulador de iPhone: notch arriba, notch de los lados girado, y teclado abierto.
- [ ] `npm run typecheck` y `npm run build` limpios.
- [ ] `npm run check:brandkit` en verde, y `.brandkit-debt.json` guardado si bajo.

---

## 11. Errores ya cometidos. No repetirlos

**1. Escribir los nombres del brandkit sin comprobar que existen.** `bg-carbon`, `bg-panel`,
`rounded-card` y compania no estan definidos: la pantalla sale sin fondo, sin borde y sin
verde. Se comprueba el bloque `@theme` de `globals.css` antes de escribir.

**2. Creer que arreglar los tokens redisena el producto.** El 31 de julio se pusieron los
tokens en verde y **casi no se noto**, porque 1155 colores estan escritos a mano dentro de
las pantallas. El token solo pinta a quien pregunta por el.

**3. Confundir el `accent` de shadcn con la marca.** En shadcn `accent` es el gris del hover;
aqui es el verde. Al copiar un componente nuevo se cambia `accent` por `muted`, o el menu
sale verde entero. Sin esa migracion, el boton "Board" quedo blanco sobre verde a 2.09 de
contraste.

**4. Blanco sobre verde.** 2.11 de contraste, ilegible. Siempre `text-primary-foreground`.

**5. Estirar un grafico de lineas.** Un lienzo de 100x100 con `preserveAspectRatio="none"`
estirado a lo ancho hizo que **faltaran tramos de la curva**. Se mide en pixeles con
`ResizeObserver`.

**6. Arreglar una cosa y no mirar la de al lado.** Un arreglo de un grafico metio un bucle
que borraba la seleccion y dejo de funcionar el detalle al pasar el cursor. Lo encontro
Marco, no el agente. Despues de tocar un componente se prueba tambien lo que ya funcionaba en
el, y a 375px.

**7. Enganchar un candado a `prebuild` sin pensar en el servidor que publica.** El 31 de
julio dos despliegues seguidos se cayeron a los ocho segundos porque una comprobacion pensada
para la maquina de Marco corrio tambien en Vercel. Si una comprobacion depende de ramas,
carpetas o del disco del usuario, se salta con `process.env.VERCEL || process.env.CI`.

**8. Poner `pt-safe` a una pieza que ya tiene altura fija.** Es el aplastamiento contra el
notch de la seccion 3.1. La regla no es "todo lo de arriba lleva `pt-safe`": es "lleva
`pt-safe` **y ademas** su altura tiene que poder crecer".

**8 bis. Creer que un `md:` pisa a una clase base de un componente del kit.** La hoja
(`sheet.tsx`) escribe sus clases con el selector `data-[side=bottom]:`, que **pesa mas** que
un `md:`: `data-[side=bottom]:inset-x-0` gana a `md:left-auto` y no hay `cn()` que lo
arregle, porque tailwind-merge no fusiona entre variantes distintas. Resultado medido el
2026-08-29: un cajon pensado para la derecha salio pegado a la IZQUIERDA de la pantalla, con
los tipos y el candado en verde. Se resuelve con el importante, y en **Tailwind 4 el `!` va
al FINAL**: `md:right-0!`, no `md:!right-0`. (Ojo: por el repo queda sintaxis vieja tipo
`md:!bottom-6`, que en Tailwind 4 **no hace nada**.) Y se mira en el navegador: esto no lo
caza ningun comprobador.

**9. Decidir el diseno de movil con JavaScript.** `useIsMobile()` miente en el primer pintado.
Lo que se ve al abrir es el diseno de escritorio, y luego salta. Se decide con clases.

**10. Dar a un bloque su propio desplazamiento dentro de una pantalla normal.** `ListaPaginada`
envolvia toda lista del OS en un cajon con `overflow-y-auto` + `no-overscroll`. Como la lista
esta paginada, ese cajon nunca tenia nada que desplazar, y `contain` **bloqueaba el gesto
hacia la pagina**: con el raton encima de la lista la pantalla no se movia. Ni un error, ni una
medida en rojo, y la captura perfecta. **Lo encontro Marco, no la maquina**, y no era la
primera vez. Ver seccion 2 ter y el SOP `producto/62`.