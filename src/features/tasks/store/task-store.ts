import { create } from "zustand"
import type { Task, ParaItem, GTDStatus, Priority, Assignee, ParaType, ParaStatus } from "../types/task"
import { tasksService, subscribeRealtime } from "../services/tasks-service"

export type DueRange = "all" | "overdue" | "today" | "week" | "month" | "no_date"
export type SortBy = "priority" | "due_asc" | "due_desc" | "status" | "assignee" | "created_desc" | "created_asc" | "alpha"

type TaskFilters = {
  status: GTDStatus | "all"
  assignee: Assignee | "all"
  priority: Priority | "all"
  paraId: string | null
  paraType: string | null
  areaId: string | null
  dueRange: DueRange
  search: string
  sortBy: SortBy
}

type TaskStore = {
  tasks: Task[]
  paraItems: ParaItem[]
  filters: TaskFilters
  selectedTaskId: string | null
  viewMode: "board" | "list"

  initialized: boolean
  loading: boolean
  error: string | null

  // Lifecycle
  init: () => Promise<void>
  cleanup: () => void

  // Task CRUD
  addTask: (task: Omit<Task, "id" | "createdAt" | "completedAt">) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
  moveTask: (id: string, status: GTDStatus) => Promise<void>
  quickCapture: (title: string) => Promise<void>

  // PARA CRUD
  addParaItem: (item: { name: string; type: ParaType; status?: ParaStatus; parentId?: string | null }) => Promise<void>
  updateParaItem: (id: string, updates: Partial<ParaItem>) => Promise<void>
  deleteParaItem: (id: string) => Promise<void>

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
  priority: "all",
  paraId: null,
  paraType: null,
  areaId: null,
  dueRange: "all",
  search: "",
  sortBy: "priority",
}

const PRIORITY_RANK: Record<Priority, number> = { urgent: 0, high: 1, normal: 2, low: 3 }
const STATUS_RANK: Record<GTDStatus, number> = { inbox: 0, next: 1, waiting: 2, someday: 3, done: 4 }

function inDueRange(task: Task, range: DueRange): boolean {
  if (range === "all") return true
  if (range === "no_date") return !task.dueDate
  if (!task.dueDate) return false
  const due = new Date(task.dueDate)
  // Use 2026-06-03 as anchor (today is set in CLAUDE env); avoid Date.now for purity
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfTomorrow = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000)
  if (range === "overdue") return due < startOfToday
  if (range === "today") return due >= startOfToday && due < startOfTomorrow
  if (range === "week") {
    const endOfWeek = new Date(startOfToday.getTime() + 7 * 24 * 60 * 60 * 1000)
    return due >= startOfToday && due < endOfWeek
  }
  if (range === "month") {
    const endOfMonth = new Date(startOfToday.getTime() + 30 * 24 * 60 * 60 * 1000)
    return due >= startOfToday && due < endOfMonth
  }
  return true
}

let unsubscribeRealtime: (() => void) | null = null

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: [],
  paraItems: [],
  filters: defaultFilters,
  selectedTaskId: null,
  viewMode: "board",

  initialized: false,
  loading: false,
  error: null,

  init: async () => {
    if (get().initialized || get().loading) return
    set({ loading: true, error: null })
    try {
      const [tasks, paraItems] = await Promise.all([
        tasksService.listTasks(),
        tasksService.listParaItems(),
      ])
      set({ tasks, paraItems, initialized: true, loading: false })

      if (unsubscribeRealtime) unsubscribeRealtime()
      unsubscribeRealtime = subscribeRealtime({
        onTaskInsert: (task) => {
          set((state) =>
            state.tasks.some((t) => t.id === task.id)
              ? state
              : { tasks: [task, ...state.tasks] }
          )
        },
        onTaskUpdate: (task) => {
          set((state) => ({
            tasks: state.tasks.map((t) => (t.id === task.id ? task : t)),
          }))
        },
        onTaskDelete: (id) => {
          set((state) => ({
            tasks: state.tasks.filter((t) => t.id !== id),
            selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
          }))
        },
        onParaInsert: (item) => {
          set((state) =>
            state.paraItems.some((p) => p.id === item.id)
              ? state
              : { paraItems: [...state.paraItems, item] }
          )
        },
        onParaUpdate: (item) => {
          set((state) => ({
            paraItems: state.paraItems.map((p) => (p.id === item.id ? item : p)),
          }))
        },
        onParaDelete: (id) => {
          set((state) => ({
            paraItems: state.paraItems.filter((p) => p.id !== id),
            tasks: state.tasks.map((t) => (t.paraId === id ? { ...t, paraId: null } : t)),
          }))
        },
      })
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error cargando tareas"
      set({ loading: false, error: msg })
    }
  },

  cleanup: () => {
    if (unsubscribeRealtime) {
      unsubscribeRealtime()
      unsubscribeRealtime = null
    }
  },

  addTask: async (taskData) => {
    try {
      await tasksService.addTask(taskData)
      // Realtime INSERT lo mete al state
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Error creando tarea"
      set({ error: msg })
      throw e
    }
  },

  updateTask: async (id, updates) => {
    const prev = get().tasks.find((t) => t.id === id)
    if (!prev) return

    const finalUpdates = { ...updates }
    if (updates.status === "done" && !prev.completedAt) {
      finalUpdates.completedAt = new Date().toISOString()
    }
    if (updates.status && updates.status !== "done") {
      finalUpdates.completedAt = null
    }

    // Optimistic
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, ...finalUpdates } : t)),
    }))

    try {
      await tasksService.updateTask(id, finalUpdates)
    } catch (e) {
      // Revert
      set((state) => ({
        tasks: state.tasks.map((t) => (t.id === id ? prev : t)),
        error: e instanceof Error ? e.message : "Error actualizando tarea",
      }))
      throw e
    }
  },

  deleteTask: async (id) => {
    const prev = get().tasks.find((t) => t.id === id)
    if (!prev) return

    // Optimistic
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
      selectedTaskId: state.selectedTaskId === id ? null : state.selectedTaskId,
    }))

    try {
      await tasksService.deleteTask(id)
    } catch (e) {
      set((state) => ({
        tasks: [prev, ...state.tasks],
        error: e instanceof Error ? e.message : "Error eliminando tarea",
      }))
      throw e
    }
  },

  moveTask: async (id, status) => {
    await get().updateTask(id, { status })
  },

  quickCapture: async (title) => {
    await get().addTask({
      title,
      description: "",
      status: "inbox",
      priority: "normal",
      assignee: "marco",
      paraId: null,
      dueDate: null,
    })
  },

  addParaItem: async (itemData) => {
    try {
      await tasksService.addParaItem(itemData)
      // Realtime INSERT
    } catch (e) {
      set({ error: e instanceof Error ? e.message : "Error creando PARA item" })
      throw e
    }
  },

  updateParaItem: async (id, updates) => {
    const prev = get().paraItems.find((p) => p.id === id)
    if (!prev) return

    // Optimistic
    set((state) => ({
      paraItems: state.paraItems.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }))

    try {
      await tasksService.updateParaItem(id, updates)
    } catch (e) {
      set((state) => ({
        paraItems: state.paraItems.map((p) => (p.id === id ? prev : p)),
        error: e instanceof Error ? e.message : "Error actualizando PARA item",
      }))
      throw e
    }
  },

  deleteParaItem: async (id) => {
    const prev = get().paraItems.find((p) => p.id === id)
    if (!prev) return

    // Optimistic
    set((state) => ({
      paraItems: state.paraItems.filter((p) => p.id !== id),
      tasks: state.tasks.map((t) => (t.paraId === id ? { ...t, paraId: null } : t)),
    }))

    try {
      await tasksService.deleteParaItem(id)
    } catch (e) {
      set((state) => ({
        paraItems: [...state.paraItems, prev],
        error: e instanceof Error ? e.message : "Error eliminando PARA item",
      }))
      throw e
    }
  },

  setFilters: (newFilters) => {
    set((state) => ({ filters: { ...state.filters, ...newFilters } }))
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
    const { tasks, filters, paraItems } = get()
    const filtered = tasks.filter((task) => {
      if (filters.status !== "all" && task.status !== filters.status) return false
      if (filters.assignee !== "all" && task.assignee !== filters.assignee) return false
      if (filters.priority !== "all" && task.priority !== filters.priority) return false
      if (filters.paraId && task.paraId !== filters.paraId) return false
      if (filters.paraType) {
        if (filters.paraType === "inbox") {
          if (task.status !== "inbox") return false
        } else {
          const paraItem = paraItems.find((p) => p.id === task.paraId)
          if (!paraItem || paraItem.type !== filters.paraType) return false
        }
      }
      if (filters.areaId) {
        // Match tasks que pertenecen al area directamente o via proyecto hijo
        const ownerPara = paraItems.find((p) => p.id === task.paraId)
        if (!ownerPara) return false
        if (ownerPara.id === filters.areaId) {
          /* directa */
        } else if (ownerPara.parentId === filters.areaId) {
          /* via proyecto hijo */
        } else {
          return false
        }
      }
      if (!inDueRange(task, filters.dueRange)) return false
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

    const sorted = [...filtered].sort((a, b) => {
      switch (filters.sortBy) {
        case "priority":
          return PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
        case "due_asc":
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return a.dueDate.localeCompare(b.dueDate)
        case "due_desc":
          if (!a.dueDate && !b.dueDate) return 0
          if (!a.dueDate) return 1
          if (!b.dueDate) return -1
          return b.dueDate.localeCompare(a.dueDate)
        case "status":
          return STATUS_RANK[a.status] - STATUS_RANK[b.status]
        case "assignee":
          return a.assignee.localeCompare(b.assignee)
        case "created_desc":
          return b.createdAt.localeCompare(a.createdAt)
        case "created_asc":
          return a.createdAt.localeCompare(b.createdAt)
        case "alpha":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })
    return sorted
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
