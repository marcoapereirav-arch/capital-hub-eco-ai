"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FileText, Palette } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { cn } from "@/lib/utils"
import type { Sop } from "../services/knowledge-service"

interface KnowledgePageProps {
  sops: Sop[]
}

const BRANDKIT_SLUG = "__brandkit"

export function KnowledgePage({ sops }: KnowledgePageProps) {
  const [activeSlug, setActiveSlug] = useState<string>(BRANDKIT_SLUG)
  const activeSop = sops.find((s) => s.slug === activeSlug)
  const isBrandkit = activeSlug === BRANDKIT_SLUG

  return (
    <>
      <ShellHeader title="Knowledge" />
      <div className="flex h-[calc(100vh-3.5rem)]">
        {/* Sidebar */}
        <aside className="w-64 shrink-0 border-r border-border bg-card/30 overflow-y-auto">
          <div className="p-3">
            <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground mb-2 px-2">
              Brand
            </p>
            <nav className="flex flex-col gap-0.5 mb-4">
              <button
                onClick={() => setActiveSlug(BRANDKIT_SLUG)}
                className={cn(
                  "flex items-center gap-2 rounded-sm px-2 py-1.5 text-left text-sm transition-colors",
                  isBrandkit
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/50 hover:text-foreground"
                )}
              >
                <Palette className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">Brandkit Capital Hub</span>
              </button>
            </nav>

            {sops.length > 0 && (
              <>
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
              </>
            )}
          </div>
        </aside>

        {/* Content */}
        <main className="flex-1 overflow-hidden">
          {isBrandkit ? (
            <iframe
              src="/brandkit.html"
              title="Brandkit Capital Hub"
              className="w-full h-full border-0 bg-[#050505]"
            />
          ) : activeSop ? (
            <div className="h-full overflow-y-auto">
              <article className="prose prose-invert max-w-3xl mx-auto p-8 prose-headings:font-heading prose-h1:text-2xl prose-h2:text-lg prose-h3:text-base prose-table:text-sm prose-code:text-xs prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:before:content-none prose-code:after:content-none">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeSop.content}</ReactMarkdown>
              </article>
            </div>
          ) : null}
        </main>
      </div>
    </>
  )
}
