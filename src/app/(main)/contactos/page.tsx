import { redirect } from "next/navigation"

// Compat con bookmarks viejos: /contactos → /crm/contactos
export default function ContactosLegacyRedirect() {
  redirect("/crm/contactos")
}
