"use client"

import { useState } from "react"
import { User, Mail, Lock, Bell } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { PushSettings } from "@/features/notifications/components/PushSettings"
import { cn } from "@/lib/utils"

const inputCls =
  "w-full rounded-sm border border-border bg-card px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus:border-foreground/40 focus:outline-none"

export function ProfilePage({ email, fullName, role, userId }: { email: string; fullName: string; role: string | null; userId: string }) {
  const roleLabel = role === "super_admin" || role === "admin" ? "Admin" : role ?? "Miembro"

  // --- Nombre ---
  const [name, setName] = useState(fullName)
  const [nameSaving, setNameSaving] = useState(false)
  const [nameMsg, setNameMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function saveName() {
    setNameSaving(true); setNameMsg(null)
    try {
      const res = await fetch("/api/me", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ full_name: name.trim() }) })
      const d = await res.json().catch(() => ({}))
      setNameMsg({ ok: res.ok, text: res.ok ? "Nombre guardado ✓" : (d.error ?? "Error") })
    } finally { setNameSaving(false) }
  }

  // --- Email ---
  const [newEmail, setNewEmail] = useState("")
  const [emailSaving, setEmailSaving] = useState(false)
  const [emailMsg, setEmailMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function requestEmail() {
    setEmailSaving(true); setEmailMsg(null)
    try {
      const res = await fetch("/api/auth/change-email/request", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ newEmail: newEmail.trim() }) })
      const d = await res.json().catch(() => ({}))
      setEmailMsg({ ok: res.ok, text: res.ok ? `Te enviamos un correo de confirmación a ${newEmail.trim()}. Ábrelo y confírmalo para activar el cambio.` : (d.error ?? "Error") })
      if (res.ok) setNewEmail("")
    } finally { setEmailSaving(false) }
  }

  // --- Contraseña ---
  const [pw, setPw] = useState("")
  const [pw2, setPw2] = useState("")
  const [pwSaving, setPwSaving] = useState(false)
  const [pwMsg, setPwMsg] = useState<{ ok: boolean; text: string } | null>(null)

  async function savePassword() {
    setPwMsg(null)
    if (pw.length < 8) { setPwMsg({ ok: false, text: "Mínimo 8 caracteres" }); return }
    if (pw !== pw2) { setPwMsg({ ok: false, text: "Las contraseñas no coinciden" }); return }
    setPwSaving(true)
    try {
      const res = await fetch("/api/me/password", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password: pw }) })
      const d = await res.json().catch(() => ({}))
      setPwMsg({ ok: res.ok, text: res.ok ? "Contraseña actualizada ✓" : (d.error ?? "Error") })
      if (res.ok) { setPw(""); setPw2("") }
    } finally { setPwSaving(false) }
  }

  return (
    <PageContainer>
      <div>
        <h1 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-4 w-4 text-muted-foreground" /> Mi perfil
        </h1>
        <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mt-0.5">
          {email} · {roleLabel}
        </p>
      </div>

      {/* Nombre */}
      <Section icon={User} title="Nombre">
        <Field label="Nombre completo">
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tu nombre" className={inputCls} />
        </Field>
        <Row>
          <SaveBtn onClick={saveName} disabled={nameSaving || name.trim().length < 2 || name.trim() === fullName}>
            {nameSaving ? "Guardando…" : "Guardar nombre"}
          </SaveBtn>
          {nameMsg && <Msg ok={nameMsg.ok}>{nameMsg.text}</Msg>}
        </Row>
      </Section>

      {/* Email */}
      <Section icon={Mail} title="Email">
        <Field label="Email actual">
          <div className="rounded-sm border border-border bg-background px-3 py-2 text-sm text-muted-foreground">{email}</div>
        </Field>
        <Field label="Nuevo email">
          <input type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nuevo@email.com" className={inputCls} />
        </Field>
        <p className="text-[10px] text-muted-foreground">
          Por seguridad, enviamos un enlace de confirmación al email nuevo. El cambio se aplica solo al confirmarlo.
        </p>
        <Row>
          <SaveBtn onClick={requestEmail} disabled={emailSaving || !newEmail.trim()}>
            {emailSaving ? "Enviando…" : "Enviar confirmación"}
          </SaveBtn>
          {emailMsg && <Msg ok={emailMsg.ok}>{emailMsg.text}</Msg>}
        </Row>
      </Section>

      {/* Notificaciones push */}
      <Section icon={Bell} title="Notificaciones">
        <PushSettings userId={userId} />
      </Section>

      {/* Contraseña */}
      <Section icon={Lock} title="Contraseña">
        <Field label="Nueva contraseña">
          <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} placeholder="Mínimo 8 caracteres" className={inputCls} />
        </Field>
        <Field label="Repite la contraseña">
          <input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} placeholder="Repite la contraseña" className={inputCls} />
        </Field>
        <Row>
          <SaveBtn onClick={savePassword} disabled={pwSaving || !pw || !pw2}>
            {pwSaving ? "Guardando…" : "Cambiar contraseña"}
          </SaveBtn>
          {pwMsg && <Msg ok={pwMsg.ok}>{pwMsg.text}</Msg>}
        </Row>
      </Section>
    </PageContainer>
  )
}

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-md border border-border bg-card/40 p-4 space-y-3 max-w-xl">
      <h2 className="flex items-center gap-2 text-xs font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 pt-1">{children}</div>
}

function SaveBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30 disabled:cursor-not-allowed"
    >
      {children}
    </button>
  )
}

function Msg({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={cn("text-xs", ok ? "text-green-400" : "text-red-400")}>{children}</span>
}
