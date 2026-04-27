import {
  LayoutDashboard,
  Link2,
  CheckSquare,
  Globe,
  Users,
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
        title: "Webs",
        href: "/webs",
        icon: Globe,
      },
      {
        title: "CRM",
        href: "/crm",
        icon: Users,
      },
      {
        title: "Integraciones",
        href: "/integrations",
        icon: Link2,
      },
    ],
  },
]
