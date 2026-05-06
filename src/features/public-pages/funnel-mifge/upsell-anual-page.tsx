"use client"

import React, { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertTriangle, Check, ArrowUpRight, Loader2 } from "lucide-react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import { track } from "@/lib/meta/pixel-client"
import "@/features/public-pages/funnel-lt8/styles.css"

const NEXT_STEP = "/mifge/agenda"

export default function MifgeUpsellAnualPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptId, setReceiptId] = useState<string | null>(null)
  const [email, setEmail] = useState<string | null>(null)

  // Recoge receipt_id (rid) y email (e) del query string que pasa el checkout
  useEffect(() => {
    setReceiptId(searchParams.get("rid"))
    setEmail(searchParams.get("e"))
  }, [searchParams])

  async function handleAccept() {
    setError(null)

    // Si no tenemos receipt_id, NO podemos hacer one-click → fallback al hosted
    if (!receiptId) {
      const fallback = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_ANO
      if (fallback) {
        window.location.href = fallback
      } else {
        router.push(NEXT_STEP)
      }
      return
    }

    setProcessing(true)
    try {
      const res = await fetch("/api/mifge/upsell-anual/charge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          receipt_id: receiptId,
          email: email ?? undefined,
        }),
      })
      const data = await res.json()

      if (res.ok && data.ok) {
        // Pixel + CAPI Purchase 970EUR (el webhook tambien lo dispara, pero
        // este client-side mejora attribution match en Meta)
        track({
          event: "mifge_upsell_anual_one_click",
          standardEvent: "Purchase",
          email: email ?? undefined,
          value: 970,
          currency: "EUR",
          contentName: "CAPITAL HUB AÑO (one-click upsell)",
          custom: { payment_id: data.payment_id },
        }).catch(() => {})

        // Mini delay para que el webhook tenga tiempo de procesar antes del agenda
        setTimeout(() => router.push(NEXT_STEP), 800)
        return
      }

      // Fallo: si Whop nos da fallback_url, redirigimos al checkout hosted
      if (data.fallback_url) {
        window.location.href = data.fallback_url
        return
      }

      setError(data.error ?? "No pudimos procesar el cobro. Intenta de nuevo.")
      setProcessing(false)
    } catch (e) {
      console.error("[upsell-anual] fetch error", e)
      const fallback = process.env.NEXT_PUBLIC_WHOP_CHECKOUT_URL_ANO
      if (fallback) {
        window.location.href = fallback
        return
      }
      setError("Error de conexión. Intenta de nuevo.")
      setProcessing(false)
    }
  }

  function handleDecline() {
    router.push(NEXT_STEP)
  }

  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <CustomCursor />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      {/* WARNING STICKY ARRIBA */}
      <div className="sticky top-0 z-50 bg-amber-500 text-black py-3 text-center">
        <div className="container mx-auto px-4 flex items-center justify-center gap-2 text-xs md:text-sm font-semibold">
          <AlertTriangle size={16} className="flex-shrink-0" />
          <span className="uppercase tracking-wide">NO CIERRES ESTA PESTAÑA — TU CONFIRMACIÓN SE PROCESA EN 60s</span>
        </div>
      </div>

      <main className="py-16 md:py-24">
        <div className="container mx-auto px-6 max-w-3xl">

          {/* Header */}
          <div className="text-center mb-12">
            <span className="font-mono text-xs text-[#37ca37] uppercase tracking-widest border border-[#37ca37]/30 px-3 py-1 rounded-[2px] mb-6 inline-block">
              ESPERA — UNA OPORTUNIDAD ÚNICA
            </span>
            <h1 className="font-serif text-3xl md:text-5xl lg:text-6xl leading-tight uppercase mb-6">
              <span className="weight-light">Antes de continuar...</span>
              <br />
              <span className="weight-bold">¿Quieres ahorrar 194€?</span>
            </h1>
            <p className="text-[#9CA3AF] text-base md:text-lg max-w-xl mx-auto leading-relaxed">
              Cambia ahora a Plan Anual y consigue <span className="text-white font-semibold">2 meses gratis</span> + features exclusivos.
              <br />
              <span className="text-[#6B7280] text-sm">Esta oferta solo aparece una vez. Si la pasas, no la verás más.</span>
            </p>
          </div>

          {/* CARD CON PRECIO */}
          <div className="border border-[#37ca37]/40 bg-gradient-to-br from-[#0F0F12] to-[#37ca37]/5 rounded-[4px] p-8 md:p-12 mb-10">
            <div className="text-center mb-8">
              <p className="font-mono text-[#6B7280] text-sm uppercase mb-4">PLAN ANUAL CAPITAL HUB</p>
              <div className="flex items-baseline justify-center gap-3 mb-2">
                <span className="text-[#6B7280] text-2xl line-through font-mono">1.164€</span>
                <span className="font-serif text-6xl md:text-7xl text-white">970€</span>
                <span className="text-[#9CA3AF] text-sm">/año</span>
              </div>
              <p className="text-[#37ca37] font-semibold text-sm uppercase tracking-wide">Ahorras 194€ — 2 meses gratis</p>
            </div>

            <ul className="space-y-3 mb-8 max-w-md mx-auto">
              {[
                "Todo el acceso del plan mensual",
                "2 meses gratis (sale a 81€/mes)",
                "Sesiones grupales en directo cada semana",
                "Acceso prioritario a las nuevas formaciones",
                "Comunidad anual privada",
                "Garantía de devolución 30 días",
              ].map((line, i) => (
                <li key={i} className="flex gap-3 items-start">
                  <Check size={16} className="text-[#37ca37] mt-0.5 flex-shrink-0" />
                  <span className="text-[#D1D5DB] text-sm md:text-base">{line}</span>
                </li>
              ))}
            </ul>

            {/* BOTÓN SÍ — enorme */}
            <button
              onClick={handleAccept}
              disabled={processing}
              className="btn-green w-full py-5 font-mono uppercase text-sm md:text-base tracking-wider rounded-[2px] flex items-center justify-center gap-3 mb-2 disabled:opacity-60 disabled:cursor-wait"
            >
              {processing ? (
                <>
                  <Loader2 size={20} className="animate-spin" />
                  COBRANDO 970€ A TU TARJETA…
                </>
              ) : (
                <>
                  SÍ, QUIERO AHORRAR 194€ Y CAMBIAR A ANUAL
                  <ArrowUpRight size={20} />
                </>
              )}
            </button>

            {/* Hint one-click discreto */}
            {receiptId && !processing && (
              <p className="text-center text-[#37ca37]/70 text-[10px] font-mono uppercase tracking-wider mb-4">
                Pago en 1 click · usa la tarjeta que acabas de meter
              </p>
            )}

            {error && (
              <p className="text-center text-red-400 text-xs mb-4">
                {error}
              </p>
            )}

            {/* BOTÓN NO — pequeño y discreto */}
            <button
              onClick={handleDecline}
              disabled={processing}
              className="block mx-auto text-[#4B5563] text-xs underline underline-offset-4 hover:text-[#6B7280] transition-colors disabled:opacity-30"
            >
              no gracias, prefiero pagar mes a mes
            </button>
          </div>

          {/* TRUST DISCRETO */}
          <p className="text-center text-[#4B5563] font-mono text-xs">
            Pago único anual · Acceso completo · Cancela en cualquier momento si no te convence (garantía 30 días)
          </p>
        </div>
      </main>
    </div>
  )
}
