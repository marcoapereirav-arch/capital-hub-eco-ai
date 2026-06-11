"use client"

import { useState } from "react"
import { ExternalLink, Loader2, RefreshCw } from "lucide-react"

/**
 * Renderiza la App de alumno embebida en iframe a pantalla completa.
 * Header minimo con: titulo "App alumno", boton "Abrir en pestaña" (escape hatch),
 * boton "Refrescar". El iframe consume todo el espacio restante.
 */
export function AppEmbedClient({
  embedUrl,
  fallbackUrl,
}: {
  embedUrl: string
  fallbackUrl: string
}) {
  const [loading, setLoading] = useState(true)
  const [iframeKey, setIframeKey] = useState(0)

  return (
    <div className="flex h-full flex-col">
      <div className="shrink-0 flex items-center gap-2 border-b border-border px-4 py-2 bg-card/30">
        <span className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
          App alumno · embebida
        </span>
        <div className="flex-1" />
        <button
          onClick={() => {
            setLoading(true)
            setIframeKey((k) => k + 1)
          }}
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
          title="Refrescar"
        >
          <RefreshCw className="h-3 w-3" /> Refrescar
        </button>
        <a
          href={fallbackUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-sm hover:bg-card text-muted-foreground hover:text-foreground transition-colors"
          title="Abrir en pestaña"
        >
          <ExternalLink className="h-3 w-3" /> Pestaña
        </a>
      </div>
      <div className="relative flex-1 min-h-0">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        )}
        <iframe
          key={iframeKey}
          src={embedUrl}
          onLoad={() => setLoading(false)}
          className="absolute inset-0 w-full h-full border-0"
          allow="autoplay; fullscreen; encrypted-media; picture-in-picture; clipboard-write"
          title="App alumno"
        />
      </div>
    </div>
  )
}
