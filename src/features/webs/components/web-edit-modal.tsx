"use client"

import { useEffect, useState } from "react"
import { Loader2, X, Check, Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import type { WebWithSteps, WebHostname, WebStatus } from "../types/web"
import { getFunnelManifest } from "../lib/funnel-settings-manifest"

/**
 * Modal ÚNICO de edición de un funnel. Concentra TODA la edición que antes vivía
 * inline en la tarjeta (con lápices por todas partes): nombre, subdominio (ch/os),
 * estado (published/draft), path base y, por cada step, su nombre + su path absoluto.
 * Además incluye la sección de "Links del funnel" (campos del manifiesto del funnel,
 * GET/PUT a /api/admin/settings/funnel:<slug>).
 *
 * Reutiliza EXACTAMENTE los mismos endpoints que la tarjeta usaba:
 *   - PATCH /api/admin/webs/{id}            → { name, slug, status, hostname }
 *   - PATCH /api/admin/webs/{id}/steps/{id} → { name, slug }
 *   - GET/PUT /api/admin/settings/funnel:{slug} → ajustes de links
 *
 * Guardado optimista con estado saving/saved.
 */

const SLUG_RE = /^[a-z0-9][a-z0-9-/_]*$/

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
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 sm:items-center sm:p-5"
      onClick={() => !saving && onClose()}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="relative max-h-[92dvh] w-full overflow-y-auto rounded-sm border border-border bg-card p-5 sm:max-w-lg sm:p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={() => !saving && onClose()}
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-5 w-5" />
        </button>

        <h3 className="font-heading text-base font-semibold text-foreground">Editar funnel</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Aquí editas todo: nombre, dónde se publica, el path base y cada paso del funnel.
        </p>

        {/* ── Datos del funnel ── */}
        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-xs font-medium text-foreground">Nombre del funnel</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={saving}
              className="mt-1 h-9 w-full rounded-sm border border-border bg-secondary px-3 text-sm font-medium text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
              placeholder="Nombre del funnel"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-foreground">Subdominio</label>
              <select
                value={hostname}
                onChange={(e) => setHostname(e.target.value as WebHostname)}
                disabled={saving}
                className="mt-1 h-9 w-full rounded-sm border border-border bg-secondary px-2 font-mono text-[12px] text-foreground focus:border-foreground focus:outline-none disabled:opacity-50"
                title="Subdominio público donde se sirve esta web."
              >
                <option value="ch">ch. (público)</option>
                <option value="os">os. (interno)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-foreground">Estado</label>
              <div className="mt-1 flex gap-1.5">
                <button
                  type="button"
                  onClick={() => setStatus("published")}
                  disabled={saving}
                  className={cn(
                    "flex-1 rounded-sm border px-2 py-2 font-mono text-[11px] uppercase tracking-wide transition-colors disabled:opacity-50",
                    status === "published"
                      ? "border-green-500/40 bg-green-500/10 text-green-400"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  Published
                </button>
                <button
                  type="button"
                  onClick={() => setStatus("draft")}
                  disabled={saving}
                  className={cn(
                    "flex-1 rounded-sm border px-2 py-2 font-mono text-[11px] uppercase tracking-wide transition-colors disabled:opacity-50",
                    status === "draft"
                      ? "border-yellow-500/40 bg-yellow-500/10 text-yellow-400"
                      : "border-border bg-secondary text-muted-foreground hover:text-foreground",
                  )}
                >
                  Draft
                </button>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-foreground">Path base</label>
            <p className="mb-1.5 mt-0.5 text-[11px] text-muted-foreground">
              El path raíz de esta landing. Solo letras, números, guion y barra.
            </p>
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-sm text-muted-foreground/70">/</span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                disabled={saving}
                className="h-9 w-full rounded-sm border border-border bg-secondary px-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
                placeholder="test-personalidad"
              />
            </div>
          </div>
        </div>

        {/* ── Steps ── */}
        <div className="mt-6 border-t border-border pt-5">
          <h4 className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
            <Globe className="h-3.5 w-3.5" />
            Pasos del funnel ({stepDrafts.length})
          </h4>
          <p className="mt-1 text-[11px] text-muted-foreground/70">
            El path de cada paso es absoluto desde la raíz del dominio (no se concatena con el path base).
          </p>
          <div className="mt-3 space-y-3">
            {stepDrafts.map((s, i) => (
              <div key={s.id} className="rounded-sm border border-border bg-secondary/40 p-3">
                <p className="mb-2 font-mono text-[10px] uppercase tracking-wide text-muted-foreground/60">
                  Paso {i + 1}
                </p>
                <label className="block text-[11px] font-medium text-foreground">Nombre</label>
                <input
                  value={s.name}
                  onChange={(e) => updateStep(s.id, "name", e.target.value)}
                  disabled={saving}
                  className="mt-1 h-8 w-full rounded-sm border border-border bg-background px-2.5 text-xs font-medium text-foreground focus:border-foreground focus:outline-none"
                  placeholder="Nombre del paso"
                />
                <label className="mt-2.5 block text-[11px] font-medium text-foreground">Path</label>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="font-mono text-[11px] text-muted-foreground/70">/</span>
                  <input
                    value={s.slug}
                    onChange={(e) => updateStep(s.id, "slug", e.target.value)}
                    disabled={saving}
                    className="h-8 w-full rounded-sm border border-border bg-background px-2.5 font-mono text-[11px] text-foreground focus:border-foreground focus:outline-none"
                    placeholder="ruta-absoluta"
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Links del funnel (ajustes) ── */}
        {manifest && (
          <div className="mt-6 border-t border-border pt-5">
            <h4 className="font-mono text-[11px] uppercase tracking-wide text-muted-foreground">
              Links del funnel
            </h4>
            <p className="mt-1 text-[11px] text-muted-foreground/70">
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
                      <div key={f.key} className="flex items-start justify-between gap-3 rounded-sm border border-border bg-secondary/40 px-3 py-2.5">
                        <div className="min-w-0">
                          <label className="block text-xs font-medium text-foreground">{f.label}</label>
                          {f.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{f.hint}</p>}
                        </div>
                        <button
                          type="button"
                          role="switch"
                          aria-checked={on}
                          disabled={saving}
                          onClick={() => setSettings((v) => ({ ...v, [f.key]: on ? "0" : "1" }))}
                          className={`relative mt-0.5 h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-[#22C55E]" : "bg-border"}`}
                        >
                          <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white transition-transform ${on ? "translate-x-[22px]" : "translate-x-0.5"}`} />
                        </button>
                      </div>
                    )
                  }
                  // Fecha real (date): input nativo de fecha.
                  if (f.type === "date") {
                    return (
                      <div key={f.key}>
                        <label className="block text-xs font-medium text-foreground">{f.label}</label>
                        {f.hint && <p className="mb-1.5 mt-0.5 text-[11px] text-muted-foreground">{f.hint}</p>}
                        <input
                          type="date"
                          value={settings[f.key] ?? ""}
                          onChange={(e) => setSettings((v) => ({ ...v, [f.key]: e.target.value }))}
                          disabled={saving}
                          className="h-9 w-full rounded-sm border border-border bg-secondary px-3 font-mono text-[12px] text-foreground focus:border-foreground focus:outline-none"
                        />
                      </div>
                    )
                  }
                  // Texto (default).
                  return (
                    <div key={f.key}>
                      <label className="block text-xs font-medium text-foreground">{f.label}</label>
                      {f.hint && <p className="mb-1.5 mt-0.5 text-[11px] text-muted-foreground">{f.hint}</p>}
                      <input
                        value={settings[f.key] ?? ""}
                        onChange={(e) => setSettings((v) => ({ ...v, [f.key]: e.target.value }))}
                        placeholder={f.default}
                        disabled={saving}
                        className="h-9 w-full rounded-sm border border-border bg-secondary px-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
                      />
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {error && (
          <p className="mt-4 border-l-2 border-foreground pl-2 text-xs text-foreground">{error}</p>
        )}

        {/* ── Footer ── */}
        <div className="mt-6 flex items-center justify-end gap-2 border-t border-border pt-4">
          <button
            onClick={() => !saving && onClose()}
            disabled={saving}
            className="rounded-sm border border-border bg-secondary px-3 py-2 text-xs hover:bg-secondary/70 disabled:opacity-50"
          >
            Cerrar
          </button>
          <button
            onClick={handleSave}
            disabled={saving || settingsLoading}
            title={settingsLoading ? "Cargando los ajustes actuales…" : undefined}
            className="flex items-center gap-1.5 rounded-sm border border-foreground bg-foreground px-4 py-2 font-mono text-xs uppercase tracking-wide text-background disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
            {saved ? "Guardado" : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}
