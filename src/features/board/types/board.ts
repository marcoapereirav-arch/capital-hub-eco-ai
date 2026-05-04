import type { Task, ParaItem } from "@/features/tasks/types/task"

export type TaskWithDeps = Task & {
  dependsOn: string[]
  isInProgress: boolean
}

export type BoardData = {
  tasks: TaskWithDeps[]
  paraItems: ParaItem[]
}
