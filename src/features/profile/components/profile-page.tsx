"use client"

import { useState } from "react"
import { User, Mail, Lock, Bell } from "lucide-react"
import { PageContainer } from "@/components/ui/page-container"
import { Input } from "@/components/ui/input"
import { PushSettings } from "@/features/notifications/components/PushSettings"
import { NotificationPrefs } from "@/features/notifications/components/NotificationPrefs"
import { cn } from "@/lib/utils"

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
      <div className="min-w-0">
        <p className="mt-0.5 truncate text-sm text-muted-foreground">
          {email} · {roleLabel}
        </p>
      </div>

      {/* Nombre */}
      <Section icon={User} title="Nombre">
        <Field label="Nombre completo">
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Tu nombre"
            autoComplete="name"
            enterKeyHint="done"
          />
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
          <div className="rounded-lg border border-border bg-background px-3 py-2 text-[15px] break-all text-muted-foreground">{email}</div>
        </Field>
        <Field label="Nuevo email">
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
        </Field>
        <p className="text-sm text-muted-foreground">
          Por seguridad, enviamos un enlace de confirmación al email nuevo. El cambio se aplica solo al confirmarlo.
        </p>
        <Row>
          <SaveBtn onClick={requestEmail} disabled={emailSaving || !newEmail.trim()}>
            {emailSaving ? "Enviando…" : "Enviar confirmación"}
          </SaveBtn>
          {emailMsg && <Msg ok={emailMsg.ok}>{emailMsg.text}</Msg>}
        </Row>
      </Section>

      {/* Notificaciones: push del dispositivo + qué tipos de aviso llegan */}
      <Section icon={Bell} title="Notificaciones">
        <PushSettings userId={userId} />
        <div className="border-t border-border pt-3">
          <NotificationPrefs />
        </div>
      </Section>

      {/* Contraseña */}
      <Section icon={Lock} title="Contraseña">
        <Field label="Nueva contraseña">
          <Input
            type="password"
            value={pw}
            onChange={(e) => setPw(e.target.value)}
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            enterKeyHint="next"
          />
        </Field>
        <Field label="Repite la contraseña">
          <Input
            type="password"
            value={pw2}
            onChange={(e) => setPw2(e.target.value)}
            placeholder="Repite la contraseña"
            autoComplete="new-password"
            enterKeyHint="done"
          />
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
    <section className="max-w-xl space-y-3 rounded-xl border border-border bg-card p-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="size-4" /> {title}
      </h2>
      {children}
    </section>
  )
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block space-y-1.5">
      <span className="block text-sm font-medium text-muted-foreground">{label}</span>
      {children}
    </label>
  )
}

function Row({ children }: { children: React.ReactNode }) {
  return <div className="flex flex-wrap items-center gap-3 pt-1">{children}</div>
}

/* La accion principal es VERDE con tinta oscura encima. El boton blanco con
 * texto oscuro (bg-foreground text-background) era el acento del brandkit
 * anterior. Y 44 puntos de alto en telefono, que es lo que acierta un dedo. */
function SaveBtn({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: React.ReactNode }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="h-11 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:cursor-not-allowed disabled:opacity-50 md:h-9 md:text-sm"
    >
      {children}
    </button>
  )
}

function Msg({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return <span className={cn("text-sm", ok ? "text-primary" : "text-destructive")}>{children}</span>
}
