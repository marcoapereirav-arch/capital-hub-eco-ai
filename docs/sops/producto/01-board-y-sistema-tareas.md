---
title: Operaciones — la lista de tareas (un solo nivel)
order: 1
---

# Operaciones · una lista y nada más

**Ruta:** `/operaciones` · **Antes:** `/overview`, `/tasks`, `/board`, `/projects`, `/areas`

## Qué es

Una lista. Se apunta lo que surge y se marca cuando se hace. **Un solo nivel.**

Cada tarea tiene cuatro cosas y ni una más:

| Campo | Qué es |
|---|---|
| **Título** | Lo que hay que hacer |
| **Descripción** | El detalle, para no tener que acordarse |
| **Prioridad** | `P1` lo primero · `P2` normal · `P3` cuando haya hueco |
| **Responsable** | Una persona **real del OS**, o sin asignar |

Y tres estados: **pendiente**, **hecha**, **archivada**. Además se puede **eliminar**.

No hay proyectos, ni áreas, ni recursos, ni focos, ni fechas límite, ni dependencias,
ni etiquetas, ni subtareas. Si algún día hacen falta, se añaden entonces.

## Por qué se tiró el sistema anterior

Hasta el 2026-08-07 esto era un sistema GTD + PARA con cinco pantallas (Dashboard de
operaciones, Áreas, Proyectos, Tareas y Board visual), 33 proyectos, 4 áreas, 2 recursos,
un "foco" del webinar y 510 tareas con dependencias, fechas y flags de "trabajando ahora".

**No se usó en meses.** Marco, 2026-08-07:

> *"Es un pedazo del sistema de mierda y no nos está ayudando nada para poder tener
> claridad sobre lo que tiene que hacer cada uno, porque es que, bro, no lo hemos usado.
> Así que nuestro sistema de tareas lo vamos a eliminar… lo vamos a organizar solo en un
> nivel de tareas y ya está."*

La lección: **un sistema de organización que hay que mantener no se mantiene.** Lo que
sobrevive es lo que cuesta cero: escribir una línea y tacharla.

## El responsable sale del OS, no de una lista escrita a mano

El desplegable de responsable lee `profiles` filtrando por `active = true`. Quien entra
al OS aparece solo; quien se va, desaparece. **Nunca se escribe una lista de nombres en
el código** — el sistema anterior tenía `marco / adrian / equipo / ai` a mano y acabó con
`jp` y `steven`, que no eran usuarios de nada.

## Quién la ve

Todos los roles ya tenían permiso de ruta sobre Operaciones (`src/lib/auth/role-access.ts`),
pero la política de la tabla era `is_admin()`, o sea **solo super_admin**. Con responsable
por persona eso no se sostiene: una tarea asignada a alguien que no puede abrirla no sirve.

La política pasó a `is_os_user()` — **cualquier usuario ACTIVO del OS** lee y gestiona la
lista. Sigue habiendo RLS: sin perfil activo no se lee ni se escribe nada. La lista es del
equipo, igual que un tablón: no hay tareas privadas.

## Dónde vive

| Cosa | Sitio |
|---|---|
| Pantalla | `src/app/(main)/operaciones/page.tsx` |
| Todo lo demás | `src/features/tasks/` (tipos, servicio, store, componentes) |
| Tabla | `public.tasks` |
| Migración | `supabase/migrations/20260807120000_operaciones_lista_simple.sql` |

Las rutas viejas (`/overview`, `/tasks`, `/board`, `/projects`, `/areas`, `/mision`)
**redirigen a `/operaciones`** desde `next.config.ts`. Nadie se come un 404 por tener un
enlace guardado o la app abierta en la pantalla vieja.

## Qué se borró, y qué se guardó

- **247 tareas sin hacer** — borradas
- **33 proyectos, 4 áreas, 2 recursos, 1 foco** ("Webinar en directo 8/8/2026") — borrados
- **Misión Producto Terminado** (`/mision`, tabla `launch_phases`, 67 tareas) — borrada de
  raíz. Era el mismo sistema con otra cara. Retirado el SOP `producto/07`.
- **262 tareas hechas** — se quedan como historial, en estado `hecha`
- **Copia de seguridad completa** (510 tareas, 39 proyectos/áreas, 1 foco, 4 fases) en
  `archivo/backup-operaciones-2026-08-07.json`. Está fuera de git (`/archivo/` es
  gitignored): es un artefacto, no código.

Traducción de la escala vieja a la nueva: `urgent` y `high` → **P1** · `normal` → **P2** ·
`low` → **P3`. Los responsables de texto que sí eran personas del OS (`marco`, `adrian`,
`paolo`) se engancharon a su perfil; `ai`, `equipo`, `jp` y `steven` quedaron sin
responsable.

## Reglas de la pantalla

1. **Máximo 20 por página.** Regla del OS, no de esta pantalla.
2. **La lista abre filtrada a pendientes.** Es lo que se quiere ver al entrar.
3. **El hueco vacío dice la verdad.** Hay tres mensajes distintos: lista vacía de verdad,
   nada con esos filtros, y no queda nada pendiente (con 262 hechas detrás). El primer
   intento decía "todavía no hay tareas" habiendo 262: eso es mentirle al usuario.
4. **La fecha de completado la pone el sistema**, no el usuario. Al marcar hecha se sella
   y al volver a pendiente se borra, para que el historial no mienta.

## Dos trampas encontradas al construir esto

### 1. `bg-brand` pintaba transparente

El token era `--color-brand: rgb(var(--brand) / <alpha-value>)`, sintaxis de **Tailwind
v3**, y este proyecto va por la **v4**, donde `<alpha-value>` no se sustituye: el color
sale inválido. El botón verde principal existía, medía 44px y era **invisible**.

Lo arreglaron los dos chats a la vez y ganó la versión del otro, que es la buena: `--brand`
pasa a ser un color de verdad (`#22c55e`) y el token apunta a él con `var(--brand)`, más
`--brand-soft` y `--brand-ink` para la tinta. Mi parche (`rgb(var(--brand))`) se retiró en
la unión: con `--brand` ya siendo un hexadecimal, habría vuelto a romperlo.

**La lección, que ya estaba escrita en el brandkit y volvió a pasar:** el nombre de un
token no garantiza su valor. Se comprueba **en el navegador** con `getComputedStyle`, no
leyendo el CSS. Un `bg-*` que devuelve `rgba(0,0,0,0)` es un token roto, no un descuido de
diseño. Y la tinta sobre verde es `text-brand-ink`, nunca `text-background` ni `text-white`.

### 2. `npm run publicar` fallaba por basura de compilaciones viejas

La puerta paró la publicación **dos veces** con errores de tipos que apuntaban a rutas que
este mismo trabajo acababa de borrar:

```
.next/types/validator.ts: Cannot find module '.../(operaciones)/board/page.js'
```

No era un fallo del código: `tsconfig` incluye `.next/types/**/*.ts`, y ahí quedaba el
índice de rutas de una compilación anterior, que seguía nombrando las pantallas borradas.
**Y no basta con limpiarlo en la carpeta del chat**: la puerta corre también sobre la
**carpeta principal**, que tenía su propio `.next` viejo.

Cuando un trabajo **borra rutas**, antes de publicar se limpia el `.next` de **las dos**
carpetas:

```bash
node -e "require('fs').rmSync('.next',{recursive:true,force:true})"   # en la del chat
node -e "require('fs').rmSync('.next',{recursive:true,force:true})"   # y en la principal
```

Señal para reconocerlo: el error dice "Cannot find module" de un archivo que **tú acabas
de borrar a propósito**. Eso nunca es el código, es la caché.
