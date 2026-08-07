'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { disconnectPlatform, syncNow } from '../actions'
import { ConnectForm } from './connect-form'
import type { ApiConnection, PlatformDefinition } from '../types'
import { Link2, Loader2, RefreshCw, Unplug } from 'lucide-react'

interface PlatformCardProps {
  definition: PlatformDefinition
  connection: ApiConnection | null
}

function formatLastSync(iso: string | null): string {
  if (!iso) return 'Nunca'
  const date = new Date(iso)
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Hace instantes'
  if (diffMin < 60) return `Hace ${diffMin}m`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH}h`
  const diffD = Math.floor(diffH / 24)
  return `Hace ${diffD}d`
}

export function PlatformCard({ definition, connection }: PlatformCardProps) {
  const [open, setOpen] = useState(false)
  const [pending, setPending] = useState<'sync' | 'disconnect' | null>(null)
  const status = connection?.status ?? 'disconnected'

  const statusVariant: 'default' | 'secondary' | 'destructive' =
    status === 'connected' ? 'default' : status === 'error' ? 'destructive' : 'secondary'

  const statusLabel =
    status === 'connected' ? 'Conectado' : status === 'error' ? 'Error' : 'Sin conectar'

  async function handleDisconnect() {
    setPending('disconnect')
    const fd = new FormData()
    fd.set('platform', definition.platform)
    await disconnectPlatform(fd)
    setPending(null)
  }

  async function handleSync() {
    setPending('sync')
    const fd = new FormData()
    fd.set('platform', definition.platform)
    await syncNow(fd)
    setPending(null)
  }

  return (
    <>
      <Card>
        {/* flex-wrap: en 375 puntos el nombre de la plataforma y su etiqueta de
            estado no caben en la misma linea, y antes la etiqueta se salia. */}
        <CardHeader className="flex flex-row flex-wrap items-start justify-between gap-2 space-y-0">
          <div className="min-w-0 flex-1 space-y-1">
            <CardTitle className="text-base">{definition.displayName}</CardTitle>
            <p className="text-sm text-muted-foreground">{definition.description}</p>
          </div>
          <Badge variant={statusVariant} className="shrink-0">{statusLabel}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">
            Última sincronización: {formatLastSync(connection?.last_sync_at ?? null)}
          </div>
          {connection?.last_error && (
            <p className="text-sm text-destructive">{connection.last_error}</p>
          )}
          {/* En el telefono los botones ocupan la linea entera (44 puntos de
              alto); en el monitor vuelven a su medida compacta en fila. */}
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            {status === 'connected' ? (
              <>
                <Button variant="secondary" onClick={handleSync} disabled={pending !== null} className="w-full md:w-auto">
                  {pending === 'sync' ? (
                    <Loader2 className="mr-2 size-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 size-4" />
                  )}
                  Sincronizar
                </Button>
                <Button variant="ghost" onClick={handleDisconnect} disabled={pending !== null} className="w-full md:w-auto">
                  <Unplug className="mr-2 size-4" />
                  Desconectar
                </Button>
              </>
            ) : (
              <Button onClick={() => setOpen(true)} className="w-full md:w-auto">
                <Link2 className="mr-2 size-4" />
                Conectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* El lado NO se decide con JavaScript: hoja inferior fija y, a partir de
          md:, las mismas clases la convierten en cajon por la derecha.
          Los cinco `!` son obligatorios: sheet.tsx escribe la colocacion de la
          hoja inferior con `data-[side=bottom]:...`, que Tailwind compila como
          `.clase[data-side=bottom]` (dos partes de especificidad) y le gana a
          cualquier `md:` (una sola). Sin el `!` el cajon salia pegado al borde
          izquierdo y cortado por abajo. */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="bottom"
          className="max-h-[85dvh] w-full overflow-y-auto rounded-t-xl pb-safe-4 md:inset-y-0! md:right-0! md:left-auto! md:h-full! md:max-h-none! md:w-full md:max-w-md md:rounded-t-none md:border-l md:pb-0"
        >
          <div className="mx-auto mt-1 h-1 w-10 rounded-full bg-border md:hidden" />
          <SheetHeader>
            <SheetTitle>Conectar {definition.displayName}</SheetTitle>
            <SheetDescription>
              Introduce tus credenciales. Se guardarán encriptadas en Supabase (RLS por usuario).
            </SheetDescription>
          </SheetHeader>
          <div className="mt-4 px-4 pb-4">
            <ConnectForm definition={definition} onDone={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
