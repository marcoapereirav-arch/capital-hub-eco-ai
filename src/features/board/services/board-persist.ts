"use client"

const POSITIONS_KEY = "ch-board-positions-v1"
const FILTERS_KEY = "ch-board-filters-v1"

export type SavedPositions = Record<string, { x: number; y: number }>

export function loadPositions(): SavedPositions {
  if (typeof window === "undefined") return {}
  try {
    const raw = localStorage.getItem(POSITIONS_KEY)
    return raw ? (JSON.parse(raw) as SavedPositions) : {}
  } catch {
    return {}
  }
}

export function savePosition(nodeId: string, pos: { x: number; y: number }): void {
  if (typeof window === "undefined") return
  try {
    const all = loadPositions()
    all[nodeId] = pos
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(all))
  } catch {
    // ignore quota errors
  }
}

export function clearPositions(): void {
  if (typeof window === "undefined") return
  localStorage.removeItem(POSITIONS_KEY)
}

export type SerializedFilters = {
  status: string[]
  assignee: string[]
  priority: string[]
  projects: string[]
  onlyInProgress: boolean
  onlyWithDate: boolean
}

export function loadFilters(): SerializedFilters | null {
  if (typeof window === "undefined") return null
  try {
    const raw = localStorage.getItem(FILTERS_KEY)
    return raw ? (JSON.parse(raw) as SerializedFilters) : null
  } catch {
    return null
  }
}

export function saveFilters(f: SerializedFilters): void {
  if (typeof window === "undefined") return
  try {
    localStorage.setItem(FILTERS_KEY, JSON.stringify(f))
  } catch {
    // ignore
  }
}
