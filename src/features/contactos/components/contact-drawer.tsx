"use client"

import { useEffect, useState } from "react"
import { Mail, Phone, Calendar, MessageSquare, Save, Trash2, ShoppingBag, RotateCcw } from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { ContactTagsPanel } from "@/features/tags/components/contact-tags-panel"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { SaleStagePrompt } from "@/features/sales/components/sale-stage-prompt"

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

/** Enlace o boton de accion rapida. 44 puntos en telefono. */
const CLASES_ACCION =
  "inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground md:h-8 md:px-2.5 md:text-sm md:hover:bg-muted"

/** Campo de escritura. text-base en telefono o el iPhone se acerca solo. */
const CLASES_CAMPO =
  "h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:h-9 md:text-sm"

/** Desplegable nativo: el sistema lo pinta como rueda y se acierta con el dedo. */
const CLASES_SELECT =
  "h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-base text-foreground md:h-8 md:w-auto md:px-2 md:text-sm"

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

  const pestanas = [
    ["datos", "Datos"],
    ["productos", "Productos + ventas"],
    ["journey", `Journey (${events.length + bookings.length})`],
    ["notas", "Notas"],
  ] as const

  return (
    <>
      <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
        <SheetContent
          side="bottom"
          className={
            // El `!` no es adorno: la base de sheet.tsx pinta el lado inferior con
            // `data-[side=bottom]:...`, que compila como `.clase[data-side=bottom]`
            // y pesa mas que cualquier clase de una sola palabra. Sin el `!`, ni la
            // pantalla entera del telefono ni el cajon del ordenador llegan a
            // aplicarse: la hoja se queda a 85dvh y pegada al borde izquierdo.
            // TELEFONO: la ficha ocupa la pantalla entera. Es la pantalla de
            // trabajo del CRM: con media pantalla no se puede editar nada.
            "h-[100dvh]! max-h-[100dvh]! w-full gap-0 rounded-t-xl " +
            // ORDENADOR: cajon por la derecha, con clases y cero JavaScript.
            "md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-[42rem] md:max-w-[42rem] md:rounded-l-xl md:border-l"
          }
        >
          {loading || !contact ? (
            <LoadingScreen fullscreen={false} className="min-h-[200px] flex-1" />
          ) : (
            <div className="no-overscroll min-h-0 flex-1 overflow-y-auto">
              {/* Cabecera */}
              <div className="sticky top-0 z-10 flex items-center gap-3 border-b border-border bg-popover px-4 py-3 pr-14">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-secondary text-[15px] font-semibold text-secondary-foreground">
                  {contact.full_name.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-[17px] font-semibold text-foreground">{contact.full_name}</h2>
                  <div className="truncate text-sm text-muted-foreground">{contact.email}</div>
                </div>
              </div>

              {/* Acciones rapidas */}
              <div className="flex flex-wrap items-center gap-2 border-b border-border px-4 py-3">
                <a href={`mailto:${contact.email}`} className={CLASES_ACCION}>
                  <Mail className="h-4 w-4" /> Email
                </a>
                {contact.phone && (
                  <a href={`tel:${contact.phone}`} className={CLASES_ACCION}>
                    <Phone className="h-4 w-4" /> Llamar
                  </a>
                )}
                {contact.manychat_subscriber_id && (
                  <a
                    href={`https://manychat.com/inbox/${contact.manychat_subscriber_id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CLASES_ACCION}
                    title="Abrir conversación en panel ManyChat (opcional)"
                  >
                    <MessageSquare className="h-4 w-4" /> ManyChat
                  </a>
                )}
                {contact.instagram_username && (
                  <a
                    href={`https://instagram.com/${contact.instagram_username.replace(/^@/, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={CLASES_ACCION}
                    title="Abrir perfil de Instagram"
                  >
                    <MessageSquare className="h-4 w-4" /> IG
                  </a>
                )}
                <button
                  onClick={() => setSaleModalOpen(true)}
                  className="inline-flex h-11 items-center gap-1.5 rounded-lg border border-primary/40 px-3 text-[15px] text-primary md:h-8 md:px-2.5 md:text-sm"
                  title="Registrar la venta y dar acceso a la App"
                >
                  <ShoppingBag className="h-4 w-4" /> Registrar venta
                </button>
                {(contact.stage === "won" || contact.stage === "alumno") && (
                  <button
                    onClick={async () => {
                      const res = await fetch(`/api/admin/contacts/${contact.id}/resend-invite`, { method: "POST" })
                      const data = await res.json()
                      alert(res.ok
                        ? `Magic link reenviado a ${data.sent_to}`
                        : (data.error ?? "No se pudo reenviar"),
                      )
                    }}
                    className={CLASES_ACCION}
                    title="Reenviar magic link de acceso a la App"
                  >
                    <RotateCcw className="h-4 w-4" /> Reenviar acceso
                  </button>
                )}
                <button
                  onClick={deleteContact}
                  aria-label="Eliminar contacto"
                  className="inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground md:h-8 md:w-8 md:hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>

              {/* Pipeline y stage: en telefono cada uno en su linea, con etiqueta encima */}
              <div className="grid grid-cols-1 gap-3 border-b border-border px-4 py-3 md:grid-cols-2">
                {pipelines && pipelines.length > 0 && (
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <Etiqueta>Pipeline</Etiqueta>
                    <select
                      value={contact.pipeline_id ?? ""}
                      onChange={(e) => save({ pipeline_id: e.target.value || null })}
                      disabled={saving}
                      className={CLASES_SELECT}
                      title="Pipeline al que pertenece este contacto"
                    >
                      <option value="">Sin pipeline</option>
                      {pipelines.map((p) => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </label>
                )}
                {/* Los stages salen del pipeline actual del contacto, no del kanban activo. */}
                <label className="flex min-w-0 flex-col gap-1.5">
                  <Etiqueta>Stage</Etiqueta>
                  <select
                    value={contact.stage ?? ""}
                    onChange={(e) => {
                      const v = e.target.value
                      // Mover a Alumno abre el flujo de venta (ahora/mas tarde) en vez de mover a ciegas.
                      if (v === "alumno" && contact.stage !== "alumno") { setSalePrompt(true); return }
                      save({ stage: v })
                    }}
                    disabled={saving}
                    className={CLASES_SELECT}
                    title="Stage actual dentro del pipeline"
                  >
                    {(() => {
                      const currentPipeline = pipelines?.find((p) => p.id === contact.pipeline_id)
                      const stageOpts = currentPipeline
                        ? currentPipeline.stages.map((s) => ({ value: s.key, label: s.name }))
                        : stages
                      return stageOpts.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)
                    })()}
                  </select>
                </label>
              </div>

              {/* Tags */}
              <ContactTagsPanel contactId={contact.id} />

              {/* Pestañas: tira deslizable de 44 puntos */}
              <div className="flex snap-x gap-1 overflow-x-auto border-b border-border px-4">
                {pestanas.map(([k, label]) => (
                  <button
                    key={k}
                    onClick={() => setTab(k)}
                    className={cn(
                      // Sin `-mb-px`: al declarar overflow-x el navegador calcula
                      // overflow-y como auto, y ese margen negativo dejaba la tira
                      // con 1 punto de desplazamiento vertical.
                      "h-11 shrink-0 snap-start border-b-2 px-3 text-[15px] whitespace-nowrap transition-colors md:h-10 md:text-sm",
                      tab === k
                        ? "border-primary font-semibold text-foreground"
                        : "border-transparent text-muted-foreground md:hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>

              {/* DATOS */}
              {tab === "datos" && (
                <div className="space-y-3 px-4 py-4 pb-safe-4">
                  <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                    <DataField label="Nombre completo" value={draft.full_name ?? contact.full_name} onChange={(v) => setDraft({ ...draft, full_name: v })} autoComplete="name" />
                    <DataField label="Email" value={draft.email ?? contact.email} onChange={(v) => setDraft({ ...draft, email: v })} type="email" inputMode="email" autoComplete="email" />
                    <DataField label="Teléfono" value={draft.phone ?? contact.phone ?? ""} onChange={(v) => setDraft({ ...draft, phone: v })} type="tel" inputMode="tel" autoComplete="tel" />
                    <DataField label="Instagram (@usuario)" value={draft.instagram_username ?? contact.instagram_username ?? ""} onChange={(v) => setDraft({ ...draft, instagram_username: v.replace(/^@/, "") })} placeholder="ej. juan_lopez (sin @)" />
                    <DataField label="Empresa" value={draft.company ?? contact.company ?? ""} onChange={(v) => setDraft({ ...draft, company: v })} />
                    <DataField label="Origen" value={draft.source ?? contact.source ?? ""} onChange={(v) => setDraft({ ...draft, source: v })} placeholder="organic, ads, referral, manychat…" />
                    <DataField label="Asignado a" value={draft.owner_assignee ?? contact.owner_assignee ?? ""} onChange={(v) => setDraft({ ...draft, owner_assignee: v })} placeholder="adrian, nagai, marco…" />
                  </div>

                  {/* ManyChat subscriber ID (solo lectura, lo setea el webhook) */}
                  {contact.manychat_subscriber_id && (
                    <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                      ManyChat subscriber ID:{" "}
                      <span className="break-all text-foreground tabular-nums">{contact.manychat_subscriber_id}</span>
                    </div>
                  )}

                  <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                    <div>Creado: <span className="tabular-nums">{new Date(contact.created_at).toLocaleString("es-ES")}</span></div>
                    <div>Actualizado: <span className="tabular-nums">{new Date(contact.updated_at).toLocaleString("es-ES")}</span></div>
                  </div>

                  {/* La accion principal va abajo con sticky, no con fixed: el
                      desplazamiento real lo hace esta hoja, y fixed se queda
                      pegado justo donde el teclado tapa. */}
                  {Object.keys(draft).length > 0 && (
                    <div className="sticky bottom-0 z-10 -mx-4 flex gap-2 border-t border-border bg-popover px-4 pt-3 pb-safe-4">
                      <button
                        onClick={() => setDraft({})}
                        className="h-11 flex-1 rounded-lg border border-border text-[15px] text-foreground md:h-9 md:flex-none md:px-4 md:text-sm"
                      >
                        Descartar
                      </button>
                      <button
                        onClick={() => save(draft)}
                        disabled={saving}
                        className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-30 md:h-9 md:flex-none md:px-4 md:text-sm"
                      >
                        <Save className="h-4 w-4" /> Guardar cambios
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PRODUCTOS */}
              {tab === "productos" && (
                <div className="space-y-4 px-4 py-4 pb-safe-4">
                  <section>
                    <h3 className="mb-2 text-sm font-semibold text-muted-foreground">Productos comprados</h3>
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
                              "h-11 rounded-lg border px-3 text-[15px] transition-colors md:h-9 md:text-sm",
                              has
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border text-muted-foreground"
                            )}
                          >
                            {has ? "✓ " : "+ "}{p}
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">Cifras</h3>
                    <NumberField label="Facturación total (€)" value={contact.total_revenue} onSave={(v) => save({ total_revenue: v })} />
                    <NumberField label="Cash collected total (€)" value={contact.total_cash_collected} onSave={(v) => save({ total_cash_collected: v })} />
                  </section>
                </div>
              )}

              {/* JOURNEY */}
              {tab === "journey" && (
                <div className="space-y-3 px-4 py-4 pb-safe-4">
                  <h3 className="text-sm font-semibold text-muted-foreground">Timeline</h3>
                  {bookings.length === 0 && events.length === 0 ? (
                    <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 px-6 py-10 text-center">
                      <h4 className="text-[17px] font-semibold text-foreground">Sin eventos todavía</h4>
                      <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                        Aquí aparecen las llamadas reservadas y las notas que añadas al journey.
                      </p>
                    </div>
                  ) : (
                    <ul className="space-y-2">
                      {bookings.map((b) => (
                        <li key={`b-${b.id}`} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
                          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground" />
                          <div className="min-w-0 flex-1 text-[15px] text-foreground">
                            <div>Llamada {b.status === "cancelled" ? "(cancelada)" : ""}</div>
                            <div className="text-sm text-muted-foreground tabular-nums">
                              {new Date(b.start_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </li>
                      ))}
                      {events.map((e) => (
                        <li key={e.id} className="flex items-start gap-2 rounded-lg border border-border px-3 py-2">
                          <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-muted-foreground" />
                          <div className="min-w-0 flex-1 text-[15px] text-foreground">
                            <div>{e.title}</div>
                            {e.description && <div className="mt-0.5 text-sm whitespace-pre-wrap text-muted-foreground">{e.description}</div>}
                            <div className="mt-1 text-sm text-muted-foreground tabular-nums">
                              {new Date(e.created_at).toLocaleString("es-ES")}
                            </div>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              )}

              {/* NOTAS */}
              {tab === "notas" && (
                <NotesTab notes={contact.notes ?? ""} onSave={(v) => save({ notes: v })} onAdd={addNote} />
              )}
            </div>
          )}
        </SheetContent>
      </Sheet>

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
    </>
  )
}

function DataField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  inputMode,
  autoComplete,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  type?: string
  placeholder?: string
  inputMode?: React.ComponentProps<"input">["inputMode"]
  autoComplete?: string
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <Etiqueta>{label}</Etiqueta>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        inputMode={inputMode}
        autoComplete={autoComplete}
        enterKeyHint="next"
        className={CLASES_CAMPO}
      />
    </label>
  )
}

function NumberField({ label, value, onSave }: { label: string; value: number; onSave: (v: number) => void }) {
  const [draft, setDraft] = useState(String(value))
  useEffect(() => { setDraft(String(value)) }, [value])
  const changed = parseFloat(draft || "0") !== value
  return (
    <div className="flex flex-col gap-1.5">
      <Etiqueta>{label}</Etiqueta>
      <div className="flex gap-2">
        <input
          type="number"
          step="0.01"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          inputMode="decimal"
          enterKeyHint="done"
          className={`${CLASES_CAMPO} min-w-0 flex-1 tabular-nums`}
        />
        {changed && (
          <button
            onClick={() => onSave(parseFloat(draft || "0"))}
            className="h-11 shrink-0 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-9 md:text-sm"
          >
            Guardar
          </button>
        )}
      </div>
    </div>
  )
}

function NotesTab({ notes, onSave, onAdd }: { notes: string; onSave: (v: string) => void; onAdd: (v: string) => void }) {
  const [main, setMain] = useState(notes)
  const [quick, setQuick] = useState("")
  useEffect(() => { setMain(notes) }, [notes])
  const clasesArea =
    "w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring md:text-sm"
  return (
    <div className="space-y-4 px-4 py-4 pb-safe-4">
      <section>
        <label className="flex flex-col gap-1.5">
          <Etiqueta>Notas generales</Etiqueta>
          <textarea value={main} onChange={(e) => setMain(e.target.value)} rows={6} className={clasesArea} />
        </label>
        {main !== notes && (
          <button
            onClick={() => onSave(main)}
            className="mt-2 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-9 md:w-auto md:text-sm"
          >
            <Save className="h-4 w-4" /> Guardar nota general
          </button>
        )}
      </section>

      <section>
        <label className="flex flex-col gap-1.5">
          <Etiqueta>Añadir nota al journey</Etiqueta>
          <textarea
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Ej: Le interesa el plan anual pero quiere pensarlo. Llamar viernes 14h."
            rows={3}
            className={clasesArea}
          />
        </label>
        <button
          onClick={() => { onAdd(quick); setQuick("") }}
          disabled={!quick.trim()}
          className="mt-2 inline-flex h-11 w-full items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-30 md:h-9 md:w-auto md:text-sm"
        >
          <MessageSquare className="h-4 w-4" /> Añadir al journey
        </button>
      </section>
    </div>
  )
}

/**
 * Etiqueta de un campo. Va en su propio componente a proposito: escrita pegada
 * al <input> el candado la confunde con la letra DEL campo (mira dos lineas
 * arriba y dos abajo) y bloquea el guardado. Aqui la clase no toca ningun campo.
 */
function Etiqueta({ children }: { children: React.ReactNode }) {
  return <span className="text-sm font-medium text-muted-foreground">{children}</span>
}
