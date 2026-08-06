"use client"

import { useEffect, useMemo, useState } from "react"
import { Search, Plus, ChevronRight, X, Phone, Mail } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { ContactDrawer } from "./contact-drawer"
import { ContactCreateModal } from "./contact-create-modal"
import { PipelinesKanban } from "./pipelines-kanban"
import { TagFilterButton } from "@/features/tags/components/tag-filter-button"
import { TagChips } from "@/features/tags/components/tag-chips"
import { useContactTagsMap } from "@/features/tags/hooks/use-contact-tags-map"
import { PipelineSelector } from "@/features/pipelines/components/pipeline-selector"
import { usePipelines, useActivePipelineId } from "@/features/pipelines/hooks/use-pipelines"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { SaleStagePrompt } from "@/features/sales/components/sale-stage-prompt"
import { BTN_PRIMARY, FIELD, stageTone, stageRank } from "@/features/crm/lib/brand"
import { cn } from "@/lib/utils"

type SalePrefill = React.ComponentProps<typeof RegistrarVentaModal>["prefill"]

type ContactRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  instagram_username: string | null
  stage: string | null
  pipeline_id: string | null
  products: string[]
  total_revenue: number
  total_cash_collected: number
  source: string | null
  owner_assignee: string | null
  tags: string[] | null
  last_call_at: string | null
  created_at: string
}

// Fallback solo si la BD no tiene pipelines (deberia siempre haberlos tras seed).
// Los stages REALES se leen del pipeline activo via usePipelines().
const FALLBACK_STAGES = [{ value: "lead", label: "Lead" }]

const eur = (n: number) => `${Math.round(n).toLocaleString("es-ES")} EUR`

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
  // La vista la fija la URL (/crm/contactos = lista, /crm/pipeline = kanban).
  // No hay conmutador interno: cada sub-pestana es su propia direccion (SOP producto/13).
  const view = initialView
  // Flujo "mover a Alumno": popup ahora/mas tarde + modal de venta prefilled.
  const [salePromptContact, setSalePromptContact] = useState<ContactRow | null>(null)
  const [saleModalPrefill, setSaleModalPrefill] = useState<SalePrefill>(undefined)
  const { byContact: tagsByContact, allTags } = useContactTagsMap()
  const { pipelines } = usePipelines()
  const { activeId, setActiveId } = useActivePipelineId(pipelines)
  const activePipeline = pipelines.find((p) => p.id === activeId) ?? null

  // Stages del pipeline ACTIVO: son las columnas del kanban.
  const PIPELINE_STAGES = activePipeline
    ? [...activePipeline.stages]
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map((s) => ({ value: s.key, label: s.name }))
    : FALLBACK_STAGES

  /**
   * Stages de TODOS los pipelines, sin repetir y en orden de funnel.
   *
   * La LISTA no es de un pipeline: enseña los contactos de todos a la vez. Usar ahi los
   * stages de uno solo dejaba la pantalla coja de dos maneras (visto el 2026-08-06 con el
   * pipeline "General" activo, que no tiene columna Lead):
   *   - el desplegable de Stage no ofrecia "Lead", el stage con MAS contactos
   *   - las fichas de esos contactos salian SIN su etiqueta de stage, porque el nombre
   *     del stage se buscaba en una lista donde no estaba
   */
  const ALL_STAGES = useMemo(() => {
    const porClave = new Map<string, string>()
    for (const p of pipelines) {
      for (const s of p.stages) {
        if (!porClave.has(s.key)) porClave.set(s.key, s.name)
      }
    }
    return Array.from(porClave, ([value, label]) => ({ value, label }))
      .sort((a, b) => stageRank(a.value) - stageRank(b.value))
  }, [pipelines])

  // Lo que manda en cada vista: el kanban pinta SU pipeline, la lista los conoce todos.
  const STAGES_VISIBLES =
    view === "kanban" ? PIPELINE_STAGES : (ALL_STAGES.length > 0 ? ALL_STAGES : PIPELINE_STAGES)

  /**
   * Pipelines con sus columnas, para la ficha del contacto. La ficha usa las columnas
   * del pipeline AL QUE PERTENECE ese contacto, no las del kanban que se este mirando:
   * asi el desplegable de stage nunca ofrece uno que ahi no existe.
   */
  const pipelinesParaFicha = useMemo(
    () =>
      pipelines.map((p) => ({
        id: p.id,
        name: p.name,
        slug: p.slug,
        stages: [...p.stages]
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map((s) => ({ key: s.key, name: s.name })),
      })),
    [pipelines]
  )

  // Opciones únicas derivadas de los contactos cargados (para los dropdowns de filtro)
  const filterOptions = useMemo(() => {
    const origins = new Set<string>()
    const owners = new Set<string>()
    const products = new Set<string>()
    for (const c of contacts) {
      if (c.source) origins.add(c.source)
      if (c.owner_assignee) owners.add(c.owner_assignee)
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
      out = out.filter((c) => c.pipeline_id === activeId)
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
      out = out.filter((c) => c.pipeline_id === pipelineFilter)
    }
    if (originFilter !== "all") {
      out = out.filter((c) => c.source === originFilter)
    }
    if (ownerFilter !== "all") {
      out = out.filter((c) => c.owner_assignee === ownerFilter)
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
  const Toolbar = (
    <div className="flex flex-col gap-3">
      {/* Fila 1: búsqueda + acción principal */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-[220px] flex-1 md:max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7C818A]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, email, teléfono, Instagram"
            aria-label="Buscar contactos"
            className={cn(FIELD, "w-full pl-10")}
          />
        </div>
        {view === "kanban" && (
          <PipelineSelector pipelines={pipelines} activeId={activeId} onChange={setActiveId} />
        )}
        <div className="hidden flex-1 md:block" />
        <span className="text-[14px] text-[#A6AAB2]">
          {filtered.length} contacto{filtered.length === 1 ? "" : "s"}
        </span>
        <button onClick={() => setCreating(true)} className={BTN_PRIMARY}>
          <Plus className="h-4 w-4" /> Nuevo contacto
        </button>
      </div>

      {/* Fila 2: filtros (solo en pestaña Contactos · list). En kanban el filtrado vive en el pipeline. */}
      {view === "list" && (
        <div className="flex flex-wrap items-center gap-2">
          <TagFilterButton allTags={allTags} selected={tagFilter} onChange={setTagFilter} />

          <FilterSelect value={pipelineFilter} onChange={setPipelineFilter} label="Filtrar por pipeline">
            <option value="all">Pipeline: todos</option>
            {pipelines.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={stageFilter} onChange={setStageFilter} label="Filtrar por stage">
            <option value="all">Stage: todos</option>
            {STAGES_VISIBLES.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={originFilter} onChange={setOriginFilter} label="Filtrar por origen">
            <option value="all">Origen: todos</option>
            {filterOptions.origins.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={ownerFilter} onChange={setOwnerFilter} label="Filtrar por responsable">
            <option value="all">Responsable: todos</option>
            {filterOptions.owners.map((o) => (
              <option key={o} value={o}>{o}</option>
            ))}
          </FilterSelect>

          <FilterSelect value={productFilter} onChange={setProductFilter} label="Filtrar por producto">
            <option value="all">Producto: todos</option>
            {filterOptions.products.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </FilterSelect>

          <FilterSelect
            value={dateRange}
            onChange={(v) => setDateRange(v as typeof dateRange)}
            label="Filtrar por fecha de entrada"
          >
            <option value="all">Fecha: cualquiera</option>
            <option value="7d">Últimos 7 días</option>
            <option value="30d">Últimos 30 días</option>
            <option value="90d">Últimos 90 días</option>
          </FilterSelect>

          <FilterSelect
            value={hasCallFilter}
            onChange={(v) => setHasCallFilter(v as typeof hasCallFilter)}
            label="Filtrar por llamada"
          >
            <option value="all">Llamada: cualquiera</option>
            <option value="yes">Con llamada</option>
            <option value="no">Sin llamada</option>
          </FilterSelect>

          {activeFiltersCount > 0 && (
            <button
              onClick={clearAllFilters}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border border-[rgba(245,246,247,0.1)] px-3 text-[14px] font-semibold text-[#A6AAB2] transition-colors hover:border-[rgba(245,246,247,0.2)] hover:bg-[#16161B] hover:text-[#F5F6F7]"
            >
              <X className="h-4 w-4" />
              Quitar filtros ({activeFiltersCount})
            </button>
          )}
        </div>
      )}
    </div>
  )

  const overlays = (
    <>
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

  // KANBAN: ocupa EXACTO el hueco que le da el layout del CRM (`h-full`), asi el scroll
  // vertical de la pagina no se activa y cada columna scrollea por dentro.
  // Antes usaba `h-[calc(100vh-9rem)]`, una altura adivinada a ojo desde la ventana que
  // no cuadraba con el hueco real.
  if (view === "kanban") {
    return (
      <>
        <div className="flex h-full min-h-0 min-w-0 flex-col bg-[#0F0F12]">
          {/* Toolbar fijo arriba */}
          <div className="shrink-0 border-b border-[rgba(245,246,247,0.1)] px-4 py-3 md:px-6">
            {Toolbar}
          </div>
          {/* Resumen del pipeline activo (suma sobre lo visible, respeta filtros). */}
          <div className="shrink-0 border-b border-[rgba(245,246,247,0.1)] px-4 py-2.5 md:px-6">
            {(() => {
              const totalRev = filtered.reduce((acc, c) => acc + (Number(c.total_revenue) || 0), 0)
              const totalCash = filtered.reduce((acc, c) => acc + (Number(c.total_cash_collected) || 0), 0)
              const alumnos = filtered.filter((c) => c.stage === "alumno").length
              return (
                <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="text-[13px] font-semibold text-[#7C818A]">
                    {activePipeline?.name ?? "Pipeline"}
                  </span>
                  <Kpi label="Contactos" value={String(filtered.length)} />
                  <Kpi label="Alumnos" value={String(alumnos)} accent />
                  <Kpi label="Facturado" value={eur(totalRev)} accent />
                  <Kpi label="Cobrado" value={eur(totalCash)} />
                </div>
              )
            })()}
          </div>
          {/* Kanban: el scroll horizontal vive AQUI y solo aqui. El padding va al contenido
              interior para que ambos extremos respeten margen al llegar al final. */}
          <div className="min-h-0 min-w-0 flex-1 overflow-x-auto overflow-y-hidden py-4">
            {loading ? (
              <LoadingScreen fullscreen={false} className="h-full" />
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
            stages={STAGES_VISIBLES}
            pipelines={pipelinesParaFicha}
          />
        )}
        {overlays}
      </>
    )
  }

  // LISTA
  return (
    <>
      <PageContainer>
        {Toolbar}

        {loading ? (
          <LoadingScreen fullscreen={false} className="py-20" />
        ) : filtered.length === 0 ? (
          <EmptyState
            filtrando={activeFiltersCount > 0 || search.length > 0}
            onClear={clearAllFilters}
            onCreate={() => setCreating(true)}
          />
        ) : (
          <ul className="divide-y divide-[rgba(245,246,247,0.1)] overflow-hidden rounded-[8px] border border-[rgba(245,246,247,0.1)] bg-[#131318]">
            {filtered.map((c) => {
              const stage = STAGES_VISIBLES.find((s) => s.value === c.stage)
              const tone = stageTone(c.stage)
              const contactTags = tagsByContact.get(c.id) ?? []
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className="flex min-h-[56px] w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-[#16161B] md:px-4"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[rgba(245,246,247,0.1)] bg-[#16161B] text-[13px] font-semibold text-[#A6AAB2]">
                      {c.full_name?.charAt(0).toUpperCase() || "?"}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[15px] font-semibold text-[#F5F6F7]">
                        {c.full_name}
                      </span>
                      <span className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-[#7C818A]">
                        <span className="inline-flex min-w-0 items-center gap-1">
                          <Mail className="h-3.5 w-3.5 shrink-0" />
                          <span className="truncate">{c.email}</span>
                        </span>
                        {c.phone && (
                          <span className="inline-flex items-center gap-1">
                            <Phone className="h-3.5 w-3.5 shrink-0" />
                            {c.phone}
                          </span>
                        )}
                      </span>
                      {contactTags.length > 0 && (
                        <span className="mt-1.5 block">
                          <TagChips tags={contactTags} max={4} size="xs" />
                        </span>
                      )}
                    </span>

                    {c.total_revenue > 0 && (
                      <span className="shrink-0 text-[14px] font-semibold tabular-nums text-[#4ADE80]">
                        {eur(c.total_revenue)}
                      </span>
                    )}

                    {c.products?.length > 0 && (
                      <span className="hidden shrink-0 text-[13px] text-[#7C818A] lg:inline">
                        {c.products.length} producto{c.products.length === 1 ? "" : "s"}
                      </span>
                    )}

                    {stage && (
                      <span
                        className={cn(
                          "hidden shrink-0 rounded-[3px] border px-2 py-1 text-[12px] font-semibold sm:inline-block",
                          tone.chip
                        )}
                      >
                        {stage.label}
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 shrink-0 text-[#7C818A]" />
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </PageContainer>

      {selectedId && (
        <ContactDrawer
          contactId={selectedId}
          onClose={() => setSelectedId(null)}
          onUpdate={() => load()}
          stages={STAGES_VISIBLES}
          pipelines={pipelinesParaFicha}
        />
      )}
      {overlays}
    </>
  )
}

/** Desplegable de filtro. 44px de alto: zona tactil minima del brandkit. */
function FilterSelect({
  value,
  onChange,
  label,
  children,
}: {
  value: string
  onChange: (v: string) => void
  label: string
  children: React.ReactNode
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className={cn(FIELD, "max-w-full cursor-pointer pr-8")}
    >
      {children}
    </select>
  )
}

/** Cifra + su etiqueta al lado. El verde marca lo que es una venta. */
function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex shrink-0 items-baseline gap-2">
      <span
        className={cn(
          "text-[16px] font-bold tabular-nums",
          accent ? "text-[#4ADE80]" : "text-[#F5F6F7]"
        )}
      >
        {value}
      </span>
      <span className="text-[13px] text-[#7C818A]">{label}</span>
    </div>
  )
}

/**
 * Estado vacio con su salida DENTRO: si no hay nada por los filtros, el boton los quita;
 * si de verdad no hay contactos, el boton crea el primero.
 */
function EmptyState({
  filtrando,
  onClear,
  onCreate,
}: {
  filtrando: boolean
  onClear: () => void
  onCreate: () => void
}) {
  return (
    <div className="flex flex-col items-center gap-4 rounded-[8px] border border-dashed border-[rgba(245,246,247,0.1)] px-6 py-16 text-center">
      <p className="text-[15px] text-[#A6AAB2]">
        {filtrando
          ? "Ningún contacto coincide con esos filtros."
          : "Todavía no hay contactos."}
      </p>
      {filtrando ? (
        <button
          onClick={onClear}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-[4px] border border-[rgba(245,246,247,0.1)] px-4 text-[14px] font-semibold text-[#F5F6F7] transition-colors hover:border-[rgba(245,246,247,0.2)] hover:bg-[#16161B]"
        >
          <X className="h-4 w-4" /> Quitar filtros
        </button>
      ) : (
        <button onClick={onCreate} className={BTN_PRIMARY}>
          <Plus className="h-4 w-4" /> Crear el primer contacto
        </button>
      )}
    </div>
  )
}
