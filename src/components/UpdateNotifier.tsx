"use client"

import { useEffect, useRef, useState } from "react"
import { RefreshCw, X } from "lucide-react"
import { Button } from "@/components/ui/button"

const POLL_INTERVAL_MS = 60_000 // cada 60s

type VersionInfo = {
  sha: string
  message: string | null
  author: string | null
}

async function fetchVersion(): Promise<VersionInfo | null> {
  try {
    const res = await fetch("/api/version", { cache: "no-store" })
    if (!res.ok) return null
    return (await res.json()) as VersionInfo
  } catch {
    return null
  }
}

export function UpdateNotifier() {
  const initialSha = useRef<string | null>(null)
  const [info, setInfo] = useState<VersionInfo | null>(null)
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    let cancelled = false

    // Capturar SHA inicial al montar
    fetchVersion().then((v) => {
      if (cancelled || !v) return
      if (!initialSha.current) initialSha.current = v.sha
    })

    // Poll cada 60s
    const interval = setInterval(async () => {
      const v = await fetchVersion()
      if (cancelled || !v) return

      if (!initialSha.current) {
        initialSha.current = v.sha
        return
      }

      if (v.sha !== initialSha.current) {
        setInfo(v)
        clearInterval(interval) // ya no hace falta seguir polleando
      }
    }, POLL_INTERVAL_MS)

    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  if (!info || dismissed) return null

  return (
    <div
      role="status"
      className="fixed bottom-4 right-4 z-[100] w-[360px] max-w-[calc(100vw-2rem)] rounded-md border border-border bg-card p-4 shadow-xl"
    >
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-green-500/15 text-green-400">
          <RefreshCw className="h-4 w-4" />
        </div>
        <div className="min-w-0 flex-1">
          <p className="font-heading text-sm font-semibold text-foreground">
            Nueva versión disponible
          </p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            Refresca para ver los últimos cambios.
          </p>
          {(info.message || info.author) && (
            <p
              className="mt-2 truncate font-mono text-[10px] text-muted-foreground/70"
              title={info.message ?? undefined}
            >
              {info.author ? `${info.author} · ` : ""}
              {info.sha} {info.message ? `— ${info.message}` : ""}
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="-mr-1 -mt-1 rounded-sm p-1 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          aria-label="Cerrar"
        >
          <X className="h-3.5 w-3.5" />
        </button>
      </div>

      <div className="mt-3 flex gap-2">
        <Button
          size="sm"
          onClick={() => window.location.reload()}
          className="flex-1 font-mono text-xs"
        >
          <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          Refrescar
        </Button>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setDismissed(true)}
          className="font-mono text-xs"
        >
          Más tarde
        </Button>
      </div>
    </div>
  )
}
