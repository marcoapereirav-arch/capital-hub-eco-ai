"use client"

import { useEffect, useState } from "react"
import { Loader2, X, Check } from "lucide-react"
import { getFunnelManifest } from "../lib/funnel-settings-manifest"

/**
 * Popup ⚙️ de ajustes de un funnel. Lee el manifiesto (qué campos/botones tiene)
 * y los valores actuales de app_settings (key 'funnel:<slug>'), deja editarlos y
 * guarda. La landing los aplica al instante (sin deploy). Campo vacío = default.
 */
export function FunnelSettingsModal({
  slug,
  name,
  onClose,
}: {
  slug: string
  name: string
  onClose: () => void
}) {
  const manifest = getFunnelManifest(slug)
  const [values, setValues] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!manifest) {
      setLoading(false)
      return
    }
    fetch(`/api/admin/settings/${encodeURIComponent(`funnel:${slug}`)}`)
      .then((r) => r.json())
      .then((d) => setValues((d?.value ?? {}) as Record<string, string>))
      .catch(() => setValues({}))
      .finally(() => setLoading(false))
  }, [slug, manifest])

  async function save() {
    if (!manifest) return
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const value: Record<string, string> = {}
      for (const f of manifest.fields) value[f.key] = (values[f.key] ?? "").trim()
      const res = await fetch(`/api/admin/settings/${encodeURIComponent(`funnel:${slug}`)}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value }),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d?.error ?? "No se pudo guardar")
        return
      }
      setSaved(true)
      setTimeout(() => setSaved(false), 1800)
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

        <h3 className="font-heading text-base font-semibold text-foreground">Ajustes · {name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Edita a dónde apuntan los botones de esta landing. Se aplica al instante, sin deploy.
        </p>

        {!manifest ? (
          <div className="mt-6 rounded-sm border border-dashed border-border bg-secondary/30 px-4 py-8 text-center text-sm text-muted-foreground">
            Este funnel todavía no tiene ajustes configurables.
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Cargando ajustes…
          </div>
        ) : (
          <div className="mt-5 space-y-4">
            {manifest.fields.map((f) => {
              // Interruptor (toggle): guarda "1"/"0". Sin valor previo = ON por defecto.
              if (f.type === "toggle") {
                const on = (values[f.key] ?? "") !== "0"
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
                      onClick={() => setValues((v) => ({ ...v, [f.key]: on ? "0" : "1" }))}
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
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                      disabled={saving}
                      className="h-9 w-full rounded-sm border border-border bg-secondary px-3 font-mono text-[12px] text-foreground focus:border-foreground focus:outline-none"
                    />
                    <p className="mt-1 text-[10px] text-muted-foreground/60">Vacío = usa la fecha por defecto.</p>
                  </div>
                )
              }
              // Texto (default).
              return (
                <div key={f.key}>
                  <label className="block text-xs font-medium text-foreground">{f.label}</label>
                  {f.hint && <p className="mb-1.5 mt-0.5 text-[11px] text-muted-foreground">{f.hint}</p>}
                  <input
                    value={values[f.key] ?? ""}
                    onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    placeholder={f.default}
                    disabled={saving}
                    className="h-9 w-full rounded-sm border border-border bg-secondary px-3 font-mono text-[12px] text-foreground placeholder:text-muted-foreground/60 focus:border-foreground focus:outline-none"
                  />
                  <p className="mt-1 text-[10px] text-muted-foreground/60">Vacío = usa el valor por defecto.</p>
                </div>
              )
            })}

            {error && <p className="text-xs text-foreground border-l-2 border-foreground pl-2">{error}</p>}

            <div className="flex items-center justify-end gap-2 pt-1">
              <button
                onClick={onClose}
                disabled={saving}
                className="rounded-sm border border-border bg-secondary px-3 py-2 text-xs hover:bg-secondary/70"
              >
                Cerrar
              </button>
              <button
                onClick={save}
                disabled={saving}
                className="flex items-center gap-1.5 rounded-sm border border-foreground bg-foreground px-3 py-2 text-xs font-mono uppercase tracking-wide text-background disabled:opacity-50"
              >
                {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : saved ? <Check className="h-3.5 w-3.5" /> : null}
                {saved ? "Guardado" : "Guardar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
