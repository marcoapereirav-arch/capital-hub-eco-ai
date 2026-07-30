import "server-only"
import { asegurarCarpeta, hayStorage, listar } from "@/lib/bunny-storage"
import { asegurarColeccion, listarColecciones } from "@/lib/bunny"
import { CARPETAS_RAIZ, carpetaFormacion, coleccionDeFormacion } from "@/lib/bunny-rutas"

/**
 * Monta el árbol base de Bunny. Se puede llamar mil veces: lo que ya existe ni
 * se toca ni se duplica.
 *
 *   Testimonios/
 *   VSLs/
 *   Formaciones/
 *     IA Integrator/
 *     Comercial Closing/
 *     Clipper/
 *
 * Lo llama el reloj del archivado en cada vuelta, a propósito: así, en cuanto
 * las claves de Bunny Storage estén puestas, el árbol aparece solo sin que nadie
 * tenga que pulsar nada. Es barato porque cada paso mira antes si hace falta.
 */

/** Las tres formaciones. No hay más y nadie crea más (decisión de Marco). */
export const FORMACIONES = ["IA Integrator", "Comercial Closing", "Clipper"] as const

const NOTAS: Record<string, string> = {
  Testimonios: "Aqui van los videos de testimonios de alumnos.",
  VSLs: "Aqui van los videos de venta (VSL) de las webs y los funnels.",
  Formaciones: "Una carpeta por formacion. Dentro de cada una, una carpeta por modulo.",
}

export async function asegurarEstructura(): Promise<{ creadas: string[] }> {
  if (!hayStorage()) return { creadas: [] }

  const creadas: string[] = []

  for (const raiz of CARPETAS_RAIZ) {
    if ((await listar(raiz)).length > 0) continue
    await asegurarCarpeta(raiz, NOTAS[raiz] ?? "")
    creadas.push(raiz)
  }

  for (const formacion of FORMACIONES) {
    const ruta = carpetaFormacion(formacion)
    if ((await listar(ruta)).length > 0) continue
    await asegurarCarpeta(
      ruta,
      `Aqui va el material de ${formacion}. Cada modulo tiene su propia carpeta.`,
    )
    creadas.push(ruta)
  }

  return { creadas }
}

/**
 * Lo mismo pero dentro del reproductor: una colección por formación, que es lo
 * máximo que Bunny Stream permite (no admite carpetas dentro de carpetas).
 *
 * Se pide la lista UNA vez y se compara aquí, en vez de dejar que cada
 * `asegurarColeccion` la vuelva a pedir: son tres llamadas de red menos en cada
 * vuelta del reloj.
 */
export async function asegurarColecciones(): Promise<{ creadas: string[] }> {
  const creadas: string[] = []
  const existentes = await listarColecciones().catch(() => null)
  if (existentes === null) return { creadas }

  const yaEstan = new Set(existentes.map((c) => c.name.trim().toLowerCase()))
  for (const formacion of FORMACIONES) {
    const nombre = coleccionDeFormacion(formacion)
    if (yaEstan.has(nombre.trim().toLowerCase())) continue
    await asegurarColeccion(nombre).catch(() => {})
    creadas.push(nombre)
  }
  return { creadas }
}
