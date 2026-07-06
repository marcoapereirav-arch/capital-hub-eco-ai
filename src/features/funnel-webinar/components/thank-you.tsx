"use client"

import { MessageCircle, CheckCircle2, Clock, Bell } from "lucide-react"
import { FUNNEL_WEBINAR } from "../config"

/**
 * Página de Gracias del Funnel Webinar.
 * Brandkit Capital Hub: base monocromo B&W + verde de acento (#22C55E).
 *
 * Hace una sola cosa clara: meter al lead en el grupo de WhatsApp, que es donde se
 * suelta el link del Zoom del directo y los avisos.
 *
 * El link del grupo llega por props desde el server (editable desde el ⚙️ de /webs,
 * key 'funnel:webinar' → whatsapp_group). Si todavía no está puesto, el botón muestra
 * un estado de espera en vez de romper.
 */
type Props = {
  whatsappGroup?: string
  dateLabel?: string
}

export function WebinarThankYou({ whatsappGroup, dateLabel }: Props = {}) {
  const groupUrl = (whatsappGroup || FUNNEL_WEBINAR.WHATSAPP_GROUP_URL).trim()
  const resolvedDate = dateLabel || FUNNEL_WEBINAR.WEBINAR_DATE_LABEL
  const hasGroup = groupUrl.length > 0

  return (
    <main
      className="relative min-h-[100dvh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-0"
        style={{ background: "radial-gradient(640px 360px at 88% -6%, rgba(34,197,94,0.10), transparent 68%)" }}
      />

      <div className="relative z-10 max-w-2xl mx-auto px-5 md:px-8 py-12 md:py-20 flex flex-col min-h-[100dvh]">
        {/* Marca */}
        <div className="mb-12 md:mb-16">
          <span className="text-sm font-semibold uppercase tracking-[0.15em] text-[#F5F6F7]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            Capital Hub
          </span>
        </div>

        <div className="flex-1 flex flex-col justify-center">
          {/* Confirmación */}
          <div className="inline-flex items-center gap-2 mb-5">
            <CheckCircle2 className="h-5 w-5 text-[#22C55E]" />
            <span className="text-[13px] text-[#9CA3AF]">Tu plaza está reservada</span>
          </div>

          <h1
            className="text-3xl md:text-4xl font-medium leading-[1.12] tracking-tight mb-4 text-white"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Falta un último paso: entra al grupo de WhatsApp.
          </h1>
          <p className="text-base md:text-lg text-[#D1D5DB] leading-relaxed mb-10 max-w-xl">
            El webinar es <strong className="text-white">{resolvedDate}</strong>. Dentro del grupo
            soltamos el link del Zoom y todos los avisos para que no te lo pierdas. Entra ahora.
          </p>

          {/* CTA principal: entrar al grupo */}
          {hasGroup ? (
            <a
              href={groupUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="wb-open group relative block w-full max-w-md h-13 px-6 py-3.5 rounded-none bg-white text-[#0F0F12] font-semibold inline-flex items-center justify-center gap-2 overflow-hidden text-base mb-3"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              <span aria-hidden className="wb-open-fill" />
              <MessageCircle className="wb-open-label relative z-10 h-4 w-4" />
              <span className="wb-open-label relative z-10">Entrar al grupo de WhatsApp</span>
            </a>
          ) : (
            <div
              className="w-full max-w-md h-13 px-6 py-3.5 border border-[#3F3F46] bg-[#18181B] text-[#9CA3AF] font-semibold inline-flex items-center justify-center gap-2 text-base mb-3 cursor-default"
              style={{ fontFamily: "'Inter Tight', sans-serif" }}
            >
              <Clock className="h-4 w-4 text-[#22C55E]" />
              <span>El grupo se abre en breve</span>
            </div>
          )}
          <p className="text-[13px] text-[#6B7280] mb-12 max-w-md">
            {hasGroup
              ? "Se abre WhatsApp en una pestaña nueva. Pulsa «Unirse al grupo»."
              : "Te avisaremos por email en cuanto el grupo esté abierto. También lo verás aquí."}
          </p>

          {/* Qué pasa ahora */}
          <div className="border border-[#2A2D34] bg-[#18181B] p-5 md:p-6 max-w-md">
            <p className="text-[13px] text-[#9CA3AF] mb-4">Qué pasa ahora</p>
            <ol className="space-y-3">
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#22C55E] font-semibold shrink-0">1.</span>
                <span>Entras al <strong className="text-white">grupo de WhatsApp</strong> con el botón de arriba.</span>
              </li>
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#22C55E] font-semibold shrink-0">2.</span>
                <span>El día del directo soltamos ahí el <strong className="text-white">link del Zoom</strong>.</span>
              </li>
              <li className="flex gap-3 text-sm text-[#D1D5DB] leading-relaxed">
                <span className="text-[#22C55E] font-semibold shrink-0">3.</span>
                <span className="inline-flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5 text-[#22C55E]" />
                  Te conectas en vivo y descubres tu camino.
                </span>
              </li>
            </ol>
          </div>
        </div>

        <footer className="pt-12 text-[13px] text-[#6B7280]">
          © Capital Hub · Adrián Villanueva
        </footer>
      </div>

      <style>{`
        .wb-open-fill { position:absolute; inset:0; background:#22C55E; transform: scaleX(0); transform-origin:left; transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1); }
        .wb-open:hover .wb-open-fill { transform: scaleX(1); }
        .wb-open-label { transition: color 0.3s ease; }
        .wb-open:hover .wb-open-label { color: #FFFFFF; }
        @media (prefers-reduced-motion: reduce) { .wb-open-fill { transition: none; } }
      `}</style>
    </main>
  )
}
