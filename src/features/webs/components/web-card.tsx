"use client"

import { useState } from "react"
import { Copy, Check, ExternalLink, Globe, FileDown, Pencil } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { WebWithSteps, WebHostname } from "../types/web"
import { WebEditModal, type WebEditResult } from "./web-edit-modal"

interface WebCardProps {
  web: WebWithSteps
  publicBaseUrl: string
}

const TYPE_ICONS = {
  funnel: Globe,
  lead_magnet: FileDown,
  presentation: Globe,
  other: Globe,
}

/* Verde = publicado, ambar = pendiente de publicar, gris = archivado. Los tres
   salen del tema: antes eran green-500 / yellow-500 / zinc-500 de Tailwind, que
   son otros tres colores distintos a los de la marca. */
const STATUS_STYLES: Record<string, string> = {
  draft: "border-warn/40 bg-warn/10 text-warn",
  published: "border-primary/40 bg-primary/10 text-primary",
  archived: "border-border bg-muted text-muted-foreground",
}

const STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  published: "Published",
  archived: "Archived",
}

type StepLocal = WebWithSteps["steps"][0]

/** Base URLs por subdominio publico. En dev/preview usa el host actual. */
function baseUrlForHostname(hostname: WebHostname, fallbackBase: string): string {
  try {
    const u = new URL(fallbackBase)
    if (u.hostname.includes("localhost") || u.hostname.endsWith(".vercel.app")) {
      return fallbackBase
    }
  } catch {
    // ignore
  }
  return hostname === "ch"
    ? "https://ch.capitalhubapp.com"
    : "https://os.capitalhubapp.com"
}

export function WebCard({ web, publicBaseUrl }: WebCardProps) {
  const [copiedStepId, setCopiedStepId] = useState<string | null>(null)
  // Estado local de SOLO LECTURA: refleja lo último guardado desde el modal.
  const [status, setStatus] = useState(web.status)
  const [hostname, setHostname] = useState<WebHostname>(web.hostname)
  const [webName, setWebName] = useState(web.name)
  const [slug, setSlug] = useState(web.slug)
  const [steps, setSteps] = useState<StepLocal[]>(web.steps)
  const [showEdit, setShowEdit] = useState(false)
  const [tracking, setTracking] = useState(web.trackingEnabled)
  const [savingTracking, setSavingTracking] = useState(false)

  // Enciende o apaga la medición de ESTE funnel. Es independiente de Draft/Published:
  // un funnel puede estar publicado y no medir (el acceso al OS, por ejemplo).
  // Optimista: se pinta al instante y se revierte si el guardado falla.
  async function toggleTracking() {
    const next = !tracking
    setTracking(next)
    setSavingTracking(true)
    try {
      const res = await fetch(`/api/admin/webs/${web.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ trackingEnabled: next }),
      })
      if (!res.ok) setTracking(!next)
    } catch {
      setTracking(!next)
    } finally {
      setSavingTracking(false)
    }
  }

  const effectiveBaseUrl = baseUrlForHostname(hostname, publicBaseUrl)
  const Icon = TYPE_ICONS[web.type]
  const entryStep = steps.find((s) => s.isEntry) ?? steps[0]

  // Cuando el modal guarda, refresca el estado local para que la tarjeta muestre lo nuevo.
  function handleSaved(result: WebEditResult) {
    setWebName(result.name)
    setSlug(result.slug)
    setStatus(result.status)
    setHostname(result.hostname)
    setSteps((prev) =>
      prev.map((s) => {
        const updated = result.steps.find((r) => r.id === s.id)
        return updated ? { ...s, name: updated.name, slug: updated.slug } : s
      }),
    )
  }

  // step.slug es un PATH ABSOLUTO desde la raíz del dominio.
  // Decisión Marco 2026-06-17 para eliminar el bug de doble-concatenacion
  // (que generaba /login/login, /test-personalidad/thanks → 404).
  function urlForStep(stepSlug: string | undefined): string {
    if (!stepSlug) return effectiveBaseUrl
    const clean = stepSlug.startsWith("/") ? stepSlug.slice(1) : stepSlug
    return `${effectiveBaseUrl}/${clean}`
  }

  async function copyToClipboard(url: string, stepId: string) {
    try {
      await navigator.clipboard.writeText(url)
      setCopiedStepId(stepId)
      setTimeout(() => setCopiedStepId(null), 1500)
    } catch {
      // Fallback silencioso
    }
  }

  return (
    <article className="flex flex-col gap-4 rounded-lg border border-border bg-card p-4 transition-colors md:p-5">
      {/* Header — SOLO LECTURA */}
      <header className="flex items-start gap-3">
        <div className="rounded-lg border border-border bg-secondary p-2">
          <Icon className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="min-w-0 flex-1 text-[15px] font-semibold leading-snug text-foreground line-clamp-2">
              {webName}
            </h3>
            <span
              className={cn(
                "shrink-0 rounded-sm border px-2 py-0.5 text-sm font-semibold",
                STATUS_STYLES[status],
              )}
            >
              {STATUS_LABEL[status] ?? status}
            </span>
          </div>
          {/* Estas dos etiquetas iban a 10 y 11 puntos con el token rebajado: en
              un telefono a plena luz no se leian. Ahora van a 14 con el token
              entero, que es el minimo legible con el zoom desactivado. */}
          <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm text-foreground">/{slug}</p>
            <span className="text-sm text-muted-foreground">
              {hostname === "ch" ? "ch. público" : "os. interno"}
            </span>
          </div>
        </div>
      </header>

      {/* Medición Meta — interruptor propio, aparte de Draft/Published.
          Publicado no obliga a medir: el acceso al OS está publicado y no manda nada. */}
      <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-3 py-2">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">Medición Meta</p>
          <p className="mt-0.5 text-sm leading-snug text-muted-foreground">
            {tracking
              ? "Manda los eventos a Facebook Ads"
              : "No manda nada, aunque esté publicado"}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={tracking}
          aria-label="Medición Meta"
          disabled={savingTracking}
          onClick={toggleTracking}
          className="flex h-11 w-12 shrink-0 items-center justify-center disabled:opacity-50 md:h-8"
        >
          {/* El carril es DECORACION (aria-hidden): quien lleva el estado es el
              boton. Asi la zona que se toca mide 44 puntos aunque el interruptor
              se dibuje mas fino. */}
          <span
            aria-hidden
            className={cn(
              "relative block h-7 w-12 rounded-full border transition-colors",
              tracking ? "border-primary/50 bg-primary" : "border-border bg-secondary",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 h-5 w-5 -translate-y-1/2 rounded-full transition-all",
                tracking
                  ? "left-[26px] bg-primary-foreground"
                  : "left-[3px] bg-muted-foreground",
              )}
            />
          </span>
        </button>
      </div>

      {/* Description */}
      {web.description && (
        <p className="text-sm leading-relaxed text-muted-foreground line-clamp-2">
          {web.description}
        </p>
      )}

      {/* Steps — SOLO LECTURA (solo copiar / abrir) */}
      <div className="space-y-1.5">
        <p className="text-sm font-semibold text-muted-foreground">
          {steps.length} {steps.length === 1 ? "step" : "steps"}
        </p>
        <ul className="space-y-1.5">
          {steps.map((step) => {
            const url = urlForStep(step.slug)
            const isCopied = copiedStepId === step.id
            return (
              <li
                key={step.id}
                className="space-y-1.5 rounded-lg border border-border bg-secondary/30 px-2.5 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                    {step.name}
                  </span>
                  {/* 44 puntos en telefono: antes eran iconos de 12 con relleno de
                      4, o sea 20 puntos, donde no acierta ningun dedo. */}
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(url, step.id)}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-secondary md:h-8 md:w-8 md:hover:bg-secondary md:hover:text-foreground"
                      title="Copiar link"
                    >
                      {isCopied ? <Check className="h-4 w-4 text-primary" /> : <Copy className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => window.open(url, "_blank", "noopener,noreferrer")}
                      className="flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground transition-colors active:bg-secondary md:h-8 md:w-8 md:hover:bg-secondary md:hover:text-foreground"
                      title="Abrir landing"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <p className="truncate rounded-sm border border-border bg-background/40 px-2 py-1 text-sm text-foreground">
                  {url.replace(/^https?:\/\//, "")}
                </p>
              </li>
            )
          })}
        </ul>
      </div>

      {/* Footer actions */}
      <footer className="flex items-center gap-2 border-t border-border pt-3">
        <Button
          variant="secondary"
          className="flex-1"
          onClick={() => window.open(urlForStep(entryStep?.slug), "_blank", "noopener,noreferrer")}
        >
          <ExternalLink className="mr-1.5 h-4 w-4" />
          Abrir funnel
        </Button>
        <Button
          variant="secondary"
          onClick={() => setShowEdit(true)}
          title="Editar todo el funnel: nombre, path, pasos y links"
        >
          <Pencil className="mr-1.5 h-4 w-4" />
          Editar
        </Button>
      </footer>

      {showEdit && (
        <WebEditModal
          web={{ ...web, name: webName, slug, status, hostname, steps }}
          onClose={() => setShowEdit(false)}
          onSaved={handleSaved}
        />
      )}
    </article>
  )
}
