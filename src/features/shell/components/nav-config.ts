import {
  LayoutDashboard,
  Link2,
  Globe,
  Users,
  Radar,
  MessageSquare,
  Camera,
  BookOpen,
  Megaphone,
  Magnet,
  Rocket,
  FolderKanban,
  CalendarCheck,
  Shield,
  Mail,
} from "lucide-react"
import type { NavSection } from "../types/navigation"

// Estructura del sidebar agrupada por cuadrantes del negocio (espejo del Knowledge).
// Convención: solo se exportan secciones que tienen al menos un item.
// Ventas y Finanzas viven aquí también pero no se exportan hasta que tengan rutas.

export const navSections: NavSection[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobilePrimary: true },
      { title: "Operaciones", href: "/overview", icon: FolderKanban, mobilePrimary: true },
      { title: "Knowledge", href: "/knowledge", icon: BookOpen, mobilePrimary: true },
      { title: "Equipo", href: "/team", icon: Shield },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "CRM", href: "/crm", icon: Users },
      { title: "Outreach IG", href: "/outreach-ig", icon: Camera },
      { title: "Calendario", href: "/calendario", icon: CalendarCheck },
      { title: "Email Marketing", href: "/email-marketing", icon: Mail },
      { title: "Webs", href: "/webs", icon: Globe },
      { title: "Sistema visual", href: "/webs/sistema", icon: LayoutDashboard },
      { title: "Lead Magnets", href: "/webs/lead-magnets", icon: Magnet },
      { title: "Ads", href: "/ads", icon: Megaphone },
      { title: "Content Intel", href: "/content-intel", icon: Radar },
      { title: "Instagram", href: "/instagram", icon: Camera },
      { title: "ManyChat", href: "/manychat", icon: MessageSquare },
    ],
  },
  {
    label: "Producto",
    items: [
      { title: "Integraciones", href: "/integrations", icon: Link2 },
      { title: "Misión", href: "/mision", icon: Rocket },
    ],
  },
  // Ventas y Finanzas — pendientes de rutas. Se añaden secciones aquí cuando existan.
]

export const navAll = navSections.flatMap((s) => s.items)
export const navPrimary = navAll.filter((i) => i.mobilePrimary)
export const navSecondary = navAll.filter((i) => !i.mobilePrimary)
