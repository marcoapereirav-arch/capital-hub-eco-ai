"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import {
  Search,
  Plus,
  ChevronLeft,
  ChevronRight,
  X,
  SlidersHorizontal,
} from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { ContactDrawer } from "./contact-drawer"
import { ContactCreateModal } from "./contact-create-modal"
import { PipelinesKanban } from "./pipelines-kanban"
import { TagFilterList } from "@/features/tags/components/tag-filter-button"
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

/** Un filtro que esta ACTUANDO ahora mismo, listo para pintarse como ficha y quitarse. */
type FiltroActivo = {
  clave: string
  texto: string
  /** Color de la etiqueta, solo en los filtros de etiqueta. Es un dato del usuario. */
  color?: string
  quitar: () => void
}

// Fallback solo si la BD no tiene pipelines (deberia siempre haberlos tras seed).
// Los stages REALES se leen del pipeline activo via usePipelines().
const FALLBACK_STAGES = [{ value: "lead", label: "Lead" }]

/** Contactos por pagina en la vista LISTA (Marco, 2026-08-06). */
const POR_PAGINA = 20

/**
 * Cuantos contactos se traen de la base de una vez. Es el tope que acepta el endpoint.
 * Si algun dia se llega a el, la pantalla lo DICE (ver el aviso del pie): un tope que no
 * se ve convierte el contador y el paginador en una mentira.
 */
const TOPE_DE_CARGA = 500

const eur = (n: number) => `${Math.round(n).toLocaleString("es-ES")} EUR`

/** Como se llama cada rango de fecha cuando sale fuera, en su ficha. */
const NOMBRE_DE_FECHA: Record<string, string> = {
  "7d": "Últimos 7 días",
  "30d": "Últimos 30 días",
  "90d": "Últimos 90 días",
}

/** Como se llama el filtro de llamada cuando sale fuera, en su ficha. */
const NOMBRE_DE_LLAMADA: Record<string, string> = {
  yes: "Con llamada",
  no: "Sin llamada",
}

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
  const [pagina, setPagina] = useState(1)
  // Los filtros NO viven en la barra: viven dentro del boton "Filtros". Ocho desplegables
  // a la vista eran un muro, y encima tapaban lo unico que se usa siempre, que es buscar.
  // En telefono se abren en hoja inferior; en monitor, en un panel colgado del boton.
  const [filtrosAbiertos, setFiltrosAbiertos] = useState(false)
  const [panelAbierto, setPanelAbierto] = useState(false)
  const panelRef = useRef<HTMLDivElement | null>(null)
  // Sitio al que se vuelve al cambiar de pagina: arriba del todo, con el buscador
  // y los filtros a la vista. Sin esto se cambia de pagina y se sigue a mitad de lista.
  const arribaRef = useRef<HTMLDivElement | null>(null)
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

  // El panel del monitor se cierra al tocar fuera o con Escape: es un panel colgado del
  // boton, no una ventana, y quedarse abierto tapando la lista seria lo peor de los dos.
  useEffect(() => {
    if (!panelAbierto) return
    function alTocarFuera(e: MouseEvent) {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) setPanelAbierto(false)
    }
    function alEscapar(e: KeyboardEvent) {
      if (e.key === "Escape") setPanelAbierto(false)
    }
    document.addEventListener("mousedown", alTocarFuera)
    document.addEventListener("keydown", alEscapar)
    return () => {
      document.removeEventListener("mousedown", alTocarFuera)
      document.removeEventListener("keydown", alEscapar)
    }
  }, [panelAbierto])

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
      url.searchParams.set("limit", String(TOPE_DE_CARGA))
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

  /**
   * Los filtros que estan ACTUANDO, uno por uno y con su nombre de verdad.
   *
   * De aqui salen las dos cosas que evitan el muro: el numero que lleva el boton de
   * Filtros, y las fichas de fuera. Cada etiqueta cuenta como un filtro propio, para que
   * el numero del boton y las fichas que se ven nunca digan cosas distintas.
   */
  const filtrosActivos: FiltroActivo[] = []
  if (pipelineFilter !== "all") {
    filtrosActivos.push({
      clave: "pipeline",
      texto: pipelines.find((p) => p.id === pipelineFilter)?.name ?? "Pipeline",
      quitar: () => setPipelineFilter("all"),
    })
  }
  if (stageFilter !== "all") {
    filtrosActivos.push({
      clave: "stage",
      texto: STAGES_VISIBLES.find((s) => s.value === stageFilter)?.label ?? stageFilter,
      quitar: () => setStageFilter("all"),
    })
  }
  if (originFilter !== "all") {
    filtrosActivos.push({ clave: "origen", texto: originFilter, quitar: () => setOriginFilter("all") })
  }
  if (ownerFilter !== "all") {
    filtrosActivos.push({ clave: "owner", texto: ownerFilter, quitar: () => setOwnerFilter("all") })
  }
  if (productFilter !== "all") {
    filtrosActivos.push({ clave: "producto", texto: productFilter, quitar: () => setProductFilter("all") })
  }
  if (dateRange !== "all") {
    filtrosActivos.push({
      clave: "fecha",
      texto: NOMBRE_DE_FECHA[dateRange] ?? "Fecha",
      quitar: () => setDateRange("all"),
    })
  }
  if (hasCallFilter !== "all") {
    filtrosActivos.push({
      clave: "llamada",
      texto: NOMBRE_DE_LLAMADA[hasCallFilter] ?? "Llamada",
      quitar: () => setHasCallFilter("all"),
    })
  }
  for (const id of tagFilter) {
    const etiqueta = allTags.find((t) => t.id === id)
    filtrosActivos.push({
      clave: `tag-${id}`,
      texto: etiqueta?.name ?? "Etiqueta",
      color: etiqueta?.color,
      quitar: () =>
        setTagFilter((previo) => {
          const siguiente = new Set(previo)
          siguiente.delete(id)
          return siguiente
        }),
    })
  }

  const activeFiltersCount = filtrosActivos.length

  // --- Paginacion de la vista LISTA -----------------------------------------
  // `paginaSegura` se calcula al pintar, no se guarda. Asi, si un filtro deja menos
  // paginas de las que habia, NUNCA se ve una pagina en blanco: se cae sola a la ultima
  // que existe, incluso antes de que el efecto de mas abajo devuelva a la primera.
  const totalPaginas = Math.max(1, Math.ceil(filtered.length / POR_PAGINA))
  const paginaSegura = Math.min(pagina, totalPaginas)
  const desde = (paginaSegura - 1) * POR_PAGINA
  const enPantalla = filtered.slice(desde, desde + POR_PAGINA)

  // Al cambiar cualquier filtro o la busqueda se vuelve a la primera pagina: seguir en
  // la 3 despues de filtrar es desconcertante.
  const firmaDeFiltros = [
    search, stageFilter, pipelineFilter, originFilter, ownerFilter,
    productFilter, dateRange, hasCallFilter, [...tagFilter].sort().join(","),
  ].join("|")
  useEffect(() => { setPagina(1) }, [firmaDeFiltros])

  function irAPagina(n: number) {
    setPagina(Math.min(Math.max(1, n), totalPaginas))
    arribaRef.current?.scrollIntoView({ block: "start" })
  }

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

  /**
   * Los desplegables de filtro se escriben UNA sola vez y se usan en los dos sitios: la
   * hoja del telefono y el panel del monitor. Asi los dos ofrecen exactamente lo mismo.
   * Todos llevan su nombre encima: dentro del panel los campos van uno debajo de otro y
   * sin nombre no se sabe cual es cual.
   */
  const camposDeFiltro = (
    <>
      <FilterSelect value={pipelineFilter} onChange={setPipelineFilter} etiqueta="Pipeline">
        <option value="all">Pipeline: todos</option>
        {pipelines.map((p) => (
          <option key={p.id} value={p.id}>{p.name}</option>
        ))}
      </FilterSelect>

      <FilterSelect value={stageFilter} onChange={setStageFilter} etiqueta="Stage">
        <option value="all">Stage: todos</option>
        {STAGES_VISIBLES.map((s) => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </FilterSelect>

      <FilterSelect value={originFilter} onChange={setOriginFilter} etiqueta="Origen">
        <option value="all">Origen: todos</option>
        {filterOptions.origins.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </FilterSelect>

      <FilterSelect value={ownerFilter} onChange={setOwnerFilter} etiqueta="Responsable">
        <option value="all">Responsable: todos</option>
        {filterOptions.owners.map((o) => (
          <option key={o} value={o}>{o}</option>
        ))}
      </FilterSelect>

      <FilterSelect value={productFilter} onChange={setProductFilter} etiqueta="Producto">
        <option value="all">Producto: todos</option>
        {filterOptions.products.map((p) => (
          <option key={p} value={p}>{p}</option>
        ))}
      </FilterSelect>

      <FilterSelect
        value={dateRange}
        onChange={(v) => setDateRange(v as typeof dateRange)}
        etiqueta="Fecha"
      >
        <option value="all">Fecha: cualquiera</option>
        <option value="7d">Últimos 7 días</option>
        <option value="30d">Últimos 30 días</option>
        <option value="90d">Últimos 90 días</option>
      </FilterSelect>

      <FilterSelect
        value={hasCallFilter}
        onChange={(v) => setHasCallFilter(v as typeof hasCallFilter)}
        etiqueta="Llamada"
      >
        <option value="all">Llamada: cualquiera</option>
        <option value="yes">Con llamada</option>
        <option value="no">Sin llamada</option>
      </FilterSelect>
    </>
  )

  /**
   * TODOS los filtros, escritos una vez y colocados en los dos sitios. `enRejilla` solo
   * cambia como se reparten: en el panel del monitor caben dos por fila, en el telefono
   * van uno debajo de otro.
   */
  const bloqueDeFiltros = (enRejilla: boolean) => (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-sm font-semibold text-muted-foreground">Etiquetas</span>
        <div className="max-h-56 overflow-y-auto rounded-lg border border-border bg-popover">
          <TagFilterList allTags={allTags} selected={tagFilter} onChange={setTagFilter} />
        </div>
      </div>
      <div className={cn("grid gap-3", enRejilla && "sm:grid-cols-2")}>{camposDeFiltro}</div>
    </div>
  )

  const claseBotonFiltros = cn(
    "inline-flex min-h-11 shrink-0 items-center gap-1.5 rounded-lg border px-4 text-sm font-semibold transition-colors",
    activeFiltersCount > 0
      ? "border-primary/30 bg-primary/10 text-primary"
      : "border-border bg-popover text-muted-foreground hover:border-foreground/20 hover:text-foreground"
  )

  /**
   * La barra de arriba, minima a proposito: buscar, filtrar y crear. Nada mas.
   *
   * Los ocho desplegables que antes vivian aqui estan dentro del boton "Filtros", y lo
   * unico que vuelve a salir fuera es lo que de verdad esta actuando, en fichas que se
   * quitan de una en una. Marco, 2026-08-07: "veo un huevo de filtros arriba... lo quiero
   * mas minimalista".
   */
  const Toolbar = (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative w-full md:w-auto md:min-w-0 md:max-w-md md:flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar nombre, email, teléfono, Instagram"
            aria-label="Buscar contactos"
            inputMode="search"
            enterKeyHint="search"
            className={cn(FIELD, "w-full pl-10")}
          />
        </div>

        {view === "kanban" && (
          <PipelineSelector pipelines={pipelines} activeId={activeId} onChange={setActiveId} />
        )}

        {view === "list" && (
          <div ref={panelRef} className="relative shrink-0">
            {/* TELEFONO: hoja inferior. Un panel colgado se sale de la pantalla. */}
            <button
              onClick={() => setFiltrosAbiertos(true)}
              aria-label="Abrir filtros"
              className={cn(claseBotonFiltros, "md:hidden")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && <span className="tabular-nums">{activeFiltersCount}</span>}
            </button>

            {/* MONITOR: panel anclado al propio boton. */}
            <button
              onClick={() => setPanelAbierto((v) => !v)}
              aria-expanded={panelAbierto}
              aria-haspopup="true"
              aria-label="Abrir filtros"
              className={cn(claseBotonFiltros, "hidden md:inline-flex")}
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filtros
              {activeFiltersCount > 0 && <span className="tabular-nums">{activeFiltersCount}</span>}
            </button>

            {panelAbierto && (
              <div className="absolute left-0 top-full z-30 mt-2 hidden w-[min(34rem,calc(100vw-3rem))] rounded-xl border border-border bg-card p-4 shadow-lg md:block">
                {bloqueDeFiltros(true)}
                <div className="mt-4 flex items-center justify-between gap-2 border-t border-border pt-3">
                  <button
                    onClick={clearAllFilters}
                    disabled={activeFiltersCount === 0}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-sm font-semibold text-muted-foreground transition-colors hover:border-foreground/20 hover:bg-popover hover:text-foreground disabled:pointer-events-none disabled:opacity-35"
                  >
                    <X className="h-4 w-4" />
                    Quitar filtros
                  </button>
                  <button onClick={() => setPanelAbierto(false)} className={BTN_PRIMARY}>
                    Ver <span className="tabular-nums">{filtered.length}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        <div className="hidden flex-1 md:block" />

        <button onClick={() => setCreating(true)} className={cn(BTN_PRIMARY, "flex-1 md:flex-none")}>
          <Plus className="h-4 w-4" /> Nuevo contacto
        </button>
      </div>

      {/* Lo que de verdad esta actuando, y solo eso. Cada ficha se quita de un toque: sin
          esto el usuario ve pocos contactos y no sabe por que. */}
      {view === "list" && filtrosActivos.length > 0 && (
        <div className="flex flex-wrap items-center gap-2">
          {filtrosActivos.map((f) => (
            <button
              key={f.clave}
              onClick={f.quitar}
              aria-label={`Quitar el filtro ${f.texto}`}
              className="inline-flex min-h-11 max-w-full items-center gap-1.5 rounded-lg border border-border bg-popover px-3 text-sm text-foreground transition-colors hover:border-foreground/20 md:min-h-9"
            >
              {f.color && (
                <span
                  aria-hidden
                  className="h-2 w-2 shrink-0 rounded-full"
                  style={{ backgroundColor: f.color }}
                />
              )}
              <span className="min-w-0 truncate">{f.texto}</span>
              <X className="h-4 w-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
          <button
            onClick={clearAllFilters}
            className="inline-flex min-h-11 items-center px-1 text-sm font-semibold text-muted-foreground underline underline-offset-4 transition-colors hover:text-foreground md:min-h-9"
          >
            Quitar todos
          </button>
        </div>
      )}

      {view === "list" && (
        <p className="text-sm text-muted-foreground">
          <span className="tabular-nums">{filtered.length}</span> contacto{filtered.length === 1 ? "" : "s"}
        </p>
      )}
    </div>
  )

  // Hoja de filtros del telefono. Los MISMOS campos que en el monitor, uno debajo de otro
  // y a 44 puntos. Abajo queda fija la salida: quitar filtros o ver los que quedan.
  const hojaDeFiltros = (
    <Sheet open={filtrosAbiertos} onOpenChange={setFiltrosAbiertos}>
      <SheetContent side="bottom" className="gap-0 rounded-t-xl border-border bg-card text-foreground md:hidden">
        <div aria-hidden className="mx-auto mt-1 h-1 w-10 rounded-full bg-foreground/20" />
        <SheetHeader className="px-4">
          <SheetTitle className="text-[17px] font-semibold text-foreground">Filtros</SheetTitle>
        </SheetHeader>

        <div className="px-4 pb-2">{bloqueDeFiltros(false)}</div>

        <div className="sticky bottom-0 z-10 mt-4 flex gap-2 border-t border-border bg-card px-4 pt-3">
          <button
            onClick={clearAllFilters}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border text-sm font-semibold text-muted-foreground"
          >
            <X className="h-4 w-4" />
            Quitar filtros
            {activeFiltersCount > 0 && <span className="tabular-nums">({activeFiltersCount})</span>}
          </button>
          <button onClick={() => setFiltrosAbiertos(false)} className={cn(BTN_PRIMARY, "flex-1")}>
            Ver <span className="tabular-nums">{filtered.length}</span>
          </button>
        </div>
      </SheetContent>
    </Sheet>
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
        <div className="flex h-full min-h-0 min-w-0 flex-col bg-background">
          {/* Toolbar fijo arriba */}
          <div className="shrink-0 border-b border-border px-4 py-3 md:px-6">
            {Toolbar}
          </div>
          {/* Resumen del pipeline activo (suma sobre lo visible, respeta filtros). */}
          <div className="shrink-0 border-b border-border px-4 py-2.5 md:px-6">
            {(() => {
              const totalRev = filtered.reduce((acc, c) => acc + (Number(c.total_revenue) || 0), 0)
              const totalCash = filtered.reduce((acc, c) => acc + (Number(c.total_cash_collected) || 0), 0)
              const alumnos = filtered.filter((c) => c.stage === "alumno").length
              const pipelineLabel = activePipeline?.name ?? "Pipeline"
              return (
                <>
                  {/* En telefono el nombre del pipeline va en su propia linea: en la misma
                      fila que las cifras no cabia y las partia. */}
                  <div className="mb-1.5 text-sm font-semibold text-muted-foreground md:hidden">
                    {pipelineLabel}
                  </div>
                  {/* Telefono: dos columnas. Ordenador: la fila de siempre. */}
                  <div className="grid grid-cols-2 gap-x-4 gap-y-2 md:flex md:flex-wrap md:items-center md:gap-x-6 md:gap-y-2">
                    <span className="hidden text-sm font-semibold text-muted-foreground md:inline">
                      {pipelineLabel}
                    </span>
                    <Kpi label="Contactos" value={String(filtered.length)} />
                    <Kpi label="Alumnos" value={String(alumnos)} accent />
                    <Kpi label="Facturado" value={eur(totalRev)} accent />
                    <Kpi label="Cobrado" value={eur(totalCash)} />
                  </div>
                </>
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
      {/* `pb-28 md:pb-28`: el boton flotante de "Registrar venta" vive pegado abajo a la
          derecha y se comia los botones de pagina, que quedaban justo debajo (el widget
          ocupa los ultimos 72px de la ventana). Este hueco deja que el paginador suba por
          encima de el al llegar al final.
          La variante `md:` NO sobra: `PageContainer` trae `md:py-6`, y a partir de 768px
          esa gana al `pb-28` suelto. `tailwind-merge` tampoco lo resuelve, porque una
          clase con `md:` y otra sin el no se consideran en conflicto. Resultado sin ella:
          la clase estaba puesta y el padding real seguia siendo 24px. */}
      <PageContainer className="pb-28 md:pb-28">
        <div ref={arribaRef} aria-hidden className="scroll-mt-4" />
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
          <>
          {/* La ficha de la lista solo lleva lo que sirve para reconocer a la persona y
              decidir si entrar: quien es, su correo, en que punto del funnel esta y si ha
              pagado. El telefono, los productos y las etiquetas con su nombre siguen en la
              BD y se ven enteros al abrir el contacto; aqui solo asomaba ruido. Las
              etiquetas quedan como puntos de color, que se reconocen de un vistazo y no
              ocupan una linea entera. */}
          <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
            {enPantalla.map((c) => {
              const stage = STAGES_VISIBLES.find((s) => s.value === c.stage)
              const tone = stageTone(c.stage)
              const contactTags = tagsByContact.get(c.id) ?? []
              return (
                <li key={c.id}>
                  <button
                    onClick={() => setSelectedId(c.id)}
                    className="flex min-h-14 w-full items-center gap-3 px-3 py-3 text-left transition-colors hover:bg-popover md:px-4"
                  >
                    <span
                      aria-hidden
                      className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border bg-popover text-sm font-semibold text-muted-foreground"
                    >
                      {c.full_name?.charAt(0).toUpperCase() || "?"}
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-2">
                        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-foreground">
                          {c.full_name}
                        </span>
                        {stage && (
                          <span
                            className={cn(
                              "shrink-0 rounded-[3px] border px-2 py-0.5 text-sm font-semibold",
                              tone.chip
                            )}
                          >
                            {stage.label}
                          </span>
                        )}
                      </span>
                      <span className="mt-0.5 flex items-center gap-2">
                        <span className="min-w-0 truncate text-sm text-muted-foreground">
                          {c.email}
                        </span>
                        {contactTags.length > 0 && (
                          <span
                            aria-hidden
                            title={contactTags.map((t) => t.name).join(", ")}
                            className="flex shrink-0 items-center gap-1"
                          >
                            {contactTags.slice(0, 4).map((t) => (
                              <span
                                key={t.id}
                                className="h-2 w-2 rounded-full"
                                style={{ backgroundColor: t.color }}
                              />
                            ))}
                          </span>
                        )}
                      </span>
                    </span>

                    {c.total_revenue > 0 && (
                      <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                        {eur(c.total_revenue)}
                      </span>
                    )}

                    <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
                  </button>
                </li>
              )
            })}
          </ul>

          <Paginador
            pagina={paginaSegura}
            totalPaginas={totalPaginas}
            desde={desde + 1}
            hasta={desde + enPantalla.length}
            total={filtered.length}
            onIr={irAPagina}
          />

          {contacts.length >= TOPE_DE_CARGA && (
            <p className="text-sm text-warn">
              Se están mostrando los {TOPE_DE_CARGA} contactos más recientes. Usa los filtros
              o el buscador para encontrar los anteriores.
            </p>
          )}
          </>
        )}
      </PageContainer>

      {hojaDeFiltros}

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

/**
 * Que numeros de pagina se enseñan. Siempre la primera, la ultima y las vecinas de la
 * actual; el resto se resume con puntos suspensivos (`null`). Sin esto, 500 contactos
 * pintaban 25 botones de 44px y el paginador se comia la pantalla.
 */
function numerosDePagina(actual: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)

  const vecinas = [actual - 1, actual, actual + 1].filter((n) => n > 1 && n < total)
  const conBordes = [1, ...vecinas, total]

  const salida: (number | null)[] = []
  let anterior = 0
  for (const n of conBordes) {
    if (n - anterior > 1) salida.push(null)
    salida.push(n)
    anterior = n
  }
  return salida
}

/**
 * Paginador de la lista de contactos: 20 por pagina (Marco, 2026-08-06).
 *
 * Siempre dice EN PALABRAS cuantos se estan viendo y de cuantos, para que el numero de
 * arriba y lo que hay en pantalla nunca parezcan contradecirse.
 * Con una sola pagina no se pinta nada: un paginador de una pagina es ruido.
 */
function Paginador({
  pagina,
  totalPaginas,
  desde,
  hasta,
  total,
  onIr,
}: {
  pagina: number
  totalPaginas: number
  desde: number
  hasta: number
  total: number
  onIr: (n: number) => void
}) {
  if (totalPaginas <= 1) return null

  const flecha =
    "inline-flex min-h-11 items-center gap-1.5 rounded-lg border " +
    "border-border px-3 text-sm font-semibold text-muted-foreground " +
    "transition-colors hover:border-foreground/20 hover:bg-popover " +
    "hover:text-foreground disabled:pointer-events-none disabled:opacity-35"

  return (
    <nav
      aria-label="Páginas de contactos"
      className="flex flex-wrap items-center justify-between gap-3 pt-1"
    >
      <p className="text-sm text-muted-foreground">
        Viendo <span className="font-semibold text-foreground">{desde}</span> a{" "}
        <span className="font-semibold text-foreground">{hasta}</span> de{" "}
        <span className="font-semibold text-foreground">{total}</span>
      </p>

      <div className="flex items-center gap-1.5">
        <button onClick={() => onIr(pagina - 1)} disabled={pagina === 1} className={flecha}>
          <ChevronLeft className="h-4 w-4" />
          Anterior
        </button>

        {/* En movil el numero de pagina se dice con palabras: los botones no caben. */}
        <span className="px-2 text-sm text-muted-foreground sm:hidden">
          {pagina} de {totalPaginas}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {numerosDePagina(pagina, totalPaginas).map((n, i) =>
            n === null ? (
              <span key={`hueco-${i}`} aria-hidden className="px-1 text-sm text-muted-foreground">
                ...
              </span>
            ) : (
              <button
                key={n}
                onClick={() => onIr(n)}
                aria-label={`Ir a la página ${n}`}
                aria-current={n === pagina ? "page" : undefined}
                className={cn(
                  "min-h-11 min-w-11 rounded-lg border text-sm font-semibold tabular-nums transition-colors",
                  n === pagina
                    ? "border-primary/30 bg-primary/10 text-primary"
                    : "border-transparent text-muted-foreground hover:bg-popover hover:text-foreground"
                )}
              >
                {n}
              </button>
            )
          )}
        </div>

        <button
          onClick={() => onIr(pagina + 1)}
          disabled={pagina === totalPaginas}
          className={flecha}
        >
          Siguiente
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </nav>
  )
}

/**
 * Desplegable de filtro, con su nombre encima. 44px de alto (los trae FIELD): zona
 * tactil minima del brandkit.
 *
 * Vive siempre dentro del panel o de la hoja de "Filtros", nunca suelto en la barra de
 * arriba: ocho de estos a la vista eran justo el muro que Marco pidio quitar.
 */
function FilterSelect({
  value,
  onChange,
  etiqueta,
  children,
}: {
  value: string
  onChange: (v: string) => void
  etiqueta: string
  children: React.ReactNode
}) {
  return (
    <label className="flex min-w-0 flex-col gap-1.5">
      <span className="text-sm font-semibold text-muted-foreground">{etiqueta}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        aria-label={`Filtrar por ${etiqueta.toLowerCase()}`}
        className={cn(FIELD, "w-full cursor-pointer pr-8")}
      >
        {children}
      </select>
    </label>
  )
}

/**
 * Cifra + su etiqueta. El verde marca lo que es una venta.
 * En telefono la cifra va encima de la etiqueta, para que en dos columnas no se pisen;
 * en monitor vuelven a la misma linea.
 */
function Kpi({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div className="flex min-w-0 shrink-0 flex-col md:flex-row md:items-baseline md:gap-2">
      <span
        className={cn(
          "truncate text-base font-bold tabular-nums",
          accent ? "text-primary" : "text-foreground"
        )}
      >
        {value}
      </span>
      <span className="truncate text-sm text-muted-foreground">{label}</span>
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
    <div className="flex flex-col items-center gap-4 rounded-xl border border-dashed border-border px-6 py-16 text-center">
      <p className="text-[15px] text-muted-foreground">
        {filtrando
          ? "Ningún contacto coincide con esos filtros."
          : "Todavía no hay contactos."}
      </p>
      {filtrando ? (
        <button
          onClick={onClear}
          className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors hover:border-foreground/20 hover:bg-popover"
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
