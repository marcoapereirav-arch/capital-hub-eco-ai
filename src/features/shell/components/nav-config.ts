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
  FolderKanban,
  CalendarCheck,
  Shield,
  Mail,
  Zap,
  GraduationCap,
  ClipboardList,
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
      { title: "Operaciones", href: "/operaciones", icon: FolderKanban },
      { title: "Knowledge", href: "/knowledge", icon: BookOpen },
      { title: "Tutoriales", href: "/tutoriales", icon: GraduationCap },
      { title: "Equipo", href: "/team", icon: Shield },
    ],
  },
  {
    label: "Marketing",
    items: [
      /* Apunta a /crm/contactos, NO a /crm.
      Medido el 2026-08-08: /crm solo hace un desvio a /crm/contactos, pero el
      marco del OS (quien eres, que puedes ver) se ejecuta ENTERO dos veces, una
      para el desvio y otra para el destino. El desvio solo costaba 746 ms antes
      de que empezara a cargar la pagina buena. */
      { title: "CRM", href: "/crm/contactos", icon: Users, mobilePrimary: true },
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
    // Ventas ya tiene su primera ruta: el historial del parte diario. Hasta hoy la
    // seccion existia en el Knowledge pero no en el menu.
    label: "Ventas",
    items: [{ title: "Actividad", href: "/actividad", icon: ClipboardList }],
  },
  {
    label: "Producto",
    items: [
      { title: "Invitaciones App", href: "/invitaciones", icon: Mail },
      { title: "Integraciones", href: "/integrations", icon: Link2 },
    ],
  },
  // Finanzas — pendiente de rutas. Se añade la sección aquí cuando existan.
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
const ORDEN_BARRA_MOVIL = ["/dashboard", "/crm/contactos", "/ads", "/instagram"]

export const navPrimary = navAll
  .filter((i) => i.mobilePrimary)
  .sort((a, b) => ORDEN_BARRA_MOVIL.indexOf(a.href) - ORDEN_BARRA_MOVIL.indexOf(b.href))
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
