'use client'

/**
 * Efectos reutilizables del documento:
 * - CosmicBg: fondo animado (aurora + starfield con parallax de ratón).
 * - ScrollProgress: barra de progreso de scroll superior (ref + rAF, sin lag).
 * - Reveal: envoltorio que anima el contenido al entrar en pantalla.
 *
 * Colores desde ./theme (ACCENT/ACCENT_SOFT/ACCENT_RGB). El violeta de la 2ª
 * aurora usa el token Tailwind `secondary` (defínelo en tu tailwind.config).
 */
import { motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useEffect, useRef } from 'react'
import { ACCENT, ACCENT_SOFT, ACCENT_RGB } from './theme'

const EASE = [0.22, 1, 0.36, 1] as const

/**
 * Barra de progreso de scroll superior. Reutilizable en todo doc largo.
 * Usa ref + requestAnimationFrame: actualiza el transform directamente en el DOM,
 * SIN re-renders de React → 0 lag por mucho contenido que haya.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    let raf = 0
    const update = () => {
      raf = 0
      const el = document.documentElement
      const max = el.scrollHeight - el.clientHeight
      const p = max > 0 ? Math.min(1, Math.max(0, el.scrollTop / max)) : 0
      if (barRef.current) barRef.current.style.transform = `scaleX(${p})`
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
  }, [])
  return (
    <div
      ref={barRef}
      className="fixed left-0 right-0 top-0 z-[60] h-2 origin-left will-change-transform"
      style={{ transform: 'scaleX(0)', background: `linear-gradient(90deg, ${ACCENT}, ${ACCENT_SOFT})`, boxShadow: `0 0 16px rgba(${ACCENT_RGB}, 0.9)` }}
    />
  )
}

// Estrellas deterministas (mismas en server y cliente → sin hydration mismatch).
const STARS = Array.from({ length: 60 }, (_, i) => {
  const rnd = (k: number) => {
    const x = Math.sin(i * 127.1 + k * 311.7) * 43758.5453
    return x - Math.floor(x)
  }
  return { x: rnd(1) * 100, y: rnd(2) * 100, s: 0.7 + rnd(3) * 2, d: rnd(4) * 5, o: 0.34 + rnd(5) * 0.6 }
})

export function CosmicBg() {
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const smx = useSpring(mx, { stiffness: 40, damping: 20 })
  const smy = useSpring(my, { stiffness: 40, damping: 20 })
  const auroraX = useTransform(smx, (v) => v * -16)
  const auroraY = useTransform(smy, (v) => v * -16)
  const starX = useTransform(smx, (v) => v * -34)
  const starY = useTransform(smy, (v) => v * -34)

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX / window.innerWidth - 0.5)
      my.set(e.clientY / window.innerHeight - 0.5)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  }, [mx, my])

  return (
    <>
      <motion.div style={{ x: auroraX, y: auroraY }} className="pointer-events-none fixed inset-0 -z-10">
        <div className="absolute left-1/2 top-[-10%] h-[620px] w-[1200px] -translate-x-1/2 rounded-full bg-accent/[0.16] blur-[120px]" />
        <div className="absolute left-[-8%] top-[42%] h-[560px] w-[560px] rounded-full bg-secondary/[0.20] blur-[120px]" />
        <div className="absolute bottom-[-8%] right-[-6%] h-[520px] w-[680px] rounded-full bg-accent/[0.11] blur-[120px]" />
      </motion.div>
      <motion.div style={{ x: starX, y: starY }} className="pointer-events-none fixed inset-0 -z-10">
        {STARS.map((s, i) => (
          <motion.span
            key={i}
            className="absolute rounded-full bg-white"
            style={{ left: `${s.x}%`, top: `${s.y}%`, width: s.s, height: s.s, opacity: s.o }}
            animate={{ opacity: [s.o * 0.4, s.o, s.o * 0.4] }}
            transition={{ duration: 2.6 + s.d, repeat: Infinity, ease: 'easeInOut' }}
          />
        ))}
      </motion.div>
      <div className="pointer-events-none fixed inset-0 -z-10 [background-image:linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] [background-size:64px_64px]" />
    </>
  )
}

export function Reveal({ children, className, delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y: 26 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ duration: 0.6, ease: EASE, delay }}
    >
      {children}
    </motion.div>
  )
}
