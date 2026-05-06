"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { createAdminClient } from "@/lib/supabase/admin"

const SlugRegex = /^[a-z0-9-]+$/

const CreateSchema = z.object({
  slug: z.string().regex(SlugRegex, "Slug solo puede tener minúsculas, números y guiones").min(2).max(64),
  name: z.string().min(2).max(120),
  description: z.string().optional().nullable(),
  delivery_kind: z.enum(["static", "dynamic"]),
  delivery_asset_url: z.string().url().optional().nullable(),
  delivery_route: z.string().optional().nullable(),
  manychat_keywords: z.array(z.string().min(1)).default([]),
  active: z.boolean().default(true),
})

const UpdateSchema = CreateSchema.partial().extend({
  id: z.string().uuid(),
})

function normalizeKeywords(keywords: string[]): string[] {
  return Array.from(
    new Set(
      keywords
        .map((k) => k.trim().toLowerCase())
        .filter((k) => k.length > 0)
    )
  )
}

export async function createLeadMagnet(
  raw: unknown
): Promise<{ ok: boolean; id?: string; error?: string }> {
  const parsed = CreateSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const input = parsed.data

  if (input.delivery_kind === "static" && !input.delivery_asset_url) {
    return { ok: false, error: "Static delivery requiere delivery_asset_url" }
  }
  if (input.delivery_kind === "dynamic" && !input.delivery_route) {
    return { ok: false, error: "Dynamic delivery requiere delivery_route" }
  }

  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from("lead_magnets")
    .insert({
      slug: input.slug,
      name: input.name,
      description: input.description ?? null,
      delivery_kind: input.delivery_kind,
      delivery_asset_url: input.delivery_asset_url ?? null,
      delivery_route: input.delivery_route ?? null,
      manychat_keywords: normalizeKeywords(input.manychat_keywords),
      active: input.active,
    })
    .select("id")
    .single()

  if (error || !data) {
    return { ok: false, error: error?.message ?? "Insert failed" }
  }

  revalidatePath("/webs/lead-magnets")
  return { ok: true, id: data.id }
}

export async function updateLeadMagnet(
  raw: unknown
): Promise<{ ok: boolean; error?: string }> {
  const parsed = UpdateSchema.safeParse(raw)
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" }
  }
  const { id, manychat_keywords, ...rest } = parsed.data

  const updates: Record<string, unknown> = { ...rest }
  if (manychat_keywords) {
    updates.manychat_keywords = normalizeKeywords(manychat_keywords)
  }

  const supabase = createAdminClient()
  const { error } = await supabase.from("lead_magnets").update(updates).eq("id", id)
  if (error) {
    return { ok: false, error: error.message }
  }

  revalidatePath("/webs/lead-magnets")
  return { ok: true }
}

export async function toggleLeadMagnetActive(
  id: string,
  active: boolean
): Promise<{ ok: boolean; error?: string }> {
  const supabase = createAdminClient()
  const { error } = await supabase.from("lead_magnets").update({ active }).eq("id", id)
  if (error) return { ok: false, error: error.message }
  revalidatePath("/webs/lead-magnets")
  return { ok: true }
}

export async function deleteLeadMagnet(
  id: string
): Promise<{ ok: boolean; error?: string }> {
  // Si hay deliveries asociadas, ON DELETE RESTRICT en lead_magnet_deliveries.lead_magnet_id
  // bloquea el delete. Esto es deliberado — no borrar si hay opt-ins reales.
  // Para "archivar" un LM con datos, usar toggleLeadMagnetActive(false).
  const supabase = createAdminClient()
  const { error } = await supabase.from("lead_magnets").delete().eq("id", id)
  if (error) {
    if (error.code === "23503") {
      return {
        ok: false,
        error:
          "Este lead magnet ya tiene opt-ins registrados. Desactívalo en lugar de borrarlo.",
      }
    }
    return { ok: false, error: error.message }
  }
  revalidatePath("/webs/lead-magnets")
  return { ok: true }
}
