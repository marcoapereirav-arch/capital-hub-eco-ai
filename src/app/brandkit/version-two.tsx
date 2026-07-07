"use client"

import { useEffect, useState, type CSSProperties, type ReactNode } from "react"

/*
 * BRANDKIT V2 · Capital Hub · Manual de identidad
 *
 * Direccion: lujo + dojo. Bandas editoriales a sangre completa (carbon mate
 * contra papel hueso), reglas de 1 px, aire generoso, verde en dosis minima.
 * Una sola familia tipografica: Inter Tight, de 400 a 900; la jerarquia se
 * construye con peso, tamano y color. El tracking amplio es exclusivo del
 * wordmark.
 *
 * Los cinturones se dibujan como cinturones reales (banda, nudo, puntas y
 * costuras, en SVG), con la escalera completa del blanco al negro y la
 * progresion de grados por rayas en la punta.
 *
 * Reglas duras honradas: cero guion largo en todo el archivo, sin grid de
 * fondo, sin neones fuera del verde, prefers-reduced-motion respetado,
 * animaciones GPU-friendly (transform/opacity), autocontenido.
 */

/* ============================== helpers ============================== */

/** Delay escalonado para reveals: style={d(120)} equivale a --d: 120ms */
function d(ms: number): CSSProperties {
  return { "--d": `${ms}ms` } as CSSProperties
}

/** Marca [data-lxr] con .lx-in al entrar en viewport (o al instante con reduced motion). */
function useReveal(): void {
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-lxr]"))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("lx-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("lx-in")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.14, rootMargin: "0px 0px -8% 0px" }
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

/* ============================== datos ============================== */

const BELTS = [
  { level: "00", name: "Blanco", hex: "#F5F6F7", light: true },
  { level: "01", name: "Amarillo", hex: "#D9B14A", light: false },
  { level: "02", name: "Naranja", hex: "#D08048", light: false },
  { level: "03", name: "Verde", hex: "#22C55E", light: false },
  { level: "04", name: "Azul", hex: "#4F7CC0", light: false },
  { level: "05", name: "Marrón", hex: "#856046", light: false },
  { level: "06", name: "Negro", hex: "#0F0F12", light: false },
] as const

const USAGE = [
  { name: "Negro Carbón", hex: "#0F0F12", pct: 45 },
  { name: "Papel Hueso", hex: "#F4F1E8", pct: 30 },
  { name: "Gris Grafito", hex: "#2A2D34", pct: 15 },
  { name: "Verde", hex: "#22C55E", pct: 8 },
  { name: "Verde Claro", hex: "#4ADE80", pct: 2 },
] as const

const PLATES = [
  {
    name: "Negro Carbón",
    hex: "#0F0F12",
    role: "Base del sistema. Fondos y superficies principales.",
    pct: "45%",
    bg: "#0F0F12",
    fg: "#F5F6F7",
    wide: true,
    hairline: true,
  },
  {
    name: "Papel Hueso",
    hex: "#F4F1E8",
    role: "Contrapunto claro. Paneles, documentos y certificados.",
    pct: "30%",
    bg: "#F4F1E8",
    fg: "#141414",
    wide: true,
    hairline: false,
  },
  {
    name: "Gris Grafito",
    hex: "#2A2D34",
    role: "Contenedores y líneas sobre carbón.",
    pct: "15%",
    bg: "#2A2D34",
    fg: "#F5F6F7",
    wide: false,
    hairline: false,
  },
  {
    name: "Verde",
    hex: "#22C55E",
    role: "Acento único. Acción, estado y foco.",
    pct: "8%",
    bg: "#22C55E",
    fg: "#08130C",
    wide: false,
    hairline: false,
  },
  {
    name: "Verde Claro",
    hex: "#4ADE80",
    role: "Acento sobre carbón. Texto e iconos.",
    pct: "2%",
    bg: "#4ADE80",
    fg: "#08130C",
    wide: false,
    hairline: false,
  },
] as const

const WEIGHTS = [
  { w: 900, name: "Black", role: "Display y cifras grandes" },
  { w: 800, name: "ExtraBold", role: "Titulares" },
  { w: 700, name: "Bold", role: "Subtítulos" },
  { w: 600, name: "SemiBold", role: "Botones y énfasis" },
  { w: 500, name: "Medium", role: "Etiquetas y datos" },
  { w: 400, name: "Regular", role: "Cuerpo de texto" },
] as const

/* ============================== página ============================== */

export function VersionTwo() {
  useReveal()
  return (
    <main className="lx-root">
      <LxStyles />
      <Cover />
      <LogoSection />
      <ColorSection />
      <TypeSection />
      <BeltSection />
      <MotifSection />
      <ApplicationSection />
      <LxFooter />
    </main>
  )
}

/* ============================== portada ============================== */

function Cover() {
  return (
    <section className="lx-sec lx-sec-carbon lx-cover" data-lxr aria-label="Portada">
      <div className="lx-wrap lx-cover-wrap">
        <p className="lx-cover-over lx-r" style={d(0)}>
          Capital Hub · Manual de identidad · 2026
        </p>
        <LxSeal id="lx-seal-cover" size={104} className="lx-cover-seal lx-r" style={d(140)} />
        <h1 className="lx-wordmark lx-r" style={d(280)}>
          Capital Hub
        </h1>
        <span className="lx-cover-rule lx-r" style={d(430)} aria-hidden="true" />
        <p className="lx-cover-phrase lx-r" style={d(520)}>
          Disciplina, oficio, progreso.
        </p>
        <div className="lx-cover-belts lx-r" style={d(640)} aria-hidden="true">
          {BELTS.map((b) => (
            <i key={b.level} style={{ background: b.hex }} />
          ))}
        </div>
      </div>
    </section>
  )
}

/* ============================== 01 · logo ============================== */

function LogoSection() {
  return (
    <section className="lx-sec lx-sec-carbon" aria-label="Logo">
      <div className="lx-wrap">
        <SectionHead n="01" title="Logo" lead="Dos piezas: el wordmark y el monograma. No se estiran, no se inclinan y no se recolorean fuera de la paleta." />

        <div className="lx-logogrid" data-lxr>
          <article className="lx-logocard lx-paperbox lx-r" style={d(0)}>
            <p className="lx-label">Wordmark</p>
            <p className="lx-wordmark-md">Capital Hub</p>
            <span className="lx-hr-p" aria-hidden="true" />
            <ul className="lx-facts">
              <li>
                <span>Composición</span>
                <strong>Inter Tight · Mayúsculas · Tracking amplio</strong>
              </li>
              <li>
                <span>Uso del tracking</span>
                <strong>Exclusivo del logo</strong>
              </li>
              <li>
                <span>Área de respeto</span>
                <strong>La altura de la C en todo el perímetro</strong>
              </li>
            </ul>
            <div className="lx-logoplates">
              <div className="lx-logoplate lx-logoplate-pos">
                <span className="lx-wordmark-xs">Capital Hub</span>
                <em>Positivo · tinta sobre papel</em>
              </div>
              <div className="lx-logoplate lx-logoplate-neg">
                <span className="lx-wordmark-xs">Capital Hub</span>
                <em>Negativo · papel sobre carbón</em>
              </div>
            </div>
          </article>

          <article className="lx-logocard lx-logocard-dark lx-r" style={d(140)}>
            <p className="lx-label">Monograma</p>
            <div className="lx-monoshow">
              <LxSeal id="lx-seal-logo" size={168} className="lx-stamp" style={d(320)} />
            </div>
            <span className="lx-hr-c" aria-hidden="true" />
            <ul className="lx-facts lx-facts-dark">
              <li>
                <span>Construcción</span>
                <strong>CH dentro de doble anillo</strong>
              </li>
              <li>
                <span>Uso</span>
                <strong>Avatar, favicon, sello y firma</strong>
              </li>
              <li>
                <span>Tamaño mínimo</span>
                <strong>24 px de diámetro</strong>
              </li>
            </ul>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ============================== 02 · color ============================== */

function ColorSection() {
  return (
    <section className="lx-sec lx-sec-carbon lx-sec-line" aria-label="Color">
      <div className="lx-wrap">
        <SectionHead n="02" title="Color" lead="Dos materiales y un acento. El carbón es la base, el papel hueso es el contrapunto y el verde entra en dosis mínima, como un metal precioso." />

        <div className="lx-usage" data-lxr>
          <div className="lx-usagebar" role="img" aria-label="Proporción de uso de color">
            {USAGE.map((u, i) => (
              <i key={u.name} className="lx-seg" style={{ width: `${u.pct}%`, background: u.hex, ...d(i * 140) }} />
            ))}
          </div>
          <ul className="lx-usage-legend">
            {USAGE.map((u) => (
              <li key={u.name}>
                <i style={{ background: u.hex }} aria-hidden="true" />
                {u.name} · {u.pct}%
              </li>
            ))}
          </ul>
        </div>

        <div className="lx-plates" data-lxr>
          {PLATES.map((p, i) => (
            <article
              key={p.name}
              className={`lx-plate lx-r${p.wide ? " lx-plate-wide" : ""}${p.hairline ? " lx-plate-hairline" : ""}`}
              style={{ background: p.bg, color: p.fg, ...d(i * 90) }}
            >
              <div className="lx-plate-top">
                <span className="lx-plate-pct">{p.pct}</span>
                <CopyHex hex={p.hex} />
              </div>
              <div>
                <h3 className="lx-plate-name">{p.name}</h3>
                <p className="lx-plate-role">{p.role}</p>
              </div>
            </article>
          ))}
        </div>

        <div className="lx-textcolors" data-lxr>
          <div className="lx-textcolor lx-r" style={d(0)}>
            <i style={{ background: "#F5F6F7" }} aria-hidden="true" />
            <div>
              <strong>Blanco Roto</strong>
              <span>Texto sobre carbón</span>
            </div>
            <CopyHex hex="#F5F6F7" />
          </div>
          <div className="lx-textcolor lx-r" style={d(120)}>
            <i style={{ background: "#141414" }} aria-hidden="true" />
            <div>
              <strong>Tinta</strong>
              <span>Texto sobre papel</span>
            </div>
            <CopyHex hex="#141414" />
          </div>
        </div>

        <div className="lx-contrast lx-r" data-lxr style={d(80)}>
          <div className="lx-contrast-half lx-contrast-carbon">
            <span className="lx-aa">Aa</span>
            <span className="lx-contrast-meta">Carbón #0F0F12 · Blanco Roto #F5F6F7</span>
          </div>
          <div className="lx-contrast-half lx-contrast-paper lx-paperbox">
            <span className="lx-aa">Aa</span>
            <span className="lx-contrast-meta">Papel #F4F1E8 · Tinta #141414</span>
          </div>
          <span className="lx-contrast-chip">16.9 : 1 · AAA</span>
        </div>
      </div>
    </section>
  )
}

/* ============================== 03 · tipografía ============================== */

function TypeSection() {
  return (
    <section className="lx-sec lx-sec-carbon lx-sec-line" aria-label="Tipografía">
      <div className="lx-wrap">
        <SectionHead n="03" title="Tipografía" lead="Una sola familia: Inter Tight, de 400 a 900. La jerarquía se construye con peso, tamaño y color, nunca con otra fuente." />

        <div className="lx-specimen lx-paperbox lx-r" data-lxr style={d(0)}>
          <span className="lx-specimen-aa">Aa</span>
          <div className="lx-specimen-side">
            <strong>Inter Tight</strong>
            <span>Única familia del sistema</span>
            <p className="lx-specimen-alpha">
              AaBbCcDdEeFfGgHhIiJjKkLlMmNnÑñOoPpQqRrSsTtUuVvWwXxYyZz
              <br />
              0123456789 €%&amp;@?!·()
            </p>
          </div>
        </div>

        <div className="lx-weights" data-lxr>
          {WEIGHTS.map((row, i) => (
            <div key={row.w} className="lx-weight-row lx-r" style={d(i * 90)}>
              <div className="lx-weight-meta">
                <strong>{row.w} · {row.name}</strong>
                <span>{row.role}</span>
              </div>
              <p className="lx-weight-sample" style={{ fontWeight: row.w }}>
                Del blanco al negro.
              </p>
            </div>
          ))}
        </div>

        <p className="lx-typenote lx-r" data-lxr style={d(60)}>
          Espaciado normal en todo el sistema. El tracking amplio queda reservado al wordmark.
        </p>
      </div>
    </section>
  )
}

/* ============================== 04 · cinturones ============================== */

function BeltSection() {
  return (
    <section className="lx-sec lx-sec-paper" aria-label="Cinturones">
      <div className="lx-wrap">
        <SectionHead
          n="04"
          title="Cinturones"
          lead="El nivel del alumno se expresa con un cinturón, como en las artes marciales: se entra de blanco y se progresa hasta el negro. Siete niveles, numerados del 00 al 06."
          paper
        />

        <div className="lx-beltladder" data-lxr>
          {BELTS.map((b, i) => (
            <figure key={b.level} className="lx-beltcell lx-r" style={d(i * 100)}>
              <BeltIcon id={`ladder-${b.level}`} color={b.hex} light={b.light} />
              <figcaption>
                <span className="lx-beltcell-lv">{b.level}</span>
                <span className="lx-beltcell-name">{b.name}</span>
                <span className="lx-beltcell-hex">{b.hex}</span>
              </figcaption>
            </figure>
          ))}
        </div>

        <span className="lx-hr-p lx-hr-wide" aria-hidden="true" />

        <div data-lxr>
          <h3 className="lx-h3 lx-r" style={d(0)}>Grados</h3>
          <p className="lx-lead lx-lead-paper lx-r" style={d(100)}>
            Dentro de cada cinturón el alumno gana rayas. La raya es una cinta verde
            en la punta del cinturón: <MarkUnder delay={900}>cuatro rayas</MarkUnder> completan
            el nivel y dan paso al siguiente cinturón.
          </p>
        </div>

        <div className="lx-progression" data-lxr>
          {[0, 1, 2, 3].map((n, i) => (
            <figure key={n} className="lx-progcell lx-r" style={d(i * 140)}>
              <BeltIcon id={`prog-${n}`} color="#F5F6F7" light stripes={n} />
              <figcaption>
                <span className="lx-progcell-name">
                  {n === 0 ? "Blanco" : n === 1 ? "Blanco · 1 raya" : `Blanco · ${n} rayas`}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        <p className="lx-beltnote lx-r" data-lxr style={d(40)}>
          La raya se marca siempre en verde #22C55E, sobre cualquier cinturón.
        </p>
      </div>
    </section>
  )
}

/* ============================== 05 · motifs ============================== */

function MotifSection() {
  return (
    <section className="lx-sec lx-sec-carbon" aria-label="Motifs">
      <div className="lx-wrap">
        <SectionHead n="05" title="Motifs" lead="Recursos gráficos del sistema. Se usan de uno en uno: un motif por pieza." />

        <div className="lx-motifs" data-lxr>
          <MotifCard n="01" title="Marcador" paper delay={0}
            desc="Trazo de rotulador en verde sobre una palabra clave. Se dibuja una vez y sobre una sola palabra por pieza.">
            <div className="lx-m-marker">
              <p><MarkUnder delay={300}>progreso</MarkUnder></p>
              <p><MarkRing delay={800}>nivel</MarkRing></p>
            </div>
          </MotifCard>

          <MotifCard n="02" title="Sello CH" paper delay={70}
            desc="Monograma CH en doble anillo, estampado en verde. Cierres, certificados y documentos.">
            <LxSeal id="lx-seal-motif" size={108} className="lx-stamp lx-stamp-green" style={d(300)} />
          </MotifCard>

          <MotifCard n="03" title="Cinturón en barra" delay={140}
            desc="Versión de interfaz del cinturón: barra de color con parche de grados.">
            <div className="lx-m-beltbar">
              <BeltBar color="#22C55E" stripes={3} />
              <span className="lx-m-caption">Nivel 03 · 3 grados</span>
            </div>
          </MotifCard>

          <MotifCard n="04" title="Etiqueta de nivel" delay={210}
            desc="El nivel escrito: cinturón y número. Peso medio, tamaño pequeño.">
            <div className="lx-m-chips">
              <span className="lx-chip lx-chip-green">Cinturón verde · Nivel 03</span>
              <span className="lx-chip">Cinturón blanco · Nivel 00</span>
            </div>
          </MotifCard>

          <MotifCard n="05" title="Contraste de materiales" delay={280}
            desc="Carbón junto a papel hueso. La combinación base de todas las piezas.">
            <div className="lx-m-mats">
              <div className="lx-m-mat lx-m-mat-carbon">Aa</div>
              <div className="lx-m-mat lx-m-mat-paper">Aa</div>
            </div>
          </MotifCard>

          <MotifCard n="06" title="Línea fina" delay={350}
            desc="Separadores de 1 px con aire generoso. Sin cajas pesadas.">
            <div className="lx-m-lines">
              <i style={{ width: "100%" }} />
              <i style={{ width: "68%" }} />
              <i style={{ width: "86%" }} />
            </div>
          </MotifCard>

          <MotifCard n="07" title="Iconos lineales" delay={420}
            desc="Trazo de 1.5 px, terminaciones redondeadas, sin relleno.">
            <div className="lx-m-icons">
              <IconFolder />
              <IconUser />
              <IconBell />
            </div>
          </MotifCard>

          <MotifCard n="08" title="Numeración de nivel" delay={490}
            desc="Los niveles se numeran del 00 al 06. Cifras en Black para display.">
            <div className="lx-m-num">
              <span className="lx-m-num-big">03</span>
              <span className="lx-m-num-of">/ 06</span>
            </div>
          </MotifCard>
        </div>
      </div>
    </section>
  )
}

/* ============================== 06 · aplicación ============================== */

function ApplicationSection() {
  return (
    <section className="lx-sec lx-sec-paper lx-sec-pline" aria-label="Aplicación">
      <div className="lx-wrap">
        <SectionHead n="06" title="Aplicación" lead="El sistema aplicado a piezas reales." paper />

        <div className="lx-appgrid" data-lxr>
          <article className="lx-carnet lx-r" style={d(0)}>
            <header className="lx-carnet-head">
              <span className="lx-carnet-mono">CH</span>
              <span className="lx-wordmark-xs lx-carnet-brand">Capital Hub</span>
            </header>
            <div className="lx-carnet-body">
              <p className="lx-carnet-name">Nombre del alumno</p>
              <p className="lx-carnet-sub">Alumno · 2026</p>
              <div className="lx-carnet-belt">
                <BeltBar color="#4F7CC0" stripes={2} height={12} />
                <span>Cinturón azul · 2 grados</span>
              </div>
            </div>
            <footer className="lx-carnet-foot">
              <span>Nivel 04</span>
              <span>00 → 06</span>
            </footer>
          </article>

          <article className="lx-uicard lx-paperbox lx-r" style={d(160)}>
            <p className="lx-label">Botones y estados</p>
            <div className="lx-ui-btns">
              <button type="button" className="lx-btn lx-btn-green">Acción principal</button>
              <button type="button" className="lx-btn lx-btn-ghost">Acción secundaria</button>
            </div>
            <span className="lx-hr-p" aria-hidden="true" />
            <div className="lx-ui-chips">
              <span className="lx-chip lx-chip-paper-green">Cinturón azul · Nivel 04</span>
              <span className="lx-chip lx-chip-paper">Alumno activo</span>
            </div>
            <p className="lx-ui-note">Verde solo en la acción principal. Una por pantalla.</p>
          </article>
        </div>
      </div>
    </section>
  )
}

/* ============================== footer ============================== */

function LxFooter() {
  return (
    <footer className="lx-footer" data-lxr>
      <div className="lx-wrap lx-footer-wrap">
        <p className="lx-footer-c lx-r" style={d(0)}>© Capital Hub · Manual de identidad · 2026</p>
        <div className="lx-footer-belts lx-r" style={d(140)} aria-hidden="true">
          {BELTS.map((b) => (
            <i key={b.level} style={{ background: b.hex }} />
          ))}
        </div>
      </div>
    </footer>
  )
}

/* ============================== piezas ============================== */

function SectionHead({
  n,
  title,
  lead,
  paper = false,
}: {
  n: string
  title: string
  lead: string
  paper?: boolean
}) {
  return (
    <div className="lx-shead" data-lxr>
      <p className={`lx-kick lx-r${paper ? " lx-kick-paper" : ""}`} style={d(0)}>
        <span>{n}</span>
        <i aria-hidden="true" />
      </p>
      <h2 className={`lx-h2 lx-r${paper ? " lx-h2-paper" : ""}`} style={d(120)}>{title}</h2>
      <p className={`lx-lead lx-r${paper ? " lx-lead-paper" : ""}`} style={d(240)}>{lead}</p>
    </div>
  )
}

/**
 * Cinturón de artes marciales en SVG: banda, nudo, puntas colgantes,
 * costuras y brillo de tela. Las rayas de grado se colocan en la punta
 * derecha, de la punta hacia dentro.
 */
function BeltIcon({
  id,
  color,
  light = false,
  stripes = 0,
  stripeColor = "#22C55E",
}: {
  id: string
  color: string
  light?: boolean
  stripes?: number
  stripeColor?: string
}) {
  const stitch = light ? "rgba(20,20,20,0.28)" : "rgba(245,246,247,0.42)"
  const edge = light ? "#C6BFA9" : "rgba(15,15,18,0.24)"
  const grad = `lx-sheen-${id}`
  const stripeEls: ReactNode[] = []
  for (let i = 0; i < stripes; i += 1) {
    const t = 0.84 - i * 0.16
    const x = (128 + 43.5 * t).toFixed(1)
    const y = (66 + 73.5 * t).toFixed(1)
    stripeEls.push(
      <g key={i} transform={`translate(${x} ${y}) rotate(-30.6)`}>
        <rect
          className="lx-bstripe"
          style={d(480 + i * 200)}
          x="-13.5"
          y="-3.4"
          width="27"
          height="6.8"
          rx="1"
          fill={stripeColor}
        />
      </g>
    )
  }
  return (
    <svg viewBox="0 0 240 168" className="lx-beltsvg" aria-hidden="true">
      <defs>
        <linearGradient id={grad} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.15" />
          <stop offset="0.45" stopColor="#FFFFFF" stopOpacity="0" />
          <stop offset="1" stopColor="#000000" stopOpacity="0.17" />
        </linearGradient>
      </defs>

      {/* banda que rodea la cintura */}
      <rect x="8" y="46" width="224" height="30" rx="2.5" fill={color} stroke={edge} strokeWidth="1" />
      <rect x="8" y="46" width="224" height="30" rx="2.5" fill={`url(#${grad})`} />
      <line x1="16" y1="52" x2="224" y2="52" stroke={stitch} strokeWidth="1" strokeDasharray="2.5 4.5" />
      <line x1="16" y1="70" x2="224" y2="70" stroke={stitch} strokeWidth="1" strokeDasharray="2.5 4.5" />

      {/* puntas colgantes (detrás del nudo) */}
      <path d="M102.6 60.4 L121.4 71.6 L79.5 147.5 L57 132.5 Z" fill={color} stroke={edge} strokeWidth="1" />
      <path d="M102.6 60.4 L121.4 71.6 L79.5 147.5 L57 132.5 Z" fill={`url(#${grad})`} />
      <path d="M137.4 60.4 L118.6 71.6 L160.5 147.5 L183 132.5 Z" fill={color} stroke={edge} strokeWidth="1" />
      <path d="M137.4 60.4 L118.6 71.6 L160.5 147.5 L183 132.5 Z" fill={`url(#${grad})`} />
      {/* costuras de las puntas */}
      <line x1="117.6" y1="69.3" x2="76.7" y2="138.1" stroke={stitch} strokeWidth="1" strokeDasharray="2.5 4.5" />
      <line x1="106.4" y1="62.7" x2="65.5" y2="131.5" stroke={stitch} strokeWidth="1" strokeDasharray="2.5 4.5" />
      <line x1="122.4" y1="69.3" x2="163.3" y2="138.1" stroke={stitch} strokeWidth="1" strokeDasharray="2.5 4.5" />
      <line x1="133.6" y1="62.7" x2="174.5" y2="131.5" stroke={stitch} strokeWidth="1" strokeDasharray="2.5 4.5" />

      {/* rayas de grado en la punta derecha */}
      {stripeEls}

      {/* nudo */}
      <path
        d="M97 42 L143 42 Q152 42 149.5 50.5 L128.5 87 Q120 98.5 111.5 87 L90.5 50.5 Q88 42 97 42 Z"
        fill={color}
        stroke={edge}
        strokeWidth="1"
      />
      <path
        d="M97 42 L143 42 Q152 42 149.5 50.5 L128.5 87 Q120 98.5 111.5 87 L90.5 50.5 Q88 42 97 42 Z"
        fill={`url(#${grad})`}
      />
      <line x1="99" y1="48" x2="141" y2="48" stroke={stitch} strokeWidth="1" strokeDasharray="2.5 4.5" />
    </svg>
  )
}

/** Versión de interfaz del cinturón: barra de color con parche de grados. */
function BeltBar({
  color = "#22C55E",
  stripes = 3,
  height = 14,
}: {
  color?: string
  stripes?: number
  height?: number
}) {
  return (
    <div className="lx-beltbar" style={{ height, background: color }}>
      <div className="lx-beltbar-patch">
        {Array.from({ length: stripes }).map((_, i) => (
          <span key={i} className="lx-bstripe lx-beltbar-stripe" style={d(360 + i * 170)} />
        ))}
      </div>
    </div>
  )
}

/** Sello: doble anillo, texto en arco y monograma CH. */
function LxSeal({
  id,
  size = 150,
  className = "",
  style,
}: {
  id: string
  size?: number
  className?: string
  style?: CSSProperties
}) {
  return (
    <svg viewBox="0 0 180 180" width={size} height={size} className={className} style={style} aria-hidden="true">
      <defs>
        <path id={id} d="M 90,20 a 70,70 0 1,1 -0.01,0" fill="none" />
      </defs>
      <circle cx="90" cy="90" r="86" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="90" cy="90" r="57" fill="none" stroke="currentColor" strokeWidth="1" />
      <text className="lx-seal-arc">
        <textPath href={`#${id}`}>
          CAPITAL HUB · CAPITAL HUB · CAPITAL HUB · CAPITAL HUB · CAPITAL HUB ·
        </textPath>
      </text>
      <text x="90" y="91" className="lx-seal-ch" textAnchor="middle" dominantBaseline="central">
        CH
      </text>
    </svg>
  )
}

/** Subrayado de rotulador (doble pasada, se dibuja solo al entrar en viewport). */
function MarkUnder({ children, delay = 400 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="lx-mark">
      {children}
      <svg className="lx-mark-under" viewBox="0 0 220 16" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="lx-draw"
          style={d(delay)}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeWidth={3.6}
          d="M4 10 C 50 5, 120 3.5, 216 7"
        />
        <path
          className="lx-draw"
          style={d(delay + 280)}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeWidth={2.2}
          d="M14 13.5 C 70 10, 150 9, 198 11"
        />
      </svg>
    </span>
  )
}

/** Círculo de rotulador a mano alzada alrededor de una palabra. */
function MarkRing({ children, delay = 500 }: { children: ReactNode; delay?: number }) {
  return (
    <span className="lx-mark">
      {children}
      <svg className="lx-mark-ring" viewBox="0 0 300 130" preserveAspectRatio="none" aria-hidden="true">
        <path
          className="lx-draw lx-draw-slow"
          style={d(delay)}
          pathLength={1}
          vectorEffect="non-scaling-stroke"
          strokeWidth={3.4}
          d="M158 14 C 84 4, 20 30, 16 64 C 12 100, 84 124, 158 119 C 238 114, 288 88, 284 54 C 280 22, 208 4, 126 12"
        />
      </svg>
    </span>
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
    <button type="button" className="lx-hex" onClick={copy} title="Copiar hex">
      {copied ? "Copiado ✓" : hex}
    </button>
  )
}

function MotifCard({
  n,
  title,
  desc,
  paper = false,
  delay = 0,
  children,
}: {
  n: string
  title: string
  desc: string
  paper?: boolean
  delay?: number
  children: ReactNode
}) {
  return (
    <article className={`lx-motif lx-r${paper ? " lx-motif-paper lx-paperbox" : " lx-motif-dark"}`} style={d(delay)}>
      <header className="lx-motif-head">
        <span className="lx-motif-n">{n}</span>
        <h3 className="lx-motif-t">{title}</h3>
      </header>
      <div className="lx-motif-demo">{children}</div>
      <p className="lx-motif-desc">{desc}</p>
    </article>
  )
}

/* ============================== iconos lineales ============================== */

const ICON_PROPS = {
  width: 24,
  height: 24,
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

/* ============================== estilos ============================== */

function LxStyles() {
  return (
    <style>{`
      /* Inter Tight, unica familia de la pagina, rango 400 a 900 incl. Black.
         La jerarquia se hace con peso, tamano y color. */
      @import url('https://fonts.googleapis.com/css2?family=Inter+Tight:wght@400;500;600;700;800;900&display=swap');

      .lx-root {
        --carbon: #0F0F12;
        --carbon-2: #131318;
        --graphite: #2A2D34;
        --line: rgba(245, 246, 247, 0.1);
        --line-2: rgba(245, 246, 247, 0.2);
        --txt: #F5F6F7;
        --muted: #A6AAB2;
        --muted-2: #7C818A;
        --paper: #F4F1E8;
        --paper-2: #ECE8DA;
        --pline: rgba(20, 20, 20, 0.14);
        --pline-2: #D8D1BE;
        --ink: #141414;
        --ink-2: #57534A;
        --green: #22C55E;
        --green-2: #4ADE80;
        --greenink: #08130C;
        --ease: cubic-bezier(0.16, 1, 0.3, 1);
        --font: 'Inter Tight', -apple-system, BlinkMacSystemFont, 'Helvetica Neue', Arial, sans-serif;
        min-height: 100vh;
        background: var(--carbon);
        color: var(--txt);
        font-family: var(--font);
        -webkit-font-smoothing: antialiased;
        text-rendering: optimizeLegibility;
      }
      .lx-root ::selection { background: var(--green); color: var(--greenink); }

      /* ===== bandas y contenedor ===== */
      .lx-sec { width: 100%; }
      .lx-sec-carbon { background: var(--carbon); }
      .lx-sec-line { border-top: 1px solid var(--line); }
      .lx-sec-pline { border-top: 1px solid var(--pline-2); }
      .lx-wrap {
        max-width: 1120px;
        margin: 0 auto;
        padding: clamp(72px, 11vw, 150px) clamp(20px, 5vw, 48px);
      }

      /* papel hueso: el gi. Grano de papel sutil encima. */
      .lx-sec-paper { background: var(--paper); color: var(--ink); position: relative; }
      .lx-sec-paper::after,
      .lx-paperbox::after {
        content: "";
        position: absolute;
        inset: 0;
        pointer-events: none;
        opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
      }
      .lx-sec-paper > .lx-wrap { position: relative; z-index: 1; }
      .lx-paperbox { background: var(--paper); color: var(--ink); position: relative; }
      .lx-paperbox > * { position: relative; z-index: 1; }

      /* reglas finas */
      .lx-hr-c { display: block; height: 1px; background: var(--line); border: 0; margin: 22px 0; }
      .lx-hr-p { display: block; height: 1px; background: var(--pline); border: 0; margin: 22px 0; }
      .lx-hr-wide { margin: clamp(44px, 7vw, 80px) 0; }

      /* ===== cabecera de seccion ===== */
      .lx-shead { margin-bottom: clamp(40px, 6vw, 72px); }
      .lx-kick {
        display: flex;
        align-items: center;
        gap: 18px;
        margin: 0 0 26px;
        font-size: 12px;
        font-weight: 600;
        color: var(--green);
      }
      .lx-kick i { flex: 1; height: 1px; background: var(--line); }
      .lx-kick-paper { color: var(--ink); }
      .lx-kick-paper i { background: var(--pline); }
      .lx-h2 {
        font-weight: 900;
        font-size: clamp(40px, 6vw, 72px);
        letter-spacing: -0.02em;
        line-height: 1;
        margin: 0 0 22px;
        color: var(--txt);
      }
      .lx-h2-paper { color: var(--ink); }
      .lx-h3 {
        font-weight: 800;
        font-size: clamp(22px, 3vw, 30px);
        letter-spacing: -0.01em;
        margin: 0 0 14px;
        color: var(--ink);
      }
      .lx-lead {
        font-size: 16px;
        font-weight: 400;
        line-height: 1.75;
        color: var(--muted);
        max-width: 58ch;
        margin: 0;
      }
      .lx-lead-paper { color: var(--ink-2); }
      .lx-label {
        font-size: 11.5px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--ink-2);
        margin: 0 0 18px;
      }

      /* ===== portada ===== */
      .lx-cover { display: flex; }
      .lx-cover-wrap {
        min-height: min(86svh, 860px);
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        text-align: center;
        gap: 0;
      }
      .lx-cover-over {
        font-size: 12px;
        font-weight: 500;
        color: var(--muted-2);
        margin: 0 0 clamp(34px, 6vh, 60px);
      }
      .lx-cover-seal { color: var(--txt); opacity: 0.9; }
      /* UNICO elemento con tracking ancho: el wordmark. */
      .lx-wordmark {
        font-weight: 600;
        font-size: clamp(30px, 7vw, 88px);
        text-transform: uppercase;
        letter-spacing: 0.3em;
        padding-left: 0.3em;
        line-height: 1.2;
        color: var(--txt);
        margin: clamp(26px, 5vh, 48px) 0 0;
      }
      .lx-wordmark-md {
        font-weight: 600;
        font-size: clamp(19px, 2.6vw, 30px);
        text-transform: uppercase;
        letter-spacing: 0.3em;
        line-height: 1.3;
        color: var(--ink);
        margin: 0;
      }
      .lx-wordmark-xs {
        font-weight: 600;
        font-size: 12px;
        text-transform: uppercase;
        letter-spacing: 0.3em;
      }
      .lx-cover-rule {
        width: 64px;
        height: 1px;
        background: var(--line-2);
        margin: clamp(30px, 5vh, 52px) 0;
      }
      .lx-cover-phrase {
        font-size: 15.5px;
        font-weight: 400;
        color: var(--muted);
        margin: 0 0 clamp(40px, 7vh, 72px);
      }
      .lx-cover-belts { display: flex; gap: 7px; width: min(420px, 76%); }
      .lx-cover-belts i {
        flex: 1;
        height: 3px;
        border-radius: 1px;
        border: 1px solid rgba(245, 246, 247, 0.08);
      }

      /* ===== 01 logo ===== */
      .lx-logogrid {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      @media (max-width: 860px) { .lx-logogrid { grid-template-columns: 1fr; } }
      .lx-logocard {
        border-radius: 4px;
        padding: clamp(26px, 4vw, 44px);
        display: flex;
        flex-direction: column;
      }
      .lx-logocard-dark {
        background: var(--carbon-2);
        border: 1px solid var(--line);
      }
      .lx-logocard-dark .lx-label { color: var(--muted-2); }
      .lx-facts { list-style: none; margin: 0; padding: 0; }
      .lx-facts li {
        display: flex;
        justify-content: space-between;
        align-items: baseline;
        gap: 18px;
        padding: 11px 0;
        border-bottom: 1px solid var(--pline);
        font-size: 12.5px;
      }
      .lx-facts li:last-child { border-bottom: 0; }
      .lx-facts li span { color: var(--ink-2); font-weight: 400; white-space: nowrap; }
      .lx-facts li strong { color: var(--ink); font-weight: 500; text-align: right; }
      .lx-facts-dark li { border-bottom-color: var(--line); }
      .lx-facts-dark li span { color: var(--muted-2); }
      .lx-facts-dark li strong { color: var(--txt); }
      .lx-logoplates {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 10px;
        margin-top: 24px;
      }
      @media (max-width: 480px) { .lx-logoplates { grid-template-columns: 1fr; } }
      .lx-logoplate {
        border-radius: 3px;
        padding: 26px 16px 14px;
        display: flex;
        flex-direction: column;
        gap: 16px;
        align-items: flex-start;
      }
      .lx-logoplate em {
        font-style: normal;
        font-size: 10.5px;
        font-weight: 500;
        opacity: 0.62;
      }
      .lx-logoplate-pos { background: var(--paper-2); color: var(--ink); border: 1px solid var(--pline-2); }
      .lx-logoplate-neg { background: var(--carbon); color: var(--txt); }
      .lx-monoshow {
        flex: 1;
        min-height: 220px;
        display: flex;
        align-items: center;
        justify-content: center;
        color: var(--green);
        padding: 18px 0;
      }

      /* sello */
      .lx-stamp {
        opacity: 0;
        transform: scale(1.35) rotate(0deg);
        transition:
          transform 0.6s cubic-bezier(0.2, 1.3, 0.4, 1) var(--d, 300ms),
          opacity 0.35s ease var(--d, 300ms);
      }
      .lx-in .lx-stamp { opacity: 1; transform: scale(1) rotate(-6deg); }
      .lx-stamp-green { color: var(--green); mix-blend-mode: multiply; }
      .lx-seal-arc { font-size: 9.5px; font-weight: 600; fill: currentColor; }
      .lx-seal-ch { font-weight: 800; font-size: 50px; fill: currentColor; }

      /* ===== 02 color ===== */
      .lx-usage { margin-bottom: 16px; }
      .lx-usagebar {
        display: flex;
        height: 16px;
        border-radius: 2px;
        overflow: hidden;
        border: 1px solid var(--line);
      }
      .lx-seg {
        display: block;
        transform: scaleX(0);
        transform-origin: left;
        transition: transform 1s var(--ease) var(--d, 0ms);
      }
      .lx-in .lx-seg { transform: scaleX(1); }
      .lx-usage-legend {
        display: flex;
        flex-wrap: wrap;
        gap: 10px 24px;
        margin: 16px 0 0;
        padding: 0;
        list-style: none;
        font-size: 11px;
        font-weight: 500;
        color: var(--muted-2);
      }
      .lx-usage-legend i {
        display: inline-block;
        width: 9px;
        height: 9px;
        border-radius: 2px;
        margin-right: 7px;
        vertical-align: -1px;
        border: 1px solid rgba(245, 246, 247, 0.16);
      }

      .lx-plates {
        display: grid;
        grid-template-columns: repeat(6, 1fr);
        gap: 12px;
        margin-top: 26px;
      }
      .lx-plate {
        grid-column: span 2;
        border-radius: 4px;
        min-height: 190px;
        padding: 20px;
        display: flex;
        flex-direction: column;
        justify-content: space-between;
      }
      .lx-plate-wide { grid-column: span 3; min-height: 230px; }
      .lx-plate-hairline { border: 1px solid var(--line); }
      .lx-plate:hover { translate: 0 -3px; }
      .lx-plate-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 10px; }
      .lx-plate-pct { font-weight: 900; font-size: clamp(26px, 3.4vw, 38px); line-height: 1; }
      .lx-plate-name { font-weight: 700; font-size: 17px; margin: 0 0 6px; }
      .lx-plate-role { font-size: 12px; font-weight: 400; line-height: 1.5; margin: 0; opacity: 0.72; max-width: 30ch; }
      @media (max-width: 760px) {
        .lx-plates { grid-template-columns: repeat(2, 1fr); }
        .lx-plate, .lx-plate-wide { grid-column: span 1; min-height: 180px; }
        .lx-plate-wide { grid-column: span 2; }
      }

      .lx-textcolors {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 12px;
        margin-top: 12px;
      }
      @media (max-width: 640px) { .lx-textcolors { grid-template-columns: 1fr; } }
      .lx-textcolor {
        display: flex;
        align-items: center;
        gap: 14px;
        border: 1px solid var(--line);
        border-radius: 4px;
        padding: 14px 16px;
      }
      .lx-textcolor i {
        width: 30px;
        height: 30px;
        border-radius: 3px;
        border: 1px solid var(--line-2);
        flex: none;
      }
      .lx-textcolor div { flex: 1; display: flex; flex-direction: column; gap: 2px; }
      .lx-textcolor strong { font-size: 13.5px; font-weight: 600; }
      .lx-textcolor span { font-size: 11px; color: var(--muted-2); }

      .lx-hex {
        font-size: 11px;
        font-weight: 500;
        color: inherit;
        background: transparent;
        border: 1px solid color-mix(in srgb, currentColor 35%, transparent);
        border-radius: 2px;
        padding: 4px 9px;
        cursor: pointer;
        font-family: var(--font);
        transition: border-color 0.25s ease;
      }
      .lx-hex:hover { border-color: currentColor; }
      .lx-hex:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
      .lx-textcolor .lx-hex { color: var(--muted); }

      .lx-contrast {
        position: relative;
        display: grid;
        grid-template-columns: 1fr 1fr;
        border: 1px solid var(--line);
        border-radius: 4px;
        overflow: hidden;
        margin-top: 12px;
      }
      @media (max-width: 560px) { .lx-contrast { grid-template-columns: 1fr; } }
      .lx-contrast-half {
        padding: clamp(24px, 4vw, 40px);
        display: flex;
        flex-direction: column;
        gap: 10px;
      }
      .lx-contrast-carbon { background: var(--carbon-2); }
      .lx-contrast-paper { border-radius: 0; }
      .lx-aa { font-weight: 800; font-size: clamp(36px, 5vw, 56px); line-height: 1; }
      .lx-contrast-meta { font-size: 11px; font-weight: 500; opacity: 0.68; }
      .lx-contrast-chip {
        position: absolute;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 2;
        background: var(--green);
        color: var(--greenink);
        font-size: 11px;
        font-weight: 600;
        padding: 6px 12px;
        border-radius: 2px;
        white-space: nowrap;
      }

      /* ===== 03 tipografia ===== */
      .lx-specimen {
        border-radius: 4px;
        padding: clamp(28px, 4.5vw, 52px);
        display: flex;
        align-items: center;
        gap: clamp(24px, 4vw, 52px);
        flex-wrap: wrap;
      }
      .lx-specimen-aa {
        font-weight: 900;
        font-size: clamp(96px, 16vw, 190px);
        line-height: 0.9;
        letter-spacing: -0.02em;
        color: var(--ink);
      }
      .lx-specimen-side { display: flex; flex-direction: column; gap: 6px; min-width: 220px; flex: 1; }
      .lx-specimen-side strong { font-size: 20px; font-weight: 700; color: var(--ink); }
      .lx-specimen-side > span { font-size: 12px; font-weight: 500; color: var(--ink-2); }
      .lx-specimen-alpha {
        margin: 16px 0 0;
        padding-top: 16px;
        border-top: 1px solid var(--pline);
        font-size: 13.5px;
        font-weight: 500;
        line-height: 1.8;
        color: var(--ink-2);
        overflow-wrap: anywhere;
      }

      .lx-weights { margin-top: clamp(30px, 5vw, 52px); }
      .lx-weight-row {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 20px;
        align-items: center;
        padding: 20px 0;
        border-top: 1px solid var(--line);
      }
      .lx-weight-row:last-child { border-bottom: 1px solid var(--line); }
      @media (max-width: 720px) { .lx-weight-row { grid-template-columns: 1fr; gap: 8px; } }
      .lx-weight-meta { display: flex; flex-direction: column; gap: 4px; }
      .lx-weight-meta strong { font-size: 12.5px; font-weight: 600; color: var(--txt); }
      .lx-weight-meta span { font-size: 11.5px; font-weight: 400; color: var(--muted-2); }
      .lx-weight-sample {
        margin: 0;
        font-size: clamp(24px, 3.6vw, 38px);
        line-height: 1.15;
        letter-spacing: -0.01em;
        color: var(--txt);
      }
      .lx-typenote {
        margin: 26px 0 0;
        font-size: 13px;
        font-weight: 400;
        color: var(--muted-2);
      }

      /* ===== 04 cinturones ===== */
      .lx-beltsvg {
        width: 100%;
        height: auto;
        display: block;
        filter: drop-shadow(0 12px 16px rgba(20, 20, 20, 0.13));
      }
      .lx-beltladder {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(122px, 1fr));
        gap: clamp(10px, 2vw, 20px);
      }
      .lx-beltcell { margin: 0; text-align: center; transition: translate 0.35s var(--ease); }
      .lx-beltcell:hover { translate: 0 -4px; }
      .lx-beltcell figcaption { display: flex; flex-direction: column; gap: 2px; margin-top: 8px; }
      .lx-beltcell-lv { font-weight: 800; font-size: 15px; color: var(--ink); }
      .lx-beltcell-name { font-weight: 500; font-size: 12px; color: var(--ink); text-transform: uppercase; }
      .lx-beltcell-hex { font-weight: 400; font-size: 10.5px; color: var(--ink-2); }

      .lx-progression {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(164px, 1fr));
        gap: clamp(12px, 2vw, 24px);
        margin-top: clamp(28px, 4vw, 44px);
      }
      .lx-progcell {
        margin: 0;
        text-align: center;
        background: var(--paper-2);
        border: 1px solid var(--pline-2);
        border-radius: 4px;
        padding: 22px 16px 16px;
        transition: translate 0.35s var(--ease);
      }
      .lx-progcell:hover { translate: 0 -3px; }
      .lx-progcell-name {
        display: block;
        margin-top: 8px;
        font-size: 12px;
        font-weight: 600;
        color: var(--ink);
      }
      .lx-beltnote {
        margin: 26px 0 0;
        font-size: 13px;
        font-weight: 400;
        color: var(--ink-2);
      }

      /* rayas de grado: aparecen una a una */
      .lx-bstripe { opacity: 0; transition: opacity 0.5s ease var(--d, 300ms); }
      .lx-in .lx-bstripe { opacity: 1; }

      /* ===== 05 motifs ===== */
      .lx-motifs {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
        gap: 14px;
      }
      .lx-motif {
        border-radius: 4px;
        padding: 22px;
        min-height: 224px;
        display: flex;
        flex-direction: column;
      }
      .lx-motif-dark { background: var(--carbon-2); border: 1px solid var(--line); }
      .lx-motif-dark:hover { border-color: var(--line-2); translate: 0 -3px; }
      .lx-motif-paper:hover { translate: 0 -3px; }
      .lx-motif-head {
        display: flex;
        align-items: baseline;
        gap: 10px;
        padding-bottom: 12px;
        border-bottom: 1px solid var(--line);
      }
      .lx-motif-paper .lx-motif-head { border-bottom-color: var(--pline); }
      .lx-motif-n { font-size: 11px; font-weight: 700; color: var(--green-2); }
      .lx-motif-paper .lx-motif-n { color: var(--ink); }
      .lx-motif-t {
        font-size: 12px;
        font-weight: 600;
        text-transform: uppercase;
        color: var(--muted);
        margin: 0;
      }
      .lx-motif-paper .lx-motif-t { color: var(--ink-2); }
      .lx-motif-demo { flex: 1; display: flex; align-items: center; justify-content: center; padding: 20px 4px; }
      .lx-motif-desc { margin: 0; font-size: 12px; font-weight: 400; line-height: 1.55; color: var(--muted-2); }
      .lx-motif-paper .lx-motif-desc { color: var(--ink-2); }

      .lx-m-marker { display: flex; flex-direction: column; gap: 20px; align-items: center; }
      .lx-m-marker p { margin: 0; font-weight: 700; font-size: 23px; color: var(--ink); line-height: 1.2; }
      .lx-m-beltbar { width: 100%; }
      .lx-m-caption {
        display: block;
        margin-top: 10px;
        font-size: 10.5px;
        font-weight: 500;
        color: var(--muted-2);
        text-align: center;
        text-transform: uppercase;
      }
      .lx-m-chips { display: flex; flex-direction: column; gap: 9px; align-items: center; }
      .lx-chip {
        font-size: 10.5px;
        font-weight: 500;
        text-transform: uppercase;
        padding: 6px 11px;
        border: 1px solid var(--graphite);
        background: var(--carbon);
        border-radius: 2px;
        color: var(--txt);
      }
      .lx-chip-green { color: var(--green-2); border-color: #1E5A36; }
      .lx-chip-paper { background: transparent; border-color: #A9A292; color: var(--ink); }
      .lx-chip-paper-green { background: var(--green); border-color: var(--green); color: var(--greenink); }
      .lx-m-mats { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; width: 100%; }
      .lx-m-mat {
        height: 78px;
        border-radius: 3px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 700;
        font-size: 21px;
      }
      .lx-m-mat-carbon { background: var(--carbon); border: 1px solid var(--graphite); color: var(--txt); }
      .lx-m-mat-paper { background: var(--paper); color: var(--ink); }
      .lx-m-lines { width: 100%; display: flex; flex-direction: column; gap: 16px; align-items: flex-start; }
      .lx-m-lines i { display: block; height: 1px; background: var(--line-2); }
      .lx-m-icons { display: flex; gap: 20px; color: #E7E9ED; }
      .lx-m-num { display: flex; align-items: baseline; gap: 8px; }
      .lx-m-num-big { font-weight: 900; font-size: 62px; line-height: 1; letter-spacing: -0.02em; color: var(--txt); }
      .lx-m-num-of { font-weight: 500; font-size: 15px; color: var(--muted-2); }

      /* barra de cinturon (motif de interfaz) */
      .lx-beltbar {
        position: relative;
        width: 100%;
        border-radius: 2px;
        display: flex;
        justify-content: flex-end;
        overflow: hidden;
      }
      .lx-beltbar-patch {
        width: 26%;
        min-width: 64px;
        max-width: 120px;
        background: var(--carbon);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
      }
      .lx-beltbar-stripe {
        width: 4px;
        height: 62%;
        background: var(--paper);
        border-radius: 1px;
      }

      /* marcador */
      .lx-mark { position: relative; white-space: nowrap; }
      .lx-mark-under {
        position: absolute;
        left: -2%;
        bottom: -0.16em;
        width: 104%;
        height: 0.3em;
        overflow: visible;
      }
      .lx-mark-ring {
        position: absolute;
        top: -0.3em;
        left: -0.5em;
        width: calc(100% + 1em);
        height: calc(100% + 0.55em);
        overflow: visible;
      }
      .lx-draw {
        fill: none;
        stroke: var(--green);
        stroke-linecap: round;
        stroke-dasharray: 1;
        stroke-dashoffset: 1;
        transition: stroke-dashoffset 1s cubic-bezier(0.5, 0, 0.25, 1) var(--d, 300ms);
      }
      .lx-draw-slow { transition-duration: 1.35s; }
      .lx-in .lx-draw { stroke-dashoffset: 0; }
      .lx-sec-paper .lx-mark svg,
      .lx-paperbox .lx-mark svg { mix-blend-mode: multiply; }

      /* ===== 06 aplicacion ===== */
      .lx-appgrid {
        display: grid;
        grid-template-columns: 1fr 1.1fr;
        gap: 16px;
        align-items: stretch;
      }
      @media (max-width: 860px) { .lx-appgrid { grid-template-columns: 1fr; } }
      .lx-carnet {
        background: linear-gradient(150deg, #16161B 0%, var(--carbon) 62%);
        border: 1px solid var(--graphite);
        border-radius: 8px;
        padding: clamp(24px, 3.5vw, 34px);
        color: var(--txt);
        display: flex;
        flex-direction: column;
        gap: 26px;
        box-shadow: 0 26px 50px -30px rgba(15, 15, 18, 0.55);
      }
      .lx-carnet-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; }
      .lx-carnet-mono {
        width: 38px;
        height: 38px;
        border: 1px solid var(--line-2);
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-weight: 800;
        font-size: 13px;
        color: var(--txt);
      }
      .lx-carnet-brand { color: var(--muted); }
      .lx-carnet-body { flex: 1; display: flex; flex-direction: column; gap: 4px; }
      .lx-carnet-name { font-weight: 800; font-size: clamp(22px, 3vw, 28px); letter-spacing: -0.01em; margin: 0; }
      .lx-carnet-sub { font-size: 12.5px; font-weight: 400; color: var(--muted-2); margin: 0 0 22px; }
      .lx-carnet-belt { display: flex; flex-direction: column; gap: 9px; }
      .lx-carnet-belt > span { font-size: 11.5px; font-weight: 500; color: var(--muted); text-transform: uppercase; }
      .lx-carnet-foot {
        display: flex;
        justify-content: space-between;
        padding-top: 16px;
        border-top: 1px solid var(--line);
        font-size: 11px;
        font-weight: 500;
        color: var(--muted-2);
      }
      .lx-uicard {
        border: 1px solid var(--pline-2);
        border-radius: 8px;
        padding: clamp(24px, 3.5vw, 34px);
        display: flex;
        flex-direction: column;
      }
      .lx-ui-btns { display: flex; flex-wrap: wrap; gap: 12px; }
      .lx-btn {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        font-family: var(--font);
        font-weight: 600;
        font-size: 14.5px;
        padding: 12px 22px;
        border-radius: 4px;
        border: 1px solid transparent;
        cursor: pointer;
        transition: translate 0.25s var(--ease), box-shadow 0.25s ease, border-color 0.25s ease;
      }
      .lx-btn:focus-visible { outline: 2px solid var(--green); outline-offset: 2px; }
      .lx-btn-green { background: var(--green); color: var(--greenink); }
      .lx-btn-green:hover { translate: 0 -2px; box-shadow: 0 14px 30px -14px rgba(34, 197, 94, 0.55); }
      .lx-btn-ghost { background: transparent; border-color: #A9A292; color: var(--ink); }
      .lx-btn-ghost:hover { border-color: var(--ink); }
      .lx-ui-chips { display: flex; flex-wrap: wrap; gap: 9px; }
      .lx-ui-note { margin: 18px 0 0; font-size: 12.5px; font-weight: 400; color: var(--ink-2); }

      /* ===== footer ===== */
      .lx-footer { border-top: 1px solid var(--line); background: var(--carbon); }
      .lx-footer-wrap {
        padding-top: 34px;
        padding-bottom: 44px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 16px;
      }
      .lx-footer-c { margin: 0; font-size: 12.5px; font-weight: 400; color: var(--muted-2); }
      .lx-footer-belts { display: flex; gap: 6px; }
      .lx-footer-belts i {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        border: 1px solid rgba(245, 246, 247, 0.16);
      }

      /* ===== reveals: lentos y elegantes ===== */
      .lx-r {
        opacity: 0;
        transform: translateY(26px);
        transition:
          opacity 1.05s var(--ease) var(--d, 0ms),
          transform 1.05s var(--ease) var(--d, 0ms);
      }
      .lx-in .lx-r, .lx-in.lx-r { opacity: 1; transform: none; }
      /* los hovers usan translate (propiedad independiente): sin choque con el reveal */
      .lx-plate.lx-r, .lx-motif.lx-r {
        transition:
          opacity 1.05s var(--ease) var(--d, 0ms),
          transform 1.05s var(--ease) var(--d, 0ms),
          translate 0.3s var(--ease),
          border-color 0.3s ease;
      }

      /* ===== reduced motion: todo visible y estatico ===== */
      @media (prefers-reduced-motion: reduce) {
        .lx-r, .lx-stamp, .lx-seg, .lx-bstripe {
          opacity: 1 !important;
          transform: none !important;
          transition: none !important;
        }
        .lx-stamp { transform: rotate(-6deg) !important; }
        .lx-draw { stroke-dashoffset: 0 !important; transition: none !important; }
        .lx-plate, .lx-motif, .lx-beltcell, .lx-progcell, .lx-btn { transition: none !important; }
      }
    `}</style>
  )
}
