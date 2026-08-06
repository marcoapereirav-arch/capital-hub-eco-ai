"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Users, Layers, Tag as TagIcon } from "lucide-react"
import { cn } from "@/lib/utils"

/**
 * Header del CRM con las 3 sub-pestañas.
 * Visible siempre que el path empiece con /crm.
 *
 * En telefono es una tira deslizable a ancho completo (receta 3 de la ley de
 * pantalla): cada pestaña mide 44 puntos de alto para que se acierte con el dedo,
 * y la tira se sale de los margenes del shell para que se entienda que hay mas
 * pestañas a la derecha.
 */
export function CrmTabsHeader() {
  const pathname = usePathname()
  const inContactos = pathname.startsWith("/crm/contactos")
  const inPipeline = pathname.startsWith("/crm/pipeline")
  const inTags = pathname.startsWith("/crm/tags")

  // La gestion multi-pipeline vive como DRAWER dentro del propio entorno de Pipeline,
  // no como pestana separada. El boton de Configurar lo dispara desde PipelineSelector.

  return (
    <>
      <div className="shrink-0 border-b border-border bg-background">
        <div className="flex snap-x gap-1 overflow-x-auto px-4 md:overflow-visible md:px-6">
          <TabLink href="/crm/contactos" active={inContactos} icon={Users} label="Contactos" />
          <TabLink href="/crm/pipeline" active={inPipeline} icon={Layers} label="Pipeline" />
          <TabLink href="/crm/tags" active={inTags} icon={TagIcon} label="Tags" />
        </div>
      </div>
    </>
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
