import { redirect } from "next/navigation"

/**
 * "Sistema visual" se movió a su propia sección: /sistemas (hub de sistemas).
 * Antes vivía aquí (/webs/sistema), por eso el OS lo agrupaba bajo Webs. Se redirige
 * para no romper enlaces antiguos. Los sistemas viven ahora en el hub /sistemas.
 */
export default function SistemaVisualLegacyRedirect() {
  redirect("/sistemas")
}
