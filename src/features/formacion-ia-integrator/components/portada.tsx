"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, Zap, BookOpen, Users } from "lucide-react"
import { useScrollFx, FormacionAtmosphere, FormacionStyles } from "./formacion-fx"

/**
 * Portada de la formación IA Integrator: índice visual de los 3 entrenamientos.
 * Contenido fuente: docs/sops/producto/ia-integrator/.
 */
const ENTRENAMIENTOS = [
  {
    n: "01",
    slug: "entrenamiento-1",
    icon: Zap,
    title: "Cómo funciona todo",
    desc: "Qué es cada cosa por dentro: frontend, backend, el viaje de tu código, las claves y la regla de oro.",
    meta: "El más largo. Empieza por aquí.",
  },
  {
    n: "02",
    slug: "entrenamiento-2",
    icon: BookOpen,
    title: "Cómo usar el sistema",
    desc: "Lo que haces tú cada día: abrir sesión, decir tu objetivo, aprobar el plan, revisar, publicar y cerrar.",
    meta: "El día a día.",
  },
  {
    n: "03",
    slug: "entrenamiento-3",
    icon: Users,
    title: "Trabajar en equipo",
    desc: "Meter a alguien nuevo, el reparto por zonas, los conflictos y las reglas que evitan que os piséis.",
    meta: "Solo si sois varios.",
  },
]

export function FormacionPortada() {
  const rootRef = useRef<HTMLElement>(null)
  useScrollFx(rootRef)

  return (
    <main
      ref={rootRef}
      className="vc-root relative min-h-[100dvh] overflow-hidden text-[#F5F6F7]"
      style={{ backgroundColor: "#0F0F12", fontFamily: "'Inter', sans-serif" }}
    >
      <FormacionStyles />
      <FormacionAtmosphere />

      <div className="relative z-10 mx-auto flex min-h-[100dvh] max-w-4xl flex-col px-5 md:px-8">
        <header className="vc-load flex items-center justify-between pt-7 md:pt-10" style={{ animationDelay: "0ms" }}>
          <span
            className="text-sm font-semibold uppercase tracking-[0.14em] text-[#F5F6F7]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            Capital Hub
          </span>
          <span className="inline-flex items-center gap-2 text-[13px] text-[#9CA3AF]">
            <span className="vc-dot" /> Formación
          </span>
        </header>

        <section className="py-16 md:py-24">
          <p className="vc-load mb-6 inline-flex items-center gap-2 text-sm text-[#4ADE80]" style={{ animationDelay: "80ms" }}>
            <Sparkles className="h-4 w-4" /> IA Integrator
          </p>
          <h1
            className="mb-6 max-w-3xl text-[2.6rem] font-medium leading-[1.02] tracking-[-0.03em] text-white md:text-[4rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            <span className="vc-line" style={{ animationDelay: "180ms" }}>
              Aprende a construir
            </span>
            <span className="vc-line block text-[#22C55E]" style={{ animationDelay: "320ms" }}>
              hablándole a una IA.
            </span>
          </h1>
          <p className="vc-load max-w-xl text-lg leading-relaxed text-[#C7CBD1]" style={{ animationDelay: "500ms" }}>
            Tres entrenamientos, en este orden. El primero explica cómo funciona, el segundo qué haces tú cada día, y el
            tercero solo lo necesitas si vais a ser varios.
          </p>
          <p className="vc-load mt-4 max-w-xl text-base leading-relaxed text-[#7B818C]" style={{ animationDelay: "620ms" }}>
            No vas a escribir código en ningún momento.
          </p>
        </section>

        <section className="grid flex-1 gap-4 pb-24 md:grid-cols-3">
          {ENTRENAMIENTOS.map((m, i) => {
            const Icon = m.icon
            return (
              <Link
                key={m.slug}
                href={`/formacion/ia-integrator/${m.slug}`}
                data-reveal
                className="vc-card vc-reveal group relative flex min-h-[260px] flex-col justify-between overflow-hidden border border-[#2A2D34] bg-[#141418] p-6"
                style={{ transitionDelay: `${i * 90}ms` }}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <Icon className="h-6 w-6 text-[#4ADE80]" />
                    <span className="font-mono text-[11px] uppercase tracking-wide text-[#6B7280]">
                      Entrenamiento {m.n}
                    </span>
                  </div>
                  <div className="mt-8">
                    <h2 className="text-lg font-semibold text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
                      {m.title}
                    </h2>
                    <p className="mt-2 text-[14px] leading-relaxed text-[#9CA3AF]">{m.desc}</p>
                  </div>
                </div>
                <div className="mt-6">
                  <p className="mb-3 text-[13px] text-[#6B7280]">{m.meta}</p>
                  <span className="inline-flex items-center gap-1.5 text-[14px] font-medium text-[#4ADE80]">
                    Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                </div>
                <span aria-hidden className="vc-corner" />
              </Link>
            )
          })}
        </section>

        <footer className="mt-auto flex items-center justify-between border-t border-[#1C1D22] py-7 text-[13px] text-[#6B7280]">
          <span>© Capital Hub · IA Integrator</span>
          <span>Adrián Villanueva</span>
        </footer>
      </div>
    </main>
  )
}
