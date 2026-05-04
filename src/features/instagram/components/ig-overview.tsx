import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Heart, MessageCircle, Eye, Film } from 'lucide-react'
import type { IgOverview, IgPost } from '../types'

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
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {title}
        </CardTitle>
        {source && (
          <span className="font-mono text-[9px] text-muted-foreground/60">{source}</span>
        )}
      </CardHeader>
      <CardContent>
        <div className="font-heading text-2xl font-semibold text-foreground">
          {typeof value === 'number' ? fmt(value) : value}
        </div>
        {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
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
      className="group relative block overflow-hidden border border-border bg-muted/30"
    >
      <div className="aspect-square w-full bg-muted/50">
        {post.thumbnail_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={post.thumbnail_url}
            alt={post.caption?.slice(0, 80) ?? ''}
            className="h-full w-full object-cover transition-opacity group-hover:opacity-70"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted-foreground">
            <Film className="h-6 w-6" />
          </div>
        )}
      </div>
      <div className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/60 px-2 py-1 font-mono text-[10px] text-white">
        <span className="flex items-center gap-1">
          <Eye className="h-3 w-3" />
          {fmt(post.views)}
        </span>
        <span className="flex items-center gap-1">
          <Heart className="h-3 w-3" />
          {fmt(post.likes)}
        </span>
        <span className="flex items-center gap-1">
          <MessageCircle className="h-3 w-3" />
          {fmt(post.comments)}
        </span>
      </div>
      {post.is_reel && (
        <Badge
          variant="secondary"
          className="absolute left-1 top-1 font-mono text-[9px]"
        >
          REEL
        </Badge>
      )}
    </a>
  )
}

export function IgOverviewView({ overview }: { overview: IgOverview }) {
  if (!overview.account) {
    return (
      <div className="border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No hay cuenta IG marcada como propia. Ve a Content Intel y marca tu cuenta como{' '}
        <code className="font-mono">is_own=true</code>.
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      {!overview.metaGraphReady && (
        <div className="border border-border bg-muted/20 p-4 text-xs">
          <div className="font-medium text-foreground">
            Métricas básicas vía Apify (scraping)
          </div>
          <p className="mt-1 text-muted-foreground">
            Para impressions, reach, audience demographics, story metrics, trial reels y auto-publicación necesitas conectar
            Meta Graph API. Setup pendiente — ver instrucciones en /integrations.
          </p>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
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
            <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
              Top Performer
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4 md:flex-row">
              <div className="md:w-48 md:flex-shrink-0">
                <div className="aspect-[9/16] overflow-hidden border border-border bg-muted/30">
                  {overview.topReel.thumbnail_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={overview.topReel.thumbnail_url}
                      alt=""
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center">
                      <Film className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>
              </div>
              <div className="flex flex-col gap-3">
                <p className="line-clamp-3 text-sm text-foreground">
                  {overview.topReel.caption ?? '—'}
                </p>
                <div className="flex flex-wrap gap-3 font-mono text-xs">
                  <Stat icon={<Eye className="h-3 w-3" />} value={overview.topReel.views} label="vistas" />
                  <Stat icon={<Heart className="h-3 w-3" />} value={overview.topReel.likes} label="likes" />
                  <Stat icon={<MessageCircle className="h-3 w-3" />} value={overview.topReel.comments} label="comentarios" />
                </div>
                <a
                  href={overview.topReel.url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-2 self-start border border-border bg-foreground px-3 py-1 font-mono text-[11px] uppercase tracking-wide text-background hover:opacity-80"
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
          <CardTitle className="font-heading text-sm font-semibold uppercase tracking-wide text-foreground">
            Posts Recientes
          </CardTitle>
        </CardHeader>
        <CardContent>
          {overview.recentPosts.length === 0 ? (
            <div className="border border-dashed border-border p-6 text-center text-xs text-muted-foreground">
              No hay posts cacheados todavía. Ejecuta sync en Content Intel.
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
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
