"use client"

import { useEffect, useState } from "react"
import { Search, Plus, ChevronRight, LayoutGrid, List } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { ContactDrawer } from "./contact-drawer"
import { ContactCreateModal } from "./contact-create-modal"
import { PipelinesKanban } from "./pipelines-kanban"
import { cn } from "@/lib/utils"

type ContactRow = {
  id: string
  full_name: string
  email: string
  phone: string | null
  stage: string | null
  products: string[]
  total_revenue: number
  total_cash_collected: number
  source: string | null
  tags: string[] | null
  last_call_at: string | null
  created_at: string
}

// Funnel real Capital Hub (en español)
// Lead viene de IG → Marco/Adrián/setter le habla → agenda → llamada → seguimiento o cliente
const PIPELINE_STAGES = [
  { value: "nuevo_seguidor", label: "Nuevo seguidor" },  // ManyChat detecta nuevo follower
  { value: "contactado", label: "Contactado" },          // Setter envió DM
  { value: "agendado", label: "Agendado" },              // Reservó llamada
  { value: "atendio", label: "Atendió llamada" },        // Entró a la videollamada
  { value: "seguimiento", label: "Seguimiento" },        // No cerró ahora pero hay potencial
  { value: "cliente", label: "Cliente" },                // Compró
  { value: "no_show", label: "No show" },                // No asistió a la llamada
  { value: "perdido", label: "Perdido" },                // Descartado / no quiere comprar
]

export function ContactosPage({ initialView = "list" }: { initialView?: "list" | "kanban" } = {}) {
  const [contacts, setContacts] = useState<ContactRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [stageFilter, setStageFilter] = useState<string | "all">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [view, setView] = useState<"list" | "kanban">(initialView)

  async function updateStage(contactId: string, newStage: string) {
    await fetch(`/api/admin/contacts/${contactId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ stage: newStage }),
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

  const filtered = search
    ? contacts.filter((c) => {
        const q = search.toLowerCase()
        return (
          c.full_name?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.phone?.toLowerCase().includes(q)
        )
      })
    : contacts

  return (
    <>
      <ShellHeader title="Contactos" />

      <PageContainer>
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar nombre, email, teléfono…"
              className="w-full h-8 rounded-sm border border-border bg-background pl-8 pr-2 text-sm"
            />
          </div>
          <select
            value={stageFilter}
            onChange={(e) => setStageFilter(e.target.value)}
            className="h-8 rounded-sm border border-border bg-background px-2 text-xs"
          >
            <option value="all">Todos los pipelines</option>
            {PIPELINE_STAGES.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>

          <div className="flex-1" />

          <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            {filtered.length} contacto{filtered.length === 1 ? "" : "s"}
          </span>

          {/* View toggle */}
          <div className="flex items-center border border-border rounded-sm">
            <button
              onClick={() => setView("list")}
              className={cn("h-7 px-2 inline-flex items-center gap-1 text-xs", view === "list" ? "bg-accent" : "text-muted-foreground hover:text-foreground")}
            >
              <List className="h-3 w-3" /> Lista
            </button>
            <button
              onClick={() => setView("kanban")}
              className={cn("h-7 px-2 inline-flex items-center gap-1 text-xs", view === "kanban" ? "bg-accent" : "text-muted-foreground hover:text-foreground")}
            >
              <LayoutGrid className="h-3 w-3" /> Pipelines
            </button>
          </div>

          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Nuevo
          </button>
        </div>

        {/* Vista */}
        {loading ? (
          <div className="text-center py-12 text-sm text-muted-foreground">Cargando…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-sm text-muted-foreground rounded-md border border-dashed border-border">
            {search || stageFilter !== "all" ? "Sin resultados con esos filtros." : "Aún no hay contactos."}
          </div>
        ) : view === "kanban" ? (
          <PipelinesKanban
            contacts={filtered}
            stages={PIPELINE_STAGES}
            onUpdateStage={updateStage}
            onSelect={setSelectedId}
          />
        ) : (
          <div className="rounded-md border border-border/40 divide-y divide-border/40 overflow-hidden">
            {filtered.map((c) => {
              const stage = PIPELINE_STAGES.find((s) => s.value === c.stage)
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
                      stage.value === "won" && "border-green-500/40 text-green-400",
                      stage.value === "lost" && "border-red-500/40 text-red-400",
                      stage.value === "attended" && "border-cyan-500/40 text-cyan-400",
                      stage.value === "booked" && "border-amber-500/40 text-amber-400",
                      !["won", "lost", "attended", "booked"].includes(stage.value) && "border-border/40 text-muted-foreground"
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
