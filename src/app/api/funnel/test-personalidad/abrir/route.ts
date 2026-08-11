import { NextResponse } from "next/server"
import { z } from "zod"
import { cualificarPorAccesoAlTest } from "@/features/funnel-test-personalidad/cualificar"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

const schema = z.object({
  /** Slug opaco del contacto, el que puso el opt-in en la URL (?c=...). */
  c: z.string().trim().min(3).max(120).optional(),
  url: z.string().url().optional(),
})

/**
 * POST /api/funnel/test-personalidad/abrir
 *
 * El lead pulsó «Abrir el test» en /test-personalidad/test. En el funnel directo (v3)
 * ESTE es el disparador de calificación: sin email de por medio, abrir el test es la
 * señal de intención real que antes daba el clic del correo.
 *
 * Se llama con `keepalive` desde el navegador justo antes de que se abra la pestaña de
 * Equilibria, así que tiene que ser rápido y no puede fallar hacia el usuario: pase lo
 * que pase devuelve 200 y el test se abre igual. Marcar es secundario.
 */
export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const parsed = schema.safeParse(body ?? {})
  if (!parsed.success) return NextResponse.json({ ok: true, cualificado: false })

  const sourceUrl = parsed.data.url ?? new URL("/test-personalidad/test", req.url).toString()
  // conCapi: false. El evento a Meta lo manda el propio navegador (píxel + servidor con el
  // mismo identificador, y con las cookies de Meta puestas). Si lo mandara también esta
  // ruta serían dos identificadores para un solo hecho: dos conversiones donde hay una.
  const { cualificado } = await cualificarPorAccesoAlTest({
    slug: parsed.data.c ?? null,
    sourceUrl,
    via: "boton_pagina",
    conCapi: false,
  })

  return NextResponse.json({ ok: true, cualificado })
}
