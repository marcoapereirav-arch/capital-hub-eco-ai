"use client"

import { useEffect } from "react"
import {
  FolderKanban,
  Inbox,
  Compass,
  BookOpen,
  Archive,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  PageNavHeader,
  type PageNavGroup,
} from "@/features/shell/components/page-nav-header"
import { TaskBoard } from "./task-board"
import { TaskList } from "./task-list"
import { TaskDetail } from "./task-detail"
import { TaskQuickCapture } from "./task-quick-capture"
import { TaskFilters } from "./task-filters"
import { useTaskStore } from "../store/task-store"
import type { ParaType } from "../types/task"

const ALL_ID = "__all"
const INBOX_ID = "__inbox"
const TYPE_PREFIX = "type:"
const ITEM_PREFIX = "item:"

const PARA_TYPES: { type: ParaType; label: string; icon: typeof Inbox; addLabel: string }[] = [
  { type: "project", label: "Proyectos", icon: FolderKanban, addLabel: "Nuevo proyecto" },
  { type: "area", label: "Areas", icon: Compass, addLabel: "Nueva area" },
  { type: "resource", label: "Recursos", icon: BookOpen, addLabel: "Nuevo recurso" },
  { type: "archive", label: "Archivo", icon: Archive, addLabel: "Nuevo en archivo" },
]

export function TaskPage() {
  const viewMode = useTaskStore((s) => s.viewMode)
  const init = useTaskStore((s) => s.init)
  const cleanup = useTaskStore((s) => s.cleanup)
  const initialized = useTaskStore((s) => s.initialized)
  const loading = useTaskStore((s) => s.loading)
  const error = useTaskStore((s) => s.error)
  const filters = useTaskStore((s) => s.filters)
  const setFilters = useTaskStore((s) => s.setFilters)
  const resetFilters = useTaskStore((s) => s.resetFilters)
  const paraItems = useTaskStore((s) => s.paraItems)
  const tasks = useTaskStore((s) => s.tasks)
  const getInboxCount = useTaskStore((s) => s.getInboxCount)
  const addParaItem = useTaskStore((s) => s.addParaItem)

  useEffect(() => {
    init()
    return () => cleanup()
  }, [init, cleanup])

  const activeId = filters.paraId
    ? `${ITEM_PREFIX}${filters.paraId}`
    : filters.paraType === "inbox"
      ? INBOX_ID
      : filters.paraType
        ? `${TYPE_PREFIX}${filters.paraType}`
        : ALL_ID

  function handleSelect(id: string) {
    if (id === ALL_ID) {
      resetFilters()
      return
    }
    if (id === INBOX_ID) {
      resetFilters()
      setFilters({ paraType: "inbox", status: "inbox" })
      return
    }
    if (id.startsWith(TYPE_PREFIX)) {
      const type = id.slice(TYPE_PREFIX.length) as ParaType
      resetFilters()
      setFilters({ paraType: type })
      return
    }
    if (id.startsWith(ITEM_PREFIX)) {
      const paraId = id.slice(ITEM_PREFIX.length)
      resetFilters()
      setFilters({ paraId })
    }
  }

  function handleAddPara(type: ParaType, label: string) {
    const name = window.prompt(`${label}:`)?.trim()
    if (!name) return
    addParaItem({ name, type })
  }

  function getCountForPara(paraId: string): number {
    return tasks.filter((t) => t.paraId === paraId && t.status !== "done").length
  }

  function getCountForType(type: ParaType): number {
    const ids = paraItems.filter((p) => p.type === type).map((p) => p.id)
    return tasks.filter((t) => t.paraId && ids.includes(t.paraId) && t.status !== "done").length
  }

  const groups: PageNavGroup[] = [
    {
      items: [
        { id: ALL_ID, label: "Todas", icon: FolderKanban },
        { id: INBOX_ID, label: "Inbox", icon: Inbox, count: getInboxCount() },
      ],
    },
    ...PARA_TYPES.map((section) => {
      const items = paraItems.filter((p) => p.type === section.type)
      return {
        label: section.label,
        items: [
          {
            id: `${TYPE_PREFIX}${section.type}`,
            label: `Todos (${section.label.toLowerCase()})`,
            icon: section.icon,
            count: getCountForType(section.type),
          },
          ...items.map((item) => ({
            id: `${ITEM_PREFIX}${item.id}`,
            label: item.name,
            count: getCountForPara(item.id),
          })),
        ],
      }
    }),
  ]

  const addMenu = (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="sm"
          variant="ghost"
          className="h-8 gap-1.5 text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" />
          <span className="text-xs">Nuevo</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {PARA_TYPES.filter((t) => t.type !== "archive").map((section) => (
          <DropdownMenuItem
            key={section.type}
            onSelect={() => handleAddPara(section.type, section.addLabel)}
            className="cursor-pointer"
          >
            <section.icon className="h-3.5 w-3.5" />
            <span>{section.addLabel}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )

  return (
    <div className="absolute inset-0 flex flex-col">
      <PageNavHeader
        title="Tareas"
        groups={groups}
        activeId={activeId}
        onSelect={handleSelect}
        rightSlot={addMenu}
      />

      <div className="flex flex-1 flex-col min-w-0 min-h-0">
        <div className="shrink-0 flex flex-col gap-3 border-b border-border px-4 py-3">
          <TaskQuickCapture />
          <TaskFilters />
        </div>

        <div className="flex-1 min-h-0 overflow-x-auto overflow-y-auto p-4">
          {error && (
            <div className="mb-3 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
              {error}
            </div>
          )}
          {loading && !initialized ? (
            <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
              Cargando tareas…
            </div>
          ) : viewMode === "board" ? (
            <TaskBoard />
          ) : (
            <TaskList />
          )}
        </div>
      </div>

      <TaskDetail />
    </div>
  )
}
