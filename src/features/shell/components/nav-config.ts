import {
  LayoutDashboard,
  Link2,
  BarChart3,
  FileText,
  Megaphone,
  Users,
  Settings,
  CheckSquare,
} from "lucide-react"
import type { NavSection } from "../types/navigation"

export const navSections: NavSection[] = [
  {
    label: "Principal",
    items: [
      {
        title: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
      },
      {
        title: "Tareas",
        href: "/tasks",
        icon: CheckSquare,
      },
      {
        title: "Integraciones",
        href: "/integrations",
        icon: Link2,
        badge: "Soon",
      },
    ],
  },
  {
    label: "Modulos",
    items: [
      {
        title: "Metricas",
        href: "/metrics",
        icon: BarChart3,
        badge: "Soon",
      },
      {
        title: "Contenido",
        href: "/content",
        icon: FileText,
        badge: "Soon",
      },
      {
        title: "Ads",
        href: "/ads",
        icon: Megaphone,
        badge: "Soon",
      },
      {
        title: "CRM",
        href: "/crm",
        icon: Users,
        badge: "Soon",
      },
    ],
  },
  {
    label: "Sistema",
    items: [
      {
        title: "Ajustes",
        href: "/settings",
        icon: Settings,
      },
    ],
  },
]
