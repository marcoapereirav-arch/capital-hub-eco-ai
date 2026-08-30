---
title: Un solo desplazamiento por pantalla (el fallo que congela la app)
order: 62
area: producto
---

# Un solo desplazamiento por pantalla

> Marco, 2026-08-07: *"Está rota la pantalla, no puedo hacer scroll... arréglalo de raíz, que
> no es la primera vez que sucede. Necesito que sea un reporte de esto o una instrucción
> bastante clara para que esto no vuelva a suceder."*

## La regla, en una línea

**El desplazamiento de una pantalla lo hace el marco de la app, uno solo.** Ningún bloque
dentro de una pantalla normal tiene desplazamiento propio.

## Qué pasó

La pestaña Configuración de Afiliados se veía perfecta y **no se podía desplazar**. Con el
ratón encima de la lista, que ocupa casi toda la pantalla, la página no se movía. Fuera de la
lista, sí.

La causa estaba en `<ListaPaginada>`, el componente por el que pasa **toda** lista del OS.
Envolvía su contenido en un cajón así:

```
overflow-y-auto  +  no-overscroll   (overscroll-behavior: contain)
```

Dentro de una pantalla normal ese cajón **no tiene nada que desplazar** (la lista está
paginada a 20). Pero `overscroll-behavior: contain` **corta el paso del gesto hacia la
página**. Entonces:

```
dedo o rueda encima de la lista
        ↓
el cajón no puede desplazarse (su contenido cabe)
        ↓
`contain` no deja que el gesto suba a la página
        ↓
NO SE MUEVE NADA. La pantalla parece congelada.
```

## Por qué no lo vio ninguna máquina

Este fallo es **mudo**, y por eso ha pasado más de una vez:

- No sale ningún error en la consola.
- `tsc` y `npm run build` en verde.
- Nada se sale de la pantalla, nada se recorta, ninguna zona táctil es pequeña.
- **Una captura de pantalla completa se ve perfecta**, porque `fullPage` fotografía el
  documento entero sin desplazar nada.

Lo único que lo destapa es **poner el puntero encima del contenido e intentar desplazar**.
Eso no se estaba comprobando.

## El arreglo de raíz

`<ListaPaginada>` **ya no crea cajón propio por defecto**. Es un `<div>` normal, el gesto
pasa a la página y la lista se comporta como cualquier otro bloque.

Cuando la lista vive dentro de una caja de **alto fijo** (una ventana o una hoja inferior) y
sí necesita desplazarse por dentro, se pide **a la vista**:

```tsx
<ListaPaginada items={avisos} propioScroll>   {/* solo en ventana u hoja */}
```

Lo usan exactamente dos sitios, y los dos están dentro de una caja de alto fijo: la campana
de notificaciones y la ventana de "Lo que va pasando" del dashboard.

El botón de página ya no llama a `scrollTo` sobre su propio cajón: usa
`scrollIntoView({ block: "start" })`, que funciona en los dos casos sin preguntar quién se
desplaza.

## Cómo se impide que vuelva

`npm run check:movil` mide ahora los **cajones que atrapan el gesto**, en todas las pantallas.
Se marca uno cuando se dan las **tres** condiciones a la vez:

1. corta el paso del gesto (`overscroll-behavior` en `contain` o `none`),
2. **no tiene nada que desplazar** por dentro,
3. y por encima de él **sí hay alguien** que se podría estar desplazando.

Si falta cualquiera de las tres, no molesta a nadie y no se marca. Una pantalla con un cajón
así cuenta como **rota**, no como fea: pesa más que cualquier otra señal en el orden del
informe.

## Al construir cualquier pantalla

- **`overflow-y-auto` dentro de una pantalla es sospechoso.** Antes de escribirlo: ¿esta caja
  tiene alto fijo? Si no lo tiene, no lo lleva.
- **`no-overscroll` solo acompaña a algo que de verdad se desplaza.** Encima de una caja que
  no se desplaza, lo único que hace es bloquear a la página.
- **Alto fijo y desplazamiento van juntos.** Uno sin el otro es el fallo: alto fijo sin
  desplazamiento recorta, y desplazamiento sin alto fijo atrapa.
- **Antes de dar una pantalla por hecha, se desplaza con el puntero ENCIMA del contenido**,
  no solo por el borde. Una captura no prueba que se pueda desplazar.

## La excepción que SÍ vale: una carta larga se desplaza por dentro

> Marco, 2026-08-29: *"si hay una lista de más de 20 filas, tiene que haber un botón de
> siguiente. Haz que la carta no sea un scroll largo, sino que sea un scroll interno."*

Una carta con veinte filas dentro alarga la página tanto que **el botón de pasar de página
queda fuera de la vista**. Y un botón que hay que ir a buscar, no existe. Ahí sí se le da a
la lista su propio desplazamiento, pero **con dos condiciones que no se negocian**:

1. **Tope de alto, y que la carta ENTERA quepa en una pantalla de teléfono**: cabecera,
   lista y el contador con Anterior y Siguiente. Medido: `max-h-[52dvh] md:max-h-[30rem]`
   deja la carta en 546 puntos en un teléfono de 667 y en 622 en uno de 812.
2. **`max-h` y NUNCA `overscroll-contain`.** Con `contain`, el día que una página traiga
   pocas filas la caja no tendría nada que desplazar y se tragaría el gesto: la pantalla
   congelada de este mismo documento. Sin `contain`, cuando la lista se acaba el gesto pasa
   a la página, que es lo que debe hacer.

Esto **no** contradice la regla de arriba: sigue habiendo un solo desplazamiento por
pantalla más el de esta caja, que tiene alto fijo y contenido que no cabe, que son
exactamente las dos condiciones que la regla pide.

**Cómo se comprueba** (no vale la captura): se pone el puntero encima de la lista, se rueda
con sitio dentro (tiene que moverse la lista, no la página), se lleva la lista a su final y
se vuelve a rodar (ahora tiene que moverse la página). Primera pantalla que lo hace:
`/actividad`, ver [`producto/63`](63-actividad-setter-historial.md).

## Cambios versionados

### 2026-08-29 — La excepción de la carta larga
Marco pidió que la carta del historial no alargara la página y que el botón de Siguiente
estuviera a la vista. Se añade la excepción con sus dos condiciones y la forma de medirla.

### 2026-08-07 — Creación
Encontrado por Marco en la Configuración de Afiliados. Arreglado en `ListaPaginada` (afecta a
las 5 pantallas que la usan a la vez), con `propioScroll` como excepción explícita para
ventanas y hojas, y con la medición añadida a `check:movil` para que no vuelva a colarse.

---

# Y lo mismo con el botón flotante: nada debajo de él

> Marco, 2026-08-07: *"el widget de registrar venta no deja darle a crear el link. Esto
> siempre lo debes tener en cuenta en TODAS las pantallas... no es la primera vez que sucede"*.

El flotante "Registrar venta" está fijo en la esquina de abajo a la derecha en las 35
pantallas. Lo que cae debajo **se ve pero no se puede pulsar**, y el que siempre cae debajo es
**el último botón de la pantalla**: ya no queda contenido para apartarlo desplazando.

**El sitio se reserva en `PageContainer`, una sola vez, y vale para las 35.** En teléfono ya
estaba reservado desde el barrido de agosto; **en ordenador no** (`md:pb-6`). Esa es la razón
exacta de que se repitiera: se arregló para el teléfono y se dio por cerrado.

```
pb-[calc(7rem+var(--sab)+1rem)]   md:pb-24
```

Reglas al construir:

- Ninguna pantalla pone su acción principal en la esquina de abajo a la derecha.
- Toda pantalla va dentro de `<PageContainer>`, que es quien reserva el hueco.
- **Se comprueba con la página al FINAL**, no al principio: es ahí donde aparece.

`npm run check:movil` lo mide ahora: "Botones que el flotante deja sin pulsar". Un solo botón
ahí cuenta como pantalla rota.
