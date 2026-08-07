"use client"

import type { Tag } from "../types/tag"
import { C } from "@/features/crm/lib/brand"

/**
 * Etiquetas de un contacto, en compacto. Muestra `max` y resume el resto en "+N".
 *
 * El color sale de la propia etiqueta (lo eligio el usuario, es un dato) y por eso va en
 * `style`. La forma sigue el brandkit: radio de 3px y tamano legible, nada de 9px.
 *
 * La caja de fuera es un `<span>` a proposito: estos chips se pintan dentro de la fila de
 * la lista de contactos, que es toda de `<span>`. Un `<div>` ahi seria HTML invalido.
 *
 * En telefono la letra nunca baja de 14 puntos. `size` solo aprieta la densidad en el
 * ordenador, donde el texto se lee de cerca y hay sitio de sobra.
 */
export function TagChips({ tags, max = 3, size = "sm" }: { tags: Tag[]; max?: number; size?: "sm" | "xs" }) {
  if (tags.length === 0) return null
  const visible = tags.slice(0, max)
  const extra = tags.length - visible.length
  const box =
    size === "xs"
      ? "px-1.5 py-0.5 text-[14px] md:text-[12px]"
      : "px-2 py-0.5 text-[14px] md:text-[13px]"

  return (
    <span className="flex flex-wrap items-center gap-1">
      {visible.map((tag) => (
        <span
          key={tag.id}
          className={`inline-flex items-center rounded-[3px] border font-medium ${box}`}
          style={{
            backgroundColor: `${tag.color}1f`,
            color: tag.color,
            borderColor: `${tag.color}4d`,
          }}
        >
          {tag.name}
        </span>
      ))}
      {extra > 0 && (
        <span
          className={`inline-flex items-center rounded-[3px] border ${box}`}
          style={{ borderColor: C.line, color: C.muted }}
        >
          +{extra}
        </span>
      )}
    </span>
  )
}
