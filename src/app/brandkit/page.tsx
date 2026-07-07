"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"

/**
 * BRANDKIT BOARD — Capital Hub · Identity System v4 «El Dojo»
 *
 * Preview interna (localhost:3000/brandkit) del nuevo rumbo de marca.
 * Evolución del v3 Monochrome Matte: monocromo + verde #22C55E, pero con
 * CONTRASTE real: paneles de carbón (#0F0F12) contra paneles de papel cálido
 * (#F4F1E8), el "gi blanco + cinturón negro" del dojo. El lenguaje de
 * cinturones (blanco→negro, verde en el centro) y el marcador de rotulador
 * son motifs — sutiles, mate, nunca disfraz.
 *
 * TIPOGRAFÍA: UNA sola familia en toda la página, Inter Tight, en todo su
 * rango de pesos (400→900, incl. Black). La jerarquía se hace con PESO +
 * tamaño, no con fuentes distintas. El tracking ancho es EXCLUSIVO del logo
 * "CAPITAL HUB"; todo lo demás lleva espaciado normal.
 *
 * Reglas honradas: sin grid de fondo, sin neones nuevos, prefers-reduced-motion
 * respetado, GPU-friendly (transform/opacity), autocontenido (estilos
 * embebidos, sin librerías nuevas).
 */

/* ───────────────────────── helpers ───────────────────────── */

/** Delay escalonado para reveals: style={d(120)} → --d: 120ms */
function d(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties
}

/** Marca [data-reveal] con .bk-in al entrar en viewport (o al instante con reduced-motion). */
function useReveal(): void {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("bk-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("bk-in")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.12, rootMargin: "0px 0px -6% 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ───────────────────────── datos ───────────────────────── */

const BELTS = [
  { name: "BLANCO", hex: "#F5F6F7", level: "00", light: true },
  { name: "AMARILLO", hex: "#D9B14A", level: "01" },
  { name: "NARANJA", hex: "#D08048", level: "02" },
  { name: "VERDE", hex: "#22C55E", level: "03", official: true },
  { name: "AZUL", hex: "#4F7CC0", level: "04" },
  { name: "MARRÓN", hex: "#856046", level: "05" },
  { name: "NEGRO", hex: "#0F0F12", level: "06", dark: true },
] as const

const USAGE = [
  { label: "NEGRO CARBÓN", pct: 45, color: "#0F0F12" },
  { label: "PAPEL HUESO", pct: 30, color: "#F4F1E8" },
  { label: "GRIS GRAFITO", pct: 15, color: "#2A2D34" },
  { label: "VERDE", pct: 8, color: "#22C55E" },
  { label: "VERDE CLARO", pct: 2, color: "#4ADE80" },
] as const

const SWATCHES = [
  { name: "Negro Carbón", hex: "#0F0F12", use: "FONDO BASE · 45%", bg: "#0F0F12", fg: "#F5F6F7", wide: true, bordered: true },
  { name: "Papel Hueso", hex: "#F4F1E8", use: "PANELES CLAROS · EL GI · 30%", bg: "#F4F1E8", fg: "#141414", wide: true, badge: "NUEVO" },
  { name: "Gris Grafito", hex: "#2A2D34", use: "CONTENEDORES · 15%", bg: "#2A2D34", fg: "#F5F6F7" },
  { name: "Verde", hex: "#22C55E", use: "ACENTO · ACCIÓN · 8%", bg: "#22C55E", fg: "#08130C" },
  { name: "Verde Claro", hex: "#4ADE80", use: "TEXTO EN OSCURO · 2%", bg: "#4ADE80", fg: "#08130C" },
  { name: "Blanco Roto", hex: "#F5F6F7", use: "TEXTO EN OSCURO", bg: "#F5F6F7", fg: "#141414" },
] as const

/* ───────────────────────── página ───────────────────────── */

export default function BrandkitPage() {
  useReveal()
  return (
    <main className="bk-root">
      <BkStyles />
      <TopStrip />
      <div className="bk-board">
        <IdentityHeader />
        <Manifesto />
        <ColorSystem />
        <TypographySection />
        <BeltSystem />
        <MotifGallery />
        <HeroDemo />
        <BoardFooter />
      </div>
    </main>
  )
}

/* ───────────────────────── secciones ───────────────────────── */

function TopStrip() {
  return (
    <header className="bk-strip">
      <span className="bk-strip-brand">
        <i className="bk-strip-sq" aria-hidden="true" />
        CH · BRANDKIT BOARD
      </span>
      <span>V4.0 «EL DOJO» · 2026</span>
    </header>
  )
}

function IdentityHeader() {
  return (
    <section className="bk-head" data-reveal aria-label="Identidad">
      <div className="bk-head-dark">
        <p className="bk-kicker bk-r" style={d(0)}>/00 · IDENTIDAD</p>
        <h1 className="bk-wordmark bk-r" style={d(90)}>Capital Hub</h1>
        <p className="bk-head-sub bk-r" style={d(180)}>El Dojo — Identity System v4</p>
        <div className="bk-head-tags bk-r" style={d(260)}>
          <span className="bk-tag">V4.0</span>
          <span className="bk-tag">JUL 2026</span>
          <span className="bk-tag bk-tag-green">PREVIEW</span>
        </div>
        <p className="bk-head-note bk-r" style={d(340)}>
          Los mismos huesos que el v3. El doble de contraste.
          Alma de dojo: se nota, no grita.
        </p>
      </div>
      <div className="bk-head-paper bk-paper">
        <DojoSeal id="bk-seal-head" size={172} className="bk-stamp bk-stamp-green" style={d(420)} />
        <ul className="bk-head-specs bk-r" style={d(520)}>
          <li><span>GI</span><strong>PAPEL CÁLIDO #F4F1E8</strong></li>
          <li><span>CINTURÓN</span><strong>NEGRO CARBÓN #0F0F12</strong></li>
          <li><span>ACENTO</span><strong>VERDE #22C55E</strong></li>
        </ul>
      </div>
      <div className="bk-head-belt">
        <BeltRankBar stripes={2} height={12} flat />
      </div>
    </section>
  )
}

function Manifesto() {
  return (
    <section className="bk-panel bk-paper" data-reveal aria-label="Concepto">
      <p className="bk-kicker bk-r" style={d(0)}>/01 · CONCEPTO</p>
      <h2 className="bk-manifesto-h bk-r" style={d(90)}>
        Se entra de blanco.
        <br />
        Se sale de <MarkerCircle delay={750}>negro</MarkerCircle>.
      </h2>
      <p className="bk-manifesto-p bk-r" style={d(200)}>
        Capital Hub no es una academia: es un dojo. Un oficio digital se entrena
        con disciplina, se mide por niveles y se demuestra trabajando. El que
        llega empieza de blanco; el que se queda, sube.
      </p>
      <ul className="bk-principles bk-r" style={d(300)}>
        <li><i aria-hidden="true" />DISCIPLINA</li>
        <li><i aria-hidden="true" />OFICIO</li>
        <li><i aria-hidden="true" />PROGRESO</li>
      </ul>
    </section>
  )
}

function ColorSystem() {
  return (
    <section className="bk-panel bk-panel-dark" aria-label="Sistema de color">
      <div data-reveal>
        <p className="bk-kicker bk-r" style={d(0)}>/02 · SISTEMA DE COLOR</p>
        <h2 className="bk-h2 bk-r" style={d(80)}>
          El <MarkerUnderline delay={650}>contraste</MarkerUnderline> es el mensaje.
        </h2>
        <p className="bk-lead bk-r" style={d(160)}>
          El v3 era negro sobre negro: correcto, pero plano. El v4 rompe:
          paneles de carbón contra paneles de papel cálido, y el verde
          trabajando encima de los dos.
        </p>
      </div>

      <div className="bk-usage bk-paper" data-reveal>
        <div className="bk-usagebar" role="img" aria-label="Distribución de uso de color">
          {USAGE.map((u, i) => (
            <i
              key={u.label}
              className="bk-seg"
              style={{ width: `${u.pct}%`, background: u.color, ...d(i * 130) }}
            />
          ))}
        </div>
        <ul className="bk-usage-legend">
          {USAGE.map((u) => (
            <li key={u.label}>
              <i style={{ background: u.color }} aria-hidden="true" />
              {u.label} · {u.pct}%
            </li>
          ))}
        </ul>
      </div>

      <div className="bk-swatches" data-reveal>
        {SWATCHES.map((s, i) => (
          <SwatchCard key={s.hex + s.name} swatch={s} delay={i * 70} />
        ))}
      </div>

      <div className="bk-contrast bk-r" data-reveal style={d(120)}>
        <div className="bk-contrast-half bk-contrast-dark">
          <span className="bk-aa">Aa</span>
          <span className="bk-contrast-meta">CARBÓN #0F0F12 · TEXTO #F5F6F7</span>
        </div>
        <div className="bk-contrast-half bk-paper">
          <span className="bk-aa">Aa</span>
          <span className="bk-contrast-meta">PAPEL #F4F1E8 · TINTA #141414</span>
        </div>
        <span className="bk-contrast-chip">16.9 : 1 · AAA</span>
      </div>
    </section>
  )
}

function TypographySection() {
  return (
    <section className="bk-panel bk-panel-dark" aria-label="Tipografía">
      <div data-reveal>
        <p className="bk-kicker bk-r" style={d(0)}>/03 · TIPOGRAFÍA</p>
        <h2 className="bk-h2 bk-r" style={d(80)}>Una sola voz. Seis pesos.</h2>
        <p className="bk-lead bk-r" style={d(160)}>
          Toda la página es Inter Tight. Nada más. La jerarquía la marca el peso
          (del Black al Regular), el tamaño y el color contra el fondo — nunca
          otra fuente.
        </p>
      </div>

      <div className="bk-type-rows" data-reveal>
        <div className="bk-type-row bk-r" style={d(0)}>
          <div className="bk-type-meta">
            <strong>INTER TIGHT · BLACK</strong>
            <span>DISPLAY · IMPACTO</span>
            <span>900 · 800</span>
          </div>
          <div className="bk-type-display bk-paper">
            El golpe está en el peso.
            <span className="bk-type-alpha">AaBbCcDdEeFf GgHhIiJjKkLl 0123456789</span>
          </div>
        </div>

        <div className="bk-type-row bk-r" style={d(120)}>
          <div className="bk-type-meta">
            <strong>INTER TIGHT · REGULAR</strong>
            <span>UI · BODY</span>
            <span>400 · 500</span>
          </div>
          <p className="bk-type-body">
            El cuerpo de texto respira y se lee. Sin mayúsculas espaciadas, sin
            adornos: la claridad es una forma de respeto. La misma familia, en
            peso ligero, hace el trabajo silencioso para que el titular pueda
            pegar fuerte.
          </p>
        </div>

        <div className="bk-type-row bk-r" style={d(240)}>
          <div className="bk-type-meta">
            <strong>INTER TIGHT · MEDIUM</strong>
            <span>LABELS · DATOS</span>
            <span>500 · 600 · MAYÚSCULAS</span>
          </div>
          <div className="bk-type-chips">
            <span className="bk-chip bk-chip-green">CINTURÓN VERDE · NIVEL 03</span>
            <span className="bk-chip">16.9 : 1 · AAA</span>
            <span className="bk-chip">#22C55E</span>
            <span className="bk-chip">00 → 06</span>
          </div>
        </div>
      </div>
    </section>
  )
}

function BeltSystem() {
  return (
    <section className="bk-panel bk-paper" aria-label="Lenguaje de cinturones">
      <div data-reveal>
        <p className="bk-kicker bk-r" style={d(0)}>/04 · LENGUAJE DE CINTURONES</p>
        <h2 className="bk-h2 bk-r" style={d(80)}>El progreso no se dice. Se ciñe.</h2>
        <p className="bk-lead bk-r" style={d(160)}>
          Siete niveles, del blanco al negro, con el verde de la casa en el
          centro. Colores mate y uso quirúrgico: una etiqueta, una barra, un
          borde. Nunca disfraz.
        </p>
      </div>

      <div className="bk-belts" data-reveal>
        {BELTS.map((b, i) => (
          <div key={b.level} className="bk-belt bk-r" style={d(i * 80)}>
            {"official" in b && b.official ? (
              <span className="bk-belt-flag">OFICIAL</span>
            ) : (
              <span className="bk-belt-flag bk-belt-flag-ghost" aria-hidden="true">·</span>
            )}
            <div
              className={`bk-belt-swatch${"official" in b && b.official ? " bk-belt-official" : ""}${"light" in b && b.light ? " bk-belt-light" : ""}`}
              style={{ background: b.hex }}
            />
            <span className="bk-belt-lv">{b.level}</span>
            <span className="bk-belt-name">{b.name}</span>
          </div>
        ))}
      </div>

      <div className="bk-grados" data-reveal>
        <div className="bk-r" style={d(0)}>
          <BeltRankBar stripes={3} height={16} />
        </div>
        <p className="bk-grados-note bk-r" style={d(140)}>
          GRADOS · 3 RAYAS · A UNA DEL SIGUIENTE NIVEL
        </p>
        <div className="bk-ranks bk-r" style={d(240)}>
          <span className="bk-rank bk-rank-outline">CINTURÓN BLANCO · NIVEL 00</span>
          <span className="bk-rank bk-rank-green">CINTURÓN VERDE · NIVEL 03</span>
          <span className="bk-rank bk-rank-black">CINTURÓN NEGRO · NIVEL 06</span>
        </div>
      </div>
    </section>
  )
}

function MotifGallery() {
  return (
    <section className="bk-panel bk-panel-dark" aria-label="Galería de motifs">
      <div data-reveal>
        <p className="bk-kicker bk-r" style={d(0)}>/05 · GALERÍA DE MOTIFS</p>
        <h2 className="bk-h2 bk-r" style={d(80)}>Doce gestos. Un acento.</h2>
        <p className="bk-lead bk-r" style={d(160)}>
          El sistema no vive de un solo truco: es una caja de gestos pequeños.
          El marcador es uno más, no el sello de la marca.
        </p>
      </div>

      <div className="bk-motifs" data-reveal>
        <MotifCard n="01" title="El marcador" tone="paper" tilt delay={0}
          desc="Subrayado o círculo a mano alzada, en verde, sobre UNA palabra. Es un motif más: no es el sello de la marca.">
          <div className="bk-m-marker">
            <p><MarkerUnderline thin delay={250}>resultado</MarkerUnderline></p>
            <p><MarkerCircle thin delay={700}>hoy</MarkerCircle></p>
          </div>
        </MotifCard>

        <MotifCard n="02" title="Sello de dojo" tone="paper" delay={60}
          desc="Monograma CH estampado en tinta verde. Para cierres, certificados y esquinas. Discreto.">
          <DojoSeal id="bk-seal-motif" size={104} className="bk-stamp bk-stamp-green" style={d(300)} />
        </MotifCard>

        <MotifCard n="03" title="Cinturón + grados" delay={120}
          desc="El avance no es una barra de porcentaje: es un cinturón con rayas.">
          <div className="bk-m-belt">
            <BeltRankBar stripes={3} height={13} />
            <span className="bk-m-belt-label">NIVEL 03 · 3 GRADOS</span>
          </div>
        </MotifCard>

        <MotifCard n="04" title="Etiqueta de rango" delay={180}
          desc="El nivel siempre en mono, siempre discreto. Datos, no medallas.">
          <div className="bk-m-ranks">
            <span className="bk-chip bk-chip-green">CINTURÓN VERDE · NIVEL 03</span>
            <span className="bk-chip">CINTURÓN BLANCO · NIVEL 00</span>
          </div>
        </MotifCard>

        <MotifCard n="05" title="Alto contraste" delay={240}
          desc="Panel carbón contra panel papel. El salto ES el estilo.">
          <div className="bk-mini2">
            <div className="bk-mini bk-mini-dark">Aa</div>
            <div className="bk-mini bk-mini-paper">Aa</div>
          </div>
        </MotifCard>

        <MotifCard n="06" title="Bloques rectangulares" delay={300}
          desc="Cajas firmes, radios de 2 a 4 px. Estructura, no decoración.">
          <div className="bk-block-demo">CONTAINER · R2-4PX</div>
        </MotifCard>

        <MotifCard n="07" title="Líneas finas" delay={360}
          desc="Separar con aire y una línea de 1 px. Nunca con cajas pesadas.">
          <div className="bk-lines-demo">
            <i style={{ width: "100%" }} />
            <i style={{ width: "72%" }} />
            <i style={{ width: "88%" }} />
          </div>
        </MotifCard>

        <MotifCard n="08" title="Indicadores de estado" delay={420}
          desc="El verde señala vida: activo, hecho, en curso.">
          <div className="bk-m-status">
            <i className="bk-dot" />
            <i className="bk-statusbar" />
            <IconCheck />
          </div>
        </MotifCard>

        <MotifCard n="09" title="Capas y profundidad" delay={480}
          desc="Carbón sobre grafito sobre carbón. Profundidad sin sombras de circo.">
          <div className="bk-layers"><div><div /></div></div>
        </MotifCard>

        <MotifCard n="10" title="Iconos lineales" delay={540}
          desc="Trazo fino y funcional. Ilustración, la justa.">
          <div className="bk-m-icons">
            <IconFolder />
            <IconUser />
            <IconBell />
          </div>
        </MotifCard>

        <MotifCard n="11" title="Badges discretos" delay={600}
          desc="Validación rectangular, radio 2 px. Sin fanfarria.">
          <div className="bk-m-badges">
            <span className="bk-badge-solid">PRO</span>
            <span className="bk-badge-outline">BASE</span>
            <span className="bk-badge-green">NIVEL 03</span>
          </div>
        </MotifCard>

        <MotifCard n="12" title="Rejilla como composición" tone="paper" delay={660}
          desc="Todo cae en una rejilla que se siente y no se pinta. Prohibido el grid de fondo.">
          <div className="bk-crop">
            <i className="bk-crop-1" /><i className="bk-crop-2" />
            <i className="bk-crop-3" /><i className="bk-crop-4" />
            <b>ALINEADO · 12 COL</b>
          </div>
        </MotifCard>
      </div>
    </section>
  )
}

function HeroDemo() {
  return (
    <section className="bk-panel bk-panel-dark" aria-label="En acción">
      <div data-reveal>
        <p className="bk-kicker bk-r" style={d(0)}>/06 · EN ACCIÓN</p>
        <h2 className="bk-h2 bk-r" style={d(80)}>Así aterriza.</h2>
        <p className="bk-lead bk-r" style={d(160)}>
          Un hero de muestra con el sistema puesto a trabajar: carbón, papel,
          verde y un solo marcador.
        </p>
      </div>

      <div className="bk-hero bk-r" data-reveal style={d(120)}>
        <div className="bk-hero-glow" aria-hidden="true" />
        <div className="bk-hero-inner">
          <p className="bk-hero-tag">
            <i className="bk-dot" aria-hidden="true" />
            ENTRENAMIENTO ABIERTO · CINTURÓN BLANCO
          </p>
          <h3 className="bk-hero-h">
            Deja de estudiar.
            <br />
            Empieza a <MarkerUnderline delay={800}>entrenar</MarkerUnderline>.
          </h3>
          <p className="bk-hero-p">
            Profesiones digitales con estándar de dojo: práctica real, niveles
            que se ganan y cero humo.
          </p>
          <div className="bk-hero-ctas">
            <button type="button" className="bk-btn bk-btn-green">
              Empezar de blanco
              <IconArrow />
            </button>
            <button type="button" className="bk-btn bk-btn-ghost">Ver el método</button>
          </div>
        </div>
        <div className="bk-hero-strip bk-paper">
          <div>
            <span>MÉTODO</span>
            <strong>Tatami, no teoría</strong>
          </div>
          <div>
            <span>PROGRESO</span>
            <strong>7 cinturones · 00 → 06</strong>
          </div>
          <div>
            <span>ACENTO</span>
            <strong><i className="bk-chipdot" aria-hidden="true" />#22C55E</strong>
          </div>
        </div>
      </div>
    </section>
  )
}

function BoardFooter() {
  return (
    <footer className="bk-footer" data-reveal>
      <p className="bk-footer-c bk-r" style={d(0)}>
        © Capital Hub · Identity System v4 · El Dojo
      </p>
      <div className="bk-footer-belts bk-r" style={d(120)} aria-hidden="true">
        {BELTS.map((b) => (
          <i key={b.level} className="bk-fdot" style={{ background: b.hex }} />
        ))}
      </div>
      <span className="bk-tag bk-r" style={d(220)}>PREVIEW INTERNO · LOCALHOST</span>
    </footer>
  )
}

/* ───────────────────────── piezas ───────────────────────── */

function SwatchCard({
  swatch,
  delay,
}: {
  swatch: (typeof SWATCHES)[number]
  delay: number
}) {
  return (
    <article
      className={`bk-swatch bk-r${"wide" in swatch && swatch.wide ? " bk-sw-wide" : ""}${"bordered" in swatch && swatch.bordered ? " bk-sw-bordered" : ""}`}
      style={{ background: swatch.bg, color: swatch.fg, ...d(delay) }}
    >
      <div className="bk-sw-top">
        <span className="bk-sw-use">{swatch.use}</span>
        {"badge" in swatch && swatch.badge ? (
          <span className="bk-sw-badge">{swatch.badge}</span>
        ) : null}
      </div>
      <div>
        <div className="bk-sw-name">{swatch.name}</div>
        <CopyHex hex={swatch.hex} />
      </div>
    </article>
  )
}

function CopyHex({ hex }: { hex: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    try {
      void navigator.clipboard?.writeText(hex)
    } catch {
      /* clipboard no disponible: el botón sigue mostrando el hex */
    }
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1300)
  }
  return (
    <button type="button" className="bk-hex" onClick={copy} title="Copiar hex">
      {copied ? "COPIADO ✓" : hex}
    </button>
  )
}

/** Subrayado de rotulador (doble pasada, trazo irregular, draw-in). */
function MarkerUnderline({
  children,
  delay = 400,
  thin = false,
}: {
  children: ReactNode
  delay?: number
  thin?: boolean
}) {
  return (
    <span className="bk-mark">
      {children}
      <svg className="bk-mark-under" viewBox="0 0 220 16" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="bk-draw"
          style={d(delay)}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeWidth={thin ? 2.6 : 4.2}
          d="M4 10 C 50 5, 120 3.5, 216 7"
        />
        <path
          className="bk-draw"
          style={d(delay + 260)}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeWidth={thin ? 1.8 : 2.8}
          d="M14 13.5 C 70 10, 150 9, 198 11"
        />
      </svg>
    </span>
  )
}

/** Círculo de rotulador a mano alzada alrededor de una palabra (draw-in). */
function MarkerCircle({
  children,
  delay = 500,
  thin = false,
}: {
  children: ReactNode
  delay?: number
  thin?: boolean
}) {
  return (
    <span className="bk-mark">
      {children}
      <svg className="bk-mark-circle" viewBox="0 0 300 130" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="bk-draw bk-draw-slow"
          style={d(delay)}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeWidth={thin ? 2.4 : 4.6}
          d="M158 14 C 84 4, 20 30, 16 64 C 12 100, 84 124, 158 119 C 238 114, 288 88, 284 54 C 280 22, 208 4, 126 12"
        />
      </svg>
    </span>
  )
}

/** Sello circular tipo estampa: anillo + texto en arco + monograma CH. */
function DojoSeal({
  id,
  size = 160,
  className = "",
  style,
}: {
  id: string
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg
      viewBox="0 0 180 180"
      width={size}
      height={size}
      className={className}
      style={style}
      aria-hidden="true"
    >
      <defs>
        <path id={id} d="M 90,17 a 73,73 0 1,1 -0.01,0" fill="none" />
      </defs>
      <circle cx="90" cy="90" r="84" fill="none" stroke="currentColor" strokeWidth="3" />
      <circle cx="90" cy="90" r="60" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <text className="bk-seal-arc">
        <textPath href={`#${id}`}>CAPITAL HUB · EL DOJO · CAPITAL HUB · EL DOJO · CAPITAL HUB · EL DOJO ·</textPath>
      </text>
      <text x="90" y="92" className="bk-seal-ch" textAnchor="middle" dominantBaseline="central">
        CH
      </text>
    </svg>
  )
}

/** Barra de cinturón con parche de grados (rayas de progreso tipo BJJ). */
function BeltRankBar({
  stripes = 3,
  height = 14,
  flat = false,
}: {
  stripes?: number
  height?: number
  flat?: boolean
}) {
  return (
    <div className="bk-beltbar" style={{ height, borderRadius: flat ? 0 : 2 }}>
      <div className="bk-beltbar-patch">
        {Array.from({ length: stripes }).map((_, i) => (
          <span key={i} className="bk-stripe" style={d(300 + i * 170)} />
        ))}
      </div>
    </div>
  )
}

function MotifCard({
  n,
  title,
  desc,
  tone = "dark",
  tilt = false,
  delay = 0,
  children,
}: {
  n: string
  title: string
  desc: string
  tone?: "dark" | "paper"
  tilt?: boolean
  delay?: number
  children: ReactNode
}) {
  return (
    <article
      className={`bk-motif bk-r ${tone === "paper" ? "bk-motif-paper bk-paper" : "bk-motif-dark"}${tilt ? " bk-motif-tilt" : ""}`}
      style={d(delay)}
    >
      <header className="bk-motif-head">
        <span className="bk-motif-n">{n}</span>
        <h3 className="bk-motif-t">{title}</h3>
      </header>
      <div className="bk-motif-demo">{children}</div>
      <p className="bk-motif-desc">{desc}</p>
    </article>
  )
}

/* ───────────────────────── iconos lineales ───────────────────────── */

const ICON_PROPS = {
  width: 22,
  height: 22,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  "aria-hidden": true,
} as const

function IconFolder() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    </svg>
  )
}

function IconUser() {
  return (
    <svg {...ICON_PROPS}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20c1.4-3.4 3.9-5 7-5s5.6 1.6 7 5" />
    </svg>
  )
}

function IconBell() {
  return (
    <svg {...ICON_PROPS}>
      <path d="M18 16H6c1.2-1.4 1.8-2.6 1.8-5a4.2 4.2 0 0 1 8.4 0c0 2.4.6 3.6 1.8 5z" />
      <path d="M10.4 19a1.8 1.8 0 0 0 3.2 0" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg {...ICON_PROPS} width={19} height={19} stroke="#4ADE80" strokeWidth={2}>
      <path d="M5 12.5l4 4L19 7" />
    </svg>
  )
}

function IconArrow() {
  return (
    <svg {...ICON_PROPS} width={17} height={17} strokeWidth={2}>
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  )
}

/* ───────────────────────── estilos ───────────────────────── */

function BkStyles() {
  return (
    <style>{`
      /* UNA sola tipografía en toda la página: Inter Tight, rango completo
         de pesos (400→900, incl. Black). La jerarquía se hace con PESO +
         tamaño, nunca con otra fuente. El tracking ancho es SOLO del logo. */
      @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&display=swap');

      .bk-root {
        --carbon: #0F0F12;
        --graphite: #2A2D34;
        --card: #17171B;
        --line-soft: #3A3E47;
        --txt: #F5F6F7;
        --txt-2: #A6AAB2;
        --paper: #F4F1E8;
        --paper-2: #EDE8DC;
        --paper-line: #DCD5C2;
        --ink: #141414;
        --ink-2: #57534A;
        --green: #22C55E;
        --green-2: #4ADE80;
        --green-ink: #08130C;
        --ease: cubic-bezier(0.22, 0.61, 0.36, 1);
        /* Inter Tight es la ÚNICA familia. Las tres variables apuntan a ella:
           los antiguos roles display/body/"mono" ahora se distinguen por peso. */
        --font: var(--font-heading), "Inter Tight", -apple-system, BlinkMacSystemFont, "SF Pro Display", "Helvetica Neue", Arial, sans-serif;
        --font-d: var(--font);
        --font-b: var(--font);
        --font-m: var(--font);
        min-height: 100vh;
        background: #08080A;
        color: var(--txt);
        font-family: var(--font);
        -webkit-font-smoothing: antialiased;
      }
      .bk-root ::selection { background: var(--green); color: var(--green-ink); }

      /* ── layout ── */
      .bk-board {
        max-width: 1220px;
        margin: 0 auto;
        padding: clamp(14px, 3vw, 32px);
        display: flex;
        flex-direction: column;
        gap: clamp(14px, 2vw, 22px);
      }
      .bk-panel {
        border-radius: 4px;
        padding: clamp(24px, 4.5vw, 48px);
        position: relative;
        overflow: hidden;
      }
      .bk-panel-dark { background: var(--carbon); border: 1px solid var(--graphite); }

      /* papel cálido: el "gi". Grano sutil de papel encima. */
      .bk-paper { background: var(--paper); color: var(--ink); position: relative; }
      .bk-paper::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }
      .bk-paper > * { position: relative; z-index: 1; }

      /* ── strip superior ── */
      .bk-strip {
        position: sticky;
        top: 0;
        z-index: 40;
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 12px;
        padding: 10px clamp(16px, 3vw, 34px);
        background: rgba(8, 8, 10, 0.84);
        backdrop-filter: blur(10px);
        -webkit-backdrop-filter: blur(10px);
        border-bottom: 1px solid var(--graphite);
        font-family: var(--font-m);
        font-size: 10px;
        font-weight: 500;
        color: var(--txt-2);
      }
      .bk-strip-brand { display: flex; gap: 8px; align-items: center; color: var(--txt); }
      .bk-strip-sq { width: 9px; height: 9px; background: var(--green); border-radius: 2px; }

      /* ── tipografía base ── */
      .bk-kicker {
        font-family: var(--font-m);
        font-size: 11px;
        font-weight: 500;
        color: var(--txt-2);
        margin: 0 0 18px;
      }
      .bk-kicker::before {
        content: "";
        display: inline-block;
        width: 8px;
        height: 8px;
        background: var(--green);
        border-radius: 2px;
        margin-right: 9px;
      }
      .bk-paper .bk-kicker { color: var(--ink-2); }

      .bk-h2 {
        font-family: var(--font-d);
        font-weight: 800;
        font-size: clamp(26px, 4vw, 44px);
        letter-spacing: -0.02em;
        line-height: 1.06;
        margin: 0 0 14px;
      }
      .bk-lead {
        font-size: 15.5px;
        line-height: 1.65;
        max-width: 62ch;
        margin: 0;
        color: #B9BDC5;
      }
      .bk-paper .bk-lead { color: var(--ink-2); }

      .bk-tag {
        font-family: var(--font-m);
        font-size: 10px;
        font-weight: 500;
        padding: 4px 9px;
        border: 1px solid var(--line-soft);
        border-radius: 2px;
        color: var(--txt-2);
      }
      .bk-tag-green { border-color: var(--green); color: var(--green-2); }

      /* ── header identidad ── */
      .bk-head {
        display: grid;
        grid-template-columns: 1.55fr 1fr;
        background: var(--carbon);
        border: 1px solid var(--graphite);
        border-radius: 4px;
        overflow: hidden;
      }
      .bk-head-dark {
        padding: clamp(26px, 4.5vw, 56px);
        display: flex;
        flex-direction: column;
      }
      /* ÚNICO elemento con tracking ancho en toda la página: el logo. */
      .bk-wordmark {
        font-family: var(--font-d);
        font-weight: 600;
        font-size: clamp(28px, 4.6vw, 56px);
        text-transform: uppercase;
        letter-spacing: 0.3em;
        line-height: 1.12;
        margin: 4px 0 12px;
        color: var(--txt);
      }
      .bk-head-sub { font-size: clamp(15px, 2vw, 17px); color: #C3C7CD; margin: 0; }
      .bk-head-tags { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 18px; }
      .bk-head-note {
        margin: 34px 0 0;
        padding-top: 22px;
        border-top: 1px solid var(--graphite);
        font-size: 14px;
        line-height: 1.6;
        color: var(--txt-2);
        max-width: 44ch;
      }
      .bk-head-paper {
        padding: clamp(26px, 4vw, 44px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 22px;
        border-left: 1px solid var(--paper-line);
      }
      .bk-head-specs {
        width: 100%;
        margin: 0;
        padding: 0;
        list-style: none;
        font-family: var(--font-m);
        font-size: 10.5px;
        font-weight: 500;
        color: var(--ink-2);
      }
      .bk-head-specs li {
        display: flex;
        justify-content: space-between;
        gap: 12px;
        padding: 9px 2px;
        border-top: 1px solid var(--paper-line);
      }
      .bk-head-specs li strong { color: var(--ink); font-weight: 500; text-align: right; }
      .bk-head-belt { grid-column: 1 / -1; }
      @media (max-width: 820px) {
        .bk-head { grid-template-columns: 1fr; }
        .bk-head-paper { border-left: none; }
      }

      /* ── sello / estampa ── */
      .bk-stamp {
        opacity: 0;
        transform: scale(1.45) rotate(-2deg);
        transition:
          transform 0.5s cubic-bezier(0.2, 1.4, 0.4, 1) var(--d, 300ms),
          opacity 0.3s ease var(--d, 300ms);
      }
      .bk-in .bk-stamp { opacity: 1; transform: scale(1) rotate(-8deg); }
      .bk-stamp-green { color: var(--green); mix-blend-mode: multiply; }
      .bk-seal-arc { font-family: var(--font-m); font-size: 9.5px; font-weight: 600; fill: currentColor; }
      .bk-seal-ch { font-family: var(--font-d); font-weight: 800; font-size: 52px; fill: currentColor; }

      /* ── manifiesto ── */
      .bk-manifesto-h {
        font-family: var(--font-d);
        font-weight: 900;
        font-size: clamp(38px, 7.4vw, 86px);
        letter-spacing: -0.025em;
        line-height: 1.02;
        margin: 10px 0 26px;
        color: var(--ink);
      }
      .bk-manifesto-p {
        font-size: clamp(15px, 2vw, 17.5px);
        line-height: 1.7;
        color: var(--ink-2);
        max-width: 58ch;
        margin: 0 0 28px;
      }
      .bk-principles {
        display: flex;
        flex-wrap: wrap;
        gap: 10px;
        margin: 0;
        padding: 0;
        list-style: none;
      }
      .bk-principles li {
        display: flex;
        align-items: center;
        gap: 9px;
        font-family: var(--font-m);
        font-size: 10.5px;
        font-weight: 500;
        color: var(--ink);
        border: 1px solid #A9A292;
        border-radius: 2px;
        padding: 8px 13px;
      }
      .bk-principles li i { width: 7px; height: 7px; border-radius: 50%; background: var(--green); }

      /* ── marcador (motif) ── */
      .bk-mark { position: relative; white-space: nowrap; }
      .bk-mark-under {
        position: absolute;
        left: -2%;
        bottom: -0.16em;
        width: 104%;
        height: 0.3em;
        overflow: visible;
      }
      .bk-mark-circle {
        position: absolute;
        top: -0.3em;
        left: -0.5em;
        width: calc(100% + 1em);
        height: calc(100% + 0.55em);
        overflow: visible;
      }
      .bk-draw {
        fill: none;
        stroke: var(--green);
        stroke-linecap: round;
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        transition: stroke-dashoffset 0.85s cubic-bezier(0.5, 0, 0.25, 1) var(--d, 300ms);
      }
      .bk-draw-slow { transition-duration: 1.2s; }
      .bk-in .bk-draw { stroke-dashoffset: 0; }
      .bk-paper .bk-mark svg { mix-blend-mode: multiply; }

      /* ── color: uso ── */
      .bk-usage {
        border-radius: 4px;
        padding: clamp(18px, 3vw, 28px);
        margin: 30px 0 14px;
      }
      .bk-usagebar {
        display: flex;
        height: 18px;
        border-radius: 2px;
        overflow: hidden;
        border: 1px solid #C9C2AE;
      }
      .bk-seg {
        display: block;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 0.9s var(--ease) var(--d, 0ms);
      }
      .bk-in .bk-seg { transform: scaleX(1); }
      .bk-usage-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 22px;
        margin: 14px 0 0;
        padding: 0;
        list-style: none;
        font-family: var(--font-m);
        font-size: 10px;
        font-weight: 500;
        color: var(--ink-2);
      }
      .bk-usage-legend i {
        display: inline-block;
        width: 9px;
        height: 9px;
        border-radius: 2px;
        margin-right: 7px;
        vertical-align: -1px;
        border: 1px solid rgba(20, 20, 20, 0.25);
      }

      /* ── color: swatches ── */
      .bk-swatches {
        display: grid;
        grid-template-columns: repeat(2, 1fr);
        gap: 12px;
        margin-top: 14px;
      }
      @media (min-width: 900px) { .bk-swatches { grid-template-columns: repeat(4, 1fr); } }
      .bk-sw-wide { grid-column: span 2; }
      .bk-swatch {
        border-radius: 4px;
        border: 1px solid rgba(255, 255, 255, 0.09);
        padding: 15px;
        min-height: 150px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      /* hover con translate/rotate (propiedades independientes) para no
         chocar con el transform del sistema de reveal (.bk-r) */
      .bk-swatch:hover { translate: 0 -3px; box-shadow: 0 18px 40px -22px rgba(0, 0, 0, 0.8); }
      .bk-sw-bordered { border-color: var(--graphite); }
      .bk-sw-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
      .bk-sw-use {
        font-family: var(--font-m);
        font-size: 9px;
        font-weight: 500;
        padding: 3px 7px;
        border-radius: 2px;
        border: 1px solid color-mix(in srgb, currentColor 40%, transparent);
      }
      .bk-sw-badge {
        font-family: var(--font-m);
        font-size: 9px;
        padding: 3px 7px;
        border-radius: 2px;
        background: var(--green);
        color: var(--green-ink);
        font-weight: 500;
      }
      .bk-sw-name { font-family: var(--font-d); font-weight: 600; font-size: 17px; margin-bottom: 7px; }
      .bk-hex {
        font-family: var(--font-m);
        font-size: 11px;
        font-weight: 500;
        color: inherit;
        background: transparent;
        border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
        border-radius: 2px;
        padding: 3px 8px;
        cursor: pointer;
        transition: border-color 0.25s ease;
      }
      .bk-hex:hover { border-color: currentColor; }
      .bk-hex:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }

      /* ── color: demo de contraste ── */
      .bk-contrast {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 1px solid var(--graphite);
        border-radius: 4px;
        overflow: hidden;
        margin-top: 14px;
      }
      .bk-contrast-half {
        padding: clamp(20px, 3.4vw, 34px);
        display: flex;
        flex-direction: column;
        gap: 8px;
        border-radius: 0;
      }
      .bk-contrast-dark { background: var(--carbon); }
      .bk-aa { font-family: var(--font-d); font-weight: 600; font-size: clamp(34px, 5vw, 52px); line-height: 1; }
      .bk-contrast-meta { font-family: var(--font-m); font-size: 9.5px; font-weight: 500; opacity: 0.75; }
      .bk-contrast-chip {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        background: var(--green);
        color: var(--green-ink);
        font-family: var(--font-m);
        font-size: 10.5px;
        font-weight: 500;
        padding: 6px 11px;
        border-radius: 2px;
        white-space: nowrap;
      }

      /* ── tipografía ── */
      .bk-type-rows { margin-top: 30px; }
      .bk-type-row {
        display: grid;
        grid-template-columns: 210px 1fr;
        gap: 18px;
        padding: 24px 0;
        border-top: 1px solid var(--graphite);
        align-items: center;
      }
      @media (max-width: 760px) { .bk-type-row { grid-template-columns: 1fr; gap: 12px; } }
      .bk-type-meta {
        display: flex;
        flex-direction: column;
        gap: 6px;
        font-family: var(--font-m);
        font-size: 10.5px;
        font-weight: 500;
        color: var(--txt-2);
      }
      .bk-type-meta strong { color: var(--txt); font-size: 12px; font-weight: 500; }
      .bk-type-display {
        border-radius: 4px;
        padding: clamp(20px, 3.4vw, 34px);
        font-family: var(--font-d);
        font-weight: 900;
        font-size: clamp(27px, 4.6vw, 50px);
        letter-spacing: -0.02em;
        line-height: 1.05;
      }
      .bk-type-alpha {
        display: block;
        margin-top: 14px;
        font-size: 13px;
        font-weight: 500;
        color: var(--ink-2);
      }
      .bk-type-body {
        background: var(--card);
        border: 1px solid var(--graphite);
        border-radius: 4px;
        padding: 22px 24px;
        font-size: 15px;
        line-height: 1.7;
        color: #D4D7DC;
        max-width: 640px;
        margin: 0;
      }
      .bk-type-chips { display: flex; flex-wrap: wrap; gap: 8px; }
      .bk-chip {
        font-family: var(--font-m);
        font-size: 11px;
        font-weight: 500;
        padding: 6px 10px;
        border: 1px solid var(--graphite);
        background: var(--card);
        border-radius: 2px;
        color: var(--txt);
      }
      .bk-chip-green { color: var(--green-2); border-color: #1E5A36; }

      /* ── cinturones ── */
      .bk-belts {
        display: grid;
        grid-template-columns: repeat(7, 1fr);
        gap: clamp(6px, 1.2vw, 12px);
        margin: 32px 0 8px;
        align-items: end;
      }
      .bk-belt { text-align: center; }
      .bk-belt-flag {
        display: inline-block;
        font-family: var(--font-m);
        font-size: 8.5px;
        font-weight: 600;
        background: var(--green);
        color: var(--green-ink);
        padding: 2px 6px;
        border-radius: 2px;
        margin-bottom: 7px;
      }
      .bk-belt-flag-ghost { visibility: hidden; }
      .bk-belt-swatch {
        height: clamp(52px, 8vw, 84px);
        border-radius: 3px;
        transition: transform 0.3s var(--ease);
      }
      .bk-belt:hover .bk-belt-swatch { transform: translateY(-4px); }
      .bk-belt-official { box-shadow: 0 0 0 2px var(--paper), 0 0 0 4px var(--green); }
      .bk-belt-light { border: 1px solid #C9C2AE; }
      .bk-belt-lv { display: block; margin-top: 9px; font-family: var(--font-m); font-size: 10px; font-weight: 500; color: var(--ink-2); }
      .bk-belt-name { display: block; margin-top: 2px; font-family: var(--font-m); font-size: 9px; font-weight: 600; color: var(--ink); }
      @media (max-width: 480px) { .bk-belt-name { display: none; } }

      .bk-grados { margin-top: 32px; max-width: 620px; }
      .bk-grados-note {
        margin: 10px 0 0;
        font-family: var(--font-m);
        font-size: 10px;
        font-weight: 500;
        color: var(--ink-2);
      }
      .bk-beltbar {
        position: relative;
        width: 100%;
        background: var(--green);
        display: flex;
        justify-content: flex-end;
        overflow: hidden;
      }
      .bk-beltbar-patch {
        width: 24%;
        min-width: 72px;
        max-width: 128px;
        background: var(--carbon);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .bk-stripe {
        width: 4px;
        height: 60%;
        background: var(--paper);
        border-radius: 1px;
        opacity: 0;
        transition: opacity 0.4s ease var(--d, 300ms);
      }
      .bk-in .bk-stripe { opacity: 1; }

      .bk-ranks { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 28px; }
      .bk-rank {
        font-family: var(--font-m);
        font-size: 10.5px;
        font-weight: 500;
        padding: 6px 11px;
        border-radius: 2px;
      }
      .bk-rank-outline { border: 1px solid #A9A292; color: var(--ink); }
      .bk-rank-green { background: var(--green); color: var(--green-ink); }
      .bk-rank-black { background: var(--carbon); color: var(--paper); }

      /* ── motifs ── */
      .bk-motifs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(232px, 1fr));
        gap: 13px;
        margin-top: 30px;
      }
      .bk-motif {
        border-radius: 4px;
        padding: 16px;
        min-height: 196px;
        display: flex;
        flex-direction: column;
      }
      .bk-motif-dark { background: var(--card); border: 1px solid var(--graphite); }
      .bk-motif-dark:hover { border-color: #40663F; translate: 0 -2px; }
      .bk-motif-paper:hover { translate: 0 -2px; rotate: 0deg; }
      .bk-motif-tilt { rotate: -0.6deg; }
      .bk-motif-head {
        display: flex;
        align-items: baseline;
        gap: 8px;
        padding-bottom: 10px;
        border-bottom: 1px solid var(--graphite);
      }
      .bk-motif-paper .bk-motif-head { border-bottom-color: var(--paper-line); }
      .bk-motif-n { font-family: var(--font-m); font-size: 10px; font-weight: 600; color: var(--green-2); }
      .bk-motif-paper .bk-motif-n { color: var(--ink); font-weight: 600; }
      .bk-motif-t {
        font-family: var(--font-m);
        font-weight: 600;
        font-size: 10px;
        text-transform: uppercase;
        color: var(--txt-2);
        margin: 0;
      }
      .bk-motif-paper .bk-motif-t { color: var(--ink-2); }
      .bk-motif-demo { flex: 1; display: flex; align-items: center; justify-content: center; padding: 18px 4px; }
      .bk-motif-desc { margin: 0; font-size: 11.5px; line-height: 1.55; color: #8F939B; }
      .bk-motif-paper .bk-motif-desc { color: var(--ink-2); }

      .bk-m-marker { display: flex; flex-direction: column; gap: 18px; align-items: center; }
      .bk-m-marker p {
        margin: 0;
        font-family: var(--font-d);
        font-weight: 600;
        font-size: 22px;
        color: var(--ink);
        line-height: 1.2;
      }
      .bk-m-belt { width: 100%; }
      .bk-m-belt-label {
        display: block;
        margin-top: 9px;
        font-family: var(--font-m);
        font-size: 9px;
        font-weight: 500;
        color: var(--txt-2);
        text-align: center;
      }
      .bk-m-ranks { display: flex; flex-direction: column; gap: 8px; align-items: center; }
      .bk-mini2 { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
      .bk-mini {
        height: 74px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-d);
        font-weight: 600;
        font-size: 20px;
      }
      .bk-mini-dark { background: var(--carbon); border: 1px solid var(--line-soft); color: var(--txt); }
      .bk-mini-paper { background: var(--paper); color: var(--ink); }
      .bk-block-demo {
        width: 100%;
        height: 64px;
        background: var(--graphite);
        border: 1px solid var(--line-soft);
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-m);
        font-size: 9.5px;
        font-weight: 500;
        color: #C7CAD1;
      }
      .bk-lines-demo { width: 100%; display: flex; flex-direction: column; gap: 15px; align-items: flex-start; }
      .bk-lines-demo i { display: block; height: 1px; background: var(--line-soft); }
      .bk-m-status { display: flex; align-items: center; gap: 14px; }
      .bk-statusbar { width: 44px; height: 4px; background: var(--green); border-radius: 2px; }
      .bk-layers {
        width: 100%;
        height: 84px;
        background: var(--carbon);
        border: 1px solid var(--graphite);
        border-radius: 3px;
        padding: 10px;
      }
      .bk-layers > div { background: var(--graphite); height: 100%; border-radius: 2px; padding: 9px; }
      .bk-layers > div > div { background: var(--carbon); height: 100%; border-radius: 2px; border: 1px solid var(--line-soft); }
      .bk-m-icons { display: flex; gap: 18px; color: #E7E9ED; }
      .bk-m-badges { display: flex; flex-wrap: wrap; gap: 8px; align-items: center; justify-content: center; }
      .bk-badge-solid, .bk-badge-outline, .bk-badge-green {
        font-family: var(--font-m);
        font-size: 9.5px;
        font-weight: 500;
        padding: 3px 8px;
        border-radius: 2px;
      }
      .bk-badge-solid { background: #FFFFFF; color: var(--carbon); font-weight: 500; }
      .bk-badge-outline { border: 1px solid #6B7280; color: var(--txt-2); }
      .bk-badge-green { background: var(--green); color: var(--green-ink); font-weight: 500; }
      .bk-crop { position: relative; width: 100%; height: 88px; }
      .bk-crop i { position: absolute; width: 14px; height: 14px; }
      .bk-crop-1 { top: 0; left: 0; border-top: 1.5px solid var(--ink); border-left: 1.5px solid var(--ink); }
      .bk-crop-2 { top: 0; right: 0; border-top: 1.5px solid var(--ink); border-right: 1.5px solid var(--ink); }
      .bk-crop-3 { bottom: 0; left: 0; border-bottom: 1.5px solid var(--ink); border-left: 1.5px solid var(--ink); }
      .bk-crop-4 { bottom: 0; right: 0; border-bottom: 1.5px solid var(--ink); border-right: 1.5px solid var(--ink); }
      .bk-crop b {
        position: absolute;
        inset: 17px 24px;
        border: 1px dashed #B4AC97;
        border-radius: 2px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-family: var(--font-m);
        font-weight: 500;
        font-size: 9px;
        color: var(--ink-2);
      }

      /* ── hero de muestra ── */
      .bk-hero {
        margin-top: 30px;
        background: #0B0B0E;
        border: 1px solid var(--graphite);
        border-radius: 4px;
        overflow: hidden;
        position: relative;
      }
      .bk-hero-glow {
        position: absolute;
        inset: 0;
        pointer-events: none;
        background: radial-gradient(620px 300px at 82% -8%, rgba(34, 197, 94, 0.16), transparent 66%);
      }
      .bk-hero-inner { position: relative; padding: clamp(30px, 5.5vw, 64px); }
      .bk-hero-tag {
        display: flex;
        align-items: center;
        gap: 10px;
        font-family: var(--font-m);
        font-size: 10.5px;
        font-weight: 500;
        color: var(--green-2);
        margin: 0 0 22px;
      }
      .bk-hero-h {
        font-family: var(--font-d);
        font-weight: 900;
        font-size: clamp(34px, 6vw, 62px);
        letter-spacing: -0.025em;
        line-height: 1.04;
        margin: 0 0 18px;
        color: var(--txt);
      }
      .bk-hero-p { font-size: 16px; line-height: 1.65; color: #B9BDC5; max-width: 52ch; margin: 0 0 30px; }
      .bk-hero-ctas { display: flex; flex-wrap: wrap; gap: 12px; }
      .bk-btn {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        font-family: var(--font-b);
        font-weight: 600;
        font-size: 15px;
        padding: 13px 22px;
        border-radius: 4px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: transform 0.25s var(--ease), box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .bk-btn:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
      .bk-btn-green { background: var(--green); color: var(--green-ink); }
      .bk-btn-green:hover { transform: translateY(-2px); box-shadow: 0 16px 36px -14px rgba(34, 197, 94, 0.6); }
      .bk-btn-ghost { background: transparent; border-color: var(--line-soft); color: var(--txt); }
      .bk-btn-ghost:hover { border-color: var(--green); }
      .bk-hero-strip {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        border-top: 1px solid var(--graphite);
        border-radius: 0;
      }
      .bk-hero-strip > div {
        padding: 15px 22px;
        display: flex;
        flex-direction: column;
        gap: 4px;
        border-left: 1px solid var(--paper-line);
      }
      .bk-hero-strip > div:first-child { border-left: none; }
      .bk-hero-strip span { font-family: var(--font-m); font-size: 9px; font-weight: 500; color: var(--ink-2); }
      .bk-hero-strip strong { font-size: 13.5px; font-weight: 600; color: var(--ink); display: flex; align-items: center; gap: 8px; }
      .bk-chipdot { width: 10px; height: 10px; background: var(--green); border-radius: 2px; display: inline-block; }
      @media (max-width: 640px) {
        .bk-hero-strip { grid-template-columns: 1fr; }
        .bk-hero-strip > div { border-left: none; border-top: 1px solid var(--paper-line); }
        .bk-hero-strip > div:first-child { border-top: none; }
      }

      /* ── footer ── */
      .bk-footer {
        display: flex;
        flex-wrap: wrap;
        justify-content: space-between;
        align-items: center;
        gap: 14px;
        padding: 6px 6px 26px;
      }
      .bk-footer-c { margin: 0; font-size: 13px; color: var(--txt-2); }
      .bk-footer-belts { display: flex; gap: 6px; }
      .bk-fdot { width: 9px; height: 9px; border-radius: 50%; border: 1px solid rgba(255, 255, 255, 0.18); }

      /* ── estado / pulso ── */
      .bk-dot {
        display: inline-block;
        width: 8px;
        height: 8px;
        border-radius: 50%;
        background: var(--green);
        box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.55);
        animation: bk-pulse 2.4s ease-out infinite;
      }
      @keyframes bk-pulse {
        0% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0.5); }
        70% { box-shadow: 0 0 0 7px rgba(34, 197, 94, 0); }
        100% { box-shadow: 0 0 0 0 rgba(34, 197, 94, 0); }
      }

      /* ── reveals ── */
      .bk-r {
        opacity: 0;
        transform: translateY(18px);
        transition:
          opacity 0.7s var(--ease) var(--d, 0ms),
          transform 0.7s var(--ease) var(--d, 0ms);
      }
      .bk-in .bk-r, .bk-in.bk-r { opacity: 1; transform: none; }
      /* los hovers usan translate/rotate: transición propia, sin el delay del reveal */
      .bk-swatch.bk-r, .bk-motif.bk-r {
        transition:
          opacity 0.7s var(--ease) var(--d, 0ms),
          transform 0.7s var(--ease) var(--d, 0ms),
          translate 0.3s var(--ease),
          rotate 0.3s var(--ease),
          box-shadow 0.35s var(--ease),
          border-color 0.3s ease;
      }

      /* ── reduced motion: todo estático y visible ── */
      @media (prefers-reduced-motion: reduce) {
        .bk-r, .bk-stamp, .bk-seg, .bk-stripe {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        .bk-stamp { transform: rotate(-8deg) !important; }
        .bk-draw { stroke-dashoffset: 0 !important; transition: none !important; }
        .bk-dot { animation: none !important; }
        .bk-motif, .bk-swatch, .bk-belt-swatch, .bk-btn { transition: none !important; }
      }
    `}</style>
  )
}
