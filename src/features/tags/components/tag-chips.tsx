"use client"

import type { Tag } from "../types/tag"

/**
 * Lista compacta de chips de tags para mostrar dentro de una card de contacto.
 * Limita a `max` visibles + indicador "+N".
 *
 * El color de cada chip lo elige el USUARIO al crear el tag: es un dato de
 * producto, no diseno, y por eso va en `style` y no en clases del tema.
 *
 * La letra nunca baja de 14 puntos en telefono. `size` solo aprieta la densidad
 * en el ordenador, donde el texto se lee de cerca y hay sitio de sobra.
 */
export function TagChips({ tags, max = 3, size = "sm" }: { tags: Tag[]; max?: number; size?: "sm" | "xs" }) {
  if (tags.length === 0) return null
  const visible = tags.slice(0, max)
  const extra = tags.length - visible.length
  const text = size === "xs" ? "text-sm md:text-[11px]" : "text-sm md:text-xs"

  return (
    <div className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <span
          key={tag.id}
          className={`inline-flex items-center gap-1 rounded-sm border px-1.5 py-0.5 font-medium ${text}`}
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
        <span className={`rounded-sm border border-border px-1.5 py-0.5 text-muted-foreground ${text}`}>
          +{extra}
        </span>
      )}
    </div>
  )
}
