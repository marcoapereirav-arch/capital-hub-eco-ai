import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient } from "@/lib/supabase/server"
import {
  alargarToken,
  borrarMarketingToken,
  getMarketingTokenInfo,
  guardarMarketingToken,
  probarToken,
  taparToken,
} from "@/lib/meta/marketing-token"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

/**
 * La llave para LEER las campañas de Meta, guardada desde la pantalla de Ads.
 *
 * Antes esto solo se podía poner editando un fichero del proyecto y desplegando. Ahora se
 * pega en Ads, Ajustes, y el servidor hace el resto: la alarga, la prueba contra la cuenta
 * publicitaria de verdad y solo la guarda si funciona.
 *
 * La llave NUNCA vuelve al navegador: solo sale tapada.
 */

const Guardar = z.object({
  token: z.string().min(20, "Eso no parece una llave de Meta").max(1000),
})

async function esAdmin() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  return Boolean(user)
}

export async function GET() {
  if (!(await esAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  return NextResponse.json(await getMarketingTokenInfo())
}

export async function POST(req: NextRequest) {
  if (!(await esAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const body = await req.json().catch(() => null)
  const parsed = Guardar.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Llave no válida" },
      { status: 400 }
    )
  }

  const pegada = parsed.data.token.trim()

  // 1. Alargarla. Una llave sacada a mano dura un par de horas; así pasa a durar meses.
  //    Las de usuario del sistema no caducan y Meta rechaza el cambio: se sigue con la
  //    original, que es lo correcto.
  const { token, expiresAt, alargado } = await alargarToken(pegada)

  // 2. Probarla de verdad ANTES de guardarla. Guardar una llave rota es peor que no
  //    guardar nada: parece resuelto y el fallo aparece días después.
  const prueba = await probarToken(token)
  if (!prueba.ok) {
    return NextResponse.json(
      {
        error: "La llave no puede leer tu cuenta publicitaria",
        detalle: prueba.error,
      },
      { status: 400 }
    )
  }

  await guardarMarketingToken({ token, expiresAt, savedAt: new Date().toISOString() })

  return NextResponse.json({
    ok: true,
    tapado: taparToken(token),
    expiresAt,
    alargado,
    cuenta: prueba.cuenta ?? null,
  })
}

export async function DELETE() {
  if (!(await esAdmin())) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  await borrarMarketingToken()
  return NextResponse.json({ ok: true })
}
