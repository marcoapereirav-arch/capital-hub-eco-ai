'use client'

import { useMemo, useRef, useState } from 'react'
import { buildSearchIndex, normalize, totalCount, folderTotalCount, type SearchItem } from './brain-data'
import type { BrainFolder, BrainQuadrant, View } from './types'

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.4} aria-hidden style={{ transition: 'transform 0.15s', transform: open ? 'rotate(90deg)' : 'rotate(0deg)' }}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
    </svg>
  )
}

const Dot = ({ c }: { c: string }) => <span aria-hidden className="inline-block h-2 w-2 shrink-0 rounded-full" style={{ background: c }} />
const Diamond = ({ c }: { c: string }) => <span aria-hidden className="inline-block h-2 w-2 shrink-0 rotate-45" style={{ background: c }} />

/* Cada fila mide 44 puntos en telefono: es lo que acierta un dedo. */
const ROW =
  'flex min-h-11 w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-[15px] transition-colors active:bg-muted md:min-h-8 md:text-sm md:hover:bg-muted'

export function TreePanel({
  data,
  setView,
  onOpenDoc,
  onClose,
}: {
  data: BrainQuadrant[]
  setView: (v: View) => void
  onOpenDoc: (slug: string) => void
  onClose: () => void
}) {
  const [query, setQuery] = useState('')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const clickTimer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const index = useMemo(() => buildSearchIndex(data), [data])
  const results = useMemo(() => {
    const nq = normalize(query.trim())
    if (!nq) return null
    return index.filter((it) => normalize(it.label).includes(nq) || normalize(it.path).includes(nq)).slice(0, 60)
  }, [query, index])

  const toggle = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(key) ? next.delete(key) : next.add(key)
      return next
    })

  function rowClick(single: () => void, dbl: () => void) {
    return () => {
      if (clickTimer.current) {
        clearTimeout(clickTimer.current)
        clickTimer.current = null
        dbl()
      } else {
        clickTimer.current = setTimeout(() => {
          clickTimer.current = null
          single()
        }, 260)
      }
    }
  }

  function pick(it: SearchItem) {
    if (it.kind === 'quadrant') setView({ level: 'quadrant', q: it.quadrantKey })
    else if (it.kind === 'folder' && it.folderId) setView({ level: 'folder', folderId: it.folderId })
    else if (it.slug) onOpenDoc(it.slug)
  }

  /** Render recursivo de una folder (con sus subFolders y docs). */
  function renderFolder(folder: BrainFolder, color: string, depth: number) {
    const key = `f:${folder.id}`
    const open = expanded.has(key)
    return (
      <li key={folder.id}>
        <div
          className={ROW + ' cursor-pointer'}
          onClick={rowClick(
            () => toggle(key),
            () => setView({ level: 'folder', folderId: folder.id }),
          )}
          style={{ paddingLeft: `${0.5 + depth * 0.75}rem` }}
        >
          <button
            onClick={(e) => { e.stopPropagation(); toggle(key) }}
            className="inline-flex h-11 w-8 shrink-0 items-center justify-center text-muted-foreground md:h-6"
            aria-label={open ? 'Cerrar carpeta' : 'Abrir carpeta'}
          >
            <Chevron open={open} />
          </button>
          <Dot c={color} />
          <span className="min-w-0 flex-1 truncate text-foreground">{folder.name}</span>
          <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{folderTotalCount(folder)}</span>
        </div>
        {open && (
          <ul>
            {folder.subFolders.map((sub) => renderFolder(sub, color, depth + 1))}
            {folder.docs.map((doc) => (
              <li key={doc.id}>
                <div
                  className={ROW + ' cursor-pointer'}
                  onClick={rowClick(() => {}, () => onOpenDoc(doc.slug))}
                  style={{ paddingLeft: `${0.5 + (depth + 1) * 0.75 + 0.875}rem` }}
                >
                  <Diamond c={color} />
                  <span className="min-w-0 flex-1 truncate text-muted-foreground">{doc.title}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </li>
    )
  }

  return (
    // Ancho completo en telefono (nunca 340 puntos clavados, que no caben) y el
    // panel de siempre a partir de escritorio.
    <div className="flex w-full flex-col overflow-hidden rounded-xl border border-border bg-popover shadow-lg md:w-[340px]">
      <div className="flex items-center gap-2 border-b border-border p-3">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden className="shrink-0 text-primary">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
        </svg>
        <input
          autoFocus
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar carpeta o documento…"
          enterKeyHint="search"
          className="h-11 w-full min-w-0 bg-transparent text-base text-foreground outline-none placeholder:text-muted-foreground md:h-8 md:text-sm"
        />
        <button
          onClick={onClose}
          aria-label="Cerrar el índice"
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-lg text-muted-foreground active:bg-muted md:h-8 md:w-8"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="max-h-[50dvh] overflow-y-auto no-overscroll p-2 md:max-h-[58dvh]">
        {results ? (
          results.length === 0 ? (
            <p className="px-3 py-4 text-[15px] text-muted-foreground">Sin resultados.</p>
          ) : (
            <ul>
              {results.map((it, i) => (
                <li key={`${it.kind}-${it.quadrantKey}-${it.folderId ?? ''}-${it.label}-${i}`}>
                  <button onClick={() => pick(it)} className={ROW}>
                    {it.kind === 'doc' ? <Diamond c={it.color} /> : <Dot c={it.color} />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">{it.label}</span>
                      <span className="block truncate text-sm text-muted-foreground">{it.path}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )
        ) : (
          <ul className="space-y-0.5">
            {data.map((q) => {
              const qOpen = expanded.has(q.key)
              return (
                <li key={q.key}>
                  <div
                    className={ROW + ' cursor-pointer'}
                    onClick={rowClick(
                      () => toggle(q.key),
                      () => setView({ level: 'quadrant', q: q.key }),
                    )}
                  >
                    <button
                      onClick={(e) => { e.stopPropagation(); toggle(q.key) }}
                      className="inline-flex h-11 w-8 shrink-0 items-center justify-center text-muted-foreground md:h-6"
                      aria-label={qOpen ? 'Cerrar cuadrante' : 'Abrir cuadrante'}
                    >
                      <Chevron open={qOpen} />
                    </button>
                    <Dot c={q.color} />
                    <span className="min-w-0 flex-1 truncate font-semibold text-foreground">{q.label}</span>
                    <span className="shrink-0 text-sm tabular-nums text-muted-foreground">{totalCount(q)}</span>
                  </div>

                  {qOpen && (
                    <ul>
                      {q.rootFolders.map((f) => renderFolder(f, q.color, 1))}
                      {q.rootDocs.map((doc) => (
                        <li key={doc.id}>
                          <div
                            className={ROW + ' cursor-pointer'}
                            onClick={rowClick(() => {}, () => onOpenDoc(doc.slug))}
                            style={{ paddingLeft: '1.625rem' }}
                          >
                            <Diamond c={q.color} />
                            <span className="min-w-0 flex-1 truncate text-muted-foreground">{doc.title}</span>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </li>
              )
            })}
          </ul>
        )}
      </div>

      <p className="border-t border-border px-3 py-2 text-sm text-muted-foreground">
        Flecha: abrir/cerrar · doble clic: ir/abrir
      </p>
    </div>
  )
}
