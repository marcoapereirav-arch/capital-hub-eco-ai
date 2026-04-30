"use client"

import React, { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, Lock, Zap, ShieldCheck, Gift, Loader2 } from "lucide-react"
import CustomCursor from "@/features/public-pages/funnel-lt8/components/CustomCursor"
import Footer from "@/features/public-pages/funnel-lt8/components/Footer"
import "@/features/public-pages/funnel-lt8/styles.css"

const NEXT_STEP = "/mifge/upsell-anual"

type FormErrors = Partial<Record<"full_name" | "email" | "phone" | "rgpd" | "general", string>>

export default function MifgeCheckoutPage() {
  const router = useRouter()
  const [orderBumpAdded, setOrderBumpAdded] = useState(false)
  const [fullName, setFullName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [rgpdAccepted, setRgpdAccepted] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState<FormErrors>({})

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setErrors({})

    // Validación cliente
    const newErrors: FormErrors = {}
    if (fullName.trim().length < 2) newErrors.full_name = "Introduce tu nombre completo"
    if (!/^\S+@\S+\.\S+$/.test(email)) newErrors.email = "Email inválido"
    if (phone.trim().length < 6) newErrors.phone = "Teléfono inválido"
    if (!rgpdAccepted) newErrors.rgpd = "Debes aceptar la política de privacidad"

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch("/api/mifge/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          order_bump_added: orderBumpAdded,
          rgpd_accepted: rgpdAccepted,
          source: "mifge_checkout",
        }),
      })

      const json = await res.json()

      if (!res.ok) {
        if (json.issues) {
          setErrors({
            full_name: json.issues.full_name?.[0],
            email: json.issues.email?.[0],
            phone: json.issues.phone?.[0],
            rgpd: json.issues.rgpd_accepted?.[0],
            general: "Revisa los campos marcados",
          })
        } else {
          setErrors({ general: json.error ?? "No se pudo procesar el formulario" })
        }
        setSubmitting(false)
        return
      }

      // TODO: cuando Whop esté integrado, en lugar de router.push directo:
      //   redirigir a Whop hosted checkout con lead_id en metadata.
      // Por ahora seguimos al siguiente step del funnel (upsell-anual).
      router.push(`${NEXT_STEP}?lead_id=${json.lead_id}`)
    } catch (e) {
      console.error(e)
      setErrors({ general: "Error de red. Inténtalo de nuevo." })
      setSubmitting(false)
    }
  }

  return (
    <div className="funnel-lt8-root relative min-h-screen bg-[#0F0F12] text-white overflow-x-hidden">
      <CustomCursor />
      <div className="fixed inset-0 z-[-1] overflow-hidden pointer-events-none bg-[url('https://www.orfeoai.com/wp-content/themes/orfeoai/images/noise.png')] opacity-[0.02]"></div>

      {/* HEADER */}
      <header className="sticky top-0 z-50 bg-[#0F0F12]/95 backdrop-blur-sm border-b border-[#2A2D34] py-4">
        <div className="container mx-auto px-6 flex flex-col md:flex-row md:justify-between items-center gap-4">
          <div className="font-serif text-base font-medium tracking-[0.15em] text-white">CAPITAL HUB</div>
          <div className="flex flex-col md:items-end gap-1">
            <span className="text-[10px] text-[#9CA3AF] uppercase tracking-wide">PRUEBA GRATIS · NO SE COBRA NADA HOY</span>
          </div>
        </div>
      </header>

      {/* TITLE */}
      <section className="py-12 md:py-16 text-center">
        <div className="container mx-auto px-6">
          <h1 className="checkout-h1 uppercase">
            <span className="weight-light">EMPIEZA HOY</span>
            <br />
            <span className="weight-bold">14 DÍAS GRATIS</span>
          </h1>
          <p className="font-light text-[#9CA3AF] text-sm md:text-base max-w-xl mx-auto">
            Sin compromiso. Sin cargos hoy. Cancela cuando quieras antes del día 15.
          </p>
        </div>
      </section>

      {/* CHECKOUT CARD */}
      <section className="container mx-auto px-6">
        <div className="checkout-card">
          <div className="text-center mb-8 pb-6 border-b border-[#2A2D34]">
            <h3 className="font-serif text-xl text-white uppercase mb-2">Activa tu prueba gratuita</h3>
            <div className="flex items-center justify-center gap-2 text-xs text-[#9CA3AF]">
              <Lock size={12} />
              <span>Información protegida con encriptación bancaria.</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col gap-3" noValidate>
            <div>
              <input
                type="text"
                className="form-input"
                placeholder="Nombre completo"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                disabled={submitting}
                required
              />
              {errors.full_name && <p className="text-red-400 text-xs mt-1 px-1">{errors.full_name}</p>}
            </div>

            <div>
              <input
                type="email"
                className="form-input"
                placeholder="Correo electrónico"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={submitting}
                required
              />
              {errors.email && <p className="text-red-400 text-xs mt-1 px-1">{errors.email}</p>}
            </div>

            <div>
              <input
                type="tel"
                className="form-input"
                placeholder="Número de teléfono"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={submitting}
                required
              />
              {errors.phone && <p className="text-red-400 text-xs mt-1 px-1">{errors.phone}</p>}
            </div>

            {/* ORDER BUMP — Bonus Bundle Express */}
            <label
              className={`mt-4 flex gap-3 p-4 border-2 cursor-pointer transition-colors rounded-[2px] ${
                orderBumpAdded ? "border-[#37ca37] bg-[#37ca37]/5" : "border-dashed border-[#2A2D34] bg-[#0F0F12]"
              }`}
            >
              <input
                type="checkbox"
                checked={orderBumpAdded}
                onChange={(e) => setOrderBumpAdded(e.target.checked)}
                disabled={submitting}
                className="mt-1 h-4 w-4 accent-[#37ca37]"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Gift size={14} className="text-[#37ca37]" />
                  <span className="font-mono text-xs uppercase text-[#37ca37] tracking-wide">SOLO 20€ · NO SE VENDE POR SEPARADO</span>
                </div>
                <p className="text-white font-semibold text-sm mb-2">Bonus Bundle Express — Acelerador 7 días</p>
                <p className="text-[#9CA3AF] text-xs leading-relaxed mb-3">
                  Empieza más rápido y con más herramientas. Incluye:
                </p>
                <ul className="space-y-1.5 text-[11px] text-[#D1D5DB]">
                  <li className="flex items-start gap-2"><Check size={11} className="text-[#37ca37] mt-0.5 flex-shrink-0" /><span>3 masterclasses VIP (no en el catálogo público)</span></li>
                  <li className="flex items-start gap-2"><Check size={11} className="text-[#37ca37] mt-0.5 flex-shrink-0" /><span>Plantilla CV optimizada para trabajo remoto</span></li>
                  <li className="flex items-start gap-2"><Check size={11} className="text-[#37ca37] mt-0.5 flex-shrink-0" /><span>Plan personalizado acelerado de 7 días</span></li>
                  <li className="flex items-start gap-2"><Check size={11} className="text-[#37ca37] mt-0.5 flex-shrink-0" /><span>Acceso a la sesión Q&A semanal de pago</span></li>
                </ul>
                <p className="text-[#6B7280] text-[10px] mt-3 font-mono uppercase">Se cobran los 20€ HOY (única vez). Independiente del free trial.</p>
              </div>
            </label>

            {/* RGPD */}
            <label className="flex gap-2 mt-2 cursor-pointer">
              <input
                type="checkbox"
                checked={rgpdAccepted}
                onChange={(e) => setRgpdAccepted(e.target.checked)}
                disabled={submitting}
                className="mt-1 h-3.5 w-3.5 accent-[#37ca37] flex-shrink-0"
              />
              <span className="text-[11px] text-[#9CA3AF] leading-relaxed">
                Acepto la política de privacidad y el tratamiento de mis datos para activar la prueba.
                Consulta nuestra <a href="/legal/privacidad" target="_blank" rel="noopener" className="underline hover:text-white">política de privacidad</a>.
              </span>
            </label>
            {errors.rgpd && <p className="text-red-400 text-xs px-1">{errors.rgpd}</p>}

            {errors.general && (
              <div className="mt-2 p-3 border border-red-500/40 bg-red-500/10 rounded-[2px]">
                <p className="text-red-300 text-xs">{errors.general}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="btn-green mt-4 w-full py-4 font-mono uppercase text-xs tracking-wider rounded-[2px] flex items-center justify-center gap-3 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {submitting ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  PROCESANDO...
                </>
              ) : (
                <>
                  EMPEZAR MI PRUEBA GRATUITA {orderBumpAdded && "(+ BONUS 20€)"}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M7 7h10v10" /><path d="M7 17 17 7" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-[11px] text-[#4B5563] leading-relaxed mb-4 max-w-sm mx-auto">
              Hoy no se te cobra nada. El día 15, si no cancelas, se activa tu membresía a 97€/mes. Cancela 1-click cuando quieras.
            </p>
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="bg-[#111113] border-t border-[#2A2D34] py-16">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center md:text-left">
            {[
              { icon: <Lock size={24} />, title: "PAGO SEGURO", desc: "Encriptación bancaria." },
              { icon: <Zap size={24} />, title: "ACCESO INMEDIATO", desc: "En menos de 60 segundos." },
              { icon: <Check size={24} />, title: "0€ HOY", desc: "Empiezas sin pagar nada." },
              { icon: <ShieldCheck size={24} />, title: "CANCELA 1-CLICK", desc: "Sin permanencia." },
            ].map((s, i) => (
              <div key={i} className="flex flex-col gap-2 items-center md:items-start opacity-90">
                <div className="text-white opacity-80">{s.icon}</div>
                <div className="font-serif text-xs text-white uppercase mt-2">{s.title}</div>
                <div className="text-xs text-[#9CA3AF]">{s.desc}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </div>
  )
}
