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
  FolderKanban,
  CalendarCheck,
  Shield,
  Mail,
  Zap,
  GraduationCap,
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
      { title: "Operaciones", href: "/operaciones", icon: FolderKanban, mobilePrimary: true },
      { title: "Knowledge", href: "/knowledge", icon: BookOpen, mobilePrimary: true },
      { title: "Tutoriales", href: "/tutoriales", icon: GraduationCap },
      { title: "Equipo", href: "/team", icon: Shield },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "CRM", href: "/crm", icon: Users },
      { title: "Calendario", href: "/calendario", icon: CalendarCheck },
      { title: "Email Marketing", href: "/email-marketing", icon: Mail },
      { title: "Webs", href: "/webs", icon: Globe },
      { title: "Sistema visual", href: "/sistemas", icon: LayoutDashboard },
      { title: "Automatizaciones", href: "/automatizaciones", icon: Zap },
      { title: "Lead Magnets", href: "/webs/lead-magnets", icon: Magnet },
      { title: "Ads", href: "/ads", icon: Megaphone },
      // Afiliados salió de dentro de Ads (2026-07-31): son fuentes de tráfico de
      // personas, no configuración de anuncios. Ver SOP marketing/09.
      { title: "Afiliados", href: "/afiliados", icon: Users },
      { title: "Content Intel", href: "/content-intel", icon: Radar },
      { title: "Instagram", href: "/instagram", icon: Camera },
      { title: "ManyChat", href: "/manychat", icon: MessageSquare },
    ],
  },
  {
    label: "Producto",
    items: [
      { title: "Invitaciones App", href: "/invitaciones", icon: Mail },
      { title: "Integraciones", href: "/integrations", icon: Link2 },
    ],
  },
  // Ventas y Finanzas — pendientes de rutas. Se añaden secciones aquí cuando existan.
]

export const navAll = navSections.flatMap((s) => s.items)
export const navPrimary = navAll.filter((i) => i.mobilePrimary)
export const navSecondary = navAll.filter((i) => !i.mobilePrimary)

// Operaciones ya no tiene subpestañas: es UNA lista y vive en /operaciones. Las rutas
// viejas (/overview, /areas, /projects, /tasks, /board) se retiraron el 2026-08-07 —
// se mantienen aquí solo para que su título siga saliendo si alguien tiene un enlace
// guardado y cae en la redirección.
const OPERACIONES_ROUTES = ["/operaciones", "/overview", "/areas", "/projects", "/tasks", "/board"]

/**
 * Título de sección para el chrome superior (TopBar desktop + MobileHeader),
 * derivado de la ruta. Fuente única para que ambos muestren lo mismo.
 */
export function deriveSectionTitle(pathname: string): string {
  if (pathname === "/perfil" || pathname.startsWith("/perfil/")) return "Perfil"
  if (OPERACIONES_ROUTES.some((r) => pathname === r || pathname.startsWith(r + "/"))) {
    return "Operaciones"
  }
  const match = navAll.find(
    (item) => pathname === item.href || pathname.startsWith(item.href + "/")
  )
  return match?.title ?? "Capital Hub"
}
