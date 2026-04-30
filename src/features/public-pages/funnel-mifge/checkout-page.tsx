"use client"

import React, { useEffect } from "react"
import { Loader2 } from "lucide-react"
import "@/features/public-pages/funnel-lt8/styles.css"

/**
 * MVP del checkout: NO somos nosotros el form. Whop es el checkout.
 * Esta página es solo una transición rápida (loader breve) que redirige al hosted
 * checkout de Whop del producto MES (free trial 14d).
 *
 * Cuando el usuario regrese del checkout, Whop dispara el webhook a /api/whop/webhook
 * y nosotros redirigimos al lead a /mifge/upsell-anual desde el success_url de Whop.
 */
export default function MifgeCheckoutPage() {
  useEffect(() => {
    const url = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_MES
    if (!url) {
      // En dev / si falta env: fallback al siguiente step para no romper el flow.
      window.location.href = "/mifge/upsell-anual"
      return
    }
    window.location.href = url
  }, [])

  return (
    <div className="funnel-lt8-root fixed inset-0 bg-[#0F0F12] z-50 flex items-center justify-center text-white px-6 text-center">
      <div className="flex flex-col items-center gap-4 max-w-full">
        <Loader2 className="h-8 w-8 animate-spin text-white/70" />
        <p className="font-mono text-xs uppercase tracking-widest text-white/70">
          Redirigiendo al checkout seguro…
        </p>
      </div>
    </div>
  )
}
