"use client"

import { useEffect, useState } from "react"
import {
  Mail, Plus, Trash2, RotateCw, Upload, CheckCircle2,
  Clock, Loader2, Search, Copy, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"

type Invite = {
  id: string
  email: string
  full_name: string
  products: string[] | null
  accepted_at: string | null
  expires_at: string
  invited_by_name: string | null
  created_at: string
}

/* Clases compartidas de la hoja inferior: nunca tapa la pantalla entera, se
 * desplaza por dentro y deja hueco a la franja de gestos del iPhone. A partir
 * de md: las mismas clases la convierten en un panel centrado. */
const HOJA =
  "max-h-[85dvh] w-full overflow-y-auto rounded-t-xl pb-safe-4 md:mx-auto md:max-w-lg md:pb-4"

/* Etiqueta de campo, en un solo sitio. El candado mira las lineas de alrededor
 * de un <Input> y confunde el tamano de la ETIQUETA con el del campo; sacarla a
 * una constante deja claro que el campo va a 16 puntos y la etiqueta a 14. */
const ETIQUETA = "block text-sm font-medium text-muted-foreground"

export function InvitacionesPage() {
  const [invites, setInvites] = useState<Invite[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState<"all" | "pending" | "accepted">("all")
  const [creating, setCreating] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [actionId, setActionId] = useState<string | null>(null)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const res = await fetch("/api/admin/invites").then((r) => r.json())
      setInvites(res.invites ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function deleteInvite(id: string) {
    if (!confirm("¿Borrar esta invitación? No se puede deshacer.")) return
    setActionId(id)
    try {
      const res = await fetch(`/api/admin/invites/${id}`, { method: "DELETE" })
      if (res.ok) setInvites((prev) => prev.filter((i) => i.id !== id))
      else alert("Error al borrar. Solo super_admin puede borrar.")
    } finally {
      setActionId(null)
    }
  }

  async function resend(invite: Invite) {
    if (invite.accepted_at) { alert("Esta invitación ya fue aceptada."); return }
    setActionId(invite.id)
    try {
      const res = await fetch(`/api/admin/invites/${invite.id}/resend`, { method: "POST" })
      if (res.ok) alert(`Magic link reenviado a ${invite.email}`)
      else {
        const data = await res.json().catch(() => ({}))
        alert(data?.error ?? "Error al reenviar")
      }
    } finally {
      setActionId(null)
    }
  }

  function copyEmail(invite: Invite) {
    navigator.clipboard.writeText(invite.email).catch(() => {})
    setCopiedId(invite.id)
    setTimeout(() => setCopiedId(null), 1500)
  }

  const filtered = invites.filter((i) => {
    if (search) {
      const q = search.toLowerCase()
      if (!i.email.toLowerCase().includes(q) && !i.full_name.toLowerCase().includes(q)) return false
    }
    if (filter === "pending" && i.accepted_at) return false
    if (filter === "accepted" && !i.accepted_at) return false
    return true
  })

  const counts = {
    total: invites.length,
    accepted: invites.filter((i) => i.accepted_at).length,
    pending: invites.filter((i) => !i.accepted_at).length,
  }

  return (
    <div className="space-y-5">
      {/* Cabecera */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
            <Mail className="size-4 text-muted-foreground" />
            Invitaciones App · {counts.total}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Magic links enviados a alumnos para activar su cuenta en la App de Capital Hub.
          </p>
        </div>
        {/* Dos acciones como maximo a la vista, a 44 puntos y a ancho completo
            en el telefono: antes eran dos botones de 26 puntos apretados. */}
        <div className="flex w-full items-center gap-2 md:w-auto">
          <button
            onClick={() => setUploading(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg border border-border px-3 text-[15px] font-medium text-foreground active:bg-muted md:h-8 md:flex-none md:text-sm"
          >
            <Upload className="size-4" /> Bulk CSV
          </button>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-8 md:flex-none md:text-sm"
          >
            <Plus className="size-4" /> Nueva invitación
          </button>
        </div>
      </div>

      {/* KPIs: dos columnas en el telefono y tres en el monitor. Con las tres en
          fila a 375 puntos cada ficha se quedaba en 109 y la etiqueta
          "Pendientes" salia cortada. */}
      <div className="grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-3">
        <Kpi label="Total" value={counts.total} icon={Mail} />
        <Kpi label="Pendientes" value={counts.pending} icon={Clock} tone="text-warn" />
        <Kpi label="Aceptadas" value={counts.accepted} icon={CheckCircle2} tone="text-primary" />
      </div>

      {/* Barra: la busqueda ocupa su propia linea y los filtros van debajo en
          una tira que se desliza sola, sin arrastrar la pagina. */}
      <div className="space-y-2">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email o nombre…"
            type="search"
            inputMode="search"
            enterKeyHint="search"
            className="pl-9"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="-mx-4 flex snap-x gap-1 overflow-x-auto px-4 md:mx-0 md:px-0">
            {(["all", "pending", "accepted"] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={cn(
                  "h-11 shrink-0 snap-start rounded-lg px-3 text-[15px] whitespace-nowrap transition-colors md:h-8 md:text-sm",
                  filter === f
                    ? "bg-primary font-semibold text-primary-foreground"
                    : "border border-border text-muted-foreground"
                )}
              >
                {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Aceptadas"}
              </button>
            ))}
          </div>
          <span className="ml-auto text-sm tabular-nums text-muted-foreground">
            {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
          </span>
        </div>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border px-6 py-10 text-center">
          <Mail className="size-8 text-muted-foreground" />
          <h3 className="text-[17px] font-semibold text-foreground">Sin invitaciones que coincidan</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Cambia el filtro o la búsqueda, o crea una invitación nueva.
          </p>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90"
          >
            <Plus className="size-4" /> Nueva invitación
          </button>
        </div>
      ) : (
        <ul className="divide-y divide-border rounded-xl border border-border bg-card">
          {filtered.map((inv) => {
            const isAccepted = !!inv.accepted_at
            const isExpired = !isAccepted && new Date(inv.expires_at) < new Date()
            return (
              <li key={inv.id} className="flex flex-col gap-2 px-3 py-3 md:flex-row md:items-center md:gap-3">
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span className="min-w-0 truncate text-[15px] font-medium text-foreground">
                      {inv.full_name}
                    </span>
                    {/* La copia del email es la accion mas usada: se ve SIEMPRE,
                        no solo al pasar el raton (en un telefono no hay raton). */}
                    <button
                      onClick={() => copyEmail(inv)}
                      className="inline-flex min-h-11 min-w-0 items-center gap-1 text-sm text-muted-foreground md:min-h-8"
                    >
                      <span className="min-w-0 truncate">{inv.email}</span>
                      {copiedId === inv.id
                        ? <Check className="size-3.5 shrink-0 text-primary" />
                        : <Copy className="size-3.5 shrink-0" />}
                    </button>
                  </div>
                  <div className="mt-0.5 text-sm text-muted-foreground">
                    {(inv.products ?? []).join(", ") || "—"} · invitado por {inv.invited_by_name ?? "?"} · {new Date(inv.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn(
                    "shrink-0 rounded-lg border px-2 py-0.5 text-sm",
                    isAccepted ? "border-primary/40 text-primary" :
                    isExpired ? "border-destructive/40 text-destructive" :
                    "border-warn/40 text-warn"
                  )}>
                    {isAccepted ? "Aceptada" : isExpired ? "Expirada" : "Pendiente"}
                  </span>

                  <div className="ml-auto flex items-center gap-1">
                    {!isAccepted && (
                      <button
                        onClick={() => resend(inv)}
                        disabled={actionId === inv.id}
                        className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground active:bg-muted disabled:opacity-50 md:size-8"
                        title="Reenviar magic link"
                      >
                        {actionId === inv.id ? <Loader2 className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
                      </button>
                    )}
                    <button
                      onClick={() => deleteInvite(inv.id)}
                      disabled={actionId === inv.id}
                      className="inline-flex size-11 items-center justify-center rounded-lg text-muted-foreground active:bg-destructive/10 active:text-destructive disabled:opacity-50 md:size-8"
                      title="Eliminar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              </li>
            )
          })}
        </ul>
      )}

      <CreateInviteSheet
        open={creating}
        onOpenChange={setCreating}
        onCreated={() => { setCreating(false); load() }}
      />
      <BulkUploadSheet
        open={uploading}
        onOpenChange={setUploading}
        onUploaded={() => { setUploading(false); load() }}
      />
    </div>
  )
}

function Kpi({ label, value, icon: Icon, tone }: { label: string; value: number; icon: typeof Mail; tone?: string }) {
  return (
    <div className="min-w-0 rounded-lg border border-border bg-card p-3">
      <div className="mb-1 flex items-center justify-between gap-1">
        <span className={cn("min-w-0 truncate text-sm", tone ?? "text-muted-foreground")}>{label}</span>
        <Icon className={cn("size-4 shrink-0", tone ?? "text-muted-foreground")} />
      </div>
      <div className="text-2xl font-semibold tabular-nums text-foreground">{value}</div>
    </div>
  )
}

function CreateInviteSheet({
  open,
  onOpenChange,
  onCreated,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onCreated: () => void
}) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [product, setProduct] = useState("")
  const [catalogo, setCatalogo] = useState<string[]>([])
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  /* La hoja esta SIEMPRE montada, asi que su estado no se limpia solo al
   * cerrarla. Sin este reinicio, al volver a abrir "Nueva invitacion" salen el
   * nombre y el email del alumno anterior y es facil reenviarle la misma
   * invitacion por descuido. */
  useEffect(() => {
    if (!open) return
    let vivo = true
    fetch("/api/catalogo/productos")
      .then((r) => (r.ok ? r.json() : { productos: [] }))
      .then((d: { productos?: { nombre: string }[] }) => {
        if (!vivo) return
        const nombres = (d.productos ?? []).map((p) => p.nombre)
        setCatalogo(nombres)
        setProduct((actual) => actual || nombres[0] || "")
      })
      .catch(() => {})
    return () => { vivo = false }
  }, [open])

  useEffect(() => {
    if (!open) return
    setFullName("")
    setEmail("")
    setProduct(catalogo[0] ?? "")
    setSaving(false)
    setError(null)
  }, [open])

  async function save() {
    setSaving(true)
    setError(null)
    try {
      const res = await fetch("/api/admin/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ full_name: fullName.trim(), email: email.trim(), products: [product] }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data?.error ?? "Error")
        return
      }
      onCreated()
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={HOJA}>
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle>Nueva invitación</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4">
          <label className="block space-y-1.5">
            <span className={ETIQUETA}>Nombre completo</span>
            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="ej. Juan Pérez"
              autoComplete="name"
              enterKeyHint="next"
            />
          </label>
          <label className="block space-y-1.5">
            <span className={ETIQUETA}>Email</span>
            <Input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              enterKeyHint="next"
              placeholder="juan@ejemplo.com"
            />
          </label>
          <label className="block space-y-1.5">
            <span className={ETIQUETA}>Formación a la que le das acceso</span>
            {/* LISTA, no texto libre. Antes se escribia a mano y venia con
                "Capital Hub" puesto por defecto, que no es ninguna formacion
                del catalogo: cualquier invitacion creada aqui daba CERO acceso
                y el alumno entraba a una pantalla vacia sin ningun aviso. */}
            <select
              value={product}
              onChange={(e) => setProduct(e.target.value)}
              className="h-11 w-full rounded-lg border border-border bg-background px-3 text-[15px] text-foreground md:h-9 md:text-sm"
            >
              <option value="" disabled>
                {catalogo.length ? "Elige una formación" : "Cargando..."}
              </option>
              {catalogo.map((nombre) => (
                <option key={nombre} value={nombre}>{nombre}</option>
              ))}
            </select>
          </label>
          {error && <div className="text-[15px] text-destructive">{error}</div>}
        </div>

        {/* Barra de accion pegada abajo DENTRO de la hoja (sticky, no fixed):
            con el teclado abierto el boton de guardar sigue alcanzable. */}
        <div className="sticky bottom-0 mt-2 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-4">
          <button
            onClick={() => onOpenChange(false)}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] font-medium text-foreground active:bg-muted md:h-9"
          >
            Cancelar
          </button>
          <button
            onClick={save}
            disabled={saving || !fullName.trim() || !email.trim()}
            className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Crear y enviar
          </button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

function BulkUploadSheet({
  open,
  onOpenChange,
  onUploaded,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
  onUploaded: () => void
}) {
  const [csvText, setCsvText] = useState("")
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; total: number; errors: Array<{ email: string; error: string }> } | null>(null)
  const [error, setError] = useState<string | null>(null)

  /* La hoja esta SIEMPRE montada y el boton "Importar" solo se pinta cuando NO
   * hay resultado. Sin este reinicio, despues de la primera importacion la hoja
   * se reabre con el resultado viejo y sin boton: no habia forma de hacer una
   * segunda importacion sin recargar la pagina. */
  useEffect(() => {
    if (!open) return
    setCsvText("")
    setSaving(false)
    setResult(null)
    setError(null)
  }, [open])

  function parseCsv(text: string) {
    const lines = text.trim().split(/\r?\n/).filter(Boolean)
    if (lines.length === 0) return []
    const header = lines[0].toLowerCase().split(",").map((c) => c.trim())
    const emailIdx = header.findIndex((c) => c.includes("email"))
    const nameIdx = header.findIndex((c) => c.includes("name") || c.includes("nombre"))
    const productIdx = header.findIndex((c) => c.includes("product") || c.includes("producto"))
    if (emailIdx < 0 || nameIdx < 0) return []
    return lines.slice(1).map((line) => {
      const cols = line.split(",").map((c) => c.trim())
      return {
        email: cols[emailIdx] ?? "",
        full_name: cols[nameIdx] ?? "",
        product: productIdx >= 0 ? cols[productIdx] : undefined,
      }
    }).filter((r) => r.email && r.full_name)
  }

  async function upload() {
    setSaving(true)
    setError(null)
    setResult(null)
    try {
      const rows = parseCsv(csvText)
      if (rows.length === 0) {
        setError("CSV vacío o sin columnas email/name. Formato: email,name,product")
        return
      }
      const res = await fetch("/api/admin/invites/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rows }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data?.error ?? "Error"); return }
      setResult(data)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={HOJA}>
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle>Bulk import CSV</SheetTitle>
        </SheetHeader>

        <div className="space-y-3 px-4">
          <p className="text-sm text-muted-foreground">
            Pega un CSV con columnas <code className="text-foreground">email,name,product</code>.
            La primera línea es el header. Ejemplo:
          </p>
          <pre className="overflow-x-auto rounded-lg border border-border bg-background/50 p-2 text-sm text-foreground">
{`email,name,product
juan@ejemplo.com,Juan Pérez,Capital Hub
ana@ejemplo.com,Ana López,Capital Hub`}
          </pre>
          <Textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows={8}
            placeholder="Pega aquí el CSV…"
            autoCapitalize="none"
            autoCorrect="off"
            spellCheck={false}
            className="resize-y"
          />

          {error && <div className="text-[15px] text-destructive">{error}</div>}
          {result && (
            <div className="space-y-1 rounded-lg border border-primary/30 bg-primary/5 p-3 text-sm">
              <p className="text-foreground">
                <strong className="text-primary tabular-nums">{result.created}</strong> creadas · <strong className="tabular-nums">{result.skipped}</strong> omitidas (ya existían) · <strong className="tabular-nums">{result.total}</strong> total
              </p>
              {result.errors.length > 0 && (
                <div className="text-destructive">
                  Errores: {result.errors.length}
                  <ul className="list-inside list-disc">
                    {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e.email}: {e.error}</li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="sticky bottom-0 mt-2 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-4">
          <button
            onClick={result ? onUploaded : () => onOpenChange(false)}
            className="h-11 flex-1 rounded-lg border border-border text-[15px] font-medium text-foreground active:bg-muted md:h-9"
          >
            {result ? "Cerrar" : "Cancelar"}
          </button>
          {!result && (
            <button
              onClick={upload}
              disabled={saving || !csvText.trim()}
              className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Importar
            </button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
