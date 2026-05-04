// Layout para el route group (public): paginas servidas SIN sidebar, SIN auth.
// Hereda <html> y <body> + fuentes (next/font) del RootLayout.
//
// Aqui montamos:
// - MetaPixel: solo carga si el user acepta cookies (RGPD)
// - CookieConsent: banner de consentimiento
// (LegalFooter NO va aqui porque /legal/* ya tiene su propio layout — para
//  /mifge/* el footer se monta en cada página o en la propia página /mifge.)

import { MetaPixel } from "@/lib/meta/MetaPixel"
import { CookieConsent } from "@/lib/cookies/CookieConsent"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MetaPixel />
      {children}
      <CookieConsent />
    </>
  )
}
