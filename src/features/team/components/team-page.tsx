"use client"

import { useEffect, useState } from "react"
import { UserPlus, Mail, Shield, Clock, X, Trash2, Check } from "lucide-react"
import { ShellHeader } from "@/features/shell/components/shell-header"
import { PageContainer } from "@/components/ui/page-container"
import { cn } from "@/lib/utils"

type Member = {
  id: string
  email: string
  full_name: string | null
  role: string
  active: boolean
  created_at: string
}

type Invitation = {
  id: string
  email: string
  full_name: string
  role: string
  invited_by_name: string | null
  expires_at: string
  created_at: string
}

// Permisos por rol según SOP 41 (sistema de roles y permisos del OS).
// Fuente de verdad: src/lib/auth/role-access.ts → ROLE_ROUTES.
const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin", desc: "Acceso total a todo el OS + Equipo + Knowledge + 'Ver como rol'" },
  { value: "marketing", label: "Marketing", desc: "Dashboard · Operaciones · CRM · Webs" },
  { value: "closer", label: "Closer", desc: "Dashboard · Operaciones · CRM" },
  { value: "setter", label: "Setter", desc: "Dashboard · Operaciones · CRM" },
  { value: "formador", label: "Formador", desc: "Dashboard · Operaciones · CRM · En la App es ADMIN para editar su formación" },
]

const ROLE_COLORS: Record<string, string> = {
  super_admin: "border-purple-500/40 text-purple-400",
  marketing: "border-pink-500/40 text-pink-400",
  closer: "border-amber-500/40 text-amber-400",
  setter: "border-orange-500/40 text-orange-400",
  formador: "border-cyan-500/40 text-cyan-400",
}

export function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    try {
      const data = await fetch("/api/admin/team").then((r) => r.json())
      setMembers(data.members ?? [])
      setPending(data.pendingInvitations ?? [])
    } finally {
      setLoading(false)
    }
  }

  async function updateRole(id: string, role: string) {
    await fetch(`/api/admin/team/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    })
    load()
  }

  async function cancelInvitation(id: string, email: string) {
    if (!confirm(`¿Cancelar invitación a ${email}? Se borrará y el email quedará libre para reinvitar.`)) return
    await fetch(`/api/admin/team/invitations/${id}`, { method: "DELETE" })
    load()
  }

  async function deactivate(id: string) {
    if (!confirm("¿Desactivar este miembro? No podrá entrar al OS.")) return
    await fetch(`/api/admin/team/${id}`, { method: "DELETE" })
    load()
  }

  return (
    <>
      <ShellHeader title="Equipo" />

      <PageContainer>
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4 text-muted-foreground" />
              Equipo Capital Hub OS
            </h1>
            <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
              {members.filter((m) => m.active).length} activos · {pending.length} invitaciones pendientes
            </p>
          </div>
          <button
            onClick={() => setInviting(true)}
            className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90"
          >
            <UserPlus className="h-3 w-3" /> Invitar miembro
          </button>
        </div>

        {/* Miembros activos */}
        <section className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Activos</h2>
          {loading ? (
            <div className="text-sm text-muted-foreground py-6 text-center">Cargando…</div>
          ) : (
            <div className="rounded-md border border-border/40 divide-y divide-border/40">
              {members.map((m) => {
                const roleOpt = ROLE_OPTIONS.find((r) => r.value === m.role)
                return (
                  <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="h-7 w-7 rounded-full bg-secondary/40 flex items-center justify-center text-[10px] font-mono uppercase shrink-0">
                        {(m.full_name ?? m.email).charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{m.full_name ?? m.email}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">{m.email}</div>
                      </div>
                    </div>
                    {!m.active && (
                      <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border border-orange-500/40 text-orange-400">
                        inactivo
                      </span>
                    )}
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value)}
                      className={cn(
                        "text-[10px] font-mono uppercase tracking-wider rounded-sm border bg-background px-2 py-1",
                        ROLE_COLORS[m.role] ?? "border-border/40"
                      )}
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button onClick={() => deactivate(m.id)} className="text-muted-foreground hover:text-red-400">
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          )}
        </section>

        {/* Invitaciones pendientes */}
        {pending.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Invitaciones pendientes</h2>
            <div className="rounded-md border border-amber-500/30 bg-amber-500/[0.04] divide-y divide-border/40">
              {pending.map((inv) => {
                const expiresIn = Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <div key={inv.id} className="flex items-center justify-between gap-3 px-3 py-2.5">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <Clock className="h-4 w-4 text-amber-400 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="text-sm truncate">{inv.full_name}</div>
                        <div className="text-[10px] font-mono text-muted-foreground truncate">{inv.email}</div>
                      </div>
                    </div>
                    <span className={cn(
                      "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border",
                      ROLE_COLORS[inv.role] ?? "border-border/40"
                    )}>
                      {ROLE_OPTIONS.find((r) => r.value === inv.role)?.label ?? inv.role}
                    </span>
                    <span className="text-[10px] font-mono text-muted-foreground">
                      caduca en {expiresIn}d
                    </span>
                    <button
                      onClick={() => cancelInvitation(inv.id, inv.email)}
                      className="text-muted-foreground hover:text-red-400 transition-colors"
                      title="Cancelar invitación"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )
              })}
            </div>
          </section>
        )}

        {/* Roles legend */}
        <section className="space-y-2">
          <h2 className="text-xs font-mono uppercase tracking-wider text-muted-foreground">Roles</h2>
          <div className="rounded-md border border-border/40 p-3 space-y-1.5">
            {ROLE_OPTIONS.map((r) => (
              <div key={r.value} className="flex items-center gap-3 text-xs">
                <span className={cn(
                  "text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-sm border shrink-0 w-24",
                  ROLE_COLORS[r.value] ?? "border-border/40"
                )}>
                  {r.label}
                </span>
                <span className="text-muted-foreground">{r.desc}</span>
              </div>
            ))}
          </div>
        </section>
      </PageContainer>

      {inviting && <InviteModal onClose={() => setInviting(false)} onInvited={() => { setInviting(false); load() }} />}
    </>
  )
}

const FORMACION_OPTIONS = [
  { value: "ia-integrator", label: "IA Integrator" },
  { value: "media-buyer-digital", label: "Media Buyer Digital" },
  { value: "comercial-closing", label: "Comercial Closing" },
] as const

function InviteModal({ onClose, onInvited }: { onClose: () => void; onInvited: () => void }) {
  // Default 'marketing' porque es el rol más común para invitaciones nuevas (el equipo
  // operativo). super_admin se selecciona manualmente para admins reales.
  const [form, setForm] = useState<{ full_name: string; email: string; role: string; formacion_asignada: string }>({
    full_name: "",
    email: "",
    role: "marketing",
    formacion_asignada: "ia-integrator",  // se ignora si role !== formador
  })
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successUrl, setSuccessUrl] = useState<string | null>(null)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setSubmitting(true)
    try {
      // Solo enviar formacion_asignada si rol = formador (el endpoint la ignora si no)
      const payload: Record<string, string | null> = {
        full_name: form.full_name,
        email: form.email,
        role: form.role,
      }
      if (form.role === "formador") {
        payload.formacion_asignada = form.formacion_asignada
      }
      const res = await fetch("/api/admin/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al invitar")
        return
      }
      setSuccessUrl(data.accept_url)
      setTimeout(() => { onInvited() }, 2500)
    } finally {
      setSubmitting(false)
    }
  }

  if (successUrl) {
    return (
      <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4">
        <div className="w-full max-w-md rounded-md border border-green-500/40 bg-background p-5 text-center">
          <Check className="h-10 w-10 mx-auto text-green-400 mb-3" />
          <h2 className="text-base font-semibold">Invitación enviada</h2>
          <p className="text-xs text-muted-foreground mt-2">
            Email enviado a {form.email}. Recibirá el link para configurar contraseña.
          </p>
          <div className="mt-4 rounded-sm bg-card/30 p-2 text-[10px] font-mono break-all">
            {successUrl}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-[2px] flex items-center justify-center p-4" onClick={onClose}>
      <form onClick={(e) => e.stopPropagation()} onSubmit={submit} className="w-full max-w-md rounded-md border border-border bg-background p-5 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-semibold flex items-center gap-2">
            <UserPlus className="h-4 w-4" /> Invitar miembro
          </h2>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>

        <label className="block">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Nombre completo *</span>
          <input
            value={form.full_name}
            onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            required
            minLength={2}
            className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Email *</span>
          <input
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            required
            className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm"
          />
        </label>

        <label className="block">
          <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Rol</span>
          <select
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
            className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm"
          >
            {ROLE_OPTIONS.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
        </label>

        {form.role === "formador" && (
          <label className="block">
            <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Formación que gestiona *</span>
            <select
              value={form.formacion_asignada}
              onChange={(e) => setForm({ ...form, formacion_asignada: e.target.value })}
              required
              className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm"
            >
              {FORMACION_OPTIONS.map((f) => (
                <option key={f.value} value={f.value}>{f.label}</option>
              ))}
            </select>
            <span className="block text-[10px] text-muted-foreground mt-1">
              El formador podrá editar SOLO esta formación. Ve todo lo demás en lectura.
            </span>
          </label>
        )}

        <p className="text-[10px] font-mono text-muted-foreground flex items-center gap-1">
          <Mail className="h-3 w-3" /> Recibirá email con link para configurar contraseña (caduca en 7 días)
        </p>

        {error && <p className="text-xs text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-sm bg-foreground text-background py-2 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30"
        >
          {submitting ? "Invitando…" : "Enviar invitación"}
        </button>
      </form>
    </div>
  )
}
