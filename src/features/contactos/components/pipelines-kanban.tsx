"use client"

import { useState, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { Euro } from "lucide-react"

type Contact = {
  id: string
  full_name: string
  email: string
  phone: string | null
  stage: string | null
  products: string[]
  total_revenue: number
}

type Stage = { value: string; label: string }

const STAGE_COLORS: Record<string, string> = {
  nuevo_seguidor: "border-border/40",
  contactado: "border-blue-500/40",
  agendado: "border-amber-500/40",
  atendio: "border-cyan-500/40",
  seguimiento: "border-violet-500/40",
  cliente: "border-green-500/40",
  no_show: "border-orange-500/40",
  perdido: "border-red-500/40",
}

export function PipelinesKanban({
  contacts,
  stages,
  onUpdateStage,
  onSelect,
}: {
  contacts: Contact[]
  stages: Stage[]
  onUpdateStage: (contactId: string, newStage: string) => void
  onSelect: (id: string) => void
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>()
    for (const s of stages) map.set(s.value, [])
    for (const c of contacts) {
      const stage = c.stage ?? "nuevo_seguidor"
      const arr = map.get(stage) ?? []
      arr.push(c)
      map.set(stage, arr)
    }
    return map
  }, [contacts, stages])

  return (
    // El scroll horizontal lo maneja el contenedor padre (ContactosPage en modo kanban).
    // Aqui solo distribuimos columnas + cada columna scrollea vertical INTERNO.
    // PADDING INTERNO (px-4 md:px-6): asi cuando el usuario scrollea hasta el final,
    // la ultima columna mantiene margen lateral derecho (no se pega al borde).
    <div className="flex gap-3 h-full pb-1 px-4 md:px-6">
      {stages.map((s) => {
        const list = grouped.get(s.value) ?? []
        const totalRev = list.reduce((acc, c) => acc + (c.total_revenue ?? 0), 0)
        const isOver = overStage === s.value
        return (
          <div
            key={s.value}
            onDragOver={(e) => { e.preventDefault(); setOverStage(s.value) }}
            onDragLeave={() => setOverStage(null)}
            onDrop={(e) => {
              e.preventDefault()
              const id = e.dataTransfer.getData("text/contact-id")
              if (id) onUpdateStage(id, s.value)
              setOverStage(null)
              setDragging(null)
            }}
            className={cn(
              "shrink-0 w-72 h-full rounded-md border bg-card/30 p-2 transition-colors flex flex-col",
              STAGE_COLORS[s.value] ?? "border-border/40",
              isOver && "bg-card/60 ring-2 ring-foreground/30"
            )}
          >
            <div className="flex items-center justify-between px-1.5 shrink-0 mb-2">
              <div className="text-xs font-mono uppercase tracking-wider text-foreground">{s.label}</div>
              <div className="text-[10px] font-mono text-muted-foreground">
                {list.length}{totalRev > 0 && <span className="text-green-400 ml-2">{Math.round(totalRev)}€</span>}
              </div>
            </div>

            {/* Lista de cards con SCROLL VERTICAL propio. */}
            <div className="space-y-1.5 flex-1 min-h-0 overflow-y-auto pr-0.5">
              {list.length === 0 ? (
                <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground/40 px-1.5 py-2">
                  vacío
                </div>
              ) : (
                list.map((c) => (
                  <div
                    key={c.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData("text/contact-id", c.id)
                      e.dataTransfer.effectAllowed = "move"
                      setDragging(c.id)
                    }}
                    onDragEnd={() => { setDragging(null); setOverStage(null) }}
                    onClick={() => onSelect(c.id)}
                    className={cn(
                      "cursor-grab active:cursor-grabbing rounded-sm border border-border/40 bg-background p-2 text-sm hover:border-border transition-colors",
                      dragging === c.id && "opacity-50"
                    )}
                  >
                    <div className="font-medium truncate">{c.full_name}</div>
                    <div className="text-[10px] font-mono text-muted-foreground truncate">{c.email}</div>
                    {c.products.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {c.products.map((p) => (
                          <span key={p} className="text-[9px] font-mono uppercase border border-border/40 px-1 py-0.5 rounded-sm">
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    {c.total_revenue > 0 && (
                      <div className="text-[10px] font-mono text-green-400 mt-1 flex items-center gap-0.5">
                        <Euro className="h-2.5 w-2.5" />
                        {c.total_revenue.toLocaleString("es-ES", { maximumFractionDigits: 0 })}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
