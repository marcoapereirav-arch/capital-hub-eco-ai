import Link from "next/link"
import { ExternalLink, Sparkles, ArrowRight } from "lucide-react"

type LmDeliveryProps = {
  lm: {
    slug: string
    name: string
    description: string | null
    delivery_kind: "static" | "dynamic"
    delivery_asset_url: string | null
    delivery_route: string | null
  }
  tokenForDynamic: string
}

/**
 * Página de entrega genérica del lead magnet.
 *
 * Si delivery_kind = 'static' → CTA principal abre delivery_asset_url (PDF, imagen, etc.)
 *   en pestaña nueva. La página actual queda como landing del recurso con CTA al MIFGE.
 *
 * Si delivery_kind = 'dynamic' → CTA principal lleva a delivery_route?t=<token>
 *   (la ruta dinámica específica del LM, ej. /lm/test-vocacional/quiz). El token se
 *   propaga para que la ruta dinámica también lo valide si lo necesita.
 *
 * Diseño minimalista coherente con el brand kit Capital Hub.
 */

export function LmDelivery({ lm, tokenForDynamic }: LmDeliveryProps) {
  const isStatic = lm.delivery_kind === "static"
  const primaryHref = isStatic
    ? lm.delivery_asset_url ?? "#"
    : `${lm.delivery_route ?? `/lm/${lm.slug}`}?t=${encodeURIComponent(tokenForDynamic)}`

  const primaryTarget = isStatic ? "_blank" : undefined
  const primaryRel = isStatic ? "noopener noreferrer" : undefined

  return (
    <main className="flex min-h-dvh flex-col bg-background px-4 py-10 md:px-6 md:py-16">
      <div className="mx-auto w-full max-w-2xl">
        {/* Hero */}
        <header className="mb-10 text-center md:mb-14">
          <div className="mx-auto mb-5 inline-flex items-center gap-1.5 rounded-full border border-border bg-card/60 px-3 py-1 font-mono text-[10px] uppercase tracking-wide text-muted-foreground">
            <Sparkles className="h-3 w-3" />
            Recurso desbloqueado
          </div>
          <h1 className="font-heading text-3xl font-semibold leading-tight text-foreground md:text-4xl">
            {lm.name}
          </h1>
          {lm.description && (
            <p className="mx-auto mt-4 max-w-lg text-sm leading-relaxed text-muted-foreground md:text-base">
              {lm.description}
            </p>
          )}
        </header>

        {/* CTA principal */}
        <div className="rounded-lg border border-border bg-card p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
            Tu recurso
          </p>
          <h2 className="mt-2 font-heading text-xl font-semibold text-foreground md:text-2xl">
            {lm.name}
          </h2>

          <Link
            href={primaryHref}
            target={primaryTarget}
            rel={primaryRel}
            className="mt-6 inline-flex h-12 w-full items-center justify-center gap-2 rounded-md bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 md:w-auto"
          >
            {isStatic ? (
              <>
                Abrir recurso
                <ExternalLink className="h-4 w-4" />
              </>
            ) : (
              <>
                Empezar
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </Link>
        </div>

        {/* Sección secundaria — CTA al free trial MIFGE */}
        <section className="mt-12 rounded-lg border border-border bg-card/40 p-6 md:p-8">
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/70">
            Lo siguiente
          </p>
          <h3 className="mt-2 font-heading text-lg font-semibold text-foreground">
            ¿Listo para el siguiente paso?
          </h3>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Capital Hub tiene una formación completa con certificación oficial y bolsa de
            trabajo activa. Empieza con 14 días gratis y descubre si encaja contigo.
          </p>
          <Link
            href="/mifge"
            className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md border border-foreground/40 bg-transparent px-5 text-sm font-medium text-foreground transition-colors hover:bg-foreground hover:text-background"
          >
            Ver Capital Hub
            <ArrowRight className="h-4 w-4" />
          </Link>
        </section>

        <footer className="mt-12 text-center">
          <p className="font-mono text-[10px] uppercase tracking-wide text-muted-foreground/50">
            Capital Hub · {lm.slug}
          </p>
        </footer>
      </div>
    </main>
  )
}
