import { createClient } from "@/lib/supabase/client"
import type { Task, ParaItem, GTDStatus, Priority, Assignee, ParaType } from "@/features/tasks/types/task"
import type { TaskWithDeps, BoardData } from "../types/board"

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
  depends_on: string[] | null
  is_in_progress: boolean | null
}

type ParaRow = { id: string; name: string; type: ParaType }

function rowToTask(r: TaskRow): TaskWithDeps {
  return {
    id: r.id,
    title: r.title,
    description: r.description ?? "",
    status: r.status,
    priority: r.priority,
    assignee: r.assignee,
    paraId: r.para_id,
    dueDate: r.due_date,
    createdAt: r.created_at,
    completedAt: r.completed_at,
    dependsOn: r.depends_on ?? [],
    isInProgress: r.is_in_progress ?? false,
  }
}

export async function setTaskInProgress(id: string, value: boolean): Promise<void> {
  const supabase = createClient()
  const { error } = await supabase.from("tasks").update({ is_in_progress: value }).eq("id", id)
  if (error) throw error
}

export const boardService = {
  async load(): Promise<BoardData> {
    const supabase = createClient()
    const [tasksRes, parasRes] = await Promise.all([
      supabase.from("tasks").select("*").order("created_at", { ascending: false }),
      supabase.from("para_items").select("*").order("created_at", { ascending: true }),
    ])
    if (tasksRes.error) throw tasksRes.error
    if (parasRes.error) throw parasRes.error
    return {
      tasks: (tasksRes.data ?? []).map((r) => rowToTask(r as TaskRow)),
      paraItems: (parasRes.data ?? []).map((r) => ({
        id: (r as ParaRow).id,
        name: (r as ParaRow).name,
        type: (r as ParaRow).type,
      })) as ParaItem[],
    }
  },

  subscribe(onChange: () => void) {
    const supabase = createClient()
    const channel = supabase
      .channel("board-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks" }, () => onChange())
      .on("postgres_changes", { event: "*", schema: "public", table: "para_items" }, () => onChange())
      .subscribe()
    return () => {
      supabase.removeChannel(channel)
    }
  },
}
