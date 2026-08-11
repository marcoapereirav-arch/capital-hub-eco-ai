import { createClient } from "@/lib/supabase/client"
import type { Task, OsUser, Priority, TaskStatus } from "../types/task"

type TaskRow = {
  id: string
  title: string
  description: string | null
  status: TaskStatus
  priority: Priority
  assignee_id: string | null
  created_at: string
  completed_at: string | null
}

type ProfileRow = {
  id: string
  full_name: string | null
  email: string
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    assigneeId: row.assignee_id,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

function updatesToRow(updates: Partial<Task>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (updates.title !== undefined) out.title = updates.title
  if (updates.description !== undefined) out.description = updates.description
  if (updates.priority !== undefined) out.priority = updates.priority
  if (updates.assigneeId !== undefined) out.assignee_id = updates.assigneeId
  if (updates.status !== undefined) {
    out.status = updates.status
    // La fecha de completado la lleva el sistema, no el usuario: si se marca hecha se
    // sella, y si vuelve a pendiente o se archiva se borra. Asi el historial no miente.
    out.completed_at = updates.status === "hecha" ? new Date().toISOString() : null
  }
  return out
}

export const tasksService = {
  async listTasks(): Promise<Task[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .select("id, title, description, status, priority, assignee_id, created_at, completed_at")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => rowToTask(r as TaskRow))
  },

  /**
   * Las personas que pueden ser responsables: los usuarios ACTIVOS del OS.
   * No hay lista escrita a mano — quien entra al OS aparece aqui solo.
   */
  async listOsUsers(): Promise<OsUser[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email")
      .eq("active", true)
      .order("full_name", { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => {
      const row = r as ProfileRow
      return { id: row.id, name: row.full_name?.trim() || row.email, email: row.email }
    })
  },

  async addTask(input: {
    title: string
    description?: string
    priority?: Priority
    assigneeId?: string | null
  }): Promise<Task> {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from("tasks")
      .insert({
        title: input.title,
        description: input.description ?? "",
        priority: input.priority ?? "P2",
        assignee_id: input.assigneeId ?? null,
        status: "pendiente",
        created_by: userData.user?.id ?? null,
      })
      .select("id, title, description, status, priority, assignee_id, created_at, completed_at")
      .single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .update(updatesToRow(updates))
      .eq("id", id)
      .select("id, title, description, status, priority, assignee_id, created_at, completed_at")
      .single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  },

  async deleteTask(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) throw error
  },
}

export type RealtimeHandlers = {
  onInsert: (task: Task) => void
  onUpdate: (task: Task) => void
  onDelete: (id: string) => void
}

/** Un cambio en cualquier pantalla abierta se ve en todas en menos de un segundo. */
export function subscribeRealtime(handlers: RealtimeHandlers) {
  const supabase = createClient()

  const channel = supabase
    .channel("tasks-realtime")
    .on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, (payload) =>
      handlers.onInsert(rowToTask(payload.new as TaskRow))
    )
    .on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" }, (payload) =>
      handlers.onUpdate(rowToTask(payload.new as TaskRow))
    )
    .on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks" }, (payload) =>
      handlers.onDelete((payload.old as { id: string }).id)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
