"use client"

import { useState, useMemo, useRef } from "react"
import { cn } from "@/lib/utils"
import { Euro } from "lucide-react"
import { TagChips } from "@/features/tags/components/tag-chips"

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
  lead: "border-cyan-500/40",
  agendado: "border-amber-500/40",
  alumno: "border-green-500/40",
  seguimiento: "border-violet-500/40",
  no_show: "border-orange-500/40",
  perdido: "border-red-500/40",
}

export function PipelinesKanban({
  contacts,
  stages,
  onUpdateStage,
  onSelect,
  tagsByContact,
}: {
  contacts: Contact[]
  stages: Stage[]
  onUpdateStage: (contactId: string, newStage: string) => void
  onSelect: (id: string) => void
  tagsByContact?: Map<string, import("@/features/tags/types/tag").Tag[]>
}) {
  const [dragging, setDragging] = useState<string | null>(null)
  const [overStage, setOverStage] = useState<string | null>(null)

  const grouped = useMemo(() => {
    const map = new Map<string, Contact[]>()
    for (const s of stages) map.set(s.value, [])
    for (const c of contacts) {
      const stage = c.stage ?? "lead"
      const arr = map.get(stage) ?? []
      arr.push(c)
      map.set(stage, arr)
    }
    return map
  }, [contacts, stages])

  return (
    // El scroll horizontal lo maneja el contenedor padre (ContactosPage en modo kanban).
    // Padding LATERAL en el contenido. El padding-right del flex container NO funciona
    // bien con overflow-x-auto en algunos navegadores, asi que anadimos un SPACER
    // explicito al final.
    <div className="flex gap-3 h-full pb-1 pl-4 md:pl-6">
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
                    {tagsByContact && (tagsByContact.get(c.id)?.length ?? 0) > 0 && (
                      <div className="mt-1">
                        <TagChips tags={tagsByContact.get(c.id) ?? []} max={3} size="xs" />
                      </div>
                    )}
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
      {/* Spacer: garantiza margen derecho cuando se scrollea al final del kanban.
          Sin esto, la ultima columna toca el borde derecho del viewport (en flex
          + overflow-x-auto el padding-right del contenedor NO se respeta en el
          extremo del scroll). */}
      <div aria-hidden className="shrink-0 w-4 md:w-8" />
    </div>
  )
}
