'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { folderTotalCount, findFolderWithPath } from './brain-data'
import type { BrainDoc, BrainFolder, BrainQuadrant, View } from './types'

/* ─── Estilos compartidos, todos con tokens del tema ─────────────────────── */
const CARD =
  'group relative flex flex-col gap-2 rounded-lg border border-border bg-card p-4 text-left shadow-lg transition-colors md:hover:border-primary/40'
const ROW =
  'group relative flex w-full items-center gap-3 rounded-lg border border-border bg-card px-4 py-3 text-left shadow-lg transition-colors md:hover:border-primary/40'
const PILL = 'shrink-0 rounded-sm border border-border px-2 py-0.5 text-sm text-muted-foreground'

const Dot = ({ c, big }: { c: string; big?: boolean }) => (
  <span aria-hidden className={`inline-block shrink-0 rounded-full ${big ? 'h-3 w-3' : 'h-2 w-2'}`} style={{ background: c }} />
)
const Diamond = ({ c }: { c: string }) => (
  <span aria-hidden className="inline-block h-2.5 w-2.5 shrink-0 rotate-45" style={{ background: c }} />
)

/* Icono de grip (handle de drag). SOLO en escritorio: en un telefono el arrastre
   pelea con el dedo que hace scroll, y para mover algo esta "Mover a…" en el menu. */
function GripIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-muted-foreground transition-colors group-hover:text-foreground">
      <circle cx="9" cy="6" r="1.4" />
      <circle cx="15" cy="6" r="1.4" />
      <circle cx="9" cy="12" r="1.4" />
      <circle cx="15" cy="12" r="1.4" />
      <circle cx="9" cy="18" r="1.4" />
      <circle cx="15" cy="18" r="1.4" />
    </svg>
  )
}

function IconoTresPuntos() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <circle cx="5" cy="12" r="1.6" />
      <circle cx="12" cy="12" r="1.6" />
      <circle cx="19" cy="12" r="1.6" />
    </svg>
  )
}

/* ─── Tipos de drag&drop ─────────────────────────────────────────────────── */

interface DragDocData { kind: 'doc'; sopId: string; title: string; color: string }
interface DragFolderData { kind: 'folder'; folderId: string; name: string; color: string }
type DragData = DragDocData | DragFolderData

interface DropFolderData { kind: 'folder'; folderId: string; quadrant: string }
interface DropQuadrantRootData { kind: 'quadrant-root'; quadrant: string }
interface DropBreadcrumbData { kind: 'breadcrumb'; folderId: string | null; quadrant: string }
type DropData = DropFolderData | DropQuadrantRootData | DropBreadcrumbData

type Accion = { texto: string; hacer: () => void; peligro?: boolean }

/* ─── Menú de acciones (…) ───────────────────────────────────────────────
 * Dos presentaciones del MISMO contenido, elegidas con clases y no con
 * JavaScript (useIsMobile miente en el primer pintado):
 *   - telefono: hoja inferior, con filas de 48 puntos.
 *   - escritorio: el menu flotante de siempre, sujeto al borde de la ventana.
 * ---------------------------------------------------------------------- */

function ActionsMenu({
  onRename,
  onMoveTo,
  onDelete,
}: {
  onRename?: () => void
  onMoveTo?: () => void
  onDelete?: () => void
}) {
  const acciones: Accion[] = []
  if (onRename) acciones.push({ texto: 'Renombrar', hacer: onRename })
  if (onMoveTo) acciones.push({ texto: 'Mover a…', hacer: onMoveTo })
  if (onDelete) acciones.push({ texto: 'Eliminar', hacer: onDelete, peligro: true })

  return (
    <>
      <div className="md:hidden">
        <MenuHoja acciones={acciones} />
      </div>
      <div className="hidden md:block">
        <MenuFlotante acciones={acciones} />
      </div>
    </>
  )
}

function MenuHoja({ acciones }: { acciones: Accion[] }) {
  const [open, setOpen] = useState(false)
  return (
    <>
      <button
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setOpen(true)
        }}
        className="absolute top-1 right-1 inline-flex h-11 w-11 items-center justify-center rounded-lg text-muted-foreground active:bg-muted"
        aria-label="Acciones"
      >
        <IconoTresPuntos />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="bottom" aria-describedby={undefined} className="rounded-t-xl">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
          <SheetHeader>
            <SheetTitle className="text-[17px] font-semibold">Acciones</SheetTitle>
          </SheetHeader>
          <div className="pb-safe-4">
            {acciones.map((a) => (
              <button
                key={a.texto}
                onClick={(e) => {
                  e.stopPropagation()
                  setOpen(false)
                  a.hacer()
                }}
                className={cn(
                  'flex h-12 w-full items-center px-4 text-left text-[15px] active:bg-muted',
                  a.peligro ? 'text-destructive' : 'text-foreground',
                )}
              >
                {a.texto}
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MenuFlotante({ acciones }: { acciones: Accion[] }) {
  const [open, setOpen] = useState(false)
  const btnRef = useRef<HTMLButtonElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)

  // Calcular posición del menú clamped al viewport tras abrir
  useEffect(() => {
    if (!open || !btnRef.current) return
    const rect = btnRef.current.getBoundingClientRect()
    const W = 180
    const H = 90
    const vw = window.innerWidth
    const vh = window.innerHeight
    let left = rect.right - W
    let top = rect.bottom + 4
    if (top + H > vh - 8) top = rect.top - H - 4
    if (left < 8) left = 8
    if (left + W > vw - 8) left = vw - W - 8
    setPos({ left, top })
  }, [open])

  // Cerrar al click fuera (sin bubble al card padre) + ESC
  useEffect(() => {
    if (!open) return
    function onDocPointer(e: Event) {
      const t = e.target as HTMLElement | null
      if (t && t.closest('[data-nv-actions-menu="true"]')) return
      e.preventDefault()
      e.stopPropagation()
      setOpen(false)
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false)
    }
    // capture phase: atrapamos ANTES de que llegue al card padre
    const t = window.setTimeout(() => {
      document.addEventListener('pointerdown', onDocPointer, { capture: true })
      document.addEventListener('keydown', onKey)
    }, 0)
    return () => {
      window.clearTimeout(t)
      document.removeEventListener('pointerdown', onDocPointer, { capture: true })
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <>
      <button
        ref={btnRef}
        onPointerDown={(e) => e.stopPropagation()}
        onClick={(e) => {
          e.stopPropagation()
          e.preventDefault()
          setOpen((v) => !v)
        }}
        className="absolute top-1.5 right-1.5 inline-flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-primary"
        aria-label="Acciones"
        data-nv-actions-menu="true"
      >
        <IconoTresPuntos />
      </button>
      {open && pos && (
        <div
          data-nv-actions-menu="true"
          className="fixed z-[100] md:min-w-[180px] rounded-lg border border-border bg-popover py-1 shadow-lg"
          style={{ left: pos.left, top: pos.top }}
          onPointerDown={(e) => e.stopPropagation()}
        >
          {acciones.map((a) => (
            <button
              key={a.texto}
              onPointerDown={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                a.hacer()
              }}
              className={cn(
                'block w-full px-3 py-2 text-left text-sm hover:bg-muted',
                a.peligro ? 'text-destructive hover:bg-destructive/10' : 'text-foreground hover:text-primary',
              )}
            >
              {a.texto}
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ─── Drag handle (icono grip) — el ÚNICO que activa el drag, solo escritorio ── */

function DragHandle({
  listeners,
  attributes,
  setActivatorNodeRef,
}: {
  listeners: ReturnType<typeof useDraggable>['listeners']
  attributes: ReturnType<typeof useDraggable>['attributes']
  setActivatorNodeRef: ReturnType<typeof useDraggable>['setActivatorNodeRef']
}) {
  return (
    <button
      ref={setActivatorNodeRef}
      {...listeners}
      {...attributes}
      onPointerDown={(e) => {
        // Permitir que dnd-kit reciba pointerdown — NO stop, lo necesita
        // Evitar el click bubbling al onClick del card
        ;(e.currentTarget as HTMLButtonElement).blur()
      }}
      onClick={(e) => {
        // El grip nunca dispara onClick (es solo handle de drag)
        e.stopPropagation()
        e.preventDefault()
      }}
      className="hidden h-6 w-6 shrink-0 cursor-grab touch-none items-center justify-center active:cursor-grabbing md:inline-flex"
      aria-label="Arrastrar para mover"
      tabIndex={-1}
    >
      <GripIcon />
    </button>
  )
}

/* ─── Card de carpeta (drag handle + click libre + menú visible) ────────── */

function FolderCard({
  folder,
  color,
  onOpen,
  onRename,
  onMoveTo,
  onDelete,
}: {
  folder: BrainFolder
  color: string
  onOpen: () => void
  onRename: () => void
  onMoveTo: () => void
  onDelete: () => void
}) {
  // Droppable: aceptar drops dentro de esta carpeta
  const { setNodeRef: dropRef, isOver } = useDroppable({
    id: `folder-drop:${folder.id}`,
    data: { kind: 'folder', folderId: folder.id, quadrant: folder.quadrantKey } satisfies DropData,
  })
  // Draggable: SOLO el grip activa el drag (setActivatorNodeRef)
  const { attributes, listeners, setNodeRef: dragRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `folder-drag:${folder.id}`,
    data: { kind: 'folder', folderId: folder.id, name: folder.name, color } satisfies DragData,
  })
  const count = folderTotalCount(folder)

  return (
    <div
      ref={(el) => {
        dropRef(el)
        dragRef(el)
      }}
      className={cn(
        CARD,
        'min-h-14 cursor-pointer',
        isOver && 'border-primary ring-2 ring-primary/40',
        isDragging && 'opacity-40',
      )}
      onClick={(e) => {
        // Si el click viene de un button (grip, menú), ignorar
        if ((e.target as HTMLElement).closest('button')) return
        if (isDragging) return
        onOpen()
      }}
    >
      {/* El hueco del boton de los tres puntos se reserva en la FILA entera, no en el
          titulo: el boton flota en la esquina y quien queda debajo es el contador. */}
      <div className="flex items-center gap-2.5 pr-12 md:pr-8">
        <DragHandle listeners={listeners} attributes={attributes} setActivatorNodeRef={setActivatorNodeRef} />
        <Dot c={color} />
        <h3 className="min-w-0 flex-1 truncate text-[15px] text-foreground">{folder.name}</h3>
        <span className={PILL}>{count}</span>
      </div>
      <ActionsMenu onRename={onRename} onMoveTo={onMoveTo} onDelete={onDelete} />
    </div>
  )
}

/* ─── Row de documento (drag handle + Link libre) ────────────────────────── */

function DocRow({
  doc,
  color,
  onOpen,
  onMoveTo,
  onDelete,
  href,
}: {
  doc: BrainDoc
  color: string
  onOpen: () => void
  onMoveTo: () => void
  onDelete: () => void
  href: string
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, isDragging } = useDraggable({
    id: `doc-drag:${doc.id}`,
    data: { kind: 'doc', sopId: doc.id, title: doc.title, color } satisfies DragData,
  })

  return (
    <div ref={setNodeRef} className={cn(ROW, 'min-h-14', isDragging && 'opacity-40')}>
      <DragHandle listeners={listeners} attributes={attributes} setActivatorNodeRef={setActivatorNodeRef} />
      <Diamond c={color} />
      <Link
        href={href}
        onClick={(e) => {
          if ((e.target as HTMLElement).closest('button')) return
          if (isDragging) {
            e.preventDefault()
            return
          }
          e.preventDefault()
          onOpen()
        }}
        className="min-w-0 flex-1 pr-12 md:pr-8"
      >
        <span className="block truncate text-[15px] text-foreground">{doc.title}</span>
      </Link>
      <ActionsMenu onMoveTo={onMoveTo} onDelete={onDelete} />
    </div>
  )
}

/* ─── Breadcrumb (cada segmento es droppable) ────────────────────────────── */

function BreadcrumbSegment({
  label,
  onClick,
  dropData,
  isCurrent,
}: {
  label: string
  onClick?: () => void
  dropData?: DropData
  isCurrent?: boolean
}) {
  const { setNodeRef, isOver } = useDroppable({
    id: `bc:${dropData ? JSON.stringify(dropData) : 'none'}-${label}`,
    data: dropData,
    disabled: !dropData,
  })
  return (
    <button
      ref={setNodeRef}
      onClick={onClick}
      disabled={isCurrent}
      className={cn(
        'h-11 rounded-lg px-2 text-sm font-medium transition-colors md:h-8',
        isCurrent ? 'cursor-default text-primary' : 'text-primary md:hover:bg-muted',
        isOver && 'bg-primary/15 ring-1 ring-primary/40',
      )}
    >
      {label}
    </button>
  )
}

function Breadcrumb({
  quadrantLabel,
  path,
  onGoOverview,
  onGoQuadrant,
  onGoFolder,
  quadrantKey,
}: {
  quadrantLabel?: string
  path: BrainFolder[]
  onGoOverview: () => void
  onGoQuadrant?: () => void
  onGoFolder?: (folderId: string) => void
  quadrantKey?: string
}) {
  return (
    <div className="mb-5 flex flex-wrap items-center gap-1">
      <BreadcrumbSegment label="Cerebro" onClick={onGoOverview} />
      {quadrantLabel && quadrantKey && (
        <>
          <span className="text-muted-foreground">/</span>
          <BreadcrumbSegment
            label={quadrantLabel}
            onClick={onGoQuadrant}
            dropData={{ kind: 'quadrant-root', quadrant: quadrantKey } satisfies DropData}
          />
        </>
      )}
      {path.map((f, i) => {
        const isCurrent = i === path.length - 1
        return (
          <span key={f.id} className="flex items-center gap-1">
            <span className="text-muted-foreground">/</span>
            <BreadcrumbSegment
              label={f.name}
              isCurrent={isCurrent}
              onClick={isCurrent ? undefined : onGoFolder ? () => onGoFolder(f.id) : undefined}
              dropData={
                isCurrent
                  ? undefined
                  : ({ kind: 'breadcrumb', folderId: f.id, quadrant: f.quadrantKey } satisfies DropData)
              }
            />
          </span>
        )
      })}
    </div>
  )
}

/* ─── Main: DriveView ────────────────────────────────────────────────────── */

export function DriveView({
  data,
  view,
  setView,
  onOpenDoc,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteDoc,
  onMoveSop,
  onMoveFolder,
  onPickMoveTarget,
}: {
  data: BrainQuadrant[]
  view: View
  setView: (v: View) => void
  onOpenDoc: (slug: string) => void
  onCreateFolder?: (quadrant: string, parentFolderId: string | null) => void
  onRenameFolder?: (id: string, currentName: string) => void
  onDeleteFolder?: (id: string, name: string, totalDocs: number) => void
  onDeleteDoc?: (id: string, title: string) => void
  onMoveSop?: (sopId: string, targetFolderId: string | null, targetQuadrant?: string) => void
  onMoveFolder?: (folderId: string, targetParentId: string | null, targetQuadrant?: string) => void
  /** Abre el FolderPicker para elegir destino del move (item "Mover a…" del menú). */
  onPickMoveTarget?: (item: { kind: 'doc' | 'folder'; id: string; label: string }) => void
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 10 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 8 } }),
  )

  const [dragPreview, setDragPreview] = useState<DragData | null>(null)

  // Fallback: si view apunta a folder inexistente, volver a overview vía useEffect (no en render).
  useEffect(() => {
    if (view.level !== 'folder') return
    if (!findFolderWithPath(data, view.folderId)) {
      setView({ level: 'overview' })
    }
  }, [view, data, setView])

  function handleDragEnd(e: DragEndEvent) {
    setDragPreview(null)
    const active = e.active.data.current as DragData | undefined
    const over = e.over?.data.current as DropData | undefined
    if (!active || !over) return

    let targetFolderId: string | null = null
    let targetQuadrant: string | undefined
    if (over.kind === 'folder') {
      targetFolderId = over.folderId
      targetQuadrant = over.quadrant
    } else if (over.kind === 'quadrant-root') {
      targetFolderId = null
      targetQuadrant = over.quadrant
    } else if (over.kind === 'breadcrumb') {
      targetFolderId = over.folderId
      targetQuadrant = over.quadrant
    }

    if (active.kind === 'doc') {
      if (onMoveSop) onMoveSop(active.sopId, targetFolderId, targetQuadrant)
    } else if (active.kind === 'folder') {
      if (active.folderId === targetFolderId) return
      if (onMoveFolder) onMoveFolder(active.folderId, targetFolderId, targetQuadrant)
    }
  }

  /* ─── Render por nivel ─────────────────────────────────────────────────── */

  // OVERVIEW
  if (view.level === 'overview') {
    return (
      <DndContext sensors={sensors} onDragStart={(e) => setDragPreview(e.active.data.current as DragData)} onDragEnd={handleDragEnd}>
        <div className="mx-auto max-w-4xl py-6 pl-[max(1rem,var(--sal))] pr-[max(1rem,var(--sar))] md:px-6">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            {data.map((q) => (
              <QuadrantCard
                key={q.key}
                quadrant={q}
                onOpen={() => setView({ level: 'quadrant', q: q.key })}
              />
            ))}
          </div>
        </div>
        <DragOverlay>{renderDragPreview(dragPreview)}</DragOverlay>
      </DndContext>
    )
  }

  // QUADRANT
  if (view.level === 'quadrant') {
    const q = data.find((x) => x.key === view.q)
    if (!q) return null
    return (
      <DndContext sensors={sensors} onDragStart={(e) => setDragPreview(e.active.data.current as DragData)} onDragEnd={handleDragEnd}>
        <div className="mx-auto max-w-4xl py-6 pl-[max(1rem,var(--sal))] pr-[max(1rem,var(--sar))] md:px-6">
          <Breadcrumb
            quadrantLabel={q.label}
            quadrantKey={q.key}
            path={[]}
            onGoOverview={() => setView({ level: 'overview' })}
          />
          <FolderContents
            color={q.color}
            quadrant={q.key}
            currentFolderId={null}
            folders={q.rootFolders}
            docs={q.rootDocs}
            setView={setView}
            onOpenDoc={onOpenDoc}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onDeleteDoc={onDeleteDoc}
            onPickMoveTarget={onPickMoveTarget}
          />
        </div>
        <DragOverlay>{renderDragPreview(dragPreview)}</DragOverlay>
      </DndContext>
    )
  }

  // FOLDER (any depth)
  const found = findFolderWithPath(data, view.folderId)
  if (!found) {
    // Render nada — el useEffect arriba ya hará setView(overview).
    return null
  }
  const { quadrant: q, path } = found
  const currentFolder = path[path.length - 1]
  return (
    <DndContext sensors={sensors} onDragStart={(e) => setDragPreview(e.active.data.current as DragData)} onDragEnd={handleDragEnd}>
      <div className="mx-auto max-w-4xl py-6 pl-[max(1rem,var(--sal))] pr-[max(1rem,var(--sar))] md:px-6">
        <Breadcrumb
          quadrantLabel={q.label}
          quadrantKey={q.key}
          path={path}
          onGoOverview={() => setView({ level: 'overview' })}
          onGoQuadrant={() => setView({ level: 'quadrant', q: q.key })}
          onGoFolder={(folderId) => setView({ level: 'folder', folderId })}
        />
        <FolderContents
          color={q.color}
          quadrant={q.key}
          currentFolderId={currentFolder.id}
          folders={currentFolder.subFolders}
          docs={currentFolder.docs}
          setView={setView}
          onOpenDoc={onOpenDoc}
          onCreateFolder={onCreateFolder}
          onRenameFolder={onRenameFolder}
          onDeleteFolder={onDeleteFolder}
          onDeleteDoc={onDeleteDoc}
          onPickMoveTarget={onPickMoveTarget}
        />
      </div>
      <DragOverlay>{renderDragPreview(dragPreview)}</DragOverlay>
    </DndContext>
  )
}

/* ─── Subcomponentes ─────────────────────────────────────────────────────── */

function QuadrantCard({ quadrant, onOpen }: { quadrant: BrainQuadrant; onOpen: () => void }) {
  const { setNodeRef, isOver } = useDroppable({
    id: `quadrant-drop:${quadrant.key}`,
    data: { kind: 'quadrant-root', quadrant: quadrant.key } satisfies DropData,
  })
  const count = useMemo(() => {
    let n = quadrant.rootDocs.length
    function visit(f: BrainFolder) {
      n += f.docs.length
      for (const sub of f.subFolders) visit(sub)
    }
    for (const f of quadrant.rootFolders) visit(f)
    return n
  }, [quadrant])
  return (
    <button
      ref={setNodeRef}
      onClick={onOpen}
      className={cn(CARD, 'min-h-14', isOver && 'border-primary ring-2 ring-primary/40')}
    >
      <div className="flex items-center gap-2.5">
        <Dot c={quadrant.color} big />
        <h2 className="min-w-0 flex-1 truncate text-lg font-semibold text-foreground">{quadrant.label}</h2>
        <span className={PILL}>{count}</span>
      </div>
      <p className="text-sm leading-snug text-muted-foreground">{quadrant.blurb}</p>
    </button>
  )
}

function FolderContents({
  color,
  quadrant,
  currentFolderId,
  folders,
  docs,
  setView,
  onOpenDoc,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onDeleteDoc,
  onPickMoveTarget,
}: {
  color: string
  quadrant: string
  currentFolderId: string | null
  folders: BrainFolder[]
  docs: BrainDoc[]
  setView: (v: View) => void
  onOpenDoc: (slug: string) => void
  onCreateFolder?: (quadrant: string, parentFolderId: string | null) => void
  onRenameFolder?: (id: string, currentName: string) => void
  onDeleteFolder?: (id: string, name: string, totalDocs: number) => void
  onDeleteDoc?: (id: string, title: string) => void
  onPickMoveTarget?: (item: { kind: 'doc' | 'folder'; id: string; label: string }) => void
}) {
  return (
    <>
      {onCreateFolder && (
        <button
          onClick={() => onCreateFolder(quadrant, currentFolderId)}
          className="mb-4 inline-flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-primary/30 px-3 text-[15px] font-medium text-primary transition-colors md:h-9 md:w-auto md:hover:border-primary"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Nueva carpeta aquí
        </button>
      )}

      {folders.length > 0 && (
        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-2">
          {folders.map((sub) => (
            <FolderCard
              key={sub.id}
              folder={sub}
              color={color}
              onOpen={() => setView({ level: 'folder', folderId: sub.id })}
              onRename={() => onRenameFolder?.(sub.id, sub.name)}
              onMoveTo={() => onPickMoveTarget?.({ kind: 'folder', id: sub.id, label: sub.name })}
              onDelete={() => onDeleteFolder?.(sub.id, sub.name, folderTotalCount(sub))}
            />
          ))}
        </div>
      )}

      {docs.length > 0 ? (
        <ul className="space-y-2">
          {docs.map((doc) => {
            // `from` codifica DÓNDE estaba el usuario al abrir el documento, para
            // que recursos visuales (brandkit, etc.) puedan reconstruir el "Volver"
            // hacia la carpeta exacta. Carpeta tiene prioridad sobre cuadrante.
            const from = currentFolderId ? `f:${currentFolderId}` : `q:${quadrant}`
            return (
              <li key={doc.id}>
                <DocRow
                  doc={doc}
                  color={color}
                  href={`/knowledge/${doc.slug}?from=${encodeURIComponent(from)}`}
                  onOpen={() => onOpenDoc(doc.slug)}
                  onMoveTo={() => onPickMoveTarget?.({ kind: 'doc', id: doc.id, label: doc.title })}
                  onDelete={() => onDeleteDoc?.(doc.id, doc.title)}
                />
              </li>
            )
          })}
        </ul>
      ) : folders.length === 0 ? (
        <p className="text-[15px] text-muted-foreground">
          Carpeta vacía. Crea una subcarpeta o arrastra documentos aquí desde el icono ⋮⋮.
        </p>
      ) : null}
    </>
  )
}

function renderDragPreview(d: DragData | null) {
  if (!d) return null
  if (d.kind === 'doc') {
    return (
      <div className="flex max-w-[300px] items-center gap-3 rounded-lg border border-primary/60 bg-popover px-4 py-3 shadow-lg">
        <Diamond c={d.color} />
        <span className="truncate text-[15px] text-foreground">{d.title}</span>
      </div>
    )
  }
  return (
    <div className="flex max-w-[300px] items-center gap-3 rounded-lg border border-primary/60 bg-popover px-4 py-3 shadow-lg">
      <Dot c={d.color} />
      <span className="truncate text-[15px] text-foreground">{d.name}</span>
    </div>
  )
}
