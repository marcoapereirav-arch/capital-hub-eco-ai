"use client"

import { useState } from "react"
import { Film } from "lucide-react"

/**
 * Thumbnail de un post/reel con fallback en cascada:
 *   1. URL original (rapido, no consume API)
 *   2. Si falla → proxy nuestro (/api/instagram/thumbnail/<mediaId>) que
 *      refresca la URL desde Graph API. Nunca expira.
 *   3. Si tambien falla → fallback visual con icono
 *
 * El proxy se activa solo cuando hay mediaId (external_id del post).
 */
export function IgThumb({
  src,
  mediaId,
  alt,
  className,
  fallbackText,
}: {
  src: string
  /** ID externo del post en Instagram (ci_videos.external_id). Activa el proxy refresh. */
  mediaId?: string | null
  alt?: string
  className?: string
  fallbackText?: string
}) {
  const [stage, setStage] = useState<"original" | "proxy" | "failed">("original")

  function onError() {
    if (stage === "original" && mediaId) {
      setStage("proxy")
    } else {
      setStage("failed")
    }
  }

  if (stage === "failed") {
    return (
      <div className={`flex h-full w-full items-center justify-center bg-card/40 text-muted-foreground ${className ?? ""}`}>
        {fallbackText ? (
          <span className="text-[10px] font-mono uppercase tracking-wider">{fallbackText}</span>
        ) : (
          <Film className="h-6 w-6 opacity-50" />
        )}
      </div>
    )
  }

  const effectiveSrc = stage === "proxy" && mediaId
    ? `/api/instagram/thumbnail/${mediaId}`
    : src

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      key={stage}
      src={effectiveSrc}
      alt={alt ?? ""}
      className={`h-full w-full object-cover ${className ?? ""}`}
      referrerPolicy="no-referrer"
      onError={onError}
    />
  )
}
