"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  Phone,
  AtSign,
  Calendar,
  DollarSign,
  Tag,
  Activity,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"

type Contact = {
  id: string
  full_name: string | null
  email: string | null
  phone: string | null
  company: string | null
  stage: string
  origin: string | null
  tags: string[] | null
  notes: string | null
  slug: string | null
  created_at: string
  updated_at: string
  products: string[] | null
  total_revenue: number | null
  total_cash_collected: number | null
  last_call_at: string | null
  instagram_username?: string | null
  manychat_subscriber_id?: string | null
}

const STAGE_LABELS: Record<string, string> = {
  lead: "Lead",
  agendado: "Agendado",
  alumno: "Alumno",
  seguimiento: "Seguimiento",
  no_show: "No show",
  perdido: "Perdido",
}

const STAGE_COLORS: Record<string, string> = {
  lead: "border-cyan-500/40 text-cyan-400 bg-cyan-500/[0.06]",
  agendado: "border-amber-500/40 text-amber-400 bg-amber-500/[0.06]",
  alumno: "border-emerald-500/40 text-emerald-400 bg-emerald-500/[0.06]",
  seguimiento: "border-violet-500/40 text-violet-400 bg-violet-500/[0.06]",
  no_show: "border-orange-500/40 text-orange-400 bg-orange-500/[0.06]",
  perdido: "border-red-500/40 text-red-400 bg-red-500/[0.06]",
}

type Tab = "datos" | "journey" | "notas" | "comunicaciones"

export function ContactDetail({ contact }: { contact: Contact }) {
  const [tab, setTab] = useState<Tab>("datos")
  const [notes, setNotes] = useState(contact.notes ?? "")
  const [savingNotes, setSavingNotes] = useState(false)

  const initials = (contact.full_name ?? "?")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((s) => s[0])
    .join("")
    .toUpperCase()

  async function saveNotes() {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/admin/contacts/${contact.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes }),
      })
      if (!res.ok) {
        console.error("save notes failed")
      }
    } finally {
      setSavingNotes(false)
    }
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <header className="shrink-0 border-b border-border bg-card/30 px-4 py-3 md:px-6">
        <Link
          href="/crm/contactos"
          className="mb-2 inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Contactos
        </Link>
        <div className="flex items-start gap-3">
          <div className="h-12 w-12 rounded-full bg-secondary border-2 border-border flex items-center justify-center text-base font-semibold text-secondary-foreground">
            {initials || "?"}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl font-semibold">
                {contact.full_name ?? "Sin nombre"}
              </h1>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-sm border px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider",
                  STAGE_COLORS[contact.stage] ?? "border-border text-muted-foreground",
                )}
              >
                {STAGE_LABELS[contact.stage] ?? contact.stage}
              </span>
            </div>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {contact.origin && <span>desde {contact.origin}</span>}
              {contact.origin && contact.created_at && <span> · </span>}
              <span>
                creado{" "}
                {new Date(contact.created_at).toLocaleDateString("es-ES", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })}
              </span>
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex items-center gap-1 border-b border-border -mb-3 overflow-x-auto">
          {(
            [
              { id: "datos", label: "Datos", icon: FileText },
              { id: "journey", label: "Journey", icon: Activity },
              { id: "notas", label: "Notas", icon: FileText },
              { id: "comunicaciones", label: "Comunicaciones", icon: Mail },
            ] as const
          ).map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                "inline-flex items-center gap-1.5 px-3 py-2 text-xs font-mono uppercase tracking-wider border-b-2 transition-colors",
                tab === t.id
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              <t.icon className="h-3 w-3" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Content */}
      <div className="flex-1 min-h-0 overflow-y-auto p-4 md:p-6">
        <div className="mx-auto max-w-4xl">
          {tab === "datos" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <DataCard label="Email" value={contact.email} icon={Mail} />
              <DataCard label="Teléfono" value={contact.phone} icon={Phone} />
              <DataCard label="Empresa" value={contact.company} icon={FileText} />
              {contact.instagram_username && (
                <DataCard
                  label="AtSign"
                  value={"@" + contact.instagram_username}
                  icon={AtSign}
                  href={`https://instagram.com/${contact.instagram_username}`}
                />
              )}
              <DataCard
                label="Productos comprados"
                value={(contact.products ?? []).join(", ") || "—"}
                icon={Tag}
              />
              <DataCard
                label="Revenue"
                value={
                  contact.total_revenue
                    ? new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      }).format(contact.total_revenue)
                    : "—"
                }
                icon={DollarSign}
              />
              <DataCard
                label="Cash collected"
                value={
                  contact.total_cash_collected
                    ? new Intl.NumberFormat("es-ES", {
                        style: "currency",
                        currency: "EUR",
                      }).format(contact.total_cash_collected)
                    : "—"
                }
                icon={CheckCircle2}
              />
              <DataCard
                label="Última llamada"
                value={
                  contact.last_call_at
                    ? new Date(contact.last_call_at).toLocaleDateString("es-ES", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })
                    : "—"
                }
                icon={Calendar}
              />

              {contact.manychat_subscriber_id && (
                <div className="md:col-span-2 rounded-md border border-border bg-card/30 p-3 flex items-center gap-3">
                  <AtSign className="h-4 w-4 text-pink-400" />
                  <div className="flex-1">
                    <div className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      ManyChat subscriber
                    </div>
                    <div className="text-xs font-mono">{contact.manychat_subscriber_id}</div>
                  </div>
                  <a
                    href={`https://manychat.com/subscriber/${contact.manychat_subscriber_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-pink-400 hover:text-pink-300"
                  >
                    Abrir chat <ExternalLink className="h-3 w-3" />
                  </a>
                </div>
              )}
            </div>
          )}

          {tab === "journey" && <JourneyTimeline contactId={contact.id} />}

          {tab === "notas" && (
            <div className="space-y-3">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={12}
                placeholder="Notas sobre este contacto…"
                className="w-full rounded-md border border-border bg-card/30 p-3 text-sm outline-none focus:border-foreground/40 resize-none"
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="inline-flex items-center gap-2 rounded-sm bg-foreground text-background px-4 py-2 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-50"
              >
                {savingNotes ? "Guardando…" : "Guardar notas"}
              </button>
            </div>
          )}

          {tab === "comunicaciones" && (
            <div className="rounded-md border border-dashed border-border p-8 text-center text-xs text-muted-foreground">
              Próximamente: emails enviados, llamadas Zoom, DMs ManyChat.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function DataCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string
  value: string | null
  icon: typeof Mail
  href?: string
}) {
  const content = (
    <div className="rounded-md border border-border bg-card/30 p-3">
      <div className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" />
        {label}
      </div>
      <div className="mt-1.5 text-sm text-foreground truncate">{value || "—"}</div>
    </div>
  )
  if (href && value) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block hover:opacity-80 transition-opacity">
        {content}
      </a>
    )
  }
  return content
}

function JourneyTimeline({ contactId }: { contactId: string }) {
  // Por ahora placeholder. En futuro se conectara a una tabla contact_events
  // que trackee cambios de stage, emails enviados, calls hechas, etc.
  return (
    <div className="rounded-md border border-dashed border-border p-6 text-xs text-muted-foreground">
      <div className="mb-2 font-mono uppercase tracking-wider text-[10px]">
        Timeline · contacto {contactId.slice(0, 8)}
      </div>
      Próximamente: eventos cronológicos (cambios de stage, emails abiertos, llamadas
      hechas, formularios rellenados).
    </div>
  )
}
