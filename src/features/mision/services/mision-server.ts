import "server-only"
import { createClient } from "@/lib/supabase/server"
import {
  MISION_PARA_ID,
  rowToPhase,
  rowToTask,
  type MisionPhaseRow,
  type MisionTaskRow,
} from "./mision-service"
import type { LaunchPhase, MisionTask } from "../types/mision"

export async function loadMisionInitialData(): Promise<{
  phases: LaunchPhase[]
  tasks: MisionTask[]
}> {
  const supabase = await createClient()
  const [phasesRes, tasksRes] = await Promise.all([
    supabase.from("launch_phases").select("*").order("order", { ascending: true }),
    supabase.from("tasks").select("*").eq("para_id", MISION_PARA_ID),
  ])
  if (phasesRes.error) throw phasesRes.error
  if (tasksRes.error) throw tasksRes.error
  return {
    phases: (phasesRes.data ?? []).map((r) => rowToPhase(r as MisionPhaseRow)),
    tasks: (tasksRes.data ?? []).map((r) => rowToTask(r as MisionTaskRow)),
  }
}
