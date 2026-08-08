import { NextResponse } from "next/server"
import { createClient as createServiceClient } from "@supabase/supabase-js"
import { z } from "zod"
import { normalizarFuente, registrarVisita } from "@/lib/atribucion/atribucion"
import { funnelFromUrl } from "@/lib/meta/funnel-tracking"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({
  source: z.string().max(80).trim(),
  /** Ruta publica donde cayo la persona. De aqui se saca el funnel. */
  path: z.string().max(300).trim(),
  /** Identificador de navegador, para no contar diez veces a la misma persona. */
  visitor: z.string().max(80).trim().optional(),
})

/**
 * POST /api/afiliados/visita
 *
 * Registra que alguien entro por el link de un afiliado. Se dispara solo, desde el layout
 * publico, en cuanto la URL trae `utm_source`. Por eso funciona en CUALQUIER funnel, tambien
 * en los que no tienen formulario (LT8, MIFGE): sin esto, un link a esas paginas seria
 * invisible del todo.
 *
 * Solo se guarda si el `utm_source` corresponde a un afiliado dado de alta. Asi nadie puede
 * llenar la tabla inventando fuentes desde fuera.
 */
export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null))
  if (!parsed.success) return NextResponse.json({ ok: false }, { status: 400 })

  const source = normalizarFuente(parsed.data.source)
  if (!source) return NextResponse.json({ ok: false }, { status: 400 })

  const admin = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  )

  // Solo afiliados de verdad. Un utm_source de una campana de Meta no es un afiliado.
  const { data: afiliado } = await admin
    .from("affiliates")
    .select("slug")
    .eq("slug", source)
    .maybeSingle()
  if (!afiliado) return NextResponse.json({ ok: true, ignorada: true })

  // El funnel sale del catalogo unico a partir de la ruta. Un funnel nuevo entra solo.
  const funnelSlug = funnelFromUrl(`https://capitalhubapp.com${parsed.data.path}`)

  await registrarVisita(admin, {
    source,
    funnelSlug,
    path: parsed.data.path,
    visitorKey: parsed.data.visitor ?? null,
  })

  return NextResponse.json({ ok: true })
}
