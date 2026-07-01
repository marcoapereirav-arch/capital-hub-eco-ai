"use client"

import { useRef } from "react"
import Link from "next/link"
import { ArrowRight, Sparkles, BookOpen, GitBranch, Lock } from "lucide-react"
import { useScrollFx, FormacionAtmosphere, FormacionStyles } from "./formacion-fx"

/**
 * Portada de la formación IA Integrator: índice visual de los 3 manuales.
 * Manual 1 activo; 2 y 3 en "próximamente" hasta construirse (PRP-006, fases B y C).
 */
const MANUALES = [
  { n: "01", slug: "vibe-coding", icon: Sparkles, title: "Vibe Coding — al grano", desc: "El método entero en una pasada: construir software hablándole a una IA.", ready: true },
  { n: "02", slug: "vibe-coding-completo", icon: BookOpen, title: "Vibe Coding — el método completo", desc: "La versión larga, paso a paso, con ejemplos y chuletas.", ready: false },
  { n: "03", slug: "git", icon: GitBranch, title: "Git explicado sin tecnicismos", desc: "Commit, push, merge y ramas — el 'por debajo', sin líos.", ready: false },
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
          <span className="text-sm font-semibold uppercase tracking-[0.14em] text-[#F5F6F7]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
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
          <h1 className="mb-6 max-w-3xl text-[2.6rem] font-medium leading-[1.02] tracking-[-0.03em] text-white md:text-[4rem]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            <span className="vc-line" style={{ animationDelay: "180ms" }}>Aprende a construir</span>
            <span className="vc-line block text-[#22C55E]" style={{ animationDelay: "320ms" }}>hablándole a una IA.</span>
          </h1>
          <p className="vc-load max-w-xl text-lg leading-relaxed text-[#C7CBD1]" style={{ animationDelay: "500ms" }}>
            Los manuales de la formación, en versión visual. Elige uno y baja: cada concepto se explica
            con ejemplos y se ve funcionando.
          </p>
        </section>

        <section className="grid flex-1 gap-4 pb-24 md:grid-cols-3">
          {MANUALES.map((m, i) => {
            const Icon = m.icon
            const inner = (
              <>
                <div className="flex items-center justify-between">
                  <Icon className={`h-6 w-6 ${m.ready ? "text-[#4ADE80]" : "text-[#4B5058]"}`} />
                  {m.ready
                    ? <span className="font-mono text-[11px] uppercase tracking-wide text-[#6B7280]">Manual {m.n}</span>
                    : <span className="inline-flex items-center gap-1 font-mono text-[11px] uppercase tracking-wide text-[#6B7280]"><Lock className="h-3 w-3" /> Pronto</span>}
                </div>
                <div className="mt-8">
                  <h2 className={`text-lg font-semibold ${m.ready ? "text-white" : "text-[#8B9098]"}`} style={{ fontFamily: "'Inter Tight', sans-serif" }}>{m.title}</h2>
                  <p className="mt-2 text-[14px] leading-relaxed text-[#9CA3AF]">{m.desc}</p>
                </div>
                {m.ready && (
                  <span className="mt-6 inline-flex items-center gap-1.5 text-[14px] font-medium text-[#4ADE80]">
                    Abrir <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </span>
                )}
              </>
            )
            const base = "vc-reveal flex flex-col justify-between border p-6 min-h-[220px]"
            return m.ready ? (
              <Link key={m.slug} href={`/formacion/ia-integrator/${m.slug}`} data-reveal className={`vc-card group ${base} border-[#2A2D34] bg-[#141418]`} style={{ transitionDelay: `${i * 90}ms` }}>
                {inner}
              </Link>
            ) : (
              <div key={m.slug} data-reveal className={`${base} cursor-not-allowed border-[#1C1D22] bg-[#101013]`} style={{ transitionDelay: `${i * 90}ms` }} aria-disabled>
                {inner}
              </div>
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
