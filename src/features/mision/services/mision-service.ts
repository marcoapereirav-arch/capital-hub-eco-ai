import { createClient } from "@/lib/supabase/client"
import type { LaunchPhase, MisionTask, MisionAssignee } from "../types/mision"
import type { GTDStatus, Priority } from "@/features/tasks/types/task"

export const MISION_PARA_ID = "p_mision_producto_terminado"

type PhaseRow = {
  id: string
  slug: string
  name: string
  description: string
  order: number
  target_date: string
}

type TaskRow = {
  id: string
  title: string
  description: string
  status: GTDStatus
  priority: Priority
  assignee: MisionAssignee
  para_id: string | null
  due_date: string | null
  depends_on: string[] | null
  is_in_progress: boolean | null
  completed_at: string | null
  launch_phase_id: string | null
  launch_block: string | null
}

export function rowToTask(row: TaskRow): MisionTask {
  return {
    id: row.id,
    title: row.title,
    description: row.description ?? "",
    status: row.status,
    priority: row.priority,
    assignee: row.assignee,
    paraId: row.para_id,
    dueDate: row.due_date,
    dependsOn: row.depends_on ?? [],
    isInProgress: !!row.is_in_progress,
    completedAt: row.completed_at,
    launchPhaseId: row.launch_phase_id,
    launchBlock: row.launch_block,
  }
}

export function rowToPhase(row: PhaseRow): LaunchPhase {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description ?? "",
    order: row.order,
    targetDate: row.target_date,
  }
}

export type MisionPhaseRow = PhaseRow
export type MisionTaskRow = TaskRow

export const misionService = {
  async listTasks(): Promise<MisionTask[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("para_id", MISION_PARA_ID)
    if (error) throw error
    return (data ?? []).map((r) => rowToTask(r as TaskRow))
  },

  async listPhases(): Promise<LaunchPhase[]> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("launch_phases")
      .select("*")
      .order("order", { ascending: true })
    if (error) throw error
    return (data ?? []).map((r) => rowToPhase(r as PhaseRow))
  },

  async setStatus(taskId: string, status: GTDStatus): Promise<MisionTask> {
    const supabase = createClient()
    const patch: Record<string, unknown> = { status }
    if (status === "done") {
      patch.completed_at = new Date().toISOString()
      patch.is_in_progress = false
    } else {
      patch.completed_at = null
    }
    const { data, error } = await supabase
      .from("tasks")
      .update(patch)
      .eq("id", taskId)
      .select("*")
      .single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  },

  async toggleInProgress(taskId: string, value: boolean): Promise<MisionTask> {
    const supabase = createClient()
    const { data, error } = await supabase
      .from("tasks")
      .update({ is_in_progress: value, status: value ? "next" : undefined })
      .eq("id", taskId)
      .select("*")
      .single()
    if (error) throw error
    return rowToTask(data as TaskRow)
  },
}

export type RealtimeHandlers = {
  onTaskInsert: (task: MisionTask) => void
  onTaskUpdate: (task: MisionTask) => void
  onTaskDelete: (id: string) => void
}

export function subscribeMisionRealtime(handlers: RealtimeHandlers) {
  const supabase = createClient()
  const channel = supabase
    .channel("mision-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "tasks", filter: `para_id=eq.${MISION_PARA_ID}` },
      (payload) => handlers.onTaskInsert(rowToTask(payload.new as TaskRow))
    )
    .on(
      "postgres_changes",
      { event: "UPDATE", schema: "public", table: "tasks", filter: `para_id=eq.${MISION_PARA_ID}` },
      (payload) => handlers.onTaskUpdate(rowToTask(payload.new as TaskRow))
    )
    .on(
      "postgres_changes",
      { event: "DELETE", schema: "public", table: "tasks" },
      (payload) => handlers.onTaskDelete((payload.old as { id: string }).id)
    )
    .subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}
