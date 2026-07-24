---
title: IA Integrator
description: Formación · los tres entrenamientos
order: 0
---

# Formación IA Integrator: los tres entrenamientos

Esta carpeta contiene **el material oficial de la formación IA Integrator** de Capital Hub. Enseña a una persona **no técnica** a construir su propio software **hablándole a una IA**, con las reglas de orden y seguridad que hacen que no se rompa nada.

**El alumno no escribe código en ningún momento.**

## Los tres entrenamientos

| # | Documento | Qué es | Dónde se ve |
|---|-----------|--------|---------------|
| 01 | [Entrenamiento 1 · Cómo funciona todo](01-entrenamiento-1-como-funciona-todo.md) | El más largo. Qué es cada cosa por dentro: frontend y backend, UI y UX, base de datos, API y API keys, las herramientas, el viaje del código, la regla de oro, el contexto y cómo construye la IA | Guía `entrenamiento-1` en la App |
| 02 | [Entrenamiento 2 · Cómo usar el sistema](02-entrenamiento-2-como-usar-el-sistema.md) | El día a día del alumno: abrir sesión con `/primer`, decir el objetivo, aprobar el plan, revisar, publicar y cerrar | Guía `entrenamiento-2` en la App |
| 03 | [Entrenamiento 3 · Trabajar en equipo](03-entrenamiento-3-trabajar-en-equipo.md) | Solo si en el proyecto trabaja más de una persona: meter a alguien nuevo, el día a día compartido, conflictos y reglas del equipo | Guía `entrenamiento-3` en la App |

**El orden importa.** El 2 da por sabido el 1. El 3 da por sabidos el 1 y el 2, y no hace falta si el alumno trabaja solo.

## Reglas de esta carpeta

- **El `.md` es la fuente. La página visual es su reflejo.** Si cambia el texto de un entrenamiento, se cambia aquí primero y luego en el componente. Nunca al revés y nunca solo en uno de los dos.
- **Cero emojis** en el texto (REGLA #8 del SOP `producto/04`). Los avisos que en el original iban con un emoji de advertencia se convierten en el bloque `<Warn>` del kit visual.
- **Cero guion largo** (REGLA #7).
- Los tres se renderizan en `/knowledge` del OS como carpeta propia (el servicio lee las subcarpetas de cada cuadrante).

## Cómo se construyen las páginas visuales

Con la skill **`formacion-visual`** (`.claude/skills/formacion-visual/`), que fija el estilo: fondo `#0F0F12`, verde de marca `#22C55E`, Inter Tight en titulares, motion de entrada y reveals al scroll, diagramas que se dibujan solos.

El código vive en el repo de la **App** (`capital-hub-app`), en `web/src/features/guides/`:

```
kit/fx.tsx           atmósfera + keyframes + hook de scroll (motor único)
kit/kit.tsx          las piezas de montaje (Hero, Cards, Steps, Warn, Toc…)
entrenamiento-1/     partido en partes por tamaño
entrenamiento-2/
entrenamiento-3/
registry.tsx         guide_key -> componente
```

Y el hub que los agrupa en `web/src/pages/training/FormationHubPage.tsx`.

**Ninguna página inventa estilos por su cuenta.** Si hace falta una pieza nueva, se añade al kit.

## Cambios versionados

### 2026-07-24 · Contenido nuevo: los tres entrenamientos sustituyen a los manuales viejos

Marco: el contenido anterior estaba mal. Se retira entero y se sustituye por sus tres entrenamientos.

**Fuera** (contenido retirado, no se conserva): `01-vibecoding-al-grano.md`, `02-vibecoding-workflow.md`, `03-git-explicado.md`. Venían de NVISION adaptados, y contaban un flujo que no es el que se enseña.

**Dentro**: los tres entrenamientos de Marco, con su texto tal cual. Dos cambios mínimos y solo esos:
1. Fuera los emojis (REGLA #8). Los avisos que los llevaban son ahora bloques `<Warn>` en la página.
2. La clave de ejemplo de Stripe del Entrenamiento 1 (`sk_live_4eC39Hq...`) pasa a ser `sk_live_ESTO_ES_UN_EJEMPLO_NO_UNA_KEY`. **Motivo**: tenía formato de clave real y la protección de secretos de GitHub bloqueaba el push. No se desactiva la protección: se cambia el ejemplo. Enseña lo mismo y además es coherente con lo que el propio entrenamiento predica.

**Qué cambia en el producto (todo en la App, ver SOP `producto/02`):**
- Las tres guías quedan construidas y publicadas como recursos de la formación. Sustituyen a `vibe-coding`, `vibe-coding-completo` y `git`, que se borran del registro y del código.
- **Hub de recursos** nuevo (`/training/formations/:id/hub`): agrupa todo el material por tipo y crece según se añade. Es el sitio donde se acumula lo que se va creando.
- **Acceso al hub arriba del todo** en la pantalla de la formación, más un atajo en la cabecera fija. Antes los recursos estaban al final de la página y había que bajar hasta abajo.
- **Volver al sitio exacto**: al salir de una pantalla se guarda su scroll y al volver se recupera (`web/src/lib/nav-origen.ts`).
- Nace el **kit visual único** (`features/guides/kit/`). Antes cada guía llevaba su propia copia del motor.
- El Entrenamiento 1 lleva **índice lateral** que se sigue solo al bajar, porque es tres veces más largo que los otros dos.
- El recurso `nomenclatura-ui` pasa a llamarse **"Catálogo de piezas de interfaz"**: el nombre viejo ("Cómo se llama cada cosa") no decía qué había dentro.

**Corrección de proceso (importante):** la primera pasada de este trabajo se construyó **en el OS** (`/formacion/ia-integrator`), rompiendo la REGLA DE ORO del SOP `producto/02` que ya estaba escrita desde el 2026-07-02. Además duplicaba guías que **ya existían en la App**. Se rehízo entero en la App y las páginas del OS quedan retiradas. Antes de construir cualquier pantalla: **¿la ve un alumno? Entonces va en la App.**

**Bug de fondo arreglado de paso:** `body { overflow-x: hidden }` en `web/src/index.css` convertía el body en contenedor de scroll y **rompía `position: sticky` en toda la App** (ninguna cabecera se quedaba fija). Cambiado a `overflow-x: clip`, que recorta igual sin crear contenedor de scroll.

### 2026-07-01 · Creación (retirada)
Se movieron aquí los 3 manuales que estaban sueltos en `docs/` y se adaptaron de NVISION a Capital Hub. Ese contenido queda retirado el 2026-07-24.
