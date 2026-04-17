"use client"

import { useState } from "react"
import {
  Inbox,
  FolderKanban,
  Compass,
  BookOpen,
  Archive,
  Plus,
  ChevronRight,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { useTaskStore } from "../store/task-store"
import type { ParaType } from "../types/task"

const PARA_SECTIONS: { type: ParaType; label: string; icon: typeof Inbox }[] = [
  { type: "project", label: "Proyectos", icon: FolderKanban },
  { type: "area", label: "Areas", icon: Compass },
  { type: "resource", label: "Recursos", icon: BookOpen },
  { type: "archive", label: "Archivo", icon: Archive },
]

export function TaskSidebar() {
  const filters = useTaskStore((s) => s.filters)
  const setFilters = useTaskStore((s) => s.setFilters)
  const resetFilters = useTaskStore((s) => s.resetFilters)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const getInboxCount = useTaskStore((s) => s.getInboxCount)
  const addParaItem = useTaskStore((s) => s.addParaItem)

  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    project: true,
    area: true,
    resource: false,
    archive: false,
  })

  const [addingTo, setAddingTo] = useState<ParaType | null>(null)
  const [newItemName, setNewItemName] = useState("")

  function toggleSection(type: string) {
    setExpandedSections((prev) => ({ ...prev, [type]: !prev[type] }))
  }

  function handleSelectInbox() {
    resetFilters()
    setFilters({ paraType: "inbox", status: "inbox" })
  }

  function handleSelectAll() {
    resetFilters()
  }

  function handleSelectParaItem(paraId: string) {
    resetFilters()
    setFilters({ paraId })
  }

  function handleSelectParaType(type: ParaType) {
    resetFilters()
    setFilters({ paraType: type })
  }

  function handleAddItem(type: ParaType) {
    const trimmed = newItemName.trim()
    if (!trimmed) return
    addParaItem({ name: trimmed, type })
    setNewItemName("")
    setAddingTo(null)
  }

  function getTaskCountForPara(paraId: string): number {
    return tasks.filter((t) => t.paraId === paraId && t.status !== "done").length
  }

  function getTaskCountForType(type: ParaType): number {
    const ids = paraItems.filter((p) => p.type === type).map((p) => p.id)
    return tasks.filter((t) => t.paraId && ids.includes(t.paraId) && t.status !== "done").length
  }

  const isAllActive = !filters.paraId && !filters.paraType
  const isInboxActive = filters.paraType === "inbox"

  return (
    <div className="flex h-full w-56 flex-col border-r border-border bg-background">
      <div className="p-3">
        <p className="font-mono text-[10px] uppercase tracking-[0.1em] text-muted-foreground mb-2">
          Navegacion
        </p>
      </div>

      <ScrollArea className="flex-1 px-2">
        {/* All Tasks */}
        <button
          onClick={handleSelectAll}
          className={cn(
            "flex w-full items-center gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
            isAllActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <FolderKanban className="h-4 w-4" />
          <span>Todas</span>
        </button>

        {/* Inbox */}
        <button
          onClick={handleSelectInbox}
          className={cn(
            "flex w-full items-center justify-between gap-2 rounded-sm px-2 py-1.5 text-sm transition-colors",
            isInboxActive
              ? "bg-accent text-accent-foreground"
              : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2">
            <Inbox className="h-4 w-4" />
            <span>Inbox</span>
          </div>
          {getInboxCount() > 0 && (
            <Badge
              variant="secondary"
              className="font-mono text-[10px] px-1.5 py-0 h-4 min-w-[18px] justify-center"
            >
              {getInboxCount()}
            </Badge>
          )}
        </button>

        <Separator className="my-2" />

        {/* PARA Sections */}
        {PARA_SECTIONS.map((section) => {
          const items = paraItems.filter((p) => p.type === section.type)
          const isExpanded = expandedSections[section.type]
          const isTypeActive = filters.paraType === section.type && !filters.paraId
          const typeCount = getTaskCountForType(section.type)

          return (
            <div key={section.type} className="mb-1">
              {/* Section header */}
              <div className="flex w-full items-center gap-1 px-2 py-1 group">
                <div
                  role="button"
                  tabIndex={0}
                  onClick={() => toggleSection(section.type)}
                  onKeyDown={(e) => { if (e.key === "Enter") toggleSection(section.type) }}
                  className="flex flex-1 items-center gap-1 cursor-pointer"
                >
                  <ChevronRight
                    className={cn(
                      "h-3 w-3 text-muted-foreground/50 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                  <span
                    className={cn(
                      "font-mono text-[10px] uppercase tracking-[0.1em] flex-1 text-left",
                      isTypeActive ? "text-foreground" : "text-muted-foreground"
                    )}
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectParaType(section.type)
                    }}
                  >
                    {section.label}
                  </span>
                  {typeCount > 0 && (
                    <span className="font-mono text-[9px] text-muted-foreground/40">
                      {typeCount}
                    </span>
                  )}
                </div>
                <button
                  onClick={() => {
                    setAddingTo(addingTo === section.type ? null : section.type)
                    setExpandedSections((prev) => ({ ...prev, [section.type]: true }))
                  }}
                  className="opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Plus className="h-3 w-3 text-muted-foreground hover:text-foreground" />
                </button>
              </div>

              {/* Items */}
              {isExpanded && (
                <div className="ml-2 space-y-0.5">
                  {items.map((item) => {
                    const isActive = filters.paraId === item.id
                    const count = getTaskCountForPara(item.id)
                    return (
                      <button
                        key={item.id}
                        onClick={() => handleSelectParaItem(item.id)}
                        className={cn(
                          "flex w-full items-center justify-between rounded-sm px-2 py-1 text-xs transition-colors",
                          isActive
                            ? "bg-accent text-accent-foreground"
                            : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
                        )}
                      >
                        <span className="truncate">{item.name}</span>
                        {count > 0 && (
                          <span className="font-mono text-[9px] text-muted-foreground/40 ml-1">
                            {count}
                          </span>
                        )}
                      </button>
                    )
                  })}

                  {/* Add new item inline */}
                  {addingTo === section.type && (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        handleAddItem(section.type)
                      }}
                      className="px-1 py-1"
                    >
                      <Input
                        value={newItemName}
                        onChange={(e) => setNewItemName(e.target.value)}
                        placeholder={`Nuevo ${section.type === "project" ? "proyecto" : section.type === "area" ? "area" : "recurso"}...`}
                        className="h-6 text-xs bg-secondary/50 border-border"
                        autoFocus
                        onBlur={() => {
                          if (!newItemName.trim()) setAddingTo(null)
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Escape") {
                            setAddingTo(null)
                            setNewItemName("")
                          }
                        }}
                      />
                    </form>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </ScrollArea>
    </div>
  )
}
