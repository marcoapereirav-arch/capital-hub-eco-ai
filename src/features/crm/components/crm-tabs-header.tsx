"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Layers, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Las 3 sub-pestanas del CRM. El titulo "CRM" ya lo pinta la barra superior global
 * (<TopBar>), asi que aqui NO se repite: ver `docs/sops/producto/47`.
 *
 * En telefono es una tira deslizable a ancho completo (receta 3 de la ley de
 * pantalla): cada pestana mide 44 puntos de alto para que se acierte con el dedo,
 * y la tira se desliza para que se entienda que hay mas pestanas a la derecha.
 *
 * Diseno: tokens del tema, nunca colores a mano. La pestana activa lleva el
 * subrayado verde de marca (`border-primary`, que es el #22C55E del brandkit) y es
 * el unico acento. Antes iba en blanco solido con mono en mayusculas espaciadas,
 * que es el diseno antiguo.
 *
 * La gestion multi-pipeline vive como DRAWER dentro del propio entorno de Pipeline,
 * no como pestana separada. El boton de Configurar lo dispara desde PipelineSelector.
 */
export function CrmTabsHeader() {
  const pathname = usePathname()

  return (
    <div className="shrink-0 border-b border-border bg-background">
      <div className="flex snap-x gap-1 overflow-x-auto px-4 md:overflow-visible md:px-6">
        <TabLink
          href="/crm/contactos"
          active={pathname.startsWith("/crm/contactos")}
          icon={Users}
          label="Contactos"
        />
        <TabLink
          href="/crm/pipeline"
          active={pathname.startsWith("/crm/pipeline")}
          icon={Layers}
          label="Pipeline"
        />
        <TabLink
          href="/crm/tags"
          active={pathname.startsWith("/crm/tags")}
          icon={TagIcon}
          label="Etiquetas"
        />
      </div>
    </div>
  )
}

function TabLink({
  href,
  active,
  icon: Icon,
  label,
}: {
  href: string
  active: boolean
  icon: typeof Users
  label: string
}) {
  return (
    <Link
      href={href}
      aria-current={active ? "page" : undefined}
      className={cn(
        // Sin `-mb-px`: al declarar overflow-x el navegador calcula overflow-y como
        // auto, y ese margen negativo dejaba la tira con 1 punto de desplazamiento
        // vertical (el subrayado verde se veia a la mitad y la tira se movia sola).
        "inline-flex h-11 shrink-0 snap-start items-center gap-2 border-b-2 px-3 text-[15px] whitespace-nowrap transition-colors md:h-10 md:text-sm",
        active
          ? "border-primary font-semibold text-foreground"
          : "border-transparent text-muted-foreground md:hover:text-foreground"
      )}
    >
      <Icon className="h-4 w-4" />
      {label}
    </Link>
  )
}
