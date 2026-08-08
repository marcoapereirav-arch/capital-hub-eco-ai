'use client'

import { useMemo, useState, useTransition } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { PageContainer } from '@/components/ui/page-container'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { updateSop, deleteSop, moveSop, createFolder } from '@/actions/knowledge'
import { QUADRANTS, QUADRANT_LABEL, type FolderRow, type Quadrant, type SopRow } from '../services/quadrants'

/** Item del dropdown jerárquico de carpetas. */
interface FolderOption {
  id: string
  label: string  // ya con indentación visual
  quadrant: Quadrant
}

/** Desplegable nativo con la ropa del tema y 44 puntos de alto en telefono. */
const SELECT_CLASS =
  'h-11 w-full min-w-0 rounded-lg border border-border bg-card px-3 text-base text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 md:h-9 md:text-sm'

function buildFolderOptions(folders: FolderRow[]): FolderOption[] {
  const opts: FolderOption[] = []
  for (const meta of QUADRANTS) {
    // Header del cuadrante (raíz, sin id)
    const inQ = folders.filter((f) => f.quadrant === meta.key)
    if (inQ.length === 0) continue
    // Construir árbol y recorrerlo en preorder con indentación
    const byParent = new Map<string | null, FolderRow[]>()
    for (const f of inQ) {
      const arr = byParent.get(f.parent_folder_id) ?? []
      arr.push(f)
      byParent.set(f.parent_folder_id, arr)
    }
    function visit(parentId: string | null, depth: number) {
      const kids = (byParent.get(parentId) ?? []).slice().sort((a, b) => a.name.localeCompare(b.name, 'es'))
      for (const k of kids) {
        opts.push({
          id: k.id,
          label: `${'  '.repeat(depth)}${depth > 0 ? '↳ ' : ''}${meta.label} · ${k.name}`,
          quadrant: meta.key,
        })
        visit(k.id, depth + 1)
      }
    }
    visit(null, 0)
  }
  return opts
}

/**
 * Pantalla de un documento del Knowledge: se lee y se escribe aqui.
 *
 * Es una pagina de LECTURA, asi que el cuerpo va a 16 puntos con interlineado
 * holgado. Antes iba a 14 puntos y en fuente de maquina de escribir, y las
 * etiquetas a 10 y 11 puntos con las mayusculas separadas: en un telefono, con
 * el zoom desactivado, eso no habia forma de leerlo.
 */
export function KnowledgeEditorClient({ sop, folders }: { sop: SopRow; folders: FolderRow[] }) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const fromParam = searchParams?.get('from') ?? null
  const backHref = fromParam ? `/knowledge?view=${fromParam}` : '/knowledge'
  const [isPending, start] = useTransition()
  const [title, setTitle] = useState(sop.title)
  const [description, setDescription] = useState(sop.description ?? '')
  const [content, setContent] = useState(sop.content_md)
  const [quadrant, setQuadrant] = useState<Quadrant>(sop.quadrant)
  const [folderId, setFolderId] = useState<string | null>(sop.folder_id ?? null)
  const [active, setActive] = useState(sop.active)
  const [savedAt, setSavedAt] = useState<string | null>(null)

  const folderOptions = useMemo(() => buildFolderOptions(folders), [folders])
  // Filtrar opciones solo del quadrant actual del doc
  const optionsForQuadrant = folderOptions.filter((o) => o.quadrant === quadrant)

  const dirty =
    title !== sop.title ||
    description !== (sop.description ?? '') ||
    content !== sop.content_md ||
    quadrant !== sop.quadrant ||
    folderId !== (sop.folder_id ?? null) ||
    active !== sop.active

  function onDelete() {
    if (!confirm(`Borrar "${sop.title}"? Irá al Archivador y podrás recuperarlo.`)) return
    start(async () => {
      try {
        await deleteSop(sop.id)
        router.push(backHref)
      } catch (e) {
        alert((e as Error).message || 'Error al borrar')
      }
    })
  }

  function onCreateFolderInline() {
    const name = prompt('Nombre de la carpeta nueva (en raíz del cuadrante actual):')?.trim()
    if (!name) return
    start(async () => {
      try {
        const f = await createFolder({ name, quadrant, parent_folder_id: null })
        setFolderId(f.id)
        router.refresh()
      } catch (e) {
        alert((e as Error).message || 'Error al crear carpeta')
      }
    })
  }

  function onSave() {
    if (!dirty) return
    start(async () => {
      try {
        // 1) Si cambió el folder_id o el quadrant, usar moveSop para mantener
        //    consistencia de jerarquía (folder.quadrant vs sop.quadrant).
        if (folderId !== (sop.folder_id ?? null) || quadrant !== sop.quadrant) {
          await moveSop({
            id: sop.id,
            target_folder_id: folderId,
            target_quadrant: folderId === null ? quadrant : undefined,
          })
        }
        // 2) Actualizar el resto de campos.
        await updateSop({
          id: sop.id,
          title,
          description: description || null,
          content_md: content,
          quadrant,
          subfolder: null,  // dejamos de usar subfolder, folder_id es la fuente
          active,
        })
        setSavedAt(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }))
        router.refresh()
      } catch (e) {
        alert((e as Error).message || 'Error al guardar')
      }
    })
  }

  return (
    <>
      <PageContainer narrow>
        {/* Siempre hay salida: boton de volver visible, con texto, arriba a la izquierda. */}
        <button
          onClick={() => router.push(backHref)}
          className="inline-flex h-11 w-fit items-center gap-1.5 text-[15px] font-medium text-muted-foreground transition-colors md:h-auto md:hover:text-foreground"
          title={fromParam ? 'Volver a donde estabas en el cerebro' : 'Volver al cerebro'}
        >
          <ArrowLeft className="h-4 w-4" /> Volver al cerebro
        </button>

        <header className="flex flex-col gap-2 md:flex-row md:items-start md:justify-between md:gap-4">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-primary">
              Knowledge · {QUADRANT_LABEL[quadrant]} · {sop.slug}
            </p>
            <p className="mt-0.5 text-sm text-muted-foreground">
              Última edición: {new Date(sop.updated_at).toLocaleString('es-ES', { dateStyle: 'medium', timeStyle: 'short' })}
              {savedAt && <span className="ml-2 text-primary">· Guardado {savedAt}</span>}
            </p>
          </div>
          {/* En escritorio las dos acciones van arriba; en telefono, Guardar vive
              en la barra pegada abajo y aqui solo queda Borrar. */}
          <div className="flex shrink-0 items-center gap-2">
            <Button variant="destructive" onClick={onDelete} disabled={isPending}>
              Borrar
            </Button>
            <Button onClick={onSave} disabled={!dirty || isPending} className="hidden md:inline-flex">
              {isPending ? 'Guardando…' : dirty ? 'Guardar' : 'Guardado'}
            </Button>
          </div>
        </header>

        <div>
          <label htmlFor="ke-titulo" className="sr-only">Título</label>
          <input
            id="ke-titulo"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Título"
            enterKeyHint="next"
            className="w-full min-w-0 border-none bg-transparent px-0 py-1 text-2xl font-semibold text-foreground outline-none placeholder:text-muted-foreground md:text-3xl"
          />

          <label htmlFor="ke-descripcion" className="sr-only">Descripción corta</label>
          <input
            id="ke-descripcion"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Descripción corta (1 línea)"
            enterKeyHint="next"
            className="w-full min-w-0 border-none bg-transparent px-0 py-1 text-base text-muted-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>

        {/* Cuadrante + Carpeta jerárquica + Active. Una columna en telefono. */}
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">Cuadrante</span>
            <select
              value={quadrant}
              onChange={(e) => {
                const newQ = e.target.value as Quadrant
                setQuadrant(newQ)
                // Si la carpeta actual pertenece a otro quadrant, la deseleccionamos
                const opt = folderOptions.find((o) => o.id === folderId)
                if (opt && opt.quadrant !== newQ) setFolderId(null)
              }}
              className={SELECT_CLASS}
            >
              {QUADRANTS.map((q) => (
                <option key={q.key} value={q.key}>
                  {q.label}
                </option>
              ))}
            </select>
          </label>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-semibold text-muted-foreground">Carpeta</span>
            <div className="flex items-center gap-2">
              <label htmlFor="ke-carpeta" className="sr-only">Carpeta</label>
              <select
                id="ke-carpeta"
                value={folderId ?? ''}
                onChange={(e) => setFolderId(e.target.value || null)}
                className={SELECT_CLASS}
              >
                <option value="">— (raíz del cuadrante) —</option>
                {optionsForQuadrant.map((o) => (
                  <option key={o.id} value={o.id}>{o.label}</option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={onCreateFolderInline}
                disabled={isPending}
                className="shrink-0"
                title="Crea una carpeta nueva en la raíz del cuadrante actual"
              >
                + Nueva
              </Button>
            </div>
          </div>

          <label className="flex min-h-11 cursor-pointer select-none items-center gap-2 md:col-span-2">
            <input
              type="checkbox"
              checked={active}
              onChange={(e) => setActive(e.target.checked)}
              className="h-5 w-5 rounded-sm border-border bg-card accent-primary"
            />
            <span className="text-[15px] text-foreground">Activo · lo leen las IAs del SaaS</span>
          </label>
        </div>

        {/* El cuerpo del documento: 16 puntos e interlineado holgado. */}
        <label htmlFor="ke-contenido" className="sr-only">Contenido en markdown</label>
        <Textarea
          id="ke-contenido"
          value={content}
          onChange={(e) => setContent(e.target.value)}
          spellCheck={false}
          placeholder="Contenido en markdown..."
          className="min-h-[60dvh] resize-y bg-card px-4 py-3 text-base leading-relaxed text-foreground md:text-base"
        />

        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Soporta markdown estándar: encabezados, listas, tablas, código, énfasis. Aplica al instante en el chat tras
          guardar.
        </p>

        {/* TELEFONO: la accion principal, pegada abajo DENTRO del contenedor que se
            desplaza. Con `fixed` el teclado la tapa justo cuando hace falta.
            Se ancla POR ENCIMA de la barra de abajo (56 puntos + la franja de
            gestos): pegada a bottom-0 quedaria justo detras del menu. */}
        <div className="sticky bottom-[calc(3.5rem+var(--sab))] z-30 -mx-4 border-t border-border bg-background px-4 py-3 md:hidden">
          <Button onClick={onSave} disabled={!dirty || isPending} className="w-full">
            {isPending ? 'Guardando…' : dirty ? 'Guardar' : 'Guardado'}
          </Button>
        </div>
      </PageContainer>
    </>
  )
}
