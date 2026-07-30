import "server-only"

/**
 * Bunny Storage: el archivo ordenado de todos los vídeos de Capital Hub.
 *
 * Por qué existe además de Bunny Stream (`bunny.ts`):
 *
 *   Stream es el REPRODUCTOR. Transcodifica y sirve el vídeo al alumno, pero
 *   solo admite UN nivel de carpetas (sus "colecciones", que no tienen padre:
 *   comprobado en su API). No puede dar el árbol que pidió Marco.
 *
 *   Storage es el ARCHIVO. Tiene carpetas reales, todo lo hondas que haga falta,
 *   y se crean solas al subir un archivo dentro. Aquí vive el árbol:
 *
 *     Testimonios/
 *     VSLs/
 *     Formaciones/IA Integrator/Módulo 1/Qué es un agente.mp4
 *
 * De regalo, esto es la primera copia de seguridad real de los vídeos: hasta
 * hoy, si Bunny Stream perdía uno, no había otro sitio de donde sacarlo.
 *
 * Variables de entorno (`.env.local` del OS + Vercel):
 *   BUNNY_STORAGE_ZONE      nombre de la Storage Zone
 *   BUNNY_STORAGE_PASSWORD  su contraseña (pestaña "FTP & API Access")
 *   BUNNY_STORAGE_HOST      host de la región, por defecto storage.bunnycdn.com
 *
 * Doc: https://docs.bunny.net/api-reference/storage
 */

export type ArchivoBunny = {
  ObjectName: string
  Path: string
  IsDirectory: boolean
  Length: number
  LastChanged: string
}

/** Nombre del archivo que mantiene viva una carpeta vacía. Ver `asegurarCarpeta`. */
export const MARCADOR = "_leeme.txt"

function config() {
  const zona = process.env.BUNNY_STORAGE_ZONE
  const clave = process.env.BUNNY_STORAGE_PASSWORD
  const host = process.env.BUNNY_STORAGE_HOST || "storage.bunnycdn.com"
  if (!zona || !clave) {
    throw new Error(
      "Bunny Storage sin configurar. Faltan BUNNY_STORAGE_ZONE y/o BUNNY_STORAGE_PASSWORD.",
    )
  }
  return { zona, clave, host }
}

/** ¿Está configurado? Sirve para no romper nada mientras faltan las claves. */
export function hayStorage(): boolean {
  return Boolean(process.env.BUNNY_STORAGE_ZONE && process.env.BUNNY_STORAGE_PASSWORD)
}

/**
 * Arma la URL de una ruta. Cada tramo se codifica por separado para que los
 * espacios y las tildes de "Módulo 1" viajen bien sin que la barra se escape.
 */
function url(ruta: string, esCarpeta = false): string {
  const { zona, host } = config()
  const tramos = ruta.split("/").filter(Boolean).map(encodeURIComponent)
  return `https://${host}/${zona}/${tramos.join("/")}${esCarpeta ? "/" : ""}`
}

async function pedir(destino: string, init: RequestInit): Promise<Response> {
  const { clave } = config()
  return fetch(destino, {
    ...init,
    headers: { AccessKey: clave, ...(init.headers ?? {}) },
    cache: "no-store",
  })
}

/** Lo que hay dentro de una carpeta. Carpeta que no existe devuelve lista vacía. */
export async function listar(carpeta: string): Promise<ArchivoBunny[]> {
  const res = await pedir(url(carpeta, true), { method: "GET" })
  if (res.status === 404) return []
  if (!res.ok) throw new Error(`Bunny Storage listar ${res.status}: ${await textoDe(res)}`)
  return (await res.json()) as ArchivoBunny[]
}

/**
 * Sube un archivo. Las carpetas intermedias se crean solas, así que subir a
 * `Formaciones/IA Integrator/Módulo 1/clase.mp4` crea las tres de camino.
 */
export async function subir(
  ruta: string,
  cuerpo: BodyInit,
  opciones: { longitud?: number } = {},
): Promise<void> {
  const res = await pedir(url(ruta), {
    method: "PUT",
    body: cuerpo,
    headers: {
      "Content-Type": "application/octet-stream",
      ...(opciones.longitud ? { "Content-Length": String(opciones.longitud) } : {}),
    },
    // Necesario en Node para mandar el cuerpo por partes en vez de entero en
    // memoria: un vídeo de 2 GB no cabe en la memoria de la función.
    duplex: "half",
  } as RequestInit)
  if (!res.ok) throw new Error(`Bunny Storage subir ${res.status}: ${await textoDe(res)}`)
}

export async function borrar(ruta: string, esCarpeta = false): Promise<void> {
  const res = await pedir(url(ruta, esCarpeta), { method: "DELETE" })
  // 404 es exactamente lo que queríamos: ya no está.
  if (!res.ok && res.status !== 404) {
    throw new Error(`Bunny Storage borrar ${res.status}: ${await textoDe(res)}`)
  }
}

export async function existe(ruta: string): Promise<boolean> {
  const partes = ruta.split("/").filter(Boolean)
  const nombre = partes.pop()
  if (!nombre) return false
  const dentro = await listar(partes.join("/"))
  return dentro.some((a) => a.ObjectName === nombre)
}

/**
 * Se asegura de que una carpeta exista y se VEA en el panel de Bunny.
 *
 * En Bunny Storage una carpeta no es una cosa: es el trozo de ruta de los
 * archivos que tiene dentro. Una carpeta vacía, por tanto, no existe y no se ve.
 * Para que Marco entre y vea el árbol completo desde el primer día aunque
 * todavía no haya subido nada, se deja dentro un archivo de texto que además
 * explica qué va ahí. Cuando llega el primer vídeo de verdad, ese archivo se
 * borra solo (ver `subirLimpiando`).
 */
export async function asegurarCarpeta(carpeta: string, nota: string): Promise<void> {
  const dentro = await listar(carpeta)
  if (dentro.length > 0) return
  await subir(`${carpeta}/${MARCADOR}`, nota)
}

/** Sube un archivo y retira el marcador de carpeta vacía, si quedaba alguno. */
export async function subirLimpiando(
  ruta: string,
  cuerpo: BodyInit,
  opciones: { longitud?: number } = {},
): Promise<void> {
  await subir(ruta, cuerpo, opciones)
  const carpeta = ruta.split("/").slice(0, -1).join("/")
  // Que falle el borrado del marcador no puede tumbar una subida que ya salió
  // bien: como mucho queda un archivo de texto de sobra.
  await borrar(`${carpeta}/${MARCADOR}`).catch(() => {})
}

/**
 * Copia un vídeo que ya está en Bunny Stream a su sitio del archivo.
 *
 * Se pasa el flujo de bytes directamente de una respuesta a la otra: no se
 * guarda el vídeo entero en memoria ni en disco en ningún momento.
 */
export async function copiarDesdeUrl(
  origen: string,
  destino: string,
  cabeceras: Record<string, string> = {},
): Promise<void> {
  const res = await fetch(origen, { cache: "no-store", headers: cabeceras })
  await volcar(res, destino)
}

/** Igual que `copiarDesdeUrl` pero el origen es otra ruta del propio archivo. */
async function copiarDentro(desde: string, hacia: string): Promise<void> {
  // Leer del propio Storage exige la clave: si se usa un `fetch` pelado
  // devuelve 401 y el movimiento se pierde en silencio.
  const res = await pedir(url(desde), { method: "GET" })
  await volcar(res, hacia)
}

async function volcar(res: Response, destino: string): Promise<void> {
  if (!res.ok || !res.body) {
    throw new Error(`No se pudo leer el vídeo de origen (${res.status})`)
  }
  const largo = res.headers.get("content-length")
  await subirLimpiando(destino, res.body, {
    ...(largo ? { longitud: Number(largo) } : {}),
  })
}

/**
 * Mueve una carpeta entera. Se usa cuando el formador renombra un módulo: si la
 * carpeta no siguiera al nombre, el orden se rompería justo por lo que se creó.
 *
 * Storage no sabe renombrar, así que cada archivo se vuelve a subir en el nombre
 * nuevo y se borra del viejo. Devuelve cuántos movió.
 */
export async function moverCarpeta(desde: string, hacia: string): Promise<number> {
  if (desde === hacia) return 0
  const dentro = await listar(desde)
  let movidos = 0
  for (const archivo of dentro) {
    if (archivo.IsDirectory) {
      movidos += await moverCarpeta(`${desde}/${archivo.ObjectName}`, `${hacia}/${archivo.ObjectName}`)
      continue
    }
    await copiarDentro(`${desde}/${archivo.ObjectName}`, `${hacia}/${archivo.ObjectName}`)
    await borrar(`${desde}/${archivo.ObjectName}`)
    movidos += 1
  }
  await borrar(desde, true).catch(() => {})
  return movidos
}

async function textoDe(res: Response): Promise<string> {
  return await res.text().catch(() => "")
}
