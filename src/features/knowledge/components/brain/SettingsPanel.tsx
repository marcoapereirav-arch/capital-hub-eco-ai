'use client'

import { useEffect, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'
import { updateKnowledgeSettings } from '@/actions/knowledge'
import { QUADRANTS, type QuadrantMeta } from '../../services/quadrants'

interface QuadrantEdit {
  key: string
  label: string
  blurb: string
  color: string
}

/**
 * Ajustes del Knowledge. El admin puede cambiar:
 *   - Nombre del proyecto (lo que sale en la bola central del 3D).
 *   - Color del núcleo central.
 *   - Para cada cuadrante: label, descripción corta, color.
 *
 * Los keys de los cuadrantes son fijos (no editables) porque están enlazados
 * a los datos en BD. Solo se edita la "fachada visual".
 *
 * Los colores de los cuadrantes SI son un color a mano a proposito: los elige el
 * usuario y son datos de producto, no diseno. Todo lo demas va por tokens.
 *
 * Antes era una ventana centrada a mano: en un telefono el teclado la tapaba al
 * escribir. Ahora es la hoja inferior del kit, con el lado FIJO.
 */
export function SettingsPanel({
  open,
  onClose,
  initialProjectName,
  initialCoreColor,
  initialQuadrants,
}: {
  open: boolean
  onClose: () => void
  initialProjectName: string
  initialCoreColor: string
  initialQuadrants: QuadrantMeta[]
}) {
  const router = useRouter()
  const [pending, start] = useTransition()
  const [projectName, setProjectName] = useState(initialProjectName)
  const [coreColor, setCoreColor] = useState(initialCoreColor)
  const [quadrants, setQuadrants] = useState<QuadrantEdit[]>(() =>
    initialQuadrants.map((q) => ({ key: q.key, label: q.label, blurb: q.blurb, color: q.color })),
  )

  // Reset cuando el modal se abre con nuevos valores iniciales
  useEffect(() => {
    if (!open) return
    setProjectName(initialProjectName)
    setCoreColor(initialCoreColor)
    setQuadrants(initialQuadrants.map((q) => ({ key: q.key, label: q.label, blurb: q.blurb, color: q.color })))
  }, [open, initialProjectName, initialCoreColor, initialQuadrants])

  function updateQuadrant(key: string, patch: Partial<QuadrantEdit>) {
    setQuadrants((prev) => prev.map((q) => (q.key === key ? { ...q, ...patch } : q)))
  }

  function onResetQuadrants() {
    if (!confirm('¿Restaurar los cuadrantes a sus valores por defecto? Pierdes los cambios.')) return
    setQuadrants(QUADRANTS.map((q) => ({ key: q.key, label: q.label, blurb: q.blurb, color: q.color })))
  }

  function onSave() {
    start(async () => {
      try {
        await updateKnowledgeSettings({
          project_name: projectName,
          core_color: coreColor,
          quadrants,
        })
        router.refresh()
        onClose()
      } catch (e) {
        alert((e as Error).message || 'Error al guardar')
      }
    })
  }

  return (
    <Sheet
      open={open}
      onOpenChange={(abierto) => {
        if (!abierto) onClose()
      }}
    >
      <SheetContent
        side="bottom"
        className={cn(
          'rounded-t-xl',
          // El escritorio repite la condicion del lado porque las clases del kit
          // (`data-[side=bottom]:...`) pesan mas que un `md:` suelto y lo ganan.
          'md:data-[side=bottom]:inset-y-0 md:right-0 md:data-[side=bottom]:left-auto md:data-[side=bottom]:h-full md:data-[side=bottom]:max-h-none md:w-full md:max-w-xl md:border-l md:pb-0',
        )}
      >
        <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
        <SheetHeader>
          <SheetTitle className="text-[17px] font-semibold">Personaliza tu Knowledge</SheetTitle>
          <SheetDescription>Nombre del proyecto, color del núcleo y cuadrantes.</SheetDescription>
        </SheetHeader>

        <div className="space-y-6 px-4 pb-4">
          {/* Nombre del proyecto */}
          <section>
            <h3 className="mb-2 text-[15px] font-semibold text-foreground">Nombre del proyecto</h3>
            <p className="mb-2 text-[15px] leading-relaxed text-muted-foreground">
              Aparece en la bola central del cerebro 3D y en la cabecera.
            </p>
            <Input
              value={projectName}
              onChange={(e) => setProjectName(e.target.value)}
              placeholder="Ej: Mi Proyecto"
            />
          </section>

          {/* Color del núcleo */}
          <section>
            <h3 className="mb-2 text-[15px] font-semibold text-foreground">Color del núcleo central</h3>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={coreColor}
                onChange={(e) => setCoreColor(e.target.value)}
                aria-label="Color del núcleo central"
                className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent"
              />
              <Input
                value={coreColor}
                onChange={(e) => setCoreColor(e.target.value)}
                placeholder="#22C55E"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                className="tabular-nums"
              />
            </div>
          </section>

          {/* Cuadrantes */}
          <section>
            <div className="mb-2 flex flex-col gap-2 md:flex-row md:items-start md:justify-between">
              <div className="min-w-0">
                <h3 className="text-[15px] font-semibold text-foreground">Cuadrantes</h3>
                <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                  Las 6 carpetas raíz del Knowledge. Cambia el nombre, descripción y color de cada una.
                </p>
              </div>
              <Button variant="outline" onClick={onResetQuadrants} className="shrink-0">
                Restaurar default
              </Button>
            </div>

            <div className="space-y-3">
              {quadrants.map((q) => (
                <div key={q.key} className="space-y-2 rounded-lg border border-border bg-card p-3">
                  <div className="flex items-center gap-2">
                    <span
                      aria-hidden
                      className="h-3 w-3 shrink-0 rounded-full"
                      style={{ background: q.color }}
                    />
                    <span className="shrink-0 text-sm font-semibold text-muted-foreground">{q.key}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      value={q.label}
                      onChange={(e) => updateQuadrant(q.key, { label: e.target.value })}
                      placeholder="Nombre visible"
                    />
                    <input
                      type="color"
                      value={q.color}
                      onChange={(e) => updateQuadrant(q.key, { color: e.target.value })}
                      className="h-11 w-14 shrink-0 cursor-pointer rounded-lg border border-border bg-transparent md:h-9"
                      aria-label={`Color del cuadrante ${q.key}`}
                      title="Color del cuadrante"
                    />
                  </div>
                  <Input
                    value={q.blurb}
                    onChange={(e) => updateQuadrant(q.key, { blurb: e.target.value })}
                    placeholder="Descripción corta"
                  />
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* Pegada abajo DENTRO de la hoja, para que el teclado no la tape. */}
        <div className="sticky bottom-0 z-10 flex items-center justify-end gap-2 border-t border-border bg-popover px-4 py-3 pb-safe-4 md:pb-3">
          <Button variant="secondary" onClick={onClose}>
            Cancelar
          </Button>
          <Button onClick={onSave} disabled={pending}>
            {pending ? 'Guardando…' : 'Guardar'}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
