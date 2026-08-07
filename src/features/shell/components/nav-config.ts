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
  Rocket,
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
      { title: "Operaciones", href: "/overview", icon: FolderKanban },
      { title: "Knowledge", href: "/knowledge", icon: BookOpen },
      { title: "Tutoriales", href: "/tutoriales", icon: GraduationCap },
      { title: "Equipo", href: "/team", icon: Shield },
    ],
  },
  {
    label: "Marketing",
    items: [
      { title: "CRM", href: "/crm", icon: Users, mobilePrimary: true },
      { title: "Calendario", href: "/calendario", icon: CalendarCheck },
      { title: "Email Marketing", href: "/email-marketing", icon: Mail },
      { title: "Webs", href: "/webs", icon: Globe },
      { title: "Sistema visual", href: "/sistemas", icon: LayoutDashboard },
      { title: "Automatizaciones", href: "/automatizaciones", icon: Zap },
      { title: "Ads", href: "/ads", icon: Megaphone, mobilePrimary: true },
      // Afiliados salió de dentro de Ads (2026-07-31): son fuentes de tráfico de
      // personas, no configuración de anuncios. Ver SOP marketing/09.
      { title: "Afiliados", href: "/afiliados", icon: Users },
      { title: "Content Intel", href: "/content-intel", icon: Radar },
      { title: "Instagram", href: "/instagram", icon: Camera, mobilePrimary: true },
      { title: "ManyChat", href: "/manychat", icon: MessageSquare },
    ],
  },
  {
    label: "Producto",
    items: [
      { title: "Invitaciones App", href: "/invitaciones", icon: Mail },
      { title: "Integraciones", href: "/integrations", icon: Link2 },
      { title: "Misión", href: "/mision", icon: Rocket },
    ],
  },
  // Ventas y Finanzas — pendientes de rutas. Se añaden secciones aquí cuando existan.
]

export const navAll = navSections.flatMap((s) => s.items)
/**
 * Las cuatro secciones de la barra de abajo del telefono, EN ESTE ORDEN.
 *
 * Marco, 2026-08-08: *"las secciones mas importantes son: Dashboard, CRM, Ads e
 * Instagram. El Dashboard tiene que ser el principal y despues poner el boton de
 * mas para poder ver las demas"*.
 *
 * El orden lo manda esta lista, NO el orden del menu lateral: en una app nativa
 * lo primero de la barra es lo que mas se usa, y eso no tiene por que coincidir
 * con como estan agrupadas las secciones en el escritorio.
 */
const ORDEN_BARRA_MOVIL = ["/dashboard", "/crm", "/ads", "/instagram"]

export const navPrimary = navAll
  .filter((i) => i.mobilePrimary)
  .sort((a, b) => ORDEN_BARRA_MOVIL.indexOf(a.href) - ORDEN_BARRA_MOVIL.indexOf(b.href))
export const navSecondary = navAll.filter((i) => !i.mobilePrimary)

// Subrutas que comparten el entorno "Operaciones" (mismo layout con subtabs).
// El sidebar las agrupa bajo "Operaciones" (/overview), pero cada una tiene su
// propia ruta — sin esto, el título de la TopBar caía al fallback "Capital Hub".
const OPERACIONES_ROUTES = ["/overview", "/areas", "/projects", "/tasks", "/board"]

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
