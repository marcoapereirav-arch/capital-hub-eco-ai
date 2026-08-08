import { NextResponse } from "next/server"
import { createServiceRoleClient } from "@/lib/supabase/service"

/**
 * Recoge las medidas REALES del telefono de Marco y las guarda.
 *
 * Existe porque la franja negra de abajo se me ha escapado cinco veces: yo mido en
 * un navegador donde las zonas seguras valen CERO, asi que cada intento era una
 * hipotesis. Con esto la app manda los numeros sola en cuanto Marco la abre, y
 * dejo de adivinar.
 *
 * Es TEMPORAL. Se borra en cuanto la franja quede resuelta.
 */
export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const medidas = await req.json()
    const supabase = createServiceRoleClient()
    await supabase
      .from("app_settings")
      .upsert(
        {
          key: "diag_movil",
          value: { ...medidas, cuando: new Date().toISOString() },
          updated_at: new Date().toISOString(),
        },
        { onConflict: "key" }
      )
    return NextResponse.json({ ok: true })
  } catch {
    // Nunca puede romper la app: si falla, se calla.
    return NextResponse.json({ ok: false })
  }
}
