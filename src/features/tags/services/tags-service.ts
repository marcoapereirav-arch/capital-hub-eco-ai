import { createClient } from "@/lib/supabase/client"
import type { Tag } from "../types/tag"

type TagRow = {
  id: string
  name: string
  color: string
  description: string | null
  created_at: string
  created_by: string | null
}

function rowToTag(r: TagRow): Tag {
  return {
    id: r.id,
    name: r.name,
    color: r.color,
    description: r.description,
    createdAt: r.created_at,
    createdBy: r.created_by,
  }
}

export const tagsService = {
  async list(): Promise<Tag[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tags")
      .select("*")
      .order("name", { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => rowToTag(r as TagRow))
  },

  async create(input: { name: string; color: string; description?: string }): Promise<Tag> {
    const res = await fetch("/api/admin/tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Error creando tag: ${res.status}`)
    return res.json()
  },

  async update(id: string, patch: Partial<Pick<Tag, "name" | "color" | "description">>): Promise<Tag> {
    const res = await fetch(`/api/admin/tags/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error(`Error actualizando tag: ${res.status}`)
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/admin/tags/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error(`Error borrando tag: ${res.status}`)
  },

  async listForContact(contactId: string): Promise<Tag[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("contact_tags")
      .select("tag:tags(*)")
      .eq("contact_id", contactId)
    if (error) throw error
    return (data ?? [])
      .flatMap((r) => {
        const t = (r as { tag: TagRow | TagRow[] | null }).tag
        return Array.isArray(t) ? t : t ? [t] : []
      })
      .map(rowToTag)
  },

  async assignToContact(contactId: string, tagId: string): Promise<void> {
    const res = await fetch(`/api/admin/contacts/${contactId}/tags`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tagId }),
    })
    if (!res.ok) throw new Error(`Error asignando tag: ${res.status}`)
  },

  async removeFromContact(contactId: string, tagId: string): Promise<void> {
    const res = await fetch(`/api/admin/contacts/${contactId}/tags/${tagId}`, {
      method: "DELETE",
    })
    if (!res.ok) throw new Error(`Error quitando tag: ${res.status}`)
  },
}
