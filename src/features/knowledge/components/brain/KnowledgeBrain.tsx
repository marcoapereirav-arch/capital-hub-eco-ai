'use client'

import { useCallback, useEffect, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Brain as IconoCerebro } from 'lucide-react'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { cn } from '@/lib/utils'
import { Scene, type ContextNodeInfo } from './Scene'
import { TreePanel } from './TreePanel'
import { DriveView } from './DriveView'
import { PreviewCard, type PreviewState } from './PreviewCard'
import { SettingsPanel } from './SettingsPanel'
import { FolderPicker } from './FolderPicker'
import { findFolderWithPath } from './brain-data'
import type { QuadrantMeta } from '../../services/quadrants'
import type { BrainQuadrant, View } from './types'

function Icon({ d, size = 16 }: { d: string; size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d={d} />
    </svg>
  )
}
const I_BACK = 'M15.75 19.5L8.25 12l7.5-7.5'
const I_TREE = 'M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5'
/* El icono de la vista 3D es un CEREBRO de lucide. Antes era `Sparkles`, que esta
   prohibido en todo el producto: un icono tiene que significar algo real. */
const I_GRID = 'M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z'
const I_PLUS = 'M12 4.5v15m7.5-7.5h-15'
const I_ARCHIVE = 'M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5m8.25 4.5h.008M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z'
const I_SETTINGS = 'M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a6.932 6.932 0 010 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 010-.255c.007-.38-.137-.751-.43-.992l-1.004-.827a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z M15 12a3 3 0 11-6 0 3 3 0 016 0z'
const I_MORE = 'M6.75 12h.008v.008H6.75V12zm5.25 0h.008v.008H12V12zm5.25 0h.008v.008h-.008V12z'

/** Boton del chrome del cerebro: 44 puntos en telefono, compacto en escritorio. */
const BTN =
  'inline-flex h-11 items-center gap-1.5 rounded-lg border border-border bg-popover px-3 text-sm font-medium text-foreground transition-colors md:h-8 md:hover:border-primary/50'

/** Fila de una accion dentro de la hoja inferior de "Más". */
const FILA_HOJA =
  'flex h-12 w-full items-center gap-3 px-4 text-[15px] text-foreground transition-colors active:bg-muted'

type Mode = 'brain' | 'drive'

export function KnowledgeBrain({
  data,
  crossLinks,
  initialView,
  onViewChange,
  onOpenDoc,
  onCreate,
  onOpenArchive,
  onDeleteDoc,
  onCreateFolder,
  onRenameFolder,
  onDeleteFolder,
  onMoveSop,
  onMoveFolder,
  coreName = 'Knowledge',
  quadrantsForSettings = [],
  coreColor = '#22C55E',
}: {
  data: BrainQuadrant[]
  crossLinks: [string, string][]
  initialView?: View
  onViewChange?: (v: View) => void
  onOpenDoc: (slug: string) => void
  onCreate: () => void
  onOpenArchive?: () => void
  /** Eliminar documento (recibe id + título). */
  onDeleteDoc?: (id: string, title: string) => void
  /** Crear nueva carpeta dentro del cuadrante/folder actual. */
  onCreateFolder?: (quadrantKey: string, parentFolderId: string | null) => void
  /** Renombrar carpeta. */
  onRenameFolder?: (id: string, currentName: string) => void
  /** Eliminar carpeta entera (recursivo). */
  onDeleteFolder?: (id: string, name: string, totalDocs: number) => void
  /** Mover un doc a otra carpeta (drag&drop). */
  onMoveSop?: (sopId: string, targetFolderId: string | null, targetQuadrant?: string) => void
  /** Mover una carpeta a otro padre o cuadrante (drag&drop). */
  onMoveFolder?: (folderId: string, targetParentId: string | null, targetQuadrant?: string) => void
  /**
   * Nombre del proyecto que se renderiza en la bola central del cerebro 3D
   * y en el eyebrow de la cabecera. El skill es genérico: cada proyecto
   * pasa el suyo. Default "Knowledge" si no se configura.
   */
  coreName?: string
  /** Cuadrantes para el SettingsPanel (configuración editable). */
  quadrantsForSettings?: QuadrantMeta[]
  /** Color del núcleo central del cerebro 3D. Editable desde SettingsPanel. */
  coreColor?: string
}) {
  const [mode, setMode] = useState<Mode>('brain')
  const [view, setView] = useState<View>(initialView ?? { level: 'overview' })
  const [treeOpen, setTreeOpen] = useState(false)
  const [preview, setPreview] = useState<PreviewState | null>(null)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [movePicker, setMovePicker] = useState<{ kind: 'doc' | 'folder'; id: string; label: string } | null>(null)
  // En telefono el chrome no puede llevar siete botones en fila: el resto vive
  // en una hoja inferior, que es donde el dedo acierta.
  const [masOpen, setMasOpen] = useState(false)

  // Sync view ↔ URL
  useEffect(() => {
    onViewChange?.(view)
  }, [view, onViewChange])

  // Si el view actual apunta a una folder que ya no existe (porque fue
  // borrada / movida y refresh trajo data fresca), volver a overview.
  useEffect(() => {
    if (view.level !== 'folder') return
    const found = findFolderWithPath(data, view.folderId)
    if (!found) setView({ level: 'overview' })
  }, [data, view])

  // Breadcrumb dinámico para la cabecera
  let breadcrumb = 'El cerebro de todo el SaaS'
  let currentQuadrantKey: string | null = null
  if (view.level === 'quadrant') {
    const q = data.find((x) => x.key === view.q)
    if (q) {
      breadcrumb = q.label
      currentQuadrantKey = q.key
    }
  } else if (view.level === 'folder') {
    const found = findFolderWithPath(data, view.folderId)
    if (found) {
      const path = found.path.map((f) => f.name).join(' › ')
      breadcrumb = `${found.quadrant.label} › ${path}`
      currentQuadrantKey = found.quadrant.key
    }
  }

  const emptyFolder =
    mode === 'brain' &&
    (() => {
      if (view.level === 'quadrant') {
        const q = data.find((x) => x.key === view.q)
        return !!q && q.rootFolders.length === 0 && q.rootDocs.length === 0
      }
      if (view.level === 'folder') {
        const found = findFolderWithPath(data, view.folderId)
        if (!found) return false
        const cur = found.path[found.path.length - 1]
        return cur.subFolders.length === 0 && cur.docs.length === 0
      }
      return false
    })()

  function back() {
    if (view.level === 'folder') {
      const found = findFolderWithPath(data, view.folderId)
      if (!found) return setView({ level: 'overview' })
      if (found.path.length > 1) {
        const parent = found.path[found.path.length - 2]
        return setView({ level: 'folder', folderId: parent.id })
      }
      return setView({ level: 'quadrant', q: found.quadrant.key })
    }
    if (view.level === 'quadrant') return setView({ level: 'overview' })
  }

  // Card flotante preview al primer tap en 3D (solo docs)
  const onScenePreview = useCallback((info: ContextNodeInfo, x: number, y: number) => {
    if (info.kind !== 'doc') return
    setPreview({ slug: info.slug, title: info.title, description: info.description, x, y })
  }, [])

  const tabBase = 'flex h-11 items-center gap-1.5 px-3 text-sm font-medium transition-colors md:h-8'
  const puedeVolver = mode === 'brain' && view.level !== 'overview'

  return (
    <div className="relative h-full min-h-[80dvh] w-full overflow-hidden bg-background text-foreground">
      {mode === 'brain' ? (
        <Canvas camera={{ position: [0, 1, 12], fov: 50 }} dpr={[1, 1.5]} gl={{ antialias: true, powerPreference: 'high-performance' }}>
          <Scene
            data={data}
            crossLinks={crossLinks}
            view={view}
            setView={setView}
            onOpenDoc={onOpenDoc}
            onPreviewNode={onScenePreview}
            coreName={coreName}
            coreColor={coreColor}
          />
        </Canvas>
      ) : (
        // El hueco de abajo reserva el sitio de la barra del telefono: sin el, la
        // ultima carpeta queda tapada por el menu y no se puede tocar.
        <div className="absolute inset-0 overflow-y-auto pt-32 pb-[calc(3.5rem+var(--sab)+1.5rem)] md:pt-24 md:pb-6">
          <DriveView
            data={data}
            view={view}
            setView={setView}
            onOpenDoc={onOpenDoc}
            onCreateFolder={onCreateFolder}
            onRenameFolder={onRenameFolder}
            onDeleteFolder={onDeleteFolder}
            onDeleteDoc={onDeleteDoc}
            onMoveSop={onMoveSop}
            onMoveFolder={onMoveFolder}
            onPickMoveTarget={(item) => setMovePicker(item)}
          />
        </div>
      )}

      {/* Cabecera. En telefono va apilada (titulo arriba, acciones debajo) y solo
          se ven DOS cosas: el cambio de vista y el boton "Más". En escritorio
          vuelve a la rejilla de dos columnas con la fila entera de botones. */}
      <div className="pointer-events-none absolute inset-x-0 top-0 z-30 flex flex-col gap-2 pt-4 pl-[max(1rem,var(--sal))] pr-[max(1rem,var(--sar))] md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-start md:gap-3 md:p-6">
        <div className="min-w-0">
          <p className="mb-1 inline-flex items-center gap-2 text-sm font-semibold text-primary">
            <span className="inline-block h-1.5 w-1.5 animate-pulse rounded-full bg-primary" />
            Knowledge · Cerebro {coreName}
          </p>
          <h1 className="truncate text-lg leading-tight font-semibold text-foreground md:text-2xl">{breadcrumb}</h1>
        </div>

        <div className="pointer-events-auto flex flex-wrap items-center gap-2 md:justify-end">
          <div className="flex overflow-hidden rounded-lg border border-border bg-popover">
            <button
              onClick={() => setMode('brain')}
              className={cn(tabBase, mode === 'brain' ? 'bg-primary/20 text-primary' : 'text-muted-foreground')}
            >
              <IconoCerebro className="h-4 w-4" aria-hidden /> <span>Cerebro 3D</span>
            </button>
            <button
              onClick={() => setMode('drive')}
              className={cn(
                tabBase,
                'border-l border-border',
                mode === 'drive' ? 'bg-primary/20 text-primary' : 'text-muted-foreground',
              )}
            >
              <Icon d={I_GRID} /> <span>Carpetas</span>
            </button>
          </div>

          {/* Siempre hay salida: el boton de volver se ve tambien en telefono. */}
          {puedeVolver && (
            <button onClick={back} className={cn(BTN, 'md:hidden')}>
              <Icon d={I_BACK} /> Volver
            </button>
          )}

          {/* TELEFONO: todo lo demas, en una hoja inferior. */}
          <button onClick={() => setMasOpen(true)} className={cn(BTN, 'md:hidden')}>
            <Icon d={I_MORE} /> Más
          </button>

          {/* ESCRITORIO: la fila entera, como estaba. */}
          <div className="hidden items-center gap-2 md:flex">
            <button onClick={() => setTreeOpen((v) => !v)} className={BTN}>
              <Icon d={I_TREE} /> <span>Índice</span>
            </button>

            {/* Crear carpeta aquí (rápido desde la cabecera, en vista Carpetas con quadrant/folder activo) */}
            {mode === 'drive' && onCreateFolder && currentQuadrantKey && (
              <button
                onClick={() => onCreateFolder(currentQuadrantKey!, view.level === 'folder' ? view.folderId : null)}
                className={BTN}
                title="Crear carpeta en esta ubicación"
              >
                <Icon d={I_PLUS} /> <span>Carpeta</span>
              </button>
            )}

            <button onClick={onCreate} className={BTN}>
              <Icon d={I_PLUS} /> <span>Nuevo doc</span>
            </button>

            {onOpenArchive && (
              <button onClick={onOpenArchive} className={BTN}>
                <Icon d={I_ARCHIVE} /> <span>Archivador</span>
              </button>
            )}

            <button onClick={() => setSettingsOpen(true)} className={BTN} title="Configurar nombre del proyecto y cuadrantes">
              <Icon d={I_SETTINGS} /> <span>Config</span>
            </button>

            {puedeVolver && (
              <button onClick={back} className={BTN}>
                <Icon d={I_BACK} /> <span>Volver</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Hoja inferior "Más", solo telefono. Lado FIJO, sin JavaScript que decida. */}
      <Sheet open={masOpen} onOpenChange={setMasOpen}>
        <SheetContent side="bottom" aria-describedby={undefined} className="rounded-t-xl md:hidden">
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border" />
          <SheetHeader>
            <SheetTitle className="text-[17px] font-semibold">Acciones del Knowledge</SheetTitle>
          </SheetHeader>
          <div className="pb-safe-4">
            <button
              onClick={() => {
                setMasOpen(false)
                setTreeOpen(true)
              }}
              className={FILA_HOJA}
            >
              <Icon d={I_TREE} /> Índice
            </button>

            {mode === 'drive' && onCreateFolder && currentQuadrantKey && (
              <button
                onClick={() => {
                  setMasOpen(false)
                  onCreateFolder(currentQuadrantKey!, view.level === 'folder' ? view.folderId : null)
                }}
                className={FILA_HOJA}
              >
                <Icon d={I_PLUS} /> Carpeta
              </button>
            )}

            <button
              onClick={() => {
                setMasOpen(false)
                onCreate()
              }}
              className={FILA_HOJA}
            >
              <Icon d={I_PLUS} /> Nuevo doc
            </button>

            {onOpenArchive && (
              <button
                onClick={() => {
                  setMasOpen(false)
                  onOpenArchive()
                }}
                className={FILA_HOJA}
              >
                <Icon d={I_ARCHIVE} /> Archivador
              </button>
            )}

            <button
              onClick={() => {
                setMasOpen(false)
                setSettingsOpen(true)
              }}
              className={FILA_HOJA}
            >
              <Icon d={I_SETTINGS} /> Config
            </button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Índice: desplegable. En telefono ocupa el ancho util sin salirse por el borde. */}
      {treeOpen && (
        <div className="absolute inset-x-4 top-[132px] z-50 md:inset-x-auto md:right-6 md:top-[78px]">
          <TreePanel data={data} setView={setView} onOpenDoc={onOpenDoc} onClose={() => setTreeOpen(false)} />
        </div>
      )}

      {/* Carpeta vacía */}
      {emptyFolder && (
        <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center px-6 text-center">
          <p className="text-[15px] text-muted-foreground">Aún sin documentos.</p>
        </div>
      )}

      {/* Hint 3D — por encima de la barra de abajo del telefono, nunca debajo. */}
      {mode === 'brain' && (
        <p className="pointer-events-none absolute inset-x-0 bottom-[calc(3.5rem+var(--sab)+1rem)] z-20 px-6 text-center text-sm text-muted-foreground md:bottom-4">
          arrastra o 2 dedos: girar · pellizco o ⌘+scroll: zoom · 1 tap: previsualizar · 2 taps: abrir
        </p>
      )}

      {/* Card flotante de previsualización */}
      <PreviewCard state={preview} onOpen={onOpenDoc} onClose={() => setPreview(null)} />

      {/* Panel de configuración (nombre del proyecto + cuadrantes + color núcleo) */}
      <SettingsPanel
        open={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        initialProjectName={coreName}
        initialCoreColor={coreColor}
        initialQuadrants={quadrantsForSettings}
      />

      {/* Picker "Mover a…" para docs y carpetas */}
      <FolderPicker
        open={!!movePicker}
        onClose={() => setMovePicker(null)}
        data={data}
        excludeFolderId={movePicker?.kind === 'folder' ? movePicker.id : null}
        title={movePicker ? `Mover "${movePicker.label}" a…` : 'Mover a…'}
        onPick={({ folderId, quadrantKey }) => {
          if (!movePicker) return
          if (movePicker.kind === 'doc') {
            onMoveSop?.(movePicker.id, folderId, quadrantKey)
          } else {
            onMoveFolder?.(movePicker.id, folderId, quadrantKey)
          }
        }}
      />
    </div>
  )
}
