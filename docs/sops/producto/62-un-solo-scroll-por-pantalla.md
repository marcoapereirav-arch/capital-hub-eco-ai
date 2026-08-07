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

## Cambios versionados

### 2026-08-07 — Creación
Encontrado por Marco en la Configuración de Afiliados. Arreglado en `ListaPaginada` (afecta a
las 5 pantallas que la usan a la vez), con `propioScroll` como excepción explícita para
ventanas y hojas, y con la medición añadida a `check:movil` para que no vuelva a colarse.
