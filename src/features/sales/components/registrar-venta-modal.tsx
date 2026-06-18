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
  const [success, setSuccess] = useState<{ contact_id: string; invite_url: string; revenue: number; email_sent?: boolean; email_error?: string | null } | null>(null)
  const [showMagicLink, setShowMagicLink] = useState(false)

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
    if (!form.full_name.trim()) { setError("Falta el nombre completo del alumno"); return }
    if (!form.email.trim()) { setError("Falta el email del alumno"); return }
    if (!form.phone.trim() || form.phone.trim().length < 6) { setError("El teléfono es obligatorio"); return }
    if (form.products.length === 0) { setError("Selecciona al menos 1 producto"); return }
    if (!form.revenue) { setError("Falta el revenue"); return }
    if (!form.cash_collected) { setError("Falta el cash collected"); return }
    if (!form.payment_method) { setError("Selecciona método de pago"); return }
    if (!form.closer_user_id) { setError("Selecciona quién cerró"); return }

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
    const emailFailed = success.email_sent === false
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
        <div className={cn(
          "bg-background border rounded-lg p-6 max-w-md w-full text-center space-y-4",
          emailFailed ? "border-amber-500/50" : "border-green-500/40"
        )}>
          <Check className={cn("h-12 w-12 mx-auto", emailFailed ? "text-amber-400" : "text-green-400")} />
          <div>
            <h2 className="text-xl font-semibold">Venta registrada ✓</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {success.revenue.toLocaleString("es-ES")}€
              {emailFailed ? (
                <> · <span className="text-amber-300">email NO enviado — copia el link</span></>
              ) : (
                <> · email enviado al alumno</>
              )}
            </p>
          </div>

          {emailFailed && success.email_error && (
            <div className="rounded-sm bg-amber-500/[0.08] border border-amber-500/30 p-3 text-left">
              <p className="text-[10px] font-mono uppercase tracking-wider text-amber-300">Error Resend</p>
              <p className="text-xs text-amber-200/80 mt-0.5">{success.email_error}</p>
            </div>
          )}

          {(emailFailed || showMagicLink) ? (
            <div className="rounded-sm bg-card/40 border border-border/40 p-3 text-left space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Magic link</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(success.invite_url)}
                  className="text-[10px] font-mono uppercase tracking-wider text-green-400 hover:text-green-300"
                >
                  Copiar
                </button>
              </div>
              <p className="text-xs font-mono break-all text-muted-foreground">{success.invite_url}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowMagicLink(true)}
              className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground hover:text-foreground"
            >
              Ver magic link (debug)
            </button>
          )}

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
            <Label required>Tipo de cierre</Label>
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
            <Label required>Lead</Label>
            <Input placeholder="Nombre completo" value={form.full_name} onChange={(v) => setForm({ ...form, full_name: v })} required />
            <Input placeholder="Email" type="email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} required />
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Teléfono" type="tel" value={form.phone} onChange={(v) => setForm({ ...form, phone: v })} icon={Phone} required />
              <Input placeholder="Origen (instagram, ads, referral...)" value={form.source} onChange={(v) => setForm({ ...form, source: v })} />
            </div>
          </section>

          {/* Producto */}
          <section>
            <Label required>Producto comprado</Label>
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
            <Label required>Cifras</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <NumberInput placeholder="Revenue (€)" value={form.revenue} onChange={(v) => setForm({ ...form, revenue: v })} required />
              <NumberInput placeholder="Cash collected (€)" value={form.cash_collected} onChange={(v) => setForm({ ...form, cash_collected: v })} required />
            </div>
            <Select
              value={form.payment_method}
              onChange={(v) => setForm({ ...form, payment_method: v })}
              options={config?.payment_methods ?? []}
              placeholder="Método de pago"
              className="mt-2"
              required
            />
          </section>

          {/* Cerró */}
          <section>
            <Label required>Quién cerró</Label>
            <Select
              value={form.closer_user_id}
              onChange={pickCloser}
              options={(config?.closers ?? []).map((c) => ({ value: c.id, label: prettifyName(c.full_name, c.email) }))}
              placeholder="Selecciona quien cerró"
              className="mt-1.5"
              required
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
              className={cn(fieldBase, fieldOk, "resize-none mt-1.5")}
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

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-[11px] font-mono uppercase tracking-wider text-foreground/90">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

const fieldBase = "w-full rounded-sm border px-3 py-2.5 text-sm transition-colors focus:outline-none focus:bg-white/[0.08] focus:border-green-500/70"
const fieldOk = "border-white/25 bg-white/[0.04] hover:bg-white/[0.06] hover:border-white/40 text-foreground placeholder:text-muted-foreground/70"
const fieldRequiredEmpty = "border-red-500/50 bg-red-500/[0.06] hover:bg-red-500/[0.08] text-foreground placeholder:text-red-300/60"

function Input({
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
  required,
}: {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  type?: string
  icon?: typeof Phone
  required?: boolean
}) {
  const empty = required && value.trim().length === 0
  return (
    <div className="relative">
      {Icon && <Icon className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />}
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(fieldBase, empty ? fieldRequiredEmpty : fieldOk, Icon && "pl-8")}
      />
    </div>
  )
}

function NumberInput({ value, onChange, placeholder, required }: { value: string; onChange: (v: string) => void; placeholder?: string; required?: boolean }) {
  const empty = required && value.trim().length === 0
  return (
    <input
      type="number"
      step="0.01"
      min="0"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className={cn(fieldBase, "font-mono", empty ? fieldRequiredEmpty : fieldOk)}
    />
  )
}

function Select({
  value,
  onChange,
  options,
  placeholder,
  className,
  required,
}: {
  value: string
  onChange: (v: string) => void
  options: string[] | { value: string; label: string }[]
  placeholder?: string
  className?: string
  required?: boolean
}) {
  const isObj = typeof options[0] === "object"
  const empty = required && !value
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={cn(fieldBase, empty ? fieldRequiredEmpty : fieldOk, className)}
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

function prettifyName(fullName: string | null, email: string): string {
  if (fullName && fullName.trim().length > 0) return fullName.trim()
  const userPart = email.split("@")[0]
  return userPart
    .replace(/[._-]+/g, " ")
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0].toUpperCase() + w.slice(1).toLowerCase())
    .join(" ")
}
