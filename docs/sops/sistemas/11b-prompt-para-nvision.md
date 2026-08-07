---
title: Prompt para NVISION - arreglar los 3 fallos de la plantilla en origen
order: 12
---

# Prompt para pegar en el proyecto de NVISION

Esto se pega **tal cual** en un chat abierto dentro del repo `nvision-setup`. Arregla en
origen los 3 fallos encontrados el 2026-08-07 (ver [SOP 11](11-plantilla-nvision-no-se-adapta-sola.md)),
para que cualquiera que actualice reciba las piezas ya funcionando.

---

```
Actualicé un proyecto real con /actualizar-sistema y /update-ecoai y tres piezas de la
plantilla no funcionaron, porque daban por hecho cosas que ese proyecto no cumplía. El
proyecto es Next.js normal y corriente. Quiero que las arregles EN LA PLANTILLA, no en el
proyecto, y que la regla general sea: la plantilla se adapta al proyecto, nunca al revés.
Si una pieza obliga al dueño a configurar algo a mano, esa pieza está mal.

FALLO 1 · .claude/hooks/puerta-de-entrada.mjs llega MUERTO si la ruta tiene un espacio

Resuelve su propia ubicación con:

    const AQUI = resolve(new URL('.', import.meta.url).pathname, '..', '..')

.pathname NO descodifica los espacios: en "/Users/x/Capital Hub/..." devuelve
"Capital%20Hub". Esa carpeta no existe, git worktree list falla, y el hook cae en su rama
"ante la duda, deja pasar". Resultado: el vigilante se instala, parece que está, y NO
VIGILA NADA. Silencioso, sin un solo aviso. Es el peor fallo posible en una pieza de
seguridad: la que se cree puesta y no lo está.

Arréglalo con fileURLToPath:

    import { fileURLToPath } from 'node:url'
    const AQUI = resolve(fileURLToPath(new URL('.', import.meta.url)), '..', '..')

Y revisa TODOS los .mjs de scripts/ y .claude/hooks/ buscando el mismo patrón
(`import.meta.url` + `.pathname`). Donde lo encuentres, cámbialo. Las rutas con espacios
son normales en Mac.

Además: si el hook no consigue averiguar dónde está el proyecto, que NO se calle. Que
escriba un aviso por stderr diciendo que no pudo comprobar nada. Un vigilante que falla
en silencio es peor que no tenerlo, porque da falsa seguridad.

FALLO 2 · scripts/publicar.mjs obliga a escribir la dirección de la web a mano

Ahora mismo solo mira aquí:

    const DOMINIO = process.env.PUBLICAR_DOMINIO || paquete.nvision?.web || ''

Es decir, hay que añadir un cajón "nvision": { "web": ... } al package.json de cada
proyecto. Eso está mal: un proyecto Next.js YA sabe cuál es su dirección, la usa para el
sitemap, los metadatos y los enlaces de los correos. Pedirle al dueño que la escriba otra
vez en un cajón con el nombre de la plantilla es configuración manual innecesaria, y
además confunde ("¿por qué mi proyecto tiene una clave que se llama nvision?").

Haz que se DESCUBRA, en este orden, y que gane el primero que aparezca:

  1. process.env.PUBLICAR_DOMINIO
  2. package.json -> nvision.web (compatibilidad con quien ya lo puso)
  3. NEXT_PUBLIC_APP_URL / NEXT_PUBLIC_SITE_URL / NEXT_PUBLIC_BASE_URL /
     NEXT_PUBLIC_VERCEL_URL, mirando process.env Y los ficheros
     .env.production.local, .env.production, .env.local, .env
  4. El metadataBase del layout raíz (src/app/layout.tsx o app/layout.tsx):
     metadataBase: new URL(process.env.X ?? 'https://...') -> coge ese literal

Detalles que importan:
- Al leer los .env, quita comillas, espacios y comentarios al final de la línea.
- Ancla la búsqueda de la clave al principio de línea, o NEXT_PUBLIC_FUNNEL_BASE_URL te
  colará un falso positivo por NEXT_PUBLIC_BASE_URL.
- Si la dirección viene sin esquema (Vercel las da así), añádele https://.
- Si aun así no encuentras nada, en el mensaje NO digas "ponlo en package.json". Di qué
  variables buscaste y sugiere NEXT_PUBLIC_APP_URL en el .env.local.

FALLO 3 · publicar exige un campo "version" en /api/version

Para saber si la web ya sirve el commit nuevo lee j.version. El proyecto real devuelve
{ sha, message, author } — y su campo sha lo consume un popup de "Refrescar", así que
renombrarlo habría roto el producto.

Consecuencia: j.version siempre undefined, nunca coincide, publicar espera los 10 MINUTOS
enteros y termina diciendo que falló... cuando en realidad había publicado bien. Un falso
negativo caro: asusta, y hace perder 10 minutos cada vez.

Acepta los nombres habituales en vez de exigir uno:

    const shaServido = (j) => j?.version ?? j?.sha ?? j?.commit ?? j?.gitSha ?? j?.commitSha ?? null

Y compara solo los 7 primeros caracteres, porque un proyecto puede devolver el sha entero.

QUÉ QUIERO DE VUELTA

1. Los tres arreglos aplicados en la plantilla.
2. Una revisión del resto de scripts/*.mjs y .claude/hooks/*.mjs buscando el MISMO tipo de
   problema: cualquier sitio donde la plantilla dé por hecho una convención concreta
   (un nombre de campo, una clave de package.json, una ruta, un nombre de script) en vez
   de descubrirla o de aceptar varias formas. Enséñame la lista antes de tocar.
3. Una prueba que se pueda correr: crea un proyecto de mentira en una ruta CON ESPACIO,
   con un /api/version que devuelva { sha } y sin ninguna clave nvision, y comprueba que
   la puerta bloquea y que publicar --ensayo encuentra el dominio. Si eso pasa en verde,
   los tres fallos están cerrados de verdad.
4. Sube la versión en .claude/SISTEMA.md y anota los tres arreglos en el changelog.

NOTA IMPORTANTE SOBRE LA VERSIÓN
Estos tres fallos entraron en la plantilla DESPUÉS de publicar la v5, sin subir el número.
Por eso /actualizar-sistema comparó "v5 contra v5", dijo "ya estás al día" y no trajo nada:
el proyecto se quedó con los skills viejos aunque la madre tenía cambios. Cualquier cambio
en la plantilla tiene que subir la versión, o el vigilante de actualizaciones miente.
```

---

## Cómo usarlo

1. Abrir un chat en el repo de la plantilla (`nvision-setup`).
2. Pegar el bloque de arriba entero.
3. Cuando NVISION lo publique, correr aquí `/actualizar-sistema` y comprobar que los
   parches locales de este proyecto ya no hacen falta (los de `scripts/publicar.mjs` y
   `.claude/hooks/puerta-de-entrada.mjs`).
