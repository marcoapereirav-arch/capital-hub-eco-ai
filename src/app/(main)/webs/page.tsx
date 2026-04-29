import { headers } from "next/headers"
import { WebsPage } from "@/features/webs/components/webs-page"
import { listWebsWithSteps } from "@/features/webs/services/webs-service"

export const dynamic = "force-dynamic"

export default async function WebsRoute() {
  const webs = await listWebsWithSteps()

  // Construir baseUrl desde headers (funciona en local y en prod)
  const h = await headers()
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000"
  const proto = h.get("x-forwarded-proto") ?? (host.includes("localhost") ? "http" : "https")
  const publicBaseUrl = `${proto}://${host}`

  return <WebsPage webs={webs} publicBaseUrl={publicBaseUrl} />
}
