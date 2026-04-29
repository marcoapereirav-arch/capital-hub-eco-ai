import type { Task, ParaItem } from "@/features/tasks/types/task"

export type TaskWithDeps = Task & { dependsOn: string[] }

export type BoardData = {
  tasks: TaskWithDeps[]
  paraItems: ParaItem[]
}
