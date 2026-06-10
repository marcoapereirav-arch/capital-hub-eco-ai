import { redirect } from "next/navigation"

// /crm sin sub-ruta → enviar a /crm/contactos por defecto
export default function CrmIndex() {
  redirect("/crm/contactos")
}
