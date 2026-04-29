"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { FileText, Palette } from "lucide-react"
import { PageNavHeader, type PageNavGroup } from "@/features/shell/components/page-nav-header"
import type { Sop } from "../services/knowledge-service"

interface KnowledgePageProps {
  sops: Sop[]
}

const BRANDKIT_ID = "__brandkit"

export function KnowledgePage({ sops }: KnowledgePageProps) {
  const [activeId, setActiveId] = useState<string>(BRANDKIT_ID)
  const activeSop = sops.find((s) => s.slug === activeId)
  const isBrandkit = activeId === BRANDKIT_ID

  const groups: PageNavGroup[] = [
    {
      label: "Brand",
      items: [
        {
          id: BRANDKIT_ID,
          label: "Brandkit Capital Hub",
          icon: Palette,
        },
      ],
    },
    {
      label: "Standard Operating Procedures",
      items: sops.map((sop) => ({
        id: sop.slug,
        label: sop.title,
        icon: FileText,
      })),
    },
  ]

  return (
    <div className="absolute inset-0 flex flex-col">
      <PageNavHeader
        title="Knowledge"
        groups={groups}
        activeId={activeId}
        onSelect={setActiveId}
      />
      <main className="flex-1 min-h-0 overflow-hidden">
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
  )
}
