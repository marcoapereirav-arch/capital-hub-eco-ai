import { create } from "zustand"
import type { Task, ParaItem, GTDStatus, Priority, Assignee } from "../types/task"
import { tasksService, subscribeRealtime } from "../services/tasks-service"

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
  addParaItem: (item: Omit<ParaItem, "id">) => Promise<void>
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
  paraId: null,
  paraType: null,
  search: "",
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
