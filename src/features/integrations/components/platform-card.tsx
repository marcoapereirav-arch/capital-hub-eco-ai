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
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <div className="space-y-1">
            <CardTitle className="text-base">{definition.displayName}</CardTitle>
            <p className="text-xs text-muted-foreground">{definition.description}</p>
          </div>
          <Badge variant={statusVariant}>{statusLabel}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-xs text-muted-foreground">
            Última sincronización: {formatLastSync(connection?.last_sync_at ?? null)}
          </div>
          {connection?.last_error && (
            <p className="text-xs text-destructive">{connection.last_error}</p>
          )}
          <div className="flex items-center gap-2">
            {status === 'connected' ? (
              <>
                <Button size="sm" variant="secondary" onClick={handleSync} disabled={pending !== null}>
                  {pending === 'sync' ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="mr-2 h-4 w-4" />
                  )}
                  Sincronizar
                </Button>
                <Button size="sm" variant="ghost" onClick={handleDisconnect} disabled={pending !== null}>
                  <Unplug className="mr-2 h-4 w-4" />
                  Desconectar
                </Button>
              </>
            ) : (
              <Button size="sm" onClick={() => setOpen(true)}>
                <Link2 className="mr-2 h-4 w-4" />
                Conectar
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent>
          <SheetHeader>
            <SheetTitle>Conectar {definition.displayName}</SheetTitle>
            <SheetDescription>
              Introduce tus credenciales. Se guardarán encriptadas en Supabase (RLS por usuario).
            </SheetDescription>
          </SheetHeader>
          <div className="mt-6 px-4">
            <ConnectForm definition={definition} onDone={() => setOpen(false)} />
          </div>
        </SheetContent>
      </Sheet>
    </>
  )
}
