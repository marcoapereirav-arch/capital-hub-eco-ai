'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Calendar, Plus, Trash2, Loader2, Send } from 'lucide-react'
import { cn } from '@/lib/utils'
import { createScheduledPost, deleteScheduledPost, publishScheduledPostNow } from '../actions'
import type { ScheduledPost } from '../types'

const MEDIA_TYPES: Array<ScheduledPost['media_type']> = ['reel', 'image', 'carousel', 'story']

// No hay componente Select en el kit, asi que el desplegable nativo lleva al
// menos los 44 puntos del dedo y los colores del tema.
const SELECT_CLASS =
  'h-11 w-full rounded-lg border border-border bg-card px-3 text-base text-foreground md:h-8 md:text-sm'

function formatDateTime(iso: string): string {
  const d = new Date(iso)
  return d.toLocaleString('es-ES', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function statusVariant(s: ScheduledPost['status']): 'default' | 'secondary' | 'destructive' {
  if (s === 'published') return 'default'
  if (s === 'failed') return 'destructive'
  return 'secondary'
}

function statusLabel(s: ScheduledPost['status']): string {
  const map: Record<ScheduledPost['status'], string> = {
    draft: 'Borrador',
    scheduled: 'Programado',
    publishing: 'Publicando…',
    published: 'Publicado',
    failed: 'Falló',
  }
  return map[s]
}

function groupByDate(items: ScheduledPost[]): Map<string, ScheduledPost[]> {
  const map = new Map<string, ScheduledPost[]>()
  for (const item of items) {
    const dateKey = item.scheduled_for.slice(0, 10)
    const list = map.get(dateKey) ?? []
    list.push(item)
    map.set(dateKey, list)
  }
  return map
}

export function CalendarView({ posts }: { posts: ScheduledPost[] }) {
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [publishingId, setPublishingId] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)

  const grouped = groupByDate(posts)
  const dates = Array.from(grouped.keys()).sort()

  async function handleSubmit(formData: FormData) {
    setError(null)
    startTransition(async () => {
      const result = await createScheduledPost(formData)
      if (result.error) {
        setError(result.error)
      } else {
        setOpen(false)
      }
    })
  }

  async function handleDelete(id: string) {
    setDeletingId(id)
    const fd = new FormData()
    fd.set('id', id)
    await deleteScheduledPost(fd)
    setDeletingId(null)
  }

  async function handlePublishNow(id: string) {
    setPublishError(null)
    setPublishingId(id)
    const fd = new FormData()
    fd.set('id', id)
    const result = await publishScheduledPostNow(fd)
    if (result.error) setPublishError(result.error)
    setPublishingId(null)
  }

  const tomorrow = new Date()
  tomorrow.setDate(tomorrow.getDate() + 1)
  tomorrow.setHours(10, 0, 0, 0)
  const tomorrowIso = new Date(tomorrow.getTime() - tomorrow.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16)

  return (
    <div className="flex flex-col gap-6">
      {/* En telefono la accion principal ocupa su propia linea a ancho completo */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <p className="text-sm tabular-nums text-muted-foreground">
          {posts.length} posts en el calendario.
        </p>
        <Button onClick={() => setOpen(true)} className="w-full md:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Programar Post
        </Button>
      </div>

      {publishError && (
        <div className="rounded-lg border border-destructive/40 bg-destructive/10 p-3 text-sm text-destructive">
          Error al publicar: {publishError}
        </div>
      )}

      {dates.length === 0 ? (
        <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
          <Calendar className="h-6 w-6 text-muted-foreground" />
          <h3 className="text-[17px] font-semibold text-foreground">No hay posts programados.</h3>
          <p className="max-w-[38ch] text-[15px] text-muted-foreground">
            Crea uno con el botón &laquo;Programar Post&raquo;.
          </p>
          <Button onClick={() => setOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Programar Post
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map(date => (
            <Card key={date} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-semibold text-muted-foreground">
                  {new Date(date).toLocaleDateString('es-ES', {
                    weekday: 'long',
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric',
                  })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-2">
                  {(grouped.get(date) ?? []).map(post => (
                    // TELEFONO: ficha apilada. MONITOR: la fila de siempre.
                    <li
                      key={post.id}
                      className="flex flex-col gap-2 rounded-lg border border-border bg-muted/20 p-3 md:flex-row md:items-center md:gap-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-sm tabular-nums text-muted-foreground md:w-20">
                          {formatDateTime(post.scheduled_for).split(',')[1]?.trim() ?? ''}
                        </span>
                        <Badge variant="secondary" className="h-auto py-0.5 text-sm">
                          {post.media_type}
                        </Badge>
                        <Badge variant={statusVariant(post.status)} className="h-auto py-0.5 text-sm md:order-last">
                          {statusLabel(post.status)}
                        </Badge>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-[15px] text-foreground md:line-clamp-1">
                          {post.caption ?? <span className="text-muted-foreground italic">Sin caption</span>}
                        </p>
                        {post.publish_error && (
                          <p className="mt-1 text-sm text-destructive">{post.publish_error}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2 self-end md:self-auto">
                        {(post.status === 'scheduled' ||
                          post.status === 'draft' ||
                          post.status === 'failed') &&
                          post.media_url && (
                            <Button
                              size="icon"
                              variant="secondary"
                              onClick={() => handlePublishNow(post.id)}
                              disabled={publishingId === post.id}
                              title="Publicar ahora"
                              aria-label="Publicar ahora"
                            >
                              {publishingId === post.id ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Send className="h-4 w-4" />
                              )}
                            </Button>
                          )}
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(post.id)}
                          disabled={deletingId === post.id}
                          title="Eliminar"
                          aria-label="Eliminar"
                        >
                          {deletingId === post.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* El lado NO se decide con JavaScript: hoja inferior fija, y el monitor
          se ajusta solo con clases md:. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className={cn(
            'rounded-t-xl',
            'md:inset-y-0 md:right-0 md:left-auto md:h-dvh md:w-full md:max-w-md md:rounded-l-xl md:border-l',
            'md:data-[side=bottom]:max-h-none md:data-[side=bottom]:pb-0'
          )}
        >
          <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-border md:hidden" />
          <SheetHeader>
            <SheetTitle className="text-[17px] font-semibold">Programar publicación</SheetTitle>
            <SheetDescription className="text-sm">
              Cuando llegue la fecha, se publicará automáticamente vía Meta Graph
              (requiere setup de token).
            </SheetDescription>
          </SheetHeader>
          <form action={handleSubmit} className="flex flex-col gap-4 px-4 pb-2">
            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">
                Fecha y hora
              </span>
              <Input
                type="datetime-local"
                name="scheduled_for"
                required
                defaultValue={tomorrowIso}
              />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">
                Tipo
              </span>
              <select name="media_type" defaultValue="reel" className={SELECT_CLASS}>
                {MEDIA_TYPES.map(mt => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">
                URL del media (mp4 / jpg)
              </span>
              <Input type="url" name="media_url" inputMode="url" placeholder="https://..." />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">
                Caption
              </span>
              <Textarea name="caption" rows={5} placeholder="Texto del post..." />
            </label>

            <label className="flex flex-col gap-1.5">
              <span className="text-sm font-semibold text-muted-foreground">
                Estado
              </span>
              <select name="status" defaultValue="scheduled" className={SELECT_CLASS}>
                <option value="draft">Borrador</option>
                <option value="scheduled">Programar</option>
              </select>
            </label>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* sticky, no fixed: el desplazamiento real lo hace la hoja */}
            <div className="sticky bottom-0 -mx-4 border-t border-border bg-popover px-4 pt-3 pb-safe-4 md:pb-3">
              <Button type="submit" disabled={pending} className="w-full md:w-auto">
                {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Guardar
              </Button>
            </div>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
