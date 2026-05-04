'use client'

import { useState, useTransition } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Calendar, Plus, Trash2, Loader2, Send } from 'lucide-react'
import { createScheduledPost, deleteScheduledPost, publishScheduledPostNow } from '../actions'
import type { ScheduledPost } from '../types'

const MEDIA_TYPES: Array<ScheduledPost['media_type']> = ['reel', 'image', 'carousel', 'story']

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
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {posts.length} posts en el calendario.
        </p>
        <Button size="sm" onClick={() => setOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Programar Post
        </Button>
      </div>

      {publishError && (
        <div className="border border-destructive/40 bg-destructive/5 p-3 text-xs text-destructive">
          Error al publicar: {publishError}
        </div>
      )}

      {dates.length === 0 ? (
        <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
          <Calendar className="mx-auto mb-2 h-6 w-6" />
          <div>No hay posts programados.</div>
          <div className="mt-1 text-xs">Crea uno con el botón &laquo;Programar Post&raquo;.</div>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {dates.map(date => (
            <Card key={date} className="border-border">
              <CardHeader className="pb-3">
                <CardTitle className="font-mono text-xs uppercase tracking-wide text-muted-foreground">
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
                    <li
                      key={post.id}
                      className="flex items-center gap-3 border border-border bg-muted/20 p-3"
                    >
                      <div className="w-24 font-mono text-xs text-muted-foreground">
                        {formatDateTime(post.scheduled_for).split(',')[1]?.trim() ?? ''}
                      </div>
                      <Badge variant="secondary" className="font-mono text-[10px] uppercase">
                        {post.media_type}
                      </Badge>
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-1 text-sm text-foreground">
                          {post.caption ?? <span className="italic text-muted-foreground">Sin caption</span>}
                        </p>
                        {post.publish_error && (
                          <p className="mt-1 text-[10px] text-destructive">{post.publish_error}</p>
                        )}
                      </div>
                      <Badge variant={statusVariant(post.status)} className="font-mono text-[10px]">
                        {statusLabel(post.status)}
                      </Badge>
                      {(post.status === 'scheduled' ||
                        post.status === 'draft' ||
                        post.status === 'failed') &&
                        post.media_url && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePublishNow(post.id)}
                            disabled={publishingId === post.id}
                            title="Publicar ahora"
                          >
                            {publishingId === post.id ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <Send className="h-3 w-3" />
                            )}
                          </Button>
                        )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleDelete(post.id)}
                        disabled={deletingId === post.id}
                      >
                        {deletingId === post.id ? (
                          <Loader2 className="h-3 w-3 animate-spin" />
                        ) : (
                          <Trash2 className="h-3 w-3" />
                        )}
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Programar publicación</SheetTitle>
            <SheetDescription>
              Cuando llegue la fecha, se publicará automáticamente vía Meta Graph
              (requiere setup de token).
            </SheetDescription>
          </SheetHeader>
          <form action={handleSubmit} className="mt-6 flex flex-col gap-4 px-4">
            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Fecha y hora
              </span>
              <Input
                type="datetime-local"
                name="scheduled_for"
                required
                defaultValue={tomorrowIso}
              />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Tipo
              </span>
              <select
                name="media_type"
                defaultValue="reel"
                className="border border-border bg-background px-3 py-2 text-sm"
              >
                {MEDIA_TYPES.map(mt => (
                  <option key={mt} value={mt}>
                    {mt}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                URL del media (mp4 / jpg)
              </span>
              <Input type="url" name="media_url" placeholder="https://..." />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Caption
              </span>
              <Textarea name="caption" rows={5} placeholder="Texto del post..." />
            </label>

            <label className="flex flex-col gap-1">
              <span className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
                Estado
              </span>
              <select
                name="status"
                defaultValue="scheduled"
                className="border border-border bg-background px-3 py-2 text-sm"
              >
                <option value="draft">Borrador</option>
                <option value="scheduled">Programar</option>
              </select>
            </label>

            {error && <p className="text-xs text-destructive">{error}</p>}

            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="mr-2 h-3 w-3 animate-spin" />}
              Guardar
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </div>
  )
}
