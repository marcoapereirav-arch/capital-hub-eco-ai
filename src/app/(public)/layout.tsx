// Layout para el route group (public): paginas servidas SIN sidebar, SIN auth.
// Hereda <html> y <body> + fuentes (next/font) del RootLayout.
// MetaPixel se monta aqui para que cubra todas las paginas publicas (/mifge/*).

import { MetaPixel } from "@/lib/meta/MetaPixel"

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <>
      <MetaPixel />
      {children}
    </>
  )
}
