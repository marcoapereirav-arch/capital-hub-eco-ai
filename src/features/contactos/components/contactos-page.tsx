"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Plus, ChevronRight, LayoutGrid, List, X } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { ContactDrawer } from "./contact-drawer"
import { ContactCreateModal } from "./contact-create-modal"
import { PipelinesKanban } from "./pipelines-kanban"
import { TagFilterButton } from "@/features/tags/components/tag-filter-button"
import { TagChips } from "@/features/tags/components/tag-chips"
import { useContactTagsMap } from "@/features/tags/hooks/use-contact-tags-map"
import { PipelineSelector } from "@/features/pipelines/components/pipeline-selector"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { cn } from "@/lib/utils"

type ContactRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  instagram_username: string | null
  stage: string | null
  products: string[]
  total_revenue: number
  total_cash_collected: number
  source: string | null
  tags: string[] | null
  last_call_at: string | null
  created_at: string
}

// Fallback solo si la BD no tiene pipelines (deberia siempre haberlos tras seed).
// Los stages REALES se leen del pipeline activo via usePipelines().
const FALLBACK_STAGES = [{ value: "lead", label: "Lead" }]

export function ContactosPage({ initialView = "list" }: { initialView?: "list" | "kanban" } = {}) {
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<string | "all">("all")
  const [tagFilter, setTagFilter] = useState<Set<string>>(new Set())
  const [pipelineFilter, setPipelineFilter] = useState<string | "all">("all")
  const [originFilter, setOriginFilter] = useState<string | "all">("all")
  const [ownerFilter, setOwnerFilter] = useState<string | "all">("all")
  const [productFilter, setProductFilter] = useState<string | "all">("all")
  const [dateRange, setDateRange] = useState<"all" | "7d" | "30d" | "90d">("all")
  const [hasCallFilter, setHasCallFilter] = useState<"all" | "yes" | "no">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState<"list" | "kanban">(initialView)
  const { byContact: tagsByContact, allTags } = useContactTagsMap()
  const { pipelines } = usePipelines()
  const { activeId, setActiveId } = useActivePipelineId(pipelines)
  const activePipeline = pipelines.find((p) => p.id === activeId) ?? null
  const PIPELINE_STAGES = activePipeline
    ? activePipeline.stages.map((s) => ({ value: s.key, label: s.name }))
    : FALLBACK_STAGES

  // Opciones únicas derivadas de los contactos cargados (para los dropdowns de filtro)
  const filterOptions = useMemo(() => {
    const origins = new Set<string>()
    const owners = new Set<string>()
    const products = new Set<string>()
    for (const c of contacts) {
      if (c.source) origins.add(c.source)
      const ownerStr = (c as ContactRow & { owner_assignee?: string | null }).owner_assignee
      if (ownerStr) owners.add(ownerStr)
      ;(c.products ?? []).forEach((p) => products.add(p))
    }
    return {
      origins: Array.from(origins).sort(),
      owners: Array.from(owners).sort(),
      products: Array.from(products).sort(),
    }
  }, [contacts])

  async function updateStage(contactId: string, newStage: string) {
    await fetch(`/api/admin/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // pipeline_id se actualiza tambien para que quede asociado al pipeline activo
      body: JSON.stringify({ stage: newStage, pipeline_id: activeId }),
    })
    load()
  }

  useEffect(() => { load() }, [stageFilter])

  async function load() {
    setLoading(true)
    try {
      const url = new URL("/api/admin/contacts", window.location.origin)
      if (stageFilter !== "all") url.searchParams.set("stage", stageFilter)
      const res = await fetch(url.pathname + url.search).then((r) => r.json())
      setContacts(res.contacts ?? [])
    } finally {
      setLoading(false)
    }
  }

  const filtered = (() => {
    let out = contacts
    if (search) {
      const q = search.toLowerCase()
      out = out.filter((c) => (
        c.full_name?.toLowerCase().includes(q) ||
        c.email?.toLowerCase().includes(q) ||
        c.phone?.toLowerCase().includes(q) ||
        c.instagram_username?.toLowerCase().includes(q)
      ))
    }
    if (tagFilter.size > 0) {
      out = out.filter((c) => {
        const tags = tagsByContact.get(c.id) ?? []
        return tags.some((t) => tagFilter.has(t.id))
      })
    }
    if (pipelineFilter !== "all") {
      out = out.filter((c) => (c as ContactRow & { pipeline_id?: string | null }).pipeline_id === pipelineFilter)
    }
    if (originFilter !== "all") {
      out = out.filter((c) => c.source === originFilter)
    }
    if (ownerFilter !== "all") {
      out = out.filter((c) => (c as ContactRow & { owner_assignee?: string | null }).owner_assignee === ownerFilter)
    }
    if (productFilter !== "all") {
      out = out.filter((c) => (c.products ?? []).includes(productFilter))
    }
    if (dateRange !== "all") {
      const days = dateRange === "7d" ? 7 : dateRange === "30d" ? 30 : 90
      const cutoff = Date.now() - days * 24 * 60 * 60 * 1000
      out = out.filter((c) => new Date(c.created_at).getTime() >= cutoff)
    }
    if (hasCallFilter !== "all") {
      out = out.filter((c) => hasCallFilter === "yes" ? !!c.last_call_at : !c.last_call_at)
    }
    return out
  })()

  const activeFiltersCount =
    (stageFilter !== "all" ? 1 : 0) +
    (pipelineFilter !== "all" ? 1 : 0) +
    (originFilter !== "all" ? 1 : 0) +
    (ownerFilter !== "all" ? 1 : 0) +
    (productFilter !== "all" ? 1 : 0) +
    (dateRange !== "all" ? 1 : 0) +
    (hasCallFilter !== "all" ? 1 : 0) +
    (tagFilter.size > 0 ? 1 : 0)

  function clearAllFilters() {
    setStageFilter("all")
    setPipelineFilter("all")
    setOriginFilter("all")
    setOwnerFilter("all")
    setProductFilter("all")
    setDateRange("all")
    setHasCallFilter("all")
    setTagFilter(new Set())
    setSearch("")
  }

  // Toolbar adaptado a la pestaña. Cada pestaña respeta su ecosistema:
  // - Contactos (list): set completo de filtros para buscar/filtrar por lo que sea.
  // - Pipeline (kanban): selector de pipeline + filtros del pipeline activo.
  const filterSelectClass = "h-8 rounded-sm border border-border bg-background px-2 text-xs"
  const Toolbar = (
    <div className="flex flex-col gap-2">
      {/* Fila 1: búsqueda + acción principal */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, email, teléfono, Instagram…"
            className="w-full h-8 rounded-sm border border-border bg-background pl-8 pr-2 text-sm"
          />
        </div>
        {view === "kanban" && (
          <PipelineSelector pipelines={pipelines} activeId={activeId} onChange={setActiveId} />
        )}
        <div className="flex-1" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {filtered.length} contacto{filtered.length === 1 ? "" : "s"}
        </span>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
        >
          <Plus className="h-3 w-3" /> Nuevo
        </button>
      </div>

      {/* Fila 2: filtros (solo en pestaña Contactos · list). En kanban el filtrado vive en el pipeline. */}
      {view === "list" && (
        <div className="flex flex-wrap items-center gap-2">
          <TagFilterButton allTags={allTags} selected={tagFilter} onChange={setTagFilter} />

          <select value={pipelineFilter} onChange={(e) => setPipelineFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">Pipeline · todos</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>

          <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">Stage · todos</option>
            {PIPELINE_STAGES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>

          <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">Origen · todos</option>
            {filterOptions.origins.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">Owner · todos</option>
            {filterOptions.owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </select>

          <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={filterSelectClass}>
            <option value="all">Producto · todos</option>
            {filterOptions.products.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>

          <select value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)} className={filterSelectClass}>
            <option value="all">Fecha · cualquiera</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </select>

          <select value={hasCallFilter} onChange={(e) => setHasCallFilter(e.target.value as typeof hasCallFilter)} className={filterSelectClass}>
            <option value="all">Llamada · cualquiera</option>
            <option value="yes">Con llamada</option>
            <option value="no">Sin llamada</option>
          </select>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex items-center gap-1 h-8 rounded-sm border border-border bg-background px-2 text-xs text-muted-foreground hover:text-foreground hover:border-foreground/40 transition-colors"
              title="Limpiar todos los filtros"
            >
              <X className="h-3 w-3" />
              <span>Limpiar ({activeFiltersCount})</span>
            </button>
          )}
        </div>
      )}
    </div>
  )

  // KANBAN: layout columnar fijo - toolbar ARRIBA fijo + kanban con scroll H solo
  // h-[calc(100vh-...)] fuerza altura visible sin que el wrapper main scrollee verticalmente.
  // En este modo no queremos scroll vertical de la pagina entera, solo de cada columna.
  if (view === "kanban") {
    return (
      <>
        <div className="flex h-[calc(100vh-9rem)] md:h-[calc(100vh-9rem)] min-h-0 min-w-0 flex-col">
          {/* Toolbar fijo arriba */}
          <div className="shrink-0 border-b border-border bg-background px-4 md:px-6 py-3">
            {Toolbar}
          </div>
          {/* Kanban: scroll H aislado en este area. Padding va al CONTENIDO interior
              (no al contenedor scrollable) para que ambos extremos respeten margen
              incluso cuando el usuario scrollea hasta el final. */}
          <div className="flex-1 min-h-0 min-w-0 overflow-x-auto overflow-y-hidden py-4">
            {loading ? (
              <div className="text-center py-12 text-sm text-muted-foreground">Cargando…</div>
            ) : (
              <PipelinesKanban
                contacts={filtered}
                stages={PIPELINE_STAGES}
                onUpdateStage={updateStage}
                onSelect={setSelectedId}
                tagsByContact={tagsByContact}
              />
            )}
          </div>
        </div>

        {selectedId && (
          <ContactDrawer
            contactId={selectedId}
            onClose={() => setSelectedId(null)}
            onUpdate={() => load()}
            stages={PIPELINE_STAGES}
          />
        )}
        {creating && <ContactCreateModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />}
      </>
    )
  }

  // LISTA: layout normal con PageContainer
  return (
    <>
      <PageContainer>
        {Toolbar}

        {/* Vista lista */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground rounded-md border border-dashed border-border">
            {search || stageFilter !== "all" ? "Sin resultados con esos filtros." : "Aún no hay contactos."}
          </div>
        ) : (
          <div className="rounded-md border border-border/40 divide-y divide-border/40 overflow-hidden">
            {filtered.map((c) => {
              const stage = PIPELINE_STAGES.find((s) => s.value === c.stage)
              const contactTags = tagsByContact.get(c.id) ?? []
              return (
                <button
                  key={c.id}
                  onClick={() => setSelectedId(c.id)}
                  className="w-full flex items-center justify-between gap-3 px-3 py-2.5 hover:bg-card/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="h-7 w-7 rounded-full bg-secondary/40 flex items-center justify-center text-[10px] font-mono uppercase shrink-0">
                      {c.full_name.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm truncate">{c.full_name}</div>
                      <div className="flex items-center gap-3 text-[10px] font-mono text-muted-foreground">
                        <span className="truncate">{c.email}</span>
                        {c.phone && <span className="truncate">{c.phone}</span>}
                      </div>
                      {contactTags.length > 0 && (
                        <div className="mt-1">
                          <TagChips tags={contactTags} max={4} size="xs" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="hidden md:flex items-center gap-4 text-[10px] font-mono uppercase tracking-wider text-muted-foreground shrink-0">
                    {c.products?.length > 0 && (
                      <span>{c.products.length} producto{c.products.length === 1 ? "" : "s"}</span>
                    )}
                    {c.total_revenue > 0 && (
                      <span className="text-green-400">
                        {c.total_revenue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}€
                      </span>
                    )}
                  </div>

                  {stage && (
                    <span className={cn(
                      "shrink-0 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                      stage.value === "alumno" && "border-green-500/40 text-green-400",
                      stage.value === "perdido" && "border-red-500/40 text-red-400",
                      stage.value === "no_show" && "border-red-500/40 text-red-400",
                      stage.value === "seguimiento" && "border-violet-500/40 text-violet-400",
                      stage.value === "agendado" && "border-amber-500/40 text-amber-400",
                      stage.value === "lead" && "border-cyan-500/40 text-cyan-400"
                    )}>
                      {stage.label}
                    </span>
                  )}

                  <ChevronRight className="h-3 w-3 text-muted-foreground shrink-0" />
                </button>
              )
            })}
          </div>
        )}
      </PageContainer>

      {selectedId && (
        <ContactDrawer
          contactId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={() => load()}
          stages={PIPELINE_STAGES}
        />
      )}

      {creating && (
        <ContactCreateModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false)
            setSelectedId(id)
            load()
          }}
        />
      )}
    </>
  )
}
