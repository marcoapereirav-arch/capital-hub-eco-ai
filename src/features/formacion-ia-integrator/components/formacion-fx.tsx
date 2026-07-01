"use client"

import { useEffect, type RefObject } from "react"

/**
 * Efectos compartidos de la formación IA Integrator (versión visual de los manuales).
 *
 * Reutiliza el patrón WOW de los funnels de Capital Hub (test-personalidad):
 * base monocromo (#0F0F12 · #141418 · hairlines #2A2D34 · texto #F5F6F7) + VERDE de
 * marca (#22C55E, iconos #4ADE80). Motion: entrada escalonada, reveals al scroll
 * (IntersectionObserver sobre [data-reveal]), diagramas SVG que se dibujan (stroke),
 * spotlight que sigue el cursor. Todo degrada con prefers-reduced-motion.
 */

// Hook: spotlight de cursor + reveals al scroll. Se engancha al <main ref>.
export function useScrollFx(rootRef: RefObject<HTMLElement | null>) {
  // Spotlight que sigue el cursor (desktop, sin reduced-motion)
  useEffect(() => {
    const el = rootRef.current
    if (!el) return
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return
    if (window.matchMedia("(pointer: coarse)").matches) return
    let raf = 0
    function onMove(e: MouseEvent) {
      cancelAnimationFrame(raf)
      raf = requestAnimationFrame(() => {
        el!.style.setProperty("--mx", `${e.clientX}px`)
        el!.style.setProperty("--my", `${e.clientY}px`)
      })
    }
    window.addEventListener("mousemove", onMove, { passive: true })
    return () => {
      window.removeEventListener("mousemove", onMove)
      cancelAnimationFrame(raf)
    }
  }, [rootRef])

  // Reveals al scroll (IntersectionObserver sobre [data-reveal] → añade .vc-in)
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>("[data-reveal]"))
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      els.forEach((el) => el.classList.add("vc-in"))
      return
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) {
            e.target.classList.add("vc-in")
            io.unobserve(e.target)
          }
        }
      },
      { threshold: 0.16 },
    )
    els.forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// Atmósfera de fondo (spotlight + glows + grano + viñeta). Sin grid.
export function FormacionAtmosphere() {
  return (
    <>
      <div aria-hidden className="vc-spotlight" />
      <div aria-hidden className="vc-glow" />
      <div aria-hidden className="vc-glow-green" />
      <div aria-hidden className="vc-grain" />
      <div aria-hidden className="vc-vignette" />
    </>
  )
}

// Todos los keyframes + clases de motion (incl. dibujado de diagramas). Prefijo vc-.
export function FormacionStyles() {
  return (
    <style>{`
      .vc-root { --mx: 50vw; --my: 24vh; }
      .vc-spotlight {
        position: fixed; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(440px circle at var(--mx) var(--my), rgba(245,246,247,0.055), transparent 70%);
        transition: background 120ms linear;
      }
      .vc-glow { position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(900px 460px at 50% -12%, rgba(245,246,247,0.05), transparent 70%); }
      .vc-glow-green { position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(680px 380px at 88% -6%, rgba(34,197,94,0.10), transparent 68%); }
      .vc-vignette { position: absolute; inset: 0; z-index: 0; pointer-events: none;
        background: radial-gradient(120% 120% at 50% 0%, transparent 55%, rgba(0,0,0,0.55) 100%); }
      .vc-grain {
        position: fixed; inset: -50%; z-index: 0; pointer-events: none; opacity: 0.05;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        animation: vc-grain 7s steps(6) infinite;
      }
      @keyframes vc-grain { 0%{transform:translate(0,0)} 16%{transform:translate(-4%,3%)} 33%{transform:translate(3%,-4%)}
        50%{transform:translate(-3%,2%)} 66%{transform:translate(4%,2%)} 83%{transform:translate(-2%,-3%)} 100%{transform:translate(0,0)} }

      /* Entrada escalonada */
      .vc-load { opacity: 0; transform: translateY(14px); animation: vc-load 0.7s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes vc-load { to { opacity: 1; transform: translateY(0); } }
      /* Líneas del headline con clip */
      .vc-line { display: block; opacity: 0; transform: translateY(110%); animation: vc-line 0.85s cubic-bezier(0.22,0.61,0.36,1) forwards; }
      @keyframes vc-line { to { opacity: 1; transform: translateY(0); } }
      /* Reveals al scroll */
      .vc-reveal { opacity: 0; transform: translateY(22px); transition: opacity 0.7s cubic-bezier(0.22,0.61,0.36,1), transform 0.7s cubic-bezier(0.22,0.61,0.36,1); }
      .vc-reveal.vc-in { opacity: 1; transform: translateY(0); }

      /* Punto status verde */
      .vc-dot { display:inline-block; width:7px; height:7px; border-radius:9999px; background:#22C55E; box-shadow:0 0 0 0 rgba(34,197,94,0.55); animation: vc-pulse 2.4s ease-out infinite; }
      @keyframes vc-pulse { 0%{box-shadow:0 0 0 0 rgba(34,197,94,0.5)} 70%{box-shadow:0 0 0 7px rgba(34,197,94,0)} 100%{box-shadow:0 0 0 0 rgba(34,197,94,0)} }

      /* Diagramas: la línea SVG se dibuja al entrar en viewport (pathLength=1) */
      .vc-draw { stroke-dasharray: 1; stroke-dashoffset: 1; transition: stroke-dashoffset 1.15s cubic-bezier(0.65,0,0.35,1); }
      .vc-in .vc-draw { stroke-dashoffset: 0; }
      /* Nodos del diagrama: aparecen en secuencia */
      .vc-node { opacity: 0; transform: scale(0.7); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.34,1.56,0.64,1); }
      .vc-in .vc-node { opacity: 1; transform: scale(1); }
      .vc-in .vc-node-1 { transition-delay: 0.10s } .vc-in .vc-node-2 { transition-delay: 0.34s }
      .vc-in .vc-node-3 { transition-delay: 0.58s } .vc-in .vc-node-4 { transition-delay: 0.82s }
      .vc-flow { opacity: 0; } .vc-in .vc-flow { opacity: 1; transition: opacity 0.4s ease 0.5s; }

      /* Chips de vocabulario: entran en secuencia */
      .vc-chip { opacity: 0; transform: translateY(10px); transition: opacity 0.5s ease, transform 0.5s cubic-bezier(0.22,0.61,0.36,1); }
      .vc-in .vc-chip { opacity: 1; transform: translateY(0); }

      /* Card hover */
      .vc-card { transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1), border-color 0.4s ease; }
      .vc-card:hover { transform: translateY(-3px); border-color: #2f6b45; }
      .vc-corner { position:absolute; top:0; right:0; width:32px; height:32px; border-top:1px solid #22C55E; border-right:1px solid #22C55E; opacity:0; transition:opacity 0.4s; }
      .vc-card:hover .vc-corner { opacity:0.7; }

      /* Link/CTA que se llena de verde */
      .vc-cta { transition: transform 0.25s cubic-bezier(0.22,0.61,0.36,1); will-change: transform; }
      .vc-cta-fill { position:absolute; inset:0; background:#22C55E; transform: scaleX(0); transform-origin:left; transition: transform 0.4s cubic-bezier(0.22,0.61,0.36,1); }
      .vc-cta:hover .vc-cta-fill { transform: scaleX(1); }
      .vc-cta-label, .vc-cta-arrow { transition: color 0.3s ease; }
      .vc-cta:hover .vc-cta-label, .vc-cta:hover .vc-cta-arrow { color: #FFFFFF; }

      /* Cue de scroll */
      .vc-scrollcue { animation: vc-bob 1.8s ease-in-out infinite; }
      @keyframes vc-bob { 0%,100%{transform:translateY(0);opacity:0.5} 50%{transform:translateY(6px);opacity:1} }

      @media (prefers-reduced-motion: reduce) {
        .vc-load, .vc-line, .vc-reveal, .vc-node, .vc-chip, .vc-grain, .vc-dot, .vc-draw, .vc-scrollcue {
          animation: none !important; transition: none !important; }
        .vc-load, .vc-line, .vc-reveal, .vc-node, .vc-chip { opacity: 1 !important; transform: none !important; }
        .vc-draw { stroke-dashoffset: 0 !important; }
        .vc-spotlight { display: none; }
      }
    `}</style>
  )
}
