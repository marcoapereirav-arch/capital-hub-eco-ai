---
rama: feature/tokens-brandkit
estado: propuesto
---

# Ninguna lista del OS se pinta entera: maximo 20 por pagina

> Marco, 2026-08-07: *"siempre, siempre que vayas a hacer una lista, tiene que haber
> maximo 20. Esto lo tienes que crear en un skill o en algo para que siempre se cumpla"*.

Lo que faltaba para que eso se cumpla ya esta hecho y guardado en esta rama (commit
`dcf2710`): el componente `<ListaPaginada>`, la ley escrita en la skill `os-movil-primero`
(seccion 2 bis) y el candado con la regla `lista-sin-paginar`.

Lo que queda es aplicarlo a las **20 pantallas que ya estaban escritas** cuando se estreno
la regla. Estan anotadas una a una en el acta `.brandkit-debt.json`. Este plan es para
cerrarlas.

---

## Objetivo

Que en el OS no exista ni una sola lista que se pinte entera. Da igual que hoy tenga 8
elementos: manana tendra 800 y la pantalla se arrastra. Al terminar, el acta de deuda no
tiene ni una entrada de `lista-sin-paginar`.

---

## Que voy a hacer

- Recorrer las 20 pantallas que el acta senala y que hoy pintan la lista completa.
- En las que **la lista es la pantalla** (la tabla de tareas, los listados): envolverlas en
  `<ListaPaginada>` y ya. Ese componente trae el limite de 20, el volver arriba al cambiar
  de pagina, el caerse a la ultima si un filtro deja menos, y el "Viendo 21 a 40 de 132".
- En las que **la lista vive dentro de un panel o un desplegable**: ensenar los primeros 10
  y un boton "Ver todo" que abre una ventana, y esa ventana si va de 20 en 20. Es como ya
  esta hecha "Lo que va pasando" del dashboard.
- No tocar las listas de opciones fijas que no crecen (pestanas, colores, presets, los
  estados de un pipeline): esas se quedan como estan.
- El tamano de pagina no se toca ni se pasa por parametro en ningun sitio: vive dentro de
  `lista-paginada.tsx` para que el dia que cambie, cambie en todo el OS a la vez.

---

## Fases

**A · Tareas (`src/features/tasks`)**

- [ ] `task-list.tsx`: son 501 filas y hoy se pintan todas, en las dos versiones (la lista
      de fichas del telefono y la rejilla de columnas del ordenador). Se envuelven las dos
      en un solo `<ListaPaginada>`, con la firma de los filtros para que al filtrar vuelva
      a la pagina 1.
- [ ] `task-board.tsx`: el tablero. En telefono se ve una columna a la vez y ocupa el ancho
      entero, asi que esa columna se pagina de 20 en 20. En el ordenador cada columna mide
      280 puntos y ahi no cabe una barra de paginacion sin descuadrar el tablero: cada
      columna ensena 10 tarjetas y un boton "Ver todas" que abre la columna completa en una
      ventana, de 20 en 20.
- [ ] `task-page.tsx`: el selector de proyectos, areas y recursos de la cabecera. Hoy pinta
      todos los que existan dentro de un desplegable. Pasa a ensenar 10 por grupo y una
      entrada "Ver todos" que abre una ventana paginada para elegir.

**B · Paneles del dashboard y operaciones**

- [ ] `dashboard/components/activity-feed.tsx` y `dashboard-pending-sales.tsx`
- [ ] `operaciones-dashboard/components/operaciones-dashboard.tsx` y
      `board/components/priority-queue.tsx`

**C · Pantallas de contenido, ads y sistemas**

- [ ] `content-intel/` (videos, ideas, corpus, generador de guiones)
- [ ] `ads/components/ads-affiliates-panel.tsx` y
      `sistemas/components/medicion-ads-workflow.tsx`
- [ ] `tutoriales/components/panel.tsx`

**D · Marco comun y el resto**

- [ ] `shell/components/page-nav-header.tsx` (el desplegable de la cabecera, que sale en
      varias pantallas a la vez)
- [ ] `notifications/NotificationsPanel.tsx`, `knowledge/ArchivePanel.tsx`,
      `email-marketing`, `instagram/ig-overview.tsx`, `automatizaciones`

**E · Cerrar**

- [ ] `npx tsc --noEmit` limpio y `node scripts/check-brandkit.mjs` en verde.
- [ ] El acta `.brandkit-debt.json` sin ninguna entrada de `lista-sin-paginar`, guardada en
      el mismo commit.

---

## Que NO entra

- No se cambia el diseno de ninguna pantalla mas alla de lo que exige paginarla. Nada de
  redisenar de paso lo que nadie pidio.
- No se tocan las listas de opciones fijas: pestanas, colores de una paleta, presets, los
  estados del tablero, los dias de la semana.
- No se sube el limite de 20 en ninguna pantalla, ni se convierte en parametro.
- No se resuelve nada con scroll infinito ni con un `slice` que esconda el resto sin manera
  de alcanzarlo.
- No se toca la base de datos ni los servicios: esto es solo como se pinta.

---

## Como lo veras

- Entras en Tareas con las 501 y ves 20, con "Viendo 1 a 20 de 501" y los botones Anterior
  y Siguiente abajo. Cambias de pagina y la lista vuelve arriba sola.
- Filtras por un proyecto y no te quedas en una pagina vacia: baja a la ultima que existe.
- En el telefono, el tablero ensena una columna a la vez y esa columna tambien va de 20 en
  20. En el ordenador cada columna ensena 10 y un boton para ver todas.
- Ninguna pantalla del OS tarda en abrir por pintar cientos de filas de golpe.
- El candado da verde y el acta de deuda se queda sin listas pendientes.
