---
title: La plantilla de NVISION no se adapta sola - los 3 fallos del 2026-08-07
order: 11
---

# SOP 11 · La plantilla de NVISION no se adapta sola: los 3 fallos del 2026-08-07

**Estado:** vivo · **Fecha:** 2026-08-07 · **Origen:** `/actualizar-sistema` + `/update-ecoai`

---

## Qué pasó

Al traer la última versión de NVISION (sistema v5 + skills oficiales), Capital Hub recibió
la **puerta de entrada** (el enganche que obliga a abrir carpeta de chat y a tener un PRP
aprobado antes de escribir) y las órdenes nuevas `npm run publicar` / `npm run cerrar`.

**Tres piezas de la plantilla daban por hecho cosas que en Capital Hub no eran ciertas.**
Ninguna es culpa del proyecto. Las tres están arregladas en local, y las tres hay que
reportarlas a NVISION para que no le pasen a nadie más.

> **Marco (2026-08-07, textual):** *«Se supone que, cuando se actualice eso, se debe de
> adaptar a cualquier tipo de proyecto.»* Ese es el criterio: si una pieza de la plantilla
> obliga al dueño a configurar algo a mano, la pieza está mal, no el proyecto.

---

## Fallo 1 · La puerta llegaba MUERTA si la ruta tiene un espacio

`.claude/hooks/puerta-de-entrada.mjs` resolvía su propia ubicación así:

```js
const AQUI = resolve(new URL('.', import.meta.url).pathname, '..', '..')
```

`.pathname` **no descodifica** los espacios: devuelve `Capital%20Hub`. Esa carpeta no
existe, `git worktree list` falla, y el hook cae en su rama «ante la duda, deja pasar».

**Consecuencia:** el vigilante se instala, parece que está, y **no vigila nada**. Silencioso.
Es el peor fallo posible en una pieza de seguridad: la que se cree puesta y no lo está.

**Arreglo:** `fileURLToPath` en vez de `.pathname`.

```js
import { fileURLToPath } from 'node:url'
const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..')
```

**Regla general:** en cualquier `.mjs` del proyecto, para pasar de `import.meta.url` a una
ruta de disco se usa SIEMPRE `fileURLToPath`. Nunca `.pathname`. La ruta de este repo tiene
un espacio (`Capital Hub`) y siempre lo va a tener.

---

## Fallo 2 · `publicar` exigía escribir a mano la dirección de la web

`scripts/publicar.mjs` solo miraba en un sitio:

```js
const DOMINIO = process.env.PUBLICAR_DOMINIO || paquete.nvision?.web || ''
```

Es decir: había que añadir un cajón `"nvision": { "web": … }` al `package.json` de cada
proyecto. **Un proyecto Next.js real ya sabe cuál es su dirección** — la usa para el
sitemap, los metadatos y los enlaces de los correos. Pedir que se escriba otra vez es
configuración manual innecesaria.

**Arreglo:** ahora se descubre, en este orden, y el primero que aparezca gana:

1. `PUBLICAR_DOMINIO` (para forzarlo puntualmente)
2. `package.json` → `nvision.web` (si alguien lo puso a mano)
3. `NEXT_PUBLIC_APP_URL` / `NEXT_PUBLIC_SITE_URL` / `NEXT_PUBLIC_BASE_URL` /
   `NEXT_PUBLIC_VERCEL_URL`, mirando el entorno **y** los `.env*`
4. El `metadataBase` del `layout.tsx` raíz

En Capital Hub gana el punto 4: ningún `.env` declara la dirección, vive como valor por
defecto en `src/app/layout.tsx`. Resultado: encuentra `https://os.capitalhubapp.com` **sin
tocar nada**.

---

## Fallo 3 · `publicar` exigía un campo `version` que aquí se llama `sha`

Para saber si la web ya sirve el commit nuevo, `publicar` preguntaba a `/api/version` y leía
`j.version`. El [/api/version](../../../src/app/api/version/route.ts) de Capital Hub devuelve
`{ sha, message, author }` — el popup «Refrescar» (`UpdateNotifier.tsx`) lee `sha`.

**Consecuencia:** `j.version` siempre `undefined`, nunca coincide. `publicar` **esperaba los
10 minutos enteros** y terminaba diciendo que había fallado… cuando en realidad había
publicado bien. Un falso negativo que asusta y hace perder 10 minutos cada vez.

**Arreglo:** se aceptan `version` / `sha` / `commit` / `gitSha` / `commitSha`, y se comparan
solo los 7 primeros caracteres (un proyecto puede devolver el sha entero).

**No se tocó `/api/version`.** Cambiar `sha` por `version` habría roto el popup «Refrescar».
La pieza que se adapta es la plantilla, no el proyecto.

---

## Lo que NO se cambió, y por qué

**El `settings.json` oficial quita el aviso de `git push`, `vercel`, `gh pr merge` y
`gh release`.** Aquí se conservó la lista `ask` de Capital Hub. No hace las órdenes más
lentas: `publicar` y `cerrar` corren dentro de node, así que el `git push` de dentro no es
una orden de shell aparte y el aviso nunca les salta. Se comprobó: el ensayo completo corre
sin una sola pregunta.

---

## Cómo quedó, medido

| Cosa | Antes | Ahora |
|---|---|---|
| Publicar | ~12 órdenes sueltas | **1** (`npm run publicar`) |
| Comprobación antes de subir | `next build` local, 5m 16s | `typecheck`, **~7s** |
| Ensayo completo del camino | no existía | **40s**, en verde |
| Preguntas al dueño | varias | **cero** |
| Puerta de entrada | no existía | activa y probada |

---

## Relacionado

- `docs/sops/producto/04-protocolo-trabajo-agente.md` — el protocolo del agente
- `docs/sops/sistemas/08-proceso-end-to-end-completo.md` — el recorrido rama → dev → main
- `docs/sops/sistemas/10-repos-fuera-de-icloud.md` — por qué la ruta tiene un espacio
