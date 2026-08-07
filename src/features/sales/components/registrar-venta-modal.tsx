"use client"

import { useEffect, useState } from "react"
import { createPortal } from "react-dom"
import { X, Check, Loader2, AlertCircle, Phone, ShoppingBag, ChevronRight, ChevronDown } from "lucide-react"
import { cn } from "@/lib/utils"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

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

/**
 * Pinta la ventana en el `body`, nunca anidada donde vive el boton.
 *
 * Por que: si un padre tiene desenfoque o `transform`, por norma de CSS pasa a ser
 * el marco de referencia de todo lo que es `fixed`, y la ventana deja de cubrir la
 * pantalla: se encoge y se descoloca. Es el fallo recurrente de la SOP 47 (causa
 * raiz 3), y es exactamente lo que le pasaba a Marco en el telefono el 2026-08-08.
 */
function enElBody(nodo: React.ReactNode) {
  if (typeof document === "undefined") return null
  return createPortal(nodo, document.body)
}

export function RegistrarVentaModal({
  onClose,
  prefill,
  onRegistered,
}: {
  onClose: () => void
  /** Datos precargados al abrir desde la ficha / kanban / dashboard (contacto ya conocido). */
  prefill?: Partial<Form>
  /** Se llama tras registrar la venta con éxito (para que el CRM/dashboard recarguen). */
  onRegistered?: () => void
}) {
  const [config, setConfig] = useState<{ closers: Closer[]; products: string[]; payment_methods: string[] } | null>(null)
  const [form, setForm] = useState<Form>({ ...emptyForm, ...prefill })
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
      onRegistered?.()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error de red")
    } finally {
      setSubmitting(false)
    }
  }

  if (success) {
    const emailFailed = success.email_sent === false
    return enElBody(
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 md:items-center md:p-4">
        <div className={cn(
          "bg-background border rounded-lg p-6 max-w-md w-full text-center space-y-4",
          emailFailed ? "border-amber-500/50" : "border-green-500/40"
        )}>
          <Check className={cn("h-12 w-12 mx-auto", emailFailed ? "text-amber-400" : "text-primary")} />
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
            <div className="rounded-lg bg-amber-500/[0.08] border border-amber-500/30 p-3 text-left">
              <p className="text-sm font-semibold text-warn">Error Resend</p>
              <p className="text-xs text-amber-200/80 mt-0.5">{success.email_error}</p>
            </div>
          )}

          {(emailFailed || showMagicLink) ? (
            <div className="rounded-lg bg-card/40 border border-border p-3 text-left space-y-1">
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">Magic link</p>
                <button
                  type="button"
                  onClick={() => navigator.clipboard.writeText(success.invite_url)}
                  className="text-sm font-semibold text-primary"
                >
                  Copiar
                </button>
              </div>
              <p className="text-sm font-mono break-all text-muted-foreground">{success.invite_url}</p>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowMagicLink(true)}
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              Ver magic link (debug)
            </button>
          )}

          <div className="flex gap-2">
            <button onClick={onClose} className="flex-1 inline-flex min-h-11 items-center justify-center rounded-lg bg-primary text-primary-foreground px-3 text-sm font-semibold">
              Cerrar
            </button>
            <a href={`/contactos`} className="flex-1 inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-3 text-sm font-semibold text-center hover:bg-card">
              Ver contactos
            </a>
          </div>
        </div>
      </div>
    )
  }

  return enElBody(
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 md:items-center md:p-4"
      onClick={onClose}
    >
      <form
        onClick={(e) => e.stopPropagation()}
        onSubmit={submit}
        className={cn(
          "flex w-full min-h-0 max-w-2xl flex-col overflow-hidden border border-border bg-background",
          // El alto deja fuera la zona del reloj: con `vh` la cabecera se metia
          // debajo del reloj del iPhone y la X no se podia tocar.
          "max-h-[calc(100dvh-var(--sat)-2rem)] rounded-t-xl",
          "md:max-h-[85dvh] md:rounded-xl"
        )}
      >
        {/* Cabecera fija, con la salida SIEMPRE a la vista y a 44 puntos. */}
        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-4 py-3">
          <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
            <ShoppingBag className="h-5 w-5 text-primary" aria-hidden /> Registrar venta
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
            className="tap-target -mr-2 inline-flex items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-secondary active:text-foreground"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {/* UN solo sitio que se desplaza. Antes se desplazaban el fondo y el
            formulario a la vez y se peleaban. */}
        <div className="no-overscroll min-h-0 flex-1 overflow-y-auto p-4 space-y-5">
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
                    "rounded-lg border p-2.5 text-left transition-all",
                    form.close_type === v ? "border-green-500/60 bg-green-500/[0.06]" : "border-border hover:border-border"
                  )}
                >
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-sm text-muted-foreground">{desc}</div>
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
                      "flex items-center gap-2 rounded-lg border p-2.5 text-left transition-all",
                      checked ? "border-green-500/60 bg-green-500/[0.06] text-foreground" : "border-border text-muted-foreground hover:border-border"
                    )}
                  >
                    <div className={cn("h-4 w-4 rounded-lg border flex items-center justify-center shrink-0", checked && "bg-green-500 border-green-500")}>
                      {checked && <Check className="h-3 w-3 text-black" />}
                    </div>
                    <span className="text-sm">{p}</span>
                  </button>
                )
              })}
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
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
            <CloserPicker
              closers={config?.closers ?? []}
              value={form.closer_user_id}
              onPick={pickCloser}
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
            <div className="flex items-center gap-2 text-red-400 text-xs rounded-lg border border-red-500/30 bg-red-500/[0.06] p-2">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}
        </div>

        {/* Pie fijo de la hoja, con sitio para la franja de gestos del telefono. */}
        <div className="flex shrink-0 gap-2 border-t border-border bg-background p-3 pb-[calc(0.75rem+var(--sab))] md:pb-3">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-11 items-center justify-center rounded-lg border border-border px-4 text-sm font-semibold text-foreground transition-colors active:bg-muted"
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={submitting || !form.full_name || !form.email}
            className="inline-flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-primary-foreground transition-all disabled:cursor-not-allowed disabled:opacity-30"
          >
            {submitting ? <><Loader2 className="h-4 w-4 animate-spin" /> Registrando…</> : <>Registrar venta y enviar acceso <ChevronRight className="h-4 w-4" /></>}
          </button>
        </div>
      </form>
    </div>
  )
}

function Label({ children, required }: { children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block text-sm font-semibold text-muted-foreground">
      {children}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  )
}

const fieldBase = "w-full min-h-11 rounded-lg border px-3 py-2.5 text-base md:text-sm transition-colors focus:outline-none focus:border-ring focus:bg-secondary"
const fieldOk = "border-border bg-card hover:bg-secondary hover:border-foreground/40 text-foreground placeholder:text-muted-foreground"
const fieldRequiredEmpty = "border-destructive/60 bg-destructive/10 hover:bg-destructive/[0.14] text-foreground placeholder:text-destructive/80"

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
      className={cn(fieldBase, empty ? fieldRequiredEmpty : fieldOk)}
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

const ROLE_LABELS: Record<string, string> = {
  super_admin: "Admin",
  admin: "Admin",
  marketing: "Marketing",
  closer: "Closer",
  setter: "Setter",
  formador: "Formador",
}

function roleLabel(role: string): string {
  return ROLE_LABELS[role] ?? role
}

function deriveInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/**
 * Selector de "quién cerró". Dropdown brandkit (Radix, portalea a body) en vez
 * de un <select> nativo: las opciones nativas las pinta el SO y en dark se ven
 * apretadas/ilegibles. Aquí cada persona se muestra con avatar de iniciales,
 * nombre y rol, con aire entre filas. La lista la alimenta /api/admin/sales/register
 * (todas las personas activas del SaaS, sincronizadas en vivo).
 */
function CloserPicker({
  closers,
  value,
  onPick,
}: {
  closers: Closer[]
  value: string
  onPick: (id: string) => void
}) {
  const selected = closers.find((c) => c.id === value)
  return (
    <div className="mt-1.5">
      <DropdownMenu modal={false}>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              fieldBase,
              value ? fieldOk : fieldRequiredEmpty,
              "flex items-center justify-between gap-2 text-left"
            )}
          >
            <span className={cn("truncate", !selected && "text-red-300/60")}>
              {selected ? prettifyName(selected.full_name, selected.email) : "Selecciona quién cerró"}
            </span>
            <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="max-h-72 min-w-[var(--radix-dropdown-menu-trigger-width)]">
          {closers.length === 0 ? (
            <div className="px-2 py-3 text-center text-xs text-muted-foreground">
              No hay personas en el equipo todavía
            </div>
          ) : (
            closers.map((c) => {
              const name = prettifyName(c.full_name, c.email)
              const active = value === c.id
              return (
                <DropdownMenuItem
                  key={c.id}
                  onSelect={() => onPick(c.id)}
                  className="flex items-center gap-2.5 py-2"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground">
                    {deriveInitials(name)}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm text-foreground">{name}</span>
                    <span className="truncate text-sm text-muted-foreground">
                      {roleLabel(c.role)}
                    </span>
                  </span>
                  {active && <Check className="ml-auto h-4 w-4 shrink-0 text-primary" />}
                </DropdownMenuItem>
              )
            })
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
