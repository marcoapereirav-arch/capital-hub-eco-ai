#!/usr/bin/env node
/**
 * CANDADO DE BRANDKIT del OS.
 *
 * Regla: el diseno de Capital Hub se escribe con los tokens del tema, no con colores,
 * fuentes y tamanos puestos a mano, y toda pantalla se construye para el telefono
 * primero. Todo lo que este archivo caza es una senal del diseno ANTIGUO o de una
 * pantalla escrita solo para monitor.
 *
 * POR QUE EXISTE
 * El 31-jul-2026 se cambiaron todos los tokens del tema al brandkit nuevo (verde
 * #22C55E, Inter Tight, esquinas de 4px) y en pantalla no se noto casi nada, porque la
 * mayor parte del OS no pregunta por el token: lleva el color grabado dentro. Cambiar el
 * tema no repinta lo que esta escrito a mano.
 * Marco, 02-ago-2026: "que se deje de disenar con el brandkit VIEJO... que NUNCA mas se
 * vuelva a usar el diseno antiguo, y que TODO el saas se adapte al movil".
 *
 * COMO SE USA
 *   npm run check:brandkit              revisa todo src/
 *   npm run check:brandkit -- --staged  revisa solo lo que vas a guardar (lo usa el gancho)
 *   npm run check:brandkit -- --rebase  recoloca la lista de deuda (al partir o renombrar)
 *   npm run check:brandkit -- --sembrar-regla <id>  estrena una regla NUEVA metiendo en
 *       el acta lo que ya estaba escrito. Una sola vez por regla.
 *
 * DONDE CORRE
 *   - Gancho de guardado (.githooks/pre-commit): SIEMPRE, y solo sobre tus archivos. Es el
 *     unico momento que nunca se salta, y culpa a quien escribio la linea.
 *   - predev y prebuild: red de seguridad. El servidor suele estar ya encendido, asi que
 *     no se puede confiar solo en ellos.
 *   - En el servidor que publica la web: NO. El 31-jul-2026 un candado enganchado a
 *     prebuild tumbo dos despliegues seguidos y produccion se quedo sirviendo lo viejo
 *     (docs/sops/producto/06-vercel-deploy-y-colaboracion.md). Esto vigila COMO se escribe
 *     el codigo, y eso se corrige en la maquina de quien lo escribe.
 *
 * LA DEUDA
 * Lo que ya estaba mal el dia que se encendio el candado vive en .brandkit-debt.json, a la
 * vista y versionado. NO es un numero: es la HUELLA exacta (que regla, que texto, cuantas
 * veces) de cada archivo. Por eso no se puede cambiar diseno viejo por diseno viejo
 * distinto: cualquier senal que no este en la huella salta, aunque el total baje. Y cuando
 * un archivo mejora, el candado aprieta el trinquete solo y reescribe el JSON.
 *
 * Knowledge: docs/sops/marketing/brand/01-brandkit-oficial.md
 *            .claude/skills/os-movil-primero/SKILL.md
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from "node:fs"
import { join, relative, dirname } from "node:path"
import { execFileSync } from "node:child_process"

/* ------------------------------------------------------------------------- *
 * Salida para el servidor que publica la web
 * ------------------------------------------------------------------------- */
if (process.env.VERCEL || process.env.VERCEL_ENV || process.env.CI) {
  console.log("  Brandkit: no se revisa en el servidor de publicacion (se revisa al escribir codigo).")
  process.exit(0)
}

const ROOT = process.cwd()
const ARGS = process.argv.slice(2)
const MODO_STAGED = ARGS.includes("--staged")
const MODO_REBASE = ARGS.includes("--rebase")
/* --sembrar-regla <id>: cuando se ANADE una regla nueva, lo que ya estaba escrito antes
 * de que existiera es deuda por definicion, no diseno viejo recien escrito. Esta bandera
 * mete en el acta SOLO los hallazgos de esa regla, y solo si la regla no figuraba ya.
 * Es lo unico que permite estrenar una regla sin bloquear el repositorio entero ni tener
 * que perdonar de golpe con --rebase, que a proposito se niega cuando el total sube. */
const IDX_SEMBRAR = ARGS.indexOf("--sembrar-regla")
const REGLA_A_SEMBRAR = IDX_SEMBRAR === -1 ? null : ARGS[IDX_SEMBRAR + 1] ?? null

const RUTA_DEUDA = join(ROOT, ".brandkit-debt.json")
const RUTA_CACHE = join(ROOT, "node_modules/.cache/capitalhub-brandkit.json")

const SCAN = ["src"]
const EXTENSIONES = [".tsx", ".ts", ".jsx", ".js", ".mjs", ".cjs", ".mdx", ".css", ".scss"]

const ROJO = "\x1b[31m"
const GRIS = "\x1b[90m"
const FIN = "\x1b[0m"

/* Archivos que SON el brandkit: contienen la paleta entera a proposito. */
const EXENTOS_TOTAL = new Set([
  "src/app/brandkit/version-two.tsx",
  "src/app/brandkit/page.tsx",
])

/* Zonas donde los tokens del tema NO existen y hay que escribir el valor literal:
 *  - un correo: Gmail y Outlook borran las variables CSS
 *  - un video de Remotion: es un lienzo de 1080x1920 fijo, sin Tailwind
 *  - una imagen de previsualizacion (opengraph): se dibuja fuera de la app
 * Ahi vale la paleta oficial escrita a mano, y las reglas de estructura no aplican. */
const esZonaSinTokens = (rel) =>
  rel.startsWith("src/lib/email/") ||
  rel.startsWith("src/remotion/") ||
  /(?:^|\/)(?:opengraph-image|twitter-image|icon|apple-icon)\.tsx$/.test(rel)

/* Datos de PRODUCTO, no diseno: las paletas que el USUARIO elige para sus etiquetas, sus
 * etapas de pipeline o sus nodos. Un color ahi es contenido, y decirle "usa bg-primary"
 * no significa nada. */
const esDatoDeProducto = (rel) =>
  rel.endsWith(".ts") && /\/(?:types|services|constants|config)\//.test(rel)

/* Colores literales permitidos SOLO en las zonas sin tokens. Es la paleta oficial
 * (docs/sops/marketing/brand/01-brandkit-oficial.md) mas blanco y negro puros, que se usan
 * con transparencia para velos y sombras. Los hexadecimales que aparezcan en globals.css
 * se anaden solos mas abajo, para que la lista no se quede vieja. */
const PALETA = new Set([
  "0F0F12", // carbon, fondo de pagina
  "131318", // panel
  "16161B", // panel elevado
  "2A2D34", // grafito
  "F5F6F7", // texto principal
  "A6AAB2", // texto secundario
  "7C818A", // texto terciario
  "22C55E", // verde de marca
  "4ADE80", // verde claro
  "08130C", // tinta sobre verde
  "101710", // superficie verde
  "24462F", // borde verde
  "F4F1E8", // papel hueso
  "141414", // tinta sobre papel
  "D8D1BE", // linea del papel
  "E5B567", // ambar, solo avisos
  "FFFFFF",
  "000000",
  "4F7CC0", // cinturon azul
  "7B5BA6", // cinturon purpura
  "856046", // cinturon marron
  "EF4444", // rojo de error: el unico rojo legal donde no existe text-destructive
  "F8F7F4", // blanco roto de los subtitulos sobre video
])

/* ------------------------------------------------------------------------- *
 * EL TEMA MANDA: que clases existen de verdad
 *
 * Las listas de abajo NO se escriben a mano: se derivan de globals.css. Asi, el dia que
 * alguien anada --color-warn al tema, `text-warn` deja de estar prohibido SOLO, sin tocar
 * este archivo. Una lista escrita a mano se queda vieja el mismo dia en que el proyecto
 * avanza, y entonces el candado prohibe justo lo que la ley de diseno ordena.
 * ------------------------------------------------------------------------- */

function normalizaHex(h) {
  let x = h.toUpperCase()
  if (x.length === 3) x = x[0] + x[0] + x[1] + x[1] + x[2] + x[2]
  if (x.length === 8) x = x.slice(0, 6)
  return x
}

function leerTema() {
  /* Cada familia por separado. --color-card hace legal `bg-card`, NO `rounded-card`:
   * mezclarlas en un solo saco perdona clases que siguen sin existir. */
  const nombres = { color: new Set(), radius: new Set(), shadow: new Set(), tracking: new Set(), ease: new Set() }
  try {
    const css = readFileSync(join(ROOT, "src/app/globals.css"), "utf8")
    for (const m of css.matchAll(/--(color|radius|shadow|tracking|ease)-([a-z0-9-]+)\s*:/gi)) {
      const familia = m[1].toLowerCase()
      if (nombres[familia]) nombres[familia].add(m[2].toLowerCase())
    }
    for (const m of css.matchAll(/#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F])/g)) {
      PALETA.add(normalizaHex(m[1]))
    }
  } catch {
    /* sin globals.css se sigue con la lista de sospechosas al completo */
  }
  return nombres
}

const NOMBRES_DEL_TEMA = leerTema()

/* Nombres que la ley de diseno escrita nombra y que NUNCA se definieron en el proyecto.
 * Quien los escribe construye una pantalla sin fondo, sin borde y sin verde. Se quitan de
 * la lista los que SI existan hoy en globals.css. */
const SOSPECHOSAS_COLOR = [
  "carbon", "carbon-2", "panel", "panel-soft", "offwhite", "deepmute", "greenink",
  "line", "line-strong", "graphite", "accent-soft", "accent-surface", "accent-border",
  "paper", "paper-ink", "paper-line", "warn",
].filter((n) => !NOMBRES_DEL_TEMA.color.has(n))

const SOSPECHOSAS_FORMA = [
  ["rounded", "radius", ["card", "panel", "pill", "chip"]],
  ["shadow", "shadow", ["card", "green", "glow"]],
  ["tracking", "tracking", ["wordmark"]],
  ["ease", "ease", ["brand"]],
]
  .map(([raiz, familia, sufijos]) => [raiz, sufijos.filter((s) => !NOMBRES_DEL_TEMA[familia].has(s))])
  .filter(([, sufijos]) => sufijos.length > 0)

function patronClasesInexistentes() {
  const trozos = []
  if (SOSPECHOSAS_COLOR.length) {
    trozos.push(
      "(?:bg|text|border|ring|fill|stroke|divide|from|to|via|outline|decoration)-(?:" +
        SOSPECHOSAS_COLOR.join("|") +
        ")"
    )
  }
  for (const [raiz, sufijos] of SOSPECHOSAS_FORMA) {
    trozos.push(raiz + "-(?:" + sufijos.join("|") + ")")
  }
  if (trozos.length === 0) return null
  return new RegExp("(?<![\\w-])(?:" + trozos.join("|") + ")(?![\\w-])", "g")
}

/* ------------------------------------------------------------------------- *
 * Utilidades de clases de Tailwind
 *
 * BORDE: una clase empieza donde NO hay letra, guion, barra, punto, corchete ni dos
 * puntos. Los dos puntos son la clave: sin excluirlos, `md:text-[13px]` se cazaba como si
 * fuera `text-[13px]` a secas, y el candado bloqueaba justo lo que la ley de diseno manda
 * escribir. Cuando la ley y el guardia se contradicen, se acaba quitando el guardia.
 * ------------------------------------------------------------------------- */
const BORDE = "(?<![\\w:\\[\\]\\/.-])"
const PREFIJOS = '((?:[^\\s"\'`{}:]+:)*)'

const RESPONSIVE = new Set(["sm", "md", "lg", "xl", "2xl"])

/** true si la cadena de prefijos apunta a pantalla ancha: ahi el telefono no lo ve. */
// Devuelve el nombre de la etiqueta JSX a la que pertenece una clase encontrada
// en la linea `i`, posicion `col`. Mira hacia atras hasta 6 lineas buscando la
// ultima apertura `<Algo` que no se haya cerrado todavia.
function etiquetaDuena(lineas, i, col) {
  const trozos = []
  for (let k = Math.max(0, i - 6); k < i; k++) trozos.push(lineas[k])
  trozos.push(lineas[i].slice(0, col))
  const texto = trozos.join("\n")
  const aperturas = [...texto.matchAll(/<\/?([A-Za-z][\w.]*)/g)]
  if (!aperturas.length) return ""
  return aperturas[aperturas.length - 1][1]
}

function esDeEscritorio(prefijos) {
  if (!prefijos) return false
  return prefijos.split(":").some((p) => RESPONSIVE.has(p) || p === "file")
}

/** Une la linea con sus vecinas. Un className partido por el formateador, o un cn() con
 *  varias cadenas, sigue siendo el MISMO elemento: mirar solo dentro de una linea deja
 *  una puerta abierta que se cruza sin querer. */
function ventanaDe(lineas, i, radio) {
  return lineas.slice(Math.max(0, i - radio), i + radio + 1).join(" ")
}

const CONTROL =
  /<button|<Button|<input\b|<Input\b|<select|<Select|<textarea|<Textarea|role=["']button["']|onClick=|buttonVariants|data-slot=["'](?:button|input|textarea)["']/
const CAMPO = /<input\b|<Input\b|<textarea|<Textarea|data-slot=["'](?:input|textarea)["']/
const ICONO = /<svg|Icon\b|strokeWidth|aria-hidden|lucide/

/* ------------------------------------------------------------------------- *
 * LAS REGLAS
 *
 * Cada una lleva escrito con QUE se sustituye. Un candado que solo dice "esto esta mal"
 * obliga a buscar la respuesta en otro sitio, y ahi es donde se abandona.
 *
 * familia: "color"      -> no aplica en globals.css ni en datos de producto
 *          "estructura" -> no aplica en correos, video ni imagenes de previsualizacion
 *          "letra"      -> aplica en todas partes, tambien en globals.css
 * ------------------------------------------------------------------------- */

const REGLAS = [
  {
    id: "clase-que-no-existe",
    titulo: "Clase del brandkit que NO existe en este proyecto",
    familia: "letra",
    patron: patronClasesInexistentes(),
    arreglo: [
      "Esa clase no pinta NADA: no esta definida en el bloque @theme de src/app/globals.css",
      "ni en tailwind.config.ts. Una pantalla escrita asi sale sin fondo, sin borde y sin",
      "verde, o sea transparente, y parece que no hiciste nada.",
      "",
      "Los nombres que SI existen hoy:",
      "  fondo de pagina ......... bg-background      (#0F0F12)",
      "  tarjeta / panel ......... bg-card",
      "  menu, hoja, flotante .... bg-popover",
      "  texto principal ......... text-foreground",
      "  texto secundario ........ text-muted-foreground",
      "  borde ................... border-border",
      "  verde de marca .......... bg-primary / text-primary / bg-accent",
      "  tinta sobre el verde .... text-primary-foreground",
      "  esquina de tarjeta ...... rounded-lg   (4px, ya calibrado)",
      "  esquina de panel ........ rounded-xl   (6px)",
      "",
      "Esta lista se saca de globals.css al vuelo: si el token de verdad hace falta, se anade",
      "ahi (--color-loquesea) y la clase pasa a ser legal sola, sin tocar el candado.",
    ],
  },
  {
    id: "color-a-mano",
    titulo: "Color escrito a mano",
    familia: "color",
    /* Solo cuenta si esta escrito COMO un color: detras de corchete, dos puntos, igual,
     * parentesis o comilla. Sin esa condicion, "Pedido #402931" y "Factura #100234" se
     * contaban como colores, y esto es un CRM lleno de numeros de pedido y de factura. */
    patron: /(?<=[[:=('"`]\s{0,2})#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})(?![0-9a-fA-F\w])/g,
    filtro: (m, ctx) => {
      const hex = normalizaHex(m[1])
      if (hex === "37CA37") return false // tiene su propia senal
      /* En un correo o en un video no hay tokens: ahi vale la paleta oficial. En una
       * pantalla del OS SI hay tokens, asi que cualquier color a mano es diseno viejo,
       * este o no en la paleta: escrito asi, no escucha al tema. */
      return ctx.sinTokens ? !PALETA.has(hex) : true
    },
    arreglo: [
      "Un color grabado en la pantalla no escucha al tema: el dia que cambia la marca, esa",
      "pantalla se queda con el color viejo. Eso es exactamente lo que paso el 31-jul-2026,",
      "cuando se pusieron todos los tokens en verde y no se noto.",
      "",
      "  bg-[#0F0F12] .................. bg-background",
      "  bg-[#18181B] bg-[#131318] ..... bg-card   (bg-popover si va encima de una tarjeta)",
      "  text-[#F5F6F7] ................ text-foreground",
      "  text-[#9CA3AF] text-[#6B7280] . text-muted-foreground",
      "  border-[#2A2D34] .............. border-border",
      "  bg-[#22C55E] .................. bg-primary  (con text-primary-foreground encima)",
      "",
      "El color literal solo se permite donde los tokens no existen: correos",
      "(src/lib/email/), video (src/remotion/) e imagenes de previsualizacion. Y ahi, solo la",
      "paleta oficial.",
    ],
  },
  {
    id: "verde-viejo",
    titulo: "El verde viejo #37CA37",
    familia: "color",
    patron: /#37ca37(?![0-9a-fA-F])|rgba?\(\s*55\s*,\s*202\s*,\s*55/gi,
    arreglo: [
      "Ese es el verde de marca anterior. Conviviendo con el nuevo se ven dos verdes distintos",
      "en la misma pantalla. Escrito en decimal es el mismo color: rgb(55, 202, 55).",
      "",
      "Se sustituye por el token: bg-primary / text-primary.",
    ],
  },
  {
    id: "color-en-funcion",
    titulo: "Color escrito con rgb, hsl u oklch",
    familia: "color",
    patron: /(?<![\w-])(?:rgba?|hsla?|oklch|oklab|lch|color)\(\s*[\d.]/g,
    arreglo: [
      "Escribir el color en decimal es la puerta de atras del color a mano: rgb(55,202,55) es",
      "el verde viejo. Y como el tema entero esta escrito en oklch, poner un oklch a mano ni",
      "siquiera llama la atencion al leerlo.",
      "",
      "  color de marca .....  bg-primary / text-primary",
      "  superficie .........  bg-card / bg-muted",
      "  transparencia ......  bg-primary/10, border-border/60 (con barra, SOBRE el token)",
      "",
      "Los unicos oklch legales del proyecto viven en src/app/globals.css.",
    ],
  },
  {
    id: "color-con-nombre",
    titulo: "Color puesto por su nombre en ingles",
    familia: "color",
    patron:
      /(?:color|background|background-color|fill|stroke|border-color|borderColor|backgroundColor)\s*:\s*['"]?(?:white|black|gray|grey|silver|red|blue|green|orange|purple|yellow|pink|cyan)\b/gi,
    arreglo: [
      "  color: 'white' ......  text-foreground   (text-primary-foreground si va sobre verde)",
      "  background: 'black' .  bg-background",
      "  color: 'red' ........  text-destructive",
      "",
      "En un correo, donde no hay clases, se escribe el hexadecimal de la paleta oficial.",
    ],
  },
  {
    id: "fuente-mono",
    titulo: "La fuente de maquina de escribir",
    familia: "letra",
    patron: /(?<![\w-])font-mono(?![\w-])|\bJetBrains[_ ]?Mono\b|--font-mono\b/g,
    arreglo: [
      "El brandkit tiene UNA sola familia: Inter Tight. La mono es la firma mas repetida del",
      "diseno antiguo, y casi siempre viene pegada a mayusculas separadas y a letra de 10px.",
      "",
      "Se quita la clase y no se pone nada: Inter Tight ya es la fuente por defecto.",
      "  para alinear cifras en columna ..  tabular-nums  (mismo ancho de digito)",
      "  para que la etiqueta destaque ...  font-semibold",
      "  font-mono text-[10px] uppercase tracking-wider  ->  text-sm font-semibold",
    ],
  },
  {
    id: "mayusculas-separadas",
    titulo: "Mayusculas con las letras separadas",
    familia: "letra",
    /* Se ancla en `uppercase` y se busca el tracking en las lineas de alrededor, porque
     * medio OS escribe las clases con cn("...", "...") repartido en varias lineas, y una
     * regla que mire solo dentro de la misma linea se esquiva sin querer. */
    patron: /(?<![\w-])uppercase(?![\w-])/g,
    ventana: 5,
    filtro: (m, ctx) => /tracking-(?:wider|widest|\[(?!-))/.test(ctx.ventana),
    texto: () => "uppercase + tracking ancho",
    arreglo: [
      "Cuestan leer, y ocupan mucho mas ancho que el mismo texto normal: en el telefono son",
      "justo las etiquetas que se salen del borde o se parten mal.",
      "",
      "El tracking ancho es EXCLUSIVO del wordmark CAPITAL HUB. En todo lo demas:",
      "  uppercase tracking-widest text-[10px]  ->  text-sm font-semibold",
      "",
      "El tracking NEGATIVO (tracking-tight, tracking-[-0.02em]) APRIETA las letras y si se",
      "usa: es el idioma natural de Inter Tight en titulares. Esta regla no lo toca.",
    ],
  },
  {
    id: "texto-por-debajo-del-minimo",
    titulo: "Texto por debajo del minimo legible",
    familia: "letra",
    patron: new RegExp(BORDE + PREFIJOS + "text-(xs|\\[[0-9.]+(?:px|rem|em|pt)\\])(?![\\w-])", "g"),
    filtro: (m) => {
      if (esDeEscritorio(m[1])) return false // en el monitor sobra sitio: eso no rompe el telefono
      const valor = m[2]
      if (valor === "xs") return true // 12px
      const n = parseFloat(valor.slice(1))
      if (valor.endsWith("px]")) return n < 14
      if (valor.endsWith("pt]")) return n < 11
      return n < 0.875 // rem y em
    },
    arreglo: [
      "El brandkit pide cuerpo de 15 a 16 puntos, y el minimo legible en telefono es 14.",
      "Ademas el zoom con los dedos esta DESACTIVADO en la app (userScalable: false, en",
      "src/app/layout.tsx), asi que quien no lo lea no tiene NINGUNA forma de agrandarlo.",
      "",
      "  text-xs / text-[10px] / text-[11px] / text-[0.8rem]  ->  text-sm    (14px)",
      "  cuerpo de lectura ..................................  ->  text-base  (16px)",
      "",
      "En el monitor si se permite bajar: `text-sm md:text-[13px]` pasa, porque el prefijo md:",
      "no llega al telefono.",
    ],
  },
  {
    id: "color-prohibido",
    titulo: "Familia de color que no es de la marca",
    familia: "color",
    patron:
      /(?<![\w-])(?:bg|text|border|from|to|via|ring|fill|stroke|shadow|decoration|outline|divide|caret|accent|placeholder)-(?:violet|cyan|orange|blue|purple|pink|indigo|rose|teal|lime|fuchsia|sky|emerald|yellow|amber|green|red|gray|grey|zinc|slate|neutral|stone)-\d{2,3}(?![\w-])/g,
    arreglo: [
      "La marca es carbon y verde. Cualquier otra familia es diseno viejo, y los grises y los",
      "verdes de Tailwind tambien: pintan un verde y un gris DISTINTOS a los de la marca en la",
      "misma pantalla.",
      "",
      "  verde / activo / bueno ..  text-primary  bg-primary/10  border-primary/30",
      "  gris de texto ...........  text-muted-foreground",
      "  gris de superficie ......  bg-muted / bg-secondary",
      "  gris de borde ...........  border-border",
      "  error ...................  text-destructive  bg-destructive/10",
      "  aviso ...................  hoy NO hay token de aviso. Se anade a globals.css",
      "                             --color-warn: #E5B567 y se usa text-warn; el candado lo",
      "                             acepta solo en cuanto el token existe.",
    ],
  },
  {
    id: "degradado-de-color",
    titulo: "Degradado",
    familia: "color",
    patron:
      /(?<![\w-])bg-(?:gradient|linear|radial|conic)-to-|linear-gradient\(|radial-gradient\(|conic-gradient\(/g,
    arreglo: [
      "El brandkit prohibe los degradados de color de forma expresa. Un degradado verde con",
      "texto negro encima es la firma exacta del diseno anterior.",
      "",
      "  bg-gradient-to-br from-green-500 to-green-600  ->  bg-primary (plano)",
    ],
  },
  {
    id: "sparkles",
    titulo: "El icono Sparkles",
    familia: "letra",
    patron: /\bSparkles\b/g,
    arreglo: [
      "Prohibido en TODO el producto, no solo en formacion. Un icono tiene que significar algo",
      "real.",
      "",
      "  generar con IA .......  Wand2, Zap o Bot",
      "  destacado / favorito .  Star",
      "  novedad ..............  un punto verde, o ningun icono",
    ],
  },
  {
    id: "esquina-recta",
    titulo: "Esquina recta",
    familia: "estructura",
    patron: /(?<![\w-])rounded-none(?![\w-])/g,
    arreglo: [
      'Marco, 29-jul-2026: "todo lo que sea esquinas puntiagudas y todo ese vibe antiguo, fuera".',
      "",
      "  tarjeta, boton, campo ....  rounded-lg  (4px)",
      "  panel grande, modal ......  rounded-xl  (6px)",
      "  avatar ...................  rounded-full",
    ],
  },
  {
    id: "esquina-hinchada",
    titulo: "Esquina demasiado redondeada",
    familia: "estructura",
    patron: /(?<![\w-])rounded-(?:[23]xl|\[(?:1[2-9]|[2-9]\d)px\])(?![\w-])/g,
    arreglo: [
      "rounded-2xl no esta redefinido en el tema: se queda en los 16 puntos de fabrica, cuando",
      "el brandkit pide 4 para tarjeta y 6 para panel. Se ve como un bulto.",
      "",
      "  rounded-2xl / rounded-3xl  ->  rounded-xl  (6px: paneles, modales y hojas)",
    ],
  },
  {
    id: "acento-blanco",
    titulo: "Blanco solido (el acento del diseno antiguo)",
    familia: "color",
    patron:
      /(?<![\w-])bg-white(?![\w/-])|(?<![\w-])bg-\[#(?:fff|ffffff)\](?![\w-])|(?:background(?:-color)?|backgroundColor)\s*:\s*['"]?#(?:fff|ffffff)\b/gi,
    arreglo: [
      "El boton blanco con texto oscuro era el acento del brandkit anterior. Hoy la accion",
      "principal es VERDE con tinta oscura encima.",
      "",
      "  bg-white text-[#0F0F12]  ->  bg-primary text-primary-foreground",
      "  bg-[#FFFFFF]             ->  bg-primary  (o bg-card si era una superficie)",
      "",
      "Texto blanco sobre el verde da 2.11 de contraste y falla; la tinta #08130C da 8.31. Por",
      "eso nunca text-white encima del verde: siempre text-primary-foreground.",
      "",
      "El blanco con transparencia (bg-white/10) sigue permitido: es un velo, no un acento.",
    ],
  },
  {
    id: "token-diluido",
    titulo: "Token de texto rebajado",
    familia: "color",
    patron:
      /(?<![\w-])text-(?:foreground|muted-foreground|card-foreground|popover-foreground|primary-foreground)\/\d{1,3}(?![\w-])/g,
    arreglo: [
      "El texto secundario ya esta calibrado para leerse sobre el fondo carbon. Rebajarlo al 40",
      "o al 60 por ciento lo deja por debajo del minimo de contraste, y en un telefono a plena",
      "luz desaparece. Es la causa de que un estado vacio parezca una pantalla rota.",
      "",
      "  text-muted-foreground/40  ->  text-muted-foreground   (el token entero)",
      "",
      "Knowledge: docs/sops/producto/47-reglas-ui-contraste-legibilidad.md",
    ],
  },
  {
    id: "fuente-de-sistema",
    titulo: "Fuente del sistema operativo",
    familia: "letra",
    patron: /-apple-system|BlinkMacSystemFont|SF Pro|Segoe UI|Helvetica Neue|Helvetica,/g,
    arreglo: [
      "La app entera va en Inter Tight. Estas listas arrancan por la fuente de Apple o de",
      "Windows, asi que en un Mac nunca se llega a Inter Tight.",
      "",
      "  en la app ......  se quita la lista: font-sans ya es Inter Tight",
      '  en un correo ...  "Inter Tight", Inter, Arial, sans-serif   (Inter Tight primero)',
    ],
  },
  {
    id: "rejilla-sin-movil",
    titulo: "Rejilla de columnas sin version de telefono",
    familia: "estructura",
    patron: new RegExp(BORDE + PREFIJOS + "grid-cols-(\\d+|\\[[^\\]]*\\])(?![\\w-])", "g"),
    filtro: (m, ctx) => {
      if (esDeEscritorio(m[1])) return false
      if (m[2].startsWith("[")) return true // columnas medidas: nunca caben en 375
      // Si en la MISMA linea hay una version de monitor de la rejilla, el autor ya penso
      // el tamano: `grid-cols-4 sm:grid-cols-6` es justo lo que pide la ley. No se marca.
      if (/(?:sm|md|lg|xl|2xl):grid-cols-/.test(ctx.linea)) return false
      return Number(m[2]) >= 3
    },
    arreglo: [
      "Sin prefijo de tamano, el telefono hereda las mismas columnas que el monitor. Doce",
      "columnas en 375 puntos salen a 31 puntos cada una: ahi no cabe ni una palabra. Y como el",
      "marco del OS recorta lo que se sale, lo de la derecha no se pierde de vista: DESAPARECE,",
      "sin aviso y sin forma de arrastrarlo.",
      "",
      "  grid-cols-4   ->  grid-cols-1 md:grid-cols-4    (o grid-cols-2 md:grid-cols-4)",
      "  grid-cols-12  ->  grid-cols-1 md:grid-cols-12",
      "  grid-cols-[1fr_120px_100px]  ->  en el telefono, tarjetas apiladas; la rejilla solo a",
      "                                   partir de md:",
      "",
      "grid-cols-2 a secas SI se permite: dos columnas caben en un telefono, y es la forma",
      "correcta de empezar una fila de numeros.",
    ],
  },
  {
    id: "medida-clavada",
    titulo: "Ancho clavado en pixeles",
    familia: "estructura",
    patron: new RegExp(BORDE + PREFIJOS + "(min-w|w)-\\[([0-9.]+)(px|rem)\\]", "g"),
    filtro: (m) => {
      if (esDeEscritorio(m[1])) return false
      const px = m[4] === "rem" ? parseFloat(m[3]) * 16 : parseFloat(m[3])
      return m[2] === "min-w" ? px >= 160 : px >= 200
    },
    arreglo: [
      "Un ancho de 280 puntos ya no deja sitio a nada al lado en un telefono de 375, y uno de",
      "420 ni siquiera cabe. El marco del OS lo recorta sin dejar arrastrarlo.",
      "",
      "  w-[420px]      ->  w-full md:w-[420px]      (o max-w-[420px], que si encoge)",
      "  min-w-[280px]  ->  min-w-0 md:min-w-[280px]",
      "  w-[26rem]      ->  w-full md:w-[26rem]",
      "",
      "max-w-[...] no cuenta: un ancho MAXIMO si encoge cuando no cabe.",
    ],
  },
  {
    id: "alto-atado-a-la-ventana",
    titulo: "Alto atado a la ventana (vh)",
    familia: "estructura",
    patron: /100vh|(?<![\w:-])h-screen(?![\w-])|(?<![\w:-])min-h-screen(?![\w-])/g,
    arreglo: [
      "En el iPhone la barra del navegador aparece y desaparece, y 100vh se calcula siempre con",
      "la barra escondida: el ultimo boton queda debajo de ella y no se puede tocar.",
      "",
      "  h-screen      ->  h-dvh",
      "  min-h-screen  ->  min-h-dvh",
      "  h-[calc(100vh-220px)]  ->  h-[calc(100dvh-220px)]",
    ],
  },
  {
    id: "alto-fijo-con-zona-segura",
    titulo: "Alto fijo y zona segura en el mismo elemento",
    familia: "estructura",
    patron: new RegExp(BORDE + "(?:h|min-h)-(?:\\d+|\\[[^\\]]*\\])(?![\\w-])", "g"),
    ventana: 0,
    filtro: (m, ctx) =>
      /(?<![\w-])p[tby]-safe(?:-\d)?(?![\w-])/.test(ctx.linea) && /(?<![\w-])h-\d/.test(ctx.linea),
    texto: () => "alto fijo + zona segura",
    arreglo: [
      "El relleno de la zona segura va POR DENTRO de la altura. Si la barra mide h-14 (56",
      "puntos) y ademas lleva pt-safe, en un iPhone con notch (donde la franja de arriba mide",
      "entre 47 y 59) al titulo le quedan 9 puntos o menos: se desborda por debajo de la linea",
      "del encabezado y pisa el contenido de la pagina.",
      "",
      "  h-14 pt-safe  ->  h-[calc(3.5rem+env(safe-area-inset-top))] pt-safe",
      "  o bien        ->  min-h-14 pt-safe    (el alto crece con la franja)",
      "",
      "OJO: esto NO se ve en el navegador de escritorio ni en check:movil, porque ahi la franja",
      "del notch vale cero. Se comprueba en el simulador de iPhone o en el telefono de verdad.",
    ],
  },
  {
    id: "modal-a-mano",
    titulo: "Ventana emergente hecha a mano",
    familia: "estructura",
    patron: /fixed inset-0/g,
    ventana: 3,
    // Si el archivo la pinta con un portal al body (a mano con createPortal, o usando un
    // primitivo de Radix que ya portalea), el peligro que persigue esta regla desaparece:
    // ningun padre con desenfoque puede atraparla. No se marca.
    filtro: (m, ctx) =>
      /items-center|justify-center|place-items-center/.test(ctx.ventana) &&
      !/createPortal|Portal\b/.test(ctx.archivo ?? ""),
    arreglo: [
      "Una ventana centrada en un telefono la tapa el teclado al escribir, y si el contenido es",
      "largo no se llega al boton de guardar.",
      "",
      "En movil se usa la hoja inferior del kit:",
      '  <Sheet><SheetContent side="bottom"> ... </SheetContent></Sheet>',
      "",
      "El lado NO se decide con JavaScript: useIsMobile() devuelve false hasta que monta, asi",
      'que side={esMovil ? "bottom" : "right"} pinta primero un cajon lateral y luego salta',
      'abajo. Se deja side="bottom" fijo y el escritorio se ajusta con clases md:.',
    ],
  },
  {
    id: "accion-solo-con-raton",
    titulo: "Accion que solo aparece al pasar el raton",
    familia: "estructura",
    patron: new RegExp(
      BORDE + PREFIJOS + "group-hover:(?:opacity-100|visible|flex|block|inline-flex)(?![\\w-])",
      "g"
    ),
    filtro: (m) => !esDeEscritorio(m[1]),
    arreglo: [
      "En un telefono no hay raton, asi que esa accion NO EXISTE: no se puede borrar la tarea ni",
      "editar la etiqueta. No es que se vea mal, es funcionalidad perdida.",
      "",
      "  opacity-0 group-hover:opacity-100",
      "  ->  opacity-100 md:opacity-0 md:group-hover:opacity-100",
      "",
      "Mejor todavia: en el telefono las acciones de una ficha viven dentro de su detalle o en",
      "una hoja inferior, no como iconos diminutos encima de la tarjeta.",
    ],
  },
  {
    id: "control-pequeno",
    titulo: "Control por debajo de lo que acierta un dedo",
    familia: "estructura",
    patron: new RegExp(BORDE + PREFIJOS + "(?:h|size)-(?:[6-9]|10)(?![\\w-.])", "g"),
    ventana: 2,
    filtro: (m, ctx) => {
      if (esDeEscritorio(m[1])) return false
      if (ICONO.test(ctx.linea)) return false // el icono DENTRO de un boton de 44 va pequeno
      return CONTROL.test(ctx.ventana)
    },
    arreglo: [
      "Lo minimo que un dedo acierta son 44 puntos. h-8 son 32 y h-6 son 24.",
      "",
      "  h-8     ->  h-11 md:h-8        (44 en el telefono, 32 en el monitor)",
      "  size-8  ->  size-11 md:size-8",
      "",
      "El arreglo de RAIZ son TRES archivos, y corrige cientos de sitios de golpe:",
      "  src/components/ui/button.tsx    (sus ocho medidas van de 24 a 36)",
      "  src/components/ui/input.tsx     (32)",
      "  src/components/ui/textarea.tsx  (letra de 14, que ademas dispara el zoom del iPhone)",
    ],
  },
  {
    id: "campo-con-letra-chica",
    titulo: "Campo de escritura con letra por debajo de 16",
    familia: "estructura",
    patron: new RegExp(BORDE + PREFIJOS + "text-(?:xs|sm)(?![\\w-])", "g"),
    ventana: 2,
    filtro: (m, ctx) => !esDeEscritorio(m[1]) && /^(?:input|Input|textarea|Textarea)$/.test(ctx.duena),
    arreglo: [
      "Por debajo de 16 puntos, el iPhone se acerca solo al tocar el campo, y despues la",
      "pantalla se queda torcida.",
      "",
      "  text-sm  ->  text-base md:text-sm",
      "",
      "globals.css ya fuerza 16 puntos en input, textarea y select por debajo de 768, PERO esa",
      "regla vive en la capa base y cualquier clase de Tailwind la pisa. Escribir text-sm en un",
      "campo vuelve a encender el zoom.",
    ],
  },
  {
    id: "lista-sin-paginar",
    titulo: "Lista pintada entera, sin limite de 20",
    familia: "estructura",
    // Un .map( sobre algo que se llama como una lista de datos, dentro de una pantalla del
    // OS, y sin que el archivo pagine por ningun lado. No mira listas de opciones fijas
    // (pestanas, colores, presets) porque esas no crecen.
    archivo: (codigo, rel) => {
      if (!/\.(?:tsx|jsx)$/.test(rel)) return []
      const dentro = rel.startsWith("src/app/(main)/") || rel.startsWith("src/features/")
      if (!dentro) return []
      // Si ya pagina de alguna forma, no se mira mas.
      if (/ListaPaginada|POR_PAGINA|PAGE_SIZE|paginaSegura|totalPaginas|\.range\(/.test(codigo)) return []
      const lineas = codigo.split("\n")
      const salida = []
      for (let i = 0; i < lineas.length; i++) {
        const l = lineas[i]
        // datos que vienen del sistema y por tanto crecen sin techo
        const m = l.match(/\b(contactos|contacts|items|filas|rows|registros|resultados|leads|tareas|tasks|invitaciones|invites|videos|mensajes|eventos|pedidos|ventas|alumnos|usuarios|miembros)\b\s*(?:\?\.)?\.map\s*\(/)
        if (!m) continue
        // ya viene recortado a un pocos: es el patron "los ultimos N + ver todo"
        if (/\.slice\(\s*0\s*,\s*(?:[1-9]|1\d|20)\s*\)/.test(l)) continue
        salida.push({ linea: i + 1, texto: m[0].trim() })
      }
      return salida.slice(0, 4)
    },
    arreglo: [
      "Ninguna lista del OS se pinta entera. Maximo 20 por pagina, SIEMPRE.",
      "",
      "Marco, 2026-08-07: \"siempre, siempre que vayas a hacer una lista, tiene que haber",
      "maximo 20\". Da igual que hoy tenga 8 elementos: manana tendra 800.",
      "",
      "  import { ListaPaginada } from \"@/components/ui/lista-paginada\"",
      "",
      "  <ListaPaginada items={contactos} claveDeFiltros={firmaDeFiltros}>",
      "    {(pagina) => pagina.map((c) => <Ficha key={c.id} contacto={c} />)}",
      "  </ListaPaginada>",
      "",
      "Ya trae el volver arriba al cambiar de pagina, el caerse a la ultima si un filtro",
      "deja menos, y el \"Viendo 21 a 40 de 132\".",
      "",
      "Si la lista vive DENTRO de un panel: se ensenan los ultimos 10 con .slice(0, 10) y un",
      "boton que abre una ventana, y esa ventana si va de 20 en 20 con <ListaPaginada>.",
      "",
      "Como se construye una pantalla: .claude/skills/os-movil-primero/SKILL.md, seccion 2 bis.",
    ],
  },
  {
    id: "pantalla-solo-para-monitor",
    titulo: "Archivo de pantalla sin una sola instruccion de telefono",
    familia: "estructura",
    archivo: (codigo, rel) => {
      if (!/\.(?:tsx|jsx)$/.test(rel)) return []
      const dentro =
        rel.startsWith("src/app/(main)/") ||
        rel.startsWith("src/features/") ||
        rel.startsWith("src/components/ui/")
      if (!dentro) return []
      if (!/className/.test(codigo)) return []
      if (codigo.split("\n").filter((l) => l.trim().length > 0).length < 40) return []
      if (/(?<![\w-])(?:sm|md|lg|xl|2xl):/.test(codigo)) return []
      if (/useIsMobile|matchMedia/.test(codigo)) return []
      return [{ linea: 1, texto: "archivo sin instrucciones de telefono" }]
    },
    arreglo: [
      "Este archivo se dibuja IGUAL en un telefono de 375 puntos que en un monitor de 1920. Esa",
      "es la causa madre de que no encaje nada, y todo lo demas es sintoma.",
      "",
      "No se parchea: se REHACE mobile-first. Se escriben las clases sin prefijo pensando en el",
      "telefono, y se anade md: para lo que cambia en el monitor (768 es el unico corte del",
      "proyecto). Una tabla no se hace pequena: se convierte en lista de tarjetas.",
      "",
      "Las recetas estan en .claude/skills/os-movil-primero/SKILL.md",
    ],
  },
  {
    id: "archivo-sin-tipos",
    titulo: "Archivo .js o .jsx dentro del codigo de la app",
    familia: "letra",
    archivo: (codigo, rel) =>
      /^src\/(?:app|features|components|lib|hooks)\/.+\.(?:js|jsx)$/.test(rel)
        ? [{ linea: 1, texto: "archivo .js/.jsx" }]
        : [],
    arreglo: [
      "Aqui todo es TypeScript. Un .js o un .jsx nuevo solo puede ser una de dos cosas: un",
      "descuido, o alguien esquivando la revision cambiandole la extension al archivo.",
      "",
      "Se renombra a .ts o .tsx y se arreglan los tipos que salgan.",
    ],
  },
]

/* ------------------------------------------------------------------------- *
 * EL OLFATO: una pista BARATA por regla
 *
 * Sin esto, las 24 reglas se pasaban linea por linea sobre los 650 archivos aunque el 99
 * por ciento no tuviera ni una senal, y varias usan mirada atras, que en V8 es lenta:
 * 17 segundos en frio, delante de cada arranque del servidor. Un agente reinicia el
 * servidor decenas de veces al dia, y esa espera en seco es lo primero que alguien
 * comenta "un momento" en package.json. Y ese momento no se acaba nunca.
 *
 * Cada pista es una busqueda tonta, sin mirada atras. Se pregunta una vez por archivo (y
 * luego una vez por linea) y solo entonces se pasa la regla de verdad.
 * ------------------------------------------------------------------------- */
const OLORES = {
  "clase-que-no-existe": new RegExp(
    "(?:" + SOSPECHOSAS_COLOR.concat(SOSPECHOSAS_FORMA.flatMap(([, s]) => s)).join("|") + ")"
  ),
  "color-a-mano": /#[0-9a-fA-F]{3}/,
  "verde-viejo": /37ca37|55\s*,\s*202/i,
  "color-en-funcion": /rgb|hsl|oklch|oklab|lch\(|color\(/,
  "color-con-nombre": /(?:color|background|fill|stroke|Color)\s*:/,
  "fuente-mono": /mono|JetBrains/,
  "mayusculas-separadas": /uppercase/,
  "texto-por-debajo-del-minimo": /text-xs|text-\[/,
  "color-prohibido":
    /(?:violet|cyan|orange|blue|purple|pink|indigo|rose|teal|lime|fuchsia|sky|emerald|yellow|amber|green|red|gray|grey|zinc|slate|neutral|stone)-\d/,
  "degradado-de-color": /gradient/,
  sparkles: /Sparkles/,
  "esquina-recta": /rounded-none/,
  "esquina-hinchada": /rounded-2xl|rounded-3xl|rounded-\[/,
  "acento-blanco": /white|#fff/i,
  "token-diluido": /foreground\//,
  "fuente-de-sistema": /apple-system|BlinkMac|SF Pro|Segoe|Helvetica/,
  "rejilla-sin-movil": /grid-cols-/,
  "medida-clavada": /w-\[/,
  "alto-atado-a-la-ventana": /100vh|h-screen/,
  "alto-fijo-con-zona-segura": /-safe/,
  "modal-a-mano": /fixed inset-0/,
  "accion-solo-con-raton": /group-hover:/,
  "control-pequeno": /(?:h|size)-(?:[6-9]|10)/,
  "campo-con-letra-chica": /text-xs|text-sm/,
}
for (const r of REGLAS) r.olor = OLORES[r.id] || null

/* ------------------------------------------------------------------------- *
 * Limpieza del codigo antes de buscar
 *
 * Se borran los COMENTARIOS (una nota que diga "quitar el font-mono de aqui" no es una
 * infraccion) pero se conserva TODO lo que hay dentro de las cadenas, que es donde viven
 * las clases. Se recorre caracter a caracter respetando comillas simples, dobles y
 * plantillas: con una expresion regular, un texto tan tonto como "50//50" apagaba el resto
 * de la linea para el candado, y eso vale como escondite.
 * ------------------------------------------------------------------------- */
const NO_SALTO = /[^\n]/g
/** Deja el trozo en blanco pero conserva los saltos de linea, para que el numero de
 *  linea que se imprime luego sea el de verdad. */
const enBlanco = (t) => t.replace(NO_SALTO, " ")

function limpiar(src) {
  const n = src.length
  const partes = []
  /* Se salta de un caracter interesante al siguiente en vez de mirar uno a uno: sobre
   * 650 archivos, la diferencia es de segundos en cada arranque del servidor. */
  const INTERESANTE = /\/\/|\/\*|['"`]/g
  let i = 0
  while (i < n) {
    INTERESANTE.lastIndex = i
    const m = INTERESANTE.exec(src)
    if (!m) {
      partes.push(src.slice(i))
      break
    }
    const j = m.index
    const marca = m[0]

    // Los dos puntos delante protegen las direcciones web (https://...)
    if (marca === "//" && src[j - 1] === ":") {
      partes.push(src.slice(i, j + 2))
      i = j + 2
      continue
    }
    partes.push(src.slice(i, j))

    if (marca === "//") {
      let fin = src.indexOf("\n", j)
      if (fin === -1) fin = n
      partes.push(enBlanco(src.slice(j, fin)))
      i = fin
      continue
    }
    if (marca === "/*") {
      let fin = src.indexOf("*/", j + 2)
      fin = fin === -1 ? n : fin + 2
      partes.push(enBlanco(src.slice(j, fin)))
      i = fin
      continue
    }

    /* Cadena: NO se borra nada de dentro (ahi viven las clases). Solo se busca su cierre,
     * para que un texto tan tonto como "50//50" no apague el resto de la linea. */
    const cierre = new RegExp("\\\\.|" + (marca === "`" ? "[`]" : marca === '"' ? '["\\n]' : "['\\n]"), "g")
    cierre.lastIndex = j + 1
    const c = cierre.exec(src)
    const fin = c ? (c[0][0] === "\\" ? -1 : c.index + 1) : n
    if (fin === -1) {
      // escape dentro de la cadena: se sigue buscando desde despues del escape
      let k = c.index + 2
      let cerrado = n
      while (k < n) {
        const ch = src[k]
        if (ch === "\\") {
          k += 2
          continue
        }
        if (ch === marca) {
          cerrado = k + 1
          break
        }
        if (ch === "\n" && marca !== "`") {
          cerrado = k
          break
        }
        k++
      }
      partes.push(src.slice(j, cerrado))
      i = cerrado
      continue
    }
    partes.push(src.slice(j, fin))
    i = fin
  }
  return partes.join("")
}

function reglaAplica(regla, rel, ctx) {
  if (regla.familia === "color") {
    if (rel === "src/app/globals.css") return false // es la paleta, no una copia de ella
    if (ctx.datoDeProducto) return false // colores que elige el usuario, no diseno
  }
  if (regla.familia === "estructura") {
    if (ctx.sinTokens) return false // un correo se maqueta con tablas; un video es un lienzo fijo
    if (rel.endsWith(".css") || rel.endsWith(".scss")) return false
  }
  return true
}

/** Todas las senales de diseno viejo de un archivo, con su linea y su texto exacto. */
function senalesDe(codigoCrudo, rel) {
  const ctxArchivo = {
    sinTokens: esZonaSinTokens(rel),
    datoDeProducto: esDatoDeProducto(rel),
  }
  const codigo = limpiar(codigoCrudo)
  const lineas = codigo.split("\n")
  const encontradas = []

  for (const regla of REGLAS) {
    if (!reglaAplica(regla, rel, ctxArchivo)) continue

    if (regla.archivo) {
      for (const s of regla.archivo(codigo, rel)) {
        encontradas.push({ regla: regla.id, linea: s.linea, texto: s.texto })
      }
      continue
    }
    if (!regla.patron) continue
    if (regla.olor && !regla.olor.test(codigo)) continue // ni huele: esta regla no toca este archivo

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i]
      if (regla.olor && !regla.olor.test(linea)) continue
      regla.patron.lastIndex = 0
      let m
      while ((m = regla.patron.exec(linea)) !== null) {
        if (m[0] === "") {
          regla.patron.lastIndex++
          continue
        }
        const ctx = {
          sinTokens: ctxArchivo.sinTokens,
          datoDeProducto: ctxArchivo.datoDeProducto,
          // El archivo entero, para reglas que necesitan saber algo del conjunto
          // (por ejemplo, si la ventana se pinta con un portal al body).
          archivo: codigo,
          linea,
          ventana: regla.ventana === undefined ? linea : ventanaDe(lineas, i, regla.ventana),
          // A que etiqueta pertenece de verdad esta clase. Se busca hacia atras
          // la ultima etiqueta ABIERTA antes del match. Sin esto, la etiqueta
          // "Desde" que va justo encima de un campo se confundia con el campo.
          duena: etiquetaDuena(lineas, i, m.index),
        }
        if (regla.filtro && !regla.filtro(m, ctx)) continue
        encontradas.push({
          regla: regla.id,
          linea: i + 1,
          texto: regla.texto ? regla.texto(m) : m[0].trim(),
        })
      }
    }
  }
  encontradas.sort((a, b) => a.linea - b.linea)
  return encontradas
}

/* ------------------------------------------------------------------------- *
 * Recorrido, memoria y deuda
 * ------------------------------------------------------------------------- */

function walk(dir, out = []) {
  let entries
  try {
    entries = readdirSync(dir, { withFileTypes: true })
  } catch {
    return out
  }
  for (const e of entries) {
    const p = join(dir, e.name)
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".next" || e.name === ".git") continue
      walk(p, out)
    } else if (EXTENSIONES.some((ext) => e.name.endsWith(ext))) {
      out.push(p)
    }
  }
  return out
}

/** La memoria caduca sola cuando cambian las reglas. */
const VERSION_REGLAS = (() => {
  let s = ""
  for (const r of REGLAS) {
    s += r.id + "|" + (r.patron ? r.patron.source : "archivo") + "|" + (r.ventana ?? "") + "|"
  }
  let h = 0
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0
  return String(h)
})()

function leerCache() {
  try {
    const c = JSON.parse(readFileSync(RUTA_CACHE, "utf8"))
    if (c.version === VERSION_REGLAS) return c
  } catch {
    /* sin memoria: se analiza todo */
  }
  return { version: VERSION_REGLAS, archivos: {} }
}

function guardarCache(cache) {
  try {
    mkdirSync(dirname(RUTA_CACHE), { recursive: true })
    writeFileSync(RUTA_CACHE, JSON.stringify(cache))
  } catch {
    /* la memoria es un lujo, no una necesidad */
  }
}

function leerDeuda() {
  try {
    const d = JSON.parse(readFileSync(RUTA_DEUDA, "utf8"))
    if (d && typeof d.archivos === "object") return d
  } catch {
    /* todavia no hay lista */
  }
  return null
}

/** Huella de un archivo: por regla, cuantas veces aparece cada texto EXACTO. */
function huellaDe(senales) {
  const h = {}
  for (const s of senales) {
    if (!h[s.regla]) h[s.regla] = {}
    h[s.regla][s.texto] = (h[s.regla][s.texto] || 0) + 1
  }
  return h
}

function totalDeHuella(h) {
  let t = 0
  for (const regla of Object.values(h || {})) for (const n of Object.values(regla)) t += n
  return t
}

function escribirDeuda(archivos) {
  let total = 0
  for (const h of Object.values(archivos)) total += totalDeHuella(h)
  const contenido = {
    _lee_esto: [
      "Esta es la DEUDA de diseno del OS: lo que ya estaba escrito con el brandkit viejo el dia",
      "que se encendio el candado. Es la lista de la compra del rediseno, y se vacia sola.",
      "",
      "No es un numero: es la huella exacta (que regla, que texto, cuantas veces). Por eso no se",
      "puede cambiar diseno viejo por diseno viejo distinto sin que salte.",
      "",
      "NO se edita a mano. Cuando un archivo mejora, el candado lo aprieta solo. Si partes o",
      "renombras un archivo:  npm run check:brandkit -- --rebase",
    ],
    generado: new Date().toISOString().slice(0, 10),
    total,
    archivos: Object.fromEntries(Object.keys(archivos).sort().map((k) => [k, archivos[k]])),
  }
  writeFileSync(RUTA_DEUDA, JSON.stringify(contenido, null, 2) + "\n")
  return total
}

/* ------------------------------------------------------------------------- *
 * Que archivos se miran
 * ------------------------------------------------------------------------- */

function archivosDeLaEntrega() {
  try {
    const salida = execFileSync("git", ["diff", "--cached", "--name-only", "--diff-filter=ACMR"], {
      cwd: ROOT,
      encoding: "utf8",
    })
    return salida
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean)
      .filter((rel) => rel.startsWith("src/") && EXTENSIONES.some((ext) => rel.endsWith(ext)))
      .filter((rel) => existsSync(join(ROOT, rel)))
  } catch {
    return []
  }
}

function todosLosArchivos() {
  const out = []
  for (const base of SCAN) out.push(...walk(join(ROOT, base)))
  return out.map((p) => relative(ROOT, p).split("\\").join("/"))
}

/* ------------------------------------------------------------------------- *
 * Programa
 * ------------------------------------------------------------------------- */

const cache = leerCache()

function analizar(rel) {
  const abs = join(ROOT, rel)
  let st
  try {
    st = statSync(abs)
  } catch {
    return null
  }
  const guardado = cache.archivos[rel]
  if (guardado && guardado.mtimeMs === st.mtimeMs && guardado.size === st.size) {
    return guardado.senales
  }
  const senales = senalesDe(readFileSync(abs, "utf8"), rel)
  cache.archivos[rel] = { mtimeMs: st.mtimeMs, size: st.size, senales }
  return senales
}

function medirTodo() {
  const archivos = {}
  for (const rel of todosLosArchivos()) {
    if (EXENTOS_TOTAL.has(rel)) continue
    const senales = analizar(rel)
    if (senales && senales.length) archivos[rel] = huellaDe(senales)
  }
  return archivos
}

const deudaPrevia = leerDeuda()

/* --sembrar-regla <id>: estrena una regla nueva metiendo en el acta lo que ya estaba
 * escrito. Se niega si esa regla YA figuraba en el acta, que es lo que impide usarla para
 * perdonar diseno viejo recien escrito. */
if (REGLA_A_SEMBRAR) {
  if (!deudaPrevia) {
    console.error("\n  No hay acta todavia. Corre `npm run check:brandkit` una vez.\n")
    process.exit(1)
  }
  const yaEstaba = Object.values(deudaPrevia.archivos ?? {}).some(
    (porRegla) => Object.prototype.hasOwnProperty.call(porRegla, REGLA_A_SEMBRAR)
  )
  if (yaEstaba) {
    console.error("\n" + ROJO + `  La regla "${REGLA_A_SEMBRAR}" YA figura en el acta.` + FIN + "\n")
    console.error("    --sembrar-regla solo sirve para ESTRENAR una regla, una vez.")
    console.error("    Lo que salte ahora es diseno viejo recien escrito: hay que quitarlo.\n")
    process.exit(1)
  }

  const archivos = medirTodo()
  guardarCache(cache)
  const nuevo = JSON.parse(JSON.stringify(deudaPrevia.archivos ?? {}))
  let sembradas = 0
  let ficheros = 0
  for (const [rel, porRegla] of Object.entries(archivos)) {
    const hallazgos = porRegla[REGLA_A_SEMBRAR]
    if (!hallazgos) continue
    nuevo[rel] = nuevo[rel] ?? {}
    nuevo[rel][REGLA_A_SEMBRAR] = hallazgos
    ficheros++
    for (const n of Object.values(hallazgos)) sembradas += typeof n === "number" ? n : 1
  }
  escribirDeuda(nuevo)
  console.log(`\n  Regla "${REGLA_A_SEMBRAR}" estrenada.`)
  console.log(`  Metidas en el acta ${sembradas} senales que ya estaban escritas, en ${ficheros} archivos.`)
  console.log("  A partir de ahora, cualquier caso NUEVO de esa regla queda bloqueado.")
  console.log("  Guarda .brandkit-debt.json en el mismo commit.\n")
  process.exit(0)
}

/* --rebase: se vuelve a medir todo y se recoloca la lista. Permitido solo si el total del
 * repositorio NO sube. Asi, partir un archivo en dos (que es justo lo que mandan las
 * recetas de movil) es un comando de un segundo y no un callejon sin salida. */
if (MODO_REBASE) {
  const archivos = medirTodo()
  guardarCache(cache)
  let total = 0
  for (const h of Object.values(archivos)) total += totalDeHuella(h)

  if (deudaPrevia && total > deudaPrevia.total) {
    console.error("\n" + ROJO + "  No se puede recolocar la deuda: el total SUBE." + FIN + "\n")
    console.error(`    estaba en ${deudaPrevia.total} senales, ahora hay ${total}.`)
    console.error(`    Diferencia: ${total - deudaPrevia.total} senales de diseno viejo nuevas.\n`)
    console.error("    --rebase sirve para partir o renombrar archivos sin perder la cuenta, no")
    console.error("    para perdonar diseno viejo. Quitalas y vuelve a intentarlo.\n")
    process.exit(1)
  }
  escribirDeuda(archivos)
  const cola = deudaPrevia ? ` (estaba en ${deudaPrevia.total}).` : "."
  console.log(`\n  Deuda recolocada: ${total} senales en ${Object.keys(archivos).length} archivos${cola}`)
  console.log("  Guarda .brandkit-debt.json en el mismo commit que el cambio.\n")
  process.exit(0)
}

/* Primera vez: no hay lista. Se levanta el acta de lo que ya estaba mal y se pasa. */
if (!deudaPrevia) {
  if (MODO_STAGED) {
    console.log("  Brandkit: aun no hay lista de deuda. Corre `npm run check:brandkit` una vez.")
    process.exit(0)
  }
  const archivos = medirTodo()
  guardarCache(cache)
  const total = escribirDeuda(archivos)
  console.log("\n  Candado de brandkit encendido.")
  console.log(
    `  Acta de lo que ya estaba escrito con el diseno viejo: ${total} senales en ${Object.keys(archivos).length} archivos.`
  )
  console.log("  Queda apuntado en .brandkit-debt.json. A partir de ahora, ninguna senal NUEVA pasa.\n")
  console.log("  Guarda ese archivo en git: sin el, el candado se vuelve a levantar en blanco.\n")
  process.exit(0)
}

const deuda = deudaPrevia.archivos
const relativos = MODO_STAGED ? archivosDeLaEntrega() : todosLosArchivos()
const nuevas = new Map()
const apretados = []
const huellasActuales = {}

for (const rel of relativos) {
  if (EXENTOS_TOTAL.has(rel)) continue
  const senales = analizar(rel)
  if (!senales) continue
  const huella = huellaDe(senales)
  huellasActuales[rel] = huella
  const perdonado = deuda[rel] || {}

  const nuevasDelArchivo = []
  for (const [reglaId, textos] of Object.entries(huella)) {
    for (const [texto, veces] of Object.entries(textos)) {
      const permitidas = (perdonado[reglaId] && perdonado[reglaId][texto]) || 0
      if (veces > permitidas) {
        const todas = senales.filter((s) => s.regla === reglaId && s.texto === texto)
        for (const s of todas.slice(permitidas)) nuevasDelArchivo.push(s)
      }
    }
  }
  if (nuevasDelArchivo.length) {
    nuevas.set(rel, nuevasDelArchivo.sort((a, b) => a.linea - b.linea))
  } else if (totalDeHuella(huella) < totalDeHuella(perdonado)) {
    apretados.push({ rel, ahora: totalDeHuella(huella), antes: totalDeHuella(perdonado) })
  }
}

guardarCache(cache)

/* TRINQUETE AUTOMATICO: si un archivo mejoro, la deuda se aprieta sola.
 * Sin esto, cada archivo limpiado deja huecos libres donde volver a escribir diseno viejo
 * sin que salte nada, y el aviso de "baja el numero a mano" no lo hace nadie. Solo en la
 * pasada completa: en modo entrega se ve un trozo del repo y reescribir borraria la deuda
 * del resto. */
if (!MODO_STAGED && nuevas.size === 0) {
  const archivos = { ...deuda }
  let cambio = false
  for (const [rel, huella] of Object.entries(huellasActuales)) {
    const antes = JSON.stringify(archivos[rel] || {})
    const ahora = JSON.stringify(huella)
    if (antes === ahora) continue
    cambio = true
    if (totalDeHuella(huella) === 0) delete archivos[rel]
    else archivos[rel] = huella
  }
  for (const rel of Object.keys(archivos)) {
    if (!existsSync(join(ROOT, rel))) {
      delete archivos[rel]
      cambio = true
    }
  }
  if (cambio) {
    const total = escribirDeuda(archivos)
    if (apretados.length) {
      console.log(`\n  Queda menos diseno viejo que antes. Deuda apretada sola: ${total} senales.`)
      for (const a of apretados.slice(0, 8)) {
        console.log(`    ${a.rel}: ${a.ahora}   (estaba en ${a.antes})`)
      }
      if (apretados.length > 8) console.log(`    ... y ${apretados.length - 8} archivos mas.`)
      console.log("  Guarda .brandkit-debt.json junto con tu cambio.\n")
    }
  }
}

if (nuevas.size) {
  const totalNuevas = [...nuevas.values()].reduce((s, v) => s + v.length, 0)
  console.error(
    "\n" + ROJO + `  CANDADO DE BRANDKIT: ${totalNuevas} senal(es) de diseno ANTIGUO sin permiso` + FIN + "\n"
  )

  const porId = new Map(REGLAS.map((r) => [r.id, r]))
  const usadas = new Map()
  let mostradas = 0
  const TOPE = 40

  for (const [rel, lista] of nuevas) {
    console.error("    " + rel)
    for (const s of lista) {
      if (mostradas < TOPE) {
        console.error(`      linea ${s.linea}: ${porId.get(s.regla).titulo}  ->  ${s.texto}`)
        mostradas++
      }
      if (!usadas.has(s.regla)) usadas.set(s.regla, porId.get(s.regla))
    }
    console.error("")
  }
  if (totalNuevas > TOPE) {
    console.error(`    ... y ${totalNuevas - TOPE} mas. Se listan todas al arreglar las de arriba.\n`)
  }

  console.error("  CON QUE SE SUSTITUYE\n")
  for (const regla of usadas.values()) {
    console.error("  . " + regla.titulo)
    for (const l of regla.arreglo) console.error(l ? "      " + l : "")
    console.error("")
  }

  console.error(
    GRIS +
      `  Si has PARTIDO o RENOMBRADO un archivo que ya estaba en la lista, esto no es diseno
  nuevo: es el mismo cambiado de sitio. Se recoloca con un comando:

      npm run check:brandkit -- --rebase

  Los tokens del tema estan en src/app/globals.css.
  Como se construye una pantalla: .claude/skills/os-movil-primero/SKILL.md
  Knowledge: docs/sops/marketing/brand/01-brandkit-oficial.md` +
      FIN +
      "\n"
  )
  process.exit(1)
}

console.log("  Brandkit OK: no se ha escrito diseno antiguo nuevo." + (MODO_STAGED ? " (lo que vas a guardar)" : ""))
