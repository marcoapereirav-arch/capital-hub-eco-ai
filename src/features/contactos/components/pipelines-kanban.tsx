"use client"

import { useState, useMemo } from "react"
import { cn } from "@/lib/utils"
import { TagChips } from "@/features/tags/components/tag-chips"
import { stageTone } from "@/features/crm/lib/brand"

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
    // Padding LATERAL en el contenido: el padding-right del contenedor con overflow-x-auto
    // no se respeta al final del scroll en algunos navegadores, de ahi el spacer del final.
    <div className="flex h-full gap-3 pb-1 pl-4 md:pl-6">
      {stages.map((s) => {
        const list = grouped.get(s.value) ?? []
        const totalRev = list.reduce((acc, c) => acc + (c.total_revenue ?? 0), 0)
        const isOver = overStage === s.value
        const tone = stageTone(s.value)
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
              "flex h-full w-72 shrink-0 flex-col overflow-hidden rounded-[8px] border bg-[#131318] transition-colors",
              isOver
                ? "border-[#24462F] bg-[#101710]"
                : "border-[rgba(245,246,247,0.1)]"
            )}
          >
            {/* Linea de color del stage. Es lo unico que distingue una columna de otra:
                gris que se aclara segun avanza el funnel, VERDE en la venta, ambar en el
                aviso. Antes cada columna llevaba un neon distinto (cian, violeta, naranja),
                que no significaba nada y no esta en el brandkit. */}
            <div
              aria-hidden
              className="h-[3px] w-full shrink-0"
              style={{ backgroundColor: tone.rule }}
            />

            <div className="flex shrink-0 items-center justify-between gap-2 px-3 py-2.5">
              <span className="truncate text-[14px] font-semibold text-[#F5F6F7]">{s.label}</span>
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="text-[13px] tabular-nums text-[#7C818A]">{list.length}</span>
                {totalRev > 0 && (
                  <span className="text-[13px] font-semibold tabular-nums text-[#4ADE80]">
                    {Math.round(totalRev).toLocaleString("es-ES")} EUR
                  </span>
                )}
              </span>
            </div>

            {/* Lista de fichas con SCROLL VERTICAL propio. */}
            <div className="min-h-0 flex-1 space-y-2 overflow-y-auto overscroll-contain px-2 pb-2">
              {list.length === 0 ? (
                <p className="px-1.5 py-3 text-[13px] text-[#7C818A]">
                  {isOver ? "Suelta aquí" : "Sin contactos"}
                </p>
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
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.preventDefault()
                        onSelect(c.id)
                      }
                    }}
                    className={cn(
                      "cursor-grab rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#16161B] p-2.5",
                      "transition-colors hover:border-[rgba(245,246,247,0.2)] active:cursor-grabbing",
                      "focus:outline-none focus-visible:border-[#24462F] focus-visible:ring-1 focus-visible:ring-[rgba(34,197,94,0.45)]",
                      dragging === c.id && "opacity-50"
                    )}
                  >
                    <p className="truncate text-[14px] font-semibold text-[#F5F6F7]">{c.full_name}</p>
                    <p className="truncate text-[13px] text-[#7C818A]">{c.email}</p>
                    {tagsByContact && (tagsByContact.get(c.id)?.length ?? 0) > 0 && (
                      <div className="mt-1.5">
                        <TagChips tags={tagsByContact.get(c.id) ?? []} max={3} size="xs" />
                      </div>
                    )}
                    {c.products.length > 0 && (
                      <div className="mt-1.5 flex flex-wrap gap-1">
                        {c.products.map((p) => (
                          <span
                            key={p}
                            className="rounded-[3px] border border-[rgba(245,246,247,0.1)] px-1.5 py-0.5 text-[12px] text-[#A6AAB2]"
                          >
                            {p}
                          </span>
                        ))}
                      </div>
                    )}
                    {c.total_revenue > 0 && (
                      <p className="mt-1.5 text-[13px] font-semibold tabular-nums text-[#4ADE80]">
                        {Math.round(c.total_revenue).toLocaleString("es-ES")} EUR
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )
      })}
      {/* Spacer: garantiza margen derecho al scrollear hasta el final del kanban. Sin esto
          la ultima columna toca el borde (en flex + overflow-x-auto el padding-right del
          contenedor NO se respeta en el extremo del scroll). */}
      <div aria-hidden className="w-4 shrink-0 md:w-8" />
    </div>
  )
}
