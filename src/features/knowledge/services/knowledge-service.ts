import "server-only"
import fs from "fs"
import path from "path"
import matter from "gray-matter"

export type Sop = {
  slug: string
  title: string
  order: number
  content: string
}

const SOPS_DIR = path.join(process.cwd(), "docs", "sops")

export function listSops(): Sop[] {
  if (!fs.existsSync(SOPS_DIR)) return []

  const files = fs.readdirSync(SOPS_DIR).filter((f) => f.endsWith(".md"))
  const sops: Sop[] = files.map((file) => {
    const fullPath = path.join(SOPS_DIR, file)
    const raw = fs.readFileSync(fullPath, "utf8")
    const { data, content } = matter(raw)
    const slug = file.replace(/\.md$/, "")
    return {
      slug,
      title: (data.title as string) ?? slug,
      order: (data.order as number) ?? 99,
      content,
    }
  })

  return sops.sort((a, b) => a.order - b.order)
}

export function getSop(slug: string): Sop | null {
  const file = path.join(SOPS_DIR, `${slug}.md`)
  if (!fs.existsSync(file)) return null
  const raw = fs.readFileSync(file, "utf8")
  const { data, content } = matter(raw)
  return {
    slug,
    title: (data.title as string) ?? slug,
    order: (data.order as number) ?? 99,
    content,
  }
}
