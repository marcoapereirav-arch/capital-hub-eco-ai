import { AdsPage } from "@/features/ads/components/ads-page"

export const dynamic = "force-dynamic"

function maskMiddle(s: string | undefined): string | null {
  if (!s) return null
  if (s.length <= 8) return s
  return `${s.slice(0, 4)}…${s.slice(-4)}`
}

export default function AdsRoute() {
  return (
    <AdsPage
      pixelIdMasked={process.env.META_PIXEL_ID ?? null}
      capiTokenMasked={maskMiddle(process.env.META_CAPI_TOKEN)}
      adAccountId={process.env.META_AD_ACCOUNT_ID ?? null}
      hasTestEventCode={!!process.env.META_TEST_EVENT_CODE}
    />
  )
}
