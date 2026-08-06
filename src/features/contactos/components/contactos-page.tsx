"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Plus, ChevronRight, SlidersHorizontal, X } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { ContactDrawer } from "./contact-drawer"
import { ContactCreateModal } from "./contact-create-modal"
import { PipelinesKanban } from "./pipelines-kanban"
import { TagFilterButton, TagFilterList } from "@/features/tags/components/tag-filter-button"
import { TagChips } from "@/features/tags/components/tag-chips"
import { useContactTagsMap } from "@/features/tags/hooks/use-contact-tags-map"
import { PipelineSelector } from "@/features/pipelines/components/pipeline-selector"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { SaleStagePrompt } from "@/features/sales/components/sale-stage-prompt"
import { clasesDeStage } from "./stage-chip"
import { cn } from "@/lib/utils"

type SalePrefill = React.ComponentProps<typeof RegistrarVentaModal>["prefill"]

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

/** Desplegable nativo con los estilos del tema: 44 puntos en telefono. */
const CLASES_SELECT =
  "h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-base text-foreground md:h-8 md:px-2 md:text-sm"

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
  // En telefono los 8 filtros viven dentro de una hoja inferior: ocho desplegables
  // apilados en 375 puntos es lo que hacia que esto no pareciera una app.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [view, setView] = useState<"list" | "kanban">(initialView)
  // Flujo "mover a Alumno": popup ahora/mas tarde + modal de venta prefilled.
  const [salePromptContact, setSalePromptContact] = useState<ContactRow | null>(null)
  const [saleModalPrefill, setSaleModalPrefill] = useState<SalePrefill>(undefined)
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
    // Mover a Alumno a mano NO persiste directo: preguntamos si se registra la venta
    // ahora (da el acceso) o mas tarde (queda pendiente en el dashboard).
    if (newStage === "alumno") {
      const c = contacts.find((x) => x.id === contactId)
      if (c) { setSalePromptContact(c); return }
    }
    await persistStage(contactId, newStage)
  }

  async function persistStage(contactId: string, newStage: string, salePending = false) {
    await fetch(`/api/admin/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      // pipeline_id se actualiza tambien para que quede asociado al pipeline activo
      body: JSON.stringify({
        stage: newStage,
        pipeline_id: activeId,
        ...(newStage === "alumno" ? { sale_pending: salePending } : {}),
      }),
    })
    load()
  }

  // Popup "mover a Alumno": rellenar la venta ahora (abre el modal) o mas tarde (pendiente).
  function handleSaleNow() {
    const c = salePromptContact
    setSalePromptContact(null)
    if (!c) return
    setSaleModalPrefill({
      contact_id: c.id,
      full_name: c.full_name,
      email: c.email,
      phone: c.phone ?? "",
      products: c.products ?? [],
      close_type: "direct",
    })
  }
  async function handleSaleLater() {
    const c = salePromptContact
    setSalePromptContact(null)
    if (!c) return
    await persistStage(c.id, "alumno", true)
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
    // Filtro por pipeline activo SOLO aplica en vista KANBAN (donde existe el PipelineSelector).
    // En vista LISTA mostramos TODOS los contactos por defecto; si Marco quiere filtrar por pipeline
    // usa el dropdown 'Pipeline' de la barra de filtros (pipelineFilter mas abajo).
    // Marco 2026-06-20: el PipelineSelector NO existe en vista lista, asi que aplicar este filtro
    // ahi hacia desaparecer contactos sin explicacion visible (bug). Fix: scoped a kanban.
    if (view === "kanban" && activeId) {
      out = out.filter((c) => (c as ContactRow & { pipeline_id?: string | null }).pipeline_id === activeId)
    }
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
    // pipelineFilter del dropdown de la barra de filtros se mantiene como filtro adicional
    // (por si Marco quiere ver contactos de otro pipeline diferente al activo en una vista mezclada).
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

  // Los desplegables se pintan una sola vez y se reutilizan en la hoja del telefono
  // y en la fila del ordenador: la logica de filtrado no se duplica.
  const camposDeFiltro = (
    <>
      <CampoFiltro etiqueta="Pipeline">
        <select value={pipelineFilter} onChange={(e) => setPipelineFilter(e.target.value)} className={CLASES_SELECT}>
          <option value="all">Todos</option>
          {pipelines.map((p) => (
            <option key={p.id} value={p.id}>{p.name}</option>
          ))}
        </select>
      </CampoFiltro>

      <CampoFiltro etiqueta="Stage">
        <select value={stageFilter} onChange={(e) => setStageFilter(e.target.value)} className={CLASES_SELECT}>
          <option value="all">Todos</option>
          {PIPELINE_STAGES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </CampoFiltro>

      <CampoFiltro etiqueta="Origen">
        <select value={originFilter} onChange={(e) => setOriginFilter(e.target.value)} className={CLASES_SELECT}>
          <option value="all">Todos</option>
          {filterOptions.origins.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </CampoFiltro>

      <CampoFiltro etiqueta="Owner">
        <select value={ownerFilter} onChange={(e) => setOwnerFilter(e.target.value)} className={CLASES_SELECT}>
          <option value="all">Todos</option>
          {filterOptions.owners.map((o) => (
            <option key={o} value={o}>{o}</option>
          ))}
        </select>
      </CampoFiltro>

      <CampoFiltro etiqueta="Producto">
        <select value={productFilter} onChange={(e) => setProductFilter(e.target.value)} className={CLASES_SELECT}>
          <option value="all">Todos</option>
          {filterOptions.products.map((p) => (
            <option key={p} value={p}>{p}</option>
          ))}
        </select>
      </CampoFiltro>

      <CampoFiltro etiqueta="Fecha">
        <select value={dateRange} onChange={(e) => setDateRange(e.target.value as typeof dateRange)} className={CLASES_SELECT}>
          <option value="all">Cualquiera</option>
          <option value="7d">Últimos 7 días</option>
          <option value="30d">Últimos 30 días</option>
          <option value="90d">Últimos 90 días</option>
        </select>
      </CampoFiltro>

      <CampoFiltro etiqueta="Llamada">
        <select value={hasCallFilter} onChange={(e) => setHasCallFilter(e.target.value as typeof hasCallFilter)} className={CLASES_SELECT}>
          <option value="all">Cualquiera</option>
          <option value="yes">Con llamada</option>
          <option value="no">Sin llamada</option>
        </select>
      </CampoFiltro>
    </>
  )

  const Toolbar = (
    <div className="flex flex-col gap-2">
      {/* TELEFONO: la busqueda ocupa su propia linea y solo se ven DOS acciones,
          la principal en verde y el boton de Filtros con el numero de activos. */}
      <div className="flex flex-col gap-2 md:hidden">
        <div className="relative">
          <Search className="absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, email, teléfono, Instagram…"
            inputMode="search"
            enterKeyHint="search"
            className="h-11 w-full rounded-lg border border-border bg-card pr-3 pl-10 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        {view === "kanban" && (
          <PipelineSelector pipelines={pipelines} activeId={activeId} onChange={setActiveId} />
        )}
        <div className="flex gap-2">
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90"
          >
            <Plus className="h-4 w-4" /> Nuevo contacto
          </button>
          {view === "list" && (
            <button
              onClick={() => setFiltrosAbiertos(true)}
              className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-4 text-[15px] text-foreground"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && <span className="tabular-nums">({activeFiltersCount})</span>}
            </button>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">{filtered.length}</span> contacto{filtered.length === 1 ? "" : "s"}
        </p>
      </div>

      {/* ORDENADOR: la barra entera en dos filas, como estaba. */}
      <div className="hidden md:flex md:flex-col md:gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-0 max-w-md flex-1">
            <Search className="absolute top-1/2 left-2.5 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, email, teléfono, Instagram…"
              className="h-11 w-full rounded-lg border border-border bg-card pr-2 pl-9 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-8 md:text-sm"
            />
          </div>
          {view === "kanban" && (
            <PipelineSelector pipelines={pipelines} activeId={activeId} onChange={setActiveId} />
          )}
          <div className="flex-1" />
          <span className="text-sm text-muted-foreground">
            <span className="tabular-nums">{filtered.length}</span> contacto{filtered.length === 1 ? "" : "s"}
          </span>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground md:h-8 md:text-sm"
          >
            <Plus className="h-4 w-4" /> Nuevo
          </button>
        </div>

        {view === "list" && (
          <div className="flex flex-wrap items-end gap-2">
            <TagFilterButton allTags={allTags} selected={tagFilter} onChange={setTagFilter} />
            {camposDeFiltro}
            {activeFiltersCount > 0 && (
              <button
                onClick={clearAllFilters}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm text-muted-foreground transition-colors md:h-8 md:hover:text-foreground"
                title="Limpiar todos los filtros"
              >
                <X className="h-4 w-4" />
                <span>Limpiar (<span className="tabular-nums">{activeFiltersCount}</span>)</span>
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )

  // Hoja de filtros del telefono. Los mismos desplegables, uno debajo de otro, a
  // 44 puntos y con su etiqueta encima.
  const hojaDeFiltros = (
    <Sheet open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
      <SheetContent side="bottom" className="max-h-[85dvh] w-full gap-0 overflow-y-auto rounded-t-xl pb-safe-4 md:hidden">
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
        <SheetHeader className="px-4">
          <SheetTitle className="text-[17px] font-semibold">Filtros</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-2">
          <div>
            <Etiqueta>Tags</Etiqueta>
            <div className="mt-1.5 max-h-56 overflow-y-auto rounded-lg border border-border bg-card">
              <TagFilterList allTags={allTags} selected={tagFilter} onChange={setTagFilter} />
            </div>
          </div>
          {camposDeFiltro}
        </div>

        <div className="sticky bottom-0 z-10 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-2">
          <button
            onClick={clearAllFilters}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground"
          >
            Limpiar{activeFiltersCount > 0 && <> (<span className="tabular-nums">{activeFiltersCount}</span>)</>}
          </button>
          <button
            onClick={() => setFiltrosAbiertos(false)}
            className="h-11 flex-1 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90"
          >
            Ver <span className="tabular-nums">{filtered.length}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )

  const fichas = (
    <>
      {selectedId && (
        <ContactDrawer
          contactId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={() => load()}
          stages={PIPELINE_STAGES}
          pipelines={pipelines.map((p) => ({
            id: p.id,
            name: p.name,
            slug: p.slug,
            stages: [...p.stages]
              .sort((a, b) => a.sortOrder - b.sortOrder)
              .map((s) => ({ key: s.key, name: s.name })),
          }))}
        />
      )}
      {creating && (
        <ContactCreateModal
          onClose={() => setCreating(false)}
          onCreated={(id) => {
            setCreating(false)
            if (view === "list") setSelectedId(id)
            load()
          }}
        />
      )}
      {salePromptContact && (
        <SaleStagePrompt
          contactName={salePromptContact.full_name}
          onNow={handleSaleNow}
          onLater={handleSaleLater}
          onClose={() => setSalePromptContact(null)}
        />
      )}
      {saleModalPrefill && (
        <RegistrarVentaModal
          prefill={saleModalPrefill}
          onClose={() => setSaleModalPrefill(undefined)}
          onRegistered={() => load()}
        />
      )}
    </>
  )

  // KANBAN: la barra queda fija arriba y el tablero ocupa el resto. En telefono el
  // tablero NO se estrecha: se ve una columna cada vez (lo resuelve PipelinesKanban).
  if (view === "kanban") {
    return (
      <>
        <div className="flex h-full min-h-0 min-w-0 flex-col">
          <div className="shrink-0 border-b border-border bg-background px-4 py-3 md:px-6">
            {Toolbar}
          </div>

          {/* Numeros del pipeline activo (suma sobre los contactos visibles, respeta filtros). */}
          <div className="shrink-0 border-b border-border bg-background px-4 py-2 md:px-6">
            {(() => {
              const totalRev = filtered.reduce((acc, c) => acc + (Number(c.total_revenue) || 0), 0)
              const totalCash = filtered.reduce((acc, c) => acc + (Number(c.total_cash_collected) || 0), 0)
              const alumnos = filtered.filter((c) => c.stage === "alumno").length
              const fmt = (n: number) => n.toLocaleString("es-ES", { maximumFractionDigits: 0 })
              const pipelineLabel = activePipeline?.name ?? "Pipeline"
              return (
                <>
                  <div className="mb-1 text-sm font-semibold text-muted-foreground md:hidden">
                    {pipelineLabel}
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1 md:flex md:items-center md:gap-4">
                    <span className="hidden text-sm font-semibold text-muted-foreground md:inline">
                      {pipelineLabel}
                    </span>
                    <Kpi label="Contactos" value={fmt(filtered.length)} />
                    <Kpi label="Alumnos" value={fmt(alumnos)} destacado />
                    <Kpi label="Facturacion total" value={`${fmt(totalRev)} EUR`} destacado />
                    <Kpi label="Cash collected" value={`${fmt(totalCash)} EUR`} />
                  </div>
                </>
              )
            })()}
          </div>

          <div className="min-h-0 min-w-0 flex-1">
            {loading ? (
              <LoadingScreen fullscreen={false} className="min-h-[200px]" />
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

        {fichas}
      </>
    )
  }

  // LISTA
  return (
    <>
      <PageContainer>
        {Toolbar}

        {loading ? (
          <LoadingScreen fullscreen={false} className="min-h-[200px]" />
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
            <h3 className="text-[17px] font-semibold text-foreground">
              {search || activeFiltersCount > 0 ? "Sin resultados con esos filtros" : "Todavía no hay contactos"}
            </h3>
            <p className="max-w-[38ch] text-[15px] text-muted-foreground">
              {search || activeFiltersCount > 0
                ? "Quita algún filtro o prueba con otra búsqueda."
                : "Los contactos que crees o que lleguen desde los formularios aparecen aquí."}
            </p>
            {search || activeFiltersCount > 0 ? (
              <button
                onClick={clearAllFilters}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-4 text-[15px] text-foreground"
              >
                <X className="h-4 w-4" /> Limpiar filtros
              </button>
            ) : (
              <button
                onClick={() => setCreating(true)}
                className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90"
              >
                <Plus className="h-4 w-4" /> Crear el primero
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-border">
            {/* TELEFONO: una ficha por contacto. Tres datos: quien es, como se le
                escribe y en que stage esta. El resto se ve al abrir la ficha. */}
            <ul className="divide-y divide-border md:hidden">
              {filtered.map((c) => {
                const stage = PIPELINE_STAGES.find((s) => s.value === c.stage)
                const contactTags = tagsByContact.get(c.id) ?? []
                return (
                  <li key={c.id}>
                    <button
                      onClick={() => setSelectedId(c.id)}
                      className="flex min-h-[56px] w-full flex-col gap-1 px-4 py-3 text-left active:bg-muted"
                    >
                      <span className="flex items-center gap-2">
                        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                          {c.full_name.charAt(0)}
                        </span>
                        <span className="min-w-0 flex-1 truncate text-[15px] font-medium text-foreground">
                          {c.full_name}
                        </span>
                        {stage && (
                          <span className={cn("shrink-0 rounded-sm border px-2 py-0.5 text-sm", clasesDeStage(stage.value))}>
                            {stage.label}
                          </span>
                        )}
                      </span>
                      <span className="flex flex-wrap items-center gap-x-2 gap-y-1 pl-10 text-sm text-muted-foreground">
                        <span className="min-w-0 truncate">{c.email}</span>
                        {c.phone && <span className="tabular-nums">{c.phone}</span>}
                        {c.total_revenue > 0 && (
                          <span className="tabular-nums text-primary">
                            {c.total_revenue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}€
                          </span>
                        )}
                      </span>
                      {contactTags.length > 0 && (
                        <span className="block pl-10">
                          <TagChips tags={contactTags} max={4} size="xs" />
                        </span>
                      )}
                    </button>
                  </li>
                )
              })}
            </ul>

            {/* ORDENADOR: la fila de siempre, con sitio de sobra a lo ancho. */}
            <div className="hidden divide-y divide-border md:block">
              {filtered.map((c) => {
                const stage = PIPELINE_STAGES.find((s) => s.value === c.stage)
                const contactTags = tagsByContact.get(c.id) ?? []
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedId(c.id)}
                    className="flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left transition-colors hover:bg-card"
                  >
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                        {c.full_name.charAt(0)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm text-foreground">{c.full_name}</div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground">
                          <span className="truncate">{c.email}</span>
                          {c.phone && <span className="truncate tabular-nums">{c.phone}</span>}
                        </div>
                        {contactTags.length > 0 && (
                          <div className="mt-1">
                            <TagChips tags={contactTags} max={4} size="xs" />
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex shrink-0 items-center gap-4 text-sm text-muted-foreground">
                      {c.products?.length > 0 && (
                        <span className="tabular-nums">
                          {c.products.length} producto{c.products.length === 1 ? "" : "s"}
                        </span>
                      )}
                      {c.total_revenue > 0 && (
                        <span className="tabular-nums text-primary">
                          {c.total_revenue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}€
                        </span>
                      )}
                    </div>

                    {stage && (
                      <span className={cn("shrink-0 rounded-sm border px-2 py-0.5 text-sm", clasesDeStage(stage.value))}>
                        {stage.label}
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                )
              })}
            </div>
          </div>
        )}
      </PageContainer>

      {hojaDeFiltros}
      {fichas}
    </>
  )
}

/** Etiqueta encima del campo, nunca al lado: en telefono al lado no cabe. */
function CampoFiltro({ etiqueta, children }: { etiqueta: string; children: React.ReactNode }) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5 md:w-40">
      <Etiqueta>{etiqueta}</Etiqueta>
      {children}
    </label>
  )
}

/**
 * Numero de cabecera del kanban. El valor arriba y la etiqueta debajo, para que
 * en dos columnas de telefono no se pisen.
 */
function Kpi({ label, value, destacado }: { label: string; value: string; destacado?: boolean }) {
  return (
    <div className="flex min-w-0 flex-col md:flex-row md:items-baseline md:gap-1.5">
      <span className={cn("truncate text-[15px] font-semibold tabular-nums md:text-sm", destacado ? "text-primary" : "text-foreground")}>
        {value}
      </span>
      <span className="truncate text-sm text-muted-foreground">{label}</span>
    </div>
  )
}

/**
 * Etiqueta de un campo. Va en su propio componente a proposito: escrita pegada
 * al <input> el candado la confunde con la letra DEL campo (mira dos lineas
 * arriba y dos abajo) y bloquea el guardado. Aqui la clase no toca ningun campo.
 */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>
}
