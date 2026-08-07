"use client"

import { useState } from "react"
import Link from "next/link"
import {
  ArrowLeft,
  Mail,
  Phone,
  AtSign,
  Calendar,
  Euro,
  Tag,
  Activity,
  FileText,
  CheckCircle2,
  ExternalLink,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { clasesDeStage } from "./stage-chip"

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

  const pestanas = [
    { id: "datos", label: "Datos", icon: FileText },
    { id: "journey", label: "Journey", icon: Activity },
    { id: "notas", label: "Notas", icon: FileText },
    { id: "comunicaciones", label: "Comunicaciones", icon: Mail },
  ] as const

  return (
    <div className="flex h-full flex-col">
      {/* Cabecera */}
      <header className="shrink-0 border-b border-border bg-card px-4 py-3 md:px-6">
        {/* Siempre hay salida: boton de volver visible, con texto, arriba a la izquierda */}
        <Link
          href="/crm/contactos"
          className="mb-2 inline-flex h-11 items-center gap-1.5 text-[15px] text-muted-foreground md:h-8 md:text-sm md:hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> Contactos
        </Link>
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-border bg-secondary text-base font-semibold text-secondary-foreground">
            {initials || "?"}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="min-w-0 text-xl font-semibold text-foreground">
                {contact.full_name ?? "Sin nombre"}
              </h1>
              <span
                className={cn(
                  "inline-flex shrink-0 items-center gap-1 rounded-sm border px-2 py-0.5 text-sm",
                  clasesDeStage(contact.stage)
                )}
              >
                {STAGE_LABELS[contact.stage] ?? contact.stage}
              </span>
            </div>
            <p className="mt-0.5 text-sm text-muted-foreground">
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

        {/* Pestañas: tira deslizable de 44 puntos, sale de los margenes para que
            se entienda que hay mas a la derecha */}
        <div className="-mx-4 -mb-3 mt-4 flex snap-x gap-1 overflow-x-auto border-b border-border px-4 md:-mx-6 md:px-6">
          {pestanas.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={cn(
                // Sin `-mb-px`: al declarar overflow-x el navegador calcula overflow-y
                // como auto, y ese margen negativo dejaba la tira con 1 punto de
                // desplazamiento vertical.
                "inline-flex h-11 shrink-0 snap-start items-center gap-1.5 border-b-2 px-3 text-[15px] whitespace-nowrap transition-colors md:h-10 md:text-sm",
                tab === t.id
                  ? "border-primary font-semibold text-foreground"
                  : "border-transparent text-muted-foreground md:hover:text-foreground"
              )}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>
      </header>

      {/* Contenido */}
      <div className="no-overscroll min-h-0 flex-1 overflow-y-auto px-4 py-4 pb-[calc(3.5rem+var(--sab)+1rem)] md:px-6 md:py-6 md:pb-6">
        <div className="mx-auto max-w-4xl">
          {tab === "datos" && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              <DataCard label="Email" value={contact.email} icon={Mail} />
              <DataCard label="Teléfono" value={contact.phone} icon={Phone} />
              <DataCard label="Empresa" value={contact.company} icon={FileText} />
              {contact.instagram_username && (
                <DataCard
                  label="Instagram"
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
                icon={Euro}
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
                <div className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-3 md:col-span-2">
                  <AtSign className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-muted-foreground">
                      ManyChat subscriber
                    </div>
                    <div className="break-all text-[15px] text-foreground tabular-nums md:text-sm">
                      {contact.manychat_subscriber_id}
                    </div>
                  </div>
                  <a
                    href={`https://manychat.com/subscriber/${contact.manychat_subscriber_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex h-11 shrink-0 items-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground md:h-8 md:text-sm"
                  >
                    Abrir chat <ExternalLink className="h-4 w-4" />
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
                className="w-full resize-none rounded-lg border border-border bg-card p-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
              />
              <button
                onClick={saveNotes}
                disabled={savingNotes}
                className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-50 md:h-9 md:w-auto md:text-sm"
              >
                {savingNotes ? "Guardando…" : "Guardar notas"}
              </button>
            </div>
          )}

          {tab === "comunicaciones" && (
            <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border px-6 py-10 text-center">
              <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay comunicaciones</h3>
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                Próximamente: emails enviados, llamadas Zoom, DMs ManyChat.
              </p>
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
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
        <Icon className="h-4 w-4" />
        {label}
      </div>
      <div className="mt-1.5 truncate text-[15px] text-foreground md:text-sm">{value || "—"}</div>
    </div>
  )
  if (href && value) {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className="block transition-opacity md:hover:opacity-80">
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
    <div className="rounded-xl border border-dashed border-border p-6">
      <div className="mb-2 text-sm font-semibold text-muted-foreground">
        Timeline · contacto <span className="tabular-nums">{contactId.slice(0, 8)}</span>
      </div>
      <p className="text-[15px] text-muted-foreground md:text-sm">
        Próximamente: eventos cronológicos (cambios de stage, emails abiertos, llamadas
        hechas, formularios rellenados).
      </p>
    </div>
  )
}
