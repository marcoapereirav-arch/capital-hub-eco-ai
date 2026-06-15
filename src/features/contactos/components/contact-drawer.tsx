"use client"

import { useEffect, useState } from "react"
import { X, Mail, Phone, Calendar, Euro, Tag, MessageSquare, Save, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { ContactTagsPanel } from "@/features/tags/components/contact-tags-panel"

type ContactDetail = {
  id: string
  full_name: string
  email: string
  phone: string | null
  instagram_username: string | null
  manychat_subscriber_id: string | null
  company: string | null
  stage: string | null
  products: string[]
  total_revenue: number
  total_cash_collected: number
  source: string | null
  tags: string[] | null
  notes: string | null
  owner_assignee: string | null
  last_call_at: string | null
  created_at: string
  updated_at: string
}

type JourneyEvent = {
  id: string
  type: string
  title: string
  description: string | null
  data: Record<string, unknown> | null
  created_at: string
}

type Booking = {
  id: string
  start_at: string
  end_at: string
  status: string
  meeting_url: string | null
  public_token: string
}

type Stage = { value: string; label: string }

const PRODUCT_OPTIONS = ["IA Integrator", "Media Buyer Digital", "Comercial Closing"]

export function ContactDrawer({
  contactId,
  onClose,
  onUpdate,
  stages,
}: {
  contactId: string
  onClose: () => void
  onUpdate: () => void
  stages: Stage[]
}) {
  const [tab, setTab] = useState<"datos" | "productos" | "journey" | "notas">("datos")
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [events, setEvents] = useState<JourneyEvent[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<ContactDetail>>({})

  useEffect(() => {
    setLoading(true)
    fetch(`/api/admin/contacts/${contactId}`)
      .then((r) => r.json())
      .then((d) => {
        setContact(d.contact)
        setEvents(d.events ?? [])
        setBookings(d.bookings ?? [])
        setDraft({})
      })
      .finally(() => setLoading(false))
  }, [contactId])

  async function save(patch: Partial<ContactDetail>) {
    setSaving(true)
    try {
      await fetch(`/api/admin/contacts/${contactId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch),
      })
      const fresh = await fetch(`/api/admin/contacts/${contactId}`).then((r) => r.json())
      setContact(fresh.contact)
      setEvents(fresh.events ?? [])
      setDraft({})
      onUpdate()
    } finally {
      setSaving(false)
    }
  }

  async function addNote(note: string) {
    if (!note.trim()) return
    await fetch(`/api/admin/contacts/${contactId}/journey`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "note", title: "Nota", description: note.trim() }),
    })
    const fresh = await fetch(`/api/admin/contacts/${contactId}`).then((r) => r.json())
    setEvents(fresh.events ?? [])
  }

  async function deleteContact() {
    if (!confirm("¿Eliminar este contacto? No se puede deshacer.")) return
    await fetch(`/api/admin/contacts/${contactId}`, { method: "DELETE" })
    onUpdate()
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      <button onClick={onClose} className="flex-1 bg-black/40 backdrop-blur-[2px]" aria-label="Cerrar" />
      <div className="w-full max-w-2xl bg-background border-l border-border overflow-y-auto">
        {loading || !contact ? (
          <div className="p-6 text-sm text-muted-foreground">Cargando ficha…</div>
        ) : (
          <>
            {/* Header */}
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-secondary/40 flex items-center justify-center text-sm font-mono uppercase shrink-0">
                {contact.full_name.charAt(0)}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-base font-semibold truncate">{contact.full_name}</h2>
                <div className="text-[10px] font-mono text-muted-foreground truncate">{contact.email}</div>
              </div>
              <button onClick={onClose} className="text-muted-foreground hover:text-foreground">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Quick actions header */}
            <div className="px-4 py-3 border-b border-border flex items-center gap-2 flex-wrap">
              <a href={`mailto:${contact.email}`} className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider border border-border/40 px-2 py-1 rounded-sm hover:bg-card">
                <Mail className="h-3 w-3" /> Email
              </a>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className="inline-flex items-center gap-1 text-[10px] font-mono uppercase tracking-wider border border-border/40 px-2 py-1 rounded-sm hover:bg-card">
                  <Phone className="h-3 w-3" /> Llamar
                </a>
              )}
              <select
                value={contact.stage ?? "new"}
                onChange={(e) => save({ stage: e.target.value })}
                disabled={saving}
                className="text-[10px] font-mono uppercase tracking-wider rounded-sm border border-border/40 bg-background px-2 py-1"
              >
                {stages.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <div className="flex-1" />
              <button onClick={deleteContact} className="text-muted-foreground hover:text-red-400">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Tags */}
            <ContactTagsPanel contactId={contact.id} />

            {/* Tabs */}
            <div className="flex items-center gap-1 border-b border-border px-4">
              {([
                ["datos", "Datos"],
                ["productos", "Productos + ventas"],
                ["journey", `Journey (${events.length + bookings.length})`],
                ["notas", "Notas"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className={cn(
                    "px-3 py-2 text-xs transition-colors border-b-2 -mb-px",
                    tab === k ? "border-foreground text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* DATOS TAB */}
            {tab === "datos" && (
              <div className="p-4 space-y-3">
                <DataField label="Nombre completo" value={draft.full_name ?? contact.full_name} onChange={(v) => setDraft({ ...draft, full_name: v })} />
                <DataField label="Email" value={draft.email ?? contact.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" />
                <DataField label="Teléfono" value={draft.phone ?? contact.phone ?? ""} onChange={(v) => setDraft({ ...draft, phone: v })} type="tel" />
                <DataField label="Instagram (@usuario)" value={draft.instagram_username ?? contact.instagram_username ?? ""} onChange={(v) => setDraft({ ...draft, instagram_username: v.replace(/^@/, "") })} placeholder="ej. juan_lopez (sin @)" />
                <DataField label="Empresa" value={draft.company ?? contact.company ?? ""} onChange={(v) => setDraft({ ...draft, company: v })} />
                <DataField label="Origen" value={draft.source ?? contact.source ?? ""} onChange={(v) => setDraft({ ...draft, source: v })} placeholder="organic, ads, referral, manychat…" />
                <DataField label="Asignado a" value={draft.owner_assignee ?? contact.owner_assignee ?? ""} onChange={(v) => setDraft({ ...draft, owner_assignee: v })} placeholder="adrian, nagai, marco…" />

                {/* ManyChat subscriber ID (solo lectura, lo setea el webhook) */}
                {contact.manychat_subscriber_id && (
                  <div className="text-[10px] font-mono text-muted-foreground border-t border-border/40 pt-3">
                    ManyChat subscriber ID: <code className="text-foreground">{contact.manychat_subscriber_id}</code>
                  </div>
                )}

                {Object.keys(draft).length > 0 && (
                  <div className="flex items-center gap-2 pt-3">
                    <button
                      onClick={() => save(draft)}
                      disabled={saving}
                      className="inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1.5 text-xs font-mono uppercase tracking-wider hover:opacity-90 disabled:opacity-30"
                    >
                      <Save className="h-3 w-3" /> Guardar cambios
                    </button>
                    <button onClick={() => setDraft({})} className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                      Descartar
                    </button>
                  </div>
                )}

                <div className="pt-4 border-t border-border/40 text-[10px] font-mono uppercase tracking-wider text-muted-foreground">
                  <div>Creado: {new Date(contact.created_at).toLocaleString("es-ES")}</div>
                  <div>Actualizado: {new Date(contact.updated_at).toLocaleString("es-ES")}</div>
                </div>
              </div>
            )}

            {/* PRODUCTOS TAB */}
            {tab === "productos" && (
              <div className="p-4 space-y-4">
                <section>
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-2">Productos comprados</h3>
                  <div className="flex flex-wrap gap-2">
                    {PRODUCT_OPTIONS.map((p) => {
                      const has = contact.products.includes(p)
                      return (
                        <button
                          key={p}
                          onClick={() => {
                            const next = has ? contact.products.filter((x) => x !== p) : [...contact.products, p]
                            save({ products: next })
                          }}
                          className={cn(
                            "rounded-sm border px-2.5 py-1 text-xs transition-all",
                            has ? "border-green-500/40 bg-green-500/10 text-green-400" : "border-border/40 text-muted-foreground hover:border-border"
                          )}
                        >
                          {has ? "✓ " : "+ "}{p}
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="space-y-2">
                  <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Cifras</h3>
                  <NumberField label="Facturación total (€)" value={contact.total_revenue} onSave={(v) => save({ total_revenue: v })} />
                  <NumberField label="Cash collected total (€)" value={contact.total_cash_collected} onSave={(v) => save({ total_cash_collected: v })} />
                </section>
              </div>
            )}

            {/* JOURNEY TAB */}
            {tab === "journey" && (
              <div className="p-4 space-y-3">
                <h3 className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground">Timeline</h3>
                {bookings.length === 0 && events.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">Sin eventos todavía.</p>
                ) : (
                  <ul className="space-y-2">
                    {bookings.map((b) => (
                      <li key={`b-${b.id}`} className="flex items-start gap-2 rounded-sm border border-border/40 px-3 py-2">
                        <Calendar className="h-3.5 w-3.5 text-cyan-400 mt-0.5 shrink-0" />
                        <div className="flex-1 text-sm">
                          <div>Llamada {b.status === "cancelled" ? "(cancelada)" : ""}</div>
                          <div className="text-[10px] font-mono text-muted-foreground">
                            {new Date(b.start_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </div>
                        </div>
                      </li>
                    ))}
                    {events.map((e) => (
                      <li key={e.id} className="flex items-start gap-2 rounded-sm border border-border/40 px-3 py-2">
                        <span className="h-2 w-2 rounded-full bg-muted-foreground/40 mt-1.5 shrink-0" />
                        <div className="flex-1 text-sm">
                          <div>{e.title}</div>
                          {e.description && <div className="text-xs text-muted-foreground whitespace-pre-wrap mt-0.5">{e.description}</div>}
                          <div className="text-[10px] font-mono text-muted-foreground mt-1">
                            {new Date(e.created_at).toLocaleString("es-ES")}
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {/* NOTAS TAB */}
            {tab === "notas" && (
              <NotesTab notes={contact.notes ?? ""} onSave={(v) => save({ notes: v })} onAdd={addNote} />
            )}
          </>
        )}
      </div>
    </div>
  )
}

function DataField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
}) {
  return (
    <div>
      <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm font-mono"
      />
    </div>
  )
}

function NumberField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => { setDraft(String(value)) }, [value])
  const changed = parseFloat(draft || "0") !== value
  return (
    <div className="flex items-center gap-2">
      <label className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground w-40">{label}</label>
      <input
        type="number"
        step="0.01"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        className="flex-1 rounded-sm border border-border/40 bg-background px-2 py-1 text-sm font-mono"
      />
      {changed && (
        <button
          onClick={() => onSave(parseFloat(draft || "0"))}
          className="rounded-sm bg-foreground text-background px-2 py-1 text-[10px] font-mono uppercase tracking-wider"
        >
          Guardar
        </button>
      )}
    </div>
  )
}

function NotesTab({ notes, onSave, onAdd }: { notes: string; onSave: (v: string) => void; onAdd: (v: string) => void }) {
  const [main, setMain] = useState(notes)
  const [quick, setQuick] = useState("")
  useEffect(() => { setMain(notes) }, [notes])
  return (
    <div className="p-4 space-y-4">
      <section>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Notas generales</label>
        <textarea
          value={main}
          onChange={(e) => setMain(e.target.value)}
          rows={6}
          className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm font-mono resize-none"
        />
        {main !== notes && (
          <button
            onClick={() => onSave(main)}
            className="mt-2 inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1 text-[10px] font-mono uppercase tracking-wider"
          >
            <Save className="h-3 w-3" /> Guardar nota general
          </button>
        )}
      </section>

      <section>
        <label className="block text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1">Añadir nota al journey</label>
        <textarea
          value={quick}
          onChange={(e) => setQuick(e.target.value)}
          placeholder="Ej: Le interesa el plan anual pero quiere pensarlo. Llamar viernes 14h."
          rows={3}
          className="w-full rounded-sm border border-border/40 bg-background px-2 py-1.5 text-sm resize-none"
        />
        <button
          onClick={() => { onAdd(quick); setQuick("") }}
          disabled={!quick.trim()}
          className="mt-2 inline-flex items-center gap-1 rounded-sm bg-foreground text-background px-3 py-1 text-[10px] font-mono uppercase tracking-wider disabled:opacity-30"
        >
          <MessageSquare className="h-3 w-3" /> Añadir al journey
        </button>
      </section>
    </div>
  )
}
