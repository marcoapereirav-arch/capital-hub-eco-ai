"use client"

import { useState } from "react"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import { ChevronRight, FileText, Folder, Palette } from "lucide-react"
import type { LucideIcon } from "lucide-react"
import { PageNavHeader, type PageNavGroup } from "@/features/shell/components/page-nav-header"
import { cn } from "@/lib/utils"
import type { Sop } from "../services/knowledge-service"

interface KnowledgePageProps {
  sops: Sop[]
}

const BRANDKIT_ID = "__brandkit"
const BRAND_FOLDER = "brand"
const SOPS_FOLDER = "sops"

type Item = { id: string; label: string; icon: LucideIcon }
type FolderDef = { id: string; label: string; description: string; items: Item[] }

type View =
  | { kind: "root" }
  | { kind: "folder"; folderId: string }
  | { kind: "item"; folderId: string; itemId: string }

export function KnowledgePage({ sops }: KnowledgePageProps) {
  const [view, setView] = useState<View>({ kind: "root" })

  const folders: FolderDef[] = [
    {
      id: BRAND_FOLDER,
      label: "Brand",
      description: "Identidad, brandkit, guías visuales",
      items: [{ id: BRANDKIT_ID, label: "Brandkit Capital Hub", icon: Palette }],
    },
    {
      id: SOPS_FOLDER,
      label: "Standard Operating Procedures",
      description: "Procesos operativos y manuales",
      items: sops.map((s) => ({ id: s.slug, label: s.title, icon: FileText })),
    },
  ]

  const groups: PageNavGroup[] = folders.map((f) => ({
    label: f.label,
    items: f.items.map((i) => ({ id: `${f.id}/${i.id}`, label: i.label, icon: i.icon })),
  }))

  const dropdownActiveId =
    view.kind === "item" ? `${view.folderId}/${view.itemId}` : ""

  function handleDropdownSelect(id: string) {
    const [folderId, itemId] = id.split("/")
    setView({ kind: "item", folderId, itemId })
  }

  function openFolder(folderId: string) {
    setView({ kind: "folder", folderId })
  }

  function openItem(folderId: string, itemId: string) {
    setView({ kind: "item", folderId, itemId })
  }

  function goRoot() {
    setView({ kind: "root" })
  }

  const currentFolder =
    view.kind !== "root" ? folders.find((f) => f.id === view.folderId) : null
  const currentItem =
    view.kind === "item" && currentFolder
      ? currentFolder.items.find((i) => i.id === view.itemId)
      : null

  return (
    <div className="absolute inset-0 flex flex-col">
      <PageNavHeader
        title="Knowledge"
        groups={groups}
        activeId={dropdownActiveId}
        onSelect={handleDropdownSelect}
      />

      {/* Breadcrumb */}
      {view.kind !== "root" && (
        <nav className="shrink-0 flex items-center gap-1.5 border-b border-border px-4 py-2 text-xs">
          <button
            onClick={goRoot}
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            Knowledge
          </button>
          {currentFolder && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              <button
                onClick={() => openFolder(currentFolder.id)}
                className={cn(
                  "transition-colors",
                  view.kind === "folder"
                    ? "text-foreground"
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {currentFolder.label}
              </button>
            </>
          )}
          {currentItem && (
            <>
              <ChevronRight className="h-3 w-3 text-muted-foreground/40" />
              <span className="text-foreground">{currentItem.label}</span>
            </>
          )}
        </nav>
      )}

      <main className="flex-1 min-h-0 overflow-hidden">
        {view.kind === "root" && <FolderGrid folders={folders} onOpen={openFolder} />}

        {view.kind === "folder" && currentFolder && (
          <ItemGrid folder={currentFolder} onOpen={(itemId) => openItem(currentFolder.id, itemId)} />
        )}

        {view.kind === "item" && currentItem && (
          <ContentView itemId={currentItem.id} sops={sops} />
        )}
      </main>
    </div>
  )
}

function FolderGrid({
  folders,
  onOpen,
}: {
  folders: FolderDef[]
  onOpen: (folderId: string) => void
}) {
  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {folders.map((folder) => (
            <button
              key={folder.id}
              onClick={() => onOpen(folder.id)}
              className="group flex flex-col gap-3 rounded-md border border-border bg-card/40 p-5 text-left transition-all hover:border-foreground/40 hover:bg-card/70"
            >
              <div className="flex items-center justify-between">
                <Folder className="h-5 w-5 text-muted-foreground group-hover:text-foreground" />
                <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
                  {folder.items.length} {folder.items.length === 1 ? "item" : "items"}
                </span>
              </div>
              <div>
                <div className="font-heading text-sm font-semibold text-foreground">
                  {folder.label}
                </div>
                <div className="mt-0.5 text-xs text-muted-foreground">
                  {folder.description}
                </div>
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function ItemGrid({
  folder,
  onOpen,
}: {
  folder: FolderDef
  onOpen: (itemId: string) => void
}) {
  if (folder.items.length === 0) {
    return (
      <div className="flex h-full items-center justify-center p-8 text-sm text-muted-foreground">
        Esta carpeta está vacía.
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-8">
      <div className="mx-auto max-w-5xl">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {folder.items.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.id}
                onClick={() => onOpen(item.id)}
                className="group flex items-center gap-3 rounded-md border border-border bg-card/40 px-4 py-3 text-left transition-all hover:border-foreground/40 hover:bg-card/70"
              >
                <Icon className="h-4 w-4 shrink-0 text-muted-foreground group-hover:text-foreground" />
                <span className="truncate text-sm text-foreground">{item.label}</span>
              </button>
            )
          })}
        </div>
      </div>
    </div>
  )
}

function ContentView({ itemId, sops }: { itemId: string; sops: Sop[] }) {
  if (itemId === BRANDKIT_ID) {
    return (
      <iframe
        src="/brandkit.html"
        title="Brandkit Capital Hub"
        className="w-full h-full border-0 bg-[#050505]"
      />
    )
  }

  const sop = sops.find((s) => s.slug === itemId)
  if (!sop) return null

  return (
    <div className="h-full overflow-y-auto">
      <article className="prose prose-invert max-w-3xl mx-auto p-8 prose-headings:font-heading prose-h1:text-2xl prose-h2:text-lg prose-h3:text-base prose-table:text-sm prose-code:text-xs prose-code:bg-secondary prose-code:px-1 prose-code:py-0.5 prose-code:rounded-sm prose-code:before:content-none prose-code:after:content-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{sop.content}</ReactMarkdown>
      </article>
    </div>
  )
}
