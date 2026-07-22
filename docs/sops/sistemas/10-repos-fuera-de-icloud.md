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

## La copia vieja sigue existiendo

`/Users/marcoantonio/Desktop/Marco-Codes/Capital Hub/` **no se borro**. Se verifico que no contiene nada unico: su base de objetos git es identica objeto por objeto (6751 = 6751), mismos stashes, mismo reflog, mismos untracked, `.env.local` identico byte a byte.

**Riesgo vivo:** si alguien (o un agente) abre esa carpeta por error y commitea ahi, se crea divergencia silenciosa. Y el `.env.local` de dentro sigue subiendo a iCloud.

**Pendiente de decision de Marco:** borrarla. Son 3,9 GB. Hasta entonces, nadie trabaja ahi.

## Como comprobar que estas en el sitio bueno

```
pwd
```
Si aparece `Desktop`, estas en la copia vieja. Salte y vete a `/Users/marcoantonio/Marco-Codes/Capital Hub/`.

## Aprendizaje

- Un repo de trabajo **nunca** va dentro de una carpeta sincronizada por iCloud/Dropbox/Drive. El sync no entiende de `node_modules` ni de caches de build, y sus conflictos se manifiestan como bugs fantasma en el compilador.
- Cuando aparezcan errores de TypeScript en ficheros que nadie escribio (`*.d 2.ts`, `* 2.ts`), la causa es el sync, no el codigo. Borrar la cache antes de investigar nada.
- Cuando se mueva un repo de sitio, hay que hacer `grep -rn "ruta/vieja" docs/` y actualizar el Knowledge en el mismo bloque. Aqui quedaron 4 SOPs apuntando a la ruta muerta.
