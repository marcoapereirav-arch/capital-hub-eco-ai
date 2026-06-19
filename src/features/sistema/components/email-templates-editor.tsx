"use client"

import { useEffect, useState } from "react"
import { Loader2, Save, RotateCcw, ArrowLeft, Mail, Eye, Code2, AlertCircle, CheckCircle2 } from "lucide-react"
import Link from "next/link"

type Template = {
  key: string
  label: string
  description: string
  variables: string[]
  defaultSubject: string
  defaultHtml: string
  currentSubject: string
  currentHtml: string
  hasOverride: boolean
  updatedAt: string | null
}

export function EmailTemplatesEditor() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState<Template | null>(null)
  const [subject, setSubject] = useState("")
  const [html, setHtml] = useState("")
  const [saving, setSaving] = useState(false)
  const [reset, setReset] = useState(false)
  const [tab, setTab] = useState<"editor" | "preview">("editor")
  const [toast, setToast] = useState<{ kind: "ok" | "err"; msg: string } | null>(null)

  async function load() {
    setLoading(true)
    const res = await fetch("/api/admin/email-templates")
    const data = await res.json()
    setTemplates(data.templates ?? [])
    setLoading(false)
  }

  useEffect(() => { load() }, [])

  function openTemplate(t: Template) {
    setSelected(t)
    setSubject(t.currentSubject)
    setHtml(t.currentHtml)
    setTab("editor")
  }

  async function save() {
    if (!selected) return
    setSaving(true)
    try {
      const res = await fetch("/api/admin/email-templates", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ template_key: selected.key, subject, html_body: html }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setToast({ kind: "ok", msg: "Cambios guardados. Próximo email usará tu texto." })
      await load()
      setSelected(null)
    } catch (e) {
      setToast({ kind: "err", msg: (e as Error).message })
    } finally {
      setSaving(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  async function deleteOverride() {
    if (!selected) return
    if (!confirm("¿Borrar tu versión custom y volver al texto original del código? No se puede deshacer.")) return
    setReset(true)
    try {
      const res = await fetch(`/api/admin/email-templates?key=${encodeURIComponent(selected.key)}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error")
      setToast({ kind: "ok", msg: "Volviste al texto original." })
      await load()
      setSelected(null)
    } catch (e) {
      setToast({ kind: "err", msg: (e as Error).message })
    } finally {
      setReset(false)
      setTimeout(() => setToast(null), 4000)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-foreground/70" />
      </div>
    )
  }

  if (selected) {
    return (
      <div className="min-h-screen bg-background">
        <header className="border-b border-border bg-background/95 backdrop-blur sticky top-0 z-10">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3">
            <button
              onClick={() => setSelected(null)}
              className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Volver
            </button>
            <h1 className="text-sm font-semibold">{selected.label}</h1>
            {selected.hasOverride && (
              <span className="text-[10px] font-mono uppercase tracking-wider text-green-400 ml-auto">
                personalizado
              </span>
            )}
          </div>
        </header>

        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-5 space-y-4">
          <p className="text-xs text-muted-foreground">{selected.description}</p>

          {selected.variables.length > 0 && (
            <div className="rounded-sm border border-border/60 bg-card/30 p-3">
              <p className="text-[10px] font-mono uppercase tracking-wider text-muted-foreground mb-1.5">
                Variables disponibles · cópialas en el texto con dobles llaves
              </p>
              <div className="flex flex-wrap gap-1.5">
                {selected.variables.map((v) => (
                  <code
                    key={v}
                    className="text-[11px] font-mono px-2 py-0.5 rounded bg-white/[0.05] border border-white/15 text-foreground cursor-pointer hover:border-white/35"
                    onClick={() => navigator.clipboard.writeText(`{{${v}}}`)}
                    title="Click para copiar"
                  >
                    {`{{${v}}}`}
                  </code>
                ))}
              </div>
            </div>
          )}

          <label className="block">
            <span className="text-[10px] font-mono uppercase tracking-wider text-foreground/80">
              Asunto del email <span className="text-red-400">*</span>
            </span>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="mt-1.5 w-full rounded-sm border border-white/25 bg-white/[0.04] px-3 py-2.5 text-sm focus:bg-white/[0.08] focus:border-green-500/70 focus:outline-none transition-colors"
            />
          </label>

          <div>
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => setTab("editor")}
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-sm border transition-colors ${tab === "editor" ? "border-white/50 bg-white/10 text-foreground" : "border-white/15 text-muted-foreground hover:border-white/30"}`}
              >
                <Code2 className="w-3 h-3" /> Editor HTML
              </button>
              <button
                onClick={() => setTab("preview")}
                className={`inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-3 py-1.5 rounded-sm border transition-colors ${tab === "preview" ? "border-white/50 bg-white/10 text-foreground" : "border-white/15 text-muted-foreground hover:border-white/30"}`}
              >
                <Eye className="w-3 h-3" /> Vista previa
              </button>
            </div>
            {tab === "editor" ? (
              <textarea
                value={html}
                onChange={(e) => setHtml(e.target.value)}
                rows={24}
                spellCheck={false}
                className="w-full rounded-sm border border-white/25 bg-white/[0.04] px-3 py-2.5 text-xs font-mono leading-relaxed focus:bg-white/[0.08] focus:border-green-500/70 focus:outline-none transition-colors resize-y"
              />
            ) : (
              <iframe
                title="preview"
                srcDoc={html}
                className="w-full rounded-sm border border-white/25 bg-white"
                style={{ height: "60vh" }}
              />
            )}
          </div>

          <div className="flex items-center gap-2 sticky bottom-0 bg-background/95 backdrop-blur pt-3 pb-1">
            <button
              onClick={save}
              disabled={saving || !subject.trim() || !html.trim()}
              className="rounded-sm bg-gradient-to-br from-green-500 to-green-600 text-black px-5 py-2 text-xs font-mono uppercase tracking-wider font-bold disabled:opacity-30 inline-flex items-center gap-2"
            >
              {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
              Guardar cambios
            </button>
            {selected.hasOverride && (
              <button
                onClick={deleteOverride}
                disabled={reset}
                className="rounded-sm border border-white/15 px-4 py-2 text-xs font-mono uppercase tracking-wider hover:border-amber-500/50 inline-flex items-center gap-2 text-amber-300"
              >
                {reset ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RotateCcw className="w-3.5 h-3.5" />}
                Volver al original
              </button>
            )}
          </div>
        </div>

        {toast && (
          <div className={`fixed bottom-5 right-5 z-50 rounded-sm border px-4 py-2 text-xs flex items-center gap-2 ${toast.kind === "ok" ? "border-green-500/40 bg-green-500/[0.08] text-green-300" : "border-red-500/40 bg-red-500/[0.08] text-red-300"}`}>
            {toast.kind === "ok" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
            {toast.msg}
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3">
          <Link href="/webs/sistema" className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4" /> Sistema
          </Link>
          <h1 className="text-base font-semibold flex items-center gap-2 ml-auto">
            <Mail className="w-4 h-4 text-green-400" /> Templates de email
          </h1>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-3">
        <p className="text-xs text-muted-foreground mb-4">
          Edita el texto y diseño de cualquier email del sistema sin tocar código. Usa <code className="font-mono text-[11px] bg-white/[0.06] px-1.5 py-0.5 rounded">{`{{variable}}`}</code> para placeholders dinámicos.
        </p>

        {templates.map((t) => (
          <button
            key={t.key}
            onClick={() => openTemplate(t)}
            className="w-full text-left rounded-sm border border-border/60 bg-card/40 p-4 hover:border-white/30 transition-colors"
          >
            <div className="flex items-start justify-between gap-3 mb-1">
              <h2 className="text-sm font-semibold">{t.label}</h2>
              {t.hasOverride ? (
                <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-green-500/15 text-green-400 border border-green-500/30 shrink-0">
                  personalizado
                </span>
              ) : (
                <span className="text-[9px] font-mono uppercase tracking-wider px-2 py-0.5 rounded bg-white/[0.05] text-muted-foreground border border-white/15 shrink-0">
                  original
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground mb-2">{t.description}</p>
            <p className="text-[11px] font-mono text-muted-foreground truncate">{t.currentSubject}</p>
          </button>
        ))}
      </main>
    </div>
  )
}
