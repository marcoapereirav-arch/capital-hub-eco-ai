"use client"

import { useEffect, useState } from "react"
import { X, Check, Loader2, AlertCircle, Phone, ShoppingBag, ChevronRight } from "lucide-react"
import { cn } from "@/lib/utils"

type Closer = { id: string; full_name: string | null; email: string; role: string }
type CloseType = "sales_call" | "direct"

type Form = {
  close_type: CloseType
  contact_id?: string
  full_name: string
  email: string
  phone: string
  source: string
  products: string[]
  revenue: string
  cash_collected: string
  payment_method: string
  closer_user_id: string
  closer_name: string
  notes: string
}

const emptyForm: Form = {
  close_type: "sales_call",
  full_name: "",
  email: "",
  phone: "",
  source: "",
  products: [],
  revenue: "",
  cash_collected: "",
  payment_method: "",
  closer_user_id: "",
  closer_name: "",
  notes: "",
}

export function RegistrarVentaModal({ onClose }: { onClose: () => void }) {
  const [config, setConfig] = useState<{ closers: Closer[]; products: string[]; payment_methods: string[] } | null>(null)
  const [form, setForm] = useState<Form>(emptyForm)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<{ contact_id: string; invite_url: string; revenue: number } | null>(null)

  useEffect(() => {
    fetch("/api/admin/sales/register")
      .then((r) => r.json())
      .then((d) => setConfig(d))
  }, [])

  function toggleProduct(p: string) {
    setForm((prev) => ({
      ...prev,
      products: prev.products.includes(p) ? prev.products.filter((x) => x !== p) : [...prev.products, p],
    }))
  }

  function pickCloser(closerId: string) {
    const c = config?.closers.find((x) => x.id === closerId)
    if (!c) return
    setForm((prev) => ({
      ...prev,
      closer_user_id: closerId,
      closer_name: c.full_name ?? c.email,
    }))
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    if (form.products.length === 0) { setError("Selecciona al menos 1 producto"); return }
    if (!form.closer_user_id) { setError("Selecciona quién cerró"); return }
    if (!form.payment_method) { setError("Selecciona método de pago"); return }

    setSubmitting(true)
    try {
      const res = await fetch("/api/admin/sales/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          close_type: form.close_type,
          contact_id: form.contact_id || undefined,
          full_name: form.full_name.trim(),
          email: form.email.trim(),
          phone: form.phone.trim() || undefined,
          source: form.source.trim() || undefined,
          products: form.products,
          revenue: parseFloat(form.revenue || "0"),
          cash_collected: parseFloat(form.cash_collected || "0"),
          payment_method: form.payment_method,
          closer_user_id: form.closer_user_id,
          closer_name: form.closer_name,
          notes: form.notes.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error registrando la venta")
        return
      }
      setSuccess(data)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className="bg-background border border-green-500/40 rounded-lg p-6 max-w-md w-full text-center space-y-4">
          <Check className="h-12 w-12 mx-auto text-green-400" />
          <div>
            <h2 className="text-xl font-semibold">Venta registrada ✓</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {success.revenue.toLocaleString("es-ES")}€ · email enviado al alumno
            </p>
          </div>
          <div className="rounded-sm bg-card/40 p-3 text-left space-y-1">
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Magic link enviado:</p>
            <p className="text-xs font-mono break-all text-muted-foreground">{success.invite_url}</p>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 rounded-sm bg-foreground text-background px-3 py-2 text-xs font-mono uppercase tracking-wider">
              Cerrar
            </button>
            <a href={`/contactos`} className="flex-1 rounded-sm border border-border/40 px-3 py-2 text-xs font-mono uppercase tracking-wider text-center hover:bg-card">
              Ver contactos
            </a>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end md:items-center justify-center p-0 md:p-4 overflow-y-auto" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="bg-background border border-border rounded-t-lg md:rounded-lg w-full max-w-2xl my-auto md:my-0 max-h-[95vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between z-10">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <ShoppingBag className="h-4 w-4 text-green-400" /> Registrar venta
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="p-4 space-y-5">
          {/* Tipo cierre */}
          <section>
            <Label>Tipo de cierre</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              {([
                ["sales_call", "Tras llamada", "Lead reservó y vino al Zoom"],
                ["direct", "Direct close", "Sin llamada previa (DM, referral)"],
              ] as const).map(([v, label, desc]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => setForm({ ...form, close_type: v })}
                  className={cn(
                    "rounded-sm border p-2.5 text-left transition-all",
                    form.close_type === v ? "border-green-500/60 bg-green-500/[0.06]" : "border-border/40 hover:border-border"
                  )}
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-[10px] text-muted-foreground">{desc}</div>
                </button>
              ))}
            </div>
          </section>

          {/* Lead */}
          <section className="space-y-2">
            <Label>Lead</Label>
            <Input placeholder="Nombre completo *" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} />
            <Input placeholder="Email *" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Teléfono" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} icon={Phone} />
              <Input placeholder="Origen (instagram, ads, referral...)" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
            </div>
          </section>

          {/* Producto */}
          <section>
            <Label>Producto comprado *</Label>
            <div className="grid grid-cols-1 gap-1.5 mt-1.5">
              {(config?.products ?? []).map((p) => {
                const checked = form.products.includes(p)
                return (
                  <button
                    key={p}
                    type="button"
                    onClick={() => toggleProduct(p)}
                    className={cn(
                      "flex items-center gap-2 rounded-sm border p-2.5 text-left transition-all",
                      checked ? "border-green-500/60 bg-green-500/[0.06] text-foreground" : "border-border/40 text-muted-foreground hover:border-border"
                    )}
                  >
                    <div className={cn("h-4 w-4 rounded-sm border flex items-center justify-center shrink-0", checked && "bg-green-500 border-green-500")}>
                      {checked && <Check className="h-3 w-3 text-black" />}
                    </div>
                    <span className="text-sm">{p}</span>
                  </button>
                )
              })}
            </div>
            <p className="text-[10px] font-mono text-muted-foreground mt-2">
              Por norma el alumno compra solo 1. La UI permite varios por flexibilidad.
            </p>
          </section>

          {/* Cifras */}
          <section>
            <Label>Cifras</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <NumberInput placeholder="Revenue (€) *" value={form.revenue} onChange={(v) => setForm({ ...form, revenue: v })} />
              <NumberInput placeholder="Cash collected (€) *" value={form.cash_collected} onChange={(v) => setForm({ ...form, cash_collected: v })} />
            </div>
            <Select
              value={form.payment_method}
              onChange={(v) => setForm({ ...form, payment_method: v })}
              options={config?.payment_methods ?? []}
              placeholder="Método de pago *"
              className="mt-2"
            />
          </section>

          {/* Cerró */}
          <section>
            <Label>Quién cerró *</Label>
            <Select
              value={form.closer_user_id}
              onChange={pickCloser}
              options={(config?.closers ?? []).map((c) => ({ value: c.id, label: `${c.full_name ?? c.email} · ${c.role}` }))}
              placeholder="Selecciona cerrador"
              className="mt-1.5"
            />
          </section>

          {/* Notas */}
          <section>
            <Label>Notas internas (opcional)</Label>
            <textarea
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
              rows={3}
              placeholder="Ej: Quiere empezar IA primero, mencionó interés futuro en Comercial..."
              className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm resize-none mt-1.5"
            />
          </section>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-xs rounded-sm border border-red-500/30 bg-red-500/[0.06] p-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Footer sticky */}
        <div className="sticky bottom-0 bg-background border-t border-border p-3 flex gap-2">
          <button
            type="button"
            onClick={onClose}
            className="rounded-sm border border-border/40 px-4 py-2 text-xs font-mono uppercase tracking-wider hover:bg-card"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !form.full_name || !form.email}
            className="flex-1 rounded-sm bg-gradient-to-br from-green-500 to-green-600 text-black px-4 py-2.5 text-xs font-mono uppercase tracking-wider font-bold disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center gap-2 hover:shadow-lg transition-all"
          >
            {submitting ? <><Loader2 className="h-3.5 w-3.5 animate-spin" /> Registrando…</> : <>Registrar venta y enviar acceso <ChevronRight className="h-3.5 w-3.5" /></>}
          </button>
        </div>
      </form>
    </div>
  )
}

function Label({ children }: { children: React.ReactNode }) {
  return <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{children}</label>
}

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  icon?: typeof Phone
}) {
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          "w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm",
          Icon && "pl-7"
        )}
      />
    </div>
  )
}

function NumberInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm font-mono"
    />
  )
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
}: {
  value: string
  onChange: (v: string) => void
  options: string[] | { value: string; label: string }[]
  placeholder?: string
  className?: string
}) {
  const isObj = typeof options[0] === "object"
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn("w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm", className)}
    >
      <option value="">{placeholder ?? "Selecciona…"}</option>
      {(options as Array<string | { value: string; label: string }>).map((o) =>
        isObj ? (
          <option key={(o as { value: string }).value} value={(o as { value: string }).value}>
            {(o as { label: string }).label}
          </option>
        ) : (
          <option key={o as string} value={o as string}>{o as string}</option>
        )
      )}
    </select>
  )
}
