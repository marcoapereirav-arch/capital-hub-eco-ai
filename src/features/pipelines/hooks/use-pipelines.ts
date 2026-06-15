"use client"

import { useEffect, useState } from "react"
import { pipelinesService } from "../services/pipelines-service"
import type { Pipeline } from "../types/pipeline"

const ACTIVE_PIPELINE_KEY = "ch:active_pipeline_id"

/** Carga la lista completa de pipelines con stages. */
export function usePipelines(refreshKey?: unknown) {
  const [pipelines, setPipelines] = useState<Pipeline[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      try {
        const data = await pipelinesService.list()
        if (!cancelled) setPipelines(data)
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [refreshKey])

  return { pipelines, loading }
}

/**
 * Mantiene el id del pipeline activo (persistido en localStorage).
 * Si no hay valor guardado o el guardado ya no existe, devuelve el default.
 */
export function useActivePipelineId(pipelines: Pipeline[]): {
  activeId: string | null
  setActiveId: (id: string) => void
} {
  const [activeId, setActiveIdState] = useState<string | null>(null)

  useEffect(() => {
    if (pipelines.length === 0) return
    const saved = typeof window !== "undefined" ? localStorage.getItem(ACTIVE_PIPELINE_KEY) : null
    const exists = pipelines.some((p) => p.id === saved)
    if (saved && exists) {
      setActiveIdState(saved)
    } else {
      const fallback = pipelines.find((p) => p.isDefault) ?? pipelines[0]
      setActiveIdState(fallback?.id ?? null)
    }
  }, [pipelines])

  function setActiveId(id: string) {
    setActiveIdState(id)
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_PIPELINE_KEY, id)
  }

  return { activeId, setActiveId }
}
