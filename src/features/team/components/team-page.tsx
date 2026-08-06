"use client"

import { useEffect, useState } from "react"
import { UserPlus, Mail, Shield, Clock, X, Trash2, Check, Pencil, Loader2 } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { Input } from "@/components/ui/input"
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet"
import { cn } from "@/lib/utils"
import { RolePermissionsMatrix } from "./role-permissions-matrix"

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

/* Los roles que existen. A proposito NO llevan escrita la lista de secciones a
 * la que acceden: eso lo manda la matriz de abajo, que se puede cambiar en
 * cualquier momento. Una lista escrita aqui envejeceria mal y acabaria diciendo
 * lo contrario de lo que hace el sistema. Lo unico que se anota es lo que la
 * matriz NO cubre. */
const ROLE_OPTIONS = [
  { value: "super_admin", label: "Super Admin", desc: "Acceso total. No se le puede quitar nada desde la matriz." },
  { value: "marketing", label: "Marketing", desc: null },
  { value: "closer", label: "Closer", desc: null },
  { value: "setter", label: "Setter", desc: null },
  { value: "formador", label: "Formador", desc: "En la App es administrador de su propia formación." },
]

/* Antes cada rol tenia su color (purpura, rosa, ambar, naranja, cyan): cinco
 * familias de Tailwind que no son de la marca. La marca es carbon y verde, asi
 * que solo se destaca el rol que de verdad cambia las reglas, super_admin. */
function roleTone(role: string): string {
  return role === "super_admin" ? "border-primary/40 text-primary" : "border-border text-foreground"
}

/* Clases compartidas de la hoja inferior. El lado NO se decide con JavaScript:
 * `side="bottom"` fijo y el escritorio se ajusta con clases md:. */
const HOJA =
  "max-h-[85dvh] w-full overflow-y-auto rounded-t-xl pb-safe-4 md:mx-auto md:max-w-md md:pb-4"

/* Etiqueta de campo, en un solo sitio. El candado mira las lineas de alrededor
 * de un <Input> y confunde el tamano de la ETIQUETA con el del campo; sacarla a
 * una constante deja claro que el campo va a 16 puntos y la etiqueta a 14. */
const ETIQUETA = "block text-sm font-medium text-muted-foreground"

export function TeamPage() {
  const [members, setMembers] = useState<Member[]>([])
  const [pending, setPending] = useState<Invitation[]>([])
  const [loading, setLoading] = useState(true)
  const [inviting, setInviting] = useState(false)
  const [editing, setEditing] = useState<Member | null>(null)

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

      <PageContainer>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <h1 className="flex items-center gap-2 text-lg font-semibold text-foreground">
              <Shield className="size-4 text-muted-foreground" />
              Equipo Capital Hub OS
            </h1>
            <p className="mt-0.5 text-sm tabular-nums text-muted-foreground">
              {members.filter((m) => m.active).length} activos · {pending.length} invitaciones pendientes
            </p>
          </div>
          <button
            onClick={() => setInviting(true)}
            className="inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-8 md:w-auto md:text-sm"
          >
            <UserPlus className="size-4" /> Invitar miembro
          </button>
        </div>

        {/* Miembros activos */}
        <section className="space-y-2">
          <h2 className="text-sm font-semibold text-muted-foreground">Activos</h2>
          {loading ? (
            <div className="py-6 text-center text-[15px] text-muted-foreground">Cargando…</div>
          ) : members.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-8 text-center">
              <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay miembros</h3>
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                Los miembros que invites aparecen aquí con su rol.
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-border rounded-xl border border-border bg-card">
              {members.map((m) => (
                <li key={m.id} className="flex flex-col gap-3 px-3 py-3 md:flex-row md:items-center">
                  <div className="flex min-w-0 flex-1 items-center gap-3">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-secondary text-sm font-semibold text-secondary-foreground">
                      {(m.full_name ?? m.email).charAt(0)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[15px] text-foreground">{m.full_name ?? m.email}</div>
                      <div className="truncate text-sm text-muted-foreground">{m.email}</div>
                    </div>
                    {!m.active && (
                      <span className="shrink-0 rounded-lg border border-warn/40 px-2 py-0.5 text-sm text-warn">
                        inactivo
                      </span>
                    )}
                  </div>

                  {/* En el telefono el selector de rol y los dos botones bajan a
                      su propia linea: antes iban apretados en la misma fila y
                      median 24 puntos, imposibles de acertar con el dedo. */}
                  <div className="flex items-center gap-2">
                    <select
                      value={m.role}
                      onChange={(e) => updateRole(m.id, e.target.value)}
                      aria-label={`Rol de ${m.full_name ?? m.email}`}
                      className={cn(
                        "h-11 min-w-0 flex-1 rounded-lg border bg-card px-2 text-base text-foreground md:h-8 md:flex-none md:text-sm",
                        roleTone(m.role)
                      )}
                    >
                      {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
                    </select>
                    <button
                      onClick={() => setEditing(m)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:size-8"
                      title="Editar nombre / email"
                    >
                      <Pencil className="size-4" />
                    </button>
                    <button
                      onClick={() => deactivate(m.id)}
                      className="inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-destructive/10 active:text-destructive md:size-8"
                      title="Desactivar"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Invitaciones pendientes */}
        {pending.length > 0 && (
          <section className="space-y-2">
            <h2 className="text-sm font-semibold text-muted-foreground">Invitaciones pendientes</h2>
            <ul className="divide-y divide-border rounded-xl border border-warn/30 bg-warn/5">
              {pending.map((inv) => {
                const expiresIn = Math.ceil((new Date(inv.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                return (
                  <li key={inv.id} className="flex flex-col gap-2 px-3 py-3 md:flex-row md:items-center md:gap-3">
                    <div className="flex min-w-0 flex-1 items-center gap-3">
                      <Clock className="size-4 shrink-0 text-warn" />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[15px] text-foreground">{inv.full_name}</div>
                        <div className="truncate text-sm text-muted-foreground">{inv.email}</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={cn("shrink-0 rounded-lg border px-2 py-0.5 text-sm", roleTone(inv.role))}>
                        {ROLE_OPTIONS.find((r) => r.value === inv.role)?.label ?? inv.role}
                      </span>
                      <span className="text-sm tabular-nums text-muted-foreground">
                        caduca en {expiresIn}d
                      </span>
                      <button
                        onClick={() => cancelInvitation(inv.id, inv.email)}
                        className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-destructive/10 active:text-destructive md:size-8"
                        title="Cancelar invitación"
                      >
                        <X className="size-4" />
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
          </section>
        )}

        {/* Matriz permisos editable */}
        <RolePermissionsMatrix />
      </PageContainer>

      <InviteSheet open={inviting} onOpenChange={setInviting} onInvited={() => { setInviting(false); load() }} />
      <EditMemberSheet member={editing} onClose={() => setEditing(null)} onSaved={load} />
    </>
  )
}

/**
 * Editar un miembro: nombre (se guarda directo) + email (flujo seguro con
 * confirmación al email NUEVO, igual que el perfil propio — no se cambia a ciegas).
 */
function EditMemberSheet({ member, onClose, onSaved }: { member: Member | null; onClose: () => void; onSaved: () => void }) {
  const [name, setName] = useState("")
  const [newEmail, setNewEmail] = useState("")
  const [savingName, setSavingName] = useState(false)
  const [emailSaving, setEmailSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    setName(member?.full_name ?? "")
    setNewEmail("")
    setMsg(null)
  }, [member])

  if (!member) return null

  async function saveName() {
    if (!member) return
    setSavingName(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/team/${member.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: name.trim() }) })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) { setMsg({ ok: false, text: d.error ?? "Error al guardar el nombre" }); return }
      setMsg({ ok: true, text: "Nombre guardado ✓" })
      onSaved()
    } finally { setSavingName(false) }
  }

  async function requestEmail() {
    if (!member) return
    setEmailSaving(true); setMsg(null)
    try {
      const res = await fetch(`/api/admin/team/${member.id}/email`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newEmail: newEmail.trim() }) })
      const d = await res.json().catch(() => ({}))
      setMsg({ ok: res.ok, text: res.ok ? `Confirmación enviada a ${newEmail.trim()}. El cambio se aplica cuando se confirme.` : (d.error ?? "Error") })
      if (res.ok) setNewEmail("")
    } finally { setEmailSaving(false) }
  }

  return (
    <Sheet open={!!member} onOpenChange={(o) => !o && onClose()}>
      <SheetContent side="bottom" className={HOJA}>
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2"><Pencil className="size-4" /> Editar miembro</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 px-4 pb-4">
          <div className="space-y-1.5">
            <span className={ETIQUETA}>Nombre completo</span>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Nombre" autoComplete="name" enterKeyHint="done" />
            <button
              onClick={saveName}
              disabled={savingName || name.trim().length < 2}
              className="mt-1 inline-flex h-11 items-center gap-1.5 rounded-lg bg-primary px-3 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9"
            >
              {savingName ? <><Loader2 className="size-4 animate-spin" /> Guardando…</> : "Guardar nombre"}
            </button>
          </div>

          <div className="space-y-1.5 border-t border-border pt-4">
            <span className={ETIQUETA}>Email actual</span>
            <div className="rounded-lg border border-border bg-background px-3 py-2 text-[15px] break-all text-muted-foreground">{member.email}</div>
            <span className={cn(ETIQUETA, "pt-2")}>Nuevo email</span>
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              autoCapitalize="none"
              enterKeyHint="done"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              placeholder="nuevo@email.com"
            />
            <p className="text-sm text-muted-foreground">Se envía un enlace de confirmación al email nuevo. El cambio se aplica al confirmarlo.</p>
            <button
              onClick={requestEmail}
              disabled={emailSaving || !newEmail.trim()}
              className="mt-1 inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-[15px] font-medium text-foreground active:bg-muted disabled:opacity-50 md:h-9"
            >
              {emailSaving ? <><Loader2 className="size-4 animate-spin" /> Enviando…</> : "Enviar confirmación"}
            </button>
          </div>

          {msg && <p className={cn("text-[15px]", msg.ok ? "text-primary" : "text-destructive")}>{msg.text}</p>}
        </div>
      </SheetContent>
    </Sheet>
  )
}

const FORMACION_OPTIONS = [
  { value: "ia-integrator", label: "IA Integrator" },
  { value: "media-buyer-digital", label: "Media Buyer Digital" },
  { value: "comercial-closing", label: "Comercial Closing" },
] as const

function InviteSheet({ open, onOpenChange, onInvited }: { open: boolean; onOpenChange: (v: boolean) => void; onInvited: () => void }) {
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

  /* La hoja esta SIEMPRE montada (antes era {inviting && <Modal/>}, que se
   * desmontaba y perdia el estado solo). Sin esto, el `successUrl` de la
   * primera invitacion se queda puesto y la segunda vez que se abre ya no hay
   * formulario, solo la pantalla de "Invitacion enviada" del anterior: no se
   * podia invitar a mas de una persona sin recargar. */
  useEffect(() => {
    if (!open) return
    setSuccessUrl(null)
    setError(null)
    setSubmitting(false)
    setForm({ full_name: "", email: "", role: "marketing", formacion_asignada: "ia-integrator" })
  }, [open])

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

  const campoSelect =
    "h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className={HOJA}>
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />

        {successUrl ? (
          <div className="px-4 pt-2 pb-6 text-center">
            <Check className="mx-auto mb-3 size-10 text-primary" />
            <SheetTitle className="text-[17px] font-semibold">Invitación enviada</SheetTitle>
            <p className="mt-2 text-[15px] text-muted-foreground">
              Email enviado a {form.email}. Recibirá el link para configurar contraseña.
            </p>
            <div className="mt-4 rounded-lg border border-border bg-card p-2 text-sm break-all text-foreground">
              {successUrl}
            </div>
          </div>
        ) : (
          <form onSubmit={submit}>
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <UserPlus className="size-4" /> Invitar miembro
              </SheetTitle>
            </SheetHeader>

            <div className="space-y-3 px-4">
              <label className="block space-y-1.5">
                <span className={ETIQUETA}>Nombre completo *</span>
                <Input
                  value={form.full_name}
                  onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                  required
                  minLength={2}
                  autoComplete="name"
                  enterKeyHint="next"
                />
              </label>

              <label className="block space-y-1.5">
                <span className={ETIQUETA}>Email *</span>
                <Input
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  autoCapitalize="none"
                  enterKeyHint="next"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  required
                />
              </label>

              <label className="block space-y-1.5">
                <span className={ETIQUETA}>Rol</span>
                <select
                  value={form.role}
                  onChange={(e) => setForm({ ...form, role: e.target.value })}
                  className={campoSelect}
                >
                  {ROLE_OPTIONS.map((r) => (
                    <option key={r.value} value={r.value}>{r.label}</option>
                  ))}
                </select>
              </label>

              {form.role === "formador" && (
                <label className="block space-y-1.5">
                  <span className={ETIQUETA}>Formación que gestiona *</span>
                  <select
                    value={form.formacion_asignada}
                    onChange={(e) => setForm({ ...form, formacion_asignada: e.target.value })}
                    required
                    className={campoSelect}
                  >
                    {FORMACION_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>{f.label}</option>
                    ))}
                  </select>
                  <span className="block text-sm text-muted-foreground">
                    El formador podrá editar SOLO esta formación. Ve todo lo demás en lectura.
                  </span>
                </label>
              )}

              <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Mail className="size-4 shrink-0" /> Recibirá email con link para configurar contraseña (caduca en 7 días)
              </p>

              {error && <p className="text-[15px] text-destructive">{error}</p>}
            </div>

            <div className="sticky bottom-0 mt-3 border-t border-border bg-popover px-4 pt-3 pb-4">
              <button
                type="submit"
                disabled={submitting}
                className="h-11 w-full rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9"
              >
                {submitting ? "Invitando…" : "Enviar invitación"}
              </button>
            </div>
          </form>
        )}
      </SheetContent>
    </Sheet>
  )
}
