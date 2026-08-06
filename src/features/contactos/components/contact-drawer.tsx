"use client"

import { useEffect, useState } from "react"
import {
  X, Mail, Phone, Calendar, MessageSquare, Save, Trash2, ShoppingBag,
  AtSign, RotateCw, ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { ContactTagsPanel } from "@/features/tags/components/contact-tags-panel"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { SaleStagePrompt } from "@/features/sales/components/sale-stage-prompt"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { BTN_PRIMARY, FIELD, FONT } from "@/features/crm/lib/brand"

type ContactDetail = {
  id: string
  full_name: string
  email: string
  phone: string | null
  instagram_username: string | null
  manychat_subscriber_id: string | null
  company: string | null
  stage: string | null
  pipeline_id: string | null
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

type PipelineWithStages = {
  id: string
  name: string
  slug: string
  stages: { key: string; name: string; sortOrder?: number; sort_order?: number }[]
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

/** Accion rapida de la cabecera: borde fino, 44px de alto. */
const QUICK =
  "inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] border border-[rgba(245,246,247,0.1)] px-3 " +
  "text-[14px] font-semibold text-[#A6AAB2] transition-colors " +
  "hover:border-[rgba(245,246,247,0.2)] hover:bg-[#16161B] hover:text-[#F5F6F7]"

/** Etiqueta de campo. */
const LABEL = "mb-1.5 block text-[13px] font-semibold text-[#A6AAB2]"

export function ContactDrawer({
  contactId,
  onClose,
  onUpdate,
  stages,
  pipelines,
}: {
  contactId: string
  onClose: () => void
  onUpdate: () => void
  stages: Stage[]
  /**
   * Lista completa de pipelines (con sus stages). Permite al usuario mover
   * el contacto a otro pipeline desde la ficha. Si no se pasa, el selector de
   * pipeline NO se muestra (backwards-compat).
   */
  pipelines?: PipelineWithStages[]
}) {
  const [tab, setTab] = useState<"datos" | "productos" | "journey" | "notas">("datos")
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [events, setEvents] = useState<JourneyEvent[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<ContactDetail>>({})
  const [aviso, setAviso] = useState<string | null>(null)
  // Flujo "mover a Alumno" desde la ficha: popup ahora/mas tarde + modal de venta.
  const [salePrompt, setSalePrompt] = useState(false)
  const [saleModalOpen, setSaleModalOpen] = useState(false)

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

  // Cerrar con Escape: la ficha tapa la pantalla, tiene que haber salida sin ratón.
  useEffect(() => {
    function onKey(e: KeyboardEvent) { if (e.key === "Escape") onClose() }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onClose])

  async function save(patch: Partial<ContactDetail> & { sale_pending?: boolean }) {
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

  // Mover a Alumno desde la ficha: pregunta ahora/mas tarde (igual que en el kanban).
  function handleSaleNow() { setSalePrompt(false); setSaleModalOpen(true) }
  async function handleSaleLater() { setSalePrompt(false); await save({ stage: "alumno", sale_pending: true }) }

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

  const stageOptions = (() => {
    const currentPipeline = pipelines?.find((p) => p.id === contact?.pipeline_id)
    return currentPipeline
      ? currentPipeline.stages.map((s) => ({ value: s.key, label: s.name }))
      : stages
  })()

  return (
    <div className="fixed inset-0 z-50 flex" style={{ fontFamily: FONT }}>
      <button onClick={onClose} className="flex-1 bg-black/60" aria-label="Cerrar la ficha" />
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Ficha del contacto"
        className="w-full max-w-2xl overflow-y-auto overscroll-contain border-l border-[rgba(245,246,247,0.1)] bg-[#0F0F12]"
      >
        {loading || !contact ? (
          <LoadingScreen fullscreen={false} className="py-24" />
        ) : (
          <>
            {/* Cabecera. Lleva SIEMPRE una salida visible con texto, arriba a la izquierda. */}
            <div className="sticky top-0 z-10 border-b border-[rgba(245,246,247,0.1)] bg-[#0F0F12]">
              <div className="flex items-center gap-2 px-4 pt-3">
                <button
                  onClick={onClose}
                  className="inline-flex min-h-[44px] items-center gap-1.5 rounded-[4px] px-2 text-[14px] font-semibold text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#F5F6F7]"
                >
                  <ArrowLeft className="h-4 w-4" /> Volver
                </button>
                <div className="flex-1" />
                <button
                  onClick={onClose}
                  aria-label="Cerrar"
                  className="flex h-9 w-9 items-center justify-center rounded-[4px] text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#F5F6F7]"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="flex items-center gap-3 px-4 pb-3 pt-1">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-[rgba(245,246,247,0.1)] bg-[#16161B] text-[15px] font-semibold text-[#A6AAB2]">
                  {contact.full_name.charAt(0).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[19px] font-bold tracking-tight text-[#F5F6F7]">
                    {contact.full_name}
                  </h2>
                  <p className="truncate text-[14px] text-[#7C818A]">{contact.email}</p>
                </div>
              </div>
            </div>

            {/* Acciones rapidas */}
            <div className="flex flex-wrap items-center gap-2 border-b border-[rgba(245,246,247,0.1)] px-4 py-3">
              <a href={`mailto:${contact.email}`} className={QUICK}>
                <Mail className="h-4 w-4" /> Email
              </a>
              {contact.phone && (
                <a href={`tel:${contact.phone}`} className={QUICK}>
                  <Phone className="h-4 w-4" /> Llamar
                </a>
              )}
              {contact.manychat_subscriber_id && (
                <a
                  href={`https://manychat.com/inbox/${contact.manychat_subscriber_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={QUICK}
                  title="Abrir la conversación en ManyChat"
                >
                  <MessageSquare className="h-4 w-4" /> ManyChat
                </a>
              )}
              {contact.instagram_username && (
                <a
                  href={`https://instagram.com/${contact.instagram_username.replace(/^@/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={QUICK}
                  title="Abrir el perfil de Instagram"
                >
                  <AtSign className="h-4 w-4" /> Instagram
                </a>
              )}

              {/* Pipeline: el servidor recoloca el stage si el actual no existe en el destino. */}
              {pipelines && pipelines.length > 0 && (
                <select
                  value={contact.pipeline_id ?? ""}
                  onChange={(e) => save({ pipeline_id: e.target.value || null })}
                  disabled={saving}
                  aria-label="Pipeline del contacto"
                  className={cn(FIELD, "cursor-pointer pr-8")}
                >
                  <option value="">Sin pipeline</option>
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
              )}

              <select
                value={contact.stage ?? ""}
                onChange={(e) => {
                  const v = e.target.value
                  // Mover a Alumno abre el flujo de venta (ahora/mas tarde) en vez de mover a ciegas.
                  if (v === "alumno" && contact.stage !== "alumno") { setSalePrompt(true); return }
                  save({ stage: v })
                }}
                disabled={saving}
                aria-label="Stage dentro del pipeline"
                className={cn(FIELD, "cursor-pointer pr-8")}
              >
                {stageOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>

              <button
                onClick={() => setSaleModalOpen(true)}
                className={BTN_PRIMARY}
                title="Registrar la venta y dar acceso a la App"
              >
                <ShoppingBag className="h-4 w-4" /> Registrar venta
              </button>

              <div className="hidden flex-1 md:block" />

              {(contact.stage === "won" || contact.stage === "alumno") && (
                <button
                  onClick={async () => {
                    const res = await fetch(`/api/admin/contacts/${contact.id}/resend-invite`, { method: "POST" })
                    const data = await res.json()
                    setAviso(res.ok
                      ? `Acceso reenviado a ${data.sent_to}`
                      : (data.error ?? "No se pudo reenviar. Comprueba que el contacto tenga email y vuelve a intentarlo."))
                  }}
                  className={QUICK}
                  title="Reenviar el enlace de acceso a la App"
                >
                  <RotateCw className="h-4 w-4" /> Reenviar acceso
                </button>
              )}
              <button
                onClick={deleteContact}
                aria-label="Eliminar contacto"
                className="flex h-11 w-11 items-center justify-center rounded-[4px] text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#E5B567]"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>

            {aviso && (
              <div className="flex items-start justify-between gap-3 border-b border-[rgba(245,246,247,0.1)] bg-[#101710] px-4 py-2.5">
                <p className="text-[14px] text-[#4ADE80]">{aviso}</p>
                <button onClick={() => setAviso(null)} aria-label="Cerrar aviso" className="text-[#4ADE80]">
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <ContactTagsPanel contactId={contact.id} />

            {/* Pestanas de la ficha */}
            <div className="flex items-center gap-1 overflow-x-auto border-b border-[rgba(245,246,247,0.1)] px-4">
              {([
                ["datos", "Datos"],
                ["productos", "Productos y ventas"],
                ["journey", `Historial (${events.length + bookings.length})`],
                ["notas", "Notas"],
              ] as const).map(([k, label]) => (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  aria-current={tab === k ? "true" : undefined}
                  className={cn(
                    "-mb-px shrink-0 border-b-2 px-3 py-3 text-[14px] font-semibold transition-colors",
                    tab === k
                      ? "border-[#22C55E] text-[#F5F6F7]"
                      : "border-transparent text-[#A6AAB2] hover:text-[#F5F6F7]"
                  )}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === "datos" && (
              <div className="space-y-3.5 p-4">
                <DataField label="Nombre completo" value={draft.full_name ?? contact.full_name} onChange={(v) => setDraft({ ...draft, full_name: v })} />
                <DataField label="Email" type="email" value={draft.email ?? contact.email} onChange={(v) => setDraft({ ...draft, email: v })} />
                <DataField label="Teléfono" type="tel" value={draft.phone ?? contact.phone ?? ""} onChange={(v) => setDraft({ ...draft, phone: v })} />
                <DataField label="Instagram" value={draft.instagram_username ?? contact.instagram_username ?? ""} onChange={(v) => setDraft({ ...draft, instagram_username: v.replace(/^@/, "") })} placeholder="juan_lopez (sin arroba)" />
                <DataField label="Empresa" value={draft.company ?? contact.company ?? ""} onChange={(v) => setDraft({ ...draft, company: v })} />
                <DataField label="Origen" value={draft.source ?? contact.source ?? ""} onChange={(v) => setDraft({ ...draft, source: v })} placeholder="organic, ads, referral, manychat" />
                <DataField label="Responsable" value={draft.owner_assignee ?? contact.owner_assignee ?? ""} onChange={(v) => setDraft({ ...draft, owner_assignee: v })} placeholder="adrian, nagai, marco" />

                {Object.keys(draft).length > 0 && (
                  <div className="flex items-center gap-2 pt-1">
                    <button onClick={() => save(draft)} disabled={saving} className={BTN_PRIMARY}>
                      <Save className="h-4 w-4" /> Guardar cambios
                    </button>
                    <button
                      onClick={() => setDraft({})}
                      className="inline-flex min-h-[44px] items-center rounded-[4px] px-3 text-[14px] font-semibold text-[#A6AAB2] transition-colors hover:bg-[#16161B] hover:text-[#F5F6F7]"
                    >
                      Descartar
                    </button>
                  </div>
                )}

                <div className="space-y-1 border-t border-[rgba(245,246,247,0.1)] pt-4 text-[13px] text-[#7C818A]">
                  <p>Entró el {new Date(contact.created_at).toLocaleString("es-ES")}</p>
                  <p>Última actualización el {new Date(contact.updated_at).toLocaleString("es-ES")}</p>
                </div>
              </div>
            )}

            {tab === "productos" && (
              <div className="space-y-6 p-4">
                <section>
                  <h3 className="mb-2.5 text-[15px] font-bold text-[#F5F6F7]">Productos comprados</h3>
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
                          aria-pressed={has}
                          className={cn(
                            "inline-flex min-h-[44px] items-center rounded-[4px] border px-3 text-[14px] font-semibold transition-colors",
                            has
                              ? "border-[#24462F] bg-[#101710] text-[#4ADE80]"
                              : "border-[rgba(245,246,247,0.1)] text-[#A6AAB2] hover:border-[rgba(245,246,247,0.2)] hover:bg-[#16161B] hover:text-[#F5F6F7]"
                          )}
                        >
                          {p}
                        </button>
                      )
                    })}
                  </div>
                </section>

                <section className="space-y-3">
                  <h3 className="text-[15px] font-bold text-[#F5F6F7]">Cifras</h3>
                  <NumberField label="Facturación total (EUR)" value={contact.total_revenue} onSave={(v) => save({ total_revenue: v })} />
                  <NumberField label="Cobrado hasta hoy (EUR)" value={contact.total_cash_collected} onSave={(v) => save({ total_cash_collected: v })} />
                </section>
              </div>
            )}

            {tab === "journey" && (
              <div className="space-y-3 p-4">
                {bookings.length === 0 && events.length === 0 ? (
                  <p className="rounded-[8px] border border-dashed border-[rgba(245,246,247,0.1)] px-4 py-10 text-center text-[15px] text-[#A6AAB2]">
                    Todavía no ha pasado nada con este contacto.
                  </p>
                ) : (
                  <ul className="space-y-2">
                    {bookings.map((b) => (
                      <li key={`b-${b.id}`} className="flex items-start gap-2.5 rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#131318] px-3 py-2.5">
                        <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-[#4ADE80]" />
                        <div className="flex-1">
                          <p className="text-[14px] text-[#F5F6F7]">
                            Llamada{b.status === "cancelled" ? " (cancelada)" : ""}
                          </p>
                          <p className="text-[13px] text-[#7C818A]">
                            {new Date(b.start_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                      </li>
                    ))}
                    {events.map((e) => (
                      <li key={e.id} className="flex items-start gap-2.5 rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#131318] px-3 py-2.5">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#7C818A]" />
                        <div className="flex-1">
                          <p className="text-[14px] text-[#F5F6F7]">{e.title}</p>
                          {e.description && (
                            <p className="mt-0.5 whitespace-pre-wrap text-[14px] text-[#A6AAB2]">{e.description}</p>
                          )}
                          <p className="mt-1 text-[13px] text-[#7C818A]">
                            {new Date(e.created_at).toLocaleString("es-ES")}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}

            {tab === "notas" && (
              <NotesTab notes={contact.notes ?? ""} onSave={(v) => save({ notes: v })} onAdd={addNote} />
            )}
          </>
        )}
      </div>

      {salePrompt && contact && (
        <SaleStagePrompt
          contactName={contact.full_name}
          onNow={handleSaleNow}
          onLater={handleSaleLater}
          onClose={() => setSalePrompt(false)}
        />
      )}
      {saleModalOpen && contact && (
        <RegistrarVentaModal
          prefill={{
            contact_id: contact.id,
            full_name: contact.full_name,
            email: contact.email,
            phone: contact.phone ?? "",
            products: contact.products ?? [],
            close_type: "direct",
          }}
          onClose={() => setSaleModalOpen(false)}
          onRegistered={() => {
            fetch(`/api/admin/contacts/${contactId}`).then((r) => r.json()).then((d) => {
              setContact(d.contact); setEvents(d.events ?? [])
            })
            onUpdate()
          }}
        />
      )}
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
    <label className="block">
      <span className={LABEL}>{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(FIELD, "w-full")}
      />
    </label>
  )
}

function NumberField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => { setDraft(String(value)) }, [value])
  const changed = parseFloat(draft || "0") !== value
  return (
    <div className="flex flex-wrap items-end gap-2">
      <label className="min-w-[200px] flex-1">
        <span className={LABEL}>{label}</span>
        <input
          type="number"
          step="0.01"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          className={cn(FIELD, "w-full tabular-nums")}
        />
      </label>
      {changed && (
        <button onClick={() => onSave(parseFloat(draft || "0"))} className={BTN_PRIMARY}>
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
  const textarea =
    "w-full resize-none rounded-[4px] border border-[rgba(245,246,247,0.1)] bg-[#16161B] px-3 py-2.5 " +
    "text-[14px] text-[#F5F6F7] placeholder:text-[#7C818A] transition-colors " +
    "focus:border-[#24462F] focus:outline-none focus:ring-1 focus:ring-[rgba(34,197,94,0.45)]"

  return (
    <div className="space-y-6 p-4">
      <section>
        <label className="block">
          <span className={LABEL}>Notas generales</span>
          <textarea value={main} onChange={(e) => setMain(e.target.value)} rows={6} className={textarea} />
        </label>
        {main !== notes && (
          <button onClick={() => onSave(main)} className={cn(BTN_PRIMARY, "mt-2.5")}>
            <Save className="h-4 w-4" /> Guardar nota general
          </button>
        )}
      </section>

      <section>
        <label className="block">
          <span className={LABEL}>Añadir al historial</span>
          <textarea
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Le interesa el plan anual pero quiere pensarlo. Llamar el viernes a las 14h."
            rows={3}
            className={textarea}
          />
        </label>
        <button
          onClick={() => { onAdd(quick); setQuick("") }}
          disabled={!quick.trim()}
          className={cn(BTN_PRIMARY, "mt-2.5")}
        >
          <MessageSquare className="h-4 w-4" /> Añadir al historial
        </button>
      </section>
    </div>
  )
}
