"use client"

import type { Tag } from "../types/tag"

/**
 * Lista compacta de chips de tags para mostrar dentro de una card de contacto.
 * Limita a `max` visibles + indicador "+N".
 */
export function TagChips({ tags, max = 3, size = "sm" }: { tags: Tag[]; max?: number; size?: "sm" | "xs" }) {
  if (tags.length === 0) return null
  const visible = tags.slice(0, max)
  const extra = tags.length - visible.length
  const px = size === "xs" ? "px-1.5 py-0" : "px-1.5 py-0.5"
  const text = size === "xs" ? "text-[9px]" : "text-[10px]"

  return (
    <div className="flex items-center gap-1 flex-wrap">
      {visible.map((tag) => (
        <span
          key={tag.id}
          className={`inline-flex items-center gap-1 ${px} rounded-sm border font-medium ${text}`}
          style={{
            backgroundColor: `${tag.color}1a`,
            color: tag.color,
            borderColor: `${tag.color}44`,
          }}
        >
          {tag.name}
        </span>
      ))}
      {extra > 0 && (
        <span className={`${px} rounded-sm border border-border ${text} text-muted-foreground`}>
          +{extra}
        </span>
      )}
    </div>
  )
}
