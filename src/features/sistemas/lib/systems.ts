import { Radio, type LucideIcon } from "lucide-react"

/**
 * Registro de "sistemas visuales" del OS.
 *
 * El hub /sistemas es la portada: una tarjeta por cada sistema / estrategia / workflow
 * que montamos. Cada tarjeta abre su vista visual (board) en /sistemas/<slug>.
 *
 * Para añadir un sistema nuevo: se agrega una entrada aquí y su board en
 * /sistemas/[slug]/page.tsx (map por slug). Nada más.
 */
export type SistemaStatus = "activo" | "en-curso" | "proximo"

export interface SistemaCard {
  slug: string
  title: string
  /** Frase corta de una línea. */
  tagline: string
  /** Etiqueta de contexto (área). */
  meta: string
  status: SistemaStatus
  icon: LucideIcon
  /** Color de acento (hex). Verde = foco activo. */
  accent: string
}

export const STATUS_META: Record<SistemaStatus, { label: string }> = {
  activo: { label: "Activo ahora" },
  "en-curso": { label: "En curso" },
  proximo: { label: "Próximo" },
}

export const SISTEMAS: SistemaCard[] = [
  {
    slug: "webinar",
    title: "Funnel del Webinar",
    tagline: "Del anuncio hasta el WhatsApp, paso a paso.",
    meta: "Captación · webinar en directo",
    status: "activo",
    icon: Radio,
    accent: "#22C55E",
  },
]

export function getSistema(slug: string): SistemaCard | null {
  return SISTEMAS.find((s) => s.slug === slug) ?? null
}
