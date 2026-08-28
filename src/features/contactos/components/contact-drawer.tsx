"use client"

import { useEffect, useState } from "react"
import {
  X, Mail, Phone, Calendar, MessageSquare, Save, Trash2, ShoppingBag,
  AtSign, RotateCw, ArrowLeft,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { LoadingScreen } from "@/components/ui/loading-screen"
import { ContactTagsPanel } from "@/features/tags/components/contact-tags-panel"
import { RegistrarVentaModal } from "@/features/sales/components/registrar-venta-modal"
import { SaleStagePrompt } from "@/features/sales/components/sale-stage-prompt"
import { FONT } from "@/features/crm/lib/brand"

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

/** Los productos vendibles, leidos del catalogo real. */
function useProductOptions(): string[] {
  const [opciones, setOpciones] = useState<string[]>([])
  useEffect(() => {
    let vivo = true
    fetch("/api/catalogo/productos")
      .then((r) => (r.ok ? r.json() : { productos: [] }))
      .then((d: { productos?: { nombre: string }[] }) => {
        if (vivo) setOpciones((d.productos ?? []).map((p) => p.nombre))
      })
      .catch(() => {})
    return () => { vivo = false }
  }, [])
  return opciones
}

// Los productos NO se escriben aqui. Salen del catalogo real via
// /api/catalogo/productos. Esta lista estuvo 19 dias ofreciendo "Media Buyer
// Digital" (retirado) y sin Clipper, y nadie se entero.

/** Enlace o boton de accion rapida. 44 puntos en telefono. */
const CLASES_ACCION =
  "inline-flex h-11 items-center gap-1.5 rounded-lg border border-border px-3 text-[15px] text-foreground md:h-8 md:px-2.5 md:text-sm md:hover:bg-muted"

/** Accion principal: verde de marca con su tinta encima. 44 puntos en telefono. */
const CLASES_PRIMARIO =
  "inline-flex h-11 items-center justify-center gap-1.5 rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 disabled:opacity-40 md:h-9 md:text-sm"

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
  const PRODUCT_OPTIONS = useProductOptions()
  const [tab, setTab] = useState<"datos" | "productos" | "journey" | "notas">("datos")
  const [contact, setContact] = useState<ContactDetail | null>(null)
  const [events, setEvents] = useState<JourneyEvent[]>([])
  const [bookings, setBookings] = useState<Booking[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [draft, setDraft] = useState<Partial<ContactDetail>>({})
  // Aviso dentro de la ficha en vez de alert() del navegador: el alert corta la
  // pagina y en telefono tapa todo.
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

  const pestanas = [
    ["datos", "Datos"],
    ["productos", "Productos y ventas"],
    ["journey", `Historial (${events.length + bookings.length})`],
    ["notas", "Notas"],
  ] as const

  return (
    <>
      {/* La hoja cierra sola con Escape y tocando fuera: lo trae el propio kit
          (Radix), asi que aqui no hace falta escuchar el teclado a mano. */}
      <Sheet open onOpenChange={(o) => { if (!o) onClose() }}>
        <SheetContent
          side="bottom"
          aria-label="Ficha del contacto"
          // Inter Tight garantizada: la hoja se cuelga del <body>, fuera del arbol
          // del CRM, y por tanto no hereda la fuente de esa pantalla.
          style={{ fontFamily: FONT }}
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
            <>
              <SheetTitle className="sr-only">Ficha del contacto</SheetTitle>
              <LoadingScreen fullscreen={false} className="min-h-[200px] flex-1" />
            </>
          ) : (
            <div className="no-overscroll min-h-0 flex-1 overflow-y-auto">
              {/* Cabecera. Lleva SIEMPRE una salida visible con texto, arriba a la
                  izquierda. La X de cerrar la pone la propia hoja arriba a la
                  derecha, por eso esta fila le reserva sitio con pr-14. */}
              <div className="sticky top-0 z-10 border-b border-border bg-popover">
                <div className="flex items-center gap-2 pt-3 pr-14 pl-4">
                  <button
                    onClick={onClose}
                    className="inline-flex h-11 items-center gap-1.5 rounded-lg px-2 text-[15px] font-semibold text-muted-foreground md:h-9 md:text-sm md:hover:text-foreground"
                  >
                    <ArrowLeft className="h-4 w-4" /> Volver
                  </button>
                </div>
                <div className="flex items-center gap-3 px-4 pt-1 pb-3">
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border bg-muted text-[15px] font-semibold text-muted-foreground">
                    {contact.full_name.charAt(0).toUpperCase()}
                  </span>
                  <div className="min-w-0 flex-1">
                    <SheetTitle className="truncate text-[19px] font-bold tracking-tight text-foreground">
                      {contact.full_name}
                    </SheetTitle>
                    <p className="truncate text-sm text-muted-foreground">{contact.email}</p>
                  </div>
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
                    className={CLASES_ACCION}
                    title="Abrir el perfil de Instagram"
                  >
                    <AtSign className="h-4 w-4" /> Instagram
                  </a>
                )}

                <button
                  onClick={() => setSaleModalOpen(true)}
                  className={CLASES_PRIMARIO}
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
                    className={CLASES_ACCION}
                    title="Reenviar el enlace de acceso a la App"
                  >
                    <RotateCw className="h-4 w-4" /> Reenviar acceso
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

              {aviso && (
                <div className="flex items-start justify-between gap-3 border-b border-border bg-primary/10 px-4 py-2.5">
                  <p className="text-[15px] text-primary">{aviso}</p>
                  <button
                    onClick={() => setAviso(null)}
                    aria-label="Cerrar aviso"
                    className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-primary md:h-8 md:w-8"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}

              {/* Pipeline y stage: en telefono cada uno en su linea, con etiqueta encima.
                  Pipeline: el servidor recoloca el stage si el actual no existe en el destino. */}
              <div className="grid grid-cols-1 gap-3 border-b border-border px-4 py-3 md:grid-cols-2">
                {pipelines && pipelines.length > 0 && (
                  <label className="flex min-w-0 flex-col gap-1.5">
                    <Etiqueta>Pipeline</Etiqueta>
                    <select
                      value={contact.pipeline_id ?? ""}
                      onChange={(e) => save({ pipeline_id: e.target.value || null })}
                      disabled={saving}
                      aria-label="Pipeline del contacto"
                      className={CLASES_SELECT}
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
                    aria-label="Stage dentro del pipeline"
                    className={CLASES_SELECT}
                  >
                    {stageOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
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
                    aria-current={tab === k ? "true" : undefined}
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
                    <DataField label="Email" type="email" value={draft.email ?? contact.email} onChange={(v) => setDraft({ ...draft, email: v })} inputMode="email" autoComplete="email" />
                    <DataField label="Teléfono" type="tel" value={draft.phone ?? contact.phone ?? ""} onChange={(v) => setDraft({ ...draft, phone: v })} inputMode="tel" autoComplete="tel" />
                    <DataField label="Instagram" value={draft.instagram_username ?? contact.instagram_username ?? ""} onChange={(v) => setDraft({ ...draft, instagram_username: v.replace(/^@/, "") })} placeholder="juan_lopez (sin arroba)" />
                    <DataField label="Empresa" value={draft.company ?? contact.company ?? ""} onChange={(v) => setDraft({ ...draft, company: v })} />
                    <DataField label="Origen" value={draft.source ?? contact.source ?? ""} onChange={(v) => setDraft({ ...draft, source: v })} placeholder="organic, ads, referral, manychat" />
                    <DataField label="Responsable" value={draft.owner_assignee ?? contact.owner_assignee ?? ""} onChange={(v) => setDraft({ ...draft, owner_assignee: v })} placeholder="adrian, nagai, marco" />
                  </div>

                  {/* ManyChat subscriber ID (solo lectura, lo setea el webhook) */}
                  {contact.manychat_subscriber_id && (
                    <div className="border-t border-border pt-3 text-sm text-muted-foreground">
                      ManyChat subscriber ID:{" "}
                      <span className="break-all text-foreground tabular-nums">{contact.manychat_subscriber_id}</span>
                    </div>
                  )}

                  <div className="space-y-1 border-t border-border pt-4 text-sm text-muted-foreground">
                    <p>Entró el <span className="tabular-nums">{new Date(contact.created_at).toLocaleString("es-ES")}</span></p>
                    <p>Última actualización el <span className="tabular-nums">{new Date(contact.updated_at).toLocaleString("es-ES")}</span></p>
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
                        className={cn(CLASES_PRIMARIO, "flex-1 md:flex-none")}
                      >
                        <Save className="h-4 w-4" /> Guardar cambios
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* PRODUCTOS */}
              {tab === "productos" && (
                <div className="space-y-6 px-4 py-4 pb-safe-4">
                  <section>
                    <h3 className="mb-2.5 text-[15px] font-semibold text-foreground">Productos comprados</h3>
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
                              "inline-flex h-11 items-center rounded-lg border px-3 text-[15px] font-semibold transition-colors md:h-9 md:text-sm",
                              has
                                ? "border-primary/40 bg-primary/10 text-primary"
                                : "border-border text-muted-foreground md:hover:text-foreground"
                            )}
                          >
                            {p}
                          </button>
                        )
                      })}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <h3 className="text-[15px] font-semibold text-foreground">Cifras</h3>
                    <NumberField label="Facturación total (EUR)" value={contact.total_revenue} onSave={(v) => save({ total_revenue: v })} />
                    <NumberField label="Cobrado hasta hoy (EUR)" value={contact.total_cash_collected} onSave={(v) => save({ total_cash_collected: v })} />
                  </section>
                </div>
              )}

              {/* HISTORIAL */}
              {tab === "journey" && (
                <div className="space-y-3 px-4 py-4 pb-safe-4">
                  {bookings.length === 0 && events.length === 0 ? (
                    <p className="rounded-lg border border-dashed border-border px-4 py-10 text-center text-[15px] text-muted-foreground">
                      Todavía no ha pasado nada con este contacto.
                    </p>
                  ) : (
                    <ul className="space-y-2">
                      {bookings.map((b) => (
                        <li key={`b-${b.id}`} className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
                          <Calendar className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] text-foreground">
                              Llamada{b.status === "cancelled" ? " (cancelada)" : ""}
                            </p>
                            <p className="text-sm text-muted-foreground tabular-nums">
                              {new Date(b.start_at).toLocaleString("es-ES", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </p>
                          </div>
                        </li>
                      ))}
                      {events.map((e) => (
                        <li key={e.id} className="flex items-start gap-2.5 rounded-lg border border-border bg-card px-3 py-2.5">
                          <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-muted-foreground" />
                          <div className="min-w-0 flex-1">
                            <p className="text-[15px] text-foreground">{e.title}</p>
                            {e.description && (
                              <p className="mt-0.5 text-[15px] whitespace-pre-wrap text-muted-foreground">{e.description}</p>
                            )}
                            <p className="mt-1 text-sm text-muted-foreground tabular-nums">
                              {new Date(e.created_at).toLocaleString("es-ES")}
                            </p>
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
          <button onClick={() => onSave(parseFloat(draft || "0"))} className={cn(CLASES_PRIMARIO, "shrink-0")}>
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
          <button onClick={() => onSave(main)} className={cn(CLASES_PRIMARIO, "mt-2 w-full md:w-auto")}>
            <Save className="h-4 w-4" /> Guardar nota general
          </button>
        )}
      </section>

      <section>
        <label className="flex flex-col gap-1.5">
          <Etiqueta>Añadir al historial</Etiqueta>
          <textarea
            value={quick}
            onChange={(e) => setQuick(e.target.value)}
            placeholder="Le interesa el plan anual pero quiere pensarlo. Llamar el viernes a las 14h."
            rows={3}
            className={clasesArea}
          />
        </label>
        <button
          onClick={() => { onAdd(quick); setQuick("") }}
          disabled={!quick.trim()}
          className={cn(CLASES_PRIMARIO, "mt-2 w-full md:w-auto")}
        >
          <MessageSquare className="h-4 w-4" /> Añadir al historial
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
