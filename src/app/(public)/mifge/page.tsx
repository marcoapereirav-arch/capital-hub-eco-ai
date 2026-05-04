import type { Metadata } from "next"
import FunnelMifgePage from "@/features/public-pages/funnel-mifge/funnel-mifge-page"

const TITLE = "Capital Hub — Tu primer trabajo remoto en menos de 90 días"
const DESCRIPTION =
  "Empieza GRATIS. 14 días sin pagar nada. Cancela cuando quieras. Después 97€/mes si te quedas. Para quien quiere un trabajo remoto de 1.800-2.500€/mes y no sabe por dónde empezar."
const URL_PATH = "/mifge"

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: URL_PATH },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website",
    url: URL_PATH,
    title: TITLE,
    description: DESCRIPTION,
    siteName: "Capital Hub",
    locale: "es_ES",
    images: [
      {
        url: "/mifge/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Capital Hub — empieza GRATIS tu carrera remota en 90 días",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/mifge/opengraph-image"],
  },
}

export default function MifgeRoute() {
  return <FunnelMifgePage />
}
