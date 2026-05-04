import {
  LayoutDashboard,
  Link2,
  CheckSquare,
  Globe,
  Users,
  Radar,
  Network,
  BookOpen,
  Megaphone,
} from "lucide-react"
import type { NavSection } from "../types/navigation"

export const navSections: NavSection[] = [
  {
    label: "Principal",
    items: [
      { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard, mobilePrimary: true },
      { title: "Tareas", href: "/tasks", icon: CheckSquare, mobilePrimary: true },
      { title: "Board", href: "/board", icon: Network, mobilePrimary: true },
      { title: "Knowledge", href: "/knowledge", icon: BookOpen, mobilePrimary: true },
      { title: "Webs", href: "/webs", icon: Globe },
      { title: "CRM", href: "/crm", icon: Users },
      { title: "Ads", href: "/ads", icon: Megaphone },
      { title: "Content Intel", href: "/content-intel", icon: Radar },
      { title: "Integraciones", href: "/integrations", icon: Link2 },
    ],
  },
]

export const navAll = navSections.flatMap((s) => s.items)
export const navPrimary = navAll.filter((i) => i.mobilePrimary)
export const navSecondary = navAll.filter((i) => !i.mobilePrimary)
