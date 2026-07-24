---
title: Recursos de formación (App)
order: 51
---

# Recursos de formación (App del alumno)

Sistema de **recursos por formación** en la App: materiales que cuelgan de una formación y que se pueden **enlazar a las lecciones que se quiera** (M2M). Vive en la App (`capital-hub-app`), donde va todo el contenido de alumnos (ver REGLA DE ORO en SOP 02). Creado 2026-07-02.

## Qué resuelve

Cada formación tiene una sección **"Recursos"**. Un admin crea recursos (guías visuales, enlaces, archivos, texto) y los enlaza a lecciones concretas. El alumno los ve en dos sitios: en la sección Recursos de la formación (con las lecciones a las que están enlazados, visible) y dentro de cada lección enlazada ("Recursos de esta lección").

**REGLA DE ALCANCE (Marco, 2026-07-02):** un recurso pertenece a UNA formación y solo se enlaza a lecciones de ESA formación. **Nunca se mezclan recursos ni enlaces entre formaciones.** Por eso `resources.formation_id` es obligatorio y el enlazador del admin solo lista las lecciones de esa formación. No añadir enlace cross-formación.

## Datos (Supabase compartida `aglyoyqtzozdnusltjxe`)

- `resources`: `id`, `formation_id` (FK formations), `title`, `description`, `type` (`GUIDE` | `LINK` | `FILE` | `TEXT`), `url` (LINK/FILE), `content` (TEXT), `guide_key` (GUIDE), `display_order`, `active`.
- `resource_lessons`: M2M `resource_id` <-> `lesson_id` (`unique(resource_id, lesson_id)`).
- RLS (calcado de `lessons`/`modules`): SELECT `true` para authenticated; INSERT/UPDATE/DELETE solo `current_app_role() in ('ADMIN','PROFESSOR')`.
- Migración en el repo App: `supabase/migrations/20260702120000_resources.sql`. **Aplicada a la BD viva** por Management API (las migraciones del repo App no son el esquema vivo, ver SOP 02 v6).

## Código (repo `capital-hub-app`, `web/src/`)

- `api/resources.ts`: capa de datos (supabase-js directo, patrón moderno como `training.ts`). `getFormationResources`, `getLessonResources`, `getResource`, `createResource`, `updateResource`, `deleteResource`, `setResourceLessons`.
- Admin: `pages/admin/AdminFormacionDetailPage.tsx` (sección Recursos: crear, editar, borrar, y enlazar a lecciones con chips que muestran a qué lección va cada uno).
- Alumno: `pages/training/FormationDetailPage.tsx` (sección Recursos + chips de lección enlazada), `pages/training/LessonViewer.tsx` (tarjeta "Recursos de esta lección"), `pages/training/ResourceViewer.tsx` (visor a pantalla completa).
- Ruta: `/training/recursos/:resourceId` (en `routes.tsx`, hereda el gate de `/training`).

## El hub de recursos (2026-07-24)

Los recursos ya no son una lista al final de la pantalla de la formación: tienen **pantalla propia**.

- **Ruta**: `/training/formations/:formationId/hub` (`pages/training/FormationHubPage.tsx`).
- **Qué hace**: agrupa los recursos **por tipo** en secciones (Guías visuales, Documentos, Enlaces, Archivos). Las secciones vacías no se pintan, así que el hub crece solo según se añade material.
- **Cómo se entra**: botón destacado **arriba del todo** de la formación (antes del hero, visible sin hacer scroll) **más** un atajo compacto en la cabecera fija, para llegar desde cualquier altura.
- **Para qué sirve** (Marco): el alumno lo consulta cuando quiere, y el equipo lo usa para explicar en vivo durante la formación.

### Volver al sitio exacto

`web/src/lib/nav-origen.ts`. Al salir de una pantalla se guarda su ruta y su scroll en el state del router; al volver, el destino los recupera.

- `origenActual(path)` hace la foto, `leerOrigen(state)` la lee, `stateDeVuelta(origen)` prepara la vuelta y `useRestaurarScroll(listo)` la aplica.
- `listo` es importante: si se restaura antes de que el contenido esté pintado, la página aún mide poco y el scroll se queda corto.
- Lo usan `FormationDetailPage`, `FormationHubPage` y `ResourceViewer`.

### Navegación inyectada a las guías

Las guías no conocen ids de recurso ni rutas. El `ResourceViewer` les pasa un `nav` (`GuiaNav`) con `abrirGuia(guideKey)` y `volverAlHub()`. Así el Entrenamiento 1 puede llevar al 2 sin saber en qué id vive.

### Gotcha global: sticky roto en toda la App

`body { overflow-x: hidden }` (en `web/src/index.css`) convierte el body en contenedor de scroll y **rompe `position: sticky`**: ninguna cabecera de la App se quedaba fija. Corregido a `overflow-x: clip`, que recorta igual pero no crea contenedor de scroll. Si alguien vuelve a poner `hidden` ahí, se rompen todas las cabeceras otra vez.

## Guías visuales (type `GUIDE`)

Una guía visual es una página animada dentro de la App (React + SVG + reveals al scroll), servida por `ResourceViewer`. Se registran por clave:

- `web/src/features/guides/registry.tsx`: mapa `guide_key -> componente`.
- Guías vigentes: `entrenamiento-1`, `entrenamiento-2`, `entrenamiento-3` y `nomenclatura-ui`.
- **Todas se montan con el kit** (`features/guides/kit/`): `fx.tsx` es el motor (atmósfera, keyframes, reveals) y `kit.tsx` las piezas (Hero, Cards, Steps, Timeline, Warn, Split, Terms, Code, NodeLine, Chain, Toc, Closing). Contrato completo en la skill `formacion-visual`.

**Para añadir una guía nueva:** invocar la skill `formacion-visual`, crear el componente en `features/guides/<key>/` **usando el kit**, registrarlo en `registry.tsx` con su `guide_key`, y crear un recurso `type='GUIDE'` con ese `guide_key`. El resto (hub, admin, enlace a lecciones, visor) ya funciona.

## Estado

- **2026-07-24, verificado en local contra la BD de producción** (login test-agent, Playwright): hub con las 4 tarjetas, las 3 guías abriendo sin errores de consola, cero desbordamiento horizontal en escritorio y en móvil, acceso al hub visible sin scroll y desde la cabecera a cualquier altura, y vuelta al scroll exacto (690 -> 690 y 170 -> 170). Pendiente de verificar en `app.capitalhubapp.com` tras el merge.
- Recursos vigentes en la formación IA Integrator (id 1): `entrenamiento-1` (id 1), `entrenamiento-2` (id 2), `entrenamiento-3` (id 3) y `nomenclatura-ui` (id 6, "Catálogo de piezas de interfaz"). Los tres entrenamientos conservan su enlace a la lección "Bienvenida a IA Integrator".
- Verificado en producción el 2026-07-02 (versión anterior, contenido ya retirado). Commit App `d96ac46`.

## Cambios versionados

- **2026-07-24**: **Contenido nuevo y hub.** Las guías `vibe-coding`, `vibe-coding-completo` y `git` se borran (contenido malo, dicho por Marco) y las sustituyen los tres entrenamientos (`entrenamiento-1/2/3`), construidos con el kit unificado. Nace el **hub de recursos** con acceso arriba del todo y atajo en la cabecera, el **volver al sitio exacto** (`lib/nav-origen.ts`) y la navegación inyectada a las guías (`GuiaNav`). El recurso `nomenclatura-ui` se renombra a "Catálogo de piezas de interfaz". Arreglado el `overflow-x` del body que rompía el sticky en toda la App. Filas 1, 2, 3 y 6 de `resources` actualizadas en la BD (se conservan los enlaces a lecciones). Ver `producto/ia-integrator/00-readme.md`.

- **2026-07-02**: Creación de la feature. Tablas + RLS, API, admin, alumno, ResourceViewer, registry de guías + primera guía Vibe Coding. Pendiente: retirar la versión vieja del OS (`/formacion/ia-integrator`), y portar los otros dos manuales (método completo, Git) como guías.
- **2026-07-02**: Botón a la lección enlazada + acceso a editar desde el visor del recurso. Regla de alcance fijada: recursos solo dentro de su formación, sin mezclar entre formaciones (commit App `0c7e715`).
