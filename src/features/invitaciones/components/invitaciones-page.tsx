"use client"

import { useEffect, useState } from "react"
import {
  Mail, Plus, Trash2, RotateCw, Upload, CheckCircle2,
  Clock, X, Loader2, Search, Copy, Check,
} from "lucide-react"
import { cn } from "@/lib/utils"

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
    <div className="mx-auto max-w-7xl space-y-5 pb-24">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold flex items-center gap-2">
            <Mail className="h-4 w-4 text-muted-foreground" />
            Invitaciones App · {counts.total}
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Magic links enviados a alumnos para activar su cuenta en la App de Capital Hub.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setUploading(true)}
            className="inline-flex items-center gap-1 rounded-sm border border-border px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:bg-card"
          >
            <Upload className="h-3 w-3" /> Bulk CSV
          </button>
          <button
            onClick={() => setCreating(true)}
            className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            <Plus className="h-3 w-3" /> Nueva invitación
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-3 gap-3">
        <Kpi label="Total" value={counts.total} icon={Mail} accent="border-border" />
        <Kpi label="Pendientes" value={counts.pending} icon={Clock} accent="border-amber-500/30 text-amber-400" />
        <Kpi label="Aceptadas" value={counts.accepted} icon={CheckCircle2} accent="border-emerald-500/30 text-emerald-400" />
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por email o nombre…"
            className="w-full h-8 rounded-sm border border-border bg-background pl-8 pr-2 text-sm"
          />
        </div>
        <div className="flex border border-border rounded-sm">
          {(["all", "pending", "accepted"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "px-3 py-1 text-[10px] font-mono uppercase tracking-wider transition-colors",
                filter === f ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {f === "all" ? "Todas" : f === "pending" ? "Pendientes" : "Aceptadas"}
            </button>
          ))}
        </div>
        <div className="flex-1" />
        <span className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
          {filtered.length} resultado{filtered.length === 1 ? "" : "s"}
        </span>
      </div>

      {/* Lista */}
      {loading ? (
        <div className="flex items-center justify-center py-12 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-md border border-dashed border-border p-8 text-center">
          <Mail className="h-8 w-8 mx-auto mb-3 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">Sin invitaciones que coincidan</p>
        </div>
      ) : (
        <div className="rounded-md border border-border bg-card/30 divide-y divide-border">
          {filtered.map((inv) => {
            const isAccepted = !!inv.accepted_at
            const isExpired = !isAccepted && new Date(inv.expires_at) < new Date()
            return (
              <div key={inv.id} className="flex items-center gap-3 px-3 py-2.5 hover:bg-card/40 transition-colors">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm truncate font-medium">{inv.full_name}</span>
                    <button
                      onClick={() => copyEmail(inv)}
                      className="text-[10px] font-mono text-muted-foreground hover:text-foreground inline-flex items-center gap-1 truncate"
                    >
                      {inv.email}
                      {copiedId === inv.id ? <Check className="h-2.5 w-2.5 text-emerald-400" /> : <Copy className="h-2.5 w-2.5 opacity-0 group-hover:opacity-100" />}
                    </button>
                  </div>
                  <div className="text-[10px] font-mono text-muted-foreground/70 mt-0.5">
                    {(inv.products ?? []).join(", ") || "—"} · invitado por {inv.invited_by_name ?? "?"} · {new Date(inv.created_at).toLocaleDateString("es-ES", { day: "2-digit", month: "short", year: "numeric" })}
                  </div>
                </div>

                <span className={cn(
                  "shrink-0 text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                  isAccepted ? "border-emerald-500/40 text-emerald-400" :
                  isExpired ? "border-red-500/40 text-red-400" :
                  "border-amber-500/40 text-amber-400"
                )}>
                  {isAccepted ? "Aceptada" : isExpired ? "Expirada" : "Pendiente"}
                </span>

                {!isAccepted && (
                  <button
                    onClick={() => resend(inv)}
                    disabled={actionId === inv.id}
                    className="p-1.5 rounded-sm text-muted-foreground hover:text-foreground hover:bg-secondary disabled:opacity-50"
                    title="Reenviar magic link"
                  >
                    {actionId === inv.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RotateCw className="h-3.5 w-3.5" />}
                  </button>
                )}
                <button
                  onClick={() => deleteInvite(inv.id)}
                  disabled={actionId === inv.id}
                  className="p-1.5 rounded-sm text-muted-foreground hover:text-red-400 hover:bg-red-500/10 disabled:opacity-50"
                  title="Eliminar"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            )
          })}
        </div>
      )}

      {creating && (
        <CreateInviteModal onClose={() => setCreating(false)} onCreated={() => { setCreating(false); load() }} />
      )}
      {uploading && (
        <BulkUploadModal onClose={() => setUploading(false)} onUploaded={() => { setUploading(false); load() }} />
      )}
    </div>
  )
}

function Kpi({ label, value, icon: Icon, accent }: { label: string; value: number; icon: typeof Mail; accent: string }) {
  return (
    <div className={cn("rounded-sm border bg-card/30 p-3", accent)}>
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-3 w-3 opacity-60" />
      </div>
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
    </div>
  )
}

function CreateInviteModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [product, setProduct] = useState("Capital Hub")
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-md p-6 w-full max-w-md space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Nueva invitación</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Nombre completo</label>
          <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="ej. Juan Pérez"
            className="w-full mt-1 h-9 rounded-sm border border-border bg-background px-3 text-sm" autoFocus />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Email</label>
          <input value={email} onChange={(e) => setEmail(e.target.value)} type="email" placeholder="juan@ejemplo.com"
            className="w-full mt-1 h-9 rounded-sm border border-border bg-background px-3 text-sm" />
        </div>
        <div>
          <label className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">Producto</label>
          <input value={product} onChange={(e) => setProduct(e.target.value)} placeholder="Capital Hub"
            className="w-full mt-1 h-9 rounded-sm border border-border bg-background px-3 text-sm" />
        </div>
        {error && <div className="text-xs text-red-400">{error}</div>}
        <div className="flex justify-end gap-2 pt-2">
          <button onClick={onClose} className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border rounded-sm hover:bg-secondary">
            Cancelar
          </button>
          <button onClick={save} disabled={saving || !fullName.trim() || !email.trim()}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50">
            {saving && <Loader2 className="h-3 w-3 animate-spin" />}
            Crear y enviar
          </button>
        </div>
      </div>
    </div>
  )
}

function BulkUploadModal({ onClose, onUploaded }: { onClose: () => void; onUploaded: () => void }) {
  const [csvText, setCsvText] = useState("")
  const [saving, setSaving] = useState(false)
  const [result, setResult] = useState<{ created: number; skipped: number; total: number; errors: Array<{ email: string; error: string }> } | null>(null)
  const [error, setError] = useState<string | null>(null)

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
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-card border border-border rounded-md p-6 w-full max-w-xl space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Bulk import CSV</h2>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-4 w-4" /></button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Pega un CSV con columnas <code className="font-mono text-foreground">email,name,product</code>.
          La primera línea es el header. Ejemplo:
        </p>
        <pre className="text-[10px] font-mono bg-background/50 border border-border rounded-sm p-2 overflow-x-auto">
{`email,name,product
juan@ejemplo.com,Juan Pérez,Capital Hub
ana@ejemplo.com,Ana López,Capital Hub`}
        </pre>
        <textarea value={csvText} onChange={(e) => setCsvText(e.target.value)} rows={8}
          placeholder="Pega aquí el CSV…"
          className="w-full rounded-sm border border-border bg-background px-3 py-2 text-sm font-mono resize-y" />

        {error && <div className="text-xs text-red-400">{error}</div>}
        {result && (
          <div className="rounded-sm border border-emerald-500/30 bg-emerald-500/5 p-3 text-xs space-y-1">
            <p><strong className="text-emerald-400">{result.created}</strong> creadas · <strong>{result.skipped}</strong> omitidas (ya existían) · <strong>{result.total}</strong> total</p>
            {result.errors.length > 0 && (
              <div className="text-red-400">
                Errores: {result.errors.length}
                <ul className="list-disc list-inside text-[10px]">
                  {result.errors.slice(0, 5).map((e, i) => <li key={i}>{e.email}: {e.error}</li>)}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button onClick={result ? onUploaded : onClose}
            className="px-3 py-1.5 text-xs font-mono uppercase tracking-wider border border-border rounded-sm hover:bg-secondary">
            {result ? "Cerrar" : "Cancelar"}
          </button>
          {!result && (
            <button onClick={upload} disabled={saving || !csvText.trim()}
              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-mono uppercase tracking-wider bg-foreground text-background rounded-sm hover:opacity-90 disabled:opacity-50">
              {saving && <Loader2 className="h-3 w-3 animate-spin" />}
              Importar
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
