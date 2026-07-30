/**
 * Las rutas de carpetas dentro de Bunny. Un solo sitio decide dónde va cada cosa.
 *
 * Marco, 2026-07-30: *"tiene que haber un storage donde haya múltiples carpetas:
 * Testimonios, VSLs y Formaciones. Y dentro de Formaciones, IA Integrator,
 * Comercial Closing y Clipper. Si el formador crea un módulo que se llama
 * 'Módulo 1', debe crearse una subcarpeta que se llame 'Módulo 1', y dentro las
 * lecciones que él vaya subiendo, con el nombre de la lección."*
 *
 * El árbol queda así:
 *
 *   Testimonios/
 *   VSLs/
 *   Formaciones/
 *     IA Integrator/
 *       Módulo 1/
 *         Qué es un agente.mp4
 *
 * Por qué existe este archivo y no se arman las rutas a mano en cada sitio: el
 * nombre que escribe el formador va a parar a una ruta de red. Si en un sitio se
 * limpia y en otro no, el mismo módulo acaba con DOS carpetas ("Módulo 1" y
 * "Modulo 1 ") y el orden se rompe justo por lo que se creó. Se limpia aquí, una
 * vez, y todos usan esto.
 */

/** Las tres carpetas de primer nivel. No hay más y no se inventan otras. */
export const CARPETAS_RAIZ = ["Testimonios", "VSLs", "Formaciones"] as const

/** Los que rompen una ruta de red, o que Windows rechaza al descargar. */
const PROHIBIDOS = /[/\\:*?"<>|]/g

/**
 * Quita los invisibles que se cuelan al copiar y pegar de un documento:
 * caracteres de control, espacios de ancho cero y la marca de orden de bytes.
 *
 * Va carácter a carácter mirando su código, y NO con una expresión regular:
 * escribir un rango de invisibles dentro de un patrón obliga a meter esos
 * caracteres en el propio archivo, el archivo se guarda mal y el filtro acaba
 * haciendo lo contrario de lo que dice, borrando todo lo que NO es invisible.
 */
function sinInvisibles(texto: string): string {
  let salida = ""
  for (const caracter of texto) {
    const codigo = caracter.codePointAt(0) ?? 0
    const invisible =
      codigo < 32 || // caracteres de control
      codigo === 127 || // suprimir
      (codigo >= 0x200b && codigo <= 0x200d) || // espacios de ancho cero
      codigo === 0xfeff // marca de orden de bytes
    if (!invisible) salida += caracter
  }
  return salida
}

/**
 * Deja un nombre listo para ser una carpeta o un archivo en Bunny.
 *
 * Se conservan tildes y eñes a propósito: Marco entra a Bunny a mirar, y
 * "Módulo 1" se lee mejor que "modulo-1". Solo se quita lo que rompería la ruta.
 */
export function nombreSeguro(bruto: string, porDefecto = "Sin titulo"): string {
  const limpio = sinInvisibles(bruto ?? "")
    .replace(PROHIBIDOS, " ")
    .replace(/\s+/g, " ")
    .replace(/^\.+/, "") // un nombre que empieza por punto se esconde
    .replace(/\.+$/, "") // un punto al final lo rompe en Windows
    .trim()
    .slice(0, 120)
    .trim()
  return limpio || porDefecto
}

/** Carpeta de una formación: `Formaciones/IA Integrator`. */
export function carpetaFormacion(formacion: string): string {
  return `Formaciones/${nombreSeguro(formacion, "Sin formacion")}`
}

/** Carpeta de un módulo: `Formaciones/IA Integrator/Módulo 1`. */
export function carpetaModulo(formacion: string, modulo: string): string {
  return `${carpetaFormacion(formacion)}/${nombreSeguro(modulo, "Sin modulo")}`
}

const EXTENSIONES = ["mp4", "mov", "webm", "m4v", "mkv", "avi"]

export function extensionDe(nombreArchivo?: string): string {
  const ext = (nombreArchivo ?? "").split(".").pop()?.toLowerCase() ?? ""
  return EXTENSIONES.includes(ext) ? ext : "mp4"
}

/**
 * Archivo de una lección: `Formaciones/IA Integrator/Módulo 1/Qué es un agente.mp4`.
 *
 * La extensión sale del archivo original. Si no trae ninguna reconocible se usa
 * mp4, que es lo que Bunny devuelve al transcodificar.
 */
export function archivoLeccion(
  formacion: string,
  modulo: string,
  leccion: string,
  nombreArchivoOriginal?: string,
): string {
  const carpeta = carpetaModulo(formacion, modulo)
  return `${carpeta}/${nombreSeguro(leccion, "Sin titulo")}.${extensionDe(nombreArchivoOriginal)}`
}

/**
 * El nombre con el que se guarda el vídeo dentro de Bunny Stream (el reproductor).
 *
 * Stream NO permite carpetas dentro de carpetas: solo admite un nivel, que ellos
 * llaman "colecciones" (comprobado en su API: una colección no tiene campo de
 * padre). Así que la colección es la formación, y el nombre del vídeo lleva el
 * resto de la ruta dentro. Resultado: al ordenar por nombre, las lecciones salen
 * agrupadas por módulo y en orden, igual que en una carpeta.
 *
 *   colección "IA Integrator"
 *     Módulo 1 · 01 · Qué es un agente
 *     Módulo 1 · 02 · Tu primer flujo
 *     Módulo 2 · 01 · ...
 */
export function nombreEnStream(
  modulo: string,
  leccion: string,
  posicion?: number | null,
): string {
  const orden =
    typeof posicion === "number" && posicion > 0
      ? `${String(posicion).padStart(2, "0")} · `
      : ""
  const nombre = `${nombreSeguro(modulo, "Sin modulo")} · ${orden}${nombreSeguro(leccion, "Sin titulo")}`
  return nombre.slice(0, 200)
}

/** La colección de Stream de una formación se llama igual que la formación. */
export function coleccionDeFormacion(formacion: string): string {
  return nombreSeguro(formacion, "Sin formacion")
}
