import type { ReactNode } from "react"
import { CrmTabsHeader } from "@/features/crm/components/crm-tabs-header"

/**
 * Layout compartido entre las 3 sub-pestañas del CRM:
 * - /crm/contactos (lista)
 * - /crm/pipeline  (kanban)
 * - /crm/tags      (etiquetas)
 *
 * El header con tabs vive aquí para que se mantenga visible al cambiar de sub-pestaña
 * y el ancho del contenedor sea idéntico en todas. Sin layout shift.
 *
 * El area de contenido lleva su PROPIO desplazamiento vertical: antes era
 * `overflow-hidden`, asi que en un telefono la lista de contactos se cortaba por
 * abajo y no habia forma de llegar al final. El horizontal sigue recortado para
 * que ninguna pieza ancha arrastre la pagina entera de lado.
 */
export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <CrmTabsHeader />
      <div className="no-overscroll min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        {children}
      </div>
    </div>
  )
}
