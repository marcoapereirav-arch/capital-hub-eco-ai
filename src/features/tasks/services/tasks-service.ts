import { createClient } from "@/lib/supabase/client"
import type { Task, ParaItem, GTDStatus, Priority, Assignee, ParaType } from "../types/task"

type TaskRow = {
  id: string
  title: string
  description: string
  status: GTDStatus
  priority: Priority
  assignee: Assignee
  para_id: string | null
  due_date: string | null
  created_at: string
  updated_at: string
  completed_at: string | null
}

type ParaRow = {
  id: string
  name: string
  type: ParaType
}

function rowToTask(row: TaskRow): Task {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    paraId: row.para_id,
    dueDate: row.due_date,
    createdAt: row.created_at,
    completedAt: row.completed_at,
  }
}

function rowToPara(row: ParaRow): ParaItem {
  return { id: row.id, name: row.name, type: row.type }
}

function taskToInsert(task: Omit<Task, "id" | "createdAt" | "completedAt">) {
  return {
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    assignee: task.assignee,
    para_id: task.paraId,
    due_date: task.dueDate,
  }
}

function taskUpdatesToRow(updates: Partial<Task>): Record<string, unknown> {
  const out: Record<string, unknown> = {}
  if (updates.title !== undefined) out.title = updates.title
  if (updates.description !== undefined) out.description = updates.description
  if (updates.status !== undefined) out.status = updates.status
  if (updates.priority !== undefined) out.priority = updates.priority
  if (updates.assignee !== undefined) out.assignee = updates.assignee
  if (updates.paraId !== undefined) out.para_id = updates.paraId
  if (updates.dueDate !== undefined) out.due_date = updates.dueDate
  if (updates.completedAt !== undefined) out.completed_at = updates.completedAt
  return out
}

export const tasksService = {
  async listTasks(): Promise<Task[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .order("created_at", { ascending: false })
    if (error) throw error
    return (data ?? []).map((r) => rowToTask(r as TaskRow))
  },

  async listParaItems(): Promise<ParaItem[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("para_items")
      .select("*")
      .order("created_at", { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => rowToPara(r as ParaRow))
  },

  async addTask(task: Omit<Task, "id" | "createdAt" | "completedAt">): Promise<Task> {
    const supabase = createClient()
    const { data: userData } = await supabase.auth.getUser()
    const insert = { ...taskToInsert(task), created_by: userData.user?.id ?? null }
    const { data, error } = await supabase.from("tasks").insert(insert).select("*").single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  },

  async updateTask(id: string, updates: Partial<Task>): Promise<Task> {
    const supabase = createClient()
    const patch = taskUpdatesToRow(updates)
    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", id)
      .select("*")
      .single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  },

  async deleteTask(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("tasks").delete().eq("id", id)
    if (error) throw error
  },

  async addParaItem(item: Omit<ParaItem, "id">): Promise<ParaItem> {
    const supabase = createClient()
    const id = `para_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
    const { data, error } = await supabase
      .from("para_items")
      .insert({ id, name: item.name, type: item.type })
      .select("*")
      .single()
    if (error) throw error
    return rowToPara(data as ParaRow)
  },

  async deleteParaItem(id: string): Promise<void> {
    const supabase = createClient()
    const { error } = await supabase.from("para_items").delete().eq("id", id)
    if (error) throw error
  },
}

export type RealtimeHandlers = {
  onTaskInsert: (task: Task) => void
  onTaskUpdate: (task: Task) => void
  onTaskDelete: (id: string) => void
  onParaInsert: (item: ParaItem) => void
  onParaDelete: (id: string) => void
}

export function subscribeRealtime(handlers: RealtimeHandlers) {
  const supabase = createClient()

  const channel = supabase
    .channel("tasks-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tasks" },
      (payload) => handlers.onTaskInsert(rowToTask(payload.new as TaskRow))
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "tasks" },
      (payload) => handlers.onTaskUpdate(rowToTask(payload.new as TaskRow))
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "tasks" },
      (payload) => handlers.onTaskDelete((payload.old as { id: string }).id)
    )
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "para_items" },
      (payload) => handlers.onParaInsert(rowToPara(payload.new as ParaRow))
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "para_items" },
      (payload) => handlers.onParaDelete((payload.old as { id: string }).id)
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}
