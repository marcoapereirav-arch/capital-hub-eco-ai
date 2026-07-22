'use client'

/**
 * Mini-mockups codificados (CSS/SVG) de cada elemento de UI para el manual de
 * nomenclatura. Genéricos. El elemento nombrado se resalta con el ACENTO.
 * Soportan plataforma: 'desktop' (pantalla ancha) o 'mobile' (teléfono).
 *
 * El color de acento sale de ./theme (GOLD = ACCENT). Además hay algunos hex
 * sueltos dentro de mockups concretos (#8a4ed8 secundario, #E1CD91 acento claro,
 * y rgba(194,166,101,…)): están listados en el README para find/replace.
 */
import { motion } from 'framer-motion'
import { ACCENT, ACCENT_RGB } from './theme'

export type Platform = 'desktop' | 'mobile'
const GOLD = ACCENT
const goldBox = { background: `rgba(${ACCENT_RGB}, 0.22)`, border: `1px solid rgba(${ACCENT_RGB}, 0.6)` }

/** Marco de dispositivo: monitor (desktop) o teléfono (mobile). */
function Screen({ platform, children }: { platform: Platform; children: React.ReactNode }) {
  const m = platform === 'mobile'
  return (
    <div className="flex h-[176px] items-center justify-center">
      <div className={`relative overflow-hidden border-2 border-white/25 bg-black/55 shadow-[inset_0_0_20px_-6px_rgba(0,0,0,0.9)] ${m ? 'h-[164px] w-[110px] rounded-[16px]' : 'h-[130px] w-full max-w-[214px] rounded-lg'}`}>
        {m && <div className="absolute left-1/2 top-1.5 z-10 h-1 w-6 -translate-x-1/2 rounded-full bg-white/35" />}
        <div className={`absolute inset-0 ${m ? 'pt-4' : ''}`}>{children}</div>
      </div>
    </div>
  )
}
function L({ w = 'w-full', c = 'bg-white/20' }: { w?: string; c?: string }) {
  return <div className={`h-1.5 rounded-full ${w} ${c}`} />
}
function Center({ children }: { children: React.ReactNode }) {
  return <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 px-2.5">{children}</div>
}
function Body() {
  return <div className="absolute inset-x-2 bottom-2 top-2 space-y-1.5"><L w="w-2/3" /><L /><L w="w-3/4" /></div>
}

export function Mock({ kind, platform }: { kind: string; platform: Platform }) {
  const m = platform === 'mobile'
  switch (kind) {
    /* ---- Estructura ---- */
    case 'shell':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-0 rounded-[6px] border border-dashed border-accent/50" />
          <div className="absolute inset-x-1.5 top-1.5 flex h-3.5 items-center rounded bg-white/[0.13] px-1"><span className="text-[6px] text-ink-muted">barra superior</span></div>
          {!m && <div className="absolute bottom-1.5 left-1.5 top-6 w-8 rounded bg-white/[0.11] p-0.5"><span className="text-[5px] leading-none text-ink-muted">lateral</span></div>}
          {m && <div className="absolute inset-x-1.5 bottom-1.5 flex h-4 items-center justify-around rounded bg-white/[0.13]">{[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full bg-white/25" />)}</div>}
          <div className={`absolute bottom-${m ? '6' : '1.5'} top-6 ${m ? 'inset-x-1.5' : 'left-11 right-1.5'} flex items-center justify-center`}><span className="text-[6px] text-accent-soft">contenido</span></div>
        </Screen>
      )
    case 'topbar':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-x-2 top-2 flex h-5 items-center justify-between rounded-md px-1.5" style={goldBox}>
            <span className="text-[7px] font-semibold text-accent-soft">LOGO</span><span className="text-[8px] text-accent-soft">☰</span>
          </div>
          <div className="absolute inset-x-2 bottom-2 top-9 space-y-1.5"><L /><L w="w-2/3" /></div>
        </Screen>
      )
    case 'sidebar':
      return (
        <Screen platform={platform}>
          {!m ? (
            <>
              <div className="absolute bottom-2 left-2 top-2 w-[62px] rounded-md p-1.5" style={goldBox}>
                {['Inicio', 'Panel', 'Ajustes'].map((t) => <div key={t} className="mb-1 text-[6px] text-accent-soft">▸ {t}</div>)}
              </div>
              <div className="absolute bottom-2 left-[72px] right-2 top-2 space-y-1.5"><L /><L w="w-3/4" /></div>
            </>
          ) : (
            <>
              <div className="absolute inset-x-2 top-2 flex h-5 items-center rounded-md px-1.5" style={goldBox}><span className="text-[9px] text-accent-soft">☰</span><span className="ml-1 text-[6px] text-accent-soft">oculta</span></div>
              <Body />
            </>
          )}
        </Screen>
      )
    case 'bottomnav':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-x-2 top-2 bottom-9 space-y-1.5"><L w="w-2/3" /><L /></div>
          <div className="absolute inset-x-2 bottom-2 flex h-5 items-center justify-around rounded-md" style={m ? goldBox : { border: '1px dashed rgba(255,255,255,0.14)' }}>
            {['◉', '☰', '✦', '☺'].map((i, k) => <span key={k} className={`text-[8px] ${m ? 'text-accent-soft' : 'text-ink-muted'}`}>{i}</span>)}
          </div>
          {!m && <span className="absolute bottom-8 right-2 text-[6px] text-ink-muted">raro en desktop</span>}
        </Screen>
      )
    /* ---- Navegación ---- */
    case 'tabs':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-x-2 top-3 flex gap-2 border-b border-white/20 pb-1">
            {['Uno', 'Dos', 'Tres'].map((t, i) => (
              <span key={t} className={`relative pb-1 text-[7px] ${i === 0 ? 'text-accent-soft' : 'text-ink-muted'}`}>{t}{i === 0 && <span className="absolute inset-x-0 -bottom-[5px] h-[2px] rounded-full" style={{ background: GOLD }} />}</span>
            ))}
          </div>
          <div className="absolute inset-x-2 bottom-2 top-9 space-y-1.5"><L w="w-3/4" /><L w="w-1/2" /></div>
        </Screen>
      )
    case 'breadcrumbs':
      return (
        <Screen platform={platform}>
          <Center><div className="flex items-center gap-1 text-[7px]"><span className="text-ink-muted">Inicio</span><span className="text-ink-muted">›</span><span className="text-ink-muted">Panel</span><span className="text-ink-muted">›</span><span className="rounded px-1 py-0.5 text-accent-soft" style={goldBox}>Aquí</span></div></Center>
        </Screen>
      )
    case 'pagination':
      return (
        <Screen platform={platform}>
          {!m ? (
            <Center><div className="flex items-center gap-1 text-[9px] text-ink-muted">‹ {[1, 2, 3].map((n) => <span key={n} className={n === 1 ? 'flex h-4 w-4 items-center justify-center rounded text-black' : 'px-0.5'} style={n === 1 ? { background: GOLD } : {}}>{n}</span>)} ›</div></Center>
          ) : (
            <><Body /><div className="absolute inset-x-2 bottom-2 rounded-md py-1 text-center text-[7px] text-accent-soft" style={goldBox}>cargar más ↓</div></>
          )}
        </Screen>
      )
    /* ---- Contenedores ---- */
    case 'card':
      return (
        <Screen platform={platform}><Center><div className="w-full max-w-[130px] rounded-lg p-2" style={goldBox}><div className="h-6 w-full rounded bg-white/[0.17]" /><div className="mt-1.5 h-1.5 w-2/3 rounded-full bg-accent-soft/40" /><div className="mt-1 h-1.5 w-full rounded-full bg-white/[0.17]" /></div></Center></Screen>
      )
    case 'modal':
      return (
        <Screen platform={platform}>
          <Body />
          <div className="absolute inset-0 bg-black/60" />
          {!m ? (
            <div className="absolute left-1/2 top-1/2 w-[120px] -translate-x-1/2 -translate-y-1/2 rounded-lg p-2" style={{ ...goldBox, background: 'rgba(20,20,26,0.98)' }}><L w="w-2/3" c="bg-accent-soft/50" /><div className="mt-1.5" /><L /><div className="mt-1.5 h-3.5 w-12 rounded-full" style={{ background: GOLD }} /></div>
          ) : (
            <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t p-2" style={{ borderColor: 'rgba(194,166,101,0.6)', background: 'rgba(20,20,26,0.98)' }}><div className="mx-auto mb-1.5 h-1 w-7 rounded-full bg-white/25" /><L w="w-2/3" c="bg-accent-soft/50" /><div className="mt-1" /><L /></div>
          )}
        </Screen>
      )
    case 'bottomsheet':
      return (
        <Screen platform={platform}>
          <Body /><div className="absolute inset-0 bg-black/50" />
          <div className="absolute inset-x-0 bottom-0 rounded-t-2xl border-t p-2" style={{ borderColor: 'rgba(194,166,101,0.6)', background: 'rgba(20,20,26,0.98)' }}><div className="mx-auto mb-1.5 h-1 w-7 rounded-full bg-white/25" /><L w="w-2/3" c="bg-accent-soft/50" /><div className="mt-1" /><L /></div>
        </Screen>
      )
    case 'drawer':
      return (
        <Screen platform={platform}>
          <Body /><div className="absolute inset-0 bg-black/50" />
          <div className="absolute bottom-0 left-0 top-0 w-[58px] border-r p-1.5" style={{ borderColor: 'rgba(194,166,101,0.6)', background: 'rgba(20,20,26,0.98)' }}>{['Opción', 'Opción', 'Opción'].map((t, k) => <div key={k} className="mb-1.5 text-[6px] text-accent-soft">▸ {t}</div>)}</div>
        </Screen>
      )
    case 'accordion':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-x-2 top-3 space-y-1">
            {[0, 1].map((i) => (
              <div key={i} className="rounded-md border border-white/20 bg-white/[0.09]">
                <div className="flex items-center justify-between px-1.5 py-1"><span className={`text-[7px] ${i === 0 ? 'text-accent-soft' : 'text-ink-soft'}`}>Pregunta {i + 1}</span><span className="text-[7px] text-ink-muted">{i === 0 ? '▾' : '▸'}</span></div>
                {i === 0 && <div className="px-1.5 pb-1.5 space-y-1"><L /><L w="w-2/3" /></div>}
              </div>
            ))}
          </div>
        </Screen>
      )
    case 'table':
      return (
        <Screen platform={platform}>
          {!m ? (
            <div className="absolute inset-2 rounded-md border border-white/20 p-1" style={goldBox}>
              {[0, 1, 2].map((r) => <div key={r} className="flex gap-1 border-b border-white/20 py-1 last:border-0">{[0, 1, 2].map((c) => <div key={c} className={`h-1.5 flex-1 rounded-full ${r === 0 ? 'bg-accent-soft/50' : 'bg-white/[0.17]'}`} />)}</div>)}
            </div>
          ) : (
            <div className="absolute inset-2 space-y-1.5">{[0, 1].map((r) => <div key={r} className="rounded-md p-1.5" style={goldBox}><L w="w-1/2" c="bg-accent-soft/40" /><div className="mt-1" /><L /></div>)}</div>
          )}
        </Screen>
      )
    /* ---- Controles ---- */
    case 'button':
      return <Screen platform={platform}><Center><span className="rounded-full px-3 py-1.5 text-[9px] font-semibold text-black" style={{ background: GOLD }}>Botón</span><span className="rounded-full border border-white/20 px-3 py-1 text-[8px] text-ink-soft">Ghost</span></Center></Screen>
    case 'toggle':
      return <Screen platform={platform}><Center><div className="flex h-5 w-9 items-center rounded-full p-0.5" style={{ background: GOLD }}><motion.span className="h-4 w-4 rounded-full bg-white" animate={{ x: [0, 16, 0] }} transition={{ duration: 2.4, repeat: Infinity, ease: 'easeInOut' }} /></div><span className="text-[7px] text-ink-muted">on / off</span></Center></Screen>
    case 'slider':
      return <Screen platform={platform}><Center><div className="relative h-1.5 w-4/5 rounded-full bg-white/[0.17]"><div className="absolute inset-y-0 left-0 w-2/3 rounded-full" style={{ background: GOLD }} /><motion.span className="absolute top-1/2 h-3.5 w-3.5 -translate-y-1/2 rounded-full border-2 bg-white" style={{ borderColor: GOLD }} animate={{ left: ['15%', '66%', '15%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} /></div></Center></Screen>
    case 'segmented':
      return <Screen platform={platform}><Center><div className="flex rounded-full bg-white/[0.13] p-0.5">{['Día', 'Mes', 'Año'].map((t, i) => <span key={t} className={`rounded-full px-2 py-1 text-[7px] ${i === 0 ? 'text-black' : 'text-ink-muted'}`} style={i === 0 ? { background: GOLD } : {}}>{t}</span>)}</div></Center></Screen>
    case 'dropdown':
      return <Screen platform={platform}><Center><div className="flex w-[100px] items-center justify-between rounded-md border px-2 py-1 text-[8px] text-accent-soft" style={goldBox}>Elegir <span>▾</span></div><div className="w-[100px] rounded-md border border-white/20 bg-black/70 py-0.5">{['Opción A', 'Opción B'].map((o) => <div key={o} className="px-2 py-0.5 text-[7px] text-ink-soft">{o}</div>)}</div></Center></Screen>
    case 'search':
      return <Screen platform={platform}><Center><div className="flex w-4/5 items-center gap-1.5 rounded-full border px-2 py-1.5" style={goldBox}><span className="text-[9px] text-accent-soft">⌕</span><span className="text-[7px] text-ink-muted">Buscar…</span></div></Center></Screen>
    case 'datepicker':
      return <Screen platform={platform}><Center><div className="rounded-md border border-white/20 bg-white/[0.09] p-1.5" style={goldBox}><div className="mb-1 text-center text-[6px] text-accent-soft">‹ Julio ›</div><div className="grid grid-cols-7 gap-[2px]">{Array.from({ length: 21 }).map((_, i) => <span key={i} className={`flex h-2 w-2 items-center justify-center rounded-[2px] text-[4px] ${i === 9 ? 'text-black' : 'text-ink-muted'}`} style={i === 9 ? { background: GOLD } : { background: 'rgba(255,255,255,0.05)' }} />)}</div></div></Center></Screen>
    case 'fab':
      return <Screen platform={platform}><Body /><div className="absolute bottom-2 right-2 flex h-8 w-8 items-center justify-center rounded-full text-base text-black shadow-lg" style={{ background: GOLD }}>+</div></Screen>
    case 'avatar':
      return <Screen platform={platform}><Center><div className="flex items-center gap-1.5"><span className="flex h-8 w-8 items-center justify-center rounded-full text-[9px] font-semibold text-black" style={{ background: GOLD }}>MA</span><span className="text-[8px] text-ink-muted">▾</span></div><span className="text-[6px] text-ink-muted">menú de usuario</span></Center></Screen>
    /* ---- Feedback / estados ---- */
    case 'banner':
      return <Screen platform={platform}><div className="absolute inset-x-2 top-2 flex items-center gap-1 rounded-md px-2 py-1.5" style={goldBox}><span className="text-[8px] text-accent-soft">ⓘ</span><span className="text-[6px] text-accent-soft">Aviso importante fijo</span></div><div className="absolute inset-x-2 bottom-2 top-10 space-y-1.5"><L /><L w="w-2/3" /></div></Screen>
    case 'toast':
      return <Screen platform={platform}><Body /><motion.div className="absolute inset-x-2 bottom-2 flex items-center gap-1 rounded-lg border px-1.5 py-1.5" style={{ borderColor: 'rgba(194,166,101,0.5)', background: 'rgba(20,20,26,0.98)' }} animate={{ y: [30, 0, 0, 30], opacity: [0, 1, 1, 0] }} transition={{ duration: 3.5, repeat: Infinity, times: [0, 0.15, 0.85, 1] }}><span className="text-[8px] text-accent-soft">✓</span><span className="text-[6px] text-ink-soft">Guardado</span></motion.div></Screen>
    case 'tooltip':
      return <Screen platform={platform}><Center><div className="rounded-md px-1.5 py-1 text-[7px] text-black" style={{ background: GOLD }}>Ayuda</div><div className="h-0 w-0 border-x-[3px] border-t-[4px] border-x-transparent" style={{ borderTopColor: GOLD }} /><span className="flex h-4 w-4 items-center justify-center rounded-full border border-white/20 text-[7px] text-ink-soft">?</span></Center></Screen>
    case 'badgechip':
      return <Screen platform={platform}><Center><div className="flex items-center gap-2"><div className="relative"><span className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/15 bg-white/[0.10] text-[11px] text-ink-soft">✉</span><span className="absolute -right-1 -top-1 flex h-3.5 min-w-3.5 items-center justify-center rounded-full px-0.5 text-[7px] font-bold text-black" style={{ background: GOLD }}>3</span></div><span className="rounded-full border px-2 py-0.5 text-[7px] text-accent-soft" style={goldBox}>Etiqueta</span></div></Center></Screen>
    case 'stepper':
      return <Screen platform={platform}><Center><div className="flex items-center">{[1, 2, 3].map((n, i) => <div key={n} className="flex items-center"><span className={`flex h-4 w-4 items-center justify-center rounded-full text-[7px] ${n === 1 ? 'text-black' : 'text-ink-muted'}`} style={n === 1 ? { background: GOLD } : { border: '1px solid rgba(255,255,255,0.2)' }}>{n}</span>{i < 2 && <span className="h-[2px] w-4" style={{ background: n === 1 ? GOLD : 'rgba(255,255,255,0.15)' }} />}</div>)}</div><span className="text-[6px] text-ink-muted">paso 1 de 3</span></Center></Screen>
    case 'spinner':
      return <Screen platform={platform}><Center><motion.span className="block h-7 w-7 rounded-full border-2 border-white/15" style={{ borderTopColor: GOLD }} animate={{ rotate: 360 }} transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }} /></Center></Screen>
    case 'skeleton':
      return <Screen platform={platform}><div className="absolute inset-x-3 inset-y-4 flex flex-col justify-center gap-2">{['w-1/2', 'w-full', 'w-3/4'].map((w, i) => <motion.div key={i} className={`h-2 ${w} rounded-full bg-white/[0.08]`} animate={{ opacity: [0.35, 0.9, 0.35] }} transition={{ duration: 1.4, repeat: Infinity, delay: i * 0.2 }} />)}</div></Screen>
    case 'progress':
      return <Screen platform={platform}><Center><div className="relative h-2 w-4/5 overflow-hidden rounded-full bg-white/[0.17]"><motion.div className="absolute inset-y-0 left-0 rounded-full" style={{ background: `linear-gradient(90deg, ${GOLD}, #E1CD91)` }} animate={{ width: ['10%', '90%', '10%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} /></div></Center></Screen>
    case 'divider':
      return <Screen platform={platform}><Center><L w="w-3/4" /><div className="my-0.5 h-[1px] w-4/5" style={{ background: 'rgba(194,166,101,0.7)' }} /><L w="w-2/3" /></Center></Screen>
    case 'carousel':
      return <Screen platform={platform}><Center><div className="flex w-full items-center justify-center gap-1"><div className="h-10 w-4 rounded bg-white/[0.17]" /><div className="h-12 w-16 rounded" style={goldBox} /><div className="h-10 w-4 rounded bg-white/[0.17]" /></div><div className="flex gap-1">{[0, 1, 2].map((i) => <span key={i} className="h-1 w-1 rounded-full" style={{ background: i === 0 ? GOLD : 'rgba(255,255,255,0.25)' }} />)}</div></Center></Screen>
    case 'emptystate':
      return <Screen platform={platform}><Center><span className="text-lg text-accent/70">✧</span><span className="text-[7px] text-ink-muted">Aún no hay nada</span><span className="rounded-full px-2 py-0.5 text-[6px] text-black" style={{ background: GOLD }}>Crear</span></Center></Screen>
    case 'checkbox':
      return (
        <Screen platform={platform}><Center>
          <div className="flex items-center gap-2">
            <motion.span className="flex h-5 w-5 items-center justify-center rounded-[5px] border-2" style={{ borderColor: GOLD }} animate={{ backgroundColor: ['rgba(194,166,101,0)', 'rgba(194,166,101,1)', 'rgba(194,166,101,0)'] }} transition={{ duration: 2.6, repeat: Infinity, times: [0, 0.4, 0.95] }}>
              <motion.svg viewBox="0 0 24 24" className="h-3 w-3 text-black" fill="none" stroke="currentColor" strokeWidth={3.5} animate={{ opacity: [0, 1, 0] }} transition={{ duration: 2.6, repeat: Infinity, times: [0.25, 0.45, 0.9] }}><path d="M5 13l4 4L19 7" strokeLinecap="round" strokeLinejoin="round" /></motion.svg>
            </motion.span>
            <span className="text-[9px] text-ink-soft">Acepto</span>
          </div>
          <div className="flex items-center gap-2"><span className="h-3.5 w-3.5 rounded-[4px] border-2 border-white/25" /><span className="text-[8px] text-ink-muted">o esto</span></div>
        </Center></Screen>
      )
    case 'radio':
      return (
        <Screen platform={platform}><Center>
          {['Opción A', 'Opción B', 'Opción C'].map((o, i) => (
            <div key={o} className="flex items-center gap-2">
              <span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border-2" style={{ borderColor: i === 1 ? GOLD : 'rgba(255,255,255,0.25)' }}>{i === 1 && <span className="h-1.5 w-1.5 rounded-full" style={{ background: GOLD }} />}</span>
              <span className={`text-[8px] ${i === 1 ? 'text-accent-soft' : 'text-ink-muted'}`}>{o}</span>
            </div>
          ))}
        </Center></Screen>
      )
    case 'numberstepper':
      return (
        <Screen platform={platform}><Center>
          <div className="flex items-center gap-2 rounded-full border px-1.5 py-1" style={goldBox}>
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/[0.17] text-[12px] text-accent-soft">−</span>
            <span className="w-5 text-center font-mono text-[12px] text-ink">3</span>
            <span className="flex h-5 w-5 items-center justify-center rounded-full text-[12px] text-black" style={{ background: GOLD }}>+</span>
          </div>
        </Center></Screen>
      )
    case 'rating':
      return (
        <Screen platform={platform}><Center>
          <div className="flex gap-1">{[0, 1, 2, 3, 4].map((i) => (
            <motion.span key={i} className="text-base" animate={{ color: i < 4 ? ['#4a4a52', GOLD, GOLD] : ['#4a4a52', '#4a4a52', '#4a4a52'] }} transition={{ duration: 2.6, repeat: Infinity, delay: i * 0.18, times: [0, 0.4, 1] }}>★</motion.span>
          ))}</div>
          <span className="text-[8px] text-ink-muted">4 de 5</span>
        </Center></Screen>
      )
    case 'commandpalette':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-0 bg-black/55" />
          <div className="absolute inset-x-2.5 top-4 rounded-lg border p-2" style={{ ...goldBox, background: 'rgba(20,20,26,0.98)' }}>
            <div className="flex items-center gap-1.5 border-b border-white/20 pb-1.5"><span className="text-[10px] text-accent-soft">⌘</span><span className="text-[8px] text-ink-soft">Buscar acción</span><motion.span className="inline-block h-2.5 w-[5px] bg-accent-soft" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} /></div>
            {['Crear nuevo', 'Ir a ajustes'].map((o, i) => (<div key={o} className={`mt-1 rounded px-1.5 py-0.5 text-[7px] ${i === 0 ? 'text-black' : 'text-ink-muted'}`} style={i === 0 ? { background: GOLD } : {}}>{o}</div>))}
          </div>
        </Screen>
      )
    case 'notification':
      return (
        <Screen platform={platform}><Center>
          <div className="relative">
            <motion.svg viewBox="0 0 24 24" className="h-7 w-7 text-ink-soft" fill="none" stroke="currentColor" strokeWidth={1.7} style={{ transformOrigin: 'top center' }} animate={{ rotate: [0, -14, 14, -8, 0] }} transition={{ duration: 1.4, repeat: Infinity, repeatDelay: 1 }}>
              <path d="M18 8a6 6 0 10-12 0c0 7-3 9-3 9h18s-3-2-3-9" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M13.7 21a2 2 0 01-3.4 0" strokeLinecap="round" strokeLinejoin="round" />
            </motion.svg>
            <motion.span className="absolute -right-1.5 -top-1 flex h-4 w-4 items-center justify-center rounded-full text-[8px] font-bold text-black" style={{ background: GOLD }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 1, repeat: Infinity }}>5</motion.span>
          </div>
          <span className="text-[7px] text-ink-muted">notificaciones</span>
        </Center></Screen>
      )
    case 'progressring':
      return (
        <Screen platform={platform}><Center>
          <svg viewBox="0 0 40 40" className="h-14 w-14 -rotate-90">
            <circle cx="20" cy="20" r="16" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
            <motion.circle cx="20" cy="20" r="16" fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round" strokeDasharray="100.5" animate={{ strokeDashoffset: [100.5, 25, 100.5] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} />
          </svg>
        </Center></Screen>
      )
    case 'statcard':
      return (
        <Screen platform={platform}><Center>
          <div className="w-[124px] rounded-lg p-2.5" style={goldBox}>
            <div className="text-[7px] uppercase tracking-widest text-ink-muted">Ingresos</div>
            <div className="font-display text-lg text-accent-soft">$12.4k</div>
            <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.17]"><motion.div className="h-full rounded-full" style={{ background: GOLD }} animate={{ width: ['20%', '80%', '20%'] }} transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }} /></div>
          </div>
        </Center></Screen>
      )
    case 'timeline':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-y-3 left-5 w-[2px] bg-white/20" />
          <motion.div className="absolute left-5 top-3 w-[2px] origin-top" style={{ background: GOLD }} animate={{ height: [8, 92, 8] }} transition={{ duration: 3.2, repeat: Infinity, ease: 'easeInOut' }} />
          <div className="absolute inset-y-3 left-[15px] flex flex-col justify-between">
            {[0, 1, 2].map((i) => (<div key={i} className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border-2" style={{ borderColor: GOLD, background: i === 0 ? GOLD : '#050505' }} /><span className="text-[7px] text-ink-muted">Evento {i + 1}</span></div>))}
          </div>
        </Screen>
      )
    case 'avatargroup':
      return (
        <Screen platform={platform}><Center>
          <div className="flex -space-x-2">{['MA', 'JL', 'KP', '+3'].map((a, i) => (<span key={i} className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-canvas text-[8px] font-semibold" style={{ background: i === 3 ? 'rgba(255,255,255,0.2)' : GOLD, color: i === 3 ? '#D4D4DC' : '#000' }}>{a}</span>))}</div>
          <span className="text-[7px] text-ink-muted">6 personas</span>
        </Center></Screen>
      )
    case 'kanban':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-2 flex gap-1.5">
            {['To-do', 'Haciendo', 'Hecho'].map((col, c) => (
              <div key={col} className="flex-1 rounded-md border border-white/[0.16] bg-white/[0.08] p-1">
                <div className="mb-1 text-[5px] uppercase tracking-wider text-ink-muted">{col}</div>
                {Array.from({ length: c === 1 ? 2 : 1 }).map((_, k) => (<div key={k} className="mb-1 h-3.5 rounded" style={c === 1 ? goldBox : { background: 'rgba(255,255,255,0.06)' }} />))}
              </div>
            ))}
          </div>
        </Screen>
      )
    case 'contextmenu':
      return (
        <Screen platform={platform}>
          <Body />
          <motion.div className="absolute left-6 top-6 w-[84px] rounded-md border p-1" style={{ ...goldBox, background: 'rgba(20,20,26,0.98)' }} animate={{ opacity: [0, 1, 1, 0], scale: [0.9, 1, 1, 0.9] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.15, 0.85, 1] }}>
            {['Copiar', 'Editar', 'Borrar'].map((o, i) => (<div key={o} className={`rounded px-1.5 py-0.5 text-[7px] ${i === 2 ? 'text-red-300' : 'text-ink-soft'}`}>{o}</div>))}
          </motion.div>
        </Screen>
      )
    case 'popover':
      return (
        <Screen platform={platform}><Center>
          <div className="rounded-md border p-1.5 text-center" style={{ ...goldBox, background: 'rgba(20,20,26,0.98)' }}>
            <div className="text-[7px] text-ink-soft">Panel flotante</div>
            <div className="mt-0.5 text-[6px] text-ink-muted">anclado a un botón</div>
          </div>
          <div className="h-0 w-0 border-x-4 border-t-4 border-x-transparent" style={{ borderTopColor: 'rgba(194,166,101,0.6)' }} />
          <span className="rounded-full px-2.5 py-1 text-[8px] font-semibold text-black" style={{ background: GOLD }}>Abrir</span>
        </Center></Screen>
      )
    case 'snackbar':
      return (
        <Screen platform={platform}><Body />
          <motion.div className="absolute inset-x-2 bottom-2 flex items-center justify-between rounded-lg border px-2 py-1.5" style={{ borderColor: 'rgba(194,166,101,0.5)', background: 'rgba(20,20,26,0.98)' }} animate={{ y: [30, 0, 0, 30], opacity: [0, 1, 1, 0] }} transition={{ duration: 3.6, repeat: Infinity, times: [0, 0.15, 0.85, 1] }}>
            <span className="text-[7px] text-ink-soft">Elemento borrado</span><span className="rounded px-1.5 py-0.5 text-[7px] font-semibold text-accent-soft" style={{ border: '1px solid rgba(194,166,101,0.5)' }}>Deshacer</span>
          </motion.div>
        </Screen>
      )
    case 'alertdialog':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-0 bg-black/60" />
          <div className="absolute left-1/2 top-1/2 w-[130px] -translate-x-1/2 -translate-y-1/2 rounded-lg border p-2.5 text-center" style={{ borderColor: 'rgba(248,113,113,0.5)', background: 'rgba(20,20,26,0.98)' }}>
            <div className="text-[8px] font-semibold text-ink">¿Seguro?</div>
            <div className="mt-0.5 text-[6px] text-ink-muted">No se puede deshacer.</div>
            <div className="mt-2 flex justify-center gap-1.5"><span className="rounded-full border border-white/20 px-2 py-0.5 text-[6px] text-ink-soft">Cancelar</span><span className="rounded-full bg-red-400/90 px-2 py-0.5 text-[6px] font-semibold text-black">Borrar</span></div>
          </div>
        </Screen>
      )
    case 'splitbutton':
      return (
        <Screen platform={platform}><Center>
          <div className="flex items-stretch overflow-hidden rounded-full" style={{ boxShadow: '0 4px 12px -4px rgba(194,166,101,0.5)' }}>
            <span className="px-3 py-1.5 text-[9px] font-semibold text-black" style={{ background: GOLD }}>Guardar</span>
            <span className="flex items-center px-1.5 text-[8px] text-black" style={{ background: '#a88a4a' }}>▾</span>
          </div>
        </Center></Screen>
      )
    case 'fileupload':
      return (
        <Screen platform={platform}><Center>
          <div className="flex w-[130px] flex-col items-center gap-1 rounded-lg border-2 border-dashed py-3" style={{ borderColor: 'rgba(194,166,101,0.5)' }}>
            <motion.span className="text-lg text-accent-soft" animate={{ y: [0, -3, 0] }} transition={{ duration: 1.6, repeat: Infinity }}>↑</motion.span>
            <span className="text-[7px] text-ink-soft">Arrastra archivos</span>
          </div>
        </Center></Screen>
      )
    case 'colorpicker':
      return (
        <Screen platform={platform}><Center>
          <div className="grid grid-cols-4 gap-1.5">{['#C2A665', '#8a4ed8', '#4ea1d8', '#4ed88a', '#d84e6e', '#E1CD91', '#d8b84e', '#9A9AA6'].map((c, i) => (<span key={c} className={`h-5 w-5 rounded-md ${i === 0 ? 'ring-2 ring-white ring-offset-1 ring-offset-black' : ''}`} style={{ background: c }} />))}</div>
        </Center></Screen>
      )
    case 'otp':
      return (
        <Screen platform={platform}><Center>
          <div className="flex gap-1.5">{['4', '2', '7', ''].map((d, i) => (<span key={i} className="flex h-7 w-6 items-center justify-center rounded-md border-2 font-mono text-sm" style={{ borderColor: i === 3 ? GOLD : 'rgba(255,255,255,0.2)', color: '#F4F4FA' }}>{d || (i === 3 ? <motion.span className="h-3.5 w-[2px] bg-accent-soft" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} /> : '')}</span>))}</div>
          <span className="text-[7px] text-ink-muted">código de 4 dígitos</span>
        </Center></Screen>
      )
    case 'taginput':
      return (
        <Screen platform={platform}><Center>
          <div className="flex w-[140px] flex-wrap items-center gap-1 rounded-md border px-1.5 py-1.5" style={goldBox}>
            {['react', 'ui'].map((t) => (<span key={t} className="flex items-center gap-0.5 rounded-full bg-accent/20 px-1.5 py-0.5 text-[7px] text-accent-soft">{t}<span className="text-[6px]">✕</span></span>))}
            <span className="text-[7px] text-ink-muted">añadir…</span>
          </div>
        </Center></Screen>
      )
    case 'treeview':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-3 space-y-1 text-[7px]">
            <div className="text-accent-soft">▾ src</div>
            <div className="ml-2.5 text-ink-soft">▾ components</div>
            <div className="ml-5 text-ink-muted">▪ Button.tsx</div>
            <div className="ml-5 text-ink-muted">▪ Card.tsx</div>
            <div className="ml-2.5 text-ink-soft">▸ hooks</div>
          </div>
        </Screen>
      )
    case 'coachmark':
      return (
        <Screen platform={platform}><Body />
          <div className="absolute right-2 top-2 h-6 w-6 rounded-full ring-2 ring-accent" style={{ boxShadow: '0 0 0 4px rgba(194,166,101,0.25)' }} />
          <div className="absolute right-2 top-9 w-[96px] rounded-md p-1.5 text-[6px] text-black" style={{ background: GOLD }}>Pulsa aquí para crear tu primer proyecto ✨</div>
        </Screen>
      )
    case 'speeddial':
      return (
        <Screen platform={platform}><Body />
          {[42, 26].map((b, i) => (<motion.span key={i} className="absolute right-3.5 flex h-6 w-6 items-center justify-center rounded-full border text-[10px] text-accent-soft" style={{ bottom: b, ...goldBox, background: 'rgba(20,20,26,0.98)' }} animate={{ opacity: [0, 1, 1, 0], scale: [0.5, 1, 1, 0.5] }} transition={{ duration: 3, repeat: Infinity, times: [0, 0.2, 0.8, 1], delay: i * 0.1 }}>{i === 0 ? '✎' : '☾'}</motion.span>))}
          <div className="absolute bottom-3 right-3 flex h-8 w-8 items-center justify-center rounded-full text-base text-black" style={{ background: GOLD }}>+</div>
        </Screen>
      )
    case 'statusdot':
      return (
        <Screen platform={platform}><Center>
          <div className="relative"><span className="flex h-9 w-9 items-center justify-center rounded-full text-[10px] font-semibold text-black" style={{ background: GOLD }}>MA</span><span className="absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-canvas bg-green-400" /></div>
          <span className="text-[7px] text-ink-muted">en línea</span>
        </Center></Screen>
      )
    case 'kbd':
      return (
        <Screen platform={platform}><Center>
          <div className="flex items-center gap-1"><span className="rounded-md border border-white/25 bg-white/[0.08] px-2 py-1 font-mono text-[10px] text-ink">⌘</span><span className="text-ink-muted">+</span><span className="rounded-md border border-white/25 bg-white/[0.08] px-2 py-1 font-mono text-[10px] text-ink">K</span></div>
          <span className="text-[7px] text-ink-muted">atajo de teclado</span>
        </Center></Screen>
      )
    case 'callout':
      return (
        <Screen platform={platform}><Center>
          <div className="flex w-[140px] items-start gap-1.5 rounded-md border-l-2 p-1.5" style={{ borderColor: GOLD, background: 'rgba(194,166,101,0.08)' }}>
            <span className="text-[9px] text-accent-soft">ⓘ</span><span className="text-[6px] leading-tight text-ink-soft">Nota destacada dentro del texto para resaltar algo.</span>
          </div>
        </Center></Screen>
      )
    case 'gauge':
      return (
        <Screen platform={platform}><Center>
          <svg viewBox="0 0 48 28" className="w-[70px]">
            <path d="M4 26 A20 20 0 0 1 44 26" fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" strokeLinecap="round" />
            <path d="M4 26 A20 20 0 0 1 34 9" fill="none" stroke={GOLD} strokeWidth="4" strokeLinecap="round" />
            <motion.line x1="24" y1="26" x2="24" y2="10" stroke="#E1CD91" strokeWidth="1.5" strokeLinecap="round" style={{ transformOrigin: '24px 26px' }} animate={{ rotate: [-70, 40, -70] }} transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }} />
          </svg>
        </Center></Screen>
      )
    case 'barchart':
      return (
        <Screen platform={platform}><Center>
          <div className="flex h-12 items-end gap-1.5">{[0.4, 0.7, 0.5, 0.9, 0.6].map((h, i) => (<motion.span key={i} className="w-2.5 rounded-t" style={{ background: i === 3 ? GOLD : 'rgba(194,166,101,0.35)' }} animate={{ height: [`${h * 40}%`, `${h * 100}%`, `${h * 40}%`] }} transition={{ duration: 2.5, repeat: Infinity, delay: i * 0.12, ease: 'easeInOut' }} />))}</div>
        </Center></Screen>
      )
    case 'combobox':
      return (
        <Screen platform={platform}><Center>
          <div className="w-[120px]">
            <div className="flex items-center gap-1 rounded-md border px-2 py-1" style={goldBox}><span className="text-[8px] text-ink">Barc</span><motion.span className="inline-block h-2.5 w-[4px] bg-accent-soft" animate={{ opacity: [1, 0, 1] }} transition={{ duration: 1, repeat: Infinity }} /></div>
            <div className="mt-0.5 rounded-md border border-white/20 bg-black/70 py-0.5">{['Barcelona', 'Barranquilla'].map((o, i) => (<div key={o} className={`px-2 py-0.5 text-[7px] ${i === 0 ? 'bg-accent/15 text-accent-soft' : 'text-ink-muted'}`}>{o}</div>))}</div>
          </div>
        </Center></Screen>
      )
    case 'passwordfield':
      return (
        <Screen platform={platform}><Center>
          <div className="flex w-[130px] items-center justify-between rounded-md border px-2 py-1.5" style={goldBox}><span className="tracking-[3px] text-[11px] text-ink">••••••</span><span className="text-[10px] text-accent-soft">◉</span></div>
          <span className="text-[7px] text-ink-muted">campo de contraseña</span>
        </Center></Screen>
      )
    case 'hero':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-x-2 top-2 rounded-md p-2" style={goldBox}>
            <div className="h-2 w-3/4 rounded-full bg-accent-soft/50" /><div className="mt-1 h-1.5 w-full rounded-full bg-white/[0.22]" />
            <div className="mt-2 h-3.5 w-12 rounded-full" style={{ background: GOLD }} />
          </div>
          <div className="absolute inset-x-2 bottom-2 top-[64px] space-y-1.5"><L /><L w="w-2/3" /></div>
        </Screen>
      )
    case 'footer':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-x-2 bottom-9 top-2 space-y-1.5"><L w="w-2/3" /><L /></div>
          <div className="absolute inset-x-2 bottom-2 flex h-7 flex-col justify-center rounded-md px-2" style={goldBox}>
            <div className="flex gap-2">{['Inicio', 'Precios', 'Blog'].map((t) => (<span key={t} className="text-[5px] text-accent-soft">{t}</span>))}</div>
            <span className="mt-0.5 text-[5px] text-ink-muted">© 2026</span>
          </div>
        </Screen>
      )
    case 'menu':
      return (
        <Screen platform={platform}><Center>
          <div className="flex items-center gap-1 rounded-md px-2 py-1 text-[8px] text-accent-soft" style={goldBox}>Menú <span>▾</span></div>
          <div className="w-[92px] rounded-md border border-white/20 bg-black/70 py-0.5">{['Perfil', 'Ajustes', 'Salir'].map((o, i) => (<div key={o} className={`px-2 py-0.5 text-[7px] ${i === 0 ? 'text-ink' : 'text-ink-muted'}`}>{o}</div>))}</div>
        </Center></Screen>
      )
    case 'link':
      return (
        <Screen platform={platform}><Center>
          <span className="text-center text-[9px] text-ink-soft">Lee más en <span className="text-accent-soft underline">este enlace</span></span>
          <span className="text-[7px] text-ink-muted">texto clicable (hyperlink)</span>
        </Center></Screen>
      )
    case 'list':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-x-2 inset-y-3 flex flex-col justify-center gap-1.5">
            {[0, 1, 2].map((i) => (<div key={i} className="flex items-center gap-2 rounded border border-white/[0.06] bg-white/[0.08] px-1.5 py-1"><span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: GOLD }} /><span className={`h-1.5 rounded-full ${i === 0 ? 'w-2/3 bg-accent-soft/40' : 'w-1/2 bg-white/20'}`} /></div>))}
          </div>
        </Screen>
      )
    case 'gridcards':
      return (
        <Screen platform={platform}>
          <div className="absolute inset-2 grid grid-cols-2 gap-1.5">
            {[0, 1, 2, 3].map((i) => (<div key={i} className="rounded-md p-1" style={i === 0 ? goldBox : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}><div className="h-3 w-full rounded bg-white/[0.17]" /><div className="mt-1 h-1 w-2/3 rounded-full bg-white/[0.22]" /></div>))}
          </div>
        </Screen>
      )
    case 'textarea':
      return (
        <Screen platform={platform}><Center>
          <div className="w-full max-w-[150px] rounded-md border px-2 py-1.5" style={goldBox}><div className="space-y-1"><L /><L w="w-3/4" /><L w="w-1/2" /></div></div>
          <span className="text-[7px] text-ink-muted">área de texto (varias líneas)</span>
        </Center></Screen>
      )
    case 'rangeslider':
      return (
        <Screen platform={platform}><Center>
          <div className="relative h-1.5 w-4/5 rounded-full bg-white/[0.17]">
            <div className="absolute inset-y-0 left-[25%] right-[30%] rounded-full" style={{ background: GOLD }} />
            <span className="absolute left-[25%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white" style={{ borderColor: GOLD }} />
            <span className="absolute left-[70%] top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 bg-white" style={{ borderColor: GOLD }} />
          </div>
          <span className="text-[7px] text-ink-muted">rango (dos valores)</span>
        </Center></Screen>
      )
    case 'timepicker':
      return (
        <Screen platform={platform}><Center>
          <div className="flex items-center gap-1 rounded-md border px-2 py-1.5 font-mono text-[12px] text-ink" style={goldBox}><span>09</span><span className="text-ink-muted">:</span><span>30</span><span className="ml-1 text-[8px] text-accent-soft">AM</span></div>
          <span className="text-[7px] text-ink-muted">selector de hora</span>
        </Center></Screen>
      )
    case 'loadingdots':
      return (
        <Screen platform={platform}><Center>
          <div className="flex gap-1.5">{[0, 1, 2].map((i) => (<motion.span key={i} className="h-2 w-2 rounded-full" style={{ background: GOLD }} animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }} transition={{ duration: 1, repeat: Infinity, delay: i * 0.15 }} />))}</div>
        </Center></Screen>
      )
    case 'inlinealert':
      return (
        <Screen platform={platform}><Center>
          <div className="flex w-full max-w-[150px] items-center gap-1.5 rounded-md border-l-2 px-2 py-1.5" style={{ borderColor: '#f87171', background: 'rgba(248,113,113,0.08)' }}><span className="text-[9px] text-red-300">⚠</span><span className="text-[6px] leading-tight text-ink-soft">Revisa este campo, hay un error.</span></div>
        </Center></Screen>
      )
    case 'donut':
      return (
        <Screen platform={platform}><Center>
          <svg viewBox="0 0 40 40" className="h-14 w-14 -rotate-90">
            <circle cx="20" cy="20" r="14" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="6" />
            <circle cx="20" cy="20" r="14" fill="none" stroke={GOLD} strokeWidth="6" strokeLinecap="round" strokeDasharray="88" strokeDashoffset="30" />
            <circle cx="20" cy="20" r="14" fill="none" stroke="#8a4ed8" strokeWidth="6" strokeDasharray="88" strokeDashoffset="66" />
          </svg>
        </Center></Screen>
      )
    case 'sparkline':
      return (
        <Screen platform={platform}><Center>
          <svg viewBox="0 0 100 34" className="w-[120px]"><motion.polyline points="0,28 15,20 30,24 45,10 60,16 75,6 100,12" fill="none" stroke={GOLD} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" initial={{ pathLength: 0 }} animate={{ pathLength: 1 }} transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }} /></svg>
          <span className="text-[7px] text-ink-muted">mini gráfico (tendencia)</span>
        </Center></Screen>
      )
    case 'codeblock':
      return (
        <Screen platform={platform}><Center>
          <div className="w-full max-w-[150px] rounded-md border border-white/20 bg-black/60 p-2 font-mono text-[7px] leading-relaxed">
            <div><span className="text-violet-300">const</span> <span className="text-accent-soft">x</span> = <span className="text-green-300">42</span></div>
            <div className="text-ink-muted">// comentario</div>
            <div><span className="text-violet-300">return</span> x</div>
          </div>
        </Center></Screen>
      )
    case 'quote':
      return (
        <Screen platform={platform}><Center>
          <div className="w-full max-w-[150px] border-l-2 pl-2" style={{ borderColor: GOLD }}><span className="text-[8px] italic leading-tight text-ink-soft">“Una cita destacada dentro del texto.”</span></div>
        </Center></Screen>
      )
    default:
      return <Screen platform={platform}>{null}</Screen>
  }
}
