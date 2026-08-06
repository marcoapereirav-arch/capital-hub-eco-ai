import type { ReactNode } from "react"
import { CrmTabsHeader } from "@/features/crm/components/crm-tabs-header"
import { FONT } from "@/features/crm/lib/brand"

/**
 * Layout compartido por las 3 sub-pestanas del CRM:
 * - /crm/contactos (lista)
 * - /crm/pipeline  (kanban con arrastrar y soltar)
 * - /crm/tags      (etiquetas)
 *
 * Las pestanas viven aqui para que sigan visibles al cambiar de sub-pestana y el ancho
 * sea identico en las tres. Sin saltos de layout.
 *
 * EL SCROLL DEL CRM VIVE AQUI, y en un solo sitio. Hasta el 2026-08-06 esta misma caja
 * llevaba `overflow-hidden`, asi que la lista de contactos (2307px con 30 contactos) se
 * recortaba a la altura de la ventana (799px) y NO habia forma de bajar: 1508px de
 * contactos invisibles. El contenedor de fuera si tiene `overflow-y-auto`, pero nunca
 * llegaba a desbordar porque este de aqui ya habia cortado el contenido.
 *
 * Regla que deja: la caja que RECORTA (`overflow-hidden`) y la que DEJA BAJAR
 * (`overflow-y-auto`) no pueden ser la misma. Si una pantalla necesita ocupar el alto
 * exacto sin scroll de pagina (el kanban), pide `h-full` a este hueco; no se recorta aqui.
 */
export default function CrmLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex h-full min-h-0 w-full flex-col bg-[#0F0F12]"
      style={{ fontFamily: FONT }}
    >
      <CrmTabsHeader />
      {/* Unico scroll vertical del CRM. `overscroll-contain` evita que el rebote se
          propague a la pagina. `pb-mobile-nav` reserva el alto de la barra inferior
          de movil (en escritorio es 0) para que la ultima fila no quede debajo. */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden overscroll-contain pb-mobile-nav">
        {children}
      </div>
    </div>
  )
}
