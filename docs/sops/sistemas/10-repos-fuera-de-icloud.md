---
title: Repos fuera de iCloud - rutas nuevas y por que
order: 10
---

# Los repos viven FUERA de iCloud (2026-07-22)

> REGLA: ningun repo de Capital Hub vive dentro de una carpeta sincronizada con iCloud. Ni Desktop, ni Documentos, ni Escritorio.

## Rutas buenas (las unicas validas)

| Repo | Ruta local |
|---|---|
| Capital Hub OS | `/Users/marcoantonio/Marco-Codes/Capital Hub/` |
| Capital Hub App | `/Users/marcoantonio/Marco-Codes/App Capital Hub/` (codigo en `web/`) |

Ruta VIEJA, ya no se usa: `/Users/marcoantonio/Desktop/Marco-Codes/...` (el Desktop esta sincronizado con iCloud).

## Por que se movio

iCloud sincronizaba el repo entero, incluidos `node_modules` y `.next`. Cuando dos procesos tocaban el mismo fichero, iCloud resolvia el conflicto **duplicando** el fichero con el sufijo ` 2`. Efectos reales que costaron horas:

1. **TypeScript rompia sin motivo.** `.next/types/routes.d 2.ts` y `.next/types/cache-life.d 2.ts` declaraban los mismos identificadores que los originales → 6 errores `TS2300 / TS2717 / TS6200` que no venian de ningun codigo escrito por nadie. Al borrar la cache, `tsc --noEmit` pasa limpio.
2. **Codigo fuente duplicado.** Aparecio `src/app/(public)/formacion/ia-integrator 2/`, copia byte a byte de la carpeta trackeada. Dentro del App Router de Next eso genera una ruta publica basura `/formacion/ia-integrator 2`.
3. **Ficheros borrados que resucitan.** `src/app/api/notifications/send/route.ts` fue eliminada a proposito en `cc125d7` (ruta muerta sin callers) y reaparecio en disco.
4. **Docs obsoletos que resucitan.** `docs/sops/marketing/brand/01-experimento-brandkit-dojo.md` reaparecio siendo una version vieja del fichero que ya se habia renombrado a `01-brandkit-oficial.md`. Como el Knowledge del OS lee **todos** los `.md` de la carpeta, commitearlo habria mostrado dos brandkits contradictorios.
5. **Git a velocidad de tortuga.** `git status` tardaba **mas de 2 minutos**. Fuera de iCloud tarda **0,1 s**.
6. **Secretos en la nube de Apple.** El `.env.local` con todas las claves de produccion se sincronizaba a iCloud.

## Los workarounds `.nosync` ya no hacen falta

Se usaban `node_modules.nosync/` y `.next.nosync/` (mas symlinks) para sacar esas carpetas del sync. Fuera de iCloud sobran. El `.gitignore` ahora usa `/.next*` y `/node_modules*`, que cubren de una vez la carpeta normal, la `.nosync` y cualquier duplicado ` 2` que quede.

## La copia vieja ya no existe (cerrado 2026-07-22)

`/Users/marcoantonio/Desktop/Marco-Codes/` entero desaparecio. Antes de que se fuera se verifico que no contenia nada unico: base de objetos git identica objeto por objeto (6751 = 6751), mismos stashes, mismo reflog, mismos untracked, `.env.local` identico byte a byte.

### GOTCHA: al juntar las dos carpetas, la basura resucito

Al consolidar la carpeta vieja sobre la nueva, macOS fusiono los directorios. El `.git` bueno se mantuvo (`470385f`), pero **los untracked de la copia vieja reaparecieron en el arbol de trabajo**, deshaciendo la limpieza del commit `5d4ad30`. Volvieron 7 items, todos verificados como redundantes antes de borrarlos otra vez:

| Resucitado | Por que era basura |
|---|---|
| `ch-copy-test-landing-optin.md` | identico al que ya vive en `docs/funnels-source/` |
| `docs/sops/marketing/brand/01-experimento-brandkit-dojo.md` | version vieja del fichero ya renombrado a `01-brandkit-oficial.md` |
| `docs/sops/marketing/brand/Brandkit_Capital_Hub.html` | borrado a proposito en `8dc1a49`, sustituido por `src/app/brandkit/` |
| `public/brandkit.html` | idem |
| `src/app/(public)/formacion/ia-integrator 2/` | duplicado byte a byte del original trackeado |
| `src/app/api/notifications/send/` | ruta muerta eliminada en `cc125d7` (sin callers) |
| `ui-nomenclatura-doc/` | identico al que ya vive en `docs/ui-nomenclatura/` |

**Regla:** cuando se consolidan dos copias de un repo, `git status` del resultado NO esta limpio aunque el `.git` sea el bueno. Hay que revisar los untracked uno a uno: los que vienen de la copia vieja pueden ser ficheros que se borraron a proposito. Comprobar cada uno con `git hash-object` contra el blob del commit que lo elimino antes de decidir.

## Stashes cerrados (2026-07-22)

Los 2 trabajos aparcados se cerraron para dejar el repo limpio. Los commits siguen en la base de objetos y se pueden recuperar con `git stash apply <sha>`:

| SHA | Que era | Por que se cierra |
|---|---|---|
| `76f19b61a732751cfb0b2a969109ec7729fc1046` | `main-wip-2026-07-08` (next-env + puerto en package.json) | Obsoleto: el `-p 3100` ya esta en main y `next-env.d.ts` lo regenera Next solo |
| `dee003196ad0cf3f7f753a4a525cfe92e0797d65` | retirada de formacion del OS + SOP 02/51 + role-access | Decision de producto nunca tomada; quedo pausada por un build roto. Las paginas de formacion siguen vivas en main. Rehacerlo es borrar ficheros, trivial |

## Como comprobar que estas en el sitio bueno

```
pwd
```
Si aparece `Desktop`, estas en la copia vieja. Salte y vete a `/Users/marcoantonio/Marco-Codes/Capital Hub/`.

## Ramas cerradas en la misma pasada (2026-07-22)

El repo arrastraba 6 ramas, todas con el contenido ya dentro de `main`. Se verificaron comparando el **arbol** (`git rev-parse <rama>^{tree}`), no el SHA del commit: un squash-merge cambia el SHA pero deja el contenido identico.

| Rama | SHA | Por que era redundante |
|---|---|---|
| `brandkit-dedup` | `5c90f9e` | Arbol identico al de `origin/main`. PR #5 mergeado |
| `brandkit-proceso` | `47231f4` | Arbol identico al de `origin/main`. PR #4 mergeado |
| `brandkit-dojo` | `ea955d4` | Arbol = el del commit `021b1da`, ya en main. PR #1 mergeado, #2 cerrado |
| `brandkit-knowledge-fix` | `b91bf1e` | Mismo arbol que `brandkit-dojo`. PR #3 mergeado |
| `feat/manychat-dm-stage` | `a8a0f45` | Ancestro directo de `origin/main` |
| `backup/marco-pre-merge-...` | `e520546` | Ancestro de `origin/main`. El funnel LT8 esta en main y ademas evolucionado |

Cero PRs abiertos. Las 4 ramas `brandkit-*` eran 4 intentos duplicados de los mismos 2 arreglos.

**Regla:** para saber si una rama tiene trabajo unico, comparar arboles, no SHAs. `git log origin/main..<rama>` puede listar commits que en realidad ya estan en main con otro SHA.

## Aprendizaje

- Un repo de trabajo **nunca** va dentro de una carpeta sincronizada por iCloud/Dropbox/Drive. El sync no entiende de `node_modules` ni de caches de build, y sus conflictos se manifiestan como bugs fantasma en el compilador.
- Cuando aparezcan errores de TypeScript en ficheros que nadie escribio (`*.d 2.ts`, `* 2.ts`), la causa es el sync, no el codigo. Borrar la cache antes de investigar nada.
- Cuando se mueva un repo de sitio, hay que hacer `grep -rn "ruta/vieja" docs/` y actualizar el Knowledge en el mismo bloque. Aqui quedaron 4 SOPs apuntando a la ruta muerta.
