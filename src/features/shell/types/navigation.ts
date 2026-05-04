import type { LucideIcon } from "lucide-react"

export type NavItem = {
  title: string
  href: string
  icon: LucideIcon
  badge?: string
  /** Si true, aparece en el bottom tab bar movil. Maximo 4 con esta marca. */
  mobilePrimary?: boolean
}

export type NavSection = {
  label: string
  items: NavItem[]
}
