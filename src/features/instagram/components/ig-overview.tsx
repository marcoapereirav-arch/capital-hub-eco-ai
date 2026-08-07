import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Eye, Film } from 'lucide-react'
import { IgThumb } from './ig-thumb'
import type { IgOverview, IgPost, IgDemographicsSnapshot } from '../types'

function fmt(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`
  if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`
  return new Intl.NumberFormat('es-ES').format(n)
}

function fmtPct(n: number): string {
  return `${(n * 100).toFixed(2)}%`
}

function KpiCard({
  title,
  value,
  hint,
  source,
}: {
  title: string
  value: string | number
  hint?: string
  source?: string
}) {
  return (
    <Card className="border-border">
      <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-1 pb-2">
        <CardTitle className="min-w-0 flex-1 truncate text-sm font-semibold text-muted-foreground">
          {title}
        </CardTitle>
        {source && (
          <span className="shrink-0 text-sm text-muted-foreground">{source}</span>
        )}
      </CardHeader>
      <CardContent>
        {/* tabular-nums alinea las cifras en columna sin recurrir a la fuente
            de maquina de escribir, que ya no es de la marca. */}
        <div className="font-heading text-2xl font-semibold tabular-nums text-foreground">
          {typeof value === 'number' ? fmt(value) : value}
        </div>
        {hint && <p className="mt-1 text-sm text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function PostThumb({ post }: { post: IgPost }) {
  return (
    <a
      href={post.url}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-lg border border-border bg-muted/30"
    >
      <div className="aspect-square w-full bg-muted/30">
        {post.thumbnail_url ? (
          <IgThumb
            src={post.thumbnail_url}
            mediaId={post.external_id}
            alt={post.caption?.slice(0, 80) ?? ''}
            className="transition-opacity md:group-hover:opacity-70"
          />
        ) : post.external_id ? (
          // Sin thumbnail_url pero con external_id → usar proxy directo
          <IgThumb
            src={`/api/instagram/thumbnail/${post.external_id}`}
            mediaId={post.external_id}
            alt={post.caption?.slice(0, 80) ?? ''}
            className="transition-opacity md:group-hover:opacity-70"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Film className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex flex-wrap items-center justify-between gap-x-2 bg-background/80 px-2 py-1 text-sm tabular-nums text-foreground">
        <span className="flex items-center gap-1">
          <Eye className="h-3.5 w-3.5" />
          {fmt(post.views)}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3.5 w-3.5" />
          {fmt(post.likes)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3.5 w-3.5" />
          {fmt(post.comments)}
        </span>
      </div>
      {post.is_reel && (
        <Badge variant="secondary" className="absolute top-1 left-1 h-auto py-0.5 text-sm">
          REEL
        </Badge>
      )}
    </a>
  )
}

export function IgOverviewView({ overview }: { overview: IgOverview }) {
  if (!overview.account) {
    return (
      <div className="flex min-h-[200px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-10 text-center">
        <h3 className="text-[17px] font-semibold text-foreground">Sin cuenta de Instagram propia</h3>
        <p className="max-w-[38ch] text-[15px] text-muted-foreground">
          No hay cuenta IG marcada como propia. Ve a Content Intel y marca tu cuenta como{' '}
          <code>is_own=true</code>.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {!overview.metaGraphReady && (
        <div className="rounded-lg border border-border bg-muted/20 p-4">
          <div className="text-[15px] font-medium text-foreground">
            Métricas básicas vía Apify (scraping)
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Para impressions, reach, audience demographics, story metrics, trial reels y auto-publicación necesitas conectar
            Meta Graph API. Setup pendiente — ver instrucciones en /integrations.
          </p>
        </div>
      )}

      {overview.metaGraphReady && overview.live && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
              Snapshot en vivo (últimos 30 días)
            </CardTitle>
            <p className="text-sm text-muted-foreground">
              Datos directos de Meta Graph API. Se actualizan en cada carga.
            </p>
          </CardHeader>
          <CardContent>
            {/* Dos columnas en telefono, que es lo maximo que cabe en 375 puntos */}
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 md:gap-4 lg:grid-cols-5">
              {overview.live.followerCount !== null && (
                <KpiCard
                  title="Seguidores"
                  value={overview.live.followerCount}
                  source="meta-graph"
                />
              )}
              <KpiCard title="Reach 30d" value={overview.live.reach30d} source="meta-graph" />
              <KpiCard title="Vistas 30d" value={overview.live.views30d} source="meta-graph" />
              <KpiCard
                title="Visitas Perfil 30d"
                value={overview.live.profileViews30d}
                source="meta-graph"
              />
              <KpiCard
                title="Cuentas Activadas 30d"
                value={overview.live.accountsEngaged30d}
                source="meta-graph"
              />
              <KpiCard
                title="Interacciones 30d"
                value={overview.live.totalInteractions30d}
                source="meta-graph"
              />
              <KpiCard title="Likes 30d" value={overview.live.likes30d} source="meta-graph" />
              <KpiCard
                title="Comentarios 30d"
                value={overview.live.comments30d}
                source="meta-graph"
              />
              <KpiCard title="Shares 30d" value={overview.live.shares30d} source="meta-graph" />
              <KpiCard title="Guardados 30d" value={overview.live.saves30d} source="meta-graph" />
            </div>
          </CardContent>
        </Card>
      )}

      {overview.metaGraphReady && overview.demographics && (
        <DemographicsPanel demographics={overview.demographics} />
      )}

      <div className="grid grid-cols-2 gap-3 md:grid-cols-2 md:gap-4 lg:grid-cols-4">
        <KpiCard title="Posts Totales" value={overview.totalPosts} source="apify" />
        <KpiCard title="Reels" value={overview.totalReels} source="apify" />
        <KpiCard title="Posts 30d" value={overview.posts30d} source="apify" />
        <KpiCard title="Posts 7d" value={overview.posts7d} source="apify" />
        <KpiCard title="Vistas Totales" value={overview.totalViews} source="apify" />
        <KpiCard title="Likes Totales" value={overview.totalLikes} source="apify" />
        <KpiCard title="Comentarios" value={overview.totalComments} source="apify" />
        <KpiCard
          title="Engagement Promedio"
          value={fmtPct(overview.avgEngagement)}
          source="apify"
        />
      </div>

      {overview.topReel && (
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="w-full md:w-48 md:shrink-0">
                <div className="aspect-[9/16] max-h-[60dvh] overflow-hidden rounded-lg border border-border bg-muted/30 md:max-h-none">
                  {overview.topReel.thumbnail_url ? (
                    <IgThumb
                      src={overview.topReel.thumbnail_url}
                      mediaId={overview.topReel.external_id}
                      fallbackText="Sin thumbnail"
                    />
                  ) : overview.topReel.external_id ? (
                    <IgThumb
                      src={`/api/instagram/thumbnail/${overview.topReel.external_id}`}
                      mediaId={overview.topReel.external_id}
                      fallbackText="Sin thumbnail"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex min-w-0 flex-col gap-3">
                <p className="line-clamp-3 text-[15px] text-foreground">
                  {overview.topReel.caption ?? '—'}
                </p>
                <div className="flex flex-wrap gap-x-3 gap-y-1 text-sm tabular-nums">
                  <Stat icon={<Eye className="h-3.5 w-3.5" />} value={overview.topReel.views} label="vistas" />
                  <Stat icon={<Heart className="h-3.5 w-3.5" />} value={overview.topReel.likes} label="likes" />
                  <Stat icon={<MessageCircle className="h-3.5 w-3.5" />} value={overview.topReel.comments} label="comentarios" />
                </div>
                <a
                  href={overview.topReel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 items-center justify-center gap-2 self-stretch rounded-lg bg-primary px-4 text-[15px] font-semibold text-primary-foreground active:opacity-90 md:h-8 md:self-start md:text-sm"
                >
                  Ver en Instagram
                </a>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card className="border-border">
        <CardHeader>
          <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
            Posts Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overview.recentPosts.length === 0 ? (
            <div className="flex min-h-[160px] flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-6 py-8 text-center">
              <h3 className="text-[17px] font-semibold text-foreground">Todavía no hay posts</h3>
              <p className="max-w-[38ch] text-[15px] text-muted-foreground">
                No hay posts cacheados todavía. Ejecuta sync en Content Intel.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 md:grid-cols-4 lg:grid-cols-6">
              {overview.recentPosts.map(p => (
                <PostThumb key={p.id} post={p} />
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

function Stat({ icon, value, label }: { icon: React.ReactNode; value: number; label: string }) {
  return (
    <span className="flex items-center gap-1 text-foreground">
      {icon}
      {fmt(value)} {label}
    </span>
  )
}

function DemographicsPanel({ demographics }: { demographics: IgDemographicsSnapshot }) {
  const blocks: Array<{ title: string; items: Array<{ key: string; value: number }> }> = [
    { title: 'Países', items: demographics.byCountry },
    { title: 'Ciudades', items: demographics.byCity },
    { title: 'Edad', items: demographics.byAge },
    { title: 'Género', items: demographics.byGender },
  ].filter((b) => b.items.length > 0)

  if (blocks.length === 0) return null

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="font-heading text-[15px] font-semibold text-foreground">
          Audiencia (este mes)
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Demografía de tus seguidores. Datos directos de Meta.
        </p>
      </CardHeader>
      <CardContent>
        {/* Una columna en telefono: cuatro barras horizontales apiladas se leen,
            cuatro columnas de 90 puntos no. */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          {blocks.map((block) => {
            const max = Math.max(1, ...block.items.map((i) => i.value))
            return (
              <div key={block.title}>
                <div className="mb-2 text-sm font-semibold text-muted-foreground">
                  {block.title}
                </div>
                <ul className="flex flex-col gap-2">
                  {block.items.slice(0, 6).map((item) => (
                    <li key={item.key} className="flex items-center gap-2 text-sm">
                      <span className="w-20 shrink-0 truncate text-foreground">{item.key}</span>
                      <div className="flex h-1.5 min-w-0 flex-1 items-center rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-primary"
                          style={{ width: `${(item.value / max) * 100}%` }}
                        />
                      </div>
                      <span className="w-12 shrink-0 text-right tabular-nums text-muted-foreground">
                        {fmt(item.value)}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
