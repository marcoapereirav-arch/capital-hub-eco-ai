"use client"

import { useState } from "react"
import { X } from "lucide-react"

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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-[2px]" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={handleSubmit} className="w-full max-w-md rounded-md border border-border bg-background p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold">Nuevo contacto</h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <Input label="Nombre completo *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
        <Input label="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
        <Input label="Teléfono" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Input label="Empresa" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Input label="Origen" value={form.source} onChange={(v) => setForm({ ...form, source: v })} placeholder="manual, organic, ads, referral…" />

        {error && <p className="text-xs text-red-400">{error}</p>}

        <div className="flex items-center gap-2 pt-2">
          <button
            type="submit"
            disabled={creating || !form.full_name || !form.email}
            className="rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30"
          >
            {creating ? "Creando…" : "Crear contacto"}
          </button>
          <button type="button" onClick={onClose} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
            Cancelar
          </button>
        </div>
      </form>
    </div>
  )
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  required?: boolean
  placeholder?: string
}) {
  return (
    <label className="block">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm"
      />
    </label>
  )
}
