#!/usr/bin/env node
/**
 * check:movil . el comprobador de MOVIL, en un navegador de verdad.
 *
 * POR QUE EXISTE
 * Marco, 2026-08-02: "que TODO el saas se adapte al movil porque en el telefono esta TODO
 * roto, no encaja nada. SIEMPRE mobile first y que quede bien encajado todo".
 *
 * El candado estatico (scripts/check-brandkit.mjs) sabe leer el codigo y decir que un
 * archivo no tiene ni una instruccion para telefono. Pero no sabe CUANTO se sale una fila
 * de la pantalla, ni QUE elemento concreto la esta empujando, ni si un boton se puede
 * tocar con el dedo. Eso solo se sabe abriendo la aplicacion y midiendo. Este archivo hace
 * eso: entra al OS, pone la pantalla a 375 puntos de ancho (un iPhone normal), recorre
 * todas las pantallas internas y devuelve numeros.
 *
 * QUE MIDE, EN CADA PANTALLA
 *   1. Desbordamiento: quien se sale del ancho, cuanto se sale, y si se puede recuperar
 *      arrastrando o se pierde recortado.
 *   2. Contenido recortado sin arrastre: cajas que esconden lo que no cabe. Eso no es una
 *      molestia, es informacion que desaparece sin aviso.
 *   3. Zonas tactiles por debajo de 44 puntos (SOP producto/03, punto 5).
 *   4. Texto por debajo de 12 puntos, y campos de escritura por debajo de 16 (por debajo
 *      de 16 el iPhone se acerca solo al enfocar; SOP producto/03, punto 6).
 *   5. Contenido TAPADO por la barra inferior: la ultima fila de la lista o el ultimo
 *      boton, que no se salen de lado ni se recortan, simplemente quedan debajo del menu y
 *      no se pueden tocar.
 *   6. Lo que se repite en casi todas las pantallas, que casi siempre es el marco comun
 *      (cabecera, barra inferior, avisos flotantes): se arregla una vez y cae en todas.
 *
 * ============================================================================
 * LO QUE ESTE COMPROBADOR NO PUEDE VER. NO ES UN DESCUIDO, ES COMO FUNCIONA.
 * ============================================================================
 * Corre Chromium sin cabeza en una ventana de 375 puntos. Ahi:
 *
 *   - env(safe-area-inset-top/bottom/left/right) valen CERO. O sea que un encabezado con
 *     altura fija MAS relleno de zona segura (el defecto que aplasta el titulo contra el
 *     notch) sale limpio en esta medicion, y aqui dira "encaja".
 *   - NO existe el teclado. Un formulario cuyo campo y cuyo boton de guardar quedan debajo
 *     del teclado sale limpio.
 *   - Por defecto solo se mide en VERTICAL. Con el telefono girado, el hueco prohibido de
 *     los lados mide unos 47 puntos y casi nada del OS lleva px-safe. Se mide con
 *     --horizontal.
 *
 * Esas tres cosas se comprueban en el simulador de iPhone o en el telefono de verdad,
 * ANTES de dar una pantalla por hecha. Un informe verde aqui no significa que la pantalla
 * este bien en un iPhone.
 * ============================================================================
 *
 * COMO SE USA
 *   1. Arranca el servidor:  npm run dev
 *   2. En otra terminal:     npm run check:movil
 *   Opciones: --url http://localhost:3100 . --ancho 390 . --solo /board,/tasks
 *             --horizontal (mide tambien el telefono girado)
 *             --timeout 240 (segundos por pantalla) . --json informe.json
 *             --capturas .movil/ (guarda una foto de cada pantalla)
 *             --estricto (devuelve error si encuentra problemas; por defecto NO bloquea)
 *
 * POR QUE NO ESTA ENGANCHADO A predev NI A prebuild
 * A proposito. Los otros candados solo leen archivos, asi que corren en cualquier sitio.
 * Este necesita el servidor encendido, una sesion iniciada y un navegador instalado: nada
 * de eso existe en el servidor que publica la web. Engancharlo alli seria repetir el
 * incidente del 2026-07-31, cuando una comprobacion pensada para la maquina de quien
 * trabaja tumbo dos despliegues seguidos
 * (docs/sops/producto/06-vercel-deploy-y-colaboracion.md).
 * El que SI bloquea es el estatico (scripts/check-brandkit.mjs); este MIDE.
 *
 * TRES COSAS QUE YA COSTARON TIEMPO EN ESTE PROYECTO, Y QUE AQUI ESTAN RESUELTAS
 *   - El login falla si se escribe antes de que la pagina termine de activarse: se espera
 *     al campo, luego a que la red se calme, y ademas un margen fijo, ANTES de rellenar.
 *   - Con la emulacion de telefono encendida el formulario de login no llega a enviarse:
 *     se entra en tamano de ordenador, se guarda la sesion y DESPUES se abre a 375.
 *   - El servidor de desarrollo compila cada pantalla la primera vez y puede tardar
 *     minutos: esperas generosas, aviso de por donde va, y una pantalla que tarde
 *     demasiado se salta en vez de colgar la ejecucion entera.
 *
 * Las credenciales salen de .env.local (TEST_AGENT_EMAIL / TEST_AGENT_PASSWORD) y NUNCA se
 * imprimen, ni en los mensajes de error.
 *
 * Knowledge: docs/sops/producto/03-mobile-first-os.md
 *            .claude/skills/os-movil-primero/SKILL.md
 */

import { readFileSync, readdirSync, existsSync, mkdirSync, writeFileSync } from "node:fs"
import { join, relative } from "node:path"
import { createRequire } from "node:module"
import { pathToFileURL } from "node:url"
import { connect } from "node:net"

const RAIZ = process.cwd()

/* Salida para el servidor que publica la web: aqui no hay servidor de desarrollo, ni
 * navegador, ni sesion. No hay nada que medir. */
if (process.env.VERCEL || process.env.CI) {
  console.log("  check:movil: se salta en el servidor de publicacion (necesita la app encendida).")
  process.exit(0)
}

/* Colores y ayudas de texto ------------------------------------------------ */

const ROJO = "\x1b[31m"
const AMBAR = "\x1b[33m"
const GRIS = "\x1b[90m"
const FIN = "\x1b[0m"

const linea = (t = "") => console.log(t)
const rojo = (t) => `${ROJO}${t}${FIN}`
const ambar = (t) => `${AMBAR}${t}${FIN}`
const gris = (t) => `${GRIS}${t}${FIN}`

/* Argumentos --------------------------------------------------------------- */

const ARGS = process.argv.slice(2)
const opcion = (nombre, porDefecto = null) => {
  const i = ARGS.indexOf(`--${nombre}`)
  if (i === -1) return porDefecto
  const v = ARGS[i + 1]
  return v && !v.startsWith("--") ? v : true
}
const bandera = (nombre) => ARGS.includes(`--${nombre}`)

const ANCHO = Number(opcion("ancho", 375))
const ALTO = Number(opcion("alto", 812))
const MIN_TACTIL = Number(opcion("tactil-min", 44))
const MIN_TEXTO = Number(opcion("texto-min", 12))
const MIN_INPUT = 16
const ESPERA_PANTALLA = Number(opcion("timeout", 180)) * 1000
const ESPERA_LOGIN = 120000
const SOLO =
  typeof opcion("solo") === "string"
    ? String(opcion("solo"))
        .split(",")
        .map((s) => s.trim())
    : null
const RUTA_JSON = typeof opcion("json") === "string" ? String(opcion("json")) : null
const CARPETA_CAPTURAS = typeof opcion("capturas") === "string" ? String(opcion("capturas")) : null
const ESTRICTO = bandera("estricto")
const HORIZONTAL = bandera("horizontal")

/* 1 . Playwright ------------------------------------------------------------ */

async function cargarPlaywright() {
  const requerir = createRequire(join(RAIZ, "package.json"))
  for (const nombre of ["playwright", "playwright-core", "@playwright/test"]) {
    try {
      return await import(pathToFileURL(requerir.resolve(nombre)).href)
    } catch {
      /* se prueba el siguiente */
    }
  }
  try {
    return await import("playwright")
  } catch {
    return null
  }
}

/* 2 . Credenciales: se leen de .env.local y no se imprimen NUNCA ------------ */

function leerEnvLocal() {
  const ruta = join(RAIZ, ".env.local")
  if (!existsSync(ruta)) return {}
  const salida = {}
  for (const cruda of readFileSync(ruta, "utf8").split("\n")) {
    const l = cruda.trim()
    if (!l || l.startsWith("#")) continue
    const corte = l.indexOf("=")
    if (corte === -1) continue
    const clave = l.slice(0, corte).trim()
    let valor = l.slice(corte + 1).trim()
    if ((valor.startsWith('"') && valor.endsWith('"')) || (valor.startsWith("'") && valor.endsWith("'"))) {
      valor = valor.slice(1, -1)
    }
    salida[clave] = valor
  }
  return salida
}

/* 3 . Las pantallas se sacan del propio repositorio ------------------------- */
/* Asi, cuando alguien anada una pantalla nueva, entra sola en la medicion. */

function pantallasDelOS() {
  const base = join(RAIZ, "src/app/(main)")
  const paginas = []
  const recorrer = (dir) => {
    let entradas
    try {
      entradas = readdirSync(dir, { withFileTypes: true })
    } catch {
      return
    }
    for (const e of entradas) {
      const p = join(dir, e.name)
      if (e.isDirectory()) {
        if (e.name === "node_modules" || e.name === ".next") continue
        recorrer(p)
      } else if (e.name === "page.tsx") {
        paginas.push(p)
      }
    }
  }
  recorrer(base)

  const estaticas = []
  const dinamicas = []
  for (const p of paginas) {
    const rel = relative(base, p).split("\\").join("/").replace(/\/?page\.tsx$/, "")
    const segmentos = rel.split("/").filter((s) => s && !(s.startsWith("(") && s.endsWith(")")))
    const ruta = "/" + segmentos.join("/")
    const ficha = { ruta, archivo: relative(RAIZ, p) }
    if (segmentos.some((s) => s.includes("["))) dinamicas.push(ficha)
    else estaticas.push(ficha)
  }
  estaticas.sort((a, b) => a.ruta.localeCompare(b.ruta))
  dinamicas.sort((a, b) => a.ruta.localeCompare(b.ruta))
  return { estaticas, dinamicas }
}

/* 4 . Encontrar el servidor encendido --------------------------------------- */
/* Se mira si el puerto responde (instantaneo). Pedir una pagina no sirve para buscar: el
 * servidor recien arrancado tarda en compilar y pareceria apagado. */

function puertoAbierto(puerto, ms = 400) {
  return new Promise((resolver) => {
    const s = connect({ host: "127.0.0.1", port: puerto })
    const cerrar = (v) => {
      s.destroy()
      resolver(v)
    }
    s.setTimeout(ms)
    s.once("connect", () => cerrar(true))
    s.once("timeout", () => cerrar(false))
    s.once("error", () => cerrar(false))
  })
}

async function buscarServidor() {
  const dada = opcion("url") || process.env.CHECK_MOVIL_URL
  if (typeof dada === "string") return dada.replace(/\/$/, "")
  const puertos = []
  for (let p = 3100; p <= 3110; p++) puertos.push(p)
  for (let p = 3000; p <= 3006; p++) puertos.push(p)
  for (const p of puertos) {
    if (await puertoAbierto(p)) return `http://localhost:${p}`
  }
  return null
}

/* 5 . LA MEDICION. Esta funcion corre DENTRO del navegador ------------------ */
/* No puede usar nada de fuera: todo lo que necesita va aqui dentro. */

function medirPantalla(opciones) {
  const { MIN_TACTIL, MIN_TEXTO, MIN_INPUT } = opciones
  const TOL = 1
  const anchoPantalla = document.documentElement.clientWidth
  const altoPantalla = document.documentElement.clientHeight

  const recortar = (t, n) => (t.length > n ? t.slice(0, n) + "..." : t)

  const clasesDe = (el) => {
    const bruto = typeof el.className === "string" ? el.className : el.getAttribute("class") || ""
    return bruto
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 5)
      .map((c) => recortar(c, 26))
  }

  const etiquetaDe = (el) => {
    const tag = el.tagName.toLowerCase()
    const id = el.id ? "#" + el.id : ""
    const clases = clasesDe(el)
    return tag + id + (clases.length ? "." + clases.join(".") : "")
  }

  const textoDe = (el) => recortar((el.textContent || "").replace(/\s+/g, " ").trim(), 44)

  const caminoDe = (el) => {
    const partes = []
    let n = el.parentElement
    let saltos = 0
    while (n && n !== document.body && saltos < 3) {
      const c = clasesDe(n)[0]
      partes.unshift(n.tagName.toLowerCase() + (c ? "." + c : ""))
      n = n.parentElement
      saltos++
    }
    return partes.join(" > ")
  }

  const esDelSistema = (el) => {
    const tag = el.tagName
    if (tag.startsWith("NEXTJS-")) return true
    if (tag === "SCRIPT" || tag === "STYLE" || tag === "TEMPLATE" || tag === "LINK" || tag === "META") return true
    if (el.closest && el.closest("nextjs-portal")) return true
    return false
  }

  const esVisible = (el, rect, estilo) => {
    if (rect.width <= 0 || rect.height <= 0) return false
    if (estilo.visibility === "hidden" || estilo.display === "none") return false
    if (estilo.opacity !== "" && Number(estilo.opacity) === 0) return false
    return true
  }

  /* Que le pasa a lo que se sale: se puede arrastrar, o se pierde recortado. */
  const contenedorQueManda = (el) => {
    let n = el.parentElement
    while (n && n !== document.documentElement) {
      const ov = getComputedStyle(n).overflowX
      if (ov === "auto" || ov === "scroll") return { tipo: "arrastre", el: n }
      if (ov === "hidden" || ov === "clip") return { tipo: "recorte", el: n }
      n = n.parentElement
    }
    return { tipo: "pagina", el: document.documentElement }
  }

  const todos = Array.from(document.body.querySelectorAll("*"))

  /* --- 1 y 2. Una sola pasada por el arbol: lo que se sale, y lo que se recorta. ---- */
  /* Se recorre una vez porque preguntar el estilo calculado de cada elemento es lo caro, */
  /* y en una pantalla del OS hay miles.                                                 */

  const ofensores = []
  const recortes = []
  let barraInferior = null

  for (const el of todos) {
    if (esDelSistema(el)) continue
    if (el.ownerSVGElement) continue // partes internas de un icono, no cuentan
    const rect = el.getBoundingClientRect()
    const estilo = getComputedStyle(el)
    if (!esVisible(el, rect, estilo)) continue

    /* La barra inferior de navegacion: pegada abajo, ancha y con altura de barra. */
    if (
      !barraInferior &&
      estilo.position === "fixed" &&
      rect.height >= 30 &&
      rect.width >= anchoPantalla * 0.8 &&
      Math.abs(rect.bottom - altoPantalla) <= 2
    ) {
      barraInferior = { el, top: rect.top, alto: Math.round(rect.height), etiqueta: etiquetaDe(el) }
    }

    // Se sale de la pantalla
    const sobra = Math.round(rect.right - anchoPantalla)
    const seSaleIzquierda = Math.round(-rect.left)
    if (sobra > TOL || seSaleIzquierda > TOL) {
      const mando = contenedorQueManda(el)
      ofensores.push({
        el,
        sobra: Math.max(sobra, 0),
        sobraIzquierda: Math.max(seSaleIzquierda, 0),
        ancho: Math.round(rect.width),
        alto: Math.round(rect.height),
        recuperable: mando.tipo === "arrastre",
        dentroDe: mando.tipo,
      })
    }

    // Esconde lo que no cabe y no deja arrastrarlo
    const ov = estilo.overflowX
    if (
      (ov === "hidden" || ov === "clip") &&
      estilo.textOverflow !== "ellipsis" && // texto cortado a proposito
      el.clientWidth >= 60 &&
      el.scrollWidth - el.clientWidth > 4
    ) {
      recortes.push({
        etiqueta: etiquetaDe(el),
        camino: caminoDe(el),
        visible: el.clientWidth,
        necesita: el.scrollWidth,
        perdido: el.scrollWidth - el.clientWidth,
      })
    }
  }
  recortes.sort((a, b) => b.perdido - a.perdido)

  /* De toda la cadena de cajas que se salen, la culpable es la mas profunda. */
  const conjunto = new Set(ofensores.map((o) => o.el))
  const noEsHoja = new Set()
  for (const o of ofensores) {
    let n = o.el.parentElement
    while (n) {
      if (conjunto.has(n)) noEsHoja.add(n)
      n = n.parentElement
    }
  }

  const hojas = ofensores
    .filter((o) => !noEsHoja.has(o.el) && !o.recuperable)
    .sort((a, b) => b.sobra + b.sobraIzquierda - (a.sobra + a.sobraIzquierda))
    .slice(0, 8)
    .map((o) => ({
      etiqueta: etiquetaDe(o.el),
      camino: caminoDe(o.el),
      texto: textoDe(o.el),
      sobra: o.sobra,
      sobraIzquierda: o.sobraIzquierda,
      ancho: o.ancho,
      alto: o.alto,
      dentroDe: o.dentroDe,
    }))

  /* --- 3. Zonas tactiles por debajo del minimo --------------------------- */

  const SELECTOR = [
    "button",
    "a[href]",
    "input",
    "select",
    "textarea",
    "summary",
    '[role="button"]',
    '[role="tab"]',
    '[role="switch"]',
    '[role="checkbox"]',
    '[role="radio"]',
    '[role="menuitem"]',
    '[role="option"]',
  ].join(", ")

  const tactilesPequenas = []
  const enlacesEnLinea = []
  for (const el of Array.from(document.body.querySelectorAll(SELECTOR))) {
    if (esDelSistema(el)) continue
    if (el.disabled) continue
    if (el.type === "hidden") continue
    const rect = el.getBoundingClientRect()
    const estilo = getComputedStyle(el)
    if (!esVisible(el, rect, estilo)) continue
    if (estilo.pointerEvents === "none") continue
    const lado = Math.min(Math.round(rect.width), Math.round(rect.height))
    if (lado >= MIN_TACTIL) continue
    const ficha = {
      etiqueta: etiquetaDe(el),
      camino: caminoDe(el),
      texto: textoDe(el) || el.getAttribute("aria-label") || el.getAttribute("title") || "",
      ancho: Math.round(rect.width),
      alto: Math.round(rect.height),
      lado,
    }
    // Un enlace dentro de un parrafo no es un boton: se cuenta aparte.
    if (el.tagName === "A" && estilo.display.startsWith("inline")) enlacesEnLinea.push(ficha)
    else tactilesPequenas.push(ficha)
  }
  tactilesPequenas.sort((a, b) => a.lado - b.lado)

  /* --- 4. Texto demasiado pequeno ---------------------------------------- */

  const textosPequenos = []
  const porTamano = {}
  let totalTextos = 0
  let textosJustos = 0
  const paseador = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT)
  const yaVisto = new Set()
  for (let nodo = paseador.nextNode(); nodo; nodo = paseador.nextNode()) {
    const contenido = (nodo.nodeValue || "").replace(/\s+/g, " ").trim()
    if (!contenido) continue
    const padre = nodo.parentElement
    if (!padre || esDelSistema(padre)) continue
    if (padre.closest("svg")) continue
    const estilo = getComputedStyle(padre)
    const rect = padre.getBoundingClientRect()
    if (!esVisible(padre, rect, estilo)) continue
    const px = Math.round(parseFloat(estilo.fontSize) * 10) / 10
    // Por encima del minimo de cuerpo del SOP 03 (14) no interesa nada.
    if (px >= Math.max(14, MIN_TEXTO)) continue
    if (px >= MIN_TEXTO) {
      textosJustos++ // entre 12 y 13: pasa el suelo, pero no llega al cuerpo del SOP
      continue
    }
    totalTextos++
    porTamano[px] = (porTamano[px] || 0) + 1
    const clave = px + "|" + etiquetaDe(padre)
    if (yaVisto.has(clave)) continue
    yaVisto.add(clave)
    textosPequenos.push({
      px,
      etiqueta: etiquetaDe(padre),
      camino: caminoDe(padre),
      texto: recortar(contenido, 44),
    })
  }
  textosPequenos.sort((a, b) => a.px - b.px)

  /* Campos de escritura por debajo de 16: el iPhone se acerca solo al enfocar. */
  const camposConZoom = []
  for (const el of Array.from(document.body.querySelectorAll("input, textarea, select"))) {
    if (esDelSistema(el) || el.type === "hidden") continue
    const estilo = getComputedStyle(el)
    const rect = el.getBoundingClientRect()
    if (!esVisible(el, rect, estilo)) continue
    const px = Math.round(parseFloat(estilo.fontSize) * 10) / 10
    if (px >= MIN_INPUT) continue
    camposConZoom.push({
      px,
      etiqueta: etiquetaDe(el),
      camino: caminoDe(el),
      texto: el.getAttribute("placeholder") || el.getAttribute("name") || "",
    })
  }

  /* --- 5. Contenido TAPADO por la barra inferior -------------------------- */
  /* No se sale de lado ni se recorta: simplemente queda debajo del menu y no se puede
   * tocar. El hueco se reserva con pb-mobile-nav, y hoy no esta en el contenedor comun. */

  const tapados = []
  if (barraInferior) {
    for (const el of todos) {
      if (esDelSistema(el)) continue
      if (el === barraInferior.el || barraInferior.el.contains(el) || el.contains(barraInferior.el)) continue
      const estilo = getComputedStyle(el)
      if (estilo.position === "fixed" || estilo.position === "sticky") continue
      const rect = el.getBoundingClientRect()
      if (!esVisible(el, rect, estilo)) continue
      if (rect.top >= altoPantalla) continue // todavia no se ha llegado ahi al desplazar
      if (rect.bottom <= barraInferior.top + 2) continue
      // Solo hojas con contenido propio: si no, se reportaria tambien cada caja padre.
      const tieneHijoElemento = el.children.length > 0 && el.textContent.trim().length > 0
      const esControl = /^(BUTTON|A|INPUT|SELECT|TEXTAREA)$/.test(el.tagName)
      if (tieneHijoElemento && !esControl) continue
      if (!el.textContent.trim() && !esControl) continue
      tapados.push({
        etiqueta: etiquetaDe(el),
        texto: textoDe(el),
        tapado: Math.round(Math.min(rect.bottom, altoPantalla) - barraInferior.top),
        esControl,
      })
    }
  }
  tapados.sort((a, b) => b.tapado - a.tapado)

  /* ── Cajones que ATRAPAN el gesto y dejan la pantalla congelada ──────────
   *
   * Un cajon con `overflow-y: auto|scroll` y `overscroll-behavior` en `contain` o
   * `none` NO deja pasar el gesto a la pagina. Si ademas ese cajon no tiene nada
   * que desplazar por dentro, el dedo o la rueda encima de el no mueven NADA: la
   * pantalla parece rota.
   *
   * Es un fallo MUDO. No sale error, no se sale nada de sitio y una captura de
   * pagina completa se ve perfecta. Solo aparece al intentar desplazar encima.
   * Paso el 2026-08-07 en Afiliados y lo encontro Marco, no la maquina.
   *
   * Se marca solo cuando de verdad molesta: el cajon ocupa buena parte de la
   * pantalla Y la pagina todavia tiene contenido por debajo que alcanzar.
   */
  const trampas = []
  {
    /* Las TRES condiciones tienen que darse a la vez. Si falta una, no molesta a nadie:
     *   1. el cajon corta el paso del gesto (overscroll contain o none)
     *   2. el cajon NO tiene nada que desplazar por dentro
     *   3. y por encima de el SI hay alguien que se podria estar desplazando
     * Sin la tercera se marcaba el propio marco de la app en pantallas que caben enteras,
     * donde no hay nada roto. Falso positivo corregido el 2026-08-07 en la misma pasada. */
    const puedeDesplazarse = (el) => {
      if (!el || el === document.documentElement) {
        return document.documentElement.scrollHeight > document.documentElement.clientHeight + 4
      }
      const s = getComputedStyle(el)
      return /(auto|scroll)/.test(s.overflowY) && el.scrollHeight > el.clientHeight + 4
    }

    for (const el of document.querySelectorAll("*")) {
      const s = getComputedStyle(el)
      if (!/(auto|scroll)/.test(s.overflowY)) continue
      if (!/(contain|none)/.test(s.overscrollBehaviorY || s.overscrollBehavior || "")) continue
      if (el.scrollHeight > el.clientHeight + 4) continue // este si se desplaza: no atrapa

      let ancestroSeDesplaza = false
      for (let padre = el.parentElement; padre; padre = padre.parentElement) {
        if (puedeDesplazarse(padre)) {
          ancestroSeDesplaza = true
          break
        }
      }
      if (!ancestroSeDesplaza && !puedeDesplazarse(document.documentElement)) continue

      const r = el.getBoundingClientRect()
      const ocupa = (r.width * Math.min(r.height, altoPantalla)) / (anchoPantalla * altoPantalla)
      if (r.height < 120 || ocupa < 0.15) continue
      trampas.push({
        etiqueta: etiquetaDe(el),
        texto: textoDe(el),
        porcentajeDePantalla: Math.round(ocupa * 100),
      })
    }
  }

  return {
    anchoPantalla,
    altoPantalla,
    trampasDeScroll: { total: trampas.length, peores: trampas.slice(0, 5) },
    paginaSeArrastra: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    conErrorDeLaApp: Boolean(document.querySelector("nextjs-portal")),
    desbordes: {
      total: ofensores.filter((o) => !o.recuperable).length,
      conArrastrePropio: ofensores.filter((o) => o.recuperable).length,
      culpables: hojas,
    },
    recortes: { total: recortes.length, peores: recortes.slice(0, 5) },
    tactiles: {
      total: tactilesPequenas.length,
      enlacesEnLinea: enlacesEnLinea.length,
      peores: tactilesPequenas.slice(0, 8),
    },
    textos: {
      total: totalTextos,
      justos: textosJustos,
      porTamano,
      peores: textosPequenos.slice(0, 8),
      camposConZoom: camposConZoom.slice(0, 6),
      totalCamposConZoom: camposConZoom.length,
    },
    tapadosPorLaBarra: {
      hayBarra: Boolean(barraInferior),
      alto: barraInferior ? barraInferior.alto : 0,
      total: tapados.length,
      peores: tapados.slice(0, 5),
    },
  }
}

/** Lleva al final el contenedor que de verdad se desplaza. En este OS no se desplaza la
 *  pagina: se desplaza un div interno de src/app/(main)/layout.tsx. Sin esto no se puede
 *  saber si la ultima fila queda debajo de la barra. */
function irAlFinal() {
  const candidatos = Array.from(document.querySelectorAll("div, main, section"))
  let mejor = null
  for (const el of candidatos) {
    const ov = getComputedStyle(el).overflowY
    if (ov !== "auto" && ov !== "scroll") continue
    const margen = el.scrollHeight - el.clientHeight
    if (margen <= 4) continue
    if (!mejor || margen > mejor.margen) mejor = { el, margen }
  }
  if (mejor) mejor.el.scrollTop = mejor.el.scrollHeight
  window.scrollTo(0, document.body.scrollHeight)
}

/* 6 . Programa principal ---------------------------------------------------- */

async function principal() {
  linea("")
  linea(`  check:movil  .  midiendo el OS a ${ANCHO} puntos de ancho (un iPhone normal)`)
  linea("")

  const pw = await cargarPlaywright()
  if (!pw) {
    /* Con --estricto se PIDE que devuelva error si algo va mal. Un comprobador que no ha
     * podido medir nada NUNCA debe decir que todo va bien: el dia que alguien lo meta en
     * una cadena, reportaria exito para siempre sin haber abierto el navegador. */
    const salida = ESTRICTO ? 1 : 0
    linea(ESTRICTO ? rojo("  No hay navegador con el que medir. No se midio NADA.") : ambar("  No hay navegador con el que medir. No se midio nada."))
    linea("")
    linea("  Playwright no esta instalado en este proyecto. Para instalarlo (una vez):")
    linea("")
    linea("      npm i -D playwright && npx playwright install chromium")
    linea("")
    linea("  Despues:  npm run dev            (en una terminal)")
    linea("            npm run check:movil    (en otra)")
    linea("")
    if (ESTRICTO) linea(gris("  Se devuelve error porque pediste --estricto y no se pudo medir."))
    linea("")
    process.exit(salida)
  }

  const env = { ...leerEnvLocal(), ...process.env }
  const correo = env.TEST_AGENT_EMAIL
  const clave = env.TEST_AGENT_PASSWORD
  if (!correo || !clave) {
    linea(rojo("  Faltan las credenciales de prueba."))
    linea("")
    linea("  Este comprobador entra al OS como un usuario de verdad. Las credenciales se leen")
    linea("  de .env.local y no se piden por chat ni se imprimen nunca:")
    linea("")
    linea("      TEST_AGENT_EMAIL=...")
    linea("      TEST_AGENT_PASSWORD=...")
    linea("")
    process.exit(1)
  }

  const BASE = await buscarServidor()
  if (!BASE) {
    linea(rojo("  No encuentro la aplicacion encendida."))
    linea("")
    linea("  Arranca el servidor en otra terminal:  npm run dev")
    linea("  Y si usa un puerto raro:               npm run check:movil -- --url http://localhost:3123")
    linea("")
    process.exit(1)
  }

  const { estaticas, dinamicas } = pantallasDelOS()
  let pantallas = estaticas
  if (SOLO) {
    pantallas = estaticas.filter((p) => SOLO.some((s) => p.ruta === s || p.ruta.startsWith(s)))
    // Una direccion que no sale del disco (por ejemplo /projects/EL-ID-DE-UN-PROYECTO) se
    // mide igual: asi se pueden medir las pantallas de detalle, que necesitan un elemento
    // de verdad en la direccion.
    for (const s of SOLO) {
      if (!s.startsWith("/")) continue
      if (pantallas.some((p) => p.ruta === s)) continue
      if (estaticas.some((p) => p.ruta.startsWith(s))) continue
      pantallas.push({ ruta: s, archivo: "(direccion dada a mano)" })
    }
    pantallas.sort((a, b) => a.ruta.localeCompare(b.ruta))
  }
  if (pantallas.length === 0) {
    linea(rojo("  No hay ninguna pantalla que medir con ese filtro."))
    linea("")
    process.exit(1)
  }

  if (CARPETA_CAPTURAS) mkdirSync(join(RAIZ, CARPETA_CAPTURAS), { recursive: true })

  linea(`  Aplicacion: ${BASE}`)
  linea(`  Pantallas:  ${pantallas.length} internas del OS` + (SOLO ? " (filtradas)" : ""))
  if (HORIZONTAL) linea(`  Tambien se mide el telefono GIRADO (${ALTO}x${ANCHO}).`)
  linea(gris("  La primera vez, cada pantalla se compila al abrirla y puede tardar minutos."))
  linea(gris(`  Espera maxima por pantalla: ${ESPERA_PANTALLA / 1000}s. La que pase de ahi se salta.`))
  linea("")

  const navegador = await pw.chromium.launch({ headless: true })
  const resultados = []
  const saltadas = []
  const inaccesibles = []

  try {
    /* --- Entrar. En tamano de ordenador, nunca en modo telefono ---------- */
    /* Con la emulacion de telefono encendida, este formulario no llega a enviarse. */
    const ctxEscritorio = await navegador.newContext({ viewport: { width: 1280, height: 900 } })
    const pagLogin = await ctxEscritorio.newPage()
    process.stdout.write("  entrando al OS ... ")
    try {
      await pagLogin.goto(`${BASE}/login`, { waitUntil: "domcontentloaded", timeout: ESPERA_LOGIN })
      await pagLogin.waitForSelector("#email", { state: "visible", timeout: ESPERA_LOGIN })
      // La pagina tiene que terminar de activarse antes de escribir en ella: si se rellena
      // y se pulsa demasiado pronto, el envio se pierde.
      await pagLogin.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {})
      await pagLogin.waitForTimeout(1500)
      await pagLogin.fill("#email", correo)
      await pagLogin.fill("#password", clave)
      await Promise.all([
        pagLogin.waitForURL((u) => !u.pathname.startsWith("/login"), { timeout: ESPERA_LOGIN }),
        pagLogin.click('button[type="submit"]'),
      ])
      linea("listo")
    } catch {
      linea(rojo("no se pudo entrar"))
      linea("")
      linea(`  El OS no dejo pasar en ${BASE}. Cosas que suelen ser:`)
      linea("    - ese puerto no es la aplicacion, es otra cosa: dilo a mano con --url")
      linea("    - el usuario de .env.local ya no existe o cambio su clave")
      linea("    - el servidor esta arrancado pero contra otra base de datos")
      linea("    - la pantalla de login tardo mas de la cuenta en compilar (prueba otra vez)")
      linea("")
      await navegador.close()
      process.exit(1)
    }

    const sesion = await ctxEscritorio.storageState()
    await ctxEscritorio.close()

    /* --- Y ahora si: telefono -------------------------------------------- */
    const ctxMovil = await navegador.newContext({
      storageState: sesion,
      viewport: { width: ANCHO, height: ALTO },
      deviceScaleFactor: 3,
      isMobile: true,
      hasTouch: true,
    })
    ctxMovil.setDefaultTimeout(ESPERA_PANTALLA)
    const pagina = await ctxMovil.newPage()

    let i = 0
    for (const p of pantallas) {
      i++
      const rotulo = `  [${String(i).padStart(2, " ")}/${pantallas.length}] ${p.ruta.padEnd(26, " ")}`
      process.stdout.write(rotulo + "abriendo ... ")
      const arranque = Date.now()
      try {
        await pagina.setViewportSize({ width: ANCHO, height: ALTO })
        await pagina.goto(`${BASE}${p.ruta}`, { waitUntil: "domcontentloaded", timeout: ESPERA_PANTALLA })
        // Muchas pantallas cargan datos despues de pintarse. Si nunca se calma (hay
        // pantallas con conexiones abiertas), se sigue igual.
        await pagina.waitForLoadState("networkidle", { timeout: 30000 }).catch(() => {})
        await pagina.waitForTimeout(900)

        const sinBarra = (s) => (s.length > 1 ? s.replace(/\/$/, "") : s)
        const destino = sinBarra(new URL(pagina.url()).pathname)
        if (destino.startsWith("/login")) {
          linea(rojo("la sesion se perdio"))
          inaccesibles.push({ ...p, motivo: "la sesion se perdio a mitad de la medicion" })
          break
        }
        if (destino !== sinBarra(p.ruta)) {
          linea(ambar(`redirige a ${destino}`))
          inaccesibles.push({ ...p, motivo: `este usuario no llega a la pantalla (va a ${destino})` })
          continue
        }

        // Se baja hasta el final ANTES de medir: lo que tapa la barra inferior solo se ve ahi.
        await pagina.evaluate(irAlFinal)
        await pagina.waitForTimeout(250)

        const m = await pagina.evaluate(medirPantalla, { MIN_TACTIL, MIN_TEXTO, MIN_INPUT })
        m.ruta = p.ruta
        m.archivo = p.archivo
        m.segundos = Math.round((Date.now() - arranque) / 100) / 10

        if (HORIZONTAL) {
          await pagina.setViewportSize({ width: ALTO, height: ANCHO })
          await pagina.waitForTimeout(500)
          const g = await pagina.evaluate(medirPantalla, { MIN_TACTIL, MIN_TEXTO, MIN_INPUT })
          m.girado = { desbordes: g.desbordes.total, recortes: g.recortes.total, culpables: g.desbordes.culpables.slice(0, 3) }
          await pagina.setViewportSize({ width: ANCHO, height: ALTO })
        }

        resultados.push(m)

        if (CARPETA_CAPTURAS) {
          const nombre = (p.ruta === "/" ? "raiz" : p.ruta.slice(1).split("/").join("-")) + ".png"
          await pagina.screenshot({ path: join(RAIZ, CARPETA_CAPTURAS, nombre), fullPage: true }).catch(() => {})
        }

        const partes = [
          `${m.desbordes.total} se salen`,
          `${m.tactiles.total} sin dedo`,
          `${m.textos.total} texto pequeno`,
        ]
        if (m.recortes.total) partes.push(`${m.recortes.total} recortados`)
        if (m.tapadosPorLaBarra.total) partes.push(`${m.tapadosPorLaBarra.total} tapados`)
        if (m.trampasDeScroll.total) partes.push(`${m.trampasDeScroll.total} ATRAPAN EL SCROLL`)
        if (m.girado && m.girado.desbordes) partes.push(`${m.girado.desbordes} girado`)
        const cola = gris(` (${m.segundos}s)`)
        const grave =
          m.desbordes.total > 0 ||
          m.recortes.total > 0 ||
          m.tapadosPorLaBarra.total > 0 ||
          m.trampasDeScroll.total > 0
        const limpio = !grave && m.tactiles.total === 0 && m.textos.total === 0
        if (limpio) linea("encaja" + cola)
        else if (grave) linea(rojo(partes.join(" . ")) + cola)
        else linea(ambar(partes.join(" . ")) + cola)
        if (m.conErrorDeLaApp) {
          linea(gris("        (esta pantalla muestra un error de la app; lo medido puede no valer)"))
        }
      } catch {
        const segundos = Math.round((Date.now() - arranque) / 1000)
        linea(ambar(`saltada (no cargo en ${segundos}s)`))
        saltadas.push({ ...p, segundos })
      }
    }

    await ctxMovil.close()
  } finally {
    await navegador.close().catch(() => {})
  }

  informe({ resultados, saltadas, inaccesibles, dinamicas, BASE })
}

/* 7 . El informe ------------------------------------------------------------ */

function informe({ resultados, saltadas, inaccesibles, dinamicas, BASE }) {
  if (resultados.length === 0) {
    linea("")
    linea(ambar("  No se llego a medir ninguna pantalla."))
    if (saltadas.length) {
      linea(`  ${saltadas.length} tardaron demasiado en abrir. Deja el servidor arrancado un rato y repite.`)
    }
    if (inaccesibles.length) linea(`  ${inaccesibles.length} no son accesibles con el usuario de prueba.`)
    linea("")
    process.exit(1)
  }

  const suma = (f) => resultados.reduce((a, r) => a + f(r), 0)
  const totalDesbordes = suma((r) => r.desbordes.total)
  const totalRecortes = suma((r) => r.recortes.total)
  const totalTactiles = suma((r) => r.tactiles.total)
  const totalTextos = suma((r) => r.textos.total)
  const totalCampos = suma((r) => r.textos.totalCamposConZoom)
  const totalTapados = suma((r) => r.tapadosPorLaBarra.total)
  const totalGirado = suma((r) => (r.girado ? r.girado.desbordes + r.girado.recortes : 0))
  const pantallasQueEncajan = resultados.filter(
    (r) =>
      r.desbordes.total === 0 &&
      r.recortes.total === 0 &&
      r.tactiles.total === 0 &&
      r.textos.total === 0 &&
      r.tapadosPorLaBarra.total === 0
  ).length

  linea("")
  linea("  " + "-".repeat(74))
  linea(`  RESULTADO A ${ANCHO} PUNTOS DE ANCHO`)
  linea("  " + "-".repeat(74))
  linea("")
  const dato = (rotulo, valor) => linea("  " + (rotulo + " ").padEnd(41, ".") + " " + valor)
  dato("Pantallas medidas", resultados.length)
  dato("Pantallas que encajan enteras", pantallasQueEncajan)
  dato(
    "Cajones que ATRAPAN el scroll (pantalla rota)",
    resultados.reduce((s, r) => s + (r.trampasDeScroll?.total ?? 0), 0),
  )
  dato("Elementos que se salen de la pantalla", totalDesbordes)
  dato("Cajas que recortan sin dejar arrastrar", totalRecortes)
  dato("Cosas tapadas por la barra inferior", totalTapados)
  dato(`Zonas tactiles menores de ${MIN_TACTIL}`, totalTactiles)
  dato(`Textos menores de ${MIN_TEXTO}`, totalTextos)
  dato("Campos que hacen zoom en el iPhone", totalCampos)
  if (HORIZONTAL) dato("Problemas con el telefono girado", totalGirado)
  linea("")

  /* Ranking de pantallas, de la peor a la mejor. */
  // Una pantalla que atrapa el scroll esta ROTA de usar, no fea: pesa mas que nada.
  const nota = (r) =>
    (r.trampasDeScroll?.total ?? 0) * 40 +
    r.desbordes.total * 10 +
    r.recortes.total * 10 +
    r.tapadosPorLaBarra.total * 6 +
    r.tactiles.total +
    r.textos.total / 4
  const orden = [...resultados].sort((a, b) => nota(b) - nota(a))
  linea("  PANTALLAS, DE LA PEOR A LA MEJOR")
  linea("")
  const fila = (a, b, c, d, e, f) =>
    "    " +
    String(a).padEnd(26, " ") +
    String(b).padStart(9, " ") +
    String(c).padStart(9, " ") +
    String(d).padStart(9, " ") +
    String(e).padStart(9, " ") +
    String(f).padStart(11, " ")
  linea(gris(fila("pantalla", "se salen", "recortes", "tapados", "sin dedo", "texto min")))
  for (const r of orden) {
    linea(
      fila(
        r.ruta,
        r.desbordes.total,
        r.recortes.total,
        r.tapadosPorLaBarra.total,
        r.tactiles.total,
        r.textos.total
      )
    )
  }
  linea("")

  /* Lo que se repite en casi todas: casi siempre es el marco comun. */
  const repeticiones = new Map()
  const anotar = (clave, ruta, tipo) => {
    if (!repeticiones.has(clave)) repeticiones.set(clave, { tipo, rutas: new Set() })
    repeticiones.get(clave).rutas.add(ruta)
  }
  for (const r of resultados) {
    for (const c of r.desbordes.culpables) anotar(c.etiqueta, r.ruta, "se sale")
    for (const t of r.tactiles.peores) anotar(t.etiqueta, r.ruta, "no se puede tocar")
    for (const t of r.textos.peores) anotar(t.etiqueta, r.ruta, "texto pequeno")
    for (const t of r.tapadosPorLaBarra.peores) anotar(t.etiqueta, r.ruta, "tapado por la barra")
  }
  const comunes = [...repeticiones.entries()]
    .map(([etiqueta, v]) => ({ etiqueta, tipo: v.tipo, veces: v.rutas.size }))
    .filter((x) => x.veces >= Math.max(3, Math.ceil(resultados.length * 0.5)))
    .sort((a, b) => b.veces - a.veces)
    .slice(0, 10)

  if (comunes.length) {
    linea("  LO QUE SE REPITE EN CASI TODAS LAS PANTALLAS")
    linea(gris("    Esto vive en el marco comun (cabecera, barra inferior, avisos flotantes)."))
    linea(gris("    Se arregla una vez y cae en todas a la vez. Es por donde hay que empezar."))
    linea("")
    for (const c of comunes) {
      linea(`    ${String(c.veces).padStart(2, " ")} pantallas . ${c.tipo}`)
      linea(gris(`       ${c.etiqueta}`))
    }
    linea("")
  }

  /* Detalle pantalla por pantalla, solo de lo que falla. */
  linea("  DETALLE")
  linea("")
  for (const r of orden) {
    const hayAlgo =
      r.desbordes.total ||
      r.recortes.total ||
      r.tactiles.total ||
      r.textos.total ||
      r.tapadosPorLaBarra.total ||
      (r.girado && r.girado.desbordes)
    if (!hayAlgo) continue
    linea(`  ${r.ruta}`)
    linea(gris(`    ${r.archivo}`))

    if (r.desbordes.culpables.length) {
      linea(rojo(`    Se sale de la pantalla (${r.desbordes.total} elementos):`))
      for (const c of r.desbordes.culpables) {
        const sobra = c.sobra
          ? `se sale ${c.sobra}px por la derecha`
          : `se sale ${c.sobraIzquierda}px por la izquierda`
        const perdido = c.dentroDe === "recorte" ? ", y queda recortado sin poder arrastrarlo" : ""
        linea(`      ${sobra} . mide ${c.ancho}x${c.alto}${perdido}`)
        linea(gris(`        ${c.etiqueta}`))
        if (c.camino) linea(gris(`        dentro de: ${c.camino}`))
        if (c.texto) linea(gris(`        texto: "${c.texto}"`))
      }
    }
    if (r.desbordes.conArrastrePropio) {
      linea(
        gris(
          `    (${r.desbordes.conArrastrePropio} elementos anchos con arrastre lateral propio: eso esta permitido)`
        )
      )
    }

    if (r.recortes.peores.length) {
      linea(rojo(`    Contenido recortado que no se puede arrastrar (${r.recortes.total}):`))
      for (const c of r.recortes.peores) {
        linea(`      se ven ${c.visible}px de ${c.necesita}px . se pierden ${c.perdido}px`)
        linea(gris(`        ${c.etiqueta}`))
      }
    }

    if (r.tapadosPorLaBarra.peores.length) {
      linea(rojo(`    Tapado por la barra inferior de ${r.tapadosPorLaBarra.alto}px (${r.tapadosPorLaBarra.total}):`))
      for (const t of r.tapadosPorLaBarra.peores) {
        linea(`      ${t.tapado}px por debajo del borde${t.esControl ? " . ES UN BOTON: no se puede pulsar" : ""}`)
        linea(gris(`        ${t.etiqueta}${t.texto ? ' . "' + t.texto + '"' : ""}`))
      }
    }

    if (r.tactiles.peores.length) {
      linea(ambar(`    Zonas tactiles menores de ${MIN_TACTIL} puntos (${r.tactiles.total}):`))
      for (const t of r.tactiles.peores) {
        linea(`      ${t.ancho}x${t.alto} (el lado corto mide ${t.lado})${t.texto ? ' . "' + t.texto + '"' : ""}`)
        linea(gris(`        ${t.etiqueta}`))
      }
      if (r.tactiles.enlacesEnLinea) {
        linea(gris(`      (+${r.tactiles.enlacesEnLinea} enlaces dentro de un texto: no cuentan como boton)`))
      }
    }

    if (r.textos.peores.length) {
      const reparto = Object.entries(r.textos.porTamano)
        .sort((a, b) => Number(a[0]) - Number(b[0]))
        .map(([px, n]) => `${n} de ${px}px`)
        .join(" . ")
      linea(ambar(`    Texto menor de ${MIN_TEXTO} puntos (${r.textos.total}): ${reparto}`))
      for (const t of r.textos.peores.slice(0, 5)) {
        linea(`      ${t.px}px${t.texto ? ' . "' + t.texto + '"' : ""}`)
        linea(gris(`        ${t.etiqueta}`))
      }
      if (r.textos.justos) {
        linea(gris(`      (+${r.textos.justos} textos de 12 o 13px: pasan el minimo, pero el SOP 03 pide 14)`))
      }
    }

    if (r.textos.camposConZoom.length) {
      linea(ambar(`    Campos con letra menor de 16 (el iPhone se acerca solo): ${r.textos.totalCamposConZoom}`))
      for (const c of r.textos.camposConZoom.slice(0, 3)) {
        linea(`      ${c.px}px${c.texto ? ' . "' + c.texto + '"' : ""}`)
        linea(gris(`        ${c.etiqueta}`))
      }
    }

    if (r.girado && (r.girado.desbordes || r.girado.recortes)) {
      linea(ambar(`    Con el telefono GIRADO: ${r.girado.desbordes} se salen, ${r.girado.recortes} recortados`))
      for (const c of r.girado.culpables) {
        linea(gris(`        ${c.etiqueta}  (se sale ${c.sobra || c.sobraIzquierda}px)`))
      }
    }
    linea("")
  }

  if (inaccesibles.length) {
    linea("  PANTALLAS NO MEDIDAS (el usuario de prueba no llega)")
    for (const p of inaccesibles) linea(`    ${p.ruta.padEnd(30, " ")} ${p.motivo}`)
    linea("")
  }
  if (saltadas.length) {
    linea("  PANTALLAS SALTADAS (tardaron demasiado en abrir)")
    for (const p of saltadas) linea(`    ${p.ruta.padEnd(30, " ")} no cargo en ${p.segundos}s`)
    linea(gris("    Vuelve a pasarlas solas cuando ya esten compiladas:"))
    linea(gris(`      npm run check:movil -- --solo ${saltadas.map((p) => p.ruta).join(",")}`))
    linea("")
  }
  if (dinamicas.length) {
    linea("  PANTALLAS DE DETALLE, NO MEDIDAS (necesitan un elemento concreto en la direccion)")
    for (const p of dinamicas) linea(`    ${p.ruta}`)
    linea(gris("    Se miden dando la direccion completa de un caso real:"))
    linea(gris("      npm run check:movil -- --solo /projects/EL-ID-DE-UN-PROYECTO"))
    linea("")
  }

  linea("  " + "-".repeat(74))
  linea("  COMO SE ARREGLA CADA COSA")
  linea("  " + "-".repeat(74))
  linea("")
  linea("  Se sale de la pantalla:")
  linea("    - la fila que no cede: quitar shrink-0 del texto y poner flex-wrap + min-w-0 truncate")
  linea("    - rejilla de columnas fijas: empezar en 1 o 2 columnas y subir con md:")
  linea("    - ancho clavado en pixeles: w-full md:w-[420px], o max-w-full")
  linea("    - etiqueta en mayusculas con letras separadas: ocupa casi el doble de ancho, se quita")
  linea("")
  linea("  Contenido recortado sin arrastre:")
  linea("    - si el contenido tiene que caber: reordenarlo en vertical en movil")
  linea("    - si es un tablero o una tabla ancha a proposito: overflow-x-auto en SU contenedor")
  linea("      (el marco de la aplicacion recorta, no arrastra, asi que sin esto se pierde)")
  linea("")
  linea("  Tapado por la barra inferior:")
  linea("    - el hueco se reserva UNA vez, en src/components/ui/page-container.tsx, con")
  linea("      pb-mobile-nav. Ponerlo pantalla por pantalla es la forma segura de olvidarlo")
  linea("    - lo flotante (boton de venta, aviso de actualizacion, aviso de notificaciones)")
  linea("      va por encima: bottom-[calc(3.5rem+env(safe-area-inset-bottom)+1rem)] md:bottom-6")
  linea("")
  linea("  Zonas tactiles:")
  linea("    - minimo 44x44. La raiz esta en components/ui/button.tsx, input.tsx y textarea.tsx:")
  linea("      ninguna de sus medidas llega a 44, asi que arreglar ahi corrige cientos de sitios")
  linea("    - acciones escondidas tras group-hover: en el telefono no hay raton, van visibles")
  linea("")
  linea("  Texto:")
  linea("    - cuerpo minimo 14 (el brandkit pide 15 o 16). Nada de text-xs ni text-[10px]")
  linea("    - campos de escritura: 16 o mas, o el iPhone se acerca solo al enfocar")
  linea("")
  linea("  " + "-".repeat(74))
  linea(ambar("  LO QUE ESTA MEDICION NO PUEDE VER"))
  linea("  " + "-".repeat(74))
  linea("")
  linea("  Esto es Chromium sin cabeza. Aqui la franja del notch vale CERO y no existe el")
  linea("  teclado. O sea que estas tres cosas salen limpias aunque esten rotas:")
  linea("")
  linea("    1. Encabezado aplastado contra el notch (alto fijo + relleno de zona segura).")
  linea("    2. Teclado abierto tapando el campo y el boton de guardar.")
  linea("    3. Notch por los lados con el telefono girado (se acerca con --horizontal, pero")
  linea("       la franja lateral tampoco existe aqui).")
  linea("")
  linea("  Esas tres se comprueban en el simulador de iPhone o en el telefono de verdad ANTES")
  linea("  de dar una pantalla por hecha. Verde aqui no es verde en un iPhone.")
  linea("")
  linea("  Knowledge: docs/sops/producto/03-mobile-first-os.md")
  linea("             docs/sops/producto/47-reglas-ui-contraste-legibilidad.md")
  linea("")

  if (RUTA_JSON) {
    writeFileSync(
      join(RAIZ, RUTA_JSON),
      JSON.stringify(
        { base: BASE, ancho: ANCHO, fecha: new Date().toISOString(), resultados, saltadas, inaccesibles },
        null,
        2
      )
    )
    linea(gris(`  Informe completo guardado en ${RUTA_JSON}`))
    linea("")
  }

  const hayProblemas =
    totalDesbordes + totalRecortes + totalTactiles + totalTextos + totalTapados + totalGirado > 0
  if (hayProblemas && ESTRICTO) {
    linea(rojo("  check:movil: hay pantallas que no encajan en el telefono."))
    linea("")
    process.exit(1)
  }
  if (hayProblemas) {
    linea(gris("  Sale sin error a proposito: esto MIDE, no bloquea. Con --estricto devuelve error."))
    linea("")
  } else {
    linea("  check:movil: todo lo medido encaja en el telefono.")
    linea("")
  }
}

principal().catch((e) => {
  linea("")
  linea(rojo("  check:movil se corto por un fallo inesperado:"))
  linea(`    ${e && e.message ? e.message : e}`)
  linea("")
  process.exit(1)
})
