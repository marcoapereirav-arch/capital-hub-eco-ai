import { create } from "zustand"
import type { Task, ParaItem, GTDStatus, Priority, Assignee } from "../types/task"
import { defaultTasks, defaultParaItems } from "../services/mock-tasks"

type TaskFilters = {
  status: GTDStatus | "all"
  assignee: Assignee | "all"
  paraId: string | null
  paraType: string | null
  search: string
}

type TaskStore = {
  tasks: Task[]
  paraItems: ParaItem[]
  filters: TaskFilters
  selectedTaskId: string | null
  viewMode: "board" | "list"

  // Task CRUD
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedAt">) => void
  updateTask: (id: string, updates: Partial<Task>) => void
  deleteTask: (id: string) => void
  moveTask: (id: string, status: GTDStatus) => void
  quickCapture: (title: string) => void

  // PARA CRUD
  addParaItem: (item: Omit<ParaItem, "id">) => void
  deleteParaItem: (id: string) => void

  // UI State
  setFilters: (filters: Partial<TaskFilters>) => void
  resetFilters: () => void
  setSelectedTask: (id: string | null) => void
  setViewMode: (mode: "board" | "list") => void

  // Computed
  getFilteredTasks: () => Task[]
  getTasksByParaId: (paraId: string) => Task[]
  getInboxCount: () => number
  getParaItemsByType: (type: string) => ParaItem[]
}

const defaultFilters: TaskFilters = {
  status: "all",
  assignee: "all",
  paraId: null,
  paraType: null,
  search: "",
}

let idCounter = 100

function generateId(): string {
  idCounter += 1
  return `t${idCounter}`
}

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: defaultTasks,
  paraItems: defaultParaItems,
  filters: defaultFilters,
  selectedTaskId: null,
  viewMode: "board",

  addTask: (taskData) => {
    const task: Task = {
      ...taskData,
      id: generateId(),
      createdAt: new Date().toISOString(),
      completedAt: null,
    }
    set((state) => ({ tasks: [task, ...state.tasks] }))
  },

  updateTask: (id, updates) => {
    set((state) => ({
      tasks: state.tasks.map((t) => {
        if (t.id !== id) return t
        const updated = { ...t, ...updates }
        if (updates.status === "done" && !t.completedAt) {
          updated.completedAt = new Date().toISOString()
        }
        if (updates.status && updates.status !== "done") {
          updated.completedAt = null
        }
        return updated
      }),
    }))
  },

  deleteTask: (id) => {
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    }))
  },

  moveTask: (id, status) => {
    get().updateTask(id, { status })
  },

  quickCapture: (title) => {
    get().addTask({
      title,
      description: "",
      status: "inbox",
      priority: "normal",
      assignee: "marco",
      paraId: null,
      dueDate: null,
    })
  },

  addParaItem: (itemData) => {
    const item: ParaItem = {
      ...itemData,
      id: `para_${generateId()}`,
    }
    set((state) => ({ paraItems: [...state.paraItems, item] }))
  },

  deleteParaItem: (id) => {
    set((state) => ({
      paraItems: state.paraItems.filter((p) => p.id !== id),
      tasks: state.tasks.map((t) =>
        t.paraId === id ? { ...t, paraId: null } : t
      ),
    }))
  },

  setFilters: (newFilters) => {
    set((state) => ({
      filters: { ...state.filters, ...newFilters },
    }))
  },

  resetFilters: () => {
    set({ filters: defaultFilters })
  },

  setSelectedTask: (id) => {
    set({ selectedTaskId: id })
  },

  setViewMode: (mode) => {
    set({ viewMode: mode })
  },

  getFilteredTasks: () => {
    const { tasks, filters } = get()
    return tasks.filter((task) => {
      if (filters.status !== "all" && task.status !== filters.status) return false
      if (filters.assignee !== "all" && task.assignee !== filters.assignee) return false
      if (filters.paraId && task.paraId !== filters.paraId) return false
      if (filters.paraType) {
        if (filters.paraType === "inbox") {
          if (task.status !== "inbox") return false
        } else {
          const paraItem = get().paraItems.find((p) => p.id === task.paraId)
          if (!paraItem || paraItem.type !== filters.paraType) return false
        }
      }
      if (filters.search) {
        const q = filters.search.toLowerCase()
        if (
          !task.title.toLowerCase().includes(q) &&
          !task.description.toLowerCase().includes(q)
        )
          return false
      }
      return true
    })
  },

  getTasksByParaId: (paraId) => {
    return get().tasks.filter((t) => t.paraId === paraId)
  },

  getInboxCount: () => {
    return get().tasks.filter((t) => t.status === "inbox").length
  },

  getParaItemsByType: (type) => {
    return get().paraItems.filter((p) => p.type === type)
  },
}))
