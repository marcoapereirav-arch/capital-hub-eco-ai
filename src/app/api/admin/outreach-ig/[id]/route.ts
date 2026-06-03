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
  status: z.enum(["to_contact", "messaged", "replied", "phone_got", "handed_off", "discarded"]).optional(),
  phone: z.string().max(40).nullable().optional(),
  full_name: z.string().max(200).nullable().optional(),
  reply_text: z.string().nullable().optional(),
  message_template_used: z.string().nullable().optional(),
  closer_assigned: z.string().max(60).nullable().optional(),
  notes_assigned: z.string().nullable().optional(),
})

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const parsed = PatchSchema.safeParse(await req.json())
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid", issues: parsed.error.flatten().fieldErrors }, { status: 400 })
  }
  const data = parsed.data
  const admin = getAdminClient()

  // Side effects según transición
  const patch: Record<string, unknown> = { ...data, updated_at: new Date().toISOString() }
  if (data.status === "messaged") patch.messaged_at = new Date().toISOString()
  if (data.status === "replied" && !data.reply_text) patch.reply_at = new Date().toISOString()
  if (data.status === "handed_off") {
    patch.handed_off_at = new Date().toISOString()
    // Si tiene phone, crear contacto handoff
    const { data: lead } = await admin
      .from("outreach_ig_leads")
      .select("ig_username, full_name, phone, closer_assigned, notes_assigned")
      .eq("id", id)
      .maybeSingle()
    if (lead && lead.phone) {
      const { data: existingContact } = await admin
        .from("contacts")
        .select("id")
        .eq("phone", lead.phone)
        .maybeSingle()
      let contactId = existingContact?.id
      if (!contactId) {
        const { data: created } = await admin
          .from("contacts")
          .insert({
            full_name: lead.full_name ?? lead.ig_username,
            email: `${lead.ig_username}@ig.placeholder`, // placeholder; closer lo edita
            phone: lead.phone,
            stage: "contacted",
            source: "ig_cold_outreach",
            owner_assignee: lead.closer_assigned,
            notes: lead.notes_assigned,
          })
          .select("id")
          .single()
        contactId = created?.id
      }
      if (contactId) {
        patch.handed_off_to_contact_id = contactId
        await admin.from("contact_journey_events").insert({
          contact_id: contactId,
          type: "ig_outreach_handoff",
          title: `Handoff desde cold outreach IG (@${lead.ig_username})`,
          description: lead.notes_assigned,
        })
      }
    }
  }

  const { error } = await admin.from("outreach_ig_leads").update(patch).eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const supabase = await createServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

  const { id } = await ctx.params
  const admin = getAdminClient()
  const { error } = await admin.from("outreach_ig_leads").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ ok: true })
}
