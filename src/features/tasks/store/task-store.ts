import { create } from "zustand"
import { tasksService, subscribeRealtime } from "../services/tasks-service"
import {
  DEFAULT_FILTERS,
  PRIORITY_RANK,
  type Filters,
  type OsUser,
  type SortBy,
  type Task,
} from "../types/task"

type State = {
  tasks: Task[]
  users: OsUser[]
  loading: boolean
  error: string | null
  initialized: boolean
  filters: Filters
  sortBy: SortBy
  selectedId: string | null

  init: () => Promise<void>
  setFilters: (patch: Partial<Filters>) => void
  resetFilters: () => void
  setSortBy: (s: SortBy) => void
  select: (id: string | null) => void

  addTask: (input: { title: string; priority?: Task["priority"]; assigneeId?: string | null }) => Promise<void>
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>
  deleteTask: (id: string) => Promise<void>
}

let desuscribir: (() => void) | null = null

export const useTaskStore = create<State>((set, get) => ({
  tasks: [],
  users: [],
  loading: false,
  error: null,
  initialized: false,
  filters: DEFAULT_FILTERS,
  sortBy: "prioridad",
  selectedId: null,

  async init() {
    if (get().initialized || get().loading) return
    set({ loading: true, error: null })
    try {
      const [tasks, users] = await Promise.all([
        tasksService.listTasks(),
        tasksService.listOsUsers(),
      ])
      set({ tasks, users, loading: false, initialized: true })

      desuscribir?.()
      desuscribir = subscribeRealtime({
        onInsert: (t) =>
          set((s) => (s.tasks.some((x) => x.id === t.id) ? s : { tasks: [t, ...s.tasks] })),
        onUpdate: (t) => set((s) => ({ tasks: s.tasks.map((x) => (x.id === t.id ? t : x)) })),
        onDelete: (id) =>
          set((s) => ({
            tasks: s.tasks.filter((x) => x.id !== id),
            selectedId: s.selectedId === id ? null : s.selectedId,
          })),
      })
    } catch (e) {
      set({
        loading: false,
        error: e instanceof Error ? e.message : "No se pudo cargar la lista",
      })
    }
  },

  setFilters(patch) {
    set((s) => ({ filters: { ...s.filters, ...patch } }))
  },

  resetFilters() {
    set({ filters: DEFAULT_FILTERS })
  },

  setSortBy(sortBy) {
    set({ sortBy })
  },

  select(selectedId) {
    set({ selectedId })
  },

  async addTask(input) {
    const creada = await tasksService.addTask(input)
    set((s) => (s.tasks.some((x) => x.id === creada.id) ? s : { tasks: [creada, ...s.tasks] }))
  },

  async updateTask(id, updates) {
    const antes = get().tasks
    // Optimista: la lista responde al instante y realtime confirma despues.
    set((s) => ({ tasks: s.tasks.map((t) => (t.id === id ? { ...t, ...updates } : t)) }))
    try {
      const t = await tasksService.updateTask(id, updates)
      set((s) => ({ tasks: s.tasks.map((x) => (x.id === id ? t : x)) }))
    } catch (e) {
      set({ tasks: antes, error: e instanceof Error ? e.message : "No se pudo guardar" })
    }
  },

  async deleteTask(id) {
    const antes = get().tasks
    set((s) => ({
      tasks: s.tasks.filter((t) => t.id !== id),
      selectedId: s.selectedId === id ? null : s.selectedId,
    }))
    try {
      await tasksService.deleteTask(id)
    } catch (e) {
      set({ tasks: antes, error: e instanceof Error ? e.message : "No se pudo eliminar" })
    }
  },
}))

/** Aplica filtros y orden. Fuera del store para que sea facil de probar y de leer. */
export function filtrarYOrdenar(tasks: Task[], filters: Filters, sortBy: SortBy): Task[] {
  const texto = filters.search.trim().toLowerCase()

  const out = tasks.filter((t) => {
    if (filters.status !== "todas" && t.status !== filters.status) return false
    if (filters.priority !== "todas" && t.priority !== filters.priority) return false
    if (filters.assigneeId === "sin" && t.assigneeId !== null) return false
    if (
      filters.assigneeId !== "todos" &&
      filters.assigneeId !== "sin" &&
      t.assigneeId !== filters.assigneeId
    )
      return false
    if (texto && !`${t.title} ${t.description}`.toLowerCase().includes(texto)) return false
    return true
  })

  const porFecha = (a: Task, b: Task) => +new Date(b.createdAt) - +new Date(a.createdAt)

  return out.sort((a, b) => {
    if (sortBy === "recientes") return porFecha(a, b)
    if (sortBy === "antiguas") return -porFecha(a, b)
    const p = PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]
    return p !== 0 ? p : porFecha(a, b)
  })
}
