"use client"

import { useRef } from "react"
import Link from "next/link"
import {
  ArrowLeft, ArrowRight, ArrowDown, Sparkles, MessageSquareText, Eye, RefreshCw,
  Terminal, Laptop, GitBranch, Cloud, Globe, Save, Upload, GitMerge, Check,
} from "lucide-react"
import { useScrollFx, FormacionAtmosphere, FormacionStyles } from "./formacion-fx"

/**
 * Manual 1 de la formación IA Integrator — "Vibe Coding al grano" en versión visual.
 * Contenido 1:1 de docs/sops/producto/ia-integrator/01-vibecoding-al-grano.md,
 * ahora como página-scroll animada dentro del brandkit (ver PRP-006).
 */
export function VibeCodingAlGrano() {
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

      <div className="relative z-10 mx-auto flex max-w-3xl flex-col px-5 md:px-8">
        {/* Marca / volver */}
        <header className="vc-load flex items-center justify-between pt-7 md:pt-10" style={{ animationDelay: "0ms" }}>
          <Link
            href="/formacion/ia-integrator"
            className="group inline-flex items-center gap-2 text-[13px] text-[#9CA3AF] transition-colors hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
            Formación IA Integrator
          </Link>
          <span className="hidden items-center gap-2 text-[13px] text-[#9CA3AF] sm:inline-flex">
            <span className="vc-dot" /> Manual 1 · Al grano
          </span>
        </header>

        {/* ───────── HERO ───────── */}
        <section className="flex min-h-[86dvh] flex-col justify-center py-16">
          <p className="vc-load mb-6 inline-flex items-center gap-2 text-sm text-[#4ADE80]" style={{ animationDelay: "80ms" }}>
            <Sparkles className="h-4 w-4" /> Construye software hablando con una IA
          </p>
          <h1
            className="mb-7 text-[3rem] font-medium leading-[0.98] tracking-[-0.03em] text-white md:text-[5rem]"
            style={{ fontFamily: "'Inter Tight', sans-serif" }}
          >
            <span className="vc-line" style={{ animationDelay: "180ms" }}>Vibe</span>
            <span className="vc-line block text-[#22C55E]" style={{ animationDelay: "320ms" }}>Coding</span>
          </h1>
          <p className="vc-load mb-8 max-w-xl text-lg leading-relaxed text-[#C7CBD1] md:text-xl" style={{ animationDelay: "500ms" }}>
            Tú dices <span className="font-medium text-white">qué</span> quieres. La IA escribe el código, lo
            prueba y lo deja funcionando. Tu trabajo es <span className="font-medium text-white">dirigir, mirar y aprobar</span>.
          </p>
          <p className="vc-load text-base text-[#7B818C]" style={{ animationDelay: "640ms" }}>
            Como el director de una película: tú no manejas la cámara — decides la escena.
          </p>
          <div className="vc-load mt-14 inline-flex items-center gap-2 text-[13px] text-[#6B7280]" style={{ animationDelay: "820ms" }}>
            <span className="vc-scrollcue inline-flex"><ArrowDown className="h-4 w-4" /></span> Baja para empezar
          </div>
        </section>

        {/* ───────── 1 · QUÉ ES ───────── */}
        <SectionHead n="01" label="Qué es esto" />
        <section className="pb-20">
          <h2 data-reveal className="vc-reveal mb-8 max-w-2xl text-2xl font-medium leading-snug tracking-[-0.01em] text-white md:text-[2.4rem]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
            No escribes el código. Se lo dices a la IA — y ella lo escribe por ti.
          </h2>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { i: MessageSquareText, t: "Tú hablas", d: "Le dices lo que quieres, como quien escribe por chat. En lenguaje normal." },
              { i: Terminal, t: "Ella construye", d: "Escribe el código, lo prueba, y lo deja funcionando. No tocas una línea." },
              { i: Check, t: "Tú apruebas", d: "Miras el resultado y dices \"así sí\" o \"cámbialo\". Ese es tu trabajo." },
            ].map((c, k) => (
              <article key={c.t} data-reveal className="vc-card vc-reveal relative overflow-hidden border border-[#2A2D34] bg-[#141418] p-6" style={{ transitionDelay: `${k * 80}ms` }}>
                <c.i className="mb-4 h-6 w-6 text-[#4ADE80]" />
                <h3 className="mb-2 text-base font-semibold text-white" style={{ fontFamily: "'Inter Tight', sans-serif" }}>{c.t}</h3>
                <p className="text-[15px] leading-relaxed text-[#9CA3AF]">{c.d}</p>
                <span aria-hidden className="vc-corner" />
              </article>
            ))}
          </div>
          <p data-reveal className="vc-reveal mt-8 max-w-xl text-[15px] leading-relaxed text-[#7B818C]">
            No necesitas saber programar. Necesitas saber <span className="text-[#C7CBD1]">qué decir y en qué orden</span> — es lo que aprendes aquí.
          </p>
        </section>

        {/* ───────── 2 · POR DÓNDE EMPIEZAS ───────── */}
        <SectionHead n="02" label="Por dónde empiezas" />
        <section className="pb-20">
          <div className="space-y-3">
            {[
              { k: "Abre un chat con la IA", d: "Es escribir, sin más." },
              { k: "Escribe /primer", d: "Con eso la IA lee tu proyecto entero y sabe dónde está cada cosa. Cada chat empieza en blanco: primer le da la memoria." , mono: true },
              { k: "Ya está lista", d: "A partir de aquí le hablas normal." },
            ].map((s, k) => (
              <div key={s.k} data-reveal className="vc-reveal flex gap-4 border border-[#1F2126] bg-[#131316] p-5" style={{ transitionDelay: `${k * 70}ms` }}>
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[#2A2D34] text-[13px] font-semibold text-[#4ADE80]">{k + 1}</span>
                <div>
                  <h3 className="text-base font-medium text-white">
                    {s.mono ? <>Escribe <code className="rounded-sm bg-[#0F0F12] px-1.5 py-0.5 text-[#4ADE80]" style={{ fontFamily: "var(--font-mono)" }}>/primer</code></> : s.k}
                  </h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-[#9CA3AF]">{s.d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── 3 · LOS 4 LUGARES (diagrama) ───────── */}
        <SectionHead n="03" label="Los 4 sitios donde vive tu trabajo" />
        <section className="pb-20">
          <div data-reveal className="vc-reveal">
            <Pipeline4Lugares />
          </div>
          <p data-reveal className="vc-reveal mx-auto mt-8 max-w-xl text-center text-[15px] leading-relaxed text-[#7B818C]">
            La lógica de fondo: todo se construye y se prueba <span className="text-[#C7CBD1]">primero en tu ordenador</span> → solo
            cuando está bien sube a <code className="text-[#4ADE80]" style={{ fontFamily: "var(--font-mono)" }}>main</code> → y eso se publica solo.
            Así <span className="text-[#C7CBD1]">nunca tocas la web real hasta estar seguro</span>.
          </p>
        </section>

        {/* ───────── 4 · EL FLUJO DE UNA SESIÓN ───────── */}
        <SectionHead n="04" label="El flujo de una sesión" />
        <section className="pb-20">
          <ol className="relative space-y-1 border-l border-[#2A2D34] pl-6">
            {[
              ["Escribes /primer", "La IA coge contexto. Sin esto trabaja a ciegas."],
              ["Dices tu idea", "\"Quiero que…\" — describes el destino, no el camino."],
              ["La IA propone un plan", "Decide sola si va directo a main o en una rama. Tú apruebas."],
              ["La IA construye", "En tu ordenador (localhost). Nadie lo ve todavía."],
              ["Lo ves en tu navegador", "Lo pruebas con tus manos. Eres el último filtro."],
              ["Pides cambios", "Se pule en vueltas cortas hasta que esté bien."],
              ["Dices \"publícalo\"", "Llega a main → se publica solo → live para todos."],
            ].map(([k, d], i) => (
              <li key={k} data-reveal className="vc-reveal relative py-3" style={{ transitionDelay: `${i * 55}ms` }}>
                <span className="absolute -left-[31px] flex h-5 w-5 items-center justify-center rounded-full bg-[#0F0F12] text-[11px] font-semibold text-[#4ADE80] ring-1 ring-[#2A2D34]">{i + 1}</span>
                <h3 className="text-base font-medium text-white">{k}</h3>
                <p className="mt-0.5 text-[15px] leading-relaxed text-[#9CA3AF]">{d}</p>
              </li>
            ))}
          </ol>
        </section>

        {/* ───────── 5 · ¿DIRECTO O RAMA? (diagrama) ───────── */}
        <SectionHead n="05" label="¿Directo o en una rama?" />
        <section className="pb-20">
          <p data-reveal className="vc-reveal mb-8 max-w-xl text-[15px] leading-relaxed text-[#C7CBD1]">
            No lo decides tú — lo decide la IA con tu idea. Pero esta es la regla que sigue:
          </p>
          <div data-reveal className="vc-reveal"><MainVsRama /></div>
          <div className="mt-8 grid gap-4 md:grid-cols-2">
            <div data-reveal className="vc-reveal border border-[#1F2126] bg-[#131316] p-5">
              <p className="text-base font-medium text-white">Pequeño y seguro</p>
              <p className="mt-1 text-[15px] text-[#9CA3AF]">Un texto, un color, un bug simple → <span className="text-[#4ADE80]">directo a main</span>. Aislarlo sobra.</p>
            </div>
            <div data-reveal className="vc-reveal border border-[#1F2126] bg-[#131316] p-5" style={{ transitionDelay: "80ms" }}>
              <p className="text-base font-medium text-white">Grande o delicado</p>
              <p className="mt-1 text-[15px] text-[#9CA3AF]">Una función nueva, pagos, login → <span className="text-[#4ADE80]">primero una rama</span>. Si falla, main sigue intacto.</p>
            </div>
          </div>
        </section>

        {/* ───────── 6 · GUARDAR Y PUBLICAR (diagrama) ───────── */}
        <SectionHead n="06" label="Guardar y publicar" />
        <section className="pb-20">
          <p data-reveal className="vc-reveal mb-8 max-w-xl text-[15px] leading-relaxed text-[#C7CBD1]">
            Por debajo pasan tres cosas. Tú <span className="text-white">no dices estas palabras</span>: dices
            <span className="text-[#4ADE80]"> "publícalo"</span> y la IA hace la secuencia sola.
          </p>
          <div data-reveal className="vc-reveal"><CommitFlow /></div>
        </section>

        {/* ───────── 7 · TU VOCABULARIO ───────── */}
        <SectionHead n="07" label="Todo tu vocabulario" />
        <section className="pb-20">
          <div data-reveal className="vc-reveal flex flex-wrap gap-2.5">
            {["/primer", "\"quiero que…\"", "\"cambia esto\"", "\"publícalo\"", "\"tíralo\"", "\"ciérralo\""].map((c, i) => (
              <span key={c} className="vc-chip border border-[#2A2D34] bg-[#141418] px-4 py-2.5 text-[15px] text-[#F5F6F7]" style={{ fontFamily: "var(--font-mono)", transitionDelay: `${i * 70}ms` }}>{c}</span>
            ))}
          </div>
          <p data-reveal className="vc-reveal mt-6 text-[15px] text-[#7B818C]">Esto es lo único que dices. El resto lo hace la IA.</p>
        </section>

        {/* ───────── 8 · LAS 3 REGLAS ───────── */}
        <SectionHead n="08" label="3 reglas que no se saltan" />
        <section className="pb-16">
          <div className="space-y-3">
            {[
              ["primer siempre, al empezar", "Sin contexto, la IA se inventa cosas."],
              ["No des nada por bueno hasta verlo tú en local", "Tú eres el último control."],
              ["No está terminado hasta que está live", "Tu ordenador no es tu web real."],
            ].map(([k, d], i) => (
              <div key={k} data-reveal className="vc-reveal flex items-start gap-4 border-l-2 border-[#22C55E] bg-[#131316] py-4 pl-5" style={{ transitionDelay: `${i * 70}ms` }}>
                <span className="text-lg font-semibold text-[#22C55E]" style={{ fontFamily: "'Inter Tight', sans-serif" }}>{i + 1}</span>
                <div>
                  <h3 className="text-base font-medium text-white">{k}</h3>
                  <p className="mt-0.5 text-[15px] text-[#9CA3AF]">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ───────── CIERRE ───────── */}
        <section className="pb-24">
          <div data-reveal className="vc-reveal border border-[#2A2D34] bg-gradient-to-b from-[#141418] to-[#0F0F12] p-8 text-center md:p-12">
            <p className="mb-3 text-sm text-[#9CA3AF]">¿Listo para empezar?</p>
            <p className="text-2xl font-medium text-white md:text-3xl" style={{ fontFamily: "'Inter Tight', sans-serif" }}>
              Abre un chat y escribe <code className="text-[#4ADE80]" style={{ fontFamily: "var(--font-mono)" }}>/primer</code>.
            </p>
            <p className="mx-auto mt-4 max-w-md text-[15px] text-[#7B818C]">Todo lo demás — el plan, el código, publicar — lo dirige la IA. Tú decides el destino.</p>
          </div>
        </section>

        <footer className="flex items-center justify-between border-t border-[#1C1D22] py-7 text-[13px] text-[#6B7280]">
          <span>© Capital Hub · IA Integrator</span>
          <Link href="/formacion/ia-integrator" className="transition-colors hover:text-white">Volver a la formación</Link>
        </footer>
      </div>
    </main>
  )
}

/* ───────────────────── Encabezado de sección ───────────────────── */
function SectionHead({ n, label }: { n: string; label: string }) {
  return (
    <div data-reveal className="vc-reveal flex items-center gap-4 pb-8">
      <span className="text-[13px] text-[#6B7280]">
        <span className="font-semibold text-[#22C55E]">{n}</span>
      </span>
      <span className="text-[13px] font-medium uppercase tracking-[0.12em] text-[#9CA3AF]">{label}</span>
      <div className="h-px flex-1 bg-[#2A2D34]" />
    </div>
  )
}

/* ───────────────────── Diagrama: los 4 lugares ───────────────────── */
function Pipeline4Lugares() {
  const nodes = [
    { i: Laptop, t: "localhost", d: "Tu web dentro de tu ordenador. Solo la ves tú. El ensayo." },
    { i: GitBranch, t: "rama", d: "Copia aparte para algo grande, sin tocar lo que funciona." },
    { i: Cloud, t: "main", d: "La versión oficial, en la nube. Solo entra lo que está listo." },
    { i: Globe, t: "producción", d: "Tu web pública. Se publica sola al llegar a main." },
  ]
  return (
    <div>
      <svg viewBox="0 0 920 90" className="w-full" role="img" aria-label="Viaje de un cambio: localhost, rama, main, producción">
        <line x1="70" y1="45" x2="850" y2="45" stroke="#2A2D34" strokeWidth="2" />
        <line className="vc-draw" x1="70" y1="45" x2="850" y2="45" stroke="#22C55E" strokeWidth="2" pathLength={1} />
        {[70, 330, 590, 850].map((x, i) => (
          <g key={x} className={`vc-node vc-node-${i + 1}`}>
            <circle cx={x} cy="45" r="15" fill="#0F0F12" stroke="#22C55E" strokeWidth="2" />
            <circle cx={x} cy="45" r="5" fill="#4ADE80" />
          </g>
        ))}
      </svg>
      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
        {nodes.map((n, i) => (
          <div key={n.t} className={`vc-node vc-node-${i + 1}`}>
            <div className="mb-2 flex items-center gap-2">
              <n.i className="h-4 w-4 text-[#4ADE80]" />
              <span className="text-[15px] font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>{n.t}</span>
            </div>
            <p className="text-[13px] leading-relaxed text-[#9CA3AF]">{n.d}</p>
          </div>
        ))}
      </div>
      <p className="vc-flow mt-6 text-center text-[13px] text-[#6B7280]" style={{ fontFamily: "var(--font-mono)" }}>
        idea → localhost → [rama] → main → producción → <span className="text-[#4ADE80]">live</span>
      </p>
    </div>
  )
}

/* ───────────────────── Diagrama: main vs rama ───────────────────── */
function MainVsRama() {
  return (
    <svg viewBox="0 0 920 170" className="w-full" role="img" aria-label="main con un desvío (rama) que se vuelve a unir (merge)">
      {/* main */}
      <line x1="40" y1="120" x2="880" y2="120" stroke="#2A2D34" strokeWidth="2" />
      <line className="vc-draw" x1="40" y1="120" x2="880" y2="120" stroke="#22C55E" strokeWidth="2" pathLength={1} />
      {/* rama (desvío) */}
      <path d="M300 120 C 360 120 360 55 430 55 L 560 55 C 630 55 630 120 690 120" fill="none" stroke="#2A2D34" strokeWidth="2" />
      <path className="vc-draw" d="M300 120 C 360 120 360 55 430 55 L 560 55 C 630 55 630 120 690 120" fill="none" stroke="#4ADE80" strokeWidth="2" strokeDasharray="1" pathLength={1} style={{ transitionDelay: "0.4s" }} />
      {/* nodos */}
      {[[40, 120], [300, 120], [690, 120], [880, 120]].map(([x, y], i) => (
        <circle key={i} className={`vc-node vc-node-${i + 1}`} cx={x} cy={y} r="7" fill="#0F0F12" stroke="#22C55E" strokeWidth="2" />
      ))}
      {[[430, 55], [560, 55]].map(([x, y], i) => (
        <circle key={`b${i}`} className="vc-node vc-node-3" cx={x} cy={y} r="6" fill="#0F0F12" stroke="#4ADE80" strokeWidth="2" />
      ))}
      <text x="40" y="150" fill="#9CA3AF" fontSize="15" fontFamily="var(--font-mono)">main</text>
      <text x="470" y="38" fill="#4ADE80" fontSize="14" fontFamily="var(--font-mono)" textAnchor="middle">rama</text>
      <text x="700" y="150" fill="#4ADE80" fontSize="14" fontFamily="var(--font-mono)">merge ✓</text>
    </svg>
  )
}

/* ───────────────────── Diagrama: commit → push → merge ───────────────────── */
function CommitFlow() {
  const steps = [
    { i: Save, t: "commit", d: "Guardar una versión.", meta: "cerrar el sobre" },
    { i: Upload, t: "push", d: "Subirla a la nube.", meta: "echarlo al buzón" },
    { i: GitMerge, t: "merge", d: "Unir la rama a main.", meta: "solo si hubo rama" },
  ]
  return (
    <div className="flex flex-col items-stretch gap-3 md:flex-row md:items-center">
      {steps.map((s, i) => (
        <div key={s.t} className="contents">
          <div className={`vc-node vc-node-${i + 1} flex-1 border border-[#2A2D34] bg-[#141418] p-5`}>
            <s.i className="mb-3 h-6 w-6 text-[#4ADE80]" />
            <p className="text-[15px] font-semibold text-white" style={{ fontFamily: "var(--font-mono)" }}>{s.t}</p>
            <p className="mt-1 text-[14px] text-[#C7CBD1]">{s.d}</p>
            <p className="mt-1 text-[13px] text-[#7B818C]">{s.meta}</p>
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
