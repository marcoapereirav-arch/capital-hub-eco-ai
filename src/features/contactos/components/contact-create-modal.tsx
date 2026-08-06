"use client"

import { useState } from "react"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"

/**
 * Alta de contacto.
 *
 * En telefono es una hoja inferior, no una ventana centrada: una ventana centrada
 * la tapa el teclado en cuanto se toca el primer campo, y el boton de crear queda
 * fuera de alcance. El lado se fija en "bottom" y el ordenador se ajusta con
 * clases md:, nunca con JavaScript.
 */
export function ContactCreateModal({
  onClose,
  onCreated,
}: {
  onClose: () => void
  onCreated: (id: string) => void
}) {
  const [form, setForm] = useState({ full_name: "", email: "", phone: "", company: "", source: "manual" })
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setCreating(true)
    try {
      const res = await fetch("/api/admin/contacts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: form.full_name,
          email: form.email,
          phone: form.phone || undefined,
          company: form.company || undefined,
          source: form.source,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al crear")
        return
      }
      onCreated(data.id)
    } finally {
      setCreating(false)
    }
  }

  return (
    <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
      <SheetContent
        side="bottom"
        className={
          "max-h-[85dvh] w-full gap-0 overflow-y-auto rounded-t-xl pb-safe-4 " +
          // El `!` es obligatorio: la base de sheet.tsx pinta el lado inferior con
          // `data-[side=bottom]:...`, que compila como `.clase[data-side=bottom]` y
          // pesa mas que `md:left-auto`. Sin el, el cajon del ordenador sale pegado
          // al borde izquierdo y con la altura de una hoja de telefono.
          "md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-[28rem] md:max-w-[28rem] md:rounded-l-xl md:border-l md:pb-4"
        }
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader className="px-4">
          <SheetTitle className="text-[17px] font-semibold">Nuevo contacto</SheetTitle>
        </SheetHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-3 px-4 pb-2">
            <Campo label="Nombre completo *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required autoComplete="name" />
            <Campo label="Email *" type="email" inputMode="email" autoComplete="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <Campo label="Teléfono" type="tel" inputMode="tel" autoComplete="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
            <Campo label="Empresa" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
            <Campo label="Origen" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="manual, organic, ads, referral…" />

            {error && <p className="text-[15px] text-destructive">{error}</p>}
          </div>

          {/* Sticky, no fixed: el desplazamiento lo hace la hoja. */}
          <div className="sticky bottom-0 z-10 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-2">
            <button
              type="button"
              onClick={onClose}
              className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground md:h-9 md:flex-none md:px-4 md:text-sm"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={creating || !form.full_name || !form.email}
              className="h-11 flex-1 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-30 md:h-9 md:flex-none md:px-4 md:text-sm"
            >
              {creating ? "Creando…" : "Crear contacto"}
            </button>
          </div>
        </form>
      </SheetContent>
    </Sheet>
  )
}

function Campo({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
  inputMode?: React.ComponentProps<"input">["inputMode"]
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Etiqueta>{label}</Etiqueta>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        inputMode={inputMode}
        autoComplete={autoComplete}
        enterKeyHint="next"
        className="h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"
      />
    </label>
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
