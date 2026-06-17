import { ResetCachePage } from "@/features/reset-cache/components/reset-cache-page"

export const dynamic = "force-dynamic"
export const revalidate = 0

export const metadata = {
  title: "Limpiando cache — Capital Hub OS",
  robots: { index: false, follow: false },
}

export default function ResetCacheRoute() {
  return <ResetCachePage />
}
