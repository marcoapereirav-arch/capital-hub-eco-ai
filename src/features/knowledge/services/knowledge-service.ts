import "server-only"
import fs from "fs"
import path from "path"
import matter from "gray-matter"

export type Quadrant = "marketing" | "producto" | "ventas" | "finanzas" | "sistemas"

export type Sop = {
  slug: string
  quadrant: Quadrant
  title: string
  order: number
  content: string
}

export type QuadrantInfo = {
  id: Quadrant
  label: string
  description: string
  sops: Sop[]
}

const SOPS_DIR = path.join(process.cwd(), "docs", "sops")

const QUADRANTS: { id: Quadrant; label: string; description: string }[] = [
  {
    id: "marketing",
    label: "Marketing",
    description: "Captación, contenido, ads, funnel hasta checkout",
  },
  {
    id: "producto",
    label: "Producto",
    description: "Cómo se construye y opera el OS",
  },
  {
    id: "ventas",
    label: "Ventas",
    description: "Proceso de cierre, llamadas, follow-up",
  },
  {
    id: "finanzas",
    label: "Finanzas",
    description: "Pricing, comisiones, modelo de negocio",
  },
  {
    id: "sistemas",
    label: "Sistemas",
    description: "SOPs internos, procesos, runbooks, protocolos del agente, reglas operativas, sprints",
  },
]

function readSopsFromFolder(quadrant: Quadrant): Sop[] {
  const folder = path.join(SOPS_DIR, quadrant)
  if (!fs.existsSync(folder)) return []

  const files = fs
    .readdirSync(folder)
    .filter((f) => f.endsWith(".md") && f !== "00-readme.md")

  return files
    .map((file) => {
      const fullPath = path.join(folder, file)
      const raw = fs.readFileSync(fullPath, "utf8")
      const { data, content } = matter(raw)
      const slug = file.replace(/\.md$/, "")
      return {
        slug,
        quadrant,
        title: (data.title as string) ?? slug,
        order: (data.order as number) ?? 99,
        content,
      }
    })
    .sort((a, b) => a.order - b.order)
}

export function listSops(): Sop[] {
  return QUADRANTS.flatMap((q) => readSopsFromFolder(q.id))
}

export function listQuadrants(): QuadrantInfo[] {
  return QUADRANTS.map((q) => ({
    ...q,
    sops: readSopsFromFolder(q.id),
  }))
}

export function getSop(slug: string): Sop | null {
  for (const q of QUADRANTS) {
    const file = path.join(SOPS_DIR, q.id, `${slug}.md`)
    if (!fs.existsSync(file)) continue
    const raw = fs.readFileSync(file, "utf8")
    const { data, content } = matter(raw)
    return {
      slug,
      quadrant: q.id,
      title: (data.title as string) ?? slug,
      order: (data.order as number) ?? 99,
      content,
    }
  }
  return null
}
