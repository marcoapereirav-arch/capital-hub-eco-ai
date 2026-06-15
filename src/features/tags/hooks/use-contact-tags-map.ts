"use client"

import { useEffect, useState } from "react"
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

/**
 * Hook que carga todos los contact_tags JOIN tags y devuelve un Map.
 * Tambien expone la lista plana de tags unicos (para el filtro).
 */
export function useContactTagsMap(refreshKey?: unknown) {
  const [byContact, setByContact] = useState<Map<string, Tag[]>>(new Map())
  const [allTags, setAllTags] = useState<Tag[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      const supabase = createClient()
      const [{ data: relations }, { data: tags }] = await Promise.all([
        supabase.from("contact_tags").select("contact_id, tag:tags(*)"),
        supabase.from("tags").select("*").order("name", { ascending: true }),
      ])
      if (cancelled) return

      const map = new Map<string, Tag[]>()
      for (const row of relations ?? []) {
        const r = row as { contact_id: string; tag: TagRow | TagRow[] | null }
        const tag = Array.isArray(r.tag) ? r.tag[0] : r.tag
        if (!tag) continue
        const arr = map.get(r.contact_id) ?? []
        arr.push(rowToTag(tag))
        map.set(r.contact_id, arr)
      }
      setByContact(map)
      setAllTags((tags ?? []).map((t) => rowToTag(t as TagRow)))
      setLoading(false)
    })()
    return () => { cancelled = true }
  }, [refreshKey])

  return { byContact, allTags, loading }
}
