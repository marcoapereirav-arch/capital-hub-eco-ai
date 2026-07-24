"use client"

import { useEffect, useRef, useState, type ReactNode } from "react"
import Link from "next/link"
import { ArrowDown, ArrowLeft, ArrowRight, AlertTriangle, type LucideIcon } from "lucide-react"
import { useScrollFx, FormacionAtmosphere, FormacionStyles } from "./formacion-fx"

/**
 * Kit visual de la formación IA Integrator.
 *
 * Todas las páginas de formación se montan con estas piezas: misma atmósfera,
 * mismo motion, mismo brandkit. Si una página necesita algo que no está aquí,
 * la pieza se añade al kit, no se improvisa en la página.
 *
 * Reglas del kit (ver skill `formacion-visual`):
 *  - Base monocromo #0F0F12 / #141418 / hairline #2A2D34 + verde #22C55E (iconos #4ADE80).
 *  - Titulares en Inter Tight, cuerpo en Inter, código y diagramas en mono.
 *  - Cero emojis: los avisos usan iconos de lucide.
 *  - Nada de párrafos largos sueltos: el texto se reparte en tarjetas, pasos,
 *    diagramas y avisos.
 */

/* ───────────────────── Shell de página ───────────────────── */

export function FormacionPage({
  label,
  children,
  wide,
}: {
  label: string
  children: ReactNode
  wide?: boolean
}) {
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

      <div className={`relative z-10 mx-auto flex flex-col px-5 md:px-8 ${wide ? "max-w-4xl" : "max-w-3xl"}`}>
        <header className="vc-load flex items-center justify-between pt-7 md:pt-10" style={{ animationDelay: "0ms" }}>
          <Link
            href="/formacion/ia-integrator"
            className="group inline-flex items-center gap-2 text-[13px] text-[#9CA3AF] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Formación IA Integrator
          </Link>
          <span className="hidden items-center gap-2 text-[13px] text-[#9CA3AF] sm:inline-flex">
            <span className="vc-dot" /> {label}
          </span>
        </header>

        {children}

        <PageFooter />
      </div>
    </main>
  )
}

export function PageFooter() {
  return (
    <footer className="flex items-center justify-between border-t border-[#1C1D22] py-7 text-[13px] text-[#6B7280]">
      <span>© Capital Hub · IA Integrator</span>
      <Link href="/formacion/ia-integrator" className="transition-colors hover:text-white">
        Volver a la formación
      </Link>
    </footer>
  )
}

/* ───────────────────── Portada de cada entrenamiento ───────────────────── */

export function Hero({
  eyebrow,
  eyebrowIcon: Icon,
  lines,
  lead,
  sub,
}: {
  eyebrow: string
  eyebrowIcon: LucideIcon
  lines: string[]
  lead: ReactNode
  sub?: ReactNode
}) {
  return (
    <section className="flex min-h-[86dvh] flex-col justify-center py-16">
      <p className="vc-load mb-6 inline-flex items-center gap-2 text-sm text-[#4ADE80]" style={{ animationDelay: "80ms" }}>
        <Icon className="h-4 w-4" /> {eyebrow}
      </p>
      <h1
        className="mb-7 text-[2.7rem] font-medium leading-[1.0] tracking-[-0.03em] text-white md:text-[4.4rem]"
        style={{ fontFamily: "'Inter Tight', sans-serif" }}
      >
        {lines.map((l, i) => (
          <span
            key={l}
            className={i === lines.length - 1 ? "vc-line block text-[#22C55E]" : "vc-line block"}
            style={{ animationDelay: `${180 + i * 140}ms` }}
          >
            {l}
          </span>
        ))}
      </h1>
      <p className="vc-load mb-8 max-w-xl text-lg leading-relaxed text-[#C7CBD1] md:text-xl" style={{ animationDelay: "520ms" }}>
        {lead}
      </p>
      {sub && (
        <p className="vc-load max-w-xl text-base leading-relaxed text-[#7B818C]" style={{ animationDelay: "660ms" }}>
          {sub}
        </p>
      )}
      <div className="vc-load mt-14 inline-flex items-center gap-2 text-[13px] text-[#6B7280]" style={{ animationDelay: "820ms" }}>
        <span className="vc-scrollcue inline-flex">
          <ArrowDown className="h-4 w-4" />
        </span>
        Baja para empezar
      </div>
    </section>
  )
}

/* ───────────────────── Encabezado de sección ───────────────────── */

/** `n` se omite en las secciones sin número (mapas, cierres, resúmenes). */
export function SectionHead({ n, label, id }: { n?: string; label: string; id?: string }) {
  return (
    <div id={id} data-reveal className="vc-reveal flex scroll-mt-24 items-center gap-4 pb-8 pt-2">
      {n ? (
        <span className="text-[13px] font-semibold text-[#22C55E]">{n}</span>
      ) : (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-[#22C55E]" />
      )}
      <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9CA3AF]">{label}</span>
      <div className="h-px flex-1 bg-[#2A2D34]" />
    </div>
  )
}

export function Section({ children, tight }: { children: ReactNode; tight?: boolean }) {
  return <section className={tight ? "pb-12" : "pb-20"}>{children}</section>
}

export function Lead({ children }: { children: ReactNode }) {
  return (
    <h2
      data-reveal
      className="vc-reveal mb-8 max-w-2xl text-2xl font-medium leading-snug tracking-[-0.01em] text-white md:text-[2.2rem]"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      {children}
    </h2>
  )
}

export function Text({ children }: { children: ReactNode }) {
  return (
    <p data-reveal className="vc-reveal mb-6 max-w-2xl text-[16px] leading-relaxed text-[#C7CBD1]">
      {children}
    </p>
  )
}

export function Muted({ children }: { children: ReactNode }) {
  return (
    <p data-reveal className="vc-reveal mt-8 max-w-xl text-[15px] leading-relaxed text-[#7B818C]">
      {children}
    </p>
  )
}

/* ───────────────────── Piezas de contenido ───────────────────── */

export type CardItem = { icon: LucideIcon; t: string; d: ReactNode }

export function Cards({ items, cols = 3 }: { items: CardItem[]; cols?: 2 | 3 }) {
  return (
    <div className={`grid gap-4 ${cols === 2 ? "md:grid-cols-2" : "md:grid-cols-3"}`}>
      {items.map((c, k) => (
        <article
          key={`${c.t}-${k}`}
          data-reveal
          className="vc-card vc-reveal relative overflow-hidden border border-[#2A2D34] bg-[#141418] p-6"
          style={{ transitionDelay: `${k * 80}ms` }}
        >
          <c.icon className="mb-4 h-6 w-6 text-[#4ADE80]" />
          <h3 className="mb-2 text-base font-semibold text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            {c.t}
          </h3>
          <p className="text-[15px] leading-relaxed text-[#9CA3AF]">{c.d}</p>
          <span aria-hidden className="vc-corner" />
        </article>
      ))}
    </div>
  )
}

export function Steps({ items }: { items: { t: ReactNode; d: ReactNode }[] }) {
  return (
    <div className="space-y-3">
      {items.map((s, k) => (
        <div
          key={k}
          data-reveal
          className="vc-reveal flex gap-4 border border-[#1F2126] bg-[#131316] p-5"
          style={{ transitionDelay: `${k * 70}ms` }}
        >
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2A2D34] text-[13px] font-semibold text-[#4ADE80]">
            {k + 1}
          </span>
          <div>
            <h3 className="text-base font-medium text-white">{s.t}</h3>
            <p className="mt-1 text-[15px] leading-relaxed text-[#9CA3AF]">{s.d}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

export function Timeline({ items }: { items: { t: ReactNode; d: ReactNode }[] }) {
  return (
    <ol className="relative space-y-1 border-l border-[#2A2D34] pl-6">
      {items.map((s, i) => (
        <li key={i} data-reveal className="vc-reveal relative py-3" style={{ transitionDelay: `${i * 55}ms` }}>
          <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-[#0F0F12] text-[11px] font-semibold text-[#4ADE80] ring-1 ring-[#2A2D34]">
            {i + 1}
          </span>
          <h3 className="text-base font-medium text-white">{s.t}</h3>
          <p className="mt-0.5 text-[15px] leading-relaxed text-[#9CA3AF]">{s.d}</p>
        </li>
      ))}
    </ol>
  )
}

export function Rules({ items }: { items: { t: ReactNode; d?: ReactNode }[] }) {
  return (
    <div className="space-y-3">
      {items.map((r, i) => (
        <div
          key={i}
          data-reveal
          className="vc-reveal flex items-start gap-4 border-l-2 border-[#22C55E] bg-[#131316] py-4 pl-5"
          style={{ transitionDelay: `${i * 60}ms` }}
        >
          <span className="text-lg font-semibold text-[#22C55E]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            {i + 1}
          </span>
          <div>
            <h3 className="text-base font-medium text-white">{r.t}</h3>
            {r.d && <p className="mt-0.5 text-[15px] leading-relaxed text-[#9CA3AF]">{r.d}</p>}
          </div>
        </div>
      ))}
    </div>
  )
}

/** Aviso duro. Sustituye a los emojis de advertencia del texto original. */
export function Warn({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div
      data-reveal
      className="vc-reveal my-8 flex gap-4 border border-[#3A2F1E] bg-[#17150F] p-5"
    >
      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-[#E5B567]" />
      <div>
        {title && <p className="mb-1 text-base font-medium text-white">{title}</p>}
        <div className="text-[15px] leading-relaxed text-[#C7CBD1]">{children}</div>
      </div>
    </div>
  )
}

/** Cita destacada: la frase que hay que recordar de la sección. */
export function Quote({ children }: { children: ReactNode }) {
  return (
    <blockquote
      data-reveal
      className="vc-reveal my-8 border-l-2 border-[#22C55E] py-1 pl-5 text-lg font-medium leading-snug text-white md:text-xl"
      style={{ fontFamily: "'Inter Tight', sans-serif" }}
    >
      {children}
    </blockquote>
  )
}

export function Chips({ items }: { items: string[] }) {
  return (
    <div data-reveal className="vc-reveal flex flex-wrap gap-2.5">
      {items.map((c, i) => (
        <span
          key={c}
          className="vc-chip border border-[#2A2D34] bg-[#141418] px-4 py-2.5 text-[15px] text-[#F5F6F7]"
          style={{ fontFamily: "var(--font-mono)", transitionDelay: `${i * 70}ms` }}
        >
          {c}
        </span>
      ))}
    </div>
  )
}

/** Tabla de dos columnas (término / definición, tú / la IA, skill / qué hace). */
export function Terms({ head, rows }: { head?: [string, string]; rows: [ReactNode, ReactNode][] }) {
  return (
    <div data-reveal className="vc-reveal overflow-hidden border border-[#2A2D34]">
      {head && (
        <div className="grid grid-cols-[minmax(120px,1fr)_2fr] gap-4 border-b border-[#2A2D34] bg-[#141418] px-5 py-3 text-[12px] font-medium uppercase tracking-[0.1em] text-[#7B818C]">
          <span>{head[0]}</span>
          <span>{head[1]}</span>
        </div>
      )}
      {rows.map((r, i) => (
        <div
          key={i}
          className={`grid grid-cols-[minmax(120px,1fr)_2fr] gap-4 px-5 py-3.5 text-[15px] ${
            i % 2 ? "bg-[#111114]" : "bg-[#0F0F12]"
          }`}
        >
          <span className="font-medium text-white">{r[0]}</span>
          <span className="leading-relaxed text-[#9CA3AF]">{r[1]}</span>
        </div>
      ))}
    </div>
  )
}

/** Comparación a dos caras: mal contra bien, sin sistema contra con sistema. */
export function Split({
  left,
  right,
}: {
  left: { t: string; tone?: "bad"; body: ReactNode }
  right: { t: string; tone?: "good"; body: ReactNode }
}) {
  const cell = "vc-reveal border p-6"
  return (
    <div className="grid gap-4 md:grid-cols-2">
      <div data-reveal className={`${cell} border-[#2A2D34] bg-[#131316]`}>
        <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.1em] text-[#7B818C]">{left.t}</p>
        <div className="space-y-2.5 text-[15px] leading-relaxed text-[#9CA3AF]">{left.body}</div>
      </div>
      <div data-reveal className={`${cell} border-[#24462F] bg-[#101710]`} style={{ transitionDelay: "80ms" }}>
        <p className="mb-3 text-[13px] font-medium uppercase tracking-[0.1em] text-[#4ADE80]">{right.t}</p>
        <div className="space-y-2.5 text-[15px] leading-relaxed text-[#C7CBD1]">{right.body}</div>
      </div>
    </div>
  )
}

/** Bloque de código o de comando. Nunca un muro: dos o tres líneas. */
export function Code({ children, label }: { children: ReactNode; label?: string }) {
  return (
    <div data-reveal className="vc-reveal my-6 border border-[#2A2D34] bg-[#0C0C0F]">
      {label && (
        <div className="border-b border-[#1F2126] px-4 py-2 text-[12px] uppercase tracking-[0.1em] text-[#6B7280]">{label}</div>
      )}
      <pre className="overflow-x-auto px-4 py-4 text-[13.5px] leading-relaxed text-[#C7CBD1]" style={{ fontFamily: "var(--font-mono)" }}>
        {children}
      </pre>
    </div>
  )
}

export function Mono({ children }: { children: ReactNode }) {
  return (
    <code className="rounded-sm bg-[#0C0C0F] px-1.5 py-0.5 text-[0.92em] text-[#4ADE80]" style={{ fontFamily: "var(--font-mono)" }}>
      {children}
    </code>
  )
}

/** Línea de flujo horizontal en mono, para resumir un recorrido. */
export function Flow({ steps, last }: { steps: string[]; last?: string }) {
  return (
    <p data-reveal className="vc-reveal vc-flow mt-6 text-center text-[13px] text-[#6B7280]" style={{ fontFamily: "var(--font-mono)" }}>
      {steps.join("  →  ")}
      {last && (
        <>
          {"  →  "}
          <span className="text-[#4ADE80]">{last}</span>
        </>
      )}
    </p>
  )
}

/* ───────────────────── Diagrama de nodos en línea ───────────────────── */

// Tailwind necesita las clases completas en el código (no interpoladas) para generarlas.
const NODE_COLS: Record<number, string> = { 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }

export function NodeLine({ nodes }: { nodes: { icon: LucideIcon; t: string; d: string }[] }) {
  const n = nodes.length
  const xs = Array.from({ length: n }, (_, i) => 70 + i * (780 / (n - 1)))
  return (
    <div data-reveal className="vc-reveal">
      <svg viewBox="0 0 920 90" className="w-full" role="img" aria-label={nodes.map((x) => x.t).join(", ")}>
        <line x1={xs[0]} y1="45" x2={xs[n - 1]} y2="45" stroke="#2A2D34" strokeWidth="2" />
        <line className="vc-draw" x1={xs[0]} y1="45" x2={xs[n - 1]} y2="45" stroke="#22C55E" strokeWidth="2" pathLength={1} />
        {xs.map((x, i) => (
          <g key={x} className={`vc-node vc-node-${i + 1}`}>
            <circle cx={x} cy="45" r="15" fill="#0F0F12" stroke="#22C55E" strokeWidth="2" />
            <circle cx={x} cy="45" r="5" fill="#4ADE80" />
          </g>
        ))}
      </svg>
      <div className={`mt-6 grid grid-cols-2 gap-4 ${NODE_COLS[n] ?? "md:grid-cols-4"}`}>
        {nodes.map((node, i) => (
          <div key={`${node.t}-${i}`} className={`vc-node vc-node-${i + 1}`}>
            <div className="mb-2 flex items-center gap-2">
              <node.icon className="h-4 w-4 text-[#4ADE80]" />
              <span className="text-[15px] font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>
                {node.t}
              </span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#9CA3AF]">{node.d}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

/** Cadena de cajas con flecha entre ellas. */
export function Chain({ steps }: { steps: { icon: LucideIcon; t: string; d: ReactNode; meta?: string }[] }) {
  return (
    <div data-reveal className="vc-reveal flex flex-col items-stretch gap-3 md:flex-row md:items-center">
      {steps.map((s, i) => (
        <div key={`${s.t}-${i}`} className="contents">
          <div className={`vc-node vc-node-${i + 1} flex-1 border border-[#2A2D34] bg-[#141418] p-5`}>
            <s.icon className="mb-3 h-6 w-6 text-[#4ADE80]" />
            <p className="text-[15px] font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>
              {s.t}
            </p>
            <p className="mt-1 text-[14px] text-[#C7CBD1]">{s.d}</p>
            {s.meta && <p className="mt-1 text-[13px] text-[#7B818C]">{s.meta}</p>}
          </div>
          {i < steps.length - 1 && (
            <span className={`vc-node vc-node-${i + 2} flex items-center justify-center text-[#4ADE80]`}>
              <ArrowRight className="hidden h-5 w-5 md:block" />
              <ArrowDown className="h-5 w-5 md:hidden" />
            </span>
          )}
        </div>
      ))}
    </div>
  )
}

/* ───────────────────── Cierre de página ───────────────────── */

export function Closing({
  kicker,
  title,
  sub,
  cta,
}: {
  kicker: string
  title: ReactNode
  sub?: ReactNode
  cta?: { href: string; label: string }
}) {
  return (
    <section className="pb-24">
      <div
        data-reveal
        className="vc-reveal border border-[#2A2D34] bg-gradient-to-b from-[#141418] to-[#0F0F12] p-8 text-center md:p-12"
      >
        <p className="mb-3 text-sm text-[#9CA3AF]">{kicker}</p>
        <p className="text-2xl font-medium text-white md:text-3xl" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
          {title}
        </p>
        {sub && <p className="mx-auto mt-4 max-w-md text-[15px] leading-relaxed text-[#7B818C]">{sub}</p>}
        {cta && (
          <Link
            href={cta.href}
            className="vc-cta group relative mt-8 inline-flex items-center gap-2 overflow-hidden border border-[#22C55E] px-6 py-3 text-[15px] font-medium"
          >
            <span aria-hidden className="vc-cta-fill" />
            <span className="vc-cta-label relative z-10 text-[#4ADE80]">{cta.label}</span>
            <ArrowRight className="vc-cta-arrow relative z-10 h-4 w-4 text-[#4ADE80] transition-transform group-hover:translate-x-1" />
          </Link>
        )}
      </div>
    </section>
  )
}

/* ───────────────────── Índice lateral (páginas largas) ───────────────────── */

export function Toc({ items }: { items: { id: string; label: string }[] }) {
  const [active, setActive] = useState(items[0]?.id ?? "")

  // Marca la última sección cuyo encabezado ya pasó el tercio superior de la pantalla.
  // Con IntersectionObserver se perdía el activo al saltar de golpe (anclas, teclado).
  useEffect(() => {
    let raf = 0
    function update() {
      const linea = window.innerHeight * 0.34
      let actual = items[0]?.id ?? ""
      for (const i of items) {
        const el = document.getElementById(i.id)
        if (el && el.getBoundingClientRect().top <= linea) actual = i.id
      }
      setActive(actual)
    }
    function onScroll() {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(update)
    }
    update()
    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener("resize", onScroll, { passive: true })
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener("resize", onScroll)
      cancelAnimationFrame(raf)
    }
  }, [items])

  return (
    <nav aria-label="Índice" className="pointer-events-none fixed left-6 top-1/2 z-20 hidden -translate-y-1/2 xl:block">
      <ul className="pointer-events-auto space-y-2.5">
        {items.map((i) => (
          <li key={i.id}>
            <a
              href={`#${i.id}`}
              className={`group flex items-center gap-2.5 text-[12px] transition-colors ${
                active === i.id ? "text-[#4ADE80]" : "text-[#4B5058] hover:text-[#9CA3AF]"
              }`}
            >
              <span
                className={`h-px transition-all ${active === i.id ? "w-6 bg-[#4ADE80]" : "w-3 bg-[#2A2D34] group-hover:w-5"}`}
              />
              {i.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  )
}
