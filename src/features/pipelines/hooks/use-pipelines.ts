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
 *
 * Decisión Marco 2026-06-20: NO hay pipeline "por default". Cada pipeline
 * tiene su propia intención (general = agenda directa, test-personalidad =
 * funnel test, etc). El usuario elige siempre qué pipeline ver.
 *
 * - Primera carga sin localStorage: usa el primero alfabéticamente (no por flag).
 * - Si hay valor guardado y sigue existiendo: lo usa.
 * - Si no existe: cae al primero.
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
      // Sin default sesgado: usa el primero por orden alfabético del slug.
      const sorted = [...pipelines].sort((a, b) => a.slug.localeCompare(b.slug))
      setActiveIdState(sorted[0]?.id ?? null)
    }
  }, [pipelines])

  function setActiveId(id: string) {
    setActiveIdState(id)
    if (typeof window !== "undefined") localStorage.setItem(ACTIVE_PIPELINE_KEY, id)
  }

  return { activeId, setActiveId }
}
