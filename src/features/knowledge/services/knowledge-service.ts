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

// Una carpeta navegable del Knowledge: un cuadrante o una subcarpeta (ej. una formación)
export type KnowledgeFolder = {
  id: string
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

// Lee las subcarpetas de un cuadrante (ej. producto/ia-integrator) como carpetas propias.
// La etiqueta/descripción de la carpeta salen del frontmatter de su 00-readme.md.
function readSubfoldersFromQuadrant(quadrant: Quadrant): KnowledgeFolder[] {
  const base = path.join(SOPS_DIR, quadrant)
  if (!fs.existsSync(base)) return []

  return fs
    .readdirSync(base, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((dir) => {
      const folderPath = path.join(base, dir.name)
      const sops: Sop[] = fs
        .readdirSync(folderPath)
        .filter((f) => f.endsWith(".md") && f !== "00-readme.md")
        .map((file) => {
          const raw = fs.readFileSync(path.join(folderPath, file), "utf8")
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

      let label = dir.name
      let description = ""
      const readme = path.join(folderPath, "00-readme.md")
      if (fs.existsSync(readme)) {
        const { data } = matter(fs.readFileSync(readme, "utf8"))
        if (data.title) label = data.title as string
        if (data.description) description = data.description as string
      }

      return { id: dir.name, label, description, sops }
    })
    .filter((folder) => folder.sops.length > 0)
}

// Todas las carpetas navegables del Knowledge: los 4+1 cuadrantes + las subcarpetas (formaciones).
export function listKnowledgeFolders(): KnowledgeFolder[] {
  const quadrantFolders: KnowledgeFolder[] = QUADRANTS.map((q) => ({
    id: q.id,
    label: q.label,
    description: q.description,
    sops: readSopsFromFolder(q.id),
  }))
  const subFolders: KnowledgeFolder[] = QUADRANTS.flatMap((q) =>
    readSubfoldersFromQuadrant(q.id)
  )
  return [...quadrantFolders, ...subFolders]
}

export function getSop(slug: string): Sop | null {
  // Busca en los cuadrantes y en sus subcarpetas (formaciones)
  for (const folder of listKnowledgeFolders()) {
    const found = folder.sops.find((s) => s.slug === slug)
    if (found) return found
  }
  return null
}
