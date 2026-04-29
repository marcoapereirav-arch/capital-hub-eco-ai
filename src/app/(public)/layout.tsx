// Layout para el route group (public): paginas servidas SIN sidebar, SIN auth.
// Hereda <html> y <body> + fuentes (next/font) del RootLayout.

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
