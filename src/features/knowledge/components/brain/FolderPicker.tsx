'use client'

import { useEffect, useMemo, useState } from 'react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import type { BrainFolder, BrainQuadrant } from './types'

interface FlatNode {
  kind: 'quadrant-root' | 'folder'
  label: string
  /** Cuadrante destino. Siempre presente. */
  quadrantKey: string
  /** Si es folder, su id. Si es quadrant-root (raíz del cuadrante), null. */
  folderId: string | null
  /** Profundidad para indentación. */
  depth: number
  /** Color del cuadrante (para puntito). */
  color: string
  /** Si está deshabilitado (no se puede mover ahí). */
  disabled?: boolean
  disabledReason?: string
}

/**
 * Aplana el árbol de cuadrantes + folders en una lista navegable para el
 * picker. El picker filtra los destinos NO válidos según el item que se
 * está moviendo (un folder no puede ir dentro de sí mismo o sus descendientes).
 */
function flattenTree(
  data: BrainQuadrant[],
  excludeFolderId: string | null,
): FlatNode[] {
  const out: FlatNode[] = []

  // Descendientes del folder excluido (para deshabilitarlos)
  const excluded = new Set<string>()
  if (excludeFolderId) {
    excluded.add(excludeFolderId)
    function collect(folders: BrainFolder[]) {
      for (const f of folders) {
        if (excluded.has(f.parentId ?? '')) {
          excluded.add(f.id)
        }
        if (f.id === excludeFolderId) {
          // Marcar este y propagar a hijos
          for (const sub of f.subFolders) {
            excluded.add(sub.id)
            collect([sub])
          }
        } else {
          collect(f.subFolders)
        }
      }
    }
    for (const q of data) collect(q.rootFolders)
  }

  for (const q of data) {
    out.push({
      kind: 'quadrant-root',
      label: `${q.label} · (raíz del cuadrante)`,
      quadrantKey: q.key,
      folderId: null,
      depth: 0,
      color: q.color,
    })
    function visit(folder: BrainFolder, depth: number) {
      const isExcluded = excluded.has(folder.id)
      out.push({
        kind: 'folder',
        label: folder.name,
        quadrantKey: q.key,
        folderId: folder.id,
        depth,
        color: q.color,
        disabled: isExcluded,
        disabledReason: isExcluded ? 'No puedes mover una carpeta dentro de sí misma o sus subcarpetas.' : undefined,
      })
      for (const sub of folder.subFolders) visit(sub, depth + 1)
    }
    for (const root of q.rootFolders) visit(root, 1)
  }
  return out
}

/**
 * "Mover a..." para docs y folders. Muestra el árbol completo de cuadrantes +
 * carpetas. El usuario selecciona destino y se ejecuta la acción de mover
 * (callback). Auto-excluye destinos inválidos (descendientes propios) cuando se
 * mueve una folder.
 *
 * Hoja inferior en telefono, cajon por la derecha en escritorio: el lado va FIJO
 * y el cambio se hace con clases, nunca con JavaScript.
 */
export function FolderPicker({
  open,
  onClose,
  data,
  /** Si estamos moviendo una folder, su id (para excluir descendientes). null si es un doc. */
  excludeFolderId,
  onPick,
  title = 'Mover a…',
}: {
  open: boolean
  onClose: () => void
  data: BrainQuadrant[]
  excludeFolderId: string | null
  onPick: (target: { folderId: string | null; quadrantKey: string }) => void
  title?: string
}) {
  const [query, setQuery] = useState('')

  const flat = useMemo(() => flattenTree(data, excludeFolderId), [data, excludeFolderId])
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return flat
    return flat.filter((n) => n.label.toLowerCase().includes(q))
  }, [query, flat])

  useEffect(() => {
    if (!open) return
    setQuery('')
  }, [open])

  return (
    <Sheet
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        aria-describedby={undefined}
        className={cn(
          'rounded-t-xl',
          // El escritorio repite la condicion del lado porque las clases del kit
          // (`data-[side=bottom]:...`) pesan mas que un `md:` suelto y lo ganan.
          'md:data-[side=bottom]:inset-y-0 md:right-0 md:data-[side=bottom]:left-auto md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none md:w-full md:max-w-md md:border-l md:pb-0',
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold">{title}</SheetTitle>
        </SheetHeader>

        <div className="border-b border-border px-4 pb-3">
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filtrar carpetas…"
            enterKeyHint="search"
            className="h-11 w-full rounded-lg border border-border bg-transparent px-3 text-base text-foreground outline-none placeholder:text-muted-foreground focus-visible:border-ring md:h-9 md:text-sm"
          />
        </div>

        <div className="pb-safe-4">
          {filtered.length === 0 ? (
            <p className="px-4 py-6 text-center text-[15px] text-muted-foreground">Sin resultados.</p>
          ) : (
            <ul>
              {filtered.map((n, i) => (
                <li key={`${n.kind}-${n.folderId ?? n.quadrantKey}-${i}`}>
                  <button
                    onClick={() => {
                      if (n.disabled) return
                      onPick({ folderId: n.folderId, quadrantKey: n.quadrantKey })
                      onClose()
                    }}
                    disabled={n.disabled}
                    title={n.disabledReason}
                    className={cn(
                      'flex min-h-12 w-full items-center gap-2 px-4 py-2 text-left text-[15px] transition-colors',
                      n.disabled
                        ? 'cursor-not-allowed text-muted-foreground opacity-50'
                        : 'text-foreground active:bg-muted md:hover:bg-muted',
                    )}
                    style={{ paddingLeft: `${1 + n.depth * 1}rem` }}
                  >
                    {n.kind === 'quadrant-root' ? (
                      <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: n.color }} />
                    ) : (
                      <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rotate-45" style={{ background: n.color }} />
                    )}
                    <span className="truncate">{n.label}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </SheetContent>
    </Sheet>
  )
}
