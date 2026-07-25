---
title: IA Integrator
description: Formación · entrenamientos, diccionario, catálogo y roadmap
order: 0
---

# Formación IA Integrator

Esta carpeta contiene **el material oficial de la formación IA Integrator** de Capital Hub. Enseña a una persona **no técnica** a construir su propio software **hablándole a una IA**, con las reglas de orden y seguridad que hacen que no se rompa nada.

**El alumno no escribe código en ningún momento.**

Todo esto vive como **recursos del hub de la formación en la App** (`app.capitalhubapp.com`), no en el OS. El texto fuente vive aquí, en el Knowledge.

## Los siete recursos

| # | Documento | Qué es | Guía en la App |
|---|-----------|--------|----------------|
| 01 | [Entrenamiento 1 · Cómo funciona todo](01-entrenamiento-1-como-funciona-todo.md) | El más largo. Qué es cada cosa por dentro: frontend y backend, UI y UX, base de datos, API y API keys, las herramientas, el viaje del código, la regla de oro, el contexto y cómo construye la IA | `entrenamiento-1` |
| 02 | [Entrenamiento 2 · Cómo usar el sistema](02-entrenamiento-2-como-usar-el-sistema.md) | El día a día del alumno: abrir sesión con `/primer`, decir el objetivo, aprobar el plan, revisar, publicar y cerrar | `entrenamiento-2` |
| 03 | [Entrenamiento 3 · Trabajar en equipo](03-entrenamiento-3-trabajar-en-equipo.md) | Solo si en el proyecto trabaja más de una persona: meter a alguien nuevo, el día a día compartido, conflictos y reglas del equipo | `entrenamiento-3` |
| 04 | [Diccionario · Cómo se llama cada cosa](04-diccionario.md) | Glosario en cristiano: frontend, API, commit, deploy... Para volver a mirar una palabra cuando no suene | `diccionario` |
| — | Catálogo de piezas de interfaz | Enseña cómo se llama cada parte de una app (barra superior, sidebar, tarjeta...) con una **maqueta interactiva**. Es código (React), no un `.md`: vive en la App en `features/guides/nomenclatura-ui/` | `nomenclatura-ui` |
| — | Roadmap del setup | Asistente de **27 pasos** para montar el ecosistema desde cero (instalar editor, cuentas, primer proyecto, deploy, dominio). Código, se pinta a pantalla completa. Vive en la App en `features/guides/roadmap-setup/` | `roadmap-setup` |
| — | Skills disponibles | Las skills que trae el ecosistema, agrupadas por para qué sirven (puesta en marcha, construir, contenido, mantenimiento). Cada una: qué hace y cuándo usarla. **Antes vivía dentro del roadmap**; Marco la sacó como recurso aparte. Vive en la App en `features/guides/skills/` | `skills` |

**El orden importa** en los entrenamientos. El 2 da por sabido el 1. El 3 da por sabidos el 1 y el 2, y no hace falta si el alumno trabaja solo. El Diccionario, el Catálogo y el Roadmap son de consulta.

**El Catálogo y el Roadmap no tienen `.md` en el Knowledge**: son componentes visuales que vinieron ya hechos en la entrega y se rebrandearon. Su "fuente" es el propio código en la App. Si cambia su contenido, se cambia ahí.

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

### 2026-07-24 (tarde) · Entra toda la entrega: Diccionario, Catálogo nuevo y Roadmap

Marco pasó la carpeta `ENTREGA-otro-ecosistema/` (material completo de la formación, preparado para otro proyecto) y pidió meter **todos** los documentos en el hub, rebrandeados a Capital Hub. Hecho:

- **Diccionario** (`04-diccionario.md` + guía `diccionario`): glosario nuevo. No existía.
- **Catálogo de piezas de interfaz** (`nomenclatura-ui`): se sustituye la versión básica por la **versión con maqueta interactiva** de la entrega (NomenclaturaView + Mocks + PageFx + SectionMap). Rebrandeada de dorado/cósmico a verde de marca.
- **Roadmap del setup** (`roadmap-setup`): asistente nuevo de 27 pasos. Se pinta a **pantalla completa** (`FULL_BLEED` en el ResourceViewer) con botón fijo "Salir a los recursos". Marca `NVISION®` → `Capital Hub`. Dependencia nueva `canvas-confetti`.
- **Entrenamiento 1**: la parte "hacer dos cosas a la vez" (que hablaba de una carpeta de trabajo aparte) cambia a **"una sola cosa a la vez"** (apunta, cierra el proyecto, hazlo, vuelve). Regla 3 igual. Aplicado al `.md` y a la guía.
- **Icono estrellita (`Sparkles`) PROHIBIDO** (Marco): fuera de todo el área de formación (hub, tarjetas, visor, lecciones). Sustituido por iconos que significan algo. Añadido como veto en la skill `formacion-visual`.

El hub queda con **7 recursos** (3 entrenamientos + diccionario + catálogo + roadmap + skills). El Catálogo y el Roadmap no tienen `.md`: su fuente es el código en la App. Rama de la App: `feat/hub-recursos-entrenamientos`.

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
