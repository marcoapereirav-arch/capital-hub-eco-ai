import { createClient } from "@/lib/supabase/client"
import type { Focus } from "../types/task"

type FocusRow = {
  id: string
  name: string
  description: string | null
  start_date: string | null
  end_date: string | null
  color: string
  active: boolean
  sort_order: number
}

function rowToFocus(row: FocusRow): Focus {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    startDate: row.start_date,
    endDate: row.end_date,
    color: row.color,
    active: row.active,
    sortOrder: row.sort_order,
  }
}

export const focusesService = {
  async listFocuses(): Promise<Focus[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("focuses")
      .select("*")
      .order("sort_order", { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => rowToFocus(r as FocusRow))
  },
}
