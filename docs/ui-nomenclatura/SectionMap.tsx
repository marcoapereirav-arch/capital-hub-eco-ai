'use client'

/**
 * Mapa/roadmap de secciones a la derecha con el NOMBRE de cada sección visible
 * siempre. Solo en pantallas muy anchas (>=1400px) donde el margen derecho da de
 * sobra para NO pisar el contenido. En pantallas más estrechas guía la barra de
 * progreso superior.
 */
import { useEffect, useState } from 'react'

export function SectionMap({ sections }: { sections: { id: string; label: string }[] }) {
  const [active, setActive] = useState(0)

  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const mark = window.scrollY + window.innerHeight * 0.35
      let idx = 0
      sections.forEach((s, i) => {
        const el = document.getElementById(s.id)
        if (el && el.offsetTop <= mark) idx = i
      })
      // Solo re-renderiza si cambió la sección activa (evita re-renders por scroll).
      setActive((prev) => (prev === idx ? prev : idx))
    }
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update) }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [sections])

  return (
    <nav className="fixed right-5 top-1/2 z-40 hidden -translate-y-1/2 min-[1400px]:block" aria-label="Secciones">
      <ul className="flex flex-col items-end gap-3">
        {sections.map((s, i) => {
          const on = i === active
          return (
            <li key={s.id}>
              <a href={`#${s.id}`} className="group flex items-center justify-end gap-2.5">
                <span
                  className={`whitespace-nowrap rounded-md px-2 py-0.5 font-display text-[10px] uppercase tracking-wider transition-colors duration-200 ${
                    on ? 'bg-accent/15 text-accent-soft' : 'text-ink-muted group-hover:text-ink-soft'
                  }`}
                >
                  {s.label}
                </span>
                <span
                  className={`shrink-0 rounded-full transition-all duration-200 ${
                    on
                      ? 'h-3 w-3 bg-accent shadow-[0_0_10px_rgba(194,166,101,0.9)]'
                      : 'h-2 w-2 bg-white/45 group-hover:bg-accent/80'
                  }`}
                />
              </a>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
