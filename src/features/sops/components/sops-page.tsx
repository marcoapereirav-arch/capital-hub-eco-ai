"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FileText } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { cn } from "@/lib/utils"
import type { Sop } from "../services/sops-service"

interface SopsPageProps {
  sops: Sop[]
}

export function SopsPage({ sops }: SopsPageProps) {
  const [activeSlug, setActiveSlug] = useState<string>(sops[0]?.slug ?? "")
  const active = sops.find((s) => s.slug === activeSlug)

  if (sops.length === 0) {
    return (
      <>
        <ShellHeader title="SOPs" />
        <div className="p-8 text-center text-muted-foreground">
          No hay SOPs aún. Añade un archivo <code className="font-mono">.md</code> en{" "}
          <code className="font-mono">docs/sops/</code> con frontmatter <code className="font-mono">title</code> y{" "}
          <code className="font-mono">order</code>.
        </div>
      </>
    )
  }

  return (
    <>
      <ShellHeader title="SOPs" />
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border bg-card/30 overflow-y-auto">
          <div className="p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-2 px-2">
              Standard Operating Procedures
            </p>
            <nav className="flex flex-col gap-0.5">
              {sops.map((sop) => (
                <button
                  key={sop.slug}
                  onClick={() => setActiveSlug(sop.slug)}
                  className={cn(
                    "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                    activeSlug === sop.slug
                      ? "bg-secondary text-foreground"
                      : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                  )}
                >
                  <FileText className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{sop.title}</span>
                </button>
              ))}
            </nav>
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-y-auto">
          {active && (
            <article className="prose prose-invert max-w-3xl mx-auto p-8 prose-headings:font-heading prose-h1:text-2xl prose-h2:text-lg prose-h3:text-base prose-table:text-sm prose-code:text-xs prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:before:content-none prose-code:after:content-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{active.content}</ReactMarkdown>
            </article>
          )}
        </main>
      </div>
    </>
  )
}
