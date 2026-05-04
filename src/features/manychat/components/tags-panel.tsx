import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import type { ManychatTag, ManychatCustomField } from '../types'

interface TagsPanelProps {
  tags: ManychatTag[]
  customFields: ManychatCustomField[]
}

export function TagsPanel({ tags, customFields }: TagsPanelProps) {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
            Tags ({tags.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Etiquetas definidas en tu cuenta de ManyChat.
          </p>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <Empty message="Aún no hay tags. Créalos en ManyChat → Settings → Tags." />
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <Badge key={t.id} variant="secondary" className="font-mono text-[11px]">
                  {t.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
            Custom Fields ({customFields.length})
          </CardTitle>
          <p className="text-xs text-muted-foreground">
            Campos personalizados para guardar datos por suscriptor.
          </p>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <Empty message="Aún no hay custom fields. Créalos en ManyChat → Settings → Custom Fields." />
          ) : (
            <ul className="flex flex-col gap-2">
              {customFields.map(f => (
                <li
                  key={f.id}
                  className="flex items-center justify-between border border-border bg-muted/20 px-3 py-2"
                >
                  <div className="flex flex-col">
                    <span className="text-sm text-foreground">{f.name}</span>
                    {f.description && (
                      <span className="text-[10px] text-muted-foreground">{f.description}</span>
                    )}
                  </div>
                  <Badge variant="secondary" className="font-mono text-[10px]">
                    {f.type ?? 'text'}
                  </Badge>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Empty({ message }: { message: string }) {
  return (
    <div className="border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
      {message}
    </div>
  )
}
