import type { ReactNode } from "react"
import { CrmTabsHeader } from "@/features/crm/components/crm-tabs-header"

/**
 * Layout compartido entre las 2 sub-pestañas del CRM:
 * - /crm/contactos (lista estilo GHL)
 * - /crm/pipeline  (kanban con drag-drop)
 *
 * El header con tabs vive aquí para que se mantenga visible al cambiar de sub-pestaña
 * y el ancho del contenedor sea idéntico en ambas. Sin layout shift.
 */
export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-full min-h-0 w-full flex-col">
      <CrmTabsHeader />
      <div className="flex-1 min-h-0 overflow-hidden">
        {children}
      </div>
    </div>
  )
}
