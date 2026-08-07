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
          <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
            Tags ({tags.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Etiquetas definidas en tu cuenta de ManyChat.
          </p>
        </CardHeader>
        <CardContent>
          {tags.length === 0 ? (
            <Empty
              title="Todavía no hay tags"
              message="Aún no hay tags. Créalos en ManyChat → Settings → Tags."
            />
          ) : (
            <div className="flex flex-wrap gap-2">
              {tags.map(t => (
                <Badge key={t.id} variant="secondary" className="h-auto py-0.5 text-sm">
                  {t.name}
                </Badge>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
            Custom Fields ({customFields.length})
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Campos personalizados para guardar datos por suscriptor.
          </p>
        </CardHeader>
        <CardContent>
          {customFields.length === 0 ? (
            <Empty
              title="Todavía no hay custom fields"
              message="Aún no hay custom fields. Créalos en ManyChat → Settings → Custom Fields."
            />
          ) : (
            <ul className="flex flex-col gap-2">
              {customFields.map(f => (
                <li
                  key={f.id}
                  className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border bg-muted/20 px-3 py-2"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-[15px] text-foreground">{f.name}</span>
                    {f.description && (
                      <span className="text-sm text-muted-foreground">{f.description}</span>
                    )}
                  </div>
                  <Badge variant="secondary" className="h-auto shrink-0 py-0.5 text-sm">
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

function Empty({ title, message }: { title: string; message: string }) {
  return (
    <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-8 text-center">
      <h3 className="text-[17px] font-semibold text-foreground">{title}</h3>
      <p className="max-w-[38ch] text-[15px] text-muted-foreground">{message}</p>
    </div>
  )
}
