"use client"

import { useEffect, useState } from "react"
import { Loader2, Check, Globe, X } from "lucide-react"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import type { WebWithSteps, WebHostname, WebStatus } from "../types/web"
import { getFunnelManifest } from "../lib/funnel-settings-manifest"

/**
 * Hoja ÚNICA de edición de un funnel. Concentra TODA la edición que antes vivía
 * inline en la tarjeta (con lápices por todas partes): nombre, subdominio (ch/os),
 * estado (published/draft), path base y, por cada step, su nombre + su path absoluto.
 * Además incluye la sección de "Links del funnel" (campos del manifiesto del funnel,
 * GET/PUT a /api/admin/settings/funnel:<slug>).
 *
 * Antes era una ventana centrada hecha a mano con `fixed inset-0`: en un telefono
 * el teclado la tapaba al escribir y no se llegaba al boton de guardar. Ahora es la
 * hoja inferior del kit, con el lado FIJO (`side="bottom"`) y el escritorio resuelto
 * con clases `md:`, nunca con JavaScript.
 *
 * La hoja es UNA columna con tres filas: cabecera fija (titulo + salida), cuerpo que
 * se desplaza (el UNICO sitio con desplazamiento) y pie fijo con los botones. El
 * formulario es largo, y con el desplazamiento en la caja entera la cabecera se iba
 * hacia arriba: el cerrar desaparecia de la pantalla y no habia forma de salir. El
 * alto tope se mide en `dvh` descontando la franja del reloj, y el pie deja libre la
 * franja de gestos del iPhone.
 *
 * Reutiliza EXACTAMENTE los mismos endpoints que la tarjeta usaba:
 *   - PATCH /api/admin/webs/{id}            → { name, slug, status, hostname }
 *   - PATCH /api/admin/webs/{id}/steps/{id} → { name, slug }
 *   - GET/PUT /api/admin/settings/funnel:{slug} → ajustes de links
 *
 * Guardado optimista con estado saving/saved.
 */

const SLUG_RE = /^[a-z0-9][a-z0-9-/_]*$/

/** Un desplegable nativo con la ropa del tema y 44 puntos de alto en telefono. */
const SELECT_CLASS =
  "h-11 w-full rounded-lg border border-border bg-secondary px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:h-9 md:text-sm"

/** Datos que devolvemos a la tarjeta para que refleje los cambios al guardar. */
export type WebEditResult = {
  name: string
  slug: string
  status: WebStatus
  hostname: WebHostname
  steps: { id: string; name: string; slug: string }[]
}

type StepDraft = { id: string; name: string; slug: string }

export function WebEditModal({
  web,
  onClose,
  onSaved,
}: {
  web: WebWithSteps
  onClose: () => void
  onSaved?: (result: WebEditResult) => void
}) {
  // Manifiesto/ajustes se atan al slug ORIGINAL (identidad del funnel).
  const manifest = getFunnelManifest(web.slug)

  const [name, setName] = useState(web.name)
  const [slug, setSlug] = useState(web.slug)
  const [status, setStatus] = useState<WebStatus>(web.status)
  const [hostname, setHostname] = useState<WebHostname>(web.hostname)
  const [stepDrafts, setStepDrafts] = useState<StepDraft[]>(
    web.steps.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
  )

  // Ajustes de links del funnel (manifiesto).
  const [settings, setSettings] = useState<Record<string, string>>({})
  const [settingsLoading, setSettingsLoading] = useState(!!manifest)

  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!manifest) return
    fetch(`/api/admin/settings/${encodeURIComponent(`funnel:${web.slug}`)}`)
      .then((r) => r.json())
      .then((d) => setSettings((d?.value ?? {}) as Record<string, string>))
      .catch(() => setSettings({}))
      .finally(() => setSettingsLoading(false))
  }, [manifest, web.slug])

  function updateStep(id: string, field: "name" | "slug", value: string) {
    setStepDrafts((prev) => prev.map((s) => (s.id === id ? { ...s, [field]: value } : s)))
  }

  async function handleSave() {
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      // --- Validación (misma regla que la tarjeta) ---
      const cleanName = name.trim()
      if (!cleanName) {
        setError("El nombre del funnel no puede estar vacío.")
        return
      }
      const cleanSlug = slug.trim().toLowerCase().replace(/^\/+|\/+$/g, "")
      if (!cleanSlug || !SLUG_RE.test(cleanSlug)) {
        setError("El path base solo admite letras, números, guion y barra. Sin espacios.")
        return
      }
      const cleanedSteps = stepDrafts.map((s) => {
        const original = web.steps.find((os) => os.id === s.id)!
        return {
          id: s.id,
          name: s.name.trim(),
          // Path ABSOLUTO desde la raíz del dominio: sin barra inicial/final.
          slug: s.slug.trim().toLowerCase().replace(/^\/+|\/+$/g, ""),
          original,
        }
      })
      for (const s of cleanedSteps) {
        if (!s.name) {
          setError("El nombre de cada step es obligatorio.")
          return
        }
        if (s.slug && !SLUG_RE.test(s.slug)) {
          setError(`El path "${s.slug}" no es válido. Solo letras, números, guion y barra. Sin espacios.`)
          return
        }
      }

      // --- 1) Funnel (nombre / slug / status / subdominio) ---
      const webBody: Record<string, unknown> = {}
      if (cleanName !== web.name) webBody.name = cleanName
      if (cleanSlug !== web.slug) webBody.slug = cleanSlug
      if (status !== web.status) webBody.status = status
      if (hostname !== web.hostname) webBody.hostname = hostname
      if (Object.keys(webBody).length > 0) {
        const res = await fetch(`/api/admin/webs/${web.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(webBody),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(d?.error ?? "No se pudieron guardar los datos del funnel.")
          return
        }
      }

      // --- 2) Steps (nombre / path) ---
      for (const s of cleanedSteps) {
        const body: Record<string, unknown> = {}
        if (s.name !== s.original.name) body.name = s.name
        if (s.slug !== s.original.slug) body.slug = s.slug
        if (Object.keys(body).length === 0) continue
        const res = await fetch(`/api/admin/webs/${web.id}/steps/${s.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        })
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(d?.error ?? `No se pudo guardar el step "${s.name}".`)
          return
        }
      }

      // --- 3) Links del funnel (ajustes del manifiesto) ---
      // GUARD anti-carrera: si el GET de los ajustes aún no resolvió, `settings` sigue en {}
      // y este PUT (que es un REEMPLAZO total, no merge) machacaría los overrides guardados
      // con cadenas vacías (borraría webinar_date, whatsapp_number, etc. y la landing/tag
      // volverían al default). Solo guardamos los ajustes cuando ya cargaron.
      if (manifest && !settingsLoading) {
        const value: Record<string, string> = {}
        for (const f of manifest.fields) value[f.key] = (settings[f.key] ?? "").trim()
        const res = await fetch(
          `/api/admin/settings/${encodeURIComponent(`funnel:${web.slug}`)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ value }),
          },
        )
        if (!res.ok) {
          const d = await res.json().catch(() => ({}))
          setError(d?.error ?? "No se pudieron guardar los links del funnel.")
          return
        }
      }

      // --- Éxito ---
      onSaved?.({
        name: cleanName,
        slug: cleanSlug,
        status,
        hostname,
        steps: cleanedSteps.map((s) => ({ id: s.id, name: s.name, slug: s.slug })),
      })
      setSaved(true)
      setTimeout(() => onClose(), 900)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Sheet
      open
      onOpenChange={(abierto) => {
        if (!abierto && !saving) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        // El cerrar del kit es `absolute` DENTRO de la caja que se desplaza: en un
        // formulario largo como este se va hacia arriba con el contenido y el usuario
        // se queda encerrado. Ponemos el nuestro en la cabecera, que no se mueve.
        showCloseButton={false}
        className={cn(
          // UNA sola caja en columna: cabecera fija, cuerpo que se desplaza, pie fijo.
          // El desplazamiento propio del kit se apaga aqui; si no, hay dos sitios
          // desplazandose a la vez y se pelean con el dedo.
          "gap-0 overflow-hidden data-[side=bottom]:overflow-y-hidden",
          // TELEFONO: hoja inferior que nunca se mete debajo del reloj. Con `vh` la
          // cabecera se colaba debajo del notch y el cerrar no se podia tocar.
          "rounded-t-xl data-[side=bottom]:max-h-[calc(100dvh-var(--sat)-2rem)]",
          // La zona segura de abajo la pone el pie, no la caja entera.
          "data-[side=bottom]:pb-0",
          // ESCRITORIO: cajon por la derecha, con las mismas clases y cero JavaScript.
          // Se repite la condicion del lado porque las clases del kit (`data-[side=bottom]:...`)
          // pesan mas que un `md:` suelto; sin repetirla el cajon sale por la izquierda.
          "md:data-[side=bottom]:inset-y-0 md:right-0 md:data-[side=bottom]:left-auto md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none md:w-full md:max-w-lg md:rounded-t-none md:border-l md:pb-0",
        )}
      >
        {/* ── Cabecera: no se desplaza, y siempre lleva la salida a la vista ── */}
        <div className="shrink-0 border-b border-border">
          {/* La agarradera es lo que hace que se lea como hoja y no como un error. */}
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
          <div className="flex items-start justify-between gap-3 px-4 py-3">
            <SheetHeader className="min-w-0 flex-1 gap-0.5 p-0">
              <SheetTitle className="text-[17px] font-semibold">Editar funnel</SheetTitle>
              <SheetDescription className="text-[15px]">
                Aquí editas todo: nombre, dónde se publica, el path base y cada paso del funnel.
              </SheetDescription>
            </SheetHeader>
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Cerrar"
                className="tap-target -mr-2 inline-flex shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-secondary active:text-foreground md:hover:text-foreground"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </SheetClose>
          </div>
        </div>

        {/* ── Cuerpo: el UNICO sitio que se desplaza ── */}
        <div className="no-overscroll min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          {/* ── Datos del funnel ── */}
          <div className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-[15px] font-medium text-foreground">Nombre del funnel</span>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={saving}
                enterKeyHint="next"
                className="bg-secondary"
                placeholder="Nombre del funnel"
              />
            </label>

            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              <label className="block">
                <span className="mb-1.5 block text-[15px] font-medium text-foreground">Subdominio</span>
                <select
                  value={hostname}
                  onChange={(e) => setHostname(e.target.value as WebHostname)}
                  disabled={saving}
                  className={SELECT_CLASS}
                  title="Subdominio público donde se sirve esta web."
                >
                  <option value="ch">ch. (público)</option>
                  <option value="os">os. (interno)</option>
                </select>
              </label>
              <div>
                <span className="mb-1.5 block text-[15px] font-medium text-foreground">Estado</span>
                <div className="flex gap-1.5">
                  <button
                    type="button"
                    onClick={() => setStatus("published")}
                    disabled={saving}
                    className={cn(
                      "h-11 flex-1 rounded-lg border px-2 text-sm font-semibold transition-colors disabled:opacity-50 md:h-9",
                      status === "published"
                        ? "border-primary/40 bg-primary/10 text-primary"
                        : "border-border bg-secondary text-muted-foreground",
                    )}
                  >
                    Published
                  </button>
                  <button
                    type="button"
                    onClick={() => setStatus("draft")}
                    disabled={saving}
                    className={cn(
                      "h-11 flex-1 rounded-lg border px-2 text-sm font-semibold transition-colors disabled:opacity-50 md:h-9",
                      status === "draft"
                        ? "border-warn/40 bg-warn/10 text-warn"
                        : "border-border bg-secondary text-muted-foreground",
                    )}
                  >
                    Draft
                  </button>
                </div>
              </div>
            </div>

            <div>
              <span className="block text-[15px] font-medium text-foreground">Path base</span>
              <p className="mb-1.5 mt-0.5 text-[15px] text-muted-foreground">
                El path raíz de esta landing. Solo letras, números, guion y barra.
              </p>
              <div className="flex items-center gap-1.5">
                <span className="text-[15px] text-muted-foreground">/</span>
                <Input
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                  disabled={saving}
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  className="bg-secondary"
                  placeholder="test-personalidad"
                />
              </div>
            </div>
          </div>

          {/* ── Steps ── */}
          <div className="border-t border-border pt-5">
            <h4 className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
              <Globe className="h-4 w-4" />
              Pasos del funnel ({stepDrafts.length})
            </h4>
            <p className="mt-1 text-sm text-muted-foreground">
              El path de cada paso es absoluto desde la raíz del dominio (no se concatena con el path base).
            </p>
            <div className="mt-3 space-y-3">
              {stepDrafts.map((s, i) => (
                <div key={s.id} className="rounded-lg border border-border bg-secondary/40 p-3">
                  <p className="mb-2 text-[15px] font-semibold text-muted-foreground">Paso {i + 1}</p>
                  <label className="block">
                    <span className="mb-1.5 block text-[15px] font-medium text-foreground">Nombre</span>
                    <Input
                      value={s.name}
                      onChange={(e) => updateStep(s.id, "name", e.target.value)}
                      disabled={saving}
                      enterKeyHint="next"
                      placeholder="Nombre del paso"
                    />
                  </label>
                  <label className="mt-2.5 block">
                    <span className="mb-1.5 block text-[15px] font-medium text-foreground">Path</span>
                    <span className="flex items-center gap-1.5">
                      <span className="text-[15px] text-muted-foreground">/</span>
                      <Input
                        value={s.slug}
                        onChange={(e) => updateStep(s.id, "slug", e.target.value)}
                        disabled={saving}
                        autoCapitalize="none"
                        autoCorrect="off"
                        spellCheck={false}
                        placeholder="ruta-absoluta"
                      />
                    </span>
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* ── Links del funnel (ajustes) ── */}
          {manifest && (
            <div className="border-t border-border pt-5">
              <h4 className="text-sm font-semibold text-muted-foreground">Links del funnel</h4>
              <p className="mt-1 text-sm text-muted-foreground">
                A dónde apuntan los botones de esta landing. Se aplica al instante, sin deploy. Vacío = valor por defecto.
              </p>
              {settingsLoading ? (
                <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando ajustes…
                </div>
              ) : (
                <div className="mt-3 space-y-4">
                  {manifest.fields.map((f) => {
                    // Interruptor (toggle): guarda "1"/"0". Sin valor previo = ON por defecto.
                    if (f.type === "toggle") {
                      const on = (settings[f.key] ?? "") !== "0"
                      return (
                        <div key={f.key} className="flex items-start justify-between gap-3 rounded-lg border border-border bg-secondary/40 px-3 py-2.5">
                          <div className="min-w-0">
                            <span className="block text-[15px] font-medium text-foreground">{f.label}</span>
                            {f.hint && <p className="mt-0.5 text-sm text-muted-foreground">{f.hint}</p>}
                          </div>
                          <button
                            type="button"
                            role="switch"
                            aria-checked={on}
                            aria-label={f.label}
                            disabled={saving}
                            onClick={() => setSettings((v) => ({ ...v, [f.key]: on ? "0" : "1" }))}
                            className="flex h-11 w-12 shrink-0 items-center justify-center md:h-8"
                          >
                            {/* El carril es DECORACION: el estado lo lleva el boton,
                                que es el que mide los 44 puntos que acierta un dedo. */}
                            <span
                              aria-hidden
                              className={cn(
                                "relative block h-7 w-12 rounded-full transition-colors",
                                on ? "bg-primary" : "bg-border",
                              )}
                            >
                              <span
                                aria-hidden
                                className={cn(
                                  "absolute top-1 h-5 w-5 rounded-full transition-transform",
                                  on
                                    ? "translate-x-[26px] bg-primary-foreground"
                                    : "translate-x-1 bg-muted-foreground",
                                )}
                              />
                            </span>
                          </button>
                        </div>
                      )
                    }
                    // Fecha real (date): input nativo de fecha.
                    if (f.type === "date") {
                      return (
                        <label key={f.key} className="block">
                          <span className="block text-[15px] font-medium text-foreground">{f.label}</span>
                          {f.hint && <span className="mb-1.5 mt-0.5 block text-[15px] text-muted-foreground">{f.hint}</span>}
                          <Input
                            type="date"
                            value={settings[f.key] ?? ""}
                            onChange={(e) => setSettings((v) => ({ ...v, [f.key]: e.target.value }))}
                            disabled={saving}
                            className="bg-secondary"
                          />
                        </label>
                      )
                    }
                    // Texto (default).
                    return (
                      <label key={f.key} className="block">
                        <span className="block text-[15px] font-medium text-foreground">{f.label}</span>
                        {f.hint && <span className="mb-1.5 mt-0.5 block text-[15px] text-muted-foreground">{f.hint}</span>}
                        <Input
                          value={settings[f.key] ?? ""}
                          onChange={(e) => setSettings((v) => ({ ...v, [f.key]: e.target.value }))}
                          placeholder={f.default}
                          disabled={saving}
                          className="bg-secondary"
                        />
                      </label>
                    )
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* El aviso de error va FUERA de lo que se desplaza: si vive dentro y el
            usuario esta a mitad del formulario, guarda, falla y no ve nada. */}
        {error && (
          <p className="shrink-0 border-t border-destructive/40 bg-destructive/10 px-4 py-2.5 text-[15px] text-destructive">
            {error}
          </p>
        )}

        {/* ── Pie: fila fija de la columna, no `sticky` ni `fixed`. Con `fixed` el
            teclado del telefono lo tapa, y con `sticky` pelea con el desplazamiento
            del cuerpo. El relleno de abajo deja libre la franja de gestos. ── */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border bg-popover px-4 py-3 pb-[calc(0.75rem+var(--sab))] md:pb-3">
          <Button variant="secondary" onClick={() => !saving && onClose()} disabled={saving}>
            Cerrar
          </Button>
          <Button
            onClick={handleSave}
            disabled={saving || settingsLoading}
            title={settingsLoading ? "Cargando los ajustes actuales…" : undefined}
          >
            {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : saved ? <Check className="mr-1.5 h-4 w-4" /> : null}
            {saved ? "Guardado" : "Guardar cambios"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
