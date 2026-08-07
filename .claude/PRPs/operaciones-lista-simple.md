---
titulo: Operaciones pasa a ser UNA lista de tareas y nada más
rama: feature/operaciones-lista-simple
estado: aprobado
fecha: 2026-08-07
aprobado_por: Marco — "Empieza ahora" (2026-08-07)
---

# Operaciones = una lista. Se acabó lo demás.

## Objetivo

Operaciones no se usa desde hace meses y no da claridad. Se borra el sistema entero
(Board, Proyectos, Áreas, Focos, fechas, dependencias, Misión) y se queda **una sola lista
de tareas**. Cada tarea tiene cuatro cosas: **título, descripción, prioridad P1/P2/P3 y
responsable**. Tres estados: **pendiente, hecha, archivada**. Y se puede eliminar.

## Qué voy a hacer

**La tarea, exactamente así:**
- **Título**
- **Descripción** — para contar qué hay que hacer
- **Prioridad** — P1, P2 o P3
- **Responsable** — una persona de las que están dentro del OS, o sin asignar
- **Estado** — pendiente · hecha · archivada
- Y se puede **eliminar** de verdad

Nada más. Sin proyecto, sin área, sin fecha límite, sin dependencias, sin foco.

**El responsable sale de los usuarios reales del OS** (tabla `profiles`, los activos), no de
una lista escrita a mano. Hoy son 9: Marco, Adrián, Giustina, Juanda, Nagai, Paolo, Patric,
Ricky y Test Agent. Si mañana entra alguien nuevo al OS, aparece solo.

**Filtros y orden** en la misma pantalla: por prioridad, por estado, por responsable y
búsqueda por texto; ordenar por prioridad o por fecha de creación.

**Lo que se borra:**
- Las **247 tareas sin hacer** y las **67 de Misión**
- Los **33 proyectos, 4 áreas y 2 recursos**
- El foco **"Webinar en directo 8/8/2026"** — esa es la pestaña que desaparece
- Las pantallas **Dashboard de operaciones, Áreas, Proyectos y Board**, y la barra de pestañas
- **Misión, de raíz**: pantalla `/mision`, entrada del menú, código y tabla `launch_phases`
- El código huérfano (`board`, `projects`, `areas`, `operaciones-dashboard`, `mision`) y las
  tablas y columnas que quedan sin usar

**Lo que se queda:** las **263 tareas ya hechas**, como historial, en estado "hecha".
Traducción de la escala vieja: urgente y alta → **P1**, normal → **P2**, baja → **P3**.
Los responsables viejos escritos a mano (`marco`, `adrian`, `paolo`) se enganchan a su
usuario real del OS; los que no son personas del OS (`ai`, `equipo`, `jp`, `steven`) quedan
sin responsable.

## Fases

**A · Limpiar la base de datos**
- [ ] Copia de seguridad de todo (tareas, proyectos, áreas, focos, misión) en un archivo
- [ ] Borrar las 247 tareas sin hacer y las 67 de Misión
- [ ] Cambiar la tabla: prioridad a P1/P2/P3, estado a pendiente/hecha/archivada, responsable enganchado a los usuarios del OS
- [ ] Quitar las columnas que sobran y borrar las tablas `para_items`, `focuses` y `launch_phases`

**B · La pantalla nueva**
- [ ] Quitar la barra de pestañas y las rutas `/overview`, `/areas`, `/projects`, `/board`
- [ ] "Operaciones" en el menú lateral lleva directo a la lista
- [ ] La lista: crear, abrir para describir, cambiar prioridad y responsable, marcar hecha, archivar y eliminar
- [ ] Filtros (prioridad · estado · responsable · buscar) y orden (prioridad · fecha)
- [ ] Móvil primero: tarjetas en el teléfono, tabla en el ordenador, hojas inferiores, 44px, paginado de 20

**C · Tirar lo que sobra**
- [ ] Borrar las features `board`, `projects`, `areas`, `operaciones-dashboard` y `mision`
- [ ] Quitar "Misión" del menú y borrar la ruta `/mision`
- [ ] Dejar `tasks` limpio de todo lo que ya no existe

**D · Comprobar y documentar**
- [ ] `npm run typecheck`, `npm run build` y `npm run check:brandkit` en verde
- [ ] Mirarlo en el navegador a 375 y a 1280, y hacerlo de verdad: crear, describir, priorizar, asignar, filtrar, marcar, archivar, eliminar
- [ ] Reescribir el SOP `producto/01` del Knowledge y retirar lo de Misión

## Qué NO entra

- No se toca CRM, Contactos, Ads, Email Marketing, Knowledge, Sistemas ni la App de alumnos
- Sin etiquetas, carpetas, subtareas, adjuntos ni comentarios. Un nivel es un nivel
- Sin fechas límite. Si hacen falta, se añaden cuando Marco lo diga
- Lo borrado no se recupera desde el OS: la copia de seguridad es un archivo, no una papelera
- No se rediseña ninguna otra pantalla del OS de paso

## Cómo lo verás

Entras en **Operaciones** y hay **una sola pantalla**. Arriba, una caja para escribir una
tarea nueva, la búsqueda, un botón de filtros y el orden. Debajo, la lista: cada tarea con
su P1/P2/P3 y su responsable, y al tocarla se abre para escribir la descripción y cambiar lo
que sea. Puedes marcarla hecha, archivarla o eliminarla. En el teléfono son tarjetas; en el
ordenador, filas. Sin pestañas, sin board, sin proyectos, sin Misión, sin webinar.
