import "server-only"
import { createClient } from "@/lib/supabase/server"
import type { Web, WebStep, WebWithSteps } from "../types/web"

type WebRow = {
  id: string
  type: Web["type"]
  slug: string
  name: string
  description: string | null
  status: Web["status"]
  created_at: string
  updated_at: string
}

type StepRow = {
  id: string
  web_id: string
  slug: string
  name: string
  position: number
  is_entry: boolean
  description: string | null
}

function rowToWeb(r: WebRow): Web {
  return {
    id: r.id,
    type: r.type,
    slug: r.slug,
    name: r.name,
    description: r.description ?? "",
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }
}

function rowToStep(r: StepRow): WebStep {
  return {
    id: r.id,
    webId: r.web_id,
    slug: r.slug,
    name: r.name,
    position: r.position,
    isEntry: r.is_entry,
    description: r.description ?? "",
  }
}

export async function listWebsWithSteps(): Promise<WebWithSteps[]> {
  const supabase = await createClient()

  const [{ data: websData }, { data: stepsData }] = await Promise.all([
    supabase.from("webs").select("*").order("created_at", { ascending: false }),
    supabase.from("web_steps").select("*").order("position", { ascending: true }),
  ])

  const webs = (websData ?? []).map((r) => rowToWeb(r as WebRow))
  const steps = (stepsData ?? []).map((r) => rowToStep(r as StepRow))

  const stepsByWeb = new Map<string, WebStep[]>()
  for (const s of steps) {
    const list = stepsByWeb.get(s.webId) ?? []
    list.push(s)
    stepsByWeb.set(s.webId, list)
  }

  return webs.map((w) => ({
    ...w,
    steps: stepsByWeb.get(w.id) ?? [],
  }))
}
