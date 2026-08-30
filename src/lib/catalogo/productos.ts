import { createClient } from "@supabase/supabase-js"

/**
 * EL CATALOGO MANDA · fuente unica de "que productos se pueden vender".
 *
 * POR QUE EXISTE (2026-08-18):
 * La lista vivia escrita a mano dentro del endpoint de registrar venta
 * (`const PRODUCTS = [...]`). Cuando Clipper sustituyo a Media Buyer el
 * 2026-07-30 se cambio el catalogo pero NO esa lista, asi que durante 19 dias:
 *   · Clipper no se podia vender (no aparecia en el widget del closer)
 *   · quien comprara "Media Buyer Digital" activaba su cuenta y veia la
 *     formacion VACIA, sin ningun error
 * Ningun sistema se quejo porque el acceso se calculaba haciendo matematica de
 * texto sobre el nombre del producto. Ahora se resuelve contra el catalogo, y
 * lo que no esta en el catalogo no se puede vender.
 *
 * REGLA: prohibido volver a escribir una lista de productos a mano en ningun
 * archivo. El vigilante `npm run check:productos` rompe el despliegue si pasa.
 */

export type ProductoVendible = {
  /** Lo que ve el closer: "IA Integrator" */
  nombre: string
  /** Lo que decide el acceso: "ia_integrator" */
  clave: string
}

function admin() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

/** Los productos que HOY se pueden vender, sacados del catalogo real. */
export async function getProductosVendibles(): Promise<ProductoVendible[]> {
  const { data, error } = await admin()
    .from("routes")
    .select("name, product_key")
    .eq("active", true)
    .order("name")

  // FAIL-CLOSED: si el catalogo no responde, NO se devuelve una lista inventada.
  // Mejor que el closer vea "no puedo cargar los productos" a que venda algo
  // que no existe y el alumno se encuentre la pantalla vacia.
  if (error) throw new Error(`No se pudo leer el catalogo de productos: ${error.message}`)

  return (data ?? [])
    .filter((r): r is { name: string; product_key: string } => Boolean(r.name && r.product_key))
    .map((r) => ({ nombre: r.name, clave: r.product_key }))
}

/**
 * Comprueba que TODOS los productos existen en el catalogo.
 * Devuelve los que no existen (vacio = todo correcto).
 */
export async function productosQueNoExisten(productos: string[]): Promise<string[]> {
  const catalogo = await getProductosVendibles()
  const validos = new Set<string>()
  for (const p of catalogo) {
    validos.add(normalizar(p.nombre))
    validos.add(normalizar(p.clave))
  }
  return productos.filter((p) => !validos.has(normalizar(p)))
}

/** Mismo criterio que `public.clave_producto()` en la base. */
function normalizar(texto: string): string {
  return texto.trim().toLowerCase().replace(/\s+/g, "_")
}

/**
 * Las formaciones en formato "slug con guiones" (`ia-integrator`), que es como
 * las guarda `users.formacion_asignada` y `communities.slug`.
 */
export async function getSlugsFormacion(): Promise<string[]> {
  return (await getProductosVendibles()).map((p) => p.clave.replace(/_/g, "-"))
}
