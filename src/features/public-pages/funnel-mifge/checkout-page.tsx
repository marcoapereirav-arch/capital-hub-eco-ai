"use client"

import React, { useState, useCallback, useRef, useEffect } from "react"
import { WhopCheckoutEmbed } from "@whop/checkout/react"
import { Check, Shield, Clock, Sparkles } from "lucide-react"
import { track } from "@/lib/meta/pixel-client"
import "@/features/public-pages/funnel-lt8/styles.css"

const PLAN_ID_MES = process.env.NEXT_PUBLIC_WHOP_PLAN_ID_MES ?? ""
const RETURN_URL =
  typeof window !== "undefined"
    ? `${window.location.origin}/mifge/upsell-anual`
    : "https://ecoai.capitalhubapp.com/mifge/upsell-anual"

/**
 * /mifge/checkout
 * Embedded Whop checkout dentro de nuestra propia UI.
 * - Izquierda: detalles del producto + checkbox order bump (19EUR) + trust signals
 * - Derecha: el embed real de Whop (iframe seguro)
 *
 * Cuando el embed dispara onComplete:
 * 1. Pixel + CAPI Purchase con eventID compartido
 * 2. Si bumpAdded -> POST /api/mifge/bump/charge con receiptId (cobra 19EUR a la
 *    tarjeta recien guardada via Whop API)
 * 3. Redirect a /mifge/upsell-anual
 */
export default function MifgeCheckoutPage() {
  const [bumpAdded, setBumpAdded] = useState(false)
  const [email, setEmail] = useState<string>("")
  const [processing, setProcessing] = useState(false)
  const bumpAddedRef = useRef(bumpAdded)
  const emailRef = useRef(email)

  useEffect(() => {
    bumpAddedRef.current = bumpAdded
  }, [bumpAdded])
  useEffect(() => {
    emailRef.current = email
  }, [email])

  const handleComplete = useCallback(async (_planId: string, receiptId?: string) => {
    setProcessing(true)
    try {
      // 1. Pixel + CAPI: free trial activado (StartTrial estándar Meta)
      track({
        event: "mifge_checkout_completed",
        standardEvent: "StartTrial",
        email: emailRef.current || undefined,
        contentName: "CAPITAL HUB MES — Free Trial 14d",
        custom: { receipt_id: receiptId, bump_added: bumpAddedRef.current },
      }).catch(() => {})

      // 2. Si marco bump, cobrar inmediatamente via API (cargo separado a la
      //    tarjeta recien guardada). El webhook payment.succeeded confirmara.
      if (bumpAddedRef.current && receiptId) {
        try {
          await fetch("/api/mifge/bump/charge", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              receipt_id: receiptId,
              email: emailRef.current || undefined,
            }),
          })
          track({
            event: "mifge_order_bump_attempted",
            email: emailRef.current || undefined,
            value: 19,
            currency: "EUR",
            contentName: "CAPITAL HUB BONUS",
          }).catch(() => {})
        } catch (e) {
          console.error("[checkout] bump charge fallo (silent)", e)
        }
      }
    } finally {
      // 3. Redirect al upsell anual sea como sea
      window.location.href = "/mifge/upsell-anual"
    }
  }, [])

  if (!PLAN_ID_MES) {
    return (
      <div className="funnel-lt8-root min-h-screen bg-[#0F0F12] text-white flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          <p className="font-mono text-xs uppercase tracking-widest text-red-400 mb-2">
            Configuración pendiente
          </p>
          <p className="text-white/70 text-sm">
            Falta NEXT_PUBLIC_WHOP_PLAN_ID_MES en envvars.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="funnel-lt8-root min-h-screen bg-[#0F0F12] text-white">
      {/* Header minimal */}
      <header className="border-b border-[#2A2D34] py-4 px-6">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-[#37CA37] animate-pulse" />
            <span className="font-mono text-[10px] uppercase tracking-widest text-white/70">
              Checkout seguro · Capital Hub
            </span>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono text-white/50 uppercase tracking-wider">
            <Shield size={12} /> SSL · pago cifrado
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 md:py-12">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_minmax(380px,440px)] gap-8 lg:gap-12">
          {/* IZQUIERDA: detalles + bump */}
          <div className="space-y-6">
            <div>
              <span className="font-mono text-[10px] uppercase tracking-widest text-[#37CA37] border border-[#37CA37]/30 px-2 py-1 rounded-[2px]">
                14 DÍAS GRATIS
              </span>
              <h1 className="text-2xl md:text-4xl uppercase font-bold mt-4 leading-tight">
                CAPITAL HUB <span className="text-white/60">MES</span>
              </h1>
              <p className="text-white/70 mt-3 text-sm md:text-base">
                Empieza GRATIS hoy. Si no es para ti, cancelas en 1 click antes del día 14 y no pagas nada.
              </p>
            </div>

            {/* Lo que incluye */}
            <div className="border border-[#2A2D34] rounded-[4px] p-5 bg-[#16161B]">
              <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-3">
                LO QUE INCLUYE
              </p>
              <ul className="space-y-2.5 text-sm">
                {[
                  "Acceso completo a la plataforma Capital Hub",
                  "Plan personalizado para tu primer trabajo remoto",
                  "Comunidad privada + soporte directo",
                  "Plantillas, frameworks y casos reales",
                  "1 llamada de diagnóstico con Adrián (20 min)",
                ].map((item, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-white/80">
                    <Check size={14} className="text-[#37CA37] mt-0.5 flex-shrink-0" />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* ORDER BUMP — destaca pero no agresivo */}
            <label
              className={`block border-2 rounded-[4px] p-5 cursor-pointer transition-all ${
                bumpAdded
                  ? "border-[#37CA37] bg-[#37CA37]/[0.07]"
                  : "border-amber-500/40 bg-amber-500/[0.04] hover:border-amber-500/70"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`mt-1 w-5 h-5 rounded-[3px] border-2 flex-shrink-0 flex items-center justify-center transition-all ${
                    bumpAdded ? "bg-[#37CA37] border-[#37CA37]" : "border-white/40"
                  }`}
                >
                  {bumpAdded && <Check size={14} className="text-black" />}
                </div>
                <input
                  type="checkbox"
                  checked={bumpAdded}
                  onChange={(e) => setBumpAdded(e.target.checked)}
                  className="sr-only"
                />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1.5">
                    <Sparkles size={14} className="text-amber-400" />
                    <span className="font-mono text-[10px] uppercase tracking-widest text-amber-400">
                      OFERTA ÚNICA · SOLO AHORA
                    </span>
                  </div>
                  <p className="text-base md:text-lg font-bold text-white leading-tight mb-1">
                    Añade Bonus Bundle Express por solo <span className="text-[#37CA37]">19€</span>
                  </p>
                  <p className="text-xs text-white/60 leading-relaxed">
                    Auditoría 1-a-1 de tu CV + plantilla LinkedIn que está consiguiendo entrevistas + 50 mensajes pre-escritos para cazar empresas. Pago único, lo tienes para siempre.
                  </p>
                  <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider mt-2">
                    Precio normal 89€ · solo si lo añades ahora
                  </p>
                </div>
              </div>
            </label>

            {/* Trust signals */}
            <div className="grid grid-cols-3 gap-3 pt-2">
              <div className="flex flex-col items-center text-center gap-1.5">
                <Shield size={16} className="text-white/50" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                  Pago cifrado
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <Clock size={16} className="text-white/50" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                  Cancela en 1 click
                </span>
              </div>
              <div className="flex flex-col items-center text-center gap-1.5">
                <Check size={16} className="text-white/50" />
                <span className="font-mono text-[9px] uppercase tracking-wider text-white/50">
                  Garantía 30d
                </span>
              </div>
            </div>
          </div>

          {/* DERECHA: el embed Whop */}
          <div className="lg:sticky lg:top-8 self-start">
            <div className="border border-[#2A2D34] rounded-[4px] bg-[#16161B] p-4 md:p-5">
              {processing && (
                <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center rounded-[4px]">
                  <p className="font-mono text-xs uppercase tracking-widest text-white">
                    Procesando…
                  </p>
                </div>
              )}
              <WhopCheckoutEmbed
                planId={PLAN_ID_MES}
                theme="dark"
                themeOptions={{ accentColor: "green" }}
                returnUrl={RETURN_URL}
                setupFutureUsage="off_session"
                onComplete={handleComplete}
                onIdentityCaptured={(data) => {
                  if (data.email) setEmail(data.email)
                }}
                fallback={
                  <div className="py-12 text-center font-mono text-xs uppercase tracking-widest text-white/50">
                    Cargando checkout seguro…
                  </div>
                }
              />
            </div>
            <p className="text-[10px] font-mono text-white/40 uppercase tracking-wider text-center mt-3">
              Procesado por Whop · sin pago hasta el día 15
            </p>
          </div>
        </div>
      </main>
    </div>
  )
}
