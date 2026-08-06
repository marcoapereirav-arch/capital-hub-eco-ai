"use client"

import { useState } from "react"
import { X, Loader2 } from "lucide-react"
import { BTN_PRIMARY, FIELD, FONT } from "@/features/crm/lib/brand"
import { cn } from "@/lib/utils"

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
        // El error dice QUE pasó y QUE hacer, nunca un codigo pelado.
        setError(
          res.status === 409 || /duplicate|unique/i.test(data.error ?? "")
            ? "Ya existe un contacto con ese email. Búscalo en la lista para abrirlo."
            : data.error ?? "No se pudo crear el contacto. Revisa los datos e inténtalo otra vez."
        )
        return
      }
      onCreated(data.id)
    } catch {
      setError("No se pudo conectar. Comprueba tu conexión e inténtalo otra vez.")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4"
      onClick={onClose}
      style={{ fontFamily: FONT }}
    >
      <form
        role="dialog"
        aria-modal="true"
        aria-label="Nuevo contacto"
        onClick={(e) => e.stopPropagation()}
        onSubmit={handleSubmit}
        className="w-full max-w-md space-y-4 rounded-[8px] border border-[rgba(245,246,247,0.1)] bg-[#131318] p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.8)]"
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[17px] font-bold tracking-tight text-[#F5F6F7]">Nuevo contacto</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="flex h-9 w-9 items-center justify-center rounded-[4px] text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#F5F6F7]"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <Field label="Nombre completo" required value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
        <Field label="Email" required type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
        <Field label="Teléfono" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} />
        <Field label="Empresa" value={form.company} onChange={(v) => setForm({ ...form, company: v })} />
        <Field
          label="Origen"
          value={form.source}
          onChange={(v) => setForm({ ...form, source: v })}
          placeholder="manual, organic, ads, referral"
        />

        <p className="text-[13px] text-[#7C818A]">Entra al pipeline como Lead.</p>

        {error && <p className="text-[14px] text-[#E5B567]">{error}</p>}

        <div className="flex items-center justify-end gap-2 pt-1">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[44px] items-center rounded-[4px] border border-[rgba(245,246,247,0.1)] px-4 text-[14px] font-semibold text-[#A6AAB2] transition-colors hover:border-[rgba(245,246,247,0.2)] hover:bg-[#16161B] hover:text-[#F5F6F7]"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={creating || !form.full_name || !form.email}
            className={BTN_PRIMARY}
          >
            {creating && <Loader2 className="h-4 w-4 animate-spin" />}
            {creating ? "Creando" : "Crear contacto"}
          </button>
        </div>
      </form>
    </div>
  )
}

function Field({
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
      <span className="mb-1.5 block text-[13px] font-semibold text-[#A6AAB2]">
        {label}
        {!required && <span className="font-normal text-[#7C818A]"> (opcional)</span>}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className={cn(FIELD, "w-full")}
      />
    </label>
  )
}
