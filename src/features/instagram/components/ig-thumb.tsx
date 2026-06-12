"use client"

import { useState } from "react"
import { Film } from "lucide-react"

/**
 * Thumbnail de un post/reel con fallback elegante cuando la imagen falla
 * (URLs de Instagram CDN expiran tras unos días).
 *
 * Componente CLIENT para poder usar onError (event handler).
 */
export function IgThumb({
  src,
  alt,
  className,
  fallbackText,
}: {
  src: string
  alt?: string
  className?: string
  fallbackText?: string
}) {
  const [errored, setErrored] = useState(false)

  if (errored) {
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

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt ?? ""}
      className={`h-full w-full object-cover ${className ?? ""}`}
      referrerPolicy="no-referrer"
      onError={() => setErrored(true)}
    />
  )
}
