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

const PatchSchema = z.object({
  full_name: z.string().min(1).max(200).optional(),
  email: z.string().email().max(255).optional(),
  phone: z.string().max(40).nullable().optional(),
  instagram_username: z.string().max(60).nullable().optional(),
  company: z.string().max(200).nullable().optional(),
  stage: z.string().max(50).optional(),
  pipeline_id: z.string().uuid().nullable().optional(),
  source: z.string().max(60).nullable().optional(),
  products: z.array(z.string()).optional(),
  total_revenue: z.number().nonnegative().optional(),
  total_cash_collected: z.number().nonnegative().optional(),
  tags: z.array(z.string()).optional(),
  notes: z.string().nullable().optional(),
  owner_assignee: z.string().nullable().optional(),
})

export async function GET(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const admin = getAdminClient()
  const [{ data: contact }, { data: events }, { data: bookings }] = await Promise.all([
    admin.from("contacts").select("*").eq("id", id).maybeSingle(),
    admin.from("contact_journey_events").select("*").eq("contact_id", id).order("created_at", { ascending: false }).limit(100),
    admin.from("calendar_bookings").select("id, start_at, end_at, status, meeting_url, public_token").eq("contact_id", id).order("start_at", { ascending: false }).limit(30),
  ])

  if (!contact) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json({ contact, events: events ?? [], bookings: bookings ?? [] })
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const parsed = PatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }

  const admin = getAdminClient()
  const before = await admin.from("contacts").select("stage, pipeline_id").eq("id", id).maybeSingle()

  // Si cambia el pipeline_id y el caller NO especifica stage, comprobamos que el stage
  // actual exista en el nuevo pipeline. Si no existe, lo reseteamos al primer stage
  // del nuevo pipeline. Sin esto el contacto quedaria con un stage 'huerfano' y no
  // aparece en ninguna columna del kanban.
  const patch: Record<string, unknown> = { ...parsed.data, updated_at: new Date().toISOString() }
  const movedPipeline =
    parsed.data.pipeline_id !== undefined &&
    parsed.data.pipeline_id !== before.data?.pipeline_id

  if (movedPipeline && parsed.data.stage === undefined && parsed.data.pipeline_id) {
    const { data: newStages } = await admin
      .from("pipeline_stages")
      .select("key")
      .eq("pipeline_id", parsed.data.pipeline_id)
      .order("sort_order", { ascending: true })
    const stageKeys = (newStages ?? []).map((s) => s.key as string)
    const stageStillValid = before.data?.stage && stageKeys.includes(before.data.stage)
    if (!stageStillValid) patch.stage = stageKeys[0] ?? null
  }

  const { error } = await admin.from("contacts").update(patch).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Journey: cambio de pipeline
  if (movedPipeline) {
    const [{ data: oldPipe }, { data: newPipe }] = await Promise.all([
      before.data?.pipeline_id
        ? admin.from("pipelines").select("name").eq("id", before.data.pipeline_id).maybeSingle()
        : Promise.resolve({ data: null } as { data: { name: string } | null }),
      parsed.data.pipeline_id
        ? admin.from("pipelines").select("name").eq("id", parsed.data.pipeline_id).maybeSingle()
        : Promise.resolve({ data: null } as { data: { name: string } | null }),
    ])
    await admin.from("contact_journey_events").insert({
      contact_id: id,
      type: "pipeline_change",
      title: `Movido al pipeline '${newPipe?.name ?? "(sin pipeline)"}' desde '${oldPipe?.name ?? "(sin pipeline)"}'`,
      data: {
        from_pipeline_id: before.data?.pipeline_id ?? null,
        to_pipeline_id: parsed.data.pipeline_id ?? null,
        stage_reset_to: patch.stage !== undefined ? patch.stage : null,
      },
    })
  }

  // Journey: cambio de stage (cuando NO fue por reset auto al mover pipeline)
  if (
    parsed.data.stage !== undefined &&
    parsed.data.stage !== before.data?.stage &&
    !movedPipeline
  ) {
    await admin.from("contact_journey_events").insert({
      contact_id: id,
      type: "stage_change",
      title: `Stage: ${before.data?.stage ?? "(none)"} -> ${parsed.data.stage}`,
      data: { from: before.data?.stage ?? null, to: parsed.data.stage },
    })
  }

  return NextResponse.json({ ok: true })
}

/**
 * DELETE /api/admin/contacts/[id]
 * Borra el contacto + TODO lo asociado (cascade controlado):
 * - student_invites pendientes con su email (libera el UNIQUE constraint para futuros invites)
 * - contact_journey_events del contact_id (FK contact_id on delete cascade, pero hacemos explícito)
 *
 * NO borra auth.users / public.users si el alumno ya activó su cuenta.
 * Esa decisión es separada y se hace desde /admin/users → "Eliminar cuenta".
 *
 * Decisión Marco 2026-06-18: cuando borro un contacto, quiero que se libere el email
 * para poder registrar la venta de nuevo sin chocar con invites huérfanos.
 */
export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const admin = getAdminClient()

  const { data: contact } = await admin
    .from("contacts")
    .select("email")
    .eq("id", id)
    .maybeSingle()

  if (contact?.email) {
    const emailLower = contact.email.toLowerCase().trim()

    await admin.from("student_invites").delete().ilike("email", emailLower)

    // Cleanup Supabase Storage: si el alumno activó cuenta y subió avatar,
    // borra la foto del bucket 'avatars/{auth_user_id}/' para no acumular basura.
    // Decisión Marco 2026-06-19: hacer cleanup automático al borrar contacto.
    const { data: appUser } = await admin
      .from("users")
      .select("auth_user_id")
      .eq("email", emailLower)
      .maybeSingle()

    if (appUser?.auth_user_id) {
      const { data: files } = await admin.storage.from("avatars").list(appUser.auth_user_id)
      if (files && files.length > 0) {
        const paths = files.map((f) => `${appUser.auth_user_id}/${f.name}`)
        await admin.storage.from("avatars").remove(paths)
      }
    }
  }

  await admin.from("contact_journey_events").delete().eq("contact_id", id)

  const { error } = await admin.from("contacts").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
