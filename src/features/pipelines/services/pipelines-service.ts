import { createClient } from "@/lib/supabase/client"
import type { Pipeline, PipelineStage, StageKind } from "../types/pipeline"

type PipelineRow = {
  id: string
  name: string
  slug: string
  description: string | null
  color: string
  is_default: boolean
  display_order: number
  created_at: string
}

type StageRow = {
  id: string
  pipeline_id: string
  key: string
  name: string
  color: string
  kind: StageKind
  sort_order: number
}

function rowToStage(r: StageRow): PipelineStage {
  return {
    id: r.id,
    pipelineId: r.pipeline_id,
    key: r.key,
    name: r.name,
    color: r.color,
    kind: r.kind,
    sortOrder: r.sort_order,
  }
}

function rowToPipeline(p: PipelineRow, stages: StageRow[]): Pipeline {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    color: p.color,
    isDefault: p.is_default,
    displayOrder: p.display_order,
    createdAt: p.created_at,
    stages: stages.map(rowToStage).sort((a, b) => a.sortOrder - b.sortOrder),
  }
}

export const pipelinesService = {
  /** Lista todos los pipelines (con sus stages embebidos). */
  async list(): Promise<Pipeline[]> {
    const supabase = createClient()
    const [{ data: pipelines, error: pErr }, { data: stages, error: sErr }] = await Promise.all([
      supabase.from("pipelines").select("*").order("display_order"),
      supabase.from("pipeline_stages").select("*").order("sort_order"),
    ])
    if (pErr) throw pErr
    if (sErr) throw sErr

    const byPipeline = new Map<string, StageRow[]>()
    for (const s of (stages ?? []) as StageRow[]) {
      const arr = byPipeline.get(s.pipeline_id) ?? []
      arr.push(s)
      byPipeline.set(s.pipeline_id, arr)
    }
    return (pipelines ?? []).map((p) => rowToPipeline(p as PipelineRow, byPipeline.get((p as PipelineRow).id) ?? []))
  },

  async getDefault(): Promise<Pipeline | null> {
    const all = await this.list()
    return all.find((p) => p.isDefault) ?? all[0] ?? null
  },

  async create(input: { name: string; description?: string; color?: string }): Promise<Pipeline> {
    const res = await fetch("/api/admin/pipelines", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Error creando pipeline: ${res.status}`)
    return res.json()
  },

  async update(id: string, patch: Partial<Pick<Pipeline, "name" | "description" | "color" | "isDefault">>): Promise<Pipeline> {
    const res = await fetch(`/api/admin/pipelines/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error(`Error actualizando pipeline: ${res.status}`)
    return res.json()
  },

  async delete(id: string): Promise<void> {
    const res = await fetch(`/api/admin/pipelines/${id}`, { method: "DELETE" })
    if (!res.ok) throw new Error(`Error borrando pipeline: ${res.status}`)
  },

  async addStage(pipelineId: string, input: { name: string; key?: string; color?: string; kind?: StageKind; sortOrder?: number }): Promise<PipelineStage> {
    const res = await fetch(`/api/admin/pipelines/${pipelineId}/stages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(input),
    })
    if (!res.ok) throw new Error(`Error creando stage: ${res.status}`)
    return res.json()
  },

  async updateStage(pipelineId: string, stageId: string, patch: Partial<Pick<PipelineStage, "name" | "color" | "kind" | "sortOrder">>): Promise<PipelineStage> {
    const res = await fetch(`/api/admin/pipelines/${pipelineId}/stages/${stageId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(patch),
    })
    if (!res.ok) throw new Error(`Error actualizando stage: ${res.status}`)
    return res.json()
  },

  async deleteStage(pipelineId: string, stageId: string): Promise<void> {
    const res = await fetch(`/api/admin/pipelines/${pipelineId}/stages/${stageId}`, { method: "DELETE" })
    if (!res.ok) throw new Error(`Error borrando stage: ${res.status}`)
  },

  async reorderStages(pipelineId: string, orderedStageIds: string[]): Promise<void> {
    const res = await fetch(`/api/admin/pipelines/${pipelineId}/stages/reorder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderedStageIds }),
    })
    if (!res.ok) throw new Error(`Error reordenando stages: ${res.status}`)
  },
}
