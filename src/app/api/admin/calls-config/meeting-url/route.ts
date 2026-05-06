import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createClient as createServerClient } from "@/lib/supabase/server"
import { createClient } from "@supabase/supabase-js"

export const dynamic = "force-dynamic"
export const runtime = "nodejs"

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  )
}

const Schema = z.object({
  meeting_url: z.string().url("URL inválida").max(500).nullable(),
})

/**
 * GET /api/admin/calls-config/meeting-url
 * Devuelve el meeting URL global (Zoom estatico de Adrian).
 *
 * PUT /api/admin/calls-config/meeting-url
 * { meeting_url: "https://us05web.zoom.us/j/..." | null }
 * Guarda el URL que se inyecta en cada call nueva como meeting_url.
 */

export async function GET() {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const admin = getAdminClient()
  const { data, error } = await admin
    .from("calls_availability")
    .select("default_meeting_url")
    .eq("id", 1)
    .single()
  if (error) return NextResponse.json({ error: "Read failed" }, { status: 500 })

  return NextResponse.json({ meeting_url: data?.default_meeting_url ?? null })
}

export async function PUT(req: NextRequest) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const parsed = Schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Datos invalidos", issues: parsed.error.flatten().fieldErrors },
      { status: 400 }
    )
  }

  const admin = getAdminClient()
  const { error } = await admin
    .from("calls_availability")
    .update({ default_meeting_url: parsed.data.meeting_url })
    .eq("id", 1)

  if (error) return NextResponse.json({ error: "Update failed" }, { status: 500 })
  return NextResponse.json({ ok: true, meeting_url: parsed.data.meeting_url })
}
